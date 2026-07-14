export const INVESTIGATOR_RANKS = [
  { min: 0, max: 2, title: 'Recruta', emoji: '🟢', accent: 'border-green-600/60', badge: 'bg-green-950/50 text-green-400' },
  { min: 3, max: 5, title: 'Agente de Campo', emoji: '🟡', accent: 'border-yellow-600/60', badge: 'bg-yellow-950/50 text-yellow-400' },
  { min: 6, max: 9, title: 'Detetive Técnico', emoji: '🟠', accent: 'border-orange-600/60', badge: 'bg-orange-950/50 text-orange-400' },
  { min: 10, max: Infinity, title: 'Inspetor-Chefe', emoji: '🔴', accent: 'border-red-600/60', badge: 'bg-red-950/50 text-red-400' },
];

export function countUniqueCases(videoIds = []) {
  return new Set(videoIds.filter(Boolean)).size;
}

export function getInvestigatorRank(caseCount) {
  const rank = INVESTIGATOR_RANKS.find(
    (tier) => caseCount >= tier.min && caseCount <= tier.max
  ) || INVESTIGATOR_RANKS[0];

  const nextRank = INVESTIGATOR_RANKS.find((tier) => tier.min > caseCount);
  const progressToNext = nextRank
    ? { current: caseCount, target: nextRank.min, nextTitle: nextRank.title }
    : null;

  return { ...rank, caseCount, progressToNext };
}

export function mergeSolvedCases(views = [], likes = []) {
  const map = new Map();

  views.forEach((entry) => {
    const video = entry.videos || entry.video;
    if (!video?.id) return;
    map.set(video.id, {
      video,
      solvedAt: entry.created_at,
      sources: new Set(['assistido']),
    });
  });

  likes.forEach((entry) => {
    const video = entry.videos;
    if (!video?.id) return;
    const existing = map.get(video.id);
    if (existing) {
      existing.sources.add('recomendado');
      if (new Date(entry.created_at) > new Date(existing.solvedAt)) {
        existing.solvedAt = entry.created_at;
      }
    } else {
      map.set(video.id, {
        video,
        solvedAt: entry.created_at,
        sources: new Set(['recomendado']),
      });
    }
  });

  return Array.from(map.values())
    .map((item) => ({
      ...item,
      sources: Array.from(item.sources),
    }))
    .sort((a, b) => new Date(b.solvedAt) - new Date(a.solvedAt));
}
