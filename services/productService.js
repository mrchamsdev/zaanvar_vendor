
import { WebApimanager } from "../components/utilities/WebApiManager";



export const productService = {
  getProducts: async (jwt, branchId, type, search = "") => {
    const webApi = new WebApimanager(jwt);
    try {
      // Construction query params
      const params = {
        branchId
      };
      if (type) params.productType = type;
      if (search) params.search = search;

      const response = await webApi.get(`vendor/products`, params);

      const body = response?.data || response;
      let productsList = [];
      let total = 0;

      if (Array.isArray(body)) {
        productsList = body;
        total = body.length;
      } else if (body?.data && Array.isArray(body.data)) {
        productsList = body.data;
        total = body.total || body.data.length;
      } else if (body?.products && Array.isArray(body.products)) {
        productsList = body.products;
        total = body.total || body.products.length;
      }

      return {
        products: productsList,
        total: total || productsList.length
      };
    } catch (error) {
      console.error("Error fetching products:", error);
      return { products: [], total: 0 };
    }
  },

  getDamagedExpiredReports: async (jwt, branchId) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.get(`vendor/products/damaged-expired-reports`, { branchId });
      return response?.data || null;
    } catch (error) {
      console.error("Error fetching damaged/expired reports:", error);
      return null;
    }
  },

  getProductById: async (jwt, productId) => {
    const webApi = new WebApimanager(jwt);
    return await webApi.get(`vendor/products/${productId}`);
  },

  createProduct: async (jwt, data, hasImages = false) => {
    const webApi = new WebApimanager(jwt);
    if (hasImages) {
      return await webApi.imagePost("vendor/products", data);
    }
    return await webApi.post("vendor/products", data);
  },

  updateProduct: async (jwt, productId, data, hasImages = false) => {
    const webApi = new WebApimanager(jwt);
    if (hasImages) {
      return await webApi.imagePut(`vendor/products/${productId}`, data);
    }
    return await webApi.put(`vendor/products/${productId}`, data);
  },

  uploadProductImages: async (jwt, id, formData) => {
    const webApi = new WebApimanager(jwt);
    return await webApi.imagePut(`vendor/product-variants/upload-images/${id}`, formData);
  },

  deleteProduct: async (jwt, productId) => {
    const webApi = new WebApimanager(jwt);
    return await webApi.delete(`vendor/products/${productId}`);
  },

  deleteVariant: async (jwt, variantId) => {
    const webApi = new WebApimanager(jwt);
    return await webApi.delete(`vendor/product-variants/${variantId}`);
  },

  createVariant: async (jwt, data) => {
    const webApi = new WebApimanager(jwt);
    return await webApi.post("vendor/product-variants", data);
  },

  generateProductCode: async (jwt) => {
    const webApi = new WebApimanager(jwt);
    return await webApi.get(`vendor/products/generate-product-code`);
  },

  generateSku: async (jwt) => {
    const webApi = new WebApimanager(jwt);
    return await webApi.get(`vendor/product-variants/generate-sku`);
  },

  getStockUpdates: async (jwt, branchId) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.get(`vendor/stock-updates/manual-entries`, { branchId });
      const body = response?.data || response;
      return body?.data || (Array.isArray(body) ? body : []);
    } catch (error) {
      console.error("Error fetching stock updates:", error);
      return [];
    }
  },

  getAllProductsBrief: async (jwt, branchId) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.get(`vendor/products`, { branchId });
      const body = response?.data || response;
      return body?.data || (Array.isArray(body) ? body : []);
    } catch (error) {
      console.error("Error fetching project brief:", error);
      return [];
    }
  },

  updateStock: async (jwt, data) => {
    const webApi = new WebApimanager(jwt);
    return await webApi.post(`vendor/stock-updates`, data);
  },

  getStockUpdateById: async (jwt, id) => {
    const webApi = new WebApimanager(jwt);
    return await webApi.get(`vendor/stock-updates/${id}`);
  },

  getStockReports: async (jwt, branchId) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.get(`vendor/products/stock-reports`, { branchId });
      const data = response?.data?.data;
      if (data) {
        data.counts = response?.data?.counts;
      }
      return data || {
        outOfStock: [],
        lowStock: [],
        expired: [],
        expiredProducts: [],
        shortExpiry: [],
        damagedBillItems: [],
        customerDamagedReturns: [],
        damageProducts: []
      };
    } catch (error) {
      console.error("Error fetching stock reports:", error);
      return null;
    }
  },

  restoreDamagedItem: async (jwt, item) => {
    const webApi = new WebApimanager(jwt);
    const payload = { action: "restore" };
    if (item.consumptionId) payload.consumptionId = item.consumptionId;
    if (item.stockUpdateId || item.id) payload.stockUpdateId = item.stockUpdateId || item.id;
    return await webApi.put(`vendor/products/stock-reports`, payload);
  },

  markAsWaste: async (jwt, item, isExpired = false) => {
    const webApi = new WebApimanager(jwt);
    const payload = { action: "waste" };
    if (item.consumptionId) payload.consumptionId = item.consumptionId;
    if (item.stockUpdateId || item.id) payload.stockUpdateId = item.stockUpdateId || item.id;
    if (isExpired) payload.type = "expired";
    return await webApi.put(`vendor/products/stock-reports`, payload);
  }
};
