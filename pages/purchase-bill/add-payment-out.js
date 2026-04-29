import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "../../styles/purchase-bill/purchase-out.module.css";
import { FiX, FiCalendar, FiArrowLeft, FiTrash2 } from "react-icons/fi";
import { purchaseService } from "../../services/purchaseService";
import useStore from "../../components/state/useStore";
import { toast } from "sonner";
import { VENDOR_API_URL } from "../../components/utilities/Constants";

const PaymentOutFormPage = () => {
    const router = useRouter();
    const { id, mode } = router.query;
    const isView = mode === "view";
    const isEdit = mode === "edit";
    const { jwtToken, userInfo } = useStore();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState(null);
    
    // Form State
    const [supplierName, setSupplierName] = useState("");
    const [transactionDate, setTransactionDate] = useState("");
    const [totalBalance, setTotalBalance] = useState("000");
    const [paidAmount, setPaidAmount] = useState("");
    const [description, setDescription] = useState("");
    const [payments, setPayments] = useState([{
        amountPaid: "",
        paymentType: "Cash",
        refNo: "",
        id: Date.now()
    }]);

    useEffect(() => {
        if (jwtToken && id) {
            fetchTransaction();
        }
    }, [jwtToken, id]);

    const fetchTransaction = async () => {
        setLoading(true);
        try {
            // Fetch suppliers first for lookup
            const suppliersRes = await purchaseService.getSuppliers(jwtToken, userInfo?.branchId || 91);
            let suppliersList = [];
            if (suppliersRes.status === "success") {
                suppliersList = suppliersRes.data || [];
            }

            const res = await purchaseService.getTransactionById(jwtToken, id);
            if (res.status === "success") {
                const t = res.data;
                const totals = res.totals?.[0] || {};
                setData(t);
                
                // Supplier lookup
                const supplier = suppliersList.find(s => s.supplierId === t.supplierId);
                setSupplierName(supplier ? `${supplier.supplierName} (${supplier.phone || ""})` : (t.transactionInfo || "Supplier"));
                
                setTransactionDate(t.userTransactionDate?.split('T')[0] || "");
                setTotalBalance(totals.supplierTotalAmount || "000");
                setPaidAmount(t.amount || "");
                setDescription(t.transactionInfo || "");
                
                setPayments([{
                    amountPaid: t.amount || "",
                    paymentType: t.paymentType || "Cash",
                    refNo: t.refNo || "",
                    id: Date.now()
                }]);
            } else {
                toast.error("Failed to fetch transaction details");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (isView) return;
        setSaving(true);
        try {
            const payload = {
                amount: Number(paidAmount),
                paymentType: payments[0].paymentType,
                transactionInfo: description
            };
            const res = await purchaseService.updateTransaction(jwtToken, id, payload);
            if (res.status === "success" || res.status === "ok" || res.suppliersTransactionId) {
                toast.success("Transaction updated successfully");
                setTimeout(() => {
                    router.push("/purchase-bill/purchase-out");
                }, 1000);
            } else {
                toast.error("Failed to update transaction");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while saving");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className={styles.loading}>Loading...</div>;

    const heading = isView ? "View Payment Out" : (isEdit ? "Edit Payment Out" : "Add Payment Out");

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.formHeader}>
                <h3>{heading}</h3>
                <button className={styles.closeBtn} onClick={() => router.back()}><FiX /></button>
            </div>

            <div className={styles.formBody}>
                <div className={styles.gridRow}>
                    <div className={styles.field}>
                        <label>Name / Phone number</label>
                        <input 
                            type="text" 
                            className={`${styles.input} ${styles.readOnly}`}
                            value={supplierName}
                            readOnly
                        />
                    </div>
                    <div className={styles.field}>
                        <label>Date</label>
                        <input 
                            type="date" 
                            className={`${styles.input} ${styles.readOnly}`}
                            value={transactionDate}
                            readOnly
                        />
                    </div>
                </div>

                <div className={styles.gridRow}>
                    <div className={styles.field}>
                        <label>Total Balance Amount</label>
                        <input 
                            type="text" 
                            className={`${styles.input} ${styles.readOnly}`}
                            value={totalBalance}
                            readOnly
                        />
                    </div>
                    <div className={styles.field}>
                        <label>Paid Amount</label>
                        <input 
                            type="text" 
                            className={`${styles.input} ${isView ? styles.readOnly : ""}`}
                            value={paidAmount}
                            onChange={(e) => setPaidAmount(e.target.value)}
                            readOnly={isView}
                            placeholder="000"
                        />
                    </div>
                </div>

                {payments.map((p, idx) => (
                    <div key={p.id} className={styles.paymentEntry}>
                        <div className={styles.gridRow}>
                            <div className={styles.field}>
                                <label>Payment Type</label>
                                {isView ? (
                                    <input type="text" className={`${styles.input} ${styles.readOnly}`} value={p.paymentType} readOnly />
                                ) : (
                                    <select 
                                        className={styles.select}
                                        value={p.paymentType}
                                        onChange={(e) => {
                                            const newPayments = [...payments];
                                            newPayments[idx].paymentType = e.target.value;
                                            setPayments(newPayments);
                                        }}
                                    >
                                        {['Cash', 'Cheque', 'UPI', 'Card', 'Bank'].map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div className={styles.field}>
                                <label>Amount Paid</label>
                                <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                                    <div style={{position: 'relative', flex: 1}}>
                                        <span style={{position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#666'}}>₹</span>
                                        <input 
                                            type="number" 
                                            className={`${styles.input} ${isView ? styles.readOnly : ""}`}
                                            value={p.amountPaid}
                                            onChange={(e) => {
                                                const newPayments = [...payments];
                                                newPayments[idx].amountPaid = e.target.value;
                                                setPayments(newPayments);
                                            }}
                                            readOnly={isView}
                                            style={{paddingLeft: '32px'}}
                                            placeholder="25000"
                                        />
                                    </div>
                                    {!isView && (
                                        <button 
                                            className={styles.miniRemove} 
                                            onClick={() => setPayments(payments.filter(pay => pay.id !== p.id))}
                                        >
                                            <FiTrash2 />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        {(p.paymentType === 'UPI' || p.paymentType === 'Cheque') && (
                            <div className={styles.field} style={{marginTop: '12px', maxWidth: 'calc(50% - 30px)'}}>
                                <label>{p.paymentType === 'UPI' ? 'REFERENCE NUMBER' : 'CHECK NUMBER'}</label>
                                <input 
                                    type="text" 
                                    className={`${styles.input} ${isView ? styles.readOnly : ""}`}
                                    value={p.refNo}
                                    onChange={(e) => {
                                        const newPayments = [...payments];
                                        newPayments[idx].refNo = e.target.value;
                                        setPayments(newPayments);
                                    }}
                                    readOnly={isView}
                                    placeholder="****************"
                                />
                            </div>
                        )}
                    </div>
                ))}

                <div 
                    className={styles.addPaymentLink} 
                    style={{ display: isView ? 'none' : 'block' }}
                    onClick={() => setPayments([...payments, { amountPaid: "", paymentType: "Cash", refNo: "", id: Date.now() }])}
                >
                    +ADD ANOTHER PAYMENT
                </div>

                <div className={styles.field} style={{marginBottom: '24px'}}>
                    <label>Add Description</label>
                    <textarea 
                        className={`${styles.textarea} ${isView ? styles.readOnly : ""}`}
                        placeholder="Lorem ipsum dolor sit..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        readOnly={isView}
                        rows={3}
                    />
                </div>

                <div className={styles.field}>
                    <label>Add Image</label>
                    <div className={styles.imageUpload}>
                        <label className={styles.uploadTrigger}>Choose file</label>
                        <span style={{fontSize: '14px', color: '#666', marginLeft: '10px'}}>{data?.transactionImg ? "Image Attached" : "No file Choosen"}</span>
                    </div>
                    {data?.transactionImg && (
                        <div style={{marginTop: '12px'}}>
                            <img 
                                src={data.transactionImg.startsWith('http') ? data.transactionImg : `${VENDOR_API_URL.replace('/api', '')}/${data.transactionImg}`} 
                                alt="Transaction" 
                                style={{maxWidth: '300px', borderRadius: '8px', border: '1px solid #ddd'}} 
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.formActions}>
                <button className={styles.shareBtn}>Share</button>
                {!isView && (
                    <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save"}
                    </button>
                )}
            </div>
        </div>
    );
};

export default PaymentOutFormPage;
