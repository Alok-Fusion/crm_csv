/**
 * Validate a record — must have at least an email or mobile number to be valid.
 */
function isValidRecord(record) {
  const hasEmail = record.email && record.email.trim().length > 0;
  const hasMobile = record.mobile_without_country_code && record.mobile_without_country_code.trim().length > 0;
  return hasEmail || hasMobile;
}

/**
 * Validate the created_at field — must be parseable by new Date().
 */
function isValidDate(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Allowed CRM status values
 */
const ALLOWED_CRM_STATUSES = [
  'GOOD_LEAD_FOLLOW_UP',
  'DID_NOT_CONNECT',
  'BAD_LEAD',
  'SALE_DONE',
];

/**
 * Allowed data source values
 */
const ALLOWED_DATA_SOURCES = [
  'leads_on_demand',
  'migration_tower',
  'bird_eye',
  'varol_priority',
  'kanpur_sale',
];

/**
 * CRM field definitions for reference
 */
const CRM_FIELDS = [
  'created_at',
  'name',
  'email',
  'country_code',
  'mobile_without_country_code',
  'company',
  'city',
  'state',
  'country',
  'lead_owner',
  'crm_status',
  'crm_note',
  'data_source',
  'possession_time',
  'description',
];

module.exports = {
  isValidRecord,
  isValidDate,
  ALLOWED_CRM_STATUSES,
  ALLOWED_DATA_SOURCES,
  CRM_FIELDS,
};
