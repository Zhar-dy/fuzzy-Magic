
import { GoogleGenAI, Modality } from "@google/genai";

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

export const generateEnemyBanter = async (state: string, playerHp: number, enemyHp: number, activeRule: string): Promise<string> => {
  if (isQuotaExceeded) return getFallback(state);

  const prompt = `
    You are a fantasy RPG boss monster. 
    Current State: ${state}.
    My HP: ${enemyHp}%.
    Player HP: ${playerHp}%.
    Reason for Behavior: "${activeRule}".
    Write a VERY short, punchy line of dialogue (max 10 words) reflecting this reason. No quotes.
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

// --- NARRATOR SERVICE ---

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<AudioBuffer | null> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Say clearly and professionally: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) return null;

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const audioBuffer = await decodeAudioData(
            decodeBase64(base64Audio),
            audioContext,
            24000,
            1,
        );
        return audioBuffer;
    } catch (e) {
        console.error("Speech generation failed", e);
        return null;
    }
};
