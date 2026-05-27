import React from "react";
import styles from "../../styles/purchase-bill/purchase-out.module.css";
import { FiX, FiMail, FiMessageSquare } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { saleService } from "../../services/saleService";
import useStore from "../../components/state/useStore";

const ShareModal = ({ isOpen, onClose, data, branchId }) => {
    const { jwtToken } = useStore();
    const [customerInfo, setCustomerInfo] = React.useState(null);

    React.useEffect(() => {
        if (isOpen && data?.vendorCustomerId) {
            const fetchCustomer = async () => {
                try {
                    const res = await saleService.getCustomers(jwtToken, data.branchId || branchId);
                    if (res.status === "success") {
                        const customer = res.data.find(c => c.vendorCustomerId === data.vendorCustomerId);
                        setCustomerInfo(customer);
                    }
                } catch (error) {
                    console.error("Error fetching customer for share:", error);
                }
            };
            fetchCustomer();
        }
    }, [isOpen, data, jwtToken, branchId]);

    if (!isOpen) return null;

    const phone = customerInfo?.phoneNumber || data?.customer?.phoneNumber || data?.phone || "";
    const email = customerInfo?.email || data?.customer?.email || data?.email || "";
    const customerName = customerInfo ? `${customerInfo.firstName} ${customerInfo.lastName}` : (data?.customer ? `${data.customer.firstName} ${data.customer.lastName}` : "Customer");

    const getDisplayTotalAmount = (t) => {
        if (!t) return 0;
        return parseFloat(t.totalAmount || t.totalReturnAmount || t.amount || t.paidAmount || 0);
    };

    const getRefNo = (t) => {
        if (!t) return "";
        if (t.customerReturnId) return `SR-${t.customerReturnId}`;
        return t.userOrderId || t.paymentId || "";
    };

    const getFormattedDate = (t) => {
        if (!t) return "";
        const dateStr = t.invoiceDate || t.returnDate || t.paymentDate || t.createdDate;
        return dateStr ? new Date(dateStr).toLocaleDateString('en-GB') : "";
    };

    const message = `Sale Details:\nRef No: ${getRefNo(data)}\nCustomer: ${customerName}\nAmount: ₹${getDisplayTotalAmount(data)}\nDate: ${getFormattedDate(data)}`;

    const handleShare = (type) => {
        let url = "";
        switch (type) {
            case 'whatsapp':
                url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                break;
            case 'email':
                url = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${encodeURIComponent("Sale Details")}&body=${encodeURIComponent(message)}`;
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={styles.shareTitle}>Share</span>
                    <FiX style={{ cursor: 'pointer', color: '#999' }} onClick={onClose} />
                </div>
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
