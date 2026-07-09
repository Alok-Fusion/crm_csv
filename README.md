# 🚀 GrowEasy CRM CSV Importer

An AI-powered CSV importer that intelligently extracts CRM lead information from **any valid CSV format** — regardless of column names, layouts, or structures.

> Built for the GrowEasy Software Developer Assignment

---

## ✨ Features

- **Drag & Drop CSV Upload** — Intuitive file upload with visual feedback
- **Smart Preview** — Responsive table with sticky headers and horizontal scrolling
- **AI-Powered Field Mapping** — Automatically maps any CSV columns to GrowEasy CRM fields
- **Multi-LLM Support** — Works with OpenAI, Gemini, or Claude — just drop in your API key
- **Batch Processing** — Handles large CSVs with intelligent batching and retry logic
- **Real-time Progress** — Live progress indicators during AI processing
- **Results Dashboard** — View parsed records, skipped records, and import stats
- **Dark Mode UI** — Premium glassmorphism design with smooth animations
- **Docker Ready** — One-command setup with Docker Compose

---

## 🛠️ Tech Stack

| Layer | Technology |
|:---|:---|
| **Frontend** | Next.js 15 (App Router) |
| **Backend** | Node.js + Express |
| **AI** | OpenAI / Gemini / Claude (configurable) |
| **Styling** | Vanilla CSS with custom design system |

---

## 📋 Prerequisites

- Node.js 18+
- An API key for one of: OpenAI, Google Gemini, or Anthropic Claude

---

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/Alok-Fusion/crm_csv.git
cd crm_csv
```

### 2. Setup the Backend

```bash
cd server
npm install
cp .env.example .env
# Add your API key to .env
npm run dev
```

### 3. Setup the Frontend

```bash
cd client
npm install
npm run dev
```

### 4. Open in Browser

Navigate to `http://localhost:3000`

---

## 🔑 Environment Variables

Create a `server/.env` file:

```env
PORT=5000

# Use ANY ONE of these — the system auto-detects which LLM to use
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AI...
ANTHROPIC_API_KEY=sk-ant-...
```

> **Note:** You only need ONE API key. The system automatically detects which LLM provider to use based on which key is present.

---

## 🐳 Docker Setup

```bash
docker-compose up --build
```

Frontend: `http://localhost:3000`  
Backend: `http://localhost:5000`

---

## 📊 CRM Fields

The AI extracts and maps CSV data to these GrowEasy CRM fields:

| Field | Description |
|:---|:---|
| `created_at` | Lead creation date |
| `name` | Lead name |
| `email` | Primary email |
| `country_code` | Country code |
| `mobile_without_country_code` | Mobile number |
| `company` | Company name |
| `city` | City |
| `state` | State |
| `country` | Country |
| `lead_owner` | Lead owner |
| `crm_status` | Status (GOOD_LEAD_FOLLOW_UP / DID_NOT_CONNECT / BAD_LEAD / SALE_DONE) |
| `crm_note` | Notes, remarks, extra contacts |
| `data_source` | Lead source |
| `possession_time` | Property possession time |
| `description` | Additional description |

---

## 📁 Project Structure

```
crm_csv/
├── client/                  # Next.js frontend
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # React components
│   │   ├── lib/            # API client utilities
│   │   └── styles/         # CSS modules
│   └── package.json
├── server/                  # Express backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # CSV parsing + AI service
│   │   └── utils/          # Validators + helpers
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## 👤 Author

**Alok Kushwaha**  
[GitHub](https://github.com/Alok-Fusion) · [LinkedIn](https://www.linkedin.com/in/akushwaha-j) · [Portfolio](https://portfolio-data-omega.vercel.app)

---

## 📄 License

MIT
