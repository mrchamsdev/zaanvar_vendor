import { toApiDateOnly } from "@/utilities/date-time-utils";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import styles from "../../styles/purchase-bill/purchase-order-form.module.css";
import { purchaseService } from "../../services/purchaseService";
import { productService } from "../../services/productService";
import useStore from "../../components/state/useStore";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { toast } from "sonner";
import { dateOnlyWithTimeZone, parseWallClockDate } from "@/utilities/date-time-utils";

const IconTrash = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
);

const PurchaseOrderForm = ({ initialData, requestId, onSave, onBack, orderNumber }) => {
    const formatVariantSize = (size) => {
        if (!size) return "";
        if (typeof size === 'string' && size.trim().startsWith('{')) {
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
    const [orderDate, setOrderDate] = useState(initialData?.orderDate || toApiDateOnly(new Date()));
    const [items, setItems] = useState(initialData?.items || [
        { id: Date.now(), productId: "", productName: "", productCode: "--", variant: "--", currentStock: 0, orderQty: "", costPrice: "", mrp: 0 }
    ]);

    const [formErrors, setFormErrors] = useState({});

    // Search and Dropdown states
    const [searchQuery, setSearchQuery] = useState("");
    const [focusedItemIndex, setFocusedItemIndex] = useState(null);
    const [focusedVariantIndex, setFocusedVariantIndex] = useState(null);
    const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
    const [supplierSearchQuery, setSupplierSearchQuery] = useState("");

    const tableRef = useRef(null);
    const supplierRef = useRef(null);

    // Sync branchId with global store when in Add mode
    useEffect(() => {
        if (!requestId && !initialData?.branchId && currentBranchId) {
            setBranchId(currentBranchId);
        }
    }, [currentBranchId, requestId, initialData]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const isSearchClick = event.target.closest(`.${styles.productSearchWrapper}`);
            const isVariantClick = event.target.closest(`.${styles.variantCell}`);
            const isSupplierClick = supplierRef.current && supplierRef.current.contains(event.target);

            if (!isSearchClick && !isVariantClick) {
                setFocusedItemIndex(null);
                setFocusedVariantIndex(null);
            }

            if (!isSupplierClick) {
                setIsSupplierDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (jwtToken && branchId) {
            fetchSuppliers();
            fetchProducts();
        }
    }, [jwtToken, branchId]);

    // Handle restock auto-population
    useEffect(() => {
        if (initialData?.restockItem && suppliers.length > 0 && allProducts.length > 0) {
            const { productId, variantId } = initialData.restockItem;

            // 1. Select Supplier if provided
            if (initialData.supplierId) {
                setSupplierId(initialData.supplierId);
                const supplier = suppliers.find(s => String(s.supplierId) === String(initialData.supplierId));
                if (supplier) setSupplierPhone(supplier.phone);
            }

            // 2. Select Product and Variant
            const product = allProducts.find(p => p.productId === productId);
            if (product) {
                const variants = product.variants || [];
                const variant = variants.find(v => v.variantId === variantId) || variants[0] || {};
                const vt = variant.variantType || {};
                const variantDisplay = [vt.packType, formatVariantSize(vt.size), vt.flavor].filter(Boolean).join(" - ") || variant.variantMeasure || "--";

                const newItems = [{
                    id: Date.now(),
                    productId: product.productId,
                    productName: product.productName,
                    productCode: product.ProductCode || "--",
                    variant: variantDisplay,
                    currentStock: variant.currentQty || 0,
                    variantId: variant.variantId,
                    costPrice: parseFloat(variant.sellingPrice) || 0,
                    mrp: parseFloat(variant.mrp) || 0,
                    taxGroupId: variant.taxGroupId || 1,
                    orderQty: 1, // Default to 1 for restock
                    allVariants: variants
                }];
                setItems(newItems);
            }
        }
    }, [initialData, suppliers, allProducts]);

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

        if (formErrors.supplierId) {
            const newErrors = { ...formErrors };
            delete newErrors.supplierId;
            setFormErrors(newErrors);
        }
    };

    const addItem = () => {
        setItems([...items, { id: Date.now(), productId: "", productName: "", productCode: "--", variant: "--", currentStock: 0, orderQty: "", costPrice: "" }]);
    };

    const removeItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const updateItem = (index, field, value) => {
        let finalValue = value;
        // For numeric fields, strip leading zeros (prevents "02", "05" etc.)
        const numericFields = ["orderQty", "costPrice", "mrp"];
        if (numericFields.includes(field)) {
            if (typeof value === "string" && value.length > 1 && value.startsWith("0") && value[1] !== ".") {
                finalValue = value.replace(/^0+/, '') || "";
            }
        }

        const newItems = [...items];
        newItems[index][field] = finalValue;
        setItems(newItems);

        if (formErrors.items?.[index]?.[field]) {
            const newErrors = { ...formErrors };
            if (newErrors.items?.[index]) {
                delete newErrors.items[index][field];
                if (Object.keys(newErrors.items[index]).length === 0) {
                    newErrors.items[index] = null;
                }
            }
            setFormErrors(newErrors);
        }
    };

    const selectProduct = (index, product) => {
        const variants = product.variants || [];
        const variant = variants[0] || {};
        const vt = variant.variantType || {};
        const variantDisplay = [vt.packType, formatVariantSize(vt.size), vt.flavor].filter(Boolean).join(" - ") || variant.variantMeasure || "--";

        const newItems = [...items];
        newItems[index] = {
            ...newItems[index],
            productId: product.productId,
            productName: product.productName,
            productCode: product.ProductCode || "--",
            variant: variantDisplay,
            currentStock: variant.currentQty || 0,
            variantId: variant.variantId,
            costPrice: "",
            mrp: variant.mrp || 0,
            taxGroupId: variant.taxGroupId || 1, // Default or from data
            allVariants: variants
        };
        setItems(newItems);
        setFocusedItemIndex(null);

        if (formErrors.items?.[index]) {
            const newErrors = { ...formErrors };
            newErrors.items[index] = null;
            setFormErrors(newErrors);
        }
    };

    const selectVariant = (itemIndex, variant) => {
        const vt = variant.variantType || {};
        const variantDisplay = [vt.packType, formatVariantSize(vt.size), vt.flavor].filter(Boolean).join(" - ") || variant.variantMeasure || "--";

        const newItems = [...items];
        newItems[itemIndex] = {
            ...newItems[itemIndex],
            variant: variantDisplay,
            currentStock: variant.currentQty || 0,
            variantId: variant.variantId,
            costPrice: "",
            mrp: variant.mrp || 0,
            taxGroupId: variant.taxGroupId || 1
        };
        setItems(newItems);
        setFocusedVariantIndex(null);

        if (formErrors.items?.[itemIndex]?.variant) {
            const newErrors = { ...formErrors };
            delete newErrors.items[itemIndex].variant;
            if (Object.keys(newErrors.items[itemIndex]).length === 0) {
                newErrors.items[itemIndex] = null;
            }
            setFormErrors(newErrors);
        }
    };

    const handleSubmit = async (type) => {
        const errors = {};
        if (!branchId) errors.branchId = "Branch is required";
        if (!supplierId) errors.supplierId = "Supplier is required";
        if (!orderDate) {
            errors.orderDate = "Order date is required";
        } else {
            const todayStr = toApiDateOnly(new Date());
            if (orderDate > todayStr) {
                errors.orderDate = "Future dates are not allowed";
            }
        }

        const itemErrors = items.map((item) => {
            const errs = {};
            if (!item.productId) errs.productId = "Product is required";
            if (!item.variant || item.variant === "--") errs.variant = "Variant is required";
            if (!item.orderQty || item.orderQty <= 0) errs.orderQty = "Qty > 0";
            if (item.costPrice && item.mrp && parseFloat(item.costPrice) > parseFloat(item.mrp)) {
                errs.costPrice = `Max: ${item.mrp}`;
            }
            return Object.keys(errs).length > 0 ? errs : null;
        });

        if (itemErrors.some(e => e !== null)) {
            errors.items = itemErrors;
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }
        setFormErrors({});

        setLoading(true);
        try {
            // Updated status values: "draft" | "order placed" | "received" | "cancel order"
            const statusValue = type === "Drafted" ? "draft" : "order placed";
            const validItems = items.filter(i => i.productId && i.variantId);

            const payload = {
                branchId: parseInt(branchId),
                supplierId: parseInt(supplierId),
                createdBy: userInfo?.vendorId || 1,
                orderStatus: statusValue,
                ...dateOnlyWithTimeZone(
                    "orderDate",
                    parseWallClockDate(orderDate) || new Date(orderDate),
                ),
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
                PO Number <span className={styles.poId}>{orderNumber || 1}</span>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionTitle}>Shipment Details</div>
                <div className={styles.grid}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Selected Branch</label>
                        <div style={{ position: 'relative' }}>
                            <select
                                className={`${styles.select} ${styles.input} ${formErrors.branchId ? styles.errorField : ""}`}
                                value={branchId}
                                onChange={(e) => {
                                    setBranchId(e.target.value);
                                    if (formErrors.branchId) {
                                        const newErrors = { ...formErrors };
                                        delete newErrors.branchId;
                                        setFormErrors(newErrors);
                                    }
                                }}
                                style={{ appearance: 'none', width: '100%', paddingRight: '40px' }}
                            >
                                <option value="">Select Branch</option>
                                {branches.map(b => (
                                    <option key={b.id || b._id} value={b.id || b._id}>{b.name || b.branchName}</option>
                                ))}
                            </select>
                            <div className={styles.dropdownIcon}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
                            </div>
                        </div>
                        {formErrors.branchId && <div className={styles.errorMessage}>{formErrors.branchId}</div>}
                    </div>
                    <div className={styles.fieldGroup} ref={supplierRef} style={{ position: 'relative' }}>
                        <label className={styles.label}>Select Supplier</label>
                        <div
                            className={`${styles.supplierSearchWrapper} ${formErrors.supplierId ? styles.errorField : ""}`}
                            onClick={() => setIsSupplierDropdownOpen(true)}
                        >
                            <input
                                className={styles.input}
                                type="text"
                                placeholder="Name Supplier"
                                value={supplierSearchQuery || (suppliers.find(s => String(s.supplierId) === String(supplierId))?.supplierName || "")}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSupplierSearchQuery(val);
                                    if (val === "") {
                                        setSupplierId("");
                                        setSupplierPhone("");
                                    }
                                    setIsSupplierDropdownOpen(true);
                                }}
                                onFocus={() => setIsSupplierDropdownOpen(true)}
                                style={{ border: 'none', background: 'transparent', width: '100%', height: '100%' }}
                            />
                            <div className={styles.dropdownIcon} onClick={(e) => {
                                e.stopPropagation();
                                setIsSupplierDropdownOpen(!isSupplierDropdownOpen);
                            }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
                            </div>
                        </div>
                        {formErrors.supplierId && <div className={styles.errorMessage}>{formErrors.supplierId}</div>}
                        {isSupplierDropdownOpen && (
                            <div className={styles.productDropdown} style={{ width: '100%', minWidth: 'unset' }}>
                                {suppliers
                                    .filter(s => !supplierSearchQuery || s.supplierName.toLowerCase().includes(supplierSearchQuery.toLowerCase()))
                                    .map(s => (
                                        <div
                                            key={s.supplierId}
                                            className={styles.productOption}
                                            onClick={() => {
                                                handleSupplierChange({ target: { value: s.supplierId } });
                                                setSupplierSearchQuery(s.supplierName);
                                                setIsSupplierDropdownOpen(false);
                                            }}
                                        >
                                            <span className={styles.productOptionName}>{s.supplierName}</span>
                                        </div>
                                    ))}
                                <div
                                    className={styles.productOption}
                                    style={{ borderTop: '1px solid #eee', color: '#E9315D', fontWeight: '700', textAlign: 'center', background: '#fefefe' }}
                                    onClick={() => router.push(`/suppliers?action=add&returnUrl=${encodeURIComponent('/purchase-bill/purchase-orders?openAdd=true')}`)}
                                >
                                    + ADD SUPPLIER
                                </div>
                            </div>
                        )}
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Supplier Phone Number</label>
                        <input className={styles.input} type="text" placeholder="Phone Number" value={supplierPhone} readOnly />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Date of Order</label>
                        <input
                            className={`${styles.input} ${formErrors.orderDate ? styles.errorField : ""}`}
                            type="date"
                            value={orderDate}
                            max={toApiDateOnly(new Date())}
                            onChange={(e) => {
                                setOrderDate(e.target.value);
                                if (formErrors.orderDate) {
                                    const newErrors = { ...formErrors };
                                    delete newErrors.orderDate;
                                    setFormErrors(newErrors);
                                }
                            }}
                        />
                        {formErrors.orderDate && <div className={styles.errorMessage}>{formErrors.orderDate}</div>}
                    </div>
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table} ref={tableRef}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'center' }}>S.NO</th>
                            <th>PRODUCT NAME</th>
                            <th style={{ textAlign: 'center' }}>PRODUCT CODE</th>
                            <th style={{ textAlign: 'center' }}>VARIANT</th>
                            <th style={{ textAlign: 'center' }}>CURRENT STOCK</th>
                            <th style={{ textAlign: 'center' }}>Order QTY</th>
                            <th style={{ textAlign: 'center' }}>COST PRICE</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={item.id}>
                                <td style={{ textAlign: 'center', fontWeight: '700' }}>{String(index + 1).padStart(2, '0')}</td>
                                <td className={styles.productSearchWrapper} style={{ minWidth: '250px', position: 'relative' }}>
                                    <input
                                        className={`${styles.tableInput} ${formErrors.items?.[index]?.productId ? styles.errorField : ""}`}
                                        type="text"
                                        placeholder="SELECT PRODUCT"
                                        value={item.productName}
                                        onFocus={() => {
                                            setFocusedItemIndex(index);
                                        }}
                                        onChange={(e) => updateItem(index, "productName", e.target.value)}
                                    />
                                    <div style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.4 }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
                                    </div>
                                    {formErrors.items?.[index]?.productId && (
                                        <div className={styles.errorMessage} style={{ fontSize: '11px', marginTop: '4px' }}>Required</div>
                                    )}
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
                                            <div
                                                className={styles.productOption}
                                                style={{ borderTop: '1px solid #eee', color: '#E9315D', fontWeight: '700', textAlign: 'center', background: '#fefefe' }}
                                                onClick={() => router.push(`/inventory/products?action=add&returnUrl=${encodeURIComponent('/purchase-bill/purchase-orders?openAdd=true')}`)}
                                            >
                                                + ADD PRODUCT
                                            </div>
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <input
                                        className={styles.tableInput}
                                        type="text"
                                        placeholder="--"
                                        value={item.productCode === "--" ? "" : item.productCode}
                                        style={{ textAlign: 'center' }}
                                        readOnly
                                    />
                                </td>
                                <td
                                    className={`${styles.variantCell} ${formErrors.items?.[index]?.variant ? styles.errorField : ""}`}
                                    style={{ textAlign: 'center', color: '#999', position: 'relative', cursor: 'pointer' }}
                                    onClick={() => setFocusedVariantIndex(index)}
                                >
                                    {item.variant || "--"}
                                    {item.allVariants?.length > 1 && (
                                        <div style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
                                        </div>
                                    )}
                                    {formErrors.items?.[index]?.variant && (
                                        <div className={styles.errorMessage} style={{ fontSize: '11px', marginTop: '4px', textAlign: 'center' }}>Required</div>
                                    )}
                                    {focusedVariantIndex === index && item.allVariants?.length > 1 && (
                                        <div className={styles.productDropdown}>
                                            {item.allVariants.map((v, i) => {
                                                const vvt = v.variantType || {};
                                                const vDisplay = [vvt.packType, formatVariantSize(vvt.size), vvt.flavor].filter(Boolean).join(" - ") || v.variantMeasure || "--";
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
                                <td style={{ textAlign: 'center', fontWeight: '700' }}>{item.currentStock || 0}</td>
                                <td>
                                    <input
                                        className={`${styles.qtyInput} ${formErrors.items?.[index]?.orderQty ? styles.errorField : ""}`}
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={item.orderQty === 0 ? "" : item.orderQty}
                                        onChange={(e) => updateItem(index, "orderQty", e.target.value)}
                                    />
                                    {formErrors.items?.[index]?.orderQty && (
                                        <div className={styles.errorMessage} style={{ textAlign: 'center' }}>Required</div>
                                    )}
                                </td>
                                <td>
                                    <input
                                        className={`${styles.qtyInput} ${formErrors.items?.[index]?.costPrice ? styles.errorField : ""}`}
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={item.costPrice}
                                        onChange={(e) => updateItem(index, "costPrice", e.target.value)}
                                    />
                                    {formErrors.items?.[index]?.costPrice && (
                                        <div className={styles.errorMessage} style={{ fontSize: '9px', marginTop: '6px', lineHeight: '1.2', display: 'block', textAlign: 'center' }}>
                                            {formErrors.items[index].costPrice}
                                        </div>
                                    )}
                                </td>
                                <td style={{ width: '60px', textAlign: 'center' }}>
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
