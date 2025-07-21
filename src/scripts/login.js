// ==================================================================================
// الملف الثاني: src/scripts/login.js (تم الإصلاح النهائي)
// الشرح: تم الرجوع لاستخدام SweetAlert2 لعرض التنبيهات، كما في الكود الأصلي.
// ==================================================================================
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const submitButton = loginForm.querySelector('button[type="submit"]');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = usernameInput.value;
        const password = passwordInput.value;

        submitButton.disabled = true;
        submitButton.textContent = 'جاري الدخول...';

        try {
            const result = await window.api.login({ username, password });
            
            if (result.success) {
                // عند النجاح، أرسل إشارة للبرنامج الرئيسي مع بيانات المستخدم
                window.api.loginSuccess(result.user);
            } else {
                // عرض رسالة خطأ واضحة للمستخدم
                Swal.fire({
                    icon: 'error',
                    title: 'خطأ في تسجيل الدخول',
                    text: result.message || 'البيانات التي أدخلتها غير صحيحة.',
                    confirmButtonText: 'حسناً'
                });
            }
        } catch (error) {
            console.error('Login request failed:', error);
            Swal.fire({
                icon: 'error',
                title: 'خطأ فني',
                text: 'حدث خطأ غير متوقع. يرجى إعادة تشغيل البرنامج.',
                confirmButtonText: 'حسناً'
            });
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'تسجيل الدخول';
        }
    });
});