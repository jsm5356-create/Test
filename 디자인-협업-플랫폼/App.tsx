
import React, { useState, useRef, useCallback } from 'react';
import { AppMode, DesignItem } from './types';
import { generateImageFromPrompt, getFeedbackOnImage } from './services/geminiService';
import { SparklesIcon, ChatBubbleIcon, UploadIcon } from './components/icons';
import Loader from './components/Loader';

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const Header: React.FC = () => (
    <header className="bg-slate-900/70 backdrop-blur-lg sticky top-0 z-10 py-4 px-4 md:px-8 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <SparklesIcon className="w-6 h-6 text-white"/>
        </div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
          디자인 협업 플랫폼
        </h1>
      </div>
    </header>
);

interface ControlPanelProps {
    mode: AppMode;
    setMode: (mode: AppMode) => void;
    onGenerate: (prompt: string) => Promise<void>;
    onFeedback: (file: File) => Promise<void>;
    isLoading: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ mode, setMode, onGenerate, onFeedback, isLoading }) => {
    const [prompt, setPrompt] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleGenerate = async () => {
        if (!prompt || isLoading) return;
        await onGenerate(prompt);
        setPrompt('');
    };
    
    const handleFeedback = async () => {
        if (!selectedFile || isLoading) return;
        await onFeedback(selectedFile);
        setSelectedFile(null);
        setPreviewUrl(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    };

    const isGenerateMode = mode === AppMode.Generate;

    return (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 max-w-3xl mx-auto space-y-4">
            <div className="flex bg-slate-900 p-1 rounded-lg">
                <button 
                    onClick={() => setMode(AppMode.Generate)}
                    className={`flex-1 p-2 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-200 ${isGenerateMode ? 'bg-cyan-500 text-white' : 'hover:bg-slate-700'}`}
                >
                    <SparklesIcon className="w-5 h-5" /> AI 아이디어 생성
                </button>
                <button 
                    onClick={() => setMode(AppMode.Feedback)}
                    className={`flex-1 p-2 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-200 ${!isGenerateMode ? 'bg-indigo-500 text-white' : 'hover:bg-slate-700'}`}
                >
                    <ChatBubbleIcon className="w-5 h-5" /> 디자인 피드백
                </button>
            </div>

            {isGenerateMode ? (
                <div className="flex gap-3">
                    <input 
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                        placeholder="예: 미래 도시의 미니멀한 카페 로고"
                        className="flex-grow bg-slate-900 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                        disabled={isLoading}
                    />
                    <button onClick={handleGenerate} disabled={isLoading || !prompt} className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center">
                       {isLoading ? '생성중...' : '생성'}
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-600 hover:border-indigo-500 bg-slate-900/50 rounded-lg p-8 text-center cursor-pointer transition-colors"
                    >
                        <input 
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden" 
                            disabled={isLoading}
                        />
                        {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="max-h-40 mx-auto rounded-lg"/>
                        ) : (
                            <div className="flex flex-col items-center text-slate-400">
                                <UploadIcon className="w-10 h-10 mb-2"/>
                                <p className="font-semibold">이미지를 드래그하거나 클릭하여 업로드</p>
                                <p className="text-sm">피드백을 받을 디자인 파일을 선택하세요.</p>
                            </div>
                        )}
                    </div>
                    <button onClick={handleFeedback} disabled={isLoading || !selectedFile} className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center">
                        {isLoading ? '분석중...' : 'AI 피드백 받기'}
                    </button>
                </div>
            )}
        </div>
    );
};

const DesignCard: React.FC<{ item: DesignItem }> = ({ item }) => {
    return (
        <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 transform hover:-translate-y-1 transition-transform duration-300 ease-in-out">
            <div className="aspect-w-16 aspect-h-9 bg-slate-900">
                <img src={item.imageUrl} alt={item.prompt} className="w-full h-full object-cover"/>
            </div>
            <div className="p-4">
                {item.type === AppMode.Generate && (
                    <>
                        <p className="text-xs text-cyan-400 font-semibold mb-1">생성 프롬프트</p>
                        <p className="text-sm text-slate-300">{item.prompt}</p>
                    </>
                )}
                {item.type === AppMode.Feedback && item.feedback && (
                    <>
                        <p className="text-xs text-indigo-400 font-semibold mb-2">AI 피드백</p>
                        <div 
                            className="prose prose-sm prose-invert text-slate-300 max-w-none prose-headings:text-slate-100 prose-strong:text-slate-100 prose-a:text-cyan-400"
                            dangerouslySetInnerHTML={{ __html: item.feedback.replace(/\n/g, '<br />') }}
                        />
                    </>
                )}
            </div>
        </div>
    );
};


const App: React.FC = () => {
    const [mode, setMode] = useState<AppMode>(AppMode.Generate);
    const [designItems, setDesignItems] = useState<DesignItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = useCallback(async (prompt: string) => {
        setIsLoading(true);
        setLoadingMessage('AI가 이미지를 생성하고 있습니다...');
        setError(null);
        try {
            const imageUrl = await generateImageFromPrompt(prompt);
            const newItem: DesignItem = {
                id: new Date().toISOString(),
                type: AppMode.Generate,
                imageUrl,
                prompt,
            };
            setDesignItems(prev => [newItem, ...prev]);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleFeedback = useCallback(async (file: File) => {
        setIsLoading(true);
        setLoadingMessage('AI가 디자인을 분석하고 있습니다...');
        setError(null);
        try {
            const base64Image = await fileToBase64(file);
            const feedback = await getFeedbackOnImage(base64Image, file.type);
            const newItem: DesignItem = {
                id: new Date().toISOString(),
                type: AppMode.Feedback,
                imageUrl: base64Image,
                prompt: file.name,
                feedback,
            };
            setDesignItems(prev => [newItem, ...prev]);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 font-sans">
            {isLoading && <Loader message={loadingMessage} />}
            <Header />
            <main className="p-4 md:p-8">
                <div className="space-y-8">
                    <ControlPanel 
                        mode={mode} 
                        setMode={setMode} 
                        onGenerate={handleGenerate}
                        onFeedback={handleFeedback}
                        isLoading={isLoading}
                    />

                    {error && (
                        <div className="max-w-3xl mx-auto bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">
                            <p className="font-bold">오류 발생</p>
                            <p>{error}</p>
                        </div>
                    )}
                    
                    {designItems.length > 0 ? (
                        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           {designItems.map(item => <DesignCard key={item.id} item={item} />)}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-slate-500">
                            <p className="text-lg font-semibold">아직 생성된 아이템이 없습니다.</p>
                            <p>AI로 새로운 아이디어를 생성하거나 디자인 피드백을 요청해보세요.</p>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default App;
