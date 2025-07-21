// ==================================================================================
// الملف الرابع: src/main-process/customer-handlers.js (تم التحديث لجلب حقول نقاط الولاء الجديدة)
// الشرح: تم تعديل استعلام 'customers:get' ليشمل حقول النقاط المكتسبة والمستخدمة.
// ==================================================================================
const db = require('../../database');

module.exports = (ipcMain) => {
    // تم تعديل هذا السطر: إضافة total_earned_loyalty_points و total_redeemed_loyalty_points
    ipcMain.handle('customers:get', () => db.prepare("SELECT c.*, ca.address as default_address, c.loyalty_points, c.total_earned_loyalty_points, c.total_redeemed_loyalty_points FROM customers c LEFT JOIN customer_addresses ca ON c.id = ca.customer_id AND ca.is_default = 1 ORDER BY c.id DESC").all());
    ipcMain.handle('customers:search', (e, q) => db.prepare("SELECT id, name, phone, loyalty_points FROM customers WHERE name LIKE ? OR phone LIKE ?").all(`%${q}%`, `%${q}%`));

    ipcMain.handle('customers:add', (e, c) => {
        const addCustomer = db.transaction(() => {
            const info = db.prepare("INSERT INTO customers (name, phone) VALUES (?, ?)").run(c.name, c.phone);
            if (c.address) {
                db.prepare("INSERT INTO customer_addresses (customer_id, address, is_default) VALUES (?, ?, 1)").run(info.lastInsertRowid, c.address);
            }
            return info;
        });
        const result = addCustomer();
        return { success: true, id: result.lastInsertRowid };
    });

    ipcMain.handle('customers:update', (e, c) => db.prepare("UPDATE customers SET name = ?, phone = ? WHERE id = ?").run(c.name, c.phone, c.id));
    ipcMain.handle('customers:delete', (e, id) => db.prepare("DELETE FROM customers WHERE id = ?").run(id));
    ipcMain.handle('customers:get-addresses', (e, id) => db.prepare("SELECT * FROM customer_addresses WHERE customer_id = ?").all(id));
    ipcMain.handle('customers:add-address', (e, d) => db.prepare("INSERT INTO customer_addresses (customer_id, address) VALUES (?, ?)").run(d.customerId, d.address));
    ipcMain.handle('customers:update-address', (e, d) => db.prepare("UPDATE customer_addresses SET address = ? WHERE id = ?").run(d.address, d.id));
    ipcMain.handle('customers:delete-address', (e, id) => db.prepare("DELETE FROM customer_addresses WHERE id = ?").run(id));
};