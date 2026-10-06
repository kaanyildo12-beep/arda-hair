/* =========================================
   ARDA HAIR — CHECKOUT
========================================= */
const CHECKOUT_SUPABASE_URL =
  'https://zehtftzxrjuoqcpcqmcs.supabase.co';

const CHECKOUT_SUPABASE_KEY =
  'sb_publishable_wUwY1wDw05gblt9WVOMT6Q_xxIcGKvF';

const checkoutAuthStorage = {

  getItem(key) {
    return (
      localStorage.getItem(key) ??
      sessionStorage.getItem(key)
    );
  },

  setItem(key, value) {

    const remember =
      localStorage.getItem('ardaRememberLogin') !== '0';

    if (remember) {
      localStorage.setItem(key, value);
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, value);
      localStorage.removeItem(key);
    }

  },

  removeItem(key) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }

};

const checkoutDb = supabase.createClient(
  CHECKOUT_SUPABASE_URL,
  CHECKOUT_SUPABASE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: checkoutAuthStorage
    }
  }
);


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


const checkoutLanguages = ['de', 'tr', 'en'];

let checkoutLang =
  checkoutLanguages.includes(
    localStorage.getItem('arda-lang')
  )
    ? localStorage.getItem('arda-lang')
    : 'de';

const checkoutLocales = {
  de: 'de-DE',
  tr: 'tr-TR',
  en: 'en-IE'
};

const checkoutTranslations = {
  de: {
    pageTitle: 'Checkout — ARDA HAIR',
    metaDescription: 'Sicherer Checkout bei ARDA HAIR.',
    secureCheckout: 'Sicherer Checkout',
    backShop: '← Zurück zum Shop',
    orderHeading: 'Deine Bestellung',
    orderIntro: 'Bitte überprüfe deine Angaben, bevor du deine Bestellung abschließt.',
    contact: 'Kontakt',
    contactCopy: 'Für Bestellbestätigung und Versandinformationen.',
    email: 'E-Mail-Adresse *',
    firstName: 'Vorname *',
    lastName: 'Nachname *',
    phone: 'Telefon',
    deliveryAddress: 'Lieferadresse',
    deliveryCopy: 'Wir liefern derzeit ausschließlich in Mitgliedstaaten der Europäischen Union.',
    country: 'Land *',
    countrySelect: 'Land auswählen',
    street: 'Straße und Hausnummer *',
    postalCode: 'Postleitzahl *',
    city: 'Ort *',
    company: 'Firma / Salon',
    optional: '(optional)',
    shipping: 'Versand',
    shippingCopy: 'Die Versandkosten werden abhängig vom Lieferland berechnet.',
    selectDeliveryCountry: 'Lieferland auswählen',
    shippingPlaceholder: 'Danach werden Versandart, Lieferzeit und Versandkosten angezeigt.',
    payment: 'Zahlung',
    paymentCopy: 'Die Zahlung wird im nächsten Schritt sicher verarbeitet.',
    card: 'Kredit- / Debitkarte',
    stripeSecure: 'Sicher bezahlen mit Stripe',
    paypalSecure: 'Sicher bezahlen mit PayPal',
    termsHtml: 'Ich akzeptiere die <a href="agb.html" target="_blank">AGB</a> und habe die <a href="widerruf.html" target="_blank">Widerrufsbelehrung</a> zur Kenntnis genommen.',
    privacyHtml: 'Ich habe die <a href="datenschutz.html" target="_blank">Datenschutzerklärung</a> zur Kenntnis genommen.',
    submit: 'Zahlungspflichtig bestellen',
    summaryKicker: 'BESTELLÜBERSICHT',
    cartHeading: 'Dein Warenkorb',
    cartLoading: 'Warenkorb wird geladen...',
    subtotal: 'Zwischensumme',
    shippingLabel: 'Versand',
    total: 'Gesamt',
    summaryNote: 'Der endgültige Gesamtpreis einschließlich Versand wird vor Abschluss der Bestellung angezeigt.',
    imprint: 'Impressum',
    privacy: 'Datenschutz',
    terms: 'AGB',
    withdrawal: 'Widerruf',
    shippingReturns: 'Versand & Rückgabe',
    emptyCart: 'Dein Warenkorb ist leer.',
    toShop: 'Zum Shop',
    addProductFirst: 'Bitte lege zuerst ein Produkt in den Warenkorb.',
    checking: 'Wird geprüft …',
    product: 'Produkt',
    productFallback: 'ARDA HAIR Produkt',
    quantity: 'Menge',
    shippingCost: 'Versandkosten',
    deliveryTo: 'Lieferung nach',
    shippingPending: 'Die Versandkosten für dieses Land werden vor Aktivierung des Zahlungsverkehrs hinterlegt und vor der Bestellung angezeigt.',
    calculating: 'wird berechnet',
    paypalRedirect: 'Du wirst sicher zu PayPal weitergeleitet …',
    stripeRedirect: 'Du wirst sicher zu Stripe weitergeleitet …',
    secureChecking: 'Preis und Bestand werden sicher geprüft …',
    priceCheckUnavailable: 'Preisprüfung nicht verfügbar.',
    selectCountryFirst: 'Bitte wähle zuerst dein Lieferland.',
    paypalReady: 'Alles geprüft. Du kannst jetzt sicher mit PayPal fortfahren.',
    stripeReady: 'Alles geprüft. Du kannst jetzt sicher mit Stripe fortfahren.',
    confirmLegal: 'Preis und Bestand bestätigt. Bitte bestätige anschließend die rechtlichen Hinweise.',
    confirmLegalFirst: 'Bitte bestätige zuerst die rechtlichen Hinweise.',
    fillRequired: 'Bitte fülle alle Pflichtfelder korrekt aus.',
    stockQuote: 'Ein Produkt ist nicht mehr in der gewünschten Menge verfügbar. Bitte passe den Warenkorb an.',
    unavailableQuote: 'Ein Produkt oder eine Variante ist nicht mehr verfügbar. Bitte passe den Warenkorb an.',
    shippingQuote: 'Für dieses Lieferland ist der Versandpreis noch nicht eingerichtet.',
    quoteFailed: 'Preis und Bestand konnten nicht geprüft werden. Bitte versuche es erneut.',
    stockPayment: 'Ein Produkt ist nicht mehr in der gewünschten Menge verfügbar.',
    unavailablePayment: 'Ein Produkt oder eine Variante ist nicht mehr verfügbar.',
    shippingPayment: 'Für dieses Lieferland konnte der Versand nicht berechnet werden.',
    paypalFailed: 'PayPal konnte nicht gestartet werden. Bitte versuche es erneut.',
    stripeFailed: 'Stripe konnte nicht gestartet werden. Bitte versuche es erneut.'
  },

  tr: {
    pageTitle: 'Ödeme — ARDA HAIR',
    metaDescription: 'ARDA HAIR güvenli ödeme sayfası.',
    secureCheckout: 'Güvenli Ödeme',
    backShop: '← Mağazaya dön',
    orderHeading: 'Siparişin',
    orderIntro: 'Siparişini tamamlamadan önce bilgilerini kontrol et.',
    contact: 'İletişim',
    contactCopy: 'Sipariş onayı ve kargo bilgileri için.',
    email: 'E-posta adresi *',
    firstName: 'Ad *',
    lastName: 'Soyad *',
    phone: 'Telefon',
    deliveryAddress: 'Teslimat adresi',
    deliveryCopy: 'Şu anda yalnızca Avrupa Birliği üyesi ülkelere gönderim yapıyoruz.',
    country: 'Ülke *',
    countrySelect: 'Ülke seç',
    street: 'Sokak ve bina numarası *',
    postalCode: 'Posta kodu *',
    city: 'Şehir *',
    company: 'Firma / Salon',
    optional: '(isteğe bağlı)',
    shipping: 'Kargo',
    shippingCopy: 'Kargo ücreti teslimat ülkesine göre hesaplanır.',
    selectDeliveryCountry: 'Teslimat ülkesini seç',
    shippingPlaceholder: 'Ardından kargo yöntemi, teslimat süresi ve kargo ücreti gösterilir.',
    payment: 'Ödeme',
    paymentCopy: 'Ödeme bir sonraki adımda güvenli şekilde işlenecektir.',
    card: 'Kredi / Banka kartı',
    stripeSecure: 'Stripe ile güvenli ödeme',
    paypalSecure: 'PayPal ile güvenli ödeme',
    termsHtml: '<a href="agb.html" target="_blank">Genel Şartlar ve Koşullar</a>\'ı kabul ediyorum ve <a href="widerruf.html" target="_blank">cayma hakkı bilgilendirmesini</a> okudum.',
    privacyHtml: '<a href="datenschutz.html" target="_blank">Gizlilik politikasını</a> okudum.',
    submit: 'Ödeme yükümlülüğüyle sipariş ver',
    summaryKicker: 'SİPARİŞ ÖZETİ',
    cartHeading: 'Sepetin',
    cartLoading: 'Sepet yükleniyor...',
    subtotal: 'Ara toplam',
    shippingLabel: 'Kargo',
    total: 'Toplam',
    summaryNote: 'Kargo dahil nihai toplam fiyat, sipariş tamamlanmadan önce gösterilir.',
    imprint: 'Yasal Bilgiler',
    privacy: 'Gizlilik',
    terms: 'Şartlar',
    withdrawal: 'Cayma Hakkı',
    shippingReturns: 'Kargo & İade',
    emptyCart: 'Sepetin boş.',
    toShop: 'Mağazaya git',
    addProductFirst: 'Lütfen önce sepete bir ürün ekle.',
    checking: 'Kontrol ediliyor …',
    product: 'Ürün',
    productFallback: 'ARDA HAIR Ürünü',
    quantity: 'Adet',
    shippingCost: 'Kargo ücreti',
    deliveryTo: 'Teslimat ülkesi:',
    shippingPending: 'Bu ülkenin kargo ücreti ödeme etkinleştirilmeden önce tanımlanacak ve siparişten önce gösterilecektir.',
    calculating: 'hesaplanıyor',
    paypalRedirect: 'Güvenli şekilde PayPal’a yönlendiriliyorsun …',
    stripeRedirect: 'Güvenli şekilde Stripe’a yönlendiriliyorsun …',
    secureChecking: 'Fiyat ve stok güvenli şekilde kontrol ediliyor …',
    priceCheckUnavailable: 'Fiyat kontrolü kullanılamıyor.',
    selectCountryFirst: 'Lütfen önce teslimat ülkeni seç.',
    paypalReady: 'Her şey kontrol edildi. PayPal ile güvenli şekilde devam edebilirsin.',
    stripeReady: 'Her şey kontrol edildi. Stripe ile güvenli şekilde devam edebilirsin.',
    confirmLegal: 'Fiyat ve stok onaylandı. Lütfen yasal bilgilendirmeleri de onayla.',
    confirmLegalFirst: 'Lütfen önce yasal bilgilendirmeleri onayla.',
    fillRequired: 'Lütfen tüm zorunlu alanları doğru şekilde doldur.',
    stockQuote: 'Bir ürün artık istediğin miktarda mevcut değil. Lütfen sepetini düzenle.',
    unavailableQuote: 'Bir ürün veya varyant artık mevcut değil. Lütfen sepetini düzenle.',
    shippingQuote: 'Bu teslimat ülkesi için kargo ücreti henüz tanımlanmamış.',
    quoteFailed: 'Fiyat ve stok kontrol edilemedi. Lütfen tekrar dene.',
    stockPayment: 'Bir ürün artık istediğin miktarda mevcut değil.',
    unavailablePayment: 'Bir ürün veya varyant artık mevcut değil.',
    shippingPayment: 'Bu teslimat ülkesi için kargo ücreti hesaplanamadı.',
    paypalFailed: 'PayPal başlatılamadı. Lütfen tekrar dene.',
    stripeFailed: 'Stripe başlatılamadı. Lütfen tekrar dene.'
  },

  en: {
    pageTitle: 'Checkout — ARDA HAIR',
    metaDescription: 'Secure checkout at ARDA HAIR.',
    secureCheckout: 'Secure Checkout',
    backShop: '← Back to shop',
    orderHeading: 'Your order',
    orderIntro: 'Please review your details before completing your order.',
    contact: 'Contact',
    contactCopy: 'For order confirmation and shipping information.',
    email: 'Email address *',
    firstName: 'First name *',
    lastName: 'Last name *',
    phone: 'Phone',
    deliveryAddress: 'Delivery address',
    deliveryCopy: 'We currently ship exclusively to member states of the European Union.',
    country: 'Country *',
    countrySelect: 'Select country',
    street: 'Street and house number *',
    postalCode: 'Postal code *',
    city: 'City *',
    company: 'Company / Salon',
    optional: '(optional)',
    shipping: 'Shipping',
    shippingCopy: 'Shipping costs are calculated according to the delivery country.',
    selectDeliveryCountry: 'Select delivery country',
    shippingPlaceholder: 'The shipping method, delivery time and shipping cost will then be displayed.',
    payment: 'Payment',
    paymentCopy: 'Payment will be processed securely in the next step.',
    card: 'Credit / Debit card',
    stripeSecure: 'Pay securely with Stripe',
    paypalSecure: 'Pay securely with PayPal',
    termsHtml: 'I accept the <a href="agb.html" target="_blank">Terms & Conditions</a> and acknowledge the <a href="widerruf.html" target="_blank">right of withdrawal information</a>.',
    privacyHtml: 'I acknowledge the <a href="datenschutz.html" target="_blank">Privacy Policy</a>.',
    submit: 'Order with obligation to pay',
    summaryKicker: 'ORDER SUMMARY',
    cartHeading: 'Your cart',
    cartLoading: 'Cart is loading...',
    subtotal: 'Subtotal',
    shippingLabel: 'Shipping',
    total: 'Total',
    summaryNote: 'The final total price including shipping will be displayed before the order is completed.',
    imprint: 'Legal Notice',
    privacy: 'Privacy',
    terms: 'Terms',
    withdrawal: 'Withdrawal',
    shippingReturns: 'Shipping & Returns',
    emptyCart: 'Your cart is empty.',
    toShop: 'Go to shop',
    addProductFirst: 'Please add a product to your cart first.',
    checking: 'Checking …',
    product: 'Product',
    productFallback: 'ARDA HAIR Product',
    quantity: 'Quantity',
    shippingCost: 'Shipping cost',
    deliveryTo: 'Delivery to',
    shippingPending: 'The shipping cost for this country will be configured before payment is enabled and displayed before the order is placed.',
    calculating: 'calculating',
    paypalRedirect: 'You are being securely redirected to PayPal …',
    stripeRedirect: 'You are being securely redirected to Stripe …',
    secureChecking: 'Price and stock are being securely checked …',
    priceCheckUnavailable: 'Price check is unavailable.',
    selectCountryFirst: 'Please select your delivery country first.',
    paypalReady: 'Everything is checked. You can now continue securely with PayPal.',
    stripeReady: 'Everything is checked. You can now continue securely with Stripe.',
    confirmLegal: 'Price and stock confirmed. Please also accept the legal notices.',
    confirmLegalFirst: 'Please accept the legal notices first.',
    fillRequired: 'Please fill in all required fields correctly.',
    stockQuote: 'A product is no longer available in the requested quantity. Please adjust your cart.',
    unavailableQuote: 'A product or variant is no longer available. Please adjust your cart.',
    shippingQuote: 'The shipping price for this delivery country has not been configured yet.',
    quoteFailed: 'Price and stock could not be checked. Please try again.',
    stockPayment: 'A product is no longer available in the requested quantity.',
    unavailablePayment: 'A product or variant is no longer available.',
    shippingPayment: 'Shipping could not be calculated for this delivery country.',
    paypalFailed: 'PayPal could not be started. Please try again.',
    stripeFailed: 'Stripe could not be started. Please try again.'
  }
};

function checkoutText(key) {
  return (
    checkoutTranslations[checkoutLang]?.[key] ||
    checkoutTranslations.de[key] ||
    key
  );
}
function setCheckoutText(selector, key) {
  const element =
    document.querySelector(selector);

  if (element) {
    element.textContent =
      checkoutText(key);
  }
}


function setCheckoutFieldLabel(
  inputId,
  key,
  optionalKey = ''
) {

  const label =
    document
      .getElementById(inputId)
      ?.closest('.field')
      ?.querySelector('span');

  if (!label) return;

  if (optionalKey) {

    label.innerHTML =
      `${escapeCheckoutHtml(checkoutText(key))}
       <small>${escapeCheckoutHtml(checkoutText(optionalKey))}</small>`;

    return;
  }

  label.textContent =
    checkoutText(key);

}


function localizeCheckoutCountries() {

  if (!checkoutCountry) return;

  const locale =
    checkoutLocales[checkoutLang] ||
    checkoutLocales.de;

  let displayNames = null;

  try {

    displayNames =
      new Intl.DisplayNames(
        [locale],
        { type: 'region' }
      );

  } catch {
    displayNames = null;
  }

  Array.from(
    checkoutCountry.options
  ).forEach(option => {

    if (!option.value) {

      option.textContent =
        checkoutText('countrySelect');

      return;
    }

    if (displayNames) {

      option.textContent =
        displayNames.of(option.value) ||
        option.textContent;

    }

  });

}


function applyCheckoutLanguage() {

  document.documentElement.lang =
    checkoutLang;

  document.title =
    checkoutText('pageTitle');

  const description =
    document.querySelector(
      'meta[name="description"]'
    );

  if (description) {
    description.setAttribute(
      'content',
      checkoutText('metaDescription')
    );
  }

  setCheckoutText(
    '.secure-label',
    'secureCheckout'
  );

  setCheckoutText(
    '.back-link',
    'backShop'
  );

  setCheckoutText(
    '.checkout-heading h1',
    'orderHeading'
  );

  setCheckoutText(
    '.checkout-heading p',
    'orderIntro'
  );


  const headings =
    checkoutForm?.querySelectorAll(
      '.checkout-card h2'
    ) || [];

  const copies =
    checkoutForm?.querySelectorAll(
      '.section-copy'
    ) || [];

  const headingKeys = [
    'contact',
    'deliveryAddress',
    'shipping',
    'payment'
  ];

  const copyKeys = [
    'contactCopy',
    'deliveryCopy',
    'shippingCopy',
    'paymentCopy'
  ];

  headingKeys.forEach(
    (key, index) => {

      if (headings[index]) {
        headings[index].textContent =
          checkoutText(key);
      }

    }
  );

  copyKeys.forEach(
    (key, index) => {

      if (copies[index]) {
        copies[index].textContent =
          checkoutText(key);
      }

    }
  );


  setCheckoutFieldLabel(
    'checkoutEmail',
    'email'
  );

  setCheckoutFieldLabel(
    'checkoutFirstName',
    'firstName'
  );

  setCheckoutFieldLabel(
    'checkoutLastName',
    'lastName'
  );

  setCheckoutFieldLabel(
    'checkoutPhone',
    'phone'
  );

  setCheckoutFieldLabel(
    'checkoutCountry',
    'country'
  );

  setCheckoutFieldLabel(
    'checkoutStreet',
    'street'
  );

  setCheckoutFieldLabel(
    'checkoutPostalCode',
    'postalCode'
  );

  setCheckoutFieldLabel(
    'checkoutCity',
    'city'
  );

  setCheckoutFieldLabel(
    'checkoutCompany',
    'company',
    'optional'
  );


  const stripeMethod =
    document
      .querySelector(
        'input[value="stripe"]'
      )
      ?.closest('.payment-method');

  if (stripeMethod) {

    const strong =
      stripeMethod.querySelector(
        'strong'
      );

    const span =
      stripeMethod.querySelector(
        'span'
      );

    if (strong) {
      strong.textContent =
        checkoutText('card');
    }

    if (span) {
      span.textContent =
        checkoutText('stripeSecure');
    }

  }


  const paypalMethod =
    document
      .querySelector(
        'input[value="paypal"]'
      )
      ?.closest('.payment-method');

  if (paypalMethod) {

    const span =
      paypalMethod.querySelector(
        'span'
      );

    if (span) {
      span.textContent =
        checkoutText('paypalSecure');
    }

  }


  const termsText =
    acceptTerms
      ?.closest('.checkbox-row')
      ?.querySelector('span');

  if (termsText) {
    termsText.innerHTML =
      checkoutText('termsHtml');
  }


  const privacyText =
    acceptPrivacy
      ?.closest('.checkbox-row')
      ?.querySelector('span');

  if (privacyText) {
    privacyText.innerHTML =
      checkoutText('privacyHtml');
  }


  if (checkoutSubmit) {
    checkoutSubmit.textContent =
      checkoutText('submit');
  }


  setCheckoutText(
    '.summary-kicker',
    'summaryKicker'
  );

  setCheckoutText(
    '.summary-inner > h2',
    'cartHeading'
  );

  setCheckoutText(
    '.summary-totals > div:nth-child(1) > span',
    'subtotal'
  );

  setCheckoutText(
    '.summary-totals > div:nth-child(2) > span',
    'shippingLabel'
  );

  setCheckoutText(
    '.summary-total > span',
    'total'
  );

  setCheckoutText(
    '.summary-note',
    'summaryNote'
  );


  const footerLinks = {
    'impressum.html': 'imprint',
    'datenschutz.html': 'privacy',
    'agb.html': 'terms',
    'widerruf.html': 'withdrawal',
    'versand-rueckgabe.html':
      'shippingReturns'
  };

  Object.entries(
    footerLinks
  ).forEach(([href, key]) => {

    const link =
      document.querySelector(
        `.checkout-footer a[href="${href}"]`
      );

    if (link) {
      link.textContent =
        checkoutText(key);
    }

  });


  localizeCheckoutCountries();

}


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
    checkoutLocales[checkoutLang] ||
      checkoutLocales.de,
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

function getCheckoutItemName(
  cartItem,
  trustedItem
) {

  if (trustedItem) {

    if (checkoutLang === 'tr') {
      return (
        trustedItem.name_tr ||
        trustedItem.name_de ||
        trustedItem.name_en ||
        cartItem?.name ||
        checkoutText('productFallback')
      );
    }

    if (checkoutLang === 'en') {
      return (
        trustedItem.name_en ||
        trustedItem.name_de ||
        trustedItem.name_tr ||
        cartItem?.name ||
        checkoutText('productFallback')
      );
    }

    return (
      trustedItem.name_de ||
      trustedItem.name_en ||
      trustedItem.name_tr ||
      cartItem?.name ||
      checkoutText('productFallback')
    );

  }

  return (
    cartItem?.name ||
    checkoutText('productFallback')
  );

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
        ${escapeCheckoutHtml(checkoutText('emptyCart'))}
        <br><br>
        <a
          href="index.html#shop"
          style="color:#e7a7bb;font-weight:700;"
        >
          ${escapeCheckoutHtml(checkoutText('toShop'))}
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
      checkoutText('addProductFirst');

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

      const productName =
        getCheckoutItemName(
          item,
          trusted
        );

      const linePrice =
        trusted
          ? formatCheckoutMoney(
              trusted.lineTotalCents
            )
          : checkoutQuoteLoading
            ? checkoutText('checking')
            : '—';

      const image =
        item.image
          ? `
            <img
              src="${escapeCheckoutHtml(item.image)}"
              alt="${escapeCheckoutHtml(productName || checkoutText('product'))}"
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
                productName
              )}
            </strong>

            ${variant}

            <span>
              ${escapeCheckoutHtml(checkoutText('quantity'))}: ${quantity}
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
          ${escapeCheckoutHtml(checkoutText('shippingCost'))}:
          ${formatCheckoutMoney(
            checkoutQuote.shippingCents
          )}
        </span>
      `;

    }

  } else {

    checkoutSubtotal.textContent =
      checkoutQuoteLoading
        ? checkoutText('checking')
        : '—';

    checkoutTotal.textContent =
      checkoutQuoteLoading
        ? checkoutText('checking')
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
        checkoutText('stockQuote');

    } else if (
      error.message ===
      'UNAVAILABLE'
    ) {

      checkoutQuoteError =
        checkoutText('unavailableQuote');

    } else if (
      error.message ===
      'SHIPPING'
    ) {

      checkoutQuoteError =
        checkoutText('shippingQuote');

    } else {

      checkoutQuoteError =
        checkoutText('quoteFailed');

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
        ${escapeCheckoutHtml(checkoutText('selectDeliveryCountry'))}
      </strong>

      <span>
        ${escapeCheckoutHtml(checkoutText('shippingPlaceholder'))}
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
      ${escapeCheckoutHtml(checkoutText('deliveryTo'))} ${escapeCheckoutHtml(countryName)}
    </strong>

    <span>
      ${escapeCheckoutHtml(checkoutText('shippingPending'))}
    </span>
  `;


  checkoutShipping.textContent =
    checkoutText('calculating');

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
      getPaymentMethod() === 'paypal'
        ? checkoutText('paypalRedirect')
        : checkoutText('stripeRedirect');

    return;

  }


  if (!cart.length) {

    checkoutMessage.textContent =
      checkoutText('addProductFirst');

    return;

  }


  if (checkoutQuoteLoading) {

    checkoutMessage.textContent =
      checkoutText('secureChecking');

    return;

  }


  if (checkoutQuoteError) {

    checkoutMessage.textContent =
      checkoutQuoteError;

    return;

  }


  if (!checkoutQuote) {

    checkoutMessage.textContent =
      checkoutText('priceCheckUnavailable');

    return;

  }


  if (!checkoutCountry?.value) {

    checkoutMessage.textContent =
      checkoutText('selectCountryFirst');

    return;

  }


  if (legalAccepted) {

    checkoutSubmit.disabled =
      false;

    checkoutMessage.textContent =
      getPaymentMethod() === 'paypal'
        ? checkoutText('paypalReady')
        : checkoutText('stripeReady');

  } else {

    checkoutMessage.textContent =
      checkoutText('confirmLegal');

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
          checkoutText('confirmLegalFirst');

        return;

      }


      if (!checkoutForm.checkValidity()) {

        checkoutForm.reportValidity();

        checkoutMessage.textContent =
          checkoutText('fillRequired');

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


        const { data: sessionData } =
          await checkoutDb.auth.getSession();

        const accessToken =
          sessionData?.session?.access_token || null;


        const response =
          await fetch(
            endpoint,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                ...(accessToken
                  ? { Authorization: 'Bearer ' + accessToken }
                  : {})
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

        updateCheckoutState();


        if (
          error.message ===
          'STOCK'
        ) {

          checkoutMessage.textContent =
            checkoutText('stockPayment');

        } else if (
          error.message ===
          'UNAVAILABLE'
        ) {

          checkoutMessage.textContent =
            checkoutText('unavailablePayment');

        } else if (
          error.message ===
          'SHIPPING'
        ) {

          checkoutMessage.textContent =
            checkoutText('shippingPayment');

        } else {

          checkoutMessage.textContent =
            paymentMethod === 'paypal'
              ? checkoutText('paypalFailed')
              : checkoutText('stripeFailed');

        }


      }

    }
  );


/* =========================================
   SYNC
========================================= */

async function refreshCheckout() {

  const savedLang =
    localStorage.getItem('arda-lang');

  checkoutLang =
    checkoutLanguages.includes(savedLang)
      ? savedLang
      : 'de';

  applyCheckoutLanguage();

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
