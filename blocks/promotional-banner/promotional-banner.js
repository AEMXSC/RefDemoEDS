import {
  a,
  div,
  h2,
  img,
  p,
  span,
  strong
} from "../../scripts/dom-helpers.js";

/* -----------------------------
   Helpers
------------------------------ */

/**
 * NEW: Dynamic Media Source Extractor
 * Extracts image source from either an <img> or a Dynamic Media anchor tag.
 */
function getImageSource(container, index = 0) {
  const images = container.querySelectorAll("picture img, img");
  if (images.length > index) {
    return images[index].src.trim();
  }

  // Look for Dynamic Media URLs (Adobe Assets)
  const dmAnchors = Array.from(container.querySelectorAll("a[href]")).filter((anchor) => {
    const href = anchor.href || "";
    return href.includes("/adobe/assets/") || href.includes("delivery-");
  });

  if (dmAnchors.length > index) {
    const imageUrl = dmAnchors[index].href.trim();
    try {
      const url = new URL(imageUrl);
      if (!url.searchParams.has("width")) url.searchParams.set("width", "1400");
      if (!url.searchParams.has("quality")) url.searchParams.set("quality", "85");
      return url.toString();
    } catch (e) {
      return imageUrl;
    }
  }

  return images[0]?.src.trim() || dmAnchors[0]?.href.trim() || "";
}

/**
 * NEW: Responsive logic handling DM and standard images
 */
function getResponsiveImageSource(block) {
  const images = block.querySelectorAll("picture img, img");
  const dmAnchors = Array.from(block.querySelectorAll("a[href]")).filter((anchor) => {
    const href = anchor.href || "";
    return href.includes("/adobe/assets/") || href.includes("delivery-");
  });
  
  const totalImages = Math.max(images.length, dmAnchors.length);

  if (totalImages > 1) {
    return window.innerWidth > 1024
      ? getImageSource(block, 0) // Desktop
      : getImageSource(block, 1); // Mobile
  }
  return getImageSource(block, 0);
}

function getText(el) {
  return el?.innerText?.trim() || "";
}

function getButtons(block) {
  // UPDATED: Filter out Dynamic Media links so they don't appear as CTA buttons
  const buttons = Array.from(block.querySelectorAll("a")).filter((anchor) => {
    const href = anchor.href || "";
    return !href.includes("/adobe/assets/") && !href.includes("delivery-");
  });

  return {
    first: {
      text: getText(buttons[0]),
      href: buttons[0]?.href || "",
      title: buttons[0]?.title || ""
    },
    second: {
      text: getText(buttons[1]),
      href: buttons[1]?.href || "",
      title: buttons[1]?.title || ""
    }
  };
}

function getContent(block) {
  // UPDATED: Filter out paragraphs that are just DM links
  const paragraphs = Array.from(block.querySelectorAll('p'));
  const validDescPara = paragraphs.find((para) => {
    const text = para.textContent || '';
    const isDM = text.includes('/adobe/assets/') || text.includes('delivery-') || para.querySelector('a[href*="/adobe/assets/"]') || para.querySelector('a[href*="delivery-"]');
    return !isDM && text.trim().length > 0;
  });

  return {
    image: getResponsiveImageSource(block), // Uses the new DM-aware logic
    heading: getText(block.querySelector("h2")),
    description: validDescPara?.innerText?.trim() || "",
    buttons: getButtons(block)
  };
}

/* -----------------------------
   Main Decorate
------------------------------ */


// content fragment banner

function contentFragmentBannner() {
  return new Promise((resolve, reject) => {

    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    let raw = JSON.stringify({
      "graphQLPath": "https://publish-p153659-e1796191.adobeaemcloud.com/graphql/execute.json/global/hero-banner",
      "cfPath": "/content/dam/dept-crossIndustry/content-fregment-/hero-banner/banner-web",
      "variation": "master"
    });

    let requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    fetch("https://3635370-refdemoapigateway-stage.adobeioruntime.net/api/v1/web/ref-demo-api-gateway/fetch-cf", requestOptions)
      .then((response) => response.text())
      .then((result) => resolve(result))
      .catch((error) => reject(error));
  });
}

export default async function decorate(block) {
  const container = block.closest(".promotional-banner-container");
    let response;
  try {
    response = await contentFragmentBannner();
  } catch (e) {
    console.error("API error:", e);
  }

  // -----------------------------
  // ✅ If API data exists → use it
  // -----------------------------
  if (response) {
    let data = typeof response === "string"
      ? JSON.parse(response)
      : response;

    let item = data?.data?.heroBannerByPath?.item;

    // if (item) {
    //   let content = buildFromCF(item, container);
    //   block.textContent = "";
    //   block.append(content);
    //   return;
    // }
  }

  const variantMap = {
    "banner-variant1": bannerType1,
    "banner-variant2": bannerType1,
    "banner-variant3": bannerType3,
    "banner-variant4": bannerType4,

    "hitech-banner-variant1": hitechBanner,
    "hitech-banner-variant2": hitechBanner,
    "hitech-banner-variant3": hitechBanner,
    "hitech-banner-variant4": hitechBanner,

    "healthcare-banner-variant1": healthcareBanner,
    "healthcare-banner-variant2": healthcareBanner,
    "healthcare-banner-variant3": healthcareBanner,
    "healthcare-banner-variant4": healthcareBanner
  };

  const matchedVariant = Object.keys(variantMap)
    .find((variant) => container.classList.contains(variant));

  if (!matchedVariant) return;

  let content = variantMap[matchedVariant](block);
  block.textContent = "";
  block.append(content);
}

/* -----------------------------
   Banner Variant 1 & 2
------------------------------ */

function bannerType1(block) {

  let {
    image,
    heading,
    description,
    buttons
  } = getContent(block);

  return div({
      class: "promotionalbanner promotionalbanner-content block type1"
    },

    div({
        class: "banner-image"
      },
      img({
        loading: "eager",
        fetchpriority: "high",
        src: image,
        alt: ""
      })
    ),

    div({
        class: "banner-content"
      },
      div({
          class: "grid-content"
        },

        h2({}, heading),

        p({}, description),

        p({
            class: "redirections"
          },

          buttons.first.text &&
          a({
              href: buttons.first.href,
              title: buttons.first.title
            },
            buttons.first.text
          ),

          buttons.second.text &&
          a({
              href: buttons.second.href,
              title: buttons.second.title
            },
            buttons.second.text
          )
        )
      )
    )
  );
}

/* -----------------------------
   Banner Variant 3
------------------------------ */

function bannerType3(block) {

  let {
    image,
    heading,
    description,
    buttons
  } = getContent(block);

  return div({
      class: "promotionalbanner promotionalbanner-content block type3"
    },

    div({
        class: "banner-image desktop-img"
      },
      img({
        loading: "eager",
        fetchpriority: "high",
        src: image,
        alt: ""
      })
    ),

    div({
        class: "banner-content"
      },

      div({
          class: "grid-content"
        },

        div({}, h2({}, heading)),

        div({
            class: "banner-image mob-img"
          },
          img({
            loading: "eager",
            fetchpriority: "high",
            src: image,
            alt: ""
          })
        ),

        div({
            class: "bottom-content"
          },

          p({}, description),

          p({
              class: "redirections"
            },

            buttons.first.text &&
            a({
                href: buttons.first.href,
                title: buttons.first.title
              },
              buttons.first.text
            ),

            buttons.second.text &&
            a({
                href: buttons.second.href,
                title: buttons.second.title
              },
              buttons.second.text
            )
          )
        )
      )
    )
  );
}

/* -----------------------------
   Banner Variant 4
------------------------------ */

function bannerType4(block) {

  let {
    image,
    heading,
    description,
    buttons
  } = getContent(block);

  let container = block.closest(".promotional-banner-container");

  if (container) {
    container.style.background = `url(${image}) center / cover no-repeat`;
  }

  return div({
      class: "promotionalbanner promotionalbanner-content block type4"
    },

    div({
        class: "banner-content"
      },

      div({
          class: "grid-content"
        },

        h2({}, heading),

        p({}, description),

        p({
            class: "redirections"
          },

          buttons.first.text &&
          a({
              href: buttons.first.href,
              title: buttons.first.title
            },
            buttons.first.text
          ),

          buttons.second.text &&
          a({
              href: buttons.second.href,
              title: buttons.second.title
            },
            buttons.second.text
          )
        )
      )
    )
  );
}

/* -----------------------------
   Hitech Banner
------------------------------ */

function hitechBanner(block) {

  let {
    image,
    heading,
    description,
    buttons
  } = getContent(block);

  let arrowIcon = block.querySelector(".icon img")?.src || "";

  return div({
      class: "promotionalbanner promotionalbanner-content block hitech"
    },

    div({
        class: "banner-image"
      },
      img({
        loading: "eager",
        fetchpriority: "high",
        src: image,
        alt: ""
      })
    ),

    div({
        class: "banner-content"
      },

      div({
          class: "grid-content"
        },

        h2({}, heading),

        p({}, description),

        p({
            class: "redirections"
          },

          a({
              href: buttons.first.href,
              title: buttons.first.title
            },

            buttons.first.text,

            arrowIcon ? span(img({
              src: arrowIcon,
              alt: ""
            })) : ""
          )
        )
      )
    )
  );
}


/* -----------------------------
   Healthcare Banner
------------------------------ */

function healthcareBanner(block) {

  let {
    image,
    heading,
    description,
    buttons
  } = getContent(block);
let [title, subtitle] = heading.split(":");
let container = block.closest(".promotional-banner-container")?.querySelector(".promotional-banner-wrapper");
let presentClass = block.closest(".promotional-banner-container")?.classList;

  if (presentClass?.contains("healthcare-banner-variant3") || presentClass?.contains("healthcare-banner-variant4")) {
    if (container) container.style.background = `url(${image}) center top / cover no-repeat`;
  }
  return div({
      class: "promotionalbanner promotionalbanner-content block type3"
    },

    div({
        class: "banner-image"
      },
      img({
        loading: "eager",
        fetchpriority: "high",
        src: image,
        alt: ""
      })
    ),

    div({
        class: "banner-content"
      },

      div({
          class: "grid-content"
        },

        div(
  {},
  h2(
    {},
    strong({}, title),
    subtitle ? `: ${subtitle}` : ""
  )
),

        div({
            class: "bottom-content"
          },

          p({}, description),

          p({
              class: "redirections"
            },

            buttons.first.text &&
            a({
                href: buttons.first.href,
                title: buttons.first.title
              },
              buttons.first.text
            ),

            buttons.second.text &&
            a({
                href: buttons.second.href,
                title: buttons.second.title
              },
              buttons.second.text
            )
          )
        )
      )
    )
  );
}
