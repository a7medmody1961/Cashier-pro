/*
  File: src/scripts/manage-customers.js
  Version: 2.3
  Changes:
  - (FIX) Translated all Swal (SweetAlert2) messages to be fully in Arabic.
  - (Feature) Updated renderTable to display loyalty points details.
*/
export function init() {
    const addCustomerForm = document.getElementById('add-customer-form');
    if (!addCustomerForm) return;

    const newCustomerNameInput = document.getElementById('new-customer-name');
    const newCustomerPhoneInput = document.getElementById('new-customer-phone');
    const newCustomerAddressInput = document.getElementById('new-customer-address');
    const customersTableBody = document.querySelector('#customers-table tbody');
    const addressModal = document.getElementById('address-modal');
    const modalCloseBtn = addressModal.querySelector('.close-btn');
    const modalCustomerName = document.getElementById('modal-customer-name');
    const modalCustomerIdInput = document.getElementById('modal-customer-id');
    const addressesList = document.getElementById('addresses-list');
    const addAddressForm = document.getElementById('add-address-form');
    const newAddressInput = document.getElementById('new-address');

    // عناصر جديدة لسجل المعاملات
    const customerTransactionsSection = document.getElementById('customer-transactions-section');
    const transactionsCustomerName = document.getElementById('transactions-customer-name');
    const transactionsTableBody = document.getElementById('transactions-table-body');
    const closeTransactionsBtn = document.getElementById('close-transactions-btn');


    async function loadCustomers() {
        try {
            const customers = await window.api.getCustomers();
            renderTable(customers);
        } catch (error) { 
            console.error('Failed to load customers:', error); 
            Swal.fire('خطأ', 'فشل تحميل قائمة العملاء.', 'error'); 
        }
    }

    function renderTable(customers) {
        customersTableBody.innerHTML = customers.map(c => `
            <tr>
                <td>${c.name}</td>
                <td>${c.phone}</td>
                <td>${c.default_address || 'لا يوجد'}</td>
                <td>${new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(c.total_spent || 0)}</td>
                <td>${c.order_count}</td>
                <td>${c.total_earned_loyalty_points || 0}</td> <td>${c.loyalty_points || 0}</td> <td>${c.total_redeemed_loyalty_points || 0}</td> <td class="actions-cell">
                    <button class="btn btn-secondary manage-addr-btn" data-id="${c.id}" data-name="${c.name}">إدارة العناوين</button>
                    <button class="btn btn-info view-transactions-btn" data-id="${c.id}" data-name="${c.name}">عرض المعاملات</button> <button class="btn btn-danger delete-btn" data-id="${c.id}">حذف</button>
                </td>
            </tr>
        `).join('');
    }

    addCustomerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await window.api.addCustomer({
                name: newCustomerNameInput.value,
                phone: newCustomerPhoneInput.value,
                address: newCustomerAddressInput.value
            });
            Swal.fire('تم بنجاح!', 'تمت إضافة العميل بنجاح.', 'success');
            addCustomerForm.reset();
            loadCustomers();
        } catch (error) {
            console.error('Failed to add customer:', error);
            Swal.fire('خطأ', error.message || 'فشلت إضافة العميل. قد يكون رقم الهاتف مسجل من قبل.', 'error');
        }
    });
    
    function openAddressModal(customerId, customerName) {
        modalCustomerName.textContent = `عناوين العميل: ${customerName}`;
        modalCustomerIdInput.value = customerId;
        loadAddressesForModal(customerId);
        addressModal.style.display = 'flex';
    }

    function closeAddressModal() {
        addressModal.style.display = 'none';
    }

    async function loadAddressesForModal(customerId) {
        const addresses = await window.api.getCustomerAddresses(customerId);
        addressesList.innerHTML = addresses.map(addr => `
            <li>
                <span>${addr.address}</span>
                <button class="btn btn-danger delete-addr-btn" data-id="${addr.id}" data-customer-id="${customerId}">حذف</button>
            </li>
        `).join('');
    }

    modalCloseBtn.addEventListener('click', closeAddressModal);
    window.addEventListener('click', (e) => {
        if (e.target === addressModal) closeAddressModal();
    });

    addAddressForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const customerId = modalCustomerIdInput.value;
        const address = newAddressInput.value;
        await window.api.addCustomerAddress({ customerId, address });
        newAddressInput.value = '';
        loadAddressesForModal(customerId);
    });

    addressesList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-addr-btn')) {
            const addressId = e.target.dataset.id;
            const customerId = e.target.dataset.customerId;
            const result = await Swal.fire({
                title: 'هل أنت متأكد؟',
                text: 'سيتم حذف هذا العنوان نهائياً.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonText: 'إلغاء',
                confirmButtonText: 'نعم، قم بالحذف'
            });

            if (result.isConfirmed) {
                await window.api.deleteCustomerAddress(addressId);
                loadAddressesForModal(customerId);
            }
        }
    });

    // دالة جديدة لعرض معاملات العميل
    async function showCustomerTransactions(customerId, customerName) {
        transactionsCustomerName.textContent = `سجل معاملات العميل: ${customerName}`;
        customerTransactionsSection.style.display = 'block'; // إظهار القسم

        try {
            const transactions = await window.api.getCustomerTransactions(customerId);
            renderTransactionsTable(transactions);
        } catch (error) {
            console.error('Failed to load customer transactions:', error);
            Swal.fire('خطأ', 'فشل تحميل سجل معاملات العميل.', 'error');
            transactionsTableBody.innerHTML = '<tr><td colspan="8">فشل تحميل البيانات.</td></tr>';
        }
    }

    // دالة جديدة لعرض جدول المعاملات
    function renderTransactionsTable(transactions) {
        if (transactions.length === 0) {
            transactionsTableBody.innerHTML = '<tr><td colspan="8">لا توجد معاملات لهذا العميل.</td></tr>';
            return;
        }

        const paymentMethodMap = {
            'cash': 'نقدي',
            'card': 'بطاقة'
        };

        const orderTypeMap = {
            'dine_in': 'صالة',
            'dine-in': 'صالة', // إضافة هذا السطر لترجمة "Dine-in" بشكل صحيح
            'takeaway': 'خارجي',
            'delivery': 'توصيل'
        };

        transactionsTableBody.innerHTML = transactions.map(sale => {
            const saleDate = new Date(sale.created_at).toLocaleString('ar-EG', {
                year: 'numeric', month: 'numeric', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            // تحويل طريقة الدفع باستخدام Map (مع جعل القيمة lowercase وإزالة المسافات)
            const paymentMethodKey = (sale.payment_method || '').toLowerCase().trim();
            const paymentMethodDisplay = paymentMethodMap[paymentMethodKey] || sale.payment_method;

            // تحويل نوع الطلب باستخدام Map (مع جعل القيمة lowercase وإزالة المسافات)
            const orderTypeKey = (sale.order_type || '').toLowerCase().trim();
            const orderTypeDisplay = orderTypeMap[orderTypeKey] || sale.order_type;

            // عرض المنتجات بشكل منسق
            const productsList = sale.items.map(item => `
                <li>${item.product_name} (${item.quantity} x ${new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(item.price_per_item)})</li>
            `).join('');

            const discountDisplay = sale.manual_discount_amount > 0 ?
                `${new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(sale.manual_discount_amount)} (${sale.manual_discount_type === 'percentage' ? '%' : ''})` :
                'لا يوجد';

            return `
                <tr>
                    <td>${sale.sale_id}</td>
                    <td>${saleDate}</td>
                    <td>${orderTypeDisplay}</td>
                    <td>${paymentMethodDisplay}</td>
                    <td>${discountDisplay}</td>
                    <td>${new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(sale.total_amount)}</td>
                    <td>${sale.loyalty_points || 0} نقطة</td>
                    <td><ul>${productsList}</ul></td>
                </tr>
            `;
        }).join('');
    }

    // إغلاق قسم المعاملات
    closeTransactionsBtn.addEventListener('click', () => {
        customerTransactionsSection.style.display = 'none';
        transactionsTableBody.innerHTML = ''; // مسح البيانات عند الإغلاق
    });
    
    customersTableBody.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const id = target.dataset.id;
        if (target.classList.contains('manage-addr-btn')) {
            openAddressModal(id, target.dataset.name);
        } else if (target.classList.contains('view-transactions-btn')) { // معالج جديد لزر "عرض المعاملات"
            showCustomerTransactions(id, target.dataset.name);
        } else if (target.classList.contains('delete-btn')) {
            const result = await Swal.fire({ 
                title: 'هل أنت متأكد؟', 
                text: "سيتم حذف العميل وكل بياناته المرتبطة به!", 
                icon: 'warning', 
                showCancelButton: true, 
                confirmButtonColor: '#d33', 
                cancelButtonText: 'إلغاء', 
                confirmButtonText: 'نعم، قم بالحذف!' 
            });
            if (result.isConfirmed) {
                try {
                    await window.api.deleteCustomer(id);
                    Swal.fire('تم الحذف!', 'تم حذف العميل بنجاح.', 'success');
                    loadCustomers();
                } catch (error) { 
                    Swal.fire('خطأ', 'فشل حذف العميل.', 'error'); 
                }
            }
        }
    });

    loadCustomers();
}