
import React, { useState, useEffect, useMemo } from "react";
import styles from "../../styles/sale/add-sale-invoice.module.css";
import { FiX, FiCalendar, FiChevronDown, FiTrash2 } from "react-icons/fi";
import { saleService } from "../../services/saleService";
import { useRouter } from "next/router";
import useStore from "../../components/state/useStore";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { toast } from "sonner";

const AddPaymentIn = ({ isOpen, onClose, onRefresh, mode = 'add', paymentId }) => {
    const router = useRouter();
    const { jwtToken, userInfo } = useStore();
    const { branchId } = useDashboardData({ skipReviews: true });
    const isViewOnly = mode === 'view';

    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    
    const [formData, setFormData] = useState({
        vendorCustomerId: "",
        partyName: "",
        totalBalance: "",
        paidAmount: "",
        date: new Date().toISOString().split('T')[0],
        referenceNumber: "",
        description: "",
        image: null
    });

    const [payments, setPayments] = useState([
        { method: "Cash", amount: "" }
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
        if (!loading && isOpen && mode === 'view' && router.query.print === 'true') {
            const timer = setTimeout(() => {
                window.print();
                const { print, ...rest } = router.query;
                router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [loading, isOpen, mode, router.query.print]);

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
                    date: data.createdDate?.split('T')[0] || new Date().toISOString().split('T')[0],
                    referenceNumber: isPayment ? (data.transactionRef || "") : (data.userOrderId || ""),
                    description: data.description || "",
                    image: null
                });
                
                setPayments([{ 
                    method: data.paymentMethod || "Cash", 
                    amount: isPayment ? (data.amount || "") : (data.paidAmount || "") 
                }]);
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
            date: new Date().toISOString().split('T')[0],
            referenceNumber: "",
            description: "",
            image: null
        });
        setPayments([{ method: "Cash", amount: "" }]);
        setSearchTerm("");
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
    };

    const handleAddPaymentRow = () => {
        setPayments([...payments, { method: "Cash", amount: "" }]);
    };

    const handleRemovePaymentRow = (index) => {
        const newPayments = payments.filter((_, i) => i !== index);
        setPayments(newPayments.length > 0 ? newPayments : [{ method: "Cash", amount: 0 }]);
    };

    const handlePaymentChange = (index, field, val) => {
        const newPayments = [...payments];
        let sanitizedVal = val;
        if (field === 'amount') {
            const num = parseFloat(val);
            sanitizedVal = isNaN(num) || num === 0 ? "" : num;
        }
        newPayments[index][field] = sanitizedVal;
        setPayments(newPayments);
        
        const total = newPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
        setFormData({ ...formData, paidAmount: total || "" });
    };

    const handleSave = async () => {
        if (!formData.vendorCustomerId) {
            toast.error("Please select a customer");
            return;
        }

        const totalPaid = payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
        if (totalPaid <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        setLoading(true);
        try {
            let res;
            if (mode === 'edit' && paymentId) {
                const updatePayload = {
                    amount: totalPaid,
                    paymentMethod: payments[0]?.method || "Cash",
                    transactionRef: formData.referenceNumber,
                    description: formData.description
                };
                res = await saleService.updatePayment(jwtToken, paymentId, updatePayload);
            } else {
                const payload = {
                    branchId,
                    vendorCustomerId: formData.vendorCustomerId,
                    amount: totalPaid,
                    paymentMethod: payments[0].method,
                    paymentStatus: "Completed",
                    paymentFrom: "sale invoice",
                    createdBy: userInfo?.id || 1,
                    transactionRef: formData.referenceNumber,
                    description: formData.description
                };
                res = await saleService.createPayment(jwtToken, payload);
            }

            console.log("Full Response Object:", res);
            if (res && (res.status === "success" || res.data?.status === "success")) {
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
                            <label>Name / Phone number</label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type="text" 
                                    className={styles.input} 
                                    placeholder="Select Name" 
                                    value={searchTerm}
                                    onFocus={() => setShowCustomerDropdown(true)}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setShowCustomerDropdown(true);
                                    }}
                                    disabled={isViewOnly}
                                />
                                <FiChevronDown style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                            </div>
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
                                onChange={(e) => setFormData({...formData, date: e.target.value})}
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
                                style={{ background: '#f8f9fa', border: '1px solid #eee' }} 
                            />
                        </div>

                        <div className={styles.field}>
                            <label>Paid Amount</label>
                            <input 
                                type="number" 
                                className={styles.input} 
                                value={formData.paidAmount} 
                                onChange={(e) => {
                                    const rawVal = e.target.value;
                                    const num = parseFloat(rawVal);
                                    const val = isNaN(num) || num === 0 ? "" : num;
                                    
                                    setFormData({ ...formData, paidAmount: val });
                                    // Also sync with first payment row if only one row exists
                                    if (payments.length === 1) {
                                        const newPayments = [...payments];
                                        newPayments[0].amount = val;
                                        setPayments(newPayments);
                                    }
                                }}
                                disabled={isViewOnly}
                                style={{ background: '#fff', border: '1px solid #eee' }} 
                            />
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
                                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '24px', marginBottom: '16px', alignItems: 'center' }}>
                                    <select 
                                        className={styles.select} 
                                        value={p.method} 
                                        onChange={(e) => handlePaymentChange(idx, 'method', e.target.value)}
                                        disabled={isViewOnly}
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Card">Card</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="Bank">Bank</option>
                                    </select>
                                    <input 
                                        type="number" 
                                        className={styles.input} 
                                        placeholder="0" 
                                        value={p.amount} 
                                        onChange={(e) => handlePaymentChange(idx, 'amount', e.target.value)}
                                        disabled={isViewOnly}
                                    />
                                    {!isViewOnly && (
                                        <FiTrash2 
                                            style={{ color: '#999', cursor: 'pointer', fontSize: '18px' }} 
                                            onClick={() => handleRemovePaymentRow(idx)}
                                        />
                                    )}
                                </div>
                            ))}
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
                        <div className={styles.field}>
                            <label>REFERENCE NUMBER</label>
                            <input 
                                type="text" 
                                className={styles.input} 
                                placeholder="Enter reference number" 
                                value={formData.referenceNumber}
                                onChange={(e) => setFormData({...formData, referenceNumber: e.target.value})}
                                disabled={isViewOnly}
                            />
                        </div>
                        <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                            <label>Add Description</label>
                            <textarea 
                                className={styles.input} 
                                placeholder="Enter description..." 
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                disabled={isViewOnly}
                                style={{ height: '80px', resize: 'none' }}
                            ></textarea>
                        </div>
                        <div className={styles.field}>
                            <label>Add Image</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <button style={{ background: '#666', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Choose file</button>
                                <span style={{ color: '#999', fontSize: '13px' }}>No file Chosen</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className={styles.shareBtn} onClick={onClose}>Share</button>
                    {isViewOnly && (
                        <button className={styles.saveBtn} onClick={() => window.print()} style={{ background: '#4285F4' }}>Print</button>
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
