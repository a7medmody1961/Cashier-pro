/*
  File: src/scripts/core/page-loader.js
  Version: 1.0 (New File)
  Description: Handles dynamic loading of pages and their corresponding scripts.
*/

// A map to associate page names with their script modules.
const pageScripts = {
    'pos': () => import('../pos-view.js'),
    'manage-products': () => import('../manage-products.js'),
    'manage-users': () => import('../manage-users.js'),
    'manage-customers': () => import('../manage-customers.js'),
    'manage-expenses': () => import('../manage-expenses.js'),
    'reports': () => import('../reports.js'),
    'settings': () => import('../settings.js'),
};

export function initPageLoader(appSettings) {
    const mainContent = document.getElementById('main-content');
    const navButtons = document.querySelectorAll('#main-nav .nav-btn');

    /**
     * Navigates to a specific page, loading its HTML and initializing its script.
     * @param {string} pageName - The name of the page to navigate to.
     */
    async function navigateTo(pageName) {
        try {
            const pageHtml = await window.api.getPageHtml(pageName);
            mainContent.innerHTML = pageHtml;

            // Initialize the corresponding script for the page
            if (pageScripts[pageName]) {
                const pageModule = await pageScripts[pageName]();
                if (pageModule.init) {
                    // Pass necessary global state to the page module
                    pageModule.init(appSettings);
                }
            }

            // Update the active state of navigation buttons
            navButtons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.page === pageName);
            });
        } catch (error) {
            console.error(`Failed to navigate to ${pageName}:`, error);
            mainContent.innerHTML = `<h1>Error Loading Page</h1><p>Could not load ${pageName}.html. ${error.message}</p>`;
        }
    }

    // Attach event listeners to all navigation buttons
    navButtons.forEach(button => {
        button.addEventListener('click', () => navigateTo(button.dataset.page));
    });

    return { navigateTo };
}