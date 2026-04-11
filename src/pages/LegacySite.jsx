import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import routeMap from '../generated/routeMap.js';
import localImageMap from '../generated/localImageMap.js';

const MANAGED_ATTR = 'data-react-legacy-managed';

function normalizeRoute(pathname) {
  if (!pathname) return '/';
  const cleaned = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return cleaned || '/';
}

function getLegacyHtmlPath(pathname) {
  const normalized = normalizeRoute(pathname);
  if (routeMap[normalized]) return routeMap[normalized];
  const lower = normalized.toLowerCase();
  const found = Object.keys(routeMap).find((key) => key.toLowerCase() === lower);
  return found ? routeMap[found] : routeMap['/'];
}

function getLegacyDir(legacyHtmlPath) {
  return legacyHtmlPath.replace(/index\.html$/i, '');
}

function getMappedImage(url) {
  if (!url) return '';
  const raw = url.trim();

  let absolute = '';
  if (raw.startsWith('//')) absolute = `https:${raw}`;
  else if (raw.startsWith('http://') || raw.startsWith('https://')) absolute = raw;

  if (!absolute) return '';

  if (localImageMap[absolute]) return localImageMap[absolute];

  try {
    const short = new URL(absolute);
    short.search = '';
    short.hash = '';
    return localImageMap[short.toString()] || '';
  } catch {
    return '';
  }
}

function rewriteUrl(url, legacyDir) {
  if (!url) return url;
  const value = url.trim();

  const mapped = getMappedImage(value);
  if (mapped) return mapped;

  if (
    value.startsWith('#') ||
    value.startsWith('mailto:') ||
    value.startsWith('tel:') ||
    value.startsWith('javascript:') ||
    value.startsWith('//') ||
    value.startsWith('data:')
  ) {
    return value;
  }

  if (value.startsWith('http://alexandradiz.com') || value.startsWith('https://alexandradiz.com')) {
    try {
      const parsed = new URL(value);

      if (parsed.pathname === '/css/custom.css') {
        return `/legacy/custom.css${parsed.search}${parsed.hash}`;
      }

      if (parsed.pathname === '/css/css_user.css') {
        return `/legacy/css_user.css${parsed.search}${parsed.hash}`;
      }

      return `${parsed.pathname}${parsed.search}${parsed.hash}` || '/';
    } catch {
      return value;
    }
  }

  if (!value.startsWith('/') && !/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)) {
    return `${legacyDir}${value}`;
  }

  return value;
}

function clearManagedHeadNodes() {
  document.head.querySelectorAll(`[${MANAGED_ATTR}="1"]`).forEach((node) => node.remove());
}

function appendManagedNode(node) {
  node.setAttribute(MANAGED_ATTR, '1');
  document.head.appendChild(node);
}

function cloneScript(sourceScript, legacyDir) {
  const script = document.createElement('script');

  for (const { name, value } of sourceScript.attributes) {
    if (name === 'src') {
      script.setAttribute('src', rewriteUrl(value, legacyDir));
    } else {
      script.setAttribute(name, value);
    }
  }

  if (!sourceScript.src) {
    script.textContent = sourceScript.textContent;
  }

  return script;
}

function applyHead(sourceDoc, legacyDir) {
  clearManagedHeadNodes();

  for (const node of sourceDoc.head.children) {
    if (node.tagName === 'TITLE') continue;

    if (node.tagName === 'SCRIPT') {
      const src = node.getAttribute('src') || '';
      if (src.includes('injections.adguard.org')) continue;

      appendManagedNode(cloneScript(node, legacyDir));
      continue;
    }

    const cloned = node.cloneNode(true);

    if (cloned.hasAttribute('href')) {
      cloned.setAttribute('href', rewriteUrl(cloned.getAttribute('href'), legacyDir));
    }

    if (cloned.hasAttribute('src')) {
      cloned.setAttribute('src', rewriteUrl(cloned.getAttribute('src'), legacyDir));
    }

    appendManagedNode(cloned);
  }

  const fixesStylesheet = document.createElement('link');
  fixesStylesheet.rel = 'stylesheet';
  fixesStylesheet.href = '/legacy-fixes.css';
  appendManagedNode(fixesStylesheet);

  document.title = sourceDoc.title || 'Alexandra Diz';
}

function applyBodyAttributes(sourceDoc, isHome) {
  document.body.className = sourceDoc.body.className || '';
  document.body.classList.add('legacy-mode');
  document.body.classList.toggle('legacy-home', !!isHome);

  const trackedAttrs = ['data-template', 'data-preview'];
  for (const attr of trackedAttrs) {
    if (sourceDoc.body.hasAttribute(attr)) {
      document.body.setAttribute(attr, sourceDoc.body.getAttribute(attr));
    } else {
      document.body.removeAttribute(attr);
    }
  }
}

function rewriteContainerUrls(container, legacyDir) {
  const attrs = ['href', 'src', 'data-src', 'data-src2x', 'poster'];

  for (const attr of attrs) {
    container.querySelectorAll(`[${attr}]`).forEach((el) => {
      const raw = el.getAttribute(attr);
      if (!raw) return;
      el.setAttribute(attr, rewriteUrl(raw, legacyDir));
    });
  }
}

function executeBodyScripts(container, legacyDir) {
  const scripts = Array.from(container.querySelectorAll('script'));
  for (const oldScript of scripts) {
    const script = cloneScript(oldScript, legacyDir);
    oldScript.replaceWith(script);
  }
}

export default function LegacySite() {
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [error, setError] = useState('');

  const legacyHtmlPath = useMemo(() => getLegacyHtmlPath(location.pathname), [location.pathname]);

  useEffect(() => {
    function onClick(event) {
      if (event.defaultPrevented) return;
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!anchor) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
        return;
      }

      let url;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;
      if (url.pathname.startsWith('/admin')) return;

      event.preventDefault();
      navigate(`${url.pathname}${url.search}${url.hash}`);
    }

    const node = containerRef.current;
    if (!node) return;
    node.addEventListener('click', onClick);
    return () => node.removeEventListener('click', onClick);
  }, [navigate, location.pathname]);

  useEffect(() => {
    let disposed = false;

    async function load() {
      setError('');

      try {
        const response = await fetch(legacyHtmlPath);
        if (!response.ok) {
          throw new Error(`Cannot load page: ${legacyHtmlPath}`);
        }

        const html = await response.text();
        if (disposed || !containerRef.current) return;

        const sourceDoc = new DOMParser().parseFromString(html, 'text/html');
        const legacyDir = getLegacyDir(legacyHtmlPath);

        applyHead(sourceDoc, legacyDir);
        applyBodyAttributes(sourceDoc, location.pathname === '/');

        containerRef.current.innerHTML = sourceDoc.body.innerHTML;
        rewriteContainerUrls(containerRef.current, legacyDir);
        executeBodyScripts(containerRef.current, legacyDir);

        containerRef.current.classList.remove('legacy-fade-in');
        void containerRef.current.offsetWidth;
        containerRef.current.classList.add('legacy-fade-in');
      } catch (err) {
        if (!disposed) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      }
    }

    load();

    return () => {
      disposed = true;
    };
  }, [legacyHtmlPath, location.pathname]);

  useEffect(() => {
    return () => {
      clearManagedHeadNodes();
      document.body.classList.remove('legacy-mode');
      document.body.classList.remove('legacy-home');
    };
  }, []);

  if (error) {
    return (
      <main style={{ padding: 24, fontFamily: 'Arial, sans-serif' }}>
        <h1>Page load error</h1>
        <p>{error}</p>
      </main>
    );
  }

  return <div ref={containerRef} />;
}
