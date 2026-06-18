const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { parseCSV } = require('./csvParser');

const KNOWN_HEADERS = new Set([
  'equipmentNo',
  'craneModel',
  'yearModel',
  'capacity',
  'weightKg',
  'supervisor',
  'client',
  'status',
  'condition',
  'itemName',
  'serialNo',
  'assignedCrane',
  'location',
  'boomCode',
  'length',
  'hookSerialNo',
  'ropeDia',
]);

const isEmptyRow = (row) => {
  if (!row || row.length === 0) return true;
  // Check if all values are empty or whitespace
  return row.every(value => {
    const strValue = String(value || '').trim();
    return strValue === '' || strValue === 'undefined' || strValue === 'null';
  });
};

const findHeaderRowIndex = rows => rows.findIndex(row =>
  row.some(value => KNOWN_HEADERS.has(String(value || '').trim()))
);

const parseXLSX = (filePath) => {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });
  
  console.log(`📊 XLSX: Total rows in file: ${rows.length}`);
  
  const headerRowIndex = findHeaderRowIndex(rows);

  if (headerRowIndex === -1) {
    throw new Error('Template header row was not found');
  }

  console.log(`📊 XLSX: Header found at row ${headerRowIndex + 1}`);

  const headers = rows[headerRowIndex].map(value => String(value || '').trim());
  const allDataRows = rows.slice(headerRowIndex + 1);
  console.log(`📊 XLSX: Total rows after header: ${allDataRows.length}`);

  let emptyCount = 0;
  const dataRows = allDataRows.filter((row, idx) => {
    if (isEmptyRow(row)) {
      emptyCount++;
      return false;
    }
    return true;
  });

  console.log(`📊 XLSX: Filtered out ${emptyCount} empty rows`);
  console.log(`📦 XLSX: Total data rows for import: ${dataRows.length}`);

  return dataRows.map(row => {
    const record = {};
    headers.forEach((header, index) => {
      if (header) record[header] = String(row[index] || '').trim();
    });
    return record;
  });
};

exports.parseImportFile = (filePath, originalName = '') => {
  const ext = path.extname(originalName || filePath).toLowerCase();

  if (ext === '.csv') {
    return parseCSV(fs.readFileSync(filePath, 'utf-8'));
  }

  if (ext === '.xlsx') {
    return parseXLSX(filePath);
  }

  throw new Error('Only CSV or XLSX files are allowed');
};
