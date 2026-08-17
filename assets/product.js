/* =========================================
   ARDA HAIR — PRODUCT DETAIL
========================================= */

const PRODUCT_SUPABASE_URL =
  'https://zehtftzxrjuoqcpcqmcs.supabase.co';

const PRODUCT_SUPABASE_KEY =
  'sb_publishable_wUwY1wDw05gblt9WVOMT6Q_xxIcGKvF';

const productDb = supabase.createClient(
  PRODUCT_SUPABASE_URL,
  PRODUCT_SUPABASE_KEY
);

const $ = (id) => document.getElementById(id);

let currentProduct = null;
let productVariants = [];
let productMedia = [];
let selectedVariant = null;
let currentLang = 'de';

let cart = JSON.parse(
  localStorage.getItem('ardaHairCart') || '[]'
);

let favorites = JSON.parse(
  localStorage.getItem('ardaHairFavorites') || '[]'
);


/* =========================================
   TRANSLATIONS
========================================= */

const productTranslations = {

  de: {
    back: '← Zurück zum Shop',
    cart: 'In den Warenkorb',
    favorite: '♡ Zu Favoriten hinzufügen',
    favoriteAdded: '♥ In Favoriten',
    quantity: 'Menge',
    inStock: 'Auf Lager',
    lowStock: 'Nur noch wenige verfügbar',
    soldOut: 'Nicht verfügbar',
    chooseVariant: 'Bitte wähle eine verfügbare Variante.',
    addedCart: 'Produkt wurde zum Warenkorb hinzugefügt.',
    addedFav: 'Produkt wurde zu Favoriten hinzugefügt.',
    removedFav: 'Produkt wurde aus Favoriten entfernt.',
    variants: 'Optionen',
    color: 'Farbe',
    length: 'Länge',
    weight: 'Gewicht',
    strands: 'Strähnen',
    baseSize: 'Base Größe',
    density: 'Density',
    productDetails: 'Produktdetails',
    extensionType: 'Extension Typ',
    hairQuality: 'Haarqualität',
    texture: 'Haarstruktur',
    material: 'Haarmaterial',
    baseType: 'Base Typ',
    baseThickness: 'Base Dicke',
    hairline: 'Hairline',
    direction: 'Haarstil',
    grey: 'Grauhaaranteil',
    bleached: 'Bleached Knots',
    yes: 'Ja',
    no: 'Nein',
    heat: 'Hitzestyling',
    dyeable: 'Färbbar',
    stock: 'Bestand'
  },

  tr: {
    back: '← Mağazaya dön',
    cart: 'Sepete ekle',
    favorite: '♡ Favorilere ekle',
    favoriteAdded: '♥ Favorilerde',
    quantity: 'Adet',
    inStock: 'Stokta',
    lowStock: 'Son birkaç ürün',
    soldOut: 'Stokta yok',
    chooseVariant: 'Lütfen mevcut bir seçenek seç.',
    addedCart: 'Ürün sepete eklendi.',
    addedFav: 'Ürün favorilere eklendi.',
    removedFav: 'Ürün favorilerden çıkarıldı.',
    variants: 'Seçenekler',
    color: 'Renk',
    length: 'Uzunluk',
    weight: 'Ağırlık',
    strands: 'Saç adedi',
    baseSize: 'Taban ölçüsü',
    density: 'Yoğunluk',
    productDetails: 'Ürün detayları',
    extensionType: 'Kaynak tipi',
    hairQuality: 'Saç kalitesi',
    texture: 'Saç yapısı',
    material: 'Saç materyali',
    baseType: 'Taban tipi',
    baseThickness: 'Taban kalınlığı',
    hairline: 'Saç çizgisi',
    direction: 'Saç yönü',
    grey: 'Beyaz saç oranı',
    bleached: 'Ağartılmış düğüm',
    yes: 'Evet',
    no: 'Hayır',
    heat: 'Isı ile şekillendirme',
    dyeable: 'Boyanabilir',
    stock: 'Stok'
  },

  en: {
    back: '← Back to shop',
    cart: 'Add to cart',
    favorite: '♡ Add to favorites',
    favoriteAdded: '♥ In favorites',
    quantity: 'Quantity',
    inStock: 'In stock',
    lowStock: 'Only a few left',
    soldOut: 'Out of stock',
    chooseVariant: 'Please select an available variant.',
    addedCart: 'Product added to cart.',
    addedFav: 'Product added to favorites.',
    removedFav: 'Product removed from favorites.',
    variants: 'Options',
    color: 'Color',
    length: 'Length',
    weight: 'Weight',
    strands: 'Strands',
    baseSize: 'Base size',
    density: 'Density',
    productDetails: 'Product details',
    extensionType: 'Extension type',
    hairQuality: 'Hair quality',
    texture: 'Texture',
    material: 'Hair material',
    baseType: 'Base type',
    baseThickness: 'Base thickness',
    hairline: 'Hairline',
    direction: 'Hair direction',
    grey: 'Grey hair',
    bleached: 'Bleached knots',
    yes: 'Yes',
    no: 'No',
    heat: 'Heat styling',
    dyeable: 'Dyeable',
    stock: 'Stock'
  }

};


/* =========================================
   START
========================================= */

async function initProductPage() {

  updateCartCount();
  updateFavoriteCount();
  bindGlobalActions();

  const params = new URLSearchParams(
    window.location.search
  );

  const identifier = params.get('product');

  if (!identifier) {
    showProductError(
      'Produkt konnte nicht gefunden werden.'
    );
    return;
  }

  await loadProduct(identifier);

}
async function loadProduct(identifier) {

  let result;

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(identifier);

  if (isUuid) {

    result = await productDb
      .from('products')
      .select('*')
      .eq('id', identifier)
      .eq('is_active', true)
      .maybeSingle();

  } else {

    result = await productDb
      .from('products')
      .select('*')
      .eq('slug', identifier)
      .eq('is_active', true)
      .maybeSingle();

  }

  const { data, error } = result;

  if (error || !data) {

    console.error('Product load error:', error);

    showProductError(
      'Produkt konnte nicht gefunden werden.'
    );

    return;
  }

  currentProduct = data;

  await Promise.all([
    loadProductVariants(data.id),
    loadProductMedia(data.id)
  ]);

  renderProduct();
}


/* =========================================
   LOAD VARIANTS
========================================= */

async function loadProductVariants(productId) {

  const { data, error } = await productDb
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .eq('is_active', true)
    .order('sort_order', {
      ascending: true
    });

  if (error) {
    console.error(
      'Variant error:',
      error
    );
    productVariants = [];
    return;
  }

  productVariants = data || [];

}


/* =========================================
   LOAD MEDIA
========================================= */

async function loadProductMedia(productId) {

  const { data, error } = await productDb
    .from('product_media')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', {
      ascending: true
    });

  if (error) {

    console.error(
      'Media error:',
      error
    );

    productMedia = [];

    return;

  }

  productMedia = data || [];

}


/* =========================================
   MAIN RENDER
========================================= */

function renderProduct() {

  if (!currentProduct) return;

  document.title =
    `${getProductName()} — ARDA HAIR`;

  $('productName').textContent =
    getProductName();

  $('productDescription').textContent =
    getProductDescription();

  $('productType').textContent =
    getProductTypeLabel();

  renderMedia();

  if (productVariants.length) {

    selectedVariant =
      productVariants.find(
        variant => variant.stock > 0
      ) ||
      productVariants[0];

  } else {

    selectedVariant = null;

  }

  renderOptions();
  renderHighlights();
  renderTechnicalDetails();
  renderPriceAndStock();
  renderCare();
  renderBoxContents();
  renderFavoriteButton();

}


/* =========================================
   LANG
========================================= */

function getProductName() {

  if (!currentProduct) return '';

  if (currentLang === 'tr') {
    return (
      currentProduct.name_tr ||
      currentProduct.name_de ||
      currentProduct.name_en ||
      ''
    );
  }

  if (currentLang === 'en') {
    return (
      currentProduct.name_en ||
      currentProduct.name_de ||
      currentProduct.name_tr ||
      ''
    );
  }

  return (
    currentProduct.name_de ||
    currentProduct.name_en ||
    currentProduct.name_tr ||
    ''
  );

}


function getProductDescription() {

  if (!currentProduct) return '';

  if (currentLang === 'tr') {
    return (
      currentProduct.description_tr ||
      currentProduct.description_de ||
      currentProduct.description_en ||
      ''
    );
  }

  if (currentLang === 'en') {
    return (
      currentProduct.description_en ||
      currentProduct.description_de ||
      currentProduct.description_tr ||
      ''
    );
  }

  return (
    currentProduct.description_de ||
    currentProduct.description_en ||
    currentProduct.description_tr ||
    ''
  );

}


function getProductTypeLabel() {

  if (
    currentProduct?.product_type ===
    'women_extension'
  ) {

    if (currentLang === 'tr') {
      return 'Kadın · Saç Kaynağı';
    }

    if (currentLang === 'en') {
      return 'Women · Hair Extensions';
    }

    return 'Frauen · Haarverlängerung';

  }

  if (
    currentProduct?.product_type ===
    'men_hair_system'
  ) {

    if (currentLang === 'tr') {
      return 'Erkek · Hair System';
    }

    if (currentLang === 'en') {
      return 'Men · Hair System';
    }

    return 'Männer · Hair System';

  }

  return 'ARDA HAIR';

}


/* =========================================
   MEDIA
========================================= */

function renderMedia() {

  const container = $('productMedia');

  if (!productMedia.length) {

    container.innerHTML = `
      <div class="product-main-placeholder">
        <span>ARDA</span>
        <small>HAIR</small>
      </div>
    `;

    return;
  }

  container.innerHTML =
    productMedia.map(media => {

      const {
        data
      } = productDb
        .storage
        .from('product-media')
        .getPublicUrl(media.path);

      const url =
        data?.publicUrl || '';

      if (
        media.media_type === 'video'
      ) {

        return `
          <video
            controls
            playsinline
            preload="metadata"
          >
            <source
              src="${escapeProductHtml(url)}"
            >
          </video>
        `;

      }

      return `
        <img
          src="${escapeProductHtml(url)}"
          alt="${escapeProductHtml(
            getMediaAlt(media)
          )}"
          loading="lazy"
        >
      `;

    }).join('');

}


function getMediaAlt(media) {

  if (currentLang === 'tr') {
    return (
      media.alt_tr ||
      media.alt_de ||
      getProductName()
    );
  }

  if (currentLang === 'en') {
    return (
      media.alt_en ||
      media.alt_de ||
      getProductName()
    );
  }

  return (
    media.alt_de ||
    getProductName()
  );

}


/* =========================================
   OPTIONS
========================================= */

function renderOptions() {

  const container =
    $('productOptions');

  if (!productVariants.length) {

    container.innerHTML = '';

    return;

  }

  const t =
    productTranslations[currentLang];

  if (
    currentProduct.product_type ===
    'women_extension'
  ) {

    renderWomenOptions(
      container,
      t
    );

  } else {

    renderMenOptions(
      container,
      t
    );

  }

}


function renderWomenOptions(
  container,
  t
) {

  const colors =
    uniqueValues(
      productVariants,
      'color_name'
    );

  const lengths =
    uniqueValues(
      productVariants,
      'length_cm'
    );

  const weights =
    uniqueValues(
      productVariants,
      'weight_g'
    );

  const strands =
    uniqueValues(
      productVariants,
      'strand_count'
    );

  container.innerHTML =
    createOptionGroup(
      t.color,
      colors,
      'color_name',
      value =>
        value || '—'
    ) +

    createOptionGroup(
      t.length,
      lengths,
      'length_cm',
      value =>
        `${value} cm`
    ) +

    createOptionGroup(
      t.weight,
      weights,
      'weight_g',
      value =>
        `${value} g`
    ) +

    createOptionGroup(
      t.strands,
      strands,
      'strand_count',
      value =>
        `${value}`
    );

}


function renderMenOptions(
  container,
  t
) {

  const colors =
    uniqueValues(
      productVariants,
      'color_name'
    );

  const lengths =
    uniqueValues(
      productVariants,
      'length_cm'
    );

  const baseSizes =
    [
      ...new Set(
        productVariants
          .filter(
            v =>
              v.base_width_cm &&
              v.base_length_cm
          )
          .map(
            v =>
              `${v.base_width_cm} × ${v.base_length_cm}`
          )
      )
    ];

  const densities =
    uniqueValues(
      productVariants,
      'density_percent'
    );

  container.innerHTML =
    createOptionGroup(
      t.color,
      colors,
      'color_name',
      value =>
        value || '—'
    ) +

    createOptionGroup(
      t.length,
      lengths,
      'length_cm',
      value =>
        `${value} cm`
    ) +

    createBaseSizeGroup(
      t.baseSize,
      baseSizes
    ) +

    createOptionGroup(
      t.density,
      densities,
      'density_percent',
      value =>
        `${value}%`
    );

}


function uniqueValues(
  array,
  key
) {

  return [
    ...new Set(
      array
        .map(item => item[key])
        .filter(
          value =>
            value !== null &&
            value !== undefined &&
            value !== ''
        )
    )
  ];

}


function createOptionGroup(
  label,
  values,
  field,
  formatter
) {

  if (!values.length) return '';

  return `
    <div class="option-group">

      <span class="option-label">
        ${escapeProductHtml(label)}
      </span>

      <div class="option-values">

        ${values.map(value => {

          const active =
            selectedVariant?.[field] === value;

          return `
            <button
              type="button"
              class="option-btn ${
                active ? 'active' : ''
              }"
              onclick="selectProductOption(
                '${field}',
                '${escapeJsValue(value)}'
              )"
            >
              ${escapeProductHtml(
                formatter(value)
              )}
            </button>
          `;

        }).join('')}

      </div>

    </div>
  `;

}


function createBaseSizeGroup(
  label,
  values
) {

  if (!values.length) return '';

  const active =
    selectedVariant?.base_width_cm &&
    selectedVariant?.base_length_cm
      ? `${selectedVariant.base_width_cm} × ${selectedVariant.base_length_cm}`
      : '';

  return `
    <div class="option-group">

      <span class="option-label">
        ${escapeProductHtml(label)}
      </span>

      <div class="option-values">

        ${values.map(value => `
          <button
            type="button"
            class="option-btn ${
              active === value
                ? 'active'
                : ''
            }"
            onclick="selectBaseSize(
              '${escapeJsValue(value)}'
            )"
          >
            ${escapeProductHtml(value)} cm
          </button>
        `).join('')}

      </div>

    </div>
  `;

}


/* =========================================
   SELECT VARIANT
========================================= */

window.selectProductOption =
function (
  field,
  rawValue
) {

  const numericFields = [
    'length_cm',
    'weight_g',
    'strand_count',
    'density_percent'
  ];

  const value =
    numericFields.includes(field)
      ? Number(rawValue)
      : rawValue;

  const candidates =
    productVariants.filter(
      variant =>
        variant[field] === value
    );

  if (!candidates.length) return;

  const closest =
    candidates.find(
      candidate =>
        variantMatchesCurrent(
          candidate,
          field
        )
    );

  selectedVariant =
    closest ||
    candidates.find(
      variant =>
        variant.stock > 0
    ) ||
    candidates[0];

  renderOptions();
  renderPriceAndStock();
  renderHighlights();
  renderTechnicalDetails();

};


window.selectBaseSize =
function (value) {

  const [
    width,
    length
  ] = value
    .split('×')
    .map(
      part =>
        Number(part.trim())
    );

  const candidates =
    productVariants.filter(
      variant =>
        Number(
          variant.base_width_cm
        ) === width &&
        Number(
          variant.base_length_cm
        ) === length
    );

  if (!candidates.length) return;

  selectedVariant =
    candidates.find(
      variant =>
        variant.stock > 0
    ) ||
    candidates[0];

  renderOptions();
  renderPriceAndStock();
  renderHighlights();
  renderTechnicalDetails();

};


function variantMatchesCurrent(
  candidate,
  ignoredField
) {

  if (!selectedVariant) {
    return false;
  }

  const fields = [
    'color_name',
    'length_cm',
    'weight_g',
    'strand_count',
    'base_width_cm',
    'base_length_cm',
    'density_percent'
  ];

  return fields
    .filter(
      field =>
        field !== ignoredField
    )
    .every(
      field =>
        selectedVariant[field] == null ||
        candidate[field] == null ||
        selectedVariant[field] ===
          candidate[field]
    );

}


/* =========================================
   PRICE & STOCK
========================================= */

function renderPriceAndStock() {

  const t =
    productTranslations[currentLang];

  const priceCents =
    selectedVariant?.price_cents ??
    currentProduct.price_cents ??
    0;

  $('productPrice').textContent =
    formatProductMoney(
      priceCents
    );

  const compare =
    selectedVariant
      ?.compare_at_price_cents ??
    currentProduct
      .compare_at_price_cents;

  if (
    compare &&
    compare > priceCents
  ) {

    $('productComparePrice').hidden =
      false;

    $('productComparePrice')
      .textContent =
      formatProductMoney(compare);

  } else {

    $('productComparePrice').hidden =
      true;

  }

  const stock =
    selectedVariant
      ? Number(
          selectedVariant.stock || 0
        )
      : Number(
          currentProduct.stock || 0
        );

  if (stock <= 0) {

    $('productStock').textContent =
      t.soldOut;

    $('addToCart').disabled =
      true;

  } else if (stock <= 3) {

    $('productStock').textContent =
      `${t.lowStock} · ${stock}`;

    $('addToCart').disabled =
      false;

  } else {

    $('productStock').textContent =
      `${t.inStock} · ${stock}`;

    $('addToCart').disabled =
      false;

  }

  $('addToCart').textContent =
    t.cart;

}


/* =========================================
   HIGHLIGHTS
========================================= */

function renderHighlights() {

  const container =
    $('productHighlights');

  const items = [];

  if (
    currentProduct.product_type ===
    'women_extension'
  ) {

    pushHighlight(
      items,
      'Typ',
      currentProduct.extension_type
    );

    pushHighlight(
      items,
      'Qualität',
      currentProduct.quality_grade
    );

    pushHighlight(
      items,
      'Struktur',
      currentProduct.texture
    );

    pushHighlight(
      items,
      'Länge',
      selectedVariant?.length_cm
        ? `${selectedVariant.length_cm} cm`
        : currentProduct.length_cm
          ? `${currentProduct.length_cm} cm`
          : null
    );

    pushHighlight(
      items,
      'Gewicht',
      selectedVariant?.weight_g
        ? `${selectedVariant.weight_g} g`
        : currentProduct.weight_g
          ? `${currentProduct.weight_g} g`
          : null
    );

    pushHighlight(
      items,
      'Strähnen',
      selectedVariant?.strand_count ||
      currentProduct.strand_count
    );

  } else {

    pushHighlight(
      items,
      'Base',
      currentProduct.base_type
    );

    pushHighlight(
      items,
      'Density',
      selectedVariant?.density_percent
        ? `${selectedVariant.density_percent}%`
        : currentProduct.density_percent
          ? `${currentProduct.density_percent}%`
          : null
    );

    pushHighlight(
      items,
      'Länge',
      selectedVariant?.length_cm
        ? `${selectedVariant.length_cm} cm`
        : currentProduct.length_cm
          ? `${currentProduct.length_cm} cm`
          : null
    );

    pushHighlight(
      items,
      'Material',
      currentProduct.hair_material
    );

  }

  container.innerHTML =
    items.map(item => `
      <div class="product-highlight">
        <small>
          ${escapeProductHtml(item.label)}
        </small>
        <strong>
          ${escapeProductHtml(item.value)}
        </strong>
      </div>
    `).join('');

}


function pushHighlight(
  array,
  label,
  value
) {

  if (
    value !== null &&
    value !== undefined &&
    value !== ''
  ) {
    array.push({
      label,
      value
    });
  }

}


/* =========================================
   TECHNICAL DETAILS
========================================= */

function renderTechnicalDetails() {

  const t =
    productTranslations[currentLang];

  const rows = [];

  if (
    currentProduct.product_type ===
    'women_extension'
  ) {

    addTechnicalRow(
      rows,
      t.extensionType,
      currentProduct.extension_type
    );

    addTechnicalRow(
      rows,
      t.hairQuality,
      currentProduct.quality_grade
    );

    addTechnicalRow(
      rows,
      t.texture,
      currentProduct.texture
    );

    
    /* PRODUCT DETAILS EXTRA FIELDS */

    addTechnicalRow(
      rows,
      t.color,
      selectedVariant?.color_name ||
      currentProduct.color
    );

    addTechnicalRow(
      rows,
      t.length,
      selectedVariant?.length_cm
        ? selectedVariant.length_cm + ' cm'
        : currentProduct.length_cm
          ? currentProduct.length_cm + ' cm'
          : null
    );

    addTechnicalRow(
      rows,
      t.weight,
      selectedVariant?.weight_g
        ? selectedVariant.weight_g + ' g'
        : currentProduct.weight_g
          ? currentProduct.weight_g + ' g'
          : null
    );

    addTechnicalRow(
      rows,
      t.strands,
      selectedVariant?.strand_count ||
      currentProduct.strand_count
    );

    addTechnicalRow(
      rows,
      t.dyeable,
      booleanText(
        currentProduct.dyeable
      )
    );

    addTechnicalRow(
      rows,
      t.heat,
      booleanText(
        currentProduct.heat_styleable
      )
    );

  } else {

    addTechnicalRow(
      rows,
      t.baseType,
      currentProduct.base_type
    );

    addTechnicalRow(
      rows,
      t.baseSize,
      currentProduct.base_width_cm &&
      currentProduct.base_length_cm
        ? `${currentProduct.base_width_cm} × ${currentProduct.base_length_cm} cm`
        : null
    );

    addTechnicalRow(
      rows,
      t.baseThickness,
      currentProduct.base_thickness_mm
        ? `${currentProduct.base_thickness_mm} mm`
        : null
    );

    addTechnicalRow(
      rows,
      t.density,
      currentProduct.density_percent
        ? `${currentProduct.density_percent}%`
        : null
    );

    addTechnicalRow(
      rows,
      t.material,
      currentProduct.hair_material
    );

    addTechnicalRow(
      rows,
      t.texture,
      currentProduct.texture
    );

    addTechnicalRow(
      rows,
      t.hairline,
      currentProduct.hairline
    );

    addTechnicalRow(
      rows,
      t.direction,
      currentProduct.hair_direction
    );

    addTechnicalRow(
      rows,
      t.grey,
      currentProduct.grey_percent != null
        ? `${currentProduct.grey_percent}%`
        : null
    );

    addTechnicalRow(
      rows,
      t.bleached,
      booleanText(
        currentProduct.bleached_knots
      )
    );

  }

  $('technicalDetails').innerHTML =
    `
      <div class="technical-table">
        ${
          rows.length
            ? rows.join('')
            : '—'
        }
      </div>
    `;

}


function addTechnicalRow(
  array,
  label,
  value
) {

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return;
  }

  array.push(`
    <div class="technical-row">

      <span>
        ${escapeProductHtml(label)}
      </span>

      <span>
        ${escapeProductHtml(value)}
      </span>

    </div>
  `);

}


function booleanText(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const t =
    productTranslations[currentLang];

  return value
    ? t.yes
    : t.no;

}


/* =========================================
   CARE / BOX
========================================= */

function renderCare() {

  const text =
    currentLang === 'tr'
      ? currentProduct.care_tr
      : currentLang === 'en'
        ? currentProduct.care_en
        : currentProduct.care_de;

  if (text) {
    $('careInformation')
      .textContent = text;
  }

}


function renderBoxContents() {

  const text =
    currentLang === 'tr'
      ? currentProduct.box_contents_tr
      : currentLang === 'en'
        ? currentProduct.box_contents_en
        : currentProduct.box_contents_de;

  if (text) {
    $('boxContents')
      .textContent = text;
  }

}


/* =========================================
   CART
========================================= */

function addCurrentProductToCart() {

  if (!currentProduct) return;

  const stock =
    selectedVariant
      ? Number(
          selectedVariant.stock || 0
        )
      : Number(
          currentProduct.stock || 0
        );

  if (stock <= 0) {

    $('productMessage')
      .textContent =
      productTranslations[
        currentLang
      ].soldOut;

    return;

  }

  const quantity =
    Number(
      $('quantity').value || 1
    );

  const key =
    `${currentProduct.id}::${
      selectedVariant?.id ||
      'default'
    }`;

  const existing =
    cart.find(
      item =>
        item.key === key
    );

  if (existing) {

    existing.quantity += quantity;

  } else {

    cart.push({

      key,

      productId:
        currentProduct.id,

      variantId:
        selectedVariant?.id ||
        null,

      slug:
        currentProduct.slug,

      name:
        getProductName(),

      price_cents:
        selectedVariant
          ?.price_cents ??
        currentProduct
          .price_cents,

      quantity,

      image:
        getFirstProductImage(),

      variant:
        getVariantSummary()

    });

  }

  saveCart();

  $('productMessage')
    .textContent =
    productTranslations[
      currentLang
    ].addedCart;

  renderCartDrawer();

}


function saveCart() {

  localStorage.setItem(
    'ardaHairCart',
    JSON.stringify(cart)
  );

  updateCartCount();

}


function updateCartCount() {

  const count =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(
          item.quantity || 0
        ),
      0
    );

  $('productCartCount')
    .textContent = count;

}


function renderCartDrawer() {

  const container = $('productCartItems');

  if (!cart.length) {
    container.textContent =
      currentLang === 'tr'
        ? 'Sepetin henüz boş.'
        : currentLang === 'en'
          ? 'Your cart is empty.'
          : 'Dein Warenkorb ist noch leer.';
    return;
  }

  container.innerHTML =
    cart.map((item, index) => `
      <div class="product-drawer-item">

        <div class="product-drawer-thumb">
          ${
            item.image
              ? `<img src="${escapeProductHtml(item.image)}" alt="">`
              : ''
          }
        </div>

        <div class="product-drawer-info">

          <strong>
            ${escapeProductHtml(item.name)}
          </strong>

          <small>
            ${escapeProductHtml(item.variant || '')}
          </small>

          <small>
            ${formatProductMoney(item.price_cents)}
          </small>

          <div class="product-cart-controls">

            <button
              type="button"
              onclick="changeProductCartQuantity(${index}, -1)"
            >−</button>

            <strong>
              ${Number(item.quantity || 1)}
            </strong>

            <button
              type="button"
              onclick="changeProductCartQuantity(${index}, 1)"
            >+</button>

            <button
              type="button"
              onclick="removeProductCartItem(${index})"
            >
              ${
                currentLang === 'tr'
                  ? 'Kaldır'
                  : currentLang === 'en'
                    ? 'Remove'
                    : 'Entfernen'
              }
            </button>

          </div>

        </div>

      </div>
    `).join('');

}


window.changeProductCartQuantity =
function(index, delta) {

  const item = cart[index];
  if (!item) return;

  const next =
    Number(item.quantity || 1) +
    Number(delta || 0);

  if (next <= 0) {
    cart.splice(index, 1);
  } else {
    item.quantity = Math.min(99, next);
  }

  saveCart();
  renderCartDrawer();

};


window.removeProductCartItem =
function(index) {

  if (!cart[index]) return;

  cart.splice(index, 1);

  saveCart();
  renderCartDrawer();

};


/* =========================================
   FAVORITES
========================================= */

function toggleFavorite() {

  if (!currentProduct) return;

  const index =
    favorites.findIndex(
      item =>
        item.productId ===
        currentProduct.id
    );

  if (index >= 0) {

    favorites.splice(
      index,
      1
    );

    $('productMessage')
      .textContent =
      productTranslations[
        currentLang
      ].removedFav;

  } else {

    favorites.push({

      productId:
        currentProduct.id,

      slug:
        currentProduct.slug,

      name:
        getProductName(),

      image:
        getFirstProductImage(),

      price_cents:
        currentProduct.price_cents

    });

    $('productMessage')
      .textContent =
      productTranslations[
        currentLang
      ].addedFav;

  }

  localStorage.setItem(
    'ardaHairFavorites',
    JSON.stringify(favorites)
  );

  updateFavoriteCount();
  renderFavoriteButton();
  renderFavoritesDrawer();

}


function renderFavoriteButton() {

  if (!currentProduct) return;

  const active =
    favorites.some(
      item =>
        item.productId ===
        currentProduct.id
    );

  $('addToFavorites')
    .textContent =
    active
      ? productTranslations[
          currentLang
        ].favoriteAdded
      : productTranslations[
          currentLang
        ].favorite;

}


function updateFavoriteCount() {

  $('productFavCount')
    .textContent =
    favorites.length;

}


function renderFavoritesDrawer() {

  const container =
    $('productFavItems');

  if (!favorites.length) {

    container.textContent =
      currentLang === 'tr'
        ? 'Henüz favorin yok.'
        : currentLang === 'en'
          ? 'You have no favorites yet.'
          : 'Du hast noch keine Favoriten gespeichert.';

    return;

  }

  container.innerHTML =
    favorites.map(item => `
      <div class="product-drawer-item">

        <div class="product-drawer-thumb">

          ${
            item.image
              ? `
                <img
                  src="${escapeProductHtml(item.image)}"
                  alt=""
                >
              `
              : ''
          }

        </div>

        <div>

          <strong>
            ${escapeProductHtml(item.name)}
          </strong>

          <small>
            ${formatProductMoney(item.price_cents)}
          </small>

        </div>

      </div>
    `).join('');

}


/* =========================================
   DRAWERS
========================================= */

function openDrawer(id) {

  $(id).classList.add('open');

  $('productBackdrop')
    .classList.add('show');

}


function closeProductDrawers() {

  $('productCartDrawer')
    .classList.remove('open');

  $('productFavDrawer')
    .classList.remove('open');

  $('productBackdrop')
    .classList.remove('show');

}


/* =========================================
   GLOBAL ACTIONS
========================================= */

function bindGlobalActions() {

  document
    .querySelectorAll(
      '[data-product-lang]'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          currentLang =
            button.dataset
              .productLang;

          document
            .querySelectorAll(
              '[data-product-lang]'
            )
            .forEach(
              el =>
                el.classList.remove(
                  'active'
                )
            );

          button.classList.add(
            'active'
          );

          if (currentProduct) {
            renderProduct();
          }

        }
      );

    });


  $('quantityMinus')
    .addEventListener(
      'click',
      () => {

        const input =
          $('quantity');

        input.value =
          Math.max(
            1,
            Number(
              input.value || 1
            ) - 1
          );

      }
    );


  $('quantityPlus')
    .addEventListener(
      'click',
      () => {

        const input =
          $('quantity');

        const max =
          selectedVariant
            ? Number(
                selectedVariant
                  .stock || 1
              )
            : Number(
                currentProduct
                  ?.stock || 99
              );

        input.value =
          Math.min(
            Math.max(
              1,
              max
            ),
            Number(
              input.value || 1
            ) + 1
          );

      }
    );


  $('addToCart')
    .addEventListener(
      'click',
      addCurrentProductToCart
    );


  $('addToFavorites')
    .addEventListener(
      'click',
      toggleFavorite
    );


  $('productCartButton')
    .addEventListener(
      'click',
      () => {

        renderCartDrawer();

        openDrawer(
          'productCartDrawer'
        );

      }
    );


  $('productFavButton')
    .addEventListener(
      'click',
      () => {

        renderFavoritesDrawer();

        openDrawer(
          'productFavDrawer'
        );

      }
    );


  $('closeProductCart')
    .addEventListener(
      'click',
      closeProductDrawers
    );


  $('closeProductFav')
    .addEventListener(
      'click',
      closeProductDrawers
    );


  $('productBackdrop')
    .addEventListener(
      'click',
      closeProductDrawers
    );

}


/* =========================================
   HELPERS
========================================= */

function getFirstProductImage() {

  const media =
    productMedia.find(
      item =>
        item.media_type ===
        'image'
    );

  if (!media) return '';

  const {
    data
  } = productDb
    .storage
    .from('product-media')
    .getPublicUrl(media.path);

  return data?.publicUrl || '';

}


function getVariantSummary() {

  if (!selectedVariant) {
    return '';
  }

  const values = [];

  if (
    selectedVariant.color_name
  ) {
    values.push(
      selectedVariant.color_name
    );
  }

  if (
    selectedVariant.length_cm
  ) {
    values.push(
      `${selectedVariant.length_cm} cm`
    );
  }

  if (
    selectedVariant.weight_g
  ) {
    values.push(
      `${selectedVariant.weight_g} g`
    );
  }

  if (
    selectedVariant.base_width_cm &&
    selectedVariant.base_length_cm
  ) {
    values.push(
      `${selectedVariant.base_width_cm} × ${selectedVariant.base_length_cm} cm`
    );
  }

  if (
    selectedVariant.density_percent
  ) {
    values.push(
      `${selectedVariant.density_percent}%`
    );
  }

  return values.join(' · ');

}


function formatProductMoney(cents) {

  return (
    Number(cents || 0) /
    100
  ).toLocaleString(
    'de-DE',
    {
      style: 'currency',
      currency: 'EUR'
    }
  );

}


function escapeProductHtml(
  value = ''
) {

  return String(
    value ?? ''
  ).replace(
    /[&<>"']/g,
    char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[char]
  );

}


function escapeJsValue(
  value = ''
) {

  return String(
    value ?? ''
  )
    .replace(
      /\\/g,
      '\\\\'
    )
    .replace(
      /'/g,
      "\\'"
    );

}


function showProductError(
  message
) {

  $('productName')
    .textContent =
    'Produkt nicht gefunden';

  $('productDescription')
    .textContent = message;

  $('productStock')
    .textContent = '';

  $('productPrice')
    .textContent = '—';

  $('addToCart').disabled =
    true;

}


/* =========================================
   GO
========================================= */

initProductPage();
