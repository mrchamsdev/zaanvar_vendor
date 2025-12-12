"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import styles from "../../styles/pet-store/addProduct.module.css";
import { WebApimanager } from "@/components/utilities/WebApiManager";
import useStore from "@/components/state/useStore";
import { IMAGE_URL } from "@/components/utilities/Constants";

const AddProduct = ({ onClose, returnPath = "/pet-store/products", editProductId = null, editProductData = null }) => {
  const router = useRouter();
  const { getJwtToken } = useStore();
  const jwt = getJwtToken();
  const webApi = new WebApimanager(jwt);
  const isEditMode = !!editProductId;

  const [currentStep, setCurrentStep] = useState(1);
  const [isMaximized, setIsMaximized] = useState(true);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [brandSuggestions, setBrandSuggestions] = useState([]);
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [filteredBrandSuggestions, setFilteredBrandSuggestions] = useState([]);
  const brandInputRef = useRef(null);

  // Initialize form data - use editProductData if provided
  const initializeFormData = () => {
    if (editProductData) {
      // Parse features from string to array
      // Handle JSON string like "[\"nutss chocos\", \"feature 2\"]" or array or comma-separated string
      let featuresArray = [];
      if (editProductData.features) {
        if (Array.isArray(editProductData.features)) {
          featuresArray = editProductData.features;
        } else if (typeof editProductData.features === 'string') {
          // Try to parse as JSON first
          try {
            const parsed = JSON.parse(editProductData.features);
            if (Array.isArray(parsed)) {
              featuresArray = parsed;
            } else {
              // If not an array, try splitting by comma
              featuresArray = editProductData.features.split(',').map(f => f.trim()).filter(f => f);
            }
          } catch (e) {
            // If JSON parse fails, treat as comma-separated string
            featuresArray = editProductData.features.split(',').map(f => f.trim()).filter(f => f);
          }
        }
      }
      
      // Clean up features - remove quotes and brackets if present
      featuresArray = featuresArray.map(f => {
        if (typeof f === 'string') {
          // Remove surrounding quotes and brackets
          return f.replace(/^["\[\]]+|["\[\]]+$/g, '').trim();
        }
        return f;
      }).filter(f => f);
      
      // Ensure at least one empty field if no features
      if (featuresArray.length === 0) {
        featuresArray.push("");
      }
      
      // Parse specialIngredients - handle JSON string like "[\"Speacial 1\"]"
      let specialIngredientsValue = "";
      if (editProductData.specialIngredients) {
        if (typeof editProductData.specialIngredients === 'string') {
          try {
            const parsed = JSON.parse(editProductData.specialIngredients);
            if (Array.isArray(parsed)) {
              // Join array items with comma
              specialIngredientsValue = parsed.map(item => {
                if (typeof item === 'string') {
                  return item.replace(/^["\[\]]+|["\[\]]+$/g, '').trim();
                }
                return item;
              }).filter(item => item).join(', ');
            } else {
              specialIngredientsValue = editProductData.specialIngredients;
            }
          } catch (e) {
            // If JSON parse fails, use as is
            specialIngredientsValue = editProductData.specialIngredients;
          }
        } else if (Array.isArray(editProductData.specialIngredients)) {
          specialIngredientsValue = editProductData.specialIngredients.join(', ');
        } else {
          specialIngredientsValue = editProductData.specialIngredients;
        }
      }
      
      // Parse petType - could be string or array
      const petTypeArray = editProductData.petType
        ? (Array.isArray(editProductData.petType) 
          ? editProductData.petType 
          : [editProductData.petType])
        : [];

      // Map variants
      const mappedVariants = editProductData.variants && editProductData.variants.length > 0
        ? editProductData.variants.map(variant => {
            // Handle imageUrls - can be array or single string
            let imageUrlsArray = [];
            if (variant.imageUrls) {
              if (Array.isArray(variant.imageUrls)) {
                imageUrlsArray = variant.imageUrls;
              } else if (typeof variant.imageUrls === 'string') {
                imageUrlsArray = [variant.imageUrls];
              }
            }
            
            // Format image URLs for preview (ensure full URLs)
            const formattedImages = imageUrlsArray.map(url => {
              if (!url) return null;
              if (url.startsWith('http')) return url;
              if (url.startsWith(IMAGE_URL)) return url;
              return `${IMAGE_URL}${url}`;
            }).filter(url => url);
            
            // Parse variantType if it's in old format (e.g., "10Kg", "250g", "200ml")
            let parsedVariantType = variant.variantType || "";
            let parsedQuantityValue = variant.quantityValue || "";
            
            // Convert full names to abbreviations for consistency
            if (parsedVariantType) {
              if (parsedVariantType.includes("Grams (g)") || parsedVariantType === "Grams (g)") parsedVariantType = "g";
              else if (parsedVariantType.includes("Kilograms (kg)") || parsedVariantType === "Kilograms (kg)") parsedVariantType = "kg";
              else if (parsedVariantType.includes("Milliliters (ml)") || parsedVariantType === "Milliliters (ml)") parsedVariantType = "ml";
              else if (parsedVariantType.includes("Liters (L)") || parsedVariantType === "Liters (L)") parsedVariantType = "L";
            }
            
            // If quantityValue is not set but variantType contains a number, try to parse it
            if (!parsedQuantityValue && parsedVariantType) {
              const match = parsedVariantType.match(/^(\d+(?:\.\d+)?)\s*(g|kg|ml|l|G|KG|ML|L)$/i);
              if (match) {
                parsedQuantityValue = match[1];
                const unit = match[2].toLowerCase();
                if (unit === 'g') parsedVariantType = "g";
                else if (unit === 'kg') parsedVariantType = "kg";
                else if (unit === 'ml') parsedVariantType = "ml";
                else if (unit === 'l') parsedVariantType = "L";
              }
            }
            
            return {
              id: variant.id || null, // Store variant ID for edit mode
              variantType: parsedVariantType,
              quantityValue: parsedQuantityValue,
              pieces: variant.pieces || "",
              sellingPrice: variant.sellingPrice || "",
              mrp: variant.mrp || "",
              discountPercentage: variant.discountPercentage || "",
              skuCode: variant.skuCode || "",
              description: variant.description || "",
              imageUrl: imageUrlsArray.length > 0 ? imageUrlsArray[0] : "",
              imageUrls: imageUrlsArray,
              images: formattedImages, // Preview images (formatted URLs)
              variantImageFiles: [], // Store actual File objects for upload (multiple images)
              sellingPriceError: "", // Error message for selling price validation
            };
          })
        : [{}];

      return {
        // Step 1: Images
        frontImage: null,
        frontImageUrl: editProductData.frontImageUrl || "",
        frontImagePreview: editProductData.frontImageUrl || "", // For preview
        backImage: null,
        backImageUrl: editProductData.backImageUrl || "",
        backImagePreview: editProductData.backImageUrl || "", // For preview
        
        // Step 2: Product Info
        petType: petTypeArray,
        productName: editProductData.productName || "",
        brandName: editProductData.brandName || "",
        categoryId: editProductData.categoryId?.toString() || "",
        subCategoryId: editProductData.subCategoryId?.toString() || "",
        features: featuresArray.length > 0 ? featuresArray : [""],
        description: editProductData.description || "",
        
        // Category-specific fields
        clothType: editProductData.clothType || "",
        materialType: editProductData.materialType || "",
        color: editProductData.color || "",
        breedSize: editProductData.breedSize || "",
        specialIngredients: specialIngredientsValue,
        flavour: editProductData.flavour || "",
        specieUsesForProduct: editProductData.specieUsesForProduct || "",
        itemForm: editProductData.itemForm || "",
        productBenefits: editProductData.productBenefits || "",
        specialFeatures: editProductData.specialFeatures || "",
        dimensions: editProductData.dimensions || "",
        pattern: editProductData.pattern || "",
        material: editProductData.material || "",
        toyType: editProductData.toyType || "",
        recommendedFor: editProductData.recommendedFor || "",
        seasonalEssentials: editProductData.seasonalEssentials || "",
        
        // Step 3: Variants
        variants: mappedVariants,
      };
    }
    
    // Default empty form
    return {
      // Step 1: Images
      frontImage: null,
      frontImageUrl: "",
      frontImagePreview: "",
      backImage: null,
      backImageUrl: "",
      backImagePreview: "",
      
      // Step 2: Product Info
      petType: [],
      productName: "",
      brandName: "",
      categoryId: "",
      subCategoryId: "",
      features: [""],
      description: "",
      
      // Category-specific fields
      clothType: "",
      materialType: "",
      color: "",
      breedSize: "",
      specialIngredients: "",
      flavour: "",
      specieUsesForProduct: "",
      itemForm: "",
      productBenefits: "",
      specialFeatures: "",
      dimensions: "",
      pattern: "",
      material: "",
        toyType: "",
        recommendedFor: "",
        seasonalEssentials: "",
        
        // Step 3: Variants
        variants: [{}],
    };
  };

  const [formData, setFormData] = useState(() => initializeFormData());

  const frontImageInputRef = useRef(null);
  const backImageInputRef = useRef(null);
  const variantImageInputRefs = useRef({});

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
    fetchBrandNames();
  }, []);

  // Fetch all brand names from products
  const fetchBrandNames = async () => {
    try {
      const response = await webApi.get("vendor/petstore/products");
      if (response?.data?.data) {
        // Extract unique brand names (case-insensitive)
        const brandNamesSet = new Set();
        response.data.data.forEach((product) => {
          if (product.brandName && typeof product.brandName === 'string') {
            const normalizedBrand = product.brandName.trim();
            if (normalizedBrand) {
              brandNamesSet.add(normalizedBrand);
            }
          }
        });
        const uniqueBrands = Array.from(brandNamesSet).sort();
        setBrandSuggestions(uniqueBrands);
      }
    } catch (error) {
      console.error("Error fetching brand names:", error);
    }
  };

  // Filter brand suggestions based on input
  useEffect(() => {
    if (formData.brandName && formData.brandName.trim() !== "") {
      const searchTerm = formData.brandName.toLowerCase().trim();
      const filtered = brandSuggestions.filter(brand =>
        brand.toLowerCase().includes(searchTerm)
      );
      setFilteredBrandSuggestions(filtered);
      setShowBrandSuggestions(filtered.length > 0);
    } else {
      setFilteredBrandSuggestions([]);
      setShowBrandSuggestions(false);
    }
  }, [formData.brandName, brandSuggestions]);

  // When editProductData changes, update formData
  useEffect(() => {
    if (editProductData) {
      const newFormData = initializeFormData();
      setFormData(newFormData);
      // Set selected category if available
      if (editProductData.categoryId) {
        // Category will be set after categories are fetched
      }
    }
  }, [editProductData]);

  // Set selected category when categories are loaded and we have editProductData
  useEffect(() => {
    if (categories.length > 0 && editProductData?.categoryId) {
      const category = categories.find(c => c.id === parseInt(editProductData.categoryId));
      if (category) {
        setSelectedCategory(category);
      }
    }
  }, [categories, editProductData]);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (formData.categoryId) {
      fetchSubCategories(formData.categoryId);
      const category = categories.find(c => c.id === parseInt(formData.categoryId));
      setSelectedCategory(category);
    }
  }, [formData.categoryId]);

  const fetchCategories = async () => {
    try {
      const response = await webApi.get("vendor/petstore/categories");
      if (response?.data?.data) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSubCategories = async (categoryId) => {
    try {
      const response = await webApi.get("vendor/petstore/subcategories", { categoryId });
      if (response?.data?.data) {
        setSubCategories(response.data.data);
      } else {
        setSubCategories([]);
      }
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      setSubCategories([]);
    }
  };

  const handleImageUpload = async (type, file) => {
    if (file) {
      // For preview, use data URL (stored separately)
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "front") {
          setFormData(prev => ({
            ...prev,
            frontImage: file,
            frontImagePreview: reader.result, // Store data URL for preview only
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            backImage: file,
            backImagePreview: reader.result, // Store data URL for preview only
          }));
        }
      };
      reader.readAsDataURL(file);

      // Don't upload image here - backend will handle upload via multer
      // Just store the file, it will be sent in FormData on submit
    }
  };

  const handleRemoveImage = (type) => {
    if (type === "front") {
      setFormData(prev => ({
        ...prev,
        frontImage: null,
        frontImageUrl: "",
        frontImagePreview: "",
      }));
      if (frontImageInputRef.current) {
        frontImageInputRef.current.value = "";
      }
    } else {
      setFormData(prev => ({
        ...prev,
        backImage: null,
        backImageUrl: "",
        backImagePreview: "",
      }));
      if (backImageInputRef.current) {
        backImageInputRef.current.value = "";
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePetTypeChange = (petType) => {
    setFormData(prev => {
      const currentTypes = prev.petType || [];
      if (currentTypes.includes(petType)) {
        return {
          ...prev,
          petType: currentTypes.filter(t => t !== petType),
        };
      } else {
        return {
          ...prev,
          petType: [...currentTypes, petType],
        };
      }
    });
  };

  const handleFeaturesChange = (index, value) => {
    setFormData(prev => {
      const currentFeatures = [...(prev.features || [])];
      // Ensure array is long enough
      while (currentFeatures.length <= index) {
        currentFeatures.push("");
      }
      currentFeatures[index] = value;
      return {
        ...prev,
        features: currentFeatures,
      };
    });
  };

  const handleAddFeatureField = () => {
    setFormData(prev => {
      const currentFeatures = prev.features || [];
      return {
        ...prev,
        features: [...currentFeatures, ""],
      };
    });
  };

  const handleRemoveFeatureField = (index) => {
    setFormData(prev => {
      const currentFeatures = [...(prev.features || [])];
      currentFeatures.splice(index, 1);
      return {
        ...prev,
        features: currentFeatures.length > 0 ? currentFeatures : [""],
      };
    });
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleMinimize = () => {
    setIsMaximized(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("addProductMinimized", "true");
      sessionStorage.setItem("addProductReturnPath", returnPath);
      // Store form data in sessionStorage to restore later
      sessionStorage.setItem("addProductFormData", JSON.stringify(formData));
      sessionStorage.setItem("addProductCurrentStep", currentStep.toString());
    }
    router.push(returnPath);
  };

  const handleMaximize = () => {
    setIsMaximized(true);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("addProductMinimized");
      // Restore form data if available
      const savedFormData = sessionStorage.getItem("addProductFormData");
      const savedStep = sessionStorage.getItem("addProductCurrentStep");
      if (savedFormData) {
        setFormData(JSON.parse(savedFormData));
      }
      if (savedStep) {
        setCurrentStep(parseInt(savedStep));
      }
    }
  };

  const handleClose = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("addProductMinimized");
      sessionStorage.removeItem("addProductReturnPath");
    }
    if (onClose) {
      onClose();
    } else {
      router.push(returnPath);
    }
  };

  const handleSubmitSubCategory = async (categoryId, subCategoryName) => {
    try {
      const response = await webApi.post("vendor/petstore/subcategories", {
        categoryId: parseInt(categoryId),
        name: subCategoryName,
      });
      if (response?.data) {
        // Refresh subcategories
        if (formData.categoryId) {
          await fetchSubCategories(formData.categoryId);
        }
        setShowSubCategoryModal(false);
        // Reset select value
        setFormData(prev => ({ ...prev, subCategoryId: "" }));
      }
    } catch (error) {
      console.error("Error creating subcategory:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      // Create FormData object
      const formDataToSend = new FormData();

      // Basic fields
      const petType = Array.isArray(formData.petType) && formData.petType.length > 0 
        ? formData.petType[0] 
        : (typeof formData.petType === 'string' ? formData.petType : "");
      formDataToSend.append("petType", petType);
      formDataToSend.append("productName", formData.productName || "");
      formDataToSend.append("brandName", formData.brandName || "");
      formDataToSend.append("categoryId", formData.categoryId ? parseInt(formData.categoryId) : "");
      formDataToSend.append("subCategoryId", formData.subCategoryId ? parseInt(formData.subCategoryId) : "");
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("seasonalEssentials", formData.seasonalEssentials || "");

      // Features as array - send as JSON string
      const featuresArray = Array.isArray(formData.features) 
        ? formData.features.filter(f => f && f.trim() !== "") 
        : (typeof formData.features === 'string' && formData.features.trim() !== "" 
          ? [formData.features] 
          : []);
      formDataToSend.append("features", JSON.stringify(featuresArray));

      // Images - send File objects directly, backend will upload to S3
      if (formData.frontImage) {
        formDataToSend.append("frontImageUrl", formData.frontImage);
      } else if (formData.frontImageUrl && !formData.frontImageUrl.startsWith('data:')) {
        // If editing and image already exists, send URL
        const frontImageUrl = formData.frontImageUrl.startsWith('http') 
          ? formData.frontImageUrl 
          : (formData.frontImageUrl.startsWith(IMAGE_URL) 
            ? formData.frontImageUrl 
            : `${IMAGE_URL}${formData.frontImageUrl}`);
        formDataToSend.append("frontImageUrl", frontImageUrl);
      }

      if (formData.backImage) {
        formDataToSend.append("backImageUrl", formData.backImage);
      } else if (formData.backImageUrl && !formData.backImageUrl.startsWith('data:')) {
        // If editing and image already exists, send URL
        const backImageUrl = formData.backImageUrl.startsWith('http') 
          ? formData.backImageUrl 
          : (formData.backImageUrl.startsWith(IMAGE_URL) 
            ? formData.backImageUrl 
            : `${IMAGE_URL}${formData.backImageUrl}`);
        formDataToSend.append("backImageUrl", backImageUrl);
      }

      // Check if only variant images are being changed (no variant data changes)
      // Backend logic: If only variantImages are sent (without variants JSON), it appends to existing images
      // If variants JSON is sent, backend deletes all variants and rebuilds them
      const hasNewVariantImages = formData.variants.some(v => v.variantImageFiles && v.variantImageFiles.length > 0);
      const originalVariants = isEditMode && editProductData?.variants ? editProductData.variants : [];
      
      // Check if any variant data has changed (not just images)
      let hasVariantDataChanges = false;
      if (isEditMode && originalVariants.length > 0) {
        hasVariantDataChanges = formData.variants.some((variant, index) => {
          const original = originalVariants[index];
          if (!original) return true; // New variant
          
          // Check if any variant field changed
          return (
            variant.variantType !== original.variantType ||
            String(variant.quantityValue || "") !== String(original.quantityValue || "") ||
            String(variant.pieces || "") !== String(original.pieces || "") ||
            variant.sellingPrice !== original.sellingPrice ||
            variant.mrp !== original.mrp ||
            variant.discountPercentage !== original.discountPercentage ||
            variant.skuCode !== original.skuCode ||
            variant.description !== (original.description || "")
          );
        });
      } else if (!isEditMode) {
        // New product - always send variants
        hasVariantDataChanges = true;
      }

      // MODE 3: Only variant images changed - DON'T send variants JSON, only send variantImages files
      if (isEditMode && hasNewVariantImages && !hasVariantDataChanges) {
        // Only send variantImages files, backend will append to existing images
        formData.variants.forEach((variant, index) => {
          if (variant.variantImageFiles && variant.variantImageFiles.length > 0) {
            variant.variantImageFiles.forEach((file) => {
              formDataToSend.append("variantImages", file);
            });
          }
        });
      } else {
        // MODE 1: Full update - send complete variants JSON with all required fields
        const variantsData = formData.variants.map((variant, index) => {
          // Collect all existing image URLs (not data URLs which are previews for new files)
          const existingImageUrls = [];
          
          // Check variant.imageUrls array first (array of existing images)
          if (variant.imageUrls && Array.isArray(variant.imageUrls)) {
            variant.imageUrls.forEach(url => {
              if (url && typeof url === 'string' && !url.startsWith('data:')) {
                const formattedUrl = url.startsWith('http') 
                  ? url 
                  : (url.startsWith(IMAGE_URL)
                    ? url
                    : `${IMAGE_URL}${url}`);
                if (!existingImageUrls.includes(formattedUrl)) {
                  existingImageUrls.push(formattedUrl);
                }
              }
            });
          }
          
          // Also check variant.imageUrl (single existing image)
          if (variant.imageUrl && typeof variant.imageUrl === 'string' && !variant.imageUrl.startsWith('data:')) {
            const formattedUrl = variant.imageUrl.startsWith('http') 
              ? variant.imageUrl 
              : (variant.imageUrl.startsWith(IMAGE_URL)
                ? variant.imageUrl
                : `${IMAGE_URL}${variant.imageUrl}`);
            if (!existingImageUrls.includes(formattedUrl)) {
              existingImageUrls.push(formattedUrl);
            }
          }
          
          // Also check variant.images array (preview images - filter out data URLs)
          if (variant.images && Array.isArray(variant.images)) {
            variant.images.forEach(img => {
              if (img && typeof img === 'string' && !img.startsWith('data:')) {
                const formattedUrl = img.startsWith('http') 
                  ? img 
                  : (img.startsWith(IMAGE_URL)
                    ? img
                    : `${IMAGE_URL}${img}`);
                if (!existingImageUrls.includes(formattedUrl)) {
                  existingImageUrls.push(formattedUrl);
                }
              }
            });
          }

          // Build complete variant object with ALL required fields
          const variantObj = {
            // Include variant ID if it exists (for edit mode)
            ...(variant.id && { id: variant.id }),
            variantType: variant.variantType || "",
            quantityValue: variant.quantityValue ? parseInt(variant.quantityValue) || null : null,
            pieces: variant.pieces ? parseInt(variant.pieces) || 0 : 0,
            sellingPrice: variant.sellingPrice || "",
            mrp: variant.mrp || "",
            discountPercentage: variant.discountPercentage || "",
            skuCode: variant.skuCode || "",
            description: variant.description || "",
            imageUrls: existingImageUrls, // Always include imageUrls array (even if empty)
            ...(existingImageUrls.length > 0 && { imageUrl: existingImageUrls[0] }) // Backward compatibility
          };

          return variantObj;
        });
        
        // Send variants JSON (backend will rebuild all variants from this)
        formDataToSend.append("variants", JSON.stringify(variantsData));

        // Upload variant images as files - backend will upload to S3 and return URLs
        formData.variants.forEach((variant, index) => {
          if (variant.variantImageFiles && variant.variantImageFiles.length > 0) {
            variant.variantImageFiles.forEach((file) => {
              formDataToSend.append("variantImages", file);
            });
          }
        });
      }

      // Add category-specific fields
      const categoryName = selectedCategory?.name?.toLowerCase() || "";
      
      if (categoryName.includes("cloth")) {
        formDataToSend.append("clothType", formData.clothType || "");
        formDataToSend.append("materialType", formData.materialType || "");
        formDataToSend.append("color", formData.color || "");
        formDataToSend.append("breedSize", formData.breedSize || "");
      } else if (categoryName.includes("food")) {
        formDataToSend.append("specialIngredients", formData.specialIngredients || "");
        formDataToSend.append("flavour", formData.flavour || "");
        formDataToSend.append("breedSize", formData.breedSize || "");
        formDataToSend.append("specieUsesForProduct", formData.specieUsesForProduct || "");
        formDataToSend.append("itemForm", formData.itemForm || "");
      } else if (categoryName.includes("grooming")) {
        formDataToSend.append("material", formData.material || "");
        formDataToSend.append("specieUsesForProduct", formData.specieUsesForProduct || "");
        formDataToSend.append("itemForm", formData.itemForm || "");
        formDataToSend.append("productBenefits", formData.productBenefits || "");
      } else if (categoryName.includes("accessor")) {
        formDataToSend.append("specialFeatures", formData.specialFeatures || "");
        formDataToSend.append("dimensions", formData.dimensions || "");
        formDataToSend.append("pattern", formData.pattern || "");
        formDataToSend.append("breedSize", formData.breedSize || "");
        formDataToSend.append("material", formData.material || "");
        formDataToSend.append("color", formData.color || "");
        formDataToSend.append("toyType", formData.toyType || "");
      }

      let response;
      if (isEditMode && editProductId) {
        // Use imagePut for edit mode (FormData)
        response = await webApi.imagePut(`vendor/petstore/products/${editProductId}`, formDataToSend);
      } else {
        // Use imagePost for new product (FormData)
        response = await webApi.imagePost("vendor/petstore/products", formDataToSend);
      }
      
      if (response?.data || response?.status === "success") {
        handleClose();
        // If adding new, set flag to trigger refetch and navigate to return path
        if (!isEditMode) {
          if (typeof window !== "undefined") {
            sessionStorage.setItem("productAdded", "true");
          }
          router.push(returnPath);
        }
      }
    } catch (error) {
      console.error("Error submitting product:", error);
    }
  };

  // Get variant type options based on category
  const getVariantTypeOptions = () => {
    const categoryName = selectedCategory?.name?.toLowerCase() || "";
    
    if (categoryName.includes("food")) {
      return [
        { value: "g", label: "Grams (g)", needsQuantity: true },
        { value: "kg", label: "Kilograms (kg)", needsQuantity: true },
        { value: "ml", label: "Milliliters (ml)", needsQuantity: true },
        { value: "L", label: "Liters (L)", needsQuantity: true }
      ];
    } else if (categoryName.includes("cloth")) {
      return [
        { value: "Small (S)", label: "Small (S)", needsQuantity: false },
        { value: "Medium (M)", label: "Medium (M)", needsQuantity: false },
        { value: "Large (L)", label: "Large (L)", needsQuantity: false },
        { value: "XL", label: "XL", needsQuantity: false },
        { value: "XXL", label: "XXL", needsQuantity: false },
        { value: "XXXL", label: "XXXL", needsQuantity: false }
      ];
    } else if (categoryName.includes("accessor")) {
      return [
        { value: "One size", label: "One size", needsQuantity: false },
        { value: "Small", label: "Small", needsQuantity: false },
        { value: "Medium", label: "Medium", needsQuantity: false },
        { value: "Large", label: "Large", needsQuantity: false }
      ];
    } else if (categoryName.includes("grooming")) {
      return [
        { value: "ml", label: "Milliliters (ml)", needsQuantity: true },
        { value: "L", label: "Liters (L)", needsQuantity: true },
        { value: "One size", label: "One size", needsQuantity: false },
        { value: "Small", label: "Small", needsQuantity: false },
        { value: "Medium", label: "Medium", needsQuantity: false },
        { value: "Large", label: "Large", needsQuantity: false }
      ];
    }
    return [];
  };

  // Check if quantity input should be shown for a variant type
  const shouldShowQuantityInput = (variantType) => {
    const options = getVariantTypeOptions();
    const selectedOption = options.find(opt => opt.value === variantType);
    return selectedOption ? selectedOption.needsQuantity : false;
  };

  // Get category-specific fields for right column based on selected category
  const getCategoryFieldsRight = () => {
    const categoryName = selectedCategory?.name?.toLowerCase() || "";
    
    if (categoryName.includes("food")) {
      return (
        <>
          <div className={styles.formGroup}>
            <label>Specific uses for product</label>
            <input
              type="text"
              placeholder="Enter the uses"
              value={formData.specieUsesForProduct}
              onChange={(e) => handleInputChange("specieUsesForProduct", e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Item Form</label>
            <input
              type="text"
              placeholder="Enter form"
              value={formData.itemForm}
              onChange={(e) => handleInputChange("itemForm", e.target.value)}
            />
          </div>
        </>
      );
    } else if (categoryName.includes("cloth")) {
      return (
        <>
          <div className={styles.formGroup}>
            <label>Material type</label>
            <input
              type="text"
              placeholder="Enter Material type"
              value={formData.materialType}
              onChange={(e) => handleInputChange("materialType", e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Color</label>
            <select
              value={formData.color}
              onChange={(e) => handleInputChange("color", e.target.value)}
            >
              <option value="">Select color</option>
              <option value="Red">Red</option>
              <option value="Blue">Blue</option>
              <option value="Black">Black</option>
              <option value="White">White</option>
            </select>
          </div>
        </>
      );
    } else if (categoryName.includes("accessor")) {
      return (
        <>
          <div className={styles.formGroup}>
            <label>Material</label>
            <input
              type="text"
              placeholder="Enter Material type eg, Plastic, metal"
              value={formData.material}
              onChange={(e) => handleInputChange("material", e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Dimensions</label>
            <input
              type="text"
              placeholder="Enter dimensions"
              value={formData.dimensions}
              onChange={(e) => handleInputChange("dimensions", e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Color</label>
            <select
              value={formData.color}
              onChange={(e) => handleInputChange("color", e.target.value)}
            >
              <option value="">Select color</option>
              <option value="Red">Red</option>
              <option value="Blue">Blue</option>
              <option value="Black">Black</option>
              <option value="White">White</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Toy type</label>
            <input
              type="text"
              placeholder="Enter toy type"
              value={formData.toyType}
              onChange={(e) => handleInputChange("toyType", e.target.value)}
            />
          </div>
        </>
      );
    } else if (categoryName.includes("grooming")) {
      return (
        <>
          <div className={styles.formGroup}>
            <label>Material</label>
            <input
              type="text"
              placeholder="Enter Material type eg, spray, shampoo"
              value={formData.material}
              onChange={(e) => handleInputChange("material", e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Product benefits</label>
            <input
              type="text"
              placeholder="Enter product benefits"
              value={formData.productBenefits}
              onChange={(e) => handleInputChange("productBenefits", e.target.value)}
            />
          </div>
        </>
      );
    }
    return null;
  };

  // Get category-specific fields based on selected category
  const getCategoryFields = () => {
    const categoryName = selectedCategory?.name?.toLowerCase() || "";
    
    if (categoryName.includes("cloth")) {
      return (
        <>
          <div className={styles.formGroup}>
            <label>Type</label>
            <input
              type="text"
              placeholder="Select cloth Type eg, hoodie"
              value={formData.clothType}
              onChange={(e) => handleInputChange("clothType", e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Features</label>
            <div className={styles.featureInputs}>
              {(formData.features && formData.features.length > 0 ? formData.features : [""]).map((feature, index) => (
                <div key={index} className={styles.featureInputRow}>
                  <input
                    type="text"
                    placeholder="Enter feature"
                    value={feature}
                    onChange={(e) => handleFeaturesChange(index, e.target.value)}
                  />
                  {index > 0 && (
                    <button 
                      type="button"
                      className={styles.removeFeatureBtn}
                      onClick={() => handleRemoveFeatureField(index)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button 
                type="button"
                className={styles.addFeatureBtn}
                onClick={handleAddFeatureField}
              >
                + Add Feature
              </button>
            </div>
          </div>
        </>
      );
    } else if (categoryName.includes("food")) {
      return (
        <>
          <div className={styles.formGroup}>
            <label>Special Ingredients</label>
            <input
              type="text"
              placeholder="Enter ingredients"
              value={formData.specialIngredients}
              onChange={(e) => handleInputChange("specialIngredients", e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Flavour</label>
            <input
              type="text"
              placeholder="Enter Flavour"
              value={formData.flavour}
              onChange={(e) => handleInputChange("flavour", e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Features</label>
            <div className={styles.featureInputs}>
              {(formData.features && formData.features.length > 0 ? formData.features : [""]).map((feature, index) => (
                <div key={index} className={styles.featureInputRow}>
                  <input
                    type="text"
                    placeholder="Enter feature"
                    value={feature}
                    onChange={(e) => handleFeaturesChange(index, e.target.value)}
                  />
                  {index > 0 && (
                    <button 
                      type="button"
                      className={styles.removeFeatureBtn}
                      onClick={() => handleRemoveFeatureField(index)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button 
                type="button"
                className={styles.addFeatureBtn}
                onClick={handleAddFeatureField}
              >
                + Add Feature
              </button>
            </div>
          </div>
        </>
      );
    } else if (categoryName.includes("grooming")) {
      return (
        <>
          <div className={styles.formGroup}>
            <label>Special Ingredients</label>
            <input
              type="text"
              placeholder="Enter ingredients"
              value={formData.specialIngredients}
              onChange={(e) => handleInputChange("specialIngredients", e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Item Form</label>
            <input
              type="text"
              placeholder="Enter Item form eg, spray"
              value={formData.itemForm}
              onChange={(e) => handleInputChange("itemForm", e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Features</label>
            <div className={styles.featureInputs}>
              {(formData.features && formData.features.length > 0 ? formData.features : [""]).map((feature, index) => (
                <div key={index} className={styles.featureInputRow}>
                  <input
                    type="text"
                    placeholder="Enter feature"
                    value={feature}
                    onChange={(e) => handleFeaturesChange(index, e.target.value)}
                  />
                  {index > 0 && (
                    <button 
                      type="button"
                      className={styles.removeFeatureBtn}
                      onClick={() => handleRemoveFeatureField(index)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button 
                type="button"
                className={styles.addFeatureBtn}
                onClick={handleAddFeatureField}
              >
                + Add Feature
              </button>
            </div>
          </div>
        </>
      );
    } else if (categoryName.includes("accessor")) {
      return (
        <>
          <div className={styles.formGroup}>
            <label>Special features</label>
            <input
              type="text"
              placeholder="Enter special features"
              value={formData.specialFeatures}
              onChange={(e) => handleInputChange("specialFeatures", e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Pattern</label>
            <input
              type="text"
              placeholder="Enter pattern type"
              value={formData.pattern}
              onChange={(e) => handleInputChange("pattern", e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Breed Size</label>
            <select
              value={formData.breedSize}
              onChange={(e) => handleInputChange("breedSize", e.target.value)}
            >
              <option value="">Select breed size</option>
              <option value="Small">Small</option>
              <option value="Medium">Medium</option>
              <option value="Large">Large</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Features</label>
            <div className={styles.featureInputs}>
              {(formData.features && formData.features.length > 0 ? formData.features : [""]).map((feature, index) => (
                <div key={index} className={styles.featureInputRow}>
                  <input
                    type="text"
                    placeholder="Enter feature"
                    value={feature}
                    onChange={(e) => handleFeaturesChange(index, e.target.value)}
                  />
                  {index > 0 && (
                    <button 
                      type="button"
                      className={styles.removeFeatureBtn}
                      onClick={() => handleRemoveFeatureField(index)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button 
                type="button"
                className={styles.addFeatureBtn}
                onClick={handleAddFeatureField}
              >
                + Add Feature
              </button>
            </div>
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <>
      <div className={`${styles.addProductModal} ${!isMaximized ? styles.minimized : ""}`}>
        <div className={styles.header}>
          <h2>{isEditMode ? "Edit Product" : "Add Product"}</h2>
          <div className={styles.windowActions}>
            <button onClick={handleMinimize} className={styles.windowBtn} title="Minimize">–</button>
            <button onClick={() => setIsMaximized(!isMaximized)} className={styles.windowBtn} title="Maximize">☐</button>
            <button onClick={handleClose} className={styles.windowBtn} title="Close">✕</button>
          </div>
        </div>

        {isMaximized && (
          <div className={styles.content}>
            {/* Progress Indicator */}
            <div className={styles.progressIndicator}>
              <div className={styles.progressLine}>
                <div className={`${styles.progressSegment} ${currentStep >= 1 ? styles.active : ""}`}></div>
                <div className={`${styles.progressSegment} ${currentStep >= 2 ? styles.active : ""}`}></div>
                <div className={`${styles.progressSegment} ${currentStep >= 3 ? styles.active : ""}`}></div>
              </div>
              <div className={styles.steps}>
                <div className={`${styles.step} ${currentStep === 1 ? styles.active : ""}`}>
                  <div className={styles.stepNumber}>1</div>
                </div>
                <div className={`${styles.step} ${currentStep === 2 ? styles.active : ""}`}>
                  <div className={styles.stepNumber}>2</div>
                  {currentStep === 2 && <div className={styles.dogIcon}>🐕</div>}
                </div>
                <div className={`${styles.step} ${currentStep === 3 ? styles.active : ""}`}>
                  <div className={styles.stepNumber}>3</div>
                </div>
              </div>
            </div>

            {/* Step 1: Upload Images */}
            {currentStep === 1 && (
              <div className={styles.stepContent}>
                <h3 className={styles.sectionTitle}>Upload Image</h3>
                <div className={styles.imageUploadSection}>
                  <div className={styles.imageUploadBox}>
                    <label>Front image:</label>
                    <div
                      className={styles.uploadArea}
                      onClick={() => frontImageInputRef.current?.click()}
                      style={{
                        position: 'relative',
                        minHeight: (formData.frontImagePreview || formData.frontImageUrl) ? '300px' : '200px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                      }}
                    >
                      {(formData.frontImagePreview || formData.frontImageUrl) ? (
                        <>
                          <Image
                            src={formData.frontImagePreview || formData.frontImageUrl}
                            alt="Front preview"
                            width={300}
                            height={300}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              maxHeight: '300px'
                            }}
                          />
                          <button
                            className={styles.removeImage}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage("front");
                            }}
                            style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              background: '#fff',
                              border: 'none',
                              borderRadius: '50%',
                              width: '30px',
                              height: '30px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                              fontSize: '18px',
                              color: '#333'
                            }}
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          <div className={styles.cameraIcon}>📷</div>
                          <p>Upload the product front image here</p>
                        </>
                      )}
                    </div>
                    <input
                      ref={frontImageInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => handleImageUpload("front", e.target.files[0])}
                    />
                  </div>

                  <div className={styles.imageUploadBox}>
                    <label>Back image:</label>
                    <div
                      className={styles.uploadArea}
                      onClick={() => backImageInputRef.current?.click()}
                      style={{
                        position: 'relative',
                        minHeight: (formData.backImagePreview || formData.backImageUrl) ? '300px' : '200px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                      }}
                    >
                      {(formData.backImagePreview || formData.backImageUrl) ? (
                        <>
                          <Image
                            src={formData.backImagePreview || formData.backImageUrl}
                            alt="Back preview"
                            width={300}
                            height={300}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              maxHeight: '300px'
                            }}
                          />
                          <button
                            className={styles.removeImage}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage("back");
                            }}
                            style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              background: '#fff',
                              border: 'none',
                              borderRadius: '50%',
                              width: '30px',
                              height: '30px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                              fontSize: '18px',
                              color: '#333'
                            }}
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          <div className={styles.cameraIcon}>📷</div>
                          <p>Upload the product back image here</p>
                        </>
                      )}
                    </div>
                    <input
                      ref={backImageInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => handleImageUpload("back", e.target.files[0])}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Product Information */}
            {currentStep === 2 && (
              <div className={styles.stepContent}>
                <h3 className={styles.sectionTitle}>Enter product information</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formColumn}>
                    <div className={styles.formGroup}>
                      <label>Select Pet Type</label>
                      <div className={styles.chipInput}>
                        {formData.petType.map((type) => (
                          <span key={type} className={styles.chip}>
                            {type}
                            <button onClick={() => handlePetTypeChange(type)}>✕</button>
                          </span>
                        ))}
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handlePetTypeChange(e.target.value);
                              e.target.value = "";
                            }
                          }}
                        >
                          <option value="">Select Pet Type</option>
                          <option value="Dog">Dog</option>
                          <option value="Cat">Cat</option>
                          <option value="Bird">Bird</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Product name</label>
                      <input
                        type="text"
                        placeholder="Enter Product Name"
                        value={formData.productName}
                        onChange={(e) => handleInputChange("productName", e.target.value)}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>sub Category</label>
                      <select
                        value={formData.subCategoryId}
                        onChange={(e) => {
                          if (e.target.value === "add_new") {
                            setShowSubCategoryModal(true);
                            // Reset to empty to prevent "add_new" from showing as selected
                            setTimeout(() => {
                              setFormData(prev => ({ ...prev, subCategoryId: "" }));
                            }, 0);
                          } else {
                            handleInputChange("subCategoryId", e.target.value);
                          }
                        }}
                      >
                        <option value="">Select Sub Category</option>
                        {subCategories.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name}
                          </option>
                        ))}
                        <option value="add_new" className={styles.addSubCategoryOption}>
                          + Add Sub Category
                        </option>
                      </select>
                    </div>

                    {getCategoryFields()}
                  </div>

                  <div className={styles.formColumn}>
                    <div className={styles.formGroup} style={{ position: 'relative' }}>
                      <label>Brand Name</label>
                      <input
                        ref={brandInputRef}
                        type="text"
                        placeholder="Enter Brand name"
                        value={formData.brandName}
                        onChange={(e) => handleInputChange("brandName", e.target.value)}
                        onFocus={() => {
                          if (formData.brandName && filteredBrandSuggestions.length > 0) {
                            setShowBrandSuggestions(true);
                          }
                        }}
                        onBlur={(e) => {
                          // Delay hiding suggestions to allow click on suggestion
                          setTimeout(() => {
                            setShowBrandSuggestions(false);
                          }, 200);
                        }}
                        autoComplete="off"
                      />
                      {showBrandSuggestions && filteredBrandSuggestions.length > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            backgroundColor: '#fff',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            zIndex: 1000,
                            maxHeight: '200px',
                            overflowY: 'auto',
                            marginTop: '4px'
                          }}
                        >
                          {filteredBrandSuggestions.map((brand, index) => (
                            <div
                              key={index}
                              onClick={() => {
                                handleInputChange("brandName", brand);
                                setShowBrandSuggestions(false);
                                if (brandInputRef.current) {
                                  brandInputRef.current.blur();
                                }
                              }}
                              style={{
                                padding: '10px 16px',
                                cursor: 'pointer',
                                borderBottom: index < filteredBrandSuggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#f5f5f5';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#fff';
                              }}
                            >
                              {brand}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label>Category</label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) => handleInputChange("categoryId", e.target.value)}
                      >
                        <option value="">Select Category here</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Breed Size for Food category - shown in right column after Category */}
                    {selectedCategory?.name?.toLowerCase().includes("food") && (
                      <div className={styles.formGroup}>
                        <label>Breed Size</label>
                        <select
                          value={formData.breedSize}
                          onChange={(e) => handleInputChange("breedSize", e.target.value)}
                        >
                          <option value="">Select breed size</option>
                          <option value="Small">Small</option>
                          <option value="Medium">Medium</option>
                          <option value="Large">Large</option>
                        </select>
                      </div>
                    )}

                    {/* Category-specific fields for right column */}
                    {getCategoryFieldsRight()}

                    {/* Recommended for - only for Grooming category, before Description */}
                    {selectedCategory?.name?.toLowerCase().includes("grooming") && (
                      <div className={styles.formGroup}>
                        <label>Recommended for</label>
                        <input
                          type="text"
                          placeholder="eg., high protein"
                          value={formData.recommendedFor}
                          onChange={(e) => handleInputChange("recommendedFor", e.target.value)}
                        />
                      </div>
                    )}

                    {/* Seasonal Essentials - for all categories, before Description */}
                    <div className={styles.formGroup}>
                      <label>Seasonal Essentials</label>
                      <select
                        value={formData.seasonalEssentials}
                        onChange={(e) => handleInputChange("seasonalEssentials", e.target.value)}
                      >
                        <option value="">Select seasonal essentials</option>
                        <option value="no">No</option>
                        <option value="Summer">Summer</option>
                        <option value="Rainy">Rainy</option>
                        <option value="winter">Winter</option>
                        <option value="Monsoon">Monsoon</option>
                        <option value="festival">Festival</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Description</label>
                      <textarea
                        placeholder="Type here..."
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        rows={4}
                      />
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Variants */}
            {currentStep === 3 && (
              <div className={styles.stepContent}>
                <div className={styles.variantsHeader}>
                  <h3 className={styles.sectionTitle}>Add Variants</h3>
                  <button
                    className={styles.addMoreBtn}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        variants: [...prev.variants, {}],
                      }));
                    }}
                  >
                    + Add more
                  </button>
                </div>
                <div className={styles.variantsSection}>
                  {formData.variants.map((variant, index) => (
                    <div key={index} className={styles.variantCard} style={{ position: 'relative' }}>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newVariants = formData.variants.filter((_, i) => i !== index);
                            setFormData(prev => ({ ...prev, variants: newVariants.length > 0 ? newVariants : [{}] }));
                          }}
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: '#ff4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '30px',
                            height: '30px',
                            cursor: 'pointer',
                            fontSize: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10
                          }}
                          title="Remove variant"
                        >
                          ✕
                        </button>
                      )}
                      <div className={styles.variantFormGrid}>
                        {/* Two-column layout for top fields */}
                        <div className={styles.variantFormRow}>
                          <div className={styles.formGroup} style={{ 
                            display: 'flex', 
                            flexDirection: 'row',
                            gap: '10px', 
                            alignItems: 'flex-end',
                            flex: 1
                          }}>
                            <div style={{ 
                              flex: shouldShowQuantityInput(variant.variantType) ? 1 : 'none', 
                              width: shouldShowQuantityInput(variant.variantType) ? '50%' : '100%',
                              minWidth: shouldShowQuantityInput(variant.variantType) ? '200px' : 'auto'
                            }}>
                              <label >Select Variant Type</label>
                              <select
                                value={variant.variantType || ""}
                                onChange={(e) => {
                                  const newVariants = [...formData.variants];
                                  newVariants[index] = { 
                                    ...variant, 
                                    variantType: e.target.value,
                                    quantityValue: shouldShowQuantityInput(e.target.value) ? variant.quantityValue : ""
                                  };
                                  setFormData(prev => ({ ...prev, variants: newVariants }));
                                }}
                                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px',marginTop: '8px' }}
                              >
                                <option value="">Select variant type</option>
                                {getVariantTypeOptions().map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {shouldShowQuantityInput(variant.variantType) && (
                              <div style={{ flex: 1, width: '50%', minWidth: '200px' }}>
                                <label>Value</label>
                                <input
                                  type="number"
                                  placeholder="Enter value"
                                  value={variant.quantityValue || ""}
                                  onChange={(e) => {
                                    const newVariants = [...formData.variants];
                                    newVariants[index] = { ...variant, quantityValue: e.target.value };
                                    setFormData(prev => ({ ...prev, variants: newVariants }));
                                  }}
                                  style={{ width: '95%', padding: '12px 8px', border: '1px solid #ddd', borderRadius: '8px',marginTop: '8px' }}
                                />
                              </div>
                            )}
                          </div>
                          <div className={styles.formGroup}>
                            <label>Pieces</label>
                            <input
                              type="number"
                              placeholder="Enter pieces"
                              value={variant.pieces || ""}
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                newVariants[index] = { ...variant, pieces: e.target.value };
                                setFormData(prev => ({ ...prev, variants: newVariants }));
                              }}
                            />
                          </div>
                        </div>

                        <div className={styles.variantFormRow}>
                          <div className={styles.formGroup}>
                            <label>MRP</label>
                            <input
                              type="number"
                              placeholder="Enter MRP here"
                              value={variant.mrp || ""}
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                const mrp = parseFloat(e.target.value) || 0;
                                const sellingPrice = parseFloat(variant.sellingPrice) || 0;
                                
                                // Validate Selling Price <= MRP
                                let sellingPriceError = "";
                                if (mrp > 0 && sellingPrice > 0 && sellingPrice > mrp) {
                                  sellingPriceError = "Selling price should not be higher than MRP";
                                }
                                
                                // Calculate discount percentage
                                let discountPercentage = 0;
                                if (mrp > 0 && sellingPrice > 0 && sellingPrice <= mrp && !sellingPriceError) {
                                  discountPercentage = Math.round(((mrp - sellingPrice) / mrp) * 100);
                                }
                                
                                newVariants[index] = { 
                                  ...variant, 
                                  mrp: mrp,
                                  discountPercentage: discountPercentage,
                                  sellingPriceError: sellingPriceError
                                };
                                setFormData(prev => ({ ...prev, variants: newVariants }));
                              }}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Selling price</label>
                            <input
                              type="number"
                              placeholder="Enter Selling price here"
                              value={variant.sellingPrice || ""}
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                const sellingPrice = parseFloat(e.target.value) || 0;
                                const mrp = parseFloat(variant.mrp) || 0;
                                
                                // Validate Selling Price <= MRP
                                let sellingPriceError = "";
                                if (sellingPrice > 0 && mrp > 0 && sellingPrice > mrp) {
                                  sellingPriceError = "Selling price should not be higher than MRP";
                                }
                                
                                // Calculate discount percentage
                                let discountPercentage = 0;
                                if (mrp > 0 && sellingPrice > 0 && sellingPrice <= mrp && !sellingPriceError) {
                                  discountPercentage = Math.round(((mrp - sellingPrice) / mrp) * 100);
                                }
                                
                                newVariants[index] = { 
                                  ...variant, 
                                  sellingPrice: sellingPrice,
                                  discountPercentage: discountPercentage,
                                  sellingPriceError: sellingPriceError
                                };
                                setFormData(prev => ({ ...prev, variants: newVariants }));
                              }}
                              style={variant.sellingPriceError ? { borderColor: '#ff4444' } : {}}
                            />
                            {variant.sellingPriceError && (
                              <div style={{ color: '#ff4444', fontSize: '12px', marginTop: '4px' }}>
                                {variant.sellingPriceError}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className={styles.variantFormRow}>
                          <div className={styles.formGroup}>
                            <label>SKU Code</label>
                            <input
                              type="text"
                              placeholder="Enter SKU Code"
                              value={variant.skuCode || ""}
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                newVariants[index] = { ...variant, skuCode: e.target.value };
                                setFormData(prev => ({ ...prev, variants: newVariants }));
                              }}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Discount Percentage</label>
                            <input
                              type="number"
                              placeholder="Discount %"
                              value={variant.discountPercentage || ""}
                              readOnly
                              style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                            />
                          </div>
                        </div>

                        {/* Full width Description */}
                        {/* <div className={styles.formGroup}>
                          <label>Description</label>
                          <textarea
                            placeholder="Type here"
                            value={variant.description || ""}
                            onChange={(e) => {
                              const newVariants = [...formData.variants];
                              newVariants[index] = { ...variant, description: e.target.value };
                              setFormData(prev => ({ ...prev, variants: newVariants }));
                            }}
                            rows={4}
                          />
                        </div> */}

                        {/* Image Upload Section */}
                        <div className={styles.formGroup}>
                          <label>Upload Images</label>
                          <div
                            className={styles.uploadArea}
                            onClick={() => {
                              const input = variantImageInputRefs.current[`variant-${index}`];
                              if (input) input.click();
                            }}
                          >
                            <div className={styles.cameraIcon}>📷</div>
                            <p>Upload multiple product images here</p>
                          </div>
                          <input
                            ref={(el) => {
                              variantImageInputRefs.current[`variant-${index}`] = el;
                            }}
                            type="file"
                            accept="image/*"
                            multiple
                            style={{ display: "none" }}
                            onChange={async (e) => {
                              const files = Array.from(e.target.files);
                              if (files.length > 0) {
                                // Store the File objects for FormData upload
                                const newVariants = [...formData.variants];
                                if (!newVariants[index].variantImageFiles) {
                                  newVariants[index].variantImageFiles = [];
                                }
                                if (!newVariants[index].images) {
                                  newVariants[index].images = [];
                                }
                                
                                // Add new files to existing array
                                newVariants[index].variantImageFiles = [
                                  ...(newVariants[index].variantImageFiles || []),
                                  ...files
                                ];
                                
                                // For preview, use data URLs
                                const newImages = [];
                                let loadedCount = 0;
                                
                                files.forEach((file) => {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    newImages.push(reader.result);
                                    loadedCount++;
                                    
                                    if (loadedCount === files.length) {
                                      // All images loaded, update state
                                      newVariants[index].images = [
                                        ...(newVariants[index].images || []),
                                        ...newImages
                                      ];
                                      setFormData(prev => ({ ...prev, variants: newVariants }));
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                });
                                
                                // Reset input to allow selecting same files again
                                e.target.value = '';
                              }
                            }}
                          />
                          {variant.images && variant.images.length > 0 && (
                            <div className={styles.variantImagePreviews}>
                              {variant.images.map((img, imgIndex) => (
                                <div key={imgIndex} className={styles.variantImagePreview}>
                                  <Image
                                    src={img}
                                    alt={`Variant ${index + 1} image ${imgIndex + 1}`}
                                    width={100}
                                    height={100}
                                  />
                                  <button
                                    className={styles.removeImage}
                                    onClick={() => {
                                      const newVariants = [...formData.variants];
                                      // Remove from preview images
                                      newVariants[index].images = newVariants[index].images.filter((_, i) => i !== imgIndex);
                                      // Also remove corresponding file if it exists
                                      if (newVariants[index].variantImageFiles && newVariants[index].variantImageFiles.length > imgIndex) {
                                        newVariants[index].variantImageFiles = newVariants[index].variantImageFiles.filter((_, i) => i !== imgIndex);
                                      }
                                      setFormData(prev => ({ ...prev, variants: newVariants }));
                                    }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className={styles.navigationButtons}>
              {currentStep > 1 && (
                <button className={styles.backBtn} onClick={handleBack}>
                  Back
                </button>
              )}
              {currentStep < 3 ? (
                <button className={styles.nextBtn} onClick={handleNext}>
                  Next
                </button>
              ) : (
                <button className={styles.nextBtn} onClick={handleSubmit}>
                  {isEditMode ? "Update" : "Submit"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Sub Category Modal */}
      {showSubCategoryModal && (
        <SubCategoryModal
          categories={categories}
          selectedCategoryId={formData.categoryId}
          onSubmit={handleSubmitSubCategory}
          onClose={() => setShowSubCategoryModal(false)}
        />
      )}
    </>
  );
};

// Sub Category Modal Component
const SubCategoryModal = ({ categories, selectedCategoryId, onSubmit, onClose }) => {
  const [categoryId, setCategoryId] = useState(selectedCategoryId || "");
  const [subCategoryName, setSubCategoryName] = useState("");

  // Update categoryId when selectedCategoryId prop changes
  React.useEffect(() => {
    if (selectedCategoryId) {
      setCategoryId(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (categoryId && subCategoryName) {
      onSubmit(categoryId, subCategoryName);
      setSubCategoryName("");
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3>Add Sub Category</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Enter Category name</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Enter Sub-category name</label>
            <input
              type="text"
              placeholder="e.g., Dry Food"
              value={subCategoryName}
              onChange={(e) => setSubCategoryName(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={styles.submitBtn}>
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;

