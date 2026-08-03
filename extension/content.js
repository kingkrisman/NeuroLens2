(() => {
  if (window.__neurolensLoaded) return;
  window.__neurolensLoaded = true;

  const selectors = ['article', '[role="main"]', 'main', '.article', '.post-content'];

  function getArticle() {
    const candidate = selectors
      .map(selector => document.querySelector(selector))
      .filter(Boolean)
      .sort((a, b) => b.innerText.length - a.innerText.length)[0] || document.body;
    const clone = candidate.cloneNode(true);
    clone.querySelectorAll('script, style, nav, header, footer, aside, form, button, iframe').forEach(node => node.remove());
    const text = clone.innerText.replace(/\n{3,}/g, '\n\n').trim();
    return { title: document.title, text };
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]);
  }

  function bionic(text, strength) {
    if (!strength) return escapeHtml(text);
    return escapeHtml(text).replace(/\b([A-Za-z][A-Za-z'-]*)\b/g, word => {
      const length = Math.max(1, Math.min(word.length - 1, Math.ceil(word.length * strength * 0.35)));
      return `<strong>${word.slice(0, length)}</strong>${word.slice(length)}`;
    });
  }

  function closeReader(host) {
    host.remove();
    document.documentElement.style.overflow = '';
  }

  function openReader(title, text, settings) {
    document.querySelector('#neurolens-extension-root')?.remove();
    const host = document.createElement('div');
    host.id = 'neurolens-extension-root';
    const shadow = host.attachShadow({ mode: 'open' });
    const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
    const body = paragraphs.map(paragraph => `<p>${bionic(paragraph, settings.fixation)}</p>`).join('');

    shadow.innerHTML = `
      <style>
        :host { all: initial; }
        .panel { position: fixed; inset: 16px 16px 16px auto; z-index: 2147483647; width: min(680px, calc(100vw - 32px)); overflow: hidden; display: flex; flex-direction: column; color: #1d1d1f; background: #fff; border: 1px solid rgba(0,0,0,.1); border-radius: 22px; box-shadow: 0 24px 80px rgba(0,0,0,.25); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 22px; border-bottom: 1px solid rgba(0,0,0,.08); background: rgba(255,255,255,.9); }
        .label { color: #6e6e73; font-size: 10px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }
        h1 { margin: 4px 0 0; font: 600 18px/1.25 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        button { border: 0; border-radius: 999px; padding: 8px 12px; color: #1d1d1f; background: #f5f5f7; cursor: pointer; font: 600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        button:hover { color: #fff; background: #06f; }
        article { overflow: auto; padding: 28px clamp(20px, 5vw, 60px) 80px; font-size: ${settings.mode === 'adhd' || settings.mode === 'dyslexia' ? '20px' : '18px'}; line-height: ${settings.mode === 'focus' ? '1.9' : '1.7'}; letter-spacing: ${settings.mode === 'dyslexia' ? '.04em' : '0'}; }
        p { margin: 0 0 1.4em; max-width: 62ch; }
        strong { font-weight: 800; }
        @media (max-width: 640px) { .panel { inset: 0; width: 100vw; border-radius: 0; } header { padding: 16px; } article { padding: 22px 18px 60px; } }
      </style>
      <section class="panel" aria-label="NeuroLens reading panel">
        <header>
          <div><div class="label">NeuroLens</div><h1>${escapeHtml(title || 'Reading session')}</h1></div>
          <button id="close" type="button">Close</button>
        </header>
        <article>${body}</article>
      </section>
    `;
    shadow.querySelector('#close').addEventListener('click', () => closeReader(host));
    document.documentElement.appendChild(host);
    document.documentElement.style.overflow = 'hidden';
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_ARTICLE') sendResponse(getArticle());
    if (message.type === 'OPEN_READER') openReader(message.title, message.text, message.settings);
    return true;
  });
})();
