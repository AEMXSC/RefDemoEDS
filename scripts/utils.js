import {
  div, p, section, a, button,
  span,
} from './dom-helpers.js';

export const PATH_PREFIX = '/language-masters';
export const TAG_ROOT = 'wknd-universal:';
//export const SITE_NAME = 'wknd-universal';
export const SUPPORTED_LANGUAGES = [
  'en',    // English
  'fr',    // French
  'de',    // German
  'es',    // Spanish
  'it',    // Italian
  'pt',    // Portuguese
  'nl',    // Dutch
  'sv',    // Swedish
  'da',    // Danish
  'ru',    // Russian
  'ja',    // Japanese
  'zh',    // Chinese (Simplified)
  'zh_TW', // Chinese (Traditional)
  'ko',    // Korean
  'ar',    // Arabic
  'he',    // Hebrew
];
export const INTERNAL_PAGES = ['/footer', '/nav', '/fragments', '/data', '/drafts'];

let lang;
import { fetchPlaceholders } from './aem.js';
import { isAuthorEnvironment } from './scripts.js';

/**
 * Extracts the site name from the current URL pathname
 * @description Extracts the site name from paths following the pattern /content/site-name/...
 * For example:
 * - From "/content/wknd-universal/language-masters/en/path" returns "wknd-universal"
 * - From "/content/wknd-universal/language-masters/en/path/to/content.html" returns "wknd-universal"
 * @returns {string} The site name extracted from the path, or empty string if not found
 */
  export async function getSiteName() {
    try {
      if(isAuthorEnvironment()){
          // Fallback to extracting from pathname
          const { pathname } = window.location;
          const siteNameFromPath = pathname.split('/content/')[1]?.split('/')[0] || '';
          return siteNameFromPath;
      } else {
        const listOfAllPlaceholdersData = await fetchPlaceholders();
        const siteName = listOfAllPlaceholdersData?.siteName;
        if (siteName) {
          return siteName.replaceAll('/content/', '');
        }
      }
    } catch (error) {
      console.warn('Error fetching placeholders for siteName:', error);
    }
}


/**
 * Extracts the site name from the current URL pathname
 * @description Extracts the site name from paths following the pattern /content/site-name/...
 * For example:
 * - From "/content/wknd-universal/language-masters/en/path" returns "wknd-universal"
 * -From "/content/wknd-universal/language-masters/en/path/to/content.html" returns "wknd-universal"
 * @returns {string} The site name extracted from the path, or empty string if not found
 */
export async function getHostname() {
  try {
    const listOfAllPlaceholdersData = await fetchPlaceholders();
    const hostname = listOfAllPlaceholdersData?.hostname;
    if (hostname) {
      return hostname;
    }
  } catch (error) {
    console.warn('Error fetching placeholders for hostname:', error);
  }
}

/**
 * Fetch the dynamic media server name from placeholder
 * @description Fetches the dynamic media server URL from placeholder.
 * @returns {string} The full URL of the dynamic media server with ending slash
 */
export async function getDynamicMediaServerURL() {
  try {
    const listOfAllPlaceholdersData = await fetchPlaceholders();
    let dmurl = listOfAllPlaceholdersData?.dmurl;

    if (dmurl) {
      // Check if protocol is missing and prepend https:// if needed
      if (!dmurl.startsWith('http://') && !dmurl.startsWith('https://')) {
        dmurl = `https://${dmurl}`;
      }
      // Ensure URL ends with a trailing slash
      if (!dmurl.endsWith('/')) {
        dmurl = `${dmurl}/`;
      }
      return dmurl;
    }
  } catch (error) {
    console.warn('Error fetching placeholders for dmurl:', error);
  }
}


/**
 * Get Inherited Page Properties
 * Considers pathnames like /en/path/to/content and
 * /content/wknd-universal/language-masters/en/path/to/content.html for both EDS and AEM
 */
export function getInheritedPageProperties() {
  const { pathname } = window.location;
  const isContentPath = pathname.startsWith('/content');
  const parts = pathname.split('/');
  const safeLangGet = (index) => (parts.length > index ? parts[index] : 'en');
  /* 5 is the index of the language in the path for AEM content paths like
     /content/wknd-universal/language-masters/en/path/to/content.html
     2 is the index of the language in the path for EDS paths like /en/path/to/content
    */
  
  let langCode = isContentPath ? safeLangGet(3) : safeLangGet(0);

  
  // remove suffix from lang if any
  if (langCode.indexOf('.') > -1) {
    langCode = langCode.substring(0, langCode.indexOf('.'));
  }
  
  if (!langCode) langCode = 'en'; // default to en
  // substring before lang
  const prefix = pathname.substring(0, pathname.indexOf(`/${langCode}`)) || '';
  let suffix = pathname.substring(pathname.indexOf(`/${langCode}`) + langCode.length + 1) || '';
  // Normalize to avoid leading slashes (prevents `//` in computed URLs)
  if (suffix.startsWith('/')) suffix = suffix.replace(/^\/+/, '');
  return {
    prefix,
    suffix,
    langCode,
    isContentPath,
  };
}


/**
 * Process current pathname and return details for use in language switching
 * Considers pathnames like /en/path/to/content and
 * /content/wknd-universal/language-masters/en/path/to/content.html for both EDS and AEM
 */
export function getPathDetails() {
  const { pathname } = window.location;
  const isContentPath = pathname.startsWith('/content');
  const parts = pathname.split('/');
  const safeLangGet = (index) => (parts.length > index ? parts[index] : 'en');
  /* 5 is the index of the language in the path for AEM content paths like
     /content/wknd-universal/language-masters/en/path/to/content.html
     2 is the index of the language in the path for EDS paths like /en/path/to/content
    */
  let langCode = isContentPath ? safeLangGet(4) : safeLangGet(1);
  // remove suffix from lang if any
  if (langCode.indexOf('.') > -1) {
    langCode = langCode.substring(0, langCode.indexOf('.'));
  }
  if (!langCode) langCode = 'en'; // default to en
  // substring before lang
  const prefix = pathname.substring(0, pathname.indexOf(`/${langCode}`)) || '';
  let suffix = pathname.substring(pathname.indexOf(`/${langCode}`) + langCode.length + 1) || '';
  if (suffix.startsWith('/')) suffix = suffix.replace(/^\/+/, '');
  return {
    prefix,
    suffix,
    langCode,
    isContentPath,
  };
}

/**
 * Fetch and return language of current page.
 * @returns language of current page
 */
export function getLanguage() {
  if (!lang) {
    lang = getPathDetails().langCode;
    if (!SUPPORTED_LANGUAGES.includes(lang)) {
      lang = 'en';
    }
  }
  return lang;
}

export function setPageLanguage() {
  const currentLang = getLanguage();
  document.documentElement.lang = currentLang;
}

/**
 * Compute the URL of the current page for a target language.
 * Supports both EDS-style (/en/path) and AEM author (/content/{site}/language-masters/en/path.html)
 */
export function computeLocalizedUrl(targetLang) {
  try {
    if (!targetLang || typeof targetLang !== 'string') return window.location.href;
    const { langCode, suffix, isContentPath } = getPathDetails();

    const url = new URL(window.location.href);
    const query = url.search || '';
    const hash = url.hash || '';

    if (!isContentPath) {
      // EDS: /{lang}/{suffix}
      const cleanSuffix = suffix ? suffix.replace(/^\/+/, '') : '';
      if (targetLang.toLowerCase() === 'en' && !cleanSuffix) {
        // Homepage → root
        return `/${query}${hash}`.replace(/\/\/?(?=\?|#|$)/, '/');
      }
      const next = `/${targetLang}${cleanSuffix ? `/${cleanSuffix}` : ''}`;
      return `${next}${query}${hash}`;
    }

    // AEM author: /content/{site}/language-masters/{lang}/{suffix}.html
    // getSiteName can be async; fall back to path parsing if needed synchronously
    const { pathname } = window.location;
    const parts = pathname.split('/');
    const siteNameFromPath = parts[2] || '';
    const base = `/content/${siteNameFromPath}${PATH_PREFIX}/${targetLang}`;
    // Normalize suffix:
    // - treat ".html" (language root) as empty
    // - strip any trailing .html from non-empty suffixes to avoid double extensions
    const normalizedSuffix = (() => {
      if (!suffix) return '';
      const withoutLeadingSlashes = suffix.replace(/^\/+/, '');
      // Remove one or more trailing ".html" occurrences
      const strippedTrailingHtml = withoutLeadingSlashes.replace(/(?:\.html)+$/i, '');
      // Treat purely ".html" (or repeated) as empty suffix
      if (!strippedTrailingHtml || strippedTrailingHtml === '.') return '';
      return strippedTrailingHtml;
    })();
    const withSuffix = normalizedSuffix ? `/${normalizedSuffix}` : '';
    return `${base}${withSuffix}.html${query}${hash}`;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('computeLocalizedUrl failed', e);
    return window.location.href;
  }
}

/**
 * Discover available languages from placeholders.
 * Authors can set a row in placeholders with Key=languages and Text="en,fr,de".
 * Falls back to ['en'] if not present.
 */
export async function discoverLanguagesFromPlaceholders() {
  try {
    const placeholders = await fetchPlaceholders();
    const raw = placeholders.languages || placeholders.availableLanguages || '';
    const parsed = String(raw)
      .split(',')
      .map((s) => s && s.trim())
      .filter(Boolean);
    if (parsed.length) return parsed;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('discoverLanguagesFromPlaceholders failed', e);
  }
  return ['en'];
}

export function formatDate(dObjStr) {
  if (dObjStr) {
    const dObj = new Date(dObjStr);
    const yyyy = dObj.getFullYear();
    let mm = dObj.getMonth() + 1;
    let dd = dObj.getDate();

    if (dd < 10) dd = `0${dd}`;
    if (mm < 10) mm = `0${mm}`;

    const formatted = `${mm}-${dd}-${yyyy}`;
    return formatted;
  }
  return '';
}


/**
 * Remove prefix from tag
 * @param {*} tag
 * @returns
 */
export function processTags(tag, prefix = '') {
  if (tag) {
    return tag.replace(TAG_ROOT, '').replace(`${prefix}/`, '');
  }
  return null;
}

/**
 *
 * Helper function to create a <source> element
 *
 * @returns imageSource
 */
export function createSource(src, width, mediaQuery) {
  const { pathname } = new URL(src, window.location.href);
  const source = document.createElement('source');
  source.type = 'image/webp';
  source.srcset = `${pathname}?width=${width}&format=webply&optimize=medium`;
  source.media = mediaQuery;

  return source;
}

/**
 * Return the placeholder file specific to language
 * @returns
 */
export async function fetchLanguageNavigation(langCode) {
  window.navigationData = window.navigationData || {};

  if (!window.navigationData[langCode]) {
    window.navigationData[langCode] = new Promise((resolve) => {
      fetch(`${PATH_PREFIX}${langCode}/navigation.json`)
        .then((resp) => (resp.ok ? resp.json() : {}))
        .then((json) => {
          window.navigationData[langCode] = json.data;
          resolve(window.navigationData[langCode]);
        })
        .catch(() => {
          window.navigationData[langCode] = {};
          resolve(window.navigationData[langCode]);
        });
    });
  }
  await window.navigationData[langCode];
}

/**
 * Load and cache path mappings from paths.json to convert AEM content paths
 * (e.g., /content/...) into site-relative paths (e.g., /en/...).
 */
let cachedPathMappings;
export async function getPathMappings() {
  if (cachedPathMappings) return cachedPathMappings;
  try {
    const resp = await fetch('/paths.json', { headers: { Accept: 'application/json' } });
    if (!resp.ok) return { mappings: [], includes: [] };
    const json = await resp.json();
    cachedPathMappings = {
      mappings: Array.isArray(json.mappings) ? json.mappings.slice() : [],
      includes: Array.isArray(json.includes) ? json.includes.slice() : [],
    };
    return cachedPathMappings;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to load /paths.json', e);
    return { mappings: [], includes: [] };
  }
}

/**
 * Map a given AEM content path to a site-relative path using mappings from paths.json.
 * - Chooses the longest matching source prefix.
 * - Preserves the remaining suffix (without .html).
 * - Always returns a leading slash path.
 */
export async function mapAemPathToSitePath(aemPath) {
  try {
    if (!aemPath || typeof aemPath !== 'string') return aemPath || '/';
    const url = new URL(aemPath, window.location.origin);
    let pathname = url.pathname || aemPath;
    // Strip .html if present
    pathname = pathname.replace(/\.html$/i, '');
    const { mappings } = await getPathMappings();
    if (!mappings || !mappings.length) return pathname;
    // Find best match (longest src that is a prefix of pathname)
    let best = null;
    mappings.forEach((entry) => {
      if (typeof entry !== 'string' || !entry.includes(':')) return;
      const [srcRaw, destRaw] = entry.split(':');
      const src = srcRaw.trim();
      const dest = (destRaw || '').trim();
      if (src && pathname.startsWith(src)) {
        if (!best || src.length > best.src.length) {
          best = { src, dest };
        }
      }
    });
    if (!best) return pathname;
    const suffix = pathname.substring(best.src.length);
    const join = (a, b) => {
      if (!a) return b || '/';
      if (!b) return a || '/';
      const left = a.endsWith('/') ? a.slice(0, -1) : a;
      const right = b.startsWith('/') ? b.slice(1) : b;
      return `/${[left, right].filter(Boolean).join('/')}`.replace(/\/{2,}/g, '/');
    };
    let mapped = join(best.dest, suffix);
    // Normalize to have leading slash and collapse double slashes
    if (!mapped.startsWith('/')) mapped = `/${mapped}`;
    mapped = mapped.replace(/\/{2,}/g, '/');
    return mapped;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to map AEM path to site path', e);
    return aemPath;
  }
}


export async function fetchData(url, method = 'GET', headers = {}, body = null) {
  try {
    const options = { method, headers: { ...headers } };
    if (method === 'POST' && body) { options.headers['Content-Type'] = 'application/json'; options.body = JSON.stringify(body); }
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error fetching data from ${url}:`, error);
    return null;
  }
}

/**
 * Returns the true of the current page in the browser.
 * If the page is running in a iframe with srcdoc,
 * the ancestor origin + the path query param is returned.
 * @returns {String} The href of the current page or the href of the block running in the library
 */
export function getHref() {
  if (window.location.href !== 'about:srcdoc') return window.location.href;

  const urlParams = new URLSearchParams(window.parent.location.search);
  return `${window.parent.location.origin}${urlParams.get('path')}`;
}

/**
 * Check if a page is internal or not
 */
export function isInternalPage() {
  const pageUrl = getHref();
  // eslint-disable-next-line consistent-return
  INTERNAL_PAGES.forEach((element) => { if (pageUrl.indexOf(element) > 0) return true; });
  return false;
}


/**
 * Get the query string value
 * @param {*} key
 * @returns
 */
export function getQueryString(key = 'tip', path = window.location.href) {
  const pageUrl = new URL(path);
  return pageUrl.searchParams.get(key);
}

/**
 * Process Dynamic media image to append query param
 * @param {*} pictureElement
 * @param {*} qParam
 */
export function dynamicMediaAssetProcess(pictureElement, qParam) {
  const queryParams = qParam.textContent.trim();
  if (queryParams.length > 0) {
    Array.from(pictureElement.children).forEach((child) => {
      const baseUrl = child.tagName === 'SOURCE' ? child.srcset.split('?')[0] : child.src.split('?')[0];
      if (child.tagName === 'SOURCE' && child.srcset) {
        child.srcset = `${baseUrl}?${queryParams}`;
      } else if (child.tagName === 'IMG' && child.src) {
        child.src = `${baseUrl}?${queryParams}`;
      }
    });
  }
}
