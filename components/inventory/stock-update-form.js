import { toApiDateOnly } from "@/utilities/date-time-utils";
import React, { useState, useEffect, useRef } from "react";
import { dateOnlyWithTimeZone, parseWallClockDate } from "@/utilities/date-time-utils";
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

const IconTrash = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
);


const IconChevronDown = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

const REASONS = ["Miscount", "Damage", "Internal purpose", "Theft", "Expired", "OnHold", "Open Stock"];

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
const ProductSelect = ({ products, value, onChange, onAddNew, error, disabled = false }) => {
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
        <div className={`${styles.customDropdownContainer} ${disabled ? styles.disabledDropdown : ""}`} ref={containerRef}>
            <div className={`${styles.dropdownTrigger} ${error ? styles.errorField : ""} ${styles.dropdownTriggerReset}`}>
                <input
                    type="text"
                    className={`${styles.tableInput} ${styles.leftAlignInput}`}
                    placeholder="SELECT PRODUCT"
                    value={searchTerm}
                    onChange={(e) => {
                        if (disabled) return;
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => !disabled && setIsOpen(true)}
                    readOnly={disabled}
                />
                <div className={styles.chevronContainer} onClick={() => !disabled && setIsOpen(!isOpen)}>
                    <IconChevronDown />
                </div>
            </div>
            {isOpen && !disabled && (
                <div className={styles.dropdownMenu}>
                    {filtered.length === 0 ? (
                        <div className={`${styles.dropdownOption} ${styles.mutedText}`}>No products found</div>
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

const BatchSelect = ({ batches, value, onChange, error, disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(value || "");
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

    useEffect(() => {
        if (!isOpen) {
            setSearchTerm(value || "");
        }
    }, [value, isOpen]);

    const filtered = (batches || []).filter(b =>
        b.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`${styles.customDropdownContainer} ${disabled ? styles.disabledDropdown : ""}`} ref={containerRef}>
            <div className={`${styles.dropdownTrigger} ${error ? styles.errorField : ""} ${styles.dropdownTriggerReset}`}>
                <input
                    type="text"
                    className={`${styles.tableInput} ${styles.leftAlignInput}`}
                    placeholder="SELECT OR ENTER BATCH"
                    value={searchTerm}
                    onChange={(e) => {
                        if (disabled) return;
                        setSearchTerm(e.target.value);
                        onChange(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => !disabled && setIsOpen(true)}
                    readOnly={disabled}
                />
                <div className={styles.chevronContainer} onClick={() => !disabled && setIsOpen(!isOpen)}>
                    <IconChevronDown />
                </div>
            </div>
            {isOpen && !disabled && (
                <div className={styles.dropdownMenu}>
                    {filtered.length === 0 ? (
                        <div className={`${styles.dropdownOption} ${styles.mutedText}`}>No batches found</div>
                    ) : (
                        filtered.map(b => (
                            <div
                                key={b.batchNumber}
                                className={styles.dropdownOption}
                                onClick={() => {
                                    onChange(b.batchNumber);
                                    setSearchTerm(b.batchNumber);
                                    setIsOpen(false);
                                }}
                            >
                                {b.batchNumber}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

const StockUpdateForm = ({ onClose, onSave, isEmbedded = false, mode = "Add", initialId = null, initialData = null }) => {
    const { jwtToken, userInfo } = useStore();
    const { branches, branchId: globalBranchId } = useDashboardData({ skipReviews: true });
    const [branchId, setBranchId] = useState(globalBranchId || "91");
    const [updateDate, setUpdateDate] = useState(toApiDateOnly(new Date()));
    const [products, setProducts] = useState([]);
    const [rows, setRows] = useState([
        { id: Date.now(), productId: "", productName: "", productCode: "", variantId: "", sourceStatus: "", batchNumber: "", currentQty: 0, add: 0, remove: 0, updatedQty: 0, reason: "", expiryDate: "", costPrice: 0, total: 0 }
    ]);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [isProductsLoaded, setIsProductsLoaded] = useState(false);
    const [errors, setErrors] = useState({}); // { "row_index_field": true }
    const tableRef = useRef(null);

    useEffect(() => {
        if (globalBranchId && mode !== "View") {
            setBranchId(globalBranchId);
        }
    }, [globalBranchId, mode]);

    useEffect(() => {
        if (jwtToken && branchId) {
            // In View mode, wait until stock update details are fetched before loading products
            if (mode === "View" && !rows[0].productId) {
                return;
            }
            loadProducts();
        }
    }, [jwtToken, branchId, rows[0].productId]);

    const loadProducts = async () => {
        setIsProductsLoaded(false);
        try {
            const [data, historyData] = await Promise.all([
                productService.getAllProductsBrief(jwtToken, branchId),
                productService.getStockUpdates(jwtToken, branchId)
            ]);
            
            const productsList = Array.isArray(data) ? data : [];
            const historyList = Array.isArray(historyData) ? historyData : [];

            // Merge missing batches from history to ensure batches with 0 open qty still appear
            if (historyList.length > 0 && productsList.length > 0) {
                const sortedHistory = [...historyList].sort((a, b) => {
                    const dateA = new Date(a.modifiedDate || a.createdDate || 0).getTime();
                    const dateB = new Date(b.modifiedDate || b.createdDate || 0).getTime();
                    if (dateB !== dateA) return dateB - dateA;
                    return (b.stockUpdateId || 0) - (a.stockUpdateId || 0);
                });
                sortedHistory.forEach(update => {
                    if (update.batchNumber && update.variantId) {
                        const product = productsList.find(p => p.productId === parseInt(update.productId));
                        if (product && product.variants) {
                            const variant = product.variants.find(v => v.variantId === parseInt(update.variantId));
                            if (variant) {
                                if (!variant.batchNumbers) variant.batchNumbers = [];
                                const existingBatch = variant.batchNumbers.find(b => b.batchNumber === update.batchNumber);
                                if (!existingBatch) {
                                    variant.batchNumbers.push({
                                        batchNumber: update.batchNumber,
                                        expiryDate: update.expDate || update.expiryDate || "0000-00-00",
                                        costPrice: update.billItem?.costPrice || update.costPrice || variant.costPrice || 0,
                                        mrp: variant.mrp || 0,
                                        quantity: 0,
                                        isFromHistory: true,
                                        stockUpdates: {
                                            openStockQuantity: 0,
                                            onHoldQuantity: 0,
                                            totalQuantity: 0
                                        }
                                    });
                                }
                            }
                        }
                    }
                });
            }

            setProducts(productsList);
        } finally {
            setIsProductsLoaded(true);
        }
    };

    useEffect(() => {
        if (mode === "View" && initialId && jwtToken) {
            fetchStockUpdateDetails();
        }
    }, [mode, initialId, jwtToken]);

    const fetchStockUpdateDetails = async () => {
        setIsFetching(true);
        try {
            const response = await productService.getStockUpdateById(jwtToken, initialId);
            const data = response?.data?.data || response?.data || response;
            if (data) {
                const isOS = (data.sourceStatus === "openStock" || data.sourceStatus === "Open Stock" || (!data.sourceStatus && (data.reason === "Open Stock" || data.reason === "openStock")));
                const isHold = (data.sourceStatus === "holdQty" || data.sourceStatus === "onHold" || data.sourceStatus === "Hold Qty" || (!data.sourceStatus && (data.reason === "Hold Qty" || data.reason === "holdQty" || data.reason === "onHold")));

                const openStockQuantity = data.variant?.stockUpdates?.openStockQuantity ?? data.stockUpdates?.openStockQuantity;
                const qtyForSale = data.variant?.stockUpdates?.qtyForSale ?? data.stockUpdates?.qtyForSale;
                const onHoldQuantity = data.variant?.stockUpdates?.onHoldQuantity ?? data.stockUpdates?.onHoldQuantity;

                let baseQty = 0;
                if (isHold && onHoldQuantity !== undefined && onHoldQuantity !== null) {
                    baseQty = onHoldQuantity;
                } else if (openStockQuantity !== undefined && openStockQuantity !== null) {
                    baseQty = openStockQuantity;
                } else if (qtyForSale !== undefined && qtyForSale !== null) {
                    baseQty = qtyForSale;
                } else {
                    baseQty = data.updatedQty || 0;
                }

                let updatedQtyVal = baseQty;
                let currentQtyVal = updatedQtyVal - (data.add || 0) + (data.remove || 0);

                const openQtyVal = (openStockQuantity !== undefined && openStockQuantity !== null) ? openStockQuantity : (data.openQty ?? updatedQtyVal);
                const holdQtyVal = (onHoldQuantity !== undefined && onHoldQuantity !== null) ? onHoldQuantity : (data.holdQty ?? updatedQtyVal);

                let displayCurrentQty = isOS ? (openQtyVal - (data.add || 0) + (data.remove || 0)) : (isHold ? (holdQtyVal - (data.add || 0) + (data.remove || 0)) : (data.currentQty !== undefined && data.currentQty !== null ? data.currentQty : currentQtyVal));
                let displayUpdatedQty = isOS ? openQtyVal : (isHold ? holdQtyVal : (data.updatedQty !== undefined && data.updatedQty !== null ? data.updatedQty : updatedQtyVal));

                const reasonLower = (data.reason || "").trim().toLowerCase();
                if (reasonLower === "marked damaged items as waste" || reasonLower === "marked expired items as waste" || reasonLower === "restored items to stock") {
                    if (data.currentQty !== undefined && data.currentQty !== null) displayCurrentQty = data.currentQty;
                    if (data.updatedQty !== undefined && data.updatedQty !== null) displayUpdatedQty = data.updatedQty;
                }

                // Map API response to form row using correct keys from StockUpdateView
                const mappedRow = {
                    id: data.stockUpdateId,
                    productId: parseInt(data.productId || data.product?.productId),
                    productName: data.product?.productName || data.itemName,
                    productCode: data.product?.ProductCode || data.productCode || data.product?.productCode,
                    variantId: parseInt(data.variantId || data.variant?.variantId),
                    sourceStatus: isOS ? "Open Stock" : (isHold ? "Hold Qty" : ""),
                    batchNumber: data.billItem?.batchNumber || data.batchNumber || "",
                    currentQty: displayCurrentQty,
                    add: data.add || 0,
                    remove: data.remove || 0,
                    updatedQty: displayUpdatedQty,
                    reason: (() => {
                        const r = data.reason || "";
                        const rLower = r.toLowerCase();
                        if (rLower === "marked damaged items as waste") return "Damaged";
                        if (rLower === "marked expired items as waste") return "Expired";
                        return r;
                    })(),
                    expiryDate: data.billItem?.expiryDate?.split('T')[0] || data.expiryDate?.split('T')[0] || "",
                    costPrice: data.billItem?.costPrice || data.costPrice || 0,
                    total: (() => {
                        const rawVal = parseFloat(data.totalValue || 0);
                        const addQty = parseInt(data.add) || 0;
                        const removeQty = parseInt(data.remove) || 0;
                        const cost = parseFloat(data.billItem?.costPrice || data.costPrice || 0);
                        const calcVal = rawVal !== 0 ? rawVal : (addQty - removeQty) * cost;
                        return removeQty > 0 ? -Math.abs(calcVal) : Math.abs(calcVal);
                    })()
                };
                setRows([mappedRow]);
                if (data.branchId || data.branch?.id) setBranchId(String(data.branchId || data.branch?.id));
                if (data.createdDate) setUpdateDate(data.createdDate.split('T')[0]);
            }
        } catch (error) {
            console.error("Error fetching stock update details:", error);
            toast.error("Failed to load stock update details");
        } finally {
            setIsFetching(false);
        }
    };

    const addRow = () => {
        setRows([...rows, { id: Date.now(), productId: "", productName: "", productCode: "", variantId: "", sourceStatus: "", batchNumber: "", currentQty: 0, add: 0, remove: 0, updatedQty: 0, reason: "", expiryDate: "", costPrice: 0, total: 0 }]);
    };

    const recalculateAllRows = (newRows) => {
        if (mode === "View") return;
        const runningQuantities = {};

        newRows.forEach((row, idx) => {
            if (!row.productId || !row.variantId) {
                row.currentQty = 0;
                row.updatedQty = 0;
                row.total = 0;
                return;
            }

            const variantId = parseInt(row.variantId);
            const product = products.find(p => p.productId === row.productId);
            const variant = product?.variants?.find(v => v.variantId === variantId);

            if (!variant) {
                row.currentQty = 0;
                row.updatedQty = 0;
                row.total = 0;
                return;
            }

            const key = row.batchNumber ? `${variantId}-${row.batchNumber}` : `${variantId}`;

            if (!runningQuantities[key]) {
                let stockData = variant.stockUpdates || {};
                let totalStock = variant.currentQty ?? variant.stockQty ?? 0;
                let openStockVal = stockData.openStockQuantity || variant.openStockQuantity || variant.openingStock || 0;
                let holdQtyVal = stockData.onHoldQuantity || variant.onHoldQuantity || variant.holdQty || variant.holdQuantity || 0;

                if (row.batchNumber && variant.batchNumbers) {
                    const batch = variant.batchNumbers.find(b => b.batchNumber === row.batchNumber);
                    if (batch) {
                        if (batch.isFromHistory) {
                            totalStock = variant.currentQty ?? variant.stockQty ?? 0;
                            openStockVal = variant.stockUpdates?.openStockQuantity || variant.openStockQuantity || variant.openingStock || 0;
                            holdQtyVal = variant.stockUpdates?.onHoldQuantity || variant.onHoldQuantity || variant.holdQty || variant.holdQuantity || 0;
                        } else {
                            stockData = batch.stockUpdates || {};
                            totalStock = batch.quantity ?? 0;
                            openStockVal = (stockData.openStockQuantity || batch.openStockQuantity || batch.openQty || batch.openingStock || batch.quantity || 0) || (variant.stockUpdates?.openStockQuantity || variant.openStockQuantity || variant.openingStock || 0);
                            holdQtyVal = (stockData.onHoldQuantity || batch.onHoldQuantity || batch.holdQty || batch.holdQuantity || 0) || (variant.stockUpdates?.onHoldQuantity || variant.onHoldQuantity || variant.holdQty || variant.holdQuantity || 0);
                        }
                    }
                }

                runningQuantities[key] = {
                    openStock: openStockVal,
                    holdQty: holdQtyVal,
                    totalQty: stockData.totalQuantity ?? totalStock
                };
            }

            // Determine current quantity based on source status
            let currentVal = 0;
            if (row.sourceStatus === "Open Stock") {
                currentVal = runningQuantities[key].openStock;
            } else if (row.sourceStatus === "Hold Qty") {
                currentVal = runningQuantities[key].holdQty;
            } else {
                currentVal = runningQuantities[key].totalQty;
            }

            row.currentQty = currentVal;

            const add = parseInt(row.add) || 0;
            const remove = parseInt(row.remove) || 0;
            const cost = parseFloat(row.costPrice) || 0;

            row.updatedQty = currentVal + add - remove;
            row.total = (add - remove) * cost;

            // Update running quantities for subsequent rows
            if (row.sourceStatus === "Open Stock") {
                runningQuantities[key].openStock = currentVal + add - remove;
                if (row.reason === "OnHold") {
                    runningQuantities[key].holdQty += remove;
                }
            } else if (row.sourceStatus === "Hold Qty") {
                runningQuantities[key].holdQty = currentVal + add - remove;
                if (row.reason === "Open Stock") {
                    runningQuantities[key].openStock += remove;
                }
            }
        });
    };

    const validateAllRows = (newRows, currentErrors = {}) => {
        const newErrors = { ...currentErrors };

        newRows.forEach((row, index) => {
            const removeQty = parseInt(row.remove) || 0;
            const currentQty = parseInt(row.currentQty) || 0;
            const addQty = parseInt(row.add) || 0;

            if (removeQty > currentQty) {
                newErrors[`${index}_remove`] = "Cannot exceed current quantity";
            } else if (removeQty < 0) {
                newErrors[`${index}_remove`] = "Cannot be negative";
            } else {
                if (newErrors[`${index}_remove`] === "Cannot exceed current quantity" || newErrors[`${index}_remove`] === "Cannot be negative") {
                    delete newErrors[`${index}_remove`];
                }
            }

            if (addQty < 0) {
                newErrors[`${index}_add`] = "Cannot be negative";
            } else {
                if (newErrors[`${index}_add`] === "Cannot be negative") {
                    delete newErrors[`${index}_add`];
                }
            }
        });

        return newErrors;
    };

    useEffect(() => {
        if (products.length > 0 && mode !== "View") {
            const newRows = [...rows];
            recalculateAllRows(newRows);
            setRows(newRows);
        }
    }, [products]);

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
        newRows[index].batchNumber = "";
        newRows[index].add = 0;
        newRows[index].remove = 0;
        newRows[index].reason = "";
        newRows[index].costPrice = variant.costPrice || 0;
        newRows[index].expiryDate = variant.expiryDate?.split('T')[0] || "";

        recalculateAllRows(newRows);

        let newErrors = { ...errors };
        delete newErrors[`${index}_variant`];
        newErrors = validateAllRows(newRows, newErrors);
        setErrors(newErrors);
        setRows(newRows);
    };

    const removeRow = (id) => {
        if (rows.length > 1) {
            const rowIndex = rows.findIndex(r => r.id === id);
            if (rowIndex !== -1) {
                const newRows = rows.filter(r => r.id !== id);

                recalculateAllRows(newRows);

                // Adjust the keys in errors state to prevent shifted error displays
                let newErrors = {};
                Object.keys(errors).forEach(key => {
                    const parts = key.split('_');
                    if (parts.length > 1) {
                        const idx = parseInt(parts[0]);
                        const fieldName = parts.slice(1).join('_');
                        if (idx < rowIndex) {
                            newErrors[key] = errors[key];
                        } else if (idx > rowIndex) {
                            newErrors[`${idx - 1}_${fieldName}`] = errors[key];
                        }
                    } else {
                        newErrors[key] = errors[key];
                    }
                });

                newErrors = validateAllRows(newRows, newErrors);
                setErrors(newErrors);
                setRows(newRows);
            }
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
        newRows[index].sourceStatus = "";
        newRows[index].batchNumber = "";
        newRows[index].add = 0;
        newRows[index].remove = 0;
        newRows[index].reason = "";

        // Default to first variant if exists
        if (product.variants?.length > 0) {
            const v = product.variants[0];
            newRows[index].variantId = v.variantId;
            newRows[index].costPrice = v.costPrice || 0;
            newRows[index].expiryDate = v.expiryDate?.split('T')[0] || "";
        } else {
            newRows[index].variantId = "";
            newRows[index].costPrice = 0;
            newRows[index].expiryDate = "";
        }

        recalculateAllRows(newRows);

        let newErrors = { ...errors };
        delete newErrors[`${index}_product`];
        newErrors = validateAllRows(newRows, newErrors);
        setErrors(newErrors);
        setRows(newRows);
    };

    const updateRowField = (index, field, value) => {
        const newRows = [...rows];

        if (field === 'add') {
            const parsedVal = parseInt(value) || 0;
            newRows[index].add = parsedVal;
            if (parsedVal > 0) newRows[index].remove = 0;
        } else if (field === 'remove') {
            const parsedVal = parseInt(value) || 0;
            newRows[index].remove = parsedVal;
            if (parsedVal > 0) newRows[index].add = 0;
        } else {
            newRows[index][field] = value;
        }

        // Handle reason change: Clear invalid fields
        if (field === 'reason') {
            if (value && value !== "Miscount") {
                // It's a removal reason (Damage, Theft, OnHold, Open Stock, etc.)
                newRows[index].add = 0;
            }
            if (!value) {
                newRows[index].add = 0;
                newRows[index].remove = 0;
            }
        }

        // Handle source status change
        if (field === 'sourceStatus') {
            if (!value) {
                newRows[index].add = 0;
                newRows[index].remove = 0;
                newRows[index].reason = "";
            }
        }

        // Handle batchNumber change
        if (field === 'batchNumber') {
            const product = products.find(p => p.productId === newRows[index].productId);
            const variant = product?.variants?.find(v => v.variantId === newRows[index].variantId);
            const batch = variant?.batchNumbers?.find(b => b.batchNumber === value);
            if (batch) {
                newRows[index].costPrice = batch.costPrice || variant?.costPrice || 0;
                if (batch.expiryDate && batch.expiryDate !== "0000-00-00") {
                    newRows[index].expiryDate = batch.expiryDate.split('T')[0];
                }
            } else {
                newRows[index].costPrice = variant?.costPrice || 0;
            }
        }

        recalculateAllRows(newRows);

        // Clear error for this field
        let newErrors = { ...errors };
        delete newErrors[`${index}_${field}`];
        if (field === 'add' || field === 'remove') {
            delete newErrors[`${index}_add`];
            delete newErrors[`${index}_remove`];
        }
        if (field === 'reason') {
            delete newErrors[`${index}_expiryDate`];
        }

        newErrors = validateAllRows(newRows, newErrors);
        setErrors(newErrors);
        setRows(newRows);
    };

    const handleSubmit = async () => {
        const newErrors = {};

        rows.forEach((row, index) => {
            if (!row.productId) {
                newErrors[`${index}_product`] = "Product is required";
            }
            if (!row.add && !row.remove) {
                newErrors[`${index}_add`] = "Required";
                newErrors[`${index}_remove`] = "Required";
            }
            if (!row.reason) {
                newErrors[`${index}_reason`] = "Reason is required";
            }
            if (!row.sourceStatus) {
                newErrors[`${index}_sourceStatus`] = "Source is required";
            }
            if (row.reason === "Expired" && !row.expiryDate) {
                newErrors[`${index}_expiryDate`] = "Expiry Date is required";
            }
            if (!row.batchNumber) {
                newErrors[`${index}_batchNumber`] = "Batch number is required";
            }

            const removeQty = parseInt(row.remove) || 0;
            const currentQty = parseInt(row.currentQty) || 0;
            const addQty = parseInt(row.add) || 0;

            if (removeQty > currentQty) {
                newErrors[`${index}_remove`] = "Cannot exceed current quantity";
            } else if (removeQty < 0) {
                newErrors[`${index}_remove`] = "Cannot be negative";
            }
            if (addQty < 0) {
                newErrors[`${index}_add`] = "Cannot be negative";
            }
        });

        if (!updateDate) {
            newErrors["updateDate"] = "Update date is required";
        }

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
            const runningQuantities = {};

            for (const row of rows) {
                const createdDateFields = updateDate
                    ? dateOnlyWithTimeZone(
                        "createdDate",
                        parseWallClockDate(updateDate) || new Date(updateDate),
                    )
                    : {};
                const stockUpdatedDateFields = updateDate
                    ? dateOnlyWithTimeZone(
                        "stockUpdatedDate",
                        parseWallClockDate(updateDate) || new Date(updateDate),
                    )
                    : {};

                const product = products.find(p => p.productId === row.productId);
                const variantId = parseInt(row.variantId);
                const variant = product?.variants?.find(v => v.variantId === variantId);
                const batchKey = row.batchNumber ? `${variantId}-${row.batchNumber}` : `${variantId}`;
                let openStockVal = variant?.stockUpdates?.openStockQuantity || variant?.openStockQuantity || variant?.openingStock || 0;
                let holdQtyVal = variant?.stockUpdates?.onHoldQuantity || variant?.onHoldQuantity || variant?.holdQty || variant?.holdQuantity || 0;

                if (!runningQuantities[batchKey]) {
                    if (row.batchNumber && variant?.batchNumbers) {
                        const batch = variant.batchNumbers.find(b => b.batchNumber === row.batchNumber);
                        if (batch) {
                            if (batch.isFromHistory) {
                                openStockVal = variant?.stockUpdates?.openStockQuantity || variant?.openStockQuantity || variant?.openingStock || 0;
                                holdQtyVal = variant?.stockUpdates?.onHoldQuantity || variant?.onHoldQuantity || variant?.holdQty || variant?.holdQuantity || 0;
                            } else {
                                const stockData = batch.stockUpdates || {};
                                openStockVal = (stockData.openStockQuantity || batch.openStockQuantity || batch.openQty || batch.openingStock || batch.quantity || 0) || (variant?.stockUpdates?.openStockQuantity || variant?.openStockQuantity || variant?.openingStock || 0);
                                holdQtyVal = (stockData.onHoldQuantity || batch.onHoldQuantity || batch.holdQty || batch.holdQuantity || 0) || (variant?.stockUpdates?.onHoldQuantity || variant?.onHoldQuantity || variant?.holdQty || variant?.holdQuantity || 0);
                            }
                        }
                    }

                    runningQuantities[batchKey] = {
                        openStock: openStockVal,
                        holdQty: holdQtyVal
                    };
                }

                const baseOpenStock = runningQuantities[batchKey].openStock;
                const baseHoldQty = runningQuantities[batchKey].holdQty;

                let finalOpenQty = baseOpenStock;
                let finalHoldQty = baseHoldQty;

                const add = parseInt(row.add) || 0;
                const remove = parseInt(row.remove) || 0;

                if (row.sourceStatus === "Open Stock") {
                    finalOpenQty = baseOpenStock + add - remove;
                    if (row.reason === "OnHold") {
                        finalHoldQty = baseHoldQty + remove;
                    }
                    runningQuantities[batchKey].openStock = finalOpenQty;
                    runningQuantities[batchKey].holdQty = finalHoldQty;
                } else if (row.sourceStatus === "Hold Qty") {
                    finalHoldQty = baseHoldQty + add - remove;
                    if (row.reason === "Open Stock") {
                        finalOpenQty = baseOpenStock + remove;
                    }
                    runningQuantities[batchKey].openStock = finalOpenQty;
                    runningQuantities[batchKey].holdQty = finalHoldQty;
                }

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
                    ...createdDateFields,
                    ...stockUpdatedDateFields,
                    productsBillItemsId: null,
                    consumptionId: null,
                    addItem: null,
                    updatedFrom: "Stock Update",
                    sourceStatus: row.sourceStatus === "Open Stock" ? "openStock" : (row.sourceStatus === "Hold Qty" ? "onHold" : null),
                    openQty: finalOpenQty,
                    holdQty: finalHoldQty,
                    stock: parseInt(row.currentQty),
                    updatedQty: row.sourceStatus === "Open Stock" ? finalOpenQty : (row.sourceStatus === "Hold Qty" ? finalHoldQty : parseInt(row.updatedQty))
                };
                if (row.reason === "Expired") {
                    payload.expDate = row.expiryDate;
                }
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
    const anyRemoval = rows.some(r => r.reason && ["Damage", "Internal purpose", "Theft", "Expired", "OnHold", "Open Stock"].includes(r.reason));
    const anyEmptyReason = rows.some(r => !r.reason);

    const showAddColumn = mode === "View" || (mode === "Add" && (anyEmptyReason || anyMiscount));
    const showRemoveColumn = mode === "View" || (mode === "Add" && (anyEmptyReason || anyMiscount || anyRemoval));

    return (
        <>
            <div className={isEmbedded ? styles.embeddedContainer : styles.modal}>
                {showAddProduct && (
                    <ProductFormManager onClose={() => { setShowAddProduct(false); loadProducts(); }} mode="Add" />
                )}

                {!isEmbedded && (
                    <div className={styles.header}>
                        <h2>{mode === "View" ? "Stock Update Details" : "Update Stock"}</h2>
                        <div className={styles.headerActions}>
                            <span className={styles.closeBtn} onClick={onClose}><IconX /></span>
                        </div>
                    </div>
                )}

                {(isFetching || (mode !== "Add" && !isProductsLoaded)) ? (
                    <div style={{ padding: '80px 20px', textAlign: 'center', color: '#666', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ margin: '0 auto 16px auto', border: '3px solid #f3f3f3', borderTop: '3px solid #E9315D', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
                        <div style={{ fontWeight: 600, fontSize: '14px', letterSpacing: '0.5px' }}>LOADING DETAILS...</div>
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : (
                    <>
                        <div className={styles.formContent}>
                            <div className={styles.topRow}>
                                <div className={styles.inputField}>
                                    <label>Select Branch <span>*</span></label>
                                    <select
                                        className={styles.topInput}
                                        value={branchId}
                                        onChange={(e) => setBranchId(e.target.value)}
                                        disabled={mode === "View"}
                                    >
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
                                    <label>UPDATED DATE <span>*</span></label>
                                    <input
                                        className={`${styles.topInput} ${errors.updateDate ? styles.errorField : ""}`}
                                        type="date"
                                        value={updateDate}
                                        max={toApiDateOnly(new Date())}
                                        onChange={(e) => {
                                            setUpdateDate(e.target.value);
                                            if (errors.updateDate) {
                                                const newErrs = { ...errors };
                                                delete newErrs.updateDate;
                                                setErrors(newErrs);
                                            }
                                        }}
                                        disabled={mode === "View"}
                                    />
                                    {errors.updateDate && <span className={styles.errorText}>{errors.updateDate}</span>}
                                </div>
                            </div>

                            <div className={styles.tableContainer}>
                                <table className={styles.stockUpdateTable}>
                                    <thead>
                                        <tr>
                                            <th className={styles.colProd}>Product Name</th>
                                            <th className={`${styles.colCode} ${styles.centerAlign}`}>Batch Number</th>
                                            <th className={`${styles.colVar} ${styles.centerAlign}`}>Variants</th>
                                            <th className={`${styles.colSource} ${styles.centerAlign}`}>Source Status</th>
                                            <th className={`${styles.colQty} ${styles.centerAlign}`}>Quantity</th>
                                            <th className={`${styles.colReason} ${styles.centerAlign}`}>Reason</th>
                                            {showAddColumn && <th className={`${styles.colSmall} ${styles.centerAlign}`}>Add</th>}
                                            {showRemoveColumn && <th className={`${styles.colSmall} ${styles.centerAlign}`}>Remove</th>}
                                            <th className={`${styles.colExp} ${styles.centerAlign}`}>Updated Qty</th>
                                            <th className={`${styles.colExpiry} ${styles.centerAlign}`}>Exp. Date</th>
                                            <th className={`${styles.colCost} ${styles.centerAlign}`}>Cost Price</th>
                                            <th className={`${styles.colTotal} ${styles.rightAlign}`}>Total (₹)</th>
                                            <th className={styles.colAction}></th>
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
                                                                disabled={mode === "View"}
                                                                error={errors[`${index}_product`]}
                                                            />
                                                            {errors[`${index}_product`] && <span className={styles.errorText}>{errors[`${index}_product`]}</span>}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {(() => {
                                                            const variant = currentProduct?.variants?.find(v => v.variantId === parseInt(row.variantId));
                                                            return (
                                                                <BatchSelect
                                                                    batches={variant?.batchNumbers || []}
                                                                    value={row.batchNumber}
                                                                    onChange={(val) => updateRowField(index, 'batchNumber', val)}
                                                                    error={errors[`${index}_batchNumber`]}
                                                                    disabled={mode === "View"}
                                                                />
                                                            );
                                                        })()}
                                                        {errors[`${index}_batchNumber`] && <span className={styles.errorText}>{errors[`${index}_batchNumber`]}</span>}
                                                    </td>
                                                    <td>
                                                        <select
                                                            className={styles.tableSelect}
                                                            value={row.variantId}
                                                            onChange={(e) => handleVariantChange(index, e.target.value)}
                                                            disabled={mode === "View"}
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
                                                        <div id={`field_${index}_sourceStatus`}>
                                                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                                <select
                                                                    className={`${styles.tableSelect} ${errors[`${index}_sourceStatus`] ? styles.errorField : ""}`}
                                                                    style={{ paddingRight: '28px', appearance: 'none', WebkitAppearance: 'none', backgroundImage: 'none' }}
                                                                    value={row.sourceStatus}
                                                                    onChange={(e) => updateRowField(index, 'sourceStatus', e.target.value)}
                                                                    disabled={mode === "View"}
                                                                >
                                                                    <option value="">SELECT SOURCE</option>
                                                                    <option value="Open Stock">Open Stock</option>
                                                                    <option value="Hold Qty">Hold Qty</option>
                                                                </select>
                                                                <span style={{ position: 'absolute', right: '6px', pointerEvents: 'none', display: 'flex', alignItems: 'center', color: '#999' }}>
                                                                    <IconChevronDown />
                                                                </span>
                                                            </div>
                                                            {errors[`${index}_sourceStatus`] && <span className={styles.errorText}>{errors[`${index}_sourceStatus`]}</span>}
                                                        </div>
                                                    </td>
                                                    <td><input className={`${styles.tableInput} ${styles.boldText}`} readOnly value={row.currentQty} /></td>
                                                    <td>
                                                        <select id={`field_${index}_reason`} className={`${styles.tableSelect} ${errors[`${index}_reason`] ? styles.errorField : ""}`} value={row.reason} onChange={(e) => updateRowField(index, 'reason', e.target.value)} disabled={mode === "View"}>
                                                            <option value="">SELECT REASON</option>
                                                            {REASONS.filter(r => {
                                                                if (row.sourceStatus === "Open Stock" && r === "Open Stock") return false;
                                                                if (row.sourceStatus === "Hold Qty" && r === "OnHold") return false;
                                                                return true;
                                                            }).map(r => <option key={r} value={r}>{r}</option>)}
                                                            {mode === "View" && row.reason && !REASONS.includes(row.reason) && (
                                                                <option value={row.reason}>{row.reason}</option>
                                                            )}
                                                        </select>
                                                        {errors[`${index}_reason`] && <span className={styles.errorText}>{errors[`${index}_reason`]}</span>}
                                                    </td>
                                                    {showAddColumn && (
                                                        <td>
                                                            {(row.reason === "Miscount" || !row.reason || mode === "View") ? (
                                                                <input
                                                                    id={`field_${index}_add`}
                                                                    className={`${styles.tableInput} ${errors[`${index}_add`] ? styles.errorField : ""}`}
                                                                    type="number"
                                                                    min="0"
                                                                    value={row.add || ""}
                                                                    onChange={(e) => updateRowField(index, 'add', e.target.value)}
                                                                    placeholder="0"
                                                                    disabled={mode === "View" || !row.sourceStatus || !row.reason}
                                                                />
                                                            ) : (
                                                                <div className={styles.disabledPlaceholder}>--</div>
                                                            )}
                                                            {errors[`${index}_add`] && <span className={styles.errorText}>{errors[`${index}_add`]}</span>}
                                                        </td>
                                                    )}
                                                    {showRemoveColumn && (
                                                        <td>
                                                            <input
                                                                id={`field_${index}_remove`}
                                                                className={`${styles.tableInput} ${errors[`${index}_remove`] ? styles.errorField : ""}`}
                                                                type="number"
                                                                min="0"
                                                                value={row.remove || ""}
                                                                onChange={(e) => updateRowField(index, 'remove', e.target.value)}
                                                                placeholder="0"
                                                                disabled={mode === "View" || !row.sourceStatus || !row.reason}
                                                            />
                                                            {errors[`${index}_remove`] && <span className={styles.errorText}>{errors[`${index}_remove`]}</span>}
                                                        </td>
                                                    )}
                                                    <td><input className={`${styles.tableInput} ${styles.boldText}`} readOnly value={row.updatedQty} /></td>
                                                    <td>
                                                        <input
                                                            id={`field_${index}_expiryDate`}
                                                            className={`${styles.tableInput} ${errors[`${index}_expiryDate`] ? styles.errorField : ""}`}
                                                            type={row.reason === "Expired" ? "date" : "text"}
                                                            value={row.expiryDate}
                                                            onChange={(e) => updateRowField(index, 'expiryDate', e.target.value)}
                                                            disabled={mode === "View"}
                                                            readOnly={row.reason !== "Expired"}
                                                            placeholder="------"
                                                        />
                                                        {errors[`${index}_expiryDate`] && <span className={styles.errorText}>{errors[`${index}_expiryDate`]}</span>}
                                                    </td>
                                                    <td><input className={styles.tableInput} readOnly value={`₹${row.costPrice}`} /></td>
                                                    <td className={`${styles.rightAlign} ${row.total >= 0 ? styles.positiveText : styles.negativeText} ${styles.boldText}`}>
                                                        {row.total >= 0 ? `+ ₹ ${row.total.toFixed(2)}` : `- ₹ ${Math.abs(row.total).toFixed(2)}`}
                                                    </td>
                                                    <td>
                                                        {rows.length > 1 && mode !== "View" && (
                                                            <span className={styles.removeRowBtn} onClick={() => removeRow(row.id)}><IconTrash /></span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {mode !== "View" && <button className={styles.addItemBtn} onClick={addRow}>+ ADD ITEM</button>}

                            <div className={styles.totalSection}>
                                <div className={styles.totalLabel}>TOTAL</div>
                                <div className={`${styles.totalAmount} ${grandTotal >= 0 ? styles.positiveText : styles.negativeText}`}>
                                    {grandTotal >= 0 ? `+ ₹ ${grandTotal.toFixed(2)}` : `- ₹ ${Math.abs(grandTotal).toFixed(2)}`}
                                </div>
                            </div>

                            {mode !== "View" && (
                                <div className={styles.inlineActionSection}>
                                    <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
                                        {submitting ? "Processing..." : "Update Stock"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default StockUpdateForm;