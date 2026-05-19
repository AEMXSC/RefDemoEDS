import {
  loadHeader,
  loadFooter,
  decorateButtons as libDecorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadBlocks,
  loadCSS,
  fetchPlaceholders,
  getMetadata,
  loadScript,
  toClassName,
  toCamelCase
} from './aem.js';
import { picture, source, img, a } from './dom-helpers.js';

import {
  getLanguage,
  formatDate,
  setPageLanguage,
  PATH_PREFIX,
  createSource,
  getHostname,
} from './utils.js';

/**
 * Loads and applies theme configuration from spreadsheet
 * Fetches CSS variables from theme-configuration page and injects as <style> tag
 * @param {string} themePath - Path to the theme configuration spreadsheet (optional)
 * @returns {Promise<void>}
 */
async function loadThemeConfiguration(themePath) {
  try {
    // Determine theme configuration path
    let configPath = themePath;

    // If no path provided, try to get from metadata or use default
    if (!configPath) {
      const metadataTheme = getMetadata('theme-configuration');
      if (metadataTheme) {
        configPath = metadataTheme;
      } else {
        // Default path based on language
        const lang = getLanguage();
        configPath = `/${lang}/theme-configuration`;
      }
    }

    // Ensure .json extension
    if (!configPath.endsWith('.json')) {
      configPath = `${configPath}.json`;
    }

    // Fetch the theme configuration spreadsheet
    const response = await fetch(configPath);
    if (!response.ok) {
      console.warn(`Theme configuration not found at ${configPath}`);
      return;
    }

    const json = await response.json();

    // Check if data exists
    if (!json.data || !Array.isArray(json.data)) {
      console.warn('Invalid theme configuration format');
      return;
    }

    // Build CSS variable declarations for :root
    const cssVariables = [];
    json.data.forEach((row) => {
      const { key, value } = row;

      // Skip empty rows or rows without key/value
      if (!key || !value) return;

      // Ensure key has -- prefix
      const cssVarName = key.startsWith('--') ? key : `--${key}`;
      cssVariables.push(`  ${cssVarName}: ${value.trim()};`);
    });

    // Create or update style tag
    let styleTag = document.getElementById('theme-configuration-styles');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'theme-configuration-styles';
      document.head.appendChild(styleTag);
    }

    // Inject CSS with :root selector
    styleTag.textContent = `:root {\n${cssVariables.join('\n')}\n}`;

    console.log(`Theme configuration loaded from ${configPath}`, json.data.length, 'variables applied');
  } catch (error) {
    console.error('Error loading theme configuration:', error);
  }
}

/**
 * Loads theme configuration from a theme-configurator page
 * Fetches CSS variables and font definitions, applies them to document
 * Searches hierarchy if no explicit path provided
 * @param {string} themePagePath - Optional explicit path to theme configurator
 * @returns {Promise<void>}
 */
async function loadThemeFromPage(themePagePath) {
  try {
    let url = themePagePath;

    // Search for theme-configurator in path hierarchy if not explicitly provided
    if (!url) {
      const currentPath = window.location.pathname;
      const pathSegments = currentPath.split('/').filter(Boolean);

      // Build candidate paths from deepest to shallowest
      const candidates = pathSegments.map((_, index) => {
        const path = pathSegments.slice(0, index + 1).join('/');
        return `/${path}/theme-configurator`;
      });
      candidates.reverse();

      // Search for first available theme-configurator
      let found = false;
      // eslint-disable-next-line no-restricted-syntax
      for (let candidate of candidates) {
        candidate = candidate.includes('.html') ? candidate.replace('.html', '') : candidate;
        try {
          // eslint-disable-next-line no-await-in-loop
          const testResp = await fetch(`${candidate}.plain.html`);
          if (testResp.ok) {
            url = candidate;
            found = true;
            console.log(`Theme configurator found at: ${candidate}`);
            break;
          }
        } catch (e) {
          // Continue to next candidate
          console.warn(`Theme configurator not found at ${candidate}`);
        }
      }

      // Fallback to default root theme
      if (!found) {
        url = '/theme-configurator-root';
        console.log('Using fallback theme configurator: /theme-configurator-root');
      }
    }

    // Fetch theme configuration page
    const resp = await fetch(`${url}.plain.html`);
    if (!resp.ok) {
      console.warn(`Theme configurator not found at ${url}`);
      return;
    }

    const html = await resp.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // Extract CSS variables from css-variable blocks
    const cssVariables = [];
    doc.querySelectorAll('.css-variable').forEach((varDiv) => {
      const key = varDiv.querySelector(':scope > div:nth-child(1)')?.textContent?.trim();
      const value = varDiv.querySelector(':scope > div:nth-child(2)')?.textContent?.trim();

      if (key && value) {
        const cssVarName = key.startsWith('--') ? key : `--${key}`;
        cssVariables.push(`  ${cssVarName}: ${value};`);
      }
    });

    // Extract font faces and create font family variables
    const fontFaces = [];
    const fontVariables = [];

    doc.querySelectorAll('.font-properties').forEach((el) => {
      const fontLink = el.querySelector(':scope > div a');
      if (!fontLink) return;

      const fontName = fontLink.textContent?.trim();
      const fontUrl = fontLink.href?.trim();
      // eslint-disable-next-line no-trailing-spaces

      if (fontName && fontUrl) {
        // Create @font-face declaration
        fontFaces.push(`@font-face {
            font-family: '${fontName}';
            font-display: swap;
            src: url('${fontUrl}') format('woff');
          }`);
        // Create CSS variable for font family
        const fontVarName = fontName.toLowerCase().replace(/\s+/g, '-');
        fontVariables.push(`--${fontVarName}: '${fontName}';`);
      }
    });

    // Build complete CSS content efficiently
    const cssContent = [
      ...fontFaces,
      '',
      ':root {',
      ...cssVariables,
      ...fontVariables,
      '}',
    ].join('\n');

    // Inject or update style tag (single DOM write)
    let styleTag = document.getElementById('theme-configuration-styles');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'theme-configuration-styles';
      document.head.appendChild(styleTag);
    }

    styleTag.textContent = cssContent;

    console.log(`Theme loaded from ${url}: ${cssVariables.length} variables, ${fontFaces.length} fonts`);
  } catch (error) {
    console.error('Error loading theme from page:', error);
  }
}

function addPreconnect(origin) {
  try {
    if (!origin) return;
    const href = String(origin);
    if (!href.startsWith('http')) return;
    if (document.querySelector(`link[rel="preconnect"][href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = href;
    link.crossOrigin = '';
    document.head.appendChild(link);
  } catch (e) {
    /* noop */
  }
}


/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

export function isAuthorEnvironment() {
  if (window?.location?.origin?.includes('author')) {
    return true;
  } else {
    return false
  }
}
/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Return the placeholder file specific to language
 * @returns
 */
export async function fetchLanguagePlaceholders() {
  const langCode = getLanguage();
  try {
    // Try fetching placeholders with the specified language
    return await fetchPlaceholders(`${PATH_PREFIX}/${langCode}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error fetching placeholders for lang: ${langCode}. Will try to get en placeholders`, error);
    // Retry without specifying a language (using the default language)
    try {
      return await fetchPlaceholders(`${PATH_PREFIX}/en`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching placeholders:', err);
    }
  }
  return {}; // default to empty object
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks() {
  try {
    // TODO: add auto block, if needed
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Create section background image from section[data-image].
 * Optionally supports data-tab-image and data-mob-image for responsive overrides.
 * Idempotent: will not duplicate if already enhanced.
 */
function decorateSectionImages(doc) {
  const sections = doc.querySelectorAll('main .section[data-image]');
  sections.forEach((section) => {
    if (section.querySelector('picture.section-bg')) return; // already enhanced

    const desktopSrc = section.dataset.image?.trim();
    if (!desktopSrc) return;

    const tabletSrc = section.dataset.tabImage?.trim();
    const mobileSrc = section.dataset.mobImage?.trim();

    const pic = picture();
    pic.className = 'section-bg';

    // WebP sources for breakpoints (prefer authored overrides if present)
    const desktopCandidate = desktopSrc;
    const tabletCandidate = tabletSrc || desktopSrc;
    const mobileCandidate = mobileSrc || tabletSrc || desktopSrc;

    // Desktop
    try {
      pic.appendChild(source({ srcset: `${new URL(desktopCandidate, window.location.href).pathname}?width=1400&format=webply&optimize=medium`, type: 'image/webp', media: '(min-width: 992px)' }));
    } catch (e) { /* ignore malformed URL */ }
    // Tablet
    try {
      pic.appendChild(source({ srcset: `${new URL(tabletCandidate, window.location.href).pathname}?width=1024&format=webply&optimize=medium`, type: 'image/webp', media: '(min-width: 768px)' }));
    } catch (e) { /* ignore malformed URL */ }
    // Mobile
    try {
      pic.appendChild(source({ srcset: `${new URL(mobileCandidate, window.location.href).pathname}?width=768&format=webply&optimize=medium`, type: 'image/webp', media: '(min-width: 320px)' }));
    } catch (e) { /* ignore malformed URL */ }

    // Fallback <img> uses authored URL (keeps original format/params)
    const fallbackImg = img({ src: desktopSrc, alt: '', class: 'sec-img', loading: 'lazy' });
    pic.appendChild(fallbackImg);

    // Mark and insert as first child
    section.classList.add('section-has-bg');
    section.prepend(pic);

    // Compute and lock section height to image height (based on current width)
    const updateHeight = () => {
      if (fallbackImg.naturalWidth > 0 && fallbackImg.naturalHeight > 0) {
        const ratio = fallbackImg.naturalHeight / fallbackImg.naturalWidth;
        const width = section.getBoundingClientRect().width;
        const height = Math.round(width * ratio);
        section.style.minHeight = '';
        section.style.height = `${height}px`;
      }
    };

    if (fallbackImg.complete) {
      updateHeight();
    } else {
      fallbackImg.addEventListener('load', updateHeight, { once: true });
    }

    // Recalculate on viewport changes
    const onResize = () => updateHeight();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function decorateButtons(main) {
  main.querySelectorAll('img').forEach((img) => {
    let altT = decodeURIComponent(img.alt);

    if (altT && altT.includes('https://delivery-')) {
      try {
        altT = JSON.parse(altT);
        const { altText, deliveryUrl } = altT;
        const url = new URL(deliveryUrl);
        const imgName = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);
        const block = whatBlockIsThis(img);
        const bp = getMetadata(block);
        let breakpoints = [{ media: '(min-width: 600px)', width: '2000' }, { width: '750' }];
        if (bp) {
          const bps = bp.split('|');
          const bpS = bps.map((b) => b.split(',').map((p) => p.trim()));
          breakpoints = bpS.map((n) => {
            const obj = {};
            n.forEach((i) => {
              const t = i.split(/:(.*)/s);
              obj[t[0].trim()] = t[1].trim();
            });
            return obj;
          });
        } else {
          const format = getMetadata(imgName.toLowerCase().replace('.', '-'));
          const formats = format.split('|');
          const formatObj = {};
          formats.forEach((i) => {
            const [a, b] = i.split('=');
            formatObj[a] = b;
          });
          breakpoints = breakpoints.map((n) => (
            { ...n, ...formatObj }
          ));
        }
        const picture = createOptimizedPicture(deliveryUrl, altText, false, breakpoints);
        img.parentElement.replaceWith(picture);
      } catch (error) {
        img.setAttribute('style', 'border:5px solid red');
        img.setAttribute('data-asset-type', 'video');
        img.setAttribute('title', 'Update block to render video.');
      }
    }
  });
  libDecorateButtons(main);
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateDMImages(main);
}


async function renderWBDataLayer() {

  //const config = await fetchPlaceholders();
  const lastPubDateStr = getMetadata('published-time');
  const firstPubDateStr = getMetadata('content_date') || lastPubDateStr;
  const hostnameFromPlaceholders = await getHostname();
  window.wbgData.page = {
    pageInfo: {
      pageCategory: getMetadata('pagecategory'),
      channel: getMetadata('channel'),
      themecfreference: getMetadata('theme_cf_reference'),
      contentType: getMetadata('content_type'),
      pageUid: getMetadata('pageuid'),
      pageName: getMetadata('pagename'),
      hostName: hostnameFromPlaceholders ? hostnameFromPlaceholders : getMetadata('hostname'),
      pageFirstPub: formatDate(firstPubDateStr),
      pageLastMod: formatDate(lastPubDateStr),
      webpackage: '',
    },
  };
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  setPageLanguage();

  // Load theme configuration early (before decorating)
  // await loadThemeConfiguration();

  // Load theme from page (theme-configurator-root)
  const themeConfigCFPath = getMetadata('theme_cf_reference');
  if (!themeConfigCFPath) {
    await loadThemeFromPage();
  }

  // Preconnect dynamically to speed up LCP fetch without hardcoding hosts
  try {
    addPreconnect(window.location.origin);
    const lcpImg = doc.querySelector('main img');
    if (lcpImg?.src) {
      const u = new URL(lcpImg.src, window.location.href);
      addPreconnect(u.origin);
    }
  } catch (e) {
    // ignore
  }
  decorateTemplateAndTheme();
  renderWBDataLayer();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Create section background image
 *
 * @param {*} doc
 */
// function decorateSectionImages(doc) {
//   const sectionImgContainers = doc.querySelectorAll('main .section[data-image]');
//   sectionImgContainers.forEach((sectionImgContainer) => {
//     const sectionImg = sectionImgContainer.dataset.image;
//     const sectionTabImg = sectionImgContainer.dataset.tabImage;
//     const sectionMobImg = sectionImgContainer.dataset.mobImage;
//     let defaultImgUrl = null;

//     const newPic = document.createElement('picture');
//     if (sectionImg) {
//       newPic.appendChild(createSource(sectionImg, 1920, '(min-width: 1024px)'));
//       defaultImgUrl = sectionImg;
//     }

//     if (sectionTabImg) {
//       newPic.appendChild(createSource(sectionTabImg, 1024, '(min-width: 768px)'));
//       defaultImgUrl = sectionTabImg;
//     }

//     if (sectionMobImg) {
//       newPic.appendChild(createSource(sectionTabImg, 600, '(max-width: 767px)'));
//       defaultImgUrl = sectionMobImg;
//     }

//     const newImg = document.createElement('img');
//     newImg.src = defaultImgUrl;
//     newImg.alt = '';
//     newImg.className = 'sec-img';
//     newImg.loading = 'lazy';
//     newImg.width = '768';
//     newImg.height = '100%';

//     if (defaultImgUrl) {
//       newPic.appendChild(newImg);
//       sectionImgContainer.prepend(newPic);
//     }
//   });
// }

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);
  decorateSectionImages(doc);
  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();
  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}


/**
 * Decorates Dynamic Media images by modifying their URLs to include specific parameters
 * and creating a <picture> element with different sources for different image formats and sizes.
 *
 * @param {HTMLElement} main - The main container element that includes the links to be processed.
 */
export function decorateDMImages(main) {
  main.querySelectorAll('a[href^="https://delivery-p"]').forEach((a) => {
    const url = new URL(a.href.split('?')[0]);
    if (url.hostname.endsWith('.adobeaemcloud.com')) {

      const blockBeingDecorated = whatBlockIsThis(a);
      let blockName = '';
      let rotate = '';
      let flip = '';
      let crop = '';
      if (blockBeingDecorated && blockBeingDecorated.classList) {
        blockName = Array.from(blockBeingDecorated.classList).find(className => className !== 'block');
      }
      const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.ogg', '.m4v', '.mkv'];
      const isVideoAsset = videoExtensions.some(ext => url.href.toLowerCase().includes(ext));
      // Skip blocks that handle their own image decoration
      const excludedBlocks = ['video', 'carousel', 'cards'];
      if (isVideoAsset || excludedBlocks.includes(blockName)) return;
      if (blockName && blockName === 'dynamicmedia-image') {
        rotate = blockBeingDecorated?.children[3]?.textContent?.trim();
        flip = blockBeingDecorated?.children[4]?.textContent?.trim();
        crop = blockBeingDecorated?.children[5]?.textContent?.trim();
      }

      const uuidPattern = /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i;
      const match = url.href?.match(uuidPattern);
      let aliasname = '';
      if (!match) {
        throw new Error('No asset UUID found in URL');
      } else {
        aliasname = match[1];
      }
      let hrefWOExtn = url.href?.substring(0, url.href?.lastIndexOf('.'))?.replace(/\/original\/(?=as\/)/, '/');
      const pictureEl = picture(
        source({
          srcset: `${hrefWOExtn}.webp?width=1400&quality=85&preferwebp=true${rotate ? '&rotate=' + rotate : ''}${flip ? '&flip=' + flip.toLowerCase() : ''}${crop ? '&crop=' + crop.toLowerCase() : ''}`,
          type: 'image/webp',
          media: '(min-width: 992px)'
        }),
        source({
          srcset: `${hrefWOExtn}.webp?width=1320&quality=85&preferwebp=true${rotate ? '&rotate=' + rotate : ''}${flip ? '&flip=' + flip.toLowerCase() : ''}${crop ? '&crop=' + crop.toLowerCase() : ''}`,
          type: 'image/webp',
          media: '(min-width: 768px)'
        }),
        source({
          srcset: `${hrefWOExtn}.webp?width=780&quality=85&preferwebp=true${rotate ? '&rotate=' + rotate : ''}${flip ? '&flip=' + flip.toLowerCase() : ''}${crop ? '&crop=' + crop.toLowerCase() : ''}`,
          type: 'image/webp',
          media: '(min-width: 320px)'
        }),
        source({
          srcset: `${hrefWOExtn}.webp?width=1400&quality=85${rotate ? '&rotate=' + rotate : ''}${flip ? '&flip=' + flip.toLowerCase() : ''}${crop ? '&crop=' + crop.toLowerCase() : ''}`,
          media: '(min-width: 992px)'
        }),
        source({
          srcset: `${hrefWOExtn}.webp?width=1320&quality=85${rotate ? '&rotate=' + rotate : ''}${flip ? '&flip=' + flip.toLowerCase() : ''}${crop ? '&crop=' + crop.toLowerCase() : ''}`,
          media: '(min-width: 768px)'
        }),
        source({
          srcset: `${hrefWOExtn}.webp?width=780&quality=85${rotate ? '&rotate=' + rotate : ''}${flip ? '&flip=' + flip.toLowerCase() : ''}${crop ? '&crop=' + crop.toLowerCase() : ''}`,
          media: '(min-width: 320px)'
        }),
        img({
          src: `${hrefWOExtn}.webp?width=1400&quality=85${rotate ? '&rotate=' + rotate : ''}${flip ? '&flip=' + flip.toLowerCase() : ''}${crop ? '&crop=' + crop.toLowerCase() : ''}`,
          alt: a.innerText
        }),
      );
      a.replaceWith(pictureEl);
    }
  });
}

function whatBlockIsThis(element) {
  let currentElement = element;

  while (currentElement.parentElement) {
    if (currentElement.parentElement.classList.contains('block')) return currentElement.parentElement;
    currentElement = currentElement.parentElement;
    if (currentElement.classList.length > 0) return currentElement.classList[0];
  }
  return null;
}

/**
 * remove the adujusts the auto images
 * @param {Element} main The container element
 */
function adjustAutoImages(main) {
  const pictureElement = main.querySelector('div > p > picture');
  if (pictureElement) {
    const pElement = pictureElement.parentElement;
    pElement.className = 'auto-image-container';
  }
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  window.wbgData ||= {};
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
// document.querySelector('.highlight').style.backgroundColor = 'var(--primery-color)';
