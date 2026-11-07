// Generated from @4seas/site-chrome 1.2.3. Do not edit.
(() => {
const copy = {"en":{"title":"Page not found","description":"The link may be outdated, or the address may be incorrect. Let’s get you back to the community.","home":"Back to home","events":"Browse events","explore":"Explore 4Seas","language":"Choose language","routes":["Coliving community","Longevity","Community events","Residency programs","Room booking"]},"zh":{"title":"这个页面找不到了","description":"链接可能已过期，或网址输入有误。你可以返回首页，或从这里继续探索 4Seas。","home":"返回首页","events":"查看活动","explore":"继续探索 4Seas","language":"选择语言","routes":["健康共居社区","Longevity","社区活动","驻留计划","会议室预订"]},"th":{"title":"ไม่พบหน้านี้","description":"ลิงก์อาจหมดอายุหรือที่อยู่ไม่ถูกต้อง กลับไปที่หน้าแรกหรือสำรวจชุมชน 4Seas ต่อได้ที่นี่","home":"กลับหน้าแรก","events":"ดูกิจกรรม","explore":"สำรวจ 4Seas","language":"เลือกภาษา","routes":["ชุมชนโคลิฟวิ่ง","Longevity","กิจกรรมชุมชน","โปรแกรมพำนัก","จองห้องประชุม"]}};
const queryLanguage = function queryLanguage(search = '', fallback = 'en') {
  const value = new URLSearchParams(search).get('lang');
  return ['en', 'zh', 'th'].includes(value) ? value : fallback;
};
const detectLanguage = function notFoundLanguage(pathname = '', basePath) {
  const path = pathname.split(/[?#]/, 1)[0];
  let parts = path.split('/').filter(Boolean);
  if (basePath === undefined) {
    if (['longevity', 'coliving-community', 'event', 'residency', 'coliving'].includes(parts[0])) parts = parts.slice(1);
  } else if (basePath) {
    const prefix = basePath.split('/').filter(Boolean);
    if (prefix.every((part, index) => parts[index] === part)) parts = parts.slice(prefix.length);
  }
  return parts[0] === 'zh' || parts[0] === 'zh-CN' ? 'zh' : parts[0] === 'th' ? 'th' : 'en';
};
// Static adapter only; data and markup come from the shared NotFound component.
function mountNotFound(root, copy, detectLanguage, queryLanguage) {
  const select = code => {
    const text = copy[code];
    if (!text) return;
    root.lang = code === 'zh' ? 'zh-CN' : code;
    root.ownerDocument.title = text.title + ' | 4Seas';
    root.querySelectorAll('[data-error-copy]').forEach(item => { item.textContent = text[item.dataset.errorCopy]; });
    root.querySelectorAll('[data-error-route]').forEach(item => { item.textContent = text.routes[Number(item.dataset.errorRoute)]; });
    root.querySelector('.errorRoutes')?.setAttribute('aria-label', text.explore);
  };
  const location = root.ownerDocument.defaultView.location;
  select(queryLanguage(location.search, detectLanguage(location.pathname)));
}

document.querySelectorAll('.fs-not-found').forEach(root => mountNotFound(root, copy, detectLanguage, queryLanguage));
})();
