import React from "react";
import styles from "../../styles/purchase-bill/purchase-order-summary.module.css";
import { FiChevronDown, FiPrinter } from "react-icons/fi";
import PaymentDetailsPopup from "./payment-details-popup";

const PurchaseOrderSummary = ({ data, onClose, onRefresh }) => {
    if (!data) return null;

    const { 
        purchaseRequestId, 
        orderDate, 
        receivedDate, 
        paymentStatus, 
        supplier, 
        branchName, 
        branchAddress, 
        items,
        duedate,
        dueDate,
        createdAt,
        orderStatus,
        productsBillId,
        overallTax: rootOverallTax,
        overallDiscount: rootOverallDiscount,
        previousCredit: rootPreviousCredit,
        receivedDetails = {}
    } = data;

    // Use root properties if available, fallback to receivedDetails
    const finalOverallTax = rootOverallTax || receivedDetails.overallTax || { value: 0, type: '%' };
    const finalOverallDiscount = rootOverallDiscount || receivedDetails.overallDiscount || { value: 0, type: '₹' };
    const finalPreviousCredit = rootPreviousCredit ?? receivedDetails.previousCredit ?? 0;

    const [showBreakdown, setShowBreakdown] = React.useState(true);
    const [showPaymentPopup, setShowPaymentPopup] = React.useState(false);

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getStatusLabel = (status) => {
        switch(status) {
            case "Full": return "Paid";
            case "Partial": return "Partial Payment";
            case "PayLaterWithRemainder": return "Payment Pending";
            case "Pending": return "Payment Pending";
            default: return "Payment Pending";
        }
    };

    const getStatusClass = (status) => {
        switch(status) {
            case "Full": return styles.statusBadgePaid;
            case "Partial": return styles.statusBadgePartial;
            default: return styles.statusBadgePending;
        }
    };

    const breakdown = React.useMemo(() => {
        const itemsList = items || [];
        const toggles = receivedDetails.toggles || {};
        const payBasedOnOrdered = toggles.payBasedOnOrdered || false;
        const damagedReturnedGoods = toggles.damagedReturnedGoods || false;
        
        let totalCost = 0;
        let discountableAmount = 0;
        let itemDiscountTotal = 0;
        let itemTaxTotal = 0;
        let damagedAmount = 0;

        itemsList.forEach(item => {
            const cost = Number(item.costPrice) || 0;
            const ordered = Number(item.qty || item.orderQuantity) || 0;
            const received = Number(item.receivedQty) || 0;
            const itemDiscountPercent = Number(item.discount) || 0;
            const itemTax = Number(item.taxGroupId) || 0; 
            const damaged = Number(item.damagedQty) || 0;
            
            totalCost += (ordered * cost);
            
            let rowBase = payBasedOnOrdered ? (ordered * cost) : (received * cost);
            const itemDiscountAmount = (rowBase * itemDiscountPercent / 100);
            
            itemDiscountTotal += itemDiscountAmount;
            damagedAmount += (damaged * cost);
            
            let rowAfterDiscount = rowBase - itemDiscountAmount;
            let rowTax = (rowAfterDiscount * itemTax / 100);
            let rowFinal = rowAfterDiscount + rowTax;
            
            itemTaxTotal += rowTax;
            discountableAmount += rowFinal;
        });

        if (damagedReturnedGoods) {
            discountableAmount -= damagedAmount;
        }
        
        let overallDiscountVal = Number(finalOverallDiscount.value) || 0;
        if (finalOverallDiscount.type === '%') {
            overallDiscountVal = (discountableAmount * (overallDiscountVal / 100));
        }
        
        let overallTaxVal = Number(finalOverallTax.value) || 0;
        if (finalOverallTax.type === '%') {
            overallTaxVal = ((discountableAmount - overallDiscountVal) * (overallTaxVal / 100));
        }
        
        const previousCredit = Number(finalPreviousCredit) || 0;
        const subtotal = discountableAmount - overallDiscountVal + overallTaxVal;
        const finalAmount = subtotal - previousCredit;
        
        return { 
            totalCost, 
            discountableAmount, 
            itemDiscountTotal,
            itemTaxTotal,
            overallDiscountVal, 
            overallTaxVal, 
            subtotal, 
            finalAmount,
            previousCredit 
        };
    }, [items, data, finalOverallTax, finalOverallDiscount, finalPreviousCredit]);

    return (
        <div className={styles.container}>
            <div className={styles.headerCard}>
                <div className={styles.orderMainInfo}>
                    <div className={styles.orderNumber}>Purchase Order <span>#{String(purchaseRequestId || "").padStart(6, '0')}</span></div>
                    <div className={styles.orderDate}>{formatDate(orderDate)}</div>
                    
                    <div className={styles.addressSection}>
                        <div className={styles.addressGroup}>
                            <span className={styles.addressLabel}>From</span>
                            <span className={styles.addressName}>{supplier?.supplierName || "N/A"}</span>
                            <span className={styles.addressText}>
                                {supplier?.street}, {supplier?.city}, {supplier?.state} {supplier?.areaPinCode}
                                <br />{supplier?.country}
                            </span>
                        </div>
                        <div className={styles.addressGroup}>
                            <span className={styles.addressLabel}>To</span>
                            <span className={styles.addressName}>{branchName || "N/A"}</span>
                            <span className={styles.addressText}>
                                {branchAddress?.addressText || `${branchAddress?.flatNo}, ${branchAddress?.area}, ${branchAddress?.city}, ${branchAddress?.state} ${branchAddress?.pincode}`}
                                <br />{branchAddress?.country}
                            </span>
                        </div>
                    </div>
                </div>

                <div className={styles.statusInfo}>
                    <div className={styles.statusGroup}>
                        <span className={styles.label}>Delivered on</span>
                        <span className={styles.value}>{formatDate(createdAt || orderDate)}</span>
                    </div>
                    <div className={styles.statusGroup}>
                        <span className={styles.label}>Purchase Order</span>
                        <span className={styles.value}>#{String(purchaseRequestId || "").padStart(6, '0')}</span>
                    </div>
                    <div className={styles.statusGroup}>
                        <div className={`${styles.statusBadge} ${getStatusClass(paymentStatus)}`}>
                            {getStatusLabel(paymentStatus)}
                        </div>
                        {paymentStatus !== "Full" && (duedate || dueDate || data.receivedDetails?.duedate || data.receivedDetails?.dueDate) && (
                            <div className={styles.dueDate}>Due on {formatDate(duedate || dueDate || data.receivedDetails?.duedate || data.receivedDetails?.dueDate)}</div>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>S.NO</th>
                            <th>PRODUCT NAME</th>
                            <th>PRODUCT CODE</th>
                            <th>VRIANT</th>
                            <th>RECEIVED QTY</th>
                            <th>SHORTFALL QTY</th>
                            <th>DAMAGED GOODS</th>
                            <th>COST PRICE (₹)</th>
                            <th>TAX (%)</th>
                            <th>Discount (%)</th>
                            <th>Total Order Value (₹)</th>
                            <th>Total Received Value (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => {
                            const orderVal = (Number(item.qty || 0) * Number(item.costPrice || 0));
                            const receivedVal = (Number(item.receivedQty || 0) * Number(item.costPrice || 0));
                            
                            return (
                                <tr key={idx}>
                                    <td className={styles.sno}>{String(idx + 1).padStart(2, '0')}</td>
                                    <td>
                                        <div className={styles.productCell}>
                                            <span className={styles.productName}>{item.productName}</span>
                                           
                                        </div>
                                    </td>
                                    <td>{item.productCode || "--"}</td>
                                    <td>{[item.variantType?.size, item.variantType?.type, item.variantType?.packType, item.variantMeasure].filter(Boolean)[0] || "--"}</td>
                                    <td>
                                        <div className={styles.qtyCell}>
                                            <span className={styles.value}>{item.receivedQty}</span>
                                            <span className={styles.orderedQtySub}>Current Qty - {item.currentQty || item.currentStock || 0}</span>
                                        </div>
                                    </td>
                                    <td>{Math.max(0, (Number(item.qty || 0) - Number(item.receivedQty || 0)))}</td>
                                    <td>{item.damagedQty || 0}</td>
                                    <td className={styles.costCell}>{item.costPrice ? Number(item.costPrice).toLocaleString() : "-"}</td>
                                    <td>{item.taxGroupId || 0}%</td>
                                    <td>{item.discount || 0}%</td>
                                    <td className={styles.costCell}>
                                        ₹ {(() => {
                                            const base = (Number(item.qty || item.orderQuantity) || 0) * (Number(item.costPrice) || 0);
                                            const discPercent = Number(item.discount) || 0;
                                            const discAmount = (base * discPercent / 100);
                                            const afterDisc = base - discAmount;
                                            const tax = (afterDisc * (Number(item.taxGroupId) || 0) / 100);
                                            return (afterDisc + tax).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                        })()}
                                    </td>
                                    <td className={styles.costCell}>
                                        ₹ {(() => {
                                            const base = (Number(item.receivedQty) || 0) * (Number(item.costPrice) || 0);
                                            const discPercent = Number(item.discount) || 0;
                                            const discAmount = (base * discPercent / 100);
                                            const afterDisc = base - discAmount;
                                            const tax = (afterDisc * (Number(item.taxGroupId) || 0) / 100);
                                            return (afterDisc + tax).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                        })()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className={styles.tableFooter}>
                            <td colSpan={11} className={styles.totalLabelCell}>Total Amount (Inc. Tax & Disc.)</td>
                            <td className={styles.totalValueCell}>₹ {breakdown.finalAmount.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className={styles.breakdownSection}>
                <div className={styles.breakdownWrapper}>
                    <div className={styles.breakdownHeader} onClick={() => setShowBreakdown(!showBreakdown)}>
                        <span className={styles.breakdownTitle}>Price Breakdown</span>
                        <FiChevronDown className={`${styles.breakdownIcon} ${showBreakdown ? styles.breakdownIconActive : ""}`} />
                    </div>
                    {showBreakdown && (
                        <div className={styles.breakdownContent}>
                            <div className={styles.breakdownRow}>
                                <span>Total Ordered Cost</span>
                                <span>₹ {breakdown.totalCost.toLocaleString()}</span>
                            </div>
                            <div className={styles.breakdownRow}>
                                <span>Item Discount</span>
                                <span>- ₹ {breakdown.itemDiscountTotal.toLocaleString()}</span>
                            </div>
                            <div className={styles.breakdownRow}>
                                <span>Item Tax</span>
                                <span>₹ {breakdown.itemTaxTotal.toLocaleString()}</span>
                            </div>
                            <div className={styles.breakdownDivider} />
                            <div className={styles.breakdownRow}>
                                <span>Subtotal</span>
                                <span>₹ {(breakdown.discountableAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className={styles.breakdownRow}>
                                <span>Overall Tax {finalOverallTax.type === '%' ? `(${finalOverallTax.value}%)` : ""}</span>
                                <span>₹ {breakdown.overallTaxVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className={styles.breakdownRow}>
                                <span>Overall Discount {finalOverallDiscount.type === '%' ? `(${finalOverallDiscount.value}%)` : ""}</span>
                                <span>- ₹ {breakdown.overallDiscountVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            {breakdown.previousCredit > 0 && (
                                <div className={styles.breakdownRow}>
                                    <span>Credit Note</span>
                                    <span>- ₹ {breakdown.previousCredit.toLocaleString()}</span>
                                </div>
                            )}
                            <div className={styles.breakdownRowTotal}>
                                <span>TOTAL</span>
                                <span>₹ {breakdown.finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* <div className={styles.totalSection}>
                <span className={styles.totalLabel}>TOTAL :</span>
                <span className={styles.totalValue}>₹ {breakdown.finalAmount.toLocaleString()}</span>
            </div> */}

            <div className={styles.footer}>
                <button className={styles.printBtn} onClick={() => window.print()}>Print</button>
                {paymentStatus !== "Full" && (
                    <button className={styles.markPaidBtn} onClick={() => setShowPaymentPopup(true)}>Mark as Paid</button>
                )}
            </div>

            {showPaymentPopup && (
                <PaymentDetailsPopup 
                    isOpen={showPaymentPopup}
                    onClose={() => setShowPaymentPopup(false)}
                    onRefresh={onRefresh || (() => window.location.reload())}
                    data={{
                        purchaseRequestId: purchaseRequestId,
                        totalAmount: breakdown.finalAmount,
                        previousPaidAmount: receivedDetails?.paidAmount || data?.amountPaidTosupplier || 0,
                        supplierId: data?.supplier?.supplierId,
                        branchId: data?.branchId,
                        productsBillId: productsBillId || receivedDetails?.id || data?.id,
                        balanceAmount: data?.balanceAmount || data?.outstandingAmount,
                    }}
                />
            )}
        </div>
    );
};

export default PurchaseOrderSummary;
