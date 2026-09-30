import { ResourceItem } from '../types';

/**
 * Archie Verified Resource Catalog (Master Spec Section 28, 73, 76)
 *
 * Rules:
 * 1. Never invent an affiliate URL.
 * 2. Distinguish permanently free vs limited free tier vs free trial.
 * 3. Never call a free trial "free forever".
 */
export const VERIFIED_RESOURCE_CATALOG: ResourceItem[] = [
  {
    id: 'res-photopea',
    name: 'Photopea Online Image Editor',
    category: 'image_editing',
    description: 'Free browser-based photo and graphic editor supporting PSD, XCF, Sketch, and RAW formats with zero software installation.',
    freeTierStatus: 'PERMANENTLY_FREE',
    limitations: 'Ad-supported on free tier; zero feature restrictions on core photo editing.',
    normalUrl: 'https://www.photopea.com',
    isAffiliate: false,
    disclosureText: 'No affiliate relationship. Recommended purely for educational utility.',
    lastChecked: '2026-09-29',
    status: 'active'
  },
  {
    id: 'res-ilovepdf',
    name: 'iLovePDF Utility Suite',
    category: 'document_tools',
    description: 'Comprehensive web toolkit for compressing, merging, splitting, and converting PDF documents.',
    freeTierStatus: 'LIMITED_FREE_TIER',
    limitations: 'Free for tasks under batch threshold (up to 3 files at once).',
    normalUrl: 'https://www.ilovepdf.com',
    isAffiliate: false,
    disclosureText: 'No affiliate relationship. Free web utility.',
    lastChecked: '2026-09-29',
    status: 'active'
  },
  {
    id: 'res-removebg',
    name: 'Remove.bg Automated AI Cutout',
    category: 'image_editing',
    description: 'High-speed automated background removal algorithm for transparent PNG cutouts.',
    freeTierStatus: 'LIMITED_FREE_TIER',
    limitations: 'Free preview resolution up to 0.25 megapixels; HD exports require credits.',
    normalUrl: 'https://www.remove.bg',
    isAffiliate: false,
    disclosureText: 'No affiliate relationship. Free preview utility.',
    lastChecked: '2026-09-29',
    status: 'active'
  },
  {
    id: 'res-obs-studio',
    name: 'OBS Studio (Open Broadcaster Software)',
    category: 'video_editing',
    description: 'Free, open-source cross-platform screen recording and live-streaming suite maintained by the open-source community.',
    freeTierStatus: 'PERMANENTLY_FREE',
    limitations: 'Completely free and open-source under GPL v2. Zero paid tiers.',
    normalUrl: 'https://obsproject.com',
    isAffiliate: false,
    disclosureText: 'Open source software. 100% free.',
    lastChecked: '2026-09-29',
    status: 'active'
  },
  {
    id: 'res-audacity',
    name: 'Audacity Audio Workbench',
    category: 'audio_production',
    description: 'Open-source multi-track audio editor and recorder for podcasts, voiceover noise removal, and spectrum analysis.',
    freeTierStatus: 'PERMANENTLY_FREE',
    limitations: 'Open source under GPL license.',
    normalUrl: 'https://www.audacityteam.org',
    isAffiliate: false,
    disclosureText: 'Open source software.',
    lastChecked: '2026-09-29',
    status: 'active'
  },
  {
    id: 'res-accubattery',
    name: 'AccuBattery Diagnostics',
    category: 'hardware_diagnostics',
    description: 'Android battery health, cycle count, and charging thermal wattage monitor based on real hardware measurement.',
    freeTierStatus: 'LIMITED_FREE_TIER',
    limitations: 'Core charging speed (mA) and thermal readings are 100% free; Pro removes ads.',
    normalUrl: 'https://accubattery.zendesk.com',
    isAffiliate: false,
    disclosureText: 'Hardware utility.',
    lastChecked: '2026-09-29',
    status: 'active'
  }
];

export function matchResourcesForTopic(topic: string, pillar: string): ResourceItem[] {
  const normTopic = topic.toLowerCase();
  const matched: ResourceItem[] = [];

  for (const item of VERIFIED_RESOURCE_CATALOG) {
    if (item.status !== 'active') continue;

    if (
      (normTopic.includes('battery') || normTopic.includes('heat') || normTopic.includes('phone')) &&
      item.id === 'res-accubattery'
    ) {
      matched.push(item);
    } else if (
      (normTopic.includes('background') || normTopic.includes('cutout') || normTopic.includes('photo')) &&
      (item.id === 'res-removebg' || item.id === 'res-photopea')
    ) {
      matched.push(item);
    } else if (
      (normTopic.includes('pdf') || normTopic.includes('document')) &&
      item.id === 'res-ilovepdf'
    ) {
      matched.push(item);
    } else if (
      (normTopic.includes('record') || normTopic.includes('video') || normTopic.includes('screen')) &&
      item.id === 'res-obs-studio'
    ) {
      matched.push(item);
    }
  }

  // Never force-feed links if not strictly relevant (Section 107)
  return matched;
}
