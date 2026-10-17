const topics = new Set(['longevity', 'longevity practice']);
const safeLink = value => {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value, 'https://4seas.xyz/');
    return ['https:', 'http:'].includes(url.protocol) ? value : null;
  } catch { return null; }
};

export function prepareEvents(rows) {
  if (!Array.isArray(rows)) throw new Error('Activity data is unavailable');
  const unique = new Map();
  for (const row of rows) {
    if (!row || !row.id || typeof row.title !== 'string') continue;
    const tags = (Array.isArray(row.tags) ? row.tags : []).filter(t => typeof t === 'string');
    const labels = [...tags, row.category].filter(t => typeof t === 'string').map(t => t.trim().toLowerCase());
    const start = Date.parse(row.start), end = Date.parse(row.end || row.start);
    if (!labels.some(t => topics.has(t)) || !Number.isFinite(start) || !Number.isFinite(end) || end < start || !safeLink(row.url)) continue;
    unique.set(String(row.id), { ...row, tags, labels, startTime: start, endTime: end,
      cover: safeLink(row.cover), hostUrl: safeLink(row.hostUrl), hostName: String(row.hostName || row.host || '') });
  }
  return [...unique.values()];
}

export function selectEvents(events, { period = 'upcoming', topic = 'all', query = '', now = Date.now() } = {}) {
  const q = query.trim().toLocaleLowerCase();
  return events.filter(e => {
    const past = e.endTime < now;
    return (period === 'past' ? past : !past)
      && (topic === 'all' || e.labels.includes(topic))
      && (!q || [e.title, e.hostName, e.host, ...e.tags].join(' ').toLocaleLowerCase().includes(q));
  }).sort((a, b) => period === 'past' ? b.startTime - a.startTime : a.startTime - b.startTime);
}
