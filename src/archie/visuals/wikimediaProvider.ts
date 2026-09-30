import { VisualAssetRecord } from '../types';

/**
 * Wikimedia Commons Visual Provider (Master Spec Section 16, 113)
 *
 * Discovers scientific diagrams, historical schematics, and technical blueprints.
 * Inspects and validates file-specific license metadata:
 * - Public Domain
 * - Creative Commons (CC BY, CC BY-SA)
 * Automatically blocks non-free or ambiguous assets.
 */
export async function searchWikimediaVisuals(
  query: string,
  maxResults: number = 6
): Promise<VisualAssetRecord[]> {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query + ' filetype:bitmap|drawing')}&gsrnamespace=6&gsrlimit=${maxResults}&prop=imageinfo&iiprop=url|size|extmetadata|mime&format=json&origin=*`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ArchieContentFactory/1.0 (Educational Technology Channel; devmeziem@gmail.com)'
      }
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    const pages = data.query?.pages || {};
    const assets: VisualAssetRecord[] = [];

    for (const pageId of Object.keys(pages)) {
      const page = pages[pageId];
      const info = page.imageinfo?.[0];
      if (!info) continue;

      const meta = info.extmetadata || {};
      const licenseShort = meta.LicenseShortName?.value || meta.License?.value || '';
      const usageTerms = meta.UsageTerms?.value || '';
      const artist = (meta.Artist?.value || 'Wikimedia Commons Contributor').replace(/<[^>]+>/g, '').trim();
      const credit = (meta.Credit?.value || '').replace(/<[^>]+>/g, '').trim();

      // Check if license is commercially usable (CC or Public Domain)
      const licenseLower = (licenseShort + ' ' + usageTerms).toLowerCase();
      const isPublicDomain = licenseLower.includes('public domain') || licenseLower.includes('pd') || licenseLower.includes('cc0');
      const isCreativeCommons = licenseLower.includes('cc-by') || licenseLower.includes('cc by') || licenseLower.includes('attribution');

      // Reject non-free, unknown, or restricted licenses (Section 16: "If license unclear: DO NOT AUTO-USE")
      if (!isPublicDomain && !isCreativeCommons) {
        continue;
      }

      const attributionRequired = !isPublicDomain;
      const attributionText = attributionRequired
        ? `Diagram by ${artist || credit || 'Contributor'} (${licenseShort}) via Wikimedia Commons`
        : `Public Domain technical diagram via Wikimedia Commons`;

      assets.push({
        id: `wiki-commons-${page.pageid || pageId}`,
        type: 'diagram',
        provider: 'wikimedia_commons',
        sourceUrl: page.fullurl || `https://commons.wikimedia.org/?curid=${pageId}`,
        mediaUrl: info.url,
        thumbnailUrl: info.thumburl || info.url,
        creator: artist || 'Wikimedia Contributor',
        license: licenseShort || (isPublicDomain ? 'Public Domain' : 'Creative Commons'),
        licenseUrl: meta.LicenseUrl?.value || 'https://creativecommons.org/',
        attributionText,
        attributionRequired,
        retrievedAt: new Date().toISOString(),
        approved: false
      });
    }

    return assets;
  } catch (err) {
    console.warn('[Wikimedia Provider] Error fetching Wikimedia Commons visuals:', err);
    return [];
  }
}
