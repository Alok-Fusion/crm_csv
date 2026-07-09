const { parse } = require('csv-parse');

/**
 * Parse a CSV buffer into an array of record objects.
 * Handles any column names, auto-trims whitespace.
 */
function parseCSV(buffer) {
  return new Promise((resolve, reject) => {
    const records = [];
    const parser = parse(buffer, {
      columns: true,            // Use first row as headers
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true, // Handle ragged rows
      bom: true,                // Handle BOM character
    });

    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        records.push(record);
      }
    });

    parser.on('error', (err) => {
      reject(new Error(`CSV parsing failed: ${err.message}`));
    });

    parser.on('end', () => {
      resolve({
        records,
        totalRows: records.length,
        columns: records.length > 0 ? Object.keys(records[0]) : [],
      });
    });
  });
}

module.exports = { parseCSV };
