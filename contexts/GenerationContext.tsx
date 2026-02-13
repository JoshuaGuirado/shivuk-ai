
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generatePostContent, generateVeoVideo, generateVideoCaption, generateImageCaption, GeneratedContent } from '../services/gemini';
import { useLibrary } from './LibraryContext';
import { useBrand } from './BrandContext';

export interface Persona { id: string; label: string; desc: string; }
export interface Platform { id: string; label: string; icon: string; }

export type GenerationMode = 'post' | 'video' | 'caption';

// Interfaces para a Sessão
export interface SessionPost extends GeneratedContent {
  id: string;
  timestamp: number;
}

export interface SessionVideo {
  id: string;
  url: string;
  caption: string;
  timestamp: number;
}

interface GenerationContextType {
  mode: GenerationMode; setMode: (m: GenerationMode) => void;
  persona: Persona; setPersona: (p: Persona) => void;
  platform: Platform; setPlatform: (p: Platform) => void;
  style: string; setStyle: (s: string) => void;
  prompt: string; setPrompt: React.Dispatch<React.SetStateAction<string>>;
  attachedImage: string | null; setAttachedImage: (s: string | null) => void;
  
  targetFolderId: string | undefined; 
  setTargetFolderId: (id: string | undefined) => void;

  isGenerating: boolean;
  pipelineStep: number;
  
  // Arrays para armazenar histórico da sessão atual
  sessionPosts: SessionPost[];
  sessionCaptions: SessionPost[];
  sessionVideos: SessionVideo[];
  
  startGeneration: () => Promise<void>;
  resetResult: () => void;
}

const DEFAULT_PERSONAS: Persona[] = [
  { id: 'joshua', label: 'Joshua — Analítico', desc: 'Focado em dados, lógica, métricas e growth hacking.' },
  { id: 'gabriel', label: 'Gabriel — Estratégia de Funil', desc: 'Especialista em etapas de consciência e conversão.' },
  { id: 'caelum', label: 'Caelum — Conexão Humana', desc: 'Empático, focado em storytelling, branding e comunidade.' },
  { id: 'nyx', label: 'Nyx — Vendas (Hard Sell)', desc: 'Persuasiva, agressiva, uso de gatilhos mentais e fechamento.' },
  { id: 'ziggy', label: 'Ziggy — Humor & Entretenimento', desc: 'Engraçada, usa memes, sarcasmo leve e situações relacionáveis.' },
  { id: 'kai', label: 'Kai — Hype & Trends', desc: 'Conectado, linguagem Gen-Z, focado em virais e tendências.' },
  { id: 'solara', label: 'Solara — Sofisticação & Luxo', desc: 'Elegante, minimalista, focada em exclusividade e alto padrão.' }
];

const DEFAULT_PLATFORMS: Platform[] = [
  { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'twitter', label: 'Twitter/X', icon: '🐦' }
];

const GenerationContext = createContext<GenerationContextType | undefined>(undefined);

export function GenerationProvider({ children }: { children?: ReactNode }) {
  const { addItem } = useLibrary();
  const { brand } = useBrand();

  const [mode, setMode] = useState<GenerationMode>('post');
  const [persona, setPersona] = useState<Persona>(DEFAULT_PERSONAS[0]);
  const [platform, setPlatform] = useState<Platform>(DEFAULT_PLATFORMS[0]);
  const [style, setStyle] = useState('Minimalista (Apple Style)');
  const [prompt, setPrompt] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  
  const [targetFolderId, setTargetFolderId] = useState<string | undefined>(undefined);

  const [isGenerating, setIsGenerating] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  
  const [sessionPosts, setSessionPosts] = useState<SessionPost[]>([]);
  const [sessionCaptions, setSessionCaptions] = useState<SessionPost[]>([]);
  const [sessionVideos, setSessionVideos] = useState<SessionVideo[]>([]);

  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      interval = setInterval(() => {
        setPipelineStep((prev) => (prev < 4 ? prev + 1 : prev));
      }, mode === 'video' ? 5000 : 2000); 
    } else {
      setPipelineStep(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating, mode]);

  const startGeneration = async () => {
    if (isGenerating) return;
    if (mode === 'caption' && !attachedImage) {
        alert("Para gerar legenda, você deve enviar uma imagem.");
        return;
    }
    if ((!prompt.trim() && !attachedImage)) return;
    
    const currentPrompt = prompt;
    const currentImage = attachedImage;
    
    setPrompt(''); 
    setAttachedImage(null);
    setIsGenerating(true);
    setPipelineStep(1);

    try {
      if (mode === 'video') {
        // Veo Generation
        const veoprompt = `${style} style. ${currentPrompt}`;
        const [videoUrl, caption] = await Promise.all([
            generateVeoVideo(veoprompt, currentImage),
            generateVideoCaption(`${currentPrompt}. Estilo: ${style}. Persona: ${persona.label}. Plataforma: ${platform.label}`)
        ]);
        const newVideo: SessionVideo = {
            id: crypto.randomUUID(),
            url: videoUrl,
            caption: caption,
            timestamp: Date.now()
        };
        setSessionVideos(prev => [newVideo, ...prev]);
        
      } else if (mode === 'caption') {
         // Caption Mode
         if (!currentImage) throw new Error("Image Required for Caption Mode");
         const data = await generateImageCaption(currentImage, currentPrompt);
         addItem({ ...data, brandName: brand.name, brandColor: brand.colors.primary, platformId: platform.id, personaId: persona.id, folderId: targetFolderId, imageSearchTerm: data.imagePrompt, imageUrl: data.generatedImageUrl });
         const newPost: SessionPost = { ...data, id: crypto.randomUUID(), timestamp: Date.now() };
         setSessionCaptions(prev => [newPost, ...prev]);

      } else {
        // Post Mode
        const fullPrompt = `MARCA: ${brand.name}. PERSONA: ${persona.label}. ESTILO: ${style}. PEDIDO: ${currentPrompt}`;
        const data = await generatePostContent(fullPrompt, currentImage);
        addItem({ ...data, brandName: brand.name, brandColor: brand.colors.primary, platformId: platform.id, personaId: persona.id, folderId: targetFolderId, imageSearchTerm: data.imagePrompt, imageUrl: data.generatedImageUrl });
        const newPost: SessionPost = { ...data, id: crypto.randomUUID(), timestamp: Date.now() };
        setSessionPosts(prev => [newPost, ...prev]);
      }
    } catch (error) {
      setPrompt(currentPrompt); 
      setAttachedImage(currentImage);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const resetResult = () => {
      setSessionPosts([]);
      setSessionCaptions([]);
      setSessionVideos([]);
  };

  return (
    <GenerationContext.Provider value={{
      mode, setMode,
      persona, setPersona, platform, setPlatform, style, setStyle, prompt, setPrompt,
      attachedImage, setAttachedImage,
      targetFolderId, setTargetFolderId,
      isGenerating, pipelineStep, 
      sessionPosts, sessionCaptions, sessionVideos,
      startGeneration, resetResult
    }}>
      {children}
    </GenerationContext.Provider>
  );
}

export const useGeneration = () => {
  const context = useContext(GenerationContext);
  if (!context) throw new Error("useGeneration deve ser usado dentro de um GenerationProvider");
  return context;
};
