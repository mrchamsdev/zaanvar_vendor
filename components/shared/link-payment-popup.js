import React, { useState, useEffect } from "react";
import styles from "../../styles/purchase-bill/add-payment-out.module.css";
import { FiX } from "react-icons/fi";
import { WebApimanager } from "../utilities/WebApiManager";
import useStore from "../state/useStore";
import useDashboardData from "../dashboard/useDashboardData";

const LinkPaymentPopup = ({ isOpen, onClose, onDone, type, partyId, partyName, totalPaidAmount, initialLinkedTxns = [] }) => {
    const { jwtToken } = useStore();
    const { branchId } = useDashboardData({ skipReviews: true });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selections, setSelections] = useState({});
    const [popupPaidAmount, setPopupPaidAmount] = useState("");

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

    if (!isOpen) return null;

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
                return {
                    ...t,
                    linkedAmount: selections[id].amount
                };
            });
        onDone(selected, popupPaidAmount);
    };

    const totalAssigned = Object.values(selections).reduce((sum, s) => sum + Number(s.amount || 0), 0);
    const unusedAmount = Number(popupPaidAmount || 0) - totalAssigned;

    return (
        <div className={styles.overlay} style={{ zIndex: 2001, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className={styles.modal} style={{ minHeight: 'auto', maxHeight: '90vh', borderRadius: '8px', margin: 'auto', width: '80%', maxWidth: '800px', display: 'flex', flexDirection: 'column' }}>
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
                            <button onClick={() => setSelections({})} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Reset ↺
                            </button>
                        </div>
                    </div>
                    
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <th style={{ padding: '12px 8px', color: '#666', fontWeight: 500 }}>Date</th>
                                    <th style={{ padding: '12px 8px', color: '#666', fontWeight: 500 }}>Type</th>
                                    <th style={{ padding: '12px 8px', color: '#666', fontWeight: 500 }}>Total</th>
                                    <th style={{ padding: '12px 8px', color: '#666', fontWeight: 500 }}>Balance</th>
                                    <th style={{ padding: '12px 8px', color: '#666', fontWeight: 500 }}>Linked Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center' }}>Loading...</td></tr>
                                ) : transactions.length === 0 ? (
                                    <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center' }}>No transactions found</td></tr>
                                ) : (
                                    transactions.map(t => {
                                        const id = (t.id || t.userOrderId || t.productsBillId).toString();
                                        const isSelected = !!selections[id];
                                        const bal = Number(t.balanceAmount || t.totalBalanceAmount || t.dueAmount || 0);
                                        const assignedAmount = isSelected ? Number(selections[id].amount || 0) : 0;
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
                                                <td style={{ padding: '12px 8px' }}>{Number(t.totalAmount || t.overallBillAmount || 0).toFixed(2)}</td>
                                                <td style={{ padding: '12px 8px' }}>{displayBalance.toFixed(2)}</td>
                                                <td style={{ padding: '12px 8px' }}>
                                                    {isSelected ? (
                                                        <input 
                                                            type="number"
                                                            value={selections[id].amount}
                                                            onChange={(e) => handleAmountChange(id, e.target.value)}
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
