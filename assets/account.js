/* =========================================
   ARDA HAIR — CUSTOMER ACCOUNT
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
    mainTitle: 'Dein persönlicher Bereich.',
    mainText:
      'Melde dich an oder erstelle ein Konto, um deine persönlichen Daten, Favoriten und deinen Warenkorb zu verwalten.',

    loginTab: 'Anmelden',
    registerTab: 'Konto erstellen',

    welcomeBack: 'WILLKOMMEN ZURÜCK',
    loginTitle: 'Anmelden',
    loginText: 'Greife auf dein ARDA HAIR Konto zu.',

    newAccount: 'NEUES KONTO',
    registerTitle: 'Registrieren',
    registerText:
      'Erstelle dein persönliches ARDA HAIR Konto.',

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

    resetTitle: 'Passwort zurücksetzen',
    resetText:
      'Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen.',
    sendLink: 'Link senden',
    backLogin: 'Zurück zur Anmeldung',

    loginSuccess: 'Anmeldung erfolgreich.',
    registerSuccess:
      'Konto erstellt. Bitte prüfe gegebenenfalls deine E-Mails und bestätige deine Adresse.',
    resetSuccess:
      'Wir haben dir eine E-Mail zum Zurücksetzen des Passworts gesendet.',

    passwordsDifferent:
      'Die Passwörter stimmen nicht überein.',

    terms:
      'Bitte akzeptiere die Datenschutzbestimmungen und Geschäftsbedingungen.',

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
      'Dein Passwort wurde erfolgreich geändert.',

    profile: 'Persönliche Daten',

    phone: 'Telefonnummer',
    country: 'Land',
    address1: 'Straße und Hausnummer',
    address2: 'Adresszusatz',
    postalCode: 'Postleitzahl',
    city: 'Stadt',
    save: 'Änderungen speichern'
  },


  tr: {
    mainTitle: 'Kişisel hesabın.',
    mainText:
      'Kişisel bilgilerini, favorilerini ve sepetini yönetmek için giriş yap veya yeni bir hesap oluştur.',

    loginTab: 'Giriş Yap',
    registerTab: 'Hesap Oluştur',

    welcomeBack: 'TEKRAR HOŞ GELDİN',
    loginTitle: 'Giriş Yap',
    loginText: 'ARDA HAIR hesabına giriş yap.',

    newAccount: 'YENİ HESAP',
    registerTitle: 'Kayıt Ol',
    registerText:
      'Kendine ait ARDA HAIR hesabını oluştur.',

    email: 'E-posta adresi',
    password: 'Şifre',
    passwordRepeat: 'Şifreyi tekrar gir',
    fullName: 'Ad Soyad',

    login: 'Giriş Yap',
    register: 'Hesap Oluştur',
    forgot: 'Şifremi unuttum',
    remember: 'Oturumumu açık tut',

    show: 'Göster',
    hide: 'Gizle',

    resetTitle: 'Şifreni sıfırla',
    resetText:
      'E-posta adresini gir. Şifre yenileme bağlantısını sana göndereceğiz.',
    sendLink: 'Bağlantıyı gönder',
    backLogin: 'Giriş ekranına dön',

    loginSuccess: 'Giriş başarılı.',
    registerSuccess:
      'Hesabın oluşturuldu. Gerekirse e-posta adresine gelen doğrulama bağlantısını onayla.',
    resetSuccess:
      'Şifre sıfırlama bağlantısını e-posta adresine gönderdik.',

    passwordsDifferent:
      'Girdiğin şifreler aynı değil.',

    terms:
      'Lütfen gizlilik politikasını ve kullanım koşullarını kabul et.',

    welcome: 'Hoş geldin',

    logout: 'Çıkış Yap',

    profileSaved:
      'Bilgilerin kaydedildi.',

    genericError:
      'Bir hata oluştu. Lütfen tekrar dene.',

    newPassword:
      'Yeni şifre',

    savePassword:
      'Yeni şifreyi kaydet',

    passwordChanged:
      'Şifren başarıyla değiştirildi.',

    profile: 'Kişisel bilgiler',

    phone: 'Telefon numarası',
    country: 'Ülke',
    address1: 'Sokak ve kapı numarası',
    address2: 'Adres detayı',
    postalCode: 'Posta kodu',
    city: 'Şehir',
    save: 'Değişiklikleri kaydet'
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


function t(key) {
  return (
    accountText[accountLang]?.[key] ||
    accountText.de[key] ||
    key
  );
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


  $('accountMainTitle').textContent =
    t('mainTitle');

  $('accountMainText').textContent =
    t('mainText');

  $('showLogin').textContent =
    t('loginTab');

  $('showRegister').textContent =
    t('registerTab');


  const loginHeading =
    document.querySelector(
      '#loginPanel .account-panel-heading'
    );

  if (loginHeading) {

    loginHeading.querySelector('span')
      .textContent =
      t('welcomeBack');

    loginHeading.querySelector('h2')
      .textContent =
      t('loginTitle');

    loginHeading.querySelector('p')
      .textContent =
      t('loginText');

  }


  const registerHeading =
    document.querySelector(
      '#registerPanel .account-panel-heading'
    );

  if (registerHeading) {

    registerHeading.querySelector('span')
      .textContent =
      t('newAccount');

    registerHeading.querySelector('h2')
      .textContent =
      t('registerTitle');

    registerHeading.querySelector('p')
      .textContent =
      t('registerText');

  }


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


  document.querySelector(
    '#customerLoginForm .account-primary-button'
  ).textContent =
    t('login');


  document.querySelector(
    '#customerRegisterForm .account-primary-button'
  ).textContent =
    t('register');


  $('forgotPasswordButton')
    .textContent =
    t('forgot');


  const rememberText =
    document.querySelector(
      '.remember-option span'
    );

  if (rememberText) {
    rememberText.textContent =
      t('remember');
  }


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


  const saveProfileButton =
    document.querySelector(
      '.profile-save'
    );

  if (saveProfileButton) {
    saveProfileButton.textContent =
      t('save');
  }


  $('customerLogout')
    .textContent =
    t('logout');


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
       Eğer Supabase e-posta doğrulaması istemiyorsa
       session hemen oluşur.
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
            placeholder="••••••••"
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
================async function syncCart(
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
    Tarayıcıda artık olmayan ürünleri
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
    Sepet tamamen boşsa
    yukarıdaki işlem sunucuyu da temizledi.
  */

  if (!localCart.length) {
    return;
  }


  /*
    Mevcut sepeti birebir kaydet.
    Adet artık Math.max ile eski değere dönmez.
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


async function syncFavorites(
  userId
) {

  const localFavorites =
    readLocalFavorites();


  const rows =
    localFavorites

      .filter(
        item =>
          item.productId
      )

      .map(item => ({

        user_id:
          userId,

        product_id:
          item.productId,

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

        image_url:
          item.image ||
          null

      }));


  if (!rows.length) return;


  const {
    error
  } =
    await accountDb
      .from(
        'customer_favorites'
      )
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
        Başka biri aynı cihazda giriş yaparsa
        önceki hesabın sepetini görmemesi için.
      */========================= */

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
        yeni şifre ekranı.
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

      }
    );

  });


/* =========================================
   START
========================================= */

applyAccountLanguage();

checkInitialSession();
