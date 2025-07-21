// ==================================================================================
// الملف السادس: src/scripts/manage-products.js (النسخة الكاملة والنهائية)
// ==================================================================================
export function init() {
    console.log("Product management script initialized.");
    const productForm = document.getElementById('product-form');
    if (!productForm) return;

    const productsTableBody = document.querySelector('#products-table tbody');
    const imageUploadBtn = document.getElementById('image-upload-btn');
    const imagePreview = document.getElementById('image-preview');
    const clearFormBtn = document.getElementById('clear-form-btn');

    const productIdInput = document.getElementById('product-id');
    const nameInput = document.getElementById('name');
    const priceInput = document.getElementById('price');
    const costPriceInput = document.getElementById('cost_price');
    const stockInput = document.getElementById('stock');
    const barcodeInput = document.getElementById('barcode');
    const shortcutInput = document.getElementById('shortcut_key');

    // عناصر DOM الجديدة لإدارة الأيقونات/الصور
    const displayImageRadio = document.getElementById('display-image');
    const displayIconRadio = document.getElementById('display-icon');
    const imageUploadSection = document.getElementById('image-upload-section');
    const iconSelectionSection = document.getElementById('icon-selection-section');
    const productIconInput = document.getElementById('product-icon');
    const iconPreview = document.getElementById('icon-preview');
    const iconSuggestionsDiv = document.getElementById('icon-suggestions'); // جديد

    let productsCache = [];
    let selectedImagePath = null;
    let selectedIconName = null;
    let isImageDisplayType = true;

    // مكتبة الأيقونات للبحث السهل (يمكن توسيعها حسب الحاجة)
    const iconLibrary = [
        { name: "برجر", iconClass: "fa-burger" },
        { name: "شاي", iconClass: "fa-mug-hot" },
        { name: "قهوة", iconClass: "fa-coffee" },
        { name: "بيتزا", iconClass: "fa-pizza-slice" },
        { name: "ساندويتش", iconClass: "fa-sandwich" },
        { name: "مشروب غازي", iconClass: "fa-soda" },
        { name: "ماء", iconClass: "fa-water" },
        { name: "دجاج", iconClass: "fa-drumstick-bite" },
        { name: "سمك", iconClass: "fa-fish" },
        { name: "خضروات", iconClass: "fa-carrot" },
        { name: "فواكه", iconClass: "fa-apple-whole" },
        { name: "حلويات", iconClass: "fa-cookie-bite" },
        { name: "كيك", iconClass: "fa-cake-candles" },
        { name: "خبز", iconClass: "fa-bread-slice" },
        { name: "حليب", iconClass: "fa-milk" },
        { name: "آيس كريم", iconClass: "fa-ice-cream" },
        { name: "إفطار", iconClass: "fa-egg" },
        { name: "عشاء", iconClass: "fa-utensils" },
        { name: "مشروب", iconClass: "fa-glass-water" },
        { name: "طبق", iconClass: "fa-plate-wheat" },
        { name: "حساب", iconClass: "fa-calculator" },
        { name: "مستخدم", iconClass: "fa-user" },
        { name: "إعدادات", iconClass: "fa-gear" },
        { name: "تقرير", iconClass: "fa-chart-line" },
        { name: "مال", iconClass: "fa-money-bill-wave" },
        { name: "بطاقة", iconClass: "fa-credit-card" },
        { name: "نقدي", iconClass: "fa-cash-register" },
        { name: "توصيل", iconClass: "fa-truck" },
        { name: "صالة", iconClass: "fa-chair" },
        { name: "خصم", iconClass: "fa-percent" },
        { name: "إرجاع", iconClass: "fa-rotate-left" },
        { name: "طباعة", iconClass: "fa-print" },
        { name: "مخزون", iconClass: "fa-boxes-stacked" },
        { name: "باركود", iconClass: "fa-barcode" },
        { name: "سعر", iconClass: "fa-tag" },
        { name: "عميل", iconClass: "fa-users" },
        { name: "مصروف", iconClass: "fa-receipt" },
        { name: "وردية", iconClass: "fa-clock-rotate-left" },
        { name: "ترخيص", iconClass: "fa-key" },
        { name: "إكسل", iconClass: "fa-file-excel" },
        { name: "PDF", iconClass: "fa-file-pdf" },
        { name: "إلغاء", iconClass: "fa-xmark" },
        { name: "حفظ", iconClass: "fa-floppy-disk" },
        { name: "تعديل", iconClass: "fa-pen-to-square" },
        { name: "حذف", iconClass: "fa-trash" },
        { name: "إضافة", iconClass: "fa-plus" },
        { name: "بحث", iconClass: "fa-magnifying-glass" },
        { name: "تنبيه", iconClass: "fa-bell" },
        { name: "معلومات", iconClass: "fa-circle-info" },
        { name: "تحذير", iconClass: "fa-triangle-exclamation" },
        { name: "نجاح", iconClass: "fa-circle-check" },
        { name: "فشل", iconClass: "fa-circle-xmark" },
        { name: "الرئيسية", iconClass: "fa-house" },
        { name: "نقاط البيع", iconClass: "fa-calculator" },
        { name: "المنتجات", iconClass: "fa-boxes-stacked" },
        { name: "العملاء", iconClass: "fa-users" },
        { name: "المصروفات", iconClass: "fa-receipt" },
        { name: "التقارير", iconClass: "fa-chart-line" },
        { name: "المستخدمين", iconClass: "fa-user-group" },
        { name: "الإعدادات", iconClass: "fa-gear" },
        { name: "الورديات", iconClass: "fa-cash-register" },
        { name: "فاتورة", iconClass: "fa-file-invoice" },
        { name: "صندوق", iconClass: "fa-box" },
        { name: "سلة", iconClass: "fa-cart-shopping" },
        { name: "ميزان", iconClass: "fa-scale-balanced" },
        { name: "ميكروفون", iconClass: "fa-microphone" },
        { name: "سماعة", iconClass: "fa-headphones" },
        { name: "كمبيوتر", iconClass: "fa-computer" },
        { name: "هاتف", iconClass: "fa-phone" },
        { name: "عنوان", iconClass: "fa-location-dot" },
        { name: "قائمة", iconClass: "fa-list" },
        { name: "شبكة", iconClass: "fa-grid" },
        { name: "تقويم", iconClass: "fa-calendar-days" },
        { name: "ساعة", iconClass: "fa-clock" },
        { name: "صورة", iconClass: "fa-image" },
        { name: "مفتاح", iconClass: "fa-key" },
        { name: "قفل", iconClass: "fa-lock" },
        { name: "فتح", iconClass: "fa-unlock" },
        { name: "تحميل", iconClass: "fa-download" },
        { name: "رفع", iconClass: "fa-upload" },
        { name: "إعادة تعيين", iconClass: "fa-arrows-rotate" },
        { name: "تأكيد", iconClass: "fa-check" },
        { name: "رفض", iconClass: "fa-xmark" },
        { name: "ورقة", iconClass: "fa-sheet-plastic" },
        { name: "مجلد", iconClass: "fa-folder" },
        { name: "ملف", iconClass: "fa-file" },
        { name: "قلم", iconClass: "fa-pencil" },
        { name: "فرشاة", iconClass: "fa-brush" },
        { name: "لوحة", iconClass: "fa-palette" },
        { name: "نجمة", iconClass: "fa-star" },
        { name: "قلب", iconClass: "fa-heart" },
        { name: "عين", iconClass: "fa-eye" },
        { name: "يد", iconClass: "fa-hand" },
        { name: "إشارة", iconClass: "fa-flag" },
        { name: "جرس", iconClass: "fa-bell" },
        { name: "شمس", iconClass: "fa-sun" },
        { name: "قمر", iconClass: "fa-moon" },
        { name: "سحابة", iconClass: "fa-cloud" },
        { name: "مطر", iconClass: "fa-cloud-showers-heavy" },
        { name: "ثلج", iconClass: "fa-snowflake" },
        { name: "برق", iconClass: "fa-bolt" },
        { name: "نار", iconClass: "fa-fire" },
        { name: "شجرة", iconClass: "fa-tree" },
        { name: "زهرة", iconClass: "fa-flower" },
        { name: "صخرة", iconClass: "fa-mountain" },
        { name: "بحر", iconClass: "fa-water" },
        { name: "جبل", iconClass: "fa-mountain-sun" },
        { name: "طائرة", iconClass: "fa-plane" },
        { name: "سيارة", iconClass: "fa-car" },
        { name: "دراجة", iconClass: "fa-bicycle" },
        { name: "قطار", iconClass: "fa-train" },
        { name: "سفينة", iconClass: "fa-ship" },
        { name: "منزل", iconClass: "fa-house" },
        { name: "مكتب", iconClass: "fa-building" },
        { name: "مستشفى", iconClass: "fa-hospital" },
        { name: "مدرسة", iconClass: "fa-school" },
        { name: "متجر", iconClass: "fa-store" },
        { name: "مطعم", iconClass: "fa-utensils" },
        { name: "فندق", iconClass: "fa-hotel" },
        { name: "بنك", iconClass: "fa-building-columns" },
        { name: "مكتبة", iconClass: "fa-book" },
        { name: "متحف", iconClass: "fa-landmark" },
        { name: "حديقة", iconClass: "fa-tree" },
        { name: "مطار", iconClass: "fa-plane-departure" },
        { name: "محطة", iconClass: "fa-train-subway" },
        { name: "جسر", iconClass: "fa-bridge" },
        { name: "طريق", iconClass: "fa-road" },
        { name: "مدينة", iconClass: "fa-city" },
        { name: "قرية", iconClass: "fa-house-chimney" },
        { name: "عالم", iconClass: "fa-globe" },
        { name: "خريطة", iconClass: "fa-map" },
        { name: "بوصلة", iconClass: "fa-compass" },
        { name: "دبوس", iconClass: "fa-thumbtack" },
        { name: "علامة", iconClass: "fa-bookmark" },
        { name: "شريط", iconClass: "fa-ribbon" },
        { name: "كأس", iconClass: "fa-trophy" },
        { name: "ميدالية", iconClass: "fa-medal" },
        { name: "هدية", iconClass: "fa-gift" },
        { name: "بالون", iconClass: "fa-balloon" },
        { name: "احتفال", iconClass: "fa-champagne-glasses" },
        { name: "موسيقى", iconClass: "fa-music" },
        { name: "صوت", iconClass: "fa-volume-high" },
        { name: "صامت", iconClass: "fa-volume-xmark" },
        { name: "فيديو", iconClass: "fa-video" },
        { name: "كاميرا", iconClass: "fa-camera" },
        { name: "ميكروفون", iconClass: "fa-microphone" },
        { name: "سماعات", iconClass: "fa-headphones" },
        { name: "ميكروفون مكتوم", iconClass: "fa-microphone-slash" },
        { name: "شاشة", iconClass: "fa-display" },
        { name: "لوحة مفاتيح", iconClass: "fa-keyboard" },
        { name: "ماوس", iconClass: "fa-mouse" },
        { name: "طابعة", iconClass: "fa-print" },
        { name: "ماسح ضوئي", iconClass: "fa-scanner" },
        { name: "فاكس", iconClass: "fa-fax" },
        { name: "شبكة", iconClass: "fa-network-wired" },
        { name: "واي فاي", iconClass: "fa-wifi" },
        { name: "بلوتوث", iconClass: "fa-bluetooth" },
        { name: "USB", iconClass: "fa-usb" },
        { name: "بطارية", iconClass: "fa-battery-full" },
        { name: "شحن", iconClass: "fa-charging-station" },
        { name: "كهرباء", iconClass: "fa-plug" },
        { name: "ضوء", iconClass: "fa-lightbulb" },
        { name: "مروحة", iconClass: "fa-fan" },
        { name: "تكييف", iconClass: "fa-wind" },
        { name: "تدفئة", iconClass: "fa-fire-burner" },
        { name: "مياه", iconClass: "fa-faucet-drip" },
        { name: "صرف صحي", iconClass: "fa-toilet" },
        { name: "قمامة", iconClass: "fa-trash" },
        { name: "إعادة تدوير", iconClass: "fa-recycle" },
        { name: "أمان", iconClass: "fa-shield-halved" },
        { name: "كشف", iconClass: "fa-magnifying-glass-chart" },
        { name: "تشفير", iconClass: "fa-lock" },
        { name: "فك تشفير", iconClass: "fa-unlock" },
        { name: "فيروس", iconClass: "fa-virus" },
        { name: "جدار ناري", iconClass: "fa-firewall" },
        { name: "مراقبة", iconClass: "fa-video" },
        { name: "إنذار", iconClass: "fa-bell" },
        { name: "حماية", iconClass: "fa-shield-halved" },
        { name: "نسخ احتياطي", iconClass: "fa-database" },
        { name: "استعادة", iconClass: "fa-rotate-left" },
        { name: "سحابة", iconClass: "fa-cloud" },
        { name: "خادم", iconClass: "fa-server" },
        { name: "قاعدة بيانات", iconClass: "fa-database" },
        { name: "شبكة", iconClass: "fa-network-wired" },
        { name: "راوتر", iconClass: "fa-router" },
        { name: "سويتش", iconClass: "fa-ethernet" },
        { name: "كابل", iconClass: "fa-cable-car" },
        { name: "هوائي", iconClass: "fa-tower-broadcast" },
        { name: "ساتلايت", iconClass: "fa-satellite" },
        { name: "راديو", iconClass: "fa-radio" },
        { name: "موجة", iconClass: "fa-wave-square" },
        { name: "صوت", iconClass: "fa-volume-high" },
        { name: "صامت", iconClass: "fa-volume-xmark" },
        { name: "ميكروفون", iconClass: "fa-microphone" },
        { name: "سماعات", iconClass: "fa-headphones" },
        { name: "فيديو", iconClass: "fa-video" },
        { name: "كاميرا", iconClass: "fa-camera" },
        { name: "صورة", iconClass: "fa-image" },
        { name: "معرض", iconClass: "fa-images" },
        { name: "ألبوم", iconClass: "fa-photo-film" },
        { name: "موسيقى", iconClass: "fa-music" },
        { name: "تشغيل", iconClass: "fa-play" },
        { name: "إيقاف", iconClass: "fa-stop" },
        { name: "إيقاف مؤقت", iconClass: "fa-pause" },
        { name: "تخطي", iconClass: "fa-forward" },
        { name: "رجوع", iconClass: "fa-backward" },
        { name: "حلقة", iconClass: "fa-repeat" },
        { name: "عشوائي", iconClass: "fa-shuffle" },
        { name: "قائمة تشغيل", iconClass: "fa-list-music" },
        { name: "صوت عال", iconClass: "fa-volume-up" },
        { name: "صوت منخفض", iconClass: "fa-volume-down" },
        { name: "كتم الصوت", iconClass: "fa-volume-mute" },
        { name: "ملء الشاشة", iconClass: "fa-expand" },
        { name: "تصغير الشاشة", iconClass: "fa-compress" },
        { name: "شاشة", iconClass: "fa-desktop" },
        { name: "جوال", iconClass: "fa-mobile-screen" },
        { name: "تابلت", iconClass: "fa-tablet-screen-button" },
        { name: "لابتوب", iconClass: "fa-laptop" },
        { name: "ساعة ذكية", iconClass: "fa-watch" },
        { name: "كاميرا ويب", iconClass: "fa-camera-web" },
        { name: "ميكروفون لابتوب", iconClass: "fa-microphone-lines" },
        { name: "سماعة رأس", iconClass: "fa-headset" },
        { name: "طابعة", iconClass: "fa-print" },
        { name: "ماسح ضوئي", iconClass: "fa-scanner" },
        { name: "فاكس", iconClass: "fa-fax" },
        { name: "شبكة", iconClass: "fa-network-wired" },
        { name: "واي فاي", iconClass: "fa-wifi" },
        { name: "بلوتوث", iconClass: "fa-bluetooth" },
        { name: "USB", iconClass: "fa-usb" },
        { name: "بطارية", iconClass: "fa-battery-full" },
        { name: "شحن", iconClass: "fa-charging-station" },
        { name: "كهرباء", iconClass: "fa-plug" },
        { name: "ضوء", iconClass: "fa-lightbulb" },
        { name: "مروحة", iconClass: "fa-fan" },
        { name: "تكييف", iconClass: "fa-wind" },
        { name: "تدفئة", iconClass: "fa-fire-burner" },
        { name: "مياه", iconClass: "fa-faucet-drip" },
        { name: "صرف صحي", iconClass: "fa-toilet" },
        { name: "قمامة", iconClass: "fa-trash" },
        { name: "إعادة تدوير", iconClass: "fa-recycle" },
        { name: "أمان", iconClass: "fa-shield-halved" },
        { name: "كشف", iconClass: "fa-magnifying-glass-chart" },
        { name: "تشفير", iconClass: "fa-lock" },
        { name: "فك تشفير", iconClass: "fa-unlock" },
        { name: "فيروس", iconClass: "fa-virus" },
        { name: "جدار ناري", iconClass: "fa-firewall" },
        { name: "مراقبة", iconClass: "fa-video" },
        { name: "إنذار", iconClass: "fa-bell" },
        { name: "حماية", iconClass: "fa-shield-halved" },
        { name: "نسخ احتياطي", iconClass: "fa-database" },
        { name: "استعادة", iconClass: "fa-rotate-left" },
        { name: "سحابة", iconClass: "fa-cloud" },
        { name: "خادم", iconClass: "fa-server" },
        { name: "قاعدة بيانات", iconClass: "fa-database" },
        { name: "شبكة", iconClass: "fa-network-wired" },
        { name: "راوتر", iconClass: "fa-router" },
        { name: "سويتش", iconClass: "fa-ethernet" },
        { name: "كابل", iconClass: "fa-cable-car" },
        { name: "هوائي", iconClass: "fa-tower-broadcast" },
        { name: "ساتلايت", iconClass: "fa-satellite" },
        { name: "راديو", iconClass: "fa-radio" },
        { name: "موجة", iconClass: "fa-wave-square" },
        { name: "صوت", iconClass: "fa-volume-high" },
        { name: "صامت", iconClass: "fa-volume-xmark" },
        { name: "ميكروفون", iconClass: "fa-microphone" },
        { name: "سماعات", iconClass: "fa-headphones" },
        { name: "فيديو", iconClass: "fa-video" },
        { name: "كاميرا", iconClass: "fa-camera" },
        { name: "صورة", iconClass: "fa-image" },
        { name: "معرض", iconClass: "fa-images" },
        { name: "ألبوم", iconClass: "fa-photo-film" },
        { name: "موسيقى", iconClass: "fa-music" },
        { name: "تشغيل", iconClass: "fa-play" },
        { name: "إيقاف", iconClass: "fa-stop" },
        { name: "إيقاف مؤقت", iconClass: "fa-pause" },
        { name: "تخطي", iconClass: "fa-forward" },
        { name: "رجوع", iconClass: "fa-backward" },
        { name: "حلقة", iconClass: "fa-repeat" },
        { name: "عشوائي", iconClass: "fa-shuffle" },
        { name: "قائمة تشغيل", iconClass: "fa-list-music" },
        { name: "صوت عال", iconClass: "fa-volume-up" },
        { name: "صوت منخفض", iconClass: "fa-volume-down" },
        { name: "كتم الصوت", iconClass: "fa-volume-mute" },
        { name: "ملء الشاشة", iconClass: "fa-expand" },
        { name: "تصغير الشاشة", iconClass: "fa-compress" },
        { name: "شاشة", iconClass: "fa-desktop" },
        { name: "جوال", iconClass: "fa-mobile-screen" },
        { name: "تابلت", iconClass: "fa-tablet-screen-button" },
        { name: "لابتوب", iconClass: "fa-laptop" },
        { name: "ساعة ذكية", iconClass: "fa-watch" },
        { name: "كاميرا ويب", iconClass: "fa-camera-web" },
        { name: "ميكروفون لابتوب", iconClass: "fa-microphone-lines" },
        { name: "سماعة رأس", iconClass: "fa-headset" },
        { name: "طابعة", iconClass: "fa-print" },
        { name: "ماسح ضوئي", iconClass: "fa-scanner" },
        { name: "فاكس", iconClass: "fa-fax" },
        { name: "شبكة", iconClass: "fa-network-wired" },
        { name: "واي فاي", iconClass: "fa-wifi" },
        { name: "بلوتوث", iconClass: "fa-bluetooth" },
        { name: "USB", iconClass: "fa-usb" },
        { name: "بطارية", iconClass: "fa-battery-full" },
        { name: "شحن", iconClass: "fa-charging-station" },
        { name: "كهرباء", iconClass: "fa-plug" },
        { name: "ضوء", iconClass: "fa-lightbulb" },
        { name: "مروحة", iconClass: "fa-fan" },
        { name: "تكييف", iconClass: "fa-wind" },
        { name: "تدفئة", iconClass: "fa-fire-burner" },
        { name: "مياه", iconClass: "fa-faucet-drip" },
        { name: "صرف صحي", iconClass: "fa-toilet" },
        { name: "قمامة", iconClass: "fa-trash" },
        { name: "إعادة تدوير", iconClass: "fa-recycle" },
        { name: "أمان", iconClass: "fa-shield-halved" },
        { name: "كشف", iconClass: "fa-magnifying-glass-chart" },
        { name: "تشفير", iconClass: "fa-lock" },
        { name: "فك تشفير", iconClass: "fa-unlock" },
        { name: "فيروس", iconClass: "fa-virus" },
        { name: "جدار ناري", iconClass: "fa-firewall" },
        { name: "مراقبة", iconClass: "fa-video" },
        { name: "إنذار", iconClass: "fa-bell" },
        { name: "حماية", iconClass: "fa-shield-halved" },
        { name: "نسخ احتياطي", iconClass: "fa-database" },
        { name: "استعادة", iconClass: "fa-rotate-left" },
        { name: "سحابة", iconClass: "fa-cloud" },
        { name: "خادم", iconClass: "fa-server" },
        { name: "قاعدة بيانات", iconClass: "fa-database" },
        { name: "شبكة", iconClass: "fa-network-wired" },
        { name: "راوتر", iconClass: "fa-router" },
        { name: "سويتش", iconClass: "fa-ethernet" },
        { name: "كابل", iconClass: "fa-cable-car" },
        { name: "هوائي", iconClass: "fa-tower-broadcast" },
        { name: "ساتلايت", iconClass: "fa-satellite" },
        { name: "راديو", iconClass: "fa-radio" },
        { name: "موجة", iconClass: "fa-wave-square" },
        { name: "صوت", iconClass: "fa-volume-high" },
        { name: "صامت", iconClass: "fa-volume-xmark" },
        { name: "ميكروفون", iconClass: "fa-microphone" },
        { name: "سماعات", iconClass: "fa-headphones" },
        { name: "فيديو", iconClass: "fa-video" },
        { name: "كاميرا", iconClass: "fa-camera" },
        { name: "صورة", iconClass: "fa-image" },
        { name: "معرض", iconClass: "fa-images" },
        { name: "ألبوم", iconClass: "fa-photo-film" },
        { name: "موسيقى", iconClass: "fa-music" },
        { name: "تشغيل", iconClass: "fa-play" },
        { name: "إيقاف", iconClass: "fa-stop" },
        { name: "إيقاف مؤقت", iconClass: "fa-pause" },
        { name: "تخطي", iconClass: "fa-forward" },
        { name: "رجوع", iconClass: "fa-backward" },
        { name: "حلقة", iconClass: "fa-repeat" },
        { name: "عشوائي", iconClass: "fa-shuffle" },
        { name: "قائمة تشغيل", iconClass: "fa-list-music" },
        { name: "صوت عال", iconClass: "fa-volume-up" },
        { name: "صوت منخفض", iconClass: "fa-volume-down" },
        { name: "كتم الصوت", iconClass: "fa-volume-mute" },
        { name: "ملء الشاشة", iconClass: "fa-expand" },
        { name: "تصغير الشاشة", iconClass: "fa-compress" },
        { name: "شاشة", iconClass: "fa-desktop" },
        { name: "جوال", iconClass: "fa-mobile-screen" },
        { name: "تابلت", iconClass: "fa-tablet-screen-button" },
        { name: "لابتوب", iconClass: "fa-laptop" },
        { name: "ساعة ذكية", iconClass: "fa-watch" },
        { name: "كاميرا ويب", iconClass: "fa-camera-web" },
        { name: "ميكروفون لابتوب", iconClass: "fa-microphone-lines" },
        { name: "سماعة رأس", iconClass: "fa-headset" }
    ];


    async function loadProducts() {
        try {
            productsCache = await window.api.getProducts();
            renderTable();
        } catch (error) {
            Swal.fire('خطأ!', 'فشل تحميل قائمة المنتجات.', 'error');
        }
    }

    // إضافة مستمعي الأحداث لأزرار الراديو
    displayImageRadio.addEventListener('change', () => {
        isImageDisplayType = true;
        imageUploadSection.style.display = 'block';
        iconSelectionSection.style.display = 'none';
        productIconInput.value = ''; // مسح قيمة الأيقونة عند التحويل للصورة
        selectedIconName = null;
    });

    displayIconRadio.addEventListener('change', () => {
        isImageDisplayType = false;
        imageUploadSection.style.display = 'none';
        iconSelectionSection.style.display = 'block';
        // لا تمسح imagePreview.src هنا، فقط أخفها
        imagePreview.style.display = 'none';
        selectedImagePath = null; // مسح قيمة مسار الصورة عند التحويل للأيقونة
        // إذا كان هناك أيقونة سابقة، قم بعرضها
        const currentIconValue = productIconInput.value.trim();
        iconPreview.innerHTML = currentIconValue ? `<i class="fa-solid ${currentIconValue}"></i>` : `<i class="fa-solid fa-question-circle"></i>`;
        selectedIconName = currentIconValue;
    });

    // إضافة مستمع حدث لتحديث معاينة الأيقونة
    // إضافة مستمع حدث لتحديث معاينة الأيقونة وعرض الاقتراحات
    productIconInput.addEventListener('input', () => {
        const searchTerm = productIconInput.value.trim().toLowerCase();
        iconSuggestionsDiv.innerHTML = ''; // مسح الاقتراحات القديمة

        if (searchTerm.length > 0) {
            const filteredIcons = iconLibrary.filter(icon =>
                icon.name.toLowerCase().includes(searchTerm) ||
                icon.iconClass.toLowerCase().includes(searchTerm)
            ).slice(0, 10); // عرض 10 اقتراحات كحد أقصى

            if (filteredIcons.length > 0) {
                filteredIcons.forEach(icon => {
                    const suggestionItem = document.createElement('div');
                    suggestionItem.className = 'icon-suggestion-item';
                    suggestionItem.innerHTML = `<i class="fa-solid ${icon.iconClass}"></i> <span>${icon.name} (${icon.iconClass})</span>`;
                    suggestionItem.dataset.iconClass = icon.iconClass; // لتسهيل الاختيار
                    iconSuggestionsDiv.appendChild(suggestionItem);

                    suggestionItem.addEventListener('click', () => {
                        productIconInput.value = icon.iconClass;
                        iconPreview.innerHTML = `<i class="fa-solid ${icon.iconClass}"></i>`;
                        selectedIconName = icon.iconClass;
                        iconSuggestionsDiv.innerHTML = ''; // إخفاء الاقتراحات بعد الاختيار
                    });
                });
                iconSuggestionsDiv.style.display = 'block';
            } else {
                iconSuggestionsDiv.style.display = 'none';
            }
        } else {
            iconSuggestionsDiv.style.display = 'none';
        }

        // تحديث معاينة الأيقونة حتى لو لم يكن هناك اقتراحات
        const currentIconClass = productIconInput.value.trim();
        iconPreview.innerHTML = currentIconClass ? `<i class="fa-solid ${currentIconClass}"></i>` : `<i class="fa-solid fa-question-circle"></i>`;
        selectedIconName = currentIconClass;
    });

    // إخفاء الاقتراحات عند النقر خارج حقل الإدخال
    document.addEventListener('click', (e) => {
        if (!productIconInput.contains(e.target) && !iconSuggestionsDiv.contains(e.target)) {
            iconSuggestionsDiv.style.display = 'none';
        }
    });

    function renderTable() {
    productsTableBody.innerHTML = '';
    productsCache.forEach(product => {
        const row = document.createElement('tr');

        let displayHtml = '';
        if (product.icon_name) {
            // إذا كان هناك اسم أيقونة، استخدم أيقونة Font Awesome
            displayHtml = `<div class="product-icon-display"><i class="fa-solid ${product.icon_name}"></i></div>`;
        } else if (product.image_path) {
            // إذا كان هناك مسار صورة، استخدم الصورة
            displayHtml = `<img src="${product.image_path}" alt="${product.name}" class="product-thumb" style="width:50px; height:50px; object-fit:cover;" onerror="this.onerror=null;this.src='https://placehold.co/50x50/f0f4f8/1e293b?text=?';">`;
        } else {
            // إذا لم يكن هناك أيقونة أو صورة، استخدم صورة افتراضية بنص
            displayHtml = `<img src="https://placehold.co/50x50/f0f4f8/1e293b?text=${product.name.charAt(0)}" alt="${product.name}" class="product-thumb" style="width:50px; height:50px; object-fit:cover;">`;
        }

        row.innerHTML = `
            <td>${displayHtml}</td>
            <td>${product.name}</td>
            <td>${formatCurrency(product.price)}</td> <!-- استخدم formatCurrency هنا -->
            <td>${product.shortcut_key || '-'}</td>
            <td>${product.stock ?? '∞'}</td>
            <td>${product.barcode || '-'}</td>
            <td class="actions-cell">
                <button class="btn btn-secondary edit-btn" data-id="${product.id}">تعديل</button>
                <button class="btn btn-danger delete-btn" data-id="${product.id}">حذف</button>
            </td>
        `;
        productsTableBody.appendChild(row);
    });
}

// تأكد من وجود دالة formatCurrency إذا لم تكن موجودة
// يمكنك نسخها من pos-view.js إذا لم تكن موجودة في manage-products.js
function formatCurrency(amount) {
    // تحتاج إلى جلب إعدادات العملة من appSettings أو استخدام قيمة افتراضية
    // بما أن manage-products.js لا يصل إلى appSettings مباشرة، سنستخدم الافتراضي
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount || 0);
}

    function clearForm() {
    productForm.reset();
    productIdInput.value = '';

    // إعادة تعيين خيارات عرض الصورة/الأيقونة
    document.getElementById('display-image').checked = true;
    document.getElementById('image-upload-section').style.display = 'block';
    document.getElementById('icon-selection-section').style.display = 'none';

    imagePreview.style.display = 'none';
    imagePreview.src = '';
    selectedImagePath = null;

    document.getElementById('product-icon').value = '';
    document.getElementById('icon-preview').innerHTML = `<i class="fa-solid fa-question-circle"></i>`;
    selectedIconName = null;
    isImageDisplayType = true; // إعادة تعيين الحالة الافتراضية

    productForm.querySelector('button[type="submit"]').textContent = 'حفظ المنتج';
}

    function populateForm(id) {
    const product = productsCache.find(p => p.id === id);
    if (!product) return;

    // قم بمسح النموذج أولاً لإعادة تعيين الحقول
    clearForm();

    productIdInput.value = product.id;
    nameInput.value = product.name;
    priceInput.value = product.price;
    costPriceInput.value = product.cost_price || '';
    stockInput.value = product.stock ?? '';
    barcodeInput.value = product.barcode || '';
    shortcutInput.value = product.shortcut_key || '';

    // تحديد ما إذا كان المنتج يستخدم صورة أو أيقونة
    if (product.icon_name) {
        document.getElementById('display-icon').checked = true;
        document.getElementById('image-upload-section').style.display = 'none';
        document.getElementById('icon-selection-section').style.display = 'block';
        productIconInput.value = product.icon_name;
        iconPreview.innerHTML = `<i class="fa-solid ${product.icon_name}"></i>`;
        selectedIconName = product.icon_name;
        isImageDisplayType = false; // تحديث الحالة
    } else if (product.image_path) {
        document.getElementById('display-image').checked = true;
        document.getElementById('image-upload-section').style.display = 'block';
        document.getElementById('icon-selection-section').style.display = 'none';
        imagePreview.src = product.image_path;
        imagePreview.style.display = 'block';
        selectedImagePath = product.image_path.split('/').pop();
        isImageDisplayType = true; // تحديث الحالة
    } else {
        // لا توجد صورة ولا أيقونة، العودة إلى الافتراضي (صورة)
        document.getElementById('display-image').checked = true;
        document.getElementById('image-upload-section').style.display = 'block';
        document.getElementById('icon-selection-section').style.display = 'none';
        imagePreview.src = '';
        imagePreview.style.display = 'none';
        selectedImagePath = null;
        selectedIconName = null;
        isImageDisplayType = true;
    }

    productForm.querySelector('button[type="submit"]').textContent = 'تحديث المنتج';
}

    productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // تحقق من صحة البيانات المدخلة قبل المتابعة
    if (!nameInput.value.trim()) {
        Swal.fire('خطأ!', 'اسم المنتج مطلوب.', 'error');
        return;
    }
    if (isNaN(parseFloat(priceInput.value)) || parseFloat(priceInput.value) <= 0) {
        Swal.fire('خطأ!', 'سعر البيع يجب أن يكون رقمًا موجبًا.', 'error');
        return;
    }

    const productData = {
        id: productIdInput.value ? parseInt(productIdInput.value) : null,
        name: nameInput.value,
        price: parseFloat(priceInput.value),
        cost_price: parseFloat(costPriceInput.value) || null,
        stock: stockInput.value ? parseInt(stockInput.value) : null,
        barcode: barcodeInput.value.trim() || null,
        shortcut_key: shortcutInput.value.trim().toLowerCase() || null,
        image_path: null, // قم بتهيئتها إلى null
        icon_name: null  // قم بتهيئتها إلى null
    };

    // بناء productData بناءً على نوع العرض المختار
    if (isImageDisplayType) {
        productData.image_path = selectedImagePath;
    } else {
        productData.icon_name = selectedIconName;
    }

    try {
        let result;
        if (productData.id) {
            result = await window.api.updateProduct(productData);
        } else {
            result = await window.api.addProduct(productData);
        }

        if (result.success) {
            Swal.fire({ icon: 'success', title: 'تم الحفظ بنجاح!', timer: 1500, showConfirmButton: false });
            clearForm();
            // لا نحتاج استدعاء loadProducts() هنا لأن onProductsUpdate ستقوم بذلك
        } else {
            Swal.fire('خطأ!', `حدث خطأ: ${result.message || 'تأكد أن الباركود أو مفتاح الاختصار غير مكرر.'}`, 'error');
        }
    } catch (error) {
        console.error('Product save failed:', error);
        Swal.fire('خطأ!', 'حدث خطأ غير متوقع أثناء حفظ المنتج.', 'error');
    }
});

    productsTableBody.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const id = parseInt(target.dataset.id);
        if (target.classList.contains('edit-btn')) {
            populateForm(id);
        } else if (target.classList.contains('delete-btn')) {
            const result = await Swal.fire({ title: 'هل أنت متأكد؟', text: "لن تتمكن من استرجاعه!", icon: 'warning', showCancelButton: true, confirmButtonText: 'نعم، احذفه!', cancelButtonText: 'إلغاء' });
            if (result.isConfirmed) {
                await window.api.deleteProduct(id);
                Swal.fire('تم الحذف!', 'تم حذف المنتج.', 'success');
            }
        }
    });

    imageUploadBtn.addEventListener('click', async () => {
    // تأكد أن نوع العرض الحالي هو "صورة" قبل محاولة اختيار صورة
    if (!isImageDisplayType) {
        Swal.fire('تنبيه', 'الرجاء اختيار "صورة" كنوع عرض المنتج أولاً.', 'info');
        return;
    }

    const result = await window.api.selectImage();
    if (result.success) {
        selectedImagePath = result.path;
        imagePreview.src = result.fullPath;
        imagePreview.style.display = 'block';
        // عند اختيار صورة، تأكد من مسح أي أيقونة سابقة
        productIconInput.value = '';
        iconPreview.innerHTML = `<i class="fa-solid fa-question-circle"></i>`;
        selectedIconName = null;
    }
});

    clearFormBtn.addEventListener('click', clearForm);
    loadProducts();
    window.api.onProductsUpdate(loadProducts);
}