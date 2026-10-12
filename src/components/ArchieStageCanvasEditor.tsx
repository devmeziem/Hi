import React, { useState, useRef, useEffect } from 'react';
import {
  Square,
  Circle,
  Triangle,
  Star,
  MessageSquare,
  Cloud,
  ArrowRight,
  Monitor,
  Type,
  Maximize2,
  Minimize2,
  Trash2,
  Pin,
  PinOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Palette,
  Copy,
  Check,
  User,
  Sliders,
  Eye,
  EyeOff,
  Sparkles,
  Download,
  Layers,
  Sun,
  Moon
} from 'lucide-react';

export type ShapeType =
  | 'rect'
  | 'circle'
  | 'triangle'
  | 'star'
  | 'bubble'
  | 'cloud'
  | 'arrow'
  | 'desk'
  | 'screen'
  | 'grid'
  | 'text';

export interface StageShape {
  id: string;
  type: ShapeType;
  x: number; // 0 to 1080
  y: number; // 0 to 1920
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  text?: string;
  isPinned: boolean;
  zIndex: number;
}

export interface StageBlueprint {
  name: string;
  backgroundColor: string;
  backgroundTheme: 'pure_dark' | 'clean_white' | 'custom_color';
  gradientStyle: 'solid' | 'studio_falloff' | 'spotlight' | 'cyber_grid';
  showArchie: boolean;
  archieX: number;
  archieY: number;
  archieScale: number; // 0.5 to 1.5
  archiePose: 'idle' | 'talking' | 'pointing_right' | 'pointing_left' | 'thinking' | 'welcoming' | 'seated_desk';
  shapes: StageShape[];
  canvasWidth: number;
  canvasHeight: number;
  updatedAt: string;
}

interface ArchieStageCanvasEditorProps {
  onToast?: (toast: { text: string; isError: boolean }) => void;
  onApplyToEngine?: (blueprint: StageBlueprint) => void;
}

export const ArchieStageCanvasEditor: React.FC<ArchieStageCanvasEditorProps> = ({
  onToast,
  onApplyToEngine
}) => {
  // Zoom & Viewport state (50% to 200%)
  const [zoomLevel, setZoomLevel] = useState<number>(0.75); // Scaled preview
  const [copiedBlueprint, setCopiedBlueprint] = useState<boolean>(false);
  const [copiedSvg, setCopiedSvg] = useState<boolean>(false);

  // Background & Theme state
  const [bgTheme, setBgTheme] = useState<'pure_dark' | 'clean_white' | 'custom_color'>('pure_dark');
  const [customBgColor, setCustomBgColor] = useState<string>('#0b0f19');
  const [gradientStyle, setGradientStyle] = useState<'solid' | 'studio_falloff' | 'spotlight' | 'cyber_grid'>('studio_falloff');

  // Archie on Stage state
  const [showArchie, setShowArchie] = useState<boolean>(true);
  const [archieX, setArchieX] = useState<number>(540);
  const [archieY, setArchieY] = useState<number>(1080);
  const [archieScale, setArchieScale] = useState<number>(1.0);
  const [archiePose, setArchiePose] = useState<'idle' | 'talking' | 'pointing_right' | 'pointing_left' | 'thinking' | 'welcoming' | 'seated_desk'>('pointing_right');

  // Shapes & Stage Elements state
  const [shapes, setShapes] = useState<StageShape[]>([
    {
      id: 'studio-desk',
      type: 'desk',
      x: 140,
      y: 1360,
      width: 800,
      height: 180,
      fill: '#1e293b',
      stroke: '#38bdf8',
      strokeWidth: 2,
      opacity: 0.95,
      isPinned: true,
      zIndex: 10
    },
    {
      id: 'topic-board',
      type: 'rect',
      x: 100,
      y: 280,
      width: 880,
      height: 260,
      fill: '#0f172a',
      stroke: '#f59e0b',
      strokeWidth: 2.5,
      opacity: 0.9,
      isPinned: false,
      zIndex: 2
    },
    {
      id: 'header-label',
      type: 'text',
      x: 540,
      y: 370,
      width: 700,
      height: 60,
      fill: '#ffffff',
      stroke: 'none',
      strokeWidth: 0,
      opacity: 1,
      text: 'ARCHIE SCIENCE LAB',
      isPinned: false,
      zIndex: 3
    },
    {
      id: 'speech-bubble',
      type: 'bubble',
      x: 180,
      y: 620,
      width: 440,
      height: 180,
      fill: '#0284c7',
      stroke: '#38bdf8',
      strokeWidth: 2,
      opacity: 0.9,
      text: 'Notice how this works?',
      isPinned: false,
      zIndex: 5
    }
  ]);

  const [selectedShapeId, setSelectedShapeId] = useState<string | null>('topic-board');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Load persisted blueprint from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('voxam_archie_stage_blueprint');
      if (saved) {
        const parsed: StageBlueprint = JSON.parse(saved);
        if (parsed.shapes) setShapes(parsed.shapes);
        if (parsed.backgroundTheme) setBgTheme(parsed.backgroundTheme);
        if (parsed.backgroundColor) setCustomBgColor(parsed.backgroundColor);
        if (parsed.gradientStyle) setGradientStyle(parsed.gradientStyle);
        if (typeof parsed.showArchie === 'boolean') setShowArchie(parsed.showArchie);
        if (parsed.archieX) setArchieX(parsed.archieX);
        if (parsed.archieY) setArchieY(parsed.archieY);
        if (parsed.archieScale) setArchieScale(parsed.archieScale);
        if (parsed.archiePose) setArchiePose(parsed.archiePose);
      }
    } catch {}
  }, []);

  const activeColor = bgTheme === 'pure_dark' ? '#000000' : bgTheme === 'clean_white' ? '#ffffff' : customBgColor;
  const isLightMode = bgTheme === 'clean_white' || (bgTheme === 'custom_color' && customBgColor.toLowerCase() === '#ffffff');

  const selectedShape = shapes.find(s => s.id === selectedShapeId);

  // Add new shape to canvas
  const handleAddShape = (type: ShapeType) => {
    const id = `${type}-${Date.now()}`;
    let newShape: StageShape;

    switch (type) {
      case 'rect':
        newShape = {
          id,
          type,
          x: 290,
          y: 700,
          width: 500,
          height: 300,
          fill: isLightMode ? '#f1f5f9' : '#0f172a',
          stroke: '#38bdf8',
          strokeWidth: 2,
          opacity: 0.9,
          isPinned: false,
          zIndex: shapes.length + 1
        };
        break;
      case 'circle':
        newShape = {
          id,
          type,
          x: 390,
          y: 700,
          width: 300,
          height: 300,
          fill: isLightMode ? '#e2e8f0' : '#1e293b',
          stroke: '#10b981',
          strokeWidth: 2,
          opacity: 0.85,
          isPinned: false,
          zIndex: shapes.length + 1
        };
        break;
      case 'triangle':
        newShape = {
          id,
          type,
          x: 390,
          y: 700,
          width: 300,
          height: 300,
          fill: isLightMode ? '#fef3c7' : '#78350f',
          stroke: '#f59e0b',
          strokeWidth: 2,
          opacity: 0.9,
          isPinned: false,
          zIndex: shapes.length + 1
        };
        break;
      case 'star':
        newShape = {
          id,
          type,
          x: 440,
          y: 600,
          width: 200,
          height: 200,
          fill: '#f59e0b',
          stroke: '#fbbf24',
          strokeWidth: 2,
          opacity: 1,
          isPinned: false,
          zIndex: shapes.length + 1
        };
        break;
      case 'bubble':
        newShape = {
          id,
          type,
          x: 300,
          y: 600,
          width: 480,
          height: 200,
          fill: isLightMode ? '#ffffff' : '#0369a1',
          stroke: '#38bdf8',
          strokeWidth: 2.5,
          opacity: 0.95,
          text: 'Key Principle Explained',
          isPinned: false,
          zIndex: shapes.length + 1
        };
        break;
      case 'cloud':
        newShape = {
          id,
          type,
          x: 300,
          y: 500,
          width: 480,
          height: 240,
          fill: isLightMode ? '#e2e8f0' : '#1e293b',
          stroke: '#94a3b8',
          strokeWidth: 2,
          opacity: 0.85,
          text: 'Theoretical Model',
          isPinned: false,
          zIndex: shapes.length + 1
        };
        break;
      case 'arrow':
        newShape = {
          id,
          type,
          x: 340,
          y: 800,
          width: 400,
          height: 80,
          fill: '#10b981',
          stroke: '#34d399',
          strokeWidth: 2,
          opacity: 0.9,
          isPinned: false,
          zIndex: shapes.length + 1
        };
        break;
      case 'desk':
        newShape = {
          id,
          type,
          x: 90,
          y: 1380,
          width: 900,
          height: 200,
          fill: isLightMode ? '#334155' : '#0f172a',
          stroke: '#38bdf8',
          strokeWidth: 2,
          opacity: 1,
          isPinned: true,
          zIndex: shapes.length + 1
        };
        break;
      case 'screen':
        newShape = {
          id,
          type,
          x: 190,
          y: 750,
          width: 700,
          height: 420,
          fill: '#020617',
          stroke: '#38bdf8',
          strokeWidth: 3,
          opacity: 0.95,
          text: '4K Specimen Visualizer',
          isPinned: false,
          zIndex: shapes.length + 1
        };
        break;
      case 'grid':
        newShape = {
          id,
          type,
          x: 40,
          y: 1200,
          width: 1000,
          height: 600,
          fill: 'none',
          stroke: '#38bdf8',
          strokeWidth: 1,
          opacity: 0.25,
          isPinned: true,
          zIndex: 1
        };
        break;
      case 'text':
      default:
        newShape = {
          id,
          type: 'text',
          x: 540,
          y: 650,
          width: 600,
          height: 80,
          fill: isLightMode ? '#0f172a' : '#ffffff',
          stroke: 'none',
          strokeWidth: 0,
          opacity: 1,
          text: 'Tap to edit message',
          isPinned: false,
          zIndex: shapes.length + 1
        };
        break;
    }

    setShapes(prev => [...prev, newShape]);
    setSelectedShapeId(id);
    if (onToast) onToast({ text: `Added ${type} shape to stage`, isError: false });
  };

  // Modify shape properties
  const updateSelectedShape = (patch: Partial<StageShape>) => {
    if (!selectedShapeId) return;
    setShapes(prev => prev.map(s => s.id === selectedShapeId ? { ...s, ...patch } : s));
  };

  // Resize +/-
  const handleScaleShape = (delta: number) => {
    if (!selectedShape) return;
    const newWidth = Math.max(40, Math.round(selectedShape.width * (1 + delta)));
    const newHeight = Math.max(20, Math.round(selectedShape.height * (1 + delta)));
    updateSelectedShape({ width: newWidth, height: newHeight });
  };

  // Delete selected shape (only if unpinned)
  const handleDeleteSelected = () => {
    if (!selectedShape) return;
    if (selectedShape.isPinned) {
      if (onToast) onToast({ text: 'Cannot delete pinned shape. Unpin first to remove.', isError: true });
      return;
    }
    setShapes(prev => prev.filter(s => s.id !== selectedShapeId));
    setSelectedShapeId(null);
    if (onToast) onToast({ text: 'Deleted shape from stage', isError: false });
  };

  // Clear unpinned shapes
  const handleClearUnpinned = () => {
    setShapes(prev => prev.filter(s => s.isPinned));
    setSelectedShapeId(null);
    if (onToast) onToast({ text: 'Cleared all unpinned shapes from stage', isError: false });
  };

  // Toggle pin
  const handleTogglePin = () => {
    if (!selectedShape) return;
    const newPinned = !selectedShape.isPinned;
    updateSelectedShape({ isPinned: newPinned });
    if (onToast) onToast({ text: newPinned ? 'Element pinned to stage (Locked)' : 'Element unpinned (Movable)', isError: false });
  };

  // Compile full blueprint
  const getCompiledBlueprint = (): StageBlueprint => ({
    name: 'Archie Studio Custom Stage',
    backgroundColor: activeColor,
    backgroundTheme: bgTheme,
    gradientStyle,
    showArchie,
    archieX,
    archieY,
    archieScale,
    archiePose,
    shapes,
    canvasWidth: 1080,
    canvasHeight: 1920,
    updatedAt: new Date().toISOString()
  });

  // Export structured JSON blueprint
  const handleCopyBlueprint = () => {
    const bp = getCompiledBlueprint();
    navigator.clipboard.writeText(JSON.stringify(bp, null, 2));
    setCopiedBlueprint(true);
    setTimeout(() => setCopiedBlueprint(false), 3000);
    if (onToast) onToast({ text: 'Stage Blueprint JSON copied to clipboard!', isError: false });
  };

  // Export direct SVG markup
  const generateSvgMarkup = (): string => {
    const bp = getCompiledBlueprint();
    const shapesSvg = shapes.map(s => {
      if (s.type === 'rect') {
        return `<rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" rx="24" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}" opacity="${s.opacity}" />`;
      }
      if (s.type === 'circle') {
        return `<ellipse cx="${s.x + s.width / 2}" cy="${s.y + s.height / 2}" rx="${s.width / 2}" ry="${s.height / 2}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}" opacity="${s.opacity}" />`;
      }
      if (s.type === 'triangle') {
        const p1 = `${s.x + s.width / 2},${s.y}`;
        const p2 = `${s.x + s.width},${s.y + s.height}`;
        const p3 = `${s.x},${s.y + s.height}`;
        return `<polygon points="${p1} ${p2} ${p3}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}" opacity="${s.opacity}" />`;
      }
      if (s.type === 'star') {
        const cx = s.x + s.width / 2;
        const cy = s.y + s.height / 2;
        const r1 = s.width / 2;
        const r2 = r1 * 0.45;
        let pts = [];
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? r1 : r2;
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
        }
        return `<polygon points="${pts.join(' ')}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}" opacity="${s.opacity}" />`;
      }
      if (s.type === 'bubble') {
        return `<g opacity="${s.opacity}">
          <rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" rx="32" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}" />
          <polygon points="${s.x + 60},${s.y + s.height} ${s.x + 90},${s.y + s.height + 35} ${s.x + 110},${s.y + s.height}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}" />
          ${s.text ? `<text x="${s.x + s.width / 2}" y="${s.y + s.height / 2 + 8}" font-family="system-ui, sans-serif" font-size="28" font-weight="800" fill="#ffffff" text-anchor="middle">${s.text}</text>` : ''}
        </g>`;
      }
      if (s.type === 'cloud') {
        return `<g opacity="${s.opacity}">
          <rect x="${s.x}" y="${s.y + 40}" width="${s.width}" height="${s.height - 40}" rx="40" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}" />
          <circle cx="${s.x + s.width * 0.3}" cy="${s.y + 40}" r="${s.height * 0.35}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}" />
          <circle cx="${s.x + s.width * 0.65}" cy="${s.y + 30}" r="${s.height * 0.45}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}" />
          ${s.text ? `<text x="${s.x + s.width / 2}" y="${s.y + s.height / 2 + 20}" font-family="system-ui, sans-serif" font-size="26" font-weight="700" fill="#ffffff" text-anchor="middle">${s.text}</text>` : ''}
        </g>`;
      }
      if (s.type === 'arrow') {
        const cy = s.y + s.height / 2;
        return `<g opacity="${s.opacity}">
          <rect x="${s.x}" y="${cy - 12}" width="${s.width - 50}" height="24" rx="12" fill="${s.fill}" />
          <polygon points="${s.x + s.width - 60},${cy - 35} ${s.x + s.width},${cy} ${s.x + s.width - 60},${cy + 35}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}" />
        </g>`;
      }
      if (s.type === 'desk') {
        return `<g opacity="${s.opacity}">
          <rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" rx="28" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}" />
          <line x1="${s.x + 30}" y1="${s.y + 20}" x2="${s.x + s.width - 30}" y2="${s.y + 20}" stroke="#38bdf8" stroke-width="3" stroke-opacity="0.8" />
        </g>`;
      }
      if (s.type === 'screen') {
        return `<g opacity="${s.opacity}">
          <rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" rx="24" fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}" />
          <text x="${s.x + s.width / 2}" y="${s.y + s.height / 2}" font-family="system-ui, sans-serif" font-size="28" font-weight="800" fill="#38bdf8" text-anchor="middle">${s.text || 'DISPLAY'}</text>
        </g>`;
      }
      if (s.type === 'text') {
        return `<text x="${s.x}" y="${s.y}" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="900" fill="${s.fill}" text-anchor="middle">${s.text || 'TEXT'}</text>`;
      }
      return '';
    }).join('\n    ');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <defs>
    <linearGradient id="studioFalloff" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${activeColor}" stop-opacity="0.9" />
      <stop offset="70%" stop-color="${activeColor}" stop-opacity="1" />
      <stop offset="100%" stop-color="#020617" stop-opacity="1" />
    </linearGradient>
    <radialGradient id="spotlightGrad" cx="50%" cy="30%" r="65%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.25" />
      <stop offset="60%" stop-color="${activeColor}" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#000000" stop-opacity="1" />
    </radialGradient>
  </defs>
  <!-- Background Theme -->
  <rect x="0" y="0" width="1080" height="1920" fill="${gradientStyle === 'spotlight' ? 'url(#spotlightGrad)' : gradientStyle === 'studio_falloff' ? 'url(#studioFalloff)' : activeColor}" />

  <!-- Shapes & Stage Elements -->
  ${shapesSvg}

  ${bp.showArchie ? `<!-- Archie Character Anchor [x=${bp.archieX}, y=${bp.archieY}, scale=${bp.archieScale}, pose=${bp.archiePose}] -->
  <g id="archie-presenter-anchor" transform="translate(${bp.archieX - 250}, ${bp.archieY - 500}) scale(${bp.archieScale})">
    <circle cx="250" cy="500" r="14" fill="#38bdf8" />
  </g>` : ''}
</svg>`;
  };

  const handleCopySvg = () => {
    const svgCode = generateSvgMarkup();
    navigator.clipboard.writeText(svgCode);
    setCopiedSvg(true);
    setTimeout(() => setCopiedSvg(false), 3000);
    if (onToast) onToast({ text: 'Standalone SVG code copied to clipboard!', isError: false });
  };

  const handleApplyToEngine = () => {
    const bp = getCompiledBlueprint();
    localStorage.setItem('voxam_archie_stage_blueprint', JSON.stringify(bp));
    if (onApplyToEngine) onApplyToEngine(bp);
    if (onToast) onToast({ text: 'Custom environment blueprint applied to active Archie engine!', isError: false });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              CLIENT-SIDE VECTOR STAGE
            </span>
            <span className="text-xs text-slate-400 font-mono">1080 × 1920 Native Canvas</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white mt-1">
            Archie SVG Stage &amp; Environment Vector Studio
          </h2>
          <p className="text-xs text-slate-400">
            Craft custom studio sets, shapes, desks, and speech callouts. Export cleanly to JSON or SVG for direct engine ingestion.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyBlueprint}
            className="py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export layout as structured JSON"
          >
            {copiedBlueprint ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedBlueprint ? 'JSON Copied!' : 'Copy Blueprint JSON'}</span>
          </button>

          <button
            onClick={handleCopySvg}
            className="py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export standalone SVG code"
          >
            {copiedSvg ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
            <span>{copiedSvg ? 'SVG Copied!' : 'Copy SVG Code'}</span>
          </button>

          <button
            onClick={handleApplyToEngine}
            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Apply to Live Archie Engine</span>
          </button>
        </div>
      </div>

      {/* Main Studio Workstation: Left Controls + Center Canvas + Right Shape Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Tool Palette & Archie Actor Controls (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Add Shapes Palette */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                Shape &amp; Prop Library
              </span>
              <span className="text-[10px] font-mono text-slate-400">{shapes.length} elements</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleAddShape('rect')}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-center text-slate-300 text-[11px] font-medium flex flex-col items-center gap-1 cursor-pointer transition-colors"
                title="Add Card / Rectangle"
              >
                <Square className="w-4 h-4 text-sky-400" />
                <span>Card</span>
              </button>

              <button
                onClick={() => handleAddShape('circle')}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-center text-slate-300 text-[11px] font-medium flex flex-col items-center gap-1 cursor-pointer transition-colors"
                title="Add Circle / Disc"
              >
                <Circle className="w-4 h-4 text-emerald-400" />
                <span>Circle</span>
              </button>

              <button
                onClick={() => handleAddShape('triangle')}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-center text-slate-300 text-[11px] font-medium flex flex-col items-center gap-1 cursor-pointer transition-colors"
                title="Add Triangle"
              >
                <Triangle className="w-4 h-4 text-amber-400" />
                <span>Triangle</span>
              </button>

              <button
                onClick={() => handleAddShape('star')}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-center text-slate-300 text-[11px] font-medium flex flex-col items-center gap-1 cursor-pointer transition-colors"
                title="Add Star"
              >
                <Star className="w-4 h-4 text-amber-300" />
                <span>Star</span>
              </button>

              <button
                onClick={() => handleAddShape('bubble')}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-center text-slate-300 text-[11px] font-medium flex flex-col items-center gap-1 cursor-pointer transition-colors"
                title="Add Speech Bubble"
              >
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span>Bubble</span>
              </button>

              <button
                onClick={() => handleAddShape('cloud')}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-center text-slate-300 text-[11px] font-medium flex flex-col items-center gap-1 cursor-pointer transition-colors"
                title="Add Thought Cloud"
              >
                <Cloud className="w-4 h-4 text-purple-400" />
                <span>Cloud</span>
              </button>

              <button
                onClick={() => handleAddShape('arrow')}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-center text-slate-300 text-[11px] font-medium flex flex-col items-center gap-1 cursor-pointer transition-colors"
                title="Add Pointer Arrow"
              >
                <ArrowRight className="w-4 h-4 text-rose-400" />
                <span>Arrow</span>
              </button>

              <button
                onClick={() => handleAddShape('desk')}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-center text-slate-300 text-[11px] font-medium flex flex-col items-center gap-1 cursor-pointer transition-colors"
                title="Add Modern Grounded Desk"
              >
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>Desk Bar</span>
              </button>

              <button
                onClick={() => handleAddShape('screen')}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-center text-slate-300 text-[11px] font-medium flex flex-col items-center gap-1 cursor-pointer transition-colors"
                title="Add Display Screen"
              >
                <Monitor className="w-4 h-4 text-teal-400" />
                <span>Screen</span>
              </button>

              <button
                onClick={() => handleAddShape('text')}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-center text-slate-300 text-[11px] font-medium flex flex-col items-center gap-1 cursor-pointer transition-colors col-span-3"
                title="Add Text Label"
              >
                <div className="flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-emerald-400" />
                  <span>Custom Heading / Text</span>
                </div>
              </button>
            </div>
          </div>

          {/* Archie Stage Presence & Pose Controller */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-400" />
                Archie Character Actor
              </span>
              <button
                onClick={() => setShowArchie(!showArchie)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                  showArchie
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                {showArchie ? 'On Stage' : 'Removed'}
              </button>
            </div>

            {showArchie && (
              <div className="space-y-3 pt-1 text-xs">
                {/* Pose Selection */}
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Actor Gesture</label>
                  <select
                    value={archiePose}
                    onChange={(e) => setArchiePose(e.target.value as any)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-sans cursor-pointer"
                  >
                    <option value="pointing_right">Pointing Up-Right (Topic Focus)</option>
                    <option value="pointing_left">Pointing Left (Specimen HUD)</option>
                    <option value="talking">Active Explaining &amp; Talking</option>
                    <option value="thinking">Thinking / Hand Under Chin</option>
                    <option value="welcoming">Welcoming Audience (Hands Open)</option>
                    <option value="seated_desk">Seated at Modern Desk Setup</option>
                    <option value="idle">Natural Conversational Idle</option>
                  </select>
                </div>

                {/* Horizontal Position (X) */}
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>X Position (Stage Center)</span>
                    <span className="text-white font-bold">{archieX}px</span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="930"
                    value={archieX}
                    onChange={(e) => setArchieX(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer mt-1"
                  />
                </div>

                {/* Vertical Grounding (Y) */}
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Y Position (Ground Depth)</span>
                    <span className="text-white font-bold">{archieY}px</span>
                  </div>
                  <input
                    type="range"
                    min="700"
                    max="1600"
                    value={archieY}
                    onChange={(e) => setArchieY(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer mt-1"
                  />
                </div>

                {/* Scale Multiplier */}
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Actor Scale (Proportion)</span>
                    <span className="text-white font-bold">{Math.round(archieScale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={archieScale}
                    onChange={(e) => setArchieScale(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Environment Theme & Color Chooser */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-cyan-400" />
                Environment Theme
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setBgTheme('pure_dark')}
                className={`p-2 rounded-xl border text-[11px] font-bold text-center transition-colors cursor-pointer ${
                  bgTheme === 'pure_dark'
                    ? 'bg-black border-cyan-500 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Pure Dark (#00)
              </button>
              <button
                onClick={() => setBgTheme('clean_white')}
                className={`p-2 rounded-xl border text-[11px] font-bold text-center transition-colors cursor-pointer ${
                  bgTheme === 'clean_white'
                    ? 'bg-white border-cyan-500 text-slate-900 font-extrabold'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Clean White (#FF)
              </button>
              <button
                onClick={() => setBgTheme('custom_color')}
                className={`p-2 rounded-xl border text-[11px] font-bold text-center transition-colors cursor-pointer ${
                  bgTheme === 'custom_color'
                    ? 'bg-slate-800 border-cyan-500 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Custom Color
              </button>
            </div>

            {bgTheme === 'custom_color' && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customBgColor}
                    onChange={(e) => setCustomBgColor(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={customBgColor}
                    onChange={(e) => setCustomBgColor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 px-2 py-1 rounded-lg text-xs font-mono text-white"
                  />
                </div>

                {/* Preset Studio Swatches */}
                <div className="flex gap-1.5 pt-1">
                  {['#0b0f19', '#022c22', '#1e1b4b', '#18181b', '#f8fafc'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setCustomBgColor(c)}
                      style={{ backgroundColor: c }}
                      className="w-6 h-6 rounded-md border border-slate-700/80 cursor-pointer"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Gradient Style */}
            <div className="pt-2 border-t border-slate-800">
              <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Studio Lighting Effect</label>
              <select
                value={gradientStyle}
                onChange={(e) => setGradientStyle(e.target.value as any)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="studio_falloff">Studio Falloff (Cinematic Vignette)</option>
                <option value="spotlight">Top Spotlight Overhead</option>
                <option value="cyber_grid">Cyber Subtle Grid</option>
                <option value="solid">Solid Monolith Color</option>
              </select>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Interactive 9:16 Stage Canvas with Zoom (6 cols) */}
        <div className="lg:col-span-6 flex flex-col items-center">
          {/* Canvas Zoom & Quick Viewport Bar */}
          <div className="w-full max-w-[420px] mb-2 flex items-center justify-between text-xs px-2">
            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
              <span>Stage Zoom:</span>
              <span className="text-white font-bold">{Math.round(zoomLevel * 100)}%</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoomLevel(prev => Math.max(0.4, Number((prev - 0.1).toFixed(2))))}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(0.75)}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 font-mono text-[10px] cursor-pointer"
                title="Reset Zoom to 75%"
              >
                Reset
              </button>
              <button
                onClick={() => setZoomLevel(prev => Math.min(1.4, Number((prev + 0.1).toFixed(2))))}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* The 9:16 Scaled Canvas Container */}
          <div
            className="relative border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center transition-all select-none"
            style={{
              width: `${Math.round(380 * (zoomLevel / 0.75))}px`,
              height: `${Math.round(675 * (zoomLevel / 0.75))}px`,
              maxWidth: '100%',
              backgroundColor: activeColor
            }}
          >
            <svg
              ref={svgRef}
              viewBox="0 0 1080 1920"
              className="w-full h-full cursor-crosshair"
              onClick={() => setSelectedShapeId(null)}
            >
              <defs>
                <linearGradient id="canvasStudioFalloff" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color={activeColor} stop-opacity="0.85" />
                  <stop offset="65%" stop-color={activeColor} stop-opacity="1" />
                  <stop offset="100%" stop-color="#020617" stop-opacity="1" />
                </linearGradient>
                <radialGradient id="canvasSpotlightGrad" cx="50%" cy="30%" r="65%">
                  <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.3" />
                  <stop offset="60%" stop-color={activeColor} stop-opacity="0.9" />
                  <stop offset="100%" stop-color="#000000" stop-opacity="1" />
                </radialGradient>
              </defs>

              {/* Background Rect */}
              <rect
                x="0"
                y="0"
                width="1080"
                height="1920"
                fill={gradientStyle === 'spotlight' ? 'url(#canvasSpotlightGrad)' : gradientStyle === 'studio_falloff' ? 'url(#canvasStudioFalloff)' : activeColor}
              />

              {/* Grid Overlay if selected */}
              {gradientStyle === 'cyber_grid' && (
                <g stroke="#38bdf8" stroke-width="1" stroke-opacity="0.15">
                  {[...Array(12)].map((_, i) => (
                    <line key={`gx-${i}`} x1={i * 90} y1="0" x2={i * 90} y2="1920" />
                  ))}
                  {[...Array(20)].map((_, i) => (
                    <line key={`gy-${i}`} x1="0" y1={i * 96} x2="1080" y2={i * 96} />
                  ))}
                </g>
              )}

              {/* Render All User Shapes */}
              {shapes.map((s) => {
                const isSelected = selectedShapeId === s.id;
                return (
                  <g
                    key={s.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedShapeId(s.id);
                    }}
                    className="cursor-pointer"
                  >
                    {s.type === 'rect' && (
                      <rect
                        x={s.x}
                        y={s.y}
                        width={s.width}
                        height={s.height}
                        rx="24"
                        fill={s.fill}
                        stroke={isSelected ? '#38bdf8' : s.stroke}
                        strokeWidth={isSelected ? s.strokeWidth + 2 : s.strokeWidth}
                        opacity={s.opacity}
                      />
                    )}

                    {s.type === 'circle' && (
                      <ellipse
                        cx={s.x + s.width / 2}
                        cy={s.y + s.height / 2}
                        rx={s.width / 2}
                        ry={s.height / 2}
                        fill={s.fill}
                        stroke={isSelected ? '#38bdf8' : s.stroke}
                        strokeWidth={isSelected ? s.strokeWidth + 2 : s.strokeWidth}
                        opacity={s.opacity}
                      />
                    )}

                    {s.type === 'triangle' && (
                      <polygon
                        points={`${s.x + s.width / 2},${s.y} ${s.x + s.width},${s.y + s.height} ${s.x},${s.y + s.height}`}
                        fill={s.fill}
                        stroke={isSelected ? '#38bdf8' : s.stroke}
                        strokeWidth={isSelected ? s.strokeWidth + 2 : s.strokeWidth}
                        opacity={s.opacity}
                      />
                    )}

                    {s.type === 'star' && (() => {
                      const cx = s.x + s.width / 2;
                      const cy = s.y + s.height / 2;
                      const r1 = s.width / 2;
                      const r2 = r1 * 0.45;
                      let pts = [];
                      for (let i = 0; i < 10; i++) {
                        const r = i % 2 === 0 ? r1 : r2;
                        const angle = (i * Math.PI) / 5 - Math.PI / 2;
                        pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
                      }
                      return (
                        <polygon
                          points={pts.join(' ')}
                          fill={s.fill}
                          stroke={isSelected ? '#38bdf8' : s.stroke}
                          strokeWidth={isSelected ? s.strokeWidth + 2 : s.strokeWidth}
                          opacity={s.opacity}
                        />
                      );
                    })()}

                    {s.type === 'bubble' && (
                      <g opacity={s.opacity}>
                        <rect
                          x={s.x}
                          y={s.y}
                          width={s.width}
                          height={s.height}
                          rx="32"
                          fill={s.fill}
                          stroke={isSelected ? '#38bdf8' : s.stroke}
                          strokeWidth={isSelected ? s.strokeWidth + 2 : s.strokeWidth}
                        />
                        <polygon
                          points={`${s.x + 60},${s.y + s.height} ${s.x + 90},${s.y + s.height + 35} ${s.x + 110},${s.y + s.height}`}
                          fill={s.fill}
                          stroke={isSelected ? '#38bdf8' : s.stroke}
                          strokeWidth={isSelected ? s.strokeWidth + 1 : s.strokeWidth}
                        />
                        {s.text && (
                          <text
                            x={s.x + s.width / 2}
                            y={s.y + s.height / 2 + 10}
                            fontFamily="system-ui, sans-serif"
                            fontSize="28"
                            fontWeight="800"
                            fill="#ffffff"
                            textAnchor="middle"
                          >
                            {s.text}
                          </text>
                        )}
                      </g>
                    )}

                    {s.type === 'cloud' && (
                      <g opacity={s.opacity}>
                        <rect
                          x={s.x}
                          y={s.y + 40}
                          width={s.width}
                          height={s.height - 40}
                          rx="40"
                          fill={s.fill}
                          stroke={isSelected ? '#38bdf8' : s.stroke}
                          strokeWidth={s.strokeWidth}
                        />
                        <circle cx={s.x + s.width * 0.3} cy={s.y + 40} r={s.height * 0.35} fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} />
                        <circle cx={s.x + s.width * 0.65} cy={s.y + 30} r={s.height * 0.45} fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} />
                        {s.text && (
                          <text
                            x={s.x + s.width / 2}
                            y={s.y + s.height / 2 + 20}
                            fontFamily="system-ui, sans-serif"
                            fontSize="26"
                            fontWeight="700"
                            fill="#ffffff"
                            textAnchor="middle"
                          >
                            {s.text}
                          </text>
                        )}
                      </g>
                    )}

                    {s.type === 'arrow' && (
                      <g opacity={s.opacity}>
                        <rect x={s.x} y={s.y + s.height / 2 - 12} width={s.width - 50} height="24" rx="12" fill={s.fill} />
                        <polygon
                          points={`${s.x + s.width - 60},${s.y + s.height / 2 - 35} ${s.x + s.width},${s.y + s.height / 2} ${s.x + s.width - 60},${s.y + s.height / 2 + 35}`}
                          fill={s.fill}
                          stroke={isSelected ? '#ffffff' : s.stroke}
                          strokeWidth={s.strokeWidth}
                        />
                      </g>
                    )}

                    {s.type === 'desk' && (
                      <g opacity={s.opacity}>
                        <rect
                          x={s.x}
                          y={s.y}
                          width={s.width}
                          height={s.height}
                          rx="28"
                          fill={s.fill}
                          stroke={isSelected ? '#38bdf8' : s.stroke}
                          strokeWidth={isSelected ? s.strokeWidth + 2 : s.strokeWidth}
                        />
                        <line x1={s.x + 30} y1={s.y + 20} x2={s.x + s.width - 30} y2={s.y + 20} stroke="#38bdf8" strokeWidth="3" strokeOpacity="0.8" />
                      </g>
                    )}

                    {s.type === 'screen' && (
                      <g opacity={s.opacity}>
                        <rect
                          x={s.x}
                          y={s.y}
                          width={s.width}
                          height={s.height}
                          rx="24"
                          fill={s.fill}
                          stroke={isSelected ? '#38bdf8' : s.stroke}
                          strokeWidth={s.strokeWidth}
                        />
                        <text
                          x={s.x + s.width / 2}
                          y={s.y + s.height / 2}
                          fontFamily="system-ui, sans-serif"
                          fontSize="28"
                          fontWeight="800"
                          fill="#38bdf8"
                          textAnchor="middle"
                        >
                          {s.text || 'DISPLAY'}
                        </text>
                      </g>
                    )}

                    {s.type === 'text' && (
                      <text
                        x={s.x}
                        y={s.y}
                        fontFamily="system-ui, -apple-system, sans-serif"
                        fontSize="36"
                        fontWeight="900"
                        fill={s.fill}
                        textAnchor="middle"
                        className={isSelected ? 'filter drop-shadow' : ''}
                      >
                        {s.text || 'TEXT'}
                      </text>
                    )}

                    {/* Selection Bounding Box & Pin Indicator */}
                    {isSelected && (
                      <g>
                        <rect
                          x={s.x - 6}
                          y={s.y - 6}
                          width={s.width + 12}
                          height={s.height + 12}
                          rx="8"
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2"
                          strokeDasharray="6 4"
                        />
                        {s.isPinned && (
                          <g transform={`translate(${s.x + s.width - 24}, ${s.y - 24})`}>
                            <circle cx="12" cy="12" r="14" fill="#0284c7" />
                            <text x="12" y="16" fontSize="12" textAnchor="middle" fill="#ffffff">📌</text>
                          </g>
                        )}
                      </g>
                    )}
                  </g>
                );
              })}

              {/* ARCHIE CHARACTER VECTOR RIG ON STAGE */}
              {showArchie && (
                <g
                  id="archie-stage-puppet"
                  transform={`translate(${archieX}, ${archieY}) scale(${archieScale})`}
                  className="cursor-move"
                >
                  {/* Subtle Ground Shadow */}
                  <ellipse cx="0" cy="540" rx="180" ry="26" fill="#000000" opacity="0.45" />

                  {/* Body / Chinos */}
                  <rect x="-80" y="240" width="70" height="290" rx="20" fill="#0f172a" />
                  <rect x="10" y="240" width="70" height="290" rx="20" fill="#1e293b" />

                  {/* Clean Sneakers */}
                  <rect x="-95" y="510" width="90" height="36" rx="14" fill="#ffffff" />
                  <rect x="5" y="510" width="90" height="36" rx="14" fill="#f1f5f9" />

                  {/* Torso & Tech Creator Overshirt */}
                  <rect x="-90" y="0" width="180" height="260" rx="30" fill="#0f172a" />
                  <rect x="-45" y="10" width="90" height="200" rx="16" fill="#f8fafc" />

                  {/* Arms & Smartwatch */}
                  {archiePose === 'pointing_right' ? (
                    <>
                      {/* Left arm down */}
                      <rect x="-120" y="20" width="40" height="180" rx="18" fill="#0f172a" />
                      {/* Right arm extended pointing up-right */}
                      <g transform="rotate(-35, 80, 40)">
                        <rect x="70" y="20" width="46" height="190" rx="20" fill="#0f172a" />
                        {/* Cyan Smartwatch Ring */}
                        <rect x="75" y="150" width="36" height="16" rx="6" fill="#0284c7" />
                        <circle cx="93" cy="158" r="4" fill="#38bdf8" />
                        {/* Hand & Pointing Index Finger */}
                        <ellipse cx="93" cy="220" rx="18" ry="22" fill="#eab383" />
                        <rect x="90" y="220" width="12" height="30" rx="6" fill="#eab383" />
                      </g>
                    </>
                  ) : archiePose === 'pointing_left' ? (
                    <>
                      <g transform="rotate(35, -80, 40)">
                        <rect x="-116" y="20" width="46" height="190" rx="20" fill="#0f172a" />
                        <ellipse cx="-93" cy="220" rx="18" ry="22" fill="#eab383" />
                        <rect x="-102" y="220" width="12" height="30" rx="6" fill="#eab383" />
                      </g>
                      <rect x="80" y="20" width="40" height="180" rx="18" fill="#0f172a" />
                    </>
                  ) : archiePose === 'thinking' ? (
                    <>
                      <rect x="-120" y="20" width="40" height="180" rx="18" fill="#0f172a" />
                      <g transform="rotate(-75, 70, 60)">
                        <rect x="60" y="20" width="44" height="160" rx="20" fill="#0f172a" />
                        <ellipse cx="82" cy="180" rx="18" ry="18" fill="#eab383" />
                      </g>
                    </>
                  ) : archiePose === 'welcoming' ? (
                    <>
                      <g transform="rotate(25, -80, 40)">
                        <rect x="-116" y="20" width="44" height="160" rx="20" fill="#0f172a" />
                        <ellipse cx="-93" cy="180" rx="18" ry="18" fill="#eab383" />
                      </g>
                      <g transform="rotate(-25, 80, 40)">
                        <rect x="72" y="20" width="44" height="160" rx="20" fill="#0f172a" />
                        <ellipse cx="93" cy="180" rx="18" ry="18" fill="#eab383" />
                      </g>
                    </>
                  ) : (
                    <>
                      <rect x="-120" y="20" width="40" height="180" rx="18" fill="#0f172a" />
                      <rect x="80" y="20" width="40" height="180" rx="18" fill="#0f172a" />
                    </>
                  )}

                  {/* Head & Facial Rig */}
                  <g transform="translate(0, -90)">
                    {/* Neck */}
                    <rect x="-24" y="50" width="48" height="40" rx="10" fill="#d09564" />
                    {/* Head contour */}
                    <ellipse cx="0" cy="0" rx="70" ry="85" fill="#eab383" />
                    {/* Modern fade haircut */}
                    <path d="M -72 -20 C -75 -95, 75 -95, 72 -20 C 50 -70, -50 -70, -72 -20 Z" fill="#1f1917" />
                    {/* Expressive Eyes */}
                    <ellipse cx="-26" cy="-10" rx="12" ry="10" fill="#ffffff" />
                    <circle cx="-25" cy="-10" r="5" fill="#382a26" />
                    <circle cx="-23" cy="-12" r="2" fill="#ffffff" />

                    <ellipse cx="26" cy="-10" rx="12" ry="10" fill="#ffffff" />
                    <circle cx="27" cy="-10" r="5" fill="#382a26" />
                    <circle cx="29" cy="-12" r="2" fill="#ffffff" />

                    {/* Eyebrows */}
                    <path d="M -40 -28 Q -26 -36 -12 -28" stroke="#1f1917" strokeWidth="4" strokeLinecap="round" fill="none" />
                    <path d="M 12 -28 Q 26 -36 40 -28" stroke="#1f1917" strokeWidth="4" strokeLinecap="round" fill="none" />

                    {/* Nose */}
                    <path d="M 0 -8 L -4 14 L 6 14" stroke="#d09564" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />

                    {/* Mouth Viseme */}
                    {archiePose === 'talking' ? (
                      <ellipse cx="0" cy="42" rx="14" ry="10" fill="#7f1d1d" />
                    ) : (
                      <path d="M -16 40 Q 0 48 16 40" stroke="#7f1d1d" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                    )}
                  </g>
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Shape Inspector & Property Controls (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-white border-b border-slate-800 pb-2">
              <span>Element Inspector</span>
              {selectedShape ? (
                <button
                  onClick={handleTogglePin}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 border transition-colors cursor-pointer ${
                    selectedShape.isPinned
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                  title={selectedShape.isPinned ? 'Click to unpin (Unlock)' : 'Click to pin (Lock)'}
                >
                  {selectedShape.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                  <span>{selectedShape.isPinned ? 'Pinned' : 'Pin'}</span>
                </button>
              ) : (
                <span className="text-[10px] text-slate-400 font-mono">None Selected</span>
              )}
            </div>

            {selectedShape ? (
              <div className="space-y-3 text-xs">
                {/* Element Type & ID */}
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Type: <strong className="text-white capitalize">{selectedShape.type}</strong></span>
                  <span>ID: {selectedShape.id.slice(0, 10)}</span>
                </div>

                {/* Resize (+ / - buttons and slider) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Size Scale</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleScaleShape(-0.15)}
                      className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 font-bold cursor-pointer"
                      title="Reduce Size"
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex-1 text-center font-mono text-xs text-white">
                      {selectedShape.width} × {selectedShape.height}
                    </div>
                    <button
                      onClick={() => handleScaleShape(0.15)}
                      className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 font-bold cursor-pointer"
                      title="Enlarge Size"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* X and Y Position */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400">X (Left)</label>
                    <input
                      type="number"
                      value={selectedShape.x}
                      onChange={(e) => updateSelectedShape({ x: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 p-1.5 rounded-lg text-xs font-mono text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400">Y (Top)</label>
                    <input
                      type="number"
                      value={selectedShape.y}
                      onChange={(e) => updateSelectedShape({ y: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 p-1.5 rounded-lg text-xs font-mono text-white mt-1"
                    />
                  </div>
                </div>

                {/* Color Fill & Border Stroke */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400">Fill Color</label>
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="color"
                        value={selectedShape.fill === 'none' ? '#ffffff' : selectedShape.fill}
                        onChange={(e) => updateSelectedShape({ fill: e.target.value })}
                        className="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={selectedShape.fill}
                        onChange={(e) => updateSelectedShape({ fill: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 px-1.5 py-1 rounded text-[11px] font-mono text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-400">Border Stroke</label>
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="color"
                        value={selectedShape.stroke === 'none' ? '#000000' : selectedShape.stroke}
                        onChange={(e) => updateSelectedShape({ stroke: e.target.value })}
                        className="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={selectedShape.stroke}
                        onChange={(e) => updateSelectedShape({ stroke: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 px-1.5 py-1 rounded text-[11px] font-mono text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Text string if applicable */}
                {(selectedShape.type === 'text' || selectedShape.type === 'bubble' || selectedShape.type === 'cloud' || selectedShape.type === 'screen') && (
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Element Text</label>
                    <input
                      type="text"
                      value={selectedShape.text || ''}
                      onChange={(e) => updateSelectedShape({ text: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs text-white mt-1 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}

                {/* Opacity */}
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Opacity</span>
                    <span className="text-white">{Math.round(selectedShape.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={selectedShape.opacity}
                    onChange={(e) => updateSelectedShape({ opacity: Number(e.target.value) })}
                    className="w-full accent-cyan-500 cursor-pointer mt-1"
                  />
                </div>

                {/* Delete / Clean Button */}
                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={handleDeleteSelected}
                    disabled={selectedShape.isPinned}
                    className="w-full py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Shape (Clean)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs italic">
                Click any shape on the canvas to inspect, resize, change color, or pin in place.
              </div>
            )}
          </div>

          {/* Quick Clean Canvas Options */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <div className="text-xs font-bold text-white">Stage Management</div>
            <button
              onClick={handleClearUnpinned}
              className="w-full py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clean All Unpinned Items</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
