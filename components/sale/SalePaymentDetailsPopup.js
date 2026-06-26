import { toApiDateOnly } from "@/utilities/date-time-utils";
import React, { useState, useEffect } from "react";
import styles from "../../styles/purchase-bill/payment-details-popup.module.css";
import { FiX, FiCalendar, FiPlus, FiTrash2 } from "react-icons/fi";
import { saleService } from "../../services/saleService";
import useStore from "../../components/state/useStore";
import { toast } from "sonner";
import { dateOnlyWithTimeZone, parseWallClockDate } from "@/utilities/date-time-utils";

const SalePaymentDetailsPopup = ({ isOpen, onClose, data, onRefresh }) => {
    const { jwtToken, userInfo } = useStore();
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Global States
    const [amountPaidDate, setAmountPaidDate] = useState(toApiDateOnly(new Date()));
    const [description, setDescription] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // Multi-payment state
    const [masterTarget, setMasterTarget] = useState("");
    const [payments, setPayments] = useState([{
        amountPaid: "",
        paymentType: "Cash",
        referenceNumber: "",
        id: Date.now()
    }]);

    const sessionTotal = payments.reduce((acc, p) => acc + (Number(p.amountPaid) || 0), 0);
    const isOverTarget = sessionTotal > (Number(masterTarget) || 0);
    const hasMismatch = Number(masterTarget) > 0 && sessionTotal > 0 && Math.abs(sessionTotal - Number(masterTarget)) > 0.01;

    // Calculated / Read-only values from props
    const totalAmount = data?.totalAmount || 0;
    const previousPaidAmount = data?.previousPaidAmount || 0;

    const initialBalance = (data?.balanceAmount && Number(data.balanceAmount) > 0) ? Number(data.balanceAmount) : totalAmount;
    const balanceAmount = Math.max(0, initialBalance - (Number(masterTarget) || 0));

    const today = toApiDateOnly(new Date());

    useEffect(() => {
        if (isOpen && data) {
            setIsSubmitted(false);
            setMasterTarget("");
            setPayments([{
                amountPaid: "",
                paymentType: "Cash",
                referenceNumber: "",
                id: Date.now()
            }]);
            setDescription("");
            setSelectedImage(null);
            setImagePreview(null);
        }
    }, [isOpen, data]);

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
            // Allow only numbers and decimal point
            cleanedValue = value.replace(/[^0-9.]/g, '');
            const parts = cleanedValue.split('.');
            if (parts.length > 2) return;
            // Remove leading zero unless it's followed by a decimal point
            cleanedValue = cleanedValue.replace(/^0+(?=\d)/, '');
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
        setIsSubmitted(true);

        if (!masterTarget || Number(masterTarget) <= 0) {
            return;
        }

        const hasEmptyPayment = payments.some(p => !p.amountPaid || Number(p.amountPaid) <= 0);
        if (hasEmptyPayment) {
            return;
        }

        if (Math.abs(sessionTotal - Number(masterTarget)) > 0.01) {
            return;
        }

        setLoading(true);
        try {
            const paymentMethods = payments.map(p => ({
                paymentMethod: p.paymentType,
                amount: parseFloat(p.amountPaid),
                transactionRef: p.referenceNumber || "",
                referenceNumber: p.referenceNumber || ""
            }));

            const payload = {
                branchId: data.branchId,
                vendorCustomerId: data.vendorCustomerId,
                paymentStatus: "Completed",
                paymentFrom: "sale invoice",
                createdBy: userInfo?.userId || userInfo?.id || 1,
                description: description || `Payment against Sale Invoice #${data.userOrderId}`,
                paymentMethods,
                userOrderId: data.userOrderId ? parseInt(data.userOrderId) : null
            };
            Object.assign(payload, dateOnlyWithTimeZone('paymentDate', parseWallClockDate(amountPaidDate) || new Date(amountPaidDate)));

            const res = await saleService.createPayment(jwtToken, payload);

            let createdPaymentId = null;
            if (res && (res.status === "success" || res.data?.status === "success")) {
                const resData = res.data?.data || res.data;
                if (Array.isArray(resData)) {
                    createdPaymentId = resData[0]?.paymentId;
                } else if (resData && typeof resData === 'object') {
                    if (Array.isArray(resData.data)) {
                        createdPaymentId = resData.data[0]?.paymentId;
                    } else {
                        createdPaymentId = resData.paymentId || resData.data?.paymentId || resData.id || resData.data?.id;
                    }
                }

                if (selectedImage && createdPaymentId) {
                    try {
                        const imgFormData = new FormData();
                        imgFormData.append("paymentImg", selectedImage);
                        imgFormData.append("transactionImg", selectedImage);
                        imgFormData.append("image", selectedImage);
                        imgFormData.append("vendorCustomerId", data.vendorCustomerId);
                        imgFormData.append("branchId", data.branchId);
                        imgFormData.append("createdBy", userInfo?.userId || userInfo?.id || 1);
                        await saleService.uploadPaymentImage(jwtToken, createdPaymentId, imgFormData);
                    } catch (uploadErr) {
                        console.error("Error uploading payment image:", uploadErr);
                    }
                }

                toast.success("Payment recorded successfully");
                if (onRefresh) onRefresh();
                onClose();
            } else {
                const errorMsg = res?.message || res?.data?.message || "Failed to save payment";
                toast.error(errorMsg);
            }
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
                    {/* Row 1: Date (Global) and total amount paid target */}
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
                            <label>Total Amount Paid *</label>
                            <div className={styles.inputWrapper}>
                                <span className={styles.prefix}>₹</span>
                                <input
                                    type="text"
                                    placeholder="0"
                                    value={masterTarget}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9.]/g, '');
                                        const parts = val.split('.');
                                        if (parts.length > 2) return;
                                        setMasterTarget(val);
                                    }}
                                />
                            </div>
                            {isSubmitted && (!masterTarget || Number(masterTarget) <= 0) && (
                                <div style={{ color: '#E9315D', fontSize: '11px', marginTop: '4px' }}>
                                    Total Amount Paid is required
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Row 2: Readonly Summaries */}
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

                    {/* Row 3: First Payment Type and Amount */}
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
                            <label>Amount Paid *</label>
                            <div className={styles.inputWrapper}>
                                <span className={styles.prefix}>₹</span>
                                <input
                                    type="text"
                                    placeholder="0"
                                    value={payments[0].amountPaid}
                                    onChange={(e) => handlePaymentChange(payments[0].id, "amountPaid", e.target.value)}
                                />
                            </div>
                            {isSubmitted && (!payments[0].amountPaid || Number(payments[0].amountPaid) <= 0) && (
                                <div style={{ color: '#E9315D', fontSize: '11px', marginTop: '4px' }}>
                                    Amount Paid is required
                                </div>
                            )}
                            {isOverTarget && payments.length === 1 ? (
                                <div style={{ color: '#E9315D', fontSize: '10px', marginTop: '4px' }}>
                                    Amount paid can not exceeded total amount paid
                                </div>
                            ) : (hasMismatch && payments.length === 1 && (
                                <div style={{ color: '#E9315D', fontSize: '10px', marginTop: '4px' }}>
                                    The sum of payments (₹ {sessionTotal}) does not match the Total Amount Paid (₹ {masterTarget || 0})
                                </div>
                            ))}
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
                                        onChange={(e) => handlePaymentChange(payments[0].id, "referenceNumber", e.target.value.replace(/[^0-9]/g, ''))}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Additional Payments: Type and Amount */}
                    {payments.slice(1).map((p, idx) => (
                        <div key={p.id} className={styles.additionalPaymentEntry}>
                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label>Payment Type {idx + 2}</label>
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
                                        <label>Amount Paid *</label>
                                        <button className={styles.miniRemove} onClick={() => handleRemovePayment(p.id)}>
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                    <div className={styles.inputWrapper}>
                                        <span className={styles.prefix}>₹</span>
                                        <input
                                            type="text"
                                            placeholder="0"
                                            value={p.amountPaid}
                                            onChange={(e) => handlePaymentChange(p.id, "amountPaid", e.target.value)}
                                        />
                                    </div>
                                    {isSubmitted && (!p.amountPaid || Number(p.amountPaid) <= 0) && (
                                        <div style={{ color: '#E9315D', fontSize: '11px', marginTop: '4px' }}>
                                            Amount Paid is required
                                        </div>
                                    )}
                                    {isOverTarget && idx === payments.length - 2 ? (
                                        <div style={{ color: '#E9315D', fontSize: '10px', marginTop: '4px' }}>
                                            Amount paid can not exceeded total amount paid
                                        </div>
                                    ) : (hasMismatch && idx === payments.length - 2 && (
                                        <div style={{ color: '#E9315D', fontSize: '10px', marginTop: '4px' }}>
                                            The sum of payments (₹ {sessionTotal}) does not match the Total Amount Paid (₹ {masterTarget || 0})
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {getReferenceLabel(p.paymentType) && (
                                <div className={styles.row}>
                                    <div className={styles.field}>
                                        <label>{getReferenceLabel(p.paymentType)}</label>
                                        <div className={styles.inputWrapper}>
                                            <input
                                                type="text"
                                                placeholder={`Enter ${getReferenceLabel(p.paymentType).toLowerCase()}`}
                                                value={p.referenceNumber}
                                                onChange={(e) => handlePaymentChange(p.id, "referenceNumber", e.target.value.replace(/[^0-9]/g, ''))}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    <div className={styles.addPaymentLink} onClick={handleAddPayment}>
                        +ADD ANOTHER PAYMENT
                    </div>

                    <div className={styles.field}>
                        <label>Add Description</label>
                        <textarea
                            placeholder="Enter Descrition"
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
                                {selectedImage ? selectedImage.name : "No file Chosen"}
                            </span>
                        </div>
                        {imagePreview && (
                            <div className={styles.previewContainer}>
                                <img src={imagePreview} alt="Preview" className={styles.preview} />
                                <button className={styles.removeImg} onClick={() => { setSelectedImage(null); setImagePreview(null); }}>
                                    <FiX />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className={styles.saveBtn} onClick={handleSave} disabled={loading || isOverTarget || hasMismatch}>
                        {loading ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SalePaymentDetailsPopup;
