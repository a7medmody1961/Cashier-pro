// src/scripts/ui/sidebar.js

import AppState from '../core/app-state.js';
import { showPreviewModal } from './modal-helpers.js'; // تم إضافة هذا السطر

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
            // السطر المعدل: إضافة اسم الكاشير ووقت البدء
            shiftStatusP.innerHTML = `تم بدء الوردية بواسطة: <strong>${activeShift.username}</strong><br>وردية مفتوحة: ${new Date(activeShift.start_time).toLocaleTimeString()}`;
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
    }

    // دالة مساعدة لتنسيق العملة
    function formatCurrency(amount, currency = appSettings.currency || 'ج.م') {
        return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: currency }).format(amount || 0);
    }

    // دالة مساعدة لإنشاء HTML لملخص الوردية
    function generateShiftSummaryHTML(summary, appSettings) {
        const currency = appSettings.currency || 'ج.م';
        return `
            <div class="receipt-box shift-summary-box" style="width: 100%; max-width: 400px; margin: 20px auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; font-family: 'Tajawal', sans-serif; box-shadow: 0 4px 8px rgba(0,0,0,0.1); text-align: right; direction: rtl;">
                <h2 style="text-align: center; color: #333; margin-bottom: 20px;">ملخص الوردية</h2>
                <div style="font-size: 1.1em; line-height: 1.8;">
                    <p><strong>معرف الوردية:</strong> ${summary.shiftId}</p>
                    <p><strong>وقت البدء:</strong> ${new Date(summary.startTime).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</p>
                    <p><strong>وقت الانتهاء:</strong> ${new Date(summary.endTime).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</p>
                    <hr style="border-top: 1px dashed #ccc; margin: 15px 0;">
                    <p><strong>النقدية الأولية:</strong> ${formatCurrency(summary.startingCash, currency)}</p>
                    <p><strong>إجمالي المبيعات:</strong> ${formatCurrency(summary.totalSales, currency)}</p>
                    <p><strong>إجمالي المرتجعات:</strong> ${formatCurrency(summary.totalRefunds, currency)}</p>
                    <p><strong>صافي المبيعات:</strong> ${formatCurrency(summary.netSales, currency)}</p>
                    <p><strong>مبيعات نقدية:</strong> ${formatCurrency(summary.totalCashSales, currency)}</p>
                    <p><strong>مبيعات بطاقة:</strong> ${formatCurrency(summary.totalCardSales, currency)}</p>
                    <p><strong>إجمالي الخصم اليدوي:</strong> ${formatCurrency(summary.totalManualDiscount, currency)}</p>
                    <hr style="border-top: 1px dashed #ccc; margin: 15px 0;">
                    <p><strong>النقدية النهائية المتوقعة:</strong> ${formatCurrency(summary.startingCash + summary.totalCashSales + summary.totalRefunds, currency)}</p>
                    <p><strong>النقدية الفعلية في الدرج:</strong> ${formatCurrency(summary.endingCash, currency)}</p>
                    <p style="font-weight: bold; color: ${summary.cashDifference === 0 ? '#28a745' : '#dc3545'};">
                        <strong>الفرق النقدي:</strong> ${formatCurrency(summary.cashDifference, currency)}
                    </p>
                </div>
                <p style="text-align: center; margin-top: 20px; font-size: 0.9em; color: #777;">شكراً لك على عملك!</p>
            </div>
        `;
    }

    shiftBtn.addEventListener('click', async () => {
        const activeShift = window.AppState.getActiveShift();
        if (activeShift) {
            // End Shift flow
            const { value: endingCash } = await Swal.fire({
                title: 'إنهاء الوردية',
                input: 'number',
                inputLabel: 'المبلغ النقدي في الدرج عند الإغلاق',
                inputPlaceholder: 'أدخل المبلغ النقدي النهائي',
                inputValue: activeShift.starting_cash, // Default to starting cash, user can adjust
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
                    const result = await window.api.endShift({ shiftId: activeShift.id, endingCash: parseFloat(endingCash) });
                    if (result.success) {
                        window.api.playSound('shift-end'); // تشغيل صوت إنهاء الوردية
                        // Show success message briefly before displaying summary
                        await Swal.fire({
                            title: 'تم!',
                            text: 'تم إنهاء الوردية بنجاح.',
                            icon: 'success',
                            showConfirmButton: false,
                            timer: 1500 // Show for 1.5 seconds
                        });
                        window.AppState.setActiveShift(null); // Clear active shift
                        updateShiftStatus();

                        // Generate and display the shift summary
                        const shiftSummaryHtml = generateShiftSummaryHTML(result.summary, appSettings);
                        showPreviewModal('ملخص الوردية', shiftSummaryHtml);
                    } else {
                        Swal.fire('خطأ!', `فشل إنهاء الوردية: ${result.message || 'خطأ غير معروف'}`, 'error');
                    }
                } catch (error) {
                    console.error('Failed to end shift:', error);
                    Swal.fire('خطأ!', `فشل إنهاء الوردية: ${error.message}`, 'error');
                }
            }
        } else {
            // Start Shift flow
            const { value: startingCash } = await Swal.fire({
                title: 'بدء وردية جديدة',
                input: 'number',
                inputLabel: 'المبلغ النقدي في الدرج عند البدء',
                inputPlaceholder: 'أدخل المبلغ النقدي الأولي',
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

    // Initial load of shift status
    updateShiftStatus();
}