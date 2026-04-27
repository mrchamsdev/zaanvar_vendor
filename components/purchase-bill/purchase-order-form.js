import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "../../styles/purchase-bill/purchase-order-form.module.css";
import { purchaseService } from "../../services/purchaseService";
import { productService } from "../../services/productService";
import useStore from "../../components/state/useStore";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { toast } from "sonner";

const IconTrash = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
);

const PurchaseOrderForm = ({ initialData, requestId, onSave, onBack }) => {
    const router = useRouter();
    const { jwtToken, userInfo } = useStore();
    const { branches, branchId: currentBranchId } = useDashboardData();

    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    
    // Form State
    const [branchId, setBranchId] = useState(initialData?.branchId || currentBranchId || "");
    const [supplierId, setSupplierId] = useState(initialData?.supplierId || "");
    const [supplierPhone, setSupplierPhone] = useState(initialData?.supplierPhone || "");
    const [orderDate, setOrderDate] = useState(initialData?.orderDate || new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState(initialData?.items || [
        { id: Date.now(), productId: "", productName: "", productCode: "--", variant: "--", currentStock: 0, orderQty: 0 }
    ]);

    // Search and Dropdown states
    const [searchQuery, setSearchQuery] = useState("");
    const [focusedItemIndex, setFocusedItemIndex] = useState(null);
    const [focusedVariantIndex, setFocusedVariantIndex] = useState(null);

    useEffect(() => {
        if (jwtToken && branchId) {
            fetchSuppliers();
            fetchProducts();
        }
    }, [jwtToken, branchId]);

    const fetchSuppliers = async () => {
        try {
            const response = await purchaseService.getSuppliers(jwtToken, branchId);
            setSuppliers(response.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchProducts = async () => {
        try {
            const res = await productService.getProducts(jwtToken, branchId, "Retail", "");
            setAllProducts(res.products || []);
        } catch (e) { console.error(e); }
    };

    const handleSupplierChange = (e) => {
        const id = e.target.value;
        setSupplierId(id);
        const supplier = suppliers.find(s => String(s.supplierId) === String(id));
        setSupplierPhone(supplier ? supplier.phone : "");
    };

    const addItem = () => {
        setItems([...items, { id: Date.now(), productId: "", productName: "", productCode: "--", variant: "--", currentStock: 0, orderQty: 0 }]);
    };

    const removeItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const selectProduct = (index, product) => {
        const variants = product.variants || [];
        const variant = variants[0] || {};
        const vt = variant.variantType || {};
        const variantDisplay = [vt.packType, vt.size, vt.flavor].filter(Boolean).join(" - ") || variant.variantMeasure || "--";
        
        const newItems = [...items];
        newItems[index] = {
            ...newItems[index],
            productId: product.productId,
            productName: product.productName,
            productCode: product.ProductCode || "--",
            variant: variantDisplay,
            currentStock: variant.currentQty || 0,
            variantId: variant.variantId,
            costPrice: parseFloat(variant.sellingPrice) || 0, // Default to selling price
            taxGroupId: variant.taxGroupId || 1, // Default or from data
            allVariants: variants
        };
        setItems(newItems);
        setFocusedItemIndex(null);
    };

    const selectVariant = (itemIndex, variant) => {
        const vt = variant.variantType || {};
        const variantDisplay = [vt.packType, vt.size, vt.flavor].filter(Boolean).join(" - ") || variant.variantMeasure || "--";
        
        const newItems = [...items];
        newItems[itemIndex] = {
            ...newItems[itemIndex],
            variant: variantDisplay,
            currentStock: variant.currentQty || 0,
            variantId: variant.variantId,
            costPrice: parseFloat(variant.sellingPrice) || 0,
            taxGroupId: variant.taxGroupId || 1
        };
        setItems(newItems);
        setFocusedVariantIndex(null);
    };

    const handleSubmit = async (type) => {
        if (!branchId || !supplierId || !orderDate) {
            toast.error("Please fill all shipment details");
            return;
        }

        // Date validation: No future dates
        const todayStr = new Date().toISOString().split("T")[0];
        if (orderDate > todayStr) {
            toast.error("Future dates are not allowed for order date");
            return;
        }

        const validItems = items.filter(i => i.productId && i.orderQty > 0);
        if (validItems.length === 0) {
            toast.error("Add at least one product with order quantity");
            return;
        }

        setLoading(true);
        try {
            // Updated status values: "draft" | "order placed" | "received" | "cancel order"
            const statusValue = type === "Drafted" ? "draft" : "order placed";

            const payload = {
                branchId: parseInt(branchId),
                supplierId: parseInt(supplierId),
                createdBy: userInfo?.vendorId || 1,
                orderStatus: statusValue,
                orderDate: orderDate,
                items: validItems.map(i => ({
                    productId: i.productId,
                    variantId: i.variantId,
                    taxGroupId: i.taxGroupId || 1,
                    orderQuantity: parseInt(i.orderQty),
                    costPrice: parseFloat(i.costPrice) || 0
                }))
            };

            const res = requestId 
                ? await purchaseService.updatePurchaseOrder(jwtToken, requestId, payload)
                : await purchaseService.createPurchaseOrder(jwtToken, payload);

            console.log("Submit Response:", res);
            if (res.status === "success" || res.status === "ok" || res.status === 200) {
                toast.success(type === "Drafted" ? "Order Saved as Draft" : "Order Placed Successfully");
                
                // Trigger navigation and refresh
                console.log("Invoking onSave callback");
                if (onSave) onSave();
                
                // Fallback direct navigation
                router.push("/purchase-bill?tab=Orders");
            } else {
                toast.error(res.message || res.msg || "Failed to process order");
            }
        } catch (e) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.formContainer}>
            <div className={styles.poNumberHeader}>
                PO Number <span className={styles.poId}>#000001</span>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionTitle}>Shipment Details</div>
                <div className={styles.grid}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Select Branch</label>
                        <select className={styles.select} value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                            <option value="">Branch Name</option>
                            {branches.map(br => <option key={br.id} value={br.id}>{br.name}</option>)}
                        </select>
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Select Supplier</label>
                        <select className={styles.select} value={supplierId} onChange={handleSupplierChange}>
                            <option value="">Name Supplier</option>
                            {suppliers.map(s => <option key={s.supplierId} value={s.supplierId}>{s.supplierName}</option>)}
                        </select>
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Supplier Phone Number</label>
                        <input className={styles.input} type="text" placeholder="Phone Number" value={supplierPhone} readOnly />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Date of Order</label>
                        <input 
                            className={styles.input} 
                            type="date" 
                            value={orderDate} 
                            max={new Date().toISOString().split("T")[0]}
                            onChange={(e) => setOrderDate(e.target.value)} 
                        />
                    </div>
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{textAlign: 'center'}}>S.NO</th>
                            <th>PRODUCT NAME</th>
                            <th style={{textAlign: 'center'}}>PRODUCT CODE</th>
                            <th style={{textAlign: 'center'}}>VARIANT</th>
                            <th style={{textAlign: 'center'}}>CURRENT STOCK</th>
                            <th style={{textAlign: 'center'}}>Order QTY</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={item.id}>
                                <td style={{textAlign: 'center', fontWeight: '700'}}>{String(index + 1).padStart(2, '0')}</td>
                                <td className={styles.productSearchWrapper} style={{minWidth: '250px', position: 'relative'}}>
                                    <input 
                                        className={styles.tableInput} 
                                        type="text" 
                                        placeholder="SELECT PRODUCT" 
                                        value={item.productName}
                                        onFocus={() => {
                                            setFocusedItemIndex(index);
                                        }}
                                        onChange={(e) => updateItem(index, "productName", e.target.value)}
                                    />
                                    <div style={{position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.4}}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
                                    </div>
                                    {focusedItemIndex === index && (
                                        <div className={styles.productDropdown}>
                                            {allProducts
                                                .filter(p => !item.productName || p.productName.toLowerCase().includes(item.productName.toLowerCase()))
                                                .map(p => (
                                                    <div key={p.productId} className={styles.productOption} onClick={() => selectProduct(index, p)}>
                                                        <span className={styles.productOptionName}>{p.productName}</span>
                                                        <span className={styles.productOptionCode}>{p.ProductCode}</span>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <input 
                                        className={styles.tableInput} 
                                        type="text" 
                                        placeholder="--" 
                                        value={item.productCode === "--" ? "" : item.productCode}
                                        style={{textAlign: 'center'}}
                                        readOnly
                                    />
                                </td>
                                <td style={{textAlign: 'center', color: '#999', position: 'relative', cursor: 'pointer'}} onClick={() => setFocusedVariantIndex(index)}>
                                    {item.variant || "--"}
                                    {focusedVariantIndex === index && item.allVariants?.length > 1 && (
                                        <div className={styles.productDropdown}>
                                            {item.allVariants.map((v, i) => {
                                                const vvt = v.variantType || {};
                                                const vDisplay = [vvt.packType, vvt.size, vvt.flavor].filter(Boolean).join(" - ") || v.variantMeasure || "--";
                                                return (
                                                    <div key={v.variantId} className={styles.productOption} onClick={(e) => { e.stopPropagation(); selectVariant(index, v); }}>
                                                        <span className={styles.productOptionName}>{vDisplay}</span>
                                                        <span className={styles.productOptionCode}>Stock: {v.currentQty || 0}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </td>
                                <td style={{textAlign: 'center', fontWeight: '700'}}>{item.currentStock || 0}</td>
                                <td>
                                    <input 
                                        className={styles.qtyInput} 
                                        type="number" 
                                        value={item.orderQty} 
                                        onChange={(e) => updateItem(index, "orderQty", e.target.value)}
                                    />
                                </td>
                                <td style={{width: '60px', textAlign: 'center'}}>
                                    {items.length > 1 && (
                                        <button className={styles.deleteBtn} onClick={() => removeItem(item.id)}>
                                            <IconTrash />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button className={styles.addItemBtn} onClick={addItem}>+ADD ITEM</button>
            </div>

            <div className={styles.actions}>
                <button className={styles.draftBtn} disabled={loading} onClick={() => handleSubmit("Drafted")}>
                    Save as Draft
                </button>
                <button 
                    className={`${styles.placeOrderBtn} ${items.some(i => i.productId) ? styles.placeOrderBtnActive : ""}`} 
                    disabled={loading}
                    onClick={() => handleSubmit("Order Placed")}
                >
                    {loading ? "Processing..." : "Place a Order"}
                </button>
            </div>
        </div>
    );
};

export default PurchaseOrderForm;
