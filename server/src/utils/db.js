const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../../data/db.json');

// Ensure data folder exists
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Helper to read database
function readDB() {
  if (!fs.existsSync(dbPath)) {
    return { imports: [], settings: { defaultModel: 'gemini-2.0-flash', batchSize: 15 } };
  }
  try {
    const content = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    console.error('[DB] Read error, resetting database:', e.message);
    return { imports: [], settings: { defaultModel: 'gemini-2.0-flash', batchSize: 15 } };
  }
}

// Helper to write database
function writeDB(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('[DB] Write error:', e.message);
  }
}

module.exports = {
  getImports: () => {
    const db = readDB();
    return db.imports || [];
  },
  
  saveImport: (importRecord) => {
    const db = readDB();
    db.imports = db.imports || [];
    
    // Auto-generate ID and timestamp
    const recordWithMeta = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      ...importRecord
    };
    
    db.imports.unshift(recordWithMeta); // Newest first
    writeDB(db);
    return recordWithMeta;
  },
  
  clearImports: () => {
    const db = readDB();
    db.imports = [];
    writeDB(db);
  },

  getSettings: () => {
    const db = readDB();
    return db.settings || { defaultModel: 'gemini-2.0-flash', batchSize: 15 };
  },

  saveSettings: (newSettings) => {
    const db = readDB();
    db.settings = { ...(db.settings || {}), ...newSettings };
    writeDB(db);
    return db.settings;
  }
};
