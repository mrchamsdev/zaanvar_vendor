import { getBoolSetting } from "@/utilities/settings-utils";
import { toApiDateOnly } from "@/utilities/date-time-utils";
import React, { useState, useEffect } from "react";
import styles from "../../styles/purchase-bill/pay-now-modal.module.css";
import { FiX, FiCalendar, FiTrash2 } from "react-icons/fi";
import { purchaseService } from "../../services/purchaseService";
import useStore from "../../components/state/useStore";
import { toast } from "sonner";
import { dateOnlyWithTimeZone, withTimeZone, parseWallClockDate } from "@/utilities/date-time-utils";
import useDashboardData from "../../components/dashboard/useDashboardData";
import useCurrencySymbol from "@/components/utilities/useCurrencySymbol";
import { getAmountDecimalPlaces } from "../utilities/formatAmount";

const PayNowModal = ({ isOpen, onClose, onRefresh, billId, supplierData, initialBillData, allOrders }) => {
  const currencySymbol = useCurrencySymbol();

    const { jwtToken, userInfo, vendorSettings } = useStore();
    const cashSaleByDefault = getBoolSetting(vendorSettings, 'cashSaleByDefault', true);
    const roundOffTotal = getBoolSetting(vendorSettings, 'roundOffTotal', false);
    const addTimeOnTransactions = getBoolSetting(vendorSettings, 'addTimeOnTransactions', false);
    const enableDiscountDuringPayments = getBoolSetting(vendorSettings, 'enableDiscountDuringPayments', true);
    const { branchId: selectedBranchId } = useDashboardData({ skipReviews: true });
    const branchId = selectedBranchId || userInfo?.branchId || 1;
    const [loading, setLoading] = useState(false);

    const [applyDiscount, setApplyDiscount] = useState(false);

    // Header Data
    const [billDetails, setBillDetails] = useState(null);
    const [paymentDate, setPaymentDate] = useState(toApiDateOnly(new Date()));
    const [paymentTime, setPaymentTime] = useState("");
    const [description, setDescription] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);

    // Round off
    const [isRoundOff, setIsRoundOff] = useState(false);
    const [roundOffValue, setRoundOffValue] = useState("0");

    // Multiple Payments
    const [paymentEntries, setPaymentEntries] = useState([
        { id: Date.now(), type: cashSaleByDefault ? "Cash" : "", amount: "", refNo: "" }
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
                { id: Date.now(), type: cashSaleByDefault ? "Cash" : "", amount: "", refNo: "" }
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
    }, [isOpen, billId, initialBillData, cashSaleByDefault]);

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

    const validateAmountsOnChange = (entries, topAmount) => {
        const topVal = parseFloat(topAmount) || 0;
        const totalSum = entries.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
        if (totalSum > topVal) {
            return "Amount paid should not exceed Paid Amount";
        }
        return "";
    };

    const validateAmountsOnSubmit = (entries, topAmount) => {
        const topVal = parseFloat(topAmount) || 0;
        const totalSum = entries.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
        if (totalSum > topVal) {
            return "Amount paid should not exceed Paid Amount";
        }
        if (totalSum < topVal) {
            return "Amount paid should not be less than Paid Amount";
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

        const err = validateAmountsOnChange(updatedEntries, val);
        setExceededError(err);
        if (val && parseFloat(val) > 0) {
            setAmountError("");
        }
    };

    const handleAddPayment = () => {
        const newEntries = [...paymentEntries, { id: Date.now(), type: cashSaleByDefault ? "Cash" : "", amount: "", refNo: "" }];
        setPaymentEntries(newEntries);
        const err = validateAmountsOnChange(newEntries, topPaidAmount);
        setExceededError(err);
    };

    const handleRemovePayment = (id) => {
        if (paymentEntries.length > 1) {
            const newEntries = paymentEntries.filter(p => p.id !== id);
            setPaymentEntries(newEntries);
            const err = validateAmountsOnChange(newEntries, topPaidAmount);
            setExceededError(err);
        }
    };

    const updatePayment = (id, field, value) => {
        const updated = paymentEntries.map(p => p.id === id ? { ...p, [field]: value } : p);
        setPaymentEntries(updated);

        const err = validateAmountsOnChange(updated, topPaidAmount);
        setExceededError(err);
        if (field === "amount" && value && parseFloat(value) > 0) {
            setAmountError("");
        }
    };

    // Calculations
    const previouslyPaid = parseFloat(billDetails?.amountPaidToSupplier || 0);
    const currentBalanceRaw = parseFloat(billDetails?.balanceAmount || 0);
    const totalBillAmount = parseFloat(billDetails?.overallBillAmount || billDetails?.totalAmount || (previouslyPaid + currentBalanceRaw));

    // Discount calculations
    const supplierDataObj = billDetails?.vendor || supplierData;
    const discountObj = supplierDataObj?.discount;
    let isEligible = false;
    let discountAmt = 0;

    if (enableDiscountDuringPayments && discountObj) {
        if (discountObj.discountType === "Bill Amount Based") {
            const minOrder = Number(discountObj.minimumOrderValue || 0);
            if (currentBalanceRaw >= minOrder && minOrder > 0) {
                isEligible = true;
                if (discountObj.discountValueType === "Percentage (%)") {
                    discountAmt = currentBalanceRaw * (Number(discountObj.discountValue || 0) / 100);
                } else {
                    discountAmt = Number(discountObj.discountValue || 0);
                }
            }
        } else if (discountObj.discountType === "Time Based") {
            const minDays = Number(discountObj.minimumPaymentDays || 0);
            const refDateStr = billDetails?.modifiedDate || billDetails?.orderDate || billDetails?.receivedDate || billDetails?.createdDate;
            if (refDateStr && minDays > 0) {
                const refDate = new Date(refDateStr);
                refDate.setHours(0, 0, 0, 0);
                const todayDate = new Date();
                todayDate.setHours(0, 0, 0, 0);
                const diffTime = todayDate.getTime() - refDate.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays <= minDays) {
                    isEligible = true;
                    if (discountObj.discountValueType === "Percentage (%)") {
                        discountAmt = currentBalanceRaw * (Number(discountObj.discountValue || 0) / 100);
                    } else {
                        discountAmt = Number(discountObj.discountValue || 0);
                    }
                }
            }
        }
    }

    const appliedDiscountAmount = applyDiscount ? discountAmt : 0;
    const currentBalance = Math.max(0, currentBalanceRaw - appliedDiscountAmount);

    // Amount currently being entered (top Paid Amount field)
    const currentEntryAmount = parseFloat(topPaidAmount || 0);
    const totalPaidInModal = paymentEntries.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

    // Final Summary Values
    const summaryTotal = isRoundOff ? Math.round(totalPaidInModal) : totalPaidInModal + parseFloat(roundOffValue || 0);
    const summaryPaidTotal = previouslyPaid + summaryTotal + appliedDiscountAmount;
    const summaryPendingAmount = currentBalanceRaw - (summaryTotal + appliedDiscountAmount);

    useEffect(() => {
        if (isOpen) {
            if (addTimeOnTransactions) {
                const now = new Date();
                setPaymentTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
            }
        }
    }, [isOpen, cashSaleByDefault]);

    useEffect(() => {
        if (isRoundOff) {
            const diff = Math.round(totalPaidInModal) - totalPaidInModal;
            setRoundOffValue(diff.toDynamicFixed());
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

        if (isTopAmountEmpty) {
            setAmountError("Amount is required");
            toast.error("Please enter Paid Amount");
            hasError = true;
        } else if (parseFloat(topPaidAmount) > currentBalance) {
            setAmountError("Paid Amount cannot exceed Balance Amount");
            toast.error("Paid Amount cannot exceed Balance Amount");
            hasError = true;
        } else if (isAmountEmpty) {
            setAmountError("Amount is required");
            toast.error("Please enter all payment amounts");
            hasError = true;
        } else {
            setAmountError("");
        }

        if (!isTopAmountEmpty && !isAmountEmpty) {
            const limitErr = validateAmountsOnSubmit(paymentEntries, topPaidAmount);
            if (limitErr) {
                setExceededError(limitErr);
                toast.error(limitErr);
                hasError = true;
            } else {
                setExceededError("");
            }
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
                ...(addTimeOnTransactions && paymentTime
                    ? withTimeZone(
                          "userTransactionDate",
                          new Date(`${paymentDate}T${paymentTime}:00`)
                      )
                    : dateOnlyWithTimeZone(
                          "userTransactionDate",
                          parseWallClockDate(paymentDate) || new Date(paymentDate)
                      )),
                supplierId: supplierData?.supplierId || billDetails?.supplierId,
                branchId: branchId,
                createdBy: userInfo?.userId || 1,
                productsBillId: parseInt(currentBillId),
                transactionInfo: description || `Payment for invoice #${currentBillId}`,
                returnProductsId: null,
                returnsDeduction: false,
                totalAmountPaid: currentEntryAmount + appliedDiscountAmount,
                discountAmount: appliedDiscountAmount,
                amountAfterDiscount: currentEntryAmount,
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
                        {addTimeOnTransactions && (
                            <div className={styles.field}>
                                <label>Payment Time</label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                    <select 
                                        className={styles.input} 
                                        style={{ width: '30%', padding: '0 8px' }}
                                        value={paymentTime ? String(parseInt(paymentTime.split(':')[0]) % 12 || 12).padStart(2, '0') : '12'}
                                        onChange={(e) => {
                                            const h = parseInt(e.target.value);
                                            const m = paymentTime ? paymentTime.split(':')[1] : '00';
                                            const isPm = paymentTime ? parseInt(paymentTime.split(':')[0]) >= 12 : false;
                                            const newH = isPm ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
                                            setPaymentTime(`${String(newH).padStart(2, '0')}:${m}`);
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
                                        style={{ width: '30%', padding: '0 8px' }}
                                        value={paymentTime ? paymentTime.split(':')[1] : '00'}
                                        onChange={(e) => {
                                            const currentH = paymentTime ? paymentTime.split(':')[0] : '00';
                                            setPaymentTime(`${currentH}:${e.target.value}`);
                                        }}
                                    >
                                        {[...Array(60)].map((_, i) => {
                                            const val = String(i).padStart(2, '0');
                                            return <option key={val} value={val}>{val}</option>;
                                        })}
                                    </select>
                                    <select 
                                        className={styles.input} 
                                        style={{ width: '35%', padding: '0 8px' }}
                                        value={paymentTime && parseInt(paymentTime.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                                        onChange={(e) => {
                                            const currentH = parseInt(paymentTime ? paymentTime.split(':')[0] : '00');
                                            const m = paymentTime ? paymentTime.split(':')[1] : '00';
                                            const isPm = e.target.value === 'PM';
                                            let newH = currentH;
                                            if (isPm && currentH < 12) newH = currentH + 12;
                                            if (!isPm && currentH >= 12) newH = currentH - 12;
                                            setPaymentTime(`${String(newH).padStart(2, '0')}:${m}`);
                                        }}
                                    >
                                        <option value="AM">AM</option>
                                        <option value="PM">PM</option>
                                    </select>
                                </div>
                                </div>
                            </div>
                        )}
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
                            <input type="text" className={`${styles.input} ${styles.readOnly}`} value={`${currencySymbol} ${totalBillAmount.toLocaleString(undefined, { minimumFractionDigits: getAmountDecimalPlaces(), maximumFractionDigits: getAmountDecimalPlaces() })}`} readOnly />
                        </div>
                        <div className={styles.field}>
                            <label>Previously Paid Amount</label>
                            <input type="text" className={`${styles.input} ${styles.readOnly}`} value={`${currencySymbol} ${previouslyPaid.toLocaleString(undefined, { minimumFractionDigits: getAmountDecimalPlaces(), maximumFractionDigits: getAmountDecimalPlaces() })}`} readOnly />
                        </div>
                        <div className={styles.field}>
                            <label>Balance Amount</label>
                            <input type="text" className={`${styles.input} ${styles.readOnly}`} value={`${currencySymbol} ${currentBalanceRaw.toLocaleString(undefined, { minimumFractionDigits: getAmountDecimalPlaces(), maximumFractionDigits: getAmountDecimalPlaces() })}`} readOnly />
                        </div>
                        {isEligible && (
                            <div className={styles.field} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', marginBottom: '8px' }}>
                                <input 
                                    type="checkbox" 
                                    checked={applyDiscount} 
                                    onChange={(e) => setApplyDiscount(e.target.checked)}
                                />
                                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                                    Apply Discount ({currencySymbol} {discountAmt.toLocaleString(undefined, { minimumFractionDigits: getAmountDecimalPlaces(), maximumFractionDigits: getAmountDecimalPlaces() })})
                                </span>
                            </div>
                        )}
                        <div className={styles.field}>
                            <label>Paid Amount</label>
                            <input
                                type="number"
                                className={`${styles.input} ${amountError ? styles.errorInput : ""}`}
                                value={topPaidAmount}
                                onChange={(e) => handleTopPaidAmountChange(e.target.value)}
                                placeholder="0"
                            />
                            {amountError && (
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
                                {roundOffTotal && (
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
                                )}
                                <div className={styles.field}>
                                    <label>Total</label>
                                    <input type="text" className={`${styles.input} ${styles.readOnly}`} value={summaryTotal.toDynamicFixed()} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Paid Amount</label>
                                    <input type="text" className={`${styles.input} ${styles.readOnly}`} value={summaryPaidTotal.toDynamicFixed()} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Pending amount</label>
                                    <input type="text" className={`${styles.input} ${styles.readOnly}`} value={summaryPendingAmount.toDynamicFixed()} readOnly />
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
                                                <option value="">Select Payment Type</option>
                                                <option value="Cash">Cash</option>
                                                <option value="UPI">UPI</option>
                                                <option value="Card">Card</option>
                                                <option value="Cheque">Cheque</option>
                                                <option value="Bank">Bank Transfer</option>
                                            </select>
                                            {showExceededOnType && (
                                                <div style={{ color: '#E9315D', fontSize: '12px', fontWeight: 'bold', marginTop: '5px', display: 'block' }}>
                                                    {exceededError.includes("exceed") ? "Exceeds Paid Amount" : "Less than Paid Amount"}
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
