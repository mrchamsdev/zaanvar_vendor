import React from "react";
import styles from "../../styles/purchase-bill/purchase-order-summary.module.css";
import { FiChevronDown, FiPrinter } from "react-icons/fi";

const PurchaseOrderSummary = ({ data, onClose }) => {
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
        duedate // Field mentioned by user
    } = data;

    const [showBreakdown, setShowBreakdown] = React.useState(false);

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
            default: return status || "Pending";
        }
    };

    const breakdown = React.useMemo(() => {
        const receivedDetails = data?.receivedDetails || {};
        const itemsList = items || [];
        
        const totalCost = itemsList.reduce((acc, item) => acc + (Number(item.qty || 0) * Number(item.costPrice || 0)), 0);
        const discountableAmount = itemsList.reduce((acc, item) => acc + (Number(item.receivedQty || 0) * Number(item.costPrice || 0)), 0);
        
        // Handle overall tax and discount
        let discountVal = Number(receivedDetails.overallDiscount?.value) || 0;
        if (receivedDetails.overallDiscount?.type === '%') {
            discountVal = (discountableAmount * (discountVal / 100));
        }
        
        let taxVal = Number(receivedDetails.overallTax?.value) || 0;
        if (receivedDetails.overallTax?.type === '%') {
            taxVal = ((discountableAmount - discountVal) * (taxVal / 100));
        }
        
        const previousCredit = Number(receivedDetails.previousCredit) || 0;
        const subtotal = discountableAmount - discountVal;
        const finalAmount = subtotal + taxVal - previousCredit;
        
        return { 
            totalCost, 
            discountableAmount, 
            discountVal, 
            taxVal, 
            subtotal, 
            finalAmount,
            previousCredit 
        };
    }, [items, data]);

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
                        <span className={styles.value}>{formatDate(receivedDate)}</span>
                    </div>
                    <div className={styles.statusGroup}>
                        <span className={styles.label}>Purchase Order Status</span>
                        <span className={styles.value}>{data.orderStatus?.toUpperCase()}</span>
                    </div>
                    <div className={styles.statusGroup}>
                        <div className={styles.statusBadge}>{getStatusLabel(paymentStatus)}</div>
                        {(paymentStatus === "PayLaterWithRemainder" || paymentStatus === "Partial") && duedate && (
                            <div className={styles.dueDate}>Due on {formatDate(duedate)}</div>
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
                            <th>DAMAGED GOODS</th>
                            <th>COST PRICE (₹)</th>
                            <th>Total Order Value (₹)</th>
                            <th>TAX (%)</th>
                            <th>DIS (%)</th>
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
                                            <span className={styles.productSubtext}>
                                                GST ({item.taxGroupId || 0}%) - ₹ {item.tax || 0} - Discount - ₹ {item.discount || 0}
                                            </span>
                                        </div>
                                    </td>
                                    <td>{item.productCode || "--"}</td>
                                    <td>{[item.variantType?.size, item.variantType?.type, item.variantType?.packType, item.variantMeasure].filter(Boolean)[0] || "--"}</td>
                                    <td>
                                        <div className={styles.qtyCell}>
                                            <span className={styles.value}>{item.receivedQty}</span>
                                            <span className={styles.orderedQtySub}>Ordered Qty - {item.qty}</span>
                                        </div>
                                    </td>
                                    <td>{item.damagedQty || 0}</td>
                                    <td className={styles.costCell}>{Number(item.costPrice).toLocaleString()}</td>
                                    <td>{orderVal.toLocaleString()}</td>
                                    <td>{String(item.taxGroupId || 0).padStart(2, '0')}%</td>
                                    <td>{String(item.discount || 0).padStart(2, '0')}%</td>
                                    <td className={styles.costCell}>{receivedVal.toLocaleString()}</td>
                                </tr>
                            );
                        })}
                    </tbody>
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
                                <span>Total Cost</span>
                                <span>₹ {breakdown.totalCost.toLocaleString()}</span>
                            </div>
                            <div className={styles.breakdownRow}>
                                <span>Discountable Amount</span>
                                <span>₹ {breakdown.discountableAmount.toLocaleString()}</span>
                            </div>
                            <div className={styles.breakdownRow}>
                                <span>Total Discount</span>
                                <span>₹ -{breakdown.discountVal.toLocaleString()}</span>
                            </div>
                            <div className={styles.breakdownRow}>
                                <span>Credit Note</span>
                                <span>₹ -{breakdown.previousCredit.toLocaleString()}</span>
                            </div>
                            <div className={styles.breakdownRow}>
                                <span>Subtotal</span>
                                <span>₹ {breakdown.subtotal.toLocaleString()}</span>
                            </div>
                            <div className={styles.breakdownRow}>
                                <strong>Taxable Amount</strong>
                                <strong>₹ {breakdown.taxVal.toLocaleString()}</strong>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.totalSection}>
                <span className={styles.totalLabel}>TOTAL :</span>
                <span className={styles.totalValue}>₹ {breakdown.finalAmount.toLocaleString()}</span>
            </div>

            <div className={styles.footer}>
                <button className={styles.printBtn} onClick={() => window.print()}>Print</button>
                <button className={styles.markPaidBtn}>Mark as Paid</button>
            </div>
        </div>
    );
};

export default PurchaseOrderSummary;
