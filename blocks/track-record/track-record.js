export default function decorate(block) {
  const children = [...block.children];
  // If there are less than 2 divs, nothing to wrap
  if (children.length < 2) return;
  // Create wrapper
  const wrapper = document.createElement("div");
  wrapper.className = "track-record-wrapper-item";
  // Move 2nd to last div into wrapper
  children.slice(1).forEach((child) => {
    wrapper.appendChild(child);
  });
  // Append wrapper back into block
  block.appendChild(wrapper);
  if (block.classList.contains("process-step-type-3")) {
    const items = block.querySelectorAll(
      ".track-record-wrapper-item > div > div",
    );

    items.forEach((contentDiv) => {
      const directPs = contentDiv.querySelectorAll(":scope > p");

      // If already wrapped, skip
      if (directPs.length <= 1) return;

      // Create wrapper for text
      const textWrap = document.createElement("div");

      // Move all <p> except the first (number)
      [...directPs].slice(1).forEach((p) => textWrap.appendChild(p));

      // Append wrapper
      contentDiv.appendChild(textWrap);
    });
  }

  /*  Variant logic */
  /* const container = block.closest(".track-record-container");
  const classes = block.classList;
  const TYPE_MAP = {
    "trackrecord-type-1": { variant: "track-record-variant1" },
    "trackrecord-type-2": { variant: "track-record-variant2" },
    "trackrecord-type-3": { variant: "track-record-variant3" },
    "process-step-type-1": { variant: "process-step-variant1" },
    "process-step-type-2": { variant: "process-step-variant2" },
    "process-step-type-3": { variant: "process-step-variant3" },
    "tech-specs-type-1": { variant: "tech-specs-variant1" },
    "tech-specs-type-2": { variant: "tech-specs-variant2" },
    "tech-specs-type-3": { variant: "tech-specs-variant3" },
  };
  const matchKey = Object.keys(TYPE_MAP).find((key) => classes.contains(key));
  const { variant } = TYPE_MAP[matchKey] || TYPE_MAP["type-1"];
  container?.classList.add(variant); */
  // Append
  // block.append(handler);
  const sections = document.querySelectorAll(".process-step-variant1");
  sections.forEach((section) => {
    const richTextDivs = section.querySelectorAll(
      'div[data-aue-type="richtext"]',
    );
    richTextDivs.forEach((richDiv) => {
      const parentP = richDiv.closest("p");
      if (!parentP) return;
      // move all children of richtext div before the <p>
      while (richDiv.firstChild) {
        parentP.parentNode.insertBefore(richDiv.firstChild, parentP);
      }
      // remove the empty <p>
      parentP.remove();
    });
  });
}