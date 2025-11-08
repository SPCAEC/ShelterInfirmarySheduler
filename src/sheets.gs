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
function appendAppointmentRow_(payload) {
  try {
    const sh = getSheet_();
    const { headers } = getHeaderMap_(sh);

    const row = headers.map(h => {
      const key = h.toLowerCase();
      const col = Object.entries(CFG.COLS)
        .find(([_, label]) => label.toLowerCase() === key);
      const prop = col ? col[0] : null;

      switch (prop) {
        case 'TYPE':          return 'Surgery';
        case 'STATUS':        return 'Reserved';          // <-- updated
        case 'NEEDS_SCHED':   return 'Yes';               // <-- added
        case 'DAY':           return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'EEEE');
        case 'DATE':          return payload.date || '';
        case 'SCHEDULED_BY':  return Session.getActiveUser().getEmail() || '';
        default:              return payload[prop?.toLowerCase()] || payload[h] || '';
      }
    });

    sh.appendRow(row);

    Logger.log(
      `✅ appendAppointmentRow_: Added "${payload.firstName || ''} ${payload.lastName || ''}" for ${payload.date || 'unknown date'}`
    );
    return true;

  } catch (err) {
    Logger.log(`❌ appendAppointmentRow_ failed: ${err.message || err}`);
    throw err;
  }
}