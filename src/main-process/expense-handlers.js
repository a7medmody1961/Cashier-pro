// ==================================================================================
// الملف الرابع: src/main-process/expense-handlers.js (النسخة الكاملة والنهائية)
// ==================================================================================
const db = require('../../database');

module.exports = (ipcMain) => {
    ipcMain.handle('expenses:get', (event, dateRange) => {
        try {
            const query = "SELECT * FROM expenses WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC";
            return db.prepare(query).all(dateRange.start, dateRange.end);
        } catch (error) {
            console.error("Failed to get expenses:", error);
            return [];
        }
    });

    ipcMain.handle('expenses:add', (event, expense) => {
        try {
            const query = "INSERT INTO expenses (description, amount, category) VALUES (?, ?, ?)";
            const info = db.prepare(query).run(expense.description, expense.amount, expense.category);
            return { success: true, id: info.lastInsertRowid };
        } catch (error) {
            console.error("Failed to add expense:", error);
            return { success: false, message: error.message };
        }
    });
    
    ipcMain.handle('expenses:delete', (event, id) => {
        try {
            const info = db.prepare("DELETE FROM expenses WHERE id = ?").run(id);
            return { success: true, changes: info.changes };
        } catch (error) {
            console.error("Failed to delete expense:", error);
            return { success: false, message: error.message };
        }
    });
};