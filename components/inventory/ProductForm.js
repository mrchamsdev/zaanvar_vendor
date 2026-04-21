import React, { useState, useEffect } from "react";
import styles from "../../styles/inventory/inventory.module.css";
// import BarcodeScanner from "./BarcodeScanner";
import useStore from "../state/useStore";
import { productService } from "../../services/productService";

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

const ProductForm = ({ initialData, onSave, onBack, productType: propType }) => {
  const { jwtToken } = useStore();

  // Main Form State
  const [productType, setProductType] = useState(initialData?.productType || propType || "Retail");
  const [productName, setProductName] = useState(initialData?.productName || "");
  const [brand, setBrand] = useState(initialData?.brand || "");
  const [category, setCategory] = useState(Array.isArray(initialData?.categoryId) ? initialData.categoryId[0] : (initialData?.categoryId || ""));
  const [subCategory, setSubCategory] = useState(Array.isArray(initialData?.subCategoryId) ? initialData.subCategoryId[0] : (initialData?.subCategoryId || ""));
  const [petType, setPetType] = useState(initialData?.productPetType || "");
  const [productCode, setProductCode] = useState(initialData?.ProductCode || "");
  const [gst, setGst] = useState(initialData?.gst || "");
  const [hsnCode, setHsnCode] = useState(initialData?.hsnCode || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [composition, setComposition] = useState(initialData?.composition || "");
  
  // Variants State
  const [variants, setVariants] = useState(initialData?.variants?.length > 0 ? initialData.variants : [{ packType: "" }]);
  
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

  const addVariant = () => setVariants([...variants, { packType: "" }]);
  const removeVariant = (index) => {
    const newVariants = variants.filter((_, i) => i !== index);
    setVariants(newVariants.length > 0 ? newVariants : [{ packType: "" }]);
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
          style={{borderRadius: 8, height: 40, border: '1px solid #ddd'}}
        >
          Retail Product
        </button>
        <button 
          className={`${styles.tab} ${productType === "Medical" ? styles.tabActive : ""}`}
          onClick={() => setProductType("Medical")}
          style={{borderRadius: 8, height: 40, border: '1px solid #ddd'}}
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
          <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)}>
             <option value="">Select Sub Category</option>
             {Array.isArray(initialData?.subCategoryId) && initialData.subCategoryId.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className={styles.inputField}>
          <label>Pet Type <span>*</span></label>
          <div style={{display: 'flex', alignItems: 'center'}}>
            <select style={{flex: 1}} value={petType} onChange={(e) => setPetType(e.target.value)}>
                <option value="">Select Pet Type</option>
                {PET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <InfoIcon text="The target animal type for this product." />
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
                Assigned Code
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
          <span className={styles.windowActionIcon} onClick={addVariant} title="Add Variant"><IconPlus /></span>
          <span className={styles.windowActionIcon} onClick={() => console.log("Scan triggered")} title="Scan Barcode"><IconScan /></span>
          <span className={styles.windowActionIcon} style={{color: '#ff4d4f'}} onClick={() => removeVariant(variants.length - 1)} title="Remove Last"><IconX /></span>
        </div>
      </div>

      {variants.map((variant, index) => {
        const isDirect = DIRECT_MEASURE_TYPES.includes(variant.packType);
        const isPackaged = PACKAGING_TYPES.includes(variant.packType);
        const isSizeBased = SIZE_TYPES.includes(variant.packType);
        const isDimensional = DIMENSION_TYPES.includes(variant.packType);

        return (
          <div key={index} className={styles.variantBox}>
            {variants.length > 1 && (
              <button 
                onClick={() => removeVariant(index)}
                style={{position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4f'}}
              >
                <IconX />
              </button>
            )}

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
                  {isPackaged && variant.packType !== "PACKS (Pac)" && (
                    <div className={styles.inputField}>
                      <label>Unit Type <InfoIcon text="Measurement type of one piece/item inside the pack." /></label>
                      <select value={variant.unitType || ""} onChange={(e) => updateVariant(index, 'unitType', e.target.value)}>
                          <option value="">Select unit</option>
                          {UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  )}
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
                  <input 
                    type="text" 
                    placeholder="Enter here" 
                    value={variant.unitMeasure || ""}
                    onChange={(e) => updateVariant(index, 'unitMeasure', e.target.value)}
                   />
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
                        Assign
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
          </div>
        );
      })}

      <div className={styles.sectionTitle}>Additional information of product</div>
      <div className={styles.inputGrid}>
        <div className={styles.inputField} style={{gridColumn: 'span 1'}}>
          <label>Add Product Description</label>
          <textarea 
            rows="4" 
            placeholder="Type here"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>
        <div className={styles.inputField} style={{gridColumn: 'span 1'}}>
          <label>Product Composition <InfoIcon text="Ingredients or chemical makeup." /></label>
          <textarea 
            rows="4" 
            placeholder="Type here"
            value={composition}
            onChange={(e) => setComposition(e.target.value)}
          ></textarea>
        </div>
      </div>

      <div className={styles.inputField} style={{marginBottom: 40}}>
        <label>Add Product Images <span>*</span></label>
        <div className={styles.imageUpload}>
          <div className={styles.uploadItem}>
            <div style={{fontSize: 24, marginBottom: 8}}>+</div>
            <span>Tap to Select Photo</span>
          </div>
          {[1,2,3].map(i => (
            <div key={i} className={styles.imagePreview} style={{background: '#f1f1f1', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                </svg>
                <button style={{position: 'absolute', top: -8, right: -8, background: '#eee', border: '1px solid #ddd', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, cursor: 'pointer'}}>✕</button>
            </div>
          ))}
        </div>
      </div>

      <div style={{display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 40, marginBottom: 20}}>
        <button className={styles.pageBtn} onClick={onBack}>Back</button>
        <button className={`${styles.pageBtn} ${styles.nextBtn}`} onClick={onSave} style={{background: '#000', color: '#fff'}}>Save</button>
      </div>
    </div>
  );
};

export default ProductForm;
