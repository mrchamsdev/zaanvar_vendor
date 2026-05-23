import { toApiDateOnly } from "@/utilities/date-time-utils";
import React, { useState, useEffect, useMemo } from "react";
import styles from "../../styles/purchase-bill/receive-order-form.module.css";
import { purchaseService } from "../../services/purchaseService";
import useStore from "../../components/state/useStore";
import { toast } from "sonner";
import { FiChevronDown, FiCheckCircle, FiCalendar, FiInfo } from "react-icons/fi";
import PurchaseOrderSummary from "./purchase-order-summary";
import { dateOnlyWithTimeZone, parseWallClockDate } from "@/utilities/date-time-utils";

const ReceiveOrderForm = ({ requestId, onClose, onSave, mode = "edit" }) => {
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
    const [expandedItem, setExpandedItem] = useState(0);
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
                    const savedItem = receivedDetails?.items?.find(ri => 
                        (ri.productId === item.productId || ri.productId === productInfo.productId) && 
                        (ri.variantId === item.variantId || ri.variantId === productInfo.variantId)
                    );
                    return {
                        ...item,
                        productId: item.productId || productInfo.productId,
                        variantId: item.variantId || productInfo.variantId,
                        productName: productInfo.productName || "Unknown Product",
                        variantType: productInfo.variantType || productInfo.variant || {},
                        receivedQty: savedItem ? (savedItem.receivedQty ?? 0) : 0,
                        damagedQty: savedItem ? (savedItem.damagedQty ?? 0) : 0,
                        batchNumber: savedItem ? savedItem.batchNumber : "",
                        expDate: savedItem ? savedItem.expDate : "",
                        costPrice: savedItem ? (savedItem.costPrice || "") : (item.costPrice || ""),
                        mrp: savedItem ? savedItem.mrp : (item.mrp || productInfo.mrp || 0),
                        tax: savedItem ? savedItem.tax : 0,
                        discount: savedItem ? savedItem.discount : 0,
                        notes: savedItem ? savedItem.notes : "",
                        qty: item.qty || item.orderQuantity || 0
                    };
                });
                setItems(mapped);

                if (receivedDetails) {
                    setReceivedDate(receivedDetails.receivedDate || toApiDateOnly(new Date()));
                    setPayBasedOnOrdered(receivedDetails.toggles?.payBasedOnOrdered || false);
                    setDamagedReturnedGoods(receivedDetails.toggles?.damagedReturnedGoods || false);
                    setAddToCreditNote(receivedDetails.toggles?.addToCreditNote || false);
                    setOverallTax(receivedDetails.overallTax || { value: 0, type: '%' });
                    setOverallDiscount(receivedDetails.overallDiscount || { value: 0, type: '₹' });
                    setPreviousCredit(receivedDetails.previousCredit || 0);
                    setPaymentStatus(receivedDetails.paymentStatus || "Pending");
                    setPaidAmount(receivedDetails.paidAmount || 0);
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
        let finalValue = value;
        // For numeric fields, strip leading zero if it's followed by a digit (prevents "02", "05" etc.)
        const numericFields = ["costPrice", "mrp", "receivedQty", "damagedQty", "tax", "discount"];
        if (numericFields.includes(field)) {
            if (typeof value === "string" && value.length > 1 && value.startsWith("0") && value[1] !== ".") {
                finalValue = value.slice(1);
            }
            if (value === "" && (field === "receivedQty" || field === "damagedQty")) {
                finalValue = 0;
            }
        }
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: finalValue };
        setItems(newItems);
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
            const isEntered = item.costPrice !== "" && item.receivedQty !== "";
            if (!isEntered) return;

            const cost = parseFloat(item.costPrice) || 0;
            const ordered = parseFloat(item.qty) || 0;
            const received = parseFloat(item.receivedQty) || 0;
            const damaged = parseFloat(item.damagedQty) || 0;
            const discountPercent = parseFloat(item.discount) || 0;
            const taxPercent = parseFloat(item.tax) || 0;

            // 1. Total Order Value = Order Qty × Cost Price
            totalOrderValue += (ordered * cost);

            // 2. Shortfall Amount = (Order Qty - Received Qty) × Cost Price
            if (ordered > received) {
                shortfallAmount += (ordered - received) * cost;
            }

            // 3. Damage Amount = Damaged Qty × Cost Price
            damagedAmount += (damaged * cost);

            // 4. Effective Billing Qty based on toggles
            // If payBasedOnOrdered is true, we start with ordered quantity. Otherwise, received quantity.
            const baseQty = payBasedOnOrdered ? ordered : received;
            // If damagedReturnedGoods is true, we deduct damaged quantity. Otherwise, we don't.
            const billingQty = damagedReturnedGoods ? Math.max(0, baseQty - damaged) : baseQty;

            // 5. Billable Subtotal = Effective Billing Qty × Cost Price
            const billableSubtotal = billingQty * cost;
            discountableAmountSum += billableSubtotal;

            // 6. Discount Amount = Billable Subtotal × Discount %
            const discountAmount = (billableSubtotal * discountPercent / 100);
            itemDiscountTotal += discountAmount;

            // 7. Amount After Discount = Billable Subtotal - Discount Amount
            const amountAfterDiscount = billableSubtotal - discountAmount;

            // 8. Tax Amount = Amount After Discount × Tax %
            const taxAmount = (amountAfterDiscount * taxPercent / 100);
            itemTaxTotal += taxAmount;

            // 9. Final Product Amount = Amount After Discount + Tax Amount
            const finalProductAmount = amountAfterDiscount + taxAmount;
            grandTotal += finalProductAmount;
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
        
        return { discountVal, taxVal, subtotal, finalAmount };
    }, [totals, overallTax, overallDiscount, previousCredit]);

    useEffect(() => {
        if (paymentStatus === "Full") {
            setPaidAmount(breakdown.finalAmount);
        }
    }, [breakdown.finalAmount, paymentStatus]);

    const handleSave = async () => {
        setIsSubmitted(true);
        setLoading(true);
        console.log("Starting handleSave...");
        try {
            // Filter only "entered" items (where user provided Cost Price and Received Qty)
            const enteredItems = items.filter(item => item.costPrice !== "" && item.receivedQty !== "");
            
            console.log("Entered Items count:", enteredItems.length);
            
            const invalidPrices = enteredItems.filter(item => Number(item.costPrice) > Number(item.mrp));

            if (invalidPrices.length > 0) {
                toast.error("Cost Price cannot be greater than MRP");
                setLoading(false);
                return;
            }

            const invalidReceived = enteredItems.filter(item => Number(item.receivedQty) > Number(item.qty));
            if (invalidReceived.length > 0) {
                toast.error("Received Qty cannot be greater than Order Qty");
                setLoading(false);
                return;
            }

            const invalidDamaged = enteredItems.filter(item => Number(item.damagedQty) > Number(item.receivedQty));
            if (invalidDamaged.length > 0) {
                toast.error("Damaged Qty cannot be greater than Received Qty");
                setLoading(false);
                return;
            }

            if (paymentStatus === "Partial" && (!paidAmount || Number(paidAmount) <= 0)) {
                toast.error("Please enter a valid Paid Amount for partial payment");
                setLoading(false);
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
                amountPaidToSupplier: Number(paidAmount),
                paymentStatus: paymentStatus,
                duedate: duedate,
                returnsApplicable: damagedReturnedGoods,
                createdBy: userId || 1,
                additionalDetails: items[0]?.notes || "Purchase order received",
                taxGroupId: 1,
                overallTax: overallTax,
                overallDiscount: overallDiscount,
                previousCredit: Number(previousCredit),
                amount: Number(breakdown.finalAmount),
                itemDiscountAmount: Number(totals.itemDiscountTotal),
                itemTaxAmount: Number(totals.itemTaxTotal),
                damagedAmount: Number(totals.damagedAmount),
                shortfallAmount: Number(totals.shortfallAmount),
                toggles: {
                    payBasedOnOrdered: payBasedOnOrdered,
                    damagedReturnedGoods: damagedReturnedGoods,
                    addToCreditNote: addToCreditNote
                },
                bill: {
                    ...receivedDateFields,
                },
                billItems: enteredItems.map(item => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    costPrice: Number(item.costPrice),
                    mrp: Number(item.mrp),
                    qty: Number(item.qty),
                    receivedQuantity: Number(item.receivedQty),
                    damagedQuantity: Number(item.damagedQty),
                    discount: Number(item.discount),
                    taxGroupId: Number(item.tax) || 0,
                    expiryDate: item.expDate,
                    batchNumber: item.batchNumber
                }))
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
        return <PurchaseOrderSummary data={orderData} onClose={onClose} onRefresh={fetchOrderDetails} />;
    }

    return (
        <div className={styles.container}>
            <div className={styles.mainContent}>
                <div className={styles.headerSection}>
                    <h2 className={styles.title}>Receive Purchase Order <span className={styles.requestId}>#{String(orderData.purchaseRequestId).padStart(6, '0')}</span></h2>
                </div>

                <div className={styles.itemList}>
                    {items.map((item, index) => {
                        const cost = parseFloat(item.costPrice) || 0;
                        const ordered = parseFloat(item.qty) || 0;
                        const received = parseFloat(item.receivedQty) || 0;
                        const damaged = parseFloat(item.damagedQty) || 0;
                        
                        const baseQty = payBasedOnOrdered ? ordered : received;
                        const billingQty = damagedReturnedGoods ? Math.max(0, baseQty - damaged) : baseQty;
                        
                        const billableSubtotal = billingQty * cost;
                        const discPercent = parseFloat(item.discount) || 0;
                        const discAmount = (billableSubtotal * discPercent / 100);
                        const afterDiscount = billableSubtotal - discAmount;
                        const taxPercent = parseFloat(item.tax) || 0;
                        const taxAmount = afterDiscount * (taxPercent / 100);
                        const rowTotal = afterDiscount + taxAmount;
                        
                        const orderedBase = (parseFloat(item.qty) || 0) * cost;
                        const orderedDiscAmount = (orderedBase * discPercent / 100);
                        const orderedAfterDisc = orderedBase - orderedDiscAmount;
                        const rowOrdered = orderedAfterDisc + (orderedAfterDisc * (taxPercent / 100));
                        
                        return (
                            <div key={index} className={`${styles.productCard} ${expandedItem === index ? styles.productCardActive : ""}`}>
                                <div className={styles.cardHeader} onClick={() => setExpandedItem(expandedItem === index ? -1 : index)}>
                                    <div className={styles.headerInfo}>
                                        <div className={styles.headerTitleLine}>
                                            <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
                                            <span className={styles.productName}>{item.productName} - {[formatVariantSize(item.variantType?.size), item.variantType?.variantName, item.variantType?.packType].filter(Boolean).join(" ")}</span>
                                        </div>
                                        <div className={styles.headerStatsLine}>
                                            <span>Ordered : {item.qty}</span>
                                            <span>Received : {item.receivedQty || 0}</span>
                                            <span>Damaged : {item.damagedQty || 0}</span>
                                            <span>Shortfall : {Math.max(0, (Number(item.qty) || 0) - (Number(item.receivedQty) || 0))}</span>
                                        </div>
                                    </div>
                                    <div className={styles.headerRight}>
                                        <div className={styles.headerTotalValue}>Total Value : <span>₹ {rowTotal.toLocaleString()}</span></div>
                                        <FiChevronDown className={`${styles.expandIcon} ${expandedItem === index ? styles.expandIconActive : ""}`} />
                                    </div>
                                </div>

                                {expandedItem === index && (
                                    <div className={styles.cardContent}>
                                        <div className={styles.fieldGrid}>
                                            <div className={styles.fieldGroup}>
                                                <label className={styles.fieldLabel}>Batch Number</label>
                                                <input 
                                                    type="text" 
                                                    className={styles.input} 
                                                    placeholder="0000"
                                                    value={item.batchNumber ?? ""}
                                                    onChange={(e) => handleItemChange(index, "batchNumber", e.target.value)}
                                                />
                                            </div>

                                            <div className={styles.fieldGroup}>
                                                <label className={styles.fieldLabel}>Expire Date</label>
                                                <input 
                                                    type="date" 
                                                    className={styles.input} 
                                                    value={item.expDate ?? ""}
                                                    min={toApiDateOnly(new Date())}
                                                    max="9999-12-31"
                                                    onChange={(e) => handleItemChange(index, "expDate", e.target.value)}
                                                />
                                            </div>

                                            <div className={styles.fieldGroup}>
                                                <label className={styles.fieldLabel}>Cost Price</label>
                                                <div className={styles.inputWrapper}>
                                                    <span className={styles.currencySymbol}>₹</span>
                                                    <input 
                                                        type="number" 
                                                        className={`${styles.input} ${styles.inputWithSymbol} ${(Number(item.costPrice) > Number(item.mrp) && item.mrp > 0) ? styles.inputError : ""}`} 
                                                        value={item.costPrice ?? ""}
                                                        onChange={(e) => handleItemChange(index, "costPrice", e.target.value)}
                                                    />
                                                </div>
                                                {(Number(item.costPrice) > Number(item.mrp) && item.mrp > 0) && (
                                                    <span className={styles.errorLabel} style={{ marginTop: '4px', display: 'block' }}>cost price can not be greater than mrp</span>
                                                )}
                                            </div>

                                            <div className={styles.fieldGroup}>
                                                <label className={styles.fieldLabel}>MRP</label>
                                                <div className={styles.inputWrapper}>
                                                    <span className={styles.currencySymbol}>₹</span>
                                                    <input 
                                                        type="number" 
                                                        className={`${styles.input} ${styles.inputWithSymbol}`} 
                                                        value={item.mrp ?? ""}
                                                        onChange={(e) => handleItemChange(index, "mrp", e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className={styles.fieldGroup}>
                                                <label className={styles.fieldLabel}>Received Qty.</label>
                                                <input 
                                                    type="number" 
                                                    className={`${styles.input} ${Number(item.receivedQty) > Number(item.qty) ? styles.inputError : ""}`} 
                                                    value={item.receivedQty ?? ""}
                                                    onChange={(e) => handleItemChange(index, "receivedQty", e.target.value)}
                                                />
                                                {Number(item.receivedQty) > Number(item.qty) && (
                                                    <span className={styles.errorLabel} style={{ marginTop: '4px', display: 'block' }}>received qty can not be greater than order qty</span>
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
                                                    className={`${styles.input} ${Number(item.damagedQty) > Number(item.receivedQty) ? styles.inputError : ""}`} 
                                                    value={item.damagedQty ?? ""}
                                                    onChange={(e) => handleItemChange(index, "damagedQty", e.target.value)}
                                                />
                                                {Number(item.damagedQty) > Number(item.receivedQty) && (
                                                    <span className={styles.errorLabel} style={{ marginTop: '4px', display: 'block' }}>damaged qty can not be greater than recieved qty</span>
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
                                                        value={item.tax ?? ""}
                                                        onChange={(e) => handleItemChange(index, "tax", e.target.value)}
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
                                                        value={item.discount ?? ""}
                                                        onChange={(e) => handleItemChange(index, "discount", e.target.value)}
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

                                        <div className={styles.fieldGroups}>
                                            <label className={styles.fieldLabel}>Additional Details</label>
                                            <textarea className={styles.textarea} placeholder="Enter Additional details here" value={item.notes || ""} onChange={(e) => handleItemChange(index, 'notes', e.target.value)} />
                                        </div>

                                        <div className={styles.itemSummary}>
                                            <div className={styles.summaryItem}>
                                                <span className={styles.summaryLabel}>Total Ordered Value</span>
                                                <span className={styles.summaryValue}>₹ {rowOrdered.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className={styles.summaryItem}>
                                                <span className={styles.summaryLabel}>Total Received Value</span>
                                                <span className={styles.summaryValue}>₹ {(received * cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                           
                                            <div className={styles.summaryItem}>
                                                <span className={styles.summaryLabel}>Total Discount Value</span>
                                                <span className={styles.summaryValue}>₹ - {discAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className={styles.summaryItem}>
                                                <span className={styles.summaryLabel}>Tax Amount</span>
                                                <span className={styles.summaryValue}>₹ +{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className={styles.summaryItem}>
                                                <span className={styles.summaryLabel}>Calculated Amount</span>
                                                <span className={styles.summaryValue}>₹ {rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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

                    <div className={styles.infoGroup}>
                        <label className={styles.infoLabel}>Previous Credit Amount</label>
                        <div className={styles.inputWrapper}>
                            <span className={styles.currencySymbol}>₹</span>
                            <input type="number" className={`${styles.input} ${styles.inputWithSymbol}`} placeholder="Enter Credit Amount" value={previousCredit} onChange={(e) => {
                                let val = e.target.value;
                                if (val.length > 1 && val.startsWith("0") && val[1] !== ".") val = val.slice(1);
                                setPreviousCredit(val);
                            }} />
                        </div>
                        <span className={styles.balanceText}>Balance : ₹ 0</span>
                    </div>

                    <div className={styles.breakdownContainer}>
                        <div className={styles.breakdownHeader} onClick={() => setShowBreakdown(!showBreakdown)}>
                            <span className={styles.breakdownTitle}>Cost Breakdown</span>
                            <FiChevronDown className={`${styles.expandIcon} ${showBreakdown ? styles.expandIconActive : ""}`} />
                        </div>
                        {showBreakdown && (
                            <div className={styles.breakdownContent}>
                                <div className={styles.breakdownRow}><span>Total cost</span><span>₹ {totals.totalCost.toLocaleString()}</span></div>
                                
                                {!payBasedOnOrdered && totals.shortfallAmount > 0 && (
                                    <div className={styles.breakdownRow}><span>Shortfall Amount</span><span>- ₹ {totals.shortfallAmount.toLocaleString()}</span></div>
                                )}
                                
                                {damagedReturnedGoods && totals.damagedAmount > 0 && (
                                    <div className={styles.breakdownRow}><span>Damaged Amount</span><span>- ₹ {totals.damagedAmount.toLocaleString()}</span></div>
                                )}

                                <div className={styles.breakdownRow}><span>Discountable Amount</span><span style={{fontWeight: '700', color: '#000'}}>₹ {totals.discountableAmount.toLocaleString()}</span></div>

                                <div className={styles.breakdownRow}><span>Item Discount</span><span>- ₹ {totals.itemDiscountTotal.toLocaleString()}</span></div>
                                <div className={styles.breakdownRow}><span>Item Tax</span><span>₹ {totals.itemTaxTotal.toLocaleString()}</span></div>
                                <div className={styles.breakdownDivider} />
                                <div className={styles.breakdownRow}><span>Subtotal</span><span>₹ {breakdown.subtotal.toFixed(2)}</span></div>
                                <div className={styles.breakdownRow}><span>Overall Tax</span><span>₹ {breakdown.taxVal.toFixed(2)}</span></div>
                                <div className={styles.breakdownRow}><span> Overall Discount</span><span>- ₹ {breakdown.discountVal.toFixed(2)}</span></div>
                                {Number(previousCredit) > 0 && (
                                    <div className={styles.breakdownRow}><span>(-) Previous Credit</span><span>- ₹ {Number(previousCredit).toFixed(2)}</span></div>
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
                                <div key={status.value} className={`${styles.statusBadge} ${paymentStatus === status.value ? styles.statusBadgeActive : ""}`} onClick={() => setPaymentStatus(status.value)}>
                                    <div className={styles.radioCircle} />
                                    <span>{status.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {(paymentStatus === "Partial" || paymentStatus === "Full") && (
                        <div className={styles.infoGroup}>
                            <label className={styles.infoLabel}>Paid Amount {paymentStatus === "Partial" && <span style={{color: '#ff4d4f'}}>*</span>}</label>
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
                                />
                            </div>
                            {isSubmitted && paymentStatus === "Partial" && (!paidAmount || Number(paidAmount) <= 0) && (
                                <span style={{color: '#ff4d4f', fontSize: '11px', marginTop: '4px'}}>Paid amount is required for partial payment</span>
                            )}
                        </div>
                    )}

                    {(paymentStatus === "PayLaterWithRemainder" || paymentStatus === "Partial" || paymentStatus === "Pending") && (
                        <div className={styles.infoGroup}>
                            <label className={styles.infoLabel}>Payment Due Date</label>
                            <div className={styles.inputWrapper}>
                                <input 
                                    type="date" 
                                    className={styles.input} 
                                    value={duedate} 
                                    min={toApiDateOnly(new Date())}
                                    max="9999-12-31"
                                    onChange={(e) => setDuedate(e.target.value)} 
                                />
                            </div>
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
