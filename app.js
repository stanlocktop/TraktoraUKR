const CLOSE_ICON = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const ARROW_ICON = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg>';
const FALLBACK_IMG = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#3f4a63"/><text x="200" y="155" font-family="Arial" font-size="18" fill="#fff" text-anchor="middle">Фото немає</text></svg>');
const CALL_PHONE = 'tel:+380971066323';
const VIBER_LINK = 'viber://chat?number=%2B380971066323';

let PRODUCTS = [];
let modalState = { images: [], index: 0 };
let searchQuery = '';

function formatPrice(value, currency) {
  return new Intl.NumberFormat('uk-UA').format(value) + ' ' + currency;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function badgeClass(type) {
  return 'badge ' + (type || 'blue');
}

function priceHtml(product) {
  if (product.priceOnRequest || !product.price) {
    return '<span class="price-request">Ціна за запитом</span>';
  }
  const main = formatPrice(product.price, product.currency);
  return product.oldPrice ? `<span class="old">${formatPrice(product.oldPrice, product.currency)}</span>${main}` : main;
}

function renderCard(product, i) {
  const badgesHtml = product.badges && product.badges.length
    ? `<div class="badges">${product.badges.map(b => `<span class="${badgeClass(b.type)}">${b.text}</span>`).join('')}</div>`
    : '';

  const load = i < 4 ? 'eager' : 'lazy';
  const prio = i === 0 ? ' fetchpriority="high"' : '';

  return `
    <div class="card" data-id="${product.id}" role="button" tabindex="0">
      ${badgesHtml}
      <img src="${product.image}" alt="${product.name}" loading="${load}" decoding="async"${prio} onerror="this.onerror=null;this.src='${FALLBACK_IMG}';">
      <div class="card-body">
        <div class="card-title" title="${product.name}">${product.name}</div>
        <div class="price">${priceHtml(product)}</div>
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

  const ctaLabel = product.priceOnRequest ? 'Уточнити ціну' : 'Замовити';

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
          <img id="modal-main-img" src="${modalState.images[0]}" alt="${product.name}" decoding="async" onerror="this.onerror=null;this.src=FALLBACK_IMG;">
          ${modalState.images.length > 1 ? `<button class="modal-arrow next" aria-label="Наступне фото">${ARROW_ICON}</button>` : ''}
        </div>
        ${modalState.images.length > 1 ? `
        <div class="modal-thumbs">
          ${modalState.images.map((img, i) => `<img src="${img}" class="modal-thumb${i === 0 ? ' active' : ''}" data-index="${i}" alt="Фото ${i + 1}" loading="lazy" decoding="async" onerror="this.style.display='none';">`).join('')}
        </div>` : ''}
      </div>
      <div class="modal-info">
        <div class="modal-badges">${badgesHtml}</div>
        <div class="modal-title">${product.name}</div>
        <div class="modal-price">${priceHtml(product)}</div>
        <div class="modal-desc">${product.description || ''}</div>
        <div class="modal-cta">
          <a class="btn-call" href="${CALL_PHONE}">${ctaLabel}</a>
          <a class="btn-viber" href="${VIBER_LINK}">Написати у Viber</a>
        </div>
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

function renderCatalog() {
  const featuredGrid = document.getElementById('featured-grid');
  const otherGrid = document.getElementById('other-grid');
  const otherTitle = document.getElementById('other-title');

  if (searchQuery) {
    const matches = PRODUCTS.filter(p => p.name.toLowerCase().includes(searchQuery));
    featuredGrid.innerHTML = matches.length
      ? matches.map(renderCard).join('')
      : `<div class="empty-placeholder">Нічого не знайдено за запитом «${escapeHtml(searchQuery)}».</div>`;
    otherGrid.innerHTML = '';
    otherTitle.hidden = true;
    bindCardClicks();
    return;
  }

  const featured = PRODUCTS.filter(p => p.featured);
  const other = PRODUCTS.filter(p => !p.featured);

  featuredGrid.innerHTML = featured.map(renderCard).join('');
  otherGrid.innerHTML = other.map(renderCard).join('');
  otherTitle.hidden = other.length === 0;

  if (!PRODUCTS.length) {
    featuredGrid.innerHTML = '<div class="empty-placeholder">Моделі з’являться в каталозі найближчим часом.</div>';
  }
  bindCardClicks();
}

function loadProducts() {
  const featuredGrid = document.getElementById('featured-grid');
  try {
    if (typeof PRODUCTS_DATA === 'undefined') throw new Error('catalog missing');
    PRODUCTS = PRODUCTS_DATA.products || [];
    renderCatalog();
  } catch (err) {
    featuredGrid.innerHTML = '<div class="error-placeholder">Каталог не завантажено. Перевірте файл products.js.</div>';
  }
}

function initSearch() {
  const input = document.querySelector('.search-box input');
  const btn = document.querySelector('.search-box button');
  if (!input) return;
  const apply = () => {
    searchQuery = input.value.trim().toLowerCase();
    renderCatalog();
  };
  input.addEventListener('input', apply);
  if (btn) btn.addEventListener('click', e => { e.preventDefault(); apply(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape' && input.value) {
      input.value = '';
      searchQuery = '';
      renderCatalog();
    }
  });
}

let toastTimer;
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

document.addEventListener('click', e => {
  const a = e.target.closest('a[data-soon]');
  if (a) {
    e.preventDefault();
    showToast(a.dataset.soon || 'Розділ у розробці');
  }
});

document.addEventListener('keydown', e => {
  if (!document.getElementById('product-modal')?.classList.contains('open')) return;
  if (e.key === 'Escape') closeModal();
  if (e.key === 'ArrowLeft') showSlide(modalState.index - 1);
  if (e.key === 'ArrowRight') showSlide(modalState.index + 1);
});

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  initSearch();
});
