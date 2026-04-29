import { WebApimanager } from "../components/utilities/WebApiManager";

export const purchaseService = {
  getPurchaseRequests: async (jwt, branchId) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.get(`vendor/purchase-requests/branch/${branchId}`);
      return response?.data || { status: "error", data: [] };
    } catch (error) {
      console.error("Error fetching purchase requests:", error);
      return { status: "error", data: [] };
    }
  },

  getSuppliers: async (jwt, branchId) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.get(`vendor/suppliers/branch/${branchId}`);
      return response?.data || { status: "error", data: [] };
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      return { status: "error", data: [] };
    }
  },

  getBranchTransactions: async (jwt, branchId) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.get(`vendor/transactions/branch/${branchId}?limit=2000`);
      return response?.data || { status: "error", data: [] };
    } catch (error) {
      console.error("Error fetching branch transactions:", error);
      return { status: "error", data: [] };
    }
  },

  getBranchReturns: async (jwt, branchId) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.get(`vendor/returns/branch/${branchId}`);
      return response?.data || { status: "error", data: [] };
    } catch (error) {
      console.error("Error fetching branch returns:", error);
      return { status: "error", data: [] };
    }
  },

  getSupplierTransactions: async (jwt, supplierId) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.get(`vendor/transactions/supplier/${supplierId}`);
      return response?.data || { status: "error", data: [] };
    } catch (error) {
      console.error("Error fetching supplier transactions:", error);
      return { status: "error", data: [] };
    }
  },

  createPurchaseOrder: async (jwt, data) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.post(`vendor/purchase-requests`, data);
      return response || { status: "error" };
    } catch (error) {
      console.error("Error creating purchase order:", error);
      return { status: "error" };
    }
  },

  getPurchaseRequestSummary: async (jwt, requestId) => {
    const webApi = new WebApimanager(jwt);
    try {
        const response = await webApi.get(`vendor/purchase-requests/${requestId}/summary`);
        return response?.data || { status: "error" };
    } catch (error) {
        console.error("Error fetching purchase request summary:", error);
        return { status: "error" };
    }
  },

  updatePurchaseOrder: async (jwt, requestId, data) => {
    const webApi = new WebApimanager(jwt);
    try {
        const response = await webApi.put(`vendor/purchase-requests/${requestId}`, data);
        return response || { status: "error" };
    } catch (error) {
        console.error("Error updating purchase order:", error);
        return { status: "error" };
    }
  },

  receivePurchaseOrder: async (jwt, requestId, data) => {
    const webApi = new WebApimanager(jwt);
    try {
        const response = await webApi.post(`vendor/purchase-requests/${requestId}/receive`, data);
        return response || { status: "error" };
    } catch (error) {
        console.error("Error receiving purchase order:", error);
        return { status: "error" };
    }
  },

  createBill: async (jwt, data) => {
    const webApi = new WebApimanager(jwt);
    try {
        const response = await webApi.post(`vendor/bills`, data);
        return response || { status: "error" };
    } catch (error) {
        console.error("Error creating bill:", error);
        return { status: "error" };
    }
  },

  createTransaction: async (jwt, data) => {
    const webApi = new WebApimanager(jwt);
    try {
        const response = await webApi.post(`vendor/transactions`, data);
        return response || { status: "error" };
    } catch (error) {
        console.error("Error creating transaction:", error);
        return { status: "error" };
    }
  },

  uploadTransactionImage: async (jwt, transactionId, formData) => {
    const webApi = new WebApimanager(jwt);
    try {
        const response = await webApi.imagePut(`vendor/transactions/${transactionId}`, formData);
        return response || { status: "error" };
    } catch (error) {
        console.error("Error uploading transaction image:", error);
        return { status: "error" };
    }
  },

  getTransactionById: async (jwt, id) => {
    const webApi = new WebApimanager(jwt);
    try {
        const response = await webApi.get(`vendor/transactions/${id}`);
        return response?.data || { status: "error" };
    } catch (error) {
        console.error("Error fetching transaction:", error);
        return { status: "error" };
    }
  },

  updateTransaction: async (jwt, id, data) => {
    const webApi = new WebApimanager(jwt);
    try {
        const response = (data instanceof FormData)
            ? await webApi.imagePut(`vendor/transactions/${id}`, data)
            : await webApi.put(`vendor/transactions/${id}`, data);
        return response || { status: "error" };
    } catch (error) {
        console.error("Error updating transaction:", error);
        return { status: "error" };
    }
  }
};
