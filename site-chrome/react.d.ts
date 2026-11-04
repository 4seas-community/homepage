import type { ReactNode } from 'react';
export interface HeaderProps {
  assetBase?: string;
  section?: 'events' | 'zuzalu' | 'about' | 'space' | 'longevity' | 'coliving' | 'residency';
  locale?: string;
  languages?: Array<{ code: string; label: string; href: string }>;
}
export interface FooterProps { assetBase?: string; locale?: string; children?: ReactNode }
export function Header(props: HeaderProps): ReactNode;
export function Footer(props: FooterProps): ReactNode;
export interface NotFoundProps { locale?: string; pathname?: string; basePath?: string }
export function NotFound(props: NotFoundProps): ReactNode;
