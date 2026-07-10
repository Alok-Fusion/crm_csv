const { parseCSV } = require('../services/csvParser');
const { processRecordsWithAI, detectProvider } = require('../services/aiService');
const db = require('../utils/db');

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
    const { records, fileName } = req.body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'No records provided for processing.' });
    }

    const settings = db.getSettings();
    const configModel = settings?.defaultModel || 'gemini-2.0-flash';
    let preferredProvider = 'gemini';
    if (configModel.includes('gpt') || configModel.includes('openai')) preferredProvider = 'openai';
    else if (configModel.includes('claude') || configModel.includes('sonnet')) preferredProvider = 'anthropic';
    else if (configModel.includes('llama') || configModel.includes('groq')) preferredProvider = 'groq';

    const provider = detectProvider(null, preferredProvider);
    if (!provider) {
      return res.status(500).json({
        error: 'No LLM API key configured on the server. Please check GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, or GROQ_API_KEY in the server\'s .env file.',
      });
    }

    console.log(`[AI] Processing ${records.length} records using ${provider.toUpperCase()}...`);

    const result = await processRecordsWithAI(records, null, preferredProvider, (progress) => {
      console.log(`[AI] Progress: Batch ${progress.processedBatches}/${progress.totalBatches} (${progress.processedRecords}/${progress.totalRecords} records)`);
    });

    // Save to file-based JSON DB for persistent history
    db.saveImport({
      fileName: fileName || 'imported_leads.csv',
      totalImported: result.totalImported,
      totalSkipped: result.totalSkipped,
      totalProcessed: result.totalProcessed,
      provider: result.provider,
      parsed: result.parsed,
      skipped: result.skipped,
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

/**
 * GET /api/history
 * Retrieve all past import logs.
 */
async function getImportHistory(req, res, next) {
  try {
    const history = db.getImports();
    res.json({ success: true, history });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/history/clear
 * Clear all previous import logs.
 */
async function clearImportHistory(req, res, next) {
  try {
    db.clearImports();
    res.json({ success: true, message: 'Import history cleared.' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/settings
 * Retrieve server configuration settings.
 */
async function getSystemSettings(req, res, next) {
  try {
    const settings = db.getSettings();
    const keys = {
      gemini: !!process.env.GEMINI_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      groq: !!process.env.GROQ_API_KEY,
    };
    res.json({ success: true, settings, keys });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/settings
 * Save configuration settings.
 */
async function saveSystemSettings(req, res, next) {
  try {
    const { defaultModel, batchSize } = req.body;
    const settings = db.saveSettings({ defaultModel, batchSize: parseInt(batchSize, 10) || 10 });
    res.json({ success: true, settings, message: 'Settings saved successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { 
  uploadCSV, 
  processCSV,
  getImportHistory,
  clearImportHistory,
  getSystemSettings,
  saveSystemSettings
};
