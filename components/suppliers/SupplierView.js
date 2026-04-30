import React, { useState, useEffect } from "react";
import styles from "../../styles/purchase-bill/purchase-out.module.css";
import { purchaseService } from "../../services/purchaseService";
import useStore from "../state/useStore";
import { toast } from "sonner";

const SupplierView = ({ data, onBack, isSplit }) => {
    const { jwtToken } = useStore();
    const [loading, setLoading] = useState(false);
    const [supplier, setSupplier] = useState(data);
    const [activeTab, setActiveTab] = useState("Purchase Orders");
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [paymentHistory, setPaymentHistory] = useState([]);

    const supplierId = data?.supplierId;

    useEffect(() => {
        if (supplierId) {
            fetchData();
        }
    }, [supplierId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const sRes = await purchaseService.getSupplierById(jwtToken, supplierId);

            if (sRes && (sRes.status === "success" || sRes.status === 200 || sRes.data?.status === "success")) {
                const supplierData = sRes.data || sRes;
                setSupplier(supplierData);
                setPurchaseOrders(supplierData.purchaseOrders || []);
                setPaymentHistory(supplierData.paymentHistory || []);
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to fetch supplier details");
        } finally {
            setLoading(false);
        }
    };

    const renderPurchaseOrders = () => (
        <div style={{ overflowX: 'auto' }}>
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
                    {purchaseOrders.length === 0 ? (
                        <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No data available</td></tr>
                    ) : (
                        purchaseOrders.map((t, idx) => (
                            <tr key={idx} style={{ borderTop: '1px solid #eee' }}>
                                <td style={{ padding: '14px', fontSize: '13px' }}>
                                    {new Date(t.createdDate || t.orderDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                                </td>
                                <td style={{ padding: '14px', fontSize: '13px', fontWeight: '600' }}>PO-{String(t.productsPurchaseRqstID || idx).padStart(5, '0')}</td>
                                <td style={{ padding: '14px', fontSize: '13px' }}>{t.branchname || "Main Branch"}</td>
                                <td style={{ padding: '14px', fontSize: '13px' }}>{t.totalvalue || "0.00"}</td>
                                <td style={{ padding: '14px', fontSize: '13px' }}>
                                    <div style={{ color: t.orderStatus === 'received' ? '#27AE60' : '#F5790C', fontWeight: '600', fontSize: '12px' }}>{t.orderStatus || "Order Placed"}</div>
                                    <div style={{ fontSize: '11px', color: '#888' }}>{t.orderrecivedDate ? new Date(t.orderrecivedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : "--"}</div>
                                </td>
                                <td style={{ padding: '14px', fontSize: '13px' }}>
                                    <span style={{ color: t.paymentStatus === 'Full' || t.paymentStatus === 'Paid' ? '#27AE60' : t.paymentStatus === 'Partial' ? '#F5790C' : '#E9315D', fontWeight: '600' }}>
                                        {t.paymentStatus === 'Full' ? 'Paid' : (t.paymentStatus || "pending")}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderPaymentHistory = () => (
        <div style={{ overflowX: 'auto' }}>
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
                    {paymentHistory.length === 0 ? (
                        <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No data available</td></tr>
                    ) : (
                        paymentHistory.map((t, idx) => (
                            <tr key={idx} style={{ borderTop: '1px solid #eee' }}>
                                <td style={{ padding: '14px', fontSize: '13px' }}>{String(t.productsBillId || t.returnProductsId || idx).padStart(7, '0')}</td>
                                <td style={{ padding: '14px', fontSize: '13px' }}>
                                    {new Date(t.modifiedDate || t.createdDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                                </td>
                                <td style={{ padding: '14px', fontSize: '13px' }}>₹ {t.amount || t.totalAmount || "0000000"}</td>
                                <td style={{ padding: '14px', fontSize: '13px' }}>₹ {t["previouspaid amount"] || "0000000"}</td>
                                <td style={{ padding: '14px', fontSize: '13px' }}>₹ {t["paid amount"] || t.received || "0000000"}</td>
                                <td style={{ padding: '14px', fontSize: '13px' }}>₹ {t["balance amount"] || t.balance || "0000000"}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div style={{ width: '100%', background: '#fff', padding: isSplit ? '10px' : '20px', borderRadius: '16px' }}>
            {loading ? (
                <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
            ) : (
                <>
                    <div style={{ background: '#fff', padding: '32px', borderRadius: '12px', border: '1px solid #F0F0F0', marginBottom: '32px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                        {/* Left Section: Info */}
                        <div style={{ flex: 1 }}>
                            <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '32px', color: '#000', letterSpacing: '0.5px' }}>{supplier?.supplierName || "NAVYA"}</h2>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px 16px' }}>
                                <div>
                                    <p style={{ fontWeight: '500', fontSize: '13px', marginBottom: '6px', color: '#000' }}>
                                        {supplier?.branches?.map(b => b.name).join(", ") || "Rohtak"}
                                    </p>
                                    <p style={{ color: '#888', fontSize: '11px', fontWeight: '400' }}>Branch Assigned</p>
                                </div>
                                <div>
                                    <p style={{ fontWeight: '500', fontSize: '13px', marginBottom: '6px', color: '#000' }}>{supplier?.phone || "--"}</p>
                                    <p style={{ color: '#888', fontSize: '11px', fontWeight: '400' }}>phone Number</p>
                                </div>
                                <div>
                                    <p style={{ fontWeight: '500', fontSize: '13px', marginBottom: '6px', color: '#000' }}>{supplier?.email || "--"}</p>
                                    <p style={{ color: '#888', fontSize: '11px', fontWeight: '400' }}>Email</p>
                                </div>
                                <div>
                                    <p style={{ fontWeight: '500', fontSize: '13px', marginBottom: '6px', color: '#000' }}>{supplier?.city || "--"}</p>
                                    <p style={{ color: '#888', fontSize: '11px', fontWeight: '400' }}>City</p>
                                </div>
                                <div>
                                    <p style={{ fontWeight: '500', fontSize: '13px', marginBottom: '6px', color: '#000' }}>{supplier?.country || "India"}</p>
                                    <p style={{ color: '#888', fontSize: '11px', fontWeight: '400' }}>Country</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Right Section: Statistics Card */}
                        <div style={{ width: isSplit ? '100%' : '320px', background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #F0F0F0' }}>
                            <h4 style={{ marginBottom: '24px', fontSize: '14px', fontWeight: '700', color: '#000' }}>Statistics</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 16px' }}>
                                <div>
                                    <p style={{ fontWeight: '500', fontSize: '14px', marginBottom: '6px', color: '#000' }}>50</p>
                                    <p style={{ color: '#888', fontSize: '10px', fontWeight: '400' }}>Total oreder Volume</p>
                                </div>
                                <div>
                                    <p style={{ fontWeight: '500', fontSize: '14px', marginBottom: '6px', color: '#000' }}>₹ 7499.00</p>
                                    <p style={{ color: '#888', fontSize: '10px', fontWeight: '400' }}>Total order value</p>
                                </div>
                                <div>
                                    <p style={{ fontWeight: '500', fontSize: '14px', marginBottom: '6px', color: '#000' }}>₹ 0</p>
                                    <p style={{ color: '#888', fontSize: '10px', fontWeight: '400' }}>Payment Due</p>
                                </div>
                                <div>
                                    <p style={{ fontWeight: '500', fontSize: '14px', marginBottom: '6px', color: '#000' }}>₹ 450</p>
                                    <p style={{ color: '#888', fontSize: '10px', fontWeight: '400' }}>Credit Balance</p>
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
                                    padding: '8px 20px',
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

                    <div style={{ background: '#fff', padding: isSplit ? '15px' : '30px', borderRadius: '12px', border: '1px solid #eee' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{activeTab}</h3>
                            <button style={{ color: '#E9315D', border: '1px solid #E9315D', background: '#fff', padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                                PAY NOW
                            </button>
                        </div>
                        {activeTab === "Purchase Orders" ? renderPurchaseOrders() : renderPaymentHistory()}
                    </div>
                </>
            )}
        </div>
    );
};

export default SupplierView;
