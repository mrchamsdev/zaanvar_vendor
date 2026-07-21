import React, { useState, useEffect } from "react";
import styles from "../../styles/purchase-bill/add-payment-out.module.css";
import { FiX } from "react-icons/fi";
import { WebApimanager } from "../utilities/WebApiManager";
import useStore from "../state/useStore";
import useDashboardData from "../dashboard/useDashboardData";
import { getBoolSetting } from "@/utilities/settings-utils";

const calculateDiscountForTxn = (t, assignedAmount, discountObj) => {
    let discountApplied = 0;
    if (!discountObj || assignedAmount <= 0) return 0;
    
    if (discountObj.discountType === "Bill Amount Based") {
        const minOrderVal = Number(discountObj.minimumOrderValue || 0);
        if (assignedAmount >= minOrderVal && minOrderVal > 0) {
            if (discountObj.discountValueType === "Percentage (%)") {
                discountApplied = assignedAmount * (Number(discountObj.discountValue || 0) / 100);
            } else {
                discountApplied = Number(discountObj.discountValue || 0);
            }
        }
    } else if (discountObj.discountType === "Time Based") {
        const minDays = Number(discountObj.minimumPaymentDays || 0);
        const refDateStr = t.modifiedDate || t.orderDate || t.receivedDate || t.createdAt || t.createdDate || t.billDate || t.invoiceDate;
        if (refDateStr && minDays > 0) {
            const refDate = new Date(refDateStr);
            refDate.setHours(0, 0, 0, 0);
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);
            const diffTime = todayDate.getTime() - refDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= minDays) {
                if (discountObj.discountValueType === "Percentage (%)") {
                    discountApplied = assignedAmount * (Number(discountObj.discountValue || 0) / 100);
                } else {
                    discountApplied = Number(discountObj.discountValue || 0);
                }
            }
        }
    }
    return discountApplied;
};

const LinkPaymentPopup = ({ isOpen, onClose, onDone, type, partyId, partyName, totalPaidAmount, initialLinkedTxns = [] }) => {
    const { jwtToken, vendorSettings } = useStore();
    const enableDiscountDuringPayments = getBoolSetting(vendorSettings, 'enableDiscountDuringPayments', true);
    const { branchId } = useDashboardData({ skipReviews: true });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selections, setSelections] = useState({});
    const [popupPaidAmount, setPopupPaidAmount] = useState("");
    const [applyDiscount, setApplyDiscount] = useState(false);

    useEffect(() => {
        setPopupPaidAmount(totalPaidAmount || "");
    }, [totalPaidAmount, isOpen]);

    useEffect(() => {
        if (!isOpen || !partyId) return;
        
        const fetchTxns = async () => {
            setLoading(true);
            try {
                const webApi = new WebApimanager(jwtToken);
                let res;
                if (type === "paymentIn") {
                    res = await webApi.get(`vendor/user-orders/branch/${branchId}?vendorCustomerId=${partyId}`);
                } else {
                    res = await webApi.get(`vendor/bills?branchId=${branchId}&supplierId=${partyId}`);
                }
                
                let data = [];
                if (res?.data?.data) {
                    data = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
                } else if (res?.data) {
                    data = Array.isArray(res.data) ? res.data : [res.data];
                }
                
                const filteredData = data.filter(t => Number(t.balanceAmount || t.totalBalanceAmount || t.dueAmount || 0) > 0);
                
                setTransactions(filteredData);
                
                // Initialize selections from initialLinkedTxns
                const initialSels = {};
                if (initialLinkedTxns && initialLinkedTxns.length > 0) {
                    initialLinkedTxns.forEach(t => {
                        const id = (t.id || t.userOrderId || t.productsBillId).toString();
                        initialSels[id] = { amount: t.linkedAmount };
                    });
                }
                setSelections(initialSels);
            } catch (err) {
                console.error("Error fetching link txns:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTxns();
    }, [isOpen, partyId, type, branchId, jwtToken]);



    const handleCheckbox = (id) => {
        setSelections(prev => {
            const next = { ...prev };
            if (next[id]) {
                delete next[id];
            } else {
                const currentAssigned = Object.values(next).reduce((sum, s) => sum + Number(s.amount || 0), 0);
                const currentUnused = Number(popupPaidAmount || 0) - currentAssigned;
                
                const t = transactions.find(tx => (tx.id || tx.userOrderId || tx.productsBillId).toString() === id);
                const bal = Number(t?.balanceAmount || t?.totalBalanceAmount || t?.dueAmount || 0);
                
                let toAssign = 0;
                if (currentUnused > 0) {
                    toAssign = Math.min(currentUnused, bal);
                }
                
                next[id] = { amount: toAssign > 0 ? toAssign.toString() : "" };
            }
            return next;
        });
    };

    const handleAmountChange = (id, val) => {
        setSelections(prev => ({
            ...prev,
            [id]: { ...prev[id], amount: val }
        }));
    };

    const handleDone = () => {
        // Return selected ones with amount > 0
        const selected = Object.keys(selections)
            .filter(id => Number(selections[id].amount) > 0)
            .map(id => {
                const t = transactions.find(tx => (tx.id || tx.userOrderId || tx.productsBillId).toString() === id);
                // Calculate discount
                const discountObj = t.vendor?.discount || t.discount || null;
                const assignedAmount = Number(selections[id].amount || 0);
                const discountApplied = calculateDiscountForTxn(t, assignedAmount, discountObj);

                return {
                    ...t,
                    linkedAmount: selections[id].amount,
                    discountApplied: discountApplied
                };
            });
        onDone(selected, popupPaidAmount);
    };

    // Calculate total discount available
    let totalEligibleBalance = 0;
    let totalDiscountIfFullyPaid = 0;
    let discountObjFound = null;

    if (enableDiscountDuringPayments && type !== "paymentIn") {
        transactions.forEach(t => {
            const bal = Number(t.balanceAmount || t.totalBalanceAmount || t.dueAmount || 0);
            const discountObj = t.vendor?.discount || t.discount || null;
            const possibleDiscount = calculateDiscountForTxn(t, bal, discountObj);
            
            if (possibleDiscount > 0) {
                discountObjFound = discountObj;
                totalEligibleBalance += bal;
                totalDiscountIfFullyPaid += possibleDiscount;
            }
        });
    }

    const isEligible = totalEligibleBalance > 0;

    useEffect(() => {
        if (applyDiscount && isEligible) {
            const newSelections = { ...selections };
            let netPayable = 0;
            transactions.forEach(t => {
                const id = (t.id || t.userOrderId || t.productsBillId).toString();
                const bal = Number(t.balanceAmount || t.totalBalanceAmount || t.dueAmount || 0);
                const discountObj = t.vendor?.discount || t.discount || null;
                const appliedDiscount = calculateDiscountForTxn(t, bal, discountObj);
                if (appliedDiscount > 0) {
                    newSelections[id] = { amount: bal.toString() };
                    netPayable += (bal - appliedDiscount);
                }
            });
            setSelections(newSelections);
            setPopupPaidAmount(netPayable.toFixed(2));
        }
    }, [applyDiscount, isEligible]);

    const totalAssigned = Object.keys(selections).reduce((sum, id) => {
        const assignedAmount = Number(selections[id].amount || 0);
        const t = transactions.find(tx => (tx.id || tx.userOrderId || tx.productsBillId).toString() === id);
        let discountApplied = 0;
        const discountObj = t?.vendor?.discount || t?.discount || null;
        discountApplied = calculateDiscountForTxn(t, assignedAmount, discountObj);
        return sum + (assignedAmount - discountApplied);
    }, 0);
    const unusedAmount = Number(popupPaidAmount || 0) - totalAssigned;

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} style={{ zIndex: 2001, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className={styles.modal} style={{ minHeight: 'auto', maxHeight: '90vh', borderRadius: '8px', margin: 'auto', width: '90%', maxWidth: '1000px', display: 'flex', flexDirection: 'column' }}>
                <div className={styles.modalHeader}>
                    <h3>Link payment to Txns</h3>
                    <button className={styles.closeBtn} onClick={onClose}><FiX /></button>
                </div>
                
                <div className={styles.modalContent} style={{ padding: '24px 40px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 600 }}>Party :</label>
                            <input type="text" className={styles.input} value={partyName || ""} readOnly style={{ width: '200px', display: 'block', marginTop: '8px', background: '#f5f5f5' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: 600 }}>{type === 'paymentIn' ? 'Received Amount' : 'Paid Amount'}</label>
                            <input 
                                type="number" 
                                className={styles.input} 
                                value={popupPaidAmount} 
                                onChange={(e) => setPopupPaidAmount(e.target.value)}
                                style={{ width: '200px', display: 'block', marginTop: '8px' }} 
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <button onClick={() => {
                                setSelections({});
                                setApplyDiscount(false);
                            }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Reset ↺
                            </button>
                        </div>
                    </div>
                    
                    {isEligible && (
                        <div style={{ backgroundColor: '#fdf2f5', border: '1px solid #fbcfe0', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <div style={{ flex: 1, fontSize: '13px', color: '#E9315D', lineHeight: '1.5' }}>
                                <strong>Note:</strong> You are eligible for a {discountObjFound.discountValue}{discountObjFound.discountValueType === "Percentage (%)" ? "%" : "₹"} discount! If you pay the full remaining balances on eligible bills, you will get ₹{totalDiscountIfFullyPaid.toFixed(2)} off.
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                <input 
                                    type="checkbox" 
                                    id="applyDiscountLinked" 
                                    checked={applyDiscount} 
                                    onChange={(e) => setApplyDiscount(e.target.checked)} 
                                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#E9315D' }}
                                />
                                <label htmlFor="applyDiscountLinked" style={{ fontSize: '13px', fontWeight: 600, color: '#E9315D', cursor: 'pointer', whiteSpace: 'nowrap' }}>Apply Discount</label>
                            </div>
                        </div>
                    )}

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <th style={{ padding: '12px 8px', color: '#666', fontWeight: 500 }}>Date</th>
                                    <th style={{ padding: '12px 8px', color: '#666', fontWeight: 500 }}>Type</th>
                                    <th style={{ padding: '12px 8px', color: '#666', fontWeight: 500 }}>Total</th>
                                    <th style={{ padding: '12px 8px', color: '#666', fontWeight: 500 }}>Balance</th>
                                    <th style={{ padding: '12px 8px', color: '#666', fontWeight: 500 }}>Discount Applied</th>
                                    <th style={{ padding: '12px 8px', color: '#666', fontWeight: 500 }}>Linked Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center' }}>Loading...</td></tr>
                                ) : transactions.length === 0 ? (
                                    <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center' }}>No transactions found</td></tr>
                                ) : (
                                    transactions.map(t => {
                                        const id = (t.id || t.userOrderId || t.productsBillId).toString();
                                        const isSelected = !!selections[id];
                                        const bal = Number(t.balanceAmount || t.totalBalanceAmount || t.dueAmount || 0);
                                        const assignedAmount = isSelected ? Number(selections[id].amount || 0) : 0;
                                        const billTotal = Number(t.totalAmount || t.overallBillAmount || 0);
                                        
                                        const discountObj = t.vendor?.discount || t.discount || null;
                                        const discountApplied = calculateDiscountForTxn(t, assignedAmount, discountObj);

                                        const displayBalance = bal - assignedAmount;
                                        
                                        return (
                                            <tr key={id} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '12px 8px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={isSelected}
                                                            onChange={() => handleCheckbox(id)}
                                                            style={{ width: '16px', height: '16px', accentColor: '#000', cursor: 'pointer' }}
                                                        />
                                                        {t.orderDate || t.billDate || t.invoiceDate || t.createdAt || t.createdDate ? new Date(t.orderDate || t.billDate || t.invoiceDate || t.createdAt || t.createdDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 8px' }}>Sale</td>
                                                <td style={{ padding: '12px 8px' }}>{billTotal.toFixed(2)}</td>
                                                <td style={{ padding: '12px 8px' }}>{displayBalance.toFixed(2)}</td>
                                                <td style={{ padding: '12px 8px', color: discountApplied > 0 ? '#10B981' : 'inherit' }}>
                                                    {discountApplied > 0 ? discountApplied.toFixed(2) : "-"}
                                                </td>
                                                <td style={{ padding: '12px 8px' }}>
                                                    {isSelected ? (
                                                        <input 
                                                            type="number"
                                                            value={selections[id].amount ? (Number(selections[id].amount) - discountApplied).toFixed(2).replace(/\.00$/, '') : ""}
                                                            onChange={(e) => {
                                                                const net = Number(e.target.value);
                                                                let gross = net;
                                                                if (discountObj) {
                                                                    if (discountObj.discountValueType === "Percentage (%)") {
                                                                        const pct = Number(discountObj.discountValue || 0) / 100;
                                                                        if (pct > 0 && pct < 1) {
                                                                            gross = net / (1 - pct);
                                                                        }
                                                                    } else {
                                                                        gross = net + Number(discountObj.discountValue || 0);
                                                                    }
                                                                }
                                                                handleAmountChange(id, e.target.value === "" ? "" : gross.toString());
                                                            }}
                                                            style={{ padding: '4px 8px', width: '100px', border: '1px solid #ccc', borderRadius: '4px' }}
                                                            placeholder="0"
                                                        />
                                                    ) : null}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={styles.modalFooter} style={{ padding: '16px 40px', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 600 }}>Unused Amount : {unusedAmount.toFixed(2)}</div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
                        <button className={styles.saveBtn} onClick={handleDone}>Done</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LinkPaymentPopup;
