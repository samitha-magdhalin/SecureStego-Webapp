
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getAIEvaluation = async (url: string, riskData: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform a technical cybersecurity evaluation of this URL for a dedicated phishing detection product.
      URL: ${url}
      Calculated Risk Score: ${riskData.riskScore}
      IDNA Punycode: ${riskData.punycode}
      Is Homograph: ${riskData.isHomograph}
      
      Provide:
      1. A professional summary (2 sentences).
      2. If homograph, specify exactly which characters are confusable (e.g., "U+0435 Cyrillic e instead of Latin e").
      3. A technical severity rating explanation.`,
      config: {
        temperature: 0.2, // Lower temperature for more analytical consistency
      }
    });
    return response.text || "Technical audit unavailable.";
  } catch (error) {
    console.error("Gemini Evaluation Error:", error);
    return "AI-driven technical audit currently offline. Utilizing local heuristic engine.";
  }
};

export const generateQuizQuestions = async () => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Generate 5 sophisticated homograph phishing pairs for enterprise training. Include specific character code point details in the explanation. Format as JSON array.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              legitimateUrl: { type: Type.STRING },
              fakeUrl: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["id", "legitimateUrl", "fakeUrl", "explanation"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Quiz Generation Error:", error);
    return [
      { id: 1, legitimateUrl: "google.com", fakeUrl: "googIe.com", explanation: "Uses uppercase 'I' (U+0049) to mimic lowercase 'l' (U+006C)." },
      { id: 2, legitimateUrl: "apple.com", fakeUrl: "applе.com", explanation: "Uses Cyrillic 'е' (U+0435) instead of Latin 'e' (U+0065)." }
    ];
  }
};
