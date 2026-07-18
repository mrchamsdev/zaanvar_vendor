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
import { getAmountDecimalPlaces } from "@/components/utilities/formatAmount";
import { getSettings, triggerVendorMessage } from "../../services/settingsService";


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
    const { jwtToken, userInfo, vendorSettings, setSelectedBranchId } = useStore();
    const { branches, branchId: currentBranchId } = useDashboardData();
    const { getBoolSetting } = require('@/utilities/settings-utils');

    const blockNewSupplierFromTxn = vendorSettings?.general?.blockNewSupplierFromTxn;
    const blockNewItemsFromTxn = vendorSettings?.general?.blockNewItemsFromTxn;
    const transactionWiseTax = getBoolSetting(vendorSettings, "transactionWiseTax", false);
    const transactionWiseDiscount = getBoolSetting(vendorSettings, "transactionWiseDiscount", false);

    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [allProducts, setAllProducts] = useState([]);

    // Form State
    const [branchId, setBranchId] = useState(initialData?.branchId || currentBranchId || "");
    const [supplierId, setSupplierId] = useState(initialData?.supplierId || "");
    const [supplierPhone, setSupplierPhone] = useState(initialData?.supplierPhone || "");
    const [orderDate, setOrderDate] = useState(initialData?.orderDate || toApiDateOnly(new Date()));
    const [overallTax, setOverallTax] = useState(initialData?.overallTax || { value: 0, type: '%' });
    const [overallDiscount, setOverallDiscount] = useState(initialData?.overallDiscount || { value: 0, type: '%' });
    const [items, setItems] = useState(initialData?.items || [
        { id: Date.now(), productId: "", productName: "", productCode: "--", variant: "--", currentStock: 0, orderQty: "", costPrice: "", mrp: 0 }
    ]);

    const [formErrors, setFormErrors] = useState({});
    const [messageModal, setMessageModal] = useState({
        isOpen: false,
        messageId: null,
        resolveAction: null,
    });

    // Search and Dropdown states
    const [searchQuery, setSearchQuery] = useState("");
    const [focusedItemIndex, setFocusedItemIndex] = useState(null);
    const [focusedVariantIndex, setFocusedVariantIndex] = useState(null);
    const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
    const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
    const [supplierProducts, setSupplierProducts] = useState(null);

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

    useEffect(() => {
        const initialSupplierId = initialData?.supplierId || initialData?.restockItem?.supplierId;
        if (jwtToken && branchId && initialSupplierId) {
            purchaseService.getSupplierById(jwtToken, initialSupplierId, branchId)
                .then(res => {
                    const supplierData = res?.data || res;
                    if (supplierData && Array.isArray(supplierData.products)) {
                        setSupplierProducts(supplierData.products.map(p => p.productId || p.id));
                    } else if (supplierData && Array.isArray(supplierData.productIds)) {
                        setSupplierProducts(supplierData.productIds);
                    } else {
                        setSupplierProducts([]);
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch initial supplier products", err);
                    setSupplierProducts([]);
                });
        }
    }, [jwtToken, branchId, initialData]);

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
            const res = await productService.getProducts(jwtToken, branchId, "", "");
            setAllProducts(res.products || []);
        } catch (e) { console.error(e); }
    };

    const handleSupplierChange = async (e) => {
        const id = e.target.value;
        setSupplierId(id);
        const supplier = suppliers.find(s => String(s.supplierId) === String(id));
        setSupplierPhone(supplier ? supplier.phone : "");

        if (formErrors.supplierId) {
            const newErrors = { ...formErrors };
            delete newErrors.supplierId;
            setFormErrors(newErrors);
        }

        if (id && jwtToken && branchId) {
            try {
                const res = await purchaseService.getSupplierById(jwtToken, id, branchId);
                const supplierData = res?.data || res;
                if (supplierData && Array.isArray(supplierData.products)) {
                    setSupplierProducts(supplierData.products.map(p => p.productId || p.id));
                } else if (supplierData && Array.isArray(supplierData.productIds)) {
                    setSupplierProducts(supplierData.productIds);
                } else {
                    setSupplierProducts([]);
                }
            } catch (err) {
                console.error("Failed to fetch supplier details for products filter:", err);
                setSupplierProducts([]);
            }
        } else {
            setSupplierProducts(null);
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

        const newErrors = { ...formErrors };
        let hasError = false;

        if (field === "costPrice" && finalValue !== "" && newItems[index].mrp) {
            if (parseFloat(finalValue) > parseFloat(newItems[index].mrp)) {
                if (!newErrors.items) newErrors.items = [];
                if (!newErrors.items[index]) newErrors.items[index] = {};
                newErrors.items[index].costPrice = `Max: ${newItems[index].mrp}`;
                hasError = true;
            }
        }

        if (!hasError && newErrors.items?.[index]?.[field]) {
            if (newErrors.items?.[index]) {
                delete newErrors.items[index][field];
                if (Object.keys(newErrors.items[index]).length === 0) {
                    newErrors.items[index] = null;
                }
            }
        }
        setFormErrors(newErrors);
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
            mrp: variant.mrp ? Number(variant.mrp).toFixed(getAmountDecimalPlaces()) : "",
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
            mrp: variant.mrp ? Number(variant.mrp).toFixed(getAmountDecimalPlaces()) : "",
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

            // Show toast based on error type
            if (errors.branchId || errors.supplierId || errors.orderDate === "Order date is required") {
                toast.error("Please fill all required fields correctly.");
            } else if (errors.orderDate === "Future dates are not allowed") {
                toast.error("Order date cannot be in the future.");
            } else if (errors.items) {
                const hasCostError = errors.items.some(e => e && e.costPrice);
                if (hasCostError) {
                    toast.error("Cost Price cannot be greater than MRP.");
                } else {
                    toast.error("Please fill all required item details.");
                }
            }

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
                    orderQuantity: parseFloat(i.orderQty),
                    costPrice: parseFloat(i.costPrice) || 0
                })),
                overallTax: transactionWiseTax ? overallTax : { value: 0, type: '%' },
                overallDiscount: transactionWiseDiscount ? overallDiscount : { value: 0, type: '%' }
            };

            const res = requestId
                ? await purchaseService.updatePurchaseOrder(jwtToken, requestId, payload)
                : await purchaseService.createPurchaseOrder(jwtToken, payload);

            console.log("Submit Response:", res);
            if (res.status === "success" || res.status === "ok" || res.status === 200) {
                toast.success(type === "Drafted" ? "Order Saved as Draft" : "Order Placed Successfully");

                // Check message settings only if it was NOT drafted
                if (type !== "Drafted") {
                    try {
                        console.log("Fetching message settings for branch:", branchId);
                        const settingsRes = await getSettings(jwtToken, branchId);
                        console.log("PO Form - settingsRes:", settingsRes);

                        const msgSettings = settingsRes?.data?.settings?.messages || settingsRes?.settings?.messages;
                        const responseMessages = settingsRes?.data?.messages || settingsRes?.messages || [];

                        const sendPurchaseOrderMessageToSupplier = msgSettings?.sendPurchaseOrderMessageToSupplier;
                        const autoMessageEvents = msgSettings?.autoMessageEvents;

                        const isAutoEnabled = Array.isArray(autoMessageEvents)
                            ? autoMessageEvents.includes("Purchase order")
                            : !!autoMessageEvents?.purchaseOrder;

                        console.log("PO Form - sendPurchaseOrderMessageToSupplier:", sendPurchaseOrderMessageToSupplier);
                        console.log("PO Form - isAutoEnabled:", isAutoEnabled);
                        toast.info(`Msg Setting: SendToSupplier=${sendPurchaseOrderMessageToSupplier || false}, AutoSend=${isAutoEnabled || false}`);

                        if (sendPurchaseOrderMessageToSupplier && !isAutoEnabled) {
                            // Show the modal first
                            const userChoice = await new Promise((resolve) => {
                                setMessageModal({
                                    isOpen: true,
                                    messageId: null,
                                    resolveAction: resolve,
                                });
                            });

                            if (userChoice) {
                                let matchingMsg = responseMessages.find(m => m.eventType === "purchaseOrder");
                                
                                // If not found immediately, retry once after 600ms
                                if (!matchingMsg) {
                                    console.log("Message not found in initial response, retrying...");
                                    await new Promise(r => setTimeout(r, 600));
                                    const refetched = await getSettings(jwtToken, branchId);
                                    const refetchedMsgs = refetched?.data?.messages || refetched?.messages || [];
                                    matchingMsg = refetchedMsgs.find(m => m.eventType === "purchaseOrder");
                                }

                                if (matchingMsg && matchingMsg.vendorMessageId) {
                                    try {
                                        await triggerVendorMessage(jwtToken, matchingMsg.vendorMessageId);
                                        toast.success("Message triggered successfully!");
                                    } catch (err) {
                                        console.error("Failed to trigger message:", err);
                                        toast.error("Failed to trigger message to supplier.");
                                    }
                                } else {
                                    console.error("No purchaseOrder message found to trigger.");
                                }
                            }
                        }
                    } catch (err) {
                        console.error("Settings/message check failed:", err);
                    }
                }

                // Trigger navigation and refresh
                console.log("Invoking onSave callback");
                if (onSave) onSave();

                // Fallback direct navigation
                router.push(`/purchase-bill?tab=Orders${branchId ? `&branchId=${branchId}` : ""}`);
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
                        <label className={styles.label}>Selected Branch <span style={{ color: '#FF4D4F' }}>*</span></label>
                        <div style={{ position: 'relative' }}>
                            <select
                                className={`${styles.select} ${styles.input} ${formErrors.branchId ? styles.errorField : ""}`}
                                value={branchId}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setBranchId(val);
                                    if (val) {
                                        setSelectedBranchId(parseInt(val) || val);
                                    }
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
                        <label className={styles.label}>Select Supplier <span style={{ color: '#FF4D4F' }}>*</span></label>
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
                                {!blockNewSupplierFromTxn && (
                                    <div
                                        className={styles.productOption}
                                        style={{ borderTop: '1px solid #eee', color: '#E9315D', fontWeight: '700', textAlign: 'center', background: '#fefefe' }}
                                        onClick={() => router.push(`/suppliers?action=add&returnUrl=${encodeURIComponent('/purchase-bill/purchase-orders?openAdd=true')}`)}
                                    >
                                        + ADD SUPPLIER
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Supplier Phone Number</label>
                        <input className={styles.input} type="text" placeholder="Phone Number" value={supplierPhone} readOnly />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Date of Order <span style={{ color: '#FF4D4F' }}>*</span></label>
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
                                <td className={`${styles.productSearchWrapper} ${formErrors.items?.[index]?.productId ? styles.errorField : ""}`} style={{ minWidth: '250px', position: 'relative', verticalAlign: 'top' }}>
                                    <div style={{ position: 'relative', width: '100%' }}>
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
                                        <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.4 }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
                                        </div>
                                    </div>
                                    {formErrors.items?.[index]?.productId && (
                                        <div className={styles.errorMessage} style={{ fontSize: '11px', marginTop: '4px' }}>Required</div>
                                    )}
                                    {focusedItemIndex === index && (
                                        <div className={styles.productDropdown}>
                                            {allProducts
                                                .filter(p => !item.productName || p.productName.toLowerCase().includes(item.productName.toLowerCase()))
                                                .filter(p => {
                                                    if (!supplierId || supplierProducts === null) return true;
                                                    return supplierProducts.includes(p.productId);
                                                })
                                                .map(p => (
                                                    <div key={p.productId} className={styles.productOption} onClick={() => selectProduct(index, p)}>
                                                        <span className={styles.productOptionName}>{p.productName}</span>
                                                        <span className={styles.productOptionCode}>{p.ProductCode}</span>
                                                    </div>
                                                ))}
                                            {!blockNewItemsFromTxn && (
                                                <div
                                                    className={styles.productOption}
                                                    style={{ borderTop: '1px solid #eee', color: '#E9315D', fontWeight: '700', textAlign: 'center', background: '#fefefe' }}
                                                    onClick={() => router.push(`/inventory/products?action=add&returnUrl=${encodeURIComponent('/purchase-bill/purchase-orders?openAdd=true')}`)}
                                                >
                                                    + ADD PRODUCT
                                                </div>
                                            )}
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
                                    style={{ textAlign: 'center', color: '#999', position: 'relative', cursor: 'pointer', verticalAlign: 'top' }}
                                    onClick={() => setFocusedVariantIndex(index)}
                                >
                                    <div style={{ position: 'relative', width: '100%', minHeight: '19px' }}>
                                        {item.variant || "--"}
                                        {item.allVariants?.length > 1 && (
                                            <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
                                            </div>
                                        )}
                                    </div>
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
                                <td className={formErrors.items?.[index]?.orderQty ? styles.errorField : ""}>
                                    <input
                                        className={styles.qtyInput}
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
                                <td className={formErrors.items?.[index]?.costPrice ? styles.errorField : ""}>
                                    <input
                                        className={styles.qtyInput}
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

            <div className={styles.globalInputs} style={{ display: 'flex', gap: '20px', marginTop: '20px', padding: '0 20px' }}>
                {transactionWiseTax && (
                    <div className={styles.inputGroup} style={{ flex: 1 }}>
                        <label className={styles.infoLabel} style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '13px' }}>Overall TAX</label>
                        <div className={styles.combinedInput} style={{ display: 'flex', alignItems: 'center' }}>
                            <input type="number" className={styles.miniInput} style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px 0 0 4px' }} value={overallTax.value} onChange={(e) => {
                                let val = e.target.value;
                                if (val.length > 1 && val.startsWith("0") && val[1] !== ".") val = val.slice(1);
                                setOverallTax({ ...overallTax, value: val });
                            }} />
                            <select className={styles.miniSelect} style={{ padding: '8px', border: '1px solid #ccc', borderLeft: 'none', borderRadius: '0 4px 4px 0', background: '#f5f5f5' }} value={overallTax.type} onChange={(e) => setOverallTax({ ...overallTax, type: e.target.value })}>
                                <option>%</option>
                                <option>Rs</option>
                            </select>
                        </div>
                    </div>
                )}
                {transactionWiseDiscount && (
                    <div className={styles.inputGroup} style={{ flex: 1 }}>
                        <label className={styles.infoLabel} style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '13px' }}>Overall Discount</label>
                        <div className={styles.combinedInput} style={{ display: 'flex', alignItems: 'center' }}>
                            <input type="number" className={styles.miniInput} style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px 0 0 4px' }} value={overallDiscount.value} onChange={(e) => {
                                let val = e.target.value;
                                if (val.length > 1 && val.startsWith("0") && val[1] !== ".") val = val.slice(1);
                                setOverallDiscount({ ...overallDiscount, value: val });
                            }} />
                            <select className={styles.miniSelect} style={{ padding: '8px', border: '1px solid #ccc', borderLeft: 'none', borderRadius: '0 4px 4px 0', background: '#f5f5f5' }} value={overallDiscount.type} onChange={(e) => setOverallDiscount({ ...overallDiscount, type: e.target.value })}>
                                <option>Rs</option>
                                <option>%</option>
                            </select>
                        </div>
                    </div>
                )}
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

            {messageModal.isOpen && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                    backdropFilter: "blur(4px)",
                }}>
                    <div style={{
                        background: "#fff",
                        borderRadius: 12,
                        padding: 24,
                        width: "90%",
                        maxWidth: 400,
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                        textAlign: "center",
                    }}>
                        <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: "50%",
                            backgroundColor: "#fdf0f3",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 16px",
                            color: "#e9315d"
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                              <polyline points="22,6 12,13 2,6" />
                            </svg>
                        </div>
                        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600, color: "#111" }}>
                            Send Message to Supplier?
                        </h3>
                        <p style={{ margin: "0 0 24px", fontSize: 14, color: "#666", lineHeight: 1.5 }}>
                            Do you want to send the purchase order created message to the supplier?
                        </p>
                        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                            <button
                                onClick={() => {
                                    setMessageModal({ isOpen: false, messageId: null, resolveAction: null });
                                    if (messageModal.resolveAction) messageModal.resolveAction(false);
                                }}
                                style={{
                                    padding: "10px 20px",
                                    border: "1px solid #ddd",
                                    background: "#fff",
                                    borderRadius: 6,
                                    cursor: "pointer",
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: "#666",
                                    minWidth: 80,
                                }}
                            >
                                No
                            </button>
                            <button
                                onClick={() => {
                                    setMessageModal({ isOpen: false, messageId: null, resolveAction: null });
                                    if (messageModal.resolveAction) messageModal.resolveAction(true);
                                }}
                                style={{
                                    padding: "10px 20px",
                                    border: "none",
                                    background: "#e9315d",
                                    color: "#fff",
                                    borderRadius: 6,
                                    cursor: "pointer",
                                    fontSize: 14,
                                    fontWeight: 500,
                                    minWidth: 80,
                                }}
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseOrderForm;
