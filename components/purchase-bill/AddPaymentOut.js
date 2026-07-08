import { getBoolSetting } from "@/utilities/settings-utils";
import { toApiDateOnly } from "@/utilities/date-time-utils";
import React, { useState, useEffect } from "react";
import { dateOnlyWithTimeZone, withTimeZone, parseWallClockDate } from "@/utilities/date-time-utils";
import styles from "../../styles/purchase-bill/add-payment-out.module.css";
import { FiX, FiCalendar, FiPlus, FiTrash2 } from "react-icons/fi";
import { purchaseService } from "../../services/purchaseService";
import useStore from "../../components/state/useStore";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { toast } from "sonner";
import useCurrencySymbol from "@/components/utilities/useCurrencySymbol";
import { getAmountDecimalPlaces } from "../utilities/formatAmount";
import LinkPaymentPopup from "../shared/link-payment-popup";

const AddPaymentOut = ({ isOpen, onClose, onRefresh }) => {
  const currencySymbol = useCurrencySymbol();

    const { jwtToken, userInfo, vendorSettings } = useStore();
    const cashSaleByDefault = getBoolSetting(vendorSettings, 'cashSaleByDefault', true);
    const addTimeOnTransactions = getBoolSetting(vendorSettings, 'addTimeOnTransactions', false);
    const linkPaymentsToInvoices = getBoolSetting(vendorSettings, 'linkPaymentsToInvoices', false);
    const { branchId } = useDashboardData({ skipReviews: true });
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState("");
    const [supplierTotals, setSupplierTotals] = useState(null);
    const [transactionDate, setTransactionDate] = useState(toApiDateOnly(new Date()));
    const [transactionTime, setTransactionTime] = useState("");
    const [description, setDescription] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [editablePaidAmount, setEditablePaidAmount] = useState("");
    const [errors, setErrors] = useState({});
    
    // Link payment states
    const [showLinkPopup, setShowLinkPopup] = useState(false);
    const [showHistoryPopup, setShowHistoryPopup] = useState(false);
    const [linkedTxns, setLinkedTxns] = useState([]);

    // Multi-payment state
    const [payments, setPayments] = useState([{
        amountPaid: "",
        paymentType: cashSaleByDefault ? "Cash" : "",
        refNo: "",
        id: Date.now()
    }]);

    const currentTotalAllocated = payments.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0);
    const isUnbalanced = Number(editablePaidAmount) > 0 && Math.abs(currentTotalAllocated - Number(editablePaidAmount)) > 0.01;

    useEffect(() => {
        if (isOpen) {
            setPayments([{ paymentType: cashSaleByDefault ? "Cash" : "", amountPaid: "", refNo: "", id: Date.now() }]);
        if (addTimeOnTransactions) {
            const now = new Date();
            setTransactionTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
        }
        }
    }, [isOpen, cashSaleByDefault]);

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
    }, [isOpen, cashSaleByDefault]);

    const handleSupplierChange = async (supplierId) => {
        setSelectedSupplierId(supplierId);
        setErrors(prev => {
            const newErr = { ...prev };
            delete newErr.supplierId;
            return newErr;
        });
        if (!supplierId) {
            setSupplierTotals(null);
            setEditablePaidAmount("");
            return;
        }
        try {
            const res = await purchaseService.getSupplierTransactions(jwtToken, supplierId, branchId);
            if (res.status === "success") {
                const totals = res.totals?.[0] || null;
                setSupplierTotals(totals);
                setEditablePaidAmount("0");
                setLinkedTxns([]);
            }
        } catch (error) {
            console.error("Error fetching supplier totals:", error);
        }
    };

    const handleAddPayment = () => {
        setPayments([...payments, {
            amountPaid: "",
            paymentType: cashSaleByDefault ? "Cash" : "",
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
        if (field === "amountPaid") {
            setErrors(prev => {
                const newErr = { ...prev };
                delete newErr[`payment_${id}`];
                delete newErr.unbalanced;
                return newErr;
            });
        }
    };

    const handleSave = async () => {
        const newErrors = {};

        if (!selectedSupplierId) {
            newErrors.supplierId = "Supplier is required";
        }

        if (!transactionDate) {
            newErrors.transactionDate = "Amount paid date is required";
        } else {
            const today = new Date();
            const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
            const [year, month, day] = transactionDate.split('-').map(Number);
            const selectedDateOnly = new Date(year, month - 1, day, 0, 0, 0, 0);

            if (selectedDateOnly > todayDateOnly) {
                newErrors.transactionDate = "Amount paid date cannot be in the future";
            } else if (selectedDateOnly.getTime() === todayDateOnly.getTime() && addTimeOnTransactions && transactionTime) {
                const [hours, minutes] = transactionTime.split(':').map(Number);
                const enteredDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
                if (enteredDateTime > today) {
                    newErrors.transactionTime = "Amount paid time cannot be in the future";
                }
            }
        }

        const totalAmountToBePaid = Number(editablePaidAmount);
        if (!editablePaidAmount || isNaN(totalAmountToBePaid) || totalAmountToBePaid <= 0) {
            newErrors.totalAmountPaid = "Total amount paid is required";
        }

        const currentTotalPaid = payments.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0);
        if (totalAmountToBePaid > 0 && Math.abs(currentTotalPaid - totalAmountToBePaid) > 0.01) {
            newErrors.unbalanced = `The sum of payments (${currencySymbol} ${currentTotalPaid}) does not match the Total Amount Paid (₹ ${totalAmountToBePaid})`;
        }

        payments.forEach(p => {
            const amt = Number(p.amountPaid || 0);
            if (!p.amountPaid || isNaN(amt) || amt <= 0) {
                newErrors[`payment_${p.id}`] = "Amount paid is required";
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error("Please fill all required fields correctly");
            return;
        }

        const validPayments = payments.filter(p => Number(p.amountPaid) > 0);

        setLoading(true);
        try {
            const payload = {
                debitOrCredit: "Debit",
                paymentFrom: "payment out",
                branchId: branchId,
                supplierId: Number(selectedSupplierId),
                ...(addTimeOnTransactions && transactionTime
                    ? withTimeZone(
                          "userTransactionDate",
                          new Date(`${transactionDate}T${transactionTime}:00`)
                      )
                    : dateOnlyWithTimeZone(
                          "userTransactionDate",
                          parseWallClockDate(transactionDate) || new Date(transactionDate)
                      )),
                transactionInfo: description || "",
                createdBy: userInfo?.userId || 1,
                productsBillId: null,
                ...(linkedTxns.length > 0 ? {
                    bills: linkedTxns.map(t => ({
                        productsBillId: Number(t.id || t.productsBillId),
                        amount: Number(t.linkedAmount)
                    }))
                } : {}),
                paymentTypes: validPayments.map(p => ({
                    paymentType: p.paymentType,
                    amount: Number(p.amountPaid),
                    referenceNumber: p.refNo || ""
                }))
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
                        <label>Name / Phone number <span style={{ color: '#FF4D4F' }}>*</span></label>
                        <select
                            className={`${styles.select} ${errors.supplierId ? styles.inputError : ""}`}
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
                        {errors.supplierId && (
                            <span style={{ color: '#FF4D4F', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.supplierId}</span>
                        )}
                    </div>

                    {/* Row 1: Date and Total Amount Paid */}
                    <div className={styles.gridRow}>
                        <div className={styles.field}>
                            <label>Amount paid date <span style={{ color: '#FF4D4F' }}>*</span></label>
                            <input
                                type="date"
                                className={`${styles.input} ${errors.transactionDate ? styles.inputError : ""}`}
                                value={transactionDate}
                                max={toApiDateOnly(new Date())}
                                onChange={(e) => {
                                    setTransactionDate(e.target.value);
                                    if (e.target.value) {
                                        setErrors(prev => {
                                            const newErr = { ...prev };
                                            delete newErr.transactionDate;
                                            delete newErr.transactionTime;
                                            return newErr;
                                        });
                                    }
                                }}
                            />
                            {errors.transactionDate && (
                                <span style={{ color: '#FF4D4F', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.transactionDate}</span>
                            )}
                        </div>

                        {addTimeOnTransactions && (
                            <div className={styles.field}>
                                <label>Amount paid time</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <select 
                                        className={styles.input} 
                                        style={{ width: '30%', padding: '14px 8px' }}
                                        value={transactionTime ? String(parseInt(transactionTime.split(':')[0]) % 12 || 12).padStart(2, '0') : '12'}
                                        onChange={(e) => {
                                            const h = parseInt(e.target.value);
                                            const m = transactionTime ? transactionTime.split(':')[1] : '00';
                                            const isPm = transactionTime ? parseInt(transactionTime.split(':')[0]) >= 12 : false;
                                            const newH = isPm ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
                                            setTransactionTime(`${String(newH).padStart(2, '0')}:${m}`);
                                            setErrors(prev => {
                                                const newErr = { ...prev };
                                                delete newErr.transactionTime;
                                                return newErr;
                                            });
                                        }}
                                    >
                                        {[...Array(12)].map((_, i) => {
                                            const val = String(i + 1).padStart(2, '0');
                                            return <option key={val} value={val}>{val}</option>;
                                        })}
                                    </select>
                                    <span style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>:</span>
                                    <select 
                                        className={styles.input} 
                                        style={{ width: '30%', padding: '14px 8px' }}
                                        value={transactionTime ? transactionTime.split(':')[1] : '00'}
                                        onChange={(e) => {
                                            const currentH = transactionTime ? transactionTime.split(':')[0] : '00';
                                            setTransactionTime(`${currentH}:${e.target.value}`);
                                            setErrors(prev => {
                                                const newErr = { ...prev };
                                                delete newErr.transactionTime;
                                                return newErr;
                                            });
                                        }}
                                    >
                                        {[...Array(60)].map((_, i) => {
                                            const val = String(i).padStart(2, '0');
                                            return <option key={val} value={val}>{val}</option>;
                                        })}
                                    </select>
                                    <select 
                                        className={styles.input} 
                                        style={{ width: '35%', padding: '14px 8px' }}
                                        value={transactionTime && parseInt(transactionTime.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                                        onChange={(e) => {
                                            const currentH = parseInt(transactionTime ? transactionTime.split(':')[0] : '00');
                                            const m = transactionTime ? transactionTime.split(':')[1] : '00';
                                            const isPm = e.target.value === 'PM';
                                            let newH = currentH;
                                            if (isPm && currentH < 12) newH = currentH + 12;
                                            if (!isPm && currentH >= 12) newH = currentH - 12;
                                            setTransactionTime(`${String(newH).padStart(2, '0')}:${m}`);
                                            setErrors(prev => {
                                                const newErr = { ...prev };
                                                delete newErr.transactionTime;
                                                return newErr;
                                            });
                                        }}
                                    >
                                        <option value="AM">AM</option>
                                        <option value="PM">PM</option>
                                    </select>
                                </div>
                                {errors.transactionTime && (
                                    <span style={{ color: '#FF4D4F', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.transactionTime}</span>
                                )}
                            </div>
                        )}

                        <div className={styles.field}>
                            <label>Total Amount Paid <span style={{ color: '#FF4D4F' }}>*</span></label>
                            <input
                                type="number"
                                className={`${styles.input} ${(isUnbalanced || errors.totalAmountPaid || errors.unbalanced) ? styles.inputError : ""}`}
                                placeholder="0"
                                value={editablePaidAmount}
                                onChange={(e) => {
                                    let val = e.target.value;
                                    if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
                                        val = val.substring(1);
                                    }
                                    setEditablePaidAmount(val);
                                    setErrors(prev => {
                                        const newErr = { ...prev };
                                        delete newErr.totalAmountPaid;
                                        delete newErr.unbalanced;
                                        return newErr;
                                    });
                                }}
                            />
                            {errors.totalAmountPaid && (
                                <span style={{ color: '#FF4D4F', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.totalAmountPaid}</span>
                            )}
                            {errors.unbalanced && (
                                <span style={{ color: '#FF4D4F', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.unbalanced}</span>
                            )}
                        </div>
                    </div>

                    {/* Row 2: Total Amount and Balance Amount */}
                    <div className={styles.gridRow}>
                        <div className={styles.field}>
                            <label>Total Amount</label>
                            <input
                                type="text"
                                className={`${styles.input} ${styles.readOnly}`}
                                value={(supplierTotals?.overallBillAmount || supplierTotals?.totalBillAmount) ? `${currencySymbol} ${Number(supplierTotals.overallBillAmount || supplierTotals.totalBillAmount).toLocaleString(undefined, { minimumFractionDigits: getAmountDecimalPlaces(), maximumFractionDigits: getAmountDecimalPlaces() })}` : "₹ 0"}
                                readOnly
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Balance Amount</label>
                            <input
                                type="text"
                                className={`${styles.input} ${styles.readOnly}`}
                                value={`${currencySymbol} ${(Number(supplierTotals?.totalBalanceAmount || 0) - Number(editablePaidAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: getAmountDecimalPlaces(), maximumFractionDigits: getAmountDecimalPlaces() })}`}
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
                                        <option value="" disabled hidden>Select Payment Type</option>
                                {['Cash', 'Cheque', 'UPI', 'Card', 'Bank'].map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.field}>
                                    <label>Amount Paid <span style={{ color: '#FF4D4F' }}>*</span></label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                            <input
                                                type="number"
                                                className={`${styles.input} ${(isUnbalanced || errors[`payment_${p.id}`]) ? styles.inputError : ""}`}
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
                                            {payments.length > 1 && idx > 0 && (
                                                <button className={styles.miniRemove} onClick={() => handleRemovePayment(p.id)}>
                                                    <FiTrash2 />
                                                </button>
                                            )}
                                        </div>
                                        {errors[`payment_${p.id}`] && (
                                            <span style={{ color: '#FF4D4F', fontSize: '12px', display: 'block' }}>{errors[`payment_${p.id}`]}</span>
                                        )}
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
                        {!linkPaymentsToInvoices && (
                            <div className={styles.addPaymentLink} onClick={handleAddPayment} style={{ margin: 0 }}>
                                +ADD ANOTHER PAYMENT
                            </div>
                        )}
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
                                    {Math.abs(Number(editablePaidAmount) - currentTotalAllocated).toDynamicFixed()}
                                </div>
                                <div style={{ fontSize: '11px', color: '#999' }}>
                                    Total Allocated: {currencySymbol} {currentTotalAllocated.toDynamicFixed()} / {currencySymbol} {Number(editablePaidAmount).toDynamicFixed()}
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
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
                        {linkPaymentsToInvoices && (
                            <button 
                                className={styles.linkPaymentBtn} 
                                onClick={() => selectedSupplierId ? setShowLinkPopup(true) : toast.error("Please select a supplier first")}
                            >
                                Link Payment 🔗
                            </button>
                        )}
                        {linkPaymentsToInvoices && linkedTxns.length > 0 && (
                            <button 
                                type="button" 
                                style={{ background: 'transparent', border: '1px solid #ccc', padding: '10px 16px', borderRadius: '4px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                                onClick={() => setShowHistoryPopup(true)}
                            >
                                Payment History
                            </button>
                        )}
                    </div>
                    <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
                    <button className={styles.saveBtn} onClick={handleSave} disabled={loading}>
                        {loading ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>

            {showHistoryPopup && (
                <div className={styles.overlay} style={{ zIndex: 2002, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className={styles.modal} style={{ minHeight: 'auto', maxHeight: '80vh', borderRadius: '8px', margin: 'auto', width: '90%', maxWidth: '600px', display: 'flex', flexDirection: 'column' }}>
                        <div className={styles.modalHeader}>
                            <h3>Linked Payment History</h3>
                            <button className={styles.closeBtn} onClick={() => setShowHistoryPopup(false)}><FiX /></button>
                        </div>
                        <div className={styles.modalContent} style={{ padding: '24px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ color: '#666', borderBottom: '1px solid #ddd' }}>
                                        <th style={{ paddingBottom: '8px' }}>Date</th>
                                        <th style={{ paddingBottom: '8px' }}>Type</th>
                                        <th style={{ paddingBottom: '8px' }}>Total</th>
                                        <th style={{ paddingBottom: '8px' }}>Linked Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {linkedTxns.map((t, i) => (
                                        <tr key={i}>
                                            <td style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>{t.orderDate || t.billDate || t.invoiceDate || t.createdAt || t.createdDate ? new Date(t.orderDate || t.billDate || t.invoiceDate || t.createdAt || t.createdDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}</td>
                                            <td style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>Sale</td>
                                            <td style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>{Number(t.totalAmount || t.overallBillAmount || 0).toFixed(2)}</td>
                                            <td style={{ padding: '12px 0', borderBottom: '1px solid #eee', fontWeight: 600 }}>{Number(t.linkedAmount).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <LinkPaymentPopup
                isOpen={showLinkPopup}
                onClose={() => setShowLinkPopup(false)}
                type="paymentOut"
                partyId={selectedSupplierId}
                partyName={suppliers.find(s => s.supplierId?.toString() === selectedSupplierId?.toString())?.supplierName}
                totalPaidAmount={editablePaidAmount}
                initialLinkedTxns={linkedTxns}
                onDone={(selections, newPaidAmount) => {
                    setLinkedTxns(selections);
                    setEditablePaidAmount(newPaidAmount);
                    setPayments(prev => {
                        if (prev.length === 1) {
                            return [{ ...prev[0], amountPaid: newPaidAmount }];
                        }
                        return prev;
                    });
                    setShowLinkPopup(false);
                }}
            />
        </div>
    );
};

export default AddPaymentOut;
