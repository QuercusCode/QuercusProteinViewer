
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
    context: AIContext
): Promise<LLMResponse> => {
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Use flash for speed, or pro for better reasoning
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Construct System Context
        let systemPrompt = `You are Dr. AI, an expert structural biologist assistant inside a 3D Protein Viewer.
        
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

        // We append system prompt as the first part of the conversation or handle it via system instruction (not fully exposed in simple API yet, so we prepend).
        // Actually, gemini-1.5 supports systemInstruction. Let's try to use it if creating chat, or just unshift history.

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: "SYSTEM INSTRUCTION:\n" + systemPrompt }]
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I am Dr. AI. I recall the context and tools." }]
                },
                ...history.map(h => ({ role: h.role, parts: [{ text: h.parts }] }))
            ],
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

    } catch (error) {
        console.error("Gemini API Error:", error);
        return { text: "⚠️ Error connecting to Gemini. Please check your API Key.", actions: [] };
    }
};
