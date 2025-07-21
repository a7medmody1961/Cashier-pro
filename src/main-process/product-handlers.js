// ==================================================================================
// الملف الثالث: src/main-process/product-handlers.js (النسخة الكاملة والنهائية)
// ==================================================================================
const { ipcMain, dialog, app } = require('electron');
const db = require('../../database');
const path = require('path');
const fs = require('fs');

const IMAGES_PATH = path.join(app.getPath('userData'), 'product_images');
if (!fs.existsSync(IMAGES_PATH)) fs.mkdirSync(IMAGES_PATH, { recursive: true });

module.exports = (ipcMain, getMainWindow) => {
    ipcMain.handle('products:get', () => {
        try {
            const products = db.prepare(`SELECT * FROM products ORDER BY id DESC`).all();
            return products.map(p => ({ ...p, image_path: p.image_path ? `file://${path.join(IMAGES_PATH, p.image_path)}` : null }));
        } catch (err) { console.error(err); return []; }
    });

    ipcMain.handle('products:add', (event, product) => {
        try {
        const info = db.prepare('INSERT INTO products (name, barcode, price, cost_price, stock, image_path, shortcut_key, icon_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(product.name, product.barcode, product.price, product.cost_price, product.stock, product.image_path, product.shortcut_key, product.icon_name || null);
        getMainWindow()?.webContents.send('products-updated');
        return { success: true, id: info.lastInsertRowid };
        } catch (err) { console.error(err); return { success: false, message: err.message }; }
    });
    ipcMain.handle('products:update', (event, product) => {
        try {
        const info = db.prepare('UPDATE products SET name = ?, barcode = ?, price = ?, cost_price = ?, stock = ?, image_path = ?, shortcut_key = ?, icon_name = ? WHERE id = ?').run(product.name, product.barcode, product.price, product.cost_price, product.stock, product.image_path, product.shortcut_key, product.icon_name || null, product.id);
        getMainWindow()?.webContents.send('products-updated');
        return { success: true, changes: info.changes };
        } catch (err) { console.error(err); return { success: false, message: err.message }; }
    });

    ipcMain.handle('products:delete', (event, id) => {
        try {
            const product = db.prepare('SELECT image_path FROM products WHERE id = ?').get(id);
            if (product && product.image_path) {
                const imageFile = path.join(IMAGES_PATH, product.image_path);
                if (fs.existsSync(imageFile)) fs.unlinkSync(imageFile);
            }
            db.prepare('DELETE FROM products WHERE id = ?').run(id);
            getMainWindow()?.webContents.send('products-updated');
            return { success: true };
        } catch (err) { console.error(err); return { success: false, message: err.message }; }
    });

    ipcMain.handle('products:select-image', async () => {
        const result = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'Images', extensions: ['jpg', 'png'] }] });
        if (result.canceled) return { success: false };
        const filePath = result.filePaths[0];
        const fileName = `${Date.now()}-${path.basename(filePath)}`;
        const newPath = path.join(IMAGES_PATH, fileName);
        fs.copyFileSync(filePath, newPath);
        return { success: true, path: fileName, fullPath: `file://${newPath}` };
    });
};