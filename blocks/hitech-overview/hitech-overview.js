import Swiper from './swiper.min.js';
export default async function decorate(block) {
  // Create swiper container
  let swiperContainer = document.createElement('div');
  swiperContainer.className = 'swiper';

  let swiperWrapper = document.createElement('div');
  swiperWrapper.className = 'swiper-wrapper';

  // Select all overview wrappers inside section
  let section = block.closest('.hitech-overview-container');
  let wrappers = section.querySelectorAll('.hitech-overview-wrapper');

  wrappers.forEach((wrapper) => {
    wrapper.classList.add('swiper-slide');
    swiperWrapper.appendChild(wrapper);
  });

  swiperContainer.appendChild(swiperWrapper);

  // Add navigation
  swiperContainer.insertAdjacentHTML('beforeend', `
    <div class="swiper-pagination"></div>
  `);

  section.innerHTML = '';
  section.appendChild(swiperContainer);


  if (section.classList.contains("hi-tech-overview-variant1")) {
    hitechArticles1();
  } else if (section.classList.contains("hi-tech-overview-variant2"))  {
    hitechArticles2();
  }
}
function hitechArticles2() {
  Swiper(".hi-tech-overview-variant2 .swiper", {
    slidesPerView: 1.3,
    spaceBetween: 16,
    direction: "vertical",
    grabCursor: true,
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    breakpoints: {
      768: {
        slidesPerView: 1.3,
        spaceBetween: 0
      },
      1024: {
        slidesPerView: 1.3,
        spaceBetween: 0
      }
    }
  });
}

function hitechArticles1() {
  Swiper(".hi-tech-overview-variant1 .swiper", {
    slidesPerView: 1.15,
    spaceBetween: 16,
    loop: false,
    grabCursor: true,
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    breakpoints: {
      768: {
        slidesPerView: 1.15
      },
      1024: {
        slidesPerView: 1.15
      }
    }
  });
} 