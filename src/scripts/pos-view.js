// ==================================================================================
// الملف الثالث: pos-view.js (تم الإصلاح)
// المسار: src/scripts/pos-view.js
// الشرح: تم إضافة طبقة حماية للتأكد من أن المنتجات دائماً مصفوفة قبل عرضها.
// ==================================================================================

import { generateInvoiceHTML } from './invoice-template.js';

let allProducts = [], invoiceItems = [], currentOrderType = 'dine-in', currentCustomerData = {}, appSettings = {};
let productGrid, searchBar, invoiceItemsDiv, subTotalSpan, vatTotalSpan, serviceTotalSpan, deliveryRow, deliveryTotalSpan, grandTotalSpan, finalizeButton, cancelOrderBtn, orderTypeSelector, dineInCustomerForm, deliveryCustomerForm, dineInCustomerNameInput, dineInCustomerPhoneInput, customerPhoneInput, customerNameInput, customerSearchResultsDiv, addressSelectionContainer;
// عناصر نقاط الولاء الجديدة
let loyaltyPointsSection, customerLoyaltyPointsSpan, applyLoyaltyDiscountCheckbox, loyaltyDiscountDisplay, loyaltyDiscountValueSpan;
let loyaltyDiscountApplied = false; // حالة لتتبع ما إذا تم تطبيق خصم الولاء

export function init(settings) {
    appSettings = settings;
    getDomElements();
    setupEventListeners();
    loadProducts();
    setOrderType('dine-in');
    window.api.onProductsUpdate(loadProducts);
}

function getDomElements() {
    productGrid = document.getElementById('product-grid');
    searchBar = document.getElementById('search-bar');
    invoiceItemsDiv = document.getElementById('invoice-items');
    subTotalSpan = document.getElementById('sub-total');
    vatTotalSpan = document.getElementById('vat-total');
    serviceTotalSpan = document.getElementById('service-total');
    deliveryRow = document.getElementById('delivery-label').parentElement;
    deliveryTotalSpan = document.getElementById('delivery-total');
    grandTotalSpan = document.getElementById('grand-total');
    finalizeButton = document.getElementById('finalize-button');
    cancelOrderBtn = document.getElementById('cancel-order-btn');
    orderTypeSelector = document.getElementById('order-type-selector');
    dineInCustomerForm = document.getElementById('dine-in-customer-form');
    deliveryCustomerForm = document.getElementById('delivery-customer-form');
    dineInCustomerNameInput = document.getElementById('dine-in-customer-name');
    dineInCustomerPhoneInput = document.getElementById('dine-in-customer-phone');
    customerPhoneInput = document.getElementById('customer-phone');
    customerNameInput = document.getElementById('customer-name');
    customerSearchResultsDiv = document.getElementById('customer-search-results');
    addressSelectionContainer = document.getElementById('address-selection-container');
    
    // جلب عناصر نقاط الولاء
    loyaltyPointsSection = document.getElementById('loyalty-points-section');
    customerLoyaltyPointsSpan = document.getElementById('customer-loyalty-points');
    applyLoyaltyDiscountCheckbox = document.getElementById('apply-loyalty-discount');
    loyaltyDiscountDisplay = document.getElementById('loyalty-discount-display');
    loyaltyDiscountValueSpan = document.getElementById('loyalty-discount-value');
}

async function loadProducts() {
    try {
        const productsResult = await window.api.getProducts();
        allProducts = Array.isArray(productsResult) ? productsResult : [];
        renderProducts(allProducts);
    } catch (error) {
        console.error("Failed to load products:", error);
        Swal.fire('خطأ', 'فشل تحميل قائمة المنتجات.', 'error');
    }
}

function renderProducts(productsToRender) {
    if (!productGrid) {
        console.error("Product grid element not found.");
        return;
    }
    productGrid.innerHTML = '';
    if (!Array.isArray(productsToRender)) {
        console.error("renderProducts received non-array:", productsToRender);
        return;
    }
    productsToRender.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.productId = p.id;

        let displayContent = '';
        if (p.icon_name) {
            displayContent = `<div class="product-icon-large"><i class="fa-solid ${p.icon_name}"></i></div>`;
        } else if (p.image_path) {
            displayContent = `<img src="${p.image_path}" alt="${p.name}" onerror="this.onerror=null;this.src='https://placehold.co/100x80/f0f4f8/1e293b?text=?';">`;
        } else {
            displayContent = `<img src="https://placehold.co/100x80/f0f4f8/1e293b?text=${p.name.charAt(0)}" alt="${p.name}" onerror="this.onerror=null;this.src='https://placehold.co/100x80/f0f4f8/1e293b?text=?';">`;
        }

        card.innerHTML = `
            ${displayContent}
            <div class="product-name">${p.name}</div>
            <div class="product-price">${formatCurrency(p.price)}</div>
        `;
        card.addEventListener('click', () => addProductToInvoice(p.id));
        productGrid.appendChild(card);
    });
}

function addProductToInvoice(productId) {
    const activeShift = window.AppState.getActiveShift();
    if (!activeShift) {
        Swal.fire({ title: 'لا توجد وردية مفتوحة!', text: 'يجب عليك بدء وردية جديدة قبل إضافة أي منتجات إلى الفاتورة.', icon: 'warning', confirmButtonText: 'حسنًا' });
        return;
    }
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const quantityToAdd = 1;

    window.api.playSound('add-to-cart');
    const existingItem = invoiceItems.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += quantityToAdd;
    } else {
        invoiceItems.push({ ...product, quantity: quantityToAdd });
    }
    updateInvoice();
}

function updateInvoice() {
    if (invoiceItems.length === 0) {
        invoiceItemsDiv.innerHTML = `<p class="empty-invoice">الفاتورة فارغة</p>`;
    } else {
        invoiceItemsDiv.innerHTML = invoiceItems.map(item => `
            <div class="invoice-item" data-product-id="${item.id}">
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">${formatCurrency(item.price)}</div>
                </div>
                <div class="item-quantity">
                    <button class="quantity-btn" data-id="${item.id}" data-action="decrease">-</button>
                    <input type="number" class="item-quantity-input" data-id="${item.id}" value="${item.quantity}" min="1">
                    <button class="quantity-btn" data-id="${item.id}" data-action="increase">+</button>
                </div>
                <div class="item-total">${formatCurrency(item.quantity * item.price)}</div>
            </div>`).join('');
    }
    const amounts = calculateTotals();
    subTotalSpan.textContent = formatCurrency(amounts.subTotal);
    vatTotalSpan.textContent = formatCurrency(amounts.vat);
    serviceTotalSpan.textContent = formatCurrency(amounts.service);
    deliveryTotalSpan.textContent = formatCurrency(amounts.delivery);
    
    // تحديث وعرض خصم نقاط الولاء
    const loyaltyDiscount = calculateLoyaltyDiscount(amounts.total);
    if (loyaltyDiscountApplied && loyaltyDiscount > 0) {
        loyaltyDiscountDisplay.style.display = 'block';
        loyaltyDiscountValueSpan.textContent = formatCurrency(loyaltyDiscount);
        grandTotalSpan.textContent = formatCurrency(amounts.total - loyaltyDiscount);
    } else {
        loyaltyDiscountDisplay.style.display = 'none';
        grandTotalSpan.textContent = formatCurrency(amounts.total);
    }
    
    deliveryRow.style.display = currentOrderType === 'delivery' ? 'contents' : 'none';
    finalizeButton.disabled = invoiceItems.length === 0;
}

function calculateTotals() {
    const subTotal = invoiceItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let vat = 0, service = 0, delivery = 0;
    const settingsSuffix = currentOrderType === 'delivery' ? 'Delivery' : 'DineIn';
    if (appSettings[`vatType${settingsSuffix}`] === 'percentage') { vat = subTotal * (parseFloat(appSettings[`vatValue${settingsSuffix}`]) / 100); } else { vat = parseFloat(appSettings[`vatValue${settingsSuffix}`]) || 0; }
    if (appSettings[`serviceType${settingsSuffix}`] === 'percentage') { service = subTotal * (parseFloat(appSettings[`serviceValue${settingsSuffix}`]) / 100); } else { service = parseFloat(appSettings[`serviceValue${settingsSuffix}`]) || 0; }
    if (currentOrderType === 'delivery') { delivery = parseFloat(appSettings.deliveryFee) || 0; }
    const total = subTotal + vat + service + delivery;
    return { subTotal, vat, service, delivery, total };
}

function calculateLoyaltyDiscount(currentTotal) {
    const pointsEarnRate = parseFloat(appSettings.pointsEarnRate) || 0;
    const pointsRedeemValue = parseFloat(appSettings.pointsRedeemValue) || 0;

    if (pointsEarnRate <= 0 || pointsRedeemValue <= 0 || !currentCustomerData.loyalty_points || currentCustomerData.loyalty_points <= 0) {
        applyLoyaltyDiscountCheckbox.checked = false;
        applyLoyaltyDiscountCheckbox.disabled = true;
        loyaltyDiscountApplied = false;
        return 0;
    }

    applyLoyaltyDiscountCheckbox.disabled = false;
    
    // حساب أقصى خصم ممكن بناءً على النقاط المتاحة
    const maxDiscountFromPoints = currentCustomerData.loyalty_points * pointsRedeemValue;
    
    // الخصم لا يجب أن يتجاوز قيمة الفاتورة
    return Math.min(maxDiscountFromPoints, currentTotal);
}

async function finalizeSale() {
    const activeShift = window.AppState.getActiveShift();
    const currentUser = window.AppState.getCurrentUser();
    if (!activeShift || !currentUser) { Swal.fire('خطأ', 'لا توجد وردية مفتوحة أو أن بيانات المستخدم غير متاحة.', 'error'); return; }

    const { value: paymentMethod } = await Swal.fire({ title: 'اختر طريقة الدفع', input: 'radio', inputOptions: { 'Cash': 'نقدي', 'Card': 'بطاقة' }, inputValidator: (value) => !value && 'يجب اختيار طريقة الدفع!', confirmButtonText: 'متابعة', cancelButtonText: 'إلغاء', showCancelButton: true });
    if (!paymentMethod) return;

    // تحديد بيانات العميل بناءً على نوع الطلب
    let customerDataForSale = { id: null, name: null, phone: null, address: null };

    if (currentOrderType === 'delivery') {
        const customerName = customerNameInput.value.trim();
        const customerPhone = customerPhoneInput.value.trim();
        const customerAddress = document.getElementById('customer-address')?.value.trim();
        if (!customerName || !customerPhone || !customerAddress) {
            Swal.fire('بيانات ناقصة', 'لطلبات التوصيل، يجب إدخال اسم ورقم هاتف وعنوان العميل أولاً.', 'error');
            return;
        }
        customerDataForSale = {
            id: currentCustomerData.id || null,
            name: customerName,
            phone: customerPhone,
            address: customerAddress
        };
    } else { // dine-in
        const dineInName = dineInCustomerNameInput.value.trim();
        const dineInPhone = dineInCustomerPhoneInput.value.trim();
        if (dineInName || dineInPhone) {
            customerDataForSale = {
                id: currentCustomerData.id || null,
                name: dineInName,
                phone: dineInPhone
            };
        }
    }

    const amounts = calculateTotals(); // إعادة حساب الإجماليات قبل إتمام البيع
    let totalAmountAfterDiscount = amounts.total;
    let pointsUsed = 0;
    let loyaltyDiscountAmount = 0;

    if (loyaltyDiscountApplied) {
        loyaltyDiscountAmount = calculateLoyaltyDiscount(amounts.total);
        totalAmountAfterDiscount = amounts.total - loyaltyDiscountAmount;
        
        // حساب عدد النقاط التي تم استخدامها بناءً على الخصم
        const pointsRedeemValue = parseFloat(appSettings.pointsRedeemValue) || 0;
        if (pointsRedeemValue > 0) {
            pointsUsed = Math.round(loyaltyDiscountAmount / pointsRedeemValue);
        }
    }

    const saleData = {
        type: currentOrderType,
        items: invoiceItems,
        amounts: { ...amounts, total: totalAmountAfterDiscount, loyaltyDiscount: loyaltyDiscountAmount }, // إرسال الإجمالي بعد الخصم وقيمة الخصم
        paymentMethod,
        userId: currentUser.id,
        shiftId: activeShift.id,
        customer: customerDataForSale,
        transactionRef: null,
        pointsUsed: pointsUsed // إرسال عدد النقاط المستخدمة
    };
    
    try {
        const result = await window.api.finalizeSale(saleData);
        if (result.success) {
            window.api.playSound('sale-complete');
            Swal.fire('تم!', 'اكتملت عملية البيع بنجاح.', 'success');
            // تمرير loyaltyDiscountAmount إلى generateInvoiceHTML
            const invoiceHtml = generateInvoiceHTML(result.saleDetails, result.saleItems, appSettings, loyaltyDiscountAmount);
            showPreviewModal(`فاتورة رقم ${result.saleId}`, invoiceHtml);
            clearInvoice();
        } else {
             Swal.fire('خطأ', `فشلت عملية البيع: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error("Sale finalization failed:", error);
        Swal.fire('خطأ فادح', 'فشلت عملية البيع.', 'error');
    }
}

function clearInvoice() {
    invoiceItems = [];
    currentCustomerData = {};
    dineInCustomerNameInput.value = '';
    dineInCustomerPhoneInput.value = '';
    customerPhoneInput.value = '';
    customerNameInput.value = '';
    customerSearchResultsDiv.innerHTML = '';
    customerSearchResultsDiv.style.display = 'none';
    addressSelectionContainer.innerHTML = '<label for="customer-address">العنوان</label><input type="text" id="customer-address" required>';
    
    // إعادة تعيين حالة نقاط الولاء
    loyaltyPointsSection.style.display = 'none';
    customerLoyaltyPointsSpan.textContent = '0 نقطة';
    applyLoyaltyDiscountCheckbox.checked = false;
    applyLoyaltyDiscountCheckbox.disabled = true;
    loyaltyDiscountApplied = false;
    loyaltyDiscountDisplay.style.display = 'none';

    updateInvoice();
}

function setOrderType(type) {
    currentOrderType = type;
    document.querySelectorAll('#order-type-selector .btn').forEach(btn => btn.classList.toggle('active', btn.dataset.type === type));
    dineInCustomerForm.style.display = type === 'dine-in' ? 'block' : 'none';
    deliveryCustomerForm.style.display = type === 'delivery' ? 'block' : 'none';
    clearInvoice();
}

// دالة مساعدة لتحديث الكمية من مربع الإدخال
function updateItemQuantityFromInput(inputElement) {
    const productId = parseInt(inputElement.dataset.id);
    const item = invoiceItems.find(i => i.id === productId);
    if (item) {
        let newQuantity = parseInt(inputElement.value);
        if (isNaN(newQuantity) || newQuantity <= 0) {
            newQuantity = 1;
            inputElement.value = 1;
        }
        item.quantity = newQuantity;
        updateInvoice();
    }
}

function setupEventListeners() {
    searchBar.addEventListener('input', () => {
        const searchTerm = searchBar.value.toLowerCase();
        const filtered = allProducts.filter(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            p.barcode?.toLowerCase().includes(searchTerm) ||
            p.shortcut_key?.toLowerCase().includes(searchTerm) ||
            (p.icon_name && p.icon_name.toLowerCase().includes(searchTerm))
        );
        renderProducts(filtered);
    });

    document.body.addEventListener('click', (e) => {
        const target = e.target;
        
        if (target.classList.contains('quantity-btn')) {
            e.stopPropagation();
            const id = parseInt(target.dataset.id);
            const action = target.dataset.action;
            const item = invoiceItems.find(i => i.id === id);
            if (item) {
                if (action === 'increase') item.quantity++;
                if (action === 'decrease') item.quantity--;
                if (item.quantity <= 0) invoiceItems = invoiceItems.filter(i => i.id !== id);
                updateInvoice();
            }
            return;
        }

        const button = target.closest('button');
        if (button) {
            if (button.id === 'cancel-order-btn') clearInvoice();
            if (button.id === 'finalize-button') finalizeSale();
            if (button.closest('#order-type-selector')) setOrderType(button.dataset.type);
        }
        
        const searchResultItem = target.closest('.customer-search-result');
        if (searchResultItem) {
            const selectedCustomer = JSON.parse(searchResultItem.dataset.customer);
            selectCustomer(selectedCustomer);
        }
    });

    document.body.addEventListener('change', (e) => {
        const target = e.target;
        if (target.classList.contains('item-quantity-input')) {
            updateItemQuantityFromInput(target);
        }
    });

    document.body.addEventListener('keydown', (e) => {
        const target = e.target;
        if (target.classList.contains('item-quantity-input') && e.key === 'Enter') {
            updateItemQuantityFromInput(target);
            target.blur();
        }
    });

    // مستمع حدث لتغيير رقم هاتف العميل (للتوصيل والصالة)
    customerPhoneInput.addEventListener('input', handleCustomerPhoneInput);
    dineInCustomerPhoneInput.addEventListener('input', handleCustomerPhoneInput);

    // مستمع حدث لمربع اختيار خصم نقاط الولاء
    applyLoyaltyDiscountCheckbox.addEventListener('change', () => {
        loyaltyDiscountApplied = applyLoyaltyDiscountCheckbox.checked;
        updateInvoice(); // إعادة حساب الإجمالي لتطبيق/إزالة الخصم
    });
}

// دالة موحدة للتعامل مع إدخال رقم هاتف العميل
async function handleCustomerPhoneInput(e) {
    const phoneInput = e.target; // العنصر الذي قام بتشغيل الحدث (dineInCustomerPhoneInput أو customerPhoneInput)
    const phoneQuery = phoneInput.value.trim();

    // عند مسح حقل الهاتف أو إذا كان أقل من 3 أحرف
    if (phoneQuery.length < 3) {
        customerSearchResultsDiv.style.display = 'none';
        // مسح بيانات العميل الحالية ونقاط الولاء
        currentCustomerData = {};
        // مسح حقول الاسم والهاتف الأخرى فقط
        if (phoneInput.id === 'customer-phone') { // إذا كان حقل هاتف التوصيل
            customerNameInput.value = '';
        } else { // إذا كان حقل هاتف الصالة
            dineInCustomerNameInput.value = '';
        }
        // مسح حقول الهاتف الأخرى
        if (phoneInput.id === 'customer-phone') {
            dineInCustomerPhoneInput.value = '';
        } else {
            customerPhoneInput.value = '';
        }

        loyaltyPointsSection.style.display = 'none';
        applyLoyaltyDiscountCheckbox.checked = false;
        applyLoyaltyDiscountCheckbox.disabled = true;
        loyaltyDiscountApplied = false;
        updateInvoice();
        return;
    }

    try {
        const results = await window.api.searchCustomers(phoneQuery);
        if (results.length > 0) {
            renderCustomerSearchResults(results);
            // لا يتم هنا selectCustomer تلقائياً، بل تظهر النتائج للمستخدم للاختيار
        } else {
            customerSearchResultsDiv.style.display = 'none';
            // إذا لم يتم العثور على عميل، قم بمسح بيانات العميل ونقاط الولاء
            currentCustomerData = {};
            // مسح حقول الاسم والهاتف الأخرى
            if (phoneInput.id === 'customer-phone') {
                customerNameInput.value = '';
            } else {
                dineInCustomerNameInput.value = '';
            }
            if (phoneInput.id === 'customer-phone') {
                dineInCustomerPhoneInput.value = '';
            } else {
                customerPhoneInput.value = '';
            }

            loyaltyPointsSection.style.display = 'none';
            applyLoyaltyDiscountCheckbox.checked = false;
            applyLoyaltyDiscountCheckbox.disabled = true;
            loyaltyDiscountApplied = false;
            updateInvoice();
        }
    } catch (error) {
        console.error('Customer search failed:', error);
        customerSearchResultsDiv.style.display = 'none';
    }
}


function renderCustomerSearchResults(results) {
    if (results.length === 0) {
        customerSearchResultsDiv.style.display = 'none';
        return;
    }
    customerSearchResultsDiv.innerHTML = results.map(cust => `
        <div class="customer-search-result" data-id="${cust.id}" data-customer='${JSON.stringify(cust)}'>
            <strong>${cust.name}</strong> - ${cust.phone}
        </div>`).join('');
    customerSearchResultsDiv.style.display = 'block';
}

async function selectCustomer(customer) {
    currentCustomerData = customer;
    
    // تحديث حقول الاسم ورقم الهاتف لكلا القسمين لضمان التناسق
    customerNameInput.value = customer.name;
    customerPhoneInput.value = customer.phone;
    dineInCustomerNameInput.value = customer.name;
    dineInCustomerPhoneInput.value = customer.phone;

    customerSearchResultsDiv.style.display = 'none';
    
    // عرض نقاط الولاء
    customerLoyaltyPointsSpan.textContent = `${customer.loyalty_points || 0} نقطة`;
    loyaltyPointsSection.style.display = 'block';
    applyLoyaltyDiscountCheckbox.checked = false; // إعادة تعيين مربع الاختيار
    loyaltyDiscountApplied = false; // إعادة تعيين حالة الخصم
    loyaltyDiscountDisplay.style.display = 'none'; // إخفاء عرض الخصم
    updateInvoice(); // لتحديث حالة زر الخصم والإجمالي

    addressSelectionContainer.innerHTML = '<div class="loader-sm"></div>';
    try {
        const addresses = await window.api.getCustomerAddresses(customer.id);
        if (addresses.length > 0) {
            const options = addresses.map(addr => `<option value="${addr.address}" ${addr.is_default ? 'selected' : ''}>${addr.address}</option>`).join('');
            addressSelectionContainer.innerHTML = `
                <label for="customer-address">اختر عنوانًا أو أدخل جديدًا</label>
                <select id="customer-address-select" class="form-input">${options}</select>
                <input type="text" id="customer-address" class="form-input" placeholder="أو أدخل عنوانًا جديدًا هنا" value="${addresses.find(a => a.is_default)?.address || ''}">`;
            
            document.getElementById('customer-address-select').addEventListener('change', (e) => {
                document.getElementById('customer-address').value = e.target.value;
            });
        } else {
             addressSelectionContainer.innerHTML = '<label for="customer-address">العنوان</label><input type="text" id="customer-address" required>';
        }
    } catch (error) {
        console.error('Failed to get customer addresses:', error);
        addressSelectionContainer.innerHTML = '<label for="customer-address">العنوان (حدث خطأ)</label><input type="text" id="customer-address" required>';
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: appSettings.currency || 'EGP' }).format(amount || 0);
}

function showPreviewModal(title, htmlContent) {
    Swal.fire({
        title: title,
        html: htmlContent,
        width: '800px',
        showCloseButton: true,
        confirmButtonText: '<i class="fa-solid fa-print"></i> طباعة',
        confirmButtonColor: '#2563eb',
        denyButtonText: 'إغلاق',
        showDenyButton: true,
    }).then((result) => {
        if (result.isConfirmed) {
            printModalContent(htmlContent);
        }
    });
}

function printModalContent(htmlContent) {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    const iframeDoc = iframe.contentWindow.document;
    const allCSS = Array.from(document.styleSheets).map(sheet => { try { return sheet.href ? `<link rel="stylesheet" href="${sheet.href}">` : `<style>${Array.from(sheet.cssRules).map(rule => rule.cssText).join('')}</style>`; } catch (e) { if (sheet.href) return `<link rel="stylesheet" href="${sheet.href}">`; return ''; } }).join('');
    iframeDoc.open();
    iframeDoc.write(`<html><head><title>طباعة</title>${allCSS}<style>@media print{body{-webkit-print-color-adjust: exact;}.receipt-box{margin:0;border:none;box-shadow:none;}}</style></head><body dir="rtl" onload="window.focus();window.print();">${htmlContent}</body></html>`);
    iframeDoc.close();
    setTimeout(() => { document.body.removeChild(iframe); }, 2000);
}
