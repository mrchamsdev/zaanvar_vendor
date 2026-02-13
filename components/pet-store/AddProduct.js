
"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import styles from "../../styles/pet-store/addProduct.module.css";
import { FiX, FiMinus, FiSquare } from "react-icons/fi";
import { productService } from "../../services/productService";
import useStore from "@/components/state/useStore";
import { IMAGE_URL } from "@/components/utilities/Constants";

const UNITS = [
  "None", "BAGS (Bag)", "BOTTLES (Btl)", "BOX (Box)", "BUNDLES (Bdl)", 
  "CANS (Can)", "CARTONS (Ctn)", "DOZENS (Dzn)", "GRAMMES (Gm)", 
  "KILOGRAMS (Kg)", "LITRE (Ltr)", "METERS (Mtr)", "MILILITRE (Ml)", 
  "NUMBERS (Nos)", "PACKS (Pac)", "PAIRS (Prs)", "PIECES (Pcs)", 
  "QUINTAL (Qtl)", "ROLLS (Rol)", "SQUARE FEET (Sqf)"
];

const UnitPopup = ({ isOpen, onClose, primaryUnit, secondaryUnit, conversion, onSelect }) => {
  const [selectedOption, setSelectedOption] = useState("custom");
  const [customValue, setCustomValue] = useState("");

  if (!isOpen) return null;

  const unitLabel = primaryUnit.split(' ')[0] || "Unit";
  const secondaryLabel = secondaryUnit.split(' ')[0] || "pieces";

  const handleSub = () => {
    let finalConversion = "1";
    if (selectedOption === "12") finalConversion = "12";
    else if (selectedOption === "10") finalConversion = "10";
    else finalConversion = customValue;
    
    onSelect('conversion', finalConversion);
    onClose();
  };

  return (
    <div className={styles.unitPopupOverlay} onClick={onClose}>
      <div className={styles.unitPopup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Select SECONDARY UNIT</h3>
          <button className={styles.iconBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.smallFormGrid}>
          <div className={styles.formGroup}>
            <label>Unit Type</label>
            <select 
              value={primaryUnit} 
              onChange={(e) => onSelect('unitType', e.target.value)}
            >
              <option value="">Select Unit Type here</option>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>SECONDARY UNIT</label>
            <select 
              value={secondaryUnit} 
              onChange={(e) => onSelect('secondaryUnit', e.target.value)}
            >
              <option value="">Select Secondary unit here</option>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {primaryUnit && secondaryUnit && (
          <div className={styles.unitList}>
            <div className={styles.unitItem}>
              <input 
                type="radio" 
                name="conversion" 
                checked={selectedOption === "custom"}
                onChange={() => setSelectedOption("custom")}
              />
              <label>1 {unitLabel} = </label>
              <input 
                type="text" 
                placeholder="Enter here" 
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onClick={() => setSelectedOption("custom")}
              />
            </div>
            <div className={styles.unitItem}>
              <input 
                type="radio" 
                name="conversion" 
                checked={selectedOption === "12"}
                onChange={() => setSelectedOption("12")}
              />
              <label>1 {unitLabel} = 12 {secondaryLabel}</label>
            </div>
            <div className={styles.unitItem}>
              <input 
                type="radio" 
                name="conversion" 
                checked={selectedOption === "10"}
                onChange={() => setSelectedOption("10")}
              />
              <label>1 {unitLabel} = 10 {secondaryLabel}</label>
            </div>
          </div>
        )}

        <div className={styles.modalFooter}>
          <button className={styles.saveBtn} onClick={handleSub}>Submit</button>
        </div>
      </div>
    </div>
  );
};

const AddProduct = ({ onClose, editProductId = null, productType: initialProductType = "retail" }) => {
  const { getJwtToken } = useStore();
  const jwt = getJwtToken();
  const isEditMode = !!editProductId;
  const modalRef = useRef(null);

  const [windowState, setWindowState] = useState("fullscreen"); // 'standard', 'minimized', 'fullscreen'
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [productType, setProductType] = useState(initialProductType);
  const [formData, setFormData] = useState({
    productName: "",
    brandName: "",
    categoryId: "",
    subCategoryId: "",
    petType: [],
    productCode: "",
    eanUpc: "",
    sku: "",
    unitType: "",
    secondaryUnit: "",
    conversion: "",
    minStockAlert: "",
    gst: "",
    hsnCode: "",
    mrp: "",
    sellingPrice: "",
    description: "",
    dosageType: "",
    drugType: "",
    strength: "",
    composition: "",
  });

  const [errors, setErrors] = useState({});
  const [isUnitPopupOpen, setIsUnitPopupOpen] = useState(false);
  const [showGstInfo, setShowGstInfo] = useState(false);
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isEditMode) {
      fetchProductDetails();
    }
  }, [editProductId]);

  const fetchProductDetails = async () => {
    try {
      const response = await productService.getProductById(jwt, editProductId);
      if (response?.data?.data) {
        const product = response.data.data;
        setFormData({
          ...product,
          petType: Array.isArray(product.petType) ? product.petType : (product.petType ? JSON.parse(product.petType) : []),
        });
        if (product.images) {
          setImages(product.images.map(img => ({ 
            url: img.startsWith('http') ? img : `${IMAGE_URL}${img}`,
            id: img 
          })));
        }
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "productCode") {
      const numericValue = value.replace(/\D/g, "").slice(0, 6);
      setFormData(prev => ({ ...prev, [name]: numericValue }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handlePetTypeToggle = (type) => {
    setFormData(prev => {
      const petType = prev.petType.includes(type)
        ? prev.petType.filter(t => t !== type)
        : [...prev.petType, type];
      return { ...prev, petType };
    });
    if (errors.petType) setErrors(prev => ({ ...prev, petType: "" }));
  };

  const handleAssignCode = async () => {
    try {
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      setFormData(prev => ({ ...prev, productCode: randomCode }));
      setErrors(prev => ({ ...prev, productCode: "" }));
    } catch (error) {
      console.error("Error assigned code:", error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const fieldLabels = {
      productName: "Product Name",
      categoryId: "Category",
      productCode: "Product Code",
      unitType: "Unit Type",
      minStockAlert: "Min Stock Alert",
      hsnCode: "HSN Code",
      mrp: "MRP",
      sellingPrice: "Selling Price",
      petType: "Pet Type",
      drugType: "Drug Type"
    };

    const requiredFields = [
      "productName", "categoryId", "productCode", "unitType", 
      "minStockAlert", "hsnCode", "mrp", "sellingPrice"
    ];

    if (productType === "retail" && formData.petType.length === 0) {
      newErrors.petType = `${fieldLabels.petType} is required`;
    }

    if (productType === "medical" && !formData.drugType) {
      newErrors.drugType = `${fieldLabels.drugType} is required`;
    }

    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = `${fieldLabels[field]} is required`;
      }
    });

    if (formData.productCode && formData.productCode.length !== 6) {
      newErrors.productCode = "Product Code must be 6 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'petType') {
          data.append(key, JSON.stringify(formData[key]));
        } else {
          data.append(key, formData[key] || "");
        }
      });
      data.append('productType', productType);

      images.forEach(img => {
        if (img.file) {
          data.append('images', img.file);
        }
      });

      let response;
      if (isEditMode) {
        response = await productService.updateProduct(jwt, editProductId, data);
      } else {
        response = await productService.createProduct(jwt, data);
      }

      if (response?.status === 200 || response?.status === 201) {
        onClose();
      }
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleMouseDown = (e) => {
    if (windowState === 'minimized') return;
    
    // Don't trigger drag on interactive elements
    const interactiveTags = ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'A', 'LABEL'];
    if (interactiveTags.includes(e.target.tagName) || e.target.closest('button')) return;

    if (windowState === 'fullscreen') {
      setWindowState('standard');
      // No initial position adjustment needed, let standard mode take over
    }

    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || windowState !== 'standard') return;
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, windowState]);

  useEffect(() => {
    if (modalRef.current && windowState === 'standard') {
      modalRef.current.style.setProperty('--modal-left', `calc(50% + ${position.x}px)`);
      modalRef.current.style.setProperty('--modal-top', `calc(50% + ${position.y}px)`);
      modalRef.current.style.setProperty('--modal-transform', `translate(-50%, -50%)`);
    } else if (modalRef.current) {
      modalRef.current.style.removeProperty('--modal-left');
      modalRef.current.style.removeProperty('--modal-top');
      modalRef.current.style.removeProperty('--modal-transform');
    }
  }, [position, windowState]);

  return (
    <div className={`${styles.modalOverlay} ${windowState === 'minimized' ? styles.minimizedOverlay : ''}`}>
      <div 
        ref={modalRef}
        className={`${styles.addProductModal} ${styles[windowState]} ${isDragging ? styles.dragging : ''}`}
        onClick={() => { if(windowState === 'minimized') setWindowState('standard'); }}
        onMouseDown={handleMouseDown}
      >
        <div className={styles.modalHeader}>
          <h2>{isEditMode ? "Edit Product Details" : "Add Product Details"}</h2>
          <div className={styles.headerActions}>
            <button 
              className={styles.iconBtn} 
              onClick={(e) => { e.stopPropagation(); setWindowState('minimized'); }}
              title="Minimize"
            >
              <FiMinus />
            </button>
            {windowState === 'fullscreen' ? (
              <button 
                className={styles.iconBtn} 
                onClick={(e) => { e.stopPropagation(); setWindowState('standard'); }}
                title="Restore"
              >
                <FiSquare />
              </button>
            ) : (
              <button 
                className={styles.iconBtn} 
                onClick={(e) => { e.stopPropagation(); setWindowState('fullscreen'); }}
                title="Maximize"
              >
                <FiSquare />
              </button>
            )}
            <button 
              className={styles.iconBtn} 
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              title="Close"
            >
              <FiX />
            </button>
          </div>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.sectionTitle}>Enter product information</div>
          
          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${productType === "retail" ? styles.activeTab : ""}`}
              onClick={() => {
                setProductType("retail");
                setErrors({});
              }}
            >
              Retail Product
            </button>
            <button 
              className={`${styles.tab} ${productType === "medical" ? styles.activeTab : ""}`}
              onClick={() => {
                setProductType("medical");
                setErrors({});
              }}
            >
              Medical Products
            </button>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Product Name <span className={styles.required}>*</span></label>
              <input 
                type="text" 
                name="productName"
                placeholder="Enter Product Name" 
                value={formData.productName}
                onChange={handleInputChange}
              />
              {errors.productName && <span className={styles.errorText}>{errors.productName}</span>}
            </div>
            <div className={styles.formGroup}>
              <label>Brand Name</label>
              <input 
                type="text" 
                name="brandName"
                placeholder="Enter Brand name" 
                value={formData.brandName}
                onChange={handleInputChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Category <span className={styles.required}>*</span></label>
              <select name="categoryId" value={formData.categoryId} onChange={handleInputChange}>
                <option value="">Select Category here</option>
                <option value="1">Grooming</option>
                <option value="2">Toys</option>
                <option value="3">Medicines</option>
              </select>
              {errors.categoryId && <span className={styles.errorText}>{errors.categoryId}</span>}
            </div>
            <div className={styles.formGroup}>
              <label>Sub Category</label>
              <select name="subCategoryId" value={formData.subCategoryId} onChange={handleInputChange}>
                <option value="">Select Sub Category</option>
              </select>
            </div>

            {productType === "retail" && (
              <div className={styles.formGroup}>
                <label>Pet Type <span className={styles.required}>*</span></label>
                <div className={styles.tagSelector}>
                  {['Dog', 'Cat'].map(type => (
                    <button 
                      key={type}
                      className={`${styles.tag} ${formData.petType.includes(type) ? styles.tagActive : ""}`}
                      onClick={() => handlePetTypeToggle(type)}
                    >
                      {type} {formData.petType.includes(type) ? '✕' : ''}
                    </button>
                  ))}
                </div>
                {errors.petType && <span className={styles.errorText}>{errors.petType}</span>}
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Product Code <span className={styles.required}>*</span></label>
              <div className={styles.inputWithBtn}>
                <input 
                  type="text" 
                  name="productCode"
                  placeholder="Enter product code" 
                  value={formData.productCode}
                  onChange={handleInputChange}
                />
                <button className={styles.assignedBtn} onClick={handleAssignCode}>Assigned Code</button>
              </div>
              {errors.productCode && <span className={styles.errorText}>{errors.productCode}</span>}
            </div>

            {productType === "medical" && (
              <>
                <div className={styles.formGroup}>
                  <label>Drug Type <span className={styles.required}>*</span></label>
                  <select name="drugType" value={formData.drugType} onChange={handleInputChange}>
                    <option value="">Select Drug type here</option>
                    <option value="generic">Generic</option>
                    <option value="branded">Branded</option>
                  </select>
                  {errors.drugType && <span className={styles.errorText}>{errors.drugType}</span>}
                </div>
                <div className={styles.formGroup}>
                  <label>Strength</label>
                  <div className={styles.inputWithSelect}>
                    <input 
                      type="text" 
                      name="strength"
                      placeholder="Enter strength" 
                      value={formData.strength}
                      onChange={handleInputChange}
                    />
                    <select className={styles.unitSelect}>
                      <option>ml</option>
                      <option>mg</option>
                    </select>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Dosage Type</label>
                  <select name="dosageType" value={formData.dosageType} onChange={handleInputChange}>
                    <option value="">Eg: Tablets, Injections</option>
                    <option value="tablet">Tablet</option>
                    <option value="injection">Injection</option>
                    <option value="syrup">Syrup</option>
                  </select>
                </div>
              </>
            )}

            <div className={styles.formGroup}>
              <label>EAN /UPC Number</label>
              <input 
                type="text" 
                name="eanUpc"
                placeholder="Enter EAN /UPC Number" 
                value={formData.eanUpc}
                onChange={handleInputChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label>SKU Number</label>
              <input 
                type="text" 
                name="sku"
                placeholder="Enter SKU number" 
                value={formData.sku}
                onChange={handleInputChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Unit Type <span className={styles.required}>*</span></label>
              <input 
                type="text" 
                readOnly
                className={styles.pointerCursor}
                placeholder="Ex : 1 Bottle, 1 strip etc..." 
                value={formData.unitType ? `${formData.unitType}${formData.secondaryUnit ? ` / ${formData.secondaryUnit} (${formData.conversion})` : ''}` : ""}
                onClick={() => setIsUnitPopupOpen(true)}
              />
              {errors.unitType && <span className={styles.errorText}>{errors.unitType}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Min Stock Alert <span className={styles.required}>*</span></label>
              <input 
                type="text" 
                name="minStockAlert"
                placeholder="Enter here" 
                value={formData.minStockAlert}
                onChange={handleInputChange}
              />
              {errors.minStockAlert && <span className={styles.errorText}>{errors.minStockAlert}</span>}
            </div>

            <div className={`${styles.formGroup} ${styles.relativeGroup}`}>
              <label>
                GST(%) <span 
                  className={styles.infoIcon} 
                  onMouseEnter={() => setShowGstInfo(true)}
                  onMouseLeave={() => setShowGstInfo(false)}
                >ⓘ</span>
              </label>
              {showGstInfo && (
                <div className={styles.infoPopup}>
                  same GST % will shown in sale
                </div>
              )}
              <input 
                type="text" 
                name="gst"
                placeholder="Enter GST(%) here" 
                value={formData.gst}
                onChange={handleInputChange}
              />
            </div>
            <div className={styles.formGroup}>
              <label>HSN Code <span className={styles.required}>*</span></label>
              <input 
                type="text" 
                name="hsnCode"
                placeholder="Enter HSN Code here" 
                value={formData.hsnCode}
                onChange={handleInputChange}
              />
              {errors.hsnCode && <span className={styles.errorText}>{errors.hsnCode}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>MRP <span className={styles.required}>*</span></label>
              <input 
                type="text" 
                name="mrp"
                placeholder="Enter MRP here" 
                value={formData.mrp}
                onChange={handleInputChange}
              />
              {errors.mrp && <span className={styles.errorText}>{errors.mrp}</span>}
            </div>
            <div className={styles.formGroup}>
              <label>Selling Price <span className={styles.required}>*</span></label>
              <input 
                type="text" 
                name="sellingPrice"
                placeholder="Enter selling price here" 
                value={formData.sellingPrice}
                onChange={handleInputChange}
              />
              {errors.sellingPrice && <span className={styles.errorText}>{errors.sellingPrice}</span>}
            </div>
          </div>

          <div className={styles.textAreaGrid}>
            <div className={styles.formGroup}>
              <label>Add Product Description</label>
              <textarea 
                name="description"
                placeholder="Type here" 
                value={formData.description}
                onChange={handleInputChange}
              ></textarea>
            </div>
            <div className={styles.formGroup}>
              <label>
                Product Composition <span 
                  className={styles.infoIcon}
                  title="Add the drug composition to easily find the product in inventorys"
                >ⓘ</span>
              </label>
              <textarea 
                name="composition"
                placeholder="Type here" 
                value={formData.composition}
                onChange={handleInputChange}
                disabled={productType !== "medical"}
              ></textarea>
            </div>
          </div>

          <div className={styles.imagesSection}>
            <label>Add Product Images <span className={styles.required}>*</span></label>
            <div className={styles.imageGrid}>
              <div 
                className={styles.uploadBox} 
                onClick={() => fileInputRef.current.click()}
              >
                <div className={styles.plusIcon}>+</div>
                <div>Tap to Select Photo</div>
              </div>
              <input 
                type="file" 
                multiple 
                hidden 
                ref={fileInputRef} 
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  if (images.length + files.length > 4) {
                    alert("Maximum 4 images allowed");
                    return;
                  }
                  const newImages = files.map(file => ({
                    file, preview: URL.createObjectURL(file)
                  }));
                  setImages(prev => [...prev, ...newImages]);
                }}
                accept="image/*"
              />
              {images.map((img, index) => (
                <div key={index} className={styles.imagePreview}>
                  <img src={img.preview || img.url} alt="preview" />
                  <button className={styles.removeImg} onClick={() => setImages(prev => prev.filter((_, i) => i !== index))}>✕</button>
                </div>
              ))}
              {[...Array(Math.max(0, 3 - images.length))].map((_, i) => (
                <div key={`empty-${i}`} className={styles.emptyBox}>
                  <Image src="https://zaanvar-care.b-cdn.net/media/1759818805009-ZAANVAR_FINAL%20LOGO%203.png" width={40} height={40} alt="placeholder" />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button className={styles.backBtn} onClick={onClose}>Back</button>
            <button className={styles.saveBtn} onClick={handleSubmit}>Save</button>
          </div>
        </div>
      </div>

      <UnitPopup 
        isOpen={isUnitPopupOpen} 
        onClose={() => setIsUnitPopupOpen(false)}
        primaryUnit={formData.unitType}
        secondaryUnit={formData.secondaryUnit}
        conversion={formData.conversion}
        onSelect={(field, value) => {
          setFormData(prev => ({ ...prev, [field]: value }));
          if (field === 'unitType' && errors.unitType) setErrors(prev => ({ ...prev, unitType: "" }));
        }}
      />
    </div>
  );
};

export default AddProduct;
