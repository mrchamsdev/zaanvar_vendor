import { toApiDateOnly } from "@/utilities/date-time-utils";
import React, { useState, useEffect } from "react";
import styles from "../../styles/purchase-bill/payment-details-popup.module.css";
import { FiX, FiCalendar, FiPlus, FiTrash2 } from "react-icons/fi";
import { purchaseService } from "../../services/purchaseService";
import useStore from "../../components/state/useStore";
import { toast } from "sonner";
import { dateOnlyWithTimeZone, parseWallClockDate } from "@/utilities/date-time-utils";

const PaymentDetailsPopup = ({ isOpen, onClose, data, onRefresh }) => {
    const { jwtToken, userInfo } = useStore();
    const [loading, setLoading] = useState(false);
    
    // Global States
    const [amountPaidDate, setAmountPaidDate] = useState(toApiDateOnly(new Date()));
    const [description, setDescription] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // Multi-payment state
    const [masterTarget, setMasterTarget] = useState(0);
    const [payments, setPayments] = useState([{
        amountPaid: "0",
        paymentType: "Cash",
        referenceNumber: "",
        id: Date.now()
    }]);

    const sessionTotal = payments.reduce((acc, p) => acc + (Number(p.amountPaid) || 0), 0);
    const isOverTarget = sessionTotal > masterTarget;

    // Calculated / Read-only values from props
    const totalAmount = data.totalAmount || 0;
    const previousPaidAmount = data.previousPaidAmount || 0;
    
    const initialBalance = (data.balanceAmount && Number(data.balanceAmount) > 0) ? Number(data.balanceAmount) : totalAmount;
    const balanceAmount = Math.max(0, initialBalance - masterTarget);
    const totalAmountPaid = previousPaidAmount + masterTarget;

    const today = toApiDateOnly(new Date());

    const handleAddPayment = () => {
        setPayments([...payments, {
            amountPaid: "",
            paymentType: "Cash",
            referenceNumber: "",
            id: Date.now()
        }]);
    };

    const handleRemovePayment = (id) => {
        if (payments.length > 1) {
            setPayments(payments.filter(p => p.id !== id));
        }
    };

    const handlePaymentChange = (id, field, value) => {
        let cleanedValue = value;
        if (field === "amountPaid") {
            // Remove leading zero unless it's followed by a decimal point
            cleanedValue = value.replace(/^0+(?=\d)/, '');
        }
        setPayments(payments.map(p => p.id === id ? { ...p, [field]: cleanedValue } : p));
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
        const validPayments = payments.filter(p => Number(p.amountPaid) > 0);
        if (validPayments.length === 0) {
            toast.error("Please enter at least one valid payment amount");
            return;
        }

        setLoading(true);
        try {
            let firstTransactionId = null;
            for (const p of validPayments) {
                const payload = {
                    amount: Number(p.amountPaid),
                    debitOrCredit: "Debit",
                    paymentFrom: "payment out",
                    paymentType: p.paymentType,
                    referenceNumber: p.referenceNumber || "",
                    ...dateOnlyWithTimeZone(
                        "userTransactionDate",
                        parseWallClockDate(amountPaidDate) || new Date(amountPaidDate),
                    ),
                    supplierId: data.supplierId,
                    branchId: data.branchId,
                    createdBy: userInfo?.userId || 1,
                    productsBillId: data.productsBillId,
                    returnProductsId: null,
                    supplierWalletTransactionId: null,
                    transactionInfo: description || `Payment against Purchase Order #${String(data.purchaseRequestId).padStart(6, '0')}`,
                    transactionImg: "",
                    totalAmount: Number(totalAmount),
                    balanceAmount: Math.max(0, initialBalance - validPayments.slice(0, validPayments.indexOf(p) + 1).reduce((acc, curr) => acc + Number(curr.amountPaid), 0))
                };

                const res = await purchaseService.createTransaction(jwtToken, payload);
                if (res.status === "success" || res.status === "ok") {
                    if (!firstTransactionId) firstTransactionId = res.data?.id;
                }
            }

            if (selectedImage && firstTransactionId) {
                const formData = new FormData();
                formData.append("transactionImg", selectedImage);
                formData.append("supplierId", data.supplierId);
                formData.append("branchId", data.branchId);
                formData.append("createdBy", userInfo?.userId || 1);
                await purchaseService.uploadTransactionImage(jwtToken, firstTransactionId, formData);
            }

            toast.success("Payments recorded successfully");
            if (onRefresh) onRefresh();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while saving");
        } finally {
            setLoading(false);
        }
    };

    const getReferenceLabel = (type) => {
        if (type === "Cheque") return "Cheque Number";
        if (["Card", "UPI", "Bank"].includes(type)) return "Reference Number";
        return null;
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3>payment details</h3>
                    <button className={styles.closeBtn} onClick={onClose}><FiX /></button>
                </div>

                <div className={styles.content}>
                    {/* Row 1: Date (Global) and first payment amount */}
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label>Amount paid date</label>
                            <div className={styles.inputWrapper}>
                                    <input 
                                        type="date" 
                                        value={amountPaidDate} 
                                        max={today}
                                        onChange={(e) => setAmountPaidDate(e.target.value)} 
                                    />
                                </div>
                        </div>
                        <div className={styles.field}>
                            <label>Total Amount Paid</label>
                            <div className={styles.inputWrapper}>
                                <span className={styles.prefix}>₹</span>
                                <input 
                                    type="text" 
                                    placeholder="0" 
                                    value={masterTarget}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9.]/g, '');
                                        setMasterTarget(val === "" ? 0 : Number(val));
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Global Summaries */}
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label>Total Amount</label>
                            <div className={`${styles.inputWrapper} ${styles.readOnly}`}>
                                <span className={styles.prefix}>₹</span>
                                <input type="text" value={totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} readOnly />
                            </div>
                        </div>
                        <div className={styles.field}>
                            <label>Balance Amount</label>
                            <div className={`${styles.inputWrapper} ${styles.readOnly}`}>
                                <span className={styles.prefix}>₹</span>
                                <input type="text" value={balanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} readOnly />
                            </div>
                        </div>
                    </div>

                    {/* Row 3: First Payment Type and Global Total Paid */}
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label>Payment Type</label>
                            <select 
                                value={payments[0].paymentType} 
                                onChange={(e) => handlePaymentChange(payments[0].id, "paymentType", e.target.value)}
                            >
                                {['Cash', 'Cheque', 'UPI', 'Card', 'Bank'].map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label>Amount Paid</label>
                            <div className={styles.inputWrapper}>
                                <span className={styles.prefix}>₹</span>
                                <input 
                                    type="text" 
                                    value={payments[0].amountPaid} 
                                    onChange={(e) => handlePaymentChange(payments[0].id, "amountPaid", e.target.value)}
                                />
                            </div>
                            {isOverTarget && payments.length === 1 && (
                                <div style={{ color: '#E9315D', fontSize: '10px', marginTop: '4px' }}>
                                    Amount paid can not excceded total amount paid
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reference Field Row - Below Payment Type */}
                    {getReferenceLabel(payments[0].paymentType) && (
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label>{getReferenceLabel(payments[0].paymentType)}</label>
                                <div className={styles.inputWrapper}>
                                    <input 
                                        type="text" 
                                        placeholder={`Enter ${getReferenceLabel(payments[0].paymentType).toLowerCase()}`}
                                        value={payments[0].referenceNumber}
                                        onChange={(e) => handlePaymentChange(payments[0].id, "referenceNumber", e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Additional Payments: Only Type and Amount */}
                    {payments.slice(1).map((p, idx) => (
                        <div key={p.id} className={styles.additionalPaymentEntry}>
                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label>Payment Type #{idx + 2}</label>
                                    <select 
                                        value={p.paymentType} 
                                        onChange={(e) => handlePaymentChange(p.id, "paymentType", e.target.value)}
                                    >
                                        {['Cash', 'Cheque', 'UPI', 'Card', 'Bank'].map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.field}>
                                    <div className={styles.labelWithAction}>
                                        <label>Amount Paid</label>
                                        <button className={styles.miniRemove} onClick={() => handleRemovePayment(p.id)}>
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                    <div className={styles.inputWrapper}>
                                        <span className={styles.prefix}>₹</span>
                                        <input 
                                            type="number" 
                                            placeholder="0" 
                                            value={p.amountPaid}
                                            onChange={(e) => handlePaymentChange(p.id, "amountPaid", e.target.value)}
                                        />
                                    </div>
                                    {isOverTarget && idx === payments.length - 2 && (
                                        <div style={{ color: '#E9315D', fontSize: '10px', marginTop: '4px' }}>
                                            Amount paid can not excceded total amount paid
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className={styles.addPaymentLink} onClick={handleAddPayment}>
                        +ADD ANOTHER PAYMENT
                    </div>

                    <div className={styles.field}>
                        <label>Add Description</label>
                        <textarea 
                            placeholder="Lorem ipsum dolor sit..." 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Add Image</label>
                        <div className={styles.imageUpload}>
                            <label htmlFor="transactionImage" className={styles.uploadTrigger}>
                                Choose file
                            </label>
                            <input 
                                id="transactionImage"
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                            />
                            <span className={styles.fileName}>
                                {selectedImage ? selectedImage.name : "No file Choosen"}
                            </span>
                        </div>
                        {imagePreview && (
                            <div className={styles.previewContainer}>
                                <img src={imagePreview} alt="Preview" className={styles.preview} />
                                <button className={styles.removeImg} onClick={() => {setSelectedImage(null); setImagePreview(null);}}>
                                    <FiX />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className={styles.saveBtn} onClick={handleSave} disabled={loading || isOverTarget}>
                        {loading ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentDetailsPopup;
