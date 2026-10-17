import { prepareEvents, selectEvents } from './longevity-calendar-data.js?v=20261017b';
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

async function load() {
  grid.setAttribute('aria-busy', 'true');
  buttons.forEach(b => b.disabled = true); search.disabled = true; topic.disabled = true;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let response;
    try { response = await fetch('/longevity/assets/longevity-events.json?v=20261017b', { signal: controller.signal }); }
    finally { clearTimeout(timeout); }
    if (!response.ok) throw new Error('Activity data is unavailable');
    const data = await response.json();
    events = prepareEvents(data.events);
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
