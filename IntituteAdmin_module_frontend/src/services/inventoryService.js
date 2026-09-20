// Inventory & Assets Service — /api/v1/admin/inventory/*
import apiCall from './api';

const getVendors = () => apiCall('/inventory/vendors');
const createVendor = (payload) => apiCall('/inventory/vendors', { method: 'POST', body: payload });

const getAssets = (category) => apiCall(`/inventory/assets${category ? `?category=${category}` : ''}`);
const createAsset = (payload) => apiCall('/inventory/assets', { method: 'POST', body: payload });

const getComputerLabs = () => apiCall('/inventory/computer-labs');
const createComputerLab = (payload) => apiCall('/inventory/computer-labs', { method: 'POST', body: payload });

const getStockItems = () => apiCall('/inventory/stock-items');
const createStockItem = (payload) => apiCall('/inventory/stock-items', { method: 'POST', body: payload });
const recordStockTransaction = (payload) => apiCall('/inventory/stock-transactions', { method: 'POST', body: payload });
const getStockTransactions = () => apiCall('/inventory/stock-transactions');

const getPurchaseOrders = () => apiCall('/inventory/purchase-orders');
const createPurchaseOrder = (payload) => apiCall('/inventory/purchase-orders', { method: 'POST', body: payload });
const updatePurchaseOrderStatus = (id, status) => apiCall(`/inventory/purchase-orders/${id}/status`, { method: 'PATCH', body: { status } });

const getMaintenanceRecords = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiCall(`/inventory/maintenance${query ? `?${query}` : ''}`);
};
const scheduleMaintenance = (payload) => apiCall('/inventory/maintenance', { method: 'POST', body: payload });
const updateMaintenanceStatus = (id, payload) => apiCall(`/inventory/maintenance/${id}`, { method: 'PATCH', body: payload });

export const inventoryService = {
  getVendors, createVendor,
  getAssets, createAsset,
  getComputerLabs, createComputerLab,
  getStockItems, createStockItem, recordStockTransaction, getStockTransactions,
  getPurchaseOrders, createPurchaseOrder, updatePurchaseOrderStatus,
  getMaintenanceRecords, scheduleMaintenance, updateMaintenanceStatus,
};
export default inventoryService;
