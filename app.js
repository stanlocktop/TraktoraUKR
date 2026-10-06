const ARROW_ICON = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg>';
const FALLBACK_IMG = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#3f4a63"/><text x="200" y="155" font-family="Arial" font-size="18" fill="#fff" text-anchor="middle">Фото немає</text></svg>');
const CALL_PHONE = 'tel:+380971066323';
const VIBER_LINK = 'viber://chat?number=%2B380971066323';

let PRODUCTS = [];
let searchQuery = '';
let categoryFilter = 'all';
const FILTER_LABELS = {
  all: 'Усі моделі',
  tractor: 'Трактори',
  minitractor: 'Мінітрактори',
  mototractor: 'Мототрактори'
};

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

function productUrl(product) {
  return 'product.html?id=' + encodeURIComponent(product.id);
}

function bindCardClicks() {
  document.querySelectorAll('.card').forEach(card => {
    const product = PRODUCTS.find(p => p.id === card.dataset.id);
    if (!product) return;
    const go = () => { location.href = productUrl(product); };
    card.addEventListener('click', go);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  });
}

function renderCatalog() {
  const featuredGrid = document.getElementById('featured-grid');
  const otherGrid = document.getElementById('other-grid');
  const otherTitle = document.getElementById('other-title');

  const list = PRODUCTS.filter(p =>
    (categoryFilter === 'all' || p.category === categoryFilter) &&
    (!searchQuery || p.name.toLowerCase().includes(searchQuery))
  );

  const flat = Boolean(searchQuery) || categoryFilter !== 'all';

  if (flat) {
    featuredGrid.innerHTML = list.length
      ? list.map(renderCard).join('')
      : `<div class="empty-placeholder">${
          searchQuery
            ? `Нічого не знайдено за запитом «${escapeHtml(searchQuery)}».`
            : 'У цій категорії поки немає моделей.'
        }</div>`;
    otherGrid.innerHTML = '';
    otherTitle.hidden = true;
    bindCardClicks();
    return;
  }

  featuredGrid.innerHTML = list.filter(p => p.featured).map(renderCard).join('');
  otherGrid.innerHTML = list.filter(p => !p.featured).map(renderCard).join('');
  otherTitle.hidden = list.filter(p => !p.featured).length === 0;

  if (!PRODUCTS.length) {
    featuredGrid.innerHTML = '<div class="empty-placeholder">Моделі з’являться в каталозі найближчим часом.</div>';
  }
  bindCardClicks();
}

function loadProducts() {
  const featuredGrid = document.getElementById('featured-grid');
  if (!featuredGrid) return;
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

  const hasGrid = Boolean(document.getElementById('featured-grid'));

  if (!hasGrid) {
    const go = () => {
      const q = input.value.trim();
      location.href = 'index.html' + (q ? '?q=' + encodeURIComponent(q) : '') + '#catalog';
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    if (btn) btn.addEventListener('click', e => { e.preventDefault(); go(); });
    return;
  }

  const apply = () => {
    searchQuery = input.value.trim().toLowerCase();
    renderCatalog();
  };

  const incoming = new URLSearchParams(location.search).get('q');
  if (incoming) {
    input.value = incoming;
    searchQuery = incoming.toLowerCase();
  }

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

function initFilter() {
  const root = document.getElementById('catalog-filter');
  if (!root) return;
  const btn = root.querySelector('.filter-btn');
  const menu = root.querySelector('.filter-menu');
  const label = root.querySelector('.filter-label');
  const options = Array.from(menu.querySelectorAll('li'));

  const close = () => {
    root.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  };

  btn.addEventListener('click', e => {
    e.stopPropagation();
    const open = root.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });

  options.forEach(li => {
    li.addEventListener('click', () => {
      categoryFilter = li.dataset.value;
      options.forEach(x => x.classList.toggle('active', x === li));
      label.textContent = FILTER_LABELS[categoryFilter] || li.firstChild.textContent.trim();
      close();
      renderCatalog();
    });
  });

  document.addEventListener('click', e => {
    if (!root.contains(e.target)) close();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
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

document.addEventListener('click', e => {
  const logo = e.target.closest('.logo-icon, .footer-logo .ico');
  if (logo) location.href = 'index.html';
});

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  initSearch();
  initFilter();
});
