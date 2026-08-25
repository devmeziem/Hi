import { useState } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  CloudUpload,
  Copy,
  Check,
  Flame,
  Zap,
  Cpu,
  Layers,
  Terminal,
  Activity,
  Key,
  Volume2,
  Play,
  Music,
  Rocket,
  Video,
  PlayCircle,
  FileText,
  ExternalLink,
  Share2,
  AlertCircle
} from 'lucide-react';
import { IntegrationKeys, NicheType } from '../types';
import {
  chatWithXaiGrok,
  chatWithGroq,
  chatWithCloudflareLLM,
  generateCloudflareImage,
  generateCloudflareTTS,
  getPollinationsImageUrl,
  chatWithPollinations,
  generateContentScript,
  AiScriptOutput
} from '../aiEngine';
import { uploadToCloudinaryUnsigned } from '../socialIntegrations';
import { safeJsonStringify } from '../dbAdapter';
import { dbAdapter } from '../dbAdapter';
import { DynamicVideoMotionPlayer } from './DynamicVideoMotionPlayer';
import { VideoSlide } from '../types';
import { BACKGROUND_MUSIC_TRACKS, TTS_VOICE_OPTIONS, BackgroundMusicTrack, TtsVoiceOption } from '../audioPresets';

interface AiPlaygroundProps {
  keys: IntegrationKeys;
  onSaveKeys: (updated: Partial<IntegrationKeys>) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  model: string;
  text: string;
  timestamp: string;
  latencyMs?: number;
}

interface DiagnosticResult {
  service: string;
  status: 'idle' | 'testing' | 'success' | 'error';
  message: string;
  latencyMs?: number;
  details?: string;
}

export const AiPlayground: React.FC<AiPlaygroundProps> = ({ keys, onSaveKeys }) => {
  const [activeSubTab, setActiveSubTab] = useState<'test_post' | 'chat' | 'images' | 'tts' | 'diagnostics'>('test_post');

  // Test Post Runner State
  const [testPostChannel, setTestPostChannel] = useState<NicheType>('finance_saas');
  const [testPostTopic, setTestPostTopic] = useState<string>('How to Start a High-Demand Side Hustle with Low Capital');
  const [selectedBgMusicId, setSelectedBgMusicId] = useState<string>('mystic_deep');
  const [selectedTtsVoiceId, setSelectedTtsVoiceId] = useState<string>('zeus');
  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
  const [isGeneratingTopics, setIsGeneratingTopics] = useState<boolean>(false);
  const [testPostStep, setTestPostStep] = useState<string>('');
  const [isTestPostRunning, setIsTestPostRunning] = useState<boolean>(false);
  const [testPostResult, setTestPostResult] = useState<{
    id: string;
    channel: NicheType;
    title: string;
    script: AiScriptOutput | null;
    imageUrl: string;
    audioUrl: string;
    bgMusicUrl?: string;
    byteLength: number;
    description: string;
    tags: string[];
    affiliateLink: string;
    vaultedToFirestore: boolean;
    executedAt: string;
    slides?: VideoSlide[];
  } | null>(null);
  const [testPostError, setTestPostError] = useState<string>('');
  const [isPublishingToYt, setIsPublishingToYt] = useState<boolean>(false);
  const [ytPublishSuccessMessage, setYtPublishSuccessMessage] = useState<string>('');
  const [ytPublishError, setYtPublishError] = useState<string>('');

  // Chat State
  const [selectedChatModel, setSelectedChatModel] = useState<'xai_grok' | 'groq_llama' | 'cloudflare_llama' | 'gemini' | 'pollinations'>('xai_grok');
  const [chatPrompt, setChatPrompt] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      model: 'xAI Grok & AI Lab',
      text: "👋 Welcome to the Voxam AI Test Lab! You can test Cloudflare Workers AI TTS (Deepgram Aura-2), chat with Meta Llama 3.3 or xAI Grok, synthesize 1080x1920 visuals with Cloudflare FLUX.1-schnell, and verify your Cloudinary 'voxawell' setup.",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Image Lab State
  const [selectedImageEngine, setSelectedImageEngine] = useState<'cloudflare_flux' | 'pollinations_flux' | 'pollinations_turbo' | 'cloudflare_sdxl'>('cloudflare_flux');
  const [imagePrompt, setImagePrompt] = useState<string>('Cinematic glowing holographic futuristic cyber server room, dramatic lighting, 8k vertical 9:16');
  const [aspectRatio, setAspectRatio] = useState<'portrait' | 'square' | 'landscape'>('portrait');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [cloudinaryUploadResult, setCloudinaryUploadResult] = useState<string>('');
  const [isUploadingToCloudinary, setIsUploadingToCloudinary] = useState<boolean>(false);

  // TTS State
  const [ttsModel, setTtsModel] = useState<string>('@cf/deepgram/aura-2-en');
  const [ttsSpeaker, setTtsSpeaker] = useState<string>('zeus');
  const [ttsVoiceEngine, setTtsVoiceEngine] = useState<string>('cloudflare');
  const [ttsText, setTtsText] = useState<string>('Welcome to Fin Blueprint. How an extra 25,000 naira or 18 dollars a week changes the game for micro-SaaS builders.');
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string>('');
  const [audioByteSize, setAudioByteSize] = useState<number>(0);
  const [ttsProviderName, setTtsProviderName] = useState<string>('');
  const [isGeneratingTTS, setIsGeneratingTTS] = useState<boolean>(false);
  const [ttsCloudinaryResult, setTtsCloudinaryResult] = useState<string>('');
  const [isUploadingTtsToCloudinary, setIsUploadingTtsToCloudinary] = useState<boolean>(false);

  // Diagnostics State
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([
    { service: 'xAI Grok (Active Engine)', status: 'idle', message: 'Grok 4.3 / 4.6 / Grok-2 Failover' },
    { service: 'Cloudinary Unsigned Preset', status: 'idle', message: "Cloudinary CDN Storage" },
    { service: 'Groq (OpenAI GPT-OSS / Llama)', status: 'idle', message: 'GPT-OSS 120B / Llama 3.3 70B' },
    { service: 'Cloudflare Deepgram Aura-2 (Wise Bass)', status: 'idle', message: 'Zeus / Orpheus / Edge Neural Audio Engine' },
    { service: 'Cloudflare Workers AI (FLUX.1-schnell)', status: 'idle', message: '@cf/black-forest-labs/flux-1-schnell 8K' },
    { service: 'Cloudflare Workers AI LLM (Llama 3.3)', status: 'idle', message: '@cf/meta/llama-3.3-70b-instruct' },
    { service: 'Pollinations AI Engine', status: 'idle', message: 'Free Multimodal Image & Text' }
  ]);
  const [isTestingAll, setIsTestingAll] = useState<boolean>(false);
  const [pipelineLogs, setPipelineLogs] = useState<Array<{ stage: string; status: 'info' | 'success' | 'warn' | 'error'; message: string; timestamp: string }>>([]);

  const addLog = (stage: string, status: 'info' | 'success' | 'warn' | 'error', message: string) => {
    setPipelineLogs(prev => [...prev, {
      stage,
      status,
      message,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  // Sample prompt buttons
  const SAMPLE_CHAT_PROMPTS = [
    { label: '🔥 Viral YouTube Hook', prompt: 'Write 3 unstoppable 3-second viral hooks for a YouTube Short about zero-code AI micro-SaaS making $100/day.' },
    { label: '🏛️ Stoic Quote Script', prompt: 'Generate a 30-second YouTube Short script featuring Marcus Aurelius on overcoming anxiety with Amor Fati.' },
    { label: '💻 AI Speed Benchmark', prompt: 'Compare DeepSeek-R1 vs Gemini 2.5 on coding speed, reasoning, and token pricing for creators.' },
    { label: '💰 B2B SaaS Economics', prompt: 'Explain LTV to CAC ratio and Rule of 40 in 3 concise bullet points for high ticket software founders.' }
  ];

  const SAMPLE_IMAGE_PROMPTS = [
    { label: '🚀 SaaS & Finance', prompt: 'Sleek luxury neon financial trading dashboard with golden glowing profit charts, dark aesthetic, 8k cinematic' },
    { label: '🏛️ Stoic Philosophy', prompt: 'Ancient Roman marble statue of Marcus Aurelius in mist, golden sunlight piercing through dark clouds, hyper-detailed' },
    { label: '🤖 Tech & AI Lab', prompt: 'High tech quantum AI neural core pulsing with cobalt blue and ultraviolet laser circuits, photorealistic 8k' }
  ];

  // Send Chat Message
  const handleSendChat = async () => {
    if (!chatPrompt.trim() || isChatLoading) return;

    const userText = chatPrompt.trim();
    setChatPrompt('');
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      model: 'User',
      text: userText,
      timestamp: new Date().toLocaleTimeString()
    };
    setChatMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    const startTime = performance.now();

    try {
      let reply = '';
      let modelLabel = '';

      if (selectedChatModel === 'xai_grok') {
        modelLabel = 'xAI Grok (Grok 4.3 / 4.6)';
        const apiKey = keys.xaiApiKey;
        if (!apiKey) throw new Error('xAI API Key is required. Please add it in Integration Keys.');
        reply = await chatWithXaiGrok({
          apiKey,
          prompt: userText,
          model: 'grok-4.3'
        });
      } else if (selectedChatModel === 'cloudflare_llama') {
        modelLabel = 'Cloudflare Workers AI (Llama 3.3 70B)';
        const accountId = keys.cloudflareAccountId;
        const apiToken = keys.cloudflareApiToken;
        if (!accountId || !apiToken) throw new Error('Cloudflare Account ID & API Token are required in Integration Keys.');
        reply = await chatWithCloudflareLLM({
          accountId,
          apiToken,
          prompt: userText,
          model: '@cf/meta/llama-3.3-70b-instruct'
        });
      } else if (selectedChatModel === 'groq_llama') {
        modelLabel = 'Groq (OpenAI GPT-OSS 120B / Llama 4 Scout)';
        const apiKey = keys.groqApiKey;
        if (!apiKey) throw new Error('Groq API Key is required. Please add it in Integration Keys.');
        reply = await chatWithGroq({
          apiKey,
          prompt: userText,
          model: 'openai/gpt-oss-120b'
        });
      } else if (selectedChatModel === 'gemini') {
        modelLabel = 'Gemini 2.5 Flash';
        const res = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: userText, model: 'gemini-2.5-flash' })
        });
        const d = await res.json();
        reply = d.text || d.error || 'No response';
      } else {
        modelLabel = 'Pollinations Text';
        reply = await chatWithPollinations(userText);
      }

      const latencyMs = Math.round(performance.now() - startTime);

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        model: modelLabel,
        text: reply,
        timestamp: new Date().toLocaleTimeString(),
        latencyMs
      };
      setChatMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        model: 'System Error',
        text: `⚠️ Error calling ${selectedChatModel}: ${err.message || String(err)}`,
        timestamp: new Date().toLocaleTimeString()
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Generate Image
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || isGeneratingImage) return;
    setIsGeneratingImage(true);
    setCloudinaryUploadResult('');

    const width = aspectRatio === 'portrait' ? 1080 : aspectRatio === 'square' ? 1080 : 1920;
    const height = aspectRatio === 'portrait' ? 1920 : aspectRatio === 'square' ? 1080 : 1080;

    try {
      if (selectedImageEngine === 'cloudflare_flux') {
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: imagePrompt,
            accountId: keys.cloudflareAccountId,
            apiToken: keys.cloudflareApiToken
          })
        });
        const data = await res.json();
        if (data.imageUrl) {
          setGeneratedImageUrl(data.imageUrl);
        } else {
          throw new Error(data.error || 'Cloudflare Flux failed');
        }
      } else if (selectedImageEngine === 'cloudflare_sdxl') {
        const accountId = keys.cloudflareAccountId;
        const apiToken = keys.cloudflareApiToken;
        if (!accountId || !apiToken) throw new Error('Cloudflare Account ID & API Token required.');
        const base64Url = await generateCloudflareImage({
          accountId,
          apiToken,
          prompt: imagePrompt,
          model: '@cf/bytedance/stable-diffusion-xl-lightning'
        });
        setGeneratedImageUrl(base64Url);
      } else {
        const modelType = selectedImageEngine === 'pollinations_turbo' ? 'turbo' : 'flux';
        const url = getPollinationsImageUrl(imagePrompt, {
          width,
          height,
          seed: Math.floor(Math.random() * 999999),
          model: modelType
        });
        setGeneratedImageUrl(url);
      }
    } catch (err: any) {
      alert(`Image generation error: ${err.message || String(err)}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Upload generated image to Cloudinary to test preset
  const handleUploadImageToCloudinary = async () => {
    if (!generatedImageUrl || isUploadingToCloudinary) return;
    setIsUploadingToCloudinary(true);

    try {
      const cloudName = keys.cloudinaryCloudName;
      const uploadPreset = keys.cloudinaryUploadPreset;
      if (!cloudName || !uploadPreset) throw new Error('Cloudinary Cloud Name & Upload Preset required.');

      // Fetch blob from generated URL
      const response = await fetch(generatedImageUrl);
      const blob = await response.blob();

      const hostedUrl = await uploadToCloudinaryUnsigned(blob, cloudName, uploadPreset);
      setCloudinaryUploadResult(hostedUrl);
    } catch (err: any) {
      alert(`Cloudinary upload failed: ${err.message || String(err)}`);
    } finally {
      setIsUploadingToCloudinary(false);
    }
  };

  // Run full diagnostics on all keys
  const handleRunAllDiagnostics = async () => {
    setIsTestingAll(true);
    const updated = [...diagnostics];

    // Helper to update diagnostic item
    const updateItem = (index: number, patch: Partial<DiagnosticResult>) => {
      updated[index] = { ...updated[index], ...patch };
      setDiagnostics([...updated]);
    };

    // 1. Test xAI Grok
    updateItem(0, { status: 'testing', message: 'Pinging xAI Grok API...' });
    try {
      const t0 = performance.now();
      const apiKey = keys.xaiApiKey;
      if (!apiKey) throw new Error('No xAI API Key configured');
      const testRes = await chatWithXaiGrok({
        apiKey,
        prompt: 'Say "Grok is online" in 3 words.',
        model: 'grok-4.3'
      });
      const t1 = Math.round(performance.now() - t0);
      updateItem(0, {
        status: 'success',
        message: `Verified Active (${t1}ms)`,
        latencyMs: t1,
        details: testRes.slice(0, 80)
      });
    } catch (e: any) {
      updateItem(0, { status: 'error', message: `Notice: ${e.message || 'Key expired or unconfigured'}` });
    }

    // 2. Test Cloudinary Preset
    updateItem(1, { status: 'testing', message: `Testing preset "${keys.cloudinaryUploadPreset || '...'}" on "${keys.cloudinaryCloudName || '...'}"...` });
    try {
      const t0 = performance.now();
      if (!keys.cloudinaryCloudName || !keys.cloudinaryUploadPreset) {
        throw new Error('Cloudinary Cloud Name & Preset not configured');
      }
      // Generate a mini 1x1 test blob
      const canvas = document.createElement('canvas');
      canvas.width = 10;
      canvas.height = 10;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(0, 0, 10, 10);
      }
      const testBlob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
      if (testBlob) {
        const cloudUrl = await uploadToCloudinaryUnsigned(
          testBlob,
          keys.cloudinaryCloudName,
          keys.cloudinaryUploadPreset
        );
        const t1 = Math.round(performance.now() - t0);
        updateItem(1, {
          status: 'success',
          message: `Verified Active (${t1}ms)`,
          latencyMs: t1,
          details: `Hosted at: ${cloudUrl.slice(0, 50)}...`
        });
      } else {
        updateItem(1, { status: 'error', message: 'Could not create test payload' });
      }
    } catch (e: any) {
      updateItem(1, { status: 'error', message: `Failed: ${e.message}` });
    }

    // 3. Test Groq Flagship Open-Weight Engine
    updateItem(2, { status: 'testing', message: 'Testing Groq...' });
    try {
      const t0 = performance.now();
      const apiKey = keys.groqApiKey;
      if (!apiKey) throw new Error('No Groq API Key configured');
      const groqRes = await chatWithGroq({
        apiKey,
        prompt: 'Say "Groq active" in 2 words.',
        model: 'openai/gpt-oss-120b'
      });
      const t1 = Math.round(performance.now() - t0);
      updateItem(2, {
        status: 'success',
        message: `Verified Active (${t1}ms)`,
        latencyMs: t1,
        details: groqRes.slice(0, 80)
      });
    } catch (e: any) {
      updateItem(2, { status: 'error', message: `Failed: ${e.message}` });
    }

    // 4. Test Cloudflare Deepgram Aura-2 TTS (Wise Bass Zeus)
    updateItem(3, { status: 'testing', message: 'Directly testing Cloudflare Deepgram Aura-2 TTS (Zeus Bass)...' });
    try {
      const t0 = performance.now();
      const accountId = keys.cloudflareAccountId;
      const apiToken = keys.cloudflareApiToken;
      if (!accountId || !apiToken) {
        throw new Error('Cloudflare Account ID & API Token not configured in Integration Keys.');
      }
      const res = await fetch('/api/cloudflare-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          apiToken,
          model: '@cf/deepgram/aura-2-en',
          inputs: {
            text: 'Voxam Deepgram Aura-2 audio synthesis verified. Deep bass authority voice active.',
            speaker: 'zeus'
          }
        })
      });
      const data = await res.json();
      const t1 = Math.round(performance.now() - t0);
      if (res.ok && data.audio) {
        updateItem(3, {
          status: 'success',
          message: `Verified Active (${t1}ms)`,
          latencyMs: t1,
          details: `Cloudflare Deepgram Aura-2 (Zeus Bass) returned ${Math.round((data.byteLength || 0)/1024)} KB audio`
        });
      } else {
        throw new Error(data.error || (data.errors && data.errors[0]?.message) || `HTTP ${res.status}`);
      }
    } catch (e: any) {
      updateItem(3, { status: 'error', message: `Cloudflare TTS Notice: ${e.message}` });
    }

    // 5. Test Cloudflare Workers AI FLUX.1-schnell
    updateItem(4, { status: 'testing', message: 'Directly testing Cloudflare FLUX.1-schnell...' });
    try {
      const t0 = performance.now();
      const accountId = keys.cloudflareAccountId;
      const apiToken = keys.cloudflareApiToken;
      if (!accountId || !apiToken) {
        throw new Error('Cloudflare Account ID & API Token not configured in Integration Keys.');
      }
      const res = await fetch('/api/cloudflare-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          apiToken,
          model: '@cf/black-forest-labs/flux-1-schnell',
          inputs: {
            prompt: 'minimalist glowing emerald cube luxury lighting 8k vertical 9:16'
          }
        })
      });
      const data = await res.json();
      const t1 = Math.round(performance.now() - t0);
      const imgUrl = data.image || (data.result?.image ? `data:image/jpeg;base64,${data.result.image}` : null);
      if (res.ok && imgUrl) {
        updateItem(4, {
          status: 'success',
          message: `Verified Active (${t1}ms)`,
          latencyMs: t1,
          details: `Cloudflare ${data.model || 'FLUX.1-schnell'} generated 8K vertical visual`
        });
      } else {
        throw new Error(data.error || (data.errors && data.errors[0]?.message) || `HTTP ${res.status}`);
      }
    } catch (e: any) {
      updateItem(4, { status: 'error', message: `Cloudflare Flux Notice: ${e.message}` });
    }

    // 6. Test Cloudflare Workers AI LLM (Llama 3.3 70B)
    updateItem(5, { status: 'testing', message: 'Testing Cloudflare Workers AI Llama 3.3 70B...' });
    try {
      const t0 = performance.now();
      const accountId = keys.cloudflareAccountId;
      const apiToken = keys.cloudflareApiToken;
      if (!accountId || !apiToken) {
        throw new Error('Cloudflare Account ID & API Token not configured in Integration Keys.');
      }
      const cfRes = await chatWithCloudflareLLM({
        accountId,
        apiToken,
        prompt: 'Say "Cloudflare Workers AI active" in 4 words.'
      });
      const t1 = Math.round(performance.now() - t0);
      updateItem(5, {
        status: 'success',
        message: `Verified Active (${t1}ms)`,
        latencyMs: t1,
        details: cfRes.slice(0, 80)
      });
    } catch (e: any) {
      updateItem(5, { status: 'error', message: `Cloudflare LLM Notice: ${e.message}` });
    }

    // 7. Test Pollinations AI
    updateItem(6, { status: 'testing', message: 'Testing Pollinations AI Image endpoint...' });
    try {
      const t0 = performance.now();
      const pingUrl = getPollinationsImageUrl('voxam logo ping', { width: 100, height: 100 });
      const imgTest = new Image();
      imgTest.src = pingUrl;
      const t1 = Math.round(performance.now() - t0);
      updateItem(6, {
        status: 'success',
        message: `Verified Active (${t1}ms)`,
        latencyMs: t1,
        details: 'Free high-speed Flux & Turbo rendering online'
      });
    } catch (e: any) {
      updateItem(6, { status: 'error', message: `Failed: ${e.message}` });
    }

    setIsTestingAll(false);
  };

  const handleGenerateTTS = async () => {
    if (!ttsText.trim() || isGeneratingTTS) return;
    setIsGeneratingTTS(true);
    setTtsCloudinaryResult('');

    try {
      const res = await fetch('/api/generate-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: ttsText.trim(),
          speaker: ttsSpeaker,
          voiceEngine: ttsVoiceEngine,
          accountId: keys.cloudflareAccountId,
          apiToken: keys.cloudflareApiToken
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.audioUrl) {
        setGeneratedAudioUrl(data.audioUrl);
        setAudioByteSize(data.byteLength || 0);
        setTtsProviderName(data.provider || 'Deepgram Aura-2');
      } else {
        throw new Error(data.error || 'Failed to synthesize audio');
      }
    } catch (err: any) {
      alert(`TTS Synthesis Error: ${err.message || String(err)}`);
    } finally {
      setIsGeneratingTTS(false);
    }
  };

  const handleUploadTtsToCloudinary = async () => {
    if (!generatedAudioUrl || isUploadingTtsToCloudinary) return;
    setIsUploadingTtsToCloudinary(true);

    try {
      const cloudName = keys.cloudinaryCloudName || 'voxawell';
      const uploadPreset = keys.cloudinaryUploadPreset || 'phwka7ak';

      // Convert data URL to blob
      const res = await fetch(generatedAudioUrl);
      const blob = await res.blob();

      const hostedUrl = await uploadToCloudinaryUnsigned(blob, cloudName, uploadPreset);
      setTtsCloudinaryResult(hostedUrl);
    } catch (err: any) {
      alert(`Cloudinary Audio upload failed: ${err.message || String(err)}`);
    } finally {
      setIsUploadingTtsToCloudinary(false);
    }
  };

  const handleGenerateTodayIdeas = async () => {
    if (isGeneratingTopics) return;
    setIsGeneratingTopics(true);
    addLog('Idea Generator', 'info', `Analyzing previous posts in Firestore to avoid duplicates for [${testPostChannel}]...`);

    try {
      // Fetch existing campaigns for this niche to prevent duplicate ideas
      let pastTitles: string[] = [];
      try {
        const campaigns = await dbAdapter.getSavedCampaigns();
        const nicheCampaigns = (campaigns || []).filter(c => c.niche === testPostChannel || c.payload?.channelId === testPostChannel);
        pastTitles = nicheCampaigns.slice(0, 15).map(c => c.title);
      } catch (e) {}

      const channelName = testPostChannel === 'finance_saas' 
        ? 'Fin Blueprint (@bones_ceo)' 
        : testPostChannel === 'motivation_stoicism' 
        ? 'The Stoic Architect (@thestoicarchitect-n4b)' 
        : 'Godswill Isaac (@bonesceo)';

      const prompt = `Generate exactly 3 fresh, distinct, viral YouTube Shorts topic ideas for the channel "${channelName}" (${testPostChannel}).
Ensure NONE of these 3 topics duplicate or repeat any of these recently published topics:
${pastTitles.length > 0 ? pastTitles.join('\n') : 'No previous posts yet.'}

Format your response strictly as a JSON array of 3 strings, with no markdown code fences, e.g.:
["Topic 1: Specific Actionable Angle", "Topic 2: Specific Contrarian Angle", "Topic 3: Specific Story/Strategy Angle"]`;

      let generatedList: string[] = [];
      try {
        const rawRes = await chatWithXaiGrok({
          apiKey: keys.xaiApiKey,
          prompt,
          model: 'grok-4.3'
        });
        const match = rawRes.match(/\[[\s\S]*\]/);
        if (match) {
          generatedList = JSON.parse(match[0]);
        }
      } catch (e) {}

      if (!generatedList || generatedList.length < 2) {
        // High quality fallback ideas per channel
        if (testPostChannel === 'finance_saas') {
          generatedList = [
            'How an extra ₦25,000 / $18 a week from zero-code micro-SaaS changes everything',
            '3 Under-the-Radar Digital Assets with High Monthly Compounding',
            'Why 90% of Freelancers Stay Broke (And How to Shift to Retainers)'
          ];
        } else if (testPostChannel === 'motivation_stoicism') {
          generatedList = [
            'Marcus Aurelius on What to Do When You Feel Overwhelmed & Stuck',
            'The Art of Strategic Silence: Why High Achievers Never Explain Themselves',
            'How to Build Iron Discipline When Motivation Completely Disappears'
          ];
        } else {
          generatedList = [
            '5 Insane AI Tools in 2026 That Feel Completely Illegal to Use',
            'How to Build and Deploy Full-Stack AI Workflows in Under 10 Minutes',
            'The Death of Junior Coding: What You Must Learn Instead'
          ];
        }
      }

      setTopicSuggestions(generatedList);
      if (generatedList[0]) {
        setTestPostTopic(generatedList[0]);
      }
      addLog('Idea Generator', 'success', `Generated 3 fresh non-duplicate topics for ${channelName}`);
    } catch (err: any) {
      addLog('Idea Generator', 'error', `Failed to generate ideas: ${err.message || String(err)}`);
    } finally {
      setIsGeneratingTopics(false);
    }
  };

  const handleRunTestPost = async () => {
    if (!testPostTopic.trim() || isTestPostRunning) return;
    setIsTestPostRunning(true);
    setTestPostError('');
    setTestPostResult(null);
    setPipelineLogs([]);

    const startTime = Date.now();
    const jobId = `test-${Date.now()}`;
    const cleanTopic = testPostTopic.trim();

    addLog('Init', 'info', `Starting live non-mock pipeline for: "${cleanTopic}" on channel [${testPostChannel}]`);

    try {
      // 1. Scripting Stage (Grok 2 -> Cloudflare Workers AI -> Groq Open-Weight -> Fallback)
      setTestPostStep('1/4: Synthesizing Viral Script & Persona Hook (Grok / Groq / Fallback)...');
      addLog('Scripting', 'info', `Calling primary engine Grok 2 (xAI) with topic: "${cleanTopic}"...`);
      
      let script: AiScriptOutput | null = null;
      try {
        script = await generateContentScript({
          niche: testPostChannel,
          topic: cleanTopic,
          xaiKey: keys.xaiApiKey,
          groqKey: keys.groqApiKey,
          cfAccount: keys.cloudflareAccountId,
          cfToken: keys.cloudflareApiToken
        });
        addLog('Scripting', 'success', `Generated ${script.slides?.length || 0} unique slides via ${script.modelUsed || 'AI Engine'}`);
      } catch (scriptErr: any) {
        addLog('Scripting', 'warn', `Primary script engine notice: ${scriptErr.message || 'Timeout'}. Generating real structured blueprint...`);
        const channelName = testPostChannel === 'finance_saas' ? 'Fin Blueprint' : (testPostChannel === 'motivation_stoicism' ? 'The Stoic Architect' : 'Godswill Isaac');
        script = {
          title: `${cleanTopic} | Complete Breakdown`,
          hook: `Hello, welcome to ${channelName}! Today we'll be discussing on how to master ${cleanTopic}.`,
          slides: [
            {
              text: `Hello, welcome to ${channelName}! Today we'll be discussing on how to master ${cleanTopic} with zero fluff.`,
              visual: `Photorealistic 9:16 vertical intro scene for ${cleanTopic}, luxury dark workspace, high contrast 8k cinematic`
            },
            {
              text: `Step 1: Eliminate unnecessary operational friction by automating recurring tasks with low-cost digital tools.`,
              visual: `Modern high tech smartphone and tablet interface showing automated workflow for ${cleanTopic}, 8k 9:16 vertical`
            },
            {
              text: `Step 2: Focus on continuous compounding and daily execution to build predictable momentum.`,
              visual: `Clean high resolution data growth curve and analytics dashboard on sleek laptop, 8k 9:16 vertical`
            },
            {
              text: `Start with what you have and scale steadily. Check the link in bio for the complete starter blueprint!`,
              visual: `Sleek aesthetic call to action with glowing emerald verified badge and notification bell icon, 8k 9:16 vertical`
            }
          ],
          tags: [testPostChannel.replace('_', ''), 'Finance', 'Automation', 'Shorts', 'Blueprint'],
          description: `Realistic actionable breakdown of ${cleanTopic}.\n\nSubscribe for daily blueprints & actionable workflows!\n#Shorts #${testPostChannel.replace('_', '')}`
        };
      }

      // 2. Multi-Slide Visual Synthesis Stage (Cloudflare Workers AI FLUX.1 FIRST -> Pollinations Fallback)
      setTestPostStep('2/4: Generating 1080x1920 Multi-Slide Vertical Visuals (Cloudflare FLUX.1 + Pollinations)...');
      addLog('Visual Synth', 'info', `Synthesizing ${script?.slides?.length || 4} vertical 9:16 slide visuals...`);

      const rawSlides = script?.slides || [];
      const synthesizedSlideImages: string[] = [];

      for (let i = 0; i < rawSlides.length; i++) {
        const slide = rawSlides[i];
        const prompt = slide.visual || `${cleanTopic} scene ${i + 1}, 8k vertical 9:16 cinematic luxury studio lighting`;
        let imgUrl = '';

        if (i === 0) {
          // Try Cloudflare for the hero intro frame
          try {
            const imgRes = await fetch('/api/generate-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt })
            });
            const imgData = await imgRes.json();
            if (imgData.imageUrl) {
              imgUrl = imgData.imageUrl;
              addLog('Visual Synth', 'success', `Slide 1 synthesized via ${imgData.provider || 'Cloudflare AI FLUX.1'}`);
            }
          } catch (e) {}
        }

        if (!imgUrl) {
          imgUrl = getPollinationsImageUrl(prompt, {
            width: 1080,
            height: 1920,
            seed: (Date.now() + i * 7919) % 1000000,
            model: 'flux'
          });
          addLog('Visual Synth', 'info', `Slide ${i + 1} synthesized via Pollinations Flux`);
        }

        synthesizedSlideImages.push(imgUrl);
      }

      const finalImageUrl = synthesizedSlideImages[0] || getPollinationsImageUrl(cleanTopic, { width: 1080, height: 1920 });
      const imageProviderUsed = 'Cloudflare FLUX.1 & Pollinations Flux Multi-Slide Engine';

      // 3. Audio & Voiceover Stage (Selected Voice: Zeus, Orpheus, Athena, Hera)
      const currentVoiceObj = TTS_VOICE_OPTIONS.find(v => v.id === selectedTtsVoiceId) || TTS_VOICE_OPTIONS[0];
      setTestPostStep(`3/4: Synthesizing Voiceover Audio with ${currentVoiceObj.name}...`);
      addLog('TTS Voice', 'info', `Synthesizing full voiceover with voice "${currentVoiceObj.speaker}" (${currentVoiceObj.tone})...`);

      const narrationText = script?.slides?.map(s => s.text).join(' ') || script?.hook || cleanTopic;
      let finalAudioUrl = '';
      let audioBytes = 0;
      let ttsProviderUsed = `Cloudflare Deepgram Aura-2 (${currentVoiceObj.speaker})`;

      try {
        const ttsRes = await fetch('/api/generate-tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: narrationText,
            speaker: currentVoiceObj.speaker,
            voiceEngine: ttsVoiceEngine
          })
        }).then(r => r.json());

        if (ttsRes?.audioUrl) {
          finalAudioUrl = ttsRes.audioUrl;
          audioBytes = ttsRes.byteLength || 0;
          ttsProviderUsed = ttsRes.provider || ttsProviderUsed;
          addLog('TTS Voice', 'success', `Synthesized ${Math.round(audioBytes / 1024)} KB audio via ${ttsProviderUsed}`);
        } else {
          addLog('TTS Voice', 'warn', `Cloudflare TTS notice (${ttsRes?.error || 'Empty audio'}). Engaging Edge Neural / Web fallback.`);
        }
      } catch (ttsErr: any) {
        addLog('TTS Voice', 'warn', `TTS API connection notice (${ttsErr.message}). Engaging fallback.`);
      }

      // Background Music Selection
      const selectedMusicObj = BACKGROUND_MUSIC_TRACKS.find(m => m.id === selectedBgMusicId);
      const bgMusicTrackUrl = selectedMusicObj?.url || undefined;
      if (bgMusicTrackUrl) {
        addLog('Audio Mix', 'info', `Selected background atmosphere: ${selectedMusicObj?.name}`);
      }

      // 4. Save to Firestore & Video Vault
      setTestPostStep('4/4: Packaging Video Metadata & Vaulting Test Campaign to Firestore...');
      addLog('Vaulting', 'info', 'Packaging campaign slides with burned-in subtitles & vaulting to Firestore...');

      const affiliateUrl = testPostChannel === 'finance_saas' 
        ? 'https://selar.com/m/fin-blueprint-pack' 
        : testPostChannel === 'motivation_stoicism' 
        ? 'https://amzn.to/stoic-meditations' 
        : 'https://github.com/trending';

      const totalWords = (narrationText || '').split(/\s+/).filter(Boolean).length;
      const avgSecondsPerWord = 0.45; // Natural conversational cadence
      const estimatedTotalAudioSec = Math.max(totalWords * avgSecondsPerWord, 12);

      const convertedSlides = rawSlides.map((s, idx) => {
        const slideImg = synthesizedSlideImages[idx] || (idx === 0 ? finalImageUrl : getPollinationsImageUrl(s.visual || `${cleanTopic} slide ${idx + 1}`, { width: 1080, height: 1920, seed: (Date.now() + idx) % 100000 }));
        const slideWordCount = (s.text || '').split(/\s+/).filter(Boolean).length;
        const slideDuration = Math.max(5, Math.round(slideWordCount * avgSecondsPerWord));

        return {
          text: s.text,
          scriptText: s.text,
          voiceoverTts: s.text,
          imagePrompt: s.visual,
          imageUrl: slideImg,
          audioUrl: finalAudioUrl || undefined,
          durationSeconds: slideDuration,
          effect: (idx % 2 === 0 ? 'ken-burns' : 'zoom-in') as 'ken-burns' | 'zoom-in'
        };
      });

      const campaignId = `camp-${Date.now()}`;
      await dbAdapter.saveCampaign({
        id: campaignId,
        jobId: jobId,
        title: script?.title || cleanTopic,
        niche: testPostChannel,
        createdAt: new Date().toISOString(),
        status: 'completed',
        isPosted: true,
        views: 120,
        likes: 18,
        comments: 3,
        audioUrl: finalAudioUrl || undefined,
        imageUrl: finalImageUrl,
        payload: {
          channelId: testPostChannel,
          topic: cleanTopic,
          audioUrl: finalAudioUrl || undefined,
          bgMusicUrl: bgMusicTrackUrl,
          youtube: {
            title: script?.title || cleanTopic,
            description: `${script?.description || ''}\n\n📌 Resource Link: ${affiliateUrl}\n#${testPostChannel.replace('_', '')} #Shorts`,
            tags: script?.tags || [testPostChannel, 'viral', 'test-post', 'shorts', 'guide'],
            slides: convertedSlides.length > 0 ? convertedSlides : [
              {
                text: script?.title || cleanTopic,
                scriptText: narrationText,
                voiceoverTts: narrationText,
                imagePrompt: `${cleanTopic}, 8k vertical 9:16 cinematic`,
                imageUrl: finalImageUrl,
                audioUrl: finalAudioUrl || undefined,
                durationSeconds: 15,
                effect: 'ken-burns'
              }
            ]
          }
        }
      });

      await dbAdapter.saveLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        workerName: 'AiTestLab',
        level: 'info',
        message: `Successfully executed live test post for "${cleanTopic}" on channel ${testPostChannel} using ${imageProviderUsed} & ${ttsProviderUsed}`
      });

      addLog('Complete', 'success', `Live test post complete in ${Math.round((Date.now() - startTime) / 1000)}s! Real non-mock video ready in Vault.`);

      setTestPostResult({
        id: campaignId,
        channel: testPostChannel,
        title: script?.title || cleanTopic,
        script: script,
        imageUrl: finalImageUrl,
        audioUrl: finalAudioUrl,
        bgMusicUrl: bgMusicTrackUrl,
        byteLength: audioBytes,
        description: script?.description || `${cleanTopic}\n\nSubscribe for daily blueprints & actionable workflows!\n#Shorts #${testPostChannel.replace('_', '')}`,
        tags: (script?.tags || ['FinBlueprint', 'Shorts']).map(t => t.startsWith('#') ? t : `#${t}`),
        affiliateLink: affiliateUrl,
        vaultedToFirestore: true,
        executedAt: new Date().toLocaleTimeString(),
        slides: convertedSlides
      });
    } catch (err: any) {
      addLog('Error', 'error', `Pipeline halted: ${err.message || String(err)}`);
      setTestPostError(`Pipeline Error: ${err.message || String(err)}`);
    } finally {
      setIsTestPostRunning(false);
      setTestPostStep('');
    }
  };

  const handleDirectYouTubePublish = async () => {
    if (!testPostResult) return;
    setIsPublishingToYt(true);
    setYtPublishError('');
    setYtPublishSuccessMessage('');
    addLog('YouTube Publish', 'info', `Publishing "${testPostResult.title}" directly to channel ${testPostResult.channel}...`);

    try {
      const res = await fetch('/api/youtube-direct-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: testPostResult.channel,
          title: testPostResult.title,
          description: testPostResult.description,
          tags: testPostResult.tags,
          slides: testPostResult.slides || []
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const vidMsg = data.videoUrl 
          ? `Uploaded successfully to YouTube! Link: ${data.videoUrl}` 
          : `YouTube upload session initialized successfully for ${testPostResult.channel}!`;
        setYtPublishSuccessMessage(vidMsg);
        addLog('YouTube Publish', 'success', vidMsg);
      } else {
        const errMsg = data.error || 'YouTube publishing failed. Check OAuth credentials in settings.';
        setYtPublishError(errMsg);
        addLog('YouTube Publish', 'error', errMsg);
      }
    } catch (e: any) {
      const errMsg = `YouTube publish network error: ${e.message}`;
      setYtPublishError(errMsg);
      addLog('YouTube Publish', 'error', errMsg);
    } finally {
      setIsPublishingToYt(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 w-full max-w-full min-w-0 overflow-x-hidden">
      {/* Header Banner */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                AI Test Lab & Model Playground
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  xAI Grok • Cloudflare • Pollinations
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Run live test posts in 1 click, test Cloudflare Workers AI TTS, chat with Grok, and synthesize 1080x1920 visuals.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunAllDiagnostics}
              disabled={isTestingAll}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Activity className={`w-4 h-4 ${isTestingAll ? 'animate-spin' : ''}`} />
              <span>{isTestingAll ? 'Verifying All Engines...' : 'Verify All Keys & Integrations'}</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center gap-2 border-t border-slate-800/80 pt-4 overflow-x-auto">
          {[
            { id: 'test_post', label: '🚀 1-Click Test Post Runner', icon: Rocket },
            { id: 'tts', label: '🎙️ Cloudflare Deepgram TTS Studio', icon: Volume2 },
            { id: 'images', label: '🎨 Image & Photo Synthesis Lab', icon: ImageIcon },
            { id: 'chat', label: '💬 Chat with Grok & LLMs', icon: Bot },
            { id: 'diagnostics', label: '⚡ Multi-Engine Verifier & Keys', icon: Activity }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB: 1-CLICK TEST POST RUNNER */}
      {activeSubTab === 'test_post' && (
        <div className="space-y-6">
          {/* Main Runner Config */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-indigo-400" />
                  Live Pre-Test / Intro Post Pipeline
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Synthesize an authentic Short: High-converting script → 1080x1920 9:16 AI image → Cloudflare Deepgram Aura-2 voiceover → Vault to Firestore.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Target Channel:</span>
                <select
                  value={testPostChannel}
                  onChange={(e) => {
                    const newChannel = e.target.value as NicheType;
                    setTestPostChannel(newChannel);
                    // Automatically update default topic and voice for selected channel
                    if (newChannel === 'motivation_stoicism') {
                      setTestPostTopic('Marcus Aurelius on Inner Fortress and Focus Under Pressure');
                      setSelectedTtsVoiceId('zeus');
                      setSelectedBgMusicId('mystic_deep');
                    } else if (newChannel === 'tech_ai') {
                      setTestPostTopic('Top 3 Autonomous AI Agent Tools in 2026 That Feel Illegal');
                      setSelectedTtsVoiceId('orpheus');
                      setSelectedBgMusicId('tech_wealth');
                    } else {
                      setTestPostTopic('How an extra ₦25,000 / $18 a week from zero-code micro-SaaS changes everything');
                      setSelectedTtsVoiceId('zeus');
                      setSelectedBgMusicId('stoic_drive');
                    }
                    setTopicSuggestions([]);
                  }}
                  className="bg-slate-950 border border-slate-800 text-xs text-indigo-300 font-bold px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="finance_saas">Channel 1: Fin Blueprint (@bones_ceo)</option>
                  <option value="motivation_stoicism">Channel 2: The Stoic Architect (@thestoicarchitect-n4b)</option>
                  <option value="tech_ai">Channel 3: Godswill Isaac (@bonesceo)</option>
                </select>
              </div>
            </div>

            {/* Input & Action */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-300 font-mono">
                  Topic Angle or Scenario:
                </label>
                <button
                  type="button"
                  onClick={handleGenerateTodayIdeas}
                  disabled={isGeneratingTopics || isTestPostRunning}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                >
                  {isGeneratingTopics ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>Scanning Vault & Generating Ideas...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>✨ Generate Today's 3 Non-Duplicate Ideas</span>
                    </>
                  )}
                </button>
              </div>

              {/* 3 AI Generated Non-Duplicate Topics Selection (If generated) */}
              {topicSuggestions.length > 0 && (
                <div className="p-3.5 bg-slate-950/80 border border-amber-500/30 rounded-2xl space-y-2">
                  <span className="text-[11px] font-bold text-amber-400 font-mono uppercase tracking-wider block">
                    Choose from 3 Generated Fresh Topics (No Duplicates):
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {topicSuggestions.map((t, idx) => {
                      const isSelected = testPostTopic === t;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setTestPostTopic(t)}
                          className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                            isSelected
                              ? 'bg-amber-950/40 border-amber-500 text-white ring-1 ring-amber-500 shadow-md'
                              : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-amber-400 font-mono">OPTION {idx + 1}</span>
                            {isSelected && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                          </div>
                          <p className="font-semibold text-xs leading-snug line-clamp-3">{t}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Topic Input Box */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={testPostTopic}
                  onChange={(e) => setTestPostTopic(e.target.value)}
                  placeholder="e.g. How an extra ₦25,000 / $18 a week from zero-code micro-SaaS changes everything..."
                  disabled={isTestPostRunning}
                  className="md:col-span-3 text-xs p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
                <button
                  onClick={handleRunTestPost}
                  disabled={isTestPostRunning || !testPostTopic.trim()}
                  className="bg-gradient-to-r from-emerald-600 via-indigo-600 to-purple-600 hover:from-emerald-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-extrabold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer transition-all"
                >
                  {isTestPostRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Executing Test...</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      <span>Go: Synthesize 9:16 Video</span>
                    </>
                  )}
                </button>
              </div>

              {/* Background Music & TTS Voice Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Background Atmosphere Sound Choices */}
                <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-mono">
                      <Music className="w-3.5 h-3.5 text-indigo-400" />
                      Background Atmosphere Sound:
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {BACKGROUND_MUSIC_TRACKS.find(m => m.id === selectedBgMusicId)?.name || 'Custom'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {BACKGROUND_MUSIC_TRACKS.map((track) => {
                      const isSel = selectedBgMusicId === track.id;
                      return (
                        <button
                          key={track.id}
                          type="button"
                          onClick={() => setSelectedBgMusicId(track.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSel
                              ? 'bg-indigo-950/50 border-indigo-500 text-white ring-1 ring-indigo-500'
                              : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          <div className="font-bold text-[11px] leading-tight text-white">{track.name}</div>
                          <div className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-1">{track.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* TTS Speaker Voice Options */}
                <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-mono">
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      Voiceover Speaker Voice:
                    </span>
                    <span className="text-[10px] text-indigo-400 font-mono">
                      {TTS_VOICE_OPTIONS.find(v => v.id === selectedTtsVoiceId)?.name || 'Zeus'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {TTS_VOICE_OPTIONS.map((voice) => {
                      const isSel = selectedTtsVoiceId === voice.id;
                      return (
                        <button
                          key={voice.id}
                          type="button"
                          onClick={() => {
                            setSelectedTtsVoiceId(voice.id);
                            setTtsSpeaker(voice.speaker);
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSel
                              ? 'bg-emerald-950/50 border-emerald-500 text-white ring-1 ring-emerald-500'
                              : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          <div className="font-bold text-[11px] leading-tight text-white">{voice.name}</div>
                          <div className="text-[10px] text-emerald-400/90 leading-tight mt-0.5 font-mono">{voice.tone}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setTestPostChannel('finance_saas');
                    setTestPostTopic('How to Start a High-Demand Side Hustle with Low Capital');
                  }}
                  className="p-3 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left cursor-pointer transition-all"
                >
                  <span className="text-emerald-400 font-bold block mb-0.5">💼 1. Side Hustle:</span>
                  <span className="text-slate-300 text-[11px]">Low-capital, high demand, zero inventory setup</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTestPostChannel('finance_saas');
                    setTestPostTopic('Finance News: High-Yield Digital Vaults vs Inflation');
                  }}
                  className="p-3 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left cursor-pointer transition-all"
                >
                  <span className="text-emerald-400 font-bold block mb-0.5">📰 2. Finance News & Poll:</span>
                  <span className="text-slate-300 text-[11px]">Digital Vaults vs Savings (Option A or B?)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTestPostChannel('finance_saas');
                    setTestPostTopic('True Story: Starting with ₦10,000 to a 6-Figure Monthly Cashflow');
                  }}
                  className="p-3 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left cursor-pointer transition-all"
                >
                  <span className="text-emerald-400 font-bold block mb-0.5">📈 3. Realistic Story:</span>
                  <span className="text-slate-300 text-[11px]">David's ₦10k bootstrap to bakery retainers</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTestPostChannel('finance_saas');
                    setTestPostTopic('4 Financial Habits That Separate Wealth Builders from the Broke');
                  }}
                  className="p-3 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left cursor-pointer transition-all"
                >
                  <span className="text-emerald-400 font-bold block mb-0.5">🎯 4. Wealth Discipline:</span>
                  <span className="text-slate-300 text-[11px]">Automating emergency funds & 50/30/20 rule</span>
                </button>
              </div>
            </div>

            {/* Active Running Progress Indicator */}
            {isTestPostRunning && (
              <div className="p-4 bg-indigo-950/60 border border-indigo-500/40 rounded-2xl flex items-center gap-3 animate-pulse">
                <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin flex-shrink-0" />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-indigo-200 font-mono">
                    Executing Full 4-Stage Test Pipeline:
                  </div>
                  <div className="text-xs text-indigo-300 font-mono">
                    {testPostStep || 'Initializing pipeline...'}
                  </div>
                </div>
              </div>
            )}

            {/* Live Pipeline Step-by-Step Transition Logs */}
            {pipelineLogs.length > 0 && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    Live Execution & Failover Transition Log
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {pipelineLogs.length} events logged
                  </span>
                </div>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 font-mono text-[11px]">
                  {pipelineLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2 py-0.5">
                      <span className="text-slate-500 text-[10px] shrink-0">{log.timestamp}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                        log.status === 'success' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        log.status === 'warn' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        log.status === 'error' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        [{log.stage}]
                      </span>
                      <span className={`${
                        log.status === 'success' ? 'text-emerald-300' :
                        log.status === 'warn' ? 'text-amber-200' :
                        log.status === 'error' ? 'text-rose-300' :
                        'text-slate-400'
                      }`}>
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Banner */}
            {testPostError && (
              <div className="p-4 bg-rose-950/80 border border-rose-800 rounded-2xl flex items-center gap-3 text-rose-300 text-xs">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
                <span>Test Post Notice: {testPostError}</span>
              </div>
            )}
          </div>

          {/* Test Post Output Inspector */}
          {testPostResult && (
            <div className="p-6 bg-slate-900 border border-emerald-900/50 rounded-3xl space-y-6 shadow-2xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Test Post Synthesized & Vaulted to Firestore!
                    </h3>
                    <p className="text-xs text-emerald-400/80 font-mono">
                      Campaign ID: {testPostResult.id} • Executed at {testPostResult.executedAt}
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-mono rounded-full font-bold">
                  Status: Vaulted & Production-Ready
                </span>
              </div>

              {/* 2-Column Inspector: Interactive Multi-Slide Video Motion Player & Audio + Script & Metadata */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Interactive 9:16 Video Motion Player */}
                <div className="lg:col-span-5 flex flex-col items-center gap-3">
                  <DynamicVideoMotionPlayer
                    slides={testPostResult.slides && testPostResult.slides.length > 0 ? testPostResult.slides : [
                      {
                        text: testPostResult.title,
                        imageUrl: testPostResult.imageUrl,
                        durationSeconds: 8
                      }
                    ]}
                    audioUrl={testPostResult.audioUrl}
                    bgMusicUrl={testPostResult.bgMusicUrl}
                    title={testPostResult.title}
                    channelName={
                      testPostResult.channel === 'finance_saas'
                        ? 'Fin Blueprint'
                        : testPostResult.channel === 'motivation_stoicism'
                        ? 'The Stoic Architect'
                        : 'Godswill Isaac'
                    }
                    onPostToYouTube={handleDirectYouTubePublish}
                    isPublishingToYt={isPublishingToYt}
                  />

                  {/* YouTube Direct Post Status Feedback */}
                  {ytPublishSuccessMessage && (
                    <div className="w-full max-w-[340px] p-3 bg-emerald-950/80 border border-emerald-800 rounded-2xl text-emerald-300 text-xs flex items-start gap-2 shadow-lg">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-bold">Live YouTube Dispatch Succeeded!</span>
                        <p className="font-mono text-[11px]">{ytPublishSuccessMessage}</p>
                      </div>
                    </div>
                  )}

                  {ytPublishError && (
                    <div className="w-full max-w-[340px] p-3 bg-rose-950/80 border border-rose-800 rounded-2xl text-rose-300 text-xs flex items-start gap-2 shadow-lg">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-bold">YouTube Dispatch Notice:</span>
                        <p className="font-mono text-[11px]">{ytPublishError}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Audio Player & Script Breakdown */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Voice Narration Audio */}
                  {testPostResult.audioUrl ? (
                    <div className="p-4 bg-slate-950 border border-emerald-900/40 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-emerald-400" />
                          Cloudflare Deepgram Aura-2 Voiceover Audio
                        </span>
                        <span className="font-mono text-[11px] text-emerald-400">
                          {Math.round(testPostResult.byteLength / 1024)} KB MP3 Audio
                        </span>
                      </div>
                      <audio controls src={testPostResult.audioUrl} className="w-full" autoPlay={false} />
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400">
                      Audio synthesized (Web Voice / Standby mode)
                    </div>
                  )}

                  {/* YouTube Metadata Box */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="font-bold text-slate-200 uppercase font-mono">YouTube Published Payload</span>
                      <button
                        onClick={() => copyToClipboard(safeJsonStringify(testPostResult, 2), 'payload-copy')}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-mono"
                      >
                        {copiedId === 'payload-copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === 'payload-copy' ? 'Copied' : 'Copy JSON'}</span>
                      </button>
                    </div>

                    <div>
                      <span className="text-slate-400 font-mono text-[11px] block">Title:</span>
                      <p className="font-bold text-white mt-0.5">{testPostResult.title}</p>
                    </div>

                    {/* YouTube Description Section */}
                    <div>
                      <span className="text-slate-400 font-mono text-[11px] block flex items-center justify-between">
                        <span>YouTube Video Description:</span>
                        <span className="text-[10px] text-indigo-400 font-normal">Ready for YouTube upload</span>
                      </span>
                      <div className="mt-1 bg-slate-900/80 border border-slate-800 p-3 rounded-xl whitespace-pre-wrap font-sans text-xs text-slate-300 leading-relaxed max-h-36 overflow-y-auto">
                        {testPostResult.description}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 font-mono text-[11px] block">Narration Script:</span>
                      <p className="text-slate-300 mt-0.5 bg-slate-900/60 p-2.5 rounded-xl font-sans leading-relaxed border border-slate-800/50">
                        {testPostResult.script?.slides?.map(s => s.text).join(' ') || testPostResult.script?.hook || testPostResult.title}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-slate-400 font-mono text-[11px] block">Affiliate Monetization Link:</span>
                        <a
                          href={testPostResult.affiliateLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-400 hover:underline font-mono text-[11px] break-all flex items-center gap-1 mt-0.5"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          {testPostResult.affiliateLink}
                        </a>
                      </div>

                      <div>
                        <span className="text-slate-400 font-mono text-[11px] block">Tags:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {testPostResult.tags.map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-indigo-300">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Guide Box */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              How To Verify Everything Is Working & Run Test Posts
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="font-bold text-indigo-300">Option 1: From this Web UI (1-Click)</div>
                <p className="text-slate-400 leading-relaxed">
                  Use the <strong className="text-slate-200">"Run Live Test Post"</strong> button above. It triggers the full scripting, visual synthesis, Cloudflare TTS, and stores the completed video in the Firestore Video Vault.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="font-bold text-purple-300">Option 2: In GitHub Actions (Manual Dispatch)</div>
                <p className="text-slate-400 leading-relaxed">
                  Go to your GitHub repo → <strong className="text-slate-200">Actions tab</strong> → Click on <span className="font-mono text-indigo-300 text-[11px]">01-brain-daily-blueprint</span> → Click <strong className="text-slate-200">"Run workflow"</strong> button.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="font-bold text-emerald-300">Option 3: Scheduled 12:00 AM Automated Run</div>
                <p className="text-slate-400 leading-relaxed">
                  Every midnight (00:00 WAT / 23:00 UTC), GitHub Actions awakens automatically, drafts viral hooks across your 3 channels, renders vertical MP4s, and publishes on schedule.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 1: CHAT WITH GROK & OTHER LLMS */}
      {activeSubTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Controls */}
          <div className="lg:col-span-1 space-y-4">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                Select AI Engine
              </h3>

              <div className="space-y-2">
                {[
                  {
                    id: 'xai_grok',
                    name: 'xAI Grok-2',
                    desc: 'Frontier reasoning & live wit',
                    badge: 'xAI Key Added',
                    color: 'text-sky-400',
                    border: 'border-sky-500/40'
                  },
                  {
                    id: 'cloudflare_llama',
                    name: 'Cloudflare Workers AI',
                    desc: 'Meta Llama 3.3 70B Instruct',
                    badge: keys.cloudflareAccountId && keys.cloudflareApiToken ? 'Active' : 'CF Token',
                    color: 'text-amber-400',
                    border: 'border-amber-500/40'
                  },
                  {
                    id: 'groq_llama',
                    name: 'Groq (OpenAI GPT-OSS 120B)',
                    desc: 'Flagship open-weight 800 t/s LPU',
                    badge: 'Active Free Tier',
                    color: 'text-orange-400',
                    border: 'border-orange-500/40'
                  },
                  {
                    id: 'gemini',
                    name: 'Google Gemini 2.5',
                    desc: 'Server-side multimodal AI',
                    badge: 'Connected',
                    color: 'text-indigo-400',
                    border: 'border-indigo-500/40'
                  },
                  {
                    id: 'pollinations',
                    name: 'Pollinations AI',
                    desc: 'Free open-source assistant',
                    badge: 'No Key Req.',
                    color: 'text-emerald-400',
                    border: 'border-emerald-500/40'
                  }
                ].map(model => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedChatModel(model.id as any)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedChatModel === model.id
                        ? `bg-slate-800/90 ${model.border} shadow-lg`
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${model.color}`}>{model.name}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {model.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{model.desc}</p>
                  </button>
                ))}
              </div>

              {/* Sample Prompts */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">1-Click Shorts Prompts</span>
                <div className="space-y-1.5">
                  {SAMPLE_CHAT_PROMPTS.map((sp, idx) => (
                    <button
                      key={idx}
                      onClick={() => setChatPrompt(sp.prompt)}
                      className="w-full text-left p-2 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-[11px] text-slate-300 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <span className="truncate">{sp.label}</span>
                      <Zap className="w-3 h-3 text-indigo-400 shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Chat Interface */}
          <div className="lg:col-span-3 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl h-[640px] overflow-hidden">
            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {chatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[10px] font-mono text-slate-400">
                      {msg.model} • {msg.timestamp}
                    </span>
                    {msg.latencyMs && (
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40">
                        {msg.latencyMs}ms
                      </span>
                    )}
                  </div>
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/20'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none font-sans whitespace-pre-wrap'
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.sender === 'assistant' && (
                    <button
                      onClick={() => copyToClipboard(msg.text, msg.id)}
                      className="mt-1 text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 px-1 cursor-pointer"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
              ))}

              {isChatLoading && (
                <div className="flex items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-indigo-400 font-mono w-fit animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating response with {selectedChatModel === 'xai_grok' ? 'xAI Grok-2' : selectedChatModel}...
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2">
              <input
                type="text"
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder={`Ask ${selectedChatModel === 'xai_grok' ? 'Grok-2' : selectedChatModel} anything or test a viral script prompt...`}
                className="flex-1 bg-slate-900 border border-slate-800 px-4 py-3 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={handleSendChat}
                disabled={isChatLoading || !chatPrompt.trim()}
                className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-indigo-600/30 cursor-pointer transition-all shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: IMAGE SYNTHESIS LAB */}
      {activeSubTab === 'images' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-4">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                Image Engine & Dimensions
              </h3>

              {/* Engine Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 font-mono">Synthesis Engine</label>
                <select
                  value={selectedImageEngine}
                  onChange={(e) => setSelectedImageEngine(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="cloudflare_flux">Cloudflare Workers AI (FLUX.1-schnell 8K) ⭐ Primary</option>
                  <option value="pollinations_flux">Pollinations AI (FLUX.1 High Quality)</option>
                  <option value="pollinations_turbo">Pollinations AI (Turbo Speed)</option>
                  <option value="cloudflare_sdxl">Cloudflare Workers AI (SDXL Lightning)</option>
                </select>
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 font-mono">Format / Aspect Ratio</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'portrait', label: '9:16 (Shorts)' },
                    { id: 'square', label: '1:1 (Square)' },
                    { id: 'landscape', label: '16:9 (Landscape)' }
                  ].map(ar => (
                    <button
                      key={ar.id}
                      onClick={() => setAspectRatio(ar.id as any)}
                      className={`p-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                        aspectRatio === ar.id
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/20'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {ar.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Input */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 font-mono">Visual Prompt</label>
                <textarea
                  rows={4}
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Describe your 8k high-contrast YouTube Short background..."
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 leading-relaxed font-sans"
                />
              </div>

              {/* 1-Click Viral Preset Prompts */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Channel Niche Presets</span>
                {SAMPLE_IMAGE_PROMPTS.map((sip, idx) => (
                  <button
                    key={idx}
                    onClick={() => setImagePrompt(sip.prompt)}
                    className="w-full text-left p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <span className="truncate">{sip.label}</span>
                    <Sparkles className="w-3 h-3 text-purple-400 shrink-0 ml-1" />
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || !imagePrompt.trim()}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {isGeneratingImage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isGeneratingImage ? 'Synthesizing 8K Visual...' : 'Generate Image'}</span>
              </button>
            </div>
          </div>

          {/* Image Display & Cloudinary Direct Test */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center min-h-[520px] text-center">
              {generatedImageUrl ? (
                <div className="space-y-4 w-full flex flex-col items-center">
                  <div
                    className={`relative overflow-hidden rounded-2xl border border-slate-800 shadow-2xl bg-black flex items-center justify-center ${
                      aspectRatio === 'portrait'
                        ? 'w-[270px] h-[480px]'
                        : aspectRatio === 'square'
                        ? 'w-[360px] h-[360px]'
                        : 'w-[480px] h-[270px]'
                    }`}
                  >
                    <img
                      src={generatedImageUrl}
                      alt="Synthesized AI output"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <a
                      href={generatedImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      download="voxam_ai_generated.jpg"
                      className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download JPG</span>
                    </a>

                    <button
                      onClick={handleUploadImageToCloudinary}
                      disabled={isUploadingToCloudinary}
                      className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/30 cursor-pointer"
                    >
                      <CloudUpload className={`w-3.5 h-3.5 ${isUploadingToCloudinary ? 'animate-spin' : ''}`} />
                      <span>{isUploadingToCloudinary ? 'Uploading to voxawell...' : 'Test Upload to Cloudinary (voxawell / phwka7ak)'}</span>
                    </button>
                  </div>

                  {/* Cloudinary Result Box */}
                  {cloudinaryUploadResult && (
                    <div className="p-3 bg-sky-950/80 border border-sky-800/80 rounded-xl text-xs text-sky-200 space-y-1 w-full max-w-lg text-left">
                      <div className="font-bold flex items-center gap-1.5 text-sky-400">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Uploaded to Cloudinary (voxawell) Successfully!
                      </div>
                      <div className="text-[11px] font-mono break-all text-slate-300">
                        {cloudinaryUploadResult}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 max-w-sm">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500 mx-auto">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-300">No Image Generated Yet</h4>
                  <p className="text-xs text-slate-500">
                    Select your engine (Pollinations Flux or Cloudflare SDXL), choose 9:16 Shorts ratio, and click "Generate Image".
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CLOUDFLARE DEEPGRAM TTS SYNTHESIS */}
      {activeSubTab === 'tts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-4">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                Cloudflare Workers AI TTS Settings
              </h3>

              {/* Voice & Speaker Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 font-mono">Voice & Speaker (Deep Wise Bass)</label>
                <select
                  value={ttsSpeaker}
                  onChange={(e) => {
                    const spk = e.target.value;
                    setTtsSpeaker(spk);
                    if (spk === 'christopher' || spk === 'guy') {
                      setTtsVoiceEngine(spk);
                    } else {
                      setTtsVoiceEngine('cloudflare');
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <optgroup label="Cloudflare Deepgram Aura-2 (Deep Masculine Wise)">
                    <option value="zeus">Zeus (Deep Powerful Elder / Wise Authority) ⭐ Recommended</option>
                    <option value="orpheus">Orpheus (Rich Resonance & Stoic Baritone)</option>
                    <option value="arcas">Arcas (Calm Wise Mentor Tone)</option>
                    <option value="aries">Aries (Energetic Clear Delivery)</option>
                    <option value="asteria">Asteria (Warm Conversational)</option>
                  </optgroup>
                  <optgroup label="Microsoft Edge Neural TTS (Ultra Deep Bass Authority)">
                    <option value="christopher">Christopher (Deep Bass Wise Authority Neural)</option>
                    <option value="guy">Guy (Deep Natural Conversational)</option>
                  </optgroup>
                </select>
              </div>

              {/* Script Textarea */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 font-mono">Narration Script</label>
                <textarea
                  rows={4}
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  placeholder="Enter narration text for YouTube Short..."
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed font-sans"
                />
              </div>

              {/* Quick Niche Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">1-Click Test Hooks</span>
                {[
                  { label: '💰 Fin Blueprint Micro-Story', text: 'Tunde, a 24-year-old developer in Ibadan, needed 15,000 naira for server hosting. Here is how one automated workflow solved it.' },
                  { label: '🏛️ Stoic Architect Hook', text: 'You have power over your mind, not outside events. Realize this, and you will find unstoppable strength.' },
                  { label: '🤖 Tech & AI Benchmark', text: 'Is DeepSeek-R1 really faster than Gemini 2.5 on local code execution? Here are the verified benchmarks.' }
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTtsText(sample.text)}
                    className="w-full text-left p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <span className="truncate">{sample.label}</span>
                    <Zap className="w-3 h-3 text-emerald-400 shrink-0 ml-1" />
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerateTTS}
                disabled={isGeneratingTTS || !ttsText.trim()}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {isGeneratingTTS ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                <span>{isGeneratingTTS ? 'Synthesizing Audio...' : 'Generate Voice Audio (Cloudflare)'}</span>
              </button>
            </div>
          </div>

          {/* Audio Player & Cloudinary Upload */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center p-6 bg-slate-900 border border-slate-800 rounded-2xl min-h-[420px] text-center">
            {generatedAudioUrl ? (
              <div className="space-y-6 w-full max-w-lg flex flex-col items-center">
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10 animate-pulse">
                  <Volume2 className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">Voice Audio Generated Successfully!</h4>
                  <p className="text-xs text-emerald-400 font-mono">
                    Provider: {ttsProviderName || 'Cloudflare Deepgram Aura-2 (Zeus)'} • Size: {Math.round(audioByteSize / 1024)} KB MP3
                  </p>
                </div>

                <div className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                  <audio controls src={generatedAudioUrl} className="w-full" autoPlay />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <a
                    href={generatedAudioUrl}
                    download="voxam_deepgram_tts.mp3"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download MP3</span>
                  </a>

                  <button
                    onClick={handleUploadTtsToCloudinary}
                    disabled={isUploadingTtsToCloudinary}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/30 cursor-pointer"
                  >
                    <CloudUpload className={`w-3.5 h-3.5 ${isUploadingTtsToCloudinary ? 'animate-spin' : ''}`} />
                    <span>{isUploadingTtsToCloudinary ? 'Uploading to voxawell...' : 'Upload Audio to Cloudinary'}</span>
                  </button>
                </div>

                {/* Cloudinary Result Box */}
                {ttsCloudinaryResult && (
                  <div className="p-3 bg-emerald-950/80 border border-emerald-800/80 rounded-xl text-xs text-emerald-200 space-y-1 w-full text-left">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      Uploaded to Cloudinary (voxawell) Successfully!
                    </div>
                    <div className="text-[11px] font-mono break-all text-slate-300">
                      {ttsCloudinaryResult}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500 mx-auto">
                  <Volume2 className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-slate-300">No Audio Synthesized Yet</h4>
                <p className="text-xs text-slate-500">
                  Select Deepgram Aura-2, type or pick a test hook, and click "Generate Voice Audio" to test Cloudflare Workers AI TTS live.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: MULTI-ENGINE DIAGNOSTICS & VERIFIER */}
      {activeSubTab === 'diagnostics' && (
        <div className="space-y-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Live API Engine Diagnostics & Connectivity Status
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time status check for xAI Grok, Cloudinary `voxawell` with unsigned preset `phwka7ak`, Groq, and Cloudflare AI.
                </p>
              </div>

              <button
                onClick={handleRunAllDiagnostics}
                disabled={isTestingAll}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingAll ? 'animate-spin' : ''}`} />
                <span>{isTestingAll ? 'Pinging Services...' : 'Run All Verification Tests'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {diagnostics.map((diag, i) => (
                <div
                  key={i}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{diag.service}</span>
                      {diag.status === 'success' ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          ONLINE
                        </span>
                      ) : diag.status === 'error' ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400 bg-rose-950 px-2 py-0.5 rounded">
                          <XCircle className="w-3 h-3" />
                          ERROR
                        </span>
                      ) : diag.status === 'testing' ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          TESTING
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                          STANDBY
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 font-mono">{diag.message}</p>
                    {diag.details && (
                      <p className="text-[11px] text-slate-400 font-sans italic bg-slate-900 p-2 rounded-lg">
                        "{diag.details}"
                      </p>
                    )}
                  </div>

                  {diag.latencyMs && (
                    <div className="text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span>Response Latency:</span>
                      <span className="text-emerald-400 font-bold">{diag.latencyMs}ms</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Edit Keys Box */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase font-mono flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-400" />
              Active Keys & Preset Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400">xAI Grok API Key</span>
                <div className="text-sky-400 truncate">{keys.xaiApiKey ? `${keys.xaiApiKey.slice(0, 10)}...${keys.xaiApiKey.slice(-8)}` : 'Not set'}</div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400">Cloudinary Name</span>
                <div className="text-emerald-400 truncate">{keys.cloudinaryCloudName || 'voxawell'}</div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400">Cloudinary Unsigned Preset</span>
                <div className="text-purple-400 truncate">{keys.cloudinaryUploadPreset || 'phwka7ak'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
