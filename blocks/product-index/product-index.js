import { readBlockConfig } from '../../scripts/aem.js';

const DEFAULT_API_URL = 'https://publish-p153659-e1796191.adobeaemcloud.com/graphql/execute.json/global/hi-tech-component';

async function fetchData() {
    const apiUrl = DEFAULT_API_URL;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const json = await response.json();
        return json?.data?.searchOnAlphabetList?.items?.[0]?.searchdata;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

export default async function decorate(block) {
    const alphabetData = await fetchData();
    if (!alphabetData) return;
    const isAlphabeticalListing = !!block.closest('.alphabetical-product-listing');

    // 1. Get the placeholder text from the last default-content-wrapper before clearing
    const section = block.closest(".alphabetical-product-listing");
    let authorPlaceholder = "Search...";
    if (section) {
        const lastContentP = section.querySelector('.default-content-wrapper:last-child p');
        if (lastContentP) authorPlaceholder = lastContentP.textContent;
    }

    // Clear block
    block.innerHTML = '';

    // Create UI Elements
    const nav = document.createElement('div');
    nav.className = 'alphabet-nav';

    const cardContainer = document.createElement('div');
    cardContainer.className = 'alphabet-cards';

    const viewAll = document.createElement('div');
    viewAll.className = 'view-all';
    viewAll.innerHTML = `View All →`;
    viewAll.style.display = 'none';

    let isSearchNavigation = false;

    // 2. Render cards function with "View All" logic
    function renderCards(letter, filterText = '') {
        cardContainer.innerHTML = '';
        const items = alphabetData[letter] || [];
        
        // Filter items if searching
        const filteredItems = filterText 
            ? items.filter(item => 
                item.value.toLowerCase().includes(filterText) || 
                item.value2.toLowerCase().includes(filterText))
            : items;

        filteredItems.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'card';
            
            // Apply View All truncation only for .alphabetical-product-listing
            if (isAlphabeticalListing && index >= 5) {
                card.classList.add('is-hidden');
                card.style.display = 'none';
            }

            card.innerHTML = `
                <div class="title">${item.value}</div>
                <div class="subtitle">${item.value2}</div>
            `;
            cardContainer.appendChild(card);
        });

        // Toggle View All button only for .alphabetical-product-listing
        if (isAlphabeticalListing) {
            viewAll.style.display = filteredItems.length > 5 ? 'block' : 'none';
        }
    }

    // 3. Alphabet Navigation
    alphabetData.alphabet.forEach((letter, index) => {
        const span = document.createElement('span');
        span.textContent = letter;
        span.className = 'alphabet-letter';
        if (index === 0) span.classList.add('active');

        span.addEventListener('click', () => {
            if (!isSearchNavigation) {
                const searchField = document.querySelector('.alphabetical-product-listing .search-box input');
                if (searchField) searchField.value = '';
            }
            nav.querySelectorAll('.alphabet-letter').forEach(el => el.classList.remove('active'));
            span.classList.add('active');
            renderCards(letter);
        });
        nav.appendChild(span);
    });

    // 4. Search Logic
    const searchSection = block.closest('.alphabetical-product-listing, .alphabetical-product-listing-variant-2');
    const searchWrapper = searchSection
        ?.querySelector('.default-content-wrapper:last-child p')
        ?.textContent?.trim() || authorPlaceholder;
    const searchInput = searchSection?.querySelector('.search-box input');
    if (searchInput) {
        searchInput.setAttribute('placeholder', searchWrapper);
        searchInput.addEventListener('input', (e) => {
            const searchValue = e.target.value.trim().toLowerCase();

            if (searchValue.length === 0) {
                const activeLetter = nav.querySelector('.alphabet-letter.active');
                if (activeLetter) renderCards(activeLetter.textContent);
                return;
            }

            const firstLetter = searchValue[0].toUpperCase();
            const targetLetter = Array.from(nav.querySelectorAll('.alphabet-letter'))
                .find(el => el.textContent === firstLetter);

            if (targetLetter) {
                isSearchNavigation = true;
                targetLetter.click();
                isSearchNavigation = false;
                // Re-run render with filter to handle "View All" visibility
                renderCards(firstLetter, searchValue);
            } else {
                cardContainer.innerHTML = '';
                if (isAlphabeticalListing) {
                    viewAll.style.display = 'none';
                }
            }
        });
    }

    // 5. View All Click Logic
    if (isAlphabeticalListing) {
        viewAll.addEventListener('click', () => {
            const hiddenCards = cardContainer.querySelectorAll('.card.is-hidden');
            hiddenCards.forEach(card => {
                card.style.display = 'block';
                card.classList.remove('is-hidden');
            });
            viewAll.style.display = 'none';
        });
    }

    // Default Load
    renderCards('A');

    // Append to block — add View All only for .alphabetical-product-listing
    if (isAlphabeticalListing) {
        cardContainer.appendChild(viewAll);
    }
    block.appendChild(nav);
    block.appendChild(cardContainer);
}