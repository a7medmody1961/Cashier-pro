export function init() {
    console.log("Settings script initialized.");

    const form = document.getElementById('settings-form');
    if (!form) return;

    // جلب جميع حقول الإدخال والاختيار داخل الفورم
    const inputs = form.querySelectorAll('input, select');
    let settings = {};

    /**
     * تحميل الإعدادات الحالية من قاعدة البيانات ووضعها في الحقول.
     */
    async function loadSettings() {
        try {
            settings = await window.api.getSettings();
            inputs.forEach(input => {
                if (settings.hasOwnProperty(input.id)) {
                    input.value = settings[input.id];
                }
            });
        } catch (error) {
            console.error('Failed to load settings:', error);
            Swal.fire('خطأ', 'فشل تحميل الإعدادات.', 'error');
        }
    }

    /**
     * حفظ الإعدادات عند الضغط على زر الحفظ.
     */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const updatedSettings = {};
        
        // تجميع القيم الجديدة من جميع الحقول
        inputs.forEach(input => {
            updatedSettings[input.id] = input.value;
        });

        try {
            await window.api.updateSettings(updatedSettings);
            Swal.fire({
                icon: 'success',
                title: 'تم الحفظ',
                text: 'تم تحديث الإعدادات بنجاح. قد يتطلب بعض التغييرات إعادة تشغيل البرنامج.',
                timer: 3000,
                showConfirmButton: false
            });
            // إعادة تحميل الإعدادات في الواجهة الرئيسية بعد الحفظ
            // يمكنك إضافة onSettingsUpdated listener إذا أردت تحديثًا فوريًا في كل مكان
        } catch (error) {
            console.error('Failed to save settings:', error);
            Swal.fire('خطأ', 'فشل حفظ الإعدادات.', 'error');
        }
    });

    // تحميل الإعدادات عند فتح الصفحة
    loadSettings();
}
