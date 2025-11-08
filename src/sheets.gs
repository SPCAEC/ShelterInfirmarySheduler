/**
 * SPCA Shelter-Side Clinic Scheduling — Sheet Helpers
 * ---------------------------------------------------
 * Simplified utilities for reading and writing appointment data.
 * 
 * Notes:
 *  • This app appends new surgery appointments only.
 *  • No slot lookup, updates, or grant logic is needed.
 *  • Each new appointment is marked:
 *      - Appointment Status → "Reserved"
 *      - Needs Scheduling   → "Yes"
 */

/**
 * Get the Shelter-Side sheet safely.
 */
function getSheet_() {
  try {
    const ss = SpreadsheetApp.openById(CFG.SHEET_ID);
    const sh = ss.getSheetByName(CFG.SHEET_NAME);
    if (!sh) throw new Error(`Sheet "${CFG.SHEET_NAME}" not found.`);
    return sh;
  } catch (err) {
    Logger.log(`❌ getSheet_ failed: ${err.message || err}`);
    throw err;
  }
}

/**
 * Return header array and lowercase → index map.
 */
function getHeaderMap_(sh) {
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn())
    .getValues()[0]
    .map(h => String(h).trim());
  const map = {};
  headers.forEach((h, i) => map[h.toLowerCase()] = i);
  return { headers, map };
}

/**
 * Append a new appointment row using the payload from the frontend.
 * Fills only known columns from CFG.COLS; others left blank.
 */
/**
 * Append a new appointment row using the payload from the frontend.
 * Fills all known columns from CFG.COLS.
 */
function appendAppointmentRow_(payload) {
  const sh = getSheet_();
  const { headers } = getHeaderMap_(sh);

  const row = headers.map(h => {
    switch (h) {
      case CFG.COLS.TYPE:              return 'Surgery';
      case CFG.COLS.STATUS:            return 'Reserved';
      case CFG.COLS.NEEDS_SCHED:       return 'Yes';
      case CFG.COLS.DAY:               return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'EEEE');
      case CFG.COLS.DATE:              return payload.date || '';
      case CFG.COLS.TIME:              return payload.time || ''; // optional future use
      case CFG.COLS.FIRST:             return payload.firstName || '';
      case CFG.COLS.LAST:              return payload.lastName || '';
      case CFG.COLS.ADDRESS:           return payload.address || '';
      case CFG.COLS.CITY:              return payload.city || '';
      case CFG.COLS.STATE:             return payload.state || '';
      case CFG.COLS.ZIP:               return payload.zipCode || '';
      case CFG.COLS.PHONE:             return payload.phoneNumber || '';
      case CFG.COLS.EMAIL:             return payload.email || '';
      case CFG.COLS.PET_NAME:          return payload.petName || '';
      case CFG.COLS.SPECIES:           return payload.species || '';
      case CFG.COLS.BREED_ONE:         return payload.breedOne || '';
      case CFG.COLS.BREED_TWO:         return payload.breedTwo || '';
      case CFG.COLS.COLOR:             return payload.color || '';
      case CFG.COLS.COLOR_PATTERN:     return payload.colorPattern || '';
      case CFG.COLS.SEX:               return payload.sex || '';
      case CFG.COLS.AGE:               return payload.age || '';
      case CFG.COLS.WEIGHT:            return payload.weight || '';
      case CFG.COLS.ALTERED:           return payload.spayed || '';
      case CFG.COLS.VET_OFFICE:        return payload.vetOffice || '';
      case CFG.COLS.PREV_RECORDS:      return payload.previousVetRecords || 'No';
      case CFG.COLS.ALLERGIES:         return payload.allergies || '';
      case CFG.COLS.VACCINES:          return payload.vaccinesNeeded || '';
      case CFG.COLS.ADDITIONAL_SERVICES:return payload.additionalServices || '';
      case CFG.COLS.TRANSPORT:         return payload.transportationNeeded || 'No';
      case CFG.COLS.NOTES:             return payload.notes || '';
      case CFG.COLS.SCHEDULED_BY:      return Session.getActiveUser().getEmail() || '';
      default:                         return '';
    }
  });

  sh.appendRow(row);
  Logger.log(`✅ appendAppointmentRow_: added "${payload.firstName} ${payload.lastName}"`);
  return true;
}