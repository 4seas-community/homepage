import type { HeaderProps, FooterProps } from './react.js';
export interface NavigationItem { key: string; label: string; href: string }
export const VERSION: string;
export const HOME: string;
export const NAVIGATION: readonly NavigationItem[];
export const COMMUNITY: readonly NavigationItem[];
export const BRAND_KIT: string;
export const QUOTE: string;
export function navigation(locale?: string): NavigationItem[];
export function languageCode(locale?: string): 'en' | 'zh' | 'th';
export function renderHeader(options?: HeaderProps & { id?: string }): string;
export function renderFooter(options?: FooterProps): string;
export function renderNotFound(options?: { locale?: string }): string;
export function notFoundLanguage(pathname?: string, basePath?: string): 'en' | 'zh' | 'th';
export const NOT_FOUND_COPY: Record<'en' | 'zh' | 'th', { title: string; description: string; home: string; events: string; explore: string; language: string; routes: string[] }>;
export const NOT_FOUND_LANGUAGES: Array<{ code: string; label: string }>;
export const NOT_FOUND_DESTINATIONS: string[];
