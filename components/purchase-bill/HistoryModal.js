import React, { useState, useEffect } from "react";
import styles from "../../styles/purchase-bill/purchase-out.module.css";
import { FiX } from "react-icons/fi";
import { purchaseService } from "../../services/purchaseService";
import { saleService } from "../../services/saleService";
import useStore from "../state/useStore";
import Loader from "../utilities/Loader";

const HistoryModal = ({ isOpen, onClose, data, userInfo }) => {
    const { jwtToken } = useStore();
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            if (isOpen && (data?.suppliersTransactionId || data?.paymentId)) {
                setLoading(true);
                try {
                    let res;
                    if (data?.suppliersTransactionId) {
                        res = await purchaseService.getTransactionHistory(jwtToken, data.suppliersTransactionId);
                    } else if (data?.paymentId) {
                        res = await saleService.getPaymentHistory(jwtToken, data.paymentId);
                    }

                    if (res && (res.length > 0 || res.status === "success" || Array.isArray(res))) {
                        // Handle possible nested data or array response
                        const historyArray = Array.isArray(res) ? res : (res.data || []);
                        setHistoryData(historyArray);
                    }
                } catch (error) {
                    console.error("Failed to fetch history:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchHistory();
    }, [isOpen, data, jwtToken]);

    if (!isOpen || !data) return null;

    // Transform raw history entries into UI-friendly objects
    const formattedHistory = historyData.map(entry => {
        // Split description into individual change lines
        const changes = entry.description
            ? entry.description.split("\n").map(line => line.trim()).filter(Boolean)
            : [];
        
        return {
            date: new Date(entry.createdDate || entry.timestamp || new Date()).toLocaleString('en-GB', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            }),
            user: entry.createdBy ? `User #${entry.createdBy}` : (entry.userName || userInfo?.userName || "Unknown"),
            role: entry.actionPerformed || "Updated",
            changes,
        };
    });

    const fallback = !formattedHistory.length ? [{
        date: new Date(data.returnDate || data.createdDate || new Date()).toLocaleString('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }),
        user: userInfo?.userName || userInfo?.name || "Naveen",
        role: userInfo?.role || "PRIMARY ADMIN",
        changes: ["Created transaction"]
    }] : [];

    const finalHistory = formattedHistory.length ? formattedHistory : fallback;

    return (
        <div className={styles.overlay} style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className={styles.historyCard}>
                <div className={styles.historyHeader}>
                    <h3>Edit History for {data.suppliersTransactionId ? `Payment-Out #${data.suppliersTransactionId}` : `Payment-In #${data.paymentId}`}</h3>
                    <FiX className={styles.closeIcon} onClick={onClose} />
                </div>
                <div className={styles.historyContent}>
                    {loading ? (
                        <Loader message="Fetching history..." />
                    ) : (
                        finalHistory.map((entry, idx) => (
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
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryModal;
