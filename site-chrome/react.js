'use client';
import { createElement, Fragment, useEffect, useId, useRef } from 'react';
import { headerTree, footerTree } from './index.js';
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
  useEffect(() => mountHeader(ref.current), []);
  return render(headerTree({ ...props, id: `fs-nav-${id.replaceAll(':', '')}` }), null, ref);
}
export function Footer({ children, ...props }) {
  return render(footerTree(props), children);
}
