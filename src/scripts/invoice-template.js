// ==================================================================================
// الملف: invoice-template.js (تم التعديل لإضافة الخصم اليدوي للفاتورة)
// المسار: src/scripts/invoice-template.js
// الشرح: تم تعديل الدالة لتعرض الخصم اليدوي في قالب الفاتورة.
// ==================================================================================

export function generateInvoiceHTML(saleDetails, saleItems, appSettings, loyaltyDiscountAmount = 0, manualDiscountAmount = 0) {
    const storeName = appSettings.storeName || 'اسم المتجر';
    const storePhone = appSettings.storePhone || 'رقم الهاتف';
    const currency = appSettings.currency || 'EGP';

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: currency }).format(amount || 0);
    };

    const vatSection = saleDetails.vat_amount > 0 ? `
        <div class="summary-item">
            <span>الضريبة:</span>
            <span>${formatCurrency(saleDetails.vat_amount)}</span>
        </div>
    ` : '';

    const serviceSection = saleDetails.service_amount > 0 ? `
        <div class="summary-item">
            <span>رسوم الخدمة:</span>
            <span>${formatCurrency(saleDetails.service_amount)}</span>
        </div>
    ` : '';

    const deliverySection = saleDetails.delivery_fee_amount > 0 ? `
        <div class="summary-item">
            <span>رسوم التوصيل:</span>
            <span>${formatCurrency(saleDetails.delivery_fee_amount)}</span>
        </div>
    ` : '';

    const loyaltyDiscountSection = loyaltyDiscountAmount > 0 ? `
        <div class="summary-item discount-item">
            <span>خصم نقاط الولاء:</span>
            <span>- ${formatCurrency(loyaltyDiscountAmount)}</span>
        </div>
    ` : '';

    // قسم الخصم اليدوي الجديد
    const manualDiscountSection = manualDiscountAmount > 0 ? `
        <div class="summary-item discount-item">
            <span>الخصم اليدوي:</span>
            <span>- ${formatCurrency(manualDiscountAmount)}</span>
        </div>
    ` : '';

    return `
        <div class="receipt-box" dir="rtl">
            <div class="receipt-header">
                <h2>${storeName}</h2>
                <p>رقم الفاتورة: #${saleDetails.id}</p>
                <p>التاريخ: ${new Date(saleDetails.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</p>
                <p>الكاشير: ${saleDetails.username || 'غير معروف'}</p>
                ${saleDetails.customer_name ? `<p>العميل: ${saleDetails.customer_name}</p>` : ''}
                ${saleDetails.customer_phone ? `<p>الهاتف: ${saleDetails.customer_phone}</p>` : ''}
                ${saleDetails.delivery_address ? `<p>العنوان: ${saleDetails.delivery_address}</p>` : ''}
                <hr>
            </div>
            <div class="receipt-body">
                <table>
                    <thead>
                        <tr>
                            <th>الصنف</th>
                            <th>الكمية</th>
                            <th>السعر</th>
                            <th>الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${saleItems.map(item => `
                            <tr>
                                <td>${item.product_name}</td>
                                <td>${item.quantity}</td>
                                <td>${formatCurrency(item.price_per_item)}</td>
                                <td>${formatCurrency(item.quantity * item.price_per_item)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <hr>
                <div class="summary-details">
                    <div class="summary-item">
                        <span>المجموع الفرعي:</span>
                        <span>${formatCurrency(saleDetails.sub_total)}</span>
                    </div>
                    ${vatSection}
                    ${serviceSection}
                    ${deliverySection}
                    ${loyaltyDiscountSection}
                    ${manualDiscountSection} <div class="summary-item total">
                        <span>الإجمالي الكلي:</span>
                        <span>${formatCurrency(saleDetails.total_amount)}</span>
                    </div>
                    <div class="summary-item">
                        <span>طريقة الدفع:</span>
                        <span>${saleDetails.payment_method === 'Cash' ? 'نقدي' : 'بطاقة'}</span>
                    </div>
                </div>
            </div>
            <div class="receipt-footer">
                <hr>
                <p>شكرا لزيارتكم!</p>
                <p>للتواصل: ${storePhone}</p>
            </div>
        </div>
    `;
}