const galleryState = { images: [], index: 0 };

function getProductById(id) {
  if (typeof PRODUCTS_DATA === 'undefined') return null;
  return (PRODUCTS_DATA.products || []).find(p => p.id === id) || null;
}

function specsHtml(product) {
  if (!product.specs || !product.specs.length) {
    return '<div class="spec-empty">Повну ТТХ надасть менеджер — зателефонуйте або напишіть нам у Viber.</div>';
  }
  return `<table class="spec-table"><tbody>${product.specs.map(s =>
    `<tr><th>${escapeHtml(s.label)}</th><td>${escapeHtml(s.value)}</td></tr>`).join('')}</tbody></table>`;
}

function highlightsHtml(product) {
  if (!product.highlights || !product.highlights.length) return '';
  return `
    <section class="product-section">
      <h2>Переваги</h2>
      <ul class="hl-list">${product.highlights.map(h => `<li>${escapeHtml(h)}</li>`).join('')}</ul>
    </section>`;
}

function configsHtml(product) {
  if (!product.configurations || !product.configurations.length) return '';
  return `
    <section class="product-section">
      <h2>Комплектації</h2>
      <div class="cfg-grid">${product.configurations.map(c => `
        <div class="cfg-card">
          <div class="name">${escapeHtml(c.name)}</div>
          <div class="note">${escapeHtml(c.note || '')}</div>
          ${c.price ? `<div class="cfg-price">${formatPrice(c.price, product.currency || 'грн')}</div>` : ''}
        </div>`).join('')}
      </div>
    </section>`;
}

function descHtml(product) {
  const text = (product.description || '').trim();
  if (!text) {
    return '<div class="spec-empty">Опис готується — зателефонуйте, і ми розповімо про модель детально.</div>';
  }
  return `<div class="product-desc">${text.split(/\n+/).filter(Boolean)
    .map(t => `<p>${escapeHtml(t)}</p>`).join('')}</div>`;
}

function renderProductPage() {
  const root = document.getElementById('product-page');
  if (!root) return;

  const id = new URLSearchParams(location.search).get('id');
  const products = (typeof PRODUCTS_DATA !== 'undefined' && PRODUCTS_DATA.products) || [];
  const product = products.find(p => p.id === id);

  if (!product) {
    document.title = 'Модель не знайдено — Тракторний завод';
    root.innerHTML = `
      <div class="product-missing">
        <h1>Модель не знайдено</h1>
        <p>Сторінку оновлено або цієї моделі ще немає в каталозі.</p>
        <a class="back-btn" href="index.html#catalog">Перейти до каталогу</a>
      </div>`;
    return;
  }

  document.title = product.name + ' — Тракторний завод';
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && product.description) {
    metaDesc.setAttribute('content', product.description.slice(0, 155));
  }

  galleryState.images = getGallery(product);
  galleryState.index = 0;

  const badges = product.badges && product.badges.length
    ? product.badges.map(b => `<span class="${badgeClass(b.type)}">${b.text}</span>`).join('')
    : '';
  const ctaLabel = product.priceOnRequest ? 'Уточнити ціну' : 'Замовити';
  const hasSlider = galleryState.images.length > 1;

  const others = products.filter(p => p.id !== product.id).slice(0, 4);

  root.innerHTML = `
    <nav class="crumbs">
      <a href="index.html#catalog">← Каталог техніки</a>
      <span>/</span>
      <b>${escapeHtml(product.name)}</b>
    </nav>

    <div class="product-top">
      <div class="product-gallery">
        <div class="modal-main">
          ${hasSlider ? `<button class="modal-arrow prev" aria-label="Попереднє фото">${ARROW_ICON}</button>` : ''}
          <img id="product-main-img" src="${galleryState.images[0]}" alt="${escapeHtml(product.name)}" decoding="async" onerror="this.onerror=null;this.src=FALLBACK_IMG;">
          ${hasSlider ? `<button class="modal-arrow next" aria-label="Наступне фото">${ARROW_ICON}</button>` : ''}
        </div>
        ${hasSlider ? `
        <div class="modal-thumbs">
          ${galleryState.images.map((img, i) => `<img src="${img}" class="modal-thumb${i === 0 ? ' active' : ''}" data-index="${i}" alt="Фото ${i + 1}" loading="lazy" decoding="async" onerror="this.style.display='none';">`).join('')}
        </div>` : ''}
        <div class="gallery-note">${galleryState.images.length} фото моделі</div>
      </div>

      <div class="product-info">
        <div class="modal-badges">${badges}</div>
        <h1 class="modal-title">${escapeHtml(product.name)}</h1>
        <div class="modal-price">${priceHtml(product)}</div>
        <ul class="fact-list">
          <li>Наявність: <b>${product.inStock === false ? 'під замовлення' : 'в наявності'}</b></li>
          <li>Доставка: <b>по всій Україні</b></li>
          <li>Збірка та перевірка: <b>на нашому складі</b></li>
          <li>Документи: <b>повний комплект</b></li>
        </ul>
        <div class="modal-cta">
          <a class="btn-call" href="${CALL_PHONE}">${ctaLabel}</a>
          <a class="btn-viber" href="${VIBER_LINK}">Написати у Viber</a>
        </div>
      </div>
    </div>

    ${highlightsHtml(product)}

    <section class="product-section">
      <h2>Опис</h2>
      ${descHtml(product)}
    </section>

    <section class="product-section" id="specs">
      <h2>Технічні характеристики</h2>
      ${specsHtml(product)}
    </section>

    ${configsHtml(product)}

    ${others.length ? `
    <section class="product-section">
      <h2>Інші моделі</h2>
      <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4 grid-catalog">
        ${others.map(renderCard).join('')}
      </div>
    </section>` : ''}
  `;

  PRODUCTS = products;
  bindCardClicks();

  const mainImg = root.querySelector('#product-main-img');
  root.querySelector('.modal-arrow.prev')?.addEventListener('click', () => showProductSlide(galleryState.index - 1));
  root.querySelector('.modal-arrow.next')?.addEventListener('click', () => showProductSlide(galleryState.index + 1));
  root.querySelectorAll('.modal-thumb').forEach(t => {
    t.addEventListener('click', () => showProductSlide(+t.dataset.index));
  });
  if (mainImg) mainImg.addEventListener('error', () => { mainImg.onerror = null; mainImg.src = FALLBACK_IMG; });
}

function showProductSlide(i) {
  const n = galleryState.images.length;
  if (!n) return;
  galleryState.index = (i + n) % n;
  const main = document.getElementById('product-main-img');
  if (main) main.src = galleryState.images[galleryState.index];
  document.querySelectorAll('.modal-thumb').forEach((t, ti) => {
    t.classList.toggle('active', ti === galleryState.index);
  });
}

document.addEventListener('keydown', e => {
  if (!document.getElementById('product-page')) return;
  if (e.key === 'ArrowLeft') showProductSlide(galleryState.index - 1);
  if (e.key === 'ArrowRight') showProductSlide(galleryState.index + 1);
});

document.addEventListener('DOMContentLoaded', renderProductPage);
