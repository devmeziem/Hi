import { z } from 'zod';

/**
 * Archie Content Pillars (Master Spec Section 2)
 */
export type ArchiePillar =
  | 'everyday_science'
  | 'technology_explained'
  | 'free_cheap_tools'
  | 'internet_explained'
  | 'digital_life'
  | 'ai_explained'
  | 'free_vs_paid'
  | 'curiosity_did_you_know';

export const PILLAR_LABELS: Record<ArchiePillar, { title: string; subtitle: string; icon: string }> = {
  everyday_science: {
    title: 'Everyday Science',
    subtitle: 'Why ice floats, why phones heat up, everyday physics',
    icon: 'Atom'
  },
  technology_explained: {
    title: 'Technology Explained',
    subtitle: 'How GPS, Wi-Fi, facial recognition, and Bluetooth actually work',
    icon: 'Cpu'
  },
  free_cheap_tools: {
    title: 'Free / Cheap Digital Tools',
    subtitle: 'Free PDF, background removal, study, and developer utilities',
    icon: 'Wrench'
  },
  internet_explained: {
    title: 'Internet Explained',
    subtitle: 'DNS, cookies, HTTPS encryption, and website latency',
    icon: 'Globe'
  },
  digital_life: {
    title: 'Digital Life & Explainers',
    subtitle: 'Storage declutter, camera blur, battery degradation, QR codes',
    icon: 'Smartphone'
  },
  ai_explained: {
    title: 'AI Explained',
    subtitle: 'Hallucinations, model weights, prompting, and neural training',
    icon: 'Sparkles'
  },
  free_vs_paid: {
    title: 'Free vs Paid Comparison',
    subtitle: 'Objective educational breakdown without purchase pressure',
    icon: 'Scale'
  },
  curiosity_did_you_know: {
    title: 'Curiosity & Did You Know?',
    subtitle: 'QWERTY history, airplane mode, damaged QR code error correction',
    icon: 'HelpCircle'
  }
};

/**
 * Verification States (Master Spec Section 25, 45)
 */
export type VerificationStatus =
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'UNSUPPORTED'
  | 'CONTRADICTED'
  | 'NEEDS_HUMAN_REVIEW';

/**
 * Source Record Schema with Provenance (Section 18, 89)
 */
export const SourceRecordSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
  publisher: z.string(),
  sourceType: z.enum([
    'government_agency',
    'university_research',
    'scientific_institution',
    'peer_reviewed_paper',
    'official_documentation',
    'reputable_journalism',
    'reference_work',
    'discovery_source'
  ]),
  extractedSnippet: z.string().optional(),
  accessedAt: z.string(),
  reliabilityScore: z.number().min(1).max(10)
});
export type SourceRecord = z.infer<typeof SourceRecordSchema>;

/**
 * Factual Claim Schema mapped to Sources (Section 25, 90)
 */
export const ClaimRecordSchema = z.object({
  id: z.string(),
  text: z.string(),
  importance: z.enum(['high', 'medium', 'low']),
  status: z.enum(['VERIFIED', 'PARTIALLY_VERIFIED', 'UNSUPPORTED', 'CONTRADICTED', 'NEEDS_HUMAN_REVIEW']),
  supportedBySourceIds: z.array(z.string()),
  notes: z.string().optional()
});
export type ClaimRecord = z.infer<typeof ClaimRecordSchema>;

/**
 * Visual Asset Schema with License & Attribution Provenance (Section 16, 18, 113, 114)
 */
export const VisualAssetRecordSchema = z.object({
  id: z.string(),
  type: z.enum(['photo', 'video', 'diagram', 'animation', 'character_vector']),
  provider: z.enum(['pexels', 'wikimedia_commons', 'archie_svg_owned', 'generated_diagram', 'manual_upload']),
  sourceUrl: z.string(),
  mediaUrl: z.string(),
  thumbnailUrl: z.string().optional(),
  creator: z.string(),
  license: z.string(),
  licenseUrl: z.string().optional(),
  attributionText: z.string(),
  attributionRequired: z.boolean(),
  retrievedAt: z.string(),
  approved: z.boolean().default(false)
});
export type VisualAssetRecord = z.infer<typeof VisualAssetRecordSchema>;

/**
 * Resource & Tool Catalog Item (Section 28, 73, 76)
 */
export const ResourceItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string(),
  freeTierStatus: z.enum([
    'PERMANENTLY_FREE',
    'LIMITED_FREE_TIER',
    'FREE_TRIAL',
    'PAID_ONLY',
    'STUDENT_VERIFIED'
  ]),
  limitations: z.string().optional(),
  normalUrl: z.string().url(),
  isAffiliate: z.boolean().default(false),
  affiliateUrl: z.string().url().optional(),
  disclosureText: z.string().optional(),
  lastChecked: z.string(),
  status: z.enum(['active', 'broken', 'needs_review']).default('active')
});
export type ResourceItem = z.infer<typeof ResourceItemSchema>;

/**
 * Scene Specification for Archie Video (Section 27, 35, 38)
 */
export const ArchieSceneSchema = z.object({
  id: z.number(),
  sceneName: z.string(),
  durationSeconds: z.number().min(2).max(30),
  hookType: z.enum(['hook', 'mystery_problem', 'explanation', 'consequence', 'takeaway', 'optional_resource']),
  narration: z.string(),
  onScreenText: z.string(),
  archiePose: z.enum(['idle', 'point_left', 'point_right', 'explain', 'surprised', 'thinking', 'confident']),
  backgroundId: z.string().default('cyber_stem'),
  visualAssetId: z.string().nullable().optional(),
  visualSearchQuery: z.string().optional()
});
export type ArchieScene = z.infer<typeof ArchieSceneSchema>;

/**
 * Complete Archie Script with Approval Gates (Section 27, 44, 125)
 */
export const ArchieScriptSchema = z.object({
  videoId: z.string(),
  topicId: z.string(),
  title: z.string(),
  pillar: z.string(),
  targetDurationSeconds: z.number(),
  hook: z.string(),
  scenes: z.array(ArchieSceneSchema),
  claims: z.array(ClaimRecordSchema),
  sources: z.array(SourceRecordSchema),
  resources: z.array(ResourceItemSchema),
  affiliateDisclosureRequired: z.boolean().default(false),
  approvalGates: z.object({
    factsApproved: z.boolean().default(false),
    visualsApproved: z.boolean().default(false),
    scriptApproved: z.boolean().default(false),
    videoApproved: z.boolean().default(false),
    humanSignOffBy: z.string().nullable().optional()
  }),
  status: z.enum([
    'IDEA',
    'RESEARCHED',
    'VERIFIED',
    'SCRIPT_READY',
    'RENDERED',
    'AWAITING_APPROVAL',
    'APPROVED',
    'PUBLISHED',
    'NEEDS_REVIEW'
  ]),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type ArchieScript = z.infer<typeof ArchieScriptSchema>;

/**
 * Full Archie Research Report (Section 104, 137)
 */
export const ArchieResearchReportSchema = z.object({
  reportId: z.string(),
  topic: z.string(),
  pillar: z.string(),
  generatedAt: z.string(),
  demandSignals: z.object({
    youtubeInterestScore: z.number(),
    searchVolumeSignal: z.string(),
    evergreenPotential: z.enum(['high', 'medium', 'low']),
    duplicateCheckResult: z.string()
  }),
  sources: z.array(SourceRecordSchema),
  claims: z.array(ClaimRecordSchema),
  visualOptions: z.object({
    pexelsPhotos: z.array(VisualAssetRecordSchema),
    pexelsVideos: z.array(VisualAssetRecordSchema),
    wikimediaDiagrams: z.array(VisualAssetRecordSchema),
    archieSvgBackdrops: z.array(z.string())
  }),
  resources: z.array(ResourceItemSchema),
  risks: z.array(z.string()),
  recommendation: z.enum(['READY', 'NEEDS_REVIEW', 'REJECT']),
  summaryNotes: z.string()
});
export type ArchieResearchReport = z.infer<typeof ArchieResearchReportSchema>;
