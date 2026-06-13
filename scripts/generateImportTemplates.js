const fs = require('fs');
const path = require('path');
const ExcelJS = require('../backend/node_modules/exceljs');

const outputDir = path.join(__dirname, '..', 'frontend', 'public', 'templates');
const logoPath = path.join(__dirname, '..', 'frontend', 'public', 'logo.png');

const templates = [
  {
    filename: 'cranes-import-template.xlsx',
    title: 'CRANES IMPORT TEMPLATE',
    required: 'equipmentNo',
    headers: [
      ['equipmentNo', 22],
      ['craneModel', 24],
      ['yearModel', 12],
      ['capacity', 14],
      ['weightKg', 14],
      ['supervisor', 22],
      ['client', 28],
      ['status', 22],
      ['condition', 22],
      ['location', 18],
    ],
    statusValues: ['Available', 'Out of Yard', 'Under Maintenance', 'On Hire'],
  },
  {
    filename: 'counterweights-import-template.xlsx',
    title: 'COUNTERWEIGHTS IMPORT TEMPLATE',
    required: 'itemName',
    headers: [
      ['itemName', 28],
      ['serialNo', 20],
      ['assignedCrane', 22],
      ['weightKg', 14],
      ['capacity', 14],
      ['location', 18],
      ['condition', 18],
      ['status', 22],
      ['client', 28],
    ],
    statusValues: ['Available', 'Out of Yard', 'Under Maintenance'],
  },
  {
    filename: 'boom-sections-import-template.xlsx',
    title: 'BOOM SECTIONS IMPORT TEMPLATE',
    required: 'itemName',
    headers: [
      ['assignedCrane', 22],
      ['boomCode', 18],
      ['itemName', 28],
      ['length', 14],
      ['weightKg', 14],
      ['location', 18],
      ['condition', 18],
      ['status', 22],
      ['client', 28],
    ],
    statusValues: ['Available', 'Out of Yard', 'Under Maintenance'],
  },
  {
    filename: 'hooks-import-template.xlsx',
    title: 'HOOKS IMPORT TEMPLATE',
    required: 'itemName',
    headers: [
      ['itemName', 28],
      ['hookSerialNo', 20],
      ['capacity', 14],
      ['assignedCrane', 22],
      ['location', 18],
      ['status', 22],
      ['weightKg', 14],
      ['condition', 18],
      ['client', 28],
      ['ropeDia', 14],
    ],
    statusValues: ['Available', 'Out of Yard', 'Under Maintenance', 'Allocated'],
  },
];

const conditionValues = ['OK', 'NOT OK', 'For Repair', 'Unknown'];
const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F6BEB' } };
const titleFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D1117' } };
const noteFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6F8FA' } };
const border = {
  top: { style: 'thin', color: { argb: 'FFD0D7DE' } },
  left: { style: 'thin', color: { argb: 'FFD0D7DE' } },
  bottom: { style: 'thin', color: { argb: 'FFD0D7DE' } },
  right: { style: 'thin', color: { argb: 'FFD0D7DE' } },
};

function addValidation(sheet, columnNumber, firstRow, lastRow, values) {
  for (let row = firstRow; row <= lastRow; row += 1) {
    sheet.getCell(row, columnNumber).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${values.join(',')}"`],
      showErrorMessage: true,
      errorTitle: 'Invalid value',
      error: `Select one of: ${values.join(', ')}`,
    };
  }
}

async function createTemplate(config) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ANPC Yard System';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Import Template', {
    views: [{ state: 'frozen', ySplit: 8 }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  const lastColumn = config.headers.length;
  const headerRowNumber = 8;
  const firstDataRow = 9;
  const lastDataRow = 108;

  config.headers.forEach(([header, width], index) => {
    sheet.getColumn(index + 1).width = width;
    sheet.getColumn(index + 1).alignment = { vertical: 'middle', wrapText: true };
  });

  sheet.mergeCells(1, 1, 1, lastColumn);
  sheet.getCell('A1').value = 'SARENS NASS (ANPC YARD)';
  sheet.getCell('A1').font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 16 };
  sheet.getCell('A1').fill = titleFill;
  sheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 28;

  sheet.mergeCells(2, 1, 2, lastColumn);
  sheet.getCell('A2').value = config.title;
  sheet.getCell('A2').font = { bold: true, color: { argb: 'FF1F2328' }, size: 13 };
  sheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(2).height = 24;

  sheet.mergeCells(3, 1, 6, lastColumn);
  sheet.getCell('A3').value = [
    `Instructions: Fill in data starting from row ${firstDataRow}.`,
    `Required field: ${config.required}. Do not rename, delete, or reorder the field header row.`,
    `Status values: ${config.statusValues.join(' | ')}.`,
    `Condition values: ${conditionValues.join(' | ')}.`,
  ].join('\n');
  sheet.getCell('A3').fill = noteFill;
  sheet.getCell('A3').font = { color: { argb: 'FF57606A' }, size: 11 };
  sheet.getCell('A3').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  sheet.getCell('A3').border = border;
  sheet.getRow(3).height = 24;
  sheet.getRow(4).height = 24;
  sheet.getRow(5).height = 24;
  sheet.getRow(6).height = 24;

  if (fs.existsSync(logoPath)) {
    const logo = workbook.addImage({ filename: logoPath, extension: 'png' });
    sheet.addImage(logo, {
      tl: { col: 0.2, row: 0.15 },
      ext: { width: 88, height: 34 },
    });
  }

  const headerRow = sheet.getRow(headerRowNumber);
  headerRow.values = config.headers.map(([header]) => header);
  headerRow.height = 26;
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = headerFill;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = border;
  });

  for (let rowNumber = firstDataRow; rowNumber <= lastDataRow; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    row.height = 22;
    for (let columnNumber = 1; columnNumber <= lastColumn; columnNumber += 1) {
      const cell = row.getCell(columnNumber);
      cell.border = border;
      cell.alignment = { vertical: 'middle', wrapText: true };
    }
  }

  const statusIndex = config.headers.findIndex(([header]) => header === 'status') + 1;
  const conditionIndex = config.headers.findIndex(([header]) => header === 'condition') + 1;
  if (statusIndex > 0) addValidation(sheet, statusIndex, firstDataRow, lastDataRow, config.statusValues);
  if (conditionIndex > 0) addValidation(sheet, conditionIndex, firstDataRow, lastDataRow, conditionValues);

  sheet.autoFilter = {
    from: { row: headerRowNumber, column: 1 },
    to: { row: headerRowNumber, column: lastColumn },
  };

  await workbook.xlsx.writeFile(path.join(outputDir, config.filename));
}

(async () => {
  fs.mkdirSync(outputDir, { recursive: true });
  for (const template of templates) {
    await createTemplate(template);
  }
})();
