// Static adapter only; data and markup come from the shared NotFound component.
export function mountNotFound(root, copy, detectLanguage) {
  const select = code => {
    const text = copy[code];
    if (!text) return;
    root.lang = code === 'zh' ? 'zh-CN' : code;
    root.ownerDocument.title = text.title + ' | 4Seas';
    root.querySelectorAll('[data-error-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.errorLanguage === code)));
    root.querySelectorAll('[data-error-copy]').forEach(item => { item.textContent = text[item.dataset.errorCopy]; });
    root.querySelectorAll('[data-error-route]').forEach(item => { item.textContent = text.routes[Number(item.dataset.errorRoute)]; });
    root.querySelector('.errorRoutes')?.setAttribute('aria-label', text.explore);
    root.querySelector('.errorLanguages')?.setAttribute('aria-label', text.language);
  };
  select(detectLanguage(root.ownerDocument.defaultView.location.pathname));
  root.querySelectorAll('[data-error-language]').forEach(button => {
    button.addEventListener('click', () => select(button.dataset.errorLanguage));
  });
}
