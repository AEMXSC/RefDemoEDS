function createHeroPreview() {
  const section = document.createElement('div');
  section.className = 'preview-section preview-hero';
  section.innerHTML = `
    <div class="preview-hero-content">
      <h1>Experience the Power of Your Brand</h1>
      <p>Discover how your theme comes to life with real components and engaging content that resonates with your audience.</p>
      <div class="preview-hero-actions">
        <button class="preview-btn primary-btn">Get Started</button>
        <button class="preview-btn outline-btn">Learn More</button>
      </div>
    </div>
  `;
  return section;
}

function createCardsPreview() {
  const section = document.createElement('div');
  section.className = 'preview-section';
  section.innerHTML = `
    <h3>Component Preview</h3>
    <div class="preview-cards">
      <div class="preview-card">
        <div class="preview-card-header primary-bg">
          Feature One
        </div>
        <div class="preview-card-body">
          <p>Experience seamless integration with powerful features designed to enhance your workflow and boost productivity.</p>
          <button class="preview-btn primary-btn">Explore</button>
        </div>
      </div>
      <div class="preview-card">
        <div class="preview-card-header secondary-bg">
          Feature Two
        </div>
        <div class="preview-card-body">
          <p>Customize every aspect to match your brand identity and create a unique experience for your users.</p>
          <button class="preview-btn secondary-btn">Discover</button>
        </div>
      </div>
      <div class="preview-card">
        <div class="preview-card-header dark-bg">
          Feature Three
        </div>
        <div class="preview-card-body">
          <p>Built with modern technologies and best practices to ensure optimal performance and reliability.</p>
          <button class="preview-btn outline-btn">View Details</button>
        </div>
      </div>
    </div>
  `;
  return section;
}

function createTypographyPreview() {
  const section = document.createElement('div');
  section.className = 'preview-section';
  section.innerHTML = `
    <h3>Typography & Content</h3>
    <div class="typography-samples">
      <h1 class="primary-text">Headline Level 1</h1>
      <h2 class="secondary-text">Headline Level 2</h2>
      <p>This is a paragraph demonstrating how your body text will appear with the current theme. The typography should be clear, readable, and maintain proper hierarchy throughout your content.</p>
      <p class="muted-text">Secondary text provides additional context and information to support your main content while maintaining visual consistency.</p>
    </div>
  `;
  return section;
}

function createButtonsPreview() {
  const section = document.createElement('div');
  section.className = 'preview-section';
  section.innerHTML = `
    <h3>Interactive Elements</h3>
    <div class="button-samples">
      <button class="preview-btn primary-btn">Primary Action</button>
      <button class="preview-btn secondary-btn">Secondary Action</button>
      <button class="preview-btn outline-btn">Outline Style</button>
      <button class="preview-btn light-btn">Light Button</button>
    </div>
  `;
  return section;
}
function observeThemeChanges(container) {
  // Watch for changes to theme style tag in head only
  const styleObserver = new MutationObserver((mutations) => {
    // Only process if theme-configurator-styles changed
    const themeStyleChanged = mutations.some((mutation) => {
      if (mutation.type === 'childList') {
        return Array.from(mutation.addedNodes).some(
          (node) => node.id === 'theme-configurator-styles',
        ) || Array.from(mutation.removedNodes).some(
          (node) => node.id === 'theme-configurator-styles',
        );
      }
      return mutation.target.id === 'theme-configurator-styles';
    });

    if (themeStyleChanged) {
      // Theme updated, add visual feedback
      container.classList.add('theme-updated');
      setTimeout(() => container.classList.remove('theme-updated'), 300);
    }
  });

  // Only observe the head element for style changes
  styleObserver.observe(document.head, {
    childList: true,
    subtree: false,
    characterData: false,
  });
}

export default function decorate(block) {
  // This block will show live preview of theme variables
  // It displays sample components styled with the current theme

  // Clear the block
  block.innerHTML = '';

  // Create preview container
  const previewContainer = document.createElement('div');
  previewContainer.className = 'theme-preview-container';

  // Create preview sections
  const sections = [
    createHeroPreview(),
    createCardsPreview(),
    createTypographyPreview(),
    createButtonsPreview(),
  ];

  sections.forEach((section) => previewContainer.appendChild(section));

  block.appendChild(previewContainer);

  // Listen for theme changes and update preview
  observeThemeChanges(previewContainer);
}
