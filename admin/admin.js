const SUPABASE_URL = 'https://zehtftzxrjuoqcpcqmcs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wUwY1wDw05gblt9WVOMT6Q_xxIcGKvF';
const ADMIN_EMAIL = 'kaanyildo12@gmail.com';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = (id) => document.getElementById(id);

let products = [];
let currentVariants = [];

/* =========================
   AUTH
========================= */

async function boot() {
  const {
    data: { session }
  } = await sb.auth.getSession();

  if (session?.user?.email?.toLowerCase() === ADMIN_EMAIL) {
    showDashboard();
  } else {
    showLogin();
  }

  sb.auth.onAuthStateChange((_event, session) => {
    if (session?.user?.email?.toLowerCase() === ADMIN_EMAIL) {
      showDashboard();
    } else {
      showLogin();
    }
  });
}

function showLogin() {
  $('login').hidden = false;
  $('dashboard').hidden = true;
  $('logout').hidden = true;
}

async function showDashboard() {
  $('login').hidden = true;
  $('dashboard').hidden = false;
  $('logout').hidden = false;

  await loadProducts();
}

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  $('loginMsg').textContent = 'Anmeldung...';

  const email = $('email').value.trim().toLowerCase();
  const password = $('password').value;

  if (email !== ADMIN_EMAIL) {
    $('loginMsg').textContent = 'Dieses Konto ist nicht als Admin autorisiert.';
    return;
  }

  const { error } = await sb.auth.signInWithPassword({
    email,
    password
  });

  $('loginMsg').textContent = error
    ? error.message
    : 'Anmeldung erfolgreich.';
});

$('logout').addEventListener('click', async () => {
  await sb.auth.signOut();
});

/* =========================
   PRODUCT TYPE
========================= */

$('productType').addEventListener('change', () => {
  updateProductTypeFields();
});

function updateProductTypeFields() {
  const type = $('productType').value;

  $('femaleFields').hidden = type !== 'women_extension';
  $('maleFields').hidden = type !== 'men_hair_system';
}

/* =========================
   PRODUCTS
========================= */

async function loadProducts() {
  const { data, error } = await sb
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    $('products').innerHTML = `
      <div class="card">
        ${escapeHtml(error.message)}
      </div>
    `;
    return;
  }

  products = data || [];

  renderProducts();
}

function renderProducts() {
  if (!products.length) {
    $('products').innerHTML = `
      <div class="card">
        Noch keine Produkte vorhanden.
      </div>
    `;
    return;
  }

  $('products').innerHTML = products.map((product) => {
    const typeLabel =
      product.product_type === 'women_extension'
        ? 'Frauen · Extensions'
        : product.product_type === 'men_hair_system'
          ? 'Männer · Hair System'
          : 'Produkt';

    return `
      <article class="card">

        <div>
          <small>${escapeHtml(typeLabel)}</small>
        </div>

        <h3>${escapeHtml(product.name_de || '')}</h3>

        <div>
          ${formatMoney(product.price_cents)}
          · Bestand ${product.stock ?? 0}
        </div>

        <div>
          ${product.is_active ? '🟢 Veröffentlicht' : '⚪ Entwurf'}
          ${product.featured ? ' · ⭐ Hervorgehoben' : ''}
        </div>

        <button onclick="editProduct('${product.id}')">
          Bearbeiten
        </button>

      </article>
    `;
  }).join('');
}

function formatMoney(cents) {
  return `${((cents || 0) / 100).toFixed(2)} €`;
}

function escapeHtml(value = '') {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char];
  });
}

/* =========================
   EDITOR
========================= */

$('newProduct').addEventListener('click', () => {
  openEditor();
});

$('closeEditor').addEventListener('click', () => {
  $('editor').close();
});

window.editProduct = async function (id) {
  const product = products.find((item) => item.id === id);

  if (!product) return;

  await openEditor(product);
};

function setValue(id, value) {
  const el = $(id);

  if (!el) return;

  el.value = value ?? '';
}

function setChecked(id, value) {
  const el = $(id);

  if (!el) return;

  el.checked = !!value;
}

async function openEditor(product = {}) {
  $('editorMsg').textContent = '';

  setValue('productId', product.id);
  setValue('productType', product.product_type);

  setValue('slug', product.slug);
  setValue('category', product.category);

  setValue(
    'price',
    product.price_cents != null
      ? product.price_cents / 100
      : ''
  );

  setValue('stock', product.stock ?? 0);

  setValue('nameDe', product.name_de);
  setValue('nameTr', product.name_tr);
  setValue('nameEn', product.name_en);

  setValue('descDe', product.description_de);
  setValue('descTr', product.description_tr);
  setValue('descEn', product.description_en);

  setValue('careDe', product.care_de);
  setValue('careTr', product.care_tr);
  setValue('careEn', product.care_en);

  setValue('boxDe', product.box_contents_de);
  setValue('boxTr', product.box_contents_tr);
  setValue('boxEn', product.box_contents_en);

  setValue(
    'attachmentMethods',
    Array.isArray(product.attachment_methods)
      ? product.attachment_methods.join(', ')
      : ''
  );

  setValue('lifespanDe', product.lifespan_note_de);
  setValue('lifespanTr', product.lifespan_note_tr);
  setValue('lifespanEn', product.lifespan_note_en);

  setValue('shippingDe', product.shipping_return_de);
  setValue('shippingTr', product.shipping_return_tr);
  setValue('shippingEn', product.shipping_return_en);

  /* WOMEN */

  setValue('extensionType', product.extension_type);
  setValue('hairQuality', product.quality_grade);
  setValue('texture', product.texture);
  setValue('color', product.color);
  setValue('length', product.length_cm);
  setValue('weight', product.weight_g);
  setValue('strandCount', product.strand_count);
  setValue('strandWeight', product.unit_weight_g);

  setValue(
    'canColor',
    product.dyeable === true
      ? 'yes'
      : product.dyeable === false
        ? 'no'
        : ''
  );

  setValue(
    'heatSafe',
    product.heat_styleable === true
      ? 'yes'
      : product.heat_styleable === false
        ? 'no'
        : ''
  );

  /* MEN */

  setValue('baseType', product.base_type);
  setValue('baseWidth', product.base_width_cm);
  setValue('baseLength', product.base_length_cm);
  setValue('baseThickness', product.base_thickness_mm);
  setValue('density', product.density_percent);
  setValue('maleColor', product.color);
  setValue('maleLength', product.length_cm);
  setValue('maleTexture', product.texture);
  setValue('maleHairQuality', product.hair_material);
  setValue('greyPercentage', product.grey_percent ?? 0);
  setValue('hairline', product.hairline);
  setValue('hairDirection', product.hair_direction);

  setValue(
    'bleachedKnots',
    product.bleached_knots === true
      ? 'yes'
      : product.bleached_knots === false
        ? 'no'
        : ''
  );

  setChecked('active', product.is_active);
  setChecked('featured', product.featured);

  $('media').value = '';

  if ($('mediaFileName')) {
    $('mediaFileName').textContent =
      'Noch keine Datei ausgewählt.';
  }

  $('deleteProduct').style.display =
    product.id ? 'inline-block' : 'none';

  updateProductTypeFields();

  if (product.id) {
    await loadVariants(product.id);
  } else {
    currentVariants = [];
    renderVariants();
  }

  $('editor').showModal();
}

/* =========================
   VARIANTS
========================= */

$('addVariant').addEventListener('click', () => {
  const type = $('productType').value;

  const variant = {
    temp_id: crypto.randomUUID(),
    sku: '',
    color_name: '',
    color_code: '',
    length_cm: null,
    weight_g: null,
    strand_count: null,
    base_width_cm: null,
    base_length_cm: null,
    density_percent: null,
    price_cents: 0,
    stock: 0,
    is_active: true
  };

  if (type === 'women_extension') {
    variant.length_cm = Number($('length').value || 0) || null;
    variant.weight_g = Number($('weight').value || 0) || null;
    variant.strand_count = Number($('strandCount').value || 0) || null;
    variant.color_name = $('color').value || '';
  }

  if (type === 'men_hair_system') {
    variant.length_cm = Number($('maleLength').value || 0) || null;
    variant.base_width_cm = Number($('baseWidth').value || 0) || null;
    variant.base_length_cm = Number($('baseLength').value || 0) || null;
    variant.density_percent = Number($('density').value || 0) || null;
    variant.color_name = $('maleColor').value || '';
  }

  variant.price_cents = Math.round(
    Number($('price').value || 0) * 100
  );

  variant.stock = Number($('stock').value || 0);

  currentVariants.push(variant);

  renderVariants();
});

async function loadVariants(productId) {
  const { data, error } = await sb
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error(error);
    currentVariants = [];
    renderVariants();
    return;
  }

  currentVariants = (data || []).map((variant) => ({
    ...variant,
    temp_id: variant.id
  }));

  renderVariants();
}

function renderVariants() {
  const container = $('variantRows');

  if (!currentVariants.length) {
    container.innerHTML = `
      <p style="opacity:.7;margin-top:18px">
        Noch keine Varianten hinzugefügt.
      </p>
    `;
    return;
  }

  const type = $('productType').value;

  container.innerHTML = currentVariants.map((variant, index) => {

    let specialFields = '';

    if (type === 'women_extension') {
      specialFields = `
        <label>
          Farbe
          <input
            value="${escapeHtml(variant.color_name || '')}"
            onchange="updateVariant(${index}, 'color_name', this.value)"
          >
        </label>

        <label>
          Farbcode
          <input
            value="${escapeHtml(variant.color_code || '')}"
            placeholder="#2 / #613"
            onchange="updateVariant(${index}, 'color_code', this.value)"
          >
        </label>

        <label>
          Länge (cm)
          <input
            type="number"
            value="${variant.length_cm ?? ''}"
            onchange="updateVariant(${index}, 'length_cm', this.value)"
          >
        </label>

        <label>
          Gewicht (g)
          <input
            type="number"
            value="${variant.weight_g ?? ''}"
            onchange="updateVariant(${index}, 'weight_g', this.value)"
          >
        </label>

        <label>
          Strähnen
          <input
            type="number"
            value="${variant.strand_count ?? ''}"
            onchange="updateVariant(${index}, 'strand_count', this.value)"
          >
        </label>
      `;
    }

    if (type === 'men_hair_system') {
      specialFields = `
        <label>
          Farbe
          <input
            value="${escapeHtml(variant.color_name || '')}"
            onchange="updateVariant(${index}, 'color_name', this.value)"
          >
        </label>

        <label>
          Farbcode
          <input
            value="${escapeHtml(variant.color_code || '')}"
            onchange="updateVariant(${index}, 'color_code', this.value)"
          >
        </label>

        <label>
          Haarlänge (cm)
          <input
            type="number"
            value="${variant.length_cm ?? ''}"
            onchange="updateVariant(${index}, 'length_cm', this.value)"
          >
        </label>

        <label>
          Base Breite
          <input
            type="number"
            step="0.1"
            value="${variant.base_width_cm ?? ''}"
            onchange="updateVariant(${index}, 'base_width_cm', this.value)"
          >
        </label>

        <label>
          Base Länge
          <input
            type="number"
            step="0.1"
            value="${variant.base_length_cm ?? ''}"
            onchange="updateVariant(${index}, 'base_length_cm', this.value)"
          >
        </label>

        <label>
          Density %
          <input
            type="number"
            value="${variant.density_percent ?? ''}"
            onchange="updateVariant(${index}, 'density_percent', this.value)"
          >
        </label>
      `;
    }

    return `
      <div
        style="
          margin-top:18px;
          padding:18px;
          border:1px solid #ddd;
          border-radius:16px;
        "
      >

        <strong>Variante ${index + 1}</strong>

        <label>
          SKU
          <input
            value="${escapeHtml(variant.sku || '')}"
            placeholder="ARDA-001"
            onchange="updateVariant(${index}, 'sku', this.value)"
          >
        </label>

        ${specialFields}

        <label>
          Preis (€)
          <input
            type="number"
            step="0.01"
            min="0"
            value="${((variant.price_cents || 0) / 100).toFixed(2)}"
            onchange="updateVariantPrice(${index}, this.value)"
          >
        </label>

        <label>
          Bestand
          <input
            type="number"
            min="0"
            value="${variant.stock ?? 0}"
            onchange="updateVariant(${index}, 'stock', this.value)"
          >
        </label>

        <label>
          <input
            type="checkbox"
            ${variant.is_active ? 'checked' : ''}
            onchange="updateVariantBoolean(${index}, 'is_active', this.checked)"
          >
          Aktiv
        </label>

        <button
          type="button"
          class="danger"
          onclick="removeVariant(${index})"
        >
          Variante entfernen
        </button>

      </div>
    `;
  }).join('');
}

window.updateVariant = function (index, field, value) {
  const numberFields = [
    'length_cm',
    'weight_g',
    'strand_count',
    'base_width_cm',
    'base_length_cm',
    'density_percent',
    'stock'
  ];

  currentVariants[index][field] =
    numberFields.includes(field)
      ? value === ''
        ? null
        : Number(value)
      : value;
};

window.updateVariantPrice = function (index, value) {
  currentVariants[index].price_cents =
    Math.round(Number(value || 0) * 100);
};

window.updateVariantBoolean = function (index, field, value) {
  currentVariants[index][field] = value;
};

window.removeVariant = function (index) {
  currentVariants.splice(index, 1);
  renderVariants();
};

/* =========================
   SAVE PRODUCT
========================= */

$('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  $('editorMsg').textContent = 'Speichern...';

  const productId = $('productId').value;
  const productType = $('productType').value;

  if (!productType) {
    $('editorMsg').textContent = 'Bitte Produkttyp auswählen.';
    return;
  }

  const basePayload = {
    product_type: productType,

    slug: $('slug').value.trim(),

    name_de: $('nameDe').value.trim(),
    name_tr: $('nameTr').value.trim() || null,
    name_en: $('nameEn').value.trim() || null,

    description_de: $('descDe').value.trim() || null,
    description_tr: $('descTr').value.trim() || null,
    description_en: $('descEn').value.trim() || null,

    care_de: $('careDe').value.trim() || null,
    care_tr: $('careTr').value.trim() || null,
    care_en: $('careEn').value.trim() || null,

    box_contents_de: $('boxDe').value.trim() || null,
    box_contents_tr: $('boxTr').value.trim() || null,
    box_contents_en: $('boxEn').value.trim() || null,

    attachment_methods:
      $('attachmentMethods').value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean),

    lifespan_note_de:
      $('lifespanDe').value.trim() || null,
    lifespan_note_tr:
      $('lifespanTr').value.trim() || null,
    lifespan_note_en:
      $('lifespanEn').value.trim() || null,

    shipping_return_de:
      $('shippingDe').value.trim() || null,
    shipping_return_tr:
      $('shippingTr').value.trim() || null,
    shipping_return_en:
      $('shippingEn').value.trim() || null,

    category: $('category').value.trim() || null,

    price_cents: Math.round(
      Number($('price').value || 0) * 100
    ),

    stock: Number($('stock').value || 0),

    currency: 'EUR',

    is_active: $('active').checked,
    featured: $('featured').checked
  };

  if (productType === 'women_extension') {
    Object.assign(basePayload, {
      extension_type: $('extensionType').value || null,
      quality_grade: $('hairQuality').value || null,
      hair_material: $('hairQuality').value || null,

      texture: $('texture').value || null,
      color: $('color').value.trim() || null,

      length_cm:
        $('length').value
          ? Number($('length').value)
          : null,

      weight_g:
        $('weight').value
          ? Number($('weight').value)
          : null,

      strand_count:
        $('strandCount').value
          ? Number($('strandCount').value)
          : null,

      unit_weight_g:
        $('strandWeight').value
          ? Number($('strandWeight').value)
          : null,

      dyeable:
        $('canColor').value === ''
          ? null
          : $('canColor').value === 'yes',

      heat_styleable:
        $('heatSafe').value === ''
          ? null
          : $('heatSafe').value === 'yes',

      base_type: null,
      base_width_cm: null,
      base_length_cm: null,
      base_thickness_mm: null,
      density_percent: null,
      hairline: null,
      hair_direction: null,
      grey_percent: null,
      bleached_knots: null
    });
  }

  if (productType === 'men_hair_system') {
    Object.assign(basePayload, {
      extension_type: null,

      hair_material:
        $('maleHairQuality').value || null,

      quality_grade:
        $('maleHairQuality').value || null,

      texture:
        $('maleTexture').value || null,

      color:
        $('maleColor').value.trim() || null,

      length_cm:
        $('maleLength').value
          ? Number($('maleLength').value)
          : null,

      weight_g: null,

      base_type:
        $('baseType').value || null,

      base_width_cm:
        $('baseWidth').value
          ? Number($('baseWidth').value)
          : null,

      base_length_cm:
        $('baseLength').value
          ? Number($('baseLength').value)
          : null,

      base_thickness_mm:
        $('baseThickness').value
          ? Number($('baseThickness').value)
          : null,

      density_percent:
        $('density').value
          ? Number($('density').value)
          : null,

      grey_percent:
        $('greyPercentage').value
          ? Number($('greyPercentage').value)
          : 0,

      hairline:
        $('hairline').value || null,

      hair_direction:
        $('hairDirection').value || null,

      bleached_knots:
        $('bleachedKnots').value === ''
          ? null
          : $('bleachedKnots').value === 'yes',

      strand_count: null,
      unit_weight_g: null,
      dyeable: null,
      heat_styleable: null
    });
  }

  let productResult;

  if (productId) {
    productResult = await sb
      .from('products')
      .update(basePayload)
      .eq('id', productId)
      .select()
      .single();
  } else {
    productResult = await sb
      .from('products')
      .insert(basePayload)
      .select()
      .single();
  }

  if (productResult.error) {
    $('editorMsg').textContent =
      productResult.error.message;
    return;
  }

  const savedProduct = productResult.data;

  const variantsSaved = await saveVariants(savedProduct.id);

  if (!variantsSaved) return;

  const mediaSaved = await uploadMedia(savedProduct.id);

  if (!mediaSaved) return;

  $('editorMsg').textContent = 'Produkt gespeichert.';

  await loadProducts();

  setTimeout(() => {
    $('editor').close();
  }, 500);
});

/* =========================
   SAVE VARIANTS
========================= */

async function saveVariants(productId) {
  const { error: deleteError } = await sb
    .from('product_variants')
    .delete()
    .eq('product_id', productId);

  if (deleteError) {
    $('editorMsg').textContent =
      'Varianten konnten nicht aktualisiert werden: ' +
      deleteError.message;

    return false;
  }

  if (!currentVariants.length) {
    return true;
  }

  const rows = currentVariants.map((variant, index) => ({
    product_id: productId,

    sku:
      variant.sku?.trim() || null,

    color_name:
      variant.color_name?.trim() || null,

    color_code:
      variant.color_code?.trim() || null,

    length_cm:
      variant.length_cm || null,

    weight_g:
      variant.weight_g || null,

    strand_count:
      variant.strand_count || null,

    base_width_cm:
      variant.base_width_cm || null,

    base_length_cm:
      variant.base_length_cm || null,

    density_percent:
      variant.density_percent || null,

    price_cents:
      Number(variant.price_cents || 0),

    stock:
      Number(variant.stock || 0),

    is_active:
      variant.is_active !== false,

    sort_order: index
  }));

  const { error } = await sb
    .from('product_variants')
    .insert(rows);

  if (error) {
    $('editorMsg').textContent =
      'Varianten konnten nicht gespeichert werden: ' +
      error.message;

    return false;
  }

  return true;
}

/* =========================
   MEDIA
========================= */

async function uploadMedia(productId) {
  const file = $('media').files[0];

  if (!file) return true;

  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-');

  const path =
    `${productId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await sb
    .storage
    .from('product-media')
    .upload(path, file, {
      upsert: false
    });

  if (uploadError) {
    $('editorMsg').textContent =
      'Produkt gespeichert, aber Datei konnte nicht hochgeladen werden: ' +
      uploadError.message;

    return false;
  }

  const mediaType =
    file.type.startsWith('video/')
      ? 'video'
      : 'image';

  const { error: mediaError } = await sb
    .from('product_media')
    .insert({
      product_id: productId,
      media_type: mediaType,
      path,
      sort_order: 0
    });

  if (mediaError) {
    $('editorMsg').textContent =
      'Datei hochgeladen, aber Medien-Datensatz konnte nicht gespeichert werden: ' +
      mediaError.message;

    return false;
  }

  return true;
}

/* =========================
   DELETE PRODUCT
========================= */

$('deleteProduct').addEventListener('click', async () => {
  const productId = $('productId').value;

  if (!productId) return;

  const confirmed = confirm(
    'Dieses Produkt wirklich löschen?'
  );

  if (!confirmed) return;

  const { error } = await sb
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) {
    $('editorMsg').textContent = error.message;
    return;
  }

  $('editor').close();

  await loadProducts();
});

/* =========================
   START
========================= */

boot();


/* =========================
   MEDIA FILE DISPLAY
========================= */

$('media').addEventListener('change', () => {
  const file = $('media').files[0];
  const name = $('mediaFileName');

  if (!name) return;

  name.textContent = file
    ? file.name
    : 'Noch keine Datei ausgewählt.';
});
