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
import PrintInvoiceTemplate from "../shared/PrintInvoiceTemplate";

const AddPaymentIn = ({ isOpen, onClose, onRefresh, mode = 'add', paymentId, prefill }) => {
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
        image: null,
        userOrderId: ""
    });

    const [payments, setPayments] = useState([
        { method: "Cash", amount: "", referenceNumber: "" }
    ]);

    const [useWallet, setUseWallet] = useState(false);
    const [savedWalletAmount, setSavedWalletAmount] = useState(0);

    const selectedCustomerObj = useMemo(() => {
        if (formData.vendorCustomerId) {
            return customers.find(c => c.vendorCustomerId === formData.vendorCustomerId) || null;
        }
        return null;
    }, [customers, formData.vendorCustomerId]);

    const walletAmount = useMemo(() => {
        if (mode !== 'add' && useWallet && savedWalletAmount > 0) {
            return savedWalletAmount;
        }
        return selectedCustomerObj?.overallTotals?.walletAmount || selectedCustomerObj?.walletAmount || 0;
    }, [mode, useWallet, savedWalletAmount, selectedCustomerObj]);

    const appliedWalletAmount = useMemo(() => {
        if (!useWallet || walletAmount <= 0) return 0;
        if (mode !== 'add') {
            return walletAmount;
        }
        const paidAmountNum = parseFloat(formData.paidAmount) || 0;
        return Math.min(walletAmount, paidAmountNum);
    }, [useWallet, walletAmount, formData.paidAmount, mode]);

    useEffect(() => {
        if (payments.length === 1) {
            const paidNum = parseFloat(formData.paidAmount) || 0;
            const remaining = Math.max(0, paidNum - appliedWalletAmount);
            setPayments([{
                ...payments[0],
                amount: remaining > 0 ? remaining.toString() : ""
            }]);
        }
    }, [appliedWalletAmount]);

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

    useEffect(() => {
        if (isOpen) {
            if (prefill && Object.keys(prefill).length > 0) {
                const customer = prefill.customer || {};
                const custName = customer.firstName ? `${customer.firstName} ${customer.lastName}`.trim() : (prefill.partyName || "");
                const dueAmt = parseFloat(prefill.dueAmount || 0);

                setFormData({
                    vendorCustomerId: customer.vendorCustomerId || prefill.vendorCustomerId || "",
                    partyName: custName,
                    totalBalance: dueAmt.toFixed(2),
                    paidAmount: dueAmt > 0 ? dueAmt.toFixed(2) : "",
                    date: toApiDateOnly(new Date()),
                    referenceNumber: prefill.userOrderId ? prefill.userOrderId.toString() : "",
                    description: `Payment for Invoice #${prefill.userOrderId}`,
                    image: null,
                    userOrderId: prefill.userOrderId || ""
                });
                setPayments([{
                    method: "Cash",
                    amount: dueAmt > 0 ? dueAmt.toFixed(2) : "",
                    referenceNumber: ""
                }]);
                setSearchTerm(custName);
                setSelectedImage(null);
                setErrors({});
            } else if (mode !== 'add' && paymentId) {
                fetchPaymentDetails();
            } else {
                resetForm();
            }
        }
    }, [isOpen, mode, paymentId, prefill]);

    useEffect(() => {
        if (isOpen && jwtToken && branchId) {
            fetchCustomers();
        }
    }, [isOpen, jwtToken, branchId]);

    useEffect(() => {
        if (!loading && isOpen && mode === "view" && router.query.print === "true") {
            const timer = setTimeout(() => {
                window.print();
                if (router.query.pdf !== "true") {
                    const { print, ...rest } = router.query;
                    router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [loading, isOpen, mode, router.query.print, router.query.pdf]);

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
            let res;
            try {
                // Try fetching as a payment record first
                res = await saleService.getPaymentById(jwtToken, paymentId);
            } catch (err) {
                // If 400 or other error, fallback
                res = { status: "error" };
            }

            // Fallback to order details if payment fetch fails or errors
            if (!res || res.status === "error" || !res.data) {
                try {
                    res = await saleService.getSaleInvoiceById(jwtToken, paymentId);
                } catch(err) {
                    res = { status: "error" };
                }
            }

            if (res && res.status === "success" && res.data) {
                const data = res.data;
                const isPayment = !!data.paymentId;

                setFormData({
                    vendorCustomerId: data.vendorCustomerId,
                    partyName: data.customer ? `${data.customer.firstName} ${data.customer.lastName}` : `Customer #${data.vendorCustomerId}`,
                    totalBalance: data.dueAtTime ? Number(data.dueAtTime).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (isPayment ? (data.order?.dueAmount || 0) : (data.dueAmount || 0)),
                    paidAmount: isPayment ? (data.amount || 0) : (data.paidAmount || 0),
                    date: (data.paymentDate || data.createdDate) ? (data.paymentDate || data.createdDate).split('T')[0] : toApiDateOnly(new Date()),
                    referenceNumber: isPayment ? (data.transactionRef || (data.paymentMethods && data.paymentMethods.find(pm => pm.transactionRef)?.transactionRef) || "") : (data.userOrderId || ""),
                    description: data.description || "",
                    image: data.paymentImg || data.transactionImg || data.image || null,
                    userOrderId: data.userOrderId || (isPayment ? data.order?.userOrderId : "") || ""
                });

                let hasWalletPayment = false;
                let walletPaidAmt = 0;

                if (data.paymentMethods && data.paymentMethods.length > 0) {
                    const nonWallet = [];
                    data.paymentMethods.forEach(pm => {
                        const m = pm.paymentMethod || pm.method || "Cash";
                        if (m === "Wallet") {
                            hasWalletPayment = true;
                            walletPaidAmt = parseFloat(pm.amount || 0);
                        } else {
                            nonWallet.push({
                                method: m,
                                amount: pm.amount || "",
                                referenceNumber: pm.referenceNumber || pm.transactionRef || ""
                            });
                        }
                    });
                    setPayments(nonWallet.length > 0 ? nonWallet : [{ method: "Cash", amount: "", referenceNumber: "" }]);
                } else if (data.amount || data.paidAmount) {
                    const amt = isPayment ? (data.amount || 0) : (data.paidAmount || 0);
                    if (data.paymentMethod === "Wallet") {
                        hasWalletPayment = true;
                        walletPaidAmt = parseFloat(amt);
                        setPayments([{ method: "Cash", amount: "", referenceNumber: "" }]);
                    } else {
                        setPayments([{ method: data.paymentMethod || "Cash", amount: amt, referenceNumber: data.referenceNumber || data.transactionRef || "" }]);
                    }
                }
                setUseWallet(hasWalletPayment);
                setSavedWalletAmount(walletPaidAmt);
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
            image: null,
            userOrderId: ""
        });
        setPayments([{ method: "Cash", amount: "", referenceNumber: "" }]);
        setSearchTerm("");
        setSelectedImage(null);
        setErrors({});
        setUseWallet(false);
        setSavedWalletAmount(0);
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
        setUseWallet(false);
        setSavedWalletAmount(0);
    };

    const handleAddPaymentRow = () => {
        setPayments([...payments, { method: "Cash", amount: "", referenceNumber: "" }]);
    };

    const handleRemovePaymentRow = (index) => {
        const newPayments = payments.filter((_, i) => i !== index);
        setPayments(newPayments.length > 0 ? newPayments : [{ method: "Cash", amount: "", referenceNumber: "" }]);

        const totalPaid = newPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0) + appliedWalletAmount;
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

        const totalPaid = newPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0) + appliedWalletAmount;
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
        if (!formData.date) {
            newErrors.date = "Date is required";
        }

        const paidAmountNum = parseFloat(formData.paidAmount);
        if (!formData.paidAmount || isNaN(paidAmountNum) || paidAmountNum <= 0) {
            newErrors.paidAmount = "Paid amount is required";
        }

        const remainingToPay = paidAmountNum - appliedWalletAmount;
        if (remainingToPay > 0) {
            payments.forEach((p, idx) => {
                const pAmountNum = parseFloat(p.amount);
                if (!p.amount || isNaN(pAmountNum) || pAmountNum <= 0) {
                    newErrors[`paymentAmount_${idx}`] = "Amount paid is required";
                }
            });
        }

        const totalPaid = payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0) + appliedWalletAmount;
        if (!newErrors.paidAmount && totalPaid > paidAmountNum) {
            newErrors.paymentsTotal = `Total of all payment methods (₹${totalPaid}) cannot exceed Paid Amount (₹${paidAmountNum})`;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error("Please fill all required fields correctly");
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

                if (useWallet && appliedWalletAmount > 0) {
                    paymentMethods.push({
                        paymentMethod: "Wallet",
                        amount: appliedWalletAmount,
                        transactionRef: "Wallet Deduction",
                        referenceNumber: "Wallet Deduction"
                    });
                }

                const updatePayload = {
                    branchId,
                    vendorCustomerId: formData.vendorCustomerId,
                    paymentStatus: "Completed",
                    paymentFrom: "sale invoice",
                    createdBy: userInfo?.userId || userInfo?.id || 1,
                    description: formData.description,
                    paymentMethods,
                    userOrderId: formData.userOrderId ? parseInt(formData.userOrderId) : null
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

                if (useWallet && appliedWalletAmount > 0) {
                    paymentMethods.push({
                        paymentMethod: "Wallet",
                        amount: appliedWalletAmount,
                        transactionRef: "Wallet Deduction",
                        referenceNumber: "Wallet Deduction"
                    });
                }

                const payload = {
                    branchId,
                    vendorCustomerId: formData.vendorCustomerId,
                    paymentStatus: "Completed",
                    paymentFrom: "sale invoice",
                    createdBy: userInfo?.userId || userInfo?.id || 1,
                    description: formData.description,
                    paymentMethods,
                    userOrderId: formData.userOrderId ? parseInt(formData.userOrderId) : null
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

                if (prefill) {
                    onClose();
                } else {
                    const targetBranchId = router.query.branchId || branchId;
                    router.push(`/sale/payment-in?branchId=${targetBranchId}`).then(() => {
                        onClose();
                    });
                }
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

    const isPdf = router.query.pdf === 'true';

    if (isPdf) {
        const columns = [
            { header: "PAYMENT METHOD", accessor: "method", align: "left" },
            { header: "REFERENCE NO", accessor: "referenceNumber", align: "left" },
            { header: "AMOUNT", accessor: "amount", align: "right" }
        ];

        const summary = [
            { label: "Total Balance", value: `₹${formData.totalBalance || "0"}` },
            { label: "Paid Amount", value: `₹${formData.paidAmount || "0"}`, isTotal: true }
        ];

        return (
            <PrintInvoiceTemplate
                title="PAYMENT IN RECEIPT"
                customerDetails={{
                    name: formData.partyName || 'N/A'
                }}
                invoiceDetails={{
                    "Receipt No": paymentId || formData.referenceNumber || formData.userOrderId || 'N/A',
                    "Date": formData.date || 'N/A',
                    "Total Balance": `₹${formData.totalBalance || "0"}`,
                    "Paid Amount": `₹${formData.paidAmount || "0"}`
                }}
                columns={columns}
                items={[
                    ...(useWallet && appliedWalletAmount > 0 ? [{ method: 'Wallet', referenceNumber: 'Wallet Deduction', amount: appliedWalletAmount }] : []),
                    ...payments.filter(p => parseFloat(p.amount) > 0).map(p => ({
                        ...p,
                        referenceNumber: p.referenceNumber || formData.userOrderId || formData.referenceNumber || "-"
                    }))
                ]}
                summary={summary}
                notes={formData.description}
                onClose={() => window.close()}
            />
        );
    }

    return (
        <div className={`${styles.overlay}`}>
            <div className={`${styles.modal}`}>
                <div className={styles.modalHeader}>
                    <h3>{mode === 'add' ? 'Add Payment In' : (mode === 'view' ? 'View Payment In' : 'Edit Payment In')}</h3>
                    <FiX className={styles.closeBtn} onClick={onClose} />
                </div>

                <div className={styles.modalContent} style={{ padding: '32px 40px' }}>
                    {prefill && (
                        <div style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '24px',
                            marginBottom: '32px',
                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
                        }}>
                            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>Invoice Summary (Order #${prefill.userOrderId})</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                                <div style={{ background: '#fff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                    <span style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: '500', textTransform: 'uppercase' }}>Total Bill</span>
                                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Rs ${parseFloat(prefill.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div style={{ background: '#fff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                    <span style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: '500', textTransform: 'uppercase' }}>Total Paid</span>
                                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#1e8e3e' }}>Rs ${parseFloat(prefill.paidAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div style={{ background: '#fff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                    <span style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: '500', textTransform: 'uppercase' }}>Balance Due</span>
                                    <span style={{ fontSize: '18px', fontWeight: '700', color: parseFloat(prefill.dueAmount || 0) > 0 ? '#d93025' : '#1e8e3e' }}>Rs ${parseFloat(prefill.dueAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                            {prefill.cartItems && prefill.cartItems.length > 0 && (
                                <div>
                                    <span style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Items Summary</span>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {prefill.cartItems.map((item, index) => (
                                            <div key={index} style={{
                                                background: '#fff',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '6px',
                                                padding: '6px 12px',
                                                fontSize: '13px',
                                                color: '#334155',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                <span style={{ fontWeight: '600' }}>${item.productName || item.product?.productName}</span>
                                                <span style={{ color: '#64748b' }}>x${item.qty || item.quantity}</span>
                                                <span style={{ fontWeight: '600', color: '#0f172a' }}>Rs ${parseFloat(item.amount || item.itemTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className={styles.topGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>

                        <div className={styles.field} style={{ position: 'relative' }}>
                            <label>Select Customer</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    className={`${styles.input} ${errors.vendorCustomerId ? styles.inputError : ''}`}
                                    placeholder="Select Name"
                                    value={searchTerm}
                                    onFocus={() => { if (!prefill) setShowCustomerDropdown(true); }}
                                    onChange={(e) => {
                                        if (!prefill) {
                                            setSearchTerm(e.target.value);
                                            setShowCustomerDropdown(true);
                                            setErrors(prev => ({ ...prev, vendorCustomerId: undefined }));
                                        }
                                    }}
                                    disabled={isViewOnly || !!prefill}
                                />
                                {!isViewOnly && !prefill && <FiChevronDown style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />}
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
                            <label>Date <span style={{ color: '#FF4D4F' }}>*</span></label>
                            <input
                                type="date"
                                className={`${styles.input} ${errors.date ? styles.inputError : ''}`}
                                value={formData.date}
                                onChange={(e) => {
                                    setFormData({ ...formData, date: e.target.value });
                                    if (e.target.value) {
                                        setErrors(prev => {
                                            const next = { ...prev };
                                            delete next.date;
                                            return next;
                                        });
                                    }
                                }}
                                disabled={isViewOnly}
                            />
                            {errors.date && <span className={styles.errorMsg}>{errors.date}</span>}
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
                                        const remaining = Math.max(0, parseFloat(cleanVal || 0) - appliedWalletAmount);
                                        newPayments[0].amount = remaining > 0 ? remaining.toString() : "";
                                        setPayments(newPayments);
                                        setErrors(prev => ({ ...prev, paymentAmount_0: undefined }));
                                    }

                                    const totalPaid = newPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0) + appliedWalletAmount;
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
                            {walletAmount > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '16px' }}>
                                    <input
                                        type="checkbox"
                                        checked={useWallet}
                                        onChange={(e) => setUseWallet(e.target.checked)}
                                        disabled={isViewOnly}
                                        style={{ cursor: isViewOnly ? 'not-allowed' : 'pointer', width: '16px', height: '16px', accentColor: '#E93E64' }}
                                    />
                                    <span>Use Wallet (Available: Rs {walletAmount.toLocaleString()})</span>
                                </div>
                            )}
                            {useWallet && appliedWalletAmount > 0 && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '24px', marginBottom: '16px', alignItems: 'start' }}>
                                    <select className={styles.select} value="Wallet" disabled={true} style={{ background: '#f3f4f6', cursor: 'not-allowed', marginTop: '2px' }}>
                                        <option value="Wallet">Wallet</option>
                                    </select>
                                    <input type="number" className={styles.input} value={appliedWalletAmount} disabled={true} style={{ background: '#f3f4f6', cursor: 'not-allowed', fontWeight: '700' }} />
                                    <div></div>
                                </div>
                            )}
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
                    <button className={styles.shareBtn} onClick={onClose}>Cancel</button>
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
