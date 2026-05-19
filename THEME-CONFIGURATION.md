# Theme Configuration System

## Overview
This system allows you to manage CSS variables through a spreadsheet in AEM, making it easy for authors to customize the site's theme without touching code.

## How It Works

### 1. Create Theme Configuration Spreadsheet in AEM

**Path:** `/content/dept-crossIndustry/us/theme-configuration` (or any language path)

**Spreadsheet Structure:**
```
| key              | value           |
|------------------|-----------------|
| primary-color    | #007bff         |
| secondary-color  | #6c757d         |
| font-family      | 'Roboto', sans-serif |
| border-radius    | 8px             |
| spacing-md       | 1.5rem          |
```

### 2. Published JSON Structure

When published, the spreadsheet becomes available as JSON:

**URL:** `https://main--refdemoeds--aemxsc.aem.live/us/theme-configuration.json`

**JSON Output:**
```json
{
  "data": [
    { "key": "primary-color", "value": "#007bff" },
    { "key": "secondary-color", "value": "#6c757d" },
    { "key": "font-family", "value": "'Roboto', sans-serif" },
    { "key": "border-radius", "value": "8px" },
    { "key": "spacing-md", "value": "1.5rem" }
  ]
}
```

### 3. Automatic Application

The `loadThemeConfiguration()` function in `scripts/scripts.js`:
- Fetches the theme configuration JSON
- Applies each key-value pair as a CSS variable to `:root`
- Runs before page decoration for immediate effect

## Usage

### Method 1: Auto-Detection (Default)

The system automatically loads theme configuration based on the current language:
```javascript
// Automatically loads: /en/theme-configuration.json (for English pages)
// No configuration needed!
```

### Method 2: Page Metadata

Specify a custom theme configuration in page metadata:
```
| Metadata            | Value                              |
|---------------------|-------------------------------------|
| theme-configuration | /us/custom-theme-configuration      |
```

### Method 3: Programmatic

Manually load a specific theme:
```javascript
import { loadThemeConfiguration } from './scripts/scripts.js';

// Load custom theme
await loadThemeConfiguration('/us/dark-theme-configuration');
```

## CSS Variable Naming

### Recommended Convention

**In Spreadsheet (key column):**
- Use underscores or hyphens: `primary_color` or `primary-color`
- Both convert to: `--primary-color` in CSS

**Examples:**
```
| key                  | value          | Becomes in CSS         |
|----------------------|----------------|------------------------|
| primary_color        | blue           | --primary-color        |
| font-size-heading-1  | 2.5rem         | --font-size-heading-1  |
| box_shadow           | 0 2px 4px rgba | --box-shadow           |
```

## Using Theme Variables in CSS

```css
/* In your block CSS files */
.my-block {
  background-color: var(--primary-color);
  font-family: var(--font-family);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
}

.my-block h2 {
  color: var(--secondary-color);
  font-size: var(--font-size-heading-1);
}
```

## Example Theme Configurations

### Light Theme
```
| key              | value           |
|------------------|-----------------|
| primary-color    | #007bff         |
| secondary-color  | #6c757d         |
| background-color | #ffffff         |
| text-color       | #212529         |
| border-color     | #dee2e6         |
```

### Dark Theme
```
| key              | value           |
|------------------|-----------------|
| primary-color    | #66b3ff         |
| secondary-color  | #b8c1cc         |
| background-color | #1a1a1a         |
| text-color       | #f8f9fa         |
| border-color     | #3a3a3a         |
```

### Brand Theme (Your Current Example)
```
| key              | value           |
|------------------|-----------------|
| primary_color    | blue            |
```

## Advanced Features

### Inheritance
Child pages automatically inherit the theme from parent pages unless overridden.

### Fallback Values
Define fallback values in `styles/theme-variables.css`:
```css
:root {
  --primary-color: #007bff; /* Used if spreadsheet doesn't load */
  --secondary-color: #6c757d;
}
```

### Dynamic Theme Switching
Switch themes programmatically:
```javascript
// Switch to dark theme
await loadThemeConfiguration('/en/dark-theme-configuration');

// Switch to brand theme
await loadThemeConfiguration('/en/brand-theme-configuration');
```

## Best Practices

1. **Naming Convention**: Use consistent naming (kebab-case or snake_case)
2. **Fallback Values**: Always define fallbacks in CSS
3. **Semantic Names**: Use semantic names (`primary-color` not `blue-color`)
4. **Documentation**: Document available variables in your style guide
5. **Testing**: Test theme changes in preview before publishing

## Troubleshooting

### Theme not loading?
1. Check browser console for errors
2. Verify spreadsheet is published (not just preview)
3. Check JSON URL: `https://[your-site]/[lang]/theme-configuration.json`
4. Verify spreadsheet has `key` and `value` columns

### Variables not applying?
1. Ensure CSS uses `var(--variable-name)`
2. Check if values have proper CSS syntax (units, quotes, etc.)
3. Verify variable names match (including dashes/underscores)

### Override not working?
1. CSS specificity might be higher elsewhere
2. Use `!important` sparingly: `var(--primary-color) !important`
3. Check browser DevTools computed styles

## File Locations

- **Implementation**: `scripts/scripts.js` (loadThemeConfiguration function)
- **Default Variables**: `styles/theme-variables.css`
- **AEM Spreadsheet**: `/content/dept-crossIndustry/[lang]/theme-configuration`
- **Published JSON**: `/[lang]/theme-configuration.json`

## Example Implementation

See `scripts/scripts.js` line ~30 for the complete implementation.

## Support

For questions or issues, refer to:
- `.github/copilot-instructions.md` - Project architecture guide
- `README.md` - General project documentation
