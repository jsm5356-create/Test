// IMPORTANT: To use this file, you must install the @google/genai package
// in your Vercel project's settings. Go to Settings > General > Install Command
// and add: npm install @google/genai

// This is a Vercel Serverless Function that acts as a secure backend.
// It's the only place that will use the API key.
import { GoogleGenAI, Modality } from "@google/genai";

// This is a generic handler for Vercel functions.
// We're using the `any` type for the request and response objects
// to avoid needing to install extra Vercel/Node types for this simple case.
export default async function handler(request: any, response: any) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    response.status(500).json({ error: "API_KEY 환경 변수가 설정되지 않았습니다." });
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  const body = request.body;

  try {
    switch (body.type) {
      case 'generate': {
        const geminiResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: body.prompt }],
          },
          config: {
            responseModalities: [Modality.IMAGE],
          },
        });
        
        for (const part of geminiResponse.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            response.status(200).json({ imageUrl });
            return;
          }
        }
        throw new Error("API에서 이미지 데이터를 반환하지 않았습니다.");
      }

      case 'feedback': {
        const imagePart = {
          inlineData: {
            mimeType: body.mimeType,
            data: body.base64Image.split(',')[1],
          },
        };

        const textPart = {
          text: "당신은 세계적인 UI/UX 디자인 전문가입니다. 다음 디자인에 대해 레이아웃, 색상, 타이포그래피, 사용자 경험 관점에서 건설적인 피드백을 한국어로 제공해주세요. 전문적인 용어를 사용하되 이해하기 쉽게 설명하고, 개선을 위한 구체적인 제안을 포함해주세요. 마크다운 형식으로 답변해주세요."
        };
        
        const geminiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        response.status(200).json({ feedback: geminiResponse.text });
        return;
      }

      default:
        response.status(400).json({ error: 'Invalid request type' });
        return;
    }
  } catch (error) {
    console.error("Error in serverless function:", error);
    response.status(500).json({ error: error instanceof Error ? error.message : "AI 처리 중 서버에서 오류가 발생했습니다." });
  }
}