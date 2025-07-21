// ==================================================================================
// الملف الخامس: src/main-process/report-handlers.js (تم التحديث لإضافة الخصم اليدوي)
// الشرح: تم تعديل الدالة لإظهار إجمالي الخصومات اليدوية في التقارير التحليلية.
// ==================================================================================
const db = require('../../database');

module.exports = (ipcMain) => {
    ipcMain.handle('reports:get-analytics', (event, dateRange) => {
        try {
            const params = [dateRange.start, dateRange.end];
            const sales = db.prepare(`SELECT COUNT(id) as order_count, SUM(total_amount) as total_revenue FROM sales WHERE status = 'completed' AND created_at BETWEEN ? AND ?`).get(params);
            const expenses = db.prepare(`SELECT SUM(amount) as total_expenses FROM expenses WHERE created_at BETWEEN ? AND ?`).get(params);
            const top_products = db.prepare(`SELECT product_name, SUM(quantity) as total_quantity FROM sale_items JOIN sales ON sales.id = sale_items.sale_id WHERE sales.created_at BETWEEN ? AND ? AND sales.status = 'completed' GROUP BY product_name ORDER BY total_quantity DESC LIMIT 5`).all(params);
            const cashier_performance = db.prepare(`SELECT u.username, COUNT(s.id) as invoice_count, SUM(s.total_amount) as total_sales FROM sales s JOIN users u ON s.user_id = u.id WHERE s.created_at BETWEEN ? AND ? AND s.status = 'completed' GROUP BY u.username ORDER BY total_sales DESC`).all(params);
            const peak_hours = db.prepare(`SELECT strftime('%H', created_at) as hour, COUNT(id) as sales_count FROM sales WHERE created_at BETWEEN ? AND ? AND status = 'completed' GROUP BY hour ORDER BY hour ASC`).all(params);

            // إضافة استعلام لجلب إجمالي الخصومات اليدوية
            const manualDiscounts = db.prepare(`SELECT SUM(manual_discount_amount) as total_manual_discount FROM sales WHERE status = 'completed' AND created_at BETWEEN ? AND ?`).get(params);

            const revenue = sales.total_revenue || 0;
            const totalExpenses = expenses.total_expenses || 0;
            const totalManualDiscount = manualDiscounts.total_manual_discount || 0; // القيمة الإجمالية للخصومات اليدوية

            return {
                success: true,
                order_count: sales.order_count || 0,
                total_revenue: revenue,
                totalExpenses: totalExpenses,
                net_profit: revenue - totalExpenses,
                bestSellers: top_products,
                cashierPerformance: cashier_performance,
                peakHours: peak_hours,
                totalManualDiscount: totalManualDiscount // تضمين إجمالي الخصم اليدوي
            };
        } catch (error) {
            console.error("Failed to get analytics:", error);
            return { success: false, error: error.message };
        }
    });
};