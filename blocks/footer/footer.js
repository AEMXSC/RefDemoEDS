import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { isAuthorEnvironment } from '../../scripts/scripts.js';

import {
  getLanguage, getSiteName, TAG_ROOT, PATH_PREFIX, fetchLanguageNavigation,
} from '../../scripts/utils.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const langCode = getLanguage();
  const siteName = await getSiteName();
  const isAuthor = isAuthorEnvironment();
  let footerPath = `/${langCode}/footer`;

  if (isAuthor) {
    footerPath = footerMeta
      ? new URL(footerMeta, window.location).pathname
      : `/content/${siteName}${PATH_PREFIX}/${langCode}/footer`;
  }

  /*
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  //const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  //console.log("pathSegments footer: ", pathSegments);
  const parentPath = pathSegments.length > 2 ? `/${pathSegments.slice(0, 3).join('/')}` : '/';
  //console.log("parentPath footer: ", parentPath);
  const footerPath = parentPath=='/' ? footerMeta ? new URL(footerMeta, window.location).pathname : '/footer' : footerMeta ? new URL(footerMeta, window.location).pathname : parentPath+'/footer';
  //console.log("footerPath footer: ", footerPath);
  */

  /**
   * Try to load footer in hierarchical order
   * Example: /us/new-bfsi/page -> tries /us/new-bfsi/footer then /us/footer
   */
  async function loadFooterHierarchically(footer = "") {
    const pathSegments = footer !== "" ? footer.split('/').filter(Boolean) : window.location.pathname.split('/').filter(Boolean);

    // Build paths to try in order (most specific to least specific)
    const pathsToTry = [];

    if(footer === ''){
      if (!isAuthor) {
        // For published site: try current path hierarchy
        // eslint-disable-next-line no-plusplus
        for (let i = pathSegments.length; i > 0; i--) {
          const pathPrefix = pathSegments.slice(0, i).join("/");
          pathsToTry.push(`/${pathPrefix}/footer`);
        }
      } else {
        // For author environment: use content path structure
        if (footerMeta) {
          pathsToTry.push(new URL(footerMeta, window.location).pathname);
        } else {
          // Build hierarchy with /content/{siteName} prefix
          for (let i = pathSegments.length; i > 0; i--) {
            const pathPrefix = pathSegments.slice(0, i).join('/');
            pathsToTry.push(`/content/${siteName}${PATH_PREFIX}/${pathPrefix}/footer`);
          }
          // Fallback to base language footer
          pathsToTry.push(`/content/${siteName}${PATH_PREFIX}/${langCode}/footer`);
        }
      }
    }else{
      pathsToTry.push(footer);
    }
    

    // Remove duplicates while preserving order
    const uniquePaths = [...new Set(pathsToTry)];

    console.log("Trying to load footer from paths:", uniquePaths);

    // Try each path until one succeeds
    for (const path of uniquePaths) {
      try {
        const fragment = await loadFragment(path);
        if (fragment && fragment.firstElementChild) {
          console.log("Successfully loaded footer from:", path);
          return fragment;
        }
      } catch (error) {
        console.log(`Footer not found at ${path}, trying next...`);
      }
    }

    // If nothing worked, return null
    console.warn("No footer found in hierarchy");
    return null;
  }
  const fragment = await loadFooterHierarchically();

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);
  console.log(block);
  const selectVariant = block.querySelector('.section').classList;

  if (window.innerWidth > 992) {
      block.querySelectorAll('.accordion-item').forEach((ele) => {
        ele.open = true;
      });
    }

  if (selectVariant.contains('footer-variant3')) {
           block.querySelectorAll('.accordion-item').forEach((ele) => {
        ele.open = true;
      });
  }

  if (selectVariant.contains('healthcare-footerv3')) {
     block.querySelectorAll('.accordion-item').forEach((ele) => {
        ele.open = true;
      });
  }
}
