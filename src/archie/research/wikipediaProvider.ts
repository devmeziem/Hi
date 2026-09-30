import { SourceRecord } from '../types';

/**
 * Wikipedia Research Provider (Master Spec Section 12)
 *
 * Workflow:
 * Concept Query -> Wikipedia Extract -> Follow External References -> Identify Authoritative Citations
 */
export async function searchWikipedia(topic: string, maxResults: number = 3): Promise<{
  sources: SourceRecord[];
  conceptSummary: string;
  relatedTerms: string[];
}> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(topic)}&utf8=&format=json&srlimit=${maxResults}&origin=*`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'ArchieContentFactory/1.0 (Educational Science & Tech Channel; devmeziem@gmail.com)'
      }
    });

    if (!searchRes.ok) {
      return { sources: [], conceptSummary: '', relatedTerms: [] };
    }

    const searchData = await searchRes.json();
    const items = searchData.query?.search || [];
    if (items.length === 0) {
      return { sources: [], conceptSummary: '', relatedTerms: [] };
    }

    const topItem = items[0];
    const relatedTerms = items.map((i: any) => i.title);

    // Fetch extract and external links for top article
    const detailUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|extlinks&exintro=1&explaintext=1&titles=${encodeURIComponent(topItem.title)}&format=json&origin=*`;
    const detailRes = await fetch(detailUrl, {
      headers: {
        'User-Agent': 'ArchieContentFactory/1.0 (Educational Science & Tech Channel; devmeziem@gmail.com)'
      }
    });

    let conceptSummary = topItem.snippet ? topItem.snippet.replace(/<[^>]+>/g, '') : '';
    const externalLinks: string[] = [];

    if (detailRes.ok) {
      const detailData = await detailRes.json();
      const pages = detailData.query?.pages || {};
      const pageId = Object.keys(pages)[0];
      if (pageId && pages[pageId]) {
        const p = pages[pageId];
        if (p.extract) {
          conceptSummary = p.extract.slice(0, 500);
        }
        if (Array.isArray(p.extlinks)) {
          p.extlinks.forEach((l: any) => {
            const rawUrl = l['*'];
            if (rawUrl && typeof rawUrl === 'string' && rawUrl.startsWith('http')) {
              // Prefer authoritative research domains
              if (
                rawUrl.includes('.edu') ||
                rawUrl.includes('.gov') ||
                rawUrl.includes('arxiv.org') ||
                rawUrl.includes('nature.com') ||
                rawUrl.includes('sciencedirect.com') ||
                rawUrl.includes('ieee.org') ||
                rawUrl.includes('doi.org')
              ) {
                externalLinks.push(rawUrl);
              }
            }
          });
        }
      }
    }

    const sources: SourceRecord[] = [];

    // 1. Wikipedia conceptual overview record (Discovery Source)
    sources.push({
      id: `wiki-${topItem.pageid || Date.now()}`,
      title: `Wikipedia: ${topItem.title}`,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(topItem.title.replace(/\s+/g, '_'))}`,
      publisher: 'Wikimedia Foundation',
      sourceType: 'reference_work',
      extractedSnippet: conceptSummary.slice(0, 280),
      accessedAt: new Date().toISOString(),
      reliabilityScore: 6.5
    });

    // 2. High-authority external citations found within Wikipedia reference tree
    externalLinks.slice(0, 3).forEach((link, idx) => {
      let publisher = 'Academic / Institutional Research Repository';
      let sourceType: SourceRecord['sourceType'] = 'scientific_institution';
      if (link.includes('.gov')) {
        publisher = 'Government Standards & Research Agency';
        sourceType = 'government_agency';
      } else if (link.includes('.edu')) {
        publisher = 'University Laboratory & Faculty Research';
        sourceType = 'university_research';
      } else if (link.includes('arxiv.org')) {
        publisher = 'arXiv Preprint Repository (Cornell)';
        sourceType = 'peer_reviewed_paper';
      }

      sources.push({
        id: `ref-${idx + 1}-${Date.now().toString().slice(-4)}`,
        title: `Primary Citation (${topItem.title} bibliography)`,
        url: link,
        publisher,
        sourceType,
        extractedSnippet: `Authoritative reference cited under Wikipedia: ${topItem.title}`,
        accessedAt: new Date().toISOString(),
        reliabilityScore: 9.0
      });
    });

    return {
      sources,
      conceptSummary,
      relatedTerms
    };
  } catch (err) {
    console.warn('[Archie Wikipedia Provider] Error fetching Wikipedia:', err);
    return { sources: [], conceptSummary: '', relatedTerms: [] };
  }
}
