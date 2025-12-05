import { GoogleGenAI } from "@google/genai";
import { SEO_SYSTEM_INSTRUCTION } from "../constants";
import { AuditRequest, AuditResponse } from "../types";

export const generateAudit = async (request: AuditRequest): Promise<AuditResponse> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Analysiere diese Webseite: ${request.url}
    ${request.industry ? `Branche: ${request.industry}` : ''}
    ${request.goal ? `Ziel: ${request.goal}` : ''}
    
    Erstelle einen detaillierten Audit mit Checklisten.
    ANTWORTE AUSSCHLIESSLICH MIT DEM JSON-OBJEKT. KEIN MARKDOWN, KEIN PREAMBLE.
  `;

  try {
    // Note: We cannot use responseMimeType: 'application/json' or responseSchema
    // simultaneously with tools: [{ googleSearch: {} }] due to API limitations.
    // We rely on the System Instruction and prompt to ensure JSON output.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SEO_SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        temperature: 0.5,
      },
    });

    let jsonText = response.text;
    if (!jsonText) throw new Error("Keine Daten erhalten.");

    // Clean up potential markdown code blocks (e.g. ```json ... ```)
    jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    
    // Robustly find the JSON object within the text
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    }

    let auditData;
    try {
      auditData = JSON.parse(jsonText);
    } catch (e) {
      console.error("JSON Parse Error. Received text:", jsonText);
      throw new Error("Die KI-Antwort konnte nicht als gültiges JSON verarbeitet werden.");
    }

    // Generate a screenshot URL
    const encodedUrl = encodeURIComponent(request.url);
    const screenshotUrl = `https://s0.wp.com/mshots/v1/${encodedUrl}?w=1200&h=800`;

    return {
      data: auditData,
      screenshotUrl
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Fehler bei der Audit-Erstellung. Bitte prüfen Sie die URL oder versuchen Sie es später erneut.");
  }
};