// The public 404 content and destinations are shared by static HTML and React.
export const NOT_FOUND_LANGUAGES = [
  { code: 'zh', label: '中文' }, { code: 'en', label: 'English' }, { code: 'th', label: 'ไทย' },
];
export const NOT_FOUND_COPY = {
  en: {
    title: 'Page not found',
    description: 'The link may be outdated, or the address may be incorrect. Let’s get you back to the community.',
    home: 'Back to home', events: 'Browse events', explore: 'Explore 4Seas', language: 'Choose language',
    routes: ['Coliving community', 'Longevity', 'Community events', 'Residency programs', 'Room booking'],
  },
  zh: {
    title: '这个页面找不到了',
    description: '链接可能已过期，或网址输入有误。你可以返回首页，或从这里继续探索 4Seas。',
    home: '返回首页', events: '查看活动', explore: '继续探索 4Seas', language: '选择语言',
    routes: ['健康共居社区', 'Longevity', '社区活动', '驻留计划', '会议室预订'],
  },
  th: {
    title: 'ไม่พบหน้านี้',
    description: 'ลิงก์อาจหมดอายุหรือที่อยู่ไม่ถูกต้อง กลับไปที่หน้าแรกหรือสำรวจชุมชน 4Seas ต่อได้ที่นี่',
    home: 'กลับหน้าแรก', events: 'ดูกิจกรรม', explore: 'สำรวจ 4Seas', language: 'เลือกภาษา',
    routes: ['ชุมชนโคลิฟวิ่ง', 'Longevity', 'กิจกรรมชุมชน', 'โปรแกรมพำนัก', 'จองห้องประชุม'],
  },
};
export const NOT_FOUND_DESTINATIONS = [
  'https://4seas.xyz/coliving-community/', 'https://4seas.xyz/longevity/',
  'https://4seas.xyz/event', 'https://4seas.xyz/residency', 'https://book.4seas.xyz/',
];

/** Inspect only the first route segment after a known deployment prefix. */
export function notFoundLanguage(pathname = '', basePath) {
  const path = pathname.split(/[?#]/, 1)[0];
  let parts = path.split('/').filter(Boolean);
  if (basePath === undefined) {
    if (['longevity', 'coliving-community', 'event', 'residency', 'coliving'].includes(parts[0])) parts = parts.slice(1);
  } else if (basePath) {
    const prefix = basePath.split('/').filter(Boolean);
    if (prefix.every((part, index) => parts[index] === part)) parts = parts.slice(prefix.length);
  }
  return parts[0] === 'zh' || parts[0] === 'zh-CN' ? 'zh' : parts[0] === 'th' ? 'th' : 'en';
}
