import { GoogleGenAI, Modality } from "@google/genai";

// Helper function to get the AI client only when it's needed.
// This prevents the app from crashing on start if the API key isn't set.
const getAiClient = () => {
    let apiKey: string | undefined;

    // This check prevents a "ReferenceError: process is not defined" in a browser environment.
    if (typeof process !== 'undefined' && process.env) {
        apiKey = process.env.API_KEY;
    }

    if (!apiKey) {
        // This error will now be caught by the UI and displayed to the user,
        // instead of crashing the whole app.
        throw new Error("API 키가 설정되지 않았습니다. 호스팅 환경의 환경 변수를 확인해주세요.");
    }
    return new GoogleGenAI({ apiKey });
};

export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
  try {
    const ai = getAiClient(); // Initialize client just-in-time
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [{ text: prompt }],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }
    throw new Error("이미지 데이터를 찾을 수 없습니다.");
  } catch (error) {
    console.error("Error generating image:", error);
    // Re-throw the error so the UI can catch and display it.
    if (error instanceof Error) throw error;
    throw new Error("AI 이미지 생성에 실패했습니다. 다시 시도해 주세요.");
  }
};

export const getFeedbackOnImage = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const ai = getAiClient(); // Initialize client just-in-time
    const imagePart = {
      inlineData: {
        mimeType,
        data: base64Image.split(',')[1],
      },
    };

    const textPart = {
      text: "당신은 세계적인 UI/UX 디자인 전문가입니다. 다음 디자인에 대해 레이아웃, 색상, 타이포그래피, 사용자 경험 관점에서 건설적인 피드백을 한국어로 제공해주세요. 전문적인 용어를 사용하되 이해하기 쉽게 설명하고, 개선을 위한 구체적인 제안을 포함해주세요. 마크다운 형식으로 답변해주세요."
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    });

    return response.text;
  } catch (error) {
    console.error("Error getting feedback:", error);
    // Re-throw the error so the UI can catch and display it.
    if (error instanceof Error) throw error;
    throw new Error("AI 피드백 생성에 실패했습니다. 다시 시도해 주세요.");
  }
};
