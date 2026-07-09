# 🚀 GrowEasy CRM CSV Importer — Enterprise Lead Importer & Analytics Dashboard

[![Express API](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Next.js Frontend](https://img.shields.io/badge/Next.js%2015-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Docker Compose](https://img.shields.io/badge/Docker%20Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![LLM Models Supported](https://img.shields.io/badge/AI--Powered-Gemini%20%7C%20OpenAI%20%7C%20Claude-blueviolet?style=for-the-badge)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)

An intelligent, AI-powered CSV importer that parses, sanitizes, and maps campaign lead sheets of **any layout, column structure, or header configuration** into the strict **GrowEasy CRM format**. 

Equipped with a dual-theme analytical dashboard, persistent history logs, custom SVG visualization charts, and sequential progress tracking with automated retries.

---

## 📖 Table of Contents
1. [System Architecture](#-system-architecture)
2. [Key Features](#-key-features)
3. [Setup & Installation](#-setup--installation)
   - [Local Development Setup](#local-development-setup)
   - [Docker Compose Setup](#docker-compose-setup)
4. [Environment Variables](#-environment-variables)
5. [CRM Validation Specs & Constraints](#-crm-validation-specs--constraints)
6. [Project Structure](#-project-structure)
7. [Applicant Profile & Assignment Info](#-applicant-profile--assignment-info)

---

## 🏗️ System Architecture

```mermaid
graph TD
    A[Next.js SPA Client] -->|1. Upload File| B[Express API Server]
    B -->|2. Buffer Parse| C[csv-parse Engine]
    C -->|3. Columns & Rows| A
    A -->|4. Trigger Import Job| B
    B -->|5. Chunked Batches| D[AI Multi-LLM Adapter]
    D -->|6. Map CRM Fields| B
    B -->|7. Persist Metadata| E[Local db.json database]
    B -->|8. Structured Mapped JSON| A
    A -->|9. Render Analytics| A
```

For a comprehensive breakdown of the data lifecycle, prompt structures, and API request schemas, refer to the [System Documentation](PROJECT_DOCUMENTATION.md).

---

## ✨ Key Features

- **Intuitive CSV Previewer**: Drag & Drop zone or file picker parsing CSVs in memory instantly without processing by AI. Includes searchable sticky-header scrollable tables.
- **Sequential Batch Processing**: Splices records into configurable batch sizes and processes sequentially, providing real progress meters to prevent model token rate exhaustion.
- **Frontend Retry Engine**: Automatically retries failed batches up to 3 times on network hiccups or rate limits using exponential backoff before asking the user.
- **Multi-LLM Dynamic Routing**: Connects to Gemini 2.0 Flash, OpenAI GPT-4o-mini, or Anthropic Claude 3.5 Sonnet directly via server configurations.
- **Local JSON Database**: Persists import histories, settings, and analytical summaries to a lightweight JSON database file (`server/data/db.json`).
- **Dashboard Analytics View**: Renders circular success gauges, Lead Status bar graphs, and Lead Source charts dynamically using custom, animated SVG indicators.
- **Historical Log Inspection**: Expand past imports to inspect record tables or re-download the mapped CRM CSV file instantly.
- **Dual Light & Dark Themes**: Responsive, premium interface with slate variable variables designed to switch theme settings smoothly and preserve user preferences.

---

## 🛠️ Setup & Installation

### Local Development Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/Alok-Fusion/crm_csv.git
cd crm_csv
```

#### 2. Set Up the Backend Server
```bash
cd server
npm install
cp .env.example .env
# Edit .env and paste your API key (at least one of GEMINI, OPENAI, or ANTHROPIC)
npm run dev
```

#### 3. Set Up the Frontend Client
Open a new terminal session:
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:3000` to access the application.

---

### Docker Compose Setup

Launch the entire monorepo stack with a single command:
```bash
# From the project root
docker-compose up --build
```
- **Frontend Panel**: Accessible at `http://localhost:3000`
- **Backend API**: Running at `http://localhost:5000`

---

## 🔑 Environment Variables

Create `server/.env` with the following variables:

```env
PORT=5000
CLIENT_URL=http://localhost:3000

# Server-Side API Keys (Configure at least one)
GEMINI_API_KEY=AIzaSy...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 📋 CRM Validation Specs & Constraints

Leads are parsed and validated according to the following GrowEasy CRM specifications:

### Field Mappings
| Target CRM Field | Description | AI Rule |
| :--- | :--- | :--- |
| `created_at` | Lead Creation Date | Standardized to ISO/JS parseable format. |
| `name` | Lead Name | Extracted from any name/contact headers. |
| `email` | Primary Email | Maps first email; excess emails go to `crm_note`. |
| `country_code` | Dialing Code Prefix | Extracted calling prefix (e.g. `+91`, `+1`). |
| `mobile_without_country_code` | Mobile Number | Maps first number; excess numbers go to `crm_note`. |
| `crm_status` | Status | Must be: `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, `SALE_DONE`. |
| `data_source` | Source | Must be: `leads_on_demand`, `meridian_tower`, `eden_park`, `varah_swamy`, `sarjapur_plots`. |
| `crm_note` | Remarks / Notes | Captures extra contact details, remarks, and line breaks. |

### Logic Rules
1. **Critical Skip Rule**: Any record containing **neither** `email` **nor** `mobile number` is skipped automatically.
2. **Multiple Contacts**: First phone/email goes to its dedicated field; all others are concatenated into `crm_note`.
3. **Status Sanitization**: AI maps messy strings (e.g., "Warm", "Hot Lead") into strict status values.

---

## 📁 Project Structure

```
crm_csv/
├── client/                  # Next.js 15 Client
│   ├── src/
│   │   ├── app/            # App Router routes (globals.css, layout.js, page.js)
│   │   ├── components/     # Modular Views (Sidebar, Dashboard, Importer, History, Settings, About)
│   │   └── lib/            # API client fetch wrappers
│   ├── Dockerfile
│   └── package.json
├── server/                  # Express API Backend
│   ├── src/
│   │   ├── routes/         # Router paths
│   │   ├── controllers/    # Route controllers
│   │   ├── services/       # CSV Parser & AI Adapter services
│   │   └── utils/          # Database driver & validators
│   ├── data/               # Persistent JSON database folder (git-ignored)
│   ├── Dockerfile
│   └── package.json
├── samples/                 # Sample Leads CSV templates for testing
├── docker-compose.yml       # Monorepo Orchestration Config
└── README.md                # General readme file
```

---

## 👤 Applicant Profile & Assignment Info

- **Candidate**: Alok Kushwaha
- **Position**: Software Developer (Intern / Full-Time)
- **Work Mode**: Work From Home (WFH)
- **Email for Submission**: `varun@groweasy.ai`
- **Hosted Application**: [Verify Active Link](https://portfolio-data-omega.vercel.app)
- **GitHub Repository**: [GitHub Link](https://github.com/Alok-Fusion/crm_csv.git)

---

## 📄 License
This project is licensed under the MIT License.
