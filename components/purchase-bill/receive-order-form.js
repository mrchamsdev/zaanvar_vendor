import React, { useState, useEffect, useMemo } from "react";
import styles from "../../styles/purchase-bill/receive-order-form.module.css";
import { purchaseService } from "../../services/purchaseService";
import useStore from "../../components/state/useStore";
import { toast } from "sonner";
import { FiChevronDown, FiCheckCircle, FiCalendar } from "react-icons/fi";
import PurchaseOrderSummary from "./purchase-order-summary";

const ReceiveOrderForm = ({ requestId, onClose, onSave, mode = "edit" }) => {
    // FORCE EDIT MODE FOR DEBUGGING
    const isView = mode === "view";
    const { jwtToken, userId } = useStore();
    const [loading, setLoading] = useState(true);
    const [orderData, setOrderData] = useState(null);
    
    // Form State
    const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState([]);
    const [expandedItem, setExpandedItem] = useState(0);
    const [showBreakdown, setShowBreakdown] = useState(true);
    
    // Global Toggles & Inputs
    const [payBasedOnOrdered, setPayBasedOnOrdered] = useState(false);
    const [damagedReturnedGoods, setDamagedReturnedGoods] = useState(false);
    const [addToCreditNote, setAddToCreditNote] = useState(true);
    
    const [overallTax, setOverallTax] = useState({ value: 0, type: '%' });
    const [overallDiscount, setOverallDiscount] = useState({ value: 0, type: '₹' });
    const [previousCredit, setPreviousCredit] = useState(0);
    const [paymentStatus, setPaymentStatus] = useState("Pending"); // Default to Pending matching ENUM
    const [paidAmount, setPaidAmount] = useState(0);

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
                        receivedQty: savedItem ? savedItem.receivedQty : "",
                        damagedQty: savedItem ? savedItem.damagedQty : 0,
                        batchNumber: savedItem ? savedItem.batchNumber : "",
                        expDate: savedItem ? savedItem.expDate : "",
                        costPrice: savedItem ? (savedItem.costPrice || "") : "",
                        mrp: savedItem ? savedItem.mrp : (item.mrp || productInfo.mrp || 0),
                        tax: savedItem ? savedItem.tax : 0,
                        discount: savedItem ? savedItem.discount : 0,
                        notes: savedItem ? savedItem.notes : "",
                        qty: item.qty || item.orderQuantity || 0
                    };
                });
                setItems(mapped);

                if (receivedDetails) {
                    setReceivedDate(receivedDetails.receivedDate || new Date().toISOString().split('T')[0]);
                    setPayBasedOnOrdered(receivedDetails.toggles?.payBasedOnOrdered || false);
                    setDamagedReturnedGoods(receivedDetails.toggles?.damagedReturnedGoods || false);
                    setAddToCreditNote(receivedDetails.toggles?.addToCreditNote || false);
                    setOverallTax(receivedDetails.overallTax || { value: 0, type: '%' });
                    setOverallDiscount(receivedDetails.overallDiscount || { value: 0, type: '₹' });
                    setPreviousCredit(receivedDetails.previousCredit || 0);
                    setPaymentStatus(receivedDetails.paymentStatus || "Pending");
                    setPaidAmount(receivedDetails.paidAmount || 0);
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
        }
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: finalValue };
        setItems(newItems);
    };

    const totals = useMemo(() => {
        if (!items.length) return { totalCost: 0, discountableAmount: 0, shortfallAmount: 0, damagedAmount: 0 };
        let totalCost = 0;
        let discountableAmount = 0;
        let shortfallAmount = 0;
        let damagedAmount = 0;

        items.forEach(item => {
            // Check if user has entered critical fields (Cost Price and Received Qty)
            // We use costPrice as a string check to see if user has interacted with it
            const isEntered = item.costPrice !== "" && item.receivedQty !== "";
            if (!isEntered) return;

            const cost = Number(item.costPrice) || 0;
            const ordered = Number(item.qty) || 0;
            const received = Number(item.receivedQty) || 0;
            const damaged = Number(item.damagedQty) || 0;
            
            totalCost += (ordered * cost);
            
            if (ordered > received) {
                shortfallAmount += (ordered - received) * cost;
            }
            
            damagedAmount += (damaged * cost);
            
            if (payBasedOnOrdered) {
                discountableAmount += (ordered * cost);
            } else {
                discountableAmount += (received * cost);
            }
        });
        
        if (damagedReturnedGoods) {
            discountableAmount -= damagedAmount;
        }

        return { totalCost, discountableAmount, shortfallAmount, damagedAmount };
    }, [items, payBasedOnOrdered, damagedReturnedGoods]);

    const breakdown = useMemo(() => {
        const { discountableAmount } = totals;
        let discountVal = Number(overallDiscount.value) || 0;
        if (overallDiscount.type === '%') discountVal = (discountableAmount * (overallDiscount.value / 100));
        let taxVal = Number(overallTax.value) || 0;
        if (overallTax.type === '%') taxVal = ((discountableAmount - discountVal) * (overallTax.value / 100));
        
        const subtotal = discountableAmount - discountVal + taxVal;
        const finalAmount = subtotal - previousCredit;
        
        return { discountVal, taxVal, subtotal, finalAmount };
    }, [totals, overallTax, overallDiscount, previousCredit]);

    const handleSave = async () => {
        setLoading(true);
        console.log("Starting handleSave...");
        try {
            // Filter only "entered" items (where user provided Cost Price and Received Qty)
            const enteredItems = items.filter(item => item.costPrice !== "" && item.receivedQty !== "");
            
            console.log("Entered Items count:", enteredItems.length);
            
            if (enteredItems.length === 0) {
                toast.error("Please enter details for at least one item");
                setLoading(false);
                return;
            }

            const payload = {
                productsPurchaseRqstId: requestId,
                branchId: orderData?.branchId || 91,
                receivedDate: receivedDate,
                amountPaidToSupplier: Number(paidAmount),
                paymentStatus: paymentStatus,
                returnsApplicable: damagedReturnedGoods,
                createdBy: userId || 1,
                additionalDetails: items[0]?.notes || "Purchase order received",
                taxGroupId: 1,
                items: enteredItems.map(item => ({
                    productId: item.productId,
                    variantId: item.variantId,
                    costPrice: Number(item.costPrice),
                    mrp: Number(item.mrp),
                    qty: Number(item.qty),
                    receivedQuantity: Number(item.receivedQty),
                    damagedQuantity: Number(item.damagedQty),
                    discount: Number(item.discount),
                    taxGroupId: 1,
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
        return <PurchaseOrderSummary data={orderData} onClose={onClose} />;
    }

    return (
        <div className={styles.container}>
            <div className={styles.mainContent}>
                <div className={styles.headerSection}>
                    <h2 className={styles.title}>Receive Purchase Order <span className={styles.requestId}>#{String(orderData.purchaseRequestId).padStart(6, '0')}</span></h2>
                </div>

                <div className={styles.itemList}>
                    {items.map((item, index) => {
                        const rowTotal = (Number(item.costPrice) * Number(item.receivedQty)) || 0;
                        const rowOrdered = (Number(item.costPrice) * Number(item.qty)) || 0;
                        
                        return (
                            <div key={index} className={`${styles.productCard} ${expandedItem === index ? styles.productCardActive : ""}`}>
                                <div className={styles.cardHeader} onClick={() => setExpandedItem(expandedItem === index ? -1 : index)}>
                                    <div className={styles.headerInfo}>
                                        <div className={styles.headerTitleLine}>
                                            <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
                                            <span className={styles.productName}>{item.productName} - {[item.variantType?.size, item.variantType?.variantName, item.variantType?.packType].filter(Boolean).join(" ")}</span>
                                        </div>
                                        <div className={styles.headerStatsLine}>
                                            <span>Ordered : {item.qty}</span>
                                            <span>Received : {item.receivedQty}</span>
                                            <span>Damaged : {item.damagedQty}</span>
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
                                                    onChange={(e) => handleItemChange(index, "expDate", e.target.value)}
                                                />
                                            </div>

                                            <div className={styles.fieldGroup}>
                                                <label className={styles.fieldLabel}>Cost Price</label>
                                                <div className={styles.inputWrapper}>
                                                    <span className={styles.currencySymbol}>₹</span>
                                                    <input 
                                                        type="number" 
                                                        className={`${styles.input} ${styles.inputWithSymbol}`} 
                                                        value={item.costPrice ?? ""}
                                                        onChange={(e) => handleItemChange(index, "costPrice", e.target.value)}
                                                    />
                                                </div>
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
                                                    className={styles.input} 
                                                    value={item.receivedQty ?? ""}
                                                    onChange={(e) => handleItemChange(index, "receivedQty", e.target.value)}
                                                />
                                            </div>

                                            <div className={styles.fieldGroup}>
                                                <label className={styles.fieldLabel}>Damaged Items</label>
                                                <input 
                                                    type="number" 
                                                    className={styles.input} 
                                                    value={item.damagedQty ?? ""}
                                                    onChange={(e) => handleItemChange(index, "damagedQty", e.target.value)}
                                                />
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
                                                <label className={styles.fieldLabel}>Discount</label>
                                                <div className={styles.inputWrapper}>
                                                    <span className={styles.currencySymbol}>₹</span>
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
                                                <span className={styles.summaryValue}>₹ {rowOrdered.toLocaleString()}</span>
                                            </div>
                                            <div className={styles.summaryItem}>
                                                <span className={styles.summaryLabel}>Total Received Value</span>
                                                <span className={styles.summaryValue}>₹ {rowTotal.toLocaleString()}</span>
                                            </div>
                                            <div className={styles.summaryItem}>
                                                <span className={styles.summaryLabel}>Total Discount Value</span>
                                                <span className={styles.summaryValue}>₹ {Number(item.discount || 0).toLocaleString()}</span>
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
                                <input type="date" className={styles.input} value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} />
                                <FiCalendar className={styles.calendarIcon} />
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

                                <div className={styles.breakdownRow}><span>Discountable Amount</span><span>₹ {totals.discountableAmount.toFixed(2)}</span></div>
                                <div className={styles.breakdownRow}><span>Discount</span><span>- ₹ {breakdown.discountVal.toFixed(2)}</span></div>
                                <div className={styles.breakdownRow}><span>Credit Amount (Prev. Purchase)</span><span>₹ 0</span></div>
                                <div className={styles.breakdownDivider} />
                                <div className={styles.breakdownRow}><span>Subtotal</span><span>₹ {breakdown.subtotal.toFixed(2)}</span></div>
                                <div className={styles.breakdownRow}><span>Overall Tax</span><span>₹ {breakdown.taxVal.toFixed(2)}</span></div>
                                <div className={styles.breakdownRow}><span>Overall Discount</span><span>- ₹ {breakdown.discountVal.toFixed(2)}</span></div>
                                <div className={styles.breakdownRow}><span>Tax</span><span>₹ 0.00</span></div>
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
                                { label: "Pending", value: "Pending" }
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
                            <label className={styles.infoLabel}>Paid Amount</label>
                            <div className={styles.inputWrapper}>
                                <span className={styles.currencySymbol}>₹</span>
                                <input type="number" className={`${styles.input} ${styles.inputWithSymbol}`} placeholder="00000" value={paidAmount} onChange={(e) => {
                                    let val = e.target.value;
                                    if (val.length > 1 && val.startsWith("0") && val[1] !== ".") val = val.slice(1);
                                    setPaidAmount(val);
                                }} />
                            </div>
                        </div>
                    )}

                    <div className={styles.infoGroup}>
                        <label className={styles.infoLabel}>Select date</label>
                        <div className={styles.inputWrapper}>
                            <input type="date" className={styles.input} value={receivedDate} />
                            <FiCalendar className={styles.calendarIcon} />
                        </div>
                    </div>

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
