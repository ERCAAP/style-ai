// Turkish Translations - Turkce ceviriler

export default {
  // Uygulama
  app: {
    name: 'BOHO',
  },

  // Ortak
  common: {
    continue: 'Devam Et',
    skip: 'Atla',
    start: 'Basla',
    save: 'Kaydet',
    cancel: 'Iptal',
    delete: 'Sil',
    edit: 'Duzenle',
    done: 'Tamam',
    loading: 'Yukleniyor...',
    error: 'Hata',
    success: 'Basarili',
    retry: 'Tekrar Dene',
    close: 'Kapat',
    back: 'Geri',
    next: 'Ileri',
    yes: 'Evet',
    no: 'Hayir',
    search: 'Ara',
    filter: 'Filtrele',
    all: 'Tumu',
    noResults: 'Sonuc bulunamadi',
    refresh: 'Yenile',
    ok: 'Tamam',
    change: 'Degistir',
    off: 'Indirim',
    imageZoomHint: 'Cimdikle yakinlastir • Cift tikla zoom • Kaydir hareket ettir',
    home: 'Ana Sayfa',
    viewAll: 'Tumunu Gor',
  },

  // Onboarding
  onboarding: {
    welcome: {
      title: "{{appName}}'a Hosgeldiniz",
      subtitle: 'AI destekli kisisel stil asistaniniz',
      button: 'Baslayalim',
    },
    features: {
      analysis: {
        title: 'AI Stil Analizi',
        subtitle: 'Kiyafetlerinizi analiz edin ve kisisel stil onerileri alin',
      },
      wardrobe: {
        title: 'Dijital Dolabiniz',
        subtitle: 'Tum kiyafetlerinizi tek bir yerde organize edin ve yonetin',
      },
    },
    outfitTransfer: {
      title: 'Kiyafet Aktarimi',
      subtitle: 'Istediginiz kiyafeti modelin uzerine aktarabilirsiniz',
      transferring: 'Kiyafet aktarılıyor...',
      success: 'Harika! Kıyafet başarıyla aktarıldı',
    },
    shopTryOn: {
      title: 'Magazadan Dene',
      subtitle: 'Magazadaki urunu satin almadan once ustunuzde deneyin',
      analyzing: 'Analiz ediliyor...',
      success: 'Satın almadan önce üstünüzde deneyin!',
    },
    questions: {
      style: {
        title: 'Stil Tercihiniz',
        subtitle: 'En cok hangi tarza yakinsiniz?',
      },
      bodyType: {
        title: 'Beden Tipiniz',
        subtitle: 'Size en uygun onerileri sunabilmemiz icin',
      },
      colors: {
        title: 'Favori Renkleriniz',
        subtitle: 'En cok tercih ettiginiz renkleri secin',
        hint: 'En az 2, en fazla 5 renk secin',
      },
      goals: {
        title: 'Kullanim Amaciniz',
        subtitle: "{{appName}}'i nasil kullanmak istiyorsunuz?",
        hint: 'Birden fazla secenek isaretle yebilirsiniz',
      },
    },
    styles: {
      casual: 'Gunluk',
      formal: 'Resmi',
      sporty: 'Sportif',
      elegant: 'Sik',
      bohemian: 'Bohem',
      minimalist: 'Minimalist',
    },
    bodyTypes: {
      rectangle: 'Dikdortgen',
      triangle: 'Ucgen',
      inverted_triangle: 'Ters Ucgen',
      hourglass: 'Kum Saati',
      oval: 'Oval',
    },
    goals: {
      daily_outfit: 'Gunluk Kombin',
      work: 'Is Kiyafetleri',
      special_events: 'Ozel Gunler',
      shopping: 'Alisveris Onerileri',
      style_improvement: 'Stil Gelistirme',
    },
    demo: {
      colorHarmony: 'Renk Uyumu',
      style: 'Stil',
      season: 'Mevsim',
      daily: 'Gunluk',
      comfort: 'Konfor',
      color: 'Renk',
      quality: 'Kalite',
      homeStyle: 'Ev Stili',
      elegance: 'Siklik',
      harmony: 'Uyum',
      trend: 'Trend',
      dateSuitable: 'Date Uyumlu',
      resultsTitle: 'AI Analiz Sonuçları',
    },
    complete: {
      title: 'Hazirsiniz!',
      subtitle: 'Stilinizi kesfetmeye baslayabilirsiniz',
      button: 'Kesfetmeye Basla',
      preferencesTitle: 'Tercihleriniz',
      styleLabel: 'Stil',
      favoriteColorsLabel: '{{count}} favori renk',
      usageGoalsLabel: '{{count}} kullanim amaci',
    },
    progress: {
      step: 'Adim {{current}} / {{total}}',
    },
  },

  // Dolap
  wardrobe: {
    title: 'Dolabim',
    empty: {
      title: 'Dolabiniz Bos',
      subtitle: 'Ilk kiyafetinizi ekleyerek baslayin',
      button: 'Kiyafet Ekle',
    },
    addItem: 'Kiyafet Ekle',
    editItem: 'Kiyafeti Duzenle',
    deleteItem: 'Kiyafeti Sil',
    deleteConfirm: {
      title: 'Kiyafeti Sil',
      message: 'Bu kiyafeti silmek istediginizden emin misiniz?',
    },
    categories: {
      all: 'Tumu',
      tops: 'Ust Giyim',
      bottoms: 'Alt Giyim',
      shoes: 'Ayakkabi',
      accessories: 'Aksesuar',
      outerwear: 'Dis Giyim',
      dresses: 'Elbise',
    },
    seasons: {
      spring: 'Ilkbahar',
      summer: 'Yaz',
      fall: 'Sonbahar',
      winter: 'Kis',
      all: 'Her Mevsim',
    },
    form: {
      name: 'Kiyafet Adi',
      namePlaceholder: 'Ornek: Mavi Gomlek',
      category: 'Kategori',
      subcategory: 'Alt Kategori',
      season: 'Mevsim',
      seasonHint: 'Birden fazla mevsim secebilirsiniz',
      color: 'Renk',
      brand: 'Marka',
      brandPlaceholder: 'Opsiyonel',
      notes: 'Notlar',
      notesPlaceholder: 'Kiyafet hakkinda notlar...',
      selectImage: 'Fotograf Sec',
      changeImage: 'Fotografi Degistir',
    },
    subcategories: {
      // Ust giyim
      tshirt: 'Tisort',
      shirt: 'Gomlek',
      blouse: 'Bluz',
      sweater: 'Kazak',
      hoodie: 'Kapusonlu',
      tank_top: 'Atlet',
      polo: 'Polo',
      // Alt giyim
      jeans: 'Kot Pantolon',
      trousers: 'Kumas Pantolon',
      shorts: 'Sort',
      skirt: 'Etek',
      leggings: 'Tayt',
      sweatpants: 'Esofman',
      // Ayakkabi
      sneakers: 'Spor Ayakkabi',
      boots: 'Bot',
      heels: 'Topuklu',
      sandals: 'Sandalet',
      loafers: 'Loafer',
      flats: 'Babet',
      athletic: 'Kosu Ayakkabisi',
      // Aksesuar
      bag: 'Canta',
      hat: 'Sapka',
      scarf: 'Atki/Sal',
      belt: 'Kemer',
      jewelry: 'Taki',
      watch: 'Saat',
      sunglasses: 'Gunes Gozlugu',
      // Dis giyim
      jacket: 'Ceket',
      coat: 'Kaban',
      blazer: 'Blazer',
      cardigan: 'Hirka',
      vest: 'Yelek',
      parka: 'Parka',
      // Elbise
      casual_dress: 'Gunluk Elbise',
      formal_dress: 'Resmi Elbise',
      maxi_dress: 'Uzun Elbise',
      mini_dress: 'Kisa Elbise',
      cocktail_dress: 'Kokteyl Elbisesi',
    },
    stats: {
      total: 'Toplam',
      items: 'kiyafet',
      favorites: 'Favori',
      title: 'İstatistikler',
      mostWorn: 'En Çok Giyilen',
      times: 'kez',
      seasonDistribution: 'Mevsim Dağılımı',
      categoryDistribution: 'Kategori Dağılımı',
      topBrand: 'En Çok Kullanılan Marka',
      monthlyActivity: 'Aylık Kullanım',
      totalItems: 'Toplam Kıyafet',
      totalWears: 'Toplam Giyilme',
      empty: 'Henüz istatistik yok',
    },
    detail: {
      wearCount: 'Giyilme Sayisi',
      lastWorn: 'Son Giyilen',
      addedOn: 'Ekleme Tarihi',
      markFavorite: 'Favorilere Ekle',
      removeFavorite: 'Favorilerden Cikar',
      favorite: 'Favori',
      recordWear: 'Bugun Giydim',
    },
    alerts: {
      addSuccess: 'Kiyafet basariyla eklendi',
      addError: 'Kiyafet eklenirken bir hata olustu',
    },
  },

  // Ana Sayfa
  home: {
    heroTitle: 'Stilini Kesfet',
    heroSubtitle: 'AI destekli kiyafet analizi ve stil onerileri',
    features: {
      analyzeOutfit: {
        title: 'Kiyafetimi Analiz Et',
        subtitle: 'AI ile kiyafet uyumunuzu degerlendirin',
      },
      tryOutfit: {
        title: 'Kiyafeti Dene',
        subtitle: 'Farkli kiyafetleri uzerinizde gorun',
      },
    },
    howItWorks: {
      title: 'Nasil Calisir?',
      step1: 'Kiyafetinizin fotografini cekin',
      step2: 'AI analiz etsin',
    },
    wardrobe: {
      title: 'Dolabim',
      totalItems: 'Toplam',
      favorites: 'Favori',
      categories: 'Kategori',
      favoriteItems: 'Favorilerim',
    },
  },

  // Gecmis
  history: {
    title: 'Sonuclarim',
    tabs: {
      analysis: 'Analiz',
      tryOn: 'Kiyafet Dene',
    },
    count: {
      analysis: '{{count}} analiz',
      tryOn: '{{count}} deneme',
    },
    empty: {
      analysis: {
        title: 'Henuz analiz yok',
        subtitle: 'Kiyafetlerinizi analiz etmeye baslayin ve sonuclari burada gorun',
        button: 'Analiz Yap',
      },
      tryOn: {
        title: 'Henuz deneme yok',
        subtitle: 'Kiyafetleri denemeye baslayin ve sonuclarinizi burada gorun',
        button: 'Kiyafet Dene',
      },
    },
    tryOnItem: {
      title: 'Kiyafet Denemesi',
      clothingCount: '{{count}} kiyafet ile denendi',
    },
  },

  // İşleme Ekranı
  processing: {
    status: {
      preparing: 'Hazırlanıyor...',
      changing: 'Kıyafet değiştiriliyor...',
      applyingStyle: 'Stil uygulanıyor...',
      trying: 'Kıyafet deneniyor...',
      finalizing: 'Son dokunuşlar yapılıyor...',
      completed: 'Tamamlandı!',
      error: 'Hata oluştu...',
    },
    cancel: {
      title: 'İşlemi İptal Et',
      message: 'Kıyafet deneme işlemi devam ediyor. İptal etmek istediğinize emin misiniz?',
      no: 'Hayır',
      yes: 'Evet, İptal Et',
    },
    error: {
      title: 'İşlem Başarısız',
      message: 'Kıyafet deneme işlemi sırasında bir hata oluştu.',
      defaultMessage: 'Kıyafet deneme işlemi başarısız oldu.',
      unexpectedError: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
      timeout: {
        title: 'İşlem Zaman Aşımına Uğradı',
        message: 'İşlem beklenenden uzun sürdü. Lütfen tekrar deneyin veya daha az kıyafet ile deneyin.',
      },
      upload: {
        title: 'Yükleme Hatası',
        message: 'Görseller yüklenirken bir hata oluştu. İnternet bağlantınızı kontrol edip tekrar deneyin.',
      },
      auth: {
        title: 'Oturum Hatası',
        message: 'Oturumunuz sonlanmış olabilir. Lütfen çıkış yapıp tekrar giriş yapın.',
      },
      network: 'İnternet bağlantınızı kontrol edip tekrar deneyin.',
      requestTimeout: 'İstek zaman aşımına uğradı. İnternet bağlantınızı kontrol edin.',
      back: 'Geri Dön',
    },
  },

  // Kiyafet Degistirme
  dressChange: {
    title: 'Kiyafeti Dene',
    addError: 'Kombin eklenirken bir hata oluştu.',
    sections: {
      userPhoto: {
        title: 'Senin Fotografin',
        subtitle: 'Kendi fotografini yukle',
        addButton: 'Fotograf Ekle',
        changeButton: 'Degistir',
      },
      targetOutfits: {
        title: 'Hedef Kiyafetler',
        subtitle: 'Kendi kiyafetlerini ekle',
        count: '{{current}}/{{max}} gorsel',
        addButton: 'Ekle',
        empty: 'Henuz kiyafet eklenmedi',
        removeConfirm: {
          title: 'Gorseli Kaldir',
          message: 'Bu gorseli kaldirmak istediginize emin misiniz?',
          remove: 'Kaldir',
        },
      },
    },
    analysis: {
      title: 'AI ile Analiz Et',
      titleActive: 'Analiz Ediliyor...',
      subtitle: 'Kiyafet uyumunu analiz et',
      subtitleActive: 'Lutfen bekleyin',
      subtitleDisabled: 'Once fotografini yukle',
    },
    actions: {
      tryOn: 'Kiyafetleri Dene',
      helperText: {
        both: 'Fotografini ve hedef kiyafetleri ekle',
        userPhoto: 'Fotografini yukle',
        targetOutfits: 'En az 1 hedef kiyafet ekle',
      },
    },
    loading: 'Gorsel yukleniyor...',
    alerts: {
      cameraPermission: {
        title: 'Kamera Izni',
        message: 'Kamera erisimi icin izin vermeniz gerekiyor.',
      },
      galleryPermission: {
        title: 'Galeri Izni',
        message: 'Galeri erisimi icin izin vermeniz gerekiyor.',
      },
      error: {
        title: 'Hata',
        message: 'Gorsel islenirken bir hata olustu.',
      },
    },
    keepPhotoModal: {
      title: 'Bu Fotografi Koru?',
      description: 'Bu fotografi kaydetmek ister misin? Kaydettigin fotograflar her zaman burada olacak ve istedigin zaman kullanabilirsin.',
      keep: 'Evet, Kaydet',
      skip: 'Simdi Degil',
    },
  },

  // Kiyafet Deneme Sonuc Ekrani
  outfitTryResult: {
    title: 'Sonuc',
    backButton: 'Geri Don',
    zoomHint: 'Yakinlastir',
    actions: {
      saveToGallery: 'Galeriye Kaydet',
      saving: 'Kaydediliyor...',
      share: 'Paylas',
      tryAgain: 'Tekrar Dene',
    },
    shareMessage: 'AI ile kiyafet deneme sonucum!',
    alerts: {
      permissionRequired: {
        title: 'Izin Gerekli',
        message: 'Gorseli kaydetmek icin galeri erisim izni vermeniz gerekiyor.',
      },
      saveSuccess: {
        title: 'Basarili',
        message: 'Gorsel galerinize kaydedildi!',
      },
      saveError: {
        title: 'Hata',
        message: 'Gorsel kaydedilirken bir hata olustu.',
      },
    },
    error: {
      imageNotFound: 'Sonuc gorseli bulunamadi',
    },
  },

  // Kiyafet Analizi
  outfitAnalysis: {
    title: 'Kiyafet Analizi',
    subtitle: 'Kiyafetinizin fotografini yukleyin, AI stil uyumunuzu analiz etsin',
    imagePicker: {
      title: 'Fotograf Ekle',
      subtitle: 'Kamera veya galeriden secin',
      changeButton: 'Degistir',
    },
    actions: {
      analyze: 'Analiz Et',
      analyzing: 'Analiz Ediliyor...',
    },
    photoPickerModal: {
      title: 'Fotograf Sec',
    },
    alerts: {
      error: {
        title: 'Hata',
        missingPhoto: 'Lutfen once bir fotograf secin',
      },
    },
  },

  // Fotograf Secici Modal
  photoPickerModal: {
    title: 'Fotograf Ekle',
    addClothing: 'Kiyafet Ekle',
    urlTitle: 'URL ile Ekle',
    camera: 'Kamera',
    cameraHint: 'Fotograf cek',
    gallery: 'Galeri',
    galleryHint: 'Galeriden sec',
    url: 'URL ile',
    urlHint: 'Link yapistir',
    urlPlaceholder: 'Urun linkini yapistirin...',
    add: 'Ekle',
  },

  // Sekmeler
  tabs: {
    home: 'Ana Sayfa',
    history: 'Sonuclarim',
    wardrobe: 'Dolabim',
    analyze: 'Analiz',
    settings: 'Ayarlar',
  },

  // Ayarlar
  settings: {
    title: 'Ayarlar',
    sections: {
      account: 'Hesap',
      preferences: 'Tercihler',
      subscription: 'Abonelik',
      about: 'Hakkinda',
      language: 'Dil / Language',
      notifications: 'Bildirimler',
      legal: 'Yasal',
      support: 'Destek',
    },
    language: {
      title: 'Dil',
      subtitle: 'Uygulama dilini degistir',
      modal: {
        title: 'Dil Secin / Select Language',
      },
    },
    notifications: {
      title: 'Bildirimler',
      subtitle: 'Bildirim tercihlerini yonet',
      enabled: 'Bildirimler Acik',
      disabled: {
        title: 'Bildirimler Kapali',
        subtitle: 'Sistem ayarlarindan acin',
      },
    },
    subscription: {
      title: 'Abonelik',
      subtitle: 'Abonelik planini yonet',
      free: {
        title: 'PRO\'ya Yukselt',
        subtitle: 'Tum ozelliklere eris',
      },
      premium: {
        title: 'PRO Uye',
        subtitle: 'Sinirsiz erisim',
        badge: 'AKTIF',
      },
      upgrade: 'Premium\'a Yukselt',
      manage: 'Aboneligi Yonet',
    },
    style: {
      title: 'Stil Tercihlerim',
      subtitle: 'Stil tercihlerini guncelle',
    },
    account: {
      logout: 'Cikis Yap',
      logoutConfirm: {
        title: 'Cikis Yap',
        message: 'Cikis yapmak istediginizden emin misiniz?',
      },
      deleteAccount: 'Hesabi Sil',
      deleteConfirm: {
        title: 'Hesabi Sil',
        message: 'Bu islem geri alinamaz. Tum verileriniz silinecektir.',
      },
      info: {
        title: 'Hesap Bilgileri',
        anonymous: 'Anonim kullanici',
        registered: 'Kayitli kullanici',
      },
      restore: {
        title: 'Satin Alimlari Geri Yukle',
        success: {
          title: 'Basarili!',
          message: 'Satin alimlariniz basariyla geri yuklendi. Premium ozelliklere erisebilirsiniz.',
        },
        notFound: {
          title: 'Bilgi',
          message: 'Hesabiniza bagli aktif bir abonelik bulunamadi.',
        },
        error: {
          message: 'Satin alimlar geri yuklenirken bir hata olustu. Lutfen daha sonra tekrar deneyin.',
        },
      },
    },
    legal: {
      terms: 'Kullanim Kosullari',
      privacy: 'Gizlilik Politikasi',
    },
    support: {
      about: 'Uygulama Hakkinda',
      contact: 'Bize Ulasin',
    },
    version: 'Versiyon 1.0.0 (Build 1)',
    alerts: {
      notificationError: {
        message: 'Bildirim ayarlari guncellenemedi',
      },
    },
    about: {
      version: 'Surum',
      privacyPolicy: 'Gizlilik Politikasi',
      termsOfService: 'Kullanim Kosullari',
      contactUs: 'Bize Ulasin',
      rateApp: 'Uygulamayi Degerlendir',
      title: '{{appName}} Hakkinda',
      description: 'Versiyon 1.0.0\n\nAI destekli kiyafet analizi uygulamasi.\n\nGPT-4 Vision teknolojisi ile kiyafet uyumunuzu analiz edin.',
    },
  },

  // Analyzing (Onboarding demo için)
  analyzing: {
    statusText: 'Analiz ediliyor...',
  },

  // Analiz
  analysis: {
    title: 'Kiyafet Analizi',
    share: {
      message: '{{appName}} Kiyafet Analizi Sonucum:\n\nGenel Puan: {{score}}/10\nStil: {{style}}\n\n{{comment}}\n\n{{appName}} ile sen de analiz yaptir!',
      result: '{{appName}} ile olusturdum! Dene sen de: https://bohoai.app',
    },
    selectImage: {
      title: 'Gorsel Sec',
      subtitle: 'Analiz etmek istediginiz kiyafeti secin',
      camera: 'Kamera',
      gallery: 'Galeri',
    },
    status: {
      idle: 'Hazir',
      checking_limit: 'Limit kontrol ediliyor...',
      uploading: 'Gorsel yukleniyor...',
      analyzing: 'AI analiz ediyor...',
      completed: 'Analiz tamamlandi!',
      error: 'Bir hata olustu',
    },
    analyzing: {
      title: 'Analiz Ediliyor',
      subtitle: 'AI stilinizi degerlendiriyor',
      statusText: 'Analiz ediliyor...',
      modal: {
        colorHarmony: 'Renk Uyumu',
        styleScore: 'Stil Puani',
        overallScore: 'Genel Puan',
        style: 'Stil',
        unknown: 'Bilinmiyor',
      },
      error: {
        title: 'Hata',
        authWait: 'Lutfen bekleyin, sisteme giris yapiliyor...',
      },
    },
    result: {
      title: 'Analiz Sonucu',
      overallScore: 'Genel Puan',
      detailedScoring: 'Detayli Puanlama',
      scores: {
        overall: 'Genel Uyum',
        colorHarmony: 'Renk Uyumu',
        styleMatch: 'Stil Uyumu',
        seasonMatch: 'Mevsim Uyumu',
      },
      scoreLevel: {
        low: 'Dusuk',
        medium: 'Orta',
        high: 'Iyi',
        excellent: 'Mukemmel',
      },
      sections: {
        detectedItems: 'Tespit Edilen Kiyafetler',
        colorAnalysis: 'Renk Analizi',
        suitableOccasions: 'Uygun Ortamlar',
        suggestions: 'Oneriler',
        alternatives: 'Alternatif Kombinasyonlar',
      },
      colorHarmony: 'Renk Uyumu',
      styleMatch: 'Stil Uyumu',
      seasonMatch: 'Mevsim Uyumu',
      suggestions: 'Oneriler',
      alternatives: 'Alternatifler',
      items: 'Tespit Edilen Parcalar',
      saveToWardrobe: 'Dolaba Kaydet',
      actions: {
        newAnalysis: 'Yeni Analiz Yap',
      },
      paywall: {
        title: 'Premium Ozellik',
        subtitle: 'Analiz sonuclarini gormek icin Premium uyelik gerekli',
        button: 'Premium\'a Gec',
      },
    },
    limit: {
      title: 'Gunluk Limit',
      remaining: '{{count}} analiz hakkiniz kaldi',
      exhausted: 'Gunluk analiz hakkiniz doldu',
      upgradeHint: 'Sinirsiz analiz icin Premium\'a yukselt in',
    },
  },

  // Paywall
  paywall: {
    error: 'Paketler yuklenemedi',
    limitedTime: 'Sinirli Sureli Teklif',
    discountNotification: {
      title: '🎉 Ozel Indirim!',
      body: '{{discount}}% indirim! Sinirli sureli teklif.',
    },
  },

  // Bildirimler
  notifications: {
    analysisComplete: {
      title: 'Analiz Tamamlandi',
      body: 'Kiyafet analiziniz hazir! Sonuclari gormek icin tiklayin.',
    },
    dailyReminder: {
      title: 'Gunun Kombini',
      body: 'Bugun ne giyeceksiniz? Hemen analiz edin!',
    },
    weeklyTips: {
      title: 'Haftanin Stil Ipucu',
      body: 'Yeni stil onerileri sizi bekliyor!',
    },
  },

  // Zorunlu Güncelleme
  forceUpdate: {
    currentVersion: 'Mevcut Sürüm',
    requiredVersion: 'Gereken Sürüm',
    updateButton: 'Şimdi Güncelle',
    storeInfo: 'üzerinden güncelleyebilirsiniz',
  },

  // Bakım Modu
  maintenance: {
    notification: 'Bakım tamamlandığında otomatik olarak bilgilendirileceksiniz',
  },

  // Hatalar
  errors: {
    general: 'Bir hata olustu. Lutfen tekrar deneyin.',
    network: 'Internet baglantisi bulunamadi.',
    unauthorized: 'Oturum suresi doldu. Lutfen tekrar giris yapin.',
    rateLimited: 'Cok fazla istek gonderdiniz. Lutfen bekleyin.',
    quotaExceeded: 'Gunluk kullanim limitinizi astiniz.',
    imageUpload: 'Gorsel yuklenirken bir hata olustu.',
    analysisError: 'Analiz sirasinda bir hata olustu.',
    permissionDenied: 'Gerekli izinler verilmedi.',
    invalidImage: {
      title: 'Gecersiz Gorsel',
      noClothingOrPerson: 'Bu gorsel analiz edilemez. Lutfen kiyafet giyiyor bir kisi fotografi yukleyin.',
      noPerson: 'Gorselde insan tespit edilemedi. Lutfen kiyafet giyiyor bir kisi fotografi yukleyin.',
      noClothing: 'Gorselde kiyafet tespit edilemedi. Lutfen kiyafet giyiyor bir kisi fotografi yukleyin.',
      notSuitable: 'Bu gorsel tip analiz icin uygun degil. Lutfen farkli bir gorsel deneyin.',
    },
    urlScraping: {
      title: 'Gorsel Yuklenemedi',
      blocked: 'Site görseli engelledi',
      howToFix: 'Nasil Yuklerim?',
      tutorialTitle: 'Nasil Kaydedilir?',
      step1: 'Gorsele basili tutun',
      step2: '"Fotograflara Kaydet" secin',
      step3: '3. Kaydedilen gorseli buradan yukleyin',
      galleryInfo: 'Sonra galeriden ekle kismini secerek gorseli ekleyebilirsiniz',
      gotIt: 'Anladim',
      tryAgain: 'Tekrar Dene',
      uploadManually: 'Manuel Yukle',
    },
  },

  // Renkler
  colors: {
    black: 'Siyah',
    white: 'Beyaz',
    gray: 'Gri',
    navy: 'Lacivert',
    blue: 'Mavi',
    red: 'Kirmizi',
    green: 'Yesil',
    yellow: 'Sari',
    purple: 'Mor',
    pink: 'Pembe',
    brown: 'Kahverengi',
    beige: 'Bej',
    orange: 'Turuncu',
    teal: 'Turkuaz',
    burgundy: 'Bordo',
    olive: 'Haki',
  },
};
