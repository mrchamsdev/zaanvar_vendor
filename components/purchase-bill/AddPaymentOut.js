import React, { useState, useEffect } from "react";
import styles from "../../styles/purchase-bill/add-payment-out.module.css";
import { FiX, FiCalendar, FiPlus, FiTrash2 } from "react-icons/fi";
import { purchaseService } from "../../services/purchaseService";
import useStore from "../../components/state/useStore";
import { toast } from "sonner";

const AddPaymentOut = ({ isOpen, onClose, onRefresh }) => {
    const { jwtToken, userInfo } = useStore();
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState("");
    const [supplierTotals, setSupplierTotals] = useState(null);
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [editablePaidAmount, setEditablePaidAmount] = useState("");

    // Multi-payment state
    const [payments, setPayments] = useState([{
        amountPaid: "",
        paymentType: "Cash",
        refNo: "",
        id: Date.now()
    }]);

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const res = await purchaseService.getSuppliers(jwtToken, userInfo?.branchId || 91);
                if (res.status === "success") {
                    setSuppliers(res.data || []);
                }
            } catch (error) {
                console.error("Error fetching suppliers:", error);
            }
        };
        if (isOpen) fetchSuppliers();
    }, [isOpen]);

    const handleSupplierChange = async (supplierId) => {
        setSelectedSupplierId(supplierId);
        if (!supplierId) {
            setSupplierTotals(null);
            return;
        }
        try {
            const res = await purchaseService.getSupplierTransactions(jwtToken, supplierId);
            if (res.status === "success") {
                setSupplierTotals(res.totals || null);
                setEditablePaidAmount("");
            }
        } catch (error) {
            console.error("Error fetching supplier totals:", error);
        }
    };

    const handleAddPayment = () => {
        setPayments([...payments, {
            amountPaid: "",
            paymentType: "Cash",
            refNo: "",
            id: Date.now()
        }]);
    };

    const handleRemovePayment = (id) => {
        if (payments.length > 1) {
            setPayments(payments.filter(p => p.id !== id));
        }
    };

    const handlePaymentChange = (id, field, value) => {
        setPayments(payments.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleSave = async () => {
        if (!selectedSupplierId) {
            toast.error("Please select a supplier");
            return;
        }

        const validPayments = payments.filter(p => Number(p.amountPaid) > 0);
        if (validPayments.length === 0) {
            toast.error("Please enter at least one valid payment amount");
            return;
        }

        setLoading(true);
        try {
            for (const p of validPayments) {
                const payload = {
                    amount: Number(p.amountPaid),
                    debitOrCredit: "Debit",
                    paymentFrom: "payment out",
                    paymentType: p.paymentType,
                    branchId: userInfo?.branchId || 91,
                    supplierId: Number(selectedSupplierId),
                    userTransactionDate: transactionDate,
                    transactionInfo: description || "Payment Out recorded",
                    createdBy: userInfo?.userId || 1,
                    productsBillId: null,
                    refNo: p.refNo || null
                };

                const res = await purchaseService.createTransaction(jwtToken, payload);
                if (res.status === "success" || res.status === "ok") {
                    const transId = res.data?.suppliersTransactionId;
                    if (selectedImage && transId) {
                        const formData = new FormData();
                        formData.append("transactionImg", selectedImage);
                        await purchaseService.uploadTransactionImage(jwtToken, transId, formData);
                    }
                }
            }

            toast.success("Payment recorded successfully");
            if (onRefresh) onRefresh();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while saving");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h3>Add Payment Out</h3>
                    <button className={styles.closeBtn} onClick={onClose}><FiX /></button>
                </div>

                <div className={styles.modalContent}>
                    {/* Row 1: Name and Date */}
                    <div className={styles.topRow}>
                        <div className={styles.field}>
                            <label>Name / Phone number</label>
                            <select 
                                className={styles.select}
                                value={selectedSupplierId}
                                onChange={(e) => handleSupplierChange(e.target.value)}
                            >
                                <option value="">Select Name</option>
                                {suppliers.map(s => (
                                    <option key={s.supplierId} value={s.supplierId}>
                                        {s.supplierName} {s.phone ? `(${s.phone})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label>Date</label>
                            <input 
                                type="date" 
                                className={styles.input}
                                value={transactionDate}
                                onChange={(e) => setTransactionDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Row 2: Balance and Paid Amount */}
                    <div className={styles.gridRow}>
                        <div className={styles.field}>
                            <label>Total Balance Amount</label>
                            <input 
                                type="text" 
                                className={`${styles.input} ${styles.readOnly}`}
                                value={supplierTotals?.supplierTotalAmount || "000"}
                                readOnly
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Paid Amount</label>
                            <input 
                                type="text" 
                                className={`${styles.input} ${styles.readOnly}`}
                                value={editablePaidAmount || "000"}
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Dynamic Payment Entries */}
                    {payments.map((p, idx) => (
                        <div key={p.id} className={styles.paymentEntry}>
                            <div className={styles.gridRow}>
                                <div className={styles.field}>
                                    <label>Payment Type</label>
                                    <select 
                                        className={styles.select}
                                        value={p.paymentType}
                                        onChange={(e) => handlePaymentChange(p.id, "paymentType", e.target.value)}
                                    >
                                        {['Cash', 'Cheque', 'UPI', 'Card', 'Bank'].map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.field}>
                                    <label>Amount Paid</label>
                                    <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
                                        <input 
                                            type="number" 
                                            className={styles.input}
                                            placeholder="₹ 25000"
                                            value={p.amountPaid}
                                            onChange={(e) => handlePaymentChange(p.id, "amountPaid", e.target.value)}
                                        />
                                        {payments.length > 1 && (
                                            <button className={styles.miniRemove} onClick={() => handleRemovePayment(p.id)}>
                                                <FiTrash2 />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Reference Number */}
                            {(p.paymentType === 'Cheque' || p.paymentType === 'UPI') && (
                                <div className={styles.field} style={{marginBottom: '24px'}}>
                                    <label>{p.paymentType === 'Cheque' ? 'CHECK NUMBER' : 'REFERENCE NUMBER'}</label>
                                    <input 
                                        type="text" 
                                        className={styles.input}
                                        placeholder="****************"
                                        value={p.refNo}
                                        onChange={(e) => handlePaymentChange(p.id, "refNo", e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    ))}

                    <div className={styles.addPaymentLink} onClick={handleAddPayment}>
                        +ADD ANOTHER PAYMENT
                    </div>

                    {/* Description */}
                    <div className={styles.field} style={{marginBottom: '32px'}}>
                        <label>Add Description</label>
                        <textarea 
                            className={styles.textarea}
                            placeholder="Lorem ipsum dolor sit..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={1}
                        />
                    </div>

                    {/* Image Upload */}
                    <div className={styles.field}>
                        <label>Add Image</label>
                        <div className={styles.imageUpload}>
                            <label htmlFor="paymentImage" className={styles.uploadTrigger}>Choose file</label>
                            <input 
                                id="paymentImage"
                                type="file" 
                                style={{display: 'none'}}
                                onChange={(e) => setSelectedImage(e.target.files[0])}
                                accept="image/*"
                            />
                            <span style={{fontSize: '14px', color: '#999', marginLeft: '12px'}}>
                                {selectedImage ? selectedImage.name : "No file Choosen"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
                    <button className={styles.saveBtn} onClick={handleSave} disabled={loading}>
                        {loading ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddPaymentOut;
