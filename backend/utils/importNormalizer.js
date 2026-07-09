const normalizeText = value => String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, ' ');

const normalizeByMap = (value, map) => {
  if (value === undefined || value === null || String(value).trim() === '') return undefined;
  const normalized = normalizeText(value);
  return map[normalized] || String(value).trim();
};

const normalizeImportRow = (row, options = {}) => {
  const cleaned = {};

  Object.entries(row || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const trimmed = typeof value === 'string' ? value.trim() : value;
    if (trimmed === '') return;
    cleaned[key] = trimmed;
  });

  if (options.statusMap && cleaned.status !== undefined) {
    cleaned.status = normalizeByMap(cleaned.status, options.statusMap);
  }

  if (options.conditionMap && cleaned.condition !== undefined) {
    cleaned.condition = normalizeByMap(cleaned.condition, options.conditionMap);
  }

  return { ...(options.defaults || {}), ...cleaned };
};

const firstFilled = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
};

const equipmentStatusMap = {
  available: 'Available',
  allocated: 'Allocated',
  'in use': 'In Use',
  use: 'In Use',
  used: 'In Use',
  standby: 'Standby',
  'on hire': 'On Hire',
  hired: 'On Hire',
  reserved: 'Reserved',
  'under maintenance': 'Under Maintenance',
  maintenance: 'Under Maintenance',
  repair: 'Under Maintenance',
  'out of yard': 'Out of Yard',
  out: 'Out of Yard',
};

const okUpperConditionMap = {
  ok: 'OK',
  okay: 'OK',
  good: 'OK',
  'not ok': 'NOT OK',
  bad: 'NOT OK',
  'for repair': 'For Repair',
  repair: 'For Repair',
  unknown: 'Unknown',
};

const okTitleConditionMap = {
  ...okUpperConditionMap,
  ok: 'Ok',
  okay: 'Ok',
  good: 'Ok',
};

module.exports = {
  equipmentStatusMap,
  firstFilled,
  normalizeImportRow,
  okTitleConditionMap,
  okUpperConditionMap,
};
