// في ملف: src/scripts/manage-expenses.js

export function init(appSettings) {
    console.log("Expense management script initialized.");

    const expenseForm = document.getElementById('expense-form');
    if (!expenseForm) return;

    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const categoryInput = document.getElementById('category');
    const clearFormBtn = document.getElementById('clear-form-btn');
    const expensesTableBody = document.querySelector('#expenses-table tbody');
    const dateFromInput = document.getElementById('date-from');
    const dateToInput = document.getElementById('date-to');
    const filterBtn = document.getElementById('filter-expenses-btn');
    const printBtn = document.getElementById('print-expenses-btn');
    const totalValueSpan = document.getElementById('total-expenses-value');

    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    dateFromInput.value = today;
    dateToInput.value = today;

    async function loadExpenses() {
        try {
            const start = new Date(dateFromInput.value);
            start.setHours(0, 0, 0, 0);
            const end = new Date(dateToInput.value);
            end.setHours(23, 59, 59, 999);

            const expenses = await window.api.getExpenses({ start: start.toISOString(), end: end.toISOString() });
            renderTable(expenses);
            calculateTotal(expenses);
        } catch (error) {
            console.error("فشل تحميل المصروفات:", error);
            Swal.fire('خطأ!', 'فشل تحميل قائمة المصروفات.', 'error');
        }
        function calculateTotal(expenses) {
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        totalValueSpan.textContent = `${total.toFixed(2)} ${appSettings.currency || ''}`;
    }
}

    function renderTable(expenses) {
        expensesTableBody.innerHTML = '';
        if (!expenses || expenses.length === 0) {
            expensesTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">لا توجد مصروفات مسجلة اليوم.</td></tr>';
            return;
        }
        expenses.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${expense.description}</td>
                <td>${expense.amount.toFixed(2)}</td>
                <td>${expense.category || '-'}</td>
                <td>${new Date(expense.created_at).toLocaleString('ar-EG')}</td>
                <td class="actions-cell">
                    <button class="btn btn-danger delete-btn" data-id="${expense.id}">حذف</button>
                </td>
            `;
            expensesTableBody.appendChild(row);
        });
    }

    function clearForm() {
        expenseForm.reset();
    }

    expenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const expenseData = {
            description: descriptionInput.value,
            amount: parseFloat(amountInput.value),
            category: categoryInput.value.trim() || null,
        };

        if (!expenseData.description || !expenseData.amount) {
            Swal.fire('خطأ', 'الرجاء ملء حقلي الوصف والمبلغ.', 'error');
            return;
        }

        try {
            await window.api.addExpense(expenseData);
            Swal.fire({ icon: 'success', title: 'تمت إضافة المصروف بنجاح!', timer: 1500, showConfirmButton: false });
            clearForm();
            loadExpenses();
        } catch (error) {
            console.error("خطأ في حفظ المصروف:", error);
            Swal.fire('خطأ!', 'حدث خطأ أثناء حفظ المصروف.', 'error');
        }
    });

    expensesTableBody.addEventListener('click', async (e) => {
        const target = e.target.closest('button.delete-btn');
        if (!target) return;
        
        const id = parseInt(target.dataset.id);
        const result = await Swal.fire({
            title: 'هل أنت متأكد؟',
            text: "لن تتمكن من التراجع عن هذا!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonText: 'إلغاء',
            confirmButtonText: 'نعم، قم بالحذف'
        });

        if (result.isConfirmed) {
            try {
                await window.api.deleteExpense(id);
                Swal.fire('تم الحذف!', 'تم حذف المصروف بنجاح.', 'success');
                loadExpenses();
            } catch (error) {
                Swal.fire('خطأ!', 'فشل حذف المصروف.', 'error');
            }
        }
    });

    clearFormBtn.addEventListener('click', clearForm);
    loadExpenses();
    
    // ... (renderTable and other event listeners)

    filterBtn.addEventListener('click', loadExpenses);
    printBtn.addEventListener('click', printReport);

    async function printReport() {
        const printWindow = window.open('', 'PRINT', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Expense Report</title>');
        // Add styles for printing
        printWindow.document.write('</head><body>');
        printWindow.document.write(`<h1>Expense Report (${dateFromInput.value} to ${dateToInput.value})</h1>`);
        printWindow.document.write(document.getElementById('expenses-table').outerHTML);
        printWindow.document.write(`<h2>Total: ${totalValueSpan.textContent}</h2>`);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        
        // Use the new PDF export feature
        await window.api.exportToPdf();
        
        printWindow.print();
        printWindow.close();
    }

    loadExpenses();
}