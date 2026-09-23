export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Holt den API-Schlüssel sicher aus den Vercel Environment Variables
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API-Key auf Vercel nicht konfiguriert (GEMINI_API_KEY fehlt).' });
  }

  const { text } = req.body;

  const promptText = `Du bist ein präziser Data-Analyst. Deine Aufgabe ist es, den nachfolgenden Berichtstext durchzusuchen und EXAKT die darin enthaltenen echten Zahlen, Daten, Fakten, Prozentwerte und Ergebnisse zu extrahieren.

WICHTIGE ANWEISUNGEN:
- Erfinde KEINE Platzhalter und nutze keine allgemeinen Floskeln.
- Greife konkrete Zahlen, Beträge, Prozente, Jahreszahlen und Objektnamen direkt aus dem Text auf.
- Gib das Ergebnis ausschließlich als valides JSON-Objekt zurück. Keine Markdown-Codeblöcke (\`\`\`json).

JSON-SCHEMA:
{
  "meta": "BERICHTSART / DATUM AUS DEM TEXT",
  "title": "Exakter Titel oder Hauptthema des Berichts",
  "subtitle": "Untertitel, Zeitraum oder konkreter Bereich",
  "highlight": "Der zentralste Satz mit den wichtigsten Zahlen/Ergebnissen aus dem Text.",
  "summary": "Sehr konkrete Zusammenfassung der wichtigsten Fakten, Kennzahlen und Schlüsselergebnisse (3-4 Sätze).",
  "kpis": [
    { "label": "Name Kennzahl 1", "value": "Konkreter Wert mit Einheit", "subtext": "Konkreter Kontext aus Text", "color": "green" },
    { "label": "Name Kennzahl 2", "value": "Konkreter Wert mit Einheit", "subtext": "Konkreter Kontext aus Text", "color": "green" },
    { "label": "Name Kennzahl 3", "value": "Konkreter Wert mit Einheit", "subtext": "Konkreter Kontext aus Text", "color": "darkgreen" },
    { "label": "Name Kennzahl 4", "value": "Konkreter Wert mit Einheit", "subtext": "Konkreter Kontext aus Text", "color": "green" },
    { "label": "Name Kennzahl 5", "value": "Konkreter Wert mit Einheit", "subtext": "Konkreter Kontext aus Text", "color": "orange" }
  ],
  "findings": ["Erkenntnis 1 mit konkreter Zahl/Fakt", "Erkenntnis 2 mit konkreter Zahl/Fakt", "Erkenntnis 3 mit konkreter Zahl/Fakt"],
  "trends": ["Entwicklung/Trend 1 aus dem Text", "Entwicklung/Trend 2 aus dem Text"]
}

Hier ist der Originaltext des Berichts:
${text}`;

  try {
    // Verwendet strikt das aktuelle Modell gemini-3.6-flash
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "Fehler beim Aufruf der Gemini-API");
    }

    let rawContent = data.candidates[0].content.parts[0].text;
    rawContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();

    return res.status(200).json(JSON.parse(rawContent));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
