import "./globals.css";

export const metadata = {
  title: "FlexCRM Importer — AI-Powered CSV Import",
  description:
    "Upload any CSV file and let AI intelligently map your data to FlexCRM fields. Supports OpenAI, Gemini, Claude, and Groq.",
  keywords: ["CRM", "CSV", "Import", "AI", "FlexCRM", "Lead Management"],
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
