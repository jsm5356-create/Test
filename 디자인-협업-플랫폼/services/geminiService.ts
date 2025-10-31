// This service now communicates with our own backend endpoint instead of Google's directly.
// This is more secure as our API key is never exposed to the browser.

interface GenerateImageResponse {
  imageUrl: string;
}

interface FeedbackResponse {
  feedback: string;
}

interface ErrorResponse {
  error: string;
}

const apiRequest = async (body: object): Promise<any> => {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json().catch(() => ({ error: '알 수 없는 서버 오류가 발생했습니다.' }));
    throw new Error(errorData.error || `서버 오류: ${response.statusText}`);
  }

  return response.json();
}

export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
  try {
    const data: GenerateImageResponse = await apiRequest({
      type: 'generate',
      prompt,
    });
    return data.imageUrl;
  } catch (error) {
    console.error("Error generating image via backend:", error);
    if (error instanceof Error) throw error;
    throw new Error("AI 이미지 생성에 실패했습니다. 다시 시도해 주세요.");
  }
};

export const getFeedbackOnImage = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const data: FeedbackResponse = await apiRequest({
      type: 'feedback',
      base64Image,
      mimeType,
    });
    return data.feedback;
  } catch (error) {
    console.error("Error getting feedback via backend:", error);
    if (error instanceof Error) throw error;
    throw new Error("AI 피드백 생성에 실패했습니다. 다시 시도해 주세요.");
  }
};