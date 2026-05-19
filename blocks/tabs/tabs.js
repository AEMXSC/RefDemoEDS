// eslint-disable-next-line import/no-unresolved
import { moveInstrumentation } from "../../scripts/scripts.js";

// keep track globally of the number of tab blocks on the page
let tabBlockCnt = 0;

export default async function decorate(block) {
  if (block.querySelector(".tabs-nav-wrapper")) return;
  const parentSection = block.closest(".section");
  const parentSectionLevelName = [...(parentSection?.classList || [])]
    .find((cls) => cls !== "section" && cls !== "tabs-container");
  console.log("tabs parent section level name:", parentSectionLevelName);
  const main = block.closest("main");

  // Get the tabs style from data-aue-prop
  const tabsStyleParagraph = block.querySelector(
    'p[data-aue-prop="tabsstyle"]',
  );
  const tabsStyle = tabsStyleParagraph?.textContent?.trim() || "";

  if (tabsStyle && tabsStyle !== "default") {
    block.classList.add(tabsStyle);
  }

  // Fallback style detection
  if (!block.classList.contains("card-style-tab")) {
    const knownStyles = new Set(["card-style-tab"]);
    const styleContainerFallback = [...block.children].find((child) =>
      [...child.querySelectorAll("p")].some((p) =>
        knownStyles.has(p.textContent?.trim()),
      ),
    );
    if (styleContainerFallback) {
      const detected = [...styleContainerFallback.querySelectorAll("p")]
        .map((p) => p.textContent?.trim())
        .find((txt) => knownStyles.has(txt));
      if (detected) {
        block.classList.add(detected);
        styleContainerFallback.remove();
      }
    }
  }

  // Remove style config nodes
  block.querySelectorAll('p[data-aue-prop="tabsstyle"]').forEach((node) => {
    let container = node;
    while (container && container.parentElement !== block) {
      container = container.parentElement;
    }
    container?.remove();
  });

  // Remove stray title nodes
  [...block.children]
    .filter((child) => child.matches?.('p[data-aue-prop="title"]'))
    .forEach((n) => n.remove());

  const cardStyleVariant = block.classList.contains("card-style-tab");

  // -------- CREATE TABLIST --------
  const tablist = document.createElement("div");
  tablist.className = "tabs-list";
  tablist.setAttribute("role", "tablist");
  tablist.id = `tablist-${++tabBlockCnt}`;

  // -------- CREATE WRAPPERS --------
  const navWrapper = document.createElement("div");
  navWrapper.className = "tabs-nav-wrapper";

  const panelsWrapper = document.createElement("div");
  panelsWrapper.className = "tabs-panels-wrapper";

  // -------- BUILD TAB ITEMS --------
  const tabItems = [];
  [...block.children].forEach((child) => {
    if (!child?.firstElementChild) return;

    const heading = child.firstElementChild;
    const titleEl = child.querySelector('p[data-aue-prop="title"]');
    const label = (titleEl?.textContent || heading?.textContent || "").trim();

    if (!label) return;
    tabItems.push({ tabpanel: child, heading });
  });

  // Hide non-tab children
  const allowed = new Set(tabItems.map((i) => i.tabpanel));
  [...block.children].forEach((child) => {
    if (!allowed.has(child)) child.style.display = "none";
  });

  // -------- PROCESS EACH TAB --------
  tabItems.forEach((item, i) => {
    const id = `tabpanel-${tabBlockCnt}-tab-${i + 1}`;
    const { tabpanel, heading } = item;

    const titleEl = tabpanel.querySelector('p[data-aue-prop="title"]');
    const headingContent = titleEl ? titleEl.innerHTML : heading.innerHTML;

    // Card-style variant handling
    if (cardStyleVariant) {
      const contentWrapper = document.createElement("div");
      contentWrapper.className = "tabs-panel-content";

      const picture = tabpanel.querySelector("picture");
      if (picture) {
        const imageWrapper = document.createElement("div");
        imageWrapper.className = "tabs-panel-image";
        imageWrapper.appendChild(
          picture.parentElement.tagName === "P"
            ? picture.parentElement
            : picture,
        );
        tabpanel.appendChild(imageWrapper);
      }

      [...tabpanel.children].forEach((child) => {
        if (child !== heading && child !== titleEl) {
          contentWrapper.appendChild(child);
        }
      });

      tabpanel.innerHTML = "";
      tabpanel.appendChild(contentWrapper);
    }

    // Panel attributes
    tabpanel.className = "tabs-panel";
    tabpanel.id = id;
    tabpanel.setAttribute("role", "tabpanel");
    tabpanel.setAttribute("aria-hidden", i !== 0);
    tabpanel.setAttribute("aria-labelledby", `tab-${id}`);

    // Button
    const button = document.createElement("button");
    button.className = "tabs-tab";
    button.id = `tab-${id}`;
    button.innerHTML = headingContent;
    button.setAttribute("role", "tab");
    button.setAttribute("type", "button");
    button.setAttribute("aria-controls", id);
    button.setAttribute("aria-selected", i === 0);

    button.addEventListener("click", () => {
      block
        .querySelectorAll("[role=tabpanel]")
        .forEach((p) => p.setAttribute("aria-hidden", true));
      tablist
        .querySelectorAll("[role=tab]")
        .forEach((b) => b.setAttribute("aria-selected", false));

      tabpanel.setAttribute("aria-hidden", false);
      button.setAttribute("aria-selected", true);
    });

    if (button.firstElementChild) {
      moveInstrumentation(button.firstElementChild, null);
    }

    titleEl && (titleEl.style.display = "none");
    heading.remove();

    tablist.appendChild(button);
    panelsWrapper.appendChild(tabpanel);
  });

  // -------- MOVE ACCORDIONS INTO PANELS --------
  const accordionVariants = [
    ...block.closest("main").querySelectorAll('[class*="hitechaccordion-tab-content"], [class*="accordion-variant"]'),
  ].filter((el) => (
    el.classList.contains("hitechaccordion-tab-content")
    || [...el.classList].some((cls) => cls.startsWith("accordion-variant"))
  ));
  // console.log("Found accordions:", accordionVariants);

  tabItems.forEach((item, i) => {
    if (accordionVariants[i]) {
      item.tabpanel.appendChild(accordionVariants[i]);
    }
  });

  // -------- MOVE SAME-LEVEL SECTION CONTENT INTO PANELS --------
  if (main && parentSectionLevelName) {
    const escapedSectionClass = window.CSS?.escape
      ? window.CSS.escape(parentSectionLevelName)
      : parentSectionLevelName.replace(/[^a-zA-Z0-9_-]/g, "\\$&");

    const sameLevelSections = [...main.querySelectorAll(`.section.${escapedSectionClass}`)]
      .filter((section) => section !== parentSection);

    console.log(
      `tabs parent: "${parentSectionLevelName}" — matching content sections found: ${sameLevelSections.length}`,
      sameLevelSections,
    );

    tabItems.forEach((item, i) => {
      const sourceSection = sameLevelSections[i];
      if (!sourceSection) return;

      // Move the complete section node into the corresponding tab panel.
      item.tabpanel.appendChild(sourceSection);
    });
  }

  // -------- FINAL DOM ASSEMBLY --------
  navWrapper.appendChild(tablist);
  block.prepend(panelsWrapper);
  block.prepend(navWrapper);
}
