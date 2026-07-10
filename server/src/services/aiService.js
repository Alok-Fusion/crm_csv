const https = require('https');
const http = require('http');
const { ALLOWED_CRM_STATUSES, ALLOWED_DATA_SOURCES, CRM_FIELDS } = require('../utils/validators');

// LLM Provider Detection

function detectProvider(customApiKey, preferredProvider) {
  if (customApiKey) {
    const trimmed = customApiKey.trim();
    if (trimmed.startsWith('AIzaSy')) return 'gemini';
    if (trimmed.startsWith('sk-ant')) return 'anthropic';
    if (trimmed.startsWith('sk-')) return 'openai';
  }
  
  if (preferredProvider === 'gemini' && process.env.GEMINI_API_KEY) return 'gemini';
  if (preferredProvider === 'openai' && process.env.OPENAI_API_KEY) return 'openai';
  if (preferredProvider === 'anthropic' && process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (preferredProvider === 'groq' && process.env.GROQ_API_KEY) return 'groq';

  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.GROQ_API_KEY) return 'groq';
  return null;
}

// System Prompt

const SYSTEM_PROMPT = `You are a CRM data extraction expert. Your job is to intelligently map raw CSV record data into the GrowEasy CRM format.

## CRM Fields (output exactly these keys):
${CRM_FIELDS.map(f => `- ${f}`).join('\n')}

## Rules — follow these STRICTLY:

1. **created_at**: Must be a valid date string parseable by JavaScript's \`new Date()\`. Convert any date format to ISO 8601 or a common JS-parseable format like "YYYY-MM-DD HH:mm:ss". If no date is found, use an empty string.

2. **crm_status**: ONLY use one of these exact values:
   ${ALLOWED_CRM_STATUSES.map(s => `- ${s}`).join('\n   ')}
   Map common status terms intelligently:
   - "Hot Lead", "Warm Lead", "New Lead", "Qualified", "Interested" → GOOD_LEAD_FOLLOW_UP
   - "Cold Lead", "No response", "Did not pick up", "Busy" → DID_NOT_CONNECT
   - "Lost", "Not Interested", "Junk", "Unsubscribed" → BAD_LEAD
   - "Converted", "Won", "Paid", "Sale Completed", "Sale Done" → SALE_DONE
   If the data doesn't clearly match any status, leave it as an empty string.

3. **data_source**: ONLY use one of these exact values:
   ${ALLOWED_DATA_SOURCES.map(s => `- ${s}`).join('\n   ')}
   If none match confidently, leave it as an empty string.

4. **Multiple emails**: Use the FIRST email as the \`email\` field. Append ALL remaining emails into \`crm_note\` prefixed with "Additional emails: ".

5. **Multiple mobile numbers**: Use the FIRST mobile number as \`mobile_without_country_code\`. Append ALL remaining numbers into \`crm_note\` prefixed with "Additional phones: ".

6. **country_code**: Extract the country calling code (e.g., "+91", "+1"). Store WITHOUT the phone number.

7. **mobile_without_country_code**: Store the phone number WITHOUT the country code prefix.

8. **crm_note**: Use this field for:
   - Remarks or follow-up notes
   - Additional comments
   - Extra phone numbers (beyond the first)
   - Extra email addresses (beyond the first)
   - Any useful information that doesn't fit another field

9. **Skip invalid records**: If a record has NEITHER an email NOR a mobile number, mark it with \`"_skip": true\`.

10. **Field mapping**: Intelligently map column names to CRM fields. Examples:
    - "Contact Name", "Full Name", "Lead Name" → name
    - "Phone", "Mobile", "Cell", "Contact Number" → mobile_without_country_code
    - "Email Address", "E-mail", "Contact Email" → email
    - "Organization", "Company Name", "Business" → company
    - "Status", "Lead Status" → crm_status
    - "Source", "Lead Source", "Channel" → data_source
    - "Notes", "Comments", "Remarks" → crm_note

## Output Format:
Return a JSON array of objects. Each object must have ALL CRM fields listed above (use empty string for missing values). Add \`"_skip": true\` for invalid records.

IMPORTANT: Return ONLY valid JSON. No markdown, no code fences, no explanation. Just the raw JSON array.`;

// API Call Implementations

function callGemini(records, customApiKey) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  const model = 'gemini-2.0-flash';

  const body = JSON.stringify({
    contents: [{
      parts: [{
        text: `${SYSTEM_PROMPT}\n\n## Records to process:\n${JSON.stringify(records, null, 2)}`
      }]
    }],
    generationConfig: {
      temperature: 0.1,
      topP: 0.95,
      responseMimeType: 'application/json',
    }
  });

  return makeRequest({
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, body).then(data => {
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');
    return parseJSONResponse(text);
  });
}

function callOpenAI(records, customApiKey) {
  const apiKey = customApiKey || process.env.OPENAI_API_KEY;

  const body = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Process these CSV records into CRM format:\n${JSON.stringify(records, null, 2)}` }
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });

  return makeRequest({
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
  }, body).then(data => {
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty response from OpenAI');
    const parsed = parseJSONResponse(text);
    // OpenAI with json_object may wrap in { "records": [...] }
    if (parsed && !Array.isArray(parsed) && parsed.records) return parsed.records;
    return parsed;
  });
}

function callAnthropic(records, customApiKey) {
  const apiKey = customApiKey || process.env.ANTHROPIC_API_KEY;

  const body = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: `Process these CSV records into CRM format:\n${JSON.stringify(records, null, 2)}` }
    ],
    temperature: 0.1,
  });

  return makeRequest({
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
  }, body).then(data => {
    const text = data.content?.[0]?.text;
    if (!text) throw new Error('Empty response from Anthropic');
    return parseJSONResponse(text);
  });
}

function callGroq(records, customApiKey) {
  const apiKey = customApiKey || process.env.GROQ_API_KEY;
  const model = 'llama-3.3-70b-versatile';

  const body = JSON.stringify({
    model: model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Process these CSV records into CRM format:\n${JSON.stringify(records, null, 2)}` }
    ],
    temperature: 0.1,
  });

  return makeRequest({
    hostname: 'api.groq.com',
    path: '/openai/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
  }, body).then(data => {
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty response from Groq');
    return parseJSONResponse(text);
  });
}

// Helpers

function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            const errMsg = parsed.error?.message || parsed.error?.error?.message || JSON.stringify(parsed);
            reject(new Error(`API Error (${res.statusCode}): ${errMsg}`));
            return;
          }
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Failed to parse API response: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error('API request timed out after 60s'));
    });
    req.write(body);
    req.end();
  });
}

function parseJSONResponse(text) {
  // Try direct parse first
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : (parsed.records || parsed.data || [parsed]);
  } catch (e) {
    // Try extracting JSON from markdown code fences
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim());
        return Array.isArray(parsed) ? parsed : (parsed.records || parsed.data || [parsed]);
      } catch (e2) {
        // fall through
      }
    }

    // Try finding array in the text
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch (e3) {
        // fall through
      }
    }

    throw new Error(`Could not parse LLM response as JSON: ${text.substring(0, 200)}`);
  }
}

// Main Export: Process Records

const BATCH_SIZE = 15;
const MAX_RETRIES = 3;

async function processRecordsWithAI(records, customApiKey, preferredProvider, onProgress) {
  let actualApiKey = customApiKey;
  let actualProvider = preferredProvider;
  let actualOnProgress = onProgress;
  
  if (typeof customApiKey === 'function') {
    actualOnProgress = customApiKey;
    actualApiKey = null;
    actualProvider = null;
  } else if (typeof preferredProvider === 'function') {
    actualOnProgress = preferredProvider;
    actualProvider = null;
  }

  const provider = detectProvider(actualApiKey, actualProvider);
  if (!provider) {
    throw new Error('No LLM API key configured. Set GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, or GROQ_API_KEY in your .env file.');
  }

  const callLLM = {
    gemini: (recs) => callGemini(recs, actualApiKey),
    openai: (recs) => callOpenAI(recs, actualApiKey),
    anthropic: (recs) => callAnthropic(recs, actualApiKey),
    groq: (recs) => callGroq(recs, actualApiKey),
  }[provider];

  // Squeeze and clean records to strip empty/null/undefined properties to minimize prompt token footprint (rate limit mitigation)
  const cleanedRecords = records.map(record => {
    const clean = {};
    for (const [key, value] of Object.entries(record)) {
      if (value !== null && value !== undefined && value.toString().trim() !== '') {
        clean[key] = value.toString().trim();
      }
    }
    return clean;
  });

  // Split into batches
  const batches = [];
  for (let i = 0; i < cleanedRecords.length; i += BATCH_SIZE) {
    batches.push(cleanedRecords.slice(i, i + BATCH_SIZE));
  }

  const allParsed = [];
  const allSkipped = [];
  let processedBatches = 0;

  for (const batch of batches) {
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const results = await callLLM(batch);

        for (const record of results) {
          // Ensure all CRM fields exist with defaults
          const normalized = {};
          for (const field of CRM_FIELDS) {
            normalized[field] = record[field] || '';
          }

          if (record._skip) {
            allSkipped.push(normalized);
          } else {
            // Post-validate: must have email or mobile
            if (!normalized.email && !normalized.mobile_without_country_code) {
              allSkipped.push(normalized);
            } else {
              // Validate crm_status
              if (normalized.crm_status && !ALLOWED_CRM_STATUSES.includes(normalized.crm_status)) {
                normalized.crm_note = `[Invalid status: ${normalized.crm_status}] ${normalized.crm_note}`.trim();
                normalized.crm_status = '';
              }
              // Validate data_source
              if (normalized.data_source && !ALLOWED_DATA_SOURCES.includes(normalized.data_source)) {
                normalized.crm_note = `[Unknown source: ${normalized.data_source}] ${normalized.crm_note}`.trim();
                normalized.data_source = '';
              }
              allParsed.push(normalized);
            }
          }
        }

        processedBatches++;
        if (onProgress) {
          onProgress({
            processedBatches,
            totalBatches: batches.length,
            processedRecords: allParsed.length + allSkipped.length,
            totalRecords: records.length,
          });
        }

        lastError = null;
        break; // Success, move to next batch

      } catch (err) {
        lastError = err;
        console.error(`[AI] Batch attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
        if (attempt < MAX_RETRIES) {
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
        }
      }
    }

    if (lastError) {
      throw new Error(`Failed to process batch after ${MAX_RETRIES} retries: ${lastError.message}`);
    }
  }

  return {
    provider,
    parsed: allParsed,
    skipped: allSkipped,
    totalImported: allParsed.length,
    totalSkipped: allSkipped.length,
    totalProcessed: allParsed.length + allSkipped.length,
  };
}

module.exports = { processRecordsWithAI, detectProvider };
