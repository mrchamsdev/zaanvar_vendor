"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import styles from "../../styles/pet-store/addProduct.module.css";
import { WebApimanager } from "@/components/utilities/WebApiManager";
import useStore from "@/components/state/useStore";
import { IMAGE_URL } from "@/components/utilities/Constants";

const AddProduct = ({ onClose, returnPath = "/pet-store/products" }) => {
  const router = useRouter();
  const { getJwtToken } = useStore();
  const jwt = getJwtToken();
  const webApi = new WebApimanager(jwt);

  const [currentStep, setCurrentStep] = useState(1);
  const [isMaximized, setIsMaximized] = useState(true);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Images
    frontImage: null,
    frontImageUrl: "",
    backImage: null,
    backImageUrl: "",
    
    // Step 2: Product Info
    petType: [],
    productName: "",
    brandName: "",
    categoryId: "",
    subCategoryId: "",
    features: [],
    description: "",
    
    // Category-specific fields
    clothType: "",
    materialType: "",
    color: "",
    breedSize: "",
    specialIngredients: "",
    flavour: "",
    specificUses: "",
    itemForm: "",
    productBenefits: "",
    specialFeatures: "",
    dimensions: "",
    pattern: "",
    material: "",
    toyType: "",
    recommendedFor: "",
    
    // Step 3: Variants
    variants: [{}], // Initialize with one empty variant
  });

  const frontImageInputRef = useRef(null);
  const backImageInputRef = useRef(null);
  const variantImageInputRefs = useRef({});

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

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
      // For preview, use data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "front") {
          setFormData(prev => ({
            ...prev,
            frontImage: file,
            frontImageUrl: reader.result,
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            backImage: file,
            backImageUrl: reader.result,
          }));
        }
      };
      reader.readAsDataURL(file);

      // Upload image and get URL
      try {
        const formData = new FormData();
        formData.append('image', file);
        
        // Upload to your image upload endpoint
        // This is a placeholder - you'll need to implement your actual image upload API
        // const uploadResponse = await webApi.post('upload/image', formData);
        // const imageUrl = uploadResponse.data.url;
        
        // For now, we'll use the IMAGE_URL prefix with a generated filename
        // In production, you should upload the file and get the actual URL
        const timestamp = Date.now();
        const fileName = `${type}_${timestamp}_${file.name}`;
        const imageUrl = `${IMAGE_URL}${fileName}`;
        
        if (type === "front") {
          setFormData(prev => ({
            ...prev,
            frontImageUrl: imageUrl,
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            backImageUrl: imageUrl,
          }));
        }
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }
  };

  const handleRemoveImage = (type) => {
    if (type === "front") {
      setFormData(prev => ({
        ...prev,
        frontImage: null,
        frontImageUrl: "",
      }));
      if (frontImageInputRef.current) {
        frontImageInputRef.current.value = "";
      }
    } else {
      setFormData(prev => ({
        ...prev,
        backImage: null,
        backImageUrl: "",
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

  const handleFeaturesChange = (feature) => {
    setFormData(prev => {
      const currentFeatures = prev.features || [];
      if (currentFeatures.includes(feature)) {
        return {
          ...prev,
          features: currentFeatures.filter(f => f !== feature),
        };
      } else {
        return {
          ...prev,
          features: [...currentFeatures, feature],
        };
      }
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
      // Prepare payload based on category
      const payload = {
        petType: formData.petType,
        productName: formData.productName,
        brandName: formData.brandName,
        categoryId: parseInt(formData.categoryId),
        subCategoryId: parseInt(formData.subCategoryId),
        features: formData.features,
        description: formData.description,
        frontImageUrl: formData.frontImageUrl?.startsWith('http') 
          ? formData.frontImageUrl 
          : `${IMAGE_URL}${formData.frontImageUrl}`,
        backImageUrl: formData.backImageUrl?.startsWith('http') 
          ? formData.backImageUrl 
          : `${IMAGE_URL}${formData.backImageUrl}`,
        variants: formData.variants.map(variant => ({
          variantType: variant.variantType,
          sellingPrice: variant.sellingPrice,
          mrp: variant.mrp,
          discountPercentage: variant.discountPercentage,
          skuCode: variant.skuCode,
          description: variant.description,
          imageUrl: variant.imageUrls && variant.imageUrls.length > 0 
            ? variant.imageUrls[0] 
            : (variant.images && variant.images.length > 0 
              ? `${IMAGE_URL}${variant.images[0]}` 
              : variant.imageUrl || ""),
        })),
      };

      // Add category-specific fields
      const categoryName = selectedCategory?.name?.toLowerCase() || "";
      
      if (categoryName.includes("cloth")) {
        payload.clothType = formData.clothType;
        payload.materialType = formData.materialType;
        payload.color = formData.color;
        payload.breedSize = formData.breedSize;
      } else if (categoryName.includes("food")) {
        payload.specialIngredients = formData.specialIngredients;
        payload.flavour = formData.flavour;
        payload.breedSize = formData.breedSize;
        payload.specificUses = formData.specificUses;
        payload.itemForm = formData.itemForm;
      } else if (categoryName.includes("grooming")) {
        payload.material = formData.material;
        payload.specificUses = formData.specificUses;
        payload.itemForm = formData.itemForm;
        payload.productBenefits = formData.productBenefits;
      } else if (categoryName.includes("accessor")) {
        payload.specialFeatures = formData.specialFeatures;
        payload.dimensions = formData.dimensions;
        payload.pattern = formData.pattern;
        payload.breedSize = formData.breedSize;
        payload.material = formData.material;
        payload.color = formData.color;
        payload.toyType = formData.toyType;
      }

      const response = await webApi.post("vendor/petstore/products", payload);
      if (response?.data) {
        handleClose();
        // Optionally refresh the products list
        router.push(returnPath);
      }
    } catch (error) {
      console.error("Error submitting product:", error);
    }
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
            <label>Specific uses for product</label>
            <input
              type="text"
              placeholder="Enter the uses"
              value={formData.specificUses}
              onChange={(e) => handleInputChange("specificUses", e.target.value)}
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
    } else if (categoryName.includes("grooming")) {
      return (
        <>
          <div className={styles.formGroup}>
            <label>Material</label>
            <input
              type="text"
              placeholder="Enter Material type eg., spray, shampoo"
              value={formData.material}
              onChange={(e) => handleInputChange("material", e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Specific uses for product</label>
            <input
              type="text"
              placeholder="Enter the uses"
              value={formData.specificUses}
              onChange={(e) => handleInputChange("specificUses", e.target.value)}
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
            <label>Product benefits</label>
            <input
              type="text"
              placeholder="Enter product beefits"
              value={formData.productBenefits}
              onChange={(e) => handleInputChange("productBenefits", e.target.value)}
            />
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
            <label>Dimensions</label>
            <input
              type="text"
              placeholder="Enter dimensions"
              value={formData.dimensions}
              onChange={(e) => handleInputChange("dimensions", e.target.value)}
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
            <label>Material</label>
            <input
              type="text"
              placeholder="Enter Material type eg, Plastic, metal"
              value={formData.material}
              onChange={(e) => handleInputChange("material", e.target.value)}
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
    }
    return null;
  };

  return (
    <>
      <div className={`${styles.addProductModal} ${!isMaximized ? styles.minimized : ""}`}>
        <div className={styles.header}>
          <h2>Add Product</h2>
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
                    >
                      <div className={styles.cameraIcon}>📷</div>
                      <p>Upload the product front image here</p>
                    </div>
                    <input
                      ref={frontImageInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => handleImageUpload("front", e.target.files[0])}
                    />
                    {formData.frontImageUrl && (
                      <div className={styles.imagePreview}>
                        <Image
                          src={formData.frontImageUrl}
                          alt="Front preview"
                          width={100}
                          height={100}
                        />
                        <button
                          className={styles.removeImage}
                          onClick={() => handleRemoveImage("front")}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  <div className={styles.imageUploadBox}>
                    <label>Back image:</label>
                    <div
                      className={styles.uploadArea}
                      onClick={() => backImageInputRef.current?.click()}
                    >
                      <div className={styles.cameraIcon}>📷</div>
                      <p>Upload the product back image here</p>
                    </div>
                    <input
                      ref={backImageInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => handleImageUpload("back", e.target.files[0])}
                    />
                    {formData.backImageUrl && (
                      <div className={styles.imagePreview}>
                        <Image
                          src={formData.backImageUrl}
                          alt="Back preview"
                          width={100}
                          height={100}
                        />
                        <button
                          className={styles.removeImage}
                          onClick={() => handleRemoveImage("back")}
                        >
                          ✕
                        </button>
                      </div>
                    )}
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
                  </div>

                  <div className={styles.formColumn}>
                    <div className={styles.formGroup}>
                      <label>Brand Name</label>
                      <input
                        type="text"
                        placeholder="Enter Brand name"
                        value={formData.brandName}
                        onChange={(e) => handleInputChange("brandName", e.target.value)}
                      />
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

                    <div className={styles.formGroup}>
                      <label>Features</label>
                      <div className={styles.chipInput}>
                        {formData.features.map((feature) => (
                          <span key={feature} className={styles.chip}>
                            {feature}
                            <button onClick={() => handleFeaturesChange(feature)}>✕</button>
                          </span>
                        ))}
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleFeaturesChange(e.target.value);
                              e.target.value = "";
                            }
                          }}
                        >
                          <option value="">Select Suitable pet</option>
                          <option value="Warm">Warm</option>
                          <option value="Waterproof">Waterproof</option>
                          <option value="Durable">Durable</option>
                        </select>
                        <button className={styles.addBtn}>+</button>
                      </div>
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
                    <div key={index} className={styles.variantCard}>
                      <div className={styles.variantFormGrid}>
                        {/* Two-column layout for top fields */}
                        <div className={styles.variantFormRow}>
                          <div className={styles.formGroup}>
                            <label>Select Variant Type (food: kg's, Cloths: size, Grooming: ml)</label>
                            <input
                              type="text"
                              placeholder="Enter pet Name"
                              value={variant.variantType || ""}
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                newVariants[index] = { ...variant, variantType: e.target.value };
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
                                newVariants[index] = { ...variant, sellingPrice: parseInt(e.target.value) || 0 };
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
                                newVariants[index] = { ...variant, mrp: parseInt(e.target.value) || 0 };
                                setFormData(prev => ({ ...prev, variants: newVariants }));
                              }}
                            />
                          </div>
                          <div className={styles.formGroup}>
                            <label>Discount Percentage</label>
                            <input
                              type="number"
                              placeholder="Enter discount percentage"
                              value={variant.discountPercentage || ""}
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                newVariants[index] = { ...variant, discountPercentage: parseInt(e.target.value) || 0 };
                                setFormData(prev => ({ ...prev, variants: newVariants }));
                              }}
                            />
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
                        </div>

                        {/* Full width Description */}
                        <div className={styles.formGroup}>
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
                        </div>

                        {/* Image Upload Section */}
                        <div className={styles.formGroup}>
                          <label>Upload Image</label>
                          <div
                            className={styles.uploadArea}
                            onClick={() => {
                              const input = variantImageInputRefs.current[`variant-${index}`];
                              if (input) input.click();
                            }}
                          >
                            <div className={styles.cameraIcon}>📷</div>
                            <p>Upload the product front image here</p>
                          </div>
                          <input
                            ref={(el) => {
                              variantImageInputRefs.current[`variant-${index}`] = el;
                            }}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (file) {
                                // For preview, use data URL
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const newVariants = [...formData.variants];
                                  if (!newVariants[index].images) {
                                    newVariants[index].images = [];
                                  }
                                  newVariants[index].images = [...(newVariants[index].images || []), reader.result];
                                  setFormData(prev => ({ ...prev, variants: newVariants }));
                                };
                                reader.readAsDataURL(file);

                                // Upload image and get URL with IMAGE_URL prefix
                                try {
                                  const timestamp = Date.now();
                                  const fileName = `variant_${index}_${timestamp}_${file.name}`;
                                  const imageUrl = `${IMAGE_URL}${fileName}`;
                                  
                                  const newVariants = [...formData.variants];
                                  if (!newVariants[index].imageUrls) {
                                    newVariants[index].imageUrls = [];
                                  }
                                  newVariants[index].imageUrls = [...(newVariants[index].imageUrls || []), imageUrl];
                                  setFormData(prev => ({ ...prev, variants: newVariants }));
                                } catch (error) {
                                  console.error("Error uploading variant image:", error);
                                }
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
                                      newVariants[index].images = newVariants[index].images.filter((_, i) => i !== imgIndex);
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
                  Submit
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

