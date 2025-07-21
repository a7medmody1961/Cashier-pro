/*
  File: src/scripts/manage-users.js
  Version: 1.1
  Changes:
  - (Task 6 - Permissions) Updated to manage the new permissions checkboxes instead of the role dropdown.
*/
export function init() {
    console.log("User management script initialized.");

    const userForm = document.getElementById('user-form');
    if (!userForm) return;

    const usersTableBody = document.querySelector('#users-table tbody');
    const clearFormBtn = document.getElementById('clear-form-btn');
    const userIdInput = document.getElementById('user-id');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const roleInput = document.getElementById('role');
    const permissionsGrid = document.getElementById('permissions-grid');
    
    let usersCache = [];

    async function loadUsers() {
        try {
            usersCache = await window.api.getUsers();
            renderTable();
        } catch (error) {
            console.error("Failed to load users:", error);
            Swal.fire('خطأ!', 'فشل تحميل قائمة المستخدمين.', 'error');
        }
    }

    function renderTable() {
        usersTableBody.innerHTML = '';
        usersCache.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.role === 'Admin' ? 'مدير' : 'كاشير'}</td>
                <td class="actions-cell">
                    <button class="btn btn-secondary edit-btn" data-id="${user.id}">تعديل</button>
                    <button class="btn btn-danger delete-btn" data-id="${user.id}">حذف</button>
                </td>
            `;
            usersTableBody.appendChild(row);
        });
    }

    function clearForm() {
        userForm.reset();
        userIdInput.value = '';
        // Ensure all checkboxes are reset to their default state
        permissionsGrid.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            if(checkbox.id !== 'perm-pos') { // Don't uncheck the disabled POS checkbox
               checkbox.checked = false;
            }
        });
    }

    function populateForm(id) {
        const user = usersCache.find(u => u.id === id);
        if (user) {
            userIdInput.value = user.id;
            usernameInput.value = user.username;
            roleInput.value = user.role;
            passwordInput.value = '';
            
            // Populate permissions checkboxes
            const userPermissions = JSON.parse(user.permissions || '{}');
            permissionsGrid.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                const page = checkbox.dataset.page;
                checkbox.checked = !!userPermissions[page];
            });
        }
    }

    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Collect permissions from checkboxes
        const permissions = {};
        permissionsGrid.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            permissions[checkbox.dataset.page] = checkbox.checked;
        });

        const userData = {
            id: userIdInput.value ? parseInt(userIdInput.value) : null,
            username: usernameInput.value,
            password: passwordInput.value,
            role: roleInput.value,
            permissions: permissions
        };

        try {
            if (userData.id) {
                await window.api.updateUser(userData);
            } else {
                if (!userData.password) {
                    Swal.fire('خطأ', 'يجب إدخال كلمة مرور للمستخدم الجديد.', 'error');
                    return;
                }
                await window.api.addUser(userData);
            }
            Swal.fire('تم الحفظ!', 'تم حفظ بيانات المستخدم بنجاح.', 'success');
            clearForm();
            loadUsers();
        } catch (error) {
            console.error("Error saving user:", error);
            Swal.fire('خطأ!', 'اسم المستخدم موجود بالفعل أو حدث خطأ آخر.', 'error');
        }
    });

    usersTableBody.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const id = parseInt(target.dataset.id);

        if (target.classList.contains('edit-btn')) {
            populateForm(id);
        } else if (target.classList.contains('delete-btn')) {
            const result = await Swal.fire({
                title: 'هل أنت متأكد؟', text: "سيتم حذف هذا المستخدم نهائياً!", icon: 'warning',
                showCancelButton: true, confirmButtonColor: '#dc3545',
                cancelButtonText: 'إلغاء', confirmButtonText: 'نعم، قم بالحذف'
            });
            if (result.isConfirmed) {
                try {
                    await window.api.deleteUser(id);
                    Swal.fire('تم الحذف!', 'تم حذف المستخدم بنجاح.', 'success');
                    loadUsers();
                } catch (error) {
                    Swal.fire('خطأ!', 'فشل حذف المستخدم.', 'error');
                }
            }
        }
    });

    clearFormBtn.addEventListener('click', clearForm);
    loadUsers();
}
