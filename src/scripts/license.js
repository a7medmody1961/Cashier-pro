// ==================================================================================
// الملف الثالث: src/scripts/license.js (تم الإصلاح)
// الشرح: تم تغيير 'machine-id-display' إلى 'machine-id' ليتطابق مع ملف HTML.
// ==================================================================================
document.addEventListener('DOMContentLoaded', async () => {
    const licenseForm = document.getElementById('license-form');
    const licenseKeyInput = document.getElementById('license-key');
    const machineIdDisplay = document.getElementById('machine-id'); // <--- تم إصلاح هذا السطر
    const errorMessage = document.getElementById('error-message');

    try {
        const machineId = await window.api.getMachineId();
        if (machineIdDisplay) {
            machineIdDisplay.textContent = machineId;
        }
    } catch (error) {
        if (machineIdDisplay) {
            machineIdDisplay.textContent = 'خطأ في جلب معرف الجهاز';
        }
    }

    licenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const key = licenseKeyInput.value.trim();
        if (!key) {
            if(errorMessage) errorMessage.textContent = 'الرجاء إدخال مفتاح الترخيص.';
            return;
        }
        
        try {
            const result = await window.api.activateLicense(key);
            if (result.success) {
                if(errorMessage) {
                    errorMessage.textContent = 'تم التفعيل بنجاح! سيتم إعادة تشغيل البرنامج...';
                    errorMessage.style.color = 'green';
                }
            } else {
                if(errorMessage) errorMessage.textContent = result.message || 'مفتاح الترخيص غير صالح.';
            }
        } catch (error) {
            console.error('Activation failed:', error);
            if(errorMessage) errorMessage.textContent = 'حدث خطأ أثناء عملية التفعيل.';
        }
    });
});