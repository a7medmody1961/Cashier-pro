// src/scripts/renderer.js
import AppState from './core/app-state.js'; // أضف هذا السطر
import { initClock } from './ui/clock.js';
import { initTheme } from './ui/theme.js';
import { initPageLoader } from './core/page-loader.js';
import { initSidebar } from './ui/sidebar.js';

document.addEventListener('DOMContentLoaded', () => {
    async function main() {
        console.log("Starting main application initialization...");

        const appSettings = await window.api.getSettings();
        
        initClock();
        initTheme();

        const currentUser = await window.api.getCurrentUser();

        if (!currentUser) {
            console.error("No logged-in user found. Forcing logout.");
            window.api.logout();
            return;
        }

        // تعيين المستخدم الحالي في AppState
            AppState.setCurrentUser(currentUser); // أضف هذا السطر

            buildSidebarNav(JSON.parse(currentUser.permissions)); // <-- Parse permissions
            const pageLoader = initPageLoader(appSettings, currentUser);
            initSidebar(appSettings, currentUser); // AppState سيتم الوصول إليها داخل Sidebar الآن

            await pageLoader.navigateTo('pos');
            console.log("Application initialization complete.");
        }

    function buildSidebarNav(permissions) {
        const navContainer = document.getElementById('main-nav');
        const availablePages = [
            { id: 'pos', icon: 'fa-cash-register', label: 'نقطة البيع' },
            { id: 'manage-products', icon: 'fa-box-archive', label: 'المنتجات' },
            { id: 'manage-customers', icon: 'fa-users', label: 'العملاء' },
            { id: 'manage-expenses', icon: 'fa-file-invoice-dollar', label: 'المصروفات' },
            { id: 'reports', icon: 'fa-chart-line', label: 'التقارير' },
            { id: 'manage-users', icon: 'fa-user-gear', label: 'المستخدمين' },
            { id: 'settings', icon: 'fa-gear', label: 'الإعدادات' },
        ];

        if (!navContainer) return;
        navContainer.innerHTML = '';
        availablePages.forEach(page => {
            if (permissions && permissions[page.id]) {
                const button = document.createElement('button');
                button.className = 'nav-btn';
                button.dataset.page = page.id;
                button.innerHTML = `<i class="fa-solid ${page.icon} icon"></i> <span>${page.label}</span>`;
                navContainer.appendChild(button);
            }
        });
    }

    main().then(() => {
        document.getElementById('app-loader').style.display = 'none';
        document.querySelector('.app-layout').style.display = 'flex';
    }).catch(error => {
        console.error("Fatal error during application startup:", error);
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.innerHTML = `<h1>حدث خطأ فادح</h1><p>لا يمكن تشغيل التطبيق. يرجى إعادة المحاولة.</p><p style="color: red; text-align: left; direction: ltr;">${error.message}</p>`;
        }
    });
});
let clickSynth; // لتشغيل الأصوات القصيرة مثل إضافة منتج

/**
 * Initializes the Tone.js audio context and synths.
 * Call this function once when the application starts.
 */
async function initializeAudio() {
    // قم بإزالة التحقق `if (!window.Tone)`
    try {
        await Tone.start();
        console.log("Audio context started.");

        // Create a simple synth for click sounds
        clickSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 0.005, decay: 0.1, sustain: 0.05, release: 0.2 }
        }).toDestination();

    } catch (error) {
        console.error("Error initializing Tone.js:", error);
    }
}

/**
 * Plays a specific sound effect.
 * @param {string} soundName - The name of the sound to play (e.g., 'add-to-cart', 'sale-complete').
 */
function playSoundEffect(soundName) {
        if (!clickSynth) {
            console.warn("Audio not initialized. Cannot play sound:", soundName);
            return;
        }

        switch (soundName) {
            case 'add-to-cart':
                clickSynth.triggerAttackRelease("C5", "8n"); // صوت قصير عند إضافة منتج
                break;
            case 'sale-complete':
                clickSynth.triggerAttackRelease(["C4", "E4", "G4"], "4n"); // وتر عند إتمام البيع
                break;
            case 'error':
                clickSynth.triggerAttackRelease("C3", "8n"); // صوت خطأ
                break;
            case 'shift-start':
                clickSynth.triggerAttackRelease("C4", "16n"); // صوت عند بدء الوردية (يمكنك تغيير النغمة أو المدة)
                break;
            case 'shift-end':
                clickSynth.triggerAttackRelease("G3", "16n"); // صوت عند إنهاء الوردية (يمكنك تغيير النغمة أو المدة)
                break;
            default:
                console.warn("Unknown sound effect:", soundName);
        }
    }

// Listen for 'trigger-sound' event from the main process
window.api.onTriggerSound((soundName) => {
    playSoundEffect(soundName);
});

// Call initializeAudio when the DOM is ready
document.addEventListener('DOMContentLoaded', initializeAudio);

// تأكد من إضافة هذا السطر في preload.js لتمرير الحدث
// onTriggerSound: (callback) => ipcRenderer.on('trigger-sound', (event, soundName) => callback(soundName)),