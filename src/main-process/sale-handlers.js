// ==================================================================================
// الملف الخامس: src/main-process/sale-handlers.js (تم التحديث ليتضمن الخصم اليدوي)
// الشرح: تم تعديل منطق حفظ المبيعات لتضمين تفاصيل الخصم اليدوي.
// ==================================================================================
const db = require('../../database');

module.exports = (ipcMain, getMainWindow) => {
        ipcMain.handle('sales:finalize', (event, saleData) => {
            // إضافة manualDiscountAmount و manualDiscountType إلى البيانات المستلمة
            const { type, items, amounts, paymentMethod, userId, shiftId, customer, transactionRef, pointsUsed } = saleData; 
            const { manualDiscountAmount, manualDiscountType } = amounts; // استخراج الخصم اليدوي من amounts
            
            try {
                const finalizeTransaction = db.transaction(() => {
                    let customerId = null; // Initialize customerId to null
                    let existingCustomer = null; // Declare existingCustomer here

                    // منطق التعامل مع العميل ورقم الهاتف (للتوصيل والصالة)
                    if (customer && customer.phone) {
                        // تحديث استعلام جلب العميل لجلب حقول نقاط الولاء الجديدة
                        existingCustomer = db.prepare("SELECT id, name, loyalty_points, total_earned_loyalty_points, total_redeemed_loyalty_points FROM customers WHERE phone = ?").get(customer.phone);
                        if (existingCustomer) {
                            customerId = existingCustomer.id;
                            // Update customer name if provided and changed
                            if (customer.name && existingCustomer.name !== customer.name) {
                                db.prepare("UPDATE customers SET name = ? WHERE id = ?").run(customer.name, customerId);
                            }
                            // Handle delivery address for existing customer
                            if (type === 'delivery' && customer.address) {
                                const existingAddress = db.prepare("SELECT id FROM customer_addresses WHERE customer_id = ? AND address = ?").get(customerId, customer.address);
                                if (!existingAddress) {
                                    db.prepare("INSERT INTO customer_addresses (customer_id, address) VALUES (?, ?)").run(customerId, customer.address);
                                }
                            }
                        } else {
                            // Create new customer if not found by phone
                            const result = db.prepare("INSERT INTO customers (name, phone) VALUES (?, ?)").run(customer.name || null, customer.phone);
                            customerId = result.lastInsertRowid;
                            // Handle delivery address for new customer
                            if (type === 'delivery' && customer.address) {
                                db.prepare("INSERT INTO customer_addresses (customer_id, address, is_default) VALUES (?, ?, 1)").run(customerId, customer.address);
                            }
                        }
                    } else { // No phone provided, or customer object is null
                        // For dine-in with only a name, we just use the name for display, no customer_id association
                        // customerId remains null in this case.
                    }

                    const deliveryAddress = (type === 'delivery' && customer) ? customer.address : null;
                    // تحديث saleSql لتضمين حقول الخصم اليدوي
                    const saleSql = `INSERT INTO sales (user_id, shift_id, customer_id, order_type, total_amount, sub_total, vat_amount, service_amount, delivery_fee_amount, payment_method, transaction_ref, delivery_address, manual_discount_amount, manual_discount_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                    // تحديث saleParams لتضمين قيم الخصم اليدوي
                    const saleParams = [userId, shiftId, customerId, type, amounts.total, amounts.subTotal, amounts.vat, amounts.service, amounts.delivery, paymentMethod, transactionRef, deliveryAddress, manualDiscountAmount, manualDiscountType];
                    
                    const saleResult = db.prepare(saleSql).run(saleParams);
                    const saleId = saleResult.lastInsertRowid;

                    const itemStmt = db.prepare("INSERT INTO sale_items (sale_id, product_id, product_name, quantity, price_per_item) VALUES (?, ?, ?, ?, ?)");
                    const stockStmt = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND stock IS NOT NULL");
                    for (let item of items) {
                        itemStmt.run(saleId, item.id, item.name, item.quantity, item.price);
                        stockStmt.run(item.quantity, item.id);
                    }

                    if (customerId) {
                        // Update order count and total spent for associated customer
                        db.prepare("UPDATE customers SET order_count = order_count + 1, total_spent = total_spent + ? WHERE id = ?").run(amounts.total, customerId);

                        // Calculate and update loyalty points
                        const settings = db.prepare("SELECT key, value FROM settings WHERE key IN ('pointsEarnRate', 'pointsRedeemValue')").all();
                        const pointsEarnRate = parseFloat(settings.find(s => s.key === 'pointsEarnRate')?.value) || 0;
                        const pointsRedeemValue = parseFloat(settings.find(s => s.key === 'pointsRedeemValue')?.value) || 0;

                        let currentLoyaltyPoints = existingCustomer ? existingCustomer.loyalty_points : 0;
                        let currentTotalEarnedLoyaltyPoints = existingCustomer ? existingCustomer.total_earned_loyalty_points : 0;
                        let currentTotalRedeemedLoyaltyPoints = existingCustomer ? existingCustomer.total_redeemed_loyalty_points : 0;


                        let newLoyaltyPoints = currentLoyaltyPoints;
                        let pointsEarnedThisSale = 0;
                        let pointsRedeemedThisSale = 0;


                        if (pointsUsed && pointsUsed > 0) {
                            pointsRedeemedThisSale = pointsUsed;
                            newLoyaltyPoints = Math.max(0, newLoyaltyPoints - pointsRedeemedThisSale);
                        }
                        if (pointsEarnRate > 0) {
                            pointsEarnedThisSale = Math.floor(amounts.total / pointsEarnRate);
                            newLoyaltyPoints += pointsEarnedThisSale;
                        }
                        
                        // تحديث الحقول الجديدة (النقاط المكتسبة والمسددة بشكل تراكمي)
                        currentTotalEarnedLoyaltyPoints += pointsEarnedThisSale;
                        currentTotalRedeemedLoyaltyPoints += pointsRedeemedThisSale;

                        db.prepare("UPDATE customers SET loyalty_points = ?, total_earned_loyalty_points = ?, total_redeemed_loyalty_points = ? WHERE id = ?")
                          .run(newLoyaltyPoints, currentTotalEarnedLoyaltyPoints, currentTotalRedeemedLoyaltyPoints, customerId);
                    }
                    
                    getMainWindow()?.webContents.send('products-updated');
                    
                    // بناء saleDetails للفاتورة:
                    // نستخدم البيانات من saleData.customer مباشرة لضمان ظهور الاسم والهاتف والعنوان
                    // حتى لو لم يتم ربط العميل بـ customer_id (مثل عميل الصالة بدون رقم هاتف)
                    const baseSaleDetails = db.prepare(`
                        SELECT s.*, u.username, ru.username as refunded_by_username
                        FROM sales s 
                        LEFT JOIN users u ON s.user_id = u.id 
                        LEFT JOIN users ru ON s.refunded_by_user_id = ru.id
                        WHERE s.id = ?
                    `).get(saleId);

                    const saleItems = db.prepare("SELECT * FROM sale_items WHERE sale_id = ?").all(saleId);

                    // إضافة بيانات العميل من saleData إلى saleDetails إذا كانت موجودة
                    // وإضافة بيانات الخصم اليدوي من amounts
                    const saleDetails = {
                        ...baseSaleDetails,
                        customer_name: customer ? customer.name : null, // استخدم الاسم من saleData مباشرة
                        customer_phone: customer ? customer.phone : null, // استخدم الهاتف من saleData مباشرة
                        delivery_address: deliveryAddress, // العنوان يتم تحديده بالفعل في deliveryAddress
                        // إضافة بيانات الخصم اليدوي إلى saleDetails
                        manual_discount_amount: manualDiscountAmount,
                        manual_discount_type: manualDiscountType
                    };
                    

                    return { success: true, saleId, saleDetails, saleItems };
                });

                return finalizeTransaction();

            } catch (err) {
                console.error("Error finalizing sale:", err);
                throw err;
            }
    });
    
    ipcMain.handle('sales:get', (event, dateRange) => db.prepare(
        `SELECT s.*, u.username, c.name as customer_name
         FROM sales s 
         LEFT JOIN users u ON s.user_id = u.id
         LEFT JOIN customers c ON s.customer_id = c.id
         WHERE s.created_at BETWEEN ? AND ?
         ORDER BY s.created_at DESC`
    ).all(dateRange.start, dateRange.end));

    ipcMain.handle('sales:process-refund', (event, { saleId, userId }) => {
        try {
            const refundTransaction = db.transaction(() => {
                const originalSale = db.prepare("SELECT * FROM sales WHERE id = ?").get(saleId);
                if (!originalSale || originalSale.status !== 'completed') {
                    throw new Error("هذه الفاتورة غير صالحة للإرجاع.");
                }

                const originalItems = db.prepare("SELECT * FROM sale_items WHERE sale_id = ?").all(saleId);
                
                const refundSaleSql = `INSERT INTO sales (user_id, shift_id, customer_id, order_type, total_amount, sub_total, vat_amount, service_amount, delivery_fee_amount, payment_method, status, original_sale_id, refunded_by_user_id, refunded_at, manual_discount_amount, manual_discount_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'refunded', ?, ?, datetime('now', 'localtime'), ?, ?)`;
                // Ensure to pass original manual discount values to refund sale as well
                const refundResult = db.prepare(refundSaleSql).run(originalSale.user_id, originalSale.shift_id, originalSale.customer_id, originalSale.order_type, -originalSale.total_amount, -originalSale.sub_total, -originalSale.vat_amount, -originalSale.service_amount, -originalSale.delivery_fee_amount, originalSale.payment_method, saleId, userId, originalSale.manual_discount_amount, originalSale.manual_discount_type);
                const refundSaleId = refundResult.lastInsertRowid;

                const itemStmt = db.prepare("INSERT INTO sale_items (sale_id, product_id, product_name, quantity, price_per_item) VALUES (?, ?, ?, ?, ?)");
                const stockStmt = db.prepare("UPDATE products SET stock = stock + ? WHERE id = ? AND stock IS NOT NULL");
                for (const item of originalItems) {
                    itemStmt.run(refundSaleId, item.product_id, item.product_name, -item.quantity, item.price_per_item);
                    stockStmt.run(item.quantity, item.product_id);
                }
                
                db.prepare("UPDATE sales SET status = 'refunded' WHERE id = ?").run(saleId);
                
                if (originalSale.customer_id) {
                    // تحديث total_spent عند الإرجاع
                    db.prepare("UPDATE customers SET total_spent = total_spent - ? WHERE id = ?").run(originalSale.total_amount, originalSale.customer_id);

                    // تحديث نقاط الولاء عند الإرجاع (عكس عملية الكسب)
                    const settings = db.prepare("SELECT key, value FROM settings WHERE key IN ('pointsEarnRate', 'pointsRedeemValue')").all();
                    const pointsEarnRate = parseFloat(settings.find(s => s.key === 'pointsEarnRate')?.value) || 0;
                    
                    if (pointsEarnRate > 0) {
                        const pointsLost = Math.floor(originalSale.total_amount / pointsEarnRate);
                        db.prepare("UPDATE customers SET loyalty_points = loyalty_points - ?, total_earned_loyalty_points = total_earned_loyalty_points - ? WHERE id = ?").run(pointsLost, pointsLost, originalSale.customer_id);
                    }
                }

                getMainWindow()?.webContents.send('products-updated');
                return { success: true };
            });

            return refundTransaction();
        } catch (err) {
            console.error("Error processing refund:", err);
            throw err;
        }
    });

    ipcMain.handle('sales:get-details', (event, saleId) => {
        try {
            // تحديث استعلام جلب تفاصيل البيع لجلب حقول الخصم اليدوي
            const saleDetails = db.prepare(`
                SELECT s.*, u.username, c.name as customer_name, c.phone as customer_phone, ru.username as refunded_by_username
                FROM sales s 
                LEFT JOIN users u ON s.user_id = u.id 
                LEFT JOIN customers c ON s.customer_id = c.id
                LEFT JOIN users ru ON s.refunded_by_user_id = ru.id
                WHERE s.id = ?`).get(saleId);

            const saleItems = db.prepare("SELECT * FROM sale_items WHERE sale_id = ?").all(saleId);
            
            if (!saleDetails) {
                throw new Error("لم يتم العثور على الفاتورة.");
            }

            return { success: true, saleDetails, saleItems };
        } catch (error) {
            console.error(`Error getting details for sale ${saleId}:`, error);
            throw error;
        }
    });
};