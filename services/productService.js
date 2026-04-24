
import { WebApimanager } from "../components/utilities/WebApiManager";

const FAKE_PRODUCTS = [
  { 
    id: "1", 
    productCode: "100001", 
    productName: "Dog Food Premium", 
    brandName: "Kinley", 
    category: { name: "Food" },
    totalQuantity: "50", 
    openingStock: "20", 
    holdQuantity: "05", 
    mrp: "1200",
    productType: "retail"
  },
  { 
    id: "2", 
    productCode: "100002", 
    productName: "Cat Litter Sand", 
    brandName: "Kinley", 
    category: { name: "Grooming" },
    totalQuantity: "30", 
    openingStock: "10", 
    holdQuantity: "02", 
    mrp: "450",
    productType: "retail"
  },
  { 
    id: "3", 
    productCode: "100003", 
    productName: "Paracetamol Pet", 
    brandName: "Kinley", 
    category: { name: "Medicines" },
    totalQuantity: "100", 
    openingStock: "50", 
    holdQuantity: "10", 
    mrp: "150",
    productType: "medical"
  },
  { 
    id: "4", 
    productCode: "100004", 
    productName: "Surgical Kit", 
    brandName: "MediPet", 
    category: { name: "Medical" },
    totalQuantity: "15", 
    openingStock: "5", 
    holdQuantity: "0", 
    mrp: "2500",
    productType: "medical"
  },
  { 
    id: "5", 
    productCode: "100005", 
    productName: "Pet Shampoo", 
    brandName: "GroomWell", 
    category: { name: "Grooming" },
    totalQuantity: "25", 
    openingStock: "05", 
    holdQuantity: "01", 
    mrp: "600",
    productType: "retail"
  }
];

export const productService = {
  getProducts: async (jwt, branchId, type, search = "") => {
    const webApi = new WebApimanager(jwt);
    try {
      // Construction query params
      const params = {
        branchId,
        productType: type
      };
      if (search) params.search = search;
      
      const response = await webApi.get(`vendor/products`, params);
      
      // Standardize response based on provided JSON sample
      if (response?.data?.data) {
        return {
          products: response.data.data,
          total: response.data.total || response.data.data.length // fallback
        };
      }
      return { products: [], total: 0 };
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
      const response = await webApi.get(`vendor/stock-updates/branch/${branchId}`);
      return response?.data?.data || [];
    } catch (error) {
      console.error("Error fetching stock updates:", error);
      return [];
    }
  },

  getAllProductsBrief: async (jwt, branchId) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.get(`vendor/products`, { branchId});
      return response?.data?.data || [];
    } catch (error) {
      console.error("Error fetching project brief:", error);
      return [];
    }
  },

  updateStock: async (jwt, data) => {
    const webApi = new WebApimanager(jwt);
    return await webApi.post(`vendor/stock-updates`, data);
  }
};
