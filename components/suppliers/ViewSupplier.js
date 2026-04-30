import React, { useState, useEffect } from "react";
import styles from "../../styles/purchase-bill/purchase-out.module.css";
import { FiX } from "react-icons/fi";
import { purchaseService } from "../../services/purchaseService";
import useStore from "../state/useStore";
import { toast } from "sonner";

const ViewSupplier = ({ isOpen, onClose, supplierId }) => {
    const { jwtToken } = useStore();
    const [loading, setLoading] = useState(false);
    const [supplier, setSupplier] = useState(null);
    const [activeTab, setActiveTab] = useState("Purchase Orders");
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        if (isOpen && supplierId) {
            fetchData();
        }
    }, [isOpen, supplierId]);

    const fetchData = async () => {
        setLoading(true);
        console.log("Fetching supplier data for ID:", supplierId);
        try {
            const [sRes, tRes] = await Promise.all([
                purchaseService.getSupplierById(jwtToken, supplierId),
                purchaseService.getSupplierTransactions(jwtToken, supplierId)
            ]);

            console.log("Supplier Response:", sRes);
            console.log("Transactions Response:", tRes);

            if (sRes && (sRes.status === "success" || sRes.status === 200 || sRes.data?.status === "success")) {
                setSupplier(sRes.data || sRes);
            }
            if (tRes && (tRes.status === "success" || tRes.status === 200 || tRes.data?.status === "success")) {
                setTransactions(tRes.data || tRes.results || []);
            }
        } catch (e) {
            console.error("Fetch Data Error:", e);
            toast.error("Failed to fetch supplier details");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const renderPurchaseOrders = () => (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', border: '1px solid #eee', overflow: 'hidden' }}>
            <thead style={{ background: '#F5F5F5' }}>
                <tr>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '11px', color: '#888', fontWeight: '600' }}>ORDER PLACED DATE</th>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '11px', color: '#888', fontWeight: '600' }}>ORDER NO</th>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '11px', color: '#888', fontWeight: '600' }}>TO</th>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '11px', color: '#888', fontWeight: '600' }}>Total Value (₹)</th>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '11px', color: '#888', fontWeight: '600' }}>Order Received date</th>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '11px', color: '#888', fontWeight: '600' }}>Invoice</th>
                </tr>
            </thead>
            <tbody>
                {transactions.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No data available</td></tr>
                ) : (
                    transactions.map((t, idx) => (
                        <tr key={idx} style={{ borderTop: '1px solid #eee' }}>
                            <td style={{ padding: '14px', fontSize: '13px' }}>
                                {new Date(t.createdDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                            </td>
                            <td style={{ padding: '14px', fontSize: '13px', fontWeight: '600' }}>PO-{String(t.productsBillId || t.requestId || idx).padStart(5, '0')}</td>
                            <td style={{ padding: '14px', fontSize: '13px' }}>{t.branchName || "Main Branch"}</td>
                            <td style={{ padding: '14px', fontSize: '13px' }}>{t.totalAmount || "--"}</td>
                            <td style={{ padding: '14px', fontSize: '13px' }}>
                                <div style={{ 
                                    color: t.status === 'Received' ? '#27AE60' : '#F5790C', 
                                    fontWeight: '600',
                                    fontSize: '12px'
                                }}>
                                    {t.status || "Order Placed"}
                                </div>
                                <div style={{ fontSize: '11px', color: '#888' }}>
                                    {new Date(t.createdDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                                </div>
                            </td>
                            <td style={{ padding: '14px', fontSize: '13px' }}>
                                <span style={{ 
                                    color: t.paymentStatus === 'Full' || t.paymentStatus === 'Paid' ? '#27AE60' : t.paymentStatus === 'Partial' ? '#F5790C' : '#E9315D',
                                    fontWeight: '600'
                                }}>
                                    {t.paymentStatus || "pending"}
                                </span>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    );

    const renderPaymentHistory = () => (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', border: '1px solid #eee', overflow: 'hidden' }}>
            <thead style={{ background: '#F5F5F5' }}>
                <tr>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '11px', color: '#888', fontWeight: '600' }}>Order Number</th>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '11px', color: '#888', fontWeight: '600' }}>Payment Date</th>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '11px', color: '#888', fontWeight: '600' }}>Total amount</th>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '11px', color: '#888', fontWeight: '600' }}>Previous Paid amount</th>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '11px', color: '#888', fontWeight: '600' }}>Paid amount</th>
                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '11px', color: '#888', fontWeight: '600' }}>Balance amount</th>
                </tr>
            </thead>
            <tbody>
                {transactions.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No data available</td></tr>
                ) : (
                    transactions.map((t, idx) => (
                        <tr key={idx} style={{ borderTop: '1px solid #eee' }}>
                            <td style={{ padding: '14px', fontSize: '13px' }}>{String(t.productsBillId || t.requestId || idx).padStart(7, '0')}</td>
                            <td style={{ padding: '14px', fontSize: '13px' }}>
                                {new Date(t.modifiedDate || t.createdDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                            </td>
                            <td style={{ padding: '14px', fontSize: '13px' }}>₹ {t.totalAmount || "0000000"}</td>
                            <td style={{ padding: '14px', fontSize: '13px' }}>₹ {t.amountPaidToSupplier || "0000000"}</td>
                            <td style={{ padding: '14px', fontSize: '13px' }}>₹ {t.amountPaidToSupplier || "0000000"}</td>
                            <td style={{ padding: '14px', fontSize: '13px' }}>₹ {t.balanceAmount || "0000000"}</td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    );

    return (
        <div className={styles.overlay}>
            <div className={styles.modal} style={{ width: '95vw', maxWidth: '1400px', height: '95vh', borderRadius: '16px' }}>
                <div className={styles.modalHeader}>
                    <h3>View Supplier details</h3>
                    <button className={styles.closeBtn} onClick={onClose}><FiX /></button>
                </div>

                <div className={styles.modalContent} style={{ padding: '30px', overflowY: 'auto', background: '#F9F9F9' }}>
                    {loading ? (
                        <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                                <div style={{ flex: 1, background: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #eee', position: 'relative' }}>
                                    <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', textTransform: 'uppercase' }}>{supplier?.supplierName || "NAVYA"}</h2>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                                        <div>
                                            <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{supplier?.locality || "Rohtak"}</p>
                                            <p style={{ color: '#888', fontSize: '11px' }}>Branch Assigned</p>
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{supplier?.phone || "--"}</p>
                                            <p style={{ color: '#888', fontSize: '11px' }}>phone Number</p>
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{supplier?.email || "--"}</p>
                                            <p style={{ color: '#888', fontSize: '11px' }}>Email</p>
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{supplier?.city || "--"}</p>
                                            <p style={{ color: '#888', fontSize: '11px' }}>City</p>
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{supplier?.country || "India"}</p>
                                            <p style={{ color: '#888', fontSize: '11px' }}>Country</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div style={{ width: '300px', background: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #eee' }}>
                                    <h4 style={{ marginBottom: '20px', fontSize: '14px', fontWeight: '600' }}>Statistics</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <p style={{ fontWeight: '600', fontSize: '15px' }}>50</p>
                                            <p style={{ color: '#888', fontSize: '11px' }}>Total oreder Volume</p>
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: '600', fontSize: '15px' }}>₹ 7499.00</p>
                                            <p style={{ color: '#888', fontSize: '11px' }}>Total order value</p>
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: '600', fontSize: '15px' }}>₹ 0</p>
                                            <p style={{ color: '#888', fontSize: '11px' }}>Payment Due</p>
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: '600', fontSize: '15px' }}>₹ 450</p>
                                            <p style={{ color: '#888', fontSize: '11px' }}>Credit Balance</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'inline-flex', background: '#F1F1F1', padding: '4px', borderRadius: '8px', marginBottom: '24px' }}>
                                {["Purchase Orders", "Payment History"].map(tab => (
                                    <button 
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        style={{
                                            padding: '8px 24px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            background: activeTab === tab ? '#fff' : 'transparent',
                                            color: activeTab === tab ? '#E9315D' : '#666',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            boxShadow: activeTab === tab ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                                        }}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #eee' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{activeTab}</h3>
                                    <button style={{ 
                                        color: '#E9315D', 
                                        border: '1px solid #E9315D', 
                                        background: '#fff', 
                                        padding: '8px 20px', 
                                        borderRadius: '8px', 
                                        fontSize: '13px', 
                                        fontWeight: '700',
                                        cursor: 'pointer'
                                    }}>
                                        PAY NOW
                                    </button>
                                </div>

                                {activeTab === "Purchase Orders" ? renderPurchaseOrders() : renderPaymentHistory()}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewSupplier;
