export type AppLanguage = 'en' | 'ar';

export type TranslationKey = keyof typeof TRANSLATIONS.en;

export const TRANSLATIONS = {
  en: {
    common: {
      brand: 'FULL CARS',
      logout: 'Logout',
      phone: 'Phone Number',
      password: 'Password',
      copyright: '© {{year}} FULL CARS. Produced by DM Solution.'
    },
    lang: {
      en: 'EN',
      ar: 'عربي'
    },
    seo: {
      title: 'FULL CARS | Premium Auto Care Rewards',
      description: 'Earn points on every car wash with FULL CARS. Sign in, track rewards, and redeem free washes with your digital pass.',
      keywords: 'FULL CARS, car wash, auto care, rewards, loyalty points, free wash, digital pass, Egypt',
      loginTitle: 'Sign In | FULL CARS',
      loginDescription: 'Sign in to your FULL CARS account to manage rewards and your digital pass.',
      registerTitle: 'Create Account | FULL CARS',
      registerDescription: 'Join FULL CARS and start earning loyalty points every time you wash your car.',
      imageAlt: 'FULL CARS logo'
    },
    landing: {
      tagline: 'Premium Auto Care Rewards'
    },
    login: {
      title: 'Welcome Back',
      subtitle: 'Sign in to manage your vehicle services',
      signIn: 'Sign In',
      signingIn: 'Signing in...',
      noAccount: "Don't have an account?",
      register: 'Register',
      note: 'Earn points every time you wash.',
      error: 'Invalid phone number or password.',
      networkError: 'Cannot reach the server. Make sure the backend is running and restart with npm start.',
      serverError: 'Something went wrong. Please try again.'
    },
    register: {
      title: 'Create Account',
      subtitle: 'Sign up to start earning rewards on every wash',
      fullName: 'Full Name',
      fullNamePlaceholder: 'Johnathan Doe',
      phonePlaceholder: '01119763303',
      termsPrefix: 'I agree to the',
      termsOfService: 'Terms of Service',
      termsAnd: 'and',
      privacyPolicy: 'Privacy Policy',
      submit: 'Create Account',
      submitting: 'Creating account...',
      error: 'Could not create account. Phone may already be registered.',
      signInPrompt: 'Already a member?',
      signIn: 'SIGN IN'
    },
    dashboard: {
      clientLabel: 'Esteemed Client',
      hello: 'Hello, {{name}}',
      yourPoints: 'Your Points',
      freeWashReward: 'Free Wash Reward',
      pointsRemaining: '{{count}} points until your free wash',
      pointsReady: "You've earned a free wash! Visit us to redeem.",
      digitalPass: 'Digital Pass',
      passDesc: 'Scan at the branch to collect or redeem points',
      memberId: 'Member ID',
      qrAlt: 'Member QR Code'
    },
    cashier: {
      portal: 'Cashier Portal',
      scannerTitle: 'QR Scanner',
      scannerSubtitle: 'Point the rear camera at the customer QR code',
      cameraLive: 'Camera Live',
      openingCamera: 'Starting camera...',
      retry: 'Retry Camera',
      scanSuccess: 'QR scanned successfully',
      validatingScan: 'Validating customer...',
      memberNumber: 'Member ID: #{{id}}',
      currentPoints: 'Current balance: {{points}} pts',
      chooseAction: 'Choose an action',
      add30: 'Add 30',
      add50: 'Add 50',
      freeWash: 'Free Wash',
      freeValue: 'Free',
      cancel: 'Cancel',
      step1: 'Ask the customer to open their Digital Pass',
      step2: 'Align the QR code inside the orange frame',
      step3: 'Choose: Add 30, Add 50, or Free wash',
      scanNext: 'Scan Next Customer',
      errorPermission: 'Camera permission denied. Allow access in browser settings, then tap Retry.',
      errorHttps: 'Camera requires a secure connection (HTTPS). Open the site via https or localhost.',
      errorNotSupported: 'Camera is not supported. Try Chrome or Safari on mobile.',
      errorElementMissing: 'Scanner failed to load. Tap Retry.',
      errorGeneric: 'Could not open camera. Check permission and tap Retry.',
      successAdd30: 'Added 30 points. Customer now has {{points}} pts.',
      successAdd50: 'Added 50 points. Customer now has {{points}} pts.',
      successFreeWash: 'Free wash redeemed. Customer now has {{points}} pts.',
      errorInsufficientPoints: 'Not enough points for free wash ({{current}} / {{goal}}).',
      errorScanFailed: 'Could not validate this QR code. Try again.',
      errorApplyFailed: 'Could not apply this action. Please try again.'
    }
  },
  ar: {
    common: {
      brand: 'FULL CARS',
      logout: 'تسجيل الخروج',
      phone: 'رقم الهاتف',
      password: 'كلمة المرور',
      copyright: '© {{year}} FULL CARS. من إنتاج شركة DM Solution.'
    },
    lang: {
      en: 'EN',
      ar: 'عربي'
    },
    seo: {
      title: 'FULL CARS | مكافآت العناية المميزة بالسيارات',
      description: 'اجمع نقاطاً مع كل غسلة من FULL CARS. سجّل الدخول، تابع مكافآتك، واستبدل غسلات مجانية عبر بطاقتك الرقمية.',
      keywords: 'FULL CARS, غسيل سيارات, عناية بالسيارات, مكافآت, نقاط, غسلة مجانية, بطاقة رقمية, مصر',
      loginTitle: 'تسجيل الدخول | FULL CARS',
      loginDescription: 'سجّل الدخول إلى حساب FULL CARS لإدارة المكافآت والبطاقة الرقمية.',
      registerTitle: 'إنشاء حساب | FULL CARS',
      registerDescription: 'انضم إلى FULL CARS وابدأ بجمع نقاط الولاء مع كل غسلة.',
      imageAlt: 'شعار FULL CARS'
    },
    landing: {
      tagline: 'مكافآت العناية المميزة بالسيارات'
    },
    login: {
      title: 'مرحباً بعودتك',
      subtitle: 'سجّل الدخول لإدارة خدمات سيارتك',
      signIn: 'تسجيل الدخول',
      signingIn: 'جاري تسجيل الدخول...',
      noAccount: 'ليس لديك حساب؟',
      register: 'إنشاء حساب',
      note: 'اكسب نقاطاً في كل مرة تغسل فيها.',
      error: 'رقم الهاتف أو كلمة المرور غير صحيحة.',
      networkError: 'تعذّر الاتصال بالسيرفر. تأكدي أن الـ backend شغّال وأعيدي تشغيل npm start.',
      serverError: 'حدث خطأ. حاولي مرة أخرى.'
    },
    register: {
      title: 'إنشاء حساب',
      subtitle: 'سجّل الآن وابدأ بجمع المكافآت مع كل غسلة',
      fullName: 'الاسم الكامل',
      fullNamePlaceholder: 'محمد أحمد',
      phonePlaceholder: '01119763303',
      termsPrefix: 'أوافق على',
      termsOfService: 'شروط الخدمة',
      termsAnd: 'و',
      privacyPolicy: 'سياسة الخصوصية',
      submit: 'إنشاء حساب',
      submitting: 'جاري إنشاء الحساب...',
      error: 'تعذّر إنشاء الحساب. قد يكون رقم الهاتف مسجلاً مسبقاً.',
      signInPrompt: 'لديك حساب بالفعل؟',
      signIn: 'تسجيل الدخول'
    },
    dashboard: {
      clientLabel: 'عميلنا العزيز',
      hello: 'مرحباً، {{name}}',
      yourPoints: 'نقاطك',
      freeWashReward: 'مكافأة الغسلة المجانية',
      pointsRemaining: '{{count}} نقطة حتى الغسلة المجانية',
      pointsReady: 'لقد حصلت على غسلة مجانية! زُرنا لاستبدالها.',
      digitalPass: 'البطاقة الرقمية',
      passDesc: 'امسحها في الفرع لجمع أو استبدال النقاط',
      memberId: 'رقم العضو',
      qrAlt: 'رمز QR للعضو'
    },
    cashier: {
      portal: 'بوابة الكاشير',
      scannerTitle: 'ماسح QR',
      scannerSubtitle: 'وجّه الكاميرا الخلفية نحو QR العميل',
      cameraLive: 'الكاميرا شغّالة',
      openingCamera: 'جاري فتح الكاميرا...',
      retry: 'إعادة المحاولة',
      scanSuccess: 'تم مسح QR بنجاح',
      validatingScan: 'جاري التحقق من العميل...',
      memberNumber: 'رقم العضو: #{{id}}',
      currentPoints: 'الرصيد الحالي: {{points}} نقطة',
      chooseAction: 'اختر الإجراء',
      add30: 'إضافة 30',
      add50: 'إضافة 50',
      freeWash: 'غسلة مجانية',
      freeValue: 'مجاناً',
      cancel: 'إلغاء',
      step1: 'اطلب من العميل فتح البطاقة الرقمية',
      step2: 'وجّه الكاميرا نحو QR داخل الإطار البرتقالي',
      step3: 'اختر: إضافة 30 أو 50 أو غسلة مجانية',
      scanNext: 'مسح عميل جديد',
      errorPermission: 'تم رفض إذن الكاميرا. اسمح بالوصول من إعدادات المتصفح ثم اضغط إعادة المحاولة.',
      errorHttps: 'الكاميرا تحتاج اتصالاً آمناً (HTTPS). افتح الموقع عبر https أو localhost.',
      errorNotSupported: 'المتصفح لا يدعم الكاميرا. جرّب Chrome أو Safari على الموبايل.',
      errorElementMissing: 'تعذّر تحميل الماسح. اضغط إعادة المحاولة.',
      errorGeneric: 'تعذّر فتح الكاميرا. تأكد من الإذن ثم اضغط إعادة المحاولة.',
      successAdd30: 'تمت إضافة 30 نقطة. رصيد العميل الآن {{points}} نقطة.',
      successAdd50: 'تمت إضافة 50 نقطة. رصيد العميل الآن {{points}} نقطة.',
      successFreeWash: 'تم استبدال غسلة مجانية. رصيد العميل الآن {{points}} نقطة.',
      errorInsufficientPoints: 'النقاط غير كافية للغسلة المجانية ({{current}} / {{goal}}).',
      errorScanFailed: 'تعذّر التحقق من QR. حاول مرة أخرى.',
      errorApplyFailed: 'تعذّر تنفيذ الإجراء. حاول مرة أخرى.'
    }
  }
} as const;
