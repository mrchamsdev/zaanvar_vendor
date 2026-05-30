import { toApiDateOnly, toApiUtcIso, userTimeZone } from "@/utilities/date-time-utils";
import React, { useState, useEffect, useMemo } from "react";
import styles from "../../styles/purchase-bill/add-purchase-return.module.css";
import { FiX, FiCalendar, FiPlus, FiTrash2, FiChevronDown } from "react-icons/fi";
import { purchaseService } from "../../services/purchaseService";
import useStore from "../../components/state/useStore";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { toast } from "sonner";
import { useRouter } from "next/router";

const getVariantSizeDisplay = (variant) => {
    if (!variant) return "-";
    let size = variant.variantType?.size || variant.size;
    if (!size) return "-";
    if (typeof size === 'string' && size.trim().startsWith('{')) {
        try {
            const parsed = JSON.parse(size);
            const parts = [];
            if (parsed.height) parts.push(`${parsed.height}${parsed.heightUnit || 'mm'}H`);
            if (parsed.width) parts.push(`${parsed.width}${parsed.widthUnit || 'mm'}W`);
            if (parsed.length) parts.push(`${parsed.length}${parsed.lengthUnit || 'mm'}L`);
            if (parsed.radius) parts.push(`R:${parsed.radius}${parsed.radiusUnit || 'mm'}`);
            if (parsed.weight) parts.push(`${parsed.weight}${parsed.weightUnit || 'g'}`);
            size = parts.length > 0 ? parts.join(" x ") : size;
        } catch (e) {
            // Keep size as is
        }
    }
    const sizeStr = size.toString().trim();
    if (/^\d+(\.\d+)?$/.test(sizeStr)) {
        return `${sizeStr} pcs`;
    }
    return sizeStr;
};

const AddPurchaseReturn = ({ isOpen, onClose, onRefresh, mode = 'add', returnId }) => {
    const router = useRouter();
    const { jwtToken, userInfo } = useStore();
    const { branchId } = useDashboardData({ skipReviews: true });
    const isViewOnly = mode === 'view';

    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [phone, setPhone] = useState("");
    const [receipts, setReceipts] = useState([]);
    const [selectedBillId, setSelectedBillId] = useState("");
    const [billDetails, setBillDetails] = useState(null);

    const [returnNo, setReturnNo] = useState("");
    const [billDate, setBillDate] = useState("");
    const [returnDate, setReturnDate] = useState(toApiDateOnly(new Date()));
    const [returnReason, setReturnReason] = useState("");
    const [allReturns, setAllReturns] = useState([]);

    const [items, setItems] = useState([]); // [{ productsBillItemsId, productId, productName, receivedQty, returnQty, costPrice, taxGroupId, amount }]
    const [showProductDropdown, setShowProductDropdown] = useState(null); // index of the row showing dropdown
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const init = async () => {
            try {
                // Fetch suppliers
                const supRes = await purchaseService.getSuppliers(jwtToken, branchId);
                if (supRes.status === "success") {
                    setSuppliers(supRes.data || []);
                }

                if (mode === 'add') {
                    // Fetch returns to calculate return number for new returns
                    const retRes = await purchaseService.getBranchReturns(jwtToken, branchId);
                    if (retRes.status === "success") {
                        const returnData = retRes.data || [];
                        setAllReturns(returnData);
                        const count = returnData.length;
                        setReturnNo((count + 1).toString());
                    }
                }
            } catch (error) {
                console.error("Error during initialization:", error);
            }
        };
        if (isOpen) {
            // Reset all form states to default values
            setSelectedSupplier(null);
            setPhone("");
            setReceipts([]);
            setSelectedBillId("");
            setBillDetails(null);
            setReturnNo("");
            setBillDate("");
            setReturnDate(toApiDateOnly(new Date()));
            setReturnReason("");
            setItems([]);
            setShowProductDropdown(null);
            setErrors({});

            init();
            if ((mode === 'view' || mode === 'edit') && returnId) {
                fetchReturnDetails(returnId);
            }
        }
    }, [isOpen, branchId, jwtToken, mode, returnId]);

    const fetchReturnDetails = async (id) => {
        setLoading(true);
        try {
            const res = await purchaseService.getReturnById(jwtToken, id);
            if (res.status === "success") {
                const data = res.data;
                setSelectedBillId(data.productsBillId?.toString() || "");
                setReturnNo(data.returnProductsId);
                setReturnReason(data.returnReason || "");

                const isAutomatedReturn = data.returnReason === "Automated return for damaged goods at receipt";

                if (data.productsBill) {
                    setBillDate(data.productsBill.createdDate ? data.productsBill.createdDate.split('T')[0] : "");
                    // Set supplier details from bill
                    const supplierData = {
                        supplierId: data.productsBill.supplierId,
                        supplierName: data.productsBill.vendor?.supplierName || "N/A",
                        phone: data.productsBill.vendor?.phone || ""
                    };
                    setSelectedSupplier(supplierData);
                    setPhone(supplierData.phone);

                    // Ensure the current bill is in the receipts list so it shows in dropdown
                    setReceipts([{ productsBillId: data.productsBillId }]);

                    // Fetch full bill details to populate dropdowns and available products
                    try {
                        const billRes = await purchaseService.getBillById(jwtToken, data.productsBillId);
                        if (billRes.status === "success") {
                            const billData = billRes.data;
                            setBillDetails(billData);

                            // Update supplier info from full bill data
                            if (billData.vendor) {
                                const supplierData = {
                                    supplierId: billData.vendor.supplierId,
                                    supplierName: billData.vendor.supplierName || "N/A",
                                    phone: billData.vendor.phone || ""
                                };
                                setSelectedSupplier(supplierData);
                                setPhone(supplierData.phone);
                            }

                            // Update mapped items with actual receivedQty from bill
                            const mappedItems = (data.items || []).map(it => {
                                const billItem = (billData.billItems || []).find(bi => bi.productsBillItemsId === it.productsBillItemsId);
                                const discountPercent = isAutomatedReturn ? 0 : (billItem ? parseFloat(billItem.discount || 0) : parseFloat(it.discount || 0));
                                const costPrice = parseFloat(it.costPrice || 0);
                                const returnQty = it.qty;
                                const subtotal = returnQty * costPrice;
                                const discountAmount = isAutomatedReturn ? 0 : ((subtotal * discountPercent) / 100);
                                const amtAfterDiscount = subtotal - discountAmount;
                                const taxPercent = isAutomatedReturn ? 0 : (billItem ? parseFloat(billItem.taxGroupId || 0) : 0);
                                const taxAmount = isAutomatedReturn ? 0 : ((amtAfterDiscount * taxPercent) / 100);
                                const finalAmount = isAutomatedReturn ? parseFloat(it.amount || 0) : (amtAfterDiscount + taxAmount);

                                return {
                                    productsBillItemsId: it.productsBillItemsId,
                                    productId: it.productId,
                                    productName: it.productName || "Product",
                                    variantSize: billItem ? getVariantSizeDisplay(billItem.variant) : "-",
                                    sourceStatus: it.sourceStatus === "openStock" ? "Open Stock" : (it.sourceStatus === "hold" ? "Hold Stock" : (it.sourceStatus === "damaged" ? "Damaged" : (it.sourceStatus || ""))),
                                    receivedQty: billItem ? parseInt(billItem.receivedQuantity) || 0 : it.qty,
                                    included: billItem ? parseInt(billItem.included) || 0 : 0,
                                    excluded: billItem ? parseInt(billItem.excluded) || 0 : 0,
                                    totalQuantity: billItem ? parseInt(billItem.totalQuantity) || 0 : 0,
                                    openStockQuantity: billItem ? (billItem.openStockQuantity !== undefined ? parseInt(billItem.openStockQuantity) : (parseInt(billItem.totalQuantity || 0) - parseInt(billItem.excluded || 0))) || 0 : 0,
                                    onHoldQuantity: billItem ? parseInt(billItem.onHoldQuantity) || 0 : 0,
                                    currentQty: billItem?.stockUpdates?.[0]?.updatedQty ?? billItem?.stockUpdates?.[0]?.currentQty ?? it.qty,
                                    returnQty: it.qty,
                                    costPrice: costPrice,
                                    discount: discountPercent,
                                    discountAmount: discountAmount,
                                    tax: taxPercent,
                                    taxAmount: taxAmount,
                                    amount: finalAmount
                                };
                            });
                            setItems(mappedItems);
                        }
                    } catch (err) {
                        console.error("Error fetching bill details for return:", err);
                        // Fallback to basic mapping if bill fetch fails
                        const mappedItems = (data.items || []).map(it => {
                            const costPrice = parseFloat(it.costPrice || 0);
                            const returnQty = it.qty;
                            const discountPercent = isAutomatedReturn ? 0 : parseFloat(it.discount || 0);
                            const subtotal = returnQty * costPrice;
                            const discountAmount = isAutomatedReturn ? 0 : ((subtotal * discountPercent) / 100);
                            const amtAfterDiscount = subtotal - discountAmount;
                            const finalAmount = isAutomatedReturn ? parseFloat(it.amount || 0) : amtAfterDiscount;
                            return {
                                productsBillItemsId: it.productsBillItemsId,
                                productId: it.productId,
                                productName: it.productName || "Product",
                                variantSize: "-",
                                sourceStatus: it.sourceStatus === "openStock" ? "Open Stock" : (it.sourceStatus === "hold" ? "Hold Stock" : (it.sourceStatus === "damaged" ? "Damaged" : (it.sourceStatus || ""))),
                                receivedQty: it.qty,
                                included: 0,
                                excluded: 0,
                                totalQuantity: 0,
                                openStockQuantity: 0,
                                onHoldQuantity: 0,
                                returnQty: it.qty,
                                costPrice: costPrice,
                                discount: discountPercent,
                                discountAmount: discountAmount,
                                tax: 0,
                                taxAmount: 0,
                                amount: finalAmount
                            };
                        });
                        setItems(mappedItems);
                    }
                }

                setReturnDate((data.returnDate || data.createdDate) ? (data.returnDate || data.createdDate).split('T')[0] : "");
            }
        } catch (error) {
            console.error("Error fetching return details:", error);
            toast.error("Failed to fetch return details");
        } finally {
            setLoading(false);
        }
    };

    const handleSupplierChange = (supplierId) => {
        const id = parseInt(supplierId);
        const supplier = suppliers.find(s => s.supplierId === id);
        if (supplier) {
            setSelectedSupplier(supplier);
            setPhone(supplier.phone || "");

            // Filter receipts by supplier's productsBillIds
            const filteredReceipts = (supplier.productsBillIds || []).map(billId => ({ productsBillId: billId }));

            setReceipts(filteredReceipts);
            setSelectedBillId("");
            setBillDetails(null);
            setItems([]);
        } else {
            setSelectedSupplier(null);
            setPhone("");
            setReceipts([]);
            setSelectedBillId("");
            setBillDetails(null);
            setItems([]);
        }
        setErrors(prev => {
            const next = { ...prev };
            delete next.selectedBillId;
            delete next.items;
            delete next.supplier;
            return next;
        });
    };

    const handlePhoneChange = (val) => {
        setPhone(val);
        const supplier = suppliers.find(s => s.phone === val);
        if (supplier) {
            setSelectedSupplier(supplier);

            // Filter receipts by supplier's productsBillIds
            const filteredReceipts = (supplier.productsBillIds || []).map(billId => ({ productsBillId: billId }));

            setReceipts(filteredReceipts);
            setSelectedBillId("");
            setBillDetails(null);
            setItems([]);
        }
        setErrors(prev => {
            const next = { ...prev };
            delete next.selectedBillId;
            delete next.items;
            delete next.supplier;
            return next;
        });
    };

    const handleBillChange = async (billId) => {
        setSelectedBillId(billId);
        setErrors(prev => {
            const next = { ...prev };
            delete next.selectedBillId;
            delete next.items;
            return next;
        });
        if (!billId) {
            setBillDetails(null);
            setItems([]);
            return;
        }

        // We only trigger fetch if it looks like a complete ID (usually numeric)
        // or if it was selected from the datalist.
        setLoading(true);
        try {
            const res = await purchaseService.getBillById(jwtToken, billId);
            if (res.status === "success") {
                const data = res.data;

                // Check if bill belongs to this branch
                if (data.branchId !== branchId) {
                    toast.error("This receipt number is not related to this branch");
                    setBillDetails(null);
                    setItems([]);
                    return;
                }

                setBillDetails(data);
                setBillDate(data.createdDate ? data.createdDate.split('T')[0] : "");

                // Add an initial empty row if bill has items
                if (data.billItems && data.billItems.length > 0) {
                    setItems([{
                        productsBillItemsId: "",
                        productId: "",
                        productName: "",
                        variantSize: "",
                        sourceStatus: "",
                        receivedQty: 0,
                        included: 0,
                        excluded: 0,
                        totalQuantity: 0,
                        openStockQuantity: 0,
                        onHoldQuantity: 0,
                        returnQty: 0,
                        costPrice: 0,
                        discount: 0,
                        discountAmount: 0,
                        tax: 0,
                        taxAmount: 0,
                        amount: 0
                    }]);
                } else {
                    setItems([]);
                }

                // Auto-set supplier from bill data
                if (data.vendor) {
                    const vendorId = data.vendor.supplierId;
                    const existingSupplier = suppliers.find(s => s.supplierId === vendorId);

                    if (existingSupplier) {
                        setSelectedSupplier(existingSupplier);
                        setPhone(existingSupplier.phone || "");
                    } else {
                        setSelectedSupplier(data.vendor);
                        setPhone(data.vendor.phone || "");
                    }

                    // Maintain receipts from the supplier's productsBillIds
                    const billIds = existingSupplier ? (existingSupplier.productsBillIds || []) : (data.vendor.productsBillIds || []);
                    const filteredReceipts = billIds.map(billId => ({ productsBillId: billId }));

                    setReceipts(filteredReceipts);
                }
            } else {
                // If the API returns success: false or similar
                toast.error("Receipt number not found or invalid");
                setBillDetails(null);
                setItems([]);
            }
        } catch (error) {
            console.error("Error fetching bill details:", error);
            if (error.response?.status === 404) {
                toast.error("This receipt number is not related to this branch");
            }
            setBillDetails(null);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddRow = () => {
        if (!billDetails) {
            toast.error("Please select a Receipt first");
            return;
        }
        setItems([...items, {
            productsBillItemsId: "",
            productId: "",
            productName: "",
            variantSize: "",
            sourceStatus: "",
            receivedQty: 0,
            included: 0,
            excluded: 0,
            totalQuantity: 0,
            openStockQuantity: 0,
            onHoldQuantity: 0,
            returnQty: 0,
            costPrice: 0,
            discount: 0,
            discountAmount: 0,
            tax: 0,
            amount: 0
        }]);
    };

    const handleRemoveRow = (index) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleProductSelect = (index, billItem) => {
        const taxPercent = parseFloat(billItem.taxGroupId || 0);
        const costPrice = parseFloat(billItem.costPrice || 0);
        const discountPercent = parseFloat(billItem.discount || 0);
        const qty = 1;
        const subtotal = qty * costPrice;
        const discountAmount = (subtotal * discountPercent) / 100;
        const amtAfterDiscount = subtotal - discountAmount;
        const taxAmount = (amtAfterDiscount * taxPercent) / 100;
        const finalAmount = amtAfterDiscount + taxAmount;

        const newItems = [...items];
        newItems[index] = {
            ...newItems[index],
            productsBillItemsId: billItem.productsBillItemsId,
            productId: billItem.productId,
            productName: billItem.productDetails?.productName || "Product",
            variantSize: getVariantSizeDisplay(billItem.variant),
            batchNumber: billItem.batchNumber || "N/A",
            sourceStatus: newItems[index].sourceStatus || "",
            receivedQty: parseInt(billItem.receivedQuantity) || 0,
            included: parseInt(billItem.included) || 0,
            excluded: parseInt(billItem.excluded) || 0,
            totalQuantity: parseInt(billItem.totalQuantity) || 0,
            openStockQuantity: billItem.openStockQuantity !== undefined ? parseInt(billItem.openStockQuantity) : (parseInt(billItem.totalQuantity || 0) - parseInt(billItem.excluded || 0)) || 0,
            onHoldQuantity: parseInt(billItem.onHoldQuantity) || 0,
            currentQty: billItem.stockUpdates?.[0]?.updatedQty ?? billItem.stockUpdates?.[0]?.currentQty ?? 0,
            returnQty: 0,
            costPrice: costPrice,
            discount: discountPercent,
            discountAmount: 0,
            tax: taxPercent,
            taxAmount: 0,
            amount: 0,
            productError: null
        };
        setItems(newItems);
        setShowProductDropdown(null);
    };

    const getMaxQty = (item) => {
        if (!item) return 0;
        if (item.sourceStatus === "Damaged") return (item.included || 0) + (item.excluded || 0);
        if (item.sourceStatus === "Open Stock") {
            const openStock = item.openStockQuantity || ((item.totalQuantity || 0) - (item.excluded || 0));
            return openStock - (item.included || 0);
        }
        if (item.sourceStatus === "Hold Stock") return item.onHoldQuantity || 0;
        return item.receivedQty || 0;
    };

    const handleQtyChange = (index, val) => {
        if (val === "") {
            const newItems = [...items];
            newItems[index].returnQty = "";
            newItems[index].amount = 0;
            newItems[index].taxAmount = 0;
            newItems[index].discountAmount = 0;
            setItems(newItems);
            return;
        }
        const qty = parseInt(val) || 0;
        const item = items[index];

        const newItems = [...items];
        newItems[index].returnQty = val === "" ? "" : qty;

        const maxAllowed = getMaxQty(item);
        // Track error but allow the value in state so it can be seen/corrected
        if (qty > maxAllowed) {
            newItems[index].error = `Cannot exceed quantity (${maxAllowed})`;
        } else {
            newItems[index].error = null;
        }

        const subtotal = qty * item.costPrice;
        const discountAmount = (subtotal * item.discount) / 100;
        const amtAfterDiscount = subtotal - discountAmount;
        const taxAmount = (amtAfterDiscount * item.tax) / 100;

        newItems[index].discountAmount = discountAmount;
        newItems[index].taxAmount = taxAmount;
        newItems[index].amount = amtAfterDiscount + taxAmount;
        setItems(newItems);
    };

    const availableProducts = useMemo(() => {
        if (!billDetails || !billDetails.billItems) return [];
        const selectedIds = items.map(item => item.productsBillItemsId).filter(Boolean);
        return billDetails.billItems.filter(bi => !selectedIds.includes(bi.productsBillItemsId));
    }, [billDetails, items]);

    const availableProductsForDropdown = (currentIndex) => {
        if (!billDetails || !billDetails.billItems) return [];
        const selectedIds = items
            .map((item, idx) => idx !== currentIndex ? item.productsBillItemsId : null)
            .filter(Boolean);
        return billDetails.billItems.filter(bi => !selectedIds.includes(bi.productsBillItemsId));
    };

    const totalQty = items.reduce((acc, it) => acc + (parseInt(it.returnQty) || 0), 0);
    const totalPrice = items.reduce((acc, it) => acc + (parseFloat(it.costPrice) || 0), 0);
    const totalTax = items.reduce((acc, it) => acc + (parseFloat(it.taxAmount) || 0), 0);
    const totalDiscount = items.reduce((acc, it) => acc + (parseFloat(it.discountAmount) || 0), 0);
    const totalAmount = items.reduce((acc, it) => acc + (parseFloat(it.amount) || 0), 0);

    const handleSave = async () => {
        let hasError = false;
        const newErrors = {};

        if (!selectedSupplier || !selectedSupplier.supplierId) {
            newErrors.supplier = "Supplier is required";
            hasError = true;
        }

        if (!selectedBillId) {
            newErrors.selectedBillId = "Receipt No is required";
            hasError = true;
        }

        if (items.length === 0) {
            newErrors.items = "Please add at least one product";
            hasError = true;
        }

        const updatedItems = items.map(it => {
            let itemHasError = false;
            const updatedItem = { ...it };

            // 1. Check product selected
            if (!it.productsBillItemsId) {
                updatedItem.productError = "Product is required";
                itemHasError = true;
            } else {
                updatedItem.productError = null;
            }

            // 2. Check source status
            if (!it.sourceStatus) {
                updatedItem.sourceError = "Required";
                itemHasError = true;
            } else {
                updatedItem.sourceError = null;
            }

            // 3. Check return qty
            if (it.returnQty === "" || it.returnQty === undefined || it.returnQty === null) {
                updatedItem.error = "Required";
                itemHasError = true;
            } else {
                const qty = parseInt(it.returnQty) || 0;
                if (qty <= 0) {
                    updatedItem.error = "Must be greater than 0";
                    itemHasError = true;
                } else {
                    const maxAllowed = getMaxQty(it);
                    if (qty > maxAllowed) {
                        updatedItem.error = `Cannot exceed quantity (${maxAllowed})`;
                        itemHasError = true;
                    } else {
                        updatedItem.error = null;
                    }
                }
            }

            if (itemHasError) {
                hasError = true;
            }
            return updatedItem;
        });

        if (hasError) {
            setErrors(newErrors);
            setItems(updatedItems);
            return;
        }

        // Clear any previous errors
        setErrors({});
        setItems(updatedItems);

        const payload = {
            branchId: branchId,
            productsBillId: parseInt(selectedBillId),
            returnReason: returnReason,
            returnAmount: totalAmount,
            returnDate: toApiUtcIso(returnDate),
            returnDateTimeZone: userTimeZone(),
            createdBy: userInfo?.userId || 1,
            modifiedBy: userInfo?.userId || 1,
            items: items.map(it => ({
                productsBillItemsId: it.productsBillItemsId,
                batchNumber: it.batchNumber,
                qty: it.returnQty,
                sourceStatus: it.sourceStatus === "Open Stock" ? "openStock" : (it.sourceStatus === "Hold Stock" ? "hold" : (it.sourceStatus === "Damaged" ? "damaged" : it.sourceStatus))
            }))
        };

        setLoading(true);
        try {
            let res;
            if (mode === 'edit') {
                res = await purchaseService.updateReturn(jwtToken, returnId, payload);
            } else {
                res = await purchaseService.createReturn(jwtToken, payload);
            }

            if (res && (res.status === "success" || res.status === 200)) {
                toast.success(mode === 'edit' ? "Purchase return updated successfully" : "Purchase return recorded successfully");

                // Reset form state
                setSelectedSupplier(null);
                setPhone("");
                setReceipts([]);
                setSelectedBillId("");
                setBillDetails(null);
                setReturnReason("");
                setReturnDate(toApiDateOnly(new Date()));
                setItems([]);
                setShowProductDropdown(null);

                // Allow the toast to be visible before navigating
                setTimeout(() => {
                    if (onRefresh) onRefresh();
                    if (onClose) onClose();
                    router.push(`/purchase-bill/purchase-return?branchId=${branchId}`);
                }, 1000);
            } else {
                if (res.message === "RETURNS_NOT_APPLICABLE") {
                    toast.error("This product is not applicable for return");
                } else {
                    toast.error(res.message || (mode === 'edit' ? "Failed to update return" : "Failed to record purchase return"));
                }
            }
        } catch (error) {
            console.error("Error saving return:", error);
            toast.error("An error occurred while saving");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h3 style={{ fontSize: '24px', fontWeight: '600' }}>
                        {mode === 'view' ? "View Purchase Return" : (mode === 'edit' ? "Edit Purchase Return" : "Add Purchase Return")}
                    </h3>
                    <button className={styles.closeBtn} onClick={onClose}><FiX /></button>
                </div>

                <div className={styles.modalContent}>
                    <div className={styles.topGrid}>
                        <div className={styles.field}>
                            <label>Supplier Name</label>
                            <select
                                className={styles.select}
                                style={{ border: errors.supplier ? '1px solid #ff4d4f' : '1px solid #eef0f2' }}
                                value={selectedSupplier?.supplierId || ""}
                                onChange={(e) => handleSupplierChange(e.target.value)}
                                disabled={isViewOnly}
                            >
                                <option value="">Select Name</option>
                                {suppliers.map(s => (
                                    <option key={s.supplierId} value={s.supplierId}>{s.supplierName}</option>
                                ))}
                            </select>
                            {errors.supplier && (
                                <div style={{ color: '#ff4d4f', fontSize: '10px', marginTop: '4px', fontWeight: '500' }}>
                                    {errors.supplier}
                                </div>
                            )}
                        </div>
                        <div className={styles.field}>
                            <label>Supplier Phone Number</label>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="Phone number"
                                value={phone}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                disabled={isViewOnly}
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Receipt No</label>
                            <select
                                className={styles.select}
                                style={{ border: errors.selectedBillId ? '1px solid #ff4d4f' : '1px solid #eef0f2' }}
                                value={selectedBillId}
                                onChange={(e) => handleBillChange(e.target.value)}
                                disabled={isViewOnly || !selectedSupplier}
                            >
                                <option value="">Select Receipt no</option>
                                {receipts && receipts.map(r => (
                                    <option key={r.productsBillId} value={r.productsBillId}>{r.productsBillId}</option>
                                ))}
                            </select>
                            {errors.selectedBillId && (
                                <div style={{ color: '#ff4d4f', fontSize: '10px', marginTop: '4px', fontWeight: '500' }}>
                                    {errors.selectedBillId}
                                </div>
                            )}
                        </div>
                        <div className={styles.field}>
                            <label>Return No</label>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="Return no"
                                value={returnNo}
                                readOnly
                                disabled={isViewOnly}
                            />
                        </div>

                        <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                            <label>Return Reason</label>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="Enter here"
                                value={returnReason}
                                onChange={(e) => setReturnReason(e.target.value)}
                                disabled={isViewOnly}
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Bill Date</label>
                            <div className={styles.dateWrapper}>
                                <input
                                    type="text"
                                    className={`${styles.input}`}
                                    value={billDate ? new Date(billDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "Select Date here"}
                                    readOnly
                                    disabled={isViewOnly}
                                />
                                <FiCalendar className={styles.calendarIcon} />
                            </div>
                        </div>
                        <div className={styles.field}>
                            <label>Return Date</label>
                            <div className={styles.dateWrapper}>
                                <input
                                    type="date"
                                    className={styles.input}
                                    style={{ color: returnDate ? '#333' : '#999' }}
                                    value={returnDate}
                                    onChange={(e) => setReturnDate(e.target.value)}
                                    disabled={isViewOnly}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.snoCol}>S NO.</th>
                                    <th className={styles.productCol}>Product Name</th>
                                    <th>VARIANT TYPE</th>
                                    <th>SOURCE STATUS</th>
                                    <th style={{ textAlign: 'center', fontSize: '11px' }}>
                                        {items.length > 0 && items[0].sourceStatus === "Damaged" ? "DAMAGED QTY" :
                                            items.length > 0 && items[0].sourceStatus === "Open Stock" ? "OPEN STOCK QTY" :
                                                items.length > 0 && items[0].sourceStatus === "Hold Stock" ? "HOLD STOCK QTY" :
                                                    "STATUS QTY"}
                                    </th>
                                    <th className={styles.qtyCol}>RETURN QTY</th>
                                    <th className={styles.priceCol}>
                                        <div className={styles.priceHeader}>
                                            <span>Price</span>

                                        </div>
                                    </th>
                                    <th className={styles.taxCol}>
                                        <div className={styles.taxHeader}>
                                            <span>TAX</span>
                                            <div className={styles.taxSubHeaders}>
                                                <span style={{ flex: 1, textAlign: 'center' }}>%</span>
                                                <span style={{ flex: 1, textAlign: 'center' }}>AMOUNT</span>
                                            </div>
                                        </div>
                                    </th>
                                    <th className={styles.taxCol}>
                                        <div className={styles.taxHeader}>
                                            <span>DISCOUNT</span>
                                            <div className={styles.taxSubHeaders}>
                                                <span style={{ flex: 1, textAlign: 'center' }}>%</span>
                                                <span style={{ flex: 1, textAlign: 'center' }}>AMOUNT</span>
                                            </div>
                                        </div>
                                    </th>
                                    <th className={styles.amountCol}>AMOUNT</th>
                                    <th style={{ width: '40px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className={styles.snoCol}>{(idx + 1).toString().padStart(2, '0')}</td>
                                        <td className={styles.productCol} style={{ position: 'relative', verticalAlign: 'middle' }}>
                                            <div
                                                className={styles.productSelectBox}
                                                onClick={() => !isViewOnly && setShowProductDropdown(showProductDropdown === idx ? null : idx)}
                                                style={{
                                                    cursor: isViewOnly ? 'default' : 'pointer',
                                                    border: item.productError ? '1px solid #ff4d4f' : 'none',
                                                    borderRadius: item.productError ? '4px' : 'none',
                                                    padding: item.productError ? '4px' : '0'
                                                }}
                                            >
                                                <span>{item.productName || "Select Item"}</span>
                                                {!isViewOnly && <FiChevronDown />}
                                            </div>
                                            {item.productError && (
                                                <div style={{ color: '#ff4d4f', fontSize: '10px', marginTop: '4px', fontWeight: '500' }}>
                                                    {item.productError}
                                                </div>
                                            )}
                                            {showProductDropdown === idx && (
                                                <div className={styles.dropdownOverlay} style={{ width: '600px' }}>
                                                    <table className={styles.dropdownTable}>
                                                        <thead>
                                                            <tr>
                                                                <th>PRODUCT NAME</th>
                                                                <th>VARIANT</th>
                                                                <th>ORDER QTY</th>
                                                                <th>RECEIVED QTY</th>
                                                                <th>TOTAL QTY</th>
                                                                <th>DAMAGED QTY</th>
                                                                <th>RETURNABLE QTY</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {availableProductsForDropdown(idx).map((bi, bIdx) => (
                                                                <tr
                                                                    key={bIdx}
                                                                    onClick={() => handleProductSelect(idx, bi)}
                                                                >
                                                                    <td style={{ fontWeight: '600' }}>{bi.productDetails?.productName}</td>
                                                                    <td>{getVariantSizeDisplay(bi.variant)}</td>
                                                                    <td>{bi.qty}</td>
                                                                    <td>{bi.receivedQuantity}</td>
                                                                    <td>{bi.totalQuantity || 0}</td>
                                                                    <td>{bi.damagedQuantity}</td>
                                                                    <td>{bi.returnableQty || 0}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ verticalAlign: 'middle', minWidth: '100px', fontWeight: '500' }}>
                                            {item.variantSize || "-"}
                                        </td>
                                        <td style={{ minWidth: '120px', verticalAlign: 'middle' }}>
                                            <select
                                                className={styles.input}
                                                style={{ border: item.sourceError ? '1px solid #ff4d4f' : '1px solid #eee', width: '100%', background: 'transparent' }}
                                                value={item.sourceStatus || ""}
                                                onChange={(e) => {
                                                    const newItems = [...items];
                                                    newItems[idx].sourceStatus = e.target.value;
                                                    if (newItems[idx].sourceError) newItems[idx].sourceError = null;

                                                    const maxAllowed = getMaxQty(newItems[idx]);
                                                    const currentQty = parseInt(newItems[idx].returnQty) || 0;
                                                    if (currentQty > maxAllowed) {
                                                        newItems[idx].error = `Cannot exceed quantity (${maxAllowed})`;
                                                    } else {
                                                        newItems[idx].error = null;
                                                    }

                                                    setItems(newItems);
                                                }}
                                                disabled={isViewOnly}
                                            >
                                                <option value="">Select Status</option>
                                                <option value="Open Stock">Open Stock</option>
                                                <option value="Damaged">Damaged</option>
                                                <option value="Hold Stock">Hold Stock</option>
                                            </select>
                                            {item.sourceError && (
                                                <div style={{ color: '#ff4d4f', fontSize: '10px', marginTop: '4px', textAlign: 'center', fontWeight: '500' }}>
                                                    {item.sourceError}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center', verticalAlign: 'middle', minWidth: '80px' }}>
                                            {item.sourceStatus ? (
                                                <div style={{ fontWeight: '600', color: '#333' }}>
                                                    {getMaxQty(item)}
                                                </div>
                                            ) : (
                                                <div style={{ color: '#ccc' }}>-</div>
                                            )}
                                        </td>
                                        <td className={styles.qtyCol}>
                                            <input
                                                type="number"
                                                className={styles.input}
                                                style={{
                                                    background: 'transparent',
                                                    textAlign: 'center',
                                                    border: item.error ? '1px solid #ff4d4f' : '1px solid #eee'
                                                }}
                                                value={item.returnQty === 0 ? "" : item.returnQty}
                                                onChange={(e) => handleQtyChange(idx, e.target.value)}
                                                onFocus={(e) => e.target.select()}
                                                disabled={isViewOnly}
                                            />
                                            {item.error && (
                                                <div style={{
                                                    color: '#ff4d4f',
                                                    fontSize: '10px',
                                                    marginTop: '4px',
                                                    textAlign: 'center',
                                                    fontWeight: '500',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {item.error}
                                                </div>
                                            )}
                                        </td>
                                        <td className={styles.priceCol}>
                                            <div style={{ textAlign: 'center' }}>{item.costPrice.toLocaleString()}</div>
                                        </td>
                                        <td className={styles.taxCol}>
                                            <div style={{ display: 'flex', width: '100%' }}>
                                                <span style={{ flex: 1, textAlign: 'center' }}>{item.tax}%</span>
                                                <span style={{ flex: 1, textAlign: 'center' }}>{(item.taxAmount || 0).toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className={styles.taxCol}>
                                            <div style={{ display: 'flex', width: '100%' }}>
                                                <span style={{ flex: 1, textAlign: 'center' }}>{item.discount || 0}%</span>
                                                <span style={{ flex: 1, textAlign: 'center' }}>{(item.discountAmount || 0).toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className={styles.amountCol}>
                                            <div style={{ fontWeight: '600' }}>{item.amount.toLocaleString()}</div>
                                        </td>
                                        <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                            {!isViewOnly && idx > 0 && (
                                                <FiTrash2
                                                    style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: '18px' }}
                                                    onClick={() => handleRemoveRow(idx)}
                                                />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan="11" style={{ height: '100px', border: 'none', textAlign: 'center', verticalAlign: 'middle' }}>
                                            {errors.items ? (
                                                <div style={{ color: '#ff4d4f', fontSize: '14px', fontWeight: '500' }}>
                                                    {errors.items}
                                                </div>
                                            ) : (
                                                <div style={{ color: '#999' }}>No products added</div>
                                            )}
                                        </td>
                                    </tr>
                                )}
                                {availableProducts.length > 0 && !isViewOnly && (
                                    <tr>
                                        <td colSpan="11" style={{ border: 'none', padding: '16px 0' }}>
                                            <span
                                                className={styles.addBtn}
                                                onClick={handleAddRow}
                                            >
                                                +ADD ITEM
                                            </span>
                                        </td>
                                    </tr>
                                )}
                                <tr className={styles.totalRow}>
                                    <td className={styles.totalLabel} colSpan="5" style={{ textAlign: 'left', paddingLeft: '24px' }}>TOTAL</td>
                                    <td className={styles.qtyCol}>{totalQty.toString().padStart(3, '0')}</td>
                                    <td className={styles.priceCol}>{totalPrice.toLocaleString()}</td>
                                    <td className={styles.taxCol}>
                                        <div style={{ display: 'flex', width: '100%' }}>
                                            <span style={{ flex: 1, textAlign: 'center' }}></span>
                                            <span style={{ flex: 1, textAlign: 'center' }}>{totalTax.toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className={styles.taxCol}>
                                        <div style={{ display: 'flex', width: '100%' }}>
                                            <span style={{ flex: 1, textAlign: 'center' }}></span>
                                            <span style={{ flex: 1, textAlign: 'center' }}>{totalDiscount.toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className={styles.amountCol}>{totalAmount.toLocaleString()}</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className={styles.shareBtn} onClick={onClose}>{isViewOnly ? "Close" : "Cancel"}</button>
                    {!isViewOnly && (
                        <button
                            className={styles.saveBtn}
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? "Saving..." : "Save"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddPurchaseReturn;
