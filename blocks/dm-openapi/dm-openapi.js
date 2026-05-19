import { getDynamicMediaServerURL } from '../../scripts/utils.js';

/**
 * @param {HTMLElement} $block
 */
export default async function decorate(block) {
  console.log("dm-openapi :" + block);

  //block = a.closest('[data-block-name], [data-aue-resource]');
  console.log("dm-openapi :" + block);

  let anchor = null;

  if (block) {
    anchor = block.querySelector('a[href]');
  }
  if (anchor && block) {

    let imageUrl = anchor.getAttribute('href');
    let flip = null;
    let rotate = null;
    let crop = null;

    const rotateEl = block.querySelector('[data-aue-prop="rotate"]');
    if (rotateEl) {
      rotate = rotateEl.textContent.trim();
      console.log("rotate :" + rotate);
      rotateEl.parentElement.remove(); // Remove the property div
    }
    const flipEl = block.querySelector('[data-aue-prop="flip"]');
    if (flipEl) {
      flip = flipEl.textContent.trim();
      console.log("flip :" + flip);
      flipEl.parentElement.remove();
    }
    const cropEl = block.querySelector('[data-aue-prop="crop"]');
    if (cropEl) {
      crop = cropEl.textContent.trim();
      console.log("crop :" + crop);
      cropEl.parentElement.remove();
    }

    // Build final URL with parameters
    let finalImageUrl = imageUrl;
    const params = [];

    // Parse existing URL
    try {
      const url = new URL(imageUrl);
      const existingParams = new URLSearchParams(url.search);

      // Add flip, rotate, crop if present
      if (flip) existingParams.append('flip', flip);
      if (rotate) existingParams.append('rotate', rotate);
      if (crop) existingParams.append('crop', crop);

      finalImageUrl = url.origin + url.pathname + '?' + existingParams.toString();
    } catch (e) {
      // Fallback: simple string concatenation if URL parsing fails
      const existingParams = imageUrl.includes('?') ? '&' : '?';
      const newParams = [];
      if (flip) newParams.push('flip=' + encodeURIComponent(flip));
      if (rotate) newParams.push('rotate=' + encodeURIComponent(rotate));
      if (crop) newParams.push('crop=' + encodeURIComponent(crop));
      if (newParams.length > 0) {
        finalImageUrl += existingParams + newParams.join('&');
      }
    }
    // Create img element
    const img = document.createElement('img');
    img.src = finalImageUrl;
    img.style.width = '100%';
    img.alt = anchor.getAttribute('title') || "dm image";

    // Replace anchor with img (preserving parent structure)
    anchor.replaceWith(img);

    console.log("Final image URL: " + finalImageUrl);

  }
}
