# GrowEasy CRM CSV Importer — Technical & System Documentation

This document provides a detailed breakdown of the system design, prompt engineering strategies, state architectures, and integration paradigms implemented within the GrowEasy CRM CSV Importer.

---

## 1. System Overview & Architecture

The application is engineered as a monorepo consisting of:
1. **Express Backend**: Exposes endpoints for CSV file parsing, AI mapping orchestration, historical logs querying, and system configuration.
2. **Next.js Single Page App (SPA)**: Exposes a dashboard with sidebar navigation, theme control engines, and data rendering views.

### System Diagram
```
   [ Next.js SPA Client ] <----------------------> [ Express REST Server ]
    - Dashboard View (SVG Charts)                    - uploadCSV Controller
    - CSV Importer View                              - processCSV Controller
    - History Log View                               - db.js Local DB Driver
    - Settings & Theme Engine                               |
           |                                                v
           v                                         [ data/db.json ]
    [ Sequential Batch Router ] ----(Chunks of 15)--> (Reads/Writes Metadata)
           |
           +----(Automatic Retries on Failed Batches)
```

---

## 2. API Reference & Controller Schemas

All server routes are prefix-mounted under `/api`.

### 1. `POST /api/upload`
Accepts a raw CSV spreadsheet via Multer and parses it in-memory. Returns structured JSON headers and row previews.

- **Request**: `multipart/form-data`
  - `file`: CSV file (up to 10MB)
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "fileName": "leads_export.csv",
    "fileSize": 12840,
    "totalRows": 25,
    "columns": ["First Name", "Email Addr", "Ph. Num", "Company"],
    "records": [
      { "First Name": "John", "Email Addr": "john@doe.com", "Ph. Num": "+919876543210", "Company": "Stark Industries" }
    ]
  }
  ```

### 2. `POST /api/process`
Slices the passed spreadsheet records, maps columns into CRM variables via the LLM provider, and appends details into the local history database.

- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "records": [
      { "First Name": "John", "Email Addr": "john@doe.com", "Ph. Num": "+919876543210", "Company": "Stark Industries" }
    ],
    "fileName": "leads_export.csv"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "provider": "gemini",
    "parsed": [
      {
        "created_at": "2026-07-09T16:00:00Z",
        "name": "John",
        "email": "john@doe.com",
        "country_code": "+91",
        "mobile_without_country_code": "9876543210",
        "company": "Stark Industries",
        "city": "",
        "state": "",
        "country": "",
        "lead_owner": "",
        "crm_status": "GOOD_LEAD_FOLLOW_UP",
        "crm_note": "",
        "data_source": "leads_on_demand",
        "possession_time": "",
        "description": ""
      }
    ],
    "skipped": [],
    "totalImported": 1,
    "totalSkipped": 0,
    "totalProcessed": 1
  }
  ```

### 3. `GET /api/history`
Retrieves past import metrics, dates, filenames, and parsed records.

- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "history": [
      {
        "id": "jq82hd",
        "timestamp": "2026-07-09T22:15:30Z",
        "fileName": "leads_export.csv",
        "totalImported": 1,
        "totalSkipped": 0,
        "totalProcessed": 1,
        "provider": "gemini",
        "parsed": [...],
        "skipped": [...]
      }
    ]
  }
  ```

---

## 3. Database Architecture & Settings Persistence

The JSON database driver `server/src/utils/db.js` implements synchronous reads and writes using a single storage file `server/data/db.json`. 

### JSON Schema Structure
```json
{
  "imports": [
    {
      "id": "ks83nd9c",
      "timestamp": "2026-07-09T16:51:30Z",
      "fileName": "messy_leads_large.csv",
      "totalImported": 48,
      "totalSkipped": 3,
      "totalProcessed": 51,
      "provider": "gemini",
      "parsed": [],
      "skipped": []
    }
  ],
  "settings": {
    "defaultModel": "gemini-2.0-flash",
    "batchSize": 15
  }
}
```

- **Imports Log**: Stores arrays of both imported and skipped records so the system can reconstruct the list tables during historical sessions.
- **Settings Store**: Persists parameters so change preferences (like batch sizes) apply globally to active backend processes.

---

## 4. Prompt Engineering & AI Mapping Rules

The Prompt adapter `server/src/services/aiService.js` builds a structured instruction context that enforces constraints.

### Core System Prompt Layout
```
You are a CRM data extraction expert. Your job is to intelligently map raw CSV record data into the GrowEasy CRM format.

## CRM Fields (output exactly these keys):
- created_at
- name
- email
- country_code
- mobile_without_country_code
- company
- city
- state
- country
- lead_owner
- crm_status
- crm_note
- data_source
- possession_time
- description

## Rules — follow these STRICTLY:

1. **created_at**: Must be a valid date string parseable by JavaScript's `new Date()`. Convert any date format to ISO 8601 or a common JS-parseable format like "YYYY-MM-DD HH:mm:ss". If no date is found, use an empty string.

2. **crm_status**: ONLY use one of these exact values:
   - GOOD_LEAD_FOLLOW_UP
   - DID_NOT_CONNECT
   - BAD_LEAD
   - SALE_DONE
   If the data doesn't clearly match any status, leave it as an empty string.

3. **data_source**: ONLY use one of these exact values:
   - leads_on_demand
   - meridian_tower
   - eden_park
   - varah_swamy
   - sarjapur_plots
   If none match confidently, leave it as an empty string.

4. **Multiple emails**: Use the FIRST email as the `email` field. Append ALL remaining emails into `crm_note` prefixed with "Additional emails: ".

5. **Multiple mobile numbers**: Use the FIRST mobile number as `mobile_without_country_code`. Append ALL remaining numbers into `crm_note` prefixed with "Additional phones: ".

6. **country_code**: Extract the country calling code (e.g., "+91", "+1"). Store WITHOUT the phone number.

7. **mobile_without_country_code**: Store the phone number WITHOUT the country code prefix.

8. **crm_note**: Use this field for:
   - Remarks or follow-up notes
   - Additional comments
   - Extra phone numbers (beyond the first)
   - Extra email addresses (beyond the first)
   - Any useful information that doesn't fit another field

9. **Skip invalid records**: If a record has NEITHER an email NOR a mobile number, mark it with `"_skip": true`.

10. **Field mapping**: Intelligently map column names to CRM fields. Examples:
    - "Contact Name", "Full Name", "Lead Name" → name
    - "Phone", "Mobile", "Cell", "Contact Number" → mobile_without_country_code
    - "Email Address", "E-mail", "Contact Email" → email
    - "Organization", "Company Name", "Business" → company
    - "Status", "Lead Status" → crm_status
    - "Source", "Lead Source", "Channel" → data_source
    - "Notes", "Comments", "Remarks" → crm_note

## Output Format:
Return a JSON array of objects. Each object must have ALL CRM fields listed above (use empty string for missing values). Add `"_skip": true` for invalid records.

IMPORTANT: Return ONLY valid JSON. No markdown, no explanation. Just the raw JSON array.
```

### JSON Extraction Fallbacks
If a model returns JSON inside code blocks, the parser automatically applies a search query (`/```(?:json)?\s*([\s\S]*?)```/`) to extract the nested array. If it returns standard text wrap, it isolates content between `[` and `]` brackets to resolve syntax errors safely.

---

## 5. Client View Architecture & Theme System

The client is structured as a single dashboard framework with a stateless router mapping views via variables in React `useState`.

### Sidebar Navigation & Views Structure
```
[ Sidebar.js ] 
  |--> onViewChange('dashboard')  ====> DashboardView.js (Analytics, SVG Charts)
  |--> onViewChange('importer')   ====> Importer Steps (StepIndicator, FileUploader, DataPreview, ProcessingStatus, ResultsView)
  |--> onViewChange('history')    ====> HistoryView.js (Accordion Details Log)
  |--> onViewChange('settings')   ====> SettingsView.js (Default Model, Batch Control)
  |--> onViewChange('about')      ====> AboutView.js (Doc Profile)
```

### Variable Theme Engine
When toggled, `onThemeChange` applies the `data-theme` attribute to the document root:
```javascript
document.documentElement.setAttribute('data-theme', theme);
```
CSS rules in `globals.css` are mapped via variables that switch color definitions smoothly using transit curves:
- **Dark variables**: Slate deep backgrounds (`#090d16`), bright text (`#f8fafc`).
- **Light variables**: Slate gray backgrounds (`#f8fafc`), clean dark text (`#0f172a`).

---

## 6. Analytical Graph Calculations

Analytics on the Dashboard are designed using custom SVGs and CSS tracks to prevent SSR hydration errors and improve page speed.

### Success Rate circular gauge
A circle is drawn with radius `r=45`, making its circumference `2 * PI * r = 282.74`.
```javascript
const circumference = 2 * Math.PI * 45;
const strokeDashoffset = circumference - (stats.successRate / 100) * circumference;
```
The circle is rotated by `-90deg` so that the line draws clockwise starting from the top.

### Status & Source Distributions
Bar charts use percentage calculations as widths on `bar-chart-fill` tracks:
```html
<div className="bar-chart-track">
  <div 
    className="bar-chart-fill success" 
    style={{ width: `${item.percentage}%` }} 
  />
</div>
```
CSS handles layout animation transitions as elements render.

---

## 7. Edge Cases & Resilience Strategy

- **Ragged CSV Rows**: Parser skips blank cells, trims whitespaces, and normalizes column headers automatically.
- **Double Calling Codes**: AI parses and separates calling prefixes (e.g. `+91`) from standard digits even when formatted together as a single column.
- **LLM Rate Limits (429)**: The frontend splits large payloads into small chunks. In case of model throttling, the frontend retry loop schedules retries with linear backoffs.
- **Stateless Stability**: Database records store files dynamically, meaning the app runs properly inside ephemeral containers without local volumes.
