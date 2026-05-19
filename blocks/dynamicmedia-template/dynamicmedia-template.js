import { getMetadata } from '../../scripts/aem.js';
import { isAuthorEnvironment, moveInstrumentation } from '../../scripts/scripts.js';
import { getHostname } from '../../scripts/utils.js';

/**
 * @param {HTMLElement} $block
 */
export default async function decorate(block) {
  console.log(block);

  let inputs = block.querySelectorAll('.dynamicmedia-template > div');

  let configSrc = Array.from(block.children)[0]?.textContent?.trim(); //inline or cf

  // fallback default to inline mode
  if (configSrc === 'inline' || !configSrc) {
    // Get DM Url input
    let templateURL = inputs[1]?.textContent?.trim();
    let variablemapping = inputs[2]?.textContent?.trim();

    if (!templateURL) {
      console.error('Missing mandatory template URL', {
        error: error.message,
        stack: error.stack
      });
      block.innerHTML = '';
      return;
    }

    // Step 1: Convert to key-value object
    //const paramPairs = variablemapping.match(/[^,]+=[^$]+(?:,?[^,$=][^,]*)*/g);

    // Split by comma first, then handle each parameter pair
    const paramPairs = variablemapping.split(',');
    const paramObject = {};
    /*
    paramPairs.forEach(pair => {
      const indexOfEqual = pair.indexOf('=');
      const key = pair.slice(0, indexOfEqual).trim();
      let value = pair.slice(indexOfEqual + 1).trim();

      // 🧹 Remove trailing comma (if any)
      if (value.endsWith(',')) {
        value = value.slice(0, -1);
      }

      paramObject[key] = value;
    });
    */

    if (paramPairs) {
      paramPairs.forEach(pair => {
        const indexOfEqual = pair.indexOf('=');
        if (indexOfEqual !== -1) {
          const key = pair.slice(0, indexOfEqual).trim();
          let value = pair.slice(indexOfEqual + 1).trim();

          // Remove trailing comma (if any)
          if (value.endsWith(',')) {
            value = value.slice(0, -1);
          }

          // Only add if key is not empty
          if (key) {
            paramObject[key] = value;
          }
        }
      });
    }

    // Manually construct the query string (preserving `$` in keys)
    const queryString = Object.entries(paramObject)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    // Combine with template URL (already includes ? or not)
    let finalUrl = templateURL.includes('?')
      ? `${templateURL}&${queryString}`
      : `${templateURL}?${queryString}`;

    console.log("Final URL:", finalUrl);

    if (finalUrl) {
      const finalImg = document.createElement('img');
      Object.assign(finalImg, {
        className: 'dm-template-image',
        src: finalUrl,
        alt: 'dm-template-image',
      });
      // Add error handling for image load failure
      finalImg.onerror = function () {
        console.warn('Failed to load image:', finalUrl);
        // Set fallback image
        this.src = 'https://smartimaging.scene7.com/is/image/DynamicMediaNA/WKND%20Template?wid=2000&hei=2000&qlt=100&fit=constrain'; // Replace with your fallback image path
        this.alt = 'Fallback image - template image not correctly authored';
      };
      block.innerHTML = '';
      block.append(finalImg);
    }
  } else if (configSrc === 'cf') {
    // https://author-p153659-e1620914.adobeaemcloud.com/graphql/execute.json/wknd-universal/DynamicMediaTemplateByPath;path=
    const CONFIG = {
      WRAPPER_SERVICE_URL: 'https://3635370-refdemoapigateway-stage.adobeioruntime.net/api/v1/web/ref-demo-api-gateway/fetch-cf',
      GRAPHQL_QUERY: '/graphql/execute.json/ref-demo-eds/DynamicMediaTemplateByPath',
    };

    const hostnameFromPlaceholders = await getHostname();
    const hostname = hostnameFromPlaceholders ? hostnameFromPlaceholders : getMetadata('hostname');
    const aemauthorurl = getMetadata('authorurl') || '';

    const aempublishurl = hostname?.replace('author', 'publish')?.replace(/\/$/, '');

    const persistedquery = '/graphql/execute.json/ref-demo-eds/DynamicMediaTemplateByPath';

    const contentPath = block.querySelector("p.button-container > a")?.textContent?.trim();
    const isAuthor = isAuthorEnvironment();

    // Prepare request configuration based on environment
    const requestConfig = isAuthor
      ? {
        url: `${aemauthorurl}${CONFIG.GRAPHQL_QUERY};path=${contentPath};ts=${Date.now()}`,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
      : {
        url: `${CONFIG.WRAPPER_SERVICE_URL}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graphQLPath: `${aempublishurl}${CONFIG.GRAPHQL_QUERY}`,
          cfPath: contentPath,
          variation: `master;ts=${Date.now()}`,
        }),
      };

    try {
      // Fetch data
      const response = await fetch(requestConfig.url, {
        method: requestConfig.method,
        headers: requestConfig.headers,
        ...(requestConfig.body && { body: requestConfig.body })
      });

      if (!response.ok) {
        console.error(`error making cf graphql request:${response.status}`, {
          error: error.message,
          stack: error.stack,
        });
        block.innerHTML = '';
        return;
      }

      const offer = await response.json();
      // Get the template URL and parameter mappings
      const templateURL = offer?.data?.dynamicMediaTemplateByPath?.item?.dm_template;
      const paramPairs = offer?.data?.dynamicMediaTemplateByPath?.item?.var_mapping;

      // Create parameter object
      const paramObject = {};

      // Process each parameter pair
      paramPairs.forEach(pair => {
        const indexOfEqual = pair.indexOf('=');
        const key = pair.slice(0, indexOfEqual).trim();
        let value = pair.slice(indexOfEqual + 1).trim();

        // Remove trailing comma if any
        if (value.endsWith(',')) {
          value = value.slice(0, -1);
        }
        paramObject[key] = value;
      });

      // Construct the query string (preserving `$` in keys)
      const queryString = Object.entries(paramObject)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

      // Combine with template URL
      let finalUrl = templateURL.includes('?')
        ? `${templateURL}&${queryString}`
        : `${templateURL}?${queryString}`;

      console.log("Final URL:", finalUrl);

      // Create and append the image element
      if (finalUrl) {
        const finalImg = document.createElement('img');
        Object.assign(finalImg, {
          className: 'dm-template-image',
          src: finalUrl,
          alt: 'dm-template-image',
        });

        // Add error handling for image load failure
        finalImg.onerror = function () {
          console.warn('Failed to load image:', finalUrl);
          // Set fallback image
          this.src = 'https://smartimaging.scene7.com/is/image/DynamicMediaNA/WKND%20Template?wid=2000&hei=2000&qlt=100&fit=constrain'; // Replace with your fallback image path
          this.alt = 'Fallback image - template image not correctly authored';
        };

        block.innerHTML = '';
        block.append(finalImg);
      }
    } catch (error) {
      console.error('error rendering content fragment', {
        error: error.message,
        stack: error.stack
      });
      block.innerHTML = '';
    }
  }

}
