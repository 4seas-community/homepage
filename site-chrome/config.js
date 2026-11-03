// Single source for all public sites. Business navigation belongs to each app.
export const VERSION = '1.2.1';
export const HOME = 'https://4seas.xyz/';
export const NAVIGATION = Object.freeze([
  { key: 'longevity', label: 'Longevity', href: HOME + 'longevity/' },
  { key: 'coliving', label: 'Coliving', href: HOME + 'coliving-community/' },
  { key: 'residency', label: 'Residency', href: HOME + 'residency' },
  { key: 'events', label: 'Event', href: 'https://4seas.xyz/event' },
  { key: 'zuzalu', label: 'Zuzalu', href: HOME + '#Zuzalu' },
  { key: 'space', label: 'Space', href: HOME + '#Space' },
]);
export const COMMUNITY = Object.freeze([
  { key: 'x', label: '4Seas on X', href: 'https://x.com/4seasDeSoc' },
  { key: 'telegram', label: '4Seas on Telegram', href: 'https://t.me/NomadsBase' },
  { key: 'notion', label: '4Seas community on Notion', href: 'https://www.notion.so/4seas/4Seas-Crypto-Nomad-Open-Community-419ab3a4c66c4dab9f3ece6c4e081886' },
]);
export const BRAND_KIT = 'https://www.figma.com/design/3qjSTHbMwaYvO2fOlDRJcD/4Seas-Branding-kit?node-id=76-2&p=f&t=MGwF0a3bR0RZBHER-0';
export const QUOTE = '“It has been said that astronomy is a humbling and character-building experience. There is perhaps no better demonstration of the folly of human conceits than this distant image of our tiny world. To me, it underscores our responsibility to deal more kindly with one another, and to preserve and cherish the pale blue dot, the only home we’ve ever known.”— Carl Sagan, Pale Blue Dot, 1994 🌏 🌏';
export const COPY = Object.freeze({
  en: { menu: 'Menu', navigation: '4Seas navigation', language: 'Choose language', home: '4Seas home' },
  zh: { menu: '菜单', navigation: '4Seas 主导航', language: '选择语言', home: '4Seas 首页' },
  th: { menu: 'เมนู', navigation: 'เมนูหลัก 4Seas', language: 'เลือกภาษา', home: 'หน้าหลัก 4Seas' },
});
export function languageCode(locale) {
  return locale?.startsWith('zh') ? 'zh' : locale?.startsWith('th') ? 'th' : 'en';
}
export function navigation(locale) {
  return NAVIGATION.map(item => ({ ...item, href: locale && ['coliving', 'longevity'].includes(item.key)
    ? item.href + languageCode(locale) + '/' : item.href }));
}
