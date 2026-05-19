/**
 * Helper function to check if a value is a valid color
 * @param {string} color - The color value to validate
 * @returns {boolean} - True if valid color, false otherwise
 */
function isValidColor(color) {
  if (!color) return false;

  // Check for hex colors
  const hexPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
  if (hexPattern.test(color)) return true;

  // Check for rgb/rgba/hsl/hsla
  const colorFunctionPattern = /^(rgb|rgba|hsl|hsla)\(/i;
  if (colorFunctionPattern.test(color)) return true;

  // Check for named colors by creating a temporary element
  const s = new Option().style;
  s.color = color;
  return s.color !== '';
}

/**
 * Helper function to check if a value is a size (px, rem, em, %, vh, vw, etc.)
 * @param {string} value - The value to check
 * @returns {object|null} - Object with size and unit, or null
 */
function parseSize(value) {
  if (!value) return null;
  const sizePattern = /^(-?\d*\.?\d+)(px|rem|em|%|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc)$/i;
  const match = value.match(sizePattern);
  if (match) {
    return { size: parseFloat(match[1]), unit: match[2].toLowerCase() };
  }
  return null;
}

/**
 * Helper function to determine the type of CSS value
 * @param {string} value - The CSS value
 * @returns {string} - Type: 'color', 'size', 'spacing', 'number', 'other'
 */
function getCSSValueType(value) {
  if (!value) return 'other';
  
  if (isValidColor(value)) return 'color';
  
  const parsed = parseSize(value);
  if (parsed) {
    // Check if it's likely a spacing value based on common CSS property patterns
    return 'size';
  }
  
  // Check for unitless numbers
  if (/^-?\d*\.?\d+$/.test(value)) return 'number';
  
  return 'other';
}

/**
 * Create a visual indicator for size values
 * @param {string} value - The size value (e.g., "16px", "1.5rem")
 * @returns {HTMLElement} - The indicator element
 */
function createSizeIndicator(value) {
  const parsed = parseSize(value);
  if (!parsed) return null;

  const indicator = document.createElement('span');
  indicator.className = 'css-variable-size-indicator';
  indicator.setAttribute('title', `Size: ${value}`);
  
  // Create a visual representation based on the size
  const bar = document.createElement('span');
  bar.className = 'css-variable-size-bar';
  
  // Convert to pixels for visualization (approximate)
  let pxValue = parsed.size;
  if (parsed.unit === 'rem' || parsed.unit === 'em') {
    pxValue = parsed.size * 16; // Assume 16px base
  } else if (parsed.unit === '%') {
    pxValue = parsed.size * 2; // Scale percentage for visualization
  }
  
  // Clamp between 4px and 64px for visualization
  const visualSize = Math.max(4, Math.min(64, pxValue));
  bar.style.width = `${visualSize}px`;
  
  indicator.appendChild(bar);
  
  const label = document.createElement('span');
  label.className = 'css-variable-size-label';
  label.textContent = value;
  indicator.appendChild(label);
  
  return indicator;
}

export default function decorate(block) {
  // Read the block content (2 rows: key and value)
  const rows = [...block.children];

  // Extract key and value from block rows
  const keyRow = rows[0];
  const valueRow = rows[1];

  const cssKey = keyRow?.textContent?.trim() || '';
  const cssValue = valueRow?.textContent?.trim() || '';

  // Clear the block
  block.innerHTML = '';

  // Set data attributes
  block.setAttribute('data-key', cssKey);
  block.setAttribute('data-value', cssValue);

  // Create key div
  const keyDiv = document.createElement('div');
  keyDiv.className = 'css-variable-key';
  keyDiv.textContent = `key ${cssKey}`;

  // Create value container
  const valueContainer = document.createElement('div');
  valueContainer.className = 'css-variable-value-container';

  // Create value div
  const valueDiv = document.createElement('div');
  valueDiv.className = 'css-variable-value';
  valueDiv.textContent = `value ${cssValue}`;

  // Determine value type and add appropriate indicator
  const valueType = getCSSValueType(cssValue);
  valueContainer.classList.add(`css-variable-type-${valueType}`);

  if (valueType === 'color') {
    // Add color swatch for color values
    const colorSwatch = document.createElement('span');
    colorSwatch.className = 'css-variable-color-swatch';
    colorSwatch.style.backgroundColor = cssValue;
    colorSwatch.setAttribute('title', `Color preview: ${cssValue}`);
    valueContainer.appendChild(colorSwatch);
  } else if (valueType === 'size') {
    // Add size indicator for size values
    const sizeIndicator = createSizeIndicator(cssValue);
    if (sizeIndicator) {
      valueContainer.appendChild(sizeIndicator);
    }
  } else if (valueType === 'number') {
    // Add a simple badge for numbers
    const numberBadge = document.createElement('span');
    numberBadge.className = 'css-variable-badge css-variable-number-badge';
    numberBadge.textContent = '#';
    numberBadge.setAttribute('title', 'Numeric value');
    valueContainer.appendChild(numberBadge);
  }

  valueContainer.appendChild(valueDiv);

  // Append to block
  block.appendChild(keyDiv);
  block.appendChild(valueContainer);
}
