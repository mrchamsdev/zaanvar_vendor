import { toApiDateOnly, dateOnlyWithTimeZone, parseWallClockDate } from "@/utilities/date-time-utils";

import React, { useState, useEffect, useMemo, useRef } from "react";
import styles from "../../styles/sale/add-sale-invoice.module.css";
import { FiX, FiCalendar, FiChevronDown, FiTrash2 } from "react-icons/fi";
import { saleService } from "../../services/saleService";
import { useRouter } from "next/router";
import useStore from "../../components/state/useStore";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { toast } from "sonner";
import { IMAGE_URL } from "../utilities/Constants";

const AddPaymentIn = ({ isOpen, onClose, onRefresh, mode = 'add', paymentId }) => {
    const router = useRouter();
    const { jwtToken, userInfo } = useStore();
    const { branchId } = useDashboardData({ skipReviews: true });
    const isViewOnly = mode === 'view';

    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        vendorCustomerId: "",
        partyName: "",
        totalBalance: "",
        paidAmount: "",
        date: toApiDateOnly(new Date()),
        referenceNumber: "",
        description: "",
        image: null
    });

    const imagePreviewUrl = useMemo(() => {
        if (selectedImage) {
            try {
                return URL.createObjectURL(selectedImage);
            } catch (e) {
                return null;
            }
        }
        if (formData.image && typeof formData.image === 'string') {
            if (formData.image.startsWith('http')) {
                return formData.image;
            }
            return IMAGE_URL ? `${IMAGE_URL}${formData.image}` : formData.image;
        }
        return null;
    }, [selectedImage, formData.image]);

    const [payments, setPayments] = useState([
        { method: "Cash", amount: "", referenceNumber: "" }
    ]);

    useEffect(() => {
        if (isOpen) {
            fetchCustomers();
            if (mode !== 'add' && paymentId) {
                fetchPaymentDetails();
            } else {
                resetForm();
            }
        }
    }, [isOpen, mode, paymentId]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest(`.${styles.field}`)) {
                setShowCustomerDropdown(false);
            }
        };
        if (showCustomerDropdown) {
            window.addEventListener('mousedown', handleClickOutside);
        }
        return () => window.removeEventListener('mousedown', handleClickOutside);
    }, [showCustomerDropdown]);

    useEffect(() => {
        // Reset errors when modal is closed or mode changes to view
        if (!isOpen) {
            setErrors({});
            setFormError('');
        }
    }, [isOpen, mode]);


    const fetchCustomers = async () => {
        try {
            const res = await saleService.getCustomers(jwtToken, branchId);
            if (res.status === "success") {
                setCustomers(res.data || []);
            }
        } catch (error) {
            console.error("Error fetching customers:", error);
        }
    };

    const fetchPaymentDetails = async () => {
        setLoading(true);
        try {
            // Try fetching as a payment record first (since the list now provides paymentId)
            let res = await saleService.getPaymentById(jwtToken, paymentId);

            // Fallback to order details if payment fetch fails
            if (res.status === "error" || !res.data) {
                res = await saleService.getSaleInvoiceById(jwtToken, paymentId);
            }

            if (res.status === "success" && res.data) {
                const data = res.data;
                const isPayment = !!data.paymentId;

                setFormData({
                    vendorCustomerId: data.vendorCustomerId,
                    partyName: data.customer ? `${data.customer.firstName} ${data.customer.lastName}` : `Customer #${data.vendorCustomerId}`,
                    totalBalance: isPayment ? (data.order?.dueAmount || 0) : (data.dueAmount || 0),
                    paidAmount: isPayment ? (data.amount || 0) : (data.paidAmount || 0),
                    date: (data.paymentDate || data.createdDate) ? (data.paymentDate || data.createdDate).split('T')[0] : toApiDateOnly(new Date()),
                    referenceNumber: isPayment ? (data.transactionRef || (data.paymentMethods && data.paymentMethods.find(pm => pm.transactionRef)?.transactionRef) || "") : (data.userOrderId || ""),
                    description: data.description || "",
                    image: data.paymentImg || data.transactionImg || data.image || null
                });

                if (data.paymentMethods && data.paymentMethods.length > 0) {
                    setPayments(data.paymentMethods.map(pm => ({
                        method: pm.paymentMethod || "Cash",
                        amount: pm.amount || "",
                        referenceNumber: pm.referenceNumber || pm.transactionRef || ""
                    })));
                } else {
                    setPayments([{
                        method: data.paymentMethod || "Cash",
                        amount: isPayment ? (data.amount || "") : (data.paidAmount || ""),
                        referenceNumber: isPayment ? (data.referenceNumber || data.transactionRef || "") : ""
                    }]);
                }
                setSearchTerm(data.customer ? `${data.customer.firstName} ${data.customer.lastName}` : `Customer #${data.vendorCustomerId}`);
            }
        } catch (error) {
            console.error("Error fetching details:", error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            vendorCustomerId: "",
            partyName: "",
            totalBalance: "",
            paidAmount: "",
            date: toApiDateOnly(new Date()),
            referenceNumber: "",
            description: "",
            image: null
        });
        setPayments([{ method: "Cash", amount: "", referenceNumber: "" }]);
        setSearchTerm("");
        setSelectedImage(null);
        setErrors({});
    };

    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return customers;
        return customers.filter(c =>
            `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phoneNumber?.includes(searchTerm)
        );
    }, [customers, searchTerm]);

    const handleSelectCustomer = (customer) => {
        setFormData({
            ...formData,
            vendorCustomerId: customer.vendorCustomerId,
            partyName: `${customer.firstName} ${customer.lastName}`,
            totalBalance: customer.overallTotals?.dueAmount || 0
        });
        setSearchTerm(`${customer.firstName} ${customer.lastName}`);
        setShowCustomerDropdown(false);
        setErrors(prev => ({ ...prev, vendorCustomerId: undefined }));
    };

    const handleAddPaymentRow = () => {
        setPayments([...payments, { method: "Cash", amount: "", referenceNumber: "" }]);
    };

    const handleRemovePaymentRow = (index) => {
        const newPayments = payments.filter((_, i) => i !== index);
        setPayments(newPayments.length > 0 ? newPayments : [{ method: "Cash", amount: "", referenceNumber: "" }]);

        const totalPaid = newPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
        const paidAmountNum = parseFloat(formData.paidAmount);

        setErrors(prev => {
            const updated = {};
            Object.keys(prev).forEach(key => {
                if (key.startsWith('paymentAmount_')) {
                    const idx = parseInt(key.split('_')[1]);
                    if (idx < index) {
                        updated[key] = prev[key];
                    } else if (idx > index) {
                        updated[`paymentAmount_${idx - 1}`] = prev[key];
                    }
                } else {
                    updated[key] = prev[key];
                }
            });

            if (!isNaN(paidAmountNum) && totalPaid > paidAmountNum) {
                updated.paymentsTotal = `Total of all payment methods (₹${totalPaid}) cannot exceed Paid Amount (₹${paidAmountNum})`;
            } else {
                updated.paymentsTotal = undefined;
            }

            return updated;
        });
    };

    const handlePaymentChange = (index, field, val) => {
        const newPayments = [...payments];
        let sanitizedVal = val;
        if (field === 'amount') {
            let cleanVal = val.replace(/[^0-9.]/g, '');
            const dotCount = (cleanVal.match(/\./g) || []).length;
            if (dotCount > 1) return;
            sanitizedVal = cleanVal;
        }
        newPayments[index][field] = sanitizedVal;
        setPayments(newPayments);

        const totalPaid = newPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
        const paidAmountNum = parseFloat(formData.paidAmount);

        setErrors(prev => {
            const updated = {
                ...prev,
                [`paymentAmount_${index}`]: undefined
            };
            if (!isNaN(paidAmountNum) && totalPaid > paidAmountNum) {
                updated.paymentsTotal = `Total of all payment methods (₹${totalPaid}) cannot exceed Paid Amount (₹${paidAmountNum})`;
            } else {
                updated.paymentsTotal = undefined;
            }
            return updated;
        });
    };

    const handleSave = async () => {
        const newErrors = {};
        if (!formData.vendorCustomerId) {
            newErrors.vendorCustomerId = "Customer name is required";
        }

        const paidAmountNum = parseFloat(formData.paidAmount);
        if (!formData.paidAmount || isNaN(paidAmountNum) || paidAmountNum <= 0) {
            newErrors.paidAmount = "Paid amount is required";
        }

        payments.forEach((p, idx) => {
            const pAmountNum = parseFloat(p.amount);
            if (!p.amount || isNaN(pAmountNum) || pAmountNum <= 0) {
                newErrors[`paymentAmount_${idx}`] = "Amount paid is required";
            }
        });

        const totalPaid = payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
        if (!newErrors.paidAmount && totalPaid > paidAmountNum) {
            newErrors.paymentsTotal = `Total of all payment methods (₹${totalPaid}) cannot exceed Paid Amount (₹${paidAmountNum})`;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            let res;
            if (mode === 'edit' && paymentId) {
                const validPayments = payments.filter(p => parseFloat(p.amount) > 0);
                const paymentMethods = validPayments.map(p => ({
                    paymentMethod: p.method,
                    amount: parseFloat(p.amount),
                    transactionRef: p.referenceNumber || "",
                    referenceNumber: p.referenceNumber || ""
                }));

                const updatePayload = {
                    branchId,
                    vendorCustomerId: formData.vendorCustomerId,
                    paymentStatus: "Completed",
                    paymentFrom: "sale invoice",
                    createdBy: userInfo?.userId || userInfo?.id || 1,
                    description: formData.description,
                    paymentMethods
                };
                Object.assign(updatePayload, dateOnlyWithTimeZone('paymentDate', parseWallClockDate(formData.date) || new Date(formData.date)));
                res = await saleService.updatePayment(jwtToken, paymentId, updatePayload);
            } else {
                const validPayments = payments.filter(p => parseFloat(p.amount) > 0);
                const paymentMethods = validPayments.map(p => ({
                    paymentMethod: p.method,
                    amount: parseFloat(p.amount),
                    transactionRef: p.referenceNumber || "",
                    referenceNumber: p.referenceNumber || ""
                }));

                const payload = {
                    branchId,
                    vendorCustomerId: formData.vendorCustomerId,
                    paymentStatus: "Completed",
                    paymentFrom: "sale invoice",
                    createdBy: userInfo?.userId || userInfo?.id || 1,
                    description: formData.description,
                    paymentMethods
                };
                Object.assign(payload, dateOnlyWithTimeZone('paymentDate', parseWallClockDate(formData.date) || new Date(formData.date)));

                res = await saleService.createPayment(jwtToken, payload);
            }

            console.log("Full Response Object:", res);
            if (res && (res.status === "success" || res.data?.status === "success")) {
                let createdPaymentId = paymentId;
                if (!createdPaymentId) {
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
                }

                if (selectedImage && createdPaymentId) {
                    try {
                        const imgFormData = new FormData();
                        imgFormData.append("paymentImg", selectedImage);
                        imgFormData.append("transactionImg", selectedImage);
                        imgFormData.append("image", selectedImage);
                        imgFormData.append("vendorCustomerId", formData.vendorCustomerId);
                        imgFormData.append("branchId", branchId);
                        imgFormData.append("createdBy", userInfo?.userId || userInfo?.id || 1);
                        await saleService.uploadPaymentImage(jwtToken, createdPaymentId, imgFormData);
                    } catch (uploadErr) {
                        console.error("Error uploading payment image during save:", uploadErr);
                    }
                }

                toast.success(mode === 'edit' ? "Payment updated successfully" : "Payment added successfully");
                onRefresh();

                const targetBranchId = router.query.branchId || branchId;
                router.push(`/sale/payment-in?branchId=${targetBranchId}`).then(() => {
                    onClose();
                });
            } else {
                const errorMsg = res?.message || res?.data?.message || "Failed to save payment";
                toast.error(errorMsg);
                console.error("Save failed with message:", errorMsg);
            }
        } catch (error) {
            console.error("Error during handleSave:", error);
            const apiError = error.response?.data?.message || error.message;
            toast.error(`Error: ${apiError}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h3>{mode === 'add' ? 'Add Payment In' : (mode === 'view' ? 'View Payment In' : 'Edit Payment In')}</h3>
                    <FiX className={styles.closeBtn} onClick={onClose} />
                </div>

                <div className={styles.modalContent} style={{ padding: '32px 40px' }}>
                    <div className={styles.topGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div className={styles.field} style={{ position: 'relative' }}>
                            <label>Select Customer</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    className={`${styles.input} ${errors.vendorCustomerId ? styles.inputError : ''}`}
                                    placeholder="Select Name"
                                    value={searchTerm}
                                    onFocus={() => setShowCustomerDropdown(true)}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setShowCustomerDropdown(true);
                                        setErrors(prev => ({ ...prev, vendorCustomerId: undefined }));
                                    }}
                                    disabled={isViewOnly}
                                />
                                <FiChevronDown style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                            </div>
                            {errors.vendorCustomerId && <span className={styles.errorMsg}>{errors.vendorCustomerId}</span>}
                            {showCustomerDropdown && filteredCustomers.length > 0 && (
                                <div className={styles.dropdownList} style={{ top: '100%', width: '100%' }}>
                                    {filteredCustomers.map(c => (
                                        <div key={c.vendorCustomerId} className={styles.dropdownItem} onClick={() => handleSelectCustomer(c)}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ fontWeight: '600' }}>{c.firstName} {c.lastName}</span>
                                                <span style={{ color: '#999' }}>{c.phoneNumber}</span>
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#E93E64', marginTop: '4px' }}>
                                                Bal: ₹{c.overallTotals?.dueAmount || 0}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={styles.field}>
                            <label>Date</label>
                            <input
                                type="date"
                                className={styles.input}
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                disabled={isViewOnly}
                            />
                        </div>

                        <div className={styles.field}>
                            <label>Total Balance Amount</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={`₹ ${formData.totalBalance}`}
                                readOnly
                                style={{ border: '1px solid #eee' }}
                            />
                        </div>

                        <div className={styles.field}>
                            <label>Paid Amount</label>
                            <input
                                type="text"
                                className={`${styles.input} ${errors.paidAmount ? styles.inputError : ''}`}
                                value={formData.paidAmount}
                                onChange={(e) => {
                                    const rawVal = e.target.value;
                                    let cleanVal = rawVal.replace(/[^0-9.]/g, '');
                                    const dotCount = (cleanVal.match(/\./g) || []).length;
                                    if (dotCount > 1) return;

                                    setFormData({ ...formData, paidAmount: cleanVal });
                                    // Also sync with first payment row if only one row exists
                                    let newPayments = payments;
                                    if (payments.length === 1) {
                                        newPayments = [...payments];
                                        newPayments[0].amount = cleanVal;
                                        setPayments(newPayments);
                                        setErrors(prev => ({ ...prev, paymentAmount_0: undefined }));
                                    }

                                    const totalPaid = newPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
                                    const num = parseFloat(cleanVal);
                                    setErrors(prev => {
                                        const updated = { ...prev, paidAmount: undefined };
                                        if (!isNaN(num) && totalPaid > num) {
                                            updated.paymentsTotal = `Total of all payment methods (₹${totalPaid}) cannot exceed Paid Amount (₹${num})`;
                                        } else {
                                            updated.paymentsTotal = undefined;
                                        }
                                        return updated;
                                    });
                                }}
                                disabled={isViewOnly}
                            />
                            {errors.paidAmount && <span className={styles.errorMsg}>{errors.paidAmount}</span>}
                        </div>
                    </div>

                    <div style={{ marginTop: '40px', borderTop: '1px solid #f0f0f0', paddingTop: '40px' }}>
                        <div style={{ width: '100%' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '24px', marginBottom: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#888', textTransform: 'uppercase' }}>Payment Type</label>
                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#888', textTransform: 'uppercase' }}>Amount Paid</label>
                                <div></div>
                            </div>
                            {payments.map((p, idx) => (
                                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '24px', marginBottom: '16px', alignItems: 'start' }}>
                                    <select
                                        className={styles.select}
                                        value={p.method}
                                        onChange={(e) => handlePaymentChange(idx, 'method', e.target.value)}
                                        disabled={isViewOnly}
                                        style={{ marginTop: '2px' }}
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Card">Card</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="Bank">Bank</option>
                                    </select>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                                        <input
                                            type="text"
                                            className={`${styles.input} ${errors[`paymentAmount_${idx}`] ? styles.inputError : ''}`}
                                            placeholder="0"
                                            value={p.amount}
                                            onChange={(e) => handlePaymentChange(idx, 'amount', e.target.value)}
                                            disabled={isViewOnly}
                                            style={{ width: '100%' }}
                                        />
                                        {errors[`paymentAmount_${idx}`] && <span className={styles.errorMsg}>{errors[`paymentAmount_${idx}`]}</span>}

                                        {(p.method === 'Cheque' || p.method === 'UPI') && (
                                            <input
                                                type="text"
                                                className={styles.input}
                                                placeholder={p.method === 'Cheque' ? "Cheque No" : "Enter reference number"}
                                                value={p.referenceNumber || ""}
                                                onChange={(e) => handlePaymentChange(idx, 'referenceNumber', e.target.value)}
                                                disabled={isViewOnly}
                                                style={{ width: '100%', height: '36px', padding: '6px 12px', fontSize: '12px', marginTop: '4px' }}
                                            />
                                        )}
                                    </div>
                                    {!isViewOnly && (
                                        <FiTrash2
                                            style={{ color: '#999', cursor: 'pointer', fontSize: '18px', marginTop: '12px' }}
                                            onClick={() => handleRemovePaymentRow(idx)}
                                        />
                                    )}
                                </div>
                            ))}
                            {errors.paymentsTotal && (
                                <div className={styles.errorMsg} style={{ marginTop: '-4px', marginBottom: '16px' }}>
                                    {errors.paymentsTotal}
                                </div>
                            )}
                            {!isViewOnly && (
                                <span
                                    className={styles.addBtn}
                                    style={{ marginTop: '8px' }}
                                    onClick={handleAddPaymentRow}
                                >
                                    + Add another payment
                                </span>
                            )}
                        </div>
                    </div>

                    <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                        <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                            <label>Add Description</label>
                            <textarea
                                className={styles.input}
                                placeholder="Enter description..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                disabled={isViewOnly}
                                style={{ height: '80px', resize: 'none' }}
                            ></textarea>
                        </div>
                        <div className={styles.field}>
                            <label>Add Image</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            background: '#666',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '10px 20px',
                                            borderRadius: '6px',
                                            cursor: isViewOnly ? 'default' : 'pointer',
                                            fontSize: '13px',
                                            fontWeight: '600'
                                        }}
                                        disabled={isViewOnly}
                                    >
                                        Choose file
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setSelectedImage(file);
                                            }
                                        }}
                                        accept="image/*"
                                        disabled={isViewOnly}
                                    />
                                    <span style={{ color: '#999', fontSize: '13px' }}>
                                        {selectedImage ? selectedImage.name : (formData.image && typeof formData.image === 'string' ? formData.image.split('/').pop() : "No file Chosen")}
                                    </span>
                                    {selectedImage && !isViewOnly && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedImage(null);
                                                if (fileInputRef.current) {
                                                    fileInputRef.current.value = "";
                                                }
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#ff4d4f',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                padding: 0
                                            }}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                                {imagePreviewUrl && (
                                    <div style={{ position: 'relative', marginTop: '8px' }}>
                                        <img
                                            src={imagePreviewUrl}
                                            alt="Preview"
                                            style={{
                                                maxWidth: '120px',
                                                maxHeight: '120px',
                                                borderRadius: '8px',
                                                border: '1px solid #ddd',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className={styles.shareBtn} onClick={onClose}>Share</button>
                    {isViewOnly && (
                        <button className={styles.saveBtn} onClick={() => window.print()} >Print</button>
                    )}
                    {!isViewOnly && (
                        <button className={styles.saveBtn} onClick={handleSave} disabled={loading}>
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddPaymentIn;
