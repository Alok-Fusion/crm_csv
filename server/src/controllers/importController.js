const { parseCSV } = require('../services/csvParser');
const { processRecordsWithAI, detectProvider } = require('../services/aiService');

/**
 * POST /api/upload
 * Accept CSV file, parse it, return raw records for frontend preview.
 */
async function uploadCSV(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please upload a CSV file.' });
    }

    const { records, totalRows, columns } = await parseCSV(req.file.buffer);

    if (totalRows === 0) {
      return res.status(400).json({ error: 'The CSV file is empty or has no data rows.' });
    }

    res.json({
      success: true,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      totalRows,
      columns,
      records,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/process
 * Accept raw CSV records, process with AI, return structured CRM records.
 */
async function processCSV(req, res, next) {
  try {
    const { records, apiKey } = req.body;
    const customApiKey = apiKey || req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'No records provided for processing.' });
    }

    const provider = detectProvider(customApiKey);
    if (!provider) {
      return res.status(400).json({
        error: 'No LLM API key configured. Please set GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY on the server, or enter an API key in the UI settings.',
      });
    }

    console.log(`[AI] Processing ${records.length} records using ${provider.toUpperCase()}...`);

    const result = await processRecordsWithAI(records, customApiKey, (progress) => {
      console.log(`[AI] Progress: Batch ${progress.processedBatches}/${progress.totalBatches} (${progress.processedRecords}/${progress.totalRecords} records)`);
    });

    console.log(`[AI] Done! Imported: ${result.totalImported}, Skipped: ${result.totalSkipped}`);

    res.json({
      success: true,
      provider: result.provider,
      parsed: result.parsed,
      skipped: result.skipped,
      totalImported: result.totalImported,
      totalSkipped: result.totalSkipped,
      totalProcessed: result.totalProcessed,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadCSV, processCSV };
