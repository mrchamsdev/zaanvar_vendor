import React, { useState, useEffect, useRef } from "react";
import styles from "../../styles/inventory/productForm.module.css";
// import BarcodeScanner from "./BarcodeScanner";
import useStore from "../state/useStore";
import { productService } from "../../services/productService";
import ConfirmationModal from "./ConfirmationModal";
import { toast } from "sonner";

const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconScan = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
    <path d="M7 12h10" />
  </svg>
);
const IconTrash = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
);

const RETAIL_CATEGORIES = ["Food", "Cloths", "Accessories", "Grooming"];
const PET_TYPES = ["Dog", "Cat", "Bird", "Fish", "Small pets"];
const PACK_TYPES = [
  "BAGS (Bag)", "BOTTLES (Btl)", "BOX (Box)", "BUNDLES (Bdl)", "CANS (Can)", 
  "CARTONS (Ctn)", "DIMENSIONS (Dim)", "GRAMMES (Gm)", "KILOGRAMS (Kg)", 
  "LITRE (Ltr)", "METERS (Mtr)", "MILILITRE (Ml)", "PACKS (Pac)", 
  "PAIRS (Prs)", "PIECES (Pcs)", "QUINTAL (Qtl)", "ROLLS (Rol)"
];
const UNIT_TYPES = ["g", "kg", "ml", "ltr", "mtr"];
const CLOTHES_SIZES = ["2XS", "XS", "S", "M", "L", "XL", "2XL"];
const PAIRS_SIZES = ["1", "2", "3", "4", "5", "6", "7"];
const DIMENSION_UNITS = ["mm", "cm", "inches"];

const DIRECT_MEASURE_TYPES = ["GRAMMES (Gm)", "KILOGRAMS (Kg)", "LITRE (Ltr)", "MILILITRE (Ml)", "METERS (Mtr)", "QUINTAL (Qtl)", "ROLLS (Rol)"];
const PACKAGING_TYPES = ["BOX (Box)", "PACKS (Pac)", "BOTTLES (Btl)", "CARTONS (Ctn)", "BUNDLES (Bdl)", "CANS (Can)", "BAGS (Bag)"];
const SIZE_TYPES = ["PIECES (Pcs)", "PAIRS (Prs)"];
const DIMENSION_TYPES = ["DIMENSIONS (Dim)"];

const CATEGORY_MAP = {
  "Food": 1,
  "Grooming": 1,
  "Toys": 2,
  "Cloths": 2, // Map to Toys/Apparel ID
  "Accessories": 3,
  "Medicines": 3
};

const SUB_CATEGORY_MAP = {
  "Dry": 5,
  "Wet": 6,
  "Puppy": 7,
  "Adult": 8
};

const ProductForm = ({ initialData, onSave, onBack, productType: propType }) => {
  const { jwtToken, userInfo } = useStore();

  // Main Form State
  const [productType, setProductType] = useState(initialData?.productType || propType || "Retail");
  const [productName, setProductName] = useState(initialData?.productName || "");
  const [brand, setBrand] = useState(initialData?.brand || "");
  const [category, setCategory] = useState(() => {
    const raw = initialData?.categoryId;
    let name = "";
    if (typeof raw === 'object' && raw?.category) name = raw.category;
    else if (Array.isArray(raw)) name = raw[0];
    else name = raw || "";
    
    // Match against RETAIL_CATEGORIES case-insensitively
    const match = RETAIL_CATEGORIES.find(c => c.toLowerCase() === String(name).toLowerCase());
    return match || name;
  });
  const [subCategory, setSubCategory] = useState(() => {
    const raw = initialData?.subCategoryId;
    if (typeof raw === 'object' && raw?.subCategory) return raw.subCategory;
    if (Array.isArray(raw)) return raw[0];
    return raw || "";
  });
  const [selectedPetTypes, setSelectedPetTypes] = useState(() => {
    if (initialData?.productPetType && Array.isArray(initialData.productPetType)) {
        const reverseMap = { "Dog": "Dog", "Cat": "Cat", "Birds": "Bird", "Fishes": "Fish", "SmallPets": "Small pets" };
        return initialData.productPetType.map(t => reverseMap[t] || t);
    }
    return [];
  });
  const [isPetDropdownOpen, setIsPetDropdownOpen] = useState(false);
  const petDropdownRef = useRef(null);
  const [productCode, setProductCode] = useState(initialData?.ProductCode || "");
  const [gst, setGst] = useState(initialData?.gst || "");
  const [hsnCode, setHsnCode] = useState(initialData?.hsnCode || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [composition, setComposition] = useState(initialData?.composition || "");
  const [showVariantDeleteConfirm, setShowVariantDeleteConfirm] = useState(false);
  const [variantToDeleteIndex, setVariantToDeleteIndex] = useState(null);
  const [isDeletingVariant, setIsDeletingVariant] = useState(false);
  
  // Variants State
  const [variants, setVariants] = useState(() => {
    if (initialData?.variants?.length > 0) {
      return initialData.variants.map(v => {
        // Parse size like "2ml" into value and unit for the UI
        let measure = "";
        let unit = "";
        const sizeStr = v.variantType?.size || "";
        const match = sizeStr.match(/^(\d+(?:\.\d+)?)(.*)$/);
        if (match) {
          measure = match[1];
          unit = match[2];
        }

        return {
          ...v,
          variantId: v.variantId,
          packType: v.variantType?.packType || "",
          packCount: v.variantType?.packCount || "",
          flavor: v.variantType?.flavor || "",
          size: v.variantType?.size || "",
          unitMeasure: measure || v.variantMeasure || "",
          unitType: unit || v.sizeType?.[0] || "",
          skuNumber: v.SKU || "",
          eanUpc: v.barcode || v.eanUpcNumber || "",
          minStock: v.minStockAlert ?? 0,
          images: (v.productImgs || v.productImages || [])?.map(img => 
            typeof img === 'string' ? { preview: img, file: null } : img
          ) || []
        };
      });
    }
    return [{ packType: "", images: [] }];
  });
  
  const fileInputsRef = useRef([]); // To handle multiple variants
  const handleImageChange = (e, index) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    const newVariants = [...variants];
    newVariants[index].images = [...(newVariants[index].images || []), ...newImages];
    setVariants(newVariants);
    
    e.target.value = null;
  };

  const removeImage = (e, variantIndex, imgIndex) => {
    e.stopPropagation();
    const newVariants = [...variants];
    const targetVariant = newVariants[variantIndex];
    
    if (targetVariant.images[imgIndex].file) {
        URL.revokeObjectURL(targetVariant.images[imgIndex].preview);
    }
    
    targetVariant.images.splice(imgIndex, 1);
    setVariants(newVariants);
  };
  
  const handleGenerateProductCode = async () => {
    try {
      const response = await productService.generateProductCode(jwtToken);
      if (response?.data?.data?.productCode) {
        setProductCode(response.data.data.productCode);
      }
    } catch (error) {
      console.error("Error generating product code:", error);
    }
  };

  const handleGenerateSku = async (index) => {
    try {
      const response = await productService.generateSku(jwtToken);
      if (response?.data?.data?.sku) {
        updateVariant(index, 'skuNumber', response.data.data.sku);
      }
    } catch (error) {
      console.error("Error generating SKU:", error);
    }
  };

  const handleSave = async () => {
    try {
      // Mapping names to numeric IDs for the [1, 5] payload structure
      const catId = CATEGORY_MAP[category] || 1;
      const subCatId = SUB_CATEGORY_MAP[subCategory] || 5;
      
      const petTypeMap = {
        "Dog": "Dog",
        "Cat": "Cat",
        "Bird": "Birds",
        "Fish": "Fishes",
        "Small pets": "SmallPets"
      };
      const formattedPetTypes = selectedPetTypes.map(t => petTypeMap[t] || t);
      const userId = userInfo?.userId || userInfo?.id || userInfo?._id || 1;

      const payload = {
        branchId: userInfo?.branchId || 1,
        productName: productName,
        ProductCode: productCode,
        brand: brand,
        categoryId: { category: category?.toLowerCase() },
        subCategoryId: { subCategory: subCategory?.toLowerCase() },
        productType: productType,
        productPetType: formattedPetTypes,
        hsnCode: hsnCode,
        variants: variants.map(v => ({
          mrp: Number(v.mrp) || 0,
          sellingPrice: Number(v.sellingPrice) || 0,
          minStockAlert: Number(v.minStock) || 0,
          SKU: v.skuNumber || "",
          barcode: v.eanUpc || "",
          isActive: true,
          variantType: {
            flavor: v.flavor || "",
            size: v.size || (v.unitMeasure ? `${v.unitMeasure}${v.unitType}` : ""),
            packType: v.packType || "",
            packCount: v.packCount || "",
            dimensions: v.height ? `${v.height}${v.heightUnit}x${v.width}${v.widthUnit}x${v.length}${v.lengthUnit}` : ""
          }
        }))
      };

      let response;
      if (initialData?.productId) {
        response = await productService.updateProduct(jwtToken, initialData.productId, payload, false);
      } else {
        response = await productService.createProduct(jwtToken, payload, false);
      }
      
      console.log("Metadata save response body:", response);

      if (response) {
        const responseVariants = response.data?.variants || response.variants || [];
        
        console.log(`Starting per-variant image upload for ${variants.length} variants...`);
        
        for (let i = 0; i < variants.length; i++) {
          const formVariant = variants[i];
          const backendVariant = responseVariants[i];
          const targetId = backendVariant?.variantId || backendVariant?.id || formVariant.variantId;
          
          const variantImages = formVariant.images || [];
          const imageFiles = variantImages.filter(img => img.file).map(img => img.file);
          
          if (imageFiles.length > 0 && targetId) {
            console.log(`Uploading ${imageFiles.length} images for Variant ID: ${targetId}`);
            for (const file of imageFiles) {
              const formData = new FormData();
              formData.append("productImgs", file);
              try {
                await productService.uploadProductImages(jwtToken, targetId, formData);
              } catch (uploadError) {
                console.error(`Failed to upload image for variant ${targetId}:`, uploadError);
              }
            }
          }
        }
        
        console.log("All variant image uploads processed.");
        if (onSave) onSave();
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save product. Please try again.");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (petDropdownRef.current && !petDropdownRef.current.contains(event.target)) {
        setIsPetDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePetTypeToggle = (type) => {
    setSelectedPetTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleSelectAllPetTypes = () => {
    if (selectedPetTypes.length === PET_TYPES.length) {
      setSelectedPetTypes([]);
    } else {
      setSelectedPetTypes([...PET_TYPES]);
    }
  };

  const addVariant = () => setVariants([...variants, { packType: "", images: [] }]);
  
  const removeVariant = (index) => {
    const targetVariant = variants[index];
    
    // If it's an existing variant (has variantId), show confirmation modal
    if (targetVariant.variantId) {
      setVariantToDeleteIndex(index);
      setShowVariantDeleteConfirm(true);
    } else {
      // If it's a new unsaved variant, just remove it from state
      const newVariants = variants.filter((_, i) => i !== index);
      setVariants(newVariants.length > 0 ? newVariants : [{ packType: "", images: [] }]);
    }
  };

  const executeVariantDelete = async () => {
    if (variantToDeleteIndex === null) return;
    
    const targetVariant = variants[variantToDeleteIndex];
    if (!targetVariant.variantId) return;

    setIsDeletingVariant(true);
    try {
      const res = await productService.deleteVariant(jwtToken, targetVariant.variantId);
      if (res?.status === 200 || res?.data?.status === "success") {
        toast.success("Variant deleted successfully");
        const newVariants = variants.filter((_, i) => i !== variantToDeleteIndex);
        setVariants(newVariants.length > 0 ? newVariants : [{ packType: "", images: [] }]);
      } else {
        toast.error("Failed to delete variant");
      }
    } catch (error) {
      console.error("Error deleting variant:", error);
      toast.error("An error occurred while deleting the variant");
    } finally {
      setIsDeletingVariant(false);
      setShowVariantDeleteConfirm(false);
      setVariantToDeleteIndex(null);
    }
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const InfoIcon = ({ text }) => (
    <span className={styles.infoIcon} data-tooltip={text}>ⓘ</span>
  );

  return (
    <div className={styles.formCard}>
      <div className={styles.sectionTitle}>Enter product information</div>
      <div className={styles.tabs} style={{marginBottom: 32}}>
        <button 
          className={`${styles.tab} ${productType === "Retail" ? styles.tabActive : ""}`}
          onClick={() => setProductType("Retail")}
        >
          Retail Product
        </button>
        <button 
          className={`${styles.tab} ${productType === "Medical" ? styles.tabActive : ""}`}
          onClick={() => setProductType("Medical")}
        >
          Medical Products
        </button>
      </div>

      <div className={styles.sectionTitle}>Product Details</div>
      <div className={styles.inputGrid}>
        <div className={styles.inputField}>
          <label>Product Name <span>*</span></label>
          <input 
            type="text" 
            placeholder="Enter Product Name" 
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
        </div>
        <div className={styles.inputField}>
          <label>Brand Name</label>
          <input 
            type="text" 
            placeholder="Enter Brand name" 
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
        </div>
        <div className={styles.inputField}>
          <label>Category <span>*</span></label>
          {productType === "Retail" ? (
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select Category here</option>
              {RETAIL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : (
            <div style={{display: 'flex', gap: 8}}>
                <input 
                  type="text" 
                  placeholder="Medicine" 
                  style={{flex: 1}} 
                  value={category || "Medicine"} 
                  onChange={(e) => setCategory(e.target.value)}
                />
                <button className={styles.pageBtn} style={{background: '#eee', whiteSpace: 'nowrap'}}>Enter Category</button>
            </div>
          )}
        </div>
        <div className={styles.inputField}>
          <label>Sub Category</label>
          <input 
            type="text" 
            placeholder="Enter Sub Category" 
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
          />
        </div>
        <div className={styles.inputField}>
          <label>Pet Type <span>*</span></label>
          <div 
            className={styles.multiSelectContainer} 
            ref={petDropdownRef}
            onClick={() => setIsPetDropdownOpen(!isPetDropdownOpen)}
          >
            {selectedPetTypes.length === 0 && <span style={{color: '#999', fontSize: 13}}>Select Pet Types...</span>}
            {selectedPetTypes.map(t => (
              <div key={t} className={styles.tag}>
                {t}
                <span 
                  className={styles.removeTag} 
                  onClick={(e) => { e.stopPropagation(); handlePetTypeToggle(t); }}
                >
                  ✕
                </span>
              </div>
            ))}
            
            {isPetDropdownOpen && (
              <div className={styles.optionsDropdown} onClick={(e) => e.stopPropagation()}>
                {PET_TYPES.filter(t => !selectedPetTypes.includes(t)).map(t => (
                  <div 
                    key={t} 
                    className={styles.optionItem}
                    onClick={() => { handlePetTypeToggle(t); setIsPetDropdownOpen(false); }}
                  >
                    {t}
                  </div>
                ))}
                {PET_TYPES.filter(t => !selectedPetTypes.includes(t)).length === 0 && (
                  <div className={styles.optionItem} style={{color: '#999', cursor: 'default'}}>All types selected</div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className={styles.inputField}>
          <label>Product Code <span>*</span></label>
          <div style={{display: 'flex', gap: 8}}>
            <input 
              type="text" 
              placeholder="Enter product code" 
              style={{flex: 1}} 
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
            />
            <button 
                className={styles.pageBtn} 
                style={{background: '#eee', whiteSpace: 'nowrap'}}
                onClick={handleGenerateProductCode}
            >
                Assign Code
            </button>
          </div>
        </div>
      </div>

      <div className={styles.sectionTitle}>Tax information</div>
      <div className={styles.inputGrid}>
        <div className={styles.inputField}>
          <label>GST(%) <InfoIcon text="Goods and Services Tax percentage." /></label>
          <input 
            type="text" 
            placeholder="Enter GST(%) here" 
            value={gst}
            onChange={(e) => setGst(e.target.value)}
          />
        </div>
        <div className={styles.inputField}>
          <label>HSN Code <span>*</span></label>
          <input 
            type="text" 
            placeholder="Enter HSN Code here" 
            value={hsnCode}
            onChange={(e) => setHsnCode(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.sectionTitle} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        Variants
        <div className={styles.variantActions}>
          <button className={styles.pageBtn} style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '6px 16px'}} onClick={addVariant}>
            <IconPlus /> Add Variant
          </button>
        </div>
      </div>

      {variants.map((variant, index) => {
        const isDirect = DIRECT_MEASURE_TYPES.includes(variant.packType);
        const isPackaged = PACKAGING_TYPES.includes(variant.packType);
        const isSizeBased = SIZE_TYPES.includes(variant.packType);
        const isDimensional = DIMENSION_TYPES.includes(variant.packType);

        return (
          <div key={index} className={styles.variantBox}>
            <div className={styles.variantHeader}>
              <div style={{fontWeight: 600, fontSize: 14, color: '#666'}}>Variant #{index + 1}</div>
              <div className={styles.variantActions}>
                <span className={styles.windowActionIcon} onClick={() => console.log("Scan triggered")} title="Scan Barcode"><IconScan /></span>
                <span className={styles.windowActionIcon} style={{color: '#ff4d4f'}} onClick={() => removeVariant(index)} title="Remove Variant"><IconTrash /></span>
              </div>
            </div>

            <div className={styles.inputGrid}>
              <div className={styles.inputField}>
                <label>Pack Type <span>*</span> <InfoIcon text="Outer packing type of the product." /></label>
                <select 
                  value={variant.packType || ""} 
                  onChange={(e) => updateVariant(index, 'packType', e.target.value)}
                >
                  <option value="">Select Pack Type</option>
                  {PACK_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {isPackaged && (
                <>
                  <div className={styles.inputField}>
                    <label>Pack Count <InfoIcon text="How many pieces/items are inside that pack." /></label>
                    <input 
                        type="text" 
                        placeholder="Enter count" 
                        value={variant.packCount || ""} 
                        onChange={(e) => updateVariant(index, 'packCount', e.target.value)}
                    />
                  </div>
      {/* Unit Type is now merged with Unit Measure in the section below */}
                </>
              )}

              {isSizeBased && (
                 <>
                  <div className={styles.inputField}>
                    <label>Pack Count <InfoIcon text="How many pieces/items are inside that pack." /></label>
                    <input 
                        type="text" 
                        placeholder="Enter count" 
                        value={variant.packCount || ""} 
                        onChange={(e) => updateVariant(index, 'packCount', e.target.value)}
                    />
                  </div>
                  <div className={styles.inputField}>
                    <label>Size <span>*</span> <InfoIcon text="The specific size of the item." /></label>
                    <select value={variant.size || ""} onChange={(e) => updateVariant(index, 'size', e.target.value)}>
                        <option value="">Select size</option>
                        {variant.packType === "PIECES (Pcs)" 
                          ? CLOTHES_SIZES.map(s => <option key={s} value={s}>{s}</option>)
                          : PAIRS_SIZES.map(s => <option key={s} value={s}>{s}</option>)
                        }
                    </select>
                  </div>
                 </>
              )}

              {isDimensional && (
                <div className={styles.dimensionalGrid} style={{gridColumn: 'span 2'}}>
                  <div className={styles.dimensionItem}>
                    <label>Height</label>
                    <div className={styles.dimInputGroup}>
                      <input 
                        type="text" 
                        placeholder="0" 
                        value={variant.height || ""} 
                        onChange={(e) => updateVariant(index, 'height', e.target.value)} 
                      />
                      <select value={variant.heightUnit || "mm"} onChange={(e) => updateVariant(index, 'heightUnit', e.target.value)}>
                        {DIMENSION_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className={styles.dimensionItem}>
                    <label>Width</label>
                    <div className={styles.dimInputGroup}>
                      <input 
                        type="text" 
                        placeholder="0" 
                        value={variant.width || ""} 
                        onChange={(e) => updateVariant(index, 'width', e.target.value)} 
                      />
                      <select value={variant.widthUnit || "mm"} onChange={(e) => updateVariant(index, 'widthUnit', e.target.value)}>
                        {DIMENSION_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className={styles.dimensionItem}>
                    <label>Length</label>
                    <div className={styles.dimInputGroup}>
                      <input 
                        type="text" 
                        placeholder="0" 
                        value={variant.length || ""} 
                        onChange={(e) => updateVariant(index, 'length', e.target.value)} 
                      />
                      <select value={variant.lengthUnit || "mm"} onChange={(e) => updateVariant(index, 'lengthUnit', e.target.value)}>
                        {DIMENSION_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className={styles.dimensionItem}>
                    <label>Radius</label>
                    <div className={styles.dimInputGroup}>
                      <input 
                        type="text" 
                        placeholder="0" 
                        value={variant.radius || ""} 
                        onChange={(e) => updateVariant(index, 'radius', e.target.value)} 
                      />
                      <select value={variant.radiusUnit || "mm"} onChange={(e) => updateVariant(index, 'radiusUnit', e.target.value)}>
                        {DIMENSION_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {(isDirect || (isPackaged && variant.packType !== "PACKS (Pac)")) && (
                <div className={styles.inputField}>
                  <label>Unit Measure <span>*</span> <InfoIcon text="Measurement value of one piece/item inside the pack." /></label>
                  <div className={styles.dimInputGroup}>
                    <input 
                      type="text" 
                      placeholder="Enter here" 
                      value={variant.unitMeasure || ""}
                      onChange={(e) => updateVariant(index, 'unitMeasure', e.target.value)}
                     />
                    <select value={variant.unitType || ""} onChange={(e) => updateVariant(index, 'unitType', e.target.value)}>
                        <option value="">unit</option>
                        {UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div className={styles.inputField}>
                <label>EAN/UPC Number</label>
                <input 
                    type="text" 
                    placeholder="Enter EAN/UPC number" 
                    value={variant.eanUpc || ""}
                    onChange={(e) => updateVariant(index, 'eanUpc', e.target.value)}
                />
              </div>
                <div className={styles.inputField}>
                  <label>SKU Number</label>
                  <div style={{display: 'flex', gap: 8}}>
                    <input 
                        type="text" 
                        placeholder="Enter SKU Number" 
                        style={{flex: 1}}
                        value={variant.skuNumber || ""}
                        onChange={(e) => updateVariant(index, 'skuNumber', e.target.value)}
                    />
                    <button 
                        className={styles.pageBtn} 
                        style={{background: '#eee', padding: '0 8px', fontSize: 11}}
                        onClick={() => handleGenerateSku(index)}
                    >
                        Assign SKU
                    </button>
                  </div>
                </div>
              <div className={styles.inputField}>
                <label>Min Stock Alert</label>
                <input 
                    type="text" 
                    placeholder="Enter SKU Number" 
                    value={variant.minStock || ""}
                    onChange={(e) => updateVariant(index, 'minStock', e.target.value)}
                />
              </div>
              <div className={styles.inputField}>
                <label>MRP <span>*</span></label>
                <input 
                    type="text" 
                    placeholder="Enter MRP here" 
                    value={variant.mrp || ""}
                    onChange={(e) => updateVariant(index, 'mrp', e.target.value)}
                />
              </div>
              <div className={styles.inputField}>
                <label>Selling Price <span>*</span></label>
                <input 
                    type="text" 
                    placeholder="Enter selling price here" 
                    value={variant.sellingPrice || ""}
                    onChange={(e) => updateVariant(index, 'sellingPrice', e.target.value)}
                />
              </div>
            </div>

            {/* Per-Variant Image Upload Section */}
            <div className={styles.inputField} style={{marginTop: 24}}>
              <label>Variant Images <InfoIcon text="Images specific to this configuration (e.g. specific color/flavor)." /></label>
              <div className={styles.imageUpload}>
                <input 
                  type="file" 
                  ref={el => fileInputsRef.current[index] = el}
                  onChange={(e) => handleImageChange(e, index)} 
                  multiple 
                  accept="image/*" 
                  style={{display: 'none'}} 
                />
                <div className={styles.uploadItem} onClick={() => fileInputsRef.current[index]?.click()}>
                  <div style={{fontSize: 24, marginBottom: 8}}>+</div>
                  <span>Add Photos</span>
                </div>
                {(variant.images || []).map((img, imgIdx) => (
                  <div key={imgIdx} className={styles.imagePreview}>
                      <img src={img.preview} alt={`Variant ${index} Img ${imgIdx}`} />
                      <button 
                          className={styles.removeImageBtn} 
                          onClick={(e) => removeImage(e, index, imgIdx)}
                          title="Remove Image"
                      >
                          ✕
                      </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      <div className={styles.sectionTitle}>Additional information of product</div>
      <div className={styles.inputGrid}>
        <div className={styles.inputField} style={{gridColumn: productType === "Medical" ? 'span 1' : 'span 2'}}>
          <label>Add Product Description</label>
          <textarea 
            rows="4" 
            placeholder="Type here"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>
        {productType === "Medical" && (
          <div className={styles.inputField} style={{gridColumn: 'span 1'}}>
            <label>Product Composition <InfoIcon text="Ingredients or chemical makeup." /></label>
            <textarea 
              rows="4" 
              placeholder="Type here"
              value={composition}
              onChange={(e) => setComposition(e.target.value)}
            ></textarea>
          </div>
        )}
      </div>


      <div style={{display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 40, marginBottom: 20}}>
        <button className={styles.pageBtn} onClick={onBack}>Back</button>
        <button 
            className={`${styles.pageBtn} ${styles.nextBtn}`} 
            onClick={handleSave} 
            style={{background: '#000', color: '#fff'}}
        >
            Save
        </button>
      </div>

      <ConfirmationModal 
        isOpen={showVariantDeleteConfirm}
        title="Delete Variant?"
        message="Are you sure you want to delete this variant? This action cannot be undone."
        onConfirm={executeVariantDelete}
        onCancel={() => setShowVariantDeleteConfirm(false)}
        confirmText={isDeletingVariant ? "Deleting..." : "Yes"}
      />
    </div>
  );
};

export default ProductForm;
