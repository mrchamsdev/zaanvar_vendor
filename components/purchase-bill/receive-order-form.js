import { toApiDateOnly } from "@/utilities/date-time-utils";
import React, { useState, useEffect, useMemo } from "react";
import styles from "../../styles/purchase-bill/receive-order-form.module.css";
import { purchaseService } from "../../services/purchaseService";
import useStore from "../../components/state/useStore";
import { toast } from "sonner";
import { FiChevronDown, FiCheckCircle, FiCalendar, FiInfo } from "react-icons/fi";
import PurchaseOrderSummary from "./purchase-order-summary";
import { dateOnlyWithTimeZone, parseWallClockDate } from "@/utilities/date-time-utils";

const ReceiveOrderForm = ({ requestId, onClose, onSave, mode = "edit", initialData }) => {
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

    // FORCE EDIT MODE FOR DEBUGGING
    const isView = mode === "view";
    const { jwtToken, userId } = useStore();
    const [loading, setLoading] = useState(true);
    const [orderData, setOrderData] = useState(null);

    // Form State
    const [receivedDate, setReceivedDate] = useState(toApiDateOnly(new Date()));
    const [items, setItems] = useState([]);
    const [expandedItems, setExpandedItems] = useState({ 0: true });
    const toggleItemExpand = (index) => {
        setExpandedItems(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };
    const [showBreakdown, setShowBreakdown] = useState(true);

    // Global Toggles & Inputs
    const [payBasedOnOrdered, setPayBasedOnOrdered] = useState(false);
    const [damagedReturnedGoods, setDamagedReturnedGoods] = useState(false);
    const [addToCreditNote, setAddToCreditNote] = useState(true);

    const [overallTax, setOverallTax] = useState({ value: 0, type: '%' });
    const [overallDiscount, setOverallDiscount] = useState({ value: 0, type: '%' });
    const [previousCredit, setPreviousCredit] = useState(0);
    const [paymentStatus, setPaymentStatus] = useState("Pending"); // Default to Pending matching ENUM
    const [paidAmount, setPaidAmount] = useState(0);
    const [duedate, setDuedate] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        if (jwtToken && requestId) {
            fetchOrderDetails();
        }
    }, [jwtToken, requestId]);

    const fetchOrderDetails = async () => {
        setLoading(true);
        try {
            const res = await purchaseService.getPurchaseRequestSummary(jwtToken, requestId);
            if (res.status === "success") {
                setOrderData(res.data);
                const receivedDetails = res.data.receivedDetails;
                const rawItems = res.data.items || res.data.orderItems || [];

                const mapped = rawItems.map(item => {
                    const productInfo = item.itemDetails || item;
                    const savedItems = receivedDetails?.items?.filter(ri =>
                        (ri.productId === item.productId || ri.productId === productInfo.productId) &&
                        (ri.variantId === item.variantId || ri.variantId === productInfo.variantId)
                    ) || [];

                    let batches = [];
                    if (savedItems.length > 0) {
                        batches = savedItems.map(savedItem => ({
                            batchNumber: savedItem.batchNumber || "",
                            expDate: savedItem.expDate || "",
                            costPrice: savedItem.costPrice || "",
                            mrp: savedItem.mrp || "",
                            receivedQty: savedItem.receivedQty ?? "",
                            damagedQty: savedItem.damagedQty ?? "",
                            tax: savedItem.tax ?? savedItem.taxGroupId ?? 0,
                            discount: savedItem.discount || 0,
                        }));
                    } else {
                        batches = [{
                            batchNumber: "",
                            expDate: "",
                            costPrice: item.costPrice || "",
                            mrp: item.mrp || productInfo.mrp || "",
                            receivedQty: "",
                            damagedQty: "",
                            tax: item.taxGroupId ?? productInfo.taxGroupId ?? item.tax ?? productInfo.tax ?? 0,
                            discount: 0,
                        }];
                    }

                    return {
                        productId: item.productId || productInfo.productId,
                        variantId: item.variantId || productInfo.variantId,
                        productName: productInfo.productName || "Unknown Product",
                        variantType: productInfo.variantType || productInfo.variant || {},
                        notes: savedItems.length > 0 ? savedItems[0].notes : "",
                        qty: item.qty || item.orderQuantity || 0,
                        batches
                    };
                });
                setItems(mapped);

                if (receivedDetails) {
                    setReceivedDate(receivedDetails.receivedDate || toApiDateOnly(new Date()));
                    setPayBasedOnOrdered(receivedDetails.toggles?.payBasedOnOrdered || receivedDetails.shortFallApplicable || false);
                    setDamagedReturnedGoods(receivedDetails.toggles?.damagedReturnedGoods || false);
                    setAddToCreditNote(receivedDetails.toggles?.addToCreditNote || false);
                    setOverallTax(receivedDetails.overallTax || { value: 0, type: '%' });
                    setOverallDiscount(receivedDetails.overallDiscount || { value: 0, type: '₹' });
                    setPreviousCredit(receivedDetails.previousCredit || 0);
                    setPaymentStatus(receivedDetails.paymentStatus || "Pending");
                    setPaidAmount(receivedDetails.paidAmount ? Number(receivedDetails.paidAmount).toFixed(2) : 0);
                    setDuedate(receivedDetails.duedate || "");
                }
            } else {
                toast.error("Failed to fetch order details");
                onClose();
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleBatchChange = (itemIndex, batchIndex, field, value) => {
        let finalValue = value;
        const numericFields = ["costPrice", "mrp", "receivedQty", "damagedQty", "tax", "discount"];
        if (numericFields.includes(field)) {
            if (typeof value === "string" && value.length > 1 && value.startsWith("0") && value[1] !== ".") {
                finalValue = value.replace(/^0+/, '') || "";
            }
        }

        setItems(prevItems => {
            const newItems = [...prevItems];
            const newItem = { ...newItems[itemIndex] };
            const newBatches = [...newItem.batches];
            newBatches[batchIndex] = { ...newBatches[batchIndex], [field]: finalValue };
            newItem.batches = newBatches;
            newItems[itemIndex] = newItem;
            return newItems;
        });
    };

    const addBatch = (itemIndex) => {
        setItems(prevItems => {
            const newItems = [...prevItems];
            const newItem = { ...newItems[itemIndex] };
            const lastBatch = newItem.batches[newItem.batches.length - 1] || {};
            newItem.batches = [
                ...newItem.batches,
                {
                    batchNumber: "",
                    expDate: "",
                    costPrice: lastBatch.costPrice || "",
                    mrp: lastBatch.mrp || "",
                    receivedQty: "",
                    damagedQty: "",
                    tax: lastBatch.tax || 0,
                    discount: lastBatch.discount || 0
                }
            ];
            newItems[itemIndex] = newItem;
            return newItems;
        });
    };

    const removeBatch = (itemIndex, batchIndex) => {
        setItems(prevItems => {
            const newItems = [...prevItems];
            const newItem = { ...newItems[itemIndex] };
            newItem.batches = newItem.batches.filter((_, i) => i !== batchIndex);
            newItems[itemIndex] = newItem;
            return newItems;
        });
    };

    const totals = useMemo(() => {
        if (!items.length) return { totalCost: 0, subtotal: 0, shortfallAmount: 0, damagedAmount: 0, itemDiscountTotal: 0, itemTaxTotal: 0, grandTotal: 0, discountableAmount: 0 };

        let totalOrderValue = 0;
        let grandTotal = 0;
        let shortfallAmount = 0;
        let damagedAmount = 0;
        let itemDiscountTotal = 0;
        let itemTaxTotal = 0;
        let discountableAmountSum = 0;

        items.forEach(item => {
            const ordered = parseFloat(item.qty) || 0;
            let totalReceived = 0;
            let firstCost = 0;
            let hasEnteredBatch = false;

            item.batches.forEach((batch, bIdx) => {
                const isEntered = batch.costPrice !== "" && batch.receivedQty !== "";
                if (!isEntered) return;
                hasEnteredBatch = true;

                const cost = parseFloat(batch.costPrice) || 0;
                if (bIdx === 0 || firstCost === 0) firstCost = cost;

                const received = parseFloat(batch.receivedQty) || 0;
                const damaged = parseFloat(batch.damagedQty) || 0;
                const discountPercent = parseFloat(batch.discount) || 0;
                const taxPercent = parseFloat(batch.tax) || 0;

                totalReceived += received;

                // 3. Damage Amount = Damaged Qty × Cost Price
                damagedAmount += (damaged * cost);

                // 4. Effective Billing Qty based on toggles
                const effectiveOrdered = bIdx === 0 ? ordered : 0;
                const baseQty = payBasedOnOrdered ? effectiveOrdered : received;
                const billingQty = damagedReturnedGoods ? Math.max(0, baseQty - damaged) : baseQty;

                // 5. Billable Subtotal
                const billableSubtotal = billingQty * cost;
                discountableAmountSum += billableSubtotal;

                // 6. Discount Amount
                const discountAmount = (billableSubtotal * discountPercent / 100);
                itemDiscountTotal += discountAmount;

                // 7. Amount After Discount
                const amountAfterDiscount = billableSubtotal - discountAmount;

                // 8. Tax Amount
                const taxAmount = (amountAfterDiscount * taxPercent / 100);
                itemTaxTotal += taxAmount;

                // 9. Final Product Amount
                grandTotal += amountAfterDiscount + taxAmount;
            });

            if (hasEnteredBatch) {
                totalOrderValue += (ordered * firstCost);
                if (ordered > totalReceived) {
                    shortfallAmount += (ordered - totalReceived) * firstCost;
                }
            }
        });

        return {
            totalCost: totalOrderValue,
            shortfallAmount,
            damagedAmount,
            itemDiscountTotal,
            itemTaxTotal,
            grandTotal,
            discountableAmount: discountableAmountSum
        };
    }, [items, payBasedOnOrdered, damagedReturnedGoods]);

    const breakdown = useMemo(() => {
        const { grandTotal } = totals;
        let discountVal = Number(overallDiscount.value) || 0;
        if (overallDiscount.type === '%') discountVal = (grandTotal * (overallDiscount.value / 100));

        let taxVal = Number(overallTax.value) || 0;
        if (overallTax.type === '%') taxVal = ((grandTotal - discountVal) * (overallTax.value / 100));

        const subtotal = grandTotal;
        const totalAfterGlobal = subtotal - discountVal + taxVal;
        const finalAmount = totalAfterGlobal - previousCredit;

        return { discountVal, taxVal, subtotal, finalAmount, totalAfterGlobal };
    }, [totals, overallTax, overallDiscount, previousCredit]);

    useEffect(() => {
        if (paymentStatus === "Full") {
            setPaidAmount(Number(breakdown.finalAmount).toFixed(2));
        }
    }, [breakdown.finalAmount, paymentStatus]);

    const handlePaymentStatusChange = (status) => {
        setPaymentStatus(status);
        if (status === "Full") {
            setPaidAmount(Number(breakdown.finalAmount).toFixed(2));
        } else if (status === "Pending" || status === "PayLaterWithRemainder") {
            setPaidAmount(0);
        } else if (status === "Partial") {
            setPaidAmount("");
        }
    };

    const scrollToFirstError = () => {
        setTimeout(() => {
            const firstErrorEl = document.querySelector(`.${styles.inputError}, .${styles.errorInput}`);
            if (firstErrorEl) {
                firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstErrorEl.focus?.();
            }
        }, 100);
    };

    const handleSave = async () => {
        setIsSubmitted(true);
        setLoading(true);
        console.log("Starting handleSave...");
        try {
            // Expand all invalid items so their inline errors can render in the DOM simultaneously
            const newExpanded = { ...expandedItems };
            let hasAnyItemError = false;

            items.forEach((item, idx) => {
                let totalReceived = 0;
                let hasItemError = false;
                item.batches.forEach(batch => {
                    const batchHasError = batch.costPrice === "" || batch.costPrice === undefined || batch.costPrice === null || Number(batch.costPrice) <= 0 ||
                        batch.mrp === "" || batch.mrp === undefined || batch.mrp === null || Number(batch.mrp) <= 0 ||
                        batch.receivedQty === "" || batch.receivedQty === undefined || batch.receivedQty === null || Number(batch.receivedQty) <= 0 ||
                        (batch.damagedQty !== "" && batch.damagedQty !== undefined && batch.damagedQty !== null && Number(batch.damagedQty) < 0) ||
                        (Number(batch.costPrice) > Number(batch.mrp) && batch.mrp > 0) ||
                        Number(batch.damagedQty) > Number(batch.receivedQty);

                    if (batchHasError) hasItemError = true;
                    totalReceived += Number(batch.receivedQty) || 0;
                });

                if (totalReceived > Number(item.qty)) hasItemError = true;

                if (hasItemError) {
                    newExpanded[idx] = true;
                    hasAnyItemError = true;
                }
            });

            if (hasAnyItemError) {
                setExpandedItems(newExpanded);
            }

            let hasEmptyFields = false;
            let hasInvalidPrices = false;
            let hasInvalidDamaged = false;
            let hasInvalidReceived = false;

            items.forEach(item => {
                let totalReceived = 0;
                item.batches.forEach(batch => {
                    if (batch.costPrice === "" || batch.costPrice === undefined || batch.costPrice === null || Number(batch.costPrice) <= 0 ||
                        batch.mrp === "" || batch.mrp === undefined || batch.mrp === null || Number(batch.mrp) <= 0 ||
                        batch.receivedQty === "" || batch.receivedQty === undefined || batch.receivedQty === null || Number(batch.receivedQty) <= 0 ||
                        (batch.damagedQty !== "" && batch.damagedQty !== undefined && batch.damagedQty !== null && Number(batch.damagedQty) < 0)) {
                        hasEmptyFields = true;
                    }
                    if (Number(batch.costPrice) > Number(batch.mrp) && batch.mrp > 0) hasInvalidPrices = true;
                    if (Number(batch.damagedQty) > Number(batch.receivedQty)) hasInvalidDamaged = true;
                    totalReceived += Number(batch.receivedQty) || 0;
                });
                if (totalReceived > Number(item.qty)) hasInvalidReceived = true;
            });

            if (hasEmptyFields || hasInvalidPrices || hasInvalidReceived || hasInvalidDamaged) {
                setLoading(false);
                if (hasEmptyFields) toast.error("Please fill all required fields correctly.");
                else if (hasInvalidPrices) toast.error("Cost Price cannot be greater than MRP.");
                else if (hasInvalidReceived) toast.error("Total received quantity cannot exceed ordered quantity.");
                else if (hasInvalidDamaged) toast.error("Damaged quantity cannot exceed received quantity.");
                scrollToFirstError();
                return;
            }

            if (paymentStatus === "Partial" && (!paidAmount || Number(paidAmount) <= 0)) {
                setLoading(false);
                toast.error("Please enter a valid paid amount for Partial payment.");
                scrollToFirstError();
                return;
            }

            const todayStr = toApiDateOnly(new Date());
            if (paymentStatus !== "Full" && (!duedate || duedate < todayStr)) {
                setLoading(false);
                toast.error("Please enter a valid due date for pending/partial payments.");
                scrollToFirstError();
                return;
            }

            const receivedDateFields = dateOnlyWithTimeZone(
                "receivedDate",
                parseWallClockDate(receivedDate) || new Date(receivedDate),
            );
            const payload = {
                productsPurchaseRqstId: requestId,
                branchId: orderData?.branchId || 91,
                ...receivedDateFields,
                amountPaidToSupplier: paymentStatus === "Full" ? Number(breakdown.finalAmount) : Number(paidAmount),
                paymentStatus: paymentStatus,
                duedate: paymentStatus === "Full" ? null : duedate,
                returnsApplicable: damagedReturnedGoods,
                createdBy: userId || 1,
                additionalDetails: items[0]?.notes || "Purchase order received",
                taxGroupId: 1,
                overallTax: overallTax,
                overallDiscount: overallDiscount,
                previousCredit: Number(previousCredit),
                amount: Number(breakdown.finalAmount),
                overallBillAmount: Number(breakdown.totalAfterGlobal),
                itemDiscountAmount: Number(totals.itemDiscountTotal),
                itemTaxAmount: Number(totals.itemTaxTotal),
                damagedAmount: Number(totals.damagedAmount),
                shortfallAmount: Number(totals.shortfallAmount),
                shortFallApplicable: payBasedOnOrdered ? true : false,
                bill: {
                    ...receivedDateFields,
                },
                billItems: items.flatMap(item =>
                    item.batches.map((batch) => ({
                        productId: item.productId,
                        variantId: item.variantId,
                        costPrice: Number(batch.costPrice),
                        mrp: Number(batch.mrp),
                        qty: Number(item.qty),
                        receivedQuantity: Number(batch.receivedQty),
                        damagedQuantity: Number(batch.damagedQty),
                        discount: Number(batch.discount),
                        taxGroupId: Number(batch.tax) || 0,
                        expiryDate: batch.expDate,
                        batchNumber: batch.batchNumber
                    }))
                )
            };

            console.log("Sending payload to vendor/bills:", payload);

            const res = await purchaseService.createBill(jwtToken, payload);
            console.log("API Response:", res);

            if (res.status === "success" || res.status === 200 || res.id) {
                toast.success("Bill created successfully");
                onSave();
                onClose();
            } else {
                toast.error(res.message || "Failed to save details");
            }
        } catch (error) {
            console.error("Save Error:", error);
            toast.error("An error occurred while saving");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !orderData) return <div className={styles.loading}>Loading order details...</div>;
    if (!orderData) return <div className={styles.error}>No order data found</div>;

    // IF ORDER IS RECEIVED, SHOW SUMMARY VIEW
    if (orderData.orderStatus === 'received' || isView) {
        return <PurchaseOrderSummary data={orderData} onClose={onClose} onRefresh={fetchOrderDetails} initialData={initialData} />;
    }

    return (
        <div className={styles.container}>
            <div className={styles.mainContent}>
                <div className={styles.headerSection}>
                    <h2 className={styles.title}>Receive Purchase Order <span className={styles.requestId}>{String(orderData.purchaseRequestId).padStart(6, '0')}</span></h2>
                </div>

                <div className={styles.itemList}>
                    {items.map((item, index) => {
                        const ordered = parseFloat(item.qty) || 0;
                        let totalReceived = 0;
                        let totalDamaged = 0;
                        let itemRowTotal = 0;
                        let firstCost = 0;

                        item.batches.forEach((batch, bIdx) => {
                            const cost = parseFloat(batch.costPrice) || 0;
                            if (bIdx === 0) firstCost = cost;
                            const received = parseFloat(batch.receivedQty) || 0;
                            const damaged = parseFloat(batch.damagedQty) || 0;
                            totalReceived += received;
                            totalDamaged += damaged;

                            const effectiveOrdered = bIdx === 0 ? ordered : 0;
                            const baseQty = payBasedOnOrdered ? effectiveOrdered : received;
                            const billingQty = damagedReturnedGoods ? Math.max(0, baseQty - damaged) : baseQty;

                            const billableSubtotal = billingQty * cost;
                            const discPercent = parseFloat(batch.discount) || 0;
                            const discAmount = (billableSubtotal * discPercent / 100);
                            const afterDiscount = billableSubtotal - discAmount;
                            const taxPercent = parseFloat(batch.tax) || 0;
                            const taxAmount = afterDiscount * (taxPercent / 100);
                            itemRowTotal += afterDiscount + taxAmount;
                        });

                        const rowOrdered = ordered * firstCost;

                        return (
                            <div key={index} className={`${styles.productCard} ${expandedItems[index] ? styles.productCardActive : ""}`}>
                                <div className={styles.cardHeader} onClick={() => toggleItemExpand(index)}>
                                    <div className={styles.headerInfo}>
                                        <div className={styles.headerTitleLine}>
                                            <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
                                            <span className={styles.productName}>{item.productName} - {[formatVariantSize(item.variantType?.size), item.variantType?.variantName, item.variantType?.packType].filter(Boolean).join(" ")}</span>
                                        </div>
                                        <div className={styles.headerStatsLine}>
                                            <span>Ordered : {item.qty}</span>
                                            <span>Received : {totalReceived || 0}</span>
                                            <span>Damaged : {totalDamaged || 0}</span>
                                            <span>Shortfall : {Math.max(0, (Number(item.qty) || 0) - totalReceived)}</span>
                                        </div>
                                    </div>
                                    <div className={styles.headerRight}>
                                        <div className={styles.headerTotalValue}>Total Value : <span>₹ {itemRowTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                                        <FiChevronDown className={`${styles.expandIcon} ${expandedItems[index] ? styles.expandIconActive : ""}`} />
                                    </div>
                                </div>

                                {expandedItems[index] && (
                                    <div className={styles.cardContent}>
                                        {item.batches.map((batch, bIdx) => {
                                            const cost = parseFloat(batch.costPrice) || 0;
                                            const received = parseFloat(batch.receivedQty) || 0;
                                            const damaged = parseFloat(batch.damagedQty) || 0;
                                            const effectiveOrdered = bIdx === 0 ? ordered : 0;
                                            const baseQty = payBasedOnOrdered ? effectiveOrdered : received;
                                            const billingQty = damagedReturnedGoods ? Math.max(0, baseQty - damaged) : baseQty;

                                            const billableSubtotal = billingQty * cost;
                                            const discPercent = parseFloat(batch.discount) || 0;
                                            const discAmount = (billableSubtotal * discPercent / 100);
                                            const afterDiscount = billableSubtotal - discAmount;
                                            const taxPercent = parseFloat(batch.tax) || 0;
                                            const taxAmount = afterDiscount * (taxPercent / 100);
                                            const rowTotal = afterDiscount + taxAmount;

                                            return (
                                                <div key={bIdx} style={{ position: 'relative', marginBottom: bIdx < item.batches.length - 1 ? '32px' : '0', paddingBottom: bIdx < item.batches.length - 1 ? '32px' : '0', borderBottom: bIdx < item.batches.length - 1 ? '1px dashed #e5e7eb' : 'none' }}>
                                                    {bIdx > 0 && (
                                                        <div style={{ position: 'absolute', top: '-16px', right: '0', zIndex: 10 }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeBatch(index, bIdx)}
                                                                style={{ color: '#ef4444', background: '#fee2e2', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                                                            >
                                                                Remove Batch
                                                            </button>
                                                        </div>
                                                    )}
                                                    <div className={styles.fieldGrid}>
                                                        <div className={styles.fieldGroup}>
                                                            <label className={styles.fieldLabel}>Batch Number</label>
                                                            <input
                                                                type="text"
                                                                className={styles.input}
                                                                placeholder="0000"
                                                                value={batch.batchNumber ?? ""}
                                                                onChange={(e) => handleBatchChange(index, bIdx, "batchNumber", e.target.value)}
                                                            />
                                                        </div>

                                                        <div className={styles.fieldGroup}>
                                                            <label className={styles.fieldLabel}>Expire Date</label>
                                                            <input
                                                                type="date"
                                                                className={styles.input}
                                                                value={batch.expDate ?? ""}
                                                                min={toApiDateOnly(new Date())}
                                                                max="9999-12-31"
                                                                onChange={(e) => handleBatchChange(index, bIdx, "expDate", e.target.value)}
                                                            />
                                                        </div>

                                                        <div className={styles.fieldGroup}>
                                                            <label className={styles.fieldLabel}>Cost Price <span style={{ color: '#ff4d4f' }}>*</span></label>
                                                            <div className={styles.inputWrapper}>
                                                                <span className={styles.currencySymbol}>₹</span>
                                                                <input
                                                                    type="number"
                                                                    className={`${styles.input} ${styles.inputWithSymbol} ${(Number(batch.costPrice) > Number(batch.mrp) && batch.mrp > 0) || (batch.costPrice !== "" && batch.costPrice !== undefined && batch.costPrice !== null && Number(batch.costPrice) <= 0) || (isSubmitted && (batch.costPrice === "" || batch.costPrice === undefined || batch.costPrice === null)) ? styles.inputError : ""}`}
                                                                    placeholder="0"
                                                                    value={batch.costPrice === 0 ? "" : (batch.costPrice ?? "")}
                                                                    onFocus={(e) => e.target.select()}
                                                                    onChange={(e) => handleBatchChange(index, bIdx, "costPrice", e.target.value)}
                                                                />
                                                            </div>
                                                            {(Number(batch.costPrice) > Number(batch.mrp) && batch.mrp > 0) && (
                                                                <span className={styles.errorLabel} style={{ marginTop: '4px', display: 'block' }}>cost price can not be greater than mrp</span>
                                                            )}
                                                            {((batch.costPrice !== "" && batch.costPrice !== undefined && batch.costPrice !== null && Number(batch.costPrice) <= 0) || (isSubmitted && (batch.costPrice === "" || batch.costPrice === undefined || batch.costPrice === null))) && (
                                                                <span className={styles.errorLabel} style={{ marginTop: '4px', display: 'block' }}>Cost price is required and must be greater than 0</span>
                                                            )}
                                                        </div>

                                                        <div className={styles.fieldGroup}>
                                                            <label className={styles.fieldLabel}>MRP <span style={{ color: '#ff4d4f' }}>*</span></label>
                                                            <div className={styles.inputWrapper}>
                                                                <span className={styles.currencySymbol}>₹</span>
                                                                <input
                                                                    type="number"
                                                                    className={`${styles.input} ${styles.inputWithSymbol} ${(batch.mrp !== "" && batch.mrp !== undefined && batch.mrp !== null && Number(batch.mrp) <= 0) || (isSubmitted && (batch.mrp === "" || batch.mrp === undefined || batch.mrp === null)) ? styles.inputError : ""}`}
                                                                    placeholder="0"
                                                                    value={batch.mrp === 0 ? "" : (batch.mrp ?? "")}
                                                                    onFocus={(e) => e.target.select()}
                                                                    onChange={(e) => handleBatchChange(index, bIdx, "mrp", e.target.value)}
                                                                />
                                                            </div>
                                                            {((batch.mrp !== "" && batch.mrp !== undefined && batch.mrp !== null && Number(batch.mrp) <= 0) || (isSubmitted && (batch.mrp === "" || batch.mrp === undefined || batch.mrp === null))) && (
                                                                <span className={styles.errorLabel} style={{ marginTop: '4px', display: 'block' }}>MRP is required and must be greater than 0</span>
                                                            )}
                                                        </div>

                                                        <div className={styles.fieldGroup}>
                                                            <label className={styles.fieldLabel}>Received Qty. <span style={{ color: '#ff4d4f' }}>*</span></label>
                                                            <input
                                                                type="number"
                                                                placeholder="0"
                                                                className={`${styles.input} ${(Number(batch.receivedQty) > Number(item.qty)) || (batch.receivedQty !== "" && batch.receivedQty !== undefined && batch.receivedQty !== null && Number(batch.receivedQty) <= 0) || (isSubmitted && (batch.receivedQty === "" || batch.receivedQty === undefined || batch.receivedQty === null)) ? styles.inputError : ""}`}
                                                                value={batch.receivedQty ?? ""}
                                                                onFocus={(e) => e.target.select()}
                                                                onChange={(e) => handleBatchChange(index, bIdx, "receivedQty", e.target.value)}
                                                            />
                                                            {((batch.receivedQty !== "" && batch.receivedQty !== undefined && batch.receivedQty !== null && Number(batch.receivedQty) <= 0) || (isSubmitted && (batch.receivedQty === "" || batch.receivedQty === undefined || batch.receivedQty === null))) && (
                                                                <span className={styles.errorLabel} style={{ marginTop: '4px', display: 'block' }}>Received quantity is required and must be greater than 0</span>
                                                            )}
                                                        </div>

                                                        <div className={styles.fieldGroup}>
                                                            <div className={styles.labelWithInfo}>
                                                                <label className={styles.fieldLabel}>Damaged Items</label>
                                                                <div className={styles.infoTooltip}>
                                                                    <FiInfo className={styles.infoIcon} style={{ color: '#EF4444' }} title="damage quanty will count from recived quantity" />
                                                                </div>
                                                            </div>
                                                            <input
                                                                type="number"
                                                                placeholder="0"
                                                                className={`${styles.input} ${(Number(batch.damagedQty) > Number(batch.receivedQty)) || (batch.damagedQty !== "" && batch.damagedQty !== undefined && batch.damagedQty !== null && Number(batch.damagedQty) < 0) ? styles.inputError : ""}`}
                                                                value={batch.damagedQty ?? ""}
                                                                onFocus={(e) => e.target.select()}
                                                                onChange={(e) => handleBatchChange(index, bIdx, "damagedQty", e.target.value)}
                                                            />
                                                            {Number(batch.damagedQty) > Number(batch.receivedQty) && (
                                                                <span className={styles.errorLabel} style={{ marginTop: '4px', display: 'block' }}>damaged qty can not be greater than recieved qty</span>
                                                            )}
                                                            {(batch.damagedQty !== "" && batch.damagedQty !== undefined && batch.damagedQty !== null && Number(batch.damagedQty) < 0) && (
                                                                <span className={styles.errorLabel} style={{ marginTop: '4px', display: 'block' }}>Damaged quantity cannot be negative</span>
                                                            )}
                                                        </div>

                                                        <div className={styles.fieldGroup}>
                                                            <label className={styles.fieldLabel}>Discountable Amount</label>
                                                            <div className={styles.inputWrapper}>
                                                                <span className={styles.currencySymbol}>₹</span>
                                                                <input
                                                                    type="text"
                                                                    className={`${styles.input} ${styles.inputWithSymbol}`}
                                                                    value={billableSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    readOnly
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className={styles.fieldGroup}>
                                                            <label className={styles.fieldLabel}>TAX (%)</label>
                                                            <div className={styles.inputWrapper}>
                                                                <span className={styles.currencySymbol}>%</span>
                                                                <input
                                                                    type="number"
                                                                    className={`${styles.input} ${styles.inputWithSymbol}`}
                                                                    value={batch.tax ?? ""}
                                                                    onFocus={(e) => e.target.select()}
                                                                    onChange={(e) => handleBatchChange(index, bIdx, "tax", e.target.value)}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className={styles.fieldGroup}>
                                                            <label className={styles.fieldLabel}>Discount (%)</label>
                                                            <div className={styles.inputWrapper}>
                                                                <span className={styles.currencySymbol}>%</span>
                                                                <input
                                                                    type="number"
                                                                    className={`${styles.input} ${styles.inputWithSymbol}`}
                                                                    value={batch.discount ?? ""}
                                                                    onFocus={(e) => e.target.select()}
                                                                    onChange={(e) => handleBatchChange(index, bIdx, "discount", e.target.value)}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className={styles.fieldGroup}>
                                                            <label className={styles.fieldLabel}>Amount</label>
                                                            <div className={styles.inputWrapper}>
                                                                <span className={styles.currencySymbol}>₹</span>
                                                                <input
                                                                    type="text"
                                                                    className={`${styles.input} ${styles.inputWithSymbol}`}
                                                                    value={rowTotal.toFixed(2)}
                                                                    readOnly
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        <div style={{ marginTop: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                                            <button
                                                type="button"
                                                onClick={() => addBatch(index)}
                                                style={{ background: 'transparent', border: 'none', color: '#E93E64', padding: '8px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
                                            >
                                                + ADD BATCH
                                            </button>
                                        </div>

                                        <div className={styles.fieldGroups}>
                                            <label className={styles.fieldLabel}>Additional Details</label>
                                            <textarea className={styles.textarea} placeholder="Enter Additional details here" value={item.notes || ""} onChange={(e) => handleItemChange(index, 'notes', e.target.value)} />
                                        </div>

                                        {totalReceived > Number(item.qty) && (
                                            <div style={{ color: '#ef4444', marginTop: '12px', fontSize: '14px' }}>
                                                Total received quantity across all batches ({totalReceived}) cannot exceed ordered quantity ({item.qty}).
                                            </div>
                                        )}

                                        <div className={styles.itemSummary}>
                                            <div className={styles.summaryItem}>
                                                <span className={styles.summaryLabel}>Total Ordered Value</span>
                                                <span className={styles.summaryValue}>₹ {rowOrdered.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className={styles.summaryItem}>
                                                <span className={styles.summaryLabel}>Total Received Value</span>
                                                <span className={styles.summaryValue}>₹ {(totalReceived * firstCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className={styles.summaryItem}>
                                                <span className={styles.summaryLabel}>Calculated Amount</span>
                                                <span className={styles.summaryValue}>₹ {itemRowTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className={styles.sidebar}>
                <div className={styles.summarySection}>
                    <h3 className={styles.sidebarTitle}>Purchase Summary</h3>

                    <div className={styles.infoGroup}>
                        <span className={styles.infoLabel}>Supplier</span>
                        <span className={styles.infoValue}>{orderData.supplier?.supplierName}</span>
                        <span className={styles.infoSubValue}>India</span>
                    </div>

                    <div className={styles.infoGroup}>
                        <span className={styles.infoLabel}>Delivered To</span>
                        <span className={styles.infoValue}>{orderData.branchName}</span>
                        <span className={styles.infoSubValue}>{orderData.branchAddress?.addressText}</span>
                    </div>

                    <div className={styles.dateGrid}>
                        <div className={styles.infoGroup}>
                            <span className={styles.infoLabel}>Order Date</span>
                            <span className={styles.infoValue}>{new Date(orderData.orderDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className={styles.infoGroup}>
                            <span className={styles.infoLabel}>Received date</span>
                            <div className={styles.inputWrapper}>
                                <input
                                    type="date"
                                    className={styles.input}
                                    value={receivedDate}
                                    max={toApiDateOnly(new Date())}
                                    onChange={(e) => setReceivedDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.toggleRow}>
                        <span className={styles.toggleLabel}>Pay based on ordered quantity</span>
                        <div className={`${styles.toggle} ${payBasedOnOrdered ? styles.toggleActive : ""}`} onClick={() => setPayBasedOnOrdered(!payBasedOnOrdered)}>
                            <div className={`${styles.toggleCircle} ${payBasedOnOrdered ? styles.toggleCircleActive : ""}`} />
                        </div>
                    </div>

                    {payBasedOnOrdered && totals.shortfallAmount > 0 && (
                        <div className={styles.alertBox}>
                            <div className={styles.alertHeader}>
                                <span className={styles.alertValue}>₹ {totals.shortfallAmount}</span>
                                <div className={styles.alertAction}>
                                    <FiCheckCircle className={styles.checkIconActive} />
                                    <span>Added to Credit Note</span>
                                </div>
                            </div>
                            <div className={styles.alertSub}>Delivery Shortfall</div>
                        </div>
                    )}

                    <div className={styles.alertBox}>
                        <div className={styles.alertHeader}>
                            <span className={styles.alertValue}>₹ {totals.damagedAmount}</span>
                            <div className={`${styles.toggle} ${damagedReturnedGoods ? styles.toggleActive : ""}`} onClick={() => setDamagedReturnedGoods(!damagedReturnedGoods)}>
                                <div className={`${styles.toggleCircle} ${damagedReturnedGoods ? styles.toggleCircleActive : ""}`} />
                            </div>
                        </div>
                        <div className={styles.alertSub}>Damaged / Returned Goods</div>
                        <div className={styles.alertSmall}>Add damaged / returned goods to Credit</div>
                    </div>

                    <div className={styles.globalInputs}>
                        <div className={styles.inputGroup}>
                            <label className={styles.infoLabel}>Overall TAX</label>
                            <div className={styles.combinedInput}>
                                <input type="number" className={styles.miniInput} value={overallTax.value} onChange={(e) => {
                                    let val = e.target.value;
                                    if (val.length > 1 && val.startsWith("0") && val[1] !== ".") val = val.slice(1);
                                    setOverallTax({ ...overallTax, value: val });
                                }} />
                                <select className={styles.miniSelect} value={overallTax.type} onChange={(e) => setOverallTax({ ...overallTax, type: e.target.value })}>
                                    <option>%</option>
                                    <option>₹</option>
                                </select>
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.infoLabel}>Overall Discount</label>
                            <div className={styles.combinedInput}>
                                <input type="number" className={styles.miniInput} value={overallDiscount.value} onChange={(e) => {
                                    let val = e.target.value;
                                    if (val.length > 1 && val.startsWith("0") && val[1] !== ".") val = val.slice(1);
                                    setOverallDiscount({ ...overallDiscount, value: val });
                                }} />
                                <select className={styles.miniSelect} value={overallDiscount.type} onChange={(e) => setOverallDiscount({ ...overallDiscount, type: e.target.value })}>
                                    <option>₹</option>
                                    <option>%</option>
                                </select>
                            </div>
                        </div>
                    </div>



                    <div className={styles.breakdownContainer}>
                        <div className={styles.breakdownHeader} onClick={() => setShowBreakdown(!showBreakdown)}>
                            <span className={styles.breakdownTitle}>Cost Breakdown</span>
                            <FiChevronDown className={`${styles.expandIcon} ${showBreakdown ? styles.expandIconActive : ""}`} />
                        </div>
                        {showBreakdown && (
                            <div className={styles.breakdownContent}>
                                <div className={styles.breakdownRow}><span>Total cost</span><span>₹ {totals.totalCost.toFixed(2)}</span></div>

                                {!payBasedOnOrdered && totals.shortfallAmount > 0 && (
                                    <div className={styles.breakdownRow}><span>Shortfall Amount</span><span>- ₹ {totals.shortfallAmount.toFixed(2)}</span></div>
                                )}

                                {damagedReturnedGoods && totals.damagedAmount > 0 && (
                                    <div className={styles.breakdownRow}><span>Damaged Amount</span><span>- ₹ {totals.damagedAmount.toFixed(2)}</span></div>
                                )}

                                <div className={styles.breakdownRow}><span>Discountable Amount</span><span style={{ fontWeight: '700', color: '#000' }}>₹ {totals.discountableAmount.toFixed(2)}</span></div>

                                <div className={styles.breakdownRow}><span>Item Discount</span><span>- ₹ {totals.itemDiscountTotal.toFixed(2)}</span></div>
                                <div className={styles.breakdownRow}><span>Item Tax</span><span>₹ {totals.itemTaxTotal.toFixed(2)}</span></div>
                                <div className={styles.breakdownDivider} />
                                <div className={styles.breakdownRow}><span>Subtotal</span><span>₹ {breakdown.subtotal.toFixed(2)}</span></div>
                                <div className={styles.breakdownRow}><span> Overall Discount</span><span>- ₹ {breakdown.discountVal.toFixed(2)}</span></div>

                                <div className={styles.breakdownRow}><span>Overall Tax</span><span>₹ {breakdown.taxVal.toFixed(2)}</span></div>
                                {Number(previousCredit) > 0 && (
                                    <div className={styles.breakdownRow}><span> Previous Credit</span><span>- ₹ {Number(previousCredit).toFixed(2)}</span></div>
                                )}
                                <div className={styles.breakdownRowBold}><span>Total</span><span>₹ {breakdown.finalAmount.toFixed(2)}</span></div>
                            </div>
                        )}
                    </div>

                    <div className={styles.infoGroup}>
                        <label className={styles.infoLabel}>Payment Status</label>
                        <div className={styles.statusGrid}>
                            {[
                                { label: "Full Payment", value: "Full" },
                                { label: "Pay Later", value: "PayLaterWithRemainder" },
                                { label: "Partial", value: "Partial" },
                                { label: "Not Paid", value: "Pending" }
                            ].map(status => (
                                <div key={status.value} className={`${styles.statusBadge} ${paymentStatus === status.value ? styles.statusBadgeActive : ""}`} onClick={() => handlePaymentStatusChange(status.value)}>
                                    <div className={styles.radioCircle} />
                                    <span>{status.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {(paymentStatus === "Partial" || paymentStatus === "Full") && (
                        <div className={styles.infoGroup}>
                            <label className={styles.infoLabel}>Paid Amount {paymentStatus === "Partial" && <span style={{ color: '#ff4d4f' }}>*</span>}</label>
                            <div className={styles.inputWrapper}>
                                <span className={styles.currencySymbol}>₹</span>
                                <input
                                    type="number"
                                    className={`${styles.input} ${styles.inputWithSymbol} ${isSubmitted && paymentStatus === "Partial" && (!paidAmount || Number(paidAmount) <= 0) ? styles.errorInput : ""}`}
                                    placeholder="00000"
                                    value={paidAmount}
                                    readOnly={paymentStatus === "Full"}
                                    onChange={(e) => {
                                        let val = e.target.value;
                                        if (val.length > 1 && val.startsWith("0") && val[1] !== ".") val = val.slice(1);
                                        setPaidAmount(val);
                                    }}
                                    onBlur={() => {
                                        if (paidAmount) {
                                            setPaidAmount(Number(paidAmount).toFixed(2));
                                        }
                                    }}
                                />
                            </div>
                            {isSubmitted && paymentStatus === "Partial" && (!paidAmount || Number(paidAmount) <= 0) && (
                                <span style={{ color: '#ff4d4f', fontSize: '11px', marginTop: '4px' }}>Paid amount is required for partial payment</span>
                            )}
                        </div>
                    )}

                    {paymentStatus !== "Full" && (
                        <div className={styles.infoGroup}>
                            <label className={styles.infoLabel}>Payment Due Date <span style={{ color: '#ff4d4f' }}>*</span></label>
                            <div className={styles.inputWrapper}>
                                <input
                                    type="date"
                                    className={`${styles.input} ${isSubmitted && (!duedate || duedate < toApiDateOnly(new Date())) ? styles.errorInput : ""}`}
                                    value={duedate}
                                    min={toApiDateOnly(new Date())}
                                    max="9999-12-31"
                                    onChange={(e) => setDuedate(e.target.value)}
                                    onBlur={(e) => {
                                        const today = toApiDateOnly(new Date());
                                        if (e.target.value && e.target.value < today) {
                                            setDuedate("");
                                            toast.error("Payment Due Date cannot be in the past");
                                        }
                                    }}
                                />
                            </div>
                            {isSubmitted && (!duedate || duedate < toApiDateOnly(new Date())) && (
                                <span style={{ color: '#ff4d4f', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                                    {!duedate ? "Payment Due Date is required" : "Payment Due Date cannot be in the past"}
                                </span>
                            )}
                        </div>
                    )}

                    <div className={styles.sidebarActions}>
                        <button className={styles.saveBtn} onClick={handleSave} disabled={loading}>Save</button>
                        <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiveOrderForm;
