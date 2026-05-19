import { readBlockConfig } from '../../scripts/aem.js';

/**
 * Decorates the theme configurator block
 * This block only houses css-variable blocks for display purposes
 * Theme loading and application is handled by loadThemeFromPage() in scripts.js
 * @param {Element} block The theme configurator block element
 */
export default async function decorate(block) {
  // Read configuration from first row
  const config = readBlockConfig(block);
  const blockId = config.id || '';

  // Set the ID on the block if provided
  if (blockId) {
    block.id = blockId;
  }

  // Add a wrapper class for styling
  const variablesContainer = document.createElement('div');
  variablesContainer.className = 'theme-configurator-variables';

  // Move all remaining content (css-variable blocks) into the container
  while (block.firstChild) {
    variablesContainer.appendChild(block.firstChild);
  }

  block.appendChild(variablesContainer);
}
