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
                    <button class="btn btn-danger delete-btn" data-id="${c.id}">حذف</button>
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
    
    customersTableBody.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const id = target.dataset.id;
        if (target.classList.contains('manage-addr-btn')) {
            openAddressModal(id, target.dataset.name);
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