"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import styles from "../../styles/pet-store/addProduct.module.css";
import { WebApimanager } from "@/components/utilities/WebApiManager";
import useStore from "@/components/state/useStore";
import { IMAGE_URL } from "@/components/utilities/Constants";

const AddProduct = ({ onClose, returnPath = "/pet-store/products", editProductId = null, editProductData = null, onUpdateSuccess = null }) => {
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
  const [showPetTypeDropdown, setShowPetTypeDropdown] = useState(false);
  const petTypeDropdownRef = useRef(null);

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
              id: variant.id || null, // null for POST, number for PUT
              variantType: parsedVariantType,
              quantityValue: parsedQuantityValue,
              pieces: variant.pieces || "",
              sellingPrice: variant.sellingPrice || "",
              mrp: variant.mrp || "",
              discountPercentage: variant.discountPercentage || "",
              skuCode: variant.skuCode || "",
              description: variant.description || "",
              imageUrl: imageUrlsArray.length > 0 ? imageUrlsArray[0] : "",
              imageUrls: imageUrlsArray, // existing images (PUT)
              images: [], // NEW FILES selected
              previewImages: formattedImages, // Preview images (formatted URLs for display)
              sellingPriceError: "", // Error message for selling price validation
            };
          })
        : [{
            id: null,
            variantType: "",
            sellingPrice: "",
            mrp: "",
            discountPercentage: "",
            skuCode: "",
            description: "",
            pieces: 1,
            quantityValue: "",
            imageUrls: [],
            images: []
          }];

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
        // queued deletions for variant images (will be sent after submit)
        deletedVariantImages: [],
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
        variants: [{
          id: null, // null for POST, number for PUT
          variantType: "",
          sellingPrice: "",
          mrp: "",
          discountPercentage: "",
          skuCode: "",
          description: "",
          pieces: 1,
          quantityValue: "",
          imageUrls: [], // existing images (PUT)
          images: [] // NEW FILES selected
        }],
      // queued deletions for variant images (will be sent after submit)
      deletedVariantImages: [],
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

  // Close pet type dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        petTypeDropdownRef.current &&
        !petTypeDropdownRef.current.contains(event.target) &&
        !event.target.closest('[data-pet-type-input]')
      ) {
        setShowPetTypeDropdown(false);
      }
    };

    if (showPetTypeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPetTypeDropdown]);

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

  // const fetchSubCategories = async (categoryId) => {
  //   try {
  //     const response = await webApi.get("vendor/petstore/subcategories", { categoryId });
  //     if (response?.data?.data) {
  //       setSubCategories(response.data.data);
  //     } else {
  //       setSubCategories([]);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching subcategories:", error);
  //     setSubCategories([]);
  //   }
  // };

  const fetchSubCategories = async (categoryId) => {
    try {
      const response = await webApi.get(
        "vendor/petstore/subcategories",
        { categoryId }
      );
  
      if (Array.isArray(response?.data?.data)) {
        const uniqueSubCategories = Array.from(
          new Map(
            response.data.data
              .filter(item => item?.name) // safety check
              .map(item => [
                item.name.trim().toLowerCase(), // remove duplicates (case-insensitive)
                item
              ])
          ).values()
        );
  
        setSubCategories(uniqueSubCategories);
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

  const deleteImagesByVariant = async (productId, selectedImages) => {
    // selectedImages example:
    // [{ variantId: 190, imageUrl }, { variantId: 191, imageUrl }, { variantId: 191, imageUrl }]

    // Filter out any deletions with null/undefined variantId (new variants without IDs)
    const validDeletions = selectedImages.filter(img => img.variantId != null && img.variantId !== undefined && img.imageUrl);

    if (validDeletions.length === 0) {
      return; // No valid deletions to process
    }

    const grouped = validDeletions.reduce((acc, img) => {
      const variantId = img.variantId;
      if (!acc[variantId]) acc[variantId] = [];
      acc[variantId].push(img.imageUrl);
      return acc;
    }, {});

    await Promise.all(
      Object.entries(grouped).map(async ([variantId, urls]) => {
        try {
          await webApi.delete(
            `vendor/petstore/products/${productId}/variant-image`,
            {
              variantId: Number(variantId),
              imageUrls: urls,
            }
          );
        } catch (error) {
          console.error(`Error deleting images for variant ${variantId}:`, error);
          // Continue with other deletions even if one fails
        }
      })
    );
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
      const hasNewVariantImages = formData.variants.some(v => {
        if (!v.images || v.images.length === 0) return false;
        // Check if any image is a File object
        return v.images.some(img => img instanceof File);
      });
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

      // MODE 3: Only variant images changed - Still need to send variants JSON (backend requires it)
      // But we'll send the existing variant data without changes
      if (isEditMode && hasNewVariantImages && !hasVariantDataChanges) {
        // Get deleted image URLs for each variant to exclude them from payload
        const deletedUrlsByVariant = {};
        (formData.deletedVariantImages || []).forEach(item => {
          if (item.variantId && item.imageUrl) {
            if (!deletedUrlsByVariant[item.variantId]) {
              deletedUrlsByVariant[item.variantId] = [];
            }
            deletedUrlsByVariant[item.variantId].push(item.imageUrl);
          }
        });

        // Build variants payload with existing data (no changes to variant fields)
        const variantsData = formData.variants.map((variant, index) => {
          // Collect all existing image URLs
          const existingImageUrls = [];
          
          // Check variant.imageUrls array first
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
          
          // Check variant.previewImages array
          if (variant.previewImages && Array.isArray(variant.previewImages)) {
            variant.previewImages.forEach(img => {
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
          
          // Also check variant.images for existing URLs (not File objects)
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

          // Filter out deleted image URLs for this variant
          const deletedUrls = deletedUrlsByVariant[variant.id] || [];
          const filteredImageUrls = existingImageUrls.filter(url => {
            // Normalize the existing URL for comparison
            const normalizedExisting = url.startsWith('http') 
              ? url 
              : (url.startsWith(IMAGE_URL) ? url : `${IMAGE_URL}${url}`);
            
            // Check against each deleted URL (try multiple formats)
            return !deletedUrls.some(deletedUrl => {
              // Normalize deleted URL in multiple ways
              const normalizedDeleted1 = deletedUrl; // Original format
              const normalizedDeleted2 = deletedUrl.startsWith('http') 
                ? deletedUrl 
                : (deletedUrl.startsWith(IMAGE_URL) ? deletedUrl : `${IMAGE_URL}${deletedUrl}`);
              // Extract path from full URL for comparison
              const pathFromDeleted = deletedUrl.includes('/uploads/') 
                ? deletedUrl.substring(deletedUrl.indexOf('/uploads/'))
                : deletedUrl;
              const pathFromExisting = normalizedExisting.includes('/uploads/')
                ? normalizedExisting.substring(normalizedExisting.indexOf('/uploads/'))
                : normalizedExisting;
              
              // Match if any format matches
              return normalizedDeleted1 === url || 
                     normalizedDeleted1 === normalizedExisting ||
                     normalizedDeleted2 === normalizedExisting ||
                     pathFromDeleted === pathFromExisting;
            });
          });

          // Build variant object with existing data
          const variantObj = {
            id: variant.id || null,
            variantType: variant.variantType || "",
            quantityValue: variant.quantityValue ? parseInt(variant.quantityValue) || null : null,
            pieces: variant.pieces ? parseInt(variant.pieces) || 0 : 0,
            sellingPrice: variant.sellingPrice || "",
            mrp: variant.mrp || "",
            discountPercentage: variant.discountPercentage || "",
            skuCode: variant.skuCode || "",
            description: variant.description || "",
            imageUrls: filteredImageUrls,
            ...(filteredImageUrls.length > 0 && { imageUrl: filteredImageUrls[0] })
          };

          return variantObj;
        });
        
        // Send variants JSON (backend requires it even when only images change)
        const variantsPayload = variantsData.map(v => ({
          id: v.id,
          variantType: v.variantType,
          sellingPrice: v.sellingPrice,
          mrp: v.mrp,
          discountPercentage: v.discountPercentage,
          skuCode: v.skuCode,
          description: v.description || "",
          pieces: v.pieces,
          quantityValue: v.quantityValue,
          imageUrls: v.imageUrls || []
        }));
        formDataToSend.append("variants", JSON.stringify(variantsPayload));
        
        // Send variantImages files - use variant ID for existing variants, index for new ones
        formData.variants.forEach((variant, index) => {
          if (variant.images && variant.images.length > 0) {
            // Filter only File objects (not preview URLs)
            const fileObjects = variant.images.filter(img => img instanceof File);
            if (fileObjects.length > 0) {
              // Use variant ID if it exists (existing variant), otherwise use index (new variant)
              const fieldName = variant.id ? `variantImages_${variant.id}` : `variantImages_${index}`;
              // Append each file with the same field name - backend will receive as array
              fileObjects.forEach((file) => {
                formDataToSend.append(fieldName, file);
              });
            }
          }
        });
      } else {
        // MODE 1: Full update - send complete variants JSON with all required fields
        // Get deleted image URLs for each variant to exclude them from payload
        const deletedUrlsByVariant = {};
        (formData.deletedVariantImages || []).forEach(item => {
          if (item.variantId && item.imageUrl) {
            if (!deletedUrlsByVariant[item.variantId]) {
              deletedUrlsByVariant[item.variantId] = [];
            }
            deletedUrlsByVariant[item.variantId].push(item.imageUrl);
          }
        });

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
          
          // Check variant.previewImages array (preview images - filter out data URLs)
          if (variant.previewImages && Array.isArray(variant.previewImages)) {
            variant.previewImages.forEach(img => {
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
          // Also check variant.images for existing URLs (not File objects)
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

          // Filter out deleted image URLs for this variant
          const deletedUrls = deletedUrlsByVariant[variant.id] || [];
          const filteredImageUrls = existingImageUrls.filter(url => {
            // Normalize the existing URL for comparison
            const normalizedExisting = url.startsWith('http') 
              ? url 
              : (url.startsWith(IMAGE_URL) ? url : `${IMAGE_URL}${url}`);
            
            // Check against each deleted URL (try multiple formats)
            return !deletedUrls.some(deletedUrl => {
              // Normalize deleted URL in multiple ways
              const normalizedDeleted1 = deletedUrl; // Original format
              const normalizedDeleted2 = deletedUrl.startsWith('http') 
                ? deletedUrl 
                : (deletedUrl.startsWith(IMAGE_URL) ? deletedUrl : `${IMAGE_URL}${deletedUrl}`);
              // Extract path from full URL for comparison
              const pathFromDeleted = deletedUrl.includes('/uploads/') 
                ? deletedUrl.substring(deletedUrl.indexOf('/uploads/'))
                : deletedUrl;
              const pathFromExisting = normalizedExisting.includes('/uploads/')
                ? normalizedExisting.substring(normalizedExisting.indexOf('/uploads/'))
                : normalizedExisting;
              
              // Match if any format matches
              return normalizedDeleted1 === url || 
                     normalizedDeleted1 === normalizedExisting ||
                     normalizedDeleted2 === normalizedExisting ||
                     pathFromDeleted === pathFromExisting;
            });
          });

          // Build complete variant object with ALL required fields
          const variantObj = {
            id: variant.id || null, // Include variant ID (null for new variants, number for existing)
            variantType: variant.variantType || "",
            quantityValue: variant.quantityValue ? parseInt(variant.quantityValue) || null : null,
            pieces: variant.pieces ? parseInt(variant.pieces) || 0 : 0,
            sellingPrice: variant.sellingPrice || "",
            mrp: variant.mrp || "",
            discountPercentage: variant.discountPercentage || "",
            skuCode: variant.skuCode || "",
            description: variant.description || "",
            imageUrls: filteredImageUrls, // Always include imageUrls array (even if empty) - filtered to exclude deleted
            ...(filteredImageUrls.length > 0 && { imageUrl: filteredImageUrls[0] }) // Backward compatibility
          };

          return variantObj;
        });
        
        // Send variants JSON WITH IDs and existing imageUrls
        const variantsPayload = variantsData.map(v => ({
          id: v.id, // Include ID (null for new variants, number for existing)
          variantType: v.variantType,
          sellingPrice: v.sellingPrice,
          mrp: v.mrp,
          discountPercentage: v.discountPercentage,
          skuCode: v.skuCode,
          description: v.description || "",
          pieces: v.pieces,
          quantityValue: v.quantityValue,
          imageUrls: v.imageUrls || [] // existing images
        }));
        formDataToSend.append("variants", JSON.stringify(variantsPayload));

        // Upload variant images as files - send in order: all images for variant 0, then variant 1, etc.
        // Use variant ID for existing variants (PUT), index for new variants (POST/PUT)
        formData.variants.forEach((variant, index) => {
          if (variant.images && variant.images.length > 0) {
            // Filter only File objects (not preview URLs)
            const fileObjects = variant.images.filter(img => img instanceof File);
            if (fileObjects.length > 0) {
              // For PUT: use variant ID if it exists (existing variant), otherwise use index (new variant)
              // For POST: use index
              const fieldName = isEditMode && variant.id 
                ? `variantImages_${variant.id}` 
                : `variantImages_${index}`;
              // Append each file with the same field name - backend will receive as array
              // All images for this variant are sent together with the same field name
              fileObjects.forEach((file) => {
                formDataToSend.append(fieldName, file);
              });
            }
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

      // For edit mode: Delete images FIRST, then update product
      if (isEditMode && editProductId) {
        const deletions = formData.deletedVariantImages || [];
        if (deletions.length > 0) {
          try {
            await deleteImagesByVariant(editProductId, deletions);
          } catch (err) {
            console.error('Error deleting variant images before update:', err);
            // Continue with update even if deletes fail
          }
        }
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
        // For new products: Delete images after creation (we now have productId)
        if (!isEditMode) {
          try {
            const deletions = formData.deletedVariantImages || [];
            const productIdToUse = response?.data?.data?.id || response?.data?.id || response?.data?.productId || null;
            if (productIdToUse && deletions.length > 0) {
              await deleteImagesByVariant(productIdToUse, deletions);
            }
          } catch (err) {
            console.error('Error deleting queued variant images:', err);
            // Continue even if deletes fail
          }
        }

        // If adding new, set flag to trigger refetch and navigate to return path
        if (!isEditMode) {
          handleClose();
          if (typeof window !== "undefined") {
            sessionStorage.setItem("productAdded", "true");
          }
          router.push(returnPath);
        } else {
          // For edit mode: fetch updated product data and pass to parent, then close without navigation
          try {
            const updatedResponse = await webApi.get(`vendor/petstore/products/${editProductId}`);
            if (updatedResponse?.data?.data) {
              // Call callback with updated data if provided
              if (onUpdateSuccess) {
                onUpdateSuccess(updatedResponse.data.data);
              }
            }
          } catch (error) {
            console.error("Error fetching updated product:", error);
          }
          // Close the modal without navigating
          handleClose();
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
              <option value="New Born">New Born</option>
              <option value="Small">Small</option>
              <option value="Adult">Adult</option>
              <option value="All Life Stages">All Life Stages</option>
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
                      <label>Enter Pet Type</label>
                      <div style={{ position: 'relative' }}>
                        {/* Input field with selected pet types as chips */}
                        <div
                          data-pet-type-input
                          onClick={() => setShowPetTypeDropdown(!showPetTypeDropdown)}
                          style={{
                            // minHeight: '40px',
                            padding: '9px 12px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                            alignItems: 'center'
                          }}
                        >
                          {formData.petType && formData.petType.length > 0 ? (
                            formData.petType.map((petType) => (
                              <span
                                key={petType}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '4px 8px',
                                  backgroundColor: '#f18a19',
                                  color: '#fff',
                                  borderRadius: '16px',
                                  fontSize: '13px',
                                  gap: '6px'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePetTypeChange(petType);
                                }}
                              >
                                {petType}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePetTypeChange(petType);
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    padding: 0,
                                    marginLeft: '4px',
                                    lineHeight: 1
                                  }}
                                >
                                  ×
                                </button>
                              </span>
                            ))
                          ) : (
                            <span style={{ color: '#999', fontSize: '14px' }}>Select pet types</span>
                          )}
                        </div>

                        {/* Dropdown with checkboxes */}
                        {showPetTypeDropdown && (
                          <div
                            ref={petTypeDropdownRef}
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              marginTop: '4px',
                              backgroundColor: '#fff',
                              border: '1px solid #ddd',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              zIndex: 1000,
                              maxHeight: '200px',
                              overflowY: 'auto',
                              padding: '8px'
                            }}
                          >
                            {['Dog', 'Cat', 'Bird', 'Fish', 'Small Pets'].map((petType) => (
                              <label
                                key={petType}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  padding: '8px',
                                  borderRadius: '4px',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <input
                                  type="checkbox"
                                  name="petType"
                                  value={petType}
                                  checked={formData.petType.includes(petType)}
                                  onChange={() => {
                                    handlePetTypeChange(petType);
                                  }}
                                  style={{
                                    marginRight: '12px',
                                    width: '18px',
                                    height: '18px',
                                    cursor: 'pointer',
                                    accentColor: '#f18a19'
                                  }}
                                />
                                {petType}
                              </label>
                            ))}
                          </div>
                        )}
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
                          <option value="New Born">New Born</option>
                          <option value="Small">Small</option>
                          <option value="Adult">Adult</option>
                          <option value="All Life Stages">All Life Stages</option>
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
                        variants: [...prev.variants, {
                          id: null,
                          variantType: "",
                          sellingPrice: "",
                          mrp: "",
                          discountPercentage: "",
                          skuCode: "",
                          description: "",
                          pieces: 1,
                          quantityValue: "",
                          imageUrls: [],
                          images: []
                        }],
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
                            setFormData(prev => ({ 
                              ...prev, 
                              variants: newVariants.length > 0 ? newVariants : [{
                                id: null,
                                variantType: "",
                                sellingPrice: "",
                                mrp: "",
                                discountPercentage: "",
                                skuCode: "",
                                description: "",
                                pieces: 1,
                                quantityValue: "",
                                imageUrls: [],
                                images: []
                              }] 
                            }));
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
                                const newVariants = [...formData.variants];
                                if (!newVariants[index].images) {
                                  newVariants[index].images = [];
                                }
                                if (!newVariants[index].previewImages) {
                                  newVariants[index].previewImages = [];
                                }
                                
                                // Store File objects in images array
                                newVariants[index].images = [
                                  ...(newVariants[index].images || []),
                                  ...files
                                ];
                                
                                // For preview, create data URLs and store separately
                                const newPreviewImages = [];
                                let loadedCount = 0;
                                
                                files.forEach((file) => {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    newPreviewImages.push(reader.result);
                                    loadedCount++;
                                    
                                    if (loadedCount === files.length) {
                                      // All images loaded, update preview images
                                      newVariants[index].previewImages = [
                                        ...(newVariants[index].previewImages || []),
                                        ...newPreviewImages
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
                          {((variant.previewImages && variant.previewImages.length > 0) || (variant.images && variant.images.some(img => typeof img === 'string'))) && (
                            <div className={styles.variantImagePreviews}>
                              {(variant.previewImages || variant.images || []).map((img, imgIndex) => {
                                // Use preview image if available, otherwise use image (could be URL string)
                                const imageSrc = variant.previewImages && variant.previewImages[imgIndex] 
                                  ? variant.previewImages[imgIndex] 
                                  : (typeof img === 'string' ? img : null);
                                
                                if (!imageSrc) return null;
                                
                                return (
                                  <div key={imgIndex} className={styles.variantImagePreview}>
                                    <Image
                                      src={imageSrc}
                                      alt={`Variant ${index + 1} image ${imgIndex + 1}`}
                                      width={100}
                                      height={100}
                                    />
                                    <button
                                      className={styles.removeImage}
                                      onClick={() => {
                                        const newVariants = [...formData.variants];

                                        // Determine source type
                                        const previewExists = newVariants[index].previewImages && newVariants[index].previewImages.length > 0;
                                        const imagesExists = newVariants[index].images && newVariants[index].images.length > 0;

                                        const previewImg = previewExists ? newVariants[index].previewImages[imgIndex] : null;
                                        const imagesImg = imagesExists ? newVariants[index].images[imgIndex] : null;

                                        const isDataUrlPreview = typeof previewImg === 'string' && previewImg.startsWith('data:');
                                        const isFileObject = imagesImg && !(typeof imagesImg === 'string');

                                        // If it's a local upload preview or File object, just remove locally
                                        if (isDataUrlPreview || isFileObject) {
                                          if (newVariants[index].images) {
                                            newVariants[index].images = newVariants[index].images.filter((_, i) => i !== imgIndex);
                                          }
                                          if (newVariants[index].previewImages) {
                                            newVariants[index].previewImages = newVariants[index].previewImages.filter((_, i) => i !== imgIndex);
                                          }
                                          setFormData(prev => ({ ...prev, variants: newVariants }));
                                          return;
                                        }

                                        // Otherwise treat as existing server image: queue deletion and remove from UI
                                        // Determine image URL to delete - use original format from imageUrls array (not formatted preview)
                                        let imageUrlToDelete = null;
                                        // Prefer original URL from imageUrls array (matches database format)
                                        if (newVariants[index].imageUrls && newVariants[index].imageUrls[imgIndex]) {
                                          const raw = newVariants[index].imageUrls[imgIndex];
                                          // Use the original URL format as stored in database (backend does exact match)
                                          imageUrlToDelete = raw;
                                        } else if (previewImg && typeof previewImg === 'string' && !previewImg.startsWith('data:')) {
                                          // Fallback to preview URL if imageUrls not available (but not data URLs)
                                          imageUrlToDelete = previewImg;
                                        } else if (typeof imagesImg === 'string' && !imagesImg.startsWith('data:')) {
                                          // Fallback to images URL if available (but not data URLs)
                                          imageUrlToDelete = imagesImg;
                                        }

                                        // Remove from arrays in UI
                                        if (newVariants[index].images) {
                                          newVariants[index].images = newVariants[index].images.filter((_, i) => i !== imgIndex);
                                        }
                                        if (newVariants[index].previewImages) {
                                          newVariants[index].previewImages = newVariants[index].previewImages.filter((_, i) => i !== imgIndex);
                                        }
                                        if (newVariants[index].imageUrls) {
                                          newVariants[index].imageUrls = newVariants[index].imageUrls.filter((_, i) => i !== imgIndex);
                                        }

                                        setFormData(prev => ({
                                          ...prev,
                                          variants: newVariants,
                                          deletedVariantImages: [
                                            ...(prev.deletedVariantImages || []),
                                            ...(imageUrlToDelete && newVariants[index]?.id ? [{ variantId: newVariants[index].id, imageUrl: imageUrlToDelete }] : [])
                                          ]
                                        }));
                                      }}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                );
                              })}
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

