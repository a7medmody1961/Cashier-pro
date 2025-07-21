// ==================================================================================
// الملف الثالث: pos-view.js (تم الإصلاح وإضافة الخصم اليدوي)
// المسار: src/scripts/pos-view.js
// الشرح: تم إضافة منطق التعامل مع الخصم اليدوي وتطبيقه على الفاتورة.
// ==================================================================================

import { generateInvoiceHTML } from './invoice-template.js';

let allProducts = [], invoiceItems = [], currentOrderType = 'dine-in', currentCustomerData = {}, appSettings = {};
// متغيرات الخصم اليدوي الجديدة
let manualDiscountAmount = 0, manualDiscountType = 'fixed', manualDiscountApplied = false;
let productGrid, searchBar, invoiceItemsDiv, subTotalSpan, vatTotalSpan, serviceTotalSpan, deliveryRow, deliveryTotalSpan, grandTotalSpan, finalizeButton, cancelOrderBtn, orderTypeSelector, dineInCustomerForm, deliveryCustomerForm, dineInCustomerNameInput, dineInCustomerPhoneInput, customerPhoneInput, customerNameInput, customerSearchResultsDiv, addressSelectionContainer;
// عناصر نقاط الولاء
let loyaltyPointsSection, customerLoyaltyPointsSpan, applyLoyaltyDiscountCheckbox, loyaltyDiscountDisplay, loyaltyDiscountValueSpan;
let loyaltyDiscountApplied = false;
// عناصر الخصم اليدوي الجديدة
let manualDiscountInput, manualDiscountTypeSelect, applyManualDiscountBtn, clearManualDiscountBtn, manualDiscountLabel, manualDiscountValueSpanHtml;

// جديد: علم لمنع إرفاق مستمعات الأحداث بشكل متكرر
let _eventListenersSetup = false;


export function init(settings) {
    appSettings = settings;
    getDomElements();
    setupEventListeners(); // سيتم استدعاؤها مرة واحدة فقط بفضل العلم الجديد
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

    // جلب عناصر الخصم اليدوي الجديدة
    manualDiscountInput = document.getElementById('manual-discount-input');
    manualDiscountTypeSelect = document.getElementById('manual-discount-type-select');
    applyManualDiscountBtn = document.getElementById('apply-manual-discount-btn');
    clearManualDiscountBtn = document.getElementById('clear-manual-discount-btn');
    manualDiscountLabel = document.getElementById('manual-discount-label');
    manualDiscountValueSpanHtml = document.getElementById('manual-discount-value');
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
    const loyaltyDiscount = calculateLoyaltyDiscount(amounts.totalBeforeDiscounts); // استخدم الإجمالي قبل الخصم اليدوي
    let totalAfterLoyalty = amounts.totalBeforeDiscounts; // الإجمالي قبل الخصم اليدوي
    if (loyaltyDiscountApplied && loyaltyDiscount > 0) {
        loyaltyDiscountDisplay.style.display = 'block';
        loyaltyDiscountValueSpan.textContent = formatCurrency(loyaltyDiscount);
        totalAfterLoyalty -= loyaltyDiscount;
    } else {
        loyaltyDiscountDisplay.style.display = 'none';
    }

    // تحديث وعرض الخصم اليدوي
    let finalGrandTotal = totalAfterLoyalty;
    if (manualDiscountApplied && manualDiscountAmount > 0) {
        let discountValue = 0;
        if (manualDiscountType === 'fixed') {
            discountValue = manualDiscountAmount;
        } else if (manualDiscountType === 'percentage') {
            discountValue = totalAfterLoyalty * (manualDiscountAmount / 100);
        }
        // التأكد من أن الخصم لا يجعل الإجمالي سالباً
        discountValue = Math.min(discountValue, totalAfterLoyalty); 

        manualDiscountLabel.style.display = 'contents';
        manualDiscountValueSpanHtml.style.display = 'contents';
        manualDiscountValueSpanHtml.textContent = `- ${formatCurrency(discountValue)}`;
        finalGrandTotal -= discountValue;
        clearManualDiscountBtn.style.display = 'inline-block'; // إظهار زر الإزالة
    } else {
        manualDiscountLabel.style.display = 'none';
        manualDiscountValueSpanHtml.style.display = 'none';
        clearManualDiscountBtn.style.display = 'none'; // إخفاء زر الإزالة
    }

    grandTotalSpan.textContent = formatCurrency(finalGrandTotal);
    
    deliveryRow.style.display = currentOrderType === 'delivery' ? 'contents' : 'none';
    finalizeButton.disabled = invoiceItems.length === 0;
}

function calculateTotals() {
    const subTotal = invoiceItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let vat = 0, service = 0, delivery = 0;
    const settingsSuffix = currentOrderType === 'delivery' ? 'Delivery' : 'DineIn';
    
    // حساب VAT
    if (appSettings[`vatType${settingsSuffix}`] === 'percentage') { 
        vat = subTotal * (parseFloat(appSettings[`vatValue${settingsSuffix}`]) / 100); 
    } else { 
        vat = parseFloat(appSettings[`vatValue${settingsSuffix}`]) || 0; 
    }
    
    // حساب الخدمة
    if (appSettings[`serviceType${settingsSuffix}`] === 'percentage') { 
        service = subTotal * (parseFloat(appSettings[`serviceValue${settingsSuffix}`]) / 100); 
    } else { 
        service = parseFloat(appSettings[`serviceValue${settingsSuffix}`]) || 0; 
    }
    
    // حساب رسوم التوصيل
    if (currentOrderType === 'delivery') { 
        delivery = parseFloat(appSettings.deliveryFee) || 0; 
    }

    // الإجمالي قبل أي خصومات (نقاط ولاء أو خصم يدوي)
    const totalBeforeDiscounts = subTotal + vat + service + delivery;

    return { subTotal, vat, service, delivery, totalBeforeDiscounts }; // تم تغيير 'total' إلى 'totalBeforeDiscounts'
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

    // جديد: طلب الرقم المرجعي للمعاملة إذا كانت طريقة الدفع "بطاقة"
    let transactionRef = null;
    if (paymentMethod === 'Card') {
        const { value: refNumber } = await Swal.fire({
            title: 'الرقم المرجعي للمعاملة',
            input: 'text',
            inputLabel: 'الرجاء إدخال الرقم المرجعي للفيزا/البطاقة',
            inputPlaceholder: 'الرقم المرجعي...',
            showCancelButton: true,
            confirmButtonText: 'متابعة',
            cancelButtonText: 'إلغاء',
            inputValidator: (value) => {
                if (!value) {
                    return 'يجب إدخال الرقم المرجعي للمعاملة!';
                }
            }
        });

        if (refNumber) {
            transactionRef = refNumber.trim();
        } else {
            // المستخدم ألغى أو لم يدخل الرقم المرجعي
            Swal.fire('تم الإلغاء', 'لم يتم إتمام عملية البيع لعدم إدخال الرقم المرجعي.', 'info');
            return; // الخروج من دالة finalizeSale إذا كان الرقم المرجعي مطلوباً ولم يتم تقديمه
        }
    }

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

    const amounts = calculateTotals(); // إعادة حساب الإجماليات
    let totalAmountAfterLoyaltyDiscount = amounts.totalBeforeDiscounts;
    let pointsUsed = 0;
    let loyaltyDiscountAmount = 0;

    // تطبيق خصم نقاط الولاء
    if (loyaltyDiscountApplied) {
        loyaltyDiscountAmount = calculateLoyaltyDiscount(amounts.totalBeforeDiscounts);
        totalAmountAfterLoyaltyDiscount -= loyaltyDiscountAmount;
        
        const pointsRedeemValue = parseFloat(appSettings.pointsRedeemValue) || 0;
        if (pointsRedeemValue > 0) {
            pointsUsed = Math.round(loyaltyDiscountAmount / pointsRedeemValue);
        }
    }

    // تطبيق الخصم اليدوي
    let finalTotalAmount = totalAmountAfterLoyaltyDiscount;
    let manualDiscountValueToSave = 0;
    let manualDiscountTypeToSave = null;

    if (manualDiscountApplied && manualDiscountAmount > 0) {
        if (manualDiscountType === 'fixed') {
            manualDiscountValueToSave = manualDiscountAmount;
        } else if (manualDiscountType === 'percentage') {
            manualDiscountValueToSave = totalAmountAfterLoyaltyDiscount * (manualDiscountAmount / 100);
        }
        manualDiscountValueToSave = Math.min(manualDiscountValueToSave, totalAmountAfterLoyaltyDiscount); // التأكد من أن الخصم لا يتجاوز الإجمالي

        finalTotalAmount -= manualDiscountValueToSave;
        manualDiscountTypeToSave = manualDiscountType; // حفظ نوع الخصم أيضاً
    }

    // جديد: حساب نقاط الولاء المكتسبة لهذه الفاتورة
    let pointsEarnedForThisSale = 0;
    const pointsEarnRate = parseFloat(appSettings.pointsEarnRate) || 0;
    if (pointsEarnRate > 0) {
        // تم التعديل: حساب النقاط المكتسبة بقسمة المبلغ على معدل الاكتساب
        pointsEarnedForThisSale = Math.floor(finalTotalAmount / pointsEarnRate); 
    }
    
    const saleData = {
        type: currentOrderType,
        items: invoiceItems,
        amounts: { 
            ...amounts, 
            total: finalTotalAmount, // الإجمالي النهائي بعد جميع الخصومات
            loyaltyDiscount: loyaltyDiscountAmount, 
            manualDiscountAmount: manualDiscountValueToSave, // قيمة الخصم اليدوي
            manualDiscountType: manualDiscountTypeToSave // نوع الخصم اليدوي
        }, 
        paymentMethod,
        userId: currentUser.id,
        shiftId: activeShift.id,
        customer: customerDataForSale,
        transactionRef: transactionRef, // <<< تمت إضافة هذا السطر
        pointsUsed: pointsUsed, // إرسال عدد النقاط المستخدمة
        pointsEarned: pointsEarnedForThisSale // <<< تمت إضافة هذا السطر
    };
    
    try {
        const result = await window.api.finalizeSale(saleData);
        if (result.success) {
            window.api.playSound('sale-complete');
            Swal.fire('تم!', 'اكتملت عملية البيع بنجاح.', 'success');
            // تمرير loyaltyDiscountAmount و manualDiscountValueToSave و pointsEarnedForThisSale إلى generateInvoiceHTML
            const invoiceHtml = generateInvoiceHTML(
                result.saleDetails, 
                result.saleItems, 
                appSettings, 
                result.saleDetails.loyalty_discount_amount, 
                result.saleDetails.manual_discount_amount,
                result.saleDetails.loyalty_points // assuming saleDetails will now include loyalty_points from DB
            );
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

    // إعادة تعيين حالة الخصم اليدوي
    manualDiscountAmount = 0;
    manualDiscountType = 'fixed';
    manualDiscountApplied = false;
    manualDiscountInput.value = '';
    manualDiscountTypeSelect.value = 'fixed';
    manualDiscountLabel.style.display = 'none';
    manualDiscountValueSpanHtml.style.display = 'none';
    clearManualDiscountBtn.style.display = 'none';

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
    // جديد: إذا تم إعداد مستمعات الأحداث بالفعل، فلا تقم بإعدادها مرة أخرى
    if (_eventListenersSetup) return;

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

            // مستمعات الخصم اليدوي
            if (button.id === 'apply-manual-discount-btn') {
                const discountValue = parseFloat(manualDiscountInput.value);
                if (isNaN(discountValue) || discountValue < 0) {
                    Swal.fire('قيمة غير صالحة', 'الرجاء إدخال قيمة خصم صحيحة.', 'warning');
                    return;
                }
                manualDiscountAmount = discountValue;
                manualDiscountType = manualDiscountTypeSelect.value;
                manualDiscountApplied = true;
                updateInvoice();
            }
            if (button.id === 'clear-manual-discount-btn') {
                manualDiscountAmount = 0;
                manualDiscountType = 'fixed'; // إعادة تعيين للنوع الافتراضي
                manualDiscountApplied = false;
                manualDiscountInput.value = '';
                manualDiscountTypeSelect.value = 'fixed';
                updateInvoice();
            }
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

    // مستمعات لحقل إدخال الخصم وتحديد النوع لتحديث الفاتورة عند التغيير
    manualDiscountInput.addEventListener('input', updateInvoice);
    manualDiscountTypeSelect.addEventListener('change', updateInvoice);

    // جديد: تعيين العلم بعد إعداد مستمعات الأحداث بنجاح
    _eventListenersSetup = true;
}

// دالة موحدة للتعامل مع إدخال رقم هاتف العميل
async function handleCustomerPhoneInput(e) {
    const phoneInput = e.target;
    const phoneQuery = phoneInput.value.trim();

    // مهم: إظهار div النتائج مبكراً، وسيتم إخفاؤه لاحقاً إذا لم تكن هناك نتائج
    customerSearchResultsDiv.style.display = 'block'; 
    customerSearchResultsDiv.innerHTML = '<div class="loader-sm"></div>'; // عرض مؤشر تحميل اختياري


    // السيناريو 1: حقل الهاتف فارغ تمامًا. هذا يعني إلغاء تحديد العميل.
    if (phoneQuery === '') {
        if (Object.keys(currentCustomerData).length > 0) {
            currentCustomerData = {};
            dineInCustomerNameInput.value = '';
            dineInCustomerPhoneInput.value = '';
            customerNameInput.value = '';
            customerPhoneInput.value = '';
            loyaltyPointsSection.style.display = 'none';
            applyLoyaltyDiscountCheckbox.checked = false;
            applyLoyaltyDiscountCheckbox.disabled = true;
            loyaltyDiscountApplied = false;
            updateInvoice();
        }
        customerSearchResultsDiv.innerHTML = ''; // مسح النتائج عند مسح البحث
        customerSearchResultsDiv.style.display = 'none'; // إخفاء عند مسح البحث
        return;
    }

    // السيناريو 2: إدخال الهاتف قصير جدًا للبحث (مثل 1 أو 2 رقم).
    // لا يتم إجراء بحث أو مسح قسري هنا.
    if (phoneQuery.length < 3) {
        if (Object.keys(currentCustomerData).length > 0 && !currentCustomerData.phone.startsWith(phoneQuery)) {
            currentCustomerData = {};
            dineInCustomerNameInput.value = '';
            customerNameInput.value = '';
            loyaltyPointsSection.style.display = 'none';
            applyLoyaltyDiscountCheckbox.checked = false;
            applyLoyaltyDiscountCheckbox.disabled = true;
            loyaltyDiscountApplied = false;
            updateInvoice();
        }
        customerSearchResultsDiv.innerHTML = ''; // مسح النتائج
        customerSearchResultsDiv.style.display = 'none'; // إخفاء عند الإدخال القصير
        return;
    }

    // السيناريو 3: إدخال الهاتف 3 أحرف أو أكثر، قم بإجراء البحث.
    try {
        const results = await window.api.searchCustomers(phoneQuery);
        if (results.length > 0) {
            renderCustomerSearchResults(results); // هذه الدالة ستجعل العرض block تلقائياً
            // تمت إزالة التحديد التلقائي هنا للسماح للمستخدم بالاختيار من القائمة
            // إذا كان هناك عميل محدد مسبقًا ولكن لا يتطابق مع الاستعلام الحالي، قم بمسح بياناته
            if (Object.keys(currentCustomerData).length > 0 && currentCustomerData.phone !== phoneQuery && !results.some(c => c.id === currentCustomerData.id)) {
                currentCustomerData = {};
                dineInCustomerNameInput.value = '';
                customerNameInput.value = '';
                loyaltyPointsSection.style.display = 'none';
                applyLoyaltyDiscountCheckbox.checked = false;
                applyLoyaltyDiscountCheckbox.disabled = true;
                loyaltyDiscountApplied = false;
                updateInvoice();
            }
        } else {
            // لم يتم العثور على نتائج بحث للاستعلام الحالي (3 أحرف أو أكثر).
            // مهم: مسح النتائج وإخفاء الـ div
            customerSearchResultsDiv.innerHTML = '';
            customerSearchResultsDiv.style.display = 'none';

            if (Object.keys(currentCustomerData).length > 0 && currentCustomerData.phone !== phoneQuery) {
                currentCustomerData = {};
                dineInCustomerNameInput.value = '';
                customerNameInput.value = '';
                loyaltyPointsSection.style.display = 'none';
                applyLoyaltyDiscountCheckbox.checked = false;
                applyLoyaltyDiscountCheckbox.disabled = true;
                loyaltyDiscountApplied = false;
                updateInvoice();
            } else if (Object.keys(currentCustomerData).length === 0) {
                loyaltyPointsSection.style.display = 'none';
                applyLoyaltyDiscountCheckbox.checked = false;
                applyLoyaltyDiscountCheckbox.disabled = true;
                loyaltyDiscountApplied = false;
                updateInvoice();
            }
        }
    } catch (error) {
        console.error('Customer search failed:', error);
        // مهم: مسح النتائج وإخفاء الـ div عند الخطأ
        customerSearchResultsDiv.innerHTML = '';
        customerSearchResultsDiv.style.display = 'none';

        currentCustomerData = {};
        dineInCustomerNameInput.value = '';
        customerNameInput.value = '';
        loyaltyPointsSection.style.display = 'none';
        applyLoyaltyDiscountCheckbox.checked = false;
        applyLoyaltyDiscountCheckbox.disabled = true;
        loyaltyDiscountApplied = false;
        updateInvoice();
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