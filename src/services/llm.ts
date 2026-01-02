
import { GoogleGenerativeAI } from "@google/generative-ai";
import { type UniProtData } from "./uniprot";

export interface AIContext {
    pdbId: string | null;
    title: string | null;
    highlightedResidue: any;
    uniprot: UniProtData | null;
    chains: { name: string, sequence: string }[] | undefined;
    stats: any;
}

export interface LLMResponse {
    text: string;
    actions: any[];
}

export const generateAIResponse = async (
    apiKey: string,
    history: { role: "user" | "model", parts: string }[],
    query: string,
    context: AIContext,
    modelName: string = "gemini-1.5-flash"
): Promise<LLMResponse> => {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);

        // Construct System Context
        const systemPrompt = `You are Dr. AI, an expert structural biologist assistant inside a 3D Protein Viewer.
        
CURRENT MOLECULE:
- PDB ID: ${context.pdbId || "None"}
- Title: ${context.title || "Unknown"}
- Chains: ${context.chains?.map(c => c.name).join(', ') || "Unknown"}
- Stats: ${JSON.stringify(context.stats)}

PROTEIN DATA (UNIPROT):
${context.uniprot ? JSON.stringify(context.uniprot) : "Not loaded."}

CAPABILITIES:
You can control the 3D viewer. To do so, you MUST output a JSON object in your response (markdown code block optional but preferred).
The available actions are:
1. SET_COLORING: { "type": "SET_COLORING", "value": "hydrophobicity" | "element" | "residueindex" | "chainid" | "structure" | "bfactor" }
2. SET_REPRESENTATION: { "type": "SET_REPRESENTATION", "value": "cartoon" | "ball+stick" | "surface" | "line" | "ribbon" }
3. TOGGLE_SURFACE: { "type": "TOGGLE_SURFACE", "value": true | false }
4. RESET_VIEW: { "type": "RESET_VIEW" }
5. HIGHLIGHT_REGION: { "type": "HIGHLIGHT_REGION", "selection": "10-20:A", "label": "Active Site" } (Use NGL selection syntax: 'start-end:CHAIN')

INSTRUCTIONS:
- Answer the user's question clearly and scientifically.
- If they ask to see something, generate the appropriate JSON action.
- You can generate multiple actions if needed, wrap them in a JSON array.
- Be concise but helpful.
`;

        // Use selected model
        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemPrompt
        });

        const chat = model.startChat({
            history: history.map(h => ({ role: h.role, parts: [{ text: h.parts }] })),
            generationConfig: {
                maxOutputTokens: 500,
            }
        });

        const result = await chat.sendMessage(query);
        const responseText = result.response.text();

        // Parse Actions
        const actions: any[] = [];
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            try {
                const jsonStr = jsonMatch[1] || jsonMatch[0];
                const parsed = JSON.parse(jsonStr);
                if (Array.isArray(parsed)) {
                    actions.push(...parsed);
                } else {
                    actions.push(parsed);
                }
            } catch (e) {
                console.warn("Failed to parse LLM JSON action", e);
            }
        }

        // Clean text (remove JSON block)
        const cleanText = responseText.replace(/```json\n[\s\S]*?\n```/g, '').trim();

        return {
            text: cleanText || responseText, // Fallback if entire response was JSON
            actions
        };

    } catch (error: any) {
        console.error("Gemini API Error:", error);
        let errorMsg = "⚠️ Error connecting to Gemini.";

        if (error.message) {
            if (error.message.includes("403")) errorMsg += " (403 Forbidden: Invalid API Key or Location not supported).";
            else if (error.message.includes("404")) errorMsg += " (404 Not Found: Model may be unavailable).";
            else errorMsg += ` (${error.message})`;
        }

        return { text: errorMsg, actions: [] };
    }
};
