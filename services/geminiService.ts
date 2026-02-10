import { GoogleGenAI } from "@google/genai";

// Circuit breaker: If true, we stop calling the API to prevent console errors
let isQuotaExceeded = false;

const FALLBACK_BANTER: Record<string, string[]> = {
  "BERSERK": ["I WILL CRUSH YOU!", "DIE! DIE! DIE!", "BLOOD FOR THE GODS!", "RAAAAGH!", "UNSTOPPABLE!"],
  "RUTHLESS": ["Pathetic weakling.", "You cannot survive.", "End this futile resistance.", "Despair.", "Your time is up."],
  "AGGRESSIVE": ["I'm coming for you!", "No escape!", "Feel my wrath!", "You are weak!", "Face me!"],
  "CAUTIOUS": ["You are dangerous...", "I must observe.", "Keeping my distance.", "Calculated moves.", "Wait for it..."],
  "DEFENSIVE": ["Stay back!", "I need to recover!", "You won't get through!", "Shields up!", "Back off!"],
  "IDLE": ["...", "Hmph.", "Make your move.", "Waiting...", "Are you done?"],
  "DEFAULT": ["Prepare yourself!", "I am the Guardian!", "You shall not pass!"]
};

function getFallback(state: string): string {
    const phrases = FALLBACK_BANTER[state] || FALLBACK_BANTER["DEFAULT"];
    return phrases[Math.floor(Math.random() * phrases.length)];
}

export const generateEnemyBanter = async (state: string, playerHp: number, enemyHp: number): Promise<string> => {
  if (isQuotaExceeded) return getFallback(state);

  const prompt = `
    You are a fantasy RPG boss monster. 
    Current State: ${state}.
    My HP: ${enemyHp}%.
    Player HP: ${playerHp}%.
    Write a VERY short, punchy line of dialogue (max 10 words). No quotes.
  `;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || getFallback(state);
  } catch (error: any) {
    if (error?.message?.includes('429') || error?.status === 429 || error?.code === 429) {
        if (!isQuotaExceeded) {
            console.warn("Gemini Quota Exceeded (429). Switching to offline fallback mode.");
            isQuotaExceeded = true;
        }
    }
    return getFallback(state);
  }
};