// src/scripts/ui/sidebar.js

// قم بحذف السطر التالي إذا كان موجوداً:
// import { showModal } from './modal-helpers.js'; // تم حذف هذا السطر

export function initSidebar(appSettings, currentUser) {
    const shiftBtn = document.getElementById('shift-btn');
    const shiftStatusP = document.getElementById('shift-status');
    const userInfoDiv = document.getElementById('user-info');
    const logoutBtn = document.getElementById('logout-btn');

    // عرض معلومات المستخدم
    if (userInfoDiv) {
        userInfoDiv.innerHTML = `
            <p>مرحباً، ${currentUser.username}</p>
            <p class="user-role">${currentUser.role}</p>
        `;
    }

    // تهيئة حالة الوردية
    async function updateShiftStatus() {
        console.log("Initializing shift status...");
        const activeShift = await window.api.getActiveShift();
        if (activeShift) {
            window.AppState.setActiveShift(activeShift); // تحديث حالة الوردية في AppState
            shiftStatusP.textContent = `وردية مفتوحة: ${new Date(activeShift.start_time).toLocaleTimeString()}`;
            shiftBtn.textContent = 'إنهاء الوردية';
            shiftBtn.classList.remove('btn-secondary');
            shiftBtn.classList.add('btn-danger');
        } else {
            window.AppState.setActiveShift(null);
            shiftStatusP.textContent = 'لا توجد وردية مفتوحة';
            shiftBtn.textContent = 'بدء الوردية';
            shiftBtn.classList.remove('btn-danger');
            shiftBtn.classList.add('btn-secondary');
        }
        console.log("Active shift status from DB:", activeShift);
    }

    // معالج بدء/إنهاء الوردية
    shiftBtn.addEventListener('click', async () => {
        const activeShift = window.AppState.getActiveShift();
        if (activeShift) {
            // إنهاء الوردية
            const { value: endingCash } = await Swal.fire({
                title: 'إنهاء الوردية',
                input: 'number',
                inputLabel: 'المبلغ النقدي في نهاية الوردية',
                inputValue: activeShift.starting_cash,
                showCancelButton: true,
                confirmButtonText: 'إنهاء',
                cancelButtonText: 'إلغاء',
                inputValidator: (value) => {
                    if (isNaN(parseFloat(value))) {
                        return 'الرجاء إدخال مبلغ نقدي صحيح';
                    }
                }
            });

            if (endingCash !== undefined) {
                try {
                    await window.api.endShift({ shiftId: activeShift.id, endingCash: parseFloat(endingCash), userId: currentUser.id });
                    Swal.fire('تم!', 'تم إنهاء الوردية بنجاح.', 'success');
                    window.api.playSound('shift-end'); // تشغيل صوت إنهاء الوردية
                    updateShiftStatus();
                } catch (error) {
                    console.error('Failed to end shift:', error);
                    Swal.fire('خطأ!', `فشل إنهاء الوردية: ${error.message}`, 'error');
                }
            }
        } else {
            // بدء الوردية
            const { value: startingCash } = await Swal.fire({
                title: 'بدء وردية جديدة',
                input: 'number',
                inputLabel: 'المبلغ النقدي في بداية الوردية',
                inputValue: 0,
                showCancelButton: true,
                confirmButtonText: 'بدء',
                cancelButtonText: 'إلغاء',
                inputValidator: (value) => {
                    if (isNaN(parseFloat(value))) {
                        return 'الرجاء إدخال مبلغ نقدي صحيح';
                    }
                }
            });

            if (startingCash !== undefined) {
                try {
                    await window.api.startShift({ userId: currentUser.id, startingCash: parseFloat(startingCash) });
                    Swal.fire('تم!', 'تم بدء الوردية بنجاح.', 'success');
                    window.api.playSound('shift-start'); // تشغيل صوت بدء الوردية
                    updateShiftStatus();
                } catch (error) {
                    console.error('Failed to start shift:', error);
                    Swal.fire('خطأ!', `فشل بدء الوردية: ${error.message}`, 'error');
                }
            }
        }
    });

    logoutBtn.addEventListener('click', async () => {
        const result = await Swal.fire({
            title: 'تسجيل الخروج',
            text: 'هل أنت متأكد أنك تريد تسجيل الخروج؟',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'نعم، تسجيل الخروج',
            cancelButtonText: 'إلغاء'
        });
        if (result.isConfirmed) {
            window.api.logout();
        }
    });

    // تحديث حالة الوردية عند بدء التطبيق
    updateShiftStatus();
}
