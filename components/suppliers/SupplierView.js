import React, { useState, useEffect } from "react";
import styles from "../../styles/suppliers/SupplierView.module.css";
import { purchaseService } from "../../services/purchaseService";
import useStore from "../state/useStore";
import { toast } from "sonner";
import PayNowModal from "../purchase-bill/PayNowModal";
import PurchaseOrderManager from "../purchase-bill/purchase-order-manager";

const SupplierView = ({ data, onBack, isSplit }) => {
    const { jwtToken } = useStore();
    const [loading, setLoading] = useState(false);
    const [supplier, setSupplier] = useState(data);
    const [activeTab, setActiveTab] = useState("Purchase Orders");
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [isPayNowModalOpen, setIsPayNowModalOpen] = useState(false);
    const [selectedBillIdForPayment, setSelectedBillIdForPayment] = useState(null);
    const [selectedBillData, setSelectedBillData] = useState(null);
    const [managerConfig, setManagerConfig] = useState(null); // { mode, id, initialData }

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
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead className={styles.thead}>
                    <tr>
                        <th className={styles.th}>ORDER PLACED DATE</th>
                        <th className={styles.th}>ORDER NO</th>
                        <th className={styles.th}>TO</th>
                        <th className={styles.th}>Total Value (₹)</th>
                        <th className={styles.th}>Order Received date</th>
                        <th className={styles.th}>Invoice</th>
                    </tr>
                </thead>
                <tbody>
                    {purchaseOrders.length === 0 ? (
                        <tr><td colSpan="6" className={styles.noData}>No data available</td></tr>
                    ) : (
                        purchaseOrders.map((t, idx) => (
                            <tr
                                key={idx}
                                className={styles.trClickable}
                                onClick={() => setManagerConfig({ mode: "View", id: t.productsPurchaseRqstID })}
                            >
                                <td className={styles.td}>
                                    {(() => {
                                        const dateToShow = t.orderStatus === 'cancelled' ? (t.modifiedDate || t.createdDate) : (t.createdDate || t.orderDate);
                                        return dateToShow ? new Date(dateToShow).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : "--";
                                    })()}
                                </td>
                                <td className={`${styles.td} ${styles.tdBold}`}>PO-{String(t.productsPurchaseRqstID || idx).padStart(5, '0')}</td>
                                <td className={styles.td}>{t.branchname || "Main Branch"}</td>
                                <td className={styles.td}>{t.totalvalue || "0.00"}</td>
                                <td className={styles.td}>
                                    <div className={`${styles.statusText} ${t.orderStatus === 'received' ? styles.statusGreen : styles.statusOrange}`}>{t.orderStatus || "Order Placed"}</div>
                                    <div className={styles.subText}>
                                        {(() => {
                                            const dateValue = t.orderStatus === 'received' ? t.orderrecivedDate : (t.orderStatus === 'cancelled' ? (t.modifiedDate || t.createdDate) : (t.createdDate || t.orderDate));
                                            return dateValue ? new Date(dateValue).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : "--";
                                        })()}
                                    </div>
                                </td>
                                <td className={styles.td}>
                                    <span className={`${styles.statusText} ${t.orderStatus === 'received' ? (t.paymentStatus === 'Full' || t.paymentStatus === 'Paid' ? styles.statusGreen : t.paymentStatus === 'Partial' ? styles.statusOrange : styles.statusRed) : styles.statusGrey}`}>
                                        {t.orderStatus === 'received' ? (t.paymentStatus === 'Full' ? 'Paid' : (t.paymentStatus || "pending")) : "-"}
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
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead className={styles.thead}>
                    <tr>
                        <th className={styles.th}>Order Number</th>
                        <th className={styles.th}>Payment Date</th>
                        <th className={styles.th}>Total amount</th>
                        <th className={styles.th}>Previous Paid amount</th>
                        <th className={styles.th}>Paid amount</th>
                        <th className={styles.th}>Balance amount</th>
                    </tr>
                </thead>
                <tbody>
                    {paymentHistory.length === 0 ? (
                        <tr><td colSpan="6" className={styles.noData}>No data available</td></tr>
                    ) : (
                        paymentHistory.map((t, idx) => (
                            <tr key={idx} className={styles.trHistory}>
                                <td className={styles.td}>{String(t.productsBillId || t.returnProductsId || idx).padStart(7, '0')}</td>
                                <td className={styles.td}>
                                    {new Date(t.modifiedDate || t.createdDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                                </td>
                                <td className={styles.td}>₹ {t.relatedBill?.totalAmount || t.amount || t.totalAmount || t.totalBillAmount || "0.00"}</td>
                                <td className={styles.td}>₹ {t["previouspaid amount"] || "0.00"}</td>
                                <td className={styles.td}>₹ {t["paid amount"] || t.received || t.amount || "0.00"}</td>
                                <td className={styles.td}>₹ {t["balance amount"] || t.balance || t.totalBalanceAmount || "0.00"}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className={`${styles.container} ${isSplit ? styles.containerSplit : ""}`}>
            {loading ? (
                <div className={styles.loading}>Loading...</div>
            ) : (
                <>
                    <div className={styles.topCard}>
                        {/* Left Section: Info */}
                        <div className={styles.infoSection}>
                            <h2 className={styles.supplierName}>{supplier?.supplierName || "NAVYA"}</h2>

                            <div className={styles.infoGrid}>
                                <div>
                                    <p className={styles.infoValue}>
                                        {supplier?.branches?.map(b => b.name).join(", ") || "Rohtak"}
                                    </p>
                                    <p className={styles.infoLabel}>Branch Assigned</p>
                                </div>
                                <div>
                                    <p className={styles.infoValue}>{supplier?.phone || "--"}</p>
                                    <p className={styles.infoLabel}>phone Number</p>
                                </div>
                                <div>
                                    <p className={styles.infoValue}>{supplier?.email || "--"}</p>
                                    <p className={styles.infoLabel}>Email</p>
                                </div>
                                <div>
                                    <p className={styles.infoValue}>{supplier?.city || "--"}</p>
                                    <p className={styles.infoLabel}>City</p>
                                </div>
                                <div>
                                    <p className={styles.infoValue}>{supplier?.country || "India"}</p>
                                    <p className={styles.infoLabel}>Country</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Section: Statistics Card */}
                        <div className={`${styles.statsCard} ${isSplit ? styles.statsCardSplit : ""}`}>
                            <h4 className={styles.statsTitle}>Statistics</h4>
                            <div className={styles.statsGrid}>
                                <div>
                                    <p className={styles.infoValue}>{supplier?.purchaseOrders?.length || 0}</p>
                                    <p className={styles.infoLabel}>Total order </p>
                                </div>
                                <div>
                                    <p className={styles.infoValue}>₹ {supplier?.totals?.[0]?.totalBillAmount || "0.00"}</p>
                                    <p className={styles.infoLabel}>Total Amount</p>
                                </div>
                                <div>
                                    <p className={styles.infoValue} style={{
                                        color: Number(supplier?.totals?.[0]?.totalBalanceAmount || 0) > 0 ? '#E9315D' :
                                            Number(supplier?.totals?.[0]?.totalBalanceAmount || 0) < 0 ? '#27AE60' : 'inherit'
                                    }}>
                                        ₹ {Math.abs(Number(supplier?.totals?.[0]?.totalBalanceAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className={styles.infoLabel}>Balance Amount</p>
                                </div>
                                <div>
                                    <p className={styles.infoValue}>₹ {supplier?.totals?.[0]?.totalPaidAmount || "0.00"}</p>
                                    <p className={styles.infoLabel}>Paid Amount</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.tabContainer}>
                        {["Purchase Orders", "Payment History"].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ""}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className={`${styles.contentArea} ${isSplit ? styles.contentAreaSplit : ""}`}>
                        <div className={styles.contentHeader}>
                            <h3 className={styles.statsTitle}>{activeTab}</h3>
                            {(activeTab === "Purchase Orders" ? purchaseOrders.length > 0 : paymentHistory.length > 0) && (
                                <button
                                    onClick={() => {
                                        const pendingBill = purchaseOrders.find(o => o.paymentStatus !== 'Full' && o.paymentStatus !== 'Paid');
                                        if (pendingBill) {
                                            setSelectedBillIdForPayment(pendingBill.productsBillId || pendingBill.productsPurchaseRqstID);
                                            setSelectedBillData(pendingBill);
                                            setIsPayNowModalOpen(true);
                                        } else {
                                            toast.info("No pending payments found");
                                        }
                                    }}
                                    className={styles.payNowBtn}
                                >
                                    PAY NOW
                                </button>
                            )}
                        </div>
                        {activeTab === "Purchase Orders" ? renderPurchaseOrders() : renderPaymentHistory()}
                    </div>

                    <PayNowModal
                        isOpen={isPayNowModalOpen}
                        onClose={() => setIsPayNowModalOpen(false)}
                        onRefresh={fetchData}
                        billId={selectedBillIdForPayment}
                        supplierData={supplier}
                        initialBillData={selectedBillData}
                        allOrders={purchaseOrders}
                    />

                    {managerConfig && (
                        <PurchaseOrderManager
                            mode={managerConfig.mode}
                            initialId={managerConfig.id}
                            initialData={managerConfig.initialData}
                            onSave={() => {
                                setManagerConfig(null);
                                fetchData();
                            }}
                            onClose={() => {
                                setManagerConfig(null);
                                fetchData();
                            }}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default SupplierView;
