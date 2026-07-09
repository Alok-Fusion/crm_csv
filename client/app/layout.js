import "./globals.css";

export const metadata = {
  title: "GrowEasy CRM Importer — AI-Powered CSV Import",
  description:
    "Upload any CSV file and let AI intelligently map your data to GrowEasy CRM fields. Supports OpenAI, Gemini, and Claude.",
  keywords: ["CRM", "CSV", "Import", "AI", "GrowEasy", "Lead Management"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="aurora-bg" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
