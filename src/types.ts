export type NicheType = 'finance_saas' | 'motivation_stoicism' | 'tech_ai' | 'cartoon_factory' | 'science_cartoon';

export type MouthShape = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'X';

export type CharacterAction =
  | 'idle'
  | 'talking'
  | 'walking'
  | 'point_right'
  | 'point_left'
  | 'thinking'
  | 'laughing'
  | 'surprise'
  | 'excitement'
  | 'looking_left'
  | 'looking_right';

export type CharacterEmotion =
  | 'neutral'
  | 'happy'
  | 'surprised'
  | 'curious'
  | 'excited'
  | 'thinking'
  | 'concerned'
  | 'laughing';

export interface MouthCue {
  start: number;
  end: number;
  value: MouthShape;
}

export interface CartoonScene {
  scene: number;
  duration: number;
  dialogue: string;
  character_action: CharacterAction;
  emotion: CharacterEmotion;
  camera: 'wide' | 'medium' | 'close_up' | 'medium_to_close' | 'pan_left' | 'pan_right';
  objects: string[];
  background_style?: string;
  effects?: string[];
  sfx_cue?: string;
  audioLocalPath?: string;
  mouthCues?: MouthCue[];
  renderedVideoPath?: string;
}

export interface CartoonEpisode {
  topic: string;
  title: string;
  character_name: string;
  target_duration_seconds: number;
  category?: 'science' | 'technology' | 'money_business' | 'history' | 'everyday_explanations' | 'what_if';
  scenes: CartoonScene[];
  modelUsed?: string;
  finalVideoUrl?: string;
  status?: 'planned' | 'voiced' | 'animated' | 'rendered' | 'validated' | 'failed';
}

export interface ValidationReport {
  valid: boolean;
  checks: {
    schemaValid: boolean;
    mp4Exists: boolean;
    fileSizeOk: boolean;
    durationMatches: boolean;
    audioStreamOk: boolean;
    resolutionOk: boolean;
    fpsOk: boolean;
    mouthCuesPresent: boolean;
    blenderSuccess: boolean;
    ffmpegSuccess: boolean;
  };
  errors: string[];
  details: Record<string, any>;
}

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
  imageProvider?: string;
  audioUrl?: string;
  durationSeconds: number;
  effect?: 'ken-burns' | 'zoom-in' | 'zoom-out' | 'slide-in' | 'pan';
  enhancedCtr?: boolean;
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
  thumbnailModel?: string;
  videoUrl?: string;
  payload?: {
    channelId?: string;
    topic?: string;
    audioUrl?: string;
    bgMusicUrl?: string;
    thumbnailUrl?: string;
    thumbnailModel?: string;
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
  stage: 'idea' | 'script' | 'scene_plan' | 'visual_enhancement' | 'image_synth' | 'tts_audio' | 'ffmpeg_render' | 'cloudinary_upload' | 'youtube_publish';
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
    enhancedThumbnailUrl?: string;
    thumbnailModel?: string;
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
  description?: string;
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

