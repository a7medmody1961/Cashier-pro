/*
  File: src/main-process/excel-handler.js
  Version: 1.0 (New File)
  Description: Handles all logic for importing and exporting data using Excel files.
*/
const { dialog } = require('electron');
const xlsx = require('xlsx');
const db = require('../../database');

// Helper functions
const dbAll = (sql, params = []) => new Promise((res, rej) => db.all(sql, params, (err, rows) => (err ? rej(err) : res(rows))));
const dbRun = (sql, params = []) => new Promise((res, rej) => db.run(sql, params, function(err) { if (err) rej(err); else res(this); }));

module.exports = (ipcMain, getMainWindow) => {
    // --- Product Export ---
    ipcMain.handle('products:export-excel', async () => {
        const products = await dbAll("SELECT id, name, barcode, price, cost_price, stock FROM products");
        const worksheet = xlsx.utils.json_to_sheet(products);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Products");

        const { filePath } = await dialog.showSaveDialog(getMainWindow(), {
            title: 'Export Products to Excel',
            defaultPath: 'products.xlsx',
            filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
        });

        if (filePath) {
            xlsx.writeFile(workbook, filePath);
            return { success: true, path: filePath };
        }
        return { success: false };
    });

    // --- Product Import ---
    ipcMain.handle('products:import-excel', async () => {
        const { filePaths } = await dialog.showOpenDialog(getMainWindow(), {
            title: 'Import Products from Excel',
            properties: ['openFile'],
            filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }]
        });

        if (filePaths && filePaths.length > 0) {
            const workbook = xlsx.readFile(filePaths[0]);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = xlsx.utils.sheet_to_json(worksheet);
            
            // Basic validation
            if (!data[0] || !('name' in data[0]) || !('price' in data[0])) {
                throw new Error('Invalid Excel file format. Must contain "name" and "price" columns.');
            }

            await dbRun("BEGIN TRANSACTION");
            try {
                for (const product of data) {
                    const sql = "INSERT OR REPLACE INTO products (barcode, name, price, cost_price, stock) VALUES (?, ?, ?, ?, ?)";
                    await dbRun(sql, [product.barcode, product.name, product.price, product.cost_price, product.stock]);
                }
                await dbRun("COMMIT");
                getMainWindow()?.webContents.send('products-updated');
                return { success: true, count: data.length };
            } catch (error) {
                await dbRun("ROLLBACK");
                throw error;
            }
        }
        return { success: false };
    });

    // --- Customer Export/Import can be implemented similarly ---
};