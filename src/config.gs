/**
 * SPCA Shelter-Side Clinic Scheduling — Configuration
 * ---------------------------------------------------
 * Central mapping for sheet ID, name, and column headers.
 * 
 * Notes:
 *  • This app writes directly to the next available row (append-only).
 *  • Appointment Type defaults to "Surgery".
 *  • All columns listed here must match the Sheet headers exactly.
 */

const CFG = {
  // ─── Google Sheet Info ─────────────────────────────
  SHEET_ID: '1PAjA1uGAyjCuaE5lv1P0erDtYKsX7wsbXOMHk4bhHg8',
  SHEET_NAME: 'Sheet1', // must match tab name exactly

  // ─── Column Header Mappings ─────────────────────────
  COLS: {
    TYPE: 'Appointment Type',
    ID: 'Appointment ID',
    STATUS: 'Appointment Status',
    NEEDS_SCHED: 'Needs Scheduling',
    DAY: 'Day of Week',
    DATE: 'Date',
    TIME: 'Time',
    FIRST: 'First Name',
    LAST: 'Last Name',
    ADDRESS: 'Address',
    CITY: 'City',
    STATE: 'State',
    ZIP: 'Zip Code',
    PHONE: 'Phone Number',
    EMAIL: 'Email',
    PET_NAME: 'Pet Name',
    SPECIES: 'Species',
    BREED_ONE: 'Breed One',
    BREED_TWO: 'Breed Two',
    SEX: 'Sex',
    COLOR: 'Color',
    COLOR_PATTERN: 'Color Pattern',
    AGE: 'Age',
    WEIGHT: 'Weight',
    SPAYED: 'Spayed or Neutered',
    PREV_RECORDS: 'Previous Vet Records',
    VET_OFFICE: 'Vet Office Name',
    ALLERGIES: 'Allergies or Sensitivities',
    VACCINES: 'Vaccines Needed',
    ADDITIONAL_SERVICES: 'Additional Services',
    NOTES: 'Notes',
    TRANSPORT: 'Transportation Needed',
    SCHEDULED_BY: 'Scheduled By'
  }
};