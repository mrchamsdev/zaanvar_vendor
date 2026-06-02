import React, { useState, useEffect } from "react";
import styles from "../../styles/suppliers/SupplierView.module.css";
import { purchaseService } from "../../services/purchaseService";
import useStore from "../state/useStore";
import { toast } from "sonner";
import PayNowModal from "../purchase-bill/PayNowModal";
import PurchaseOrderManager from "../purchase-bill/purchase-order-manager";
import { parseApiToLocal } from "../../utilities/date-time-utils";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

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
    const [expandedRows, setExpandedRows] = useState({});
    const toggleRowExpand = (id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const getDisplayPaymentType = (t) => {
        const types = [t.paymentType, ...(t.splitTransactions || []).map(st => st.paymentType)]
            .map(type => type || "Cash")
            .filter((value, index, self) => self.indexOf(value) === index);
        return types.join(" + ");
    };

    const getDisplayReferenceNumber = (t) => {
        const refs = [];
        if (Array.isArray(t.paymentTypes)) {
            t.paymentTypes.forEach(p => {
                const ref = p.referenceNumber || p.refNo;
                if (ref) refs.push(ref);
            });
        }
        const mainRef = t.referenceNumber || t.refNo;
        if (mainRef && !refs.includes(mainRef)) {
            refs.push(mainRef);
        }
        if (Array.isArray(t.splitTransactions)) {
            t.splitTransactions.forEach(st => {
                const ref = st.referenceNumber || st.refNo;
                if (ref && !refs.includes(ref)) {
                    refs.push(ref);
                }
            });
        }
        return refs.length > 0 ? refs.join(", ") : "--";
    };

    const getDisplayTotalAmount = (t) => {
        const mainAmount = parseFloat(t["paid amount"] || t.amount || 0);
        const splitSum = (t.splitTransactions || []).reduce((sum, st) => sum + parseFloat(st["paid amount"] || st.amount || 0), 0);
        return mainAmount + splitSum;
    };

    const getDisplayBalanceAmount = (t) => {
        if (t.splitTransactions && t.splitTransactions.length > 0) {
            const lastSplit = t.splitTransactions[t.splitTransactions.length - 1];
            return lastSplit.totalBalanceAmount || lastSplit["balance amount"] || lastSplit.balance || "0.00";
        }
        return t.totalBalanceAmount || t["balance amount"] || t.balance || "0.00";
    };

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
                                <td className={styles.td}>{t.overallBillAmount ?? "-"}</td>
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
                        <th className={styles.th}>PO Number</th>
                        <th className={styles.th}>Payment Date</th>
                        <th className={styles.th}>Total amount</th>
                        <th className={styles.th}>Previous Paid amount</th>
                        <th className={styles.th}>Payment Type</th>
                        <th className={styles.th}>Reference Number</th>
                        <th className={styles.th}>Paid amount</th>
                        <th className={styles.th}>Balance amount</th>
                        <th className={styles.th} style={{ width: '40px' }}></th>
                    </tr>
                </thead>
                <tbody>
                    {paymentHistory.length === 0 ? (
                        <tr><td colSpan="10" className={styles.noData}>No data available</td></tr>
                    ) : (
                        paymentHistory.map((t, idx) => {
                            const splitsList = Array.isArray(t.paymentTypes) && t.paymentTypes.length > 0
                                ? t.paymentTypes.map(p => ({
                                    paymentType: p.paymentType || "Cash",
                                    amount: p.amount || 0,
                                    referenceNumber: p.referenceNumber || p.refNo || ""
                                }))
                                : [
                                    {
                                        paymentType: t.paymentType || "Cash",
                                        amount: t["paid amount"] || t.amount || 0,
                                        referenceNumber: t.referenceNumber || t.refNo || ""
                                    },
                                    ...(t.splitTransactions || []).map(st => ({
                                        paymentType: st.paymentType || "Cash",
                                        amount: st["paid amount"] || st.amount || st.amountPaidToSupplier || 0,
                                        referenceNumber: st.referenceNumber || st.refNo || ""
                                    }))
                                ];
                            return (
                                <React.Fragment key={t.suppliersTransactionId || idx}>
                                    <tr className={styles.trHistory}>
                                        <td className={styles.td}>{String(t.productsBillId || t.returnProductsId || idx).padStart(7, '0')}</td>
                                        <td className={styles.td}>
                                            {(() => {
                                                const poId = t.productsPurchaseRqstId || t.productsPurchaseRqstID || t.relatedBill?.billItems?.[0]?.productsPurchaseRqstId || t.relatedBill?.billItems?.[0]?.productsPurchaseRqstID;
                                                return poId ? `PO-${String(poId).padStart(5, '0')}` : "--";
                                            })()}
                                        </td>
                                        <td className={styles.td}>
                                            {(() => {
                                                const d = parseApiToLocal(t.userTransactionDate || t.modifiedDate || t.createdDate);
                                                return d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : "--";
                                            })()}
                                        </td>
                                        <td className={styles.td}>₹ {Number(t.relatedBill?.totalAmount || t.amount || t.totalAmount || t.totalBillAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className={styles.td}>₹ {Number(t["previouspaid amount"] || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className={styles.td}>{getDisplayPaymentType(t)}</td>
                                        <td className={styles.td}>{getDisplayReferenceNumber(t)}</td>
                                        <td className={styles.td}>₹ {Number(getDisplayTotalAmount(t)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className={styles.td}>₹ {getDisplayBalanceAmount(t)}</td>
                                        <td className={styles.td}>
                                            {t.splitTransactions && t.splitTransactions.length > 0 && (
                                                <div
                                                    onClick={() => toggleRowExpand(t.suppliersTransactionId)}
                                                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}
                                                >
                                                    {expandedRows[t.suppliersTransactionId] ? <FiChevronUp /> : <FiChevronDown />}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                    {expandedRows[t.suppliersTransactionId] && splitsList.map((split, sIdx) => (
                                        <tr key={`split-${sIdx}`} className={styles.trHistory} style={{ borderBottom: '1px solid #eee' }}>
                                            <td className={styles.td}></td>
                                            <td className={styles.td}></td>
                                            <td className={styles.td}></td>
                                            <td className={styles.td}></td>
                                            <td className={styles.td}></td>
                                            <td className={styles.td}>{split.paymentType}</td>
                                            <td className={styles.td}>{split.referenceNumber || "--"}</td>
                                            <td className={styles.td}>₹ {Number(split.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className={styles.td}></td>
                                            <td className={styles.td}></td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            );
                        })
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
