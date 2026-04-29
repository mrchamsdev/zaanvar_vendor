import React, { useState, useEffect } from "react";
import styles from "../../styles/purchase-bill/purchase-out.module.css";
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
        fetchSuppliers();
    }, []);

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

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
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
                    productsBillId: null, // As per generic payment out
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
                    <div className={styles.gridRow}>
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
                                className={styles.input}
                                value={editablePaidAmount}
                                placeholder="0"
                                onChange={(e) => setEditablePaidAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    {payments.map((p, idx) => (
                        <div key={p.id} className={styles.paymentEntry} style={{borderBottom: '1px solid #eee', paddingBottom: '24px', marginBottom: '24px'}}>
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
                                    <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                                        <input 
                                            type="number" 
                                            className={styles.input}
                                            placeholder="0"
                                            value={p.amountPaid}
                                            onChange={(e) => handlePaymentChange(p.id, "amountPaid", e.target.value)}
                                            style={{flex: 1}}
                                        />
                                        {payments.length > 1 && (
                                            <button className={styles.miniRemove} onClick={() => handleRemovePayment(p.id)} style={{border: '1px solid #ddd', padding: '8px', borderRadius: '4px', background: '#fff'}}>
                                                <FiTrash2 />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Conditional Ref No */}
                            {(p.paymentType === 'Cheque' || p.paymentType === 'UPI') && (
                                <div className={styles.field} style={{marginTop: '12px'}}>
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

                    <div className={styles.field} style={{marginBottom: '24px'}}>
                        <label>Add Description</label>
                        <textarea 
                            className={styles.textarea}
                            placeholder="Lorem ipsum dolor sit..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

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
                            <span style={{fontSize: '14px', color: '#666'}}>{selectedImage ? selectedImage.name : "No file Choosen"}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button className={styles.shareBtn}>Share</button>
                    <button className={styles.saveBtn} onClick={handleSave} disabled={loading}>
                        {loading ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddPaymentOut;
