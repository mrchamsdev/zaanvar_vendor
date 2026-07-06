import React from 'react';
import styles from '../../styles/sale/add-sale-invoice.module.css';
import { getAmountDecimalPlaces } from '../utilities/formatAmount';
import { FiX } from 'react-icons/fi';
import useCurrencySymbol from '../utilities/useCurrencySymbol';

const CostCalculationPopup = ({ 
    isOpen, 
    onClose, 
    items, 
    subtotal, 
    totalTax, 
    invoiceDate 
}) => {
    const currencySymbol = useCurrencySymbol();
    if (!isOpen) return null;

    // Filter out empty rows
    const validItems = items.filter(it => it.productId);

    // Calculate total cost (sum of qty * purchasePrice)
    const totalCost = validItems.reduce((acc, it) => {
        const qty = parseFloat(it.qty) || 0;
        const purchasePrice = parseFloat(it.purchasePrice) || 0;
        return acc + (qty * purchasePrice);
    }, 0);

    const tdsReceivable = 0; // Hardcoded to 0 for now as requested
    
    // Profit = Sale Amount (Subtotal) - Total Cost - Tax Payable + TDS Receivable
    const profit = subtotal - totalCost - totalTax + tdsReceivable;

    return (
        <div className={styles.costCalcModalOverlay}>
            <div className={styles.costCalcModalContent}>
                <div className={styles.costCalcHeader}>
                    <h2>Cost Calculation</h2>
                    <button className={styles.costCalcClose} onClick={onClose}>
                        <FiX size={24} />
                    </button>
                </div>
                
                <div className={styles.costCalcBody}>
                    <table className={styles.costCalcTable}>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Qty</th>
                                <th>Purchase Price</th>
                                <th>Total Cost</th>
                                <th>Discount</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {validItems.length > 0 ? validItems.map((item, index) => {
                                const qty = parseFloat(item.qty) || 0;
                                const purchasePrice = parseFloat(item.purchasePrice) || 0;
                                const sellingPrice = parseFloat(item.price) || 0;
                                const itemTotalCost = qty * sellingPrice;
                                
                                const formattedDate = new Date(invoiceDate).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                });
                                const discount = parseFloat(item.discountAmount) || 0;
                                const amount = parseFloat(item.amount) || 0;
                                
                                return (
                                    <tr key={index}>
                                        <td>{formattedDate}</td>
                                        <td>{qty < 10 && qty > 0 ? `0${qty}` : qty}</td>
                                        <td>{currencySymbol}{purchasePrice.toLocaleString(undefined, { minimumFractionDigits: getAmountDecimalPlaces(), maximumFractionDigits: getAmountDecimalPlaces() })}</td>
                                        <td>{currencySymbol}{itemTotalCost.toLocaleString(undefined, { minimumFractionDigits: getAmountDecimalPlaces(), maximumFractionDigits: getAmountDecimalPlaces() })}</td>
                                        <td>{currencySymbol}{discount.toLocaleString(undefined, { minimumFractionDigits: getAmountDecimalPlaces(), maximumFractionDigits: getAmountDecimalPlaces() })}</td>
                                        <td>{currencySymbol}{amount.toLocaleString(undefined, { minimumFractionDigits: getAmountDecimalPlaces(), maximumFractionDigits: getAmountDecimalPlaces() })}</td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center' }}>No items added yet</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <div className={styles.costCalcSummary}>
                        <div className={styles.costCalcSummaryRow}>
                            <span>Subtotal</span>
                            <span>{currencySymbol} {subtotal.toLocaleString(undefined, { minimumFractionDigits: getAmountDecimalPlaces(), maximumFractionDigits: getAmountDecimalPlaces() })}</span>
                        </div>
                        <div className={styles.costCalcSummaryRow}>
                            <span>Total Cost</span>
                            <span>{currencySymbol} {totalCost.toLocaleString(undefined, { minimumFractionDigits: getAmountDecimalPlaces(), maximumFractionDigits: getAmountDecimalPlaces() })}</span>
                        </div>
                        <div className={styles.costCalcSummaryRow}>
                            <span>Tax Payable</span>
                            <span>{currencySymbol} {totalTax.toLocaleString(undefined, { minimumFractionDigits: getAmountDecimalPlaces(), maximumFractionDigits: getAmountDecimalPlaces() })}</span>
                        </div>
                        <div className={styles.costCalcSummaryRow}>
                            <span>TDS Receivable</span>
                            <span>{currencySymbol} {tdsReceivable.toLocaleString(undefined, { minimumFractionDigits: getAmountDecimalPlaces(), maximumFractionDigits: getAmountDecimalPlaces() })}</span>
                        </div>
                        
                        <div className={styles.costCalcProfitRow}>
                            <div>
                                profit :
                                <div className={styles.profitFormula}>
                                    (Sale Amount - Total Cost - Tax Payable + TDS Receivable)
                                </div>
                            </div>
                            <span style={{ color: profit >= 0 ? '#10b981' : '#ef4444', fontSize: '15px' }}>
                                {profit >= 0 ? '+' : '-'}{currencySymbol} {Math.abs(profit).toLocaleString(undefined, { minimumFractionDigits: getAmountDecimalPlaces(), maximumFractionDigits: getAmountDecimalPlaces() })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CostCalculationPopup;
