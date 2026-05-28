import { toApiDateOnly } from "@/utilities/date-time-utils";
import React, { useState, useEffect } from "react";
import styles from "../../styles/purchase-bill/pay-now-modal.module.css";
import { FiX, FiCalendar, FiTrash2 } from "react-icons/fi";
import { purchaseService } from "../../services/purchaseService";
import useStore from "../../components/state/useStore";
import { toast } from "sonner";
import { dateOnlyWithTimeZone, parseWallClockDate } from "@/utilities/date-time-utils";

const PayNowModal = ({ isOpen, onClose, onRefresh, billId, supplierData, initialBillData, allOrders }) => {
    const { jwtToken, userInfo } = useStore();
    const branchId = userInfo?.branchId || 91;
    const [loading, setLoading] = useState(false);

    // Header Data
    const [billDetails, setBillDetails] = useState(null);
    const [paymentDate, setPaymentDate] = useState(toApiDateOnly(new Date()));
    const [description, setDescription] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);

    // Round off
    const [isRoundOff, setIsRoundOff] = useState(false);
    const [roundOffValue, setRoundOffValue] = useState("0");

    // Multiple Payments
    const [paymentEntries, setPaymentEntries] = useState([
        { id: Date.now(), type: "Cash", amount: "", refNo: "" }
    ]);
    const [topPaidAmount, setTopPaidAmount] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [orderError, setOrderError] = useState("");
    const [amountError, setAmountError] = useState("");
    const [exceededError, setExceededError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setIsSubmitted(false);
            setOrderError("");
            setAmountError("");
            setExceededError("");
            setTopPaidAmount("");
            setPaymentEntries([
                { id: Date.now(), type: "Cash", amount: "", refNo: "" }
            ]);
            if (initialBillData) {
                console.log("PayNowModal: Using initialBillData", initialBillData);
                // Map the PO/Order data to the billDetails format expected by the modal
                setBillDetails({
                    ...initialBillData,
                    totalAmount: initialBillData.totalAmount || initialBillData.totalvalue || 0,
                    amountPaidToSupplier: initialBillData.amountPaidToSupplier || 0,
                    balanceAmount: initialBillData.balanceAmount || (initialBillData.totalvalue || initialBillData.totalAmount || 0),
                    vendor: supplierData || initialBillData.supplier
                });
                setLoading(false);
            } else if (billId) {
                fetchBillDetails();
            }
        }
    }, [isOpen, billId, initialBillData]);

    const handleOrderChange = (newBillId) => {
        setOrderError("");
        setAmountError("");
        setExceededError("");
        if (!newBillId) {
            setBillDetails(null);
            return;
        }
        const selected = allOrders?.find(o => (o.productsBillId || o.productsPurchaseRqstID).toString() === newBillId.toString());
        if (selected) {
            setBillDetails({
                ...selected,
                totalAmount: selected.totalAmount || selected.totalvalue || 0,
                amountPaidToSupplier: selected.amountPaidToSupplier || 0,
                balanceAmount: selected.balanceAmount || (selected.totalvalue || selected.totalAmount || 0),
                vendor: supplierData || selected.supplier
            });
        }
    };

    const fetchBillDetails = async () => {
        setLoading(true);
        try {
            console.log("PayNowModal: Fetching bill with ID:", billId);
            let res = await purchaseService.getBillById(jwtToken, billId);

            // If fetching by Bill ID fails with 404, it might be a Purchase Request ID
            if (res.status === "error" || !res.data) {
                console.log("PayNowModal: Bill not found, trying Purchase Request Summary for ID:", billId);
                const poRes = await purchaseService.getPurchaseRequestSummary(jwtToken, billId);

                if (poRes.status === "success" && poRes.data?.productsBillId) {
                    const actualBillId = poRes.data.productsBillId;
                    console.log("PayNowModal: Found linked Bill ID:", actualBillId);
                    res = await purchaseService.getBillById(jwtToken, actualBillId);
                } else if (poRes.status === "success") {
                    // It's a PO but has no Bill yet
                    setBillDetails({
                        ...poRes.data,
                        productsBillId: null,
                        amountPaidToSupplier: poRes.data.totalAmount || poRes.data.totalvalue,
                        paidAmount: poRes.data.receivedDetails?.paidAmount || 0,
                        vendor: poRes.data.supplier
                    });
                    setLoading(false);
                    return;
                }
            }

            if (res.status === "success") {
                setBillDetails(res.data);
            } else {
                toast.error("Failed to fetch bill details. Please check if the Bill ID is correct.");
            }
        } catch (error) {
            console.error("Error fetching bill details:", error);
            toast.error("An error occurred while fetching bill details");
        } finally {
            setLoading(false);
        }
    };

    const validateAmounts = (entries, topAmount) => {
        const topVal = parseFloat(topAmount) || 0;
        const totalSum = entries.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
        if (totalSum > topVal) {
            return "Amount paid should not exceed Paid Amount";
        }
        return "";
    };

    const handleTopPaidAmountChange = (val) => {
        setTopPaidAmount(val);
        let updatedEntries = [...paymentEntries];
        if (paymentEntries.length === 1) {
            updatedEntries = [{ ...paymentEntries[0], amount: val }];
            setPaymentEntries(updatedEntries);
        }

        const err = validateAmounts(updatedEntries, val);
        setExceededError(err);
        if (val && parseFloat(val) > 0) {
            setAmountError("");
        }
    };

    const handleAddPayment = () => {
        const newEntries = [...paymentEntries, { id: Date.now(), type: "Cash", amount: "", refNo: "" }];
        setPaymentEntries(newEntries);
        const err = validateAmounts(newEntries, topPaidAmount);
        setExceededError(err);
    };

    const handleRemovePayment = (id) => {
        if (paymentEntries.length > 1) {
            const newEntries = paymentEntries.filter(p => p.id !== id);
            setPaymentEntries(newEntries);
            const err = validateAmounts(newEntries, topPaidAmount);
            setExceededError(err);
        }
    };

    const updatePayment = (id, field, value) => {
        const updated = paymentEntries.map(p => p.id === id ? { ...p, [field]: value } : p);
        setPaymentEntries(updated);

        const err = validateAmounts(updated, topPaidAmount);
        setExceededError(err);
        if (field === "amount" && value && parseFloat(value) > 0) {
            setAmountError("");
        }
    };

    // Calculations
    const previouslyPaid = parseFloat(billDetails?.amountPaidToSupplier || 0);
    const currentBalance = parseFloat(billDetails?.balanceAmount || 0);
    const totalBillAmount = parseFloat(billDetails?.totalAmount || (previouslyPaid + currentBalance));

    // Amount currently being entered (top Paid Amount field)
    const currentEntryAmount = parseFloat(topPaidAmount || 0);
    const totalPaidInModal = paymentEntries.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

    // Final Summary Values
    const summaryTotal = isRoundOff ? Math.round(totalPaidInModal) : totalPaidInModal + parseFloat(roundOffValue || 0);
    const summaryPaidTotal = previouslyPaid + summaryTotal;
    const summaryPendingAmount = currentBalance - summaryTotal;

    useEffect(() => {
        if (isRoundOff) {
            const diff = Math.round(totalPaidInModal) - totalPaidInModal;
            setRoundOffValue(diff.toFixed(2));
        } else {
            setRoundOffValue("0");
        }
    }, [isRoundOff, totalPaidInModal]);

    const handlePay = async () => {
        console.log("PayNowModal: handlePay called. billDetails:", billDetails);
        setIsSubmitted(true);

        let hasError = false;
        if (!billDetails?.productsBillId && !billDetails?.productsPurchaseRqstID) {
            console.log("PayNowModal: Validation failed - no order selected");
            setOrderError("Select order");
            toast.error("Select order");
            hasError = true;
        } else {
            setOrderError("");
        }

        const isTopAmountEmpty = !topPaidAmount || parseFloat(topPaidAmount) <= 0;
        const isAmountEmpty = paymentEntries.some(entry => !entry.amount || parseFloat(entry.amount) <= 0);
        if (isTopAmountEmpty || isAmountEmpty) {
            setAmountError("Amount is required");
            toast.error("Please enter all payment amounts");
            hasError = true;
        } else {
            setAmountError("");
        }

        const limitErr = validateAmounts(paymentEntries, topPaidAmount);
        if (limitErr) {
            setExceededError(limitErr);
            toast.error(limitErr);
            hasError = true;
        } else {
            setExceededError("");
        }

        if (hasError) {
            return;
        }

        setLoading(true);
        try {
            const validEntries = paymentEntries.filter(entry => parseFloat(entry.amount) > 0);
            const currentBillId =
                billDetails?.productsBillId ||
                billDetails?.receiptItems?.[0]?.productsBillId ||
                billDetails?.receiptItems?.[0]?.productsBillItemsId ||
                billDetails?.productsPurchaseRqstID ||
                billId;

            const payload = {
                debitOrCredit: "Debit",
                paymentFrom: "payment out",
                ...dateOnlyWithTimeZone(
                    "userTransactionDate",
                    parseWallClockDate(paymentDate) || new Date(paymentDate),
                ),
                supplierId: supplierData?.supplierId || billDetails?.supplierId,
                branchId: branchId,
                createdBy: userInfo?.userId || 1,
                productsBillId: parseInt(currentBillId),
                transactionInfo: description || `Payment for invoice #${currentBillId}`,
                returnProductsId: null,
                returnsDeduction: false,
                paymentTypes: validEntries.map(entry => {
                    const typeObj = {
                        paymentType: entry.type,
                        amount: parseFloat(entry.amount)
                    };
                    if (entry.refNo && entry.type !== 'Cash') {
                        typeObj.referenceNumber = entry.refNo;
                    }
                    return typeObj;
                })
            };

            const res = await purchaseService.createTransaction(jwtToken, payload);

            if (res.status === "success" || res.status === 200 || res.data?.status === "success") {
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

            toast.success("Payment successful");
            if (onRefresh) onRefresh();
            onClose();
        } catch (error) {
            console.error("Payment error:", error);
            toast.error("Failed to process payment");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h3>Pay Now</h3>
                    <button className={styles.closeBtn} onClick={onClose}><FiX /></button>
                </div>

                <div className={styles.modalContent}>
                    {console.log("PayNowModal Render: orderError =", orderError)}
                    {/* Header Info */}
                    <div className={styles.headerGrid}>
                        <div className={styles.field}>
                            <label>Supplier Name</label>
                            <input
                                type="text"
                                className={`${styles.input} ${styles.readOnly}`}
                                value={supplierData?.supplierName || billDetails?.vendor?.supplierName || "N/A"}
                                readOnly
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Payment Date</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="date"
                                    className={styles.input}
                                    value={paymentDate}
                                    max={toApiDateOnly(new Date())}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bill Stats */}
                    <div className={styles.col5}>
                        <div className={styles.field}>
                            <label>Order Number <span style={{ color: '#ff4d4f' }}>*</span></label>
                            <select
                                className={`${styles.select} ${orderError ? styles.errorInput : ""}`}
                                value={billDetails?.productsBillId || billDetails?.productsPurchaseRqstID || ""}
                                onChange={(e) => handleOrderChange(e.target.value)}
                            >
                                <option value="">Select Order</option>
                                {allOrders?.filter(o =>
                                    o.orderStatus === 'received' &&
                                    o.paymentStatus !== 'Full' &&
                                    o.paymentStatus !== 'Paid' &&
                                    parseFloat(o.balanceAmount || 0) > 0
                                ).map(order => (
                                    <option key={order.productsPurchaseRqstID} value={order.productsBillId || order.productsPurchaseRqstID}>
                                        PO-{String(order.productsPurchaseRqstID).padStart(5, '0')}
                                    </option>
                                ))}
                            </select>
                            {orderError && (
                                <div style={{ color: '#E9315D', fontSize: '12px', fontWeight: 'bold', marginTop: '5px', display: 'block' }}>
                                    {orderError}
                                </div>
                            )}
                        </div>
                        <div className={styles.field}>
                            <label>Total Amount</label>
                            <input type="text" className={`${styles.input} ${styles.readOnly}`} value={`₹ ${totalBillAmount.toLocaleString()}`} readOnly />
                        </div>
                        <div className={styles.field}>
                            <label>Previously Paid Amount</label>
                            <input type="text" className={`${styles.input} ${styles.readOnly}`} value={`₹ ${previouslyPaid.toLocaleString()}`} readOnly />
                        </div>
                        <div className={styles.field}>
                            <label>Balance Amount</label>
                            <input type="text" className={`${styles.input} ${styles.readOnly}`} value={`₹ ${currentBalance.toLocaleString()}`} readOnly />
                        </div>
                        <div className={styles.field}>
                            <label>Paid Amount</label>
                            <input
                                type="number"
                                className={`${styles.input} ${amountError && (!topPaidAmount || parseFloat(topPaidAmount) <= 0) ? styles.errorInput : ""}`}
                                value={topPaidAmount}
                                onChange={(e) => handleTopPaidAmountChange(e.target.value)}
                                placeholder="0"
                            />
                            {amountError && (!topPaidAmount || parseFloat(topPaidAmount) <= 0) && (
                                <div style={{ color: '#E9315D', fontSize: '12px', fontWeight: 'bold', marginTop: '5px', display: 'block' }}>
                                    {amountError}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description and Totals */}
                    <div className={styles.summaryRow}>
                        <div className={styles.summaryCol}>
                            <div className={styles.field}>
                                <label>Add Description</label>
                                <textarea
                                    className={styles.textarea}
                                    rows={2}
                                    placeholder="Enter Descrition"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                            <div className={styles.field}>
                                <label>Add Image</label>
                                <div className={styles.imageUpload}>
                                    <label htmlFor="modalImage" className={styles.uploadTrigger}>Choose file</label>
                                    <input
                                        type="file"
                                        id="modalImage"
                                        style={{ display: 'none' }}
                                        onChange={(e) => setSelectedImage(e.target.files[0])}
                                    />
                                    <span style={{ fontSize: '12px', color: '#666' }}>
                                        {selectedImage ? selectedImage.name : "No file Choosen"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.summaryCol}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div className={styles.field}>
                                    <label>Round Off</label>
                                    <div className={styles.roundOffContainer}>
                                        <input
                                            type="checkbox"
                                            className={styles.checkbox}
                                            checked={isRoundOff}
                                            onChange={(e) => setIsRoundOff(e.target.checked)}
                                        />
                                        <input
                                            type="number"
                                            className={styles.input}
                                            value={roundOffValue}
                                            onChange={(e) => setRoundOffValue(e.target.value)}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <div className={styles.field}>
                                    <label>Total</label>
                                    <input type="text" className={`${styles.input} ${styles.readOnly}`} value={summaryTotal.toFixed(2)} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Paid Amount</label>
                                    <input type="text" className={`${styles.input} ${styles.readOnly}`} value={summaryPaidTotal.toFixed(2)} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Pending amount</label>
                                    <input type="text" className={`${styles.input} ${styles.readOnly}`} value={summaryPendingAmount.toFixed(2)} readOnly />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Entries */}
                    <div style={{ marginTop: '32px' }}>
                        {paymentEntries.map((entry, index) => {
                            const isLast = index === paymentEntries.length - 1;
                            const hasAmountRequiredError = amountError && (!entry.amount || parseFloat(entry.amount) <= 0);
                            const showExceededOnAmount = exceededError && isLast;
                            const showExceededOnType = exceededError && paymentEntries.length > 1 && isLast;

                            return (
                                <div key={entry.id} className={styles.paymentEntry}>
                                    <div className={styles.grid}>
                                        <div className={styles.field}>
                                            <label>Payment Type</label>
                                            <select
                                                className={`${styles.select} ${showExceededOnType ? styles.errorInput : ""}`}
                                                value={entry.type}
                                                onChange={(e) => updatePayment(entry.id, "type", e.target.value)}
                                            >
                                                <option value="Cash">Cash</option>
                                                <option value="UPI">UPI</option>
                                                <option value="Card">Card</option>
                                                <option value="Cheque">Cheque</option>
                                                <option value="Bank">Bank Transfer</option>
                                            </select>
                                            {showExceededOnType && (
                                                <div style={{ color: '#E9315D', fontSize: '12px', fontWeight: 'bold', marginTop: '5px', display: 'block' }}>
                                                    Exceeds Paid Amount
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.field}>
                                            <label>Amount Paid</label>
                                            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                                                <div style={{ display: 'flex', gap: '12px' }}>
                                                    <input
                                                        type="number"
                                                        className={`${styles.input} ${hasAmountRequiredError || showExceededOnAmount ? styles.errorInput : ""}`}
                                                        placeholder="0"
                                                        value={entry.amount}
                                                        onChange={(e) => {
                                                            updatePayment(entry.id, "amount", e.target.value);
                                                        }}
                                                        style={{ flex: 1 }}
                                                    />
                                                    {paymentEntries.length > 1 && (
                                                        <button className={styles.miniRemove} onClick={() => handleRemovePayment(entry.id)}>
                                                            <FiTrash2 />
                                                        </button>
                                                    )}
                                                </div>
                                                {(hasAmountRequiredError || showExceededOnAmount) && (
                                                    <div style={{ color: '#E9315D', fontSize: '12px', fontWeight: 'bold', marginTop: '5px', display: 'block' }}>
                                                        {hasAmountRequiredError ? amountError : exceededError}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {entry.type !== "Cash" && entry.type !== "Bank" && (
                                        <div className={styles.refField}>
                                            <div className={styles.field}>
                                                <label>REFERENCE NUMBER</label>
                                                <input
                                                    type="text"
                                                    className={styles.input}
                                                    placeholder="****************"
                                                    value={entry.refNo}
                                                    onChange={(e) => updatePayment(entry.id, "refNo", e.target.value.replace(/[^0-9]/g, ''))}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        <div className={styles.addPaymentLink} onClick={handleAddPayment}>
                            +ADD ANOTHER PAYMENT
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
                    <button className={styles.payBtn} onClick={handlePay} disabled={loading}>
                        {loading ? "Processing..." : "Pay"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PayNowModal;
