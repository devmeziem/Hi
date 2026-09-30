import { SourceRecord, ClaimRecord, VerificationStatus } from '../types';

/**
 * Fact Verification Engine (Master Spec Section 25, 26, 55)
 *
 * Rules:
 * 1. Do not upgrade a claim to VERIFIED merely because it sounds plausible.
 * 2. High-importance claims must link to an authoritative source (University, Gov, Journal, Spec).
 * 3. Any unsupported high-importance claim blocks the pipeline.
 */
export function verifyClaimsAgainstSources(
  rawClaims: Array<{
    text: string;
    importance: 'high' | 'medium' | 'low';
    supportedBySourceIds: string[];
    notes?: string;
  }>,
  availableSources: SourceRecord[]
): {
  verifiedClaims: ClaimRecord[];
  allHighImportanceVerified: boolean;
  unsupportedCount: number;
  recommendation: 'READY' | 'NEEDS_REVIEW' | 'REJECT';
} {
  const sourceMap = new Map<string, SourceRecord>();
  availableSources.forEach(s => sourceMap.set(s.id, s));

  let unsupportedCount = 0;
  let allHighImportanceVerified = true;

  const verifiedClaims: ClaimRecord[] = rawClaims.map((claim, idx) => {
    const validSourceIds = (claim.supportedBySourceIds || []).filter(id => sourceMap.has(id));

    let status: VerificationStatus = 'UNSUPPORTED';

    if (validSourceIds.length > 0) {
      // Inspect sources supporting this claim
      const supportingSources = validSourceIds.map(id => sourceMap.get(id)!);
      const maxReliability = Math.max(...supportingSources.map(s => s.reliabilityScore));
      const hasAuthoritativeSource = supportingSources.some(s =>
        s.sourceType === 'government_agency' ||
        s.sourceType === 'university_research' ||
        s.sourceType === 'scientific_institution' ||
        s.sourceType === 'peer_reviewed_paper' ||
        s.sourceType === 'official_documentation'
      );

      if (hasAuthoritativeSource && maxReliability >= 7.0) {
        status = 'VERIFIED';
      } else if (maxReliability >= 5.0) {
        status = 'PARTIALLY_VERIFIED';
      } else {
        status = 'NEEDS_HUMAN_REVIEW';
      }
    } else {
      status = 'UNSUPPORTED';
      unsupportedCount++;
    }

    if (claim.importance === 'high' && status !== 'VERIFIED') {
      allHighImportanceVerified = false;
    }

    return {
      id: `claim-${idx + 1}-${Date.now().toString().slice(-4)}`,
      text: claim.text,
      importance: claim.importance,
      status,
      supportedBySourceIds: validSourceIds,
      notes: claim.notes || (status === 'VERIFIED' ? 'Verified by authoritative institution citation.' : 'Requires primary source reference.')
    };
  });

  let recommendation: 'READY' | 'NEEDS_REVIEW' | 'REJECT' = 'READY';
  if (!allHighImportanceVerified || unsupportedCount > 0) {
    recommendation = 'NEEDS_REVIEW';
  }

  return {
    verifiedClaims,
    allHighImportanceVerified,
    unsupportedCount,
    recommendation
  };
}
