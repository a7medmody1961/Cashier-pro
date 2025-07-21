// ==================================================================================
// الملف الأول: src/main-process/auth-handlers.js (جديد ومعدل)
// الشرح: تم إزالة الاعتماد على مكتبة bcryptjs المحذوفة.
// أصبح الآن يقارن كلمة المرور كنص عادي (admin/admin).
// ==================================================================================

const { ipcMain } = require('electron');
const db = require('../../database');

function initializeAuthHandlers() {
    ipcMain.handle('login', (event, credentials) => {
        try {
            const user = db.prepare('SELECT * FROM users WHERE username = ?').get(credentials.username);

            if (user) {
                // مقارنة بسيطة لكلمة المرور كنص عادي
                if (credentials.password === user.password) {
                    const { password, ...userWithoutPassword } = user; // إزالة كلمة المرور قبل إرسالها للواجهة
                    return { success: true, user: userWithoutPassword };
                }
            }
            // في حالة فشل العثور على المستخدم أو عدم تطابق كلمة المرور
            return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'حدث خطأ أثناء تسجيل الدخول' };
        }
    });
}

module.exports = initializeAuthHandlers;
