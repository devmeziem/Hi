import { IntegrationKeys } from './types';
import { dbAdapter } from './dbAdapter';

export const DEFAULT_KEYS: IntegrationKeys = {
  cloudinaryCloudName: 'voxawell',
  cloudinaryApiKey: '',
  cloudinaryApiSecret: '',
  cloudinaryUploadPreset: 'phwka7ak',
  grokApiKey: '',
  grokModel: 'grok-2-latest',
  xaiApiKey: 'xai-BzO21GFhUWg7Dqdfs5Yt6yNOjXl5Xx6cGDEfIIWtVIt4hEMqdkkSxL8EOvcuLtAF09YlCtEk7XY65zV4',
  geminiApiKey: 'AQ.Ab8RN6J0b6_h_xEB2pkl2x62HQLTjM4kS2_0zXJi84gu9NvLoA',
  openRouterApiKey: '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',
  openRouterModel: 'google/gemini-2.5-flash:free',
  leonardoApiKey: '',
  huggingFaceToken: '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',
  huggingFaceModel: 'bonesceo/voxam-media',
  googleImagenApiKey: '',
  groqApiKey: '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',
  groqModel: 'llama-3.3-70b-versatile',
  usePollinations: true,
  pipelineAutoOn: false,
  mediumToken: '',
  mediumUserId: '',
  youtubeClientId: '166707266012-n7p5cb30dtmm6u7ustsk098sd2ku4lvo.apps.googleusercontent.com',
  youtubeClientSecret: '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',
  youtubeRefreshToken: '1//04frh8x79M592CgYIARAAGAQSNwF-L9Ir9cHT-9O44KbujIOEhZHSVNLiU3YQZJ7QHSRTZguc5LHbNxIA8FgXVWiraAwnNgUXoIA',
  youtube2ClientId: '166707266012-n7p5cb30dtmm6u7ustsk098sd2ku4lvo.apps.googleusercontent.com',
  youtube2ClientSecret: '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',
  youtube2RefreshToken: '1//04J5LbgK4Xc1OCgYIARAAGAQSNwF-L9IrK6Qv-kG_QoxEI3dbDhTK5LGVcuddv_uekjxAoMHdN_dy0fUpoCtKprrEyDqip44iYMI',
  youtube3ClientId: '166707266012-n7p5cb30dtmm6u7ustsk098sd2ku4lvo.apps.googleusercontent.com',
  youtube3ClientSecret: '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',
  youtube3RefreshToken: '1//04zi4CbZJK6TpCgYIARAAGAQSNwF-L9Irl-BbgSePtyDL0le5OMImmdjgu_nH7aMGFYYwlUMfixkCOt5xYLJUU2yoiFOSqNiMm5o',
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
  cloudflareAccountId: '19db0749de1d68290aa88f04f2b3f14d',
  cloudflareApiToken: 'cfut_GwCYVRlxWQUto1DT1gPoDe55ZwNpcqGD7CrJyPHe58764d79',
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
