import { db, isFirebaseEnabled } from './firebase';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { SavedCampaign, FactoryJob, WorkerLog, IntegrationKeys, ChannelMetrics, ProjectConfig } from './types';

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
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.warn("LocalStorage setItem failed:", err);
  }
}

const DEFAULT_SAVED_CAMPAIGNS: SavedCampaign[] = [
  {
    id: 'camp-seed-1',
    jobId: 'job-fin-1',
    title: 'Tunde made ₦18,000 on his first zero-code Selar micro-tool',
    niche: 'finance_saas',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'completed',
    isPosted: true,
    views: 1840,
    likes: 194,
    comments: 28,
    payload: {
      channelId: 'finance_saas',
      topic: 'Tunde made ₦18,000 on his first zero-code Selar micro-tool',
      youtube: {
        title: 'Tunde made ₦18,000 on his first zero-code Selar micro-tool (Ibadan Case Study)',
        description: 'Realistic micro-SaaS breakdown. When you build low-overhead automation on Selar, small earnings stack up into consistent cashflow without burning ad spend.\n\n📌 Monetization Pack: https://selar.com/m/fin-blueprint-pack\n#FinBlueprint #MicroSaaS #Shorts #NigeriaFinance #SideHustle',
        tags: ['finance_saas', 'selar', 'microsaas', 'passiveincome', 'shorts', 'nigeria'],
        slides: [
          {
            text: 'Tunde, 24 in Ibadan, made ₦18,000 on his first automated Selar digital micro-tool.',
            scriptText: 'Tunde, 24 in Ibadan, made ₦18,000 on his first automated Selar digital micro-tool.',
            voiceoverTts: 'Tunde, 24 in Ibadan, made ₦18,000 on his first automated Selar digital micro-tool.',
            imagePrompt: 'Modern minimalist African developer workspace, glowing laptop showing analytics graph, dark luxury aesthetic 8k',
            imageUrl: 'https://image.pollinations.ai/prompt/Modern%20minimalist%20African%20developer%20workspace%2C%20glowing%20laptop%20showing%20analytics%20graph%2C%20dark%20luxury%20aesthetic%208k?width=1080&height=1920&nologo=true',
            durationSeconds: 7,
            effect: 'ken-burns'
          },
          {
            text: 'No capital burned on ads. Just clean utility solving one specific problem for small vendors.',
            scriptText: 'No capital burned on ads. Just clean utility solving one specific problem for small vendors.',
            voiceoverTts: 'No capital burned on ads. Just clean utility solving one specific problem for small vendors.',
            imagePrompt: 'Clean financial data dashboard on sleek smartphone, dark mode, emerald green accents 8k',
            imageUrl: 'https://image.pollinations.ai/prompt/Clean%20financial%20data%20dashboard%20on%20sleek%20smartphone%2C%20dark%20mode%2C%20emerald%20green%20accents%208k?width=1080&height=1920&nologo=true',
            durationSeconds: 8,
            effect: 'zoom-in'
          },
          {
            text: 'Learn how to automate your first digital micro-product via the blueprint link in bio.',
            scriptText: 'Learn how to automate your first digital micro-product via the blueprint link in bio.',
            voiceoverTts: 'Learn how to automate your first digital micro-product via the blueprint link in bio.',
            imagePrompt: 'Minimalist blueprint schematics, futuristic glowing lines, 8k vertical dark',
            imageUrl: 'https://image.pollinations.ai/prompt/Minimalist%20blueprint%20schematics%2C%20futuristic%20glowing%20lines%2C%208k%20vertical%20dark?width=1080&height=1920&nologo=true',
            durationSeconds: 7,
            effect: 'ken-burns'
          }
        ]
      }
    }
  },
  {
    id: 'camp-seed-2',
    jobId: 'job-stoic-1',
    title: '5 Ways to Master Unshakable Self-Discipline in 2026',
    niche: 'motivation_stoicism',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'completed',
    isPosted: true,
    views: 4280,
    likes: 512,
    comments: 63,
    videoUrl: '/rendered_videos/stoic_1787052082031_short.mp4',
    payload: {
      channelId: 'motivation_stoicism',
      topic: '5 Ways to Master Unshakable Self-Discipline in 2026',
      youtube: {
        title: '5 Ways to Master Unshakable Self-Discipline in 2026',
        description: 'Ancient Stoic strategies combined with modern neurobiology to eliminate procrastination and build quiet mental toughness.\n\n🏛️ Download the Stoic Mental Fortress Planner: https://selar.co/m/stoic-fortress\n#TheStoicArchitect #MarcusAurelius #Discipline #Stoicism #Mindset #Shorts',
        tags: ['#Shorts', '#Stoicism', '#Discipline', '#Motivation', '#MarcusAurelius', '#Mindset'],
        slides: [
          {
            text: "Hello, welcome to The Stoic Architect! Today we'll explore 5 rules to build unshakable discipline and inner focus.",
            scriptText: "Hello, welcome to The Stoic Architect! Today we'll explore 5 rules to build unshakable discipline and inner focus.",
            voiceoverTts: "Hello, welcome to The Stoic Architect! Today we'll explore 5 rules to build unshakable discipline and inner focus.",
            imagePrompt: 'Dramatic marble bust of Marcus Aurelius in deep contemplation with soft cinematic chiaroscuro lighting, 8k 9:16 vertical photorealistic studio shot',
            imageUrl: 'https://image.pollinations.ai/prompt/Dramatic%20marble%20bust%20of%20Marcus%20Aurelius%20in%20deep%20contemplation%20with%20soft%20cinematic%20chiaroscuro%20lighting%2C%208k%209%3A16%20vertical%20photorealistic?width=1080&height=1920&nologo=true',
            audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=meditation-piano-ambient-110855.mp3',
            durationSeconds: 8,
            effect: 'ken-burns'
          },
          {
            text: 'Two thousand years ago, Marcus Aurelius ruled Rome while battling plague and betrayal, writing: conquer your mind first.',
            scriptText: 'Two thousand years ago, Marcus Aurelius ruled Rome while battling plague and betrayal, writing: conquer your mind first.',
            voiceoverTts: 'Two thousand years ago, Marcus Aurelius ruled Rome while battling plague and betrayal, writing: conquer your mind first.',
            imagePrompt: 'Roman Emperor in classical tunic writing in journal by candlelight inside military campaign tent, misty dawn outside, 8k 9:16 vertical photorealistic',
            imageUrl: 'https://image.pollinations.ai/prompt/Roman%20Emperor%20in%20classical%20tunic%20writing%20in%20journal%20by%20candlelight%20inside%20military%20campaign%20tent%2C%20misty%20dawn%20outside%2C%208k%209%3A16%20vertical%20photorealistic?width=1080&height=1920&nologo=true',
            audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=meditation-piano-ambient-110855.mp3',
            durationSeconds: 8,
            effect: 'zoom-in'
          },
          {
            text: 'Modern life constantly floods our brains with cheap dopamine and fake validation. Real discipline means rejecting the noise.',
            scriptText: 'Modern life constantly floods our brains with cheap dopamine and fake validation. Real discipline means rejecting the noise.',
            voiceoverTts: 'Modern life constantly floods our brains with cheap dopamine and fake validation. Real discipline means rejecting the noise.',
            imagePrompt: 'High contrast scene of modern person turning away from glowing smartphone screen into focused reading and deep work, 8k 9:16 vertical',
            imageUrl: 'https://image.pollinations.ai/prompt/High%20contrast%20scene%20of%20modern%20person%20turning%20away%20from%20glowing%20smartphone%20screen%20into%20focused%20reading%20and%20deep%20work%2C%208k%209%3A16%20vertical?width=1080&height=1920&nologo=true',
            audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=meditation-piano-ambient-110855.mp3',
            durationSeconds: 8,
            effect: 'ken-burns'
          },
          {
            text: 'Rule one: Win the first thirty minutes of your morning without screens, establishing complete command over your attention.',
            scriptText: 'Rule one: Win the first thirty minutes of your morning without screens, establishing complete command over your attention.',
            voiceoverTts: 'Rule one: Win the first thirty minutes of your morning without screens, establishing complete command over your attention.',
            imagePrompt: 'Peaceful minimalist morning routine with notebook, natural window sunrise light, and warm tea, 8k 9:16 vertical photorealistic',
            imageUrl: 'https://image.pollinations.ai/prompt/Peaceful%20minimalist%20morning%20routine%20with%20notebook%2C%20natural%20window%20sunrise%20light%2C%20and%20warm%20tea%2C%208k%209%3A16%20vertical%20photorealistic?width=1080&height=1920&nologo=true',
            audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=meditation-piano-ambient-110855.mp3',
            durationSeconds: 8,
            effect: 'zoom-in'
          },
          {
            text: 'True strength is not loud aggression—it is quiet emotional mastery, unwavering accountability, and mutual respect for all people.',
            scriptText: 'True strength is not loud aggression—it is quiet emotional mastery, unwavering accountability, and mutual respect for all people.',
            voiceoverTts: 'True strength is not loud aggression—it is quiet emotional mastery, unwavering accountability, and mutual respect for all people.',
            imagePrompt: 'Inspiring statuesque figure standing tall on mountain peak overlooking golden sunrise with calm composed posture, 8k 9:16 vertical',
            imageUrl: 'https://image.pollinations.ai/prompt/Inspiring%20statuesque%20figure%20standing%20tall%20on%20mountain%20peak%20overlooking%20golden%20sunrise%20with%20calm%20composed%20posture%2C%208k%209%3A16%20vertical?width=1080&height=1920&nologo=true',
            audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=meditation-piano-ambient-110855.mp3',
            durationSeconds: 8,
            effect: 'ken-burns'
          },
          {
            text: 'Waste no more time arguing what a good person should be. Be one today. Download the planner linked in bio!',
            scriptText: 'Waste no more time arguing what a good person should be. Be one today. Download the planner linked in bio!',
            voiceoverTts: 'Waste no more time arguing what a good person should be. Be one today. Download the planner linked in bio!',
            imagePrompt: 'Sleek aesthetic call to action with glowing emerald verified badge and ancient Roman laurel wreath, 8k 9:16 vertical studio lighting',
            imageUrl: 'https://image.pollinations.ai/prompt/Sleek%20aesthetic%20call%20to%20action%20with%20glowing%20emerald%20verified%20badge%20and%20ancient%20Roman%20laurel%20wreath%2C%208k%209%3A16%20vertical%20studio%20lighting?width=1080&height=1920&nologo=true',
            audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=meditation-piano-ambient-110855.mp3',
            durationSeconds: 7,
            effect: 'zoom-in'
          }
        ]
      }
    }
  },
  {
    id: 'camp-seed-3',
    jobId: 'job-tech-1',
    title: 'DeepSeek-R1 vs Gemini 2.5: Real Code Execution Speed Benchmark',
    niche: 'tech_ai',
    createdAt: new Date(Date.now() - 3600000 * 9).toISOString(),
    status: 'completed',
    isPosted: true,
    views: 4890,
    likes: 560,
    comments: 87,
    payload: {
      channelId: 'tech_ai',
      topic: 'DeepSeek-R1 vs Gemini 2.5: Real Code Execution Speed Benchmark',
      youtube: {
        title: 'DeepSeek-R1 vs Gemini 2.5: Which AI Code Model Wins in 2026?',
        description: 'Direct latency, reasoning depth, and token efficiency benchmark for senior engineers and indie hackers.\n\n⚡ Open Source Repositories: https://github.com/trending\n#GodswillIsaac #DeepSeek #Gemini #ArtificialIntelligence #Coding #Shorts',
        tags: ['tech_ai', 'deepseek', 'gemini', 'coding', 'ai', 'shorts'],
        slides: [
          {
            text: 'DeepSeek-R1 vs Gemini 2.5: Which AI model delivers real production code without hallucinations?',
            scriptText: 'DeepSeek-R1 vs Gemini 2.5: Which AI model delivers real production code without hallucinations?',
            voiceoverTts: 'DeepSeek-R1 vs Gemini 2.5: Which AI model delivers real production code without hallucinations?',
            imagePrompt: 'Futuristic quantum neural network processor, glowing blue laser circuitry, cyberpunk dark server room 8k 9:16 vertical',
            imageUrl: 'https://image.pollinations.ai/prompt/Futuristic%20quantum%20neural%20network%20processor%2C%20glowing%20blue%20laser%20circuitry%2C%20cyberpunk%20dark%20server%20room%208k%209%3A16%20vertical?width=1080&height=1920&nologo=true',
            durationSeconds: 8,
            effect: 'ken-burns'
          },
          {
            text: 'We tested 50 async TypeScript refactors. Here are the hard latency benchmarks.',
            scriptText: 'We tested 50 async TypeScript refactors. Here are the hard latency benchmarks.',
            voiceoverTts: 'We tested 50 async TypeScript refactors. Here are the hard latency benchmarks.',
            imagePrompt: 'Realtime speed comparison graph on holographic glass display, dark blue and electric cyan, 8k vertical',
            imageUrl: 'https://image.pollinations.ai/prompt/Realtime%20speed%20comparison%20graph%20on%20holographic%20glass%20display%2C%20dark%20blue%20and%20electric%20cyan%2C%208k%20vertical?width=1080&height=1920&nologo=true',
            durationSeconds: 8,
            effect: 'zoom-in'
          }
        ]
      }
    }
  }
];

export const dbAdapter = {
  // Save/Update a single Factory Job
  async saveJob(job: FactoryJob): Promise<void> {
    const jobs = getLocalData<FactoryJob[]>('voxam_factory_jobs', []);
    const updated = [job, ...jobs.filter(j => j.id !== job.id)];
    setLocalData('voxam_factory_jobs', updated);

    if (isFirebaseEnabled && db) {
      try {
        await setDoc(doc(db, 'factory_jobs', job.id), job);
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
        await setDoc(doc(db, 'saved_campaigns', campaign.id), campaign);
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
      campaigns = local && local.length > 0 ? local : [...DEFAULT_SAVED_CAMPAIGNS];
    }

    // Ensure the flagship 6-slide campaigns are always present
    const titles = new Set(campaigns.map(c => c.title));
    for (const def of DEFAULT_SAVED_CAMPAIGNS) {
      if (!titles.has(def.title)) {
        campaigns.unshift(def);
        titles.add(def.title);
      } else {
        // Upgrade slide count if old cached version had fewer slides
        const existingIdx = campaigns.findIndex(c => c.title === def.title);
        if (existingIdx !== -1 && (campaigns[existingIdx].payload?.youtube?.slides?.length || 0) < (def.payload?.youtube?.slides?.length || 0)) {
          campaigns[existingIdx] = def;
        }
      }
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
          const existingTitles = new Set(campaigns.map(c => c.title));
          for (const mc of manifestCampaigns) {
            if (!existingTitles.has(mc.title)) {
              campaigns.unshift(mc);
              existingTitles.add(mc.title);
            }
          }
        }
      }
    } catch (e) {
      // Offline / client-only fallback
    }

    return campaigns.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
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
        await setDoc(doc(db, 'worker_logs', log.id), log);
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
    if (isFirebaseEnabled && db) {
      try {
        const snap = await getDocs(collection(db, 'approved_users'));
        if (snap.docs.length > 0) {
          return snap.docs.map(d => d.id);
        }
      } catch (e) {
        console.warn("Firebase getApprovedUsers fallback to local:", e);
      }
    }
    return getLocalData<string[]>('voxam_approved_users', ['devmeziem@gmail.com']);
  },

  // Approve User
  async approveUser(email: string): Promise<void> {
    const users = getLocalData<string[]>('voxam_approved_users', ['devmeziem@gmail.com']);
    if (!users.includes(email)) {
      users.push(email);
      setLocalData('voxam_approved_users', users);
    }
    if (isFirebaseEnabled && db) {
      try {
        await setDoc(doc(db, 'approved_users', email), { email, approvedAt: new Date().toISOString() });
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
        await setDoc(doc(db, 'system_config', 'channels'), { channels, updatedAt: new Date().toISOString() });
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
        await setDoc(doc(db, 'system_config', 'projects'), { projects, updatedAt: new Date().toISOString() });
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
        await setDoc(doc(db, 'integration_keys', 'global_keys'), keys);
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
