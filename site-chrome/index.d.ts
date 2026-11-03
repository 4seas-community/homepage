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
