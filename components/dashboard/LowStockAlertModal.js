import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiX } from 'react-icons/fi';
import styles from '../../styles/dashboard/low-stock-modal.module.css';

const LowStockAlertModal = ({ isOpen, onClose, lowStockItems }) => {
    const router = useRouter();
    const [dontShowAgain, setDontShowAgain] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            document.body.style.overflow = 'unset';
            return;
        }

        // Check if user already dismissed it this session
        const isHidden = localStorage.getItem('hideLowStockAlert');
        if (isHidden === 'true') {
            onClose();
            return;
        }

        // Prevent body scrolling when modal is open
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !lowStockItems || lowStockItems.length === 0) return null;

    const handleClose = () => {
        if (dontShowAgain) {
            localStorage.setItem('hideLowStockAlert', 'true');
        }
        onClose();
    };

    const handleViewItems = () => {
        if (dontShowAgain) {
            localStorage.setItem('hideLowStockAlert', 'true');
        }
        router.push({
            pathname: '/inventory/stock-status',
            query: { tab: 'lowStock' }
        });
        onClose();
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h2>Low Stock Alert</h2>
                    <button className={styles.closeButton} onClick={handleClose}>
                        <FiX size={20} />
                    </button>
                </div>
                
                <div className={styles.modalBody}>
                    <div className={styles.alertBanner}>
                        <div className={styles.alertBannerIcon}>
                            <FiX size={18} />
                        </div>
                        <p className={styles.alertBannerText}>
                            The following item(s) quantity has reached or gone below the<br/>
                            minimum stock level.
                        </p>
                    </div>

                    <div className={styles.tableContainer}>
                        <table className={styles.lowStockTable}>
                            <thead>
                                <tr>
                                    <th>Item Name</th>
                                    <th>Available Qty</th>
                                    <th>Min. Stock Level</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lowStockItems.map((item, index) => {
                                    // Depending on data structure, variant size might be appended
                                    const sizeLabel = item.variantType?.size ? ` - ${item.variantType.size}` : '';
                                    const itemName = `${item.productName}${sizeLabel}`;
                                    
                                    // Use placeholder if no image is available
                                    const hasImage = item.images && item.images.length > 0;

                                    return (
                                        <tr key={index}>
                                            <td>
                                                <div className={styles.itemCell}>
                                                    {hasImage ? (
                                                        <img src={item.images[0]} alt={itemName} className={styles.itemImage} />
                                                    ) : (
                                                        <div className={styles.itemImagePlaceholder}></div>
                                                    )}
                                                    <span className={styles.itemName}>{itemName}</span>
                                                </div>
                                            </td>
                                            <td>{item.qty}</td>
                                            <td>{item.minStockAlert}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <label className={styles.checkboxContainer}>
                        <input 
                            type="checkbox" 
                            checked={dontShowAgain} 
                            onChange={(e) => {
                                setDontShowAgain(e.target.checked);
                                if (e.target.checked) {
                                    localStorage.setItem('hideLowStockAlert', 'true');
                                } else {
                                    localStorage.removeItem('hideLowStockAlert');
                                }
                            }} 
                        />
                        <span className={styles.checkboxLabel}>Don't Show Again for this session</span>
                    </label>

                    <div className={styles.actionButtons}>
                        <button className={styles.cancelBtn} onClick={handleClose}>Cancel</button>
                        <button className={styles.viewItemsBtn} onClick={handleViewItems}>View Low Stock Items</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LowStockAlertModal;
