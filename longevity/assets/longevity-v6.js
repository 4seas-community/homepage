import { prepareEvents, selectEvents } from './longevity-calendar-data.js?v=20261017c';
const t = value => window.siteT ? window.siteT(value) : value;

const grid = document.getElementById('l-event-grid');
const status = document.getElementById('l-event-status');
const buttons = [...document.querySelectorAll('[data-l-period]')];
const search = document.getElementById('l-search');
const topic = document.getElementById('l-topic');
const more = document.getElementById('l-more');
const dateFormat = new Intl.DateTimeFormat(window.siteLocale || 'zh-CN', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
const pageSize = 6;
let events = [], period = 'upcoming', shown = pageSize;

function element(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = t(text);
  return node;
}

function card(e) {
  const article = element('article', 'l-event-card');
  const cover = element('a', 'event-cover'); cover.href = e.url;
  cover.setAttribute('aria-label', t(`查看活动：${e.title}`));
  const fallback = () => {
    const box = element('div', 'l-cover-fallback');
    const logo = element('img'); logo.src = '/longevity/assets/logo.png'; logo.alt = '4Seas';
    box.append(logo, element('span', '', 'LONGEVITY / COMMUNITY')); cover.replaceChildren(box);
  };
  if (e.cover) {
    const image = element('img'); image.alt = ''; image.loading = 'lazy'; image.decoding = 'async';
    image.addEventListener('error', fallback, { once: true }); image.src = e.cover; cover.append(image);
  } else fallback();
  const body = element('div', 'l-event-body');
  const label = element('span', 'pill', e.labels.includes('longevity practice') ? 'Longevity Practice' : 'Longevity');
  const title = element('h3'); title.title = e.title;
  const link = element('a', '', e.title); link.href = e.url; title.append(link);
  const time = element('time', '', dateFormat.format(new Date(e.start))); time.dateTime = e.start;
  const venue = element('p', 'l-venue', e.venue || '地点见活动详情'); venue.title = e.venue || t('地点见活动详情');
  const footer = element('div', 'l-event-footer');
  const host = element(e.hostUrl ? 'a' : 'span', '', e.hostName + (e.hostUrl ? ' ↗' : ''));
  if (e.hostUrl) host.href = window.siteHref ? window.siteHref(e.hostUrl) : e.hostUrl;
  const details = element('a', '', '活动详情 ↗'); details.href = e.url;
  footer.append(host, details); body.append(label, title, time, venue, footer); article.append(cover, body);
  return article;
}

function render(focusAt = null) {
  const now = Date.now();
  const matched = selectEvents(events, { period, topic: topic.value, query: search.value, now });
  document.getElementById('l-upcoming-count').textContent = selectEvents(events, { now }).length;
  document.getElementById('l-past-count').textContent = selectEvents(events, { period: 'past', now }).length;
  buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lPeriod === period)));
  grid.replaceChildren(...matched.slice(0, shown).map(card));
  if (!matched.length) {
    const filtered = search.value.trim() || topic.value !== 'all';
    grid.append(element('p', 'empty-state', filtered ? '没有找到符合条件的活动。试试其他关键词，或切换到全部分类。' : period === 'upcoming' ? '暂时没有已公布的后续活动。可以切换往期，了解社区的实践；新安排请查看实时日历。' : '暂时没有往期活动记录。'));
  }
  status.textContent = t(`${period === 'past' ? '往期活动' : '即将举行'} ${matched.length} 场 · 当前显示 ${Math.min(shown, matched.length)} 场`);
  more.hidden = shown >= matched.length;
  if (focusAt !== null) grid.children[focusAt]?.querySelector('a')?.focus({ preventScroll: true });
}

const SOLA_API = 'https://api.sola.day/api/v1/events';
const SNAPSHOT_URL = '/longevity/assets/longevity-events.json?v=20261017c';

function fromSola(row) {
  if (!row || row.status !== 'published' || row.visibility === 'private') return null;
  const name = row.owner?.name || '';
  return {
    id: row.id, title: row.title, start: row.start_time, end: row.end_time, tags: row.tags || [], category: row.category,
    venue: row.venue?.name || null, cover: row.image_url || null, host: name, hostName: name,
    url: 'https://sola.day/event/detail/' + encodeURIComponent(row.id),
    hostUrl: name ? 'https://sola.day/profile/' + encodeURIComponent(name) : null
  };
}

async function liveQuery(collection, tag, signal) {
  const rows = [];
  let page = 1;
  for (let i = 0; i < 5 && page; i++) {
    const params = new URLSearchParams({ group_id: '4seas', timezone: 'Asia/Bangkok', collection, limit: '100', tags: tag, page: String(page) });
    const response = await fetch(`${SOLA_API}?${params}`, { signal });
    if (!response.ok) throw new Error('Live events are unavailable');
    const body = await response.json();
    if (!Array.isArray(body.data)) throw new Error('Live events are malformed');
    rows.push(...body.data);
    page = body.meta?.next_page || null;
  }
  return rows;
}

async function loadLive() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const queries = [];
    for (const collection of ['upcoming', 'past']) for (const tag of ['Longevity', 'Longevity Practice']) queries.push(liveQuery(collection, tag, controller.signal));
    const list = (await Promise.all(queries)).flat().map(fromSola).filter(Boolean);
    if (!list.length) throw new Error('No live events');
    return list;
  } finally { clearTimeout(timeout); }
}

async function loadSnapshot() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(SNAPSHOT_URL, { signal: controller.signal });
    if (!response.ok) throw new Error('Activity data is unavailable');
    return (await response.json()).events;
  } finally { clearTimeout(timeout); }
}

async function load() {
  grid.setAttribute('aria-busy', 'true');
  buttons.forEach(b => b.disabled = true); search.disabled = true; topic.disabled = true;
  try {
    let rows;
    try { rows = await loadLive(); } catch { rows = await loadSnapshot(); }
    events = prepareEvents(rows);
    buttons.forEach(b => { b.disabled = false; b.addEventListener('click', () => { period = b.dataset.lPeriod; shown = pageSize; render(); }); });
    search.disabled = false; topic.disabled = false;
    search.addEventListener('input', () => { shown = pageSize; render(); });
    topic.addEventListener('change', () => { shown = pageSize; render(); });
    more.addEventListener('click', () => { const previous = shown; shown += pageSize; render(previous); });
    render();
    // Keep status correct while the page remains open, including an event in progress.
    setInterval(render, 60000);
  } catch {
    status.textContent = t('完整列表暂时未能载入。下方保留生成页面时的活动；请查看实时日历获取最新安排。');
    more.hidden = true;
  } finally { grid.removeAttribute('aria-busy'); }
}
load();
