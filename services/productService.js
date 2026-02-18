
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
  getProducts: async (jwt, type) => {
    const webApi = new WebApimanager(jwt);
    try {
      const response = await webApi.get(`products?type=${type}`);
      if (response?.data?.data && response.data.data.length > 0) {
        return response.data.data;
      }
      return FAKE_PRODUCTS.filter(p => p.productType === type);
    } catch (error) {
      console.error("Error fetching products:", error);
      return FAKE_PRODUCTS.filter(p => p.productType === type);
    }
  },

  getProductById: async (jwt, productId) => {
    const webApi = new WebApimanager(jwt);
    return await webApi.get(`products/${productId}`);
  },

  createProduct: async (jwt, formData) => {
    const webApi = new WebApimanager(jwt);
    return await webApi.imagePost("products", formData);
  },

  updateProduct: async (jwt, productId, formData) => {
    const webApi = new WebApimanager(jwt);
    return await webApi.imagePut(`products/${productId}`, formData);
  },

  deleteProduct: async (jwt, productId) => {
    const webApi = new WebApimanager(jwt);
    return await webApi.delete(`products/${productId}`);
  }
};
