const CLOSE_ICON = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const ARROW_ICON = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg>';
const FALLBACK_IMG = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#3f4a63"/><text x="200" y="155" font-family="Arial" font-size="18" fill="#fff" text-anchor="middle">Фото немає</text></svg>');

let PRODUCTS = [];
let modalState = { images: [], index: 0 };

function formatPrice(value, currency) {
  return new Intl.NumberFormat('uk-UA').format(value) + ' ' + currency;
}

function badgeClass(type) {
  return type === 'blue' ? 'badge blue' : 'badge orange';
}

function renderCard(product) {
  const badgesHtml = product.badges && product.badges.length
    ? `<div class="badges">${product.badges.map(b => `<span class="${badgeClass(b.type)}">${b.text}</span>`).join('')}</div>`
    : '';

  const priceHtml = product.oldPrice
    ? `<span class="old">${formatPrice(product.oldPrice, product.currency)}</span>${formatPrice(product.price, product.currency)}`
    : formatPrice(product.price, product.currency);

  return `
    <div class="card" data-id="${product.id}" role="button" tabindex="0">
      ${badgesHtml}
      <img src="${product.image}" alt="${product.name}" onerror="this.onerror=null;this.src='${FALLBACK_IMG}';">
      <div class="card-body">
        <div class="card-title">${product.name}</div>
        <div class="price">${priceHtml}</div>
      </div>
    </div>`;
}

function getGallery(product) {
  return product.gallery && product.gallery.length ? product.gallery : [product.image];
}

function openModal(product) {
  modalState.images = getGallery(product);
  modalState.index = 0;

  const badgesHtml = product.badges && product.badges.length
    ? product.badges.map(b => `<span class="${badgeClass(b.type)}">${b.text}</span>`).join('')
    : '';

  const priceHtml = product.oldPrice
    ? `<span class="old">${formatPrice(product.oldPrice, product.currency)}</span>${formatPrice(product.price, product.currency)}`
    : formatPrice(product.price, product.currency);

  let overlay = document.getElementById('product-modal');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'product-modal';
    overlay.className = 'modal-overlay';
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal();
    });
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="modal">
      <button class="modal-close" aria-label="Закрити">${CLOSE_ICON}</button>
      <div class="modal-gallery">
        <div class="modal-main">
          ${modalState.images.length > 1 ? `<button class="modal-arrow prev" aria-label="Попереднє фото">${ARROW_ICON}</button>` : ''}
          <img id="modal-main-img" src="${modalState.images[0]}" alt="${product.name}">
          ${modalState.images.length > 1 ? `<button class="modal-arrow next" aria-label="Наступне фото">${ARROW_ICON}</button>` : ''}
        </div>
        ${modalState.images.length > 1 ? `
        <div class="modal-thumbs">
          ${modalState.images.map((img, i) => `<img src="${img}" class="modal-thumb${i === 0 ? ' active' : ''}" data-index="${i}" alt="Фото ${i + 1}">`).join('')}
        </div>` : ''}
      </div>
      <div class="modal-info">
        <div class="modal-badges">${badgesHtml}</div>
        <div class="modal-title">${product.name}</div>
        <div class="modal-price">${priceHtml}</div>
        <div class="modal-desc">${product.description || ''}</div>
      </div>
    </div>`;

  overlay.querySelector('.modal-close').addEventListener('click', closeModal);
  const prev = overlay.querySelector('.modal-arrow.prev');
  const next = overlay.querySelector('.modal-arrow.next');
  if (prev) prev.addEventListener('click', () => showSlide(modalState.index - 1));
  if (next) next.addEventListener('click', () => showSlide(modalState.index + 1));
  overlay.querySelectorAll('.modal-thumb').forEach(t => {
    t.addEventListener('click', () => showSlide(+t.dataset.index));
  });

  document.body.style.overflow = 'hidden';
  overlay.classList.add('open');
}

function showSlide(i) {
  const n = modalState.images.length;
  modalState.index = (i + n) % n;
  const overlay = document.getElementById('product-modal');
  overlay.querySelector('#modal-main-img').src = modalState.images[modalState.index];
  overlay.querySelectorAll('.modal-thumb').forEach((t, ti) => {
    t.classList.toggle('active', ti === modalState.index);
  });
}

function closeModal() {
  const overlay = document.getElementById('product-modal');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function bindCardClicks() {
  document.querySelectorAll('.card').forEach(card => {
    const product = PRODUCTS.find(p => p.id === card.dataset.id);
    if (!product) return;
    card.addEventListener('click', () => openModal(product));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(product); }
    });
  });
}

function renderCatalog(category) {
  const featuredGrid = document.getElementById('featured-grid');
  const otherGrid = document.getElementById('other-grid');
  const otherTitle = document.getElementById('other-title');

  const items = PRODUCTS.filter(p => (p.category || 'minitractor') === category);
  const featured = items.filter(p => p.featured);
  const other = items.filter(p => !p.featured);

  featuredGrid.innerHTML = featured.map(renderCard).join('');
  otherGrid.innerHTML = other.map(renderCard).join('');
  otherTitle.hidden = other.length === 0;

  if (!items.length) {
    featuredGrid.innerHTML = '<div class="empty-placeholder">Моделі цієї групи з’являться в каталозі найближчим часом.</div>';
  }
  bindCardClicks();
}

function loadProducts() {
  const featuredGrid = document.getElementById('featured-grid');
  try {
    if (typeof PRODUCTS_DATA === 'undefined') throw new Error('catalog missing');
    PRODUCTS = PRODUCTS_DATA.products || [];
    renderCatalog('minitractor');
  } catch (err) {
    featuredGrid.innerHTML = '<div class="error-placeholder">Каталог не завантажено. Перевірте файл products.js.</div>';
  }
}

document.addEventListener('keydown', e => {
  if (!document.getElementById('product-modal')?.classList.contains('open')) return;
  if (e.key === 'Escape') closeModal();
  if (e.key === 'ArrowLeft') showSlide(modalState.index - 1);
  if (e.key === 'ArrowRight') showSlide(modalState.index + 1);
});

document.addEventListener('DOMContentLoaded', loadProducts);
