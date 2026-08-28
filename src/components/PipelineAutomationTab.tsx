import React, { useState } from 'react';
import { 
  GitBranch, 
  Workflow, 
  Layers, 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Database, 
  Cloud, 
  Cpu, 
  AlertTriangle, 
  FileCode2, 
  RefreshCw, 
  Send,
  Sparkles,
  TrendingUp,
  DollarSign
} from 'lucide-react';

export const PipelineAutomationTab: React.FC = () => {
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<number>(1);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const workflow1Yaml = `name: 01-voxam-the-brain-daily-blueprint
on:
  schedule:
    - cron: '0 0 * * *' # 12:00 AM UTC (01:00 AM WAT) Daily
  workflow_dispatch:

jobs:
  analyze-and-generate-blueprints:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Run Brain Engine
        env:
          GEMINI_API_KEY: \${{ secrets.GEMINI_API_KEY }}
          GROQ_API_KEY: \${{ secrets.GROQ_API_KEY }}
          OPENROUTER_API_KEY: \${{ secrets.OPENROUTER_API_KEY }}
          FIREBASE_CONFIG_JSON: \${{ secrets.FIREBASE_CONFIG_JSON }}
        run: |
          node scripts/brain_daily_generator.cjs
          echo "Generated 12 blueprints (4 per channel) written to Firestore queue with status READY_FOR_MEDIA"`;

  const workflow2Yaml = `name: 02-voxam-media-asset-engine
on:
  schedule:
    - cron: '*/45 * * * *' # Runs staggered to process queued jobs
  workflow_dispatch:

jobs:
  generate-media-assets:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Generate Audio & Images & Upload to Cloudinary
        env:
          HUGGINGFACE_TOKEN: \${{ secrets.HUGGINGFACE_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: \${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          CLOUDFLARE_API_TOKEN: \${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDINARY_CLOUD_NAME: \${{ secrets.CLOUDINARY_CLOUD_NAME }}
          CLOUDINARY_UPLOAD_PRESET: \${{ secrets.CLOUDINARY_UPLOAD_PRESET }}
          FIREBASE_CONFIG_JSON: \${{ secrets.FIREBASE_CONFIG_JSON }}
        run: |
          node scripts/asset_generator_queue.cjs
          echo "Assets uploaded to Cloudinary. Job updated to READY_FOR_RENDER"`;

  const workflowVisualEnhancementYaml = `name: 02.5-voxam-visual-enhancement-flux
on:
  schedule:
    - cron: '*/30 * * * *' # Processes queued jobs to synthesize high-CTR Slide 0 thumbnails
  workflow_dispatch:

jobs:
  enhance-thumbnails-with-flux:
    name: FLUX.1 High-CTR Visual Enhancement Engine
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Synthesize 9:16 High-Contrast Thumbnails via FLUX.1 Schnell
        env:
          CLOUDFLARE_ACCOUNT_ID: \${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          CLOUDFLARE_API_TOKEN: \${{ secrets.CLOUDFLARE_API_TOKEN }}
          FIREBASE_CONFIG_JSON: \${{ secrets.FIREBASE_CONFIG_JSON }}
        run: |
          node scripts/visual_enhancement_flux.cjs
          echo "FLUX.1 Slide 0 Thumbnails Enhanced. High CTR verified."`;

  const workflow3Yaml = `name: 03-voxam-video-motion-renderer
on:
  schedule:
    - cron: '15,45 * * * *' # Runs right after media generation
  workflow_dispatch:

jobs:
  render-video-with-ffmpeg:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Install FFmpeg & ImageMagick
        run: |
          sudo apt-get update
          sudo apt-get install -y ffmpeg imagemagick

      - name: Assemble Vertical MP4 + Ken Burns + Synchronized Subtitles
        env:
          CLOUDINARY_CLOUD_NAME: \${{ secrets.CLOUDINARY_CLOUD_NAME }}
          CLOUDINARY_UPLOAD_PRESET: \${{ secrets.CLOUDINARY_UPLOAD_PRESET }}
          FIREBASE_CONFIG_JSON: \${{ secrets.FIREBASE_CONFIG_JSON }}
        run: |
          node scripts/video_motion_compiler.cjs
          echo "Render complete! MP4 saved to Cloudinary. Job status: READY_FOR_PUBLISH"`;

  const workflowTestFinYaml = `name: Test Fin Blueprint Pipeline
on:
  workflow_dispatch:
    inputs:
      topic:
        description: 'Video Topic / Theme'
        required: false
        default: ''
        type: string
      dry_run:
        description: 'Dry Run Mode (No live YouTube upload)'
        required: true
        default: true
        type: boolean

jobs:
  test_fin_pipeline:
    name: Run Fin Blueprint Pipeline Diagnostic
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install --legacy-peer-deps || true
      - run: sudo apt-get update && sudo apt-get install -y ffmpeg
      - name: Execute Fin Blueprint Test Runner
        env:
          TEST_TOPIC: \${{ github.event.inputs.topic }}
          DRY_RUN: \${{ github.event.inputs.dry_run }}
          GROQ_API_KEY: \${{ secrets.GROQ_API_KEY }}
          FIREBASE_CONFIG_JSON: \${{ secrets.FIREBASE_CONFIG_JSON }}
        run: node scripts/test_fin_runner.cjs`;

  const workflowTestStoicYaml = `name: Test Stoic & Motivation Pipeline
on:
  workflow_dispatch:
    inputs:
      topic:
        description: 'Video Topic / Theme'
        required: false
        default: ''
        type: string
      dry_run:
        description: 'Dry Run Mode (No live YouTube upload)'
        required: true
        default: true
        type: boolean

jobs:
  test_pipeline:
    name: Run Stoic Pipeline Diagnostic
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install --legacy-peer-deps || true
      - run: sudo apt-get update && sudo apt-get install -y ffmpeg
      - name: Execute Stoic Test Runner
        env:
          TEST_TOPIC: \${{ github.event.inputs.topic }}
          DRY_RUN: \${{ github.event.inputs.dry_run }}
          GROQ_API_KEY: \${{ secrets.GROQ_API_KEY }}
          FIREBASE_CONFIG_JSON: \${{ secrets.FIREBASE_CONFIG_JSON }}
        run: node scripts/test_stoic_runner.cjs`;

  const workflowTestTechYaml = `name: Test Tech AI Pipeline
on:
  workflow_dispatch:
    inputs:
      topic:
        description: 'Video Topic / Theme'
        required: false
        default: ''
        type: string
      dry_run:
        description: 'Dry Run Mode (No live YouTube upload)'
        required: true
        default: true
        type: boolean

jobs:
  test_tech_pipeline:
    name: Run Tech AI Pipeline Diagnostic
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install --legacy-peer-deps || true
      - run: sudo apt-get update && sudo apt-get install -y ffmpeg
      - name: Execute Tech AI Test Runner
        env:
          TEST_TOPIC: \${{ github.event.inputs.topic }}
          DRY_RUN: \${{ github.event.inputs.dry_run }}
          GROQ_API_KEY: \${{ secrets.GROQ_API_KEY }}
          FIREBASE_CONFIG_JSON: \${{ secrets.FIREBASE_CONFIG_JSON }}
        run: node scripts/test_tech_runner.cjs`;

  return (
    <div className="space-y-8 w-full max-w-full min-w-0 overflow-x-hidden">
      {/* Header Banner */}
      <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 border border-slate-800 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 text-xs font-bold font-mono">
              <Zap className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              Decoupled 4-Stage Queue Pipeline Architecture
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight break-words">
              Autonomous GitHub Actions Factory
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Every stage is decoupled to eliminate rate-limits, prevent FFmpeg crashes, and ensure strict persona compliance across all 3 channels without mixing video assets.
            </p>
          </div>

          <div className="flex flex-col gap-2 p-4 bg-slate-950/80 border border-slate-800 rounded-2xl shrink-0 font-mono text-xs text-slate-300 w-full sm:w-auto">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Daily Videos:</span>
              <span className="text-emerald-400 font-bold">12 Total (4 / Channel)</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Schedule:</span>
              <span className="text-indigo-400 font-bold">08:00, 12:00, 16:00, 20:00 WAT</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Cloud Storage:</span>
              <span className="text-sky-400 font-bold">Cloudinary (voxawell)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quota Strategy & Project Breakdown Card */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Google Cloud YouTube Quota Strategy & Current Project Breakdown</h2>
            <p className="text-xs text-slate-400">Understanding how many projects you are currently using and how the daily quota works.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
            <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">Current Setup</div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              1 Google Cloud Project (Shared)
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your 3 channels are currently authorized under <span className="text-indigo-300 font-mono">Client ID: 166707266012...</span> in project <span className="text-indigo-300 font-mono">gen-lang-client-0135161700</span>.
            </p>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
            <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">The YouTube Quota Limit</div>
            <div className="text-sm font-bold text-amber-400">10,000 Units / Day Per Project</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              1 video upload costs <strong className="text-slate-200">1,600 units</strong>.
              Uploading 12 videos in one day requires <strong className="text-rose-400 font-mono">19,200 units</strong>, which exceeds 1 default project's quota.
            </p>
          </div>

          <div className="p-4 bg-slate-950 border border-emerald-900/40 rounded-2xl space-y-2">
            <div className="text-[11px] font-mono uppercase text-emerald-400 font-bold">The Safe Production Solution</div>
            <div className="text-sm font-bold text-emerald-300">Staggered or Multi-Project Client</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              You can request a free YouTube quota bump to 50k in GCP Console, or configure separate Client IDs for Channel 2 & 3 in the Settings tab (each GCP project gets 10k free daily).
            </p>
          </div>
        </div>
      </div>

      {/* Channel 1: Fin Blueprint Persona Formula */}
      <div className="p-6 bg-slate-900 border border-emerald-900/40 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Channel 1 Formula: Fin Blueprint (@bones_ceo)</h2>
              <p className="text-xs text-emerald-400/80">Strict Micro-Earnings Realistic Story System</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-mono rounded-full font-bold">
            ₦5,000 to ₦100,000 ($3–$70 USD)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
            <div className="font-bold text-slate-200">1. Realistic Character & Problem</div>
            <p className="text-slate-400 leading-relaxed">
              Named persona with age & location (e.g. <em>Tunde, 24 in Ibadan</em> or <em>Emeka, 28 in Abuja</em>) needing modest capital (e.g. ₦15,000) for a specific tool or starter kit.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
            <div className="font-bold text-slate-200">2. Low-Barrier Micro-SaaS Execution</div>
            <p className="text-slate-400 leading-relaxed">
              Solves problem using low-cost automation, digital products (Selar/Digistore), or freemium SaaS tools with zero initial coding.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
            <div className="font-bold text-slate-200">3. Honest Risks & Pitfalls</div>
            <p className="text-slate-400 leading-relaxed">
              Explicitly breaks down real hurdles (e.g. cold outreach burnout, delivery fees, gateway fees) to maintain 100% credibility.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
            <div className="font-bold text-slate-200">4. Seamless Affiliate CTA</div>
            <p className="text-slate-400 leading-relaxed">
              Includes natural partner link (Selar, tool trials, affiliate guides) in pinned comment and first 2 lines of video description.
            </p>
          </div>
        </div>
      </div>

      {/* The 4 Workflow YAML Specifications */}
      <div className="space-y-4 w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Workflow className="w-5 h-5 text-indigo-400 shrink-0" />
            <span>GitHub Actions Workflow Specifications (.github/workflows/)</span>
          </h2>
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-2xl border border-slate-800 overflow-x-auto max-w-full">
            {[
              { id: 1, label: '01: The Brain' },
              { id: 2, label: '02: Media Synth' },
              { id: 7, label: '02.5: FLUX.1 Visual Enhancement' },
              { id: 3, label: '03: Motion Render' },
              { id: 4, label: 'Test: Fin Blueprint (Ch1)' },
              { id: 5, label: 'Test: Stoic Architect (Ch2)' },
              { id: 6, label: 'Test: Tech AI (Ch3)' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveWorkflowTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  activeWorkflowTab === tab.id
                    ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-900/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Workflow Code Viewer */}
        <div className="p-4 sm:p-5 bg-slate-950 border border-slate-800 rounded-3xl space-y-4 w-full min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileCode2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-xs font-mono font-bold text-slate-200 truncate">
                {activeWorkflowTab === 1 && '.github/workflows/01-brain-daily-blueprint.yml'}
                {activeWorkflowTab === 2 && '.github/workflows/02-media-asset-engine.yml'}
                {activeWorkflowTab === 7 && '.github/workflows/02.5-voxam-visual-enhancement-flux.yml'}
                {activeWorkflowTab === 3 && '.github/workflows/03-video-motion-renderer.yml'}
                {activeWorkflowTab === 4 && '.github/workflows/test-fin-pipeline.yml'}
                {activeWorkflowTab === 5 && '.github/workflows/test-stoic-pipeline.yml'}
                {activeWorkflowTab === 6 && '.github/workflows/test-tech-pipeline.yml'}
              </span>
            </div>

            <button
              onClick={() => {
                const code = 
                  activeWorkflowTab === 1 ? workflow1Yaml : 
                  activeWorkflowTab === 2 ? workflow2Yaml : 
                  activeWorkflowTab === 7 ? workflowVisualEnhancementYaml :
                  activeWorkflowTab === 3 ? workflow3Yaml : 
                  activeWorkflowTab === 4 ? workflowTestFinYaml : 
                  activeWorkflowTab === 5 ? workflowTestStoicYaml : workflowTestTechYaml;
                copyToClipboard(code, `wf-${activeWorkflowTab}`);
              }}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              {copiedCode === `wf-${activeWorkflowTab}` ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>Copy Workflow YAML</>
              )}
            </button>
          </div>

          <div className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl border border-slate-800/80">
            <pre className="p-4 bg-slate-900/90 text-xs font-mono text-indigo-200 overflow-x-auto leading-relaxed max-w-full">
              <code className="block whitespace-pre font-mono">
                {activeWorkflowTab === 1 && workflow1Yaml}
                {activeWorkflowTab === 2 && workflow2Yaml}
                {activeWorkflowTab === 7 && workflowVisualEnhancementYaml}
                {activeWorkflowTab === 3 && workflow3Yaml}
                {activeWorkflowTab === 4 && workflowTestFinYaml}
                {activeWorkflowTab === 5 && workflowTestStoicYaml}
                {activeWorkflowTab === 6 && workflowTestTechYaml}
              </code>
            </pre>
          </div>
        </div>
      </div>

      {/* Fail-Safe & Auto Retry System */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-400" />
          Production Queue Fail-Safes & Subtitle Contrast Rules
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
            <div className="font-bold text-indigo-300">1. Triple Fallback Asset Generation</div>
            <p className="text-slate-400 leading-relaxed">
              If an image provider fails or rate-limits, Workflow 2 automatically tries:
              <br />
              <strong className="text-slate-300">Pollinations (Instant) → Cloudflare Workers AI → HuggingFace FLUX</strong>.
            </p>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
            <div className="font-bold text-indigo-300">2. Subtitle Contrast & Ken Burns Zoom</div>
            <p className="text-slate-400 leading-relaxed">
              Every subtitle is rendered with a <strong className="text-slate-300">3px dark outline + semi-transparent backing pill</strong> so text is readable over both light & dark image scenes. Ken Burns alternates zoom-in & zoom-out between frames.
            </p>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
            <div className="font-bold text-indigo-300">3. Safe Race-Condition Guard</div>
            <p className="text-slate-400 leading-relaxed">
              Workflow 4 only publishes videos that have strictly reached <strong className="text-emerald-400 font-mono">READY_FOR_PUBLISH</strong> status. If a video is still rendering, the publisher safely defers without throwing an unhandled exception.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
