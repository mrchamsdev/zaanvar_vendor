import React, { useState, useEffect, useRef } from "react";
import styles from "../../styles/inventory/stock-update-form.module.css";
import { productService } from "../../services/productService";
import useStore from "../state/useStore";
import useDashboardData from "../dashboard/useDashboardData";
import { toast } from "sonner";
import ProductFormManager from "./product-form-manager";

const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconChevronDown = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

const REASONS = ["Miscount", "Damage", "Internal purpose", "Theft", "Expired", "Onhold", "Open Stock"];

const formatVariantSize = (size) => {
    if (!size) return "";
    if (typeof size === 'string' && size.startsWith('{')) {
        try {
            const parsed = JSON.parse(size);
            const parts = [];
            if (parsed.height) parts.push(`${parsed.height}${parsed.heightUnit || 'mm'}H`);
            if (parsed.width) parts.push(`${parsed.width}${parsed.widthUnit || 'mm'}W`);
            if (parsed.length) parts.push(`${parsed.length}${parsed.lengthUnit || 'mm'}L`);
            if (parsed.radius) parts.push(`R:${parsed.radius}${parsed.radiusUnit || 'mm'}`);
            if (parsed.weight) parts.push(`${parsed.weight}${parsed.weightUnit || 'g'}`);
            return parts.length > 0 ? parts.join(" x ") : size;
        } catch (e) {
            return size;
        }
    }
    return size;
};

// Searchable Product Dropdown component
const ProductSelect = ({ products, value, onChange, onAddNew, error }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedProduct = products.find(p => p.productId === value);
    
    useEffect(() => {
        if (selectedProduct && !isOpen) {
            setSearchTerm(selectedProduct.productName);
        } else if (!selectedProduct && !isOpen) {
            setSearchTerm("");
        }
    }, [selectedProduct, isOpen]);

    const filtered = products.filter(p => 
        p.productName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.customDropdownContainer} ref={containerRef}>
            <div className={`${styles.dropdownTrigger} ${error ? styles.errorField : ""}`} style={{ padding: 0 }}>
                <input 
                    type="text"
                    className={styles.tableInput}
                    style={{ textAlign: 'left', padding: '10px' }}
                    placeholder="SELECT PRODUCT"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                <div style={{ paddingRight: 10, cursor: 'pointer' }} onClick={() => setIsOpen(!isOpen)}>
                    <IconChevronDown />
                </div>
            </div>
            {isOpen && (
                <div className={styles.dropdownMenu}>
                    {filtered.length === 0 ? (
                        <div className={styles.dropdownOption} style={{ color: '#999' }}>No products found</div>
                    ) : (
                        filtered.map(p => (
                            <div 
                                key={p.productId} 
                                className={styles.dropdownOption} 
                                onClick={() => {
                                    onChange(p.productId);
                                    setSearchTerm(p.productName);
                                    setIsOpen(false);
                                }}
                            >
                                {p.productName}
                            </div>
                        ))
                    )}
                    <div className={styles.addProductInMenu} onClick={() => { onAddNew(); setIsOpen(false); }}>
                        + ADD PRODUCT
                    </div>
                </div>
            )}
        </div>
    );
};

const StockUpdateForm = ({ onClose, onSave, isEmbedded = false }) => {
  const { jwtToken, userInfo } = useStore();
  const { branches, branchId } = useDashboardData({ skipReviews: true });
  const [updateDate, setUpdateDate] = useState(new Date().toISOString().split('T')[0]);
  const [products, setProducts] = useState([]);
  const [rows, setRows] = useState([
    { id: Date.now(), productId: "", productName: "", productCode: "", variantId: "", sourceStatus: "", batchNumber: "", currentQty: 0, add: 0, remove: 0, updatedQty: 0, reason: "", expiryDate: "", costPrice: 0, total: 0 }
  ]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({}); // { "row_index_field": true }
  const tableRef = useRef(null);

  useEffect(() => {
    if (jwtToken && branchId) {
      loadProducts();
    }
  }, [jwtToken, branchId]);

  const loadProducts = async () => {
    const data = await productService.getAllProductsBrief(jwtToken, branchId);
    setProducts(Array.isArray(data) ? data : []);
  };

  const addRow = () => {
    setRows([...rows, { id: Date.now(), productId: "", productName: "", productCode: "", variantId: "", sourceStatus: "", batchNumber: "", currentQty: 0, add: 0, remove: 0, updatedQty: 0, reason: "", expiryDate: "", costPrice: 0, total: 0 }]);
  };

  const handleVariantChange = (index, variantId) => {
    if (!Array.isArray(products)) return;
    const product = products.find(p => p.productId === rows[index].productId);
    if (!product) return;

    const variant = product.variants.find(v => v.variantId === parseInt(variantId));
    if (!variant) return;

    const newRows = [...rows];
    newRows[index].variantId = variant.variantId;
    
    // Default source status to empty
    newRows[index].sourceStatus = "";
    newRows[index].currentQty = 0;
    
    newRows[index].costPrice = variant.costPrice || 0;
    newRows[index].expiryDate = variant.expiryDate?.split('T')[0] || "";
    
    updateRowCalculations(newRows, index);
    setRows(newRows);
  };

  const removeRow = (id) => {
    if (rows.length > 1) {
        setRows(rows.filter(r => r.id !== id));
    }
  };

  const handleProductChange = (index, prodId) => {
    if (!Array.isArray(products)) return;
    const product = products.find(p => p.productId === parseInt(prodId));
    if (!product) return;

    const newRows = [...rows];
    newRows[index].productId = product.productId;
    newRows[index].productName = product.productName;
    newRows[index].productCode = product.ProductCode || "";
    
    // Default to first variant if exists
    if (product.variants?.length > 0) {
        const v = product.variants[0];
        newRows[index].variantId = v.variantId;
        newRows[index].currentQty = v.currentQty || v.stockQty || 0;
        newRows[index].costPrice = v.costPrice || 0;
        newRows[index].expiryDate = v.expiryDate?.split('T')[0] || "";
    }
    
    // Clear error for this field
    const newErrors = { ...errors };
    delete newErrors[`${index}_product`];
    setErrors(newErrors);

    updateRowCalculations(newRows, index);
    setRows(newRows);
  };

  const updateRowField = (index, field, value) => {
    const newRows = [...rows];
    
    if (field === 'add' && value > 0) newRows[index].remove = 0;
    if (field === 'remove' && value > 0) newRows[index].add = 0;
    
    newRows[index][field] = value;

    // Handle source status change to update current qty
    if (field === 'sourceStatus') {
        const product = products.find(p => p.productId === newRows[index].productId);
        const variant = product?.variants?.find(v => v.variantId === parseInt(newRows[index].variantId));
        if (variant) {
            const stockData = variant.stockUpdates || {};
            if (value === "Open Stock") {
                newRows[index].currentQty = stockData.openStockQuantity || 0;
            } else if (value === "Hold Qty") {
                newRows[index].currentQty = stockData.onHoldQuantity || 0;
            } else {
                newRows[index].currentQty = 0;
            }
        }
    }

    // Handle reason change: Clear invalid fields
    if (field === 'reason') {
        if (value === "Open Stock") {
            newRows[index].remove = 0;
        } else if (value && value !== "Miscount") {
            // It's a removal reason
            newRows[index].add = 0;
        }
    }
    
    // Clear error for this field
    const newErrors = { ...errors };
    delete newErrors[`${index}_${field}`];
    if (field === 'add' || field === 'remove') {
        delete newErrors[`${index}_add`];
        delete newErrors[`${index}_remove`];
    }
    setErrors(newErrors);

    updateRowCalculations(newRows, index);
    setRows(newRows);
  };

  const updateRowCalculations = (newRows, index) => {
    const row = newRows[index];
    const add = parseInt(row.add) || 0;
    const remove = parseInt(row.remove) || 0;
    const cost = parseFloat(row.costPrice) || 0;

    row.updatedQty = (parseInt(row.currentQty) || 0) + add - remove;
    row.total = (add - remove) * cost;
  };

  const handleSubmit = async () => {
    const newErrors = {};
    
    rows.forEach((row, index) => {
        if (!row.productId) {
            newErrors[`${index}_product`] = true;
        }
        if (!row.add && !row.remove) {
            newErrors[`${index}_add`] = true;
            newErrors[`${index}_remove`] = true;
        }
        if (!row.reason) {
            newErrors[`${index}_reason`] = true;
        }
    });

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toast.error("Please fill all mandatory fields correctly");
        
        // Find the first error field to scroll to
        const firstErrKey = Object.keys(newErrors)[0];
        const [idx, field] = firstErrKey.split('_');
        
        setTimeout(() => {
            const el = document.getElementById(`field_${idx}_${field}`);
            if (el) {
                // Scroll the table container horizontally
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }, 150);
        return;
    }

    setSubmitting(true);
    try {
      for (const row of rows) {
        const payload = {
          branchId: parseInt(branchId),
          variantId: parseInt(row.variantId),
          productId: parseInt(row.productId),
          currentQty: parseInt(row.currentQty),
          add: parseInt(row.add) || 0,
          remove: parseInt(row.remove) || 0,
          reason: row.reason,
          batchNumber: row.batchNumber,
          createdBy: userInfo?.userId || 123,
          createdDate: updateDate,
          productsBillItemsId: null,
          consumptionId: null,
          addItem: null
        };
        await productService.updateStock(jwtToken, payload);
      }
      toast.success("Stock updated successfully");
      if (onSave) onSave();
      else onClose();
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("Failed to update stock");
    } finally {
      setSubmitting(false);
    }
  };

  const grandTotal = rows.reduce((sum, row) => sum + (row.total || 0), 0);

  // Dynamic Column Visibility Logic
  const anyMiscount = rows.some(r => r.reason === "Miscount");
  const anyOpenStock = rows.some(r => r.reason === "Open Stock");
  const anyRemoval = rows.some(r => r.reason && ["Damage", "Internal purpose", "Theft", "Expired", "Onhold"].includes(r.reason));
  const anyEmptyReason = rows.some(r => !r.reason);

  const showAddColumn = anyEmptyReason || anyMiscount || anyOpenStock;
  const showRemoveColumn = anyEmptyReason || anyMiscount || anyRemoval;

  return (
    <>
      <div className={isEmbedded ? styles.embeddedContainer : styles.modal}>
        {showAddProduct && (
            <ProductFormManager onClose={() => { setShowAddProduct(false); loadProducts(); }} mode="Add" />
        )}

        {!isEmbedded && (
            <div className={styles.header}>
              <h2>Update Stock</h2>
              <div className={styles.headerActions}>
                <span className={styles.closeBtn} onClick={onClose}><IconX /></span>
              </div>
            </div>
        )}

        <div className={styles.formContent}>
          <div className={styles.topRow}>
            <div className={styles.inputField}>
              <label>Select Branch <span>*</span></label>
              <select className={styles.topInput} value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                {branches && branches.length > 0 ? (
                  branches.map(b => (
                    <option key={b.id} value={b.id}>{b.branchName || b.name}</option>
                  ))
                ) : (
                  <>
                    <option value="91">Main Branch</option>
                    <option value="92">Secondary Branch</option>
                  </>
                )}
              </select>
            </div>
            <div className={styles.inputField}>
              <label>UPDATED DATE</label>
              <input 
                className={styles.topInput}
                type="date" 
                value={updateDate} 
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setUpdateDate(e.target.value)} 
              />
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.stockUpdateTable}>
              <thead>
                <tr>
                  <th style={{ minWidth: 200 }}>Product Name</th>
                  <th style={{ minWidth: 120, textAlign: 'center' }}>Product Code</th>
                  <th style={{ minWidth: 100, textAlign: 'center' }}>Batch No</th>
                  <th style={{ minWidth: 100, textAlign: 'center' }}>Variants</th>
                  <th style={{ minWidth: 130, textAlign: 'center' }}>Source Status</th>
                  <th style={{ minWidth: 100, textAlign: 'center' }}>Quantity</th>
                  <th style={{ minWidth: 150, textAlign: 'center' }}>Reason</th>
                  {showAddColumn && <th style={{ minWidth: 70, textAlign: 'center' }}>Add</th>}
                  {showRemoveColumn && <th style={{ minWidth: 70, textAlign: 'center' }}>Remove</th>}
                  <th style={{ minWidth: 100, textAlign: 'center' }}>Updated Qty</th>
                  <th style={{ minWidth: 100, textAlign: 'center' }}>Exp. Date</th>
                  <th style={{ minWidth: 100, textAlign: 'center' }}>Cost Price</th>
                  <th style={{ minWidth: 120, textAlign: 'right' }}>Total (₹)</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const currentProduct = Array.isArray(products) ? products.find(p => p.productId === row.productId) : null;
                  return (
                    <tr key={row.id}>
                        <td>
                            <div id={`field_${index}_product`}>
                                <ProductSelect 
                                    products={products} 
                                    value={row.productId} 
                                    onChange={(val) => handleProductChange(index, val)}
                                    onAddNew={() => setShowAddProduct(true)}
                                    error={errors[`${index}_product`]}
                                />
                            </div>
                        </td>
                        <td>
                            <input className={styles.tableInput} readOnly value={row.productCode} placeholder="ENTER CODE" />
                        </td>
                        <td>
                            <input className={styles.tableInput} value={row.batchNumber} onChange={(e) => updateRowField(index, 'batchNumber', e.target.value)} placeholder="------" />
                        </td>
                        <td>
                            <select 
                                className={styles.tableSelect} 
                                value={row.variantId} 
                                onChange={(e) => handleVariantChange(index, e.target.value)}
                            >
                                <option value="">SELECT</option>
                                {currentProduct?.variants?.map(v => (
                                    <option key={v.variantId} value={v.variantId}>
                                        {v.variantType?.size ? `${formatVariantSize(v.variantType.size)} ${v.variantType.packType || ""}` : (v.variantType?.packType || v.drugType || `UNIT - ${v.variantId}`)}
                                    </option>
                                ))}
                            </select>
                        </td>
                        <td>
                            <select 
                                className={styles.tableSelect} 
                                value={row.sourceStatus} 
                                onChange={(e) => updateRowField(index, 'sourceStatus', e.target.value)}
                            >
                                <option value="">SELECT SOURCE</option>
                                <option value="Open Stock">Open Stock</option>
                                {(() => {
                                    const variant = currentProduct?.variants?.find(v => v.variantId === parseInt(row.variantId));
                                    if (variant?.stockUpdates?.onHoldQuantity > 0) {
                                        return <option value="Hold Qty">Hold Qty</option>;
                                    }
                                    return null;
                                })()}
                            </select>
                        </td>
                        <td><input className={styles.tableInput} style={{ fontWeight: 700 }} readOnly value={row.currentQty} /></td>
                        <td>
                            <select id={`field_${index}_reason`} className={`${styles.tableSelect} ${errors[`${index}_reason`] ? styles.errorField : ""}`} value={row.reason} onChange={(e) => updateRowField(index, 'reason', e.target.value)}>
                                <option value="">SELECT REASON</option>
                                {REASONS.filter(r => {
                                    if (row.sourceStatus === "Open Stock" && r === "Open Stock") return false;
                                    if (row.sourceStatus === "Hold Qty" && r === "Onhold") return false;
                                    return true;
                                }).map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </td>
                        {showAddColumn && (
                            <td>
                                {(row.reason === "Open Stock" || row.reason === "Miscount" || !row.reason) ? (
                                    <input 
                                        id={`field_${index}_add`} 
                                        className={`${styles.tableInput} ${errors[`${index}_add`] ? styles.errorField : ""}`} 
                                        type="number" 
                                        value={row.add || ""} 
                                        onChange={(e) => updateRowField(index, 'add', e.target.value)} 
                                        placeholder="0" 
                                    />
                                ) : <div className={styles.disabledPlaceholder}>--</div>}
                            </td>
                        )}
                        {showRemoveColumn && (
                            <td>
                                {(row.reason !== "Open Stock" || !row.reason) ? (
                                    <input 
                                        id={`field_${index}_remove`} 
                                        className={`${styles.tableInput} ${errors[`${index}_remove`] ? styles.errorField : ""}`} 
                                        type="number" 
                                        value={row.remove || ""} 
                                        onChange={(e) => updateRowField(index, 'remove', e.target.value)} 
                                        placeholder="0" 
                                    />
                                ) : <div className={styles.disabledPlaceholder}>--</div>}
                            </td>
                        )}
                        <td><input className={styles.tableInput} style={{ fontWeight: 700 }} readOnly value={row.updatedQty} /></td>
                        <td><input className={styles.tableInput} readOnly value={row.expiryDate} placeholder="------" /></td>
                        <td><input className={styles.tableInput} readOnly value={`₹${row.costPrice}`} /></td>
                        <td style={{ color: row.total >= 0 ? '#27ae60' : '#ff4d4f', fontWeight: 600, textAlign: 'right' }}>
                        {row.total >= 0 ? `+ ₹ ${row.total.toFixed(2)}` : `- ₹ ${Math.abs(row.total).toFixed(2)}`}
                        </td>
                        <td>
                        {index > 0 && (
                            <span className={styles.removeRowBtn} onClick={() => removeRow(row.id)}><IconX /></span>
                        )}
                        </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button className={styles.addItemBtn} onClick={addRow}>+ ADD ITEM</button>
          
          <div className={styles.totalSection}>
            <div className={styles.totalLabel}>TOTAL</div>
            <div className={`${styles.totalAmount}`} style={{ color: grandTotal >= 0 ? '#27ae60' : '#ff4d4f' }}>
              {grandTotal >= 0 ? `+ ₹ ${grandTotal.toFixed(2)}` : `- ₹ ${Math.abs(grandTotal).toFixed(2)}`}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Processing..." : "Update Stock"}
          </button>
        </div>
      </div>
    </>
  );
};

export default StockUpdateForm;
