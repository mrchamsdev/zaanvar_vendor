import React from "react";
import styles from "../../styles/purchase-bill/purchase-out.module.css";
import { FiX } from "react-icons/fi";

const HistoryModal = ({ isOpen, onClose, data, userInfo }) => {
    if (!isOpen || !data) return null;

    const getDisplayPaymentType = (t) => {
        const types = [t.paymentType, ...(t.splitTransactions || []).map(st => st.paymentType)]
            .map(type => type || "Cash")
            .filter((value, index, self) => self.indexOf(value) === index);
        return types.join(" + ");
    };

    const getDisplayTotalAmount = (t) => {
        const mainAmount = parseFloat(t.amount || 0);
        const splitSum = (t.splitTransactions || []).reduce((sum, st) => sum + parseFloat(st.amount || 0), 0);
        return mainAmount + splitSum;
    };

    // Mock history data since backend might not have this yet
    const history = [
        {
            date: new Date(data.returnDate || data.createdDate).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            user: userInfo?.userName || userInfo?.name || "Naveen",
            role: userInfo?.role || "PRIMARY ADMIN",
            changes: [
                `For Payment Type ${getDisplayPaymentType(data)}, Amount changed from 0 to ${getDisplayTotalAmount(data)}`,
                `Received Amount changed from 0 to ${getDisplayTotalAmount(data)}`,
                `Total Transaction Value changed from 0 to ${getDisplayTotalAmount(data)}`
            ]
        }
    ];

    return (
        <div className={styles.overlay} style={{background: 'rgba(0,0,0,0.5)'}}>
            <div className={styles.historyCard}>
                <div className={styles.historyHeader}>
                    <h3>Edit History for Payment-Out #{data.suppliersTransactionId}</h3>
                    <FiX className={styles.closeIcon} onClick={onClose} />
                </div>
                <div className={styles.historyContent}>
                    {history.map((entry, idx) => (
                        <div key={idx} className={styles.historyEntry}>
                            <div className={styles.entryMain}>
                                <ul className={styles.changesList}>
                                    {entry.changes.map((change, cIdx) => (
                                        <li key={cIdx}>{change}</li>
                                    ))}
                                </ul>
                                <span className={styles.showLess}>Show Less</span>
                            </div>
                            <div className={styles.entryMeta}>
                                <span className={styles.entryDate}>{entry.date}</span>
                                <div className={styles.userBadge}>
                                    <span className={styles.userName}>{entry.user}</span>
                                    <span className={styles.userRole}>{entry.role}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HistoryModal;
