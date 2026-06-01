import React from "react";
import styles from "../../styles/purchase-bill/purchase-order-summary.module.css";
import { FiChevronDown, FiPrinter } from "react-icons/fi";
import PaymentDetailsPopup from "./payment-details-popup";

const PurchaseOrderSummary = ({ data, onClose, onRefresh }) => {
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
        itemTaxAmount: rootItemTax,
        itemDiscountAmount: rootItemDiscount,
        damagedAmount: rootDamagedAmount,
        shortfallAmount: rootShortfallAmount,
        receivedDetails = {},
        returnsApplicable,
        shortFallApplicable,
        shortfallApplicable
    } = data;

    // Use root properties if available, fallback to receivedDetails
    const finalOverallTax = rootOverallTax || receivedDetails.overallTax || { value: 0, type: '%' };
    const finalOverallDiscount = rootOverallDiscount || receivedDetails.overallDiscount || { value: 0, type: '₹' };
    const finalPreviousCredit = rootPreviousCredit ?? receivedDetails.previousCredit ?? 0;

    const [showBreakdown, setShowBreakdown] = React.useState(false);

    const handleHeaderClick = () => {
        setShowBreakdown(!showBreakdown);
    };

    const [showPaymentPopup, setShowPaymentPopup] = React.useState(false);

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case "Full": return "Paid";
            case "Partial": return "Partial Payment";
            case "PayLaterWithRemainder": return "Payment Pending";
            case "Pending": return "Payment Pending";
            default: return "Payment Pending";
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "Full": return styles.statusBadgePaid;
            case "Partial": return styles.statusBadgePartial;
            default: return styles.statusBadgePending;
        }
    };

    const breakdown = React.useMemo(() => {
        const itemsList = items || [];
        const toggles = receivedDetails.toggles || {};
        const payBasedOnOrdered = 
            data.shortFallApplicable || 
            data.shortfallApplicable || 
            shortFallApplicable || 
            shortfallApplicable || 
            toggles.payBasedOnOrdered || 
            receivedDetails.shortFallApplicable || 
            receivedDetails.shortfallApplicable || 
            false;
        const damagedReturnedGoods = toggles.damagedReturnedGoods || false;

        let totalOrderValue = 0;
        let grandTotal = 0;
        let calculatedItemDiscountTotal = 0;
        let calculatedItemTaxTotal = 0;
        let calculatedDamagedAmountTotal = 0;
        let calculatedShortfallAmountTotal = 0;

        itemsList.forEach(item => {
            const cost = parseFloat(item.costPrice) || 0;
            const ordered = parseFloat(item.qty || item.orderQuantity) || 0;
            const received = parseFloat(item.receivedQty) || 0;
            const damaged = parseFloat(item.damagedQty) || 0;
            const discountPercent = parseFloat(item.discount) || 0;
            const taxPercent = parseFloat(item.taxGroupId) || parseFloat(item.tax) || 0;

            totalOrderValue += (ordered * cost);

            const baseQty = payBasedOnOrdered ? ordered : received;
            // Only deduct damaged from billing if returnsApplicable is true
            const billingQty = returnsApplicable ? Math.max(0, baseQty - damaged) : baseQty;

            const billableSubtotal = billingQty * cost;
            const discAmount = (billableSubtotal * discountPercent / 100);
            const afterDiscount = billableSubtotal - discAmount;
            const taxAmount = (afterDiscount * taxPercent / 100);
            const finalProductAmount = afterDiscount + taxAmount;

            calculatedItemDiscountTotal += discAmount;
            calculatedItemTaxTotal += taxAmount;
            grandTotal += finalProductAmount;

            if (ordered > received) {
                calculatedShortfallAmountTotal += (ordered - received) * cost;
            }
            calculatedDamagedAmountTotal += (damaged * cost);
        });

        const itemDiscountTotal = rootItemDiscount !== undefined ? parseFloat(rootItemDiscount) : calculatedItemDiscountTotal;
        const itemTaxTotal = rootItemTax !== undefined ? parseFloat(rootItemTax) : calculatedItemTaxTotal;
        const damagedAmountTotal = rootDamagedAmount !== undefined ? parseFloat(rootDamagedAmount) : calculatedDamagedAmountTotal;
        const shortfallAmountTotal = rootShortfallAmount !== undefined ? parseFloat(rootShortfallAmount) : calculatedShortfallAmountTotal;

        let overallDiscountVal = Number(finalOverallDiscount.value) || 0;
        if (finalOverallDiscount.type === '%') {
            overallDiscountVal = (grandTotal * (overallDiscountVal / 100));
        }

        let overallTaxVal = Number(finalOverallTax.value) || 0;
        if (finalOverallTax.type === '%') {
            overallTaxVal = ((grandTotal - overallDiscountVal) * (overallTaxVal / 100));
        }

        const previousCredit = Number(finalPreviousCredit) || 0;
        const subtotal = grandTotal;
        const finalAmount = subtotal - overallDiscountVal + overallTaxVal - previousCredit;

        return {
            totalCost: totalOrderValue,
            shortfallAmountTotal,
            damagedAmountTotal,
            discountableAmount: grandTotal,
            discountableBase: grandTotal - calculatedItemTaxTotal + calculatedItemDiscountTotal,
            itemDiscountTotal,
            itemTaxTotal,
            overallDiscountVal,
            overallTaxVal,
            subtotal,
            finalAmount,
            previousCredit,
            payBasedOnOrdered,
            damagedReturnedGoods
        };
    }, [items, data, finalOverallTax, finalOverallDiscount, finalPreviousCredit, receivedDetails]);

    return (
        <div className={styles.container}>
            <div className={styles.headerCard}>
                <div className={styles.orderMainInfo}>
                    <div className={styles.orderNumber}>Purchase Order <span>{String(purchaseRequestId || "").padStart(6, '0')}</span></div>
                    <div className={styles.orderDate}>{formatDate(orderDate)}</div>

                    <div className={styles.addressSection}>
                        <div className={styles.addressGroup}>
                            <span className={styles.addressLabel}>From</span>
                            <span className={styles.addressName}>{supplier?.supplierName || "N/A"}</span>
                            <span className={styles.addressText}>
                                {[supplier?.street, supplier?.city, supplier?.state, supplier?.areaPinCode].filter(Boolean).join(", ")}
                                <br />{supplier?.country}
                            </span>
                        </div>
                        <div className={styles.addressGroup}>
                            <span className={styles.addressLabel}>To</span>
                            <span className={styles.addressName}>{branchName || "N/A"}</span>
                            <span className={styles.addressText}>
                                {branchAddress?.addressText || [branchAddress?.flatNo, branchAddress?.area, branchAddress?.city, [branchAddress?.state, branchAddress?.pincode].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
                                <br />{branchAddress?.country}
                            </span>
                        </div>
                    </div>
                </div>

                <div className={styles.statusInfo}>
                    <div className={styles.statusGroup}>
                        <span className={styles.label}>Delivered on</span>
                        <span className={styles.value}>{formatDate(receivedDate || receivedDetails?.receivedDate || createdAt || orderDate)}</span>
                    </div>

                    <div className={styles.statusGroup}>
                        <div className={`${styles.statusBadge} ${getStatusClass(paymentStatus)}`}>
                            {getStatusLabel(paymentStatus)}
                        </div>
                        {paymentStatus !== "Full" && (duedate || dueDate || data.receivedDetails?.duedate || data.receivedDetails?.dueDate) && (
                            <div className={styles.dueDate}>Due on {formatDate(duedate || dueDate || data.receivedDetails?.duedate || data.receivedDetails?.dueDate)}</div>
                        )}
                        {(productsBillId || receivedDetails?.id || data?.id) && (
                            <div className={styles.billNumber}>Bill No: {productsBillId || receivedDetails?.id || data?.id}</div>
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
                            <th>ORDER QTY</th>
                            <th>RECEIVED QTY</th>
                            { !returnsApplicable && <th>SHORTFALL QTY</th> }
                            <th>DAMAGED GOODS</th>
                            <th>BATCH NUMBER</th>
                            <th>EXPIRY DATE</th>
                            <th>COST PRICE (₹)</th>
                            <th>MRP (₹)</th>
                            <th>DISCOUNTABLE AMOUNT (₹)</th>
                            <th>TAX (%)</th>
                            <th>Discount (%)</th>
                            <th>Total Received Value (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => {
                            const cost = parseFloat(item.costPrice) || 0;
                            const ordered = parseFloat(item.qty || item.orderQuantity) || 0;
                            const received = parseFloat(item.receivedQty) || 0;
                            const damaged = parseFloat(item.damagedQty) || 0;

                            const baseQty = breakdown.payBasedOnOrdered ? ordered : received;
                            const billingQty = breakdown.damagedReturnedGoods ? Math.max(0, baseQty - damaged) : baseQty;

                            const billableSubtotal = billingQty * cost;

                            return (
                                <tr key={idx}>
                                    <td className={styles.sno}>{String(idx + 1).padStart(2, '0')}</td>
                                    <td>
                                        <div className={styles.productCell}>
                                            <span className={styles.productName}>{item.productName}</span>

                                        </div>
                                    </td>
                                    <td>{item.productCode || "--"}</td>
                                    <td>{[formatVariantSize(item.variantType?.size), item.variantType?.type, item.variantType?.packType, item.variantMeasure].filter(Boolean)[0] || "--"}</td>
                                    <td style={{ textAlign: 'center', fontWeight: '700' }}>{item.qty || item.orderQuantity || 0}</td>
                                    <td>
                                        <div className={styles.qtyCell}>
                                            <span className={styles.value}>{item.receivedQty}</span>
                                            {/* <span className={styles.orderedQtySub}>Current Qty - {item.currentQty || item.currentStock || 0}</span> */}
                                        </div>
                                    </td>
                                    { !returnsApplicable && <td>{Math.max(0, (parseFloat(item.qty || item.orderQuantity || 0) - received))}</td> }
                                    <td>{damaged}</td>
                                    <td>{item.batchNumber || "------"}</td>
                                    <td>{(() => { const d = item.expDate || item.expiryDate; return (d && !/^0+[-/]0+[-/]0+$/.test(d)) ? formatDate(d) : "–"; })()}</td>
                                    <td className={styles.costCell}>{cost.toLocaleString()}</td>
                                    <td className={styles.costCell}>{parseFloat(item.mrp || 0).toLocaleString()}</td>
                                    <td className={styles.costCell}>{billableSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td>{parseFloat(item.taxGroupId || item.tax || 0)}%</td>
                                    <td>{parseFloat(item.discount || 0)}%</td>
                                    <td className={styles.costCell}>
                                        ₹ {(() => {
                                            const discPercent = parseFloat(item.discount) || 0;
                                            const discAmount = (billableSubtotal * discPercent / 100);
                                            const afterDisc = billableSubtotal - discAmount;
                                            const tax = (afterDisc * (parseFloat(item.taxGroupId || item.tax) || 0) / 100);
                                            return (afterDisc + tax).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                        })()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className={styles.tableFooter}>
                            <td colSpan={returnsApplicable ? 14 : 15} className={styles.totalLabelCell}>Total Amount (Inc. Tax & Disc.)</td>
                            <td className={styles.totalValueCell}>
                                <div className={styles.totalValueWrapper}>
                                    <span>₹</span>
                                    <span>{breakdown.finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className={styles.breakdownSection}>
                <div className={styles.breakdownWrapper}>
                    <div
                        className={styles.breakdownHeader}
                        onClick={handleHeaderClick}
                    >
                        <span className={styles.breakdownTitle}>Price Breakdown</span>
                        <FiChevronDown className={`${styles.breakdownIcon} ${showBreakdown ? styles.breakdownIconActive : ""}`} />
                    </div>
                    <div className={`${styles.breakdownContent} ${showBreakdown ? styles.breakdownContentActive : ""}`}>
                        <div className={styles.breakdownRow}>
                            <span>Total Ordered Cost</span>
                            <span>₹ {breakdown.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        { !breakdown.payBasedOnOrdered && breakdown.shortfallAmountTotal > 0 && (
                            <div className={styles.breakdownRow}>
                                <span> Shortfall Amount</span>
                                <span>- ₹ {breakdown.shortfallAmountTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        )}
                        {returnsApplicable && breakdown.damagedAmountTotal > 0 && (
                            <div className={styles.breakdownRow}>
                                <span> Damaged Amount</span>
                                <span>- ₹ {breakdown.damagedAmountTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        )}
                        <div className={styles.breakdownRow}>
                            <span>Discountable Amount</span>
                            <span style={{ fontWeight: '700', color: '#000' }}>₹ {breakdown.discountableBase.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className={styles.breakdownRow}>
                            <span>Item Discount</span>
                            <span>- ₹ {breakdown.itemDiscountTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className={styles.breakdownRow}>
                            <span>Item Tax</span>
                            <span>₹ {breakdown.itemTaxTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className={styles.breakdownDivider} />
                        <div className={styles.breakdownRow}>
                            <span>Subtotal</span>
                            <span>₹ {(breakdown.discountableAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className={styles.breakdownRow}>
                            <span> Overall Discount</span>
                            <span>- ₹ {breakdown.overallDiscountVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className={styles.breakdownRow}>
                            <span> Overall Tax</span>
                            <span>₹ {breakdown.overallTaxVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>

                        {breakdown.previousCredit > 0 && (
                            <div className={styles.breakdownRow}>
                                <span>Previous Credit</span>
                                <span>- ₹ {breakdown.previousCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        )}
                        <div className={styles.breakdownRowTotal}>
                            <span>TOTAL</span>
                            <span>₹ {breakdown.finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
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
