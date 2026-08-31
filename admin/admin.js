const SUPABASE_URL = 'https://zehtftzxrjuoqcpcqmcs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_wUwY1wDw05gblt9WVOMT6Q_xxIcGKvF';
const ADMIN_EMAIL = 'kaanyildo12@gmail.com';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = (id) => document.getElementById(id);

let products = [];
let orders = [];
let withdrawals = [];
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
  await loadOrders();
  await loadWithdrawals();
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

  const { data: mediaRows } = await sb
    .from('product_media')
    .select('product_id, media_type, path, sort_order')
    .eq('media_type', 'image')
    .order('sort_order', { ascending: true });

  const firstImages = new Map();

  (mediaRows || []).forEach((media) => {
    if (firstImages.has(media.product_id)) return;

    const { data: publicData } = sb.storage
      .from('product-media')
      .getPublicUrl(media.path);

    if (publicData && publicData.publicUrl) {
      firstImages.set(
        media.product_id,
        publicData.publicUrl
      );
    }
  });

  products = products.map((product) => ({
    ...product,
    _adminImage:
      firstImages.get(product.id) || null
  }));

  renderProducts();
}

function getAdminProductImageHtml(product) {

  if (!product._adminImage) {
    return '<div class="product-card-thumb"><span>ARDA</span></div>';
  }

  return (
    '<div class="product-card-thumb">' +
      '<img src="' +
      escapeHtml(product._adminImage) +
      '" alt="' +
      escapeHtml(product.name_de || 'Produkt') +
      '" loading="lazy">' +
    '</div>'
  );
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

    const stock = Number(product.stock ?? 0);

    const stockClass =
      stock <= 0
        ? 'out'
        : stock <= 5
          ? 'low'
          : 'ok';

    const stockLabel =
      stock <= 0
        ? 'Ausverkauft'
        : stock <= 5
          ? 'Niedriger Bestand'
          : 'Auf Lager';

    const category =
      product.category || 'Keine Kategorie';

    return `
      <article class="card product-card-pro" data-product-type="${escapeHtml(product.product_type || '')}" data-product-status="${product.is_active ? 'published' : 'draft'}" data-product-featured="${product.featured ? 'yes' : 'no'}" data-product-search="${escapeHtml([product.name_de, product.name_tr, product.name_en, product.slug, product.category].filter(Boolean).join(' ').toLowerCase())}">

        <div class="product-card-badges">

          <span class="admin-badge type">
            ${escapeHtml(typeLabel)}
          </span>

          <span class="admin-badge ${product.is_active ? 'live' : 'draft'}">
            ${product.is_active ? 'Veröffentlicht' : 'Entwurf'}
          </span>

          ${
            product.featured
              ? '<span class="admin-badge featured">★ Hervorgehoben</span>'
              : ''
          }

        </div>

        <div class="product-card-content">

          ${getAdminProductImageHtml(product)}

          <div class="product-card-name">

            <h3>
              ${escapeHtml(product.name_de || 'Ohne Namen')}
            </h3>

            <span>
              ${escapeHtml(product.slug || '')}
            </span>

          </div>

          <div class="product-card-stats">

            <div class="product-stat">
              <small>Preis</small>
              <strong>
                ${formatMoney(product.price_cents)}
              </strong>
            </div>

            <div class="product-stat">
              <small>Bestand</small>
              <strong>${stock}</strong>

              <span class="stock-state ${stockClass}">
                ${stockLabel}
              </span>
            </div>

            <div class="product-stat">
              <small>Kategorie</small>
              <strong>
                ${escapeHtml(category)}
              </strong>
            </div>

          </div>

        </div>

        <div class="product-card-footer">

          <span>
            ${
              product.is_active
                ? 'Im Shop sichtbar'
                : 'Noch nicht veröffentlicht'
            }
          </span>

          <button
            class="edit-product-btn"
            onclick="editProduct('${product.id}')"
          >
            Bearbeiten
            <span>→</span>
          </button>

        </div>

      </article>
    `;
  }).join('');

  applyProductFilters();
}
function formatMoney(cents) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format((cents || 0) / 100);
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


async function loadOrders() {

  const { data, error } =
    await sb
      .from('orders')
      .select(`
        id,
        order_number,
        user_id,
        email,
        first_name,
        last_name,
        phone,
        company,
        shipping_country,
        shipping_street,
        shipping_postal_code,
        shipping_city,
        tracking_number,
        shipping_status,
        currency,
        subtotal_cents,
        shipping_cents,
        total_cents,
        payment_provider,
        payment_status,
        order_status,
        created_at,
        updated_at
      `)
      .order(
        'created_at',
        {
          ascending: false
        }
      );


  if (error) {

    $('adminOrders').innerHTML = `
      <div class="card">
        ${escapeHtml(error.message)}
      </div>
    `;

    return;

  }


  orders =
    Array.isArray(data)
      ? data
      : [];


  renderOrders();

}



async function loadWithdrawals() {

  const { data, error } =
    await sb
      .from('withdrawal_requests')
      .select(`
        id,
        name,
        order_number,
        email,
        message,
        status,
        created_at
      `)
      .order('created_at', {
        ascending: false
      });

  if (error) {

    $('adminWithdrawals').innerHTML = `
      <div class="card">
        ${escapeHtml(error.message)}
      </div>
    `;

    return;
  }

  withdrawals =
    Array.isArray(data)
      ? data
      : [];

  renderWithdrawals();
}


function renderWithdrawals() {

  const container =
    $('adminWithdrawals');

  if (!container) {
    return;
  }


  const search =
    String(
      $('adminWithdrawalSearch')?.value || ''
    )
      .trim()
      .toLowerCase();


  const status =
    $('adminWithdrawalStatusFilter')?.value ||
    'all';


  const filtered =
    withdrawals.filter(item => {

      const searchable =
        [
          item.order_number,
          item.email,
          item.name
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

      const matchesSearch =
        !search ||
        searchable.includes(search);

      const matchesStatus =
        status === 'all' ||
        item.status === status;

      return (
        matchesSearch &&
        matchesStatus
      );

    });


  if ($('adminWithdrawalCount')) {
    $('adminWithdrawalCount').textContent =
      `${filtered.length} Widerruf(e)`;
  }


  if (filtered.length === 0) {

    container.innerHTML = `
      <div class="card">
        Keine Widerrufe gefunden.
      </div>
    `;

    return;
  }


  container.innerHTML =
    filtered.map(item => {

      const date =
        item.created_at
          ? new Date(item.created_at)
              .toLocaleString('de-DE')
          : '—';

      return `
        <article class="admin-order-card">

          <div class="admin-order-top">

            <div>

              <div class="admin-order-number">
                ${escapeHtml(item.order_number || '—')}
              </div>

              <div class="admin-order-meta">
                ${escapeHtml(item.name || '—')}
                ·
                ${escapeHtml(item.email || '—')}
                <br>
                ${escapeHtml(date)}
              </div>

            </div>

            <div class="admin-withdrawal-status-actions">

              <select
                id="withdrawalStatus-${escapeHtml(item.id)}"
              >
                <option value="received"
                  ${item.status === 'received' ? 'selected' : ''}>
                  Received
                </option>

                <option value="processing"
                  ${item.status === 'processing' ? 'selected' : ''}>
                  Processing
                </option>

                <option value="completed"
                  ${item.status === 'completed' ? 'selected' : ''}>
                  Completed
                </option>
              </select>

              <button
                type="button"
                class="secondary"
                onclick="saveWithdrawalStatus('${escapeHtml(item.id)}')"
              >
                Speichern
              </button>

            </div>

          </div>

          ${
            item.message
              ? `
                <div class="admin-order-detail-block"
                     style="margin-top:16px">
                  <strong>Mitteilung</strong>
                  <p>${escapeHtml(item.message)}</p>
                </div>
              `
              : ''
          }

        </article>
      `;

    }).join('');

}

function renderOrders() {

  const container =
    $('adminOrders');

  if (!container) {
    return;
  }


  const search =
    String(
      $('adminOrderSearch')?.value || ''
    )
      .trim()
      .toLowerCase();


  const status =
    $('adminOrderStatusFilter')?.value ||
    'all';


  const filtered =
    orders.filter(order => {

      const searchable =
        [
          order.order_number,
          order.email,
          order.first_name,
          order.last_name
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();


      const matchesSearch =
        !search ||
        searchable.includes(search);


      const matchesStatus =
        status === 'all' ||
        order.order_status === status;


      return (
        matchesSearch &&
        matchesStatus
      );

    });


  if ($('adminOrderCount')) {

    $('adminOrderCount').textContent =
      `${filtered.length} Bestellung(en)`;

  }


  if (filtered.length === 0) {

    container.innerHTML = `
      <div class="card">
        Keine Bestellungen gefunden.
      </div>
    `;

    return;

  }


  container.innerHTML =
    filtered
      .map(order => {

        const customerName =
          [
            order.first_name,
            order.last_name
          ]
            .filter(Boolean)
            .join(' ');


        const date =
          order.created_at
            ? new Date(
                order.created_at
              ).toLocaleString(
                'de-DE'
              )
            : '—';


        return `
          <article class="admin-order-card">

            <div class="admin-order-top">

              <div>

                <div class="admin-order-number">
                  ${escapeHtml(order.order_number || '—')}
                </div>

                <div class="admin-order-meta">
                  ${escapeHtml(customerName || '—')}
                  ·
                  ${escapeHtml(order.email || '—')}
                  <br>
                  ${escapeHtml(date)}
                </div>

              </div>

              <div class="admin-order-total">
                ${formatMoney(order.total_cents)}
              </div>

            </div>

            <div class="admin-order-badges">

              <span class="admin-order-badge">
                Zahlung:
                ${escapeHtml(order.payment_status || '—')}
              </span>

              <span class="admin-order-badge">
                Status:
                ${escapeHtml(order.order_status || '—')}
              </span>

              <span class="admin-order-badge">
                ${escapeHtml(order.payment_provider || '—')}
              </span>

            </div>
            <div class="admin-order-card-actions">
              <button
                type="button"
                class="secondary"
                onclick="openOrderDetails('${escapeHtml(order.id)}')"
              >
                Details
              </button>
            </div>

          </article>
        `;

      })
      .join('');

}


window.openOrderDetails = async function (id) {

  const order =
    orders.find(
      (item) => item.id === id
    );

  if (!order) {
    return;
  }


  const dialog =
    $('orderDialog');

  const content =
    $('orderDialogContent');

  if (!dialog || !content) {
    return;
  }


  dialog.dataset.orderId =
    order.id;


  $('orderDialogNumber').textContent =
    order.order_number || 'Bestellung';


  $('orderDialogStatus').value =
    order.order_status || 'pending';


  $('orderDialogShippingStatus').value =
    order.shipping_status || 'pending';


  $('orderDialogTrackingNumber').value =
    order.tracking_number || '';


  $('orderDialogMsg').textContent =
    '';


  const customerName =
    [
      order.first_name,
      order.last_name
    ]
      .filter(Boolean)
      .join(' ');


  const address =
    [
      order.shipping_street,
      `${order.shipping_postal_code || ''} ${order.shipping_city || ''}`.trim(),
      order.shipping_country
    ]
      .filter(Boolean)
      .map(value => escapeHtml(value))
      .join('<br>');


  const createdAt =
    order.created_at
      ? new Date(order.created_at)
          .toLocaleString('de-DE')
      : '—';


  const { data: items, error: itemsError } =
    await sb
      .from('order_items')
      .select(`
        id,
        product_name,
        variant_name,
        unit_price_cents,
        quantity,
        line_total_cents
      `)
      .eq('order_id', order.id)
      .order('created_at', {
        ascending: true
      });


  const orderItems =
    Array.isArray(items)
      ? items
      : [];


  const itemsHtml =
    itemsError
      ? `
          <p>
            Artikel konnten nicht geladen werden:
            ${escapeHtml(itemsError.message)}
          </p>
        `
      : orderItems.length === 0
        ? '<p>Keine Artikel gefunden.</p>'
        : `
          <div class="admin-order-items">
            ${orderItems.map(item => `
              <div class="admin-order-item">
                <div>
                  <strong>
                    ${escapeHtml(item.product_name || '—')}
                  </strong>

                  ${
                    item.variant_name
                      ? `<span>${escapeHtml(item.variant_name)}</span>`
                      : ''
                  }
                </div>

                <div class="admin-order-item-meta">
                  ${Number(item.quantity || 0)} ×
                  ${formatMoney(item.unit_price_cents)}
                  =
                  ${formatMoney(item.line_total_cents)}
                </div>
              </div>
            `).join('')}
          </div>
        `;

  content.innerHTML = `

    <div class="admin-order-detail-block">
      <strong>Kunde</strong>
      <p>
        ${escapeHtml(customerName || '—')}<br>
        ${escapeHtml(order.email || '—')}<br>
        ${escapeHtml(order.phone || '—')}
      </p>
    </div>

    <div class="admin-order-detail-block">
      <strong>Lieferadresse</strong>
      <p>
        ${address || '—'}
      </p>
    </div>

    <div class="admin-order-detail-block">
      <strong>Zahlung</strong>
      <p>
        Anbieter: ${escapeHtml(order.payment_provider || '—')}<br>
        Zahlungsstatus: ${escapeHtml(order.payment_status || '—')}<br>
        Bestellstatus: ${escapeHtml(order.order_status || '—')}
      </p>
    </div>

    <div class="admin-order-detail-block">
      <strong>Artikel</strong>
      ${itemsHtml}
    </div>

    <div class="admin-order-detail-block">
      <strong>Beträge</strong>
      <p>
        Zwischensumme: ${formatMoney(order.subtotal_cents)}<br>
        Versand: ${formatMoney(order.shipping_cents)}<br>
        Gesamt: ${formatMoney(order.total_cents)}
      </p>
    </div>

    <div class="admin-order-detail-block">
      <strong>Bestelldatum</strong>
      <p>${escapeHtml(createdAt)}</p>
    </div>

  `;


  dialog.showModal();

};

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

  $('editorTitle').textContent =
    product.id ? 'Produkt bearbeiten' : 'Neues Produkt';
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
      'Noch keine Datei ausgewÃ¤hlt.';
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
    $('editorMsg').textContent = 'Bitte Produkttyp auswÃ¤hlen.';
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
    'Dieses Produkt wirklich lÃ¶schen?'
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
    : 'Noch keine Datei ausgewÃ¤hlt.';
});




/* =========================
   ADMIN PRODUCT FILTERS
========================= */

function applyProductFilters() {
  const searchEl = $('productSearch');
  const typeEl = $('productTypeFilter');
  const statusEl = $('productStatusFilter');
  const countEl = $('productCount');
  const emptyEl = $('productFilterEmpty');

  if (!searchEl || !typeEl || !statusEl) return;

  const search =
    searchEl.value.trim().toLowerCase();

  const type =
    typeEl.value;

  const status =
    statusEl.value;

  const cards =
    Array.from(
      document.querySelectorAll('.product-card-pro')
    );

  let visible = 0;

  cards.forEach((card) => {
    const matchesSearch =
      !search ||
      (card.dataset.productSearch || '')
        .includes(search);

    const matchesType =
      type === 'all' ||
      card.dataset.productType === type;

    let matchesStatus = true;

    if (status === 'published') {
      matchesStatus =
        card.dataset.productStatus === 'published';
    }

    if (status === 'draft') {
      matchesStatus =
        card.dataset.productStatus === 'draft';
    }

    if (status === 'featured') {
      matchesStatus =
        card.dataset.productFeatured === 'yes';
    }

    const show =
      matchesSearch &&
      matchesType &&
      matchesStatus;

    card.hidden = !show;

    if (show) visible++;
  });

  if (countEl) {
    countEl.textContent =
      visible + ' / ' + cards.length + ' Produkte';
  }

  if (emptyEl) {
    emptyEl.hidden =
      cards.length === 0 || visible !== 0;
  }
}

$('productSearch')?.addEventListener(
  'input',
  applyProductFilters
);

$('productTypeFilter')?.addEventListener(
  'change',
  applyProductFilters
);

$('productStatusFilter')?.addEventListener(
  'change',
  applyProductFilters
);






$('adminOrderSearch')?.addEventListener(
  'input',
  renderOrders
);

$('adminOrderStatusFilter')?.addEventListener(
  'change',
  renderOrders
);

$('closeOrderDialog')?.addEventListener(
  'click',
  () => {
    $('orderDialog')?.close();
  }
);

$('saveOrderStatus')?.addEventListener(
  'click',
  async () => {

    const dialog = $('orderDialog');
    const message = $('orderDialogMsg');

    const orderId =
      dialog?.dataset.orderId;

    const newStatus =
      $('orderDialogStatus')?.value;

    if (!orderId || !newStatus) {
      return;
    }

    message.textContent =
      'Status wird gespeichert...';

    const { error } =
      await sb
        .from('orders')
        .update({
          order_status: newStatus
        })
        .eq('id', orderId);

    if (error) {
      message.textContent =
        'Fehler: ' + error.message;
      return;
    }

    const order =
      orders.find(
        item => item.id === orderId
      );

    if (order) {
      order.order_status = newStatus;
    }

    renderOrders();

    message.textContent =
      'Status gespeichert.';

  }
);



$('saveOrderShipping')?.addEventListener(
  'click',
  async () => {

    const dialog = $('orderDialog');
    const message = $('orderDialogMsg');

    const orderId =
      dialog?.dataset.orderId;

    const shippingStatus =
      $('orderDialogShippingStatus')?.value;

    const trackingNumber =
      String(
        $('orderDialogTrackingNumber')?.value || ''
      ).trim();

    if (!orderId || !shippingStatus) {
      return;
    }

    message.textContent =
      'Versand wird gespeichert...';

    const { error } =
      await sb
        .from('orders')
        .update({
          shipping_status: shippingStatus,
          tracking_number: trackingNumber || null
        })
        .eq('id', orderId);

    if (error) {
      message.textContent =
        'Fehler: ' + error.message;
      return;
    }

    const order =
      orders.find(
        item => item.id === orderId
      );

    if (order) {
      order.shipping_status = shippingStatus;
      order.tracking_number = trackingNumber || null;
    }

    message.textContent =
      'Versand gespeichert.';

  }
);





$('adminWithdrawalSearch')?.addEventListener(
  'input',
  renderWithdrawals
);

$('adminWithdrawalStatusFilter')?.addEventListener(
  'change',
  renderWithdrawals
);

window.saveWithdrawalStatus = async function (id) {

  const select =
    $('withdrawalStatus-' + id);

  if (!select) {
    return;
  }

  const newStatus =
    select.value;

  const { error } =
    await sb
      .from('withdrawal_requests')
      .update({
        status: newStatus
      })
      .eq('id', id);

  if (error) {

    alert(
      'Fehler: ' +
      error.message
    );

    return;
  }

  const item =
    withdrawals.find(
      row => row.id === id
    );

  if (item) {
    item.status = newStatus;
  }

  renderWithdrawals();

};
