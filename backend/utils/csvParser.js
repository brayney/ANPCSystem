// Simple CSV parser utility
exports.parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  
  // Skip comment lines (starting with #) to find the actual header
  let headerLineIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim().startsWith('#')) {
      headerLineIndex = i;
      break;
    }
  }

  if (headerLineIndex >= lines.length - 1) {
    throw new Error('CSV must have header and at least one data row');
  }

  const headers = lines[headerLineIndex].split(',').map(h => h.trim());
  const rows = [];

  for (let i = headerLineIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#') || line === '') continue; // Skip comment lines and empty rows

    const values = line.split(',').map(v => v.trim());
    if (values.every(v => v === '')) continue; // Skip completely empty rows

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  if (rows.length === 0) {
    throw new Error('No data rows found in CSV file');
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
