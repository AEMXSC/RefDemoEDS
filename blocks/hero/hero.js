import { getMetadata } from '../../scripts/aem.js';
import { isAuthorEnvironment, moveInstrumentation } from '../../scripts/scripts.js';
import { readBlockConfig } from '../../scripts/aem.js';

/**
 *
 * @param {Element} block
 */
export default function decorate(block) {
  // Get the enable underline setting from the block content (3rd div)
  const enableUnderline = block.querySelector(':scope div:nth-child(3) > div')?.textContent?.trim() || 'true';
  
  // Get the layout Style from the block content (4th div)
  const layoutStyle = block.querySelector(':scope div:nth-child(4) > div')?.textContent?.trim() || 'overlay';

  // Get the CTA style from the block content (5th div)
  const ctaStyle = block.querySelector(':scope div:nth-child(5) > div')?.textContent?.trim() || 'default';

  const backgroundStyle = block.querySelector(':scope div:nth-child(6) > div')?.textContent?.trim() || 'default';

  if(layoutStyle){
     block.classList.add(`${layoutStyle}`);
  }

  if(backgroundStyle){
    block.classList.add(`${backgroundStyle}`);
  }

  // Add removeunderline class if underline is disabled
  if (enableUnderline.toLowerCase() === 'false') {
    block.classList.add('removeunderline');
  }
  
  // Find the button container within the hero block
  const buttonContainer = block.querySelector('p.button-container');
  
  if (buttonContainer) {
    // Add the CTA style class to the button container
    buttonContainer.classList.add(`cta-${ctaStyle}`);
  }
  
  // Hide the CTA style configuration paragraph
  const ctaStyleParagraph = block.querySelector('p[data-aue-prop="ctastyle"]');
  if (ctaStyleParagraph) {
    ctaStyleParagraph.style.display = 'none';
  }

  // Optional: Remove the configuration divs after reading them to keep the DOM clean
  const underlineDiv = block.querySelector(':scope div:nth-child(3)');
  if (underlineDiv) {
    underlineDiv.style.display = 'none';
  }
  
  const layoutStyleDiv = block.querySelector(':scope div:nth-child(4)');
  if (layoutStyleDiv) {
    layoutStyleDiv.style.display = 'none';
  }

  const ctaStyleDiv = block.querySelector(':scope div:nth-child(5)');
  if (ctaStyleDiv) {
    ctaStyleDiv.style.display = 'none';
  }

  const backgroundStyleDiv = block.querySelector(':scope div:nth-child(6)');
  if (backgroundStyleDiv) {
    backgroundStyleDiv.style.display = 'none';
  }

}
