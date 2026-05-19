/*
import { patternDecorate } from '../../scripts/blockTemplate.js';

export default async function decorate(block) {
  patternDecorate(block);
}
*/

import { createOptimizedPicture, loadCSS } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import Swiper from '../../scripts/swiper.min.js';

function isDynamicMediaUrl(url = '') {
  return url.includes('/adobe/assets/') || url.includes('delivery-');
}

function normalizeDynamicMediaUrl(url = '') {
  try {
    const dmUrl = new URL(url);
    if (!dmUrl.searchParams.has('width')) dmUrl.searchParams.set('width', '750');
    if (!dmUrl.searchParams.has('quality')) dmUrl.searchParams.set('quality', '85');
    return dmUrl.toString();
  } catch (e) {
    return url;
  }
}

export default function decorate(block) {
  loadCSS(`${window.hlx.codeBasePath}/styles/swiper.min.css`);
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');

    // Read card style from the third div (index 2)
    const styleDiv = row.children[2];
    const styleParagraph = styleDiv?.querySelector('p');
    const cardStyle = styleParagraph?.textContent?.trim() || 'default';
    if (cardStyle && cardStyle !== 'default') {
      li.className = cardStyle;
    }

    // Read CTA style from the fourth div (index 3)
    const ctaDiv = row.children[3];
    const ctaParagraph = ctaDiv?.querySelector('p');
    const ctaStyle = ctaParagraph?.textContent?.trim() || 'default';

    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);

    // Process the li children to identify and style them correctly
    [...li.children].forEach((div, index) => {
      // First div (index 0) - Image
      if (index === 0) {
        div.className = 'cards-card-image';

        // Handle authored DM links in image cells by converting anchor URL into image markup.
        const existingImg = div.querySelector('img');
        if (!existingImg) {
          const dmAnchor = Array.from(div.querySelectorAll('a[href]'))
            .find((anchor) => isDynamicMediaUrl(anchor.href || ''));

          if (dmAnchor) {
            const dmSrc = normalizeDynamicMediaUrl(dmAnchor.href || '');
            const dmImg = document.createElement('img');
            dmImg.src = dmSrc;
            dmImg.alt = dmAnchor.textContent?.trim() || '';
            dmImg.loading = 'lazy';

            const picture = document.createElement('picture');
            picture.appendChild(dmImg);
            moveInstrumentation(dmAnchor, dmImg);
            div.replaceChildren(picture);
          }
        }
      }
      // Second div (index 1) - Content with button
      else if (index === 1) {
        div.className = 'cards-card-body';
      }
      // Third div (index 2) - Card style configuration
      else if (index === 2) {
        div.className = 'cards-config';
        const p = div.querySelector('p');
        if (p) {
          p.style.display = 'none'; // Hide the configuration text
        }
      }
      // Fourth div (index 3) - CTA style configuration
      else if (index === 3) {
        div.className = 'cards-config';
        const p = div.querySelector('p');
        if (p) {
          p.style.display = 'none'; // Hide the configuration text
        }
      }
      // Any other divs
      else {
        div.className = 'cards-card-body';
      }
    });

    // Apply CTA styles to button containers
    const buttonContainers = li.querySelectorAll('p.button-container');
    buttonContainers.forEach((buttonContainer) => {
      // Remove any existing CTA classes
      buttonContainer.classList.remove('default', 'cta-button', 'cta-button-secondary', 'cta-button-dark', 'cta-default');
      // Add the correct CTA class
      buttonContainer.classList.add(ctaStyle);
    });

    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    if (isDynamicMediaUrl(img.src || '')) {
      return;
    }
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
  const classlistExists = block.closest('.cards-container').classList;

  if(classlistExists.contains("services-variant2")) {
    healthcareSrvicesSwpiper(block);
  }

  if (classlistExists.contains("healthcare-blogs-variant1")) {
  block.classList.add('swiper');
  block.querySelector("ul").classList.add("swiper-wrapper");
  Array.from(block.children[0].children).forEach((element) => {
    element.classList.add('swiper-slide');
  });
    healthcareBlogs()
  }

  if (classlistExists.contains("blog-cards") || classlistExists.contains("blog-cards2") || classlistExists.contains("product-variant1")) {
    blogCards(block);
  }
  if (classlistExists.contains("hitech-variant1") || classlistExists.contains("hitech-variant2") || classlistExists.contains("hitech-variant3")) {
    hitecgGalleryComp(block)
  }
  if (classlistExists.contains("hitech-articles1") || classlistExists.contains("hitech-articles2") || classlistExists.contains("hitech-articles3")) {
    hitechArticles(block)
  }
  if (block.closest('.healthcare-round-tab-swiper, .healthcare-round-tab-swipe, .healthcare-tab-swiper')) {
    healthcareTabSwiper(block);
  }

  if(classlistExists.contains("services-variant3")) {
    // console.log(block);
    let imgSrc; 
    if (window.innerWidth > 767) {
      imgSrc = block
    .closest(".services-variant3")
    ?.querySelectorAll(".default-content-wrapper")?.[1]
    ?.querySelector("p:first-child img")
    ?.src
    ?.trim();
      
  } else {
        imgSrc = block.closest(".services-variant3")
    ?.querySelectorAll(".default-content-wrapper")?.[1]
    ?.querySelector("p:last-child img")
    ?.src
    ?.trim();
  }
  block.closest(".services-variant3").querySelector(".cards-wrapper").style.background =`url(${imgSrc}) center top / cover no-repeat`
    }
}


function blogCards(block) {
  let classlistExists = block.closest(".cards-container").classList;
  block.classList.add('swiper');
  block.querySelector("ul").classList.add("swiper-wrapper");
  Array.from(block.children[0].children).forEach((element) => {
    element.classList.add('swiper-slide');
  });
  const paginationEl = document.createElement('div');
  paginationEl.classList.add('swiper-pagination');
  block.appendChild(paginationEl);
  if (classlistExists.contains("blog-cards")) {
    swiperVariantForblogs1()
  }
  if (classlistExists.contains("blog-cards2")) {
    swiperVariantForblogs2()
  }
  if (classlistExists.contains("product-variant1")) {
    ProductSwiperVariant1()
  }
}

function swiperVariantForblogs1() {
  // Initialize Swiper with responsive breakpoints (mobile shows 2.5)
  Swiper(".blog-cards .swiper", {
    slidesPerView: 3,
    observer: true,
    observeParents: true,
    spaceBetween: 32,
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
      type: "bullets",
    },
    breakpoints: {
      0: {
        slidesPerView: 1, // fallback (below 375)
      },
      375: {
        slidesPerView: 1.5, // 👈 375–1023
      },
      767: {
        slidesPerView: 2, // 👈 375–1023
      },
      1024: {
        slidesPerView: 3, // 👈 1024+
      },
    },
  });
}

function swiperVariantForblogs2() {
  // Initialize Swiper with responsive breakpoints (mobile shows 2.5)
  Swiper(".blog-cards2 .swiper", {
    slidesPerView: 2.5,
    spaceBetween: 32,
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
      type: "bullets",
    },
    breakpoints: {
      0: {
        slidesPerView: 1,
      },
      375: {
        slidesPerView: 1.5,
      },
      767: {
        slidesPerView: 2,
      },
      1024: {
        slidesPerView: 2.5,
      },
    },
  });
}

function ProductSwiperVariant1() {
  // Initialize Swiper with responsive breakpoints (mobile shows 2.5)
  Swiper(".product-variant1 .swiper", {
    slidesPerView: 1,
    spaceBetween: 20,
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
      type: "bullets",
    },
    breakpoints: {
      1024: {
        spaceBetween: 16
      }
    }
  });
}

function hitecgGalleryComp(block) {
  if (window.innerWidth > 1024) {
    let classlistExists = block.closest(".cards-container").classList;
    if (classlistExists.contains("hitech-variant1")) {
      let cards = block.querySelectorAll(".cards-wrapper li")
      cards.forEach((card, index) => {
        card.classList.remove("small", "big");

        const patternIndex = index % 4;

        if (patternIndex === 0 || patternIndex === 3) {
          card.classList.add("small");
        } else {
          card.classList.add("big");
        }
      });
    }
    if (classlistExists.contains("hitech-variant2") || classlistExists.contains("hitech-variant3")) {
      block.classList.add('swiper');
      block.querySelector("ul").classList.add("swiper-wrapper");
      Array.from(block.children[0].children).forEach((element) => {
        element.classList.add('swiper-slide');
      });
      const paginationEl = document.createElement('div');
      paginationEl.classList.add('swiper-pagination');
      block.appendChild(paginationEl);

      if (classlistExists.contains("hitech-variant2")) {
        hitechVariant1()
      }
      if (classlistExists.contains("hitech-variant3")) {
        hitechVariant2()
      }
      block.querySelectorAll(".swiper-wrapper .swiper-slide").forEach(function (el, ind) {
        if (ind == 0) {
          el.classList.add("hover");
        }
        el.addEventListener("mouseover", function () {
          block.querySelectorAll(".swiper-wrapper .swiper-slide").forEach(function (slide) {
            slide.classList.remove("hover");
          });
          this.classList.add("hover");
        });
      });

    }
  }
}

function hitechVariant1() {
  Swiper(".hitech-variant2 .swiper", {
    slidesPerView: 4,
    slideToClickedSlide: true,
    spaceBetween: 22,
    grabCursor: true,
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
      type: "bullets",
    }
  });
}

function hitechVariant2() {
  Swiper(".hitech-variant3 .swiper", {
    slidesPerView: 4,
    slideToClickedSlide: true,
    spaceBetween: 22,
    grabCursor: true,
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
      type: "bullets",
    }
  });
}


function hitechArticles(block) {
  let classlistExists = block.closest(".cards-container").classList;
  block.classList.add('swiper');
  block.querySelector("ul").classList.add("swiper-wrapper");
  Array.from(block.children[0].children).forEach((element) => {
    element.classList.add('swiper-slide');
  });
  const paginationEl = document.createElement('div');
  paginationEl.classList.add('swiper-pagination');
  block.appendChild(paginationEl);
  if (classlistExists.contains("hitech-articles1")) {
    hitechArticles1();
  }
  if (classlistExists.contains("hitech-articles2")) {
    hitechArticles2();
  }
  if (classlistExists.contains("hitech-articles3")) {
    let buttonWrapper = document.createElement('div');
    buttonWrapper.classList.add('button-wrapper');
    let prevButton = document.createElement('div');
    prevButton.classList.add('swiper-button-prev');
    let nextbutton = document.createElement('div');
    nextbutton.classList.add('swiper-button-next');
    buttonWrapper.appendChild(prevButton);
    buttonWrapper.appendChild(nextbutton);
    block.closest(".hitech-articles3").querySelector(".default-content-wrapper").appendChild(buttonWrapper);
    hitechArticles3();
  }
}
function hitechArticles1() {
  Swiper(".hitech-articles1 .swiper", {
    slidesPerView: 3,
    // slideToClickedSlide: true,
    spaceBetween: 12,
    grabCursor: true,
    breakpoints: {
      0: {
        slidesPerView: 1,
      },
      375: {
        slidesPerView: 1.5,
      },
      767: {
        slidesPerView: 2,
      },
      1024: {
        slidesPerView: 3,
      },
    }
  });
}

function hitechArticles2() {
  Swiper(".hitech-articles2 .swiper", {
    slidesPerView: 3,
    slideToClickedSlide: true,
    spaceBetween: 12,
    grabCursor: true,
    breakpoints: {
      0: {
        slidesPerView: 1,
      },
      375: {
        slidesPerView: 1.5,
      },
      767: {
        slidesPerView: 1.5,
      },
      1024: {
        slidesPerView: 3,
      },
    }
  });
}

function hitechArticles3() {
  Swiper(".hitech-articles3 .swiper", {
    slidesPerView: 3,
    slideToClickedSlide: true,
    spaceBetween: 12,
    grabCursor: true,
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
      type: "bullets",
    },
    breakpoints: {
      0: {
        slidesPerView: 1,
      },
      375: {
        slidesPerView: 1.5,
      },
      767: {
        slidesPerView: 1.5,
      },
      1024: {
        slidesPerView: 3,
      },
    }
  });
}

function healthcareTabSwiper(block) {
  const swiperContainer = block.closest('.healthcare-round-tab-swiper, .healthcare-round-tab-swipe, .healthcare-tab-swiper');
  if (!swiperContainer) return;
  block.classList.add('swiper');
  block.querySelector('ul').classList.add('swiper-wrapper');
  Array.from(block.children[0].children).forEach((element) => {
    element.classList.add('swiper-slide');
  });
  const swiperButtonPrev = document.createElement('div');
  swiperButtonPrev.classList.add('swiper-button-prev');
  const swiperButtonNext = document.createElement('div');
  swiperButtonNext.classList.add('swiper-button-next');

  block.appendChild(swiperButtonPrev);
  block.appendChild(swiperButtonNext);

  // Initialize Swiper
  new Swiper(block, {
    slidesPerView: 1,
    spaceBetween: 12,
    slidepergroup: 1,
    navigation: {
      nextEl: swiperButtonNext,
      prevEl: swiperButtonPrev,
    },
    breakpoints: {
      767: {
        slidesPerView: 1,
      }
    }
  });
}

function healthcareSrvicesSwpiper(block) {
  block.classList.add('swiper');
  block.querySelector('ul').classList.add('swiper-wrapper');
  Array.from(block.children[0].children).forEach((element) => {
    element.classList.add('swiper-slide');
  });

  const swiperButtonPrev = document.createElement('div');
  swiperButtonPrev.classList.add('swiper-button-prev');
  const swiperButtonNext = document.createElement('div');
  swiperButtonNext.classList.add('swiper-button-next');

  // Create button wrapper and append buttons inside it
  let buttonWrapper = document.createElement('div');
  buttonWrapper.classList.add('button-wrapper');
  buttonWrapper.appendChild(swiperButtonPrev);
  buttonWrapper.appendChild(swiperButtonNext);
  block.closest(".services-variant2").querySelector(".default-content-wrapper").appendChild(buttonWrapper);

  new Swiper(block, {
    slidesPerView: 1,
    slideToClickedSlide: true,
    spaceBetween: 12,
    grabCursor: true,
    navigation: {
      nextEl: swiperButtonNext,
      prevEl: swiperButtonPrev,
    },
    breakpoints: {
      0: {
        slidesPerView: 1,
      },
      375: {
        slidesPerView: 1,
      },
      767: {
        slidesPerView: 1,
      },
      1024: {
        slidesPerView: 1,
      },
    },
  });
}

function healthcareBlogs() {
  Swiper(".healthcare-blogs-variant1 .swiper", {
    slidesPerView: 3,
    slideToClickedSlide: true,
    spaceBetween: 20,
    grabCursor: true,
   breakpoints: {
      0: {
        slidesPerView: 1,
      },
      375: {
        slidesPerView: 1.5,
      },
      767: {
        slidesPerView: 1.5,
      },
      1024: {
        slidesPerView: 3,
      },
    }
  });
}