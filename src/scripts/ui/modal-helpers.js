// المحتوى الكامل لملف: src/scripts/ui/modal-helpers.js

export function showPreviewModal(title, htmlContent) {
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
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow.document;
    const allCSS = Array.from(document.styleSheets).map(sheet => { try { return sheet.href ? `<link rel="stylesheet" href="${sheet.href}">` : `<style>${Array.from(sheet.cssRules).map(rule => rule.cssText).join('')}</style>`; } catch (e) { if (sheet.href) return `<link rel="stylesheet" href="${sheet.href}">`; return ''; } }).join('');

    iframeDoc.open();
    iframeDoc.write(`<html><head><title>طباعة</title>${allCSS}<style>@media print{body{-webkit-print-color-adjust: exact;}.receipt-box,.shift-summary-box{margin:0;border:none;box-shadow:none;}}</style></head><body dir="rtl" onload="window.focus();window.print();">${htmlContent}</body></html>`);
    iframeDoc.close();

    setTimeout(() => { document.body.removeChild(iframe); }, 2000);
}
/**
 * Shows a full-screen loading overlay.
 * @param {string} message - The message to display (optional).
 */
export function showLoadingOverlay(message = 'جاري التحميل...') {
    let loadingOverlay = document.getElementById('global-loading-overlay');
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'global-loading-overlay';
        loadingOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-50 text-white';
        loadingOverlay.innerHTML = `
            <div class="loader-spinner mb-4"></div>
            <p id="loading-message" class="text-lg">${message}</p>
        `;
        document.body.appendChild(loadingOverlay);
    } else {
        document.getElementById('loading-message').textContent = message;
        loadingOverlay.style.display = 'flex';
    }
}

/**
 * Hides the full-screen loading overlay.
 */
export function hideLoadingOverlay() {
    const loadingOverlay = document.getElementById('global-loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// Add necessary CSS for the overlay in main.css or theme.css
/*
.fixed { position: fixed; }
.inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
.bg-black { background-color: black; }
.bg-opacity-50 { opacity: 0.5; }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.z-50 { z-index: 50; }
.text-white { color: white; }
.mb-4 { margin-bottom: 1rem; }
.text-lg { font-size: 1.125rem; }
*/