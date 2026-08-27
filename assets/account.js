/* =========================================
   ARDA HAIR â€” CUSTOMER ACCOUNT
========================================= */

const ACCOUNT_SUPABASE_URL =
  'https://zehtftzxrjuoqcpcqmcs.supabase.co';

const ACCOUNT_SUPABASE_KEY =
   'sb_publishable_wUwY1wDw05gblt9WVOMT6Q_xxIcGKvF';
/* =========================================
   SHARED CUSTOMER AUTH STORAGE
========================================= */

const accountAuthStorage = {

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


const accountDb = supabase.createClient(
  ACCOUNT_SUPABASE_URL,
  ACCOUNT_SUPABASE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: accountAuthStorage
    }
  }
);


const $ = id =>
  document.getElementById(id);


let currentCustomer = null;
let currentOrders = [];

let accountLang =
  localStorage.getItem('arda-lang') || 'de';

if (!['de', 'tr', 'en'].includes(accountLang)) {
  accountLang = 'de';
}


/* =========================================
   TRANSLATIONS
========================================= */

const accountText = {

  de: {
    mainTitle: 'Dein persÃ¶nlicher Bereich.',
    mainText:
      'Melde dich an oder erstelle ein Konto, um deine persÃ¶nlichen Daten, Favoriten und deinen Warenkorb zu verwalten.',

    loginTab: 'Anmelden',
    registerTab: 'Konto erstellen',

    welcomeBack: 'WILLKOMMEN ZURÃœCK',
    loginTitle: 'Anmelden',
    loginText: 'Greife auf dein ARDA HAIR Konto zu.',

    newAccount: 'NEUES KONTO',
    registerTitle: 'Registrieren',
    registerText:
      'Erstelle dein persÃ¶nliches ARDA HAIR Konto.',

    email: 'E-Mail-Adresse',
    password: 'Passwort',
    passwordRepeat: 'Passwort wiederholen',
    fullName: 'Vor- und Nachname',

    login: 'Anmelden',
    register: 'Konto erstellen',
    forgot: 'Passwort vergessen?',
    remember: 'Angemeldet bleiben',

    show: 'Anzeigen',
    hide: 'Verbergen',

    resetTitle: 'Passwort zurÃ¼cksetzen',
    resetText:
      'Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum ZurÃ¼cksetzen.',
    sendLink: 'Link senden',
    backLogin: 'ZurÃ¼ck zur Anmeldung',

    loginSuccess: 'Anmeldung erfolgreich.',
    registerSuccess:
      'Konto erstellt. Bitte prÃ¼fe gegebenenfalls deine E-Mails und bestÃ¤tige deine Adresse.',
    resetSuccess:
      'Wir haben dir eine E-Mail zum ZurÃ¼cksetzen des Passworts gesendet.',

    passwordsDifferent:
      'Die PasswÃ¶rter stimmen nicht Ã¼berein.',

    terms:
      'Bitte akzeptiere die Datenschutzbestimmungen und GeschÃ¤ftsbedingungen.',

    welcome: 'Willkommen',

    logout: 'Abmelden',

    profileSaved:
      'Deine Daten wurden gespeichert.',

    genericError:
      'Etwas ist schiefgelaufen. Bitte versuche es erneut.',

    newPassword:
      'Neues Passwort',

    savePassword:
      'Neues Passwort speichern',

    passwordChanged:
      'Dein Passwort wurde erfolgreich geÃ¤ndert.',

    profile: 'PersÃ¶nliche Daten',

    phone: 'Telefonnummer',
    country: 'Land',
    address1: 'StraÃŸe und Hausnummer',
    address2: 'Adresszusatz',
    postalCode: 'Postleitzahl',
    city: 'Stadt',
    save: 'Ã„nderungen speichern'
  },


  tr: {
    mainTitle: 'KiÅŸisel hesabÄ±n.',
    mainText:
      'KiÅŸisel bilgilerini, favorilerini ve sepetini yÃ¶netmek iÃ§in giriÅŸ yap veya yeni bir hesap oluÅŸtur.',

    loginTab: 'GiriÅŸ Yap',
    registerTab: 'Hesap OluÅŸtur',

    welcomeBack: 'TEKRAR HOÅž GELDÄ°N',
    loginTitle: 'GiriÅŸ Yap',
    loginText: 'ARDA HAIR hesabÄ±na giriÅŸ yap.',

    newAccount: 'YENÄ° HESAP',
    registerTitle: 'KayÄ±t Ol',
    registerText:
      'Kendine ait ARDA HAIR hesabÄ±nÄ± oluÅŸtur.',

    email: 'E-posta adresi',
    password: 'Åžifre',
    passwordRepeat: 'Åžifreyi tekrar gir',
    fullName: 'Ad Soyad',

    login: 'GiriÅŸ Yap',
    register: 'Hesap OluÅŸtur',
    forgot: 'Åžifremi unuttum',
    remember: 'Oturumumu aÃ§Ä±k tut',

    show: 'GÃ¶ster',
    hide: 'Gizle',

    resetTitle: 'Åžifreni sÄ±fÄ±rla',
    resetText:
      'E-posta adresini gir. Åžifre yenileme baÄŸlantÄ±sÄ±nÄ± sana gÃ¶ndereceÄŸiz.',
    sendLink: 'BaÄŸlantÄ±yÄ± gÃ¶nder',
    backLogin: 'GiriÅŸ ekranÄ±na dÃ¶n',

    loginSuccess: 'GiriÅŸ baÅŸarÄ±lÄ±.',
    registerSuccess:
      'HesabÄ±n oluÅŸturuldu. Gerekirse e-posta adresine gelen doÄŸrulama baÄŸlantÄ±sÄ±nÄ± onayla.',
    resetSuccess:
      'Åžifre sÄ±fÄ±rlama baÄŸlantÄ±sÄ±nÄ± e-posta adresine gÃ¶nderdik.',

    passwordsDifferent:
      'GirdiÄŸin ÅŸifreler aynÄ± deÄŸil.',

    terms:
      'LÃ¼tfen gizlilik politikasÄ±nÄ± ve kullanÄ±m koÅŸullarÄ±nÄ± kabul et.',

    welcome: 'HoÅŸ geldin',

    logout: 'Ã‡Ä±kÄ±ÅŸ Yap',

    profileSaved:
      'Bilgilerin kaydedildi.',

    genericError:
      'Bir hata oluÅŸtu. LÃ¼tfen tekrar dene.',

    newPassword:
      'Yeni ÅŸifre',

    savePassword:
      'Yeni ÅŸifreyi kaydet',

    passwordChanged:
      'Åžifren baÅŸarÄ±yla deÄŸiÅŸtirildi.',

    profile: 'KiÅŸisel bilgiler',

    phone: 'Telefon numarasÄ±',
    country: 'Ãœlke',
    address1: 'Sokak ve kapÄ± numarasÄ±',
    address2: 'Adres detayÄ±',
    postalCode: 'Posta kodu',
    city: 'Åžehir',
    save: 'DeÄŸiÅŸiklikleri kaydet'
  },


  en: {
    mainTitle: 'Your personal space.',
    mainText:
      'Sign in or create an account to manage your personal details, favorites and shopping bag.',

    loginTab: 'Sign in',
    registerTab: 'Create account',

    welcomeBack: 'WELCOME BACK',
    loginTitle: 'Sign in',
    loginText: 'Access your ARDA HAIR account.',

    newAccount: 'NEW ACCOUNT',
    registerTitle: 'Register',
    registerText:
      'Create your personal ARDA HAIR account.',

    email: 'Email address',
    password: 'Password',
    passwordRepeat: 'Repeat password',
    fullName: 'Full name',

    login: 'Sign in',
    register: 'Create account',
    forgot: 'Forgot password?',
    remember: 'Keep me signed in',

    show: 'Show',
    hide: 'Hide',

    resetTitle: 'Reset password',
    resetText:
      'Enter your email address and we will send you a password reset link.',
    sendLink: 'Send link',
    backLogin: 'Back to sign in',

    loginSuccess: 'Signed in successfully.',
    registerSuccess:
      'Your account has been created. Please confirm your email address if required.',
    resetSuccess:
      'We sent a password reset link to your email.',

    passwordsDifferent:
      'The passwords do not match.',

    terms:
      'Please accept the privacy policy and terms.',

    welcome: 'Welcome',

    logout: 'Sign out',

    profileSaved:
      'Your details have been saved.',

    genericError:
      'Something went wrong. Please try again.',

    newPassword:
      'New password',

    savePassword:
      'Save new password',

    passwordChanged:
      'Your password has been changed successfully.',

    profile: 'Personal information',

    phone: 'Phone number',
    country: 'Country',
    address1: 'Street and house number',
    address2: 'Address line 2',
    postalCode: 'Postal code',
    city: 'City',
    save: 'Save changes'
  }

};



/* =========================================
   ACCOUNT LANGUAGE COMPLETION 2026
========================================= */

Object.assign(
  accountText.de,
  {
    pageTitle:
      'ARDA HAIR â€” Mein Konto',

    pageDescription:
      'ARDA HAIR Kundenkonto â€“ anmelden, registrieren und persÃ¶nliche Daten verwalten.',

    announcement:
      'Premium Hair Â· NatÃ¼rliche QualitÃ¤t Â· ARDA HAIR',

    navCollection: 'Kollektion',
    navQuality: 'QualitÃ¤t',
    navGallery: 'Galerie',
    navShop: 'Shop',
    homeShop: 'Shop',

    accountKicker:
      'ARDA ACCOUNT',

    termsAgreement:
      'Ich akzeptiere die Datenschutzbestimmungen und GeschÃ¤ftsbedingungen.',

    resetKicker:
      'PASSWORT',

    dashboardKicker:
      'MEIN KONTO',

    dataTitle:
      'Meine Daten',

    dataText:
      'Name, Telefonnummer und Adresse verwalten.',

    editData:
      'Daten bearbeiten â†’',

    ordersTitle:
      'Bestellungen',

    ordersText:
      'Deine zukÃ¼nftigen Bestellungen werden hier angezeigt.',

    comingSoon:
      'Bald verfÃ¼gbar',

    favoritesTitle:
      'Favoriten',

    favoritesText:
      'Gespeicherte Produkte jederzeit wiederfinden.',

    viewProducts:
      'Produkte ansehen â†’',

    cartTitle:
      'Warenkorb',

    cartText:
      'Deine ausgewÃ¤hlten Produkte bleiben gespeichert.',

    toShop:
      'Zum Shop â†’',

    profileKicker:
      'PROFIL',

    profileText:
      'Diese Informationen werden in deinem ARDA HAIR Konto gespeichert.',

    footerText:
      'Premium Hair Extensions Â· Deutschland',

    imprint:
      'Impressum',

    privacy:
      'Datenschutz',

    termsLink:
      'AGB',

    passwordPlaceholder:
      'Dein Passwort',

    namePlaceholder:
      'Vor- und Nachname',

    passwordMinPlaceholder:
      'Mindestens 8 Zeichen',

    passwordRepeatPlaceholder:
      'Passwort wiederholen',

    address1Placeholder:
      'StraÃŸe 10',

    address2Placeholder:
      'Wohnung, Etage usw. (optional)',

    postalPlaceholder:
      '77855',

    cityPlaceholder:
      'Achern'
  }
);


Object.assign(
  accountText.tr,
  {
    pageTitle:
      'ARDA HAIR â€” HesabÄ±m',

    pageDescription:
      'ARDA HAIR mÃ¼ÅŸteri hesabÄ± â€“ giriÅŸ yap, kayÄ±t ol ve kiÅŸisel bilgilerini yÃ¶net.',

    announcement:
      'Premium SaÃ§ Â· DoÄŸal Kalite Â· ARDA HAIR',

    navCollection: 'Koleksiyon',
    navQuality: 'Kalite',
    navGallery: 'Galeri',
    navShop: 'MaÄŸaza',
    homeShop: 'MaÄŸaza',

    accountKicker:
      'ARDA HESAP',

    termsAgreement:
      'Gizlilik politikasÄ±nÄ± ve genel ÅŸartlarÄ± kabul ediyorum.',

    resetKicker:
      'ÅžÄ°FRE',

    dashboardKicker:
      'HESABIM',

    dataTitle:
      'Bilgilerim',

    dataText:
      'Ad, telefon numarasÄ± ve adres bilgilerini yÃ¶net.',

    editData:
      'Bilgileri dÃ¼zenle â†’',

    ordersTitle:
      'SipariÅŸler',

    ordersText:
      'Gelecekteki sipariÅŸlerin burada gÃ¶sterilecek.',

    comingSoon:
      'YakÄ±nda',

    favoritesTitle:
      'Favoriler',

    favoritesText:
      'KaydettiÄŸin Ã¼rÃ¼nlere istediÄŸin zaman tekrar ulaÅŸ.',

    viewProducts:
      'ÃœrÃ¼nleri gÃ¶rÃ¼ntÃ¼le â†’',

    cartTitle:
      'Sepet',

    cartText:
      'SeÃ§tiÄŸin Ã¼rÃ¼nler sepetinde kayÄ±tlÄ± kalÄ±r.',

    toShop:
      'MaÄŸazaya git â†’',

    profileKicker:
      'PROFÄ°L',

    profileText:
      'Bu bilgiler ARDA HAIR hesabÄ±nda saklanÄ±r.',

    footerText:
      'Premium Hair Extensions Â· Almanya',

    imprint:
      'KÃ¼nye',

    privacy:
      'Gizlilik',

    termsLink:
      'Åžartlar',

    passwordPlaceholder:
      'Åžifren',

    namePlaceholder:
      'Ad Soyad',

    passwordMinPlaceholder:
      'En az 8 karakter',

    passwordRepeatPlaceholder:
      'Åžifreyi tekrar gir',

    address1Placeholder:
      'Sokak ve kapÄ± numarasÄ±',

    address2Placeholder:
      'Daire, kat vb. (isteÄŸe baÄŸlÄ±)',

    postalPlaceholder:
      'Posta kodu',

    cityPlaceholder:
      'Åžehir'
  }
);


Object.assign(
  accountText.en,
  {
    pageTitle:
      'ARDA HAIR â€” My Account',

    pageDescription:
      'ARDA HAIR customer account â€“ sign in, register and manage your personal details.',

    announcement:
      'Premium Hair Â· Natural Quality Â· ARDA HAIR',

    navCollection: 'Collection',
    navQuality: 'Quality',
    navGallery: 'Gallery',
    navShop: 'Shop',
    homeShop: 'Shop',

    accountKicker:
      'ARDA ACCOUNT',

    termsAgreement:
      'I accept the privacy policy and terms and conditions.',

    resetKicker:
      'PASSWORD',

    dashboardKicker:
      'MY ACCOUNT',

    dataTitle:
      'My Details',

    dataText:
      'Manage your name, phone number and address.',

    editData:
      'Edit details â†’',

    ordersTitle:
      'Orders',

    ordersText:
      'Your future orders will be displayed here.',

    comingSoon:
      'Coming soon',

    favoritesTitle:
      'Favorites',

    favoritesText:
      'Find your saved products anytime.',

    viewProducts:
      'View products â†’',

    cartTitle:
      'Shopping Bag',

    cartText:
      'Your selected products remain saved.',

    toShop:
      'Go to shop â†’',

    profileKicker:
      'PROFILE',

    profileText:
      'This information is stored in your ARDA HAIR account.',

    footerText:
      'Premium Hair Extensions Â· Germany',

    imprint:
      'Legal Notice',

    privacy:
      'Privacy',

    termsLink:
      'Terms',

    passwordPlaceholder:
      'Your password',

    namePlaceholder:
      'Full name',

    passwordMinPlaceholder:
      'At least 8 characters',

    passwordRepeatPlaceholder:
      'Repeat password',

    address1Placeholder:
      'Street and house number',

    address2Placeholder:
      'Apartment, floor, etc. (optional)',

    postalPlaceholder:
      'Postal code',

    cityPlaceholder:
      'City'
  }
);



Object.assign(
  accountText.de,
  {
    ordersKicker: 'BESTELLUNGEN',
    ordersHeading: 'Meine Bestellungen',
    ordersIntro: 'Hier findest du deine bisherigen Bestellungen.',
    ordersLoading: 'Bestellungen werden geladen...',
    ordersEmpty: 'Du hast noch keine Bestellungen.',
    ordersError: 'Bestellungen konnten nicht geladen werden.',
    orderPayment: 'Zahlung',
    orderStatus: 'Status',
    orderQuantity: 'Menge'
  }
);

Object.assign(
  accountText.tr,
  {
    ordersKicker: 'SİPARİŞLER',
    ordersHeading: 'Siparişlerim',
    ordersIntro: 'Geçmiş siparişlerini burada görebilirsin.',
    ordersLoading: 'Siparişler yükleniyor...',
    ordersEmpty: 'Henüz siparişin bulunmuyor.',
    ordersError: 'Siparişler yüklenemedi.',
    orderPayment: 'Ödeme',
    orderStatus: 'Durum',
    orderQuantity: 'Adet'
  }
);

Object.assign(
  accountText.en,
  {
    ordersKicker: 'ORDERS',
    ordersHeading: 'My Orders',
    ordersIntro: 'You can find your previous orders here.',
    ordersLoading: 'Loading orders...',
    ordersEmpty: 'You do not have any orders yet.',
    ordersError: 'Orders could not be loaded.',
    orderPayment: 'Payment',
    orderStatus: 'Status',
    orderQuantity: 'Quantity'
  }
);


Object.assign(
  accountText.de,
  {
    viewOrders: 'Bestellungen ansehen →'
  }
);

Object.assign(
  accountText.tr,
  {
    viewOrders: 'Siparişleri gör →'
  }
);

Object.assign(
  accountText.en,
  {
    viewOrders: 'View orders →'
  }
);
function setAccountText(
  selector,
  value
) {

  const element =
    document.querySelector(selector);

  if (element && value !== undefined) {
    element.textContent = value;
  }

}


function setAccountPlaceholder(
  id,
  value
) {

  const element = $(id);

  if (element) {
    element.placeholder = value;
  }

}


function t(key) {
  return (
    accountText[accountLang]?.[key] ||
    accountText.de[key] ||
    key
  );
}



function formatOrderMoney(
  cents,
  currency = 'EUR'
) {

  return new Intl.NumberFormat(
    accountLang === 'tr'
      ? 'tr-TR'
      : accountLang === 'en'
        ? 'en-GB'
        : 'de-DE',
    {
      style: 'currency',
      currency: currency || 'EUR'
    }
  ).format(
    Number(cents || 0) / 100
  );

}


function formatOrderDate(value) {

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  return new Intl.DateTimeFormat(
    accountLang === 'tr'
      ? 'tr-TR'
      : accountLang === 'en'
        ? 'en-GB'
        : 'de-DE',
    {
      dateStyle: 'medium'
    }
  ).format(date);

}

/* =========================================
   LANGUAGE
========================================= */

function setLabel(inputId, text) {

  const input = $(inputId);

  const label =
    input?.closest('label');

  const span =
    label?.querySelector(
      ':scope > span'
    );

  if (span) {
    span.textContent = text;
  }

}



function applyAccountLanguage() {

  document.documentElement.lang =
    accountLang;

  localStorage.setItem(
    'arda-lang',
    accountLang
  );


  document
    .querySelectorAll(
      '[data-account-lang]'
    )
    .forEach(button => {

      button.classList.toggle(
        'active',
        button.dataset.accountLang ===
          accountLang
      );

    });


  document.title =
    t('pageTitle');

  const metaDescription =
    document.querySelector(
      'meta[name="description"]'
    );

  if (metaDescription) {
    metaDescription.content =
      t('pageDescription');
  }


  setAccountText(
    '.announcement',
    t('announcement')
  );

  setAccountText(
    '.desktop-nav a[href="index.html#collection"]',
    t('navCollection')
  );

  setAccountText(
    '.desktop-nav a[href="index.html#quality"]',
    t('navQuality')
  );

  setAccountText(
    '.desktop-nav a[href="index.html#gallery"]',
    t('navGallery')
  );

  setAccountText(
    '.desktop-nav a[href="index.html#shop"]',
    t('navShop')
  );

  setAccountText(
    '.account-home-button',
    t('homeShop')
  );


  setAccountText(
    '.account-intro .section-kicker',
    t('accountKicker')
  );

  if ($('accountMainTitle')) {
    $('accountMainTitle').textContent =
      t('mainTitle');
  }

  if ($('accountMainText')) {
    $('accountMainText').textContent =
      t('mainText');
  }


  if ($('showLogin')) {
    $('showLogin').textContent =
      t('loginTab');
  }

  if ($('showRegister')) {
    $('showRegister').textContent =
      t('registerTab');
  }


  const loginHeading =
    document.querySelector(
      '#loginPanel .account-panel-heading'
    );

  if (loginHeading) {

    setAccountText(
      '#loginPanel .account-panel-heading span',
      t('welcomeBack')
    );

    setAccountText(
      '#loginPanel .account-panel-heading h2',
      t('loginTitle')
    );

    setAccountText(
      '#loginPanel .account-panel-heading p',
      t('loginText')
    );

  }


  const registerHeading =
    document.querySelector(
      '#registerPanel .account-panel-heading'
    );

  if (registerHeading) {

    setAccountText(
      '#registerPanel .account-panel-heading span',
      t('newAccount')
    );

    setAccountText(
      '#registerPanel .account-panel-heading h2',
      t('registerTitle')
    );

    setAccountText(
      '#registerPanel .account-panel-heading p',
      t('registerText')
    );

  }


  setAccountText(
    '#resetPanel .account-panel-heading span',
    t('resetKicker')
  );

  setAccountText(
    '#resetPanel .account-panel-heading h2',
    t('resetTitle')
  );

  setAccountText(
    '#resetPanel .account-panel-heading p',
    t('resetText')
  );


  setLabel(
    'loginEmail',
    t('email')
  );

  setLabel(
    'loginPassword',
    t('password')
  );

  setLabel(
    'registerName',
    t('fullName')
  );

  setLabel(
    'registerEmail',
    t('email')
  );

  setLabel(
    'registerPassword',
    t('password')
  );

  setLabel(
    'registerPasswordConfirm',
    t('passwordRepeat')
  );

  setLabel(
    'resetEmail',
    t('email')
  );


  setAccountPlaceholder(
    'loginPassword',
    t('passwordPlaceholder')
  );

  setAccountPlaceholder(
    'registerName',
    t('namePlaceholder')
  );

  setAccountPlaceholder(
    'registerPassword',
    t('passwordMinPlaceholder')
  );

  setAccountPlaceholder(
    'registerPasswordConfirm',
    t('passwordRepeatPlaceholder')
  );


  setAccountText(
    '#customerLoginForm .account-primary-button',
    t('login')
  );

  setAccountText(
    '#customerRegisterForm .account-primary-button',
    t('register')
  );

  setAccountText(
    '#resetPasswordForm .account-primary-button',
    t('sendLink')
  );

  setAccountText(
    '#backToLogin',
    t('backLogin')
  );

  setAccountText(
    '#forgotPasswordButton',
    t('forgot')
  );

  setAccountText(
    '.remember-option span',
    t('remember')
  );

  setAccountText(
    '.account-checkbox span',
    t('termsAgreement')
  );


  document
    .querySelectorAll(
      '.password-toggle'
    )
    .forEach(button => {

      const target =
        $(button.dataset.passwordTarget);

      button.textContent =
        target?.type === 'text'
          ? t('hide')
          : t('show');

    });


  setAccountText(
    '.dashboard-heading .section-kicker',
    t('dashboardKicker')
  );


  const cards =
    document.querySelectorAll(
      '.account-overview-card'
    );

  if (cards[0]) {

    const title =
      cards[0].querySelector('h3');

    const text =
      cards[0].querySelector('p');

    const link =
      cards[0].querySelector('a');

    if (title) {
      title.textContent =
        t('dataTitle');
    }

    if (text) {
      text.textContent =
        t('dataText');
    }

    if (link) {
      link.textContent =
        t('editData');
    }

  }


  if (cards[1]) {

    const title =
      cards[1].querySelector('h3');

    const text =
      cards[1].querySelector('p');

    const link =
      cards[1].querySelector(
        '.orders-overview-link'
      );

    if (title) {
      title.textContent =
        t('ordersTitle');
    }

    if (text) {
      text.textContent =
        t('ordersText');
    }

    if (link) {
      link.textContent =
        t('viewOrders');
    }

  }


  if (cards[2]) {

    const title =
      cards[2].querySelector('h3');

    const text =
      cards[2].querySelector('p');

    const link =
      cards[2].querySelector('a');

    if (title) {
      title.textContent =
        t('favoritesTitle');
    }

    if (text) {
      text.textContent =
        t('favoritesText');
    }

    if (link) {
      link.textContent =
        t('viewProducts');
    }

  }


  if (cards[3]) {

    const title =
      cards[3].querySelector('h3');

    const text =
      cards[3].querySelector('p');

    const link =
      cards[3].querySelector('a');

    if (title) {
      title.textContent =
        t('cartTitle');
    }

    if (text) {
      text.textContent =
        t('cartText');
    }

    if (link) {
      link.textContent =
        t('toShop');
    }

  }



  setAccountText(
    '#ordersKicker',
    t('ordersKicker')
  );

  setAccountText(
    '#ordersHeading',
    t('ordersHeading')
  );

  setAccountText(
    '#ordersIntro',
    t('ordersIntro')
  );
  setAccountText(
    '.profile-heading .section-kicker',
    t('profileKicker')
  );

  setAccountText(
    '.profile-heading h2',
    t('profile')
  );

  setAccountText(
    '.profile-heading p',
    t('profileText')
  );


  setLabel(
    'profileName',
    t('fullName')
  );

  setLabel(
    'profilePhone',
    t('phone')
  );

  setLabel(
    'profileCountry',
    t('country')
  );

  setLabel(
    'profileAddress1',
    t('address1')
  );

  setLabel(
    'profileAddress2',
    t('address2')
  );

  setLabel(
    'profilePostalCode',
    t('postalCode')
  );

  setLabel(
    'profileCity',
    t('city')
  );


  setAccountPlaceholder(
    'profileName',
    t('namePlaceholder')
  );

  setAccountPlaceholder(
    'profileAddress1',
    t('address1Placeholder')
  );

  setAccountPlaceholder(
    'profileAddress2',
    t('address2Placeholder')
  );

  setAccountPlaceholder(
    'profilePostalCode',
    t('postalPlaceholder')
  );

  setAccountPlaceholder(
    'profileCity',
    t('cityPlaceholder')
  );


  setAccountText(
    '.profile-save',
    t('save')
  );

  setAccountText(
    '#customerLogout',
    t('logout')
  );


  setAccountText(
    'footer p',
    t('footerText')
  );

  const footerLinks =
    document.querySelectorAll(
      'footer .footer-links a'
    );

  if (footerLinks[0]) {
    footerLinks[0].textContent =
      t('imprint');
  }

  if (footerLinks[1]) {
    footerLinks[1].textContent =
      t('privacy');
  }

  if (footerLinks[2]) {
    footerLinks[2].textContent =
      t('termsLink');
  }


  /*
    Password recovery mailinden
    gelinen Ã¶zel ekran da dili
    anÄ±nda deÄŸiÅŸtirsin.
  */

  if ($('newPasswordForm')) {

    setAccountText(
      '#authView .account-panel-heading span',
      t('accountKicker')
    );

    setAccountText(
      '#authView .account-panel-heading h2',
      t('newPassword')
    );

    setAccountText(
      '#authView .account-panel-heading p',
      t('newPassword')
    );

    setLabel(
      'newCustomerPassword',
      t('newPassword')
    );

    setAccountText(
      '#newPasswordForm .account-primary-button',
      t('savePassword')
    );

  }


  if (currentCustomer) {

    updateCustomerHeader(
      currentCustomer
    );

  }

}


/* =========================================
   PANELS
========================================= */

function showAuthPanel(type) {

  $('loginPanel').hidden =
    type !== 'login';

  $('registerPanel').hidden =
    type !== 'register';

  $('resetPanel').hidden =
    type !== 'reset';


  $('showLogin').classList.toggle(
    'active',
    type === 'login'
  );

  $('showRegister').classList.toggle(
    'active',
    type === 'register'
  );


  $('authMessage').textContent = '';
  $('authMessage').className =
    'account-message';

}


$('showLogin')
  .addEventListener(
    'click',
    () => showAuthPanel('login')
  );


$('showRegister')
  .addEventListener(
    'click',
    () => showAuthPanel('register')
  );


$('forgotPasswordButton')
  .addEventListener(
    'click',
    () => {

      $('resetEmail').value =
        $('loginEmail').value || '';

      showAuthPanel('reset');

    }
  );


$('backToLogin')
  .addEventListener(
    'click',
    () => showAuthPanel('login')
  );


/* =========================================
   PASSWORD VISIBILITY
========================================= */

document
  .querySelectorAll(
    '.password-toggle'
  )
  .forEach(button => {

    button.addEventListener(
      'click',
      () => {

        const input =
          $(
            button.dataset
              .passwordTarget
          );

        if (!input) return;

        input.type =
          input.type === 'password'
            ? 'text'
            : 'password';

        button.textContent =
          input.type === 'text'
            ? t('hide')
            : t('show');

      }
    );

  });


/* =========================================
   MESSAGE
========================================= */

function authMessage(
  message,
  type = ''
) {

  const element =
    $('authMessage');

  element.textContent =
    message || '';

  element.className =
    'account-message';

  if (type) {
    element.classList.add(type);
  }

}


function profileMessage(
  message,
  type = ''
) {

  const element =
    $('profileMessage');

  element.textContent =
    message || '';

  element.className =
    'account-message';

  if (type) {
    element.classList.add(type);
  }

}


/* =========================================
   LOGIN
========================================= */

$('customerLoginForm')
  .addEventListener(
    'submit',
    async event => {

      event.preventDefault();

      authMessage('');

      const email =
        $('loginEmail')
          .value
          .trim();

      const password =
        $('loginPassword').value;


      const remember =
        $('rememberMe').checked;

      localStorage.setItem(
        'ardaRememberLogin',
        remember ? '1' : '0'
      );


      const button =
        event.currentTarget
          .querySelector(
            '.account-primary-button'
          );

      button.disabled = true;


      const {
        data,
        error
      } =
        await accountDb.auth
          .signInWithPassword({
            email,
            password
          });


      button.disabled = false;


      if (error) {

        authMessage(
          error.message,
          'error'
        );

        return;
      }


      authMessage(
        t('loginSuccess'),
        'success'
      );


      if (data.session?.user) {

        await showCustomerDashboard(
          data.session.user
        );

      }

    }
  );


/* =========================================
   REGISTER
========================================= */

$('customerRegisterForm')
  .addEventListener(
    'submit',
    async event => {

      event.preventDefault();

      authMessage('');


      const fullName =
        $('registerName')
          .value
          .trim();

      const email =
        $('registerEmail')
          .value
          .trim();

      const password =
        $('registerPassword').value;

      const confirmation =
        $('registerPasswordConfirm')
          .value;


      if (password !== confirmation) {

        authMessage(
          t('passwordsDifferent'),
          'error'
        );

        return;

      }


      if (!$('acceptTerms').checked) {

        authMessage(
          t('terms'),
          'error'
        );

        return;

      }


      localStorage.setItem(
        'ardaRememberLogin',
        '1'
      );


      const button =
        event.currentTarget
          .querySelector(
            '.account-primary-button'
          );

      button.disabled = true;


      const {
        data,
        error
      } =
        await accountDb.auth.signUp({

          email,

          password,

          options: {

            emailRedirectTo:
              `${window.location.origin}/account.html`,

            data: {
              full_name: fullName
            }

          }

        });


      button.disabled = false;


      if (error) {

        authMessage(
          error.message,
          'error'
        );

        return;

      }


      authMessage(
        t('registerSuccess'),
        'success'
      );


      /*
       EÄŸer Supabase e-posta doÄŸrulamasÄ± istemiyorsa
       session hemen oluÅŸur.
      */

      if (data.session?.user) {

        await ensureProfile(
          data.session.user,
          fullName
        );

        await showCustomerDashboard(
          data.session.user
        );

      }

    }
  );


/* =========================================
   RESET PASSWORD EMAIL
========================================= */

$('resetPasswordForm')
  .addEventListener(
    'submit',
    async event => {

      event.preventDefault();

      authMessage('');


      const email =
        $('resetEmail')
          .value
          .trim();


      const button =
        event.currentTarget
          .querySelector(
            '.account-primary-button'
          );

      button.disabled = true;


      const { error } =
        await accountDb.auth
          .resetPasswordForEmail(
            email,
            {
              redirectTo:
                `${window.location.origin}/account.html`
            }
          );


      button.disabled = false;


      if (error) {

        authMessage(
          error.message,
          'error'
        );

        return;

      }


      authMessage(
        t('resetSuccess'),
        'success'
      );

    }
  );


/* =========================================
   PASSWORD RECOVERY FORM
========================================= */

function showPasswordRecovery() {

  $('authView').hidden = false;
  $('customerDashboard').hidden = true;


  const card =
    $('authView');


  card.innerHTML = `

    <div class="account-panel">

      <div class="account-panel-heading">

        <span>
          ARDA ACCOUNT
        </span>

        <h2>
          ${t('newPassword')}
        </h2>

        <p>
          ${t('newPassword')}
        </p>

      </div>


      <form id="newPasswordForm">

        <label class="account-field">

          <span>
            ${t('newPassword')}
          </span>

          <input
            id="newCustomerPassword"
            type="password"
            minlength="8"
            required
            placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
          >

        </label>


        <button
          class="account-primary-button"
          type="submit"
        >
          ${t('savePassword')}
        </button>


        <div
          id="newPasswordMessage"
          class="account-message"
        >
        </div>

      </form>

    </div>
  `;


  $('newPasswordForm')
    .addEventListener(
      'submit',
      async event => {

        event.preventDefault();

        const password =
          $('newCustomerPassword').value;

        const {
          error
        } =
          await accountDb.auth
            .updateUser({
              password
            });


        const message =
          $('newPasswordMessage');


        if (error) {

          message.textContent =
            error.message;

          message.className =
            'account-message error';

          return;

        }


        message.textContent =
          t('passwordChanged');

        message.className =
          'account-message success';


        const {
          data: {
            user
          }
        } =
          await accountDb.auth
            .getUser();


        if (user) {

          setTimeout(
            () =>
              showCustomerDashboard(
                user
              ),
            700
          );

        }

      }
    );

}


/* =========================================
   PROFILE
========================================= */

async function ensureProfile(
  user,
  name = ''
) {

  const {
    data
  } =
    await accountDb
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();


  if (data) return;


  await accountDb
    .from('profiles')
    .upsert({

      id: user.id,

      full_name:
        name ||
        user.user_metadata
          ?.full_name ||
        '',

      country:
        'Deutschland',

      updated_at:
        new Date().toISOString()

    });

}


async function loadProfile(
  user
) {

  await ensureProfile(user);


  const {
    data,
    error
  } =
    await accountDb
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();


  if (error) {

    console.error(
      'Profile load error:',
      error
    );

    return;

  }


  const profile =
    data || {};


  $('profileName').value =
    profile.full_name ||
    user.user_metadata
      ?.full_name ||
    '';

  $('profilePhone').value =
    profile.phone || '';

  $('profileAddress1').value =
    profile.address_line1 || '';

  $('profileAddress2').value =
    profile.address_line2 || '';

  $('profilePostalCode').value =
    profile.postal_code || '';

  $('profileCity').value =
    profile.city || '';

  $('profileCountry').value =
    profile.country ||
    'Deutschland';

}


$('profileForm')
  .addEventListener(
    'submit',
    async event => {

      event.preventDefault();

      if (!currentCustomer) {
        return;
      }


      profileMessage('');


      const {
        error
      } =
        await accountDb
          .from('profiles')
          .upsert({

            id:
              currentCustomer.id,

            full_name:
              $('profileName')
                .value
                .trim(),

            phone:
              $('profilePhone')
                .value
                .trim() ||
              null,

            address_line1:
              $('profileAddress1')
                .value
                .trim() ||
              null,

            address_line2:
              $('profileAddress2')
                .value
                .trim() ||
              null,

            postal_code:
              $('profilePostalCode')
                .value
                .trim() ||
              null,

            city:
              $('profileCity')
                .value
                .trim() ||
              null,

            country:
              $('profileCountry')
                .value
                .trim() ||
              null,

            updated_at:
              new Date()
                .toISOString()

          });


      if (error) {

        profileMessage(
          error.message,
          'error'
        );

        return;

      }


      profileMessage(
        t('profileSaved'),
        'success'
      );


      updateCustomerHeader(
        currentCustomer
      );

    }
  );


/* =========================================
   CART + FAVORITES ACCOUNT SYNC
========================================= */

function readLocalCart() {

  try {

    return JSON.parse(
      localStorage.getItem(
        'ardaHairCart'
      ) || '[]'
    );

  } catch {

    return [];

  }

}


function readLocalFavorites() {

  try {

    return JSON.parse(
      localStorage.getItem(
        'ardaHairFavorites'
      ) || '[]'
    );

  } catch {

    return [];

  }

}


async function syncShoppingData(
  userId
) {

  await syncCart(userId);

  await syncFavorites(userId);

  await loadAccountShoppingData(
    userId
  );


}
    

async function syncCart(
  userId
) {

  const localCart =
    readLocalCart()
      .filter(item => item.key);


  /* Sunucudaki mevcut sepeti al */
  const {
    data: remoteCart,
    error: readError
  } =
    await accountDb
      .from('customer_cart_items')
      .select('item_key')
      .eq('user_id', userId);


  if (readError) {

    console.error(
      'Cart read error:',
      readError
    );

    return;
  }


  /*
    TarayÄ±cÄ±da artÄ±k olmayan Ã¼rÃ¼nleri
    Supabase'den de tamamen sil.
  */

  const localKeys =
    new Set(
      localCart.map(
        item => item.key
      )
    );


  const removedKeys =
    (remoteCart || [])
      .map(row => row.item_key)
      .filter(
        key =>
          !localKeys.has(key)
      );


  if (removedKeys.length) {

    const {
      error: deleteError
    } =
      await accountDb
        .from('customer_cart_items')
        .delete()
        .eq('user_id', userId)
        .in(
          'item_key',
          removedKeys
        );


    if (deleteError) {

      console.error(
        'Cart delete error:',
        deleteError
      );

      return;
    }

  }


  /*
    Sepet tamamen boÅŸsa
    yukarÄ±daki iÅŸlem sunucuyu da temizledi.
  */

  if (!localCart.length) {
    return;
  }


  /*
    Mevcut sepeti birebir kaydet.
    Adet artÄ±k Math.max ile eski deÄŸere dÃ¶nmez.
  */

  const rows =
    localCart.map(item => ({

      user_id:
        userId,

      item_key:
        item.key,

      product_id:
        item.productId ||
        null,

      variant_id:
        item.variantId ||
        null,

      slug:
        item.slug ||
        null,

      name:
        item.name ||
        'ARDA HAIR',

      price_cents:
        Number(
          item.price_cents || 0
        ),

      quantity:
        Math.max(
          1,
          Number(
            item.quantity || 1
          )
        ),

      image_url:
        item.image ||
        null,

      variant_summary:
        item.variant ||
        null,

      updated_at:
        new Date()
          .toISOString()

    }));


  const {
    error
  } =
    await accountDb
      .from('customer_cart_items')
      .upsert(
        rows,
        {
          onConflict:
            'user_id,item_key'
        }
      );


  if (error) {

    console.error(
      'Cart sync error:',
      error
    );

  }

}



async function syncFavorites(userId) {

  const localFavorites =
    readLocalFavorites()
      .filter(item => item.productId);

  const {
    data: remoteFavorites,
    error: fetchError
  } =
    await accountDb
      .from('customer_favorites')
      .select('product_id')
      .eq('user_id', userId);

  if (fetchError) {
    console.error(
      'Favorites fetch error:',
      fetchError
    );
    return;
  }

  const localIds =
    new Set(
      localFavorites.map(
        item => item.productId
      )
    );

  const removedIds =
    (remoteFavorites || [])
      .map(row => row.product_id)
      .filter(id => !localIds.has(id));

  if (removedIds.length) {

    const {
      error: deleteError
    } =
      await accountDb
        .from('customer_favorites')
        .delete()
        .eq('user_id', userId)
        .in('product_id', removedIds);

    if (deleteError) {
      console.error(
        'Favorites delete error:',
        deleteError
      );
      return;
    }
  }

  if (!localFavorites.length) {
    return;
  }

  const rows =
    localFavorites.map(item => ({

      user_id: userId,
      product_id: item.productId,
      slug: item.slug || null,
      name: item.name || 'ARDA HAIR',
      price_cents:
        Number(item.price_cents || 0),
      image_url: item.image || null

    }));

  const {
    error
  } =
    await accountDb
      .from('customer_favorites')
      .upsert(
        rows,
        {
          onConflict:
            'user_id,product_id'
        }
      );

  if (error) {
    console.error(
      'Favorites sync error:',
      error
    );
  }
}


async function loadAccountShoppingData(
  userId
) {

  const [
    cartResult,
    favoritesResult
  ] =
    await Promise.all([

      accountDb
        .from(
          'customer_cart_items'
        )
        .select('*')
        .eq('user_id', userId)
        .order(
          'created_at',
          {
            ascending: true
          }
        ),

      accountDb
        .from(
          'customer_favorites'
        )
        .select('*')
        .eq('user_id', userId)
        .order(
          'created_at',
          {
            ascending: true
          }
        )

    ]);


  const cart =
    (cartResult.data || [])
      .map(row => ({

        key:
          row.item_key,

        productId:
          row.product_id,

        variantId:
          row.variant_id,

        slug:
          row.slug,

        name:
          row.name,

        price_cents:
          row.price_cents,

        quantity:
          row.quantity,

        image:
          row.image_url,

        variant:
          row.variant_summary

      }));


  const favorites =
    (favoritesResult.data || [])
      .map(row => ({

        productId:
          row.product_id,

        slug:
          row.slug,

        name:
          row.name,

        price_cents:
          row.price_cents,

        image:
          row.image_url

      }));


  localStorage.setItem(
    'ardaHairCart',
    JSON.stringify(cart)
  );


  localStorage.setItem(
    'ardaHairFavorites',
    JSON.stringify(
      favorites
    )
  );

}



function renderOrderHistory() {

  const container =
    $('ordersContent');

  if (!container) {
    return;
  }


  container.replaceChildren();


  if (
    !Array.isArray(currentOrders) ||
    currentOrders.length === 0
  ) {

    const empty =
      document.createElement('p');

    empty.className =
      'orders-state';

    empty.textContent =
      t('ordersEmpty');

    container.appendChild(empty);

    return;

  }


  currentOrders.forEach(order => {

    const card =
      document.createElement('article');

    card.className =
      'order-history-card';


    const top =
      document.createElement('div');

    top.className =
      'order-history-top';


    const info =
      document.createElement('div');


    const number =
      document.createElement('div');

    number.className =
      'order-history-number';

    number.textContent =
      order.orderNumber || '—';


    const date =
      document.createElement('div');

    date.className =
      'order-history-meta';

    date.textContent =
      formatOrderDate(
        order.createdAt
      );


    info.append(
      number,
      date
    );


    const total =
      document.createElement('div');

    total.className =
      'order-history-total';

    total.textContent =
      formatOrderMoney(
        order.totalCents,
        order.currency
      );


    top.append(
      info,
      total
    );


    const statuses =
      document.createElement('div');

    statuses.className =
      'order-history-status';


    const payment =
      document.createElement('span');

    payment.className =
      'order-status-badge';

    payment.textContent =
      `${t('orderPayment')}: ${order.paymentStatus || '—'}`;


    const status =
      document.createElement('span');

    status.className =
      'order-status-badge';

    status.textContent =
      `${t('orderStatus')}: ${order.orderStatus || '—'}`;


    statuses.append(
      payment,
      status
    );


    const items =
      document.createElement('div');

    items.className =
      'order-history-items';


    const orderItems =
      Array.isArray(order.items)
        ? order.items
        : [];


    orderItems.forEach(item => {

      const row =
        document.createElement('div');

      row.className =
        'order-history-item';


      const itemInfo =
        document.createElement('div');


      const name =
        document.createElement('div');

      name.className =
        'order-history-item-name';

      name.textContent =
        item.product_name || '—';


      const meta =
        document.createElement('div');

      meta.className =
        'order-history-item-meta';

      meta.textContent =
        [
          item.variant_name || null,
          `${t('orderQuantity')}: ${Number(item.quantity || 0)}`
        ]
          .filter(Boolean)
          .join(' · ');


      itemInfo.append(
        name,
        meta
      );


      const price =
        document.createElement('div');

      price.textContent =
        formatOrderMoney(
          item.line_total_cents,
          order.currency
        );


      row.append(
        itemInfo,
        price
      );

      items.appendChild(row);

    });


    card.append(
      top,
      statuses,
      items
    );

    container.appendChild(card);

  });

}


async function loadOrderHistory() {

  const container =
    $('ordersContent');

  if (!container) {
    return;
  }


  container.replaceChildren();


  const loading =
    document.createElement('p');

  loading.className =
    'orders-state';

  loading.textContent =
    t('ordersLoading');

  container.appendChild(
    loading
  );


  try {

    const {
      data: {
        session
      },
      error
    } =
      await accountDb.auth
        .getSession();


    if (
      error ||
      !session?.access_token
    ) {

      throw new Error(
        'AUTH_REQUIRED'
      );

    }


    const response =
      await fetch(
        '/api/my-orders',
        {
          method: 'GET',

          headers: {
            Authorization:
              `Bearer ${session.access_token}`
          }
        }
      );


    const data =
      await response
        .json()
        .catch(() => ({}));


    if (
      !response.ok ||
      !data?.ok ||
      !Array.isArray(data.orders)
    ) {

      throw new Error(
        data?.error ||
        'ORDERS_FETCH_FAILED'
      );

    }


    currentOrders =
      data.orders;


    renderOrderHistory();


  } catch (error) {

    console.error(
      'Order history error:',
      error
    );


    currentOrders = [];


    container.replaceChildren();


    const state =
      document.createElement('p');

    state.className =
      'orders-state';

    state.textContent =
      t('ordersError');

    container.appendChild(
      state
    );

  }

}

/* =========================================
   DASHBOARD
========================================= */

function updateCustomerHeader(
  user
) {

  const name =
    $('profileName')?.value ||
    user.user_metadata
      ?.full_name ||
    '';


  $('customerWelcome')
    .textContent =
    name
      ? `${t('welcome')}, ${name}.`
      : `${t('welcome')}.`;


  $('customerEmail')
    .textContent =
    user.email || '';

}


async function showCustomerDashboard(
  user
) {

  currentCustomer = user;


  $('authView').hidden =
    true;

  $('customerDashboard').hidden =
    false;


  await loadProfile(user);

  updateCustomerHeader(user);


  await syncShoppingData(
    user.id
  );

  await loadOrderHistory();

}


/* =========================================
   LOGOUT
========================================= */

$('customerLogout')
  .addEventListener(
    'click',
    async () => {

      if (currentCustomer) {

        await syncShoppingData(
          currentCustomer.id
        );

      }


      await accountDb.auth.signOut();


      currentCustomer = null;


            /*
        BaÅŸka biri aynÄ± cihazda giriÅŸ yaparsa
        Ã¶nceki hesabÄ±n sepetini gÃ¶rmemesi iÃ§in.
      */

      localStorage.removeItem(
        'ardaHairCart'
      );

      localStorage.removeItem(
        'ardaHairFavorites'
      );


      $('customerDashboard').hidden =
        true;

      $('authView').hidden =
        false;


      showAuthPanel('login');

    }
  );

 
/* =========================================
   AUTH STATE
========================================= */
async function checkInitialSession() {

  const {
    data: {
      session
    }
  } =
    await accountDb.auth
      .getSession();


  if (session?.user) {

    await showCustomerDashboard(
      session.user
    );

  } else {

    $('authView').hidden =
      false;

    $('customerDashboard').hidden =
      true;

  }

}


accountDb.auth
  .onAuthStateChange(
    (event, session) => {

      /*
        Recovery mailinden gelindiyse
        yeni ÅŸifre ekranÄ±.
      */

      if (
        event ===
        'PASSWORD_RECOVERY'
      ) {

        setTimeout(
          showPasswordRecovery,
          0
        );

        return;

      }


      if (
        event === 'SIGNED_IN' &&
        session?.user
      ) {

        setTimeout(
          () =>
            showCustomerDashboard(
              session.user
            ),
          0
        );

      }


      if (
        event === 'SIGNED_OUT'
      ) {

        currentCustomer = null;

      }

    }
  );


/* =========================================
   LANGUAGE BUTTONS
========================================= */

document
  .querySelectorAll(
    '[data-account-lang]'
  )
  .forEach(button => {

    button.addEventListener(
      'click',
      () => {

        accountLang =
          button.dataset
            .accountLang;

        applyAccountLanguage();

        if (currentCustomer) {
          renderOrderHistory();
        }

      }
    );

  });


/* =========================================
   START
========================================= */

applyAccountLanguage();

checkInitialSession();
