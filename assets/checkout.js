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

const paymentMethodInputs =
  document.querySelectorAll(
    'input[name="paymentMethod"]'
  );


function getPaymentMethod() {

  return (
    document.querySelector(
      'input[name="paymentMethod"]:checked'
    )?.value ||
    'stripe'
  );

}


let checkoutQuote = null;
let checkoutQuoteError = '';
let checkoutQuoteLoading = false;
let checkoutSubmitting = false;


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


function getTrustedQuoteItem(cartItem) {

  if (!checkoutQuote?.items) {
    return null;
  }

  return checkoutQuote.items.find(item => {

    const sameProduct =
      String(item.productId) ===
      String(cartItem.productId);

    const quoteVariant =
      item.variantId
        ? String(item.variantId)
        : '';

    const cartVariant =
      cartItem.variantId
        ? String(cartItem.variantId)
        : '';

    return (
      sameProduct &&
      quoteVariant === cartVariant
    );

  }) || null;

}


/* =========================================
   CART SUMMARY
========================================= */

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

      const trusted =
        getTrustedQuoteItem(item);

      const linePrice =
        trusted
          ? formatCheckoutMoney(
              trusted.lineTotalCents
            )
          : checkoutQuoteLoading
            ? 'Wird geprüft …'
            : '—';

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
            ${linePrice}
          </div>

        </div>
      `;

    }).join('');


  if (checkoutQuote) {

    checkoutSubtotal.textContent =
      formatCheckoutMoney(
        checkoutQuote.subtotalCents
      );


    const hasShipping =
      Number.isInteger(
        checkoutQuote.shippingCents
      );


    checkoutShipping.textContent =
      hasShipping
        ? formatCheckoutMoney(
            checkoutQuote.shippingCents
          )
        : '—';


    checkoutTotal.textContent =
      hasShipping
        ? formatCheckoutMoney(
            checkoutQuote.totalCents
          )
        : formatCheckoutMoney(
            checkoutQuote.subtotalCents
          );


    if (
      hasShipping &&
      checkoutQuote.shippingMethod &&
      shippingPlaceholder
    ) {

      shippingPlaceholder.innerHTML = `
        <strong>
          ${escapeCheckoutHtml(
            checkoutQuote.shippingMethod
          )}
        </strong>

        <span>
          Versandkosten:
          ${formatCheckoutMoney(
            checkoutQuote.shippingCents
          )}
        </span>
      `;

    }

  } else {

    checkoutSubtotal.textContent =
      checkoutQuoteLoading
        ? 'Wird geprüft …'
        : '—';

    checkoutTotal.textContent =
      checkoutQuoteLoading
        ? 'Wird geprüft …'
        : '—';

  }

}


/* =========================================
   SECURE SERVER QUOTE
========================================= */

async function requestCheckoutQuote() {

  const cart =
    getCheckoutCart();

  checkoutQuote = null;
  checkoutQuoteError = '';

  if (!cart.length) {

    checkoutQuoteLoading = false;
    renderCheckoutCart();
    updateCheckoutState();

    return;

  }


  checkoutQuoteLoading = true;

  renderCheckoutCart();


  try {

    const response =
      await fetch(
        '/api/checkout-quote',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            country:
              checkoutCountry?.value || '',

            items:
              cart.map(item => ({
                productId:
                  item.productId,

                variantId:
                  item.variantId || null,

                quantity:
                  Number(item.quantity || 1)
              }))
          })
        }
      );


    const data =
      await response
        .json()
        .catch(() => ({}));


    if (!response.ok) {

      if (
        data.error ===
        'INSUFFICIENT_STOCK'
      ) {

        throw new Error(
          'STOCK'
        );

      }


      if (
        data.error ===
        'PRODUCT_UNAVAILABLE'
      ) {

        throw new Error(
          'UNAVAILABLE'
        );

      }


      if (
        data.error ===
        'SHIPPING_RATE_UNAVAILABLE'
      ) {

        throw new Error(
          'SHIPPING'
        );

      }


      throw new Error(
        'QUOTE'
      );

    }


    checkoutQuote =
      data.quote || null;


  } catch (error) {

    checkoutQuote = null;


    if (
      error.message ===
      'STOCK'
    ) {

      checkoutQuoteError =
        'Ein Produkt ist nicht mehr in der gewünschten Menge verfügbar. Bitte passe den Warenkorb an.';

    } else if (
      error.message ===
      'UNAVAILABLE'
    ) {

      checkoutQuoteError =
        'Ein Produkt oder eine Variante ist nicht mehr verfügbar. Bitte passe den Warenkorb an.';

    } else if (
      error.message ===
      'SHIPPING'
    ) {

      checkoutQuoteError =
        'Für dieses Lieferland ist der Versandpreis noch nicht eingerichtet.';

    } else {

      checkoutQuoteError =
        'Preis und Bestand konnten nicht geprüft werden. Bitte versuche es erneut.';

    }

  } finally {

    checkoutQuoteLoading =
      false;

    renderCheckoutCart();
    updateCheckoutState();

  }

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


  checkoutSubmit.disabled =
    true;


  if (checkoutSubmitting) {

    checkoutMessage.textContent =
      'Du wirst sicher zu Stripe weitergeleitet …';

    return;

  }


  if (!cart.length) {

    checkoutMessage.textContent =
      'Bitte lege zuerst ein Produkt in den Warenkorb.';

    return;

  }


  if (checkoutQuoteLoading) {

    checkoutMessage.textContent =
      'Preis und Bestand werden sicher geprüft …';

    return;

  }


  if (checkoutQuoteError) {

    checkoutMessage.textContent =
      checkoutQuoteError;

    return;

  }


  if (!checkoutQuote) {

    checkoutMessage.textContent =
      'Preisprüfung nicht verfügbar.';

    return;

  }


  if (!checkoutCountry?.value) {

    checkoutMessage.textContent =
      'Bitte wähle zuerst dein Lieferland.';

    return;

  }


  if (legalAccepted) {

    checkoutSubmit.disabled =
      false;

    checkoutMessage.textContent =
      getPaymentMethod() === 'paypal'
        ? 'Alles geprüft. Du kannst jetzt sicher mit PayPal fortfahren.'
        : 'Alles geprüft. Du kannst jetzt sicher mit Stripe fortfahren.';

  } else {

    checkoutMessage.textContent =
      'Preis und Bestand bestätigt. Bitte bestätige anschließend die rechtlichen Hinweise.';

  }

}


/* =========================================
   FORM
========================================= */

checkoutCountry
  ?.addEventListener(
    'change',
    refreshCheckout
  );


paymentMethodInputs
  .forEach(input => {

    input.addEventListener(
      'change',
      updateCheckoutState
    );

  });


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
    async event => {

      event.preventDefault();


      if (checkoutSubmitting) {
        return;
      }


      const cart =
        getCheckoutCart();


      if (
        !cart.length ||
        !checkoutQuote ||
        checkoutQuoteLoading ||
        checkoutQuoteError ||
        !checkoutCountry?.value
      ) {

        updateCheckoutState();
        return;

      }


      if (
        !acceptTerms?.checked ||
        !acceptPrivacy?.checked
      ) {

        checkoutMessage.textContent =
          'Bitte bestätige zuerst die rechtlichen Hinweise.';

        return;

      }


      if (!checkoutForm.checkValidity()) {

        checkoutForm.reportValidity();

        checkoutMessage.textContent =
          'Bitte fülle alle Pflichtfelder korrekt aus.';

        return;

      }


      const formData =
        new FormData(checkoutForm);

      const paymentMethod =
        getPaymentMethod();


      checkoutSubmitting =
        true;

      updateCheckoutState();


      try {

        const endpoint =
          paymentMethod === 'paypal'
            ? '/api/create-paypal-order'
            : '/api/create-stripe-session';


        const response =
          await fetch(
            endpoint,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body: JSON.stringify({

                country:
                  checkoutCountry.value,

                customer: {
                  email:
                    formData.get('email'),

                  firstName:
                    formData.get('firstName'),

                  lastName:
                    formData.get('lastName'),

                  phone:
                    formData.get('phone') || '',

                  company:
                    formData.get('company') || '',

                  street:
                    formData.get('street'),

                  postalCode:
                    formData.get('postalCode'),

                  city:
                    formData.get('city')
                },

                items:
                  cart.map(item => ({
                    productId:
                      item.productId,

                    variantId:
                      item.variantId || null,

                    quantity:
                      Number(item.quantity || 1)
                  }))

              })
            }
          );


        const data =
          await response
            .json()
            .catch(() => ({}));


        if (!response.ok) {

          if (
            data.error ===
            'INSUFFICIENT_STOCK'
          ) {

            throw new Error(
              'STOCK'
            );

          }


          if (
            data.error ===
            'PRODUCT_UNAVAILABLE'
          ) {

            throw new Error(
              'UNAVAILABLE'
            );

          }


          if (
            data.error ===
            'SHIPPING_RATE_UNAVAILABLE'
          ) {

            throw new Error(
              'SHIPPING'
            );

          }


          throw new Error(
            'PAYMENT'
          );

        }


        const paymentUrl =
          paymentMethod === 'paypal'
            ? data.approveUrl
            : data.checkoutUrl;


        if (!paymentUrl) {

          throw new Error(
            'PAYMENT'
          );

        }


        window.location.href =
          paymentUrl;


      } catch (error) {

        checkoutSubmitting =
          false;


        if (
          error.message ===
          'STOCK'
        ) {

          checkoutMessage.textContent =
            'Ein Produkt ist nicht mehr in der gewünschten Menge verfügbar.';

        } else if (
          error.message ===
          'UNAVAILABLE'
        ) {

          checkoutMessage.textContent =
            'Ein Produkt oder eine Variante ist nicht mehr verfügbar.';

        } else if (
          error.message ===
          'SHIPPING'
        ) {

          checkoutMessage.textContent =
            'Für dieses Lieferland konnte der Versand nicht berechnet werden.';

        } else {

          checkoutMessage.textContent =
            paymentMethod === 'paypal'
              ? 'PayPal konnte nicht gestartet werden. Bitte versuche es erneut.'
              : 'Stripe konnte nicht gestartet werden. Bitte versuche es erneut.';

        }


        updateCheckoutState();

      }

    }
  );


/* =========================================
   SYNC
========================================= */

async function refreshCheckout() {

  renderCheckoutCart();
  updateCheckoutShipping();
  updateCheckoutState();

  await requestCheckoutQuote();

}


window.addEventListener(
  'storage',
  refreshCheckout
);


window.addEventListener(
  'pageshow',
  refreshCheckout
);


/* =========================================
   START
========================================= */

refreshCheckout();
