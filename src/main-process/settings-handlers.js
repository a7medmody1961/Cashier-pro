// ==================================================================================
// الملف الثاني: src/main-process/settings-handlers.js (تم التحديث ليتطابق مع هيكلك)
// ==================================================================================
const db = require('../../database');

module.exports = (ipcMain) => {
    ipcMain.handle('settings:get', () => {
        try {
            const settingsArray = db.prepare('SELECT * FROM settings').all();
            const settingsObject = settingsArray.reduce((obj, item) => {
                obj[item.key] = item.value;
                return obj;
            }, {});
            return settingsObject;
        } catch (error) {
            console.error("Failed to get settings:", error);
            return {}; // إرجاع كائن فارغ في حالة الخطأ
        }
    });

    ipcMain.handle('settings:update', (event, settings) => {
        try {
            const stmt = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
            const updateMany = db.transaction(() => {
                for (const key in settings) {
                    stmt.run(settings[key], key);
                }
            });
            updateMany();
            return { success: true };
        } catch (error) {
            console.error("Failed to update settings:", error);
            return { success: false, message: error.message };
        }
    });
};