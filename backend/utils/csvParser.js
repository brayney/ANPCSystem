// Simple CSV parser utility
exports.parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV must have header and at least one data row');

  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.every(v => v === '')) continue; // Skip empty rows

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
};

// Convert empty strings to undefined for optional fields
exports.cleanRow = (row) => {
  const cleaned = {};
  Object.keys(row).forEach(key => {
    cleaned[key] = row[key] === '' ? undefined : row[key];
  });
  return cleaned;
};
