# Adobe Experience Manager (AEM) Edge Delivery Services Project

This is a reference demo framework built on **AEM Edge Delivery Services (EDS)** with Franklin architecture. It demonstrates cross-industry capabilities including Dynamic Media integration, adaptive forms, content fragments, and multi-language support.

## Architecture Overview

### Block-Based Component System
- **Every block** exports a `decorate(block)` function as default (sync or async)
- Blocks live in `blocks/[block-name]/` with `.js`, `.css`, and optional `_[block-name].json` config
- Block decoration happens via `aem.js` core library (`decorateBlocks`, `loadBlocks`)
- Use `moveInstrumentation(from, to)` from `scripts/scripts.js` to preserve AEM Universal Editor attributes (`data-aue-*`)

### Content Delivery Flow
1. **Content source**: AEM as a Cloud Service → `fstab.yaml` defines the mountpoint URL
2. **Edge rendering**: Content delivered via Helix pipeline (`.aem.page` preview, `.aem.live` production)
3. **Client-side decoration**: `scripts/scripts.js` orchestrates block loading and decoration
4. **Universal Editor**: `data-aue-*` attributes enable in-context authoring (check `isAuthorEnvironment()`)

### Key Scripts Architecture
- `scripts/aem.js` (842 lines): Core Helix/Franklin library - block lifecycle, RUM sampling, lazy loading
- `scripts/scripts.js` (519 lines): Project-specific orchestration - `decorateMain()`, `loadPage()`, utility exports
- `scripts/utils.js` (479 lines): Site utilities - language detection, placeholder fetching, AEM path mapping
- `scripts/delayed.js`: Deferred loading (analytics, Adobe Target integration)
- `scripts/editor-support.js`: Universal Editor live preview support via `data-aue-*` patch events

## Component Models & Definitions

### JSON Configuration System
- **Source**: `models/_component-*.json` files define individual component schemas
- **Build**: `npm run build:json` merges into root-level `component-*.json` files
- **Purpose**: Universal Editor dialogs, metadata models, component filters

Example from `models/_component-models.json`:
```json
{
  "id": "page-metadata",
  "fields": [
    {
      "component": "aem-content-fragment",
      "name": "theme_cf_reference",
      "label": "Brand Theme",
      "valueType": "string"
    }
  ]
}
```

## Critical Block Patterns

### Standard Block Structure
```javascript
export default async function decorate(block) {
  // 1. Read configuration from block children
  const config = readBlockConfig(block); // or manual parsing
  
  // 2. Preserve Universal Editor instrumentation
  moveInstrumentation(sourceElement, targetElement);
  
  // 3. Transform DOM structure
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    // Process rows into semantic HTML
  });
  
  // 4. Handle author vs. published environments
  if (isAuthorEnvironment()) {
    // Author-specific logic
  }
  
  block.replaceChildren(ul);
}
```

### Dynamic Media Integration
Blocks like `dynamicmedia-image`, `dynamicmedia-template` integrate Scene7:
- Fetch DM server URL via `getDynamicMediaServerURL()` from `utils.js`
- Load S7 responsive image library: `window.s7responsiveImage()`
- Apply transformations (rotate, flip, crop) via URL modifiers
- **Environment check**: Hide on `.aem.live`/`.aem.page` until publishing resolved

### Form Block Architecture
`blocks/form/` is a **multi-file adaptive forms system**:
- `form.js`: Main orchestrator with field factory functions
- `components/`: Reusable form widgets (accordion, repeat, wizard, etc.)
- `mappings.js`: Component decorator registry
- `transform.js`: Document-based form → Adaptive Form JSON transformer
- `util.js`: Field creation helpers (`createFieldWrapper`, `setConstraints`)
- `submit.js`: Form submission handler with reCAPTCHA integration
- `constant.js`: Error messages, patterns, submission endpoints

## Build & Development Workflow

### Essential Commands
```bash
npm run lint          # Run ESLint (JS) + Stylelint (CSS)
npm run build:json    # Merge component models/definitions/filters
npm prepare           # Husky git hooks setup
```

### Local Development
- Use **AEM Sidekick** browser extension for preview/publish workflow
- Edit content in AEM Cloud Service, view live in `https://main--[repo]--[org].aem.page/`
- Hot reload happens automatically on content changes

### Content Package Deployment
1. Install content package via CRX Package Manager (link in README)
2. Customize `fstab.yaml` and `paths.json` for your AEM instance
3. Update mountpoint URL to your AEM Cloud Service author instance

## Multi-Language & Localization

### Language Detection Flow
```javascript
// From scripts/utils.js
export const SUPPORTED_LANGUAGES = ['en', 'fr', 'de', 'es', ...]; // 15+ languages
export const PATH_PREFIX = '/language-masters';

// Usage in blocks
const lang = getLanguage(); // Detects from URL path
const placeholders = await fetchPlaceholders(); // Localized strings
```

### Query Index Configuration
`helix-query.yaml` defines per-language indices:
- Separate indices for each language (`site-en`, `site-fr`, etc.)
- Metadata extraction (title, description, tags, content type)
- Powers search functionality in `blocks/search/`

## Content Fragment Integration

### GraphQL Pattern
```javascript
// From blocks/content-fragment/content-fragment.js
const GRAPHQL_QUERY = '/graphql/execute.json/ref-demo-eds/CTAByPath';
const hostname = await getHostname(); // From placeholders
const aempublishurl = hostname?.replace('author', 'publish');

// Fetch CF via persisted query
const response = await fetch(`${aempublishurl}${GRAPHQL_QUERY}?path=${cfPath}`);
```

### Theme Content Fragments
- `theme_cf_reference` in page metadata applies brand theming
- CF values injected as CSS custom properties
- Fallback to static themes (`gray-theme`, `red-theme`) if CF not set

## Universal Editor Support

### Instrumentation Preservation
Always use `moveInstrumentation()` when restructuring DOM:
```javascript
import { moveInstrumentation } from '../../scripts/scripts.js';

const li = document.createElement('li');
moveInstrumentation(row, li); // Transfers data-aue-* attributes
```

### Author Environment Detection
```javascript
if (isAuthorEnvironment()) {
  // window.location.origin includes 'author'
  // Adjust behavior for in-context editing
}
```

### Live Preview Updates
`editor-support.js` listens for `aue:content-patch` events and:
1. Sanitizes updated HTML with DOMPurify
2. Re-decorates affected blocks
3. Reloads sections without full page refresh

## Common Utilities

### DOM Helpers (`scripts/dom-helpers.js`)
```javascript
import { picture, source, img, div, p, a, button, span } from './dom-helpers.js';

// Creates semantic elements with optional attributes/children
const pic = picture(
  source({ media: '(min-width: 768px)', srcset: '/image.jpg' }),
  img({ src: '/image-mobile.jpg', alt: 'Description' })
);
```

### Block Template Pattern (`scripts/blockTemplate.js`)
Allows HTML template-driven block decoration:
```javascript
import { patternDecorate } from '../../scripts/blockTemplate.js';

export default async function decorate(block) {
  patternDecorate(block); // Maps block rows to template structure
}
```

## Testing & Quality

### Linting Rules
- ESLint config: `airbnb-base` + custom `eslint-plugin-xwalk`
- Stylelint: `stylelint-config-standard`
- Husky pre-commit hooks enforce linting

### Real User Monitoring (RUM)
- Handled by `sampleRUM()` in `aem.js`
- Tracks checkpoints: `top`, `lazy`, `cwv` (Core Web Vitals)
- Sample rate controlled via `window.SAMPLE_PAGEVIEWS_AT_RATE`

## Known Patterns & Conventions

1. **CSS naming**: Block element classes follow BEM-like pattern (`cards-card-image`, `cards-card-body`)
2. **Config hiding**: Configuration divs (style variants, CTA types) get `display: none` after processing
3. **Lazy loading**: Images use `createOptimizedPicture()`, styles loaded per-block
4. **Path handling**: Use `mapAemPathToSitePath()` when converting AEM content paths to site URLs
5. **Placeholders**: Centralized i18n strings in `placeholders.json`, fetched via `fetchPlaceholders()`

## External Dependencies

- **Adobe Target**: Loaded in `delayed.js` with property ID `549d426b-0bcc-be60-ce27-b9923bfcad4f`
- **Google reCAPTCHA**: Form block integration via `integrations/recaptcha.js`
- **DOMPurify**: Sanitizes content in Universal Editor updates
- **Scene7 (Dynamic Media)**: `s7responsiveImage()` for responsive image delivery

## Quick Reference

**Creating a new block:**
1. Create `blocks/my-block/my-block.js` with `export default function decorate(block) {...}`
2. Add `blocks/my-block/my-block.css` for styles
3. Optionally add `blocks/my-block/_my-block.json` for Universal Editor configuration
4. Block auto-loads when authored in AEM with matching class name

**Accessing metadata:**
```javascript
import { getMetadata } from './scripts/aem.js';
const theme = getMetadata('theme');
```

**Handling forms:**
- Use field factory functions from `blocks/form/util.js`
- Register custom components in `blocks/form/mappings.js`
- Submission goes to `SUBMISSION_SERVICE` constant in `blocks/form/constant.js`
