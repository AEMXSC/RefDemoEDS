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
  getHostname
} from './utils.js';

const experimentationConfig = {
	prodHost: 'www.referencedemo.adobe.com',
	audiences: {
		mobile: () => window.innerWidth < 600,
		desktop: () => window.innerWidth >= 600,
		// define your custom audiences here as needed
	},
};
import {
	runExperimentation,
	showExperimentationRail,
} from './experiment-load.js';

/**
 * Loads and applies theme configuration from spreadsheet
 * Fetches CSS variables from theme-configuration page and injects as <style> tag
 * @param {string} themePath - Path to the theme configuration spreadsheet (optional)
 * @returns {Promise<void>}
 */
async function loadThemeConfiguration(themePath) {
  try {
    let configPath = themePath;
    if (!configPath) {
      const metadataTheme = getMetadata('theme-configuration');
      if (metadataTheme) {
        configPath = metadataTheme;
      } else {
        const lang = getLanguage();
        configPath = `/${lang}/theme-configuration`;
      }
    }
    if (!configPath.endsWith('.json')) {
      configPath = `${configPath}.json`;
    }
    const response = await fetch(configPath);
    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.warn(`Theme configuration not found at ${configPath}`);
      return;
    }
    const json = await response.json();
    if (!json.data || !Array.isArray(json.data)) {
      // eslint-disable-next-line no-console
      console.warn('Invalid theme configuration format');
      return;
    }
    const cssVariables = [];
    json.data.forEach((row) => {
      const { key, value } = row;
      if (!key || !value) return;
      const cssVarName = key.startsWith('--') ? key : `--${key}`;
      cssVariables.push(`  ${cssVarName}: ${value.trim()};`);
    });
    let styleTag = document.getElementById('theme-configuration-styles');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'theme-configuration-styles';
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = `:root {\n${cssVariables.join('\n')}\n}`;
    // eslint-disable-next-line no-console
    console.log(`Theme configuration loaded from ${configPath}`, json.data.length, 'variables applied');
  } catch (error) {
    // eslint-disable-next-line no-console
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
    if (!url) {
      const currentPath = window.location.pathname;
      const pathSegments = currentPath.split('/').filter(Boolean);
      const candidates = pathSegments.map((_, index) => {
        const path = pathSegments.slice(0, index + 1).join('/');
        return `/${path}/theme-configurator`;
      });
      candidates.reverse();
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
            // eslint-disable-next-line no-console
            console.log(`Theme configurator found at: ${candidate}`);
            break;
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn(`Theme configurator not found at ${candidate}`);
        }
      }
      if (!found) {
        url = '/theme-configurator-root';
        // eslint-disable-next-line no-console
        console.log('Using fallback theme configurator: /theme-configurator-root');
      }
    }
    const resp = await fetch(`${url}.plain.html`);
    if (!resp.ok) {
      // eslint-disable-next-line no-console
      console.warn(`Theme configurator not found at ${url}`);
      return;
    }
    const html = await resp.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const cssVariables = [];
    doc.querySelectorAll('.css-variable').forEach((varDiv) => {
      const key = varDiv.querySelector(':scope > div:nth-child(1)')?.textContent?.trim();
      const value = varDiv.querySelector(':scope > div:nth-child(2)')?.textContent?.trim();
      if (key && value) {
        const cssVarName = key.startsWith('--') ? key : `--${key}`;
        cssVariables.push(`  ${cssVarName}: ${value};`);
      }
    });
    const fontFaces = [];
    const fontVariables = [];
    doc.querySelectorAll('.font-properties').forEach((el) => {
      const fontLink = el.querySelector(':scope > div a');
      if (!fontLink) return;
      const fontName = fontLink.textContent?.trim();
      const fontUrl = fontLink.href?.trim();
      if (fontName && fontUrl) {
        fontFaces.push(`@font-face {
            font-family: '${fontName}';
            font-display: swap;
            src: url('${fontUrl}') format('woff');
          }`);
        const fontVarName = fontName.toLowerCase().replace(/\s+/g, '-');
        fontVariables.push(`--${fontVarName}: '${fontName}';`);
      }
    });
    const cssContent = [
      ...fontFaces,
      '',
      ':root {',
      ...cssVariables,
      ...fontVariables,
      '}',
    ].join('\n');
    let styleTag = document.getElementById('theme-configuration-styles');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'theme-configuration-styles';
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = cssContent;
    // eslint-disable-next-line no-console
    console.log(`Theme loaded from ${url}: ${cssVariables.length} variables, ${fontFaces.length} fonts`);
  } catch (error) {
    // eslint-disable-next-line no-console
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
  if(window?.location?.origin?.includes('author')){
    return true;
  }else{
    return false;
  }
  /*
  if(document.querySelector('*[data-aue-resource]') !== null){
    return true;
  }*/
  //return false;
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

  // Load theme from page (default-off: only runs if theme-configurator exists)
  const themeConfigCFPath = getMetadata('theme_cf_reference');
  if (!themeConfigCFPath) {
    await loadThemeFromPage();
  }

  await runExperimentation(doc, experimentationConfig);
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
  await showExperimentationRail(doc, experimentationConfig);
}

function isDMOpenAPIUrl(src) {
  return /^(https?:\/\/(.*)\/adobe\/assets\/urn:aaid:aem:(.*))/gm.test(src);
}

export function getMetadataUrl(url) {
  try {
    // Pattern to match: /adobe/assets/urn:aaid:aem:[uuid]
    // UUID format: 8-4-4-4-12 hexadecimal characters
    const urnPattern = /(\/adobe\/assets\/urn:aaid:aem:[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i;
    const match = url.match(urnPattern);

    if (!match) {
      return null;
    }

    // Extract the base URL (protocol + hostname)
    const urlObj = new URL(url);
    const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;

    // Construct the metadata URL
    return `${baseUrl}${match[1]}/metadata`;
  } catch (error) {
    console.error('Error creating metadata URL:', error);
    return null;
  }
}

/**
   * Decorates Dynamic Media images by modifying their URLs to include specific parameters
   * and creating a <picture> element with different sources for different image formats and sizes.
   *
   * @param {HTMLElement} main - The main container element that includes the links to be processed.
   */
  export async function decorateDMImages(main) {
	
	const allBlocks = Array.from(main.querySelectorAll('.dm-openapi, .dynamic-media-image'));

	for (const block of allBlocks) {
	  	const links = block.querySelectorAll('a[href]');
		// If no links exist, hide everything else within the block
		if (links.length === 0) {
			Array.from(block.children).forEach((child) => {
				child.style.display = 'none';
			});
		}
	}

	const links = Array.from(main.querySelectorAll('a[href]'));

	for (const a of links) {
	  let href = a.href;
	  const hrefLower = href.toLowerCase();
	  if (!isDMOpenAPIUrl(href)) continue;
  
	  const isGifFile = hrefLower.endsWith('.gif');
	  const containsOriginal = href.includes('/original/');
	  const dmOpenApiDiv = a.closest('.dm-openapi') || a.closest('.dynamic-media-image');
  
	  if (!dmOpenApiDiv) continue;
  
	  // Skip non-originals except GIF, as per your logic
	  if (containsOriginal && !isGifFile) continue;
  
	  const blockBeingDecorated = whatBlockIsThis(a);
	  let blockName = '';
	  let rotate = '';
	  let flip = '';
	  let cropValue = '';
	  let preset = '';
	  let extend = '';
	  let backgroundcolor = '';
	  let enableSmartCrop = '';
  
	  if (blockBeingDecorated) {
		blockName = Array.from(blockBeingDecorated.classList).find(
		  (className) => className !== 'block'
		) || '';
	  }
  
	  // Early exclude videos
	  const videoExtensions = ['.mp4', '.mov', '.webm', '.ogg', '.m4v', '.mkv'];
	  const isVideoAsset = videoExtensions.some((ext) => hrefLower.includes(ext));
	  if (isVideoAsset || blockName === 'video') continue;
	  
	  // Extract advanced modifiers only for dynamic-media blocks
	  if (blockName === 'dm-openapi' || blockName === 'dynamic-media-image') {
		const parentDiv = a.closest('div');
		if (parentDiv && parentDiv.parentElement) {
		  const container = parentDiv.parentElement;
		  const siblings = [];
		  let current = container.nextElementSibling;
  
		  // Collect up to 4 siblings (preset, rotate, flip, crop) in order
		  while (current && siblings.length < 7) {
			siblings.push(current);
			current = current.nextElementSibling;
		  }
  
		  // Helper to safely consume a sibling element's trimmed text and remove it
		  const consumeSiblingText = (el) => {
			if (!el) return '';
			const text = el.textContent?.trim() || '';
			if (text) el.remove();
			return text;
		  };
  
		  // Order matters: preset, rotate, flip, crop
		  if (siblings.length > 0) {
			enableSmartCrop = consumeSiblingText(siblings.shift()) || false;
			preset = consumeSiblingText(siblings.shift());
			extend = consumeSiblingText(siblings.shift());
			backgroundcolor = consumeSiblingText(siblings.shift());
			rotate = consumeSiblingText(siblings.shift());
			flip = consumeSiblingText(siblings.shift());
			cropValue = consumeSiblingText(siblings.shift());
		  }
		}
  
		// Remove direct child divs once (minimize DOM thrash)
		const directChildDivs = dmOpenApiDiv.querySelectorAll(':scope > div');
		directChildDivs.forEach((div) => div.remove());
	  }
	  

	   // Build advanced modifier parameters for Dynamic Media URL
	   const buildAdvanceModifierParams = () => {
		const params = [];
		
		// Add rotation parameter
		if (rotate) {
		  params.push(`rotate=${encodeURIComponent(rotate)}`);
		}
		
		// Add flip parameter
		if (flip) {
		  params.push(`flip=${encodeURIComponent(flip.toLowerCase())}`);
		}
		
		// Add crop parameter
		if (cropValue) {
		  params.push(`crop=${encodeURIComponent(cropValue.toLowerCase())}`);
		}
		
		// Handle preset parameter with special logic for 'border' preset
		if (preset) {
		  const presetLower = preset.toLowerCase();
		  
		  if (presetLower === 'border') {
			// Border preset can include extend and background-color
			if (extend && backgroundcolor) {
			  const bgColor = backgroundcolor.replace('#', '');
			  params.push(`extend=${encodeURIComponent(extend)}`);
			  params.push(`background-color=rgb,${encodeURIComponent(bgColor)}`);
			} else if (extend) {
			  params.push(`extend=${encodeURIComponent(extend)}`);
			}
		  }
		  else if (presetLower === 'grayscale') {
			  params.push(`saturation=-100`);
		  } else {
			// Regular preset
			params.push(`preset=${encodeURIComponent(preset)}`);
		  }
		}
		// Join all parameters with '&' and prepend '&' if there are any
		return params.length > 0 ? `&${params.join('&')}` : '';
	  };
	  
	  const advanceModifierParams = buildAdvanceModifierParams();
	  const originalUrl = new URL(href);
	  const hasQueryParams = originalUrl.toString().includes('?');
	  const paramSeparator = hasQueryParams ? '&' : '?';
	  const baseParams = `${paramSeparator}quality=85&preferwebp=true${advanceModifierParams}`;
	  const pic = document.createElement('picture');
  
  
	  // Only add smart crop sources if enableSmartCrop is true
	  if (enableSmartCrop === true || enableSmartCrop === 'true') {
		  const metadataUrl = getMetadataUrl(href);
		  if (!metadataUrl) continue;
  
		  let metadata;
		  try {
			const response = await fetch(metadataUrl);
			if (!response.ok) {
			  console.error(`Failed to fetch metadata: ${response.status}`);
			  continue;
			}
			metadata = await response.json();
		  } catch (error) {
			console.error('Error fetching or processing metadata:', error);
			continue;
		  }
  
		  const smartcrops = metadata?.repositoryMetadata?.smartcrops;
		  const mimeType = metadata?.repositoryMetadata?.["dc:format"];
		  if (smartcrops){
				// Build picture and sources
				pic.style.textAlign = 'center';
		
				const cropKeys = Object.keys(smartcrops);
				if (!cropKeys.length) continue;
		
				// Sort crop keys by width desc (largest → smallest)
				const cropOrder = cropKeys.sort((a, b) => {
					const widthA = parseInt(smartcrops[a].width, 10) || 0;
					const widthB = parseInt(smartcrops[b].width, 10) || 0;
					return widthB - widthA;
				});
		
				const largestCropWidth = Math.max(
					...cropOrder.map((cropName) =>
					parseInt(smartcrops[cropName].width, 10) || 0
					)
				);
		
				const extraLargeBreakpoint = Math.max(largestCropWidth + 1, 1300);
		
				// Extra-large screen source (no smartcrop)
				const sourceWebpExtraLarge = document.createElement('source');
				sourceWebpExtraLarge.type = 'image/webp';
				sourceWebpExtraLarge.srcset = `${originalUrl}${baseParams}`;
				sourceWebpExtraLarge.media = `(min-width: ${extraLargeBreakpoint}px)`;
				pic.appendChild(sourceWebpExtraLarge);
		
				// Smartcrop sources
				cropOrder.forEach((cropName) => {
					const crop = smartcrops[cropName];
					if (!crop) return;
		
					const minWidth = parseInt(crop.width, 10) || 0;
					const smartcropParam = `${paramSeparator}smartcrop=${encodeURIComponent(
					cropName
					)}`;
		
					const sourceWebp = document.createElement('source');
					sourceWebp.type = mimeType ? mimeType : "image/webp";
					sourceWebp.srcset = `${originalUrl}${smartcropParam}&quality=85&preferwebp=true${advanceModifierParams}`;
					if (minWidth > 0) {
					sourceWebp.media = `(min-width: ${minWidth}px)`;
					}
		
					pic.appendChild(sourceWebp);
				});
			}
	  }
  
	  // Fallback 
	  const fallbackUrl = `${originalUrl}${baseParams}`;
	  const img = document.createElement('img');
	  img.loading = 'lazy';
	  img.src = fallbackUrl;
	  //img.alt = href !== a.title ? a.title || '' : '';
  
	  pic.appendChild(img);
	  dmOpenApiDiv.appendChild(pic);
	}
  }

/**
 * Decorates Dynamic Media video blocks by finding video asset links
 * and rendering them appropriately (iframe for DM player URLs, video element for raw files).
 *
 * @param {HTMLElement} main - The main container element that includes the video blocks.
 */
export async function decorateDMVideos(main) {
  const videoBlocks = main.querySelectorAll('.dynamic-media-video');

  for (const block of videoBlocks) {
    const links = Array.from(block.querySelectorAll('a[href]'));

    for (const a of links) {
      const href = a.href;
      const hrefLower = href.toLowerCase();

      // Check if this is a DM OpenAPI URL
      if (!isDMOpenAPIUrl(href)) continue;

      // Check if this is a DM player URL (ends with /play)
      const isDMPlayerUrl = href.includes('/play');

      // Check if this is a video file
      const videoExtensions = ['.mp4', '.mov', '.webm', '.ogg', '.m4v', '.mkv'];
      const isVideoAsset = videoExtensions.some((ext) => hrefLower.includes(ext));

      // Must be either a DM player URL or a video file
      if (!isDMPlayerUrl && !isVideoAsset) continue;

      // Extract video options from authored content
      const parentDiv = a.closest('div');
      const container = parentDiv?.parentElement;
      const siblings = [];

      if (container) {
        let current = container.nextElementSibling;
        // Collect siblings for video options (title, autoplay, loop, muted)
        while (current && siblings.length < 4) {
          siblings.push(current);
          current = current.nextElementSibling;
        }
      }

      // Helper to safely consume a sibling element's trimmed text and remove it
      const consumeSiblingText = (el) => {
        if (!el) return '';
        const text = el.textContent?.trim() || '';
        if (text) el.remove();
        return text;
      };

      // Extract video options: title, autoplay, loop, muted
      const videoTitle = consumeSiblingText(siblings.shift()) || 'Dynamic Media Video';
      const autoplay = consumeSiblingText(siblings.shift())?.toLowerCase() === 'true';
      const loop = consumeSiblingText(siblings.shift())?.toLowerCase() === 'true';
      const muted = consumeSiblingText(siblings.shift())?.toLowerCase() === 'true';

      // Clear block content
      const directChildDivs = block.querySelectorAll(':scope > div');
      directChildDivs.forEach((div) => div.remove());

      if (isDMPlayerUrl) {
        // DM OpenAPI player URL - embed as iframe
        // URL format: https://delivery-{id}.adobeaemcloud.com/adobe/assets/urn:aaid:aem:{uuid}/play
        let playerUrl = href;

        // Add query parameters for player options
        const params = new URLSearchParams();
        if (autoplay) params.set('autoplay', '1');
        if (loop) params.set('loop', '1');
        if (muted || autoplay) params.set('muted', '1'); // Mute if autoplay for browser policy

        const paramString = params.toString();
        if (paramString) {
          playerUrl += (playerUrl.includes('?') ? '&' : '?') + paramString;
        }

        // Create responsive iframe wrapper
        const iframeWrapper = document.createElement('div');
        iframeWrapper.className = 'dm-video-player-wrapper';
        iframeWrapper.style.cssText = 'position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden;';

        const iframe = document.createElement('iframe');
        iframe.src = playerUrl;
        iframe.title = videoTitle;
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media');
        iframe.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;';

        iframeWrapper.appendChild(iframe);
        block.appendChild(iframeWrapper);
        block.dataset.videoLoaded = 'true';

        iframe.addEventListener('load', () => {
          block.dataset.videoLoaded = 'true';
        });

        iframe.addEventListener('error', () => {
          console.error('Error loading DM video player:', playerUrl);
          block.dataset.videoLoaded = 'error';
        });
      } else {
        // Raw video file - use HTML5 video element
        const videoUrl = href.split('?')[0];

        const video = document.createElement('video');
        video.setAttribute('preload', 'metadata');
        video.setAttribute('playsinline', '');
        video.setAttribute('controls', '');
        video.setAttribute('title', videoTitle);

        if (autoplay) {
          video.setAttribute('autoplay', '');
          video.setAttribute('muted', '');
        }
        if (loop) video.setAttribute('loop', '');
        if (muted) video.setAttribute('muted', '');

        const sourceEl = document.createElement('source');
        sourceEl.setAttribute('src', videoUrl);

        const ext = videoUrl.split('.').pop()?.toLowerCase() || 'mp4';
        const mimeTypes = {
          mp4: 'video/mp4',
          webm: 'video/webm',
          ogg: 'video/ogg',
          mov: 'video/quicktime',
          m4v: 'video/mp4',
          mkv: 'video/x-matroska',
        };
        sourceEl.setAttribute('type', mimeTypes[ext] || 'video/mp4');

        video.appendChild(sourceEl);
        block.appendChild(video);
        block.dataset.videoLoaded = 'false';

        video.addEventListener('loadedmetadata', () => {
          block.dataset.videoLoaded = 'true';
        });

        video.addEventListener('error', () => {
          console.error('Error loading DM video:', videoUrl);
          block.dataset.videoLoaded = 'error';
        });
      }
    }
  }
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
