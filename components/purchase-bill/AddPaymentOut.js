import { toApiDateOnly } from "@/utilities/date-time-utils";
import React, { useState, useEffect } from "react";
import { dateOnlyWithTimeZone, parseWallClockDate } from "@/utilities/date-time-utils";
import styles from "../../styles/purchase-bill/add-payment-out.module.css";
import { FiX, FiCalendar, FiPlus, FiTrash2 } from "react-icons/fi";
import { purchaseService } from "../../services/purchaseService";
import useStore from "../../components/state/useStore";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { toast } from "sonner";

const AddPaymentOut = ({ isOpen, onClose, onRefresh }) => {
    const { jwtToken, userInfo } = useStore();
    const { branchId } = useDashboardData({ skipReviews: true });
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState("");
    const [supplierTotals, setSupplierTotals] = useState(null);
    const [transactionDate, setTransactionDate] = useState(toApiDateOnly(new Date()));
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

    const currentTotalAllocated = payments.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0);
    const isUnbalanced = Number(editablePaidAmount) > 0 && Math.abs(currentTotalAllocated - Number(editablePaidAmount)) > 0.01;

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const res = await purchaseService.getSuppliers(jwtToken, branchId);
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
            setEditablePaidAmount("");
            return;
        }
        try {
            const res = await purchaseService.getSupplierTransactions(jwtToken, supplierId);
            if (res.status === "success") {
                const totals = res.totals?.[0] || null;
                setSupplierTotals(totals);
                setEditablePaidAmount("0");
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

        const totalAmountToBePaid = Number(editablePaidAmount);
        const currentTotalPaid = payments.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0);

        if (totalAmountToBePaid > 0 && Math.abs(currentTotalPaid - totalAmountToBePaid) > 0.01) {
            toast.error(`The sum of payments (₹ ${currentTotalPaid}) does not match the Total Amount Paid (₹ ${totalAmountToBePaid})`);
            return;
        }

        const validPayments = payments.filter(p => Number(p.amountPaid) > 0);
        if (validPayments.length === 0) {
            toast.error("Please enter at least one valid payment amount");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                debitOrCredit: "Debit",
                paymentFrom: "payment out",
                branchId: branchId,
                supplierId: Number(selectedSupplierId),
                ...dateOnlyWithTimeZone(
                    "userTransactionDate",
                    parseWallClockDate(transactionDate) || new Date(transactionDate),
                ),
                transactionInfo: description || "",
                createdBy: userInfo?.userId || 1,
                productsBillId: null,
                paymentTypes: validPayments.map(p => {
                    const typeObj = {
                        paymentType: p.paymentType,
                        amount: Number(p.amountPaid)
                    };
                    if (p.refNo && (p.paymentType === 'UPI' || p.paymentType === 'Cheque')) {
                        typeObj.referenceNumber = p.refNo;
                    }
                    return typeObj;
                })
            };

            const res = await purchaseService.createTransaction(jwtToken, payload);
            if (res.status === "success" || res.status === "ok" || res.data?.status === "success") {
                const resData = res.data?.data || res.data;
                let transId = null;
                if (Array.isArray(resData)) {
                    transId = resData[0]?.suppliersTransactionId;
                } else if (resData && typeof resData === 'object') {
                    if (Array.isArray(resData.data)) {
                        transId = resData.data[0]?.suppliersTransactionId;
                    } else {
                        transId = resData.suppliersTransactionId || resData.data?.suppliersTransactionId;
                    }
                }

                if (selectedImage && transId) {
                    const formData = new FormData();
                    formData.append("transactionImg", selectedImage);
                    await purchaseService.uploadTransactionImage(jwtToken, transId, formData);
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
                    <h3>Payment Details</h3>
                    <button className={styles.closeBtn} onClick={onClose}><FiX /></button>
                </div>

                <div className={styles.modalContent}>
                    {/* Supplier Selection */}
                    <div className={styles.field} style={{ marginBottom: '32px' }}>
                        <label>Name / Phone number</label>
                        <select
                            className={styles.select}
                            value={selectedSupplierId}
                            onChange={(e) => handleSupplierChange(e.target.value)}
                            style={{ width: '624px' }}
                        >
                            <option value="">Select Name</option>
                            {suppliers.map(s => (
                                <option key={s.supplierId} value={s.supplierId}>
                                    {s.supplierName} {s.phone ? `(${s.phone})` : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Row 1: Date and Total Amount Paid */}
                    <div className={styles.gridRow}>
                        <div className={styles.field}>
                            <label>Amount paid date</label>
                            <input
                                type="date"
                                className={styles.input}
                                value={transactionDate}
                                max={toApiDateOnly(new Date())}
                                onChange={(e) => setTransactionDate(e.target.value)}
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Total Amount Paid</label>
                            <input
                                type="number"
                                className={`${styles.input} ${isUnbalanced ? styles.inputError : ""}`}
                                placeholder="0"
                                value={editablePaidAmount}
                                onChange={(e) => {
                                    let val = e.target.value;
                                    if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
                                        val = val.substring(1);
                                    }
                                    setEditablePaidAmount(val);
                                }}
                            />
                        </div>
                    </div>

                    {/* Row 2: Total Amount and Balance Amount */}
                    <div className={styles.gridRow}>
                        <div className={styles.field}>
                            <label>Total Amount</label>
                            <input
                                type="text"
                                className={`${styles.input} ${styles.readOnly}`}
                                value={supplierTotals?.totalBillAmount ? `₹ ${Number(supplierTotals.totalBillAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "₹ 0"}
                                readOnly
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Balance Amount</label>
                            <input
                                type="text"
                                className={`${styles.input} ${styles.readOnly}`}
                                value={`₹ ${(Number(supplierTotals?.totalBalanceAmount || 0) - Number(editablePaidAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                            <input
                                                type="number"
                                                className={`${styles.input} ${isUnbalanced ? styles.inputError : ""}`}
                                                placeholder="0"
                                                value={p.amountPaid}
                                                onChange={(e) => {
                                                    let val = e.target.value;
                                                    if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
                                                        val = val.substring(1);
                                                    }
                                                    handlePaymentChange(p.id, "amountPaid", val);
                                                }}
                                            />
                                            {payments.length > 1 && (
                                                <button className={styles.miniRemove} onClick={() => handleRemovePayment(p.id)}>
                                                    <FiTrash2 />
                                                </button>
                                            )}
                                        </div>
                                        {isUnbalanced && idx === payments.length - 1 && (
                                            <span className={styles.errorText}>match to total amount paid</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Reference Number */}
                            {(p.paymentType === 'Cheque' || p.paymentType === 'UPI') && (
                                <div className={styles.field} style={{ marginBottom: '24px' }}>
                                    <label>{p.paymentType === 'Cheque' ? 'CHECK NUMBER' : 'REFERENCE NUMBER'}</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        placeholder="****************"
                                        value={p.refNo}
                                        onChange={(e) => handlePaymentChange(p.id, "refNo", e.target.value.replace(/[^0-9]/g, ''))}
                                    />
                                </div>
                            )}
                        </div>
                    ))}

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '32px'
                    }}>
                        <div className={styles.addPaymentLink} onClick={handleAddPayment} style={{ margin: 0 }}>
                            +ADD ANOTHER PAYMENT
                        </div>
                        {Number(editablePaidAmount) > 0 && (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                                gap: '4px'
                            }}>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    color: !isUnbalanced ? '#22c55e' : '#E93E64'
                                }}>
                                    {(Number(editablePaidAmount) - currentTotalAllocated) < 0 ? 'Excess Allocation: ₹ ' : 'Remaining to Allocate: ₹ '}
                                    {Math.abs(Number(editablePaidAmount) - currentTotalAllocated).toFixed(2)}
                                </div>
                                <div style={{ fontSize: '11px', color: '#999' }}>
                                    Total Allocated: ₹ {currentTotalAllocated.toFixed(2)} / ₹ {Number(editablePaidAmount).toFixed(2)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className={styles.field} style={{ marginBottom: '32px' }}>
                        <label>Add Description</label>
                        <textarea
                            className={styles.textarea}
                            placeholder="Enter Descrition"
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
                                style={{ display: 'none' }}
                                onChange={(e) => setSelectedImage(e.target.files[0])}
                                accept="image/*"
                            />
                            <span style={{ fontSize: '14px', color: '#999', marginLeft: '12px' }}>
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
