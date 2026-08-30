import { db, isFirebaseEnabled } from './firebase';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { SavedCampaign, FactoryJob, WorkerLog, IntegrationKeys, ChannelMetrics, ProjectConfig } from './types';

export function safeJsonStringify(obj: any, space?: number): string {
  const seen = new WeakSet();
  try {
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
        // Exclude DOM nodes, audio/video elements, window, etc.
        if (typeof (value as any).nodeType === 'number' || value instanceof Event || (typeof window !== 'undefined' && value === window)) {
          return undefined;
        }
      }
      return value;
    }, space);
  } catch (e) {
    return String(obj || '');
  }
}

export function cleanForFirestore<T>(obj: T): any {
  if (obj === null || obj === undefined) return null;
  const seen = new WeakSet();

  function recurse(val: any): any {
    if (val === null || val === undefined) return null;
    if (typeof val !== 'object') return val;
    if (val instanceof Date) return val.toISOString();
    if (seen.has(val)) return '[Circular]';
    seen.add(val);

    // If it's a DOM node or event or function, skip
    if (typeof val.nodeType === 'number' || val instanceof Event || typeof val === 'function') {
      return null;
    }

    if (Array.isArray(val)) {
      return val.map(recurse).filter(v => v !== null && v !== undefined);
    }

    const clean: any = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined && typeof v !== 'function') {
        const cleanedVal = recurse(v);
        if (cleanedVal !== undefined) {
          clean[k] = cleanedVal;
        }
      }
    }
    return clean;
  }

  return recurse(obj);
}

function getLocalData<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocalData<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, safeJsonStringify(val));
  } catch (err) {
    console.warn("LocalStorage setItem failed:", err);
  }
}

// Default initial state is empty to prevent injecting fake / preset mock scripts
const DEFAULT_SAVED_CAMPAIGNS: SavedCampaign[] = [];

export const dbAdapter = {
  // Save/Update a single Factory Job
  async saveJob(job: FactoryJob): Promise<void> {
    const jobs = getLocalData<FactoryJob[]>('voxam_factory_jobs', []);
    const updated = [job, ...jobs.filter(j => j.id !== job.id)];
    setLocalData('voxam_factory_jobs', updated);

    if (isFirebaseEnabled && db) {
      try {
        const cleaned = cleanForFirestore(job);
        await setDoc(doc(db, 'factory_jobs', job.id), cleaned);
      } catch (e) {
        console.warn("Firebase saveJob fallback to local:", e);
      }
    }
  },

  // Get all Factory Jobs
  async getJobs(): Promise<FactoryJob[]> {
    if (isFirebaseEnabled && db) {
      try {
        const q = collection(db, 'factory_jobs');
        const snap = await getDocs(q);
        if (snap.docs.length > 0) {
          const data = snap.docs.map(d => d.data() as FactoryJob);
          return data.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        }
      } catch (err) {
        console.warn("Firebase getJobs fallback to local:", err);
      }
    }
    const localJobs = getLocalData<FactoryJob[]>('voxam_factory_jobs', []);
    return localJobs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  },

  // Delete a Factory Job
  async deleteJob(id: string): Promise<void> {
    const jobs = getLocalData<FactoryJob[]>('voxam_factory_jobs', []);
    setLocalData('voxam_factory_jobs', jobs.filter(j => j.id !== id));

    if (isFirebaseEnabled && db) {
      try {
        await deleteDoc(doc(db, 'factory_jobs', id));
      } catch (e) {
        console.warn("Firebase deleteJob failed:", e);
      }
    }
  },

  // Save/Update Saved Campaign
  async saveCampaign(campaign: SavedCampaign): Promise<void> {
    const camps = getLocalData<SavedCampaign[]>('voxam_saved_campaigns', []);
    const updated = [campaign, ...camps.filter(c => c.id !== campaign.id)];
    setLocalData('voxam_saved_campaigns', updated);

    if (isFirebaseEnabled && db) {
      try {
        const cleaned = cleanForFirestore(campaign);
        await setDoc(doc(db, 'saved_campaigns', campaign.id), cleaned);
      } catch (e) {
        console.warn("Firebase saveCampaign fallback to local:", e);
      }
    }
  },

  // Get Saved Campaigns
  async getSavedCampaigns(): Promise<SavedCampaign[]> {
    let campaigns: SavedCampaign[] = [];

    if (isFirebaseEnabled && db) {
      try {
        const [snapSaved, snapVault] = await Promise.allSettled([
          getDocs(collection(db, 'saved_campaigns')),
          getDocs(collection(db, 'video_vault'))
        ]);
        
        const map = new Map<string, SavedCampaign>();
        if (snapSaved.status === 'fulfilled' && snapSaved.value.docs.length > 0) {
          for (const d of snapSaved.value.docs) {
            const data = d.data() as SavedCampaign;
            map.set(data.id || d.id, { ...data, id: data.id || d.id });
          }
        }
        if (snapVault.status === 'fulfilled' && snapVault.value.docs.length > 0) {
          for (const d of snapVault.value.docs) {
            const data = d.data() as SavedCampaign;
            const existing = map.get(data.id || d.id);
            map.set(data.id || d.id, { ...existing, ...data, id: data.id || d.id });
          }
        }
        if (map.size > 0) {
          campaigns = Array.from(map.values());
        }
      } catch (e) {
        console.warn("Firebase getSavedCampaigns fallback to local:", e);
      }
    }

    if (campaigns.length === 0) {
      const local = getLocalData<SavedCampaign[]>('voxam_saved_campaigns', []);
      campaigns = local && local.length > 0 ? local : [];
    }

    // Attempt to merge newly completed manifest items from backend API
    try {
      const res = await fetch('/api/manifest');
      if (res.ok) {
        const manifestJobs = await res.json();
        if (Array.isArray(manifestJobs) && manifestJobs.length > 0) {
          const manifestCampaigns: SavedCampaign[] = manifestJobs
            .filter((j: any) => j && j.title)
            .map((j: any) => ({
              id: `camp-${j.id}`,
              jobId: j.id,
              title: j.title,
              niche: (j.channelId as any) || (j.niche as any) || 'motivation_stoicism',
              createdAt: j.createdAt || new Date().toISOString(),
              status: 'completed',
              isPosted: !!j.youtubeUrl,
              youtubeVideoId: j.youtubeVideoId || null,
              youtubeUrl: j.youtubeUrl || null,
              videoUrl: j.cloudinaryUrl || j.renderedVideoUrl || (j.slides && j.slides[0]?.videoUrl) || j.videoUrl || null,
              views: j.youtubeUrl ? 1 : 0,
              likes: 0,
              comments: 0,
              payload: j.payload || {
                channelId: j.channelId || j.niche,
                topic: j.title,
                youtube: {
                  title: j.title,
                  description: j.scriptText || j.description,
                  tags: j.tags || ['#Shorts', '#FinBlueprint', '#Stoicism', '#Discipline', '#Wealth'],
                  slides: j.slides || [
                    {
                      text: j.scriptText || j.title,
                      scriptText: j.scriptText || j.title,
                      voiceoverTts: j.scriptText || j.title,
                      imagePrompt: j.visualPrompt || j.title,
                      imageUrl: j.generatedImageUrl || `https://image.pollinations.ai/prompt/${encodeURIComponent(j.title + ' 8k vertical 9:16 cinematic')}`,
                      audioUrl: j.audioUrl,
                      durationSeconds: 8,
                      effect: 'ken-burns'
                    }
                  ]
                }
              }
            }));

          // Merge by unique ID / Title
          for (const mc of manifestCampaigns) {
            campaigns.unshift(mc);
          }
        }
      }
    } catch (e) {
      // Offline / client-only fallback
    }

    // Strict deduplication across title and ID
    const uniqueMap = new Map<string, SavedCampaign>();
    for (const c of campaigns) {
      const normKey = (c.title || c.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!normKey) continue;
      if (!uniqueMap.has(normKey)) {
        uniqueMap.set(normKey, c);
      } else {
        // If one has videoUrl or isPosted, prefer that one
        const existing = uniqueMap.get(normKey)!;
        if ((!existing.videoUrl && c.videoUrl) || (!existing.isPosted && c.isPosted)) {
          uniqueMap.set(normKey, { ...existing, ...c });
        }
      }
    }

    const deduplicated = Array.from(uniqueMap.values());
    return deduplicated.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  },

  // Delete Campaign
  async deleteCampaign(id: string): Promise<void> {
    const camps = getLocalData<SavedCampaign[]>('voxam_saved_campaigns', []);
    setLocalData('voxam_saved_campaigns', camps.filter(c => c.id !== id));

    if (isFirebaseEnabled && db) {
      try {
        await deleteDoc(doc(db, 'saved_campaigns', id));
      } catch (e) {
        console.warn("Firebase deleteCampaign failed:", e);
      }
    }
  },

  // Save Worker Log
  async saveLog(log: WorkerLog): Promise<void> {
    const logs = getLocalData<WorkerLog[]>('voxam_worker_logs', []);
    const updated = [log, ...logs.slice(0, 99)];
    setLocalData('voxam_worker_logs', updated);

    if (isFirebaseEnabled && db) {
      try {
        const cleaned = cleanForFirestore(log);
        await setDoc(doc(db, 'worker_logs', log.id), cleaned);
      } catch (e) {
        console.warn("Firebase saveLog fallback to local:", e);
      }
    }
  },

  // Load Worker Logs
  async loadLogs(): Promise<WorkerLog[]> {
    if (isFirebaseEnabled && db) {
      try {
        const snap = await getDocs(collection(db, 'worker_logs'));
        if (snap.docs.length > 0) {
          const data = snap.docs.map(d => d.data() as WorkerLog);
          return data.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
        }
      } catch (e) {
        console.warn("Firebase loadLogs fallback to local:", e);
      }
    }
    return getLocalData<WorkerLog[]>('voxam_worker_logs', []);
  },

  // Get Approved Users
  async getApprovedUsers(): Promise<string[]> {
    try {
      const user = (typeof window !== 'undefined' ? localStorage.getItem('voxam_current_user') : null) || 'devmeziem@gmail.com';
      const res = await fetch('/api/approved-users', {
        headers: {
          'X-User-Email': user,
          'Authorization': `Bearer ${user}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.approvedUsers)) {
          const list = Array.from(new Set(['devmeziem@gmail.com', ...data.approvedUsers.map((e: string) => String(e).toLowerCase().trim())]));
          setLocalData('voxam_approved_users', list);
          return list;
        }
      }
    } catch {}

    if (isFirebaseEnabled && db) {
      try {
        const snap = await getDocs(collection(db, 'approved_users'));
        if (snap.docs.length > 0) {
          const list = Array.from(new Set(['devmeziem@gmail.com', ...snap.docs.map(d => d.id.toLowerCase().trim())]));
          setLocalData('voxam_approved_users', list);
          return list;
        }
      } catch (e) {
        console.warn("Firebase getApprovedUsers fallback to local:", e);
      }
    }
    return getLocalData<string[]>('voxam_approved_users', ['devmeziem@gmail.com']);
  },

  // Approve User
  async approveUser(email: string): Promise<void> {
    const cleanEmail = email.toLowerCase().trim();
    const users = getLocalData<string[]>('voxam_approved_users', ['devmeziem@gmail.com']);
    if (!users.includes(cleanEmail)) {
      users.push(cleanEmail);
      setLocalData('voxam_approved_users', users);
    }

    try {
      const user = (typeof window !== 'undefined' ? localStorage.getItem('voxam_current_user') : null) || 'devmeziem@gmail.com';
      await fetch('/api/approved-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': user,
          'Authorization': `Bearer ${user}`
        },
        body: JSON.stringify({ users })
      });
    } catch {}

    if (isFirebaseEnabled && db) {
      try {
        await setDoc(doc(db, 'approved_users', cleanEmail), cleanForFirestore({ email: cleanEmail, approvedAt: new Date().toISOString() }));
      } catch (e) {
        console.warn("Firebase approveUser failed:", e);
      }
    }
  },

  // Save Channels
  async saveChannels(channels: ChannelMetrics[]): Promise<void> {
    setLocalData('voxam_connected_channels', channels);
    if (isFirebaseEnabled && db) {
      try {
        await setDoc(doc(db, 'system_config', 'channels'), cleanForFirestore({ channels, updatedAt: new Date().toISOString() }));
      } catch (e) {
        console.warn("Firebase saveChannels fallback to local:", e);
      }
    }
  },

  // Load Channels
  async loadChannels(): Promise<ChannelMetrics[] | null> {
    if (isFirebaseEnabled && db) {
      try {
        const snap = await getDoc(doc(db, 'system_config', 'channels'));
        if (snap.exists() && snap.data().channels) {
          return snap.data().channels as ChannelMetrics[];
        }
      } catch (e) {
        console.warn("Firebase loadChannels fallback to local:", e);
      }
    }
    const local = getLocalData<ChannelMetrics[] | null>('voxam_connected_channels', null);
    return local;
  },

  // Save Projects
  async saveProjects(projects: any[]): Promise<void> {
    setLocalData('voxam_active_projects', projects);
    if (isFirebaseEnabled && db) {
      try {
        await setDoc(doc(db, 'system_config', 'projects'), cleanForFirestore({ projects, updatedAt: new Date().toISOString() }));
      } catch (e) {
        console.warn("Firebase saveProjects fallback to local:", e);
      }
    }
  },

  // Load Projects
  async loadProjects(): Promise<any[]> {
    if (isFirebaseEnabled && db) {
      try {
        const snap = await getDoc(doc(db, 'system_config', 'projects'));
        if (snap.exists() && snap.data().projects) {
          return snap.data().projects as any[];
        }
      } catch (e) {
        console.warn("Firebase loadProjects fallback to local:", e);
      }
    }
    return getLocalData<any[]>('voxam_active_projects', [
      { id: 'proj-1', name: 'Main Niche Factory (Godswill)', targetChannelId: 'channel-1', niche: 'finance_saas', dailySlots: 4, autoPilotEnabled: true, status: 'active', createdAt: new Date().toISOString() },
      { id: 'proj-2', name: 'Secondary Channel Automation', targetChannelId: 'channel-2', niche: 'motivation_stoicism', dailySlots: 4, autoPilotEnabled: true, status: 'active', createdAt: new Date().toISOString() },
      { id: 'proj-3', name: 'Tech AI Experimental Reels', targetChannelId: 'channel-3', niche: 'tech_ai', dailySlots: 4, autoPilotEnabled: true, status: 'active', createdAt: new Date().toISOString() }
    ]);
  },

  // Save Integration Keys
  async saveKeys(keys: IntegrationKeys): Promise<void> {
    setLocalData('voxam_integration_keys', keys);
    if (isFirebaseEnabled && db) {
      try {
        await setDoc(doc(db, 'integration_keys', 'global_keys'), cleanForFirestore(keys));
      } catch (e) {
        console.warn("Firebase saveKeys fallback to local:", e);
      }
    }
  },

  // Load Integration Keys
  async loadKeys(): Promise<IntegrationKeys> {
    if (isFirebaseEnabled && db) {
      try {
        const snap = await getDoc(doc(db, 'integration_keys', 'global_keys'));
        if (snap.exists()) {
          return snap.data() as IntegrationKeys;
        }
      } catch (e) {
        console.warn("Firebase loadKeys fallback to local:", e);
      }
    }
    return getLocalData<IntegrationKeys>('voxam_integration_keys', {});
  }
};
