/* =========================================
   ARDA HAIR — CHECKOUT
========================================= */

const checkoutItems =
  document.getElementById('checkoutItems');

const checkoutSubtotal =
  document.getElementById('checkoutSubtotal');

const checkoutShipping =
  document.getElementById('checkoutShipping');

const checkoutTotal =
  document.getElementById('checkoutTotal');

const checkoutCountry =
  document.getElementById('checkoutCountry');

const checkoutForm =
  document.getElementById('checkoutForm');

const checkoutSubmit =
  document.getElementById('checkoutSubmit');

const checkoutMessage =
  document.getElementById('checkoutMessage');

const acceptTerms =
  document.getElementById('acceptTerms');

const acceptPrivacy =
  document.getElementById('acceptPrivacy');

const shippingPlaceholder =
  document.querySelector('.shipping-placeholder');


/* =========================================
   HELPERS
========================================= */

function getCheckoutCart() {

  try {

    const cart =
      JSON.parse(
        localStorage.getItem('ardaHairCart') || '[]'
      );

    return Array.isArray(cart)
      ? cart
      : [];

  } catch {

    return [];

  }

}


function formatCheckoutMoney(cents) {

  const value =
    Number(cents || 0) / 100;

  return new Intl.NumberFormat(
    'de-DE',
    {
      style: 'currency',
      currency: 'EUR'
    }
  ).format(value);

}


function escapeCheckoutHtml(value) {

  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

}


/* =========================================
   CART SUMMARY
========================================= */

function calculateCheckoutSubtotal(cart) {

  return cart.reduce(
    (total, item) => {

      const price =
        Number(item.price_cents || 0);

      const quantity =
        Math.max(
          1,
          Number(item.quantity || 1)
        );

      return total +
        (price * quantity);

    },
    0
  );

}


function renderCheckoutCart() {

  const cart =
    getCheckoutCart();

  if (!checkoutItems) return;


  if (!cart.length) {

    checkoutItems.innerHTML = `
      <div class="checkout-empty">
        Dein Warenkorb ist leer.
        <br><br>
        <a
          href="index.html#shop"
          style="color:#e7a7bb;font-weight:700;"
        >
          Zum Shop
        </a>
      </div>
    `;

    checkoutSubtotal.textContent =
      formatCheckoutMoney(0);

    checkoutTotal.textContent =
      formatCheckoutMoney(0);

    checkoutShipping.textContent =
      '—';

    checkoutSubmit.disabled =
      true;

    checkoutMessage.textContent =
      'Bitte lege zuerst ein Produkt in den Warenkorb.';

    return;

  }


  checkoutItems.innerHTML =
    cart.map(item => {

      const quantity =
        Math.max(
          1,
          Number(item.quantity || 1)
        );

      const unitPrice =
        Number(item.price_cents || 0);

      const lineTotal =
        unitPrice * quantity;

      const image =
        item.image
          ? `
            <img
              src="${escapeCheckoutHtml(item.image)}"
              alt="${escapeCheckoutHtml(item.name || 'Produkt')}"
            >
          `
          : '';

      const variant =
        item.variant
          ? `
            <span>
              ${escapeCheckoutHtml(item.variant)}
            </span>
          `
          : '';

      return `
        <div class="checkout-item">

          <div class="checkout-item-image">
            ${image}
          </div>

          <div class="checkout-item-info">

            <strong>
              ${escapeCheckoutHtml(
                item.name || 'ARDA HAIR Produkt'
              )}
            </strong>

            ${variant}

            <span>
              Menge: ${quantity}
            </span>

          </div>

          <div class="checkout-item-price">
            ${formatCheckoutMoney(lineTotal)}
          </div>

        </div>
      `;

    }).join('');


  const subtotal =
    calculateCheckoutSubtotal(cart);

  checkoutSubtotal.textContent =
    formatCheckoutMoney(subtotal);

  /*
    Versandkosten werden später
    serverseitig / anhand des Lieferlandes
    berechnet.
  */
  checkoutShipping.textContent =
    '—';

  checkoutTotal.textContent =
    formatCheckoutMoney(subtotal);

}


/* =========================================
   SHIPPING COUNTRY
========================================= */

function updateCheckoutShipping() {

  const country =
    checkoutCountry?.value || '';

  if (!shippingPlaceholder) return;


  if (!country) {

    shippingPlaceholder.innerHTML = `
      <strong>
        Lieferland auswählen
      </strong>

      <span>
        Danach werden Versandart,
        Lieferzeit und Versandkosten angezeigt.
      </span>
    `;

    checkoutShipping.textContent =
      '—';

    return;

  }


  const countryName =
    checkoutCountry.options[
      checkoutCountry.selectedIndex
    ]?.text || country;


  shippingPlaceholder.innerHTML = `
    <strong>
      Lieferung nach ${escapeCheckoutHtml(countryName)}
    </strong>

    <span>
      Die Versandkosten für dieses Land
      werden vor Aktivierung des Zahlungsverkehrs
      hinterlegt und vor der Bestellung angezeigt.
    </span>
  `;


  checkoutShipping.textContent =
    'wird berechnet';

}


/* =========================================
   LEGAL CHECKS
========================================= */

function updateCheckoutState() {

  const cart =
    getCheckoutCart();

  const legalAccepted =
    Boolean(
      acceptTerms?.checked &&
      acceptPrivacy?.checked
    );


  if (!cart.length) {

    checkoutSubmit.disabled =
      true;

    return;

  }


  /*
    Der Button bleibt bis zur
    Stripe-/PayPal-Integration deaktiviert.
  */

  checkoutSubmit.disabled =
    true;


  if (legalAccepted) {

    checkoutMessage.textContent =
      'Angaben bestätigt. Stripe und PayPal werden als Nächstes verbunden.';

  } else {

    checkoutMessage.textContent =
      'Bitte bestätige die rechtlichen Hinweise. Die Zahlungsfunktion wird anschließend eingerichtet.';

  }

}


/* =========================================
   FORM
========================================= */

checkoutCountry
  ?.addEventListener(
    'change',
    updateCheckoutShipping
  );


acceptTerms
  ?.addEventListener(
    'change',
    updateCheckoutState
  );


acceptPrivacy
  ?.addEventListener(
    'change',
    updateCheckoutState
  );


checkoutForm
  ?.addEventListener(
    'submit',
    event => {

      event.preventDefault();

      checkoutMessage.textContent =
        'Die Zahlungsfunktion ist noch nicht aktiviert.';

    }
  );


/* =========================================
   SYNC
========================================= */

window.addEventListener(
  'storage',
  () => {

    renderCheckoutCart();
    updateCheckoutState();

  }
);


window.addEventListener(
  'pageshow',
  () => {

    renderCheckoutCart();
    updateCheckoutShipping();
    updateCheckoutState();

  }
);


/* =========================================
   START
========================================= */

renderCheckoutCart();
updateCheckoutShipping();
updateCheckoutState();
