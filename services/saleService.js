
import { WebApimanager } from "../components/utilities/WebApiManager";

export const saleService = {
  getSalesInvoices: async (jwt, branchId) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.get(`vendor/user-orders/branch/${branchId}`);
      return response?.data || { status: "error", data: [], overallTotals: {} };
    } catch (error) {
      console.error("Error fetching sales invoices:", error);
      return { status: "error", data: [], overallTotals: {} };
    }
  },

  getSaleInvoiceById: async (jwt, id) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.get(`vendor/user-orders/${id}`);
      return response?.data || { status: "error", data: null };
    } catch (error) {
      console.error("Error fetching sale invoice:", error);
      return { status: "error", data: null };
    }
  },

  createSaleInvoice: async (jwt, data) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.post(`vendor/user-orders`, data);
      return response || { status: "error" };
    } catch (error) {
      console.error("Error creating sale invoice:", error);
      return { status: "error" };
    }
  },

  updateSaleInvoice: async (jwt, id, data) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.put(`vendor/user-orders/${id}`, data);
      return response || { status: "error" };
    } catch (error) {
      console.error("Error updating sale invoice:", error);
      return { status: "error" };
    }
  },

    getCustomers: async (jwt, branchId) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.get(`vendor/customers`, { branchId });
      return response.data || { status: "success", data: [] };
    } catch (error) {
      console.error("Error fetching customers:", error);
      return { status: "success", data: [] };
    }
  },

  getPayments: async (jwt, branchId) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.get(`vendor/payments/branch/${branchId}`);
      return response?.data || { status: "error", data: [], overallTotals: {} };
    } catch (error) {
      console.error("Error fetching payments:", error);
      return { status: "error", data: [], overallTotals: {} };
    }
  },

  getPaymentById: async (jwt, id) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.get(`vendor/payments/${id}`);
      return response?.data || { status: "error", data: null };
    } catch (error) {
      console.error("Error fetching payment detail:", error);
      return { status: "error", data: null };
    }
  },

  createPayment: async (jwt, data) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.post(`vendor/payments`, data);
      return response || { status: "error" };
    } catch (error) {
      console.error("Error creating payment:", error);
      return { status: "error" };
    }
  },

  updatePayment: async (jwt, id, data) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.put(`vendor/payments/${id}`, data);
      return response || { status: "error" };
    } catch (error) {
      console.error("Error updating payment:", error);
      return { status: "error" };
    }
  },

  getCustomersByBranch: async (jwt, branchId) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.get(`vendor/customers`, { branchId });
      return response?.data || { status: "error", data: [] };
    } catch (error) {
      console.error("Error fetching customers by branch:", error);
      return { status: "error", data: [] };
    }
  },

  getOrderById: async (jwt, id) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.get(`vendor/user-orders/${id}`);
      return response?.data || { status: "error", data: null };
    } catch (error) {
      console.error("Error fetching order by id:", error);
      return { status: "error", data: null };
    }
  },

  createSalesReturn: async (jwt, data) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.post(`vendor/customer-returns`, data);
      return response || { status: "error" };
    } catch (error) {
      console.error("Error creating sales return:", error);
      return { status: "error" };
    }
  },

  getAllSalesReturns: async (jwt, branchId) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.get(`vendor/customer-returns/branch/${branchId}`);
      return response?.data || { status: "error", data: [] };
    } catch (error) {
      console.error("Error fetching all sales returns:", error);
      return { status: "error", data: [] };
    }
  },

  getSalesReturnById: async (jwt, id) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.get(`vendor/customer-returns/${id}`);
      return response?.data || { status: "error", data: null };
    } catch (error) {
      console.error("Error fetching sales return by id:", error);
      return { status: "error", data: null };
    }
  },

  updateSalesReturn: async (jwt, id, data) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.put(`vendor/customer-returns/${id}`, data);
      return response || { status: "error" };
    } catch (error) {
      console.error("Error updating sales return:", error);
      return { status: "error" };
    }
  }
};
