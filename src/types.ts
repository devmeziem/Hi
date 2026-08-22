export type NicheType = 'finance_saas' | 'motivation_stoicism' | 'tech_ai';

export interface IntegrationKeys {
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  cloudinaryUploadPreset?: string;
  grokApiKey?: string;
  grokApiKey2?: string;
  grokModel?: string;
  xaiApiKey?: string;
  xaiApiKey2?: string;
  geminiApiKey?: string;
  openRouterApiKey?: string;
  openRouterModel?: string;
  leonardoApiKey?: string;
  huggingFaceToken?: string;
  huggingFaceModel?: string;
  googleImagenApiKey?: string;
  groqApiKey?: string;
  groqModel?: string;
  usePollinations?: boolean;
  pipelineAutoOn?: boolean;
  mediumToken?: string;
  mediumUserId?: string;
  youtubeClientId?: string;
  youtubeClientSecret?: string;
  youtubeRefreshToken?: string;
  youtube2ClientId?: string;
  youtube2ClientSecret?: string;
  youtube2RefreshToken?: string;
  youtube3ClientId?: string;
  youtube3ClientSecret?: string;
  youtube3RefreshToken?: string;
  githubToken?: string;
  githubRepo?: string;
  linkedinAccessToken?: string;
  linkedinUrn?: string;
  facebookAppId?: string;
  facebookAppSecret?: string;
  facebookPageToken?: string;
  instagramUserId?: string;
  brainWorkerUrl?: string;
  mediaWorkerUrl?: string;
  posterWorkerUrl?: string;
  sandboxMode?: boolean;
  cloudflareAccountId?: string;
  cloudflareApiToken?: string;
  tensorArtApiKey?: string;
  perchanceApiKey?: string;
  preferredImageProvider?: string;
  openAiApiKey?: string;
  elevenLabsApiKey?: string;
}

export interface VideoSlide {
  text: string;
  scriptText?: string;
  voiceoverTts?: string;
  imagePrompt?: string;
  imageUrl?: string;
  audioUrl?: string;
  durationSeconds: number;
  effect?: 'ken-burns' | 'zoom-in' | 'zoom-out' | 'slide-in' | 'pan';
}

export interface SavedCampaign {
  id: string;
  jobId?: string;
  title: string;
  niche: string;
  createdAt: string;
  status: 'completed' | 'draft' | 'failed';
  isPosted?: boolean;
  views?: number;
  likes?: number;
  comments?: number;
  audioUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  payload?: {
    channelId?: string;
    topic?: string;
    audioUrl?: string;
    bgMusicUrl?: string;
    youtube?: {
      title?: string;
      description?: string;
      tags?: string[];
      slides?: VideoSlide[];
    };
  };
}

export interface FactoryJob {
  id: string;
  projectId: string;
  channelId: NicheType | string;
  stage: 'idea' | 'script' | 'scene_plan' | 'image_synth' | 'tts_audio' | 'ffmpeg_render' | 'cloudinary_upload' | 'youtube_publish';
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  errorInfo?: string;
  payload: {
    title?: string;
    topic?: string;
    script?: string;
    scenePlan?: any[];
    imageUrls?: string[];
    audioUrl?: string;
    renderedVideoUrl?: string;
    cloudinaryUrl?: string;
    youtubeVideoId?: string;
    description?: string;
    tags?: string[];
    channelId?: string;
  };
}

export interface WorkerLog {
  id: string;
  timestamp: string;
  workerName: string;
  level: 'info' | 'warn' | 'error' | 'system';
  message: string;
}

export interface ChannelMetrics {
  id?: string;
  connected: boolean;
  title: string;
  customUrl: string;
  thumbnail: string;
  subscribers: number;
  views: number;
  videoCount: number;
  channelId?: string;
  niche?: string;
  customRefreshToken?: string;
}

export interface ProjectConfig {
  id: string;
  name: string;
  targetChannelId: string;
  niche: NicheType | string;
  dailySlots: number;
  autoPilotEnabled: boolean;
  status: 'active' | 'paused';
  createdAt: string;
}

