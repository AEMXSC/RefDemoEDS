import { div, p } from "../../scripts/dom-helpers.js";

export default function decorate(block) {
  console.log("active", block);
  // const properties = readBlockConfig(block);
  let textContent = block.querySelector("p") || "not found";
  const blogs =
  div({
      class: "blogs block",
      "data-block-name": "blogs",
      "data-block-status": "loading"
    },

    // 1) Title -> "Arbaz"
    div({}, 
      div({},
        p({
          "data-aue-prop": "title",
          "data-aue-label": "Title",
          "data-aue-type": "text"
        }, "Arbaz")
      )
    ),

    // 2) Empty div
    div({}, div({})),

    // 3) Empty div
    div({}, div({})),

    // 4) Empty div
    div({}, div({})),

    // 5) Button container
    div({},
      div({},
        p({ class: "button-container" },
          a({
              href: "/content/dept-crossIndustry/footer.html",
              title: "/content/dept-crossIndustry/footer",
              class: "button"
            },
            "/content/dept-crossIndustry/footer"
          )
        )
      )
    ),

    // 6) CTA Style -> "button-dark"
    div({},
      div({},
        p({
          "data-aue-prop": "ctastyle",
          "data-aue-label": "CTA Style",
          "data-aue-type": "text"
        }, "button-dark")
      )
    )
  );


    document.addEventListener("load", function() {
      console.log("hi");
    })
    
     block.innerHTML = '';
  block.appendChild(blogs);
}