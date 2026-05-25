import React from "react";
import styles from "../../styles/purchase-bill/purchase-out.module.css";
import { FiX, FiMail, FiMessageSquare } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { purchaseService } from "../../services/purchaseService";
import useStore from "../../components/state/useStore";

const ShareModal = ({ isOpen, onClose, data }) => {
    const { jwtToken } = useStore();
    const [supplierInfo, setSupplierInfo] = React.useState(null);

    React.useEffect(() => {
        if (isOpen && data?.supplierId) {
            const fetchSupplier = async () => {
                try {
                    // Reusing getSuppliers might work if it returns all, 
                    // but we need a specific one or filter from list.
                    // For now, let's assume we can get it or we filter.
                    const res = await purchaseService.getSuppliers(jwtToken, data.branchId);
                    if (res.status === "success") {
                        const supplier = res.data.find(s => s.supplierId === data.supplierId);
                        setSupplierInfo(supplier);
                    }
                } catch (error) {
                    console.error("Error fetching supplier for share:", error);
                }
            };
            fetchSupplier();
        }
    }, [isOpen, data, jwtToken]);

    if (!isOpen) return null;

    const phone = supplierInfo?.phone || data?.phone || "";
    const email = supplierInfo?.email || data?.email || "";
    const supplierName = supplierInfo?.supplierName || data?.transactionInfo || "Supplier";

    const getDisplayTotalAmount = (t) => {
        if (!t) return 0;
        const mainAmount = parseFloat(t.amount || 0);
        const splitSum = (t.splitTransactions || []).reduce((sum, st) => sum + parseFloat(st.amount || 0), 0);
        return mainAmount + splitSum;
    };

    const message = `Purchase Details:\nRef No: ${data?.suppliersTransactionId}\nSupplier: ${supplierName}\nAmount: ₹${getDisplayTotalAmount(data)}\nDate: ${new Date(data?.userTransactionDate).toLocaleDateString('en-GB')}`;

    const handleShare = (type) => {
        let url = "";
        switch (type) {
            case 'whatsapp':
                url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                break;
            case 'email':
                // Use Gmail web composer for better reliability
                url = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${encodeURIComponent("Purchase Details")}&body=${encodeURIComponent(message)}`;
                break;
            case 'sms':
                url = `sms:${phone}?body=${encodeURIComponent(message)}`;
                break;
            default:
                break;
        }
        if (url) {
            if (type === 'sms') {
                const link = document.createElement('a');
                link.href = url;
                link.target = "_self";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        }
    };

    return (
        <div className={styles.floatingShareCard} style={data?.position || {}}>
            <div className={styles.shareContent}>
                <span className={styles.shareTitle}>Share</span>
                <div className={styles.shareIconsRow}>
                    <div className={styles.shareIconItem} onClick={() => handleShare('email')}>
                        <div className={`${styles.iconCircle} ${styles.emailCircle}`}>
                            <FiMail />
                        </div>
                        <span className={styles.iconLabel}>Email</span>
                    </div>
                    <div className={styles.shareIconItem} onClick={() => handleShare('whatsapp')}>
                        <div className={`${styles.iconCircle} ${styles.whatsappCircle}`}>
                            <FaWhatsapp />
                        </div>
                        <span className={styles.iconLabel}>WhatsApp</span>
                    </div>
                    <div className={styles.shareIconItem} onClick={() => handleShare('sms')}>
                        <div className={`${styles.iconCircle} ${styles.smsCircle}`}>
                            <FiMessageSquare />
                        </div>
                        <span className={styles.iconLabel}>SMS</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
