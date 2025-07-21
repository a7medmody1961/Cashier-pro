/*
  File: preload.js
  Version: 3.1
  Description: Securely exposes backend functionality (IPC channels) to the frontend.
  - (Task 13) Added 'sales:get-details' for re-printing invoices.
  - (Task 14) Updated 'processRefund' to accept an object with saleId and userId.
*/

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getCurrentUser: () => ipcRenderer.invoke('get-current-user'),
  // --- Authentication & License ---
  login: (credentials) => ipcRenderer.invoke('login', credentials),
  loginSuccess: (user) => ipcRenderer.send('login-successful', user),
  onUserData: (callback) => ipcRenderer.on('user-data', (event, user) => callback(user)),
  logout: () => ipcRenderer.send('app:logout'),
  getMachineId: () => ipcRenderer.invoke('license:get-machine-id'),
  activateLicense: (key) => ipcRenderer.invoke('license:activate', key),
  // New handler to receive sound trigger from main process
  onTriggerSound: (callback) => ipcRenderer.on('trigger-sound', (event, soundName) => callback(soundName)),

  // --- Navigation & Content ---
  getPageHtml: (pageName) => ipcRenderer.invoke('get-page-html', pageName),

  // --- Shifts ---
  startShift: (shiftData) => ipcRenderer.invoke('shift:start', shiftData),
  endShift: (shiftData) => ipcRenderer.invoke('shift:end', shiftData),
  getActiveShift: () => ipcRenderer.invoke('shift:getActive'),

  // --- Products ---
  getProducts: () => ipcRenderer.invoke('products:get'),
  addProduct: (product) => ipcRenderer.invoke('products:add', product),
  updateProduct: (product) => ipcRenderer.invoke('products:update', product),
  deleteProduct: (id) => ipcRenderer.invoke('products:delete', id),
  selectImage: () => ipcRenderer.invoke('products:select-image'),
  getImagesPath: () => ipcRenderer.invoke('products:get-images-path'),
  onProductsUpdate: (callback) => ipcRenderer.on('products-updated', () => callback()),
  exportProducts: () => ipcRenderer.invoke('products:export-excel'),
  importProducts: () => ipcRenderer.invoke('products:import-excel'),

  // --- Users ---
  getUsers: () => ipcRenderer.invoke('users:get'),
  addUser: (user) => ipcRenderer.invoke('users:add', user),
  updateUser: (user) => ipcRenderer.invoke('users:update', user),
  deleteUser: (id) => ipcRenderer.invoke('users:delete', id),

  // --- Sales ---
  finalizeSale: (saleData) => ipcRenderer.invoke('sales:finalize', saleData),
  getSales: (dateRange) => ipcRenderer.invoke('sales:get', dateRange),
  // (Task 14) Update to accept { saleId, userId }
  processRefund: (refundData) => ipcRenderer.invoke('sales:process-refund', refundData),
  // (Task 13) New handler to get full details for a single sale
  getSaleDetails: (saleId) => ipcRenderer.invoke('sales:get-details', saleId),

  // --- Reports ---
  getAnalytics: (dateRange) => ipcRenderer.invoke('reports:get-analytics'),

  // --- Customers ---
  getCustomers: () => ipcRenderer.invoke('customers:get'),
  searchCustomers: (query) => ipcRenderer.invoke('customers:search', query),
  addCustomer: (customer) => ipcRenderer.invoke('customers:add', customer),
  updateCustomer: (customer) => ipcRenderer.invoke('customers:update', customer),
  deleteCustomer: (id) => ipcRenderer.invoke('customers:delete', id),
  getCustomerAddresses: (customerId) => ipcRenderer.invoke('customers:get-addresses', customerId),
  addCustomerAddress: (data) => ipcRenderer.invoke('customers:add-address', data),
  updateCustomerAddress: (addressData) => ipcRenderer.invoke('customers:update-address', addressData),
  deleteCustomerAddress: (addressId) => ipcRenderer.invoke('customers:delete-address', addressId),
  exportCustomers: () => ipcRenderer.invoke('customers:export-excel'),
  importCustomers: (data) => ipcRenderer.invoke('customers:import-excel', data),
  // إضافة جديدة: جلب معاملات العميل
  getCustomerTransactions: (customerId) => ipcRenderer.invoke('customers:get-transactions', customerId),

  // --- Expenses ---
  getExpenses: (dateRange) => ipcRenderer.invoke('expenses:get', dateRange),
  addExpense: (expense) => ipcRenderer.invoke('expenses:add', expense),
  deleteExpense: (id) => ipcRenderer.invoke('expenses:delete', id),

  // --- Settings ---
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings) => ipcRenderer.invoke('settings:update', settings),

  // --- Tools & Hardware ---
  playSound: (soundName) => ipcRenderer.send('play-sound', soundName),
  printContent: () => ipcRenderer.send('print-content'),
  openExternalLink: (url) => ipcRenderer.send('open-external-link', url),
  exportToPdf: () => ipcRenderer.invoke('export-to-pdf'),
  openCashDrawer: () => ipcRenderer.send('cash-drawer:open'),
});