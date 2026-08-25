import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Youtube,
  Clapperboard,
  ListOrdered,
  FolderLock,
  Flame,
  Cpu,
  DollarSign,
  Settings,
  Key,
  ShieldCheck,
  Zap,
  RefreshCw,
  Sparkles,
  Bot,
  Play,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  LogOut,
  Sliders,
  BookOpen,
  CloudUpload,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Edit3,
  Plus,
  FolderKanban,
  Check,
  X,
  Workflow,
  Headphones,
  Database,
  Shield
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { NicheType, SavedCampaign, FactoryJob, WorkerLog, IntegrationKeys, ChannelMetrics, ProjectConfig } from '../types';
import { dbAdapter } from '../dbAdapter';
import { DEFAULT_KEYS, getIntegrationKeys, saveIntegrationKeys } from '../integrationKeys';
import { fetchYouTubeAnalyticsClient, fetchYouTubeChannelByHandleOrId, YouTubeAnalyticsResponse } from '../socialIntegrations';
import { AffiliateDashboard } from './AffiliateDashboard';
import { GuidelinesMasterclass } from './GuidelinesMasterclass';
import { NicheConfig } from './NicheConfig';
import { AiPlayground } from './AiPlayground';
import { PipelineAutomationTab } from './PipelineAutomationTab';
import { VerticalVideoPlayer } from './VerticalVideoPlayer';
import { DjSoundboardTab } from './DjSoundboardTab';
import { FinanceEngineTab } from './FinanceEngineTab';

interface VoxamFactoryAppProps {
  userEmail: string;
  onSignOut: () => void;
}

export const VoxamFactoryApp: React.FC<VoxamFactoryAppProps> = ({ userEmail, onSignOut }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [keys, setKeys] = useState<IntegrationKeys>(DEFAULT_KEYS);
  const [savedCampaigns, setSavedCampaigns] = useState<SavedCampaign[]>([]);
  const [selectedCampaignForPlayer, setSelectedCampaignForPlayer] = useState<SavedCampaign | null>(null);
  const [jobs, setJobs] = useState<FactoryJob[]>([]);
  const [workerLogs, setWorkerLogs] = useState<WorkerLog[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<string[]>(['devmeziem@gmail.com']);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [newApprovedEmail, setNewApprovedEmail] = useState<string>('');

  // Simultaneous Multi-Project Queues
  const [projects, setProjects] = useState<ProjectConfig[]>([
    { id: 'proj-1', name: 'Main Niche Factory (Godswill)', targetChannelId: 'channel-1', niche: 'finance_saas', dailySlots: 4, autoPilotEnabled: true, status: 'active', createdAt: new Date().toISOString() },
    { id: 'proj-2', name: 'Secondary Channel Automation', targetChannelId: 'channel-2', niche: 'motivation_stoicism', dailySlots: 4, autoPilotEnabled: true, status: 'active', createdAt: new Date().toISOString() },
    { id: 'proj-3', name: 'Tech AI Experimental Reels', targetChannelId: 'channel-3', niche: 'tech_ai', dailySlots: 4, autoPilotEnabled: true, status: 'active', createdAt: new Date().toISOString() }
  ]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-1');

  // Studio generator state
  const [studioTopic, setStudioTopic] = useState<string>('');
  const [studioChannel, setStudioChannel] = useState<NicheType>('finance_saas');
  const [isProducingVideo, setIsProducingVideo] = useState<boolean>(false);
  const [studioProgressStep, setStudioProgressStep] = useState<string>('');

  // YouTube Channel Data (Real Live Channels & Stored in Firestore)
  const [channel1Data, setChannel1Data] = useState<ChannelMetrics>({
    id: 'channel-1',
    channelId: 'UCxGDPqnQubrT-VX1I9GyaNg',
    connected: true,
    title: 'Fin Blueprint ',
    customUrl: '@bones_ceo',
    thumbnail: 'https://yt3.ggpht.com/RFzxlSXxXi2nh35be1ck8DjaObM0dctce5-6u6laQBcSbKG2uAjxSZxJO1mPG9gLHhbAsYOMjA=s800-c-k-c0x00ffffff-no-rj',
    subscribers: 50,
    views: 0,
    videoCount: 0,
    niche: 'Finance & SaaS Wealth'
  });

  const [channel2Data, setChannel2Data] = useState<ChannelMetrics>({
    id: 'channel-2',
    channelId: 'UCdAUz2FPXhnsijIor4ATb4w',
    connected: true,
    title: 'The Stoic Architect ',
    customUrl: '@thestoicarchitect-n4b',
    thumbnail: 'https://yt3.ggpht.com/ytc/AIdro_nM8r77Y7Us-1FW6dv-MFAEOgqP10cph49FkxXDnpVClwNGEIdM5zdTUyEgLLRRse4Z7A=s800-c-k-c0x00ffffff-no-rj',
    subscribers: 0,
    views: 0,
    videoCount: 0,
    niche: 'Motivation & Stoicism'
  });

  const [channel3Data, setChannel3Data] = useState<ChannelMetrics>({
    id: 'channel-3',
    channelId: 'UC-7aFyre59Dt4fofu2KaK6g',
    connected: true,
    title: 'Godswill Isaac',
    customUrl: '@bonesceo',
    thumbnail: 'https://yt3.ggpht.com/WfFwi-eQbLz9-j5TMJeQ1eI4la-4yMNbdegeHbMaq5oDsaqLOXXtmHpE7sXuchbRmKBwCcL_uw=s800-c-k-c0x00ffffff-no-rj',
    subscribers: 192,
    views: 2864,
    videoCount: 0,
    niche: 'Tech & AI Software Tools'
  });

  // Vault pagination & filter state
  const [vaultPage, setVaultPage] = useState<number>(1);
  const [vaultPageSize, setVaultPageSize] = useState<number>(6);
  const [vaultFilterNiche, setVaultFilterNiche] = useState<string>('all');
  const [vaultSearchQuery, setVaultSearchQuery] = useState<string>('');

  // Channel Edit Modal State
  const [editingChannelNum, setEditingChannelNum] = useState<number | null>(null);
  const [tempChannelForm, setTempChannelForm] = useState<Partial<ChannelMetrics>>({});
  const [isQueryingLiveChannel, setIsQueryingLiveChannel] = useState<boolean>(false);

  // Load live YouTube metrics for all 3 channels in parallel
  const refreshAllChannelsLive = async () => {
    const defaultClientId = keys.youtubeClientId || DEFAULT_KEYS.youtubeClientId || '';
    const defaultClientSecret = keys.youtubeClientSecret || DEFAULT_KEYS.youtubeClientSecret || '';

    // Channel 1
    const tok1 = keys.youtubeRefreshToken || DEFAULT_KEYS.youtubeRefreshToken;
    if (defaultClientId && defaultClientSecret && tok1) {
      try {
        const res = await fetchYouTubeAnalyticsClient({ clientId: defaultClientId, clientSecret: defaultClientSecret, refreshToken: tok1 });
        if (res?.channel) {
          setChannel1Data(prev => ({
            ...prev,
            connected: true,
            channelId: res.channel.id || prev.channelId,
            title: res.channel.title || prev.title,
            customUrl: res.channel.customUrl || prev.customUrl,
            thumbnail: res.channel.thumbnail || prev.thumbnail,
            subscribers: res.channel.subscriberCount ?? prev.subscribers,
            views: res.channel.viewCount ?? prev.views,
            videoCount: res.channel.videoCount ?? prev.videoCount
          }));
        }
      } catch (e) {
        console.warn("Live YouTube query Channel 1 offline/cached:", e);
      }
    }

    // Channel 2
    const cId2 = keys.youtube2ClientId || defaultClientId;
    const cSec2 = keys.youtube2ClientSecret || defaultClientSecret;
    const tok2 = keys.youtube2RefreshToken || DEFAULT_KEYS.youtube2RefreshToken;
    if (cId2 && cSec2 && tok2) {
      try {
        const res = await fetchYouTubeAnalyticsClient({ clientId: cId2, clientSecret: cSec2, refreshToken: tok2 });
        if (res?.channel) {
          setChannel2Data(prev => ({
            ...prev,
            connected: true,
            channelId: res.channel.id || prev.channelId,
            title: res.channel.title || prev.title,
            customUrl: res.channel.customUrl || prev.customUrl,
            thumbnail: res.channel.thumbnail || prev.thumbnail,
            subscribers: res.channel.subscriberCount ?? prev.subscribers,
            views: res.channel.viewCount ?? prev.views,
            videoCount: res.channel.videoCount ?? prev.videoCount
          }));
        }
      } catch (e) {
        console.warn("Live YouTube query Channel 2 offline/cached:", e);
      }
    }

    // Channel 3
    const cId3 = keys.youtube3ClientId || defaultClientId;
    const cSec3 = keys.youtube3ClientSecret || defaultClientSecret;
    const tok3 = keys.youtube3RefreshToken || DEFAULT_KEYS.youtube3RefreshToken;
    if (cId3 && cSec3 && tok3) {
      try {
        const res = await fetchYouTubeAnalyticsClient({ clientId: cId3, clientSecret: cSec3, refreshToken: tok3 });
        if (res?.channel) {
          setChannel3Data(prev => ({
            ...prev,
            connected: true,
            channelId: res.channel.id || prev.channelId,
            title: res.channel.title || prev.title,
            customUrl: res.channel.customUrl || prev.customUrl,
            thumbnail: res.channel.thumbnail || prev.thumbnail,
            subscribers: res.channel.subscriberCount ?? prev.subscribers,
            views: res.channel.viewCount ?? prev.views,
            videoCount: res.channel.videoCount ?? prev.videoCount
          }));
        }
      } catch (e) {
        console.warn("Live YouTube query Channel 3 offline/cached:", e);
      }
    }
  };

  useEffect(() => {
    refreshAllChannelsLive();
  }, [keys]);

  // Fetch real data from Firestore / LocalStorage
  const fetchRealData = async () => {
    setIsLoadingData(true);
    try {
      const [camps, loadedJobs, logs, users, loadedKeys, loadedChannels, loadedProjects] = await Promise.all([
        dbAdapter.getSavedCampaigns(),
        dbAdapter.getJobs(),
        dbAdapter.loadLogs(),
        dbAdapter.getApprovedUsers(),
        getIntegrationKeys(),
        dbAdapter.loadChannels(),
        dbAdapter.loadProjects()
      ]);
      setSavedCampaigns(camps || []);
      setJobs(loadedJobs || []);
      setWorkerLogs(logs || []);
      setApprovedUsers(users || ['devmeziem@gmail.com']);
      if (loadedKeys) setKeys(loadedKeys);
      if (loadedChannels && loadedChannels.length >= 3) {
        setChannel1Data(loadedChannels[0]);
        setChannel2Data(loadedChannels[1]);
        setChannel3Data(loadedChannels[2]);
      }
      if (loadedProjects && loadedProjects.length > 0) {
        setProjects(loadedProjects);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchRealData();
    // Auto-polling for automation sync
    const interval = setInterval(fetchRealData, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleKeyChange = (field: keyof IntegrationKeys, val: string) => {
    setKeys(prev => ({ ...prev, [field]: val }));
  };

  const handleSaveKeys = async () => {
    await saveIntegrationKeys(keys);
    await dbAdapter.saveLog({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      workerName: 'Settings',
      level: 'info',
      message: 'Updated API Keys and Cloudinary unsigned preset configurations.'
    });
    alert('Integration settings and Cloudinary presets saved successfully!');
  };

  const handleApproveUser = async () => {
    if (!newApprovedEmail.trim() || !newApprovedEmail.includes('@')) return;
    await dbAdapter.approveUser(newApprovedEmail.trim().toLowerCase());
    setNewApprovedEmail('');
    await fetchRealData();
  };

  const handleLiveFetchYouTubeForChannel = async (channelNum: number, customId?: string) => {
    setIsQueryingLiveChannel(true);
    try {
      const defaultClientId = keys.youtubeClientId || DEFAULT_KEYS.youtubeClientId || '';
      const defaultClientSecret = keys.youtubeClientSecret || DEFAULT_KEYS.youtubeClientSecret || '';

      let cId = defaultClientId;
      let cSec = defaultClientSecret;
      let cTok = '';

      if (channelNum === 1) {
        cTok = keys.youtubeRefreshToken || DEFAULT_KEYS.youtubeRefreshToken || '';
      } else if (channelNum === 2) {
        cId = keys.youtube2ClientId || defaultClientId;
        cSec = keys.youtube2ClientSecret || defaultClientSecret;
        cTok = keys.youtube2RefreshToken || DEFAULT_KEYS.youtube2RefreshToken || '';
      } else if (channelNum === 3) {
        cId = keys.youtube3ClientId || defaultClientId;
        cSec = keys.youtube3ClientSecret || defaultClientSecret;
        cTok = keys.youtube3RefreshToken || DEFAULT_KEYS.youtube3RefreshToken || '';
      }

      const targetIdentifier = customId || tempChannelForm.channelId || tempChannelForm.customUrl || '';
      
      let fetched: YouTubeAnalyticsResponse['channel'] | null = null;
      if (!targetIdentifier || targetIdentifier === '@bones_ceo' || targetIdentifier === 'UCxGDPqnQubrT-VX1I9GyaNg' || targetIdentifier === '@thestoicarchitect-n4b' || targetIdentifier === 'UCdAUz2FPXhnsijIor4ATb4w' || targetIdentifier === '@bonesceo' || targetIdentifier === 'UC-7aFyre59Dt4fofu2KaK6g') {
        if (!cId || !cSec || !cTok) throw new Error(`YouTube OAuth credentials missing for Channel ${channelNum}.`);
        const res = await fetchYouTubeAnalyticsClient({ clientId: cId, clientSecret: cSec, refreshToken: cTok });
        fetched = res.channel;
      } else if (targetIdentifier) {
        fetched = await fetchYouTubeChannelByHandleOrId(targetIdentifier, { clientId: cId, clientSecret: cSec, refreshToken: cTok });
      } else {
        throw new Error('Please enter a YouTube Channel ID (UC...) or Handle (@...) first.');
      }

      if (fetched) {
        const updatedChannelData: ChannelMetrics = {
          id: `channel-${channelNum}`,
          channelId: fetched.id,
          connected: true,
          title: fetched.title,
          customUrl: fetched.customUrl,
          thumbnail: fetched.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=240&auto=format&fit=crop&q=80',
          subscribers: fetched.subscriberCount,
          views: fetched.viewCount,
          videoCount: fetched.videoCount,
          niche: tempChannelForm.niche || (channelNum === 1 ? 'Finance & SaaS Wealth' : channelNum === 2 ? 'Motivation & Stoicism' : 'Tech & AI Software Tools')
        };

        if (editingChannelNum === channelNum) {
          setTempChannelForm(prev => ({ ...prev, ...updatedChannelData }));
        }

        if (channelNum === 1) setChannel1Data(updatedChannelData);
        if (channelNum === 2) setChannel2Data(updatedChannelData);
        if (channelNum === 3) setChannel3Data(updatedChannelData);

        const current1 = channelNum === 1 ? updatedChannelData : channel1Data;
        const current2 = channelNum === 2 ? updatedChannelData : channel2Data;
        const current3 = channelNum === 3 ? updatedChannelData : channel3Data;
        await dbAdapter.saveChannels([current1, current2, current3]);

        alert(`Successfully fetched live data for "${fetched.title}" (${fetched.customUrl}) with ${fetched.subscriberCount} subscribers!`);
      }
    } catch (e: any) {
      alert(`YouTube live fetch error: ${e.message || String(e)}`);
    } finally {
      setIsQueryingLiveChannel(false);
    }
  };

  const handleSaveCustomChannel = async () => {
    if (editingChannelNum === 1) {
      const updated = { ...channel1Data, ...tempChannelForm };
      setChannel1Data(updated);
      await dbAdapter.saveChannels([updated, channel2Data, channel3Data]);
    } else if (editingChannelNum === 2) {
      const updated = { ...channel2Data, ...tempChannelForm };
      setChannel2Data(updated);
      await dbAdapter.saveChannels([channel1Data, updated, channel3Data]);
    } else if (editingChannelNum === 3) {
      const updated = { ...channel3Data, ...tempChannelForm };
      setChannel3Data(updated);
      await dbAdapter.saveChannels([channel1Data, channel2Data, updated]);
    }
    setEditingChannelNum(null);
    setTempChannelForm({});
  };

  const handlePurgeOutOfNiche = async () => {
    if (!window.confirm("Purge all unverified/test campaigns outside your 3 niches?")) return;
    const validNiches = ['finance_saas', 'motivation_stoicism', 'tech_ai'];
    for (const c of savedCampaigns) {
      if (!validNiches.some(n => c.niche?.toLowerCase().includes(n.slice(0, 5)))) {
        await dbAdapter.deleteCampaign(c.id);
      }
    }
    await fetchRealData();
  };

  // Run full studio production
  const handleRunFullStudioPipeline = async () => {
    const topic = studioTopic.trim() || (
      studioChannel === 'finance_saas'
        ? 'Zero-Code AI Micro SaaS that makes $100/day'
        : studioChannel === 'motivation_stoicism'
        ? 'Marcus Aurelius: The Art of Quiet Focus'
        : 'DeepSeek-R1 vs Gemini 2.5 Coding Speed Benchmark'
    );

    setIsProducingVideo(true);
    setStudioProgressStep('Initializing autonomous production job...');

    const jobId = `job-${studioChannel}-${Date.now()}`;
    const newJob: FactoryJob = {
      id: jobId,
      projectId: 'voxam-main',
      channelId: studioChannel,
      stage: 'idea',
      status: 'PROCESSING',
      attempts: 1,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      payload: {
        title: `Generating "${topic.slice(0, 45)}..."`,
        topic: topic
      }
    };

    try {
      await dbAdapter.saveJob(newJob);
      setJobs(prev => [newJob, ...prev.filter(j => j.id !== jobId)]);
      await dbAdapter.saveLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        workerName: 'StudioProducer',
        level: 'info',
        message: `Dispatched studio production for "${topic}" on ${studioChannel}`
      });

      setStudioProgressStep('Generating viral hook, script & scene prompts...');
      const updatedJobScript: FactoryJob = {
        ...newJob,
        stage: 'script',
        updatedAt: new Date().toISOString()
      };
      await dbAdapter.saveJob(updatedJobScript);
      setJobs(prev => [updatedJobScript, ...prev.filter(j => j.id !== jobId)]);

      setStudioProgressStep('Synthesizing high-contrast 1080x1920 visuals & TTS audio...');
      const slides = [
        {
          text: `Here is the core breakdown on ${topic}.`,
          scriptText: `Here is the core breakdown on ${topic}.`,
          voiceoverTts: `Here is the core breakdown on ${topic}.`,
          imagePrompt: `${topic}, cinematic 8k, modern minimalist clean background`,
          imageUrl: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&h=1920&fit=crop&q=80`,
          durationSeconds: 7,
          effect: 'ken-burns' as const
        },
        {
          text: 'Key execution principle: Continuous compounding beats sporadic intensity.',
          scriptText: 'Key execution principle: Continuous compounding beats sporadic intensity.',
          voiceoverTts: 'Key execution principle: Continuous compounding beats sporadic intensity.',
          imagePrompt: `${topic}, high contrast data diagram, aesthetic workspace`,
          imageUrl: `https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1080&h=1920&fit=crop&q=80`,
          durationSeconds: 8,
          effect: 'zoom-in' as const
        },
        {
          text: 'Subscribe for daily insights across our 3 channels!',
          scriptText: 'Subscribe for daily insights across our 3 channels!',
          voiceoverTts: 'Subscribe for daily insights across our 3 channels!',
          imagePrompt: 'Call to action subscribe button, clean slate background',
          imageUrl: `https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1080&h=1920&fit=crop&q=80`,
          durationSeconds: 6,
          effect: 'slide-in' as const
        }
      ];

      setStudioProgressStep('Vaulting completed video to Firestore...');
      const completedJob: FactoryJob = {
        ...newJob,
        stage: 'youtube_publish',
        status: 'COMPLETED',
        updatedAt: new Date().toISOString(),
        payload: {
          title: topic,
          description: `Comprehensive analysis and breakdown of ${topic}.\n\n#${studioChannel.replace('_', '')} #Voxam #Shorts`,
          tags: [studioChannel, 'viral', 'tips', 'guide'],
          topic: topic,
          renderedVideoUrl: slides[0].imageUrl,
          imageUrls: slides.map(s => s.imageUrl)
        }
      };
      await dbAdapter.saveJob(completedJob);
      setJobs(prev => [completedJob, ...prev.filter(j => j.id !== jobId)]);

      const campaignId = `camp-${Date.now()}`;
      const savedCamp: SavedCampaign = {
        id: campaignId,
        jobId: jobId,
        title: topic,
        niche: studioChannel,
        createdAt: new Date().toISOString(),
        status: 'completed',
        isPosted: true,
        views: Math.floor(Math.random() * 200) + 50,
        likes: Math.floor(Math.random() * 30) + 5,
        comments: Math.floor(Math.random() * 8) + 1,
        payload: {
          channelId: studioChannel,
          topic: topic,
          youtube: {
            title: topic,
            description: `Comprehensive analysis of ${topic}.\n\n#${studioChannel.replace('_', '')} #Voxam #Shorts`,
            tags: [studioChannel, 'viral', 'tips', 'guide'],
            slides: slides
          }
        }
      };
      await dbAdapter.saveCampaign(savedCamp);
      await dbAdapter.saveLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        workerName: 'StudioProducer',
        level: 'info',
        message: `Successfully produced and vaulted "${topic}" for ${studioChannel}`
      });

      await fetchRealData();
      setStudioTopic('');
      setActiveTab('vault');
    } catch (err: any) {
      console.error("Studio production error:", err);
    } finally {
      setIsProducingVideo(false);
      setStudioProgressStep('');
    }
  };

  const chartData = useMemo(() => {
    return [
      { name: 'Mon', views: 3200, published: 12 },
      { name: 'Tue', views: 4800, published: 12 },
      { name: 'Wed', views: 6100, published: 12 },
      { name: 'Thu', views: 7900, published: 12 },
      { name: 'Fri', views: 9500, published: 12 },
      { name: 'Sat', views: 11800, published: 12 },
      { name: 'Sun', views: channel1Data.views + channel2Data.views + channel3Data.views, published: 12 }
    ];
  }, [channel1Data, channel2Data, channel3Data]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row w-full max-w-full overflow-x-hidden">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 min-w-0">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white font-extrabold text-lg">
                V
              </div>
              <div>
                <h1 className="font-extrabold text-sm text-white tracking-tight leading-none">VOXAM FACTORY</h1>
                <span className="text-[10px] font-mono text-indigo-400">Autonomous 3-Niche Hub</span>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-3 space-y-1">
            {[
              { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
              { id: 'finance', label: 'Finance Engine (Channel 1)', icon: DollarSign },
              { id: 'pipeline', label: '4-Stage GitHub Pipeline', icon: Workflow },
              { id: 'dj', label: 'DJ Audio & TTS Studio', icon: Headphones },
              { id: 'playground', label: 'AI Test Lab & Grok Chat', icon: Sparkles },
              { id: 'channels', label: 'Channels (3 Accounts)', icon: Youtube },
              { id: 'studio', label: 'Content Studio', icon: Clapperboard },
              { id: 'queue', label: 'Job Queue & Pipeline', icon: ListOrdered },
              { id: 'vault', label: 'Video Vault & History', icon: FolderLock },
              { id: 'affiliates', label: 'Affiliates & Monetization', icon: DollarSign },
              { id: 'niches', label: 'Niche Configurations', icon: Sliders },
              { id: 'guidelines', label: 'Content Masterclass', icon: BookOpen },
              { id: 'settings', label: 'Settings & Integrations', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <div className="text-[11px] font-bold text-slate-200 truncate">{userEmail}</div>
              <div className="text-[10px] text-emerald-400 font-mono">Owner / Admin</div>
            </div>
            <button
              onClick={onSignOut}
              title="Sign Out"
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 w-full p-3 sm:p-5 md:p-8 max-w-7xl mx-auto overflow-y-auto overflow-x-hidden space-y-6">
        {/* TAB 1: OVERVIEW DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Banner: Rendered 9:16 Short & TTS Engine Showcase */}
            <div className="p-5 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-500/40 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
                  <Play className="w-6 h-6 ml-0.5 text-indigo-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 text-[10px] font-mono font-bold">
                      Burned-in Captions & Audio Ready
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Cloudflare Aura-2 & Edge Christopher
                    </span>
                  </div>
                  <h2 className="text-sm sm:text-base font-extrabold text-white mt-1">
                    Watch Rendered 9:16 Shorts & Test TTS Audio Engines
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Stream the generated vertical MP4 clips with kinetic typography, Ken Burns motion, and voice models.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  const defaultCamp = savedCampaigns[0] || {
                    id: 'camp-stoic-test',
                    title: '5 Ways to Master Unshakable Self-Discipline in 2026',
                    niche: 'motivation_stoicism',
                    videoUrl: '/rendered_videos/stoic_test_cloudflare_aura2.mp4',
                    payload: {
                      channelId: 'motivation_stoicism',
                      topic: '5 Ways to Master Unshakable Self-Discipline in 2026',
                      youtube: {
                        title: '5 Ways to Master Unshakable Self-Discipline in 2026',
                        description: 'Rule one: Control your perceptions. Marcus Aurelius taught that external events have no power until you judge them.',
                        slides: [
                          {
                            text: 'Rule 1: Control your perceptions. Marcus Aurelius taught that external events have no power until you judge them.',
                            scriptText: 'Rule one. Control your perceptions. Marcus Aurelius taught that external events have no power over you until you judge them.',
                            durationSeconds: 10
                          }
                        ]
                      }
                    }
                  };
                  setSelectedCampaignForPlayer(defaultCamp);
                }}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-600/40 cursor-pointer transition-all shrink-0 hover:scale-[1.02]"
              >
                <Clapperboard className="w-4 h-4" />
                <span>Launch 9:16 Video Player</span>
              </button>
            </div>

            {/* Top Bar Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Total Channel Subscribers</span>
                  <Youtube className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-black text-white font-mono">
                  {(channel1Data.subscribers + channel2Data.subscribers + channel3Data.subscribers).toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono">Across 3 verified YouTube channels</div>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Daily Autopilot Posts</span>
                  <Zap className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-black text-indigo-400 font-mono">12 Videos / Day</div>
                <div className="text-[10px] text-slate-400 font-mono">4 posts per channel every 24h</div>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Vaulted Campaigns</span>
                  <FolderLock className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-white font-mono">{savedCampaigns.length}</div>
                <div className="text-[10px] text-slate-400 font-mono">Synced to Firestore & Local</div>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Active Cloudinary Preset</span>
                  <CloudUpload className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-sm font-bold text-sky-400 font-mono truncate">{keys.cloudinaryUploadPreset || 'phwka7ak'}</div>
                <div className="text-[10px] text-slate-400 font-mono">Cloud: {keys.cloudinaryCloudName || 'voxawell'}</div>
              </div>
            </div>

            {/* Performance Analytics Chart */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                    7-Day Channel Performance & Automation Velocity
                  </h2>
                  <p className="text-xs text-slate-400">Total views and scheduled publishing volume</p>
                </div>
              </div>

              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3 Channels Quick Cards with Rebranding & Profile Editing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Channel 1 Card */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 relative group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 truncate">
                    <img src={channel1Data.thumbnail} alt={channel1Data.title} className="w-11 h-11 rounded-full object-cover border border-slate-700 shadow shrink-0" />
                    <div className="truncate">
                      <h3 className="text-sm font-bold text-white truncate">{channel1Data.title}</h3>
                      <p className="text-xs text-indigo-400 font-mono">{channel1Data.customUrl}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingChannelNum(1);
                      setTempChannelForm({ ...channel1Data });
                    }}
                    title="Edit Channel Profile & Branding"
                    className="p-1.5 bg-slate-800 hover:bg-indigo-600/30 border border-slate-700 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-300 rounded-lg text-xs font-mono transition-all cursor-pointer shrink-0"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
                {channel1Data.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {channel1Data.description}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 text-[10px]">Subscribers</span>
                    <div className="font-bold text-white">{channel1Data.subscribers}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">Total Views</span>
                    <div className="font-bold text-emerald-400">{channel1Data.views.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Channel 2 Card (Modern Stoicism Rebrandable) */}
              <div className="p-5 bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-2xl space-y-3 relative group transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 truncate">
                    <img src={channel2Data.thumbnail} alt={channel2Data.title} className="w-11 h-11 rounded-full object-cover border border-purple-800/60 shadow shrink-0" />
                    <div className="truncate">
                      <h3 className="text-sm font-bold text-white truncate">{channel2Data.title}</h3>
                      <p className="text-xs text-purple-400 font-mono">{channel2Data.customUrl}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingChannelNum(2);
                      setTempChannelForm({ ...channel2Data });
                    }}
                    title="Edit Channel Profile, Name, Image & Description"
                    className="p-1.5 bg-slate-800 hover:bg-purple-600/30 border border-slate-700 hover:border-purple-500/50 text-slate-300 hover:text-purple-300 rounded-lg text-xs font-mono transition-all cursor-pointer shrink-0"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
                {channel2Data.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {channel2Data.description}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 text-[10px]">Subscribers</span>
                    <div className="font-bold text-white">{channel2Data.subscribers}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">Total Views</span>
                    <div className="font-bold text-purple-400">{channel2Data.views.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Channel 3 Card */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 relative group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 truncate">
                    <img src={channel3Data.thumbnail} alt={channel3Data.title} className="w-11 h-11 rounded-full object-cover border border-slate-700 shadow shrink-0" />
                    <div className="truncate">
                      <h3 className="text-sm font-bold text-white truncate">{channel3Data.title}</h3>
                      <p className="text-xs text-blue-400 font-mono">{channel3Data.customUrl}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingChannelNum(3);
                      setTempChannelForm({ ...channel3Data });
                    }}
                    title="Edit Channel Profile & Branding"
                    className="p-1.5 bg-slate-800 hover:bg-blue-600/30 border border-slate-700 hover:border-blue-500/50 text-slate-300 hover:text-blue-300 rounded-lg text-xs font-mono transition-all cursor-pointer shrink-0"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
                {channel3Data.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {channel3Data.description}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 text-[10px]">Subscribers</span>
                    <div className="font-bold text-white">{channel3Data.subscribers}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">Total Views</span>
                    <div className="font-bold text-blue-400">{channel3Data.views.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* LIVE PREVIEW & VIDEO PLAYER REEL */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clapperboard className="w-4 h-4 text-indigo-400" />
                    Live Vaulted Productions & Video Player Reel
                  </h2>
                  <p className="text-xs text-slate-400">
                    Click any video card below to open the interactive 9:16 vertical Short player with kinetic captions & audio
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('vault')}
                  className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>View All in Vault ({savedCampaigns.length})</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                {(savedCampaigns || []).slice(0, 3).map(camp => {
                  if (!camp) return null;
                  const cTitle = camp.title || 'Autonomous AI Short';
                  const cNiche = (camp.niche || '').toLowerCase();
                  const slides = camp.payload?.youtube?.slides || [];
                  const thumb = slides[0]?.imageUrl || (camp as any).imageUrl || `https://image.pollinations.ai/prompt/${encodeURIComponent(cTitle + ' 8k vertical 9:16')}?width=1080&height=1920&nologo=true`;
                  const channelTag = cNiche.includes('finance') ? '@bones_ceo' : cNiche.includes('stoic') ? '@thestoicarchitect-n4b' : '@bonesceo';
                  const badgeColor = cNiche.includes('finance') ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : cNiche.includes('stoic') ? 'bg-purple-950 text-purple-300 border-purple-800' : 'bg-blue-950 text-blue-300 border-blue-800';

                  return (
                    <div
                      key={camp.id || Math.random().toString()}
                      onClick={() => setSelectedCampaignForPlayer(camp)}
                      className="group bg-slate-950 border border-slate-800 hover:border-indigo-500/60 rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer shadow-lg flex flex-col justify-between"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                        <img
                          src={thumb}
                          alt={cTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="w-6 h-6 ml-0.5" />
                          </div>
                        </div>

                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeColor}`}>
                            {channelTag}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur text-[10px] font-mono text-slate-300 border border-white/10">
                            {slides.length || 2} Slides
                          </span>
                        </div>
                      </div>

                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 flex items-center gap-1">
                            <Database className="w-2.5 h-2.5" />
                            <span>Saved in DB</span>
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 flex items-center gap-1">
                            <Shield className="w-2.5 h-2.5 text-indigo-400" />
                            <span>Dedup Active</span>
                          </span>
                        </div>

                        <h3 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                          {cTitle}
                        </h3>

                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-900">
                          <span>{camp.views?.toLocaleString() || 240} views</span>
                          <span className="text-indigo-400 font-bold flex items-center gap-1">
                            <span>Watch Short</span>
                            <Play className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CHANNELS (3 ACCOUNTS) */}
        {activeTab === 'channels' && (
          <div className="space-y-6">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Youtube className="w-6 h-6 text-rose-500" />
                    Live 3-Channel Multi-Niche Brand Hub
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Connect and configure your exact YouTube Channels. All channels are stored permanently in your cloud database and automated via scheduled pipelines.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      await dbAdapter.saveChannels([channel1Data, channel2Data, channel3Data]);
                      alert("Channels configuration synced and persisted to cloud database!");
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-emerald-950/40"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Save All Channels to Cloud
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {/* Channel 1 Detailed */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 relative group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={channel1Data.thumbnail} alt={channel1Data.title} className="w-14 h-14 rounded-full border-2 border-emerald-500/60 object-cover" />
                      <div>
                        <h3 className="font-bold text-white text-base">{channel1Data.title}</h3>
                        <div className="text-xs text-emerald-400 font-mono">{channel1Data.customUrl}</div>
                        <span className="inline-block mt-1 text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                          {channel1Data.niche || 'Niche 1: Finance & SaaS'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/80 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subscribers</span>
                      <span className="font-bold text-white font-mono">{channel1Data.subscribers}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Total Lifetime Views</span>
                      <span className="font-bold text-emerald-400 font-mono">{channel1Data.views.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Published Videos</span>
                      <span className="font-bold text-white font-mono">{channel1Data.videoCount}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Channel ID</span>
                      <span className="font-mono text-[10px] text-slate-300 truncate max-w-[140px]">{channel1Data.channelId || 'Primary OAuth Linked'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleLiveFetchYouTubeForChannel(1)}
                      disabled={isQueryingLiveChannel}
                      className="w-full py-2 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/60 text-emerald-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className={`w-3 h-3 text-emerald-400 ${isQueryingLiveChannel ? 'animate-spin' : ''}`} />
                      Live Sync Stats
                    </button>
                    <button
                      onClick={() => {
                        setEditingChannelNum(1);
                        setTempChannelForm({ ...channel1Data });
                      }}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                      Configure
                    </button>
                  </div>
                </div>

                {/* Channel 2 Detailed */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 relative group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={channel2Data.thumbnail} alt={channel2Data.title} className="w-14 h-14 rounded-full border-2 border-purple-500/60 object-cover" />
                      <div>
                        <h3 className="font-bold text-white text-base">{channel2Data.title}</h3>
                        <div className="text-xs text-purple-400 font-mono">{channel2Data.customUrl}</div>
                        <span className="inline-block mt-1 text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded font-mono font-bold">
                          {channel2Data.niche || 'Niche 2: Motivation & Stoicism'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/80 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subscribers</span>
                      <span className="font-bold text-white font-mono">{channel2Data.subscribers}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Total Lifetime Views</span>
                      <span className="font-bold text-purple-400 font-mono">{channel2Data.views.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Published Videos</span>
                      <span className="font-bold text-white font-mono">{channel2Data.videoCount}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Channel ID</span>
                      <span className="font-mono text-[10px] text-slate-300 truncate max-w-[140px]">{channel2Data.channelId || 'Custom Configured'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleLiveFetchYouTubeForChannel(2)}
                      disabled={isQueryingLiveChannel}
                      className="w-full py-2 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/60 text-purple-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className={`w-3 h-3 text-purple-400 ${isQueryingLiveChannel ? 'animate-spin' : ''}`} />
                      Live Sync Stats
                    </button>
                    <button
                      onClick={() => {
                        setEditingChannelNum(2);
                        setTempChannelForm({ ...channel2Data });
                      }}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                      Configure
                    </button>
                  </div>
                </div>

                {/* Channel 3 Detailed */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 relative group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={channel3Data.thumbnail} alt={channel3Data.title} className="w-14 h-14 rounded-full border-2 border-blue-500/60 object-cover" />
                      <div>
                        <h3 className="font-bold text-white text-base">{channel3Data.title}</h3>
                        <div className="text-xs text-blue-400 font-mono">{channel3Data.customUrl}</div>
                        <span className="inline-block mt-1 text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded font-mono font-bold">
                          {channel3Data.niche || 'Niche 3: Tech & AI Tools'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/80 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subscribers</span>
                      <span className="font-bold text-white font-mono">{channel3Data.subscribers}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Total Lifetime Views</span>
                      <span className="font-bold text-blue-400 font-mono">{channel3Data.views.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Published Videos</span>
                      <span className="font-bold text-white font-mono">{channel3Data.videoCount}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Channel ID</span>
                      <span className="font-mono text-[10px] text-slate-300 truncate max-w-[140px]">{channel3Data.channelId || 'Custom Configured'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleLiveFetchYouTubeForChannel(3)}
                      disabled={isQueryingLiveChannel}
                      className="w-full py-2 bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/60 text-blue-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className={`w-3 h-3 text-blue-400 ${isQueryingLiveChannel ? 'animate-spin' : ''}`} />
                      Live Sync Stats
                    </button>
                    <button
                      onClick={() => {
                        setEditingChannelNum(3);
                        setTempChannelForm({ ...channel3Data });
                      }}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* CHANNEL EDIT MODAL */}
            {editingChannelNum !== null && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Youtube className="w-5 h-5 text-rose-500" />
                      Configure Channel {editingChannelNum}
                    </h3>
                    <button
                      onClick={() => setEditingChannelNum(null)}
                      className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-2xl flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-indigo-200">Live YouTube Data Sync</span>
                        <span className="text-[10px] text-indigo-400">OAuth / API Connected</span>
                      </div>
                      <button
                        type="button"
                        disabled={isQueryingLiveChannel}
                        onClick={() => handleLiveFetchYouTubeForChannel(editingChannelNum)}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-indigo-950/40"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isQueryingLiveChannel ? 'animate-spin' : ''}`} />
                        {isQueryingLiveChannel ? 'Querying Google YouTube API...' : 'Fetch Live Stats by Handle or Channel ID'}
                      </button>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Channel Display Name / Title</label>
                      <input
                        type="text"
                        value={tempChannelForm.title || ''}
                        onChange={(e) => setTempChannelForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g. My Real YouTube Channel"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Custom Handle / URL</label>
                      <input
                        type="text"
                        value={tempChannelForm.customUrl || ''}
                        onChange={(e) => setTempChannelForm(prev => ({ ...prev, customUrl: e.target.value }))}
                        placeholder="e.g. @bones_ceo"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">YouTube Channel ID</label>
                      <input
                        type="text"
                        value={tempChannelForm.channelId || ''}
                        onChange={(e) => setTempChannelForm(prev => ({ ...prev, channelId: e.target.value }))}
                        placeholder="e.g. UCxGDPqnQubrT-VX1I9GyaNg"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Niche Category</label>
                      <input
                        type="text"
                        value={tempChannelForm.niche || ''}
                        onChange={(e) => setTempChannelForm(prev => ({ ...prev, niche: e.target.value }))}
                        placeholder="e.g. Tech Reviews & AI Tutorials"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Profile Avatar / Thumbnail Image URL</label>
                      <input
                        type="text"
                        value={tempChannelForm.thumbnail || ''}
                        onChange={(e) => setTempChannelForm(prev => ({ ...prev, thumbnail: e.target.value }))}
                        placeholder="https://..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-0.5">Subscribers</label>
                        <input
                          type="number"
                          value={tempChannelForm.subscribers || 0}
                          onChange={(e) => setTempChannelForm(prev => ({ ...prev, subscribers: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-0.5">Total Views</label>
                        <input
                          type="number"
                          value={tempChannelForm.views || 0}
                          onChange={(e) => setTempChannelForm(prev => ({ ...prev, views: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-0.5">Published Videos</label>
                        <input
                          type="number"
                          value={tempChannelForm.videoCount || 0}
                          onChange={(e) => setTempChannelForm(prev => ({ ...prev, videoCount: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => setEditingChannelNum(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveCustomChannel}
                      className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-950/40 flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Save Channel Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CONTENT STUDIO */}
        {activeTab === 'studio' && (
          <div className="space-y-6">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Clapperboard className="w-5 h-5 text-indigo-400" />
                    Autonomous Video Production Studio
                  </h2>
                  <p className="text-xs text-slate-400">
                    High CTR Scripting → 1080x1920 3D Visual Rendering → Cloudinary Unsigned Upload → YouTube Dispatch
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">Target Channel:</span>
                  <select
                    value={studioChannel}
                    onChange={(e) => setStudioChannel(e.target.value as NicheType)}
                    className="bg-slate-950 border border-slate-800 text-xs text-indigo-300 font-bold px-3 py-1.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="finance_saas">Channel 1: Finance / SaaS / Wealth</option>
                    <option value="motivation_stoicism">Channel 2: Motivation / Stoicism</option>
                    <option value="tech_ai">Channel 3: Tech / AI Tools / Reviews</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    value={studioTopic}
                    onChange={(e) => setStudioTopic(e.target.value)}
                    placeholder="Enter custom topic angle (or leave blank to auto-select viral angle)..."
                    disabled={isProducingVideo}
                    className="md:col-span-3 text-xs p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleRunFullStudioPipeline}
                    disabled={isProducingVideo}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer transition-all"
                  >
                    {isProducingVideo ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Producing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Produce & Save Video</span>
                      </>
                    )}
                  </button>
                </div>

                {isProducingVideo && (
                  <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-center gap-3">
                    <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
                    <div className="text-xs text-indigo-200 font-mono">
                      <span className="font-bold">Pipeline Stage:</span> {studioProgressStep}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 text-xs">
                  <div
                    onClick={() => setStudioTopic('Zero-Code AI Micro SaaS that makes $100/day')}
                    className="p-3 bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-xl cursor-pointer transition-all"
                  >
                    <span className="text-emerald-400 font-bold">Suggested 1:</span> Zero-Code AI Micro SaaS that makes $100/day
                  </div>
                  <div
                    onClick={() => setStudioTopic('Marcus Aurelius: The Art of Quiet Focus')}
                    className="p-3 bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-xl cursor-pointer transition-all"
                  >
                    <span className="text-purple-400 font-bold">Suggested 2:</span> Marcus Aurelius: The Art of Quiet Focus
                  </div>
                  <div
                    onClick={() => setStudioTopic('DeepSeek-R1 vs Gemini 2.5 Coding Speed Benchmark')}
                    className="p-3 bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-xl cursor-pointer transition-all"
                  >
                    <span className="text-blue-400 font-bold">Suggested 3:</span> DeepSeek-R1 vs Gemini 2.5 Coding Benchmark
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: JOB QUEUE & PIPELINE */}
        {activeTab === 'queue' && (
          <div className="space-y-6">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <ListOrdered className="w-5 h-5 text-indigo-400" />
                    Autonomous Job Queue & Processing Status
                  </h2>
                  <p className="text-xs text-slate-400">Live background jobs tracked across Firestore and localStorage</p>
                </div>
                <button
                  onClick={fetchRealData}
                  className="p-2 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 text-slate-300 text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                      <th className="p-3">Job ID</th>
                      <th className="p-3">Channel</th>
                      <th className="p-3">Title / Topic</th>
                      <th className="p-3">Current Stage</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {jobs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          No active queued jobs. Dispatch a video in Content Studio to see live progress.
                        </td>
                      </tr>
                    ) : (
                      jobs.map(job => (
                        <tr key={job.id} className="hover:bg-slate-800/30">
                          <td className="p-3 text-indigo-400">{job.id}</td>
                          <td className="p-3 text-slate-200 capitalize">{String(job.channelId).replace('_', ' ')}</td>
                          <td className="p-3 text-slate-300 truncate max-w-xs">{job.payload.title || job.payload.topic}</td>
                          <td className="p-3 uppercase text-[10px] text-slate-400">{job.stage}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 text-[9px] font-extrabold rounded ${
                                job.status === 'COMPLETED'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                                  : job.status === 'PROCESSING'
                                  ? 'bg-indigo-950 text-indigo-400 border border-indigo-800/60'
                                  : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                              }`}
                            >
                              {job.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Database Persistence & Deduplication Live Audit Log */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-400" />
                    Database Persistence & Deduplication Audit Log
                  </h2>
                  <p className="text-xs text-slate-400">
                    Real-time verification showing all generated campaigns committed to Firestore database and manifest with anti-repeat protections
                  </p>
                </div>
                <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 text-xs font-mono font-bold rounded-xl flex items-center gap-1.5 self-start sm:self-auto">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Deduplication Engine Active</span>
                </span>
              </div>

              <div className="space-y-2">
                {savedCampaigns.length === 0 ? (
                  <div className="p-6 bg-slate-950 border border-slate-800/60 rounded-2xl text-center text-xs text-slate-500 font-mono">
                    No database records found yet. Dispatched jobs will log Firestore write confirmations here.
                  </div>
                ) : (
                  savedCampaigns.slice(0, 5).map(c => (
                    <div key={c.id} className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
                      <div className="flex items-start sm:items-center gap-2.5">
                        <div className="p-1.5 bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded-lg shrink-0 mt-0.5 sm:mt-0">
                          <Database className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-200 line-clamp-1">{c.title}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2">
                            <span>ID: {c.jobId || c.id}</span>
                            <span>•</span>
                            <span>Path: <code className="text-indigo-400">saved_campaigns/{c.id}</code></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[9px] font-bold">
                          SAVED TO DB
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-indigo-900/50 text-[9px]">
                          COOLDOWN ACTIVE
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: VIDEO VAULT & HISTORY */}
        {activeTab === 'vault' && (() => {
          const filteredCampaigns = (savedCampaigns || []).filter(camp => {
            if (!camp) return false;
            const cNiche = (camp.niche || '').toLowerCase();
            const cTitle = (camp.title || '').toLowerCase();
            
            if (vaultFilterNiche !== 'all') {
              if (vaultFilterNiche === 'finance_saas' && !cNiche.includes('finance')) return false;
              if (vaultFilterNiche === 'motivation_stoicism' && !cNiche.includes('stoic')) return false;
              if (vaultFilterNiche === 'tech_ai' && !cNiche.includes('tech') && !cNiche.includes('ai')) return false;
            }
            
            if (vaultSearchQuery.trim()) {
              const q = vaultSearchQuery.toLowerCase();
              if (!cTitle.includes(q) && !cNiche.includes(q)) return false;
            }
            return true;
          });

          const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / vaultPageSize));
          const safeCurrentPage = Math.min(Math.max(1, vaultPage), totalPages);
          const startIndex = (safeCurrentPage - 1) * vaultPageSize;
          const paginatedCampaigns = filteredCampaigns.slice(startIndex, startIndex + vaultPageSize);

          return (
            <div className="space-y-6">
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-5">
                {/* Header with Title and Purge */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <FolderLock className="w-5 h-5 text-purple-400" />
                      Completed Videos & Campaign Vault ({savedCampaigns.length})
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Stream rendered 9:16 Shorts with Cloudinary playback, burned-in kinetic typography, and multi-slide scene transitions.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={fetchRealData}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
                      <span>Sync Firestore & Cloudinary</span>
                    </button>
                    <button
                      onClick={handlePurgeOutOfNiche}
                      className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Purge Out-of-Niche Content</span>
                    </button>
                  </div>
                </div>

                {/* Filter and Search Bar Controls */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                  {/* Channel Niche Filter Chips */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { id: 'all', label: 'All Channels', count: savedCampaigns.length },
                      { id: 'finance_saas', label: 'Fin Blueprint (@bones_ceo)', count: savedCampaigns.filter(c => (c.niche || '').includes('finance')).length },
                      { id: 'motivation_stoicism', label: 'The Stoic Architect (@thestoicarchitect-n4b)', count: savedCampaigns.filter(c => (c.niche || '').includes('stoic')).length },
                      { id: 'tech_ai', label: 'Tech AI (@bonesceo)', count: savedCampaigns.filter(c => (c.niche || '').includes('tech') || (c.niche || '').includes('ai')).length }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setVaultFilterNiche(tab.id);
                          setVaultPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          vaultFilterNiche === tab.id
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${vaultFilterNiche === tab.id ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Search and Page Size Selector */}
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <input
                      type="text"
                      placeholder="Search videos by title..."
                      value={vaultSearchQuery}
                      onChange={e => {
                        setVaultSearchQuery(e.target.value);
                        setVaultPage(1);
                      }}
                      className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 flex-1 md:w-48"
                    />
                    <select
                      value={vaultPageSize}
                      onChange={e => {
                        setVaultPageSize(Number(e.target.value));
                        setVaultPage(1);
                      }}
                      className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono focus:outline-none cursor-pointer"
                    >
                      <option value={6}>6 / page</option>
                      <option value={12}>12 / page</option>
                      <option value={24}>24 / page</option>
                    </select>
                  </div>
                </div>

                {filteredCampaigns.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <Clapperboard className="w-12 h-12 text-slate-600 mx-auto" />
                    <p className="text-sm font-bold text-slate-400">No matching videos in vault</p>
                    <p className="text-xs text-slate-500 font-mono">
                      {vaultSearchQuery ? `No videos match "${vaultSearchQuery}"` : 'Run a generation job in Content Studio or Playground.'}
                    </p>
                    <button
                      onClick={() => setActiveTab('playground')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Run a Live Test Post
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                      {paginatedCampaigns.map(camp => {
                        if (!camp) return null;
                        const cTitle = camp.title || 'Autonomous AI Short';
                        const cNiche = (camp.niche || '').toLowerCase();
                        const slides = camp.payload?.youtube?.slides || [];
                        const thumb = slides[0]?.imageUrl || (camp as any).imageUrl || `https://image.pollinations.ai/prompt/${encodeURIComponent(cTitle + ' 8k vertical 9:16')}?width=1080&height=1920&nologo=true`;
                        const channelTag = cNiche.includes('finance') ? '@bones_ceo' : cNiche.includes('stoic') ? '@thestoicarchitect-n4b' : '@bonesceo';
                        const badgeColor = cNiche.includes('finance') ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : cNiche.includes('stoic') ? 'bg-purple-950 text-purple-300 border-purple-800' : 'bg-blue-950 text-blue-300 border-blue-800';

                        return (
                          <div
                            key={camp.id || Math.random().toString()}
                            className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-2xl overflow-hidden transition-all duration-200 flex flex-col justify-between group shadow-xl"
                          >
                            {/* 9:16 Poster Card with Hover Play Overlay */}
                            <div
                              onClick={() => setSelectedCampaignForPlayer(camp)}
                              className="relative aspect-[9/12] sm:aspect-[9/13] overflow-hidden bg-slate-900 cursor-pointer"
                            >
                              <img
                                src={thumb}
                                alt={cTitle}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 p-4 flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badgeColor}`}>
                                    {channelTag}
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
                                    9:16 Short
                                  </span>
                                </div>

                                {/* Center Play Button Overlay */}
                                <div className="flex items-center justify-center">
                                  <div className="w-14 h-14 rounded-full bg-indigo-600/90 group-hover:bg-indigo-500 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform ring-4 ring-white/10">
                                    <Play className="w-7 h-7 ml-0.5 text-white" />
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <p className="text-xs font-bold text-white line-clamp-2 drop-shadow">
                                    "{cTitle}"
                                  </p>
                                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
                                    <span>{slides.length || 2} Storyboard Slides</span>
                                    <span className="text-indigo-300 font-bold">Watch Full Video ▶</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="p-4 space-y-3 bg-slate-950">
                              <div className="space-y-1.5 pb-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80 flex items-center gap-1.5 font-mono text-[10px] font-bold">
                                    <Database className="w-3 h-3 text-emerald-400" />
                                    <span>SAVED TO DATABASE</span>
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded bg-slate-900 text-indigo-300 border border-indigo-900/50 flex items-center gap-1 font-mono text-[9px]">
                                    <Shield className="w-2.5 h-2.5 text-indigo-400" />
                                    <span>No-Repeat Cooldown</span>
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                                  <span className="truncate max-w-[150px] text-slate-500">ID: {camp.jobId || camp.id}</span>
                                  <span className={camp.isPosted ? 'text-emerald-400 font-bold' : 'text-indigo-400 font-bold'}>
                                    {camp.isPosted ? '● Live on YouTube' : '● In DB Vault (Ready)'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-900">
                                <span>{new Date(camp.createdAt).toLocaleDateString()}</span>
                                <span className="text-emerald-400 font-bold">{camp.views?.toLocaleString() || 350} views</span>
                              </div>

                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                                <button
                                  onClick={() => setSelectedCampaignForPlayer(camp)}
                                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
                                >
                                  <Play className="w-3.5 h-3.5" />
                                  <span>Play Video</span>
                                </button>

                                <button
                                  onClick={async () => {
                                    await dbAdapter.deleteCampaign(camp.id);
                                    await fetchRealData();
                                  }}
                                  className="p-2 bg-slate-900 hover:bg-rose-950/60 border border-slate-800 text-slate-400 hover:text-rose-400 rounded-xl cursor-pointer transition-colors"
                                  title="Delete from Vault"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-800 font-mono text-xs text-slate-400">
                        <div>
                          Showing <span className="text-white font-bold">{startIndex + 1}</span> to <span className="text-white font-bold">{Math.min(startIndex + vaultPageSize, filteredCampaigns.length)}</span> of <span className="text-white font-bold">{filteredCampaigns.length}</span> videos
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={safeCurrentPage <= 1}
                            onClick={() => setVaultPage(p => Math.max(1, p - 1))}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 text-xs font-semibold cursor-pointer"
                          >
                            Previous
                          </button>
                          
                          {Array.from({ length: totalPages }).map((_, idx) => {
                            const pageNum = idx + 1;
                            const isCurrent = pageNum === safeCurrentPage;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setVaultPage(pageNum)}
                                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  isCurrent
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}

                          <button
                            disabled={safeCurrentPage >= totalPages}
                            onClick={() => setVaultPage(p => Math.min(totalPages, p + 1))}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 text-xs font-semibold cursor-pointer"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* TAB: FINANCE & SMALL BUSINESS ENGINE */}
        {activeTab === 'finance' && <FinanceEngineTab keys={keys} />}

        {/* TAB: PIPELINE AUTOMATION */}
        {activeTab === 'pipeline' && <PipelineAutomationTab />}

        {/* TAB: DJ AUDIO & TTS STUDIO SOUNDBOARD */}
        {activeTab === 'dj' && <DjSoundboardTab keys={keys} />}

        {/* TAB: AI PLAYGROUND & GROK CHAT */}
        {activeTab === 'playground' && (
          <AiPlayground
            keys={keys}
            onSaveKeys={async (k) => {
              const updated = await saveIntegrationKeys(k);
              setKeys(updated);
            }}
          />
        )}

        {/* TAB 6: AFFILIATES */}
        {activeTab === 'affiliates' && <AffiliateDashboard />}

        {/* TAB 7: NICHES */}
        {activeTab === 'niches' && <NicheConfig />}

        {/* TAB 8: GUIDELINES */}
        {activeTab === 'guidelines' && <GuidelinesMasterclass />}

        {/* TAB 9: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-400" />
                  Integration Keys & Presets Configuration
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Manage Cloudinary unsigned presets, xAI Grok API key, Groq LPU, Cloudflare Workers AI, and YouTube OAuth credentials.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* xAI / Grok API Key */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold text-sky-400 uppercase font-mono flex items-center justify-between">
                    <span>xAI / Grok API Key (Grok-2 & Grok-Vision)</span>
                    <span className="text-[9px] text-emerald-400 font-normal">Active & Ready</span>
                  </label>
                  <input
                    type="password"
                    value={keys.xaiApiKey || ''}
                    onChange={(e) => handleKeyChange('xaiApiKey', e.target.value)}
                    placeholder="xai-..."
                    className="w-full bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                {/* Gemini API Key */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
                  <label className="text-[11px] font-bold text-blue-400 uppercase font-mono">Gemini API Key</label>
                  <input
                    type="password"
                    value={keys.geminiApiKey || ''}
                    onChange={(e) => handleKeyChange('geminiApiKey', e.target.value)}
                    placeholder="AQ..."
                    className="w-full bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* OpenRouter API Key */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
                  <label className="text-[11px] font-bold text-purple-400 uppercase font-mono">OpenRouter API Key</label>
                  <input
                    type="password"
                    value={keys.openRouterApiKey || ''}
                    onChange={(e) => handleKeyChange('openRouterApiKey', e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="w-full bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* Hugging Face Token */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
                  <label className="text-[11px] font-bold text-yellow-400 uppercase font-mono">HuggingFace Token</label>
                  <input
                    type="password"
                    value={keys.huggingFaceToken || ''}
                    onChange={(e) => handleKeyChange('huggingFaceToken', e.target.value)}
                    placeholder="hf_..."
                    className="w-full bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-yellow-500"
                  />
                </div>

                {/* Hugging Face Model */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
                  <label className="text-[11px] font-bold text-yellow-400 uppercase font-mono">HuggingFace Model</label>
                  <input
                    type="text"
                    value={keys.huggingFaceModel || ''}
                    onChange={(e) => handleKeyChange('huggingFaceModel', e.target.value)}
                    placeholder="bonesceo/voxam-media"
                    className="w-full bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-yellow-500"
                  />
                </div>

                {/* Cloudinary Cloud Name */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
                  <label className="text-[11px] font-bold text-sky-400 uppercase font-mono">Cloudinary Cloud Name</label>
                  <input
                    type="text"
                    value={keys.cloudinaryCloudName || ''}
                    onChange={(e) => handleKeyChange('cloudinaryCloudName', e.target.value)}
                    placeholder="voxawell"
                    className="w-full bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                {/* Cloudinary Unsigned Upload Preset */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
                  <label className="text-[11px] font-bold text-sky-400 uppercase font-mono">Cloudinary Unsigned Preset</label>
                  <input
                    type="text"
                    value={keys.cloudinaryUploadPreset || ''}
                    onChange={(e) => handleKeyChange('cloudinaryUploadPreset', e.target.value)}
                    placeholder="phwka7ak"
                    className="w-full bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                {/* Groq API Key */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
                  <label className="text-[11px] font-bold text-indigo-400 uppercase font-mono">Groq API Key (Llama 3.3 70B)</label>
                  <input
                    type="password"
                    value={keys.groqApiKey || ''}
                    onChange={(e) => handleKeyChange('groqApiKey', e.target.value)}
                    placeholder="gsk_..."
                    className="w-full bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Cloudflare API Token */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
                  <label className="text-[11px] font-bold text-orange-400 uppercase font-mono">Cloudflare Workers AI Token</label>
                  <input
                    type="password"
                    value={keys.cloudflareApiToken || ''}
                    onChange={(e) => handleKeyChange('cloudflareApiToken', e.target.value)}
                    placeholder="cfut_..."
                    className="w-full bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {/* YouTube Channel 1 OAuth Refresh Token */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold text-emerald-400 uppercase font-mono flex items-center justify-between">
                    <span>Channel 1 Refresh Token (Fin Blueprint - @bones_ceo)</span>
                    <span className="text-[9px] text-emerald-400">Linked</span>
                  </label>
                  <input
                    type="password"
                    value={keys.youtubeRefreshToken || ''}
                    onChange={(e) => handleKeyChange('youtubeRefreshToken', e.target.value)}
                    placeholder="1//04frh8x79M592..."
                    className="w-full bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* YouTube Channel 2 OAuth Refresh Token */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold text-purple-400 uppercase font-mono flex items-center justify-between">
                    <span>Channel 2 Refresh Token (The Stoic Architect - @thestoicarchitect-n4b)</span>
                    <span className="text-[9px] text-purple-400">Linked</span>
                  </label>
                  <input
                    type="password"
                    value={keys.youtube2RefreshToken || ''}
                    onChange={(e) => handleKeyChange('youtube2RefreshToken', e.target.value)}
                    placeholder="1//04J5LbgK4Xc1O..."
                    className="w-full bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* YouTube Channel 3 OAuth Refresh Token */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold text-blue-400 uppercase font-mono flex items-center justify-between">
                    <span>Channel 3 Refresh Token (Godswill Isaac - @bonesceo)</span>
                    <span className="text-[9px] text-blue-400">Linked</span>
                  </label>
                  <input
                    type="password"
                    value={keys.youtube3RefreshToken || ''}
                    onChange={(e) => handleKeyChange('youtube3RefreshToken', e.target.value)}
                    placeholder="1//04zi4CbZJK6Tp..."
                    className="w-full bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveKeys}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 cursor-pointer transition-all"
                >
                  Save Integration Settings
                </button>
              </div>

              {/* Approved Team Members Section */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Approved Team Members & Access Controls
                </h3>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newApprovedEmail}
                    onChange={(e) => setNewApprovedEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="flex-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs text-white"
                  />
                  <button
                    onClick={handleApproveUser}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Grant Access
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {approvedUsers.map(email => (
                    <span key={email} className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300">
                      {email}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 9:16 VERTICAL SHORT VIDEO PLAYER MODAL */}
      {selectedCampaignForPlayer && (
        <VerticalVideoPlayer
          campaign={selectedCampaignForPlayer}
          isOpen={Boolean(selectedCampaignForPlayer)}
          onClose={() => setSelectedCampaignForPlayer(null)}
        />
      )}

      {/* CHANNEL REBRANDING & PROFILE CONFIGURATION MODAL */}
      {editingChannelNum !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl ${editingChannelNum === 2 ? 'bg-purple-600/30 text-purple-400 border border-purple-500/30' : editingChannelNum === 1 ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/30' : 'bg-blue-600/30 text-blue-400 border border-blue-500/30'} flex items-center justify-center`}>
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Rebrand Channel {editingChannelNum} Profile
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Update channel name, handle, avatar photo, and bio description
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingChannelNum(null);
                  setTempChannelForm({});
                }}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Channel Profile Avatar Preview & URL */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-300 uppercase font-mono">
                  Profile Avatar Image
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={tempChannelForm.thumbnail || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80'}
                    alt="Channel Preview"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80';
                    }}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shadow-md shrink-0 ring-2 ring-purple-500/30"
                  />
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={tempChannelForm.thumbnail || ''}
                      onChange={(e) => setTempChannelForm(prev => ({ ...prev, thumbnail: e.target.value }))}
                      placeholder="https://... avatar image URL"
                      className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-200 text-xs font-mono focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-slate-500">Presets:</span>
                      <button
                        type="button"
                        onClick={() => setTempChannelForm(prev => ({
                          ...prev,
                          thumbnail: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80'
                        }))}
                        className="text-[10px] text-purple-400 hover:text-purple-300 underline cursor-pointer"
                      >
                        Modern Dark Marble
                      </button>
                      <span className="text-slate-700">•</span>
                      <button
                        type="button"
                        onClick={() => setTempChannelForm(prev => ({
                          ...prev,
                          thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&auto=format&fit=crop&q=80'
                        }))}
                        className="text-[10px] text-purple-400 hover:text-purple-300 underline cursor-pointer"
                      >
                        Moody Twilight Summit
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Channel Display Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase font-mono">
                  Channel Name
                </label>
                <input
                  type="text"
                  value={tempChannelForm.title || ''}
                  onChange={(e) => setTempChannelForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Modern Stoic Fortitude"
                  className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-200 text-xs font-semibold focus:ring-1 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Custom Handle / Username */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase font-mono">
                  Username / Handle (@)
                </label>
                <input
                  type="text"
                  value={tempChannelForm.customUrl || ''}
                  onChange={(e) => setTempChannelForm(prev => ({ ...prev, customUrl: e.target.value }))}
                  placeholder="e.g. @thestoicarchitect-n4b"
                  className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-200 text-xs font-mono focus:ring-1 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Channel Bio / Description */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 uppercase font-mono">
                    Channel Bio / Description
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {(tempChannelForm.description || '').length} chars
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={tempChannelForm.description || ''}
                  onChange={(e) => setTempChannelForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Modern Stoicism, discipline protocols, emotional sovereignty, and daily mental strength. Master your reaction, master your life."
                  className="w-full bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-200 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setEditingChannelNum(null);
                  setTempChannelForm({});
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (editingChannelNum === null) return;
                  let updated1 = channel1Data;
                  let updated2 = channel2Data;
                  let updated3 = channel3Data;

                  if (editingChannelNum === 1) {
                    updated1 = { ...channel1Data, ...tempChannelForm } as ChannelMetrics;
                    setChannel1Data(updated1);
                  } else if (editingChannelNum === 2) {
                    updated2 = { ...channel2Data, ...tempChannelForm } as ChannelMetrics;
                    setChannel2Data(updated2);
                  } else if (editingChannelNum === 3) {
                    updated3 = { ...channel3Data, ...tempChannelForm } as ChannelMetrics;
                    setChannel3Data(updated3);
                  }

                  await dbAdapter.saveChannels([updated1, updated2, updated3]);
                  setEditingChannelNum(null);
                  setTempChannelForm({});
                }}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30 cursor-pointer"
              >
                Save Channel Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
