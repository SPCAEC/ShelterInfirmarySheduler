/**
 * SPCA Shelter-Side Clinic Scheduling — RPC Endpoints
 * ---------------------------------------------------
 * Public-facing backend functions called via google.script.run.
 *
 * Responsibilities:
 *  • Receive structured payloads from the frontend
 *  • Normalize and append appointment data
 *  • Manage vet-record upload, reminder, and request emails
 *  • Provide vaccine and service lists from Script Properties
 *
 * Differences from Grant Scheduler:
 *  • No slot lookup or ID matching — append-only workflow
 *  • Appointment Status → "Reserved"
 *  • Needs Scheduling   → "Yes"
 *  • Uses Workspace sender: nathanh@yourspcaoutreach.org
 */

/* ========================================================================== */
/* 1. Payload Normalization                                                   */
/* ========================================================================== */

/**
 * Ensures required defaults for certain fields
 * so the sheet never receives undefined or blank values.
 */
function normalizePayload_(payload) {
  const out = Object.assign({}, payload);

  const defaults = {
    'Allergies or Sensitivities': 'None known',
    'Previous Vet Records': 'No',
    'Transportation Needed': 'No'
  };

  Object.entries(defaults).forEach(([key, val]) => {
    if (!out[key] || String(out[key]).trim() === '') out[key] = val;
  });

  Object.keys(out).forEach(k => {
    if (out[k] == null) out[k] = '';
  });

  return out;
}

/* ========================================================================== */
/* 2. Appointment Submission                                                  */
/* ========================================================================== */

/**
 * Appends a new Shelter-Side appointment.
 * Called by frontend via:
 *   google.script.run.withSuccessHandler(...).apiSubmitShelterAppointment(payload)
 */
function apiSubmitShelterAppointment(payload) {
  try {
    if (!payload) throw new Error('No payload received.');
    if (!payload.firstName || !payload.lastName)
      throw new Error('Missing client name.');
    if (!payload.date)
      throw new Error('Missing appointment date.');

    const clean = normalizePayload_(payload);
    appendAppointmentRow_(clean);

    Logger.log(
      `✅ apiSubmitShelterAppointment(): Added ${clean.firstName} ${clean.lastName} for ${clean.date}`
    );

    return { ok: true, message: 'Appointment added successfully.' };
  } catch (err) {
    Logger.log(`❌ apiSubmitShelterAppointment() failed: ${err.message || err}`);
    return { ok: false, error: err.message || String(err) };
  }
}

/* ========================================================================== */
/* 3. Vet-Record Folder & Upload Handling                                     */
/* ========================================================================== */

/**
 * Creates or reuses a Drive folder for veterinary records.
 * Gives Outreach Team + (optional) client edit access.
 */
function apiCreateVetRecordsFolder(firstName, lastName, petName, clientEmail) {
  try {
    const PARENT_ID = '1KMbIfS0Y5q1y7BDbLUj84U3snfXDNPUC'; // central Vet Records root
    const parent = DriveApp.getFolderById(PARENT_ID);
    const folderName = `${lastName}_${firstName}_${petName}`.replace(/[^\w\s-]/g, '_');

    let folder;
    const existing = parent.getFoldersByName(folderName);
    folder = existing.hasNext() ? existing.next() : parent.createFolder(folderName);

    try {
      folder.addEditor('nathanh@yourspcaoutreach.org');
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDITOR);
      if (clientEmail) folder.addEditor(clientEmail);
    } catch (permErr) {
      Logger.log(`apiCreateVetRecordsFolder() permission warning: ${permErr.message}`);
    }

    Logger.log(`Vet folder ready: ${folderName}`);
    return { ok: true, folderId: folder.getId(), url: folder.getUrl() };
  } catch (err) {
    Logger.log(`apiCreateVetRecordsFolder() ERROR: ${err.message || err}`);
    return { ok: false, error: err.message };
  }
}

/**
 * Uploads a base64 file to a given Drive folder.
 */
function apiUploadVetRecord(filename, base64Data, folderId) {
  try {
    if (!folderId) throw new Error('Missing folderId');
    if (!filename || !base64Data) throw new Error('Missing file data');

    const folder = DriveApp.getFolderById(folderId);
    const bytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(bytes, undefined, filename);
    blob.setContentTypeFromExtension();
    folder.createFile(blob);

    Logger.log(`apiUploadVetRecord(): ${filename} uploaded to folder ${folderId}`);
    return { ok: true };
  } catch (err) {
    Logger.log(`apiUploadVetRecord() ERROR: ${err.message || err}`);
    return { ok: false, error: err.message };
  }
}

/* ========================================================================== */
/* 4. Email Helpers                                                           */
/* ========================================================================== */

/**
 * Sends a reminder to scheduler to upload vet records later.
 * Looks up recipient email by Script Property (EMAIL_NAME).
 */
function apiSendVetRecordReminder(schedulerName, petName, appointmentCard) {
  try {
    if (!schedulerName) throw new Error('Missing schedulerName');
    if (!petName) throw new Error('Missing petName');

    const props = PropertiesService.getScriptProperties();
    const propKey = `EMAIL_${schedulerName.toUpperCase().replace(/\s+/g, '_')}`;
    const recipient = props.getProperty(propKey);
    if (!recipient) throw new Error(`Script property not found: ${propKey}`);

    const uploadLink =
      'https://script.google.com/macros/s/AKfycbxb1_Oha9qhWnaOMeUuFHSSEe5E7IoCPG2JPdkCn4Jmju-2VYiQzOobecO9DwKcC_pf/exec';

    const subject = `Reminder – Upload Records for ${petName}`;
    const body = `
Hi ${schedulerName},

Your friendly PHP System here reminding you to upload or provide records for ${petName} before their upcoming Shelter-Side appointment.

Appointment details:
${appointmentCard}

You can upload records here:
${uploadLink}

— SPCA Outreach Team
`;

    MailApp.sendEmail({
      to: recipient,
      from: 'nathanh@yourspcaoutreach.org',
      name: 'SPCA Outreach Team',
      subject,
      body
    });

    Logger.log(`apiSendVetRecordReminder(): sent to ${recipient}`);
    return { ok: true };
  } catch (err) {
    Logger.log(`apiSendVetRecordReminder() ERROR: ${err.message || err}`);
    return { ok: false, error: err.message };
  }
}

/**
 * Sends vet-record upload email to the client using the
 * central Vet Records Uploader app.
 */
function apiSendVetRecordsRequest(clientEmail, folderUrl, firstName, petName) {
  try {
    if (!clientEmail) throw new Error('Missing client email');

    const props = PropertiesService.getScriptProperties();
    const uploadLink = props.getProperty('RECORD_UPLOAD_LINK');
    if (!uploadLink) throw new Error('Missing Script Property: RECORD_UPLOAD_LINK');

    const subject = `Upload Veterinary Records for ${petName}`;
    const body = `
Hello ${firstName},

You can securely upload your previous veterinary records for ${petName} using the link below:

${uploadLink}

Please ensure that you include all relevant pages or photos. 
Your records will be kept secure and used only for your pet’s care.

If you have any questions, please reply to this email or contact the SPCA Outreach Team.

— SPCA Serving Erie County Outreach Team
`;

    MailApp.sendEmail({
      to: clientEmail,
      from: 'nathanh@yourspcaoutreach.org',
      name: 'SPCA Outreach Team',
      subject,
      body
    });

    Logger.log(`apiSendVetRecordsRequest(): email sent to ${clientEmail} for ${petName}`);
    return { ok: true };
  } catch (err) {
    Logger.log(`apiSendVetRecordsRequest() ERROR: ${err.message || err}`);
    return { ok: false, error: err.message };
  }
}

/* ========================================================================== */
/* 5. Reference Lists                                                         */
/* ========================================================================== */

/**
 * Returns vaccine lists from Script Properties.
 */
function apiGetVaccineLists() {
  try {
    const props = PropertiesService.getScriptProperties();
    const canine = (props.getProperty('VACCINE_LIST_CANINE') || '')
      .split(',').map(s => s.trim()).filter(Boolean);
    const feline = (props.getProperty('VACCINE_LIST_FELINE') || '')
      .split(',').map(s => s.trim()).filter(Boolean);
    return { ok: true, canine, feline };
  } catch (err) {
    Logger.log(`apiGetVaccineLists() ERROR: ${err.message || err}`);
    return { ok: false, error: err.message };
  }
}

/**
 * Returns additional services list from Script Properties.
 */
function apiGetAdditionalServices() {
  try {
    const props = PropertiesService.getScriptProperties();
    const list = (props.getProperty('ADDITIONAL_SERVICES') || '')
      .split(',').map(s => s.trim()).filter(Boolean);
    return { ok: true, services: list };
  } catch (err) {
    Logger.log(`apiGetAdditionalServices() ERROR: ${err.message || err}`);
    return { ok: false, error: err.message };
  }
}