// ==================================================================================
// الملف الثاني: src/main-process/user-handlers.js (جديد ومعدل)
// الشرح: تم إزالة تشفير كلمات المرور عند إضافة أو تعديل المستخدمين.
// ==================================================================================

const { ipcMain } = require('electron');
const db = require('../../database');

function initializeUserHandlers() {
    ipcMain.handle('users:get', () => {
        try {
            // استبعاد كلمة المرور من النتائج
            const users = db.prepare('SELECT id, username, role, permissions FROM users').all();
            return users;
        } catch (error) {
            console.error('Failed to get users:', error);
            return [];
        }
    });

    ipcMain.handle('users:add', (event, user) => {
        try {
            // تخزين كلمة المرور كنص عادي
            const query = 'INSERT INTO users (username, password, role, permissions) VALUES (?, ?, ?, ?)';
            const permissions = JSON.stringify(user.permissions);
            const info = db.prepare(query).run(user.username, user.password, user.role, permissions);
            return { success: true, id: info.lastInsertRowid };
        } catch (error) {
            console.error('Failed to add user:', error);
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('users:update', (event, user) => {
        try {
            const permissions = JSON.stringify(user.permissions);
            if (user.password) {
                // تحديث كلمة المرور كنص عادي
                const query = 'UPDATE users SET username = ?, password = ?, role = ?, permissions = ? WHERE id = ?';
                db.prepare(query).run(user.username, user.password, user.role, permissions, user.id);
            } else {
                // التحديث بدون تغيير كلمة المرور
                const query = 'UPDATE users SET username = ?, role = ?, permissions = ? WHERE id = ?';
                db.prepare(query).run(user.username, user.role, permissions, user.id);
            }
            return { success: true };
        } catch (error) {
            console.error('Failed to update user:', error);
            return { success: false, message: error.message };
        }
    });

    ipcMain.handle('users:delete', (event, id) => {
        try {
            // منع حذف المستخدم المسؤول الرئيسي
            if (id === 1) {
                return { success: false, message: 'لا يمكن حذف المستخدم المسؤول الرئيسي' };
            }
            db.prepare('DELETE FROM users WHERE id = ?').run(id);
            return { success: true };
        } catch (error) {
            console.error('Failed to delete user:', error);
            return { success: false, message: error.message };
        }
    });
}

module.exports = initializeUserHandlers;
