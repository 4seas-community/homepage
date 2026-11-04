'use client';
import { createElement, Fragment, useEffect, useId, useRef, useState } from 'react';
import { headerTree, footerTree, notFoundTree, notFoundLanguage, NOT_FOUND_COPY, languageCode, queryLanguage, queryLanguages } from './index.js';
import { mountHeader } from './interaction.js';

function render(tree, extra, rootRef) {
  if (typeof tree === 'string' || typeof tree === 'number') return tree;
  if (tree.slot) return extra ?? null;
  const attrs = Object.fromEntries(Object.entries(tree.attrs).map(([key, value]) => [key === 'class' ? 'className' : key === 'hreflang' ? 'hrefLang' : key, value]));
  if (rootRef) attrs.ref = rootRef;
  return createElement(tree.tag, attrs, ...tree.children.map((child, index) => createElement(Fragment, { key: index }, render(child, extra))));
}
export function Header(props) {
  const ref = useRef(null);
  const id = useId();
  const [query, setQuery] = useState(null);
  const queryMode = !props.languages?.length;
  useEffect(() => {
    if (!queryMode) return;
    const { pathname, search, hash } = window.location;
    setQuery({ locale: queryLanguage(search, notFoundLanguage(pathname)), languages: queryLanguages(pathname, search, hash) });
  }, [queryMode]);
  useEffect(() => mountHeader(ref.current), []);
  return render(headerTree({ ...props, ...(queryMode && query ? query : {}), id: `fs-nav-${id.replaceAll(':', '')}` }), null, ref);
}
export function Footer({ children, ...props }) {
  const [locale, setLocale] = useState(props.locale);
  useEffect(() => {
    if (!props.locale) setLocale(queryLanguage(window.location.search, notFoundLanguage(window.location.pathname)));
  }, [props.locale]);
  return render(footerTree({ ...props, locale }), children);
}
export function NotFound({ locale, pathname = '', basePath }) {
  const initial = locale || notFoundLanguage(pathname, basePath);
  const [selection, setSelection] = useState(initial);
  useEffect(() => setSelection(queryLanguage(window.location.search, initial)), [initial, pathname]);
  const language = languageCode(selection);
  useEffect(() => { document.title = NOT_FOUND_COPY[language].title + ' | 4Seas'; }, [language]);
  return render(notFoundTree({ locale: language }));
}
