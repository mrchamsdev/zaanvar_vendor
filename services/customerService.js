import { WebApimanager } from "../components/utilities/WebApiManager";

export const customerService = {
  getCustomers: async (jwt) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.get(`vendor/customers`);
      return response?.data || { status: "error", data: [] };
    } catch (error) {
      console.error("Error fetching customers:", error);
      return { status: "error", data: [] };
    }
  },

  createCustomer: async (jwt, data) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.post(`vendor/customers`, data);
      return response || { status: "error" };
    } catch (error) {
      console.error("Error creating customer:", error);
      return { status: "error" };
    }
  },

  updateCustomer: async (jwt, id, data) => {
    const webApi = new WebApimanager(jwt);
    try {
      if (data instanceof FormData) {
        const response = await webApi.imagePut(`vendor/customers/${id}`, data);
        return response || { status: "error" };
      }
      const response = await webApi.put(`vendor/customers/${id}`, data);
      return response || { status: "error" };
    } catch (error) {
      console.error("Error updating customer:", error);
      if (error.response && error.response.data) {
        return error.response.data;
      }
      return { status: "error", message: error.message };
    }
  },

  deleteCustomer: async (jwt, id) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.delete(`vendor/customers/${id}`);
      return response || { status: "error" };
    } catch (error) {
      console.error("Error deleting customer:", error);
      if (error.response && error.response.data) {
        return error.response.data;
      }
      return { status: "error", message: error.message };
    }
  },

  getCustomerById: async (jwt, id) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.get(`vendor/customers/${id}`);
      return response?.data || { status: "error" };
    } catch (error) {
      console.error("Error fetching customer details:", error);
      return { status: "error" };
    }
  }
};
