// ==================================================================================
// الملف الثاني: database.js (تم التعديل لإضافة حقول الخصم اليدوي ونقاط الولاء لجدول المبيعات)
// المسار: /database.js
// الشرح: تم إضافة حقول manual_discount_amount و manual_discount_type و loyalty_points لجدول المبيعات.
// ==================================================================================
const { app } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');
const { machineIdSync } = require('node-machine-id');

const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'cashier_pro_v4.db');

const imagesPath = path.join(userDataPath, 'product_images');
if (!fs.existsSync(imagesPath)) {
    fs.mkdirSync(imagesPath, { recursive: true });
}

// الاتصال بقاعدة البيانات - سيتم إنشاء الملف إذا لم يكن موجوداً
const db = new Database(dbPath, { verbose: console.log });
console.log('Successfully connected to SQLite database using better-sqlite3.');

// تفعيل المفاتيح الخارجية
db.pragma('foreign_keys = ON');

function initializeDatabase() {
    console.log("Initializing database schema...");

    const createTablesStmts = [
        `CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, barcode TEXT UNIQUE, name TEXT NOT NULL, price REAL NOT NULL DEFAULT 0, cost_price REAL DEFAULT 0, stock INTEGER, image_path TEXT, shortcut_key TEXT UNIQUE, icon_name TEXT);`,
        `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('Admin', 'Cashier')), permissions TEXT);`,
        `CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT UNIQUE NOT NULL, order_count INTEGER DEFAULT 0, total_spent REAL DEFAULT 0, loyalty_points INTEGER DEFAULT 0, total_earned_loyalty_points INTEGER DEFAULT 0, total_redeemed_loyalty_points INTEGER DEFAULT 0);`,
        `CREATE TABLE IF NOT EXISTS customer_addresses (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER NOT NULL, address TEXT NOT NULL, is_default BOOLEAN DEFAULT 0, FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE);`,
        // هذا هو السطر الذي يحتاج للتحديث والإضافة
        `CREATE TABLE IF NOT EXISTS sales (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER, user_id INTEGER, shift_id INTEGER, order_type TEXT NOT NULL, total_amount REAL NOT NULL, sub_total REAL, vat_amount REAL, service_amount REAL, delivery_fee_amount REAL, payment_method TEXT, transaction_ref TEXT, status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('completed', 'refunded')), original_sale_id INTEGER, refunded_by_user_id INTEGER, refunded_at DATETIME, delivery_address TEXT, manual_discount_amount REAL DEFAULT 0, manual_discount_type TEXT, loyalty_points INTEGER DEFAULT 0, created_at DATETIME DEFAULT (datetime('now', 'localtime')), FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL, FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL, FOREIGN KEY (shift_id) REFERENCES shifts (id) ON DELETE SET NULL, FOREIGN KEY (original_sale_id) REFERENCES sales (id) ON DELETE SET NULL, FOREIGN KEY (refunded_by_user_id) REFERENCES users (id) ON DELETE SET NULL);`,
        `CREATE TABLE IF NOT EXISTS sale_items (id INTEGER PRIMARY KEY AUTOINCREMENT, sale_id INTEGER NOT NULL, product_id INTEGER, product_name TEXT, quantity INTEGER NOT NULL, price_per_item REAL NOT NULL, FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE, FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL);`,
        `CREATE TABLE IF NOT EXISTS expenses (id INTEGER PRIMARY KEY AUTOINCREMENT, description TEXT NOT NULL, amount REAL NOT NULL, category TEXT, created_at DATETIME DEFAULT (datetime('now', 'localtime')));`,
        `CREATE TABLE IF NOT EXISTS shifts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, start_time DATETIME NOT NULL, end_time DATETIME, starting_cash REAL DEFAULT 0, ending_cash REAL, total_sales REAL, status TEXT NOT NULL CHECK(status IN ('open', 'closed')), FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE);`,
        `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);`
    ];

    // تنفيذ كل أوامر إنشاء الجداول في transaction واحد
    const createAllTables = db.transaction(() => {
        for (const stmt of createTablesStmts) {
            db.exec(stmt);
        }
    });

    createAllTables();
    console.log("...All tables created or already exist.");

    // Seed initial data
    const machineId = machineIdSync({ original: true });
        const settings = [
            { key: 'storeName', value: 'متجر برو' }, { key: 'storePhone', value: '0123456789' },
            { key: 'language', value: 'ar' }, { key: 'currency', value: 'EGP' },
            { key: 'vatValueDineIn', value: '14' }, { key: 'vatTypeDineIn', value: 'percentage' },
            { key: 'serviceValueDineIn', value: '12' }, { key: 'serviceTypeDineIn', value: 'percentage' },
            { key: 'deliveryFee', value: '20' }, { key: 'vatValueDelivery', value: '14' },
            { key: 'vatTypeDelivery', value: 'percentage' }, { key: 'serviceValueDelivery', value: '0' },
            { key: 'serviceTypeDelivery', value: 'percentage' }, { key: 'licenseKey', value: '' },
            { key: 'licenseStatus', value: 'UNLICENSED' }, { key: 'machineId', value: machineId },
            { key: 'pointsEarnRate', value: '10' },
            { key: 'pointsRedeemValue', value: '0.10' }
        ];

    const insertSetting = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
    const insertManySettings = db.transaction(() => {
        for (const setting of settings) {
            insertSetting.run(setting.key, setting.value);
        }
    });
    insertManySettings();

    // Seed default admin user
    const userCount = db.prepare("SELECT COUNT(id) as count FROM users").get().count;
    if (userCount === 0) {
        const defaultPermissions = JSON.stringify({ "pos": true, "manage-products": true, "manage-customers": true, "manage-expenses": true, "reports": true, "manage-users": true, "settings": true });
        db.prepare("INSERT INTO users (username, password, role, permissions) VALUES (?, ?, ?, ?)")
          .run('admin', 'admin', 'Admin', defaultPermissions);
        console.log("Default user 'admin' created with password 'admin'.");
    }

    console.log("...Database initialization checks complete.");
}

// استدعاء الدالة مباشرة
initializeDatabase();

module.exports = db;