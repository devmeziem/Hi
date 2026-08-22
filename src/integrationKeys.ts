import { IntegrationKeys } from './types';
import { dbAdapter } from './dbAdapter';

export const DEFAULT_KEYS: IntegrationKeys = {
  cloudinaryCloudName: '',
  cloudinaryApiKey: '',
  cloudinaryApiSecret: '',
  cloudinaryUploadPreset: '',
  grokApiKey: '',
  grokModel: 'grok-2-latest',
  xaiApiKey: '',
  geminiApiKey: '',
  openRouterApiKey: '',
  openRouterModel: 'google/gemini-2.5-flash:free',
  leonardoApiKey: '',
  huggingFaceToken: '',
  huggingFaceModel: '',
  googleImagenApiKey: '',
  groqApiKey: '',
  groqModel: 'llama-3.3-70b-versatile',
  usePollinations: true,
  pipelineAutoOn: false,
  mediumToken: '',
  mediumUserId: '',
  youtubeClientId: '',
  youtubeClientSecret: '',
  youtubeRefreshToken: '',
  youtube2ClientId: '',
  youtube2ClientSecret: '',
  youtube2RefreshToken: '',
  youtube3ClientId: '',
  youtube3ClientSecret: '',
  youtube3RefreshToken: '',
  githubToken: '',
  githubRepo: '',
  linkedinAccessToken: '',
  linkedinUrn: '',
  facebookAppId: '',
  facebookAppSecret: '',
  facebookPageToken: '',
  instagramUserId: '',
  brainWorkerUrl: '',
  mediaWorkerUrl: '',
  posterWorkerUrl: '',
  sandboxMode: false,
  cloudflareAccountId: '',
  cloudflareApiToken: '',
  tensorArtApiKey: '',
  perchanceApiKey: '',
  preferredImageProvider: 'cloudflare'
};

export const loadKeys = (): IntegrationKeys => {
  const saved = localStorage.getItem('voxam_integration_keys');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_KEYS,
        ...parsed
      };
    } catch {
      // ignore
    }
  }
  return { ...DEFAULT_KEYS };
};

export const saveKeys = (keys: IntegrationKeys) => {
  localStorage.setItem('voxam_integration_keys', JSON.stringify(keys));
};

export async function getIntegrationKeys(): Promise<IntegrationKeys> {
  try {
    const loaded = await dbAdapter.loadKeys();
    return { ...DEFAULT_KEYS, ...loaded };
  } catch {
    return loadKeys();
  }
}

export async function saveIntegrationKeys(keys: Partial<IntegrationKeys>): Promise<IntegrationKeys> {
  const current = await getIntegrationKeys();
  const updated = { ...current, ...keys };
  saveKeys(updated as IntegrationKeys);
  try {
    await dbAdapter.saveKeys(updated);
  } catch (e) {
    console.warn("Failed to persist keys to cloud db:", e);
  }
  return updated;
}
