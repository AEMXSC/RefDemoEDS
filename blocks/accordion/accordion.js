/*
 * Accordion Block
 * Recreate an accordion
 * https://www.hlx.live/developer/block-collection/accordion
 */

import { moveInstrumentation } from "../../scripts/scripts.js";

export default function decorate(block) {
  [...block.children].forEach((row) => {
    // decorate accordion item label
    const label = row.children[0];
    const summary = document.createElement("summary");
    summary.className = "accordion-item-label";
    summary.append(...label.childNodes);
    // decorate accordion item body
    const body = row.children[1];
    body.className = "accordion-item-body";
    // decorate accordion item
    // const uls = body.querySelectorAll("ul");
    // uls.forEach((ul) => {
    //   const ulWrapper = document.createElement("div");
    //   ulWrapper.className = "accordion-ul-wrapper";
    //   ul.parentNode.insertBefore(ulWrapper, ul);
    //   ulWrapper.appendChild(ul);
    // });

    const uls = body.querySelectorAll("ul");
    if (uls.length) {
      const ulWrapper = document.createElement("div");
      ulWrapper.className = "accordion-ul-wrapper";

      uls[0].parentNode.insertBefore(ulWrapper, uls[0]);
      uls.forEach((ul) => ulWrapper.appendChild(ul));
    }
    const details = document.createElement("details");
    moveInstrumentation(row, details);
    details.className = "accordion-item";
    details.append(summary, body);
    row.replaceWith(details);
  });

  // healthcare-accordion-variant2: first item open by default, single-item open behavior
  if (block.closest('.section.healthcare-accordion-variant2')) {
    const accordionItems = [...block.querySelectorAll('.accordion-item')];
    const firstItem = accordionItems[0];
    if (firstItem) firstItem.open = true;

    accordionItems.forEach((item) => {
      item.addEventListener('toggle', () => {
        if (!item.open) return;
        accordionItems.forEach((otherItem) => {
          if (otherItem !== item) {
            otherItem.open = false;
          }
        });
      });
    });
  }

  // ---- container-level logic (run once) ----
  const container = block.closest(".accordion-container");
  if (!container) return;

  if (container.querySelector(".accordion-item-wrapper")) return;
  const accordions = container.querySelectorAll(":scope > .accordion-wrapper");
  if (!accordions.length) return;
  const combinedWrapperCheckvarient1 = block.closest(".accordion-container").classList.contains("accordion-variant1");
  const combinedWrapperCheckvarient2 = block.closest(".accordion-container").classList.contains("accordion-variant2");
  const combinedWrapperCheckvarient3 = block.closest(".accordion-container").classList.contains("accordion-variant3");
  if (combinedWrapperCheckvarient1 || combinedWrapperCheckvarient2 || combinedWrapperCheckvarient3) {
    const accordionWrapper = document.createElement("div");
    accordionWrapper.className = "accordion-item-wrapper";
    accordions.forEach((acc) => accordionWrapper.appendChild(acc));
    container.appendChild(accordionWrapper);
  }

  const wrapperItems = container.querySelectorAll(
    ":scope > div:nth-of-type(2), :scope > div:nth-of-type(3)"
  );
  if ((combinedWrapperCheckvarient1 || combinedWrapperCheckvarient2 || combinedWrapperCheckvarient3) && wrapperItems.length) {
    const combinedWrapper = document.createElement("div");
    combinedWrapper.className = "combined-wrapper";
    container.insertBefore(combinedWrapper, wrapperItems[0]);
    wrapperItems.forEach((item) => combinedWrapper.appendChild(item));
  }
}
