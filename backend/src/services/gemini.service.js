import { GoogleGenAI } from "@google/genai";

export const summarizeTranscript = async (transcriptText) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("Missing Gemini API Key");

        const ai = new GoogleGenAI({ apiKey: apiKey });

        const prompt = `
You are an expert AI meeting assistant. Below is a transcript of a video call.
Analyze the transcript and generate a summary, a list of key decisions made, and a list of action items.

You MUST return your response as a valid JSON object with the exact following shape, and nothing else. Do not include markdown code fences (like \`\`\`json).
{
  "summary": "A 3-4 sentence summary of the meeting",
  "decisions": ["decision 1", "decision 2"],
  "action_items": ["action 1", "action 2"]
}

Transcript:
${transcriptText}
`;

        console.log(`[Gemini] Starting summarization of transcript (${transcriptText.length} chars)...`);
        
        let response;
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                response = await ai.models.generateContent({
                    model: 'gemini-3.6-flash',
                    contents: prompt,
                });
                break; // Success
            } catch (err) {
                const isOverloaded = err.status === 503 || err.status === '503' || (err.message && err.message.includes('high demand')) || (err.message && err.message.includes('503'));
                
                if (isOverloaded && attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000;
                    console.warn(`[Gemini] Model overloaded (503). Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    throw err; // Throw if not 503 or max retries reached
                }
            }
        }

        let responseText = response.text;
        
        // Strip markdown code fences if Gemini included them despite instructions
        if (responseText.startsWith('```json')) {
            responseText = responseText.replace(/^```json\n/, '').replace(/\n```$/, '');
        } else if (responseText.startsWith('```')) {
            responseText = responseText.replace(/^```\n/, '').replace(/\n```$/, '');
        }

        const parsedResult = JSON.parse(responseText);
        console.log(`[Gemini] Summarization completed successfully.`);
        
        return {
            summary: parsedResult.summary || "",
            decisions: parsedResult.decisions || [],
            actionItems: parsedResult.actionItems || []
        };

    } catch (error) {
        console.error(`[Gemini] Service Error:`, error);
        throw error;
    }
};
