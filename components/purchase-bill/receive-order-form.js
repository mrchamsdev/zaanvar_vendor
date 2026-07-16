import { getAmountDecimalPlaces } from "@/components/utilities/formatAmount";
import { toApiDateOnly } from "@/utilities/date-time-utils";
import React, { useState, useEffect, useMemo } from "react";
import styles from "../../styles/purchase-bill/receive-order-form.module.css";
import { purchaseService } from "../../services/purchaseService";
import useStore from "../../components/state/useStore";
import { getBoolSetting } from "@/utilities/settings-utils";
import { toast } from "sonner";
import { FiChevronDown, FiCheckCircle, FiCalendar, FiInfo } from "react-icons/fi";
import PurchaseOrderSummary from "./purchase-order-summary";
import { dateOnlyWithTimeZone, parseWallClockDate } from "@/utilities/date-time-utils";
import useCurrencySymbol from "@/components/utilities/useCurrencySymbol";
import { getTaxGroups, getTaxRates } from "../../services/settingsService";

const findMatchingTaxGroup = (batch, groups) => {
    if (!groups || groups.length === 0) return null;
    const groupId = batch.taxGroupId != null && batch.taxGroupId !== "" ? Number(batch.taxGroupId) : null;
    const taxVal = batch.tax !== undefined && batch.tax !== "" && batch.tax !== null ? Number(batch.tax) : null;

    if (groupId !== null) {
        const matchById = groups.find(g => Number(g.id) === groupId);
        if (matchById) return matchById;
    }
    if (taxVal !== null && !isNaN(taxVal)) {
        const matchByPercent = groups.find(g => Number(g.percentage) === taxVal);
        if (matchByPercent) return matchByPercent;
    }
    if (groupId !== null) {
        const matchByGroupIdAsPercent = groups.find(g => Number(g.percentage) === groupId);
        if (matchByGroupIdAsPercent) return matchByGroupIdAsPercent;
    }
    return null;
};

const ReceiveOrderForm = ({ requestId, onClose, onSave, mode = "edit", initialData }) => {
    const currencySymbol = useCurrencySymbol();

    const formatVariantSize = (size) => {
        if (!size) return "";
        if (typeof size === 'string' && size.trim().startsWith('{')) {
            try {
                const parsed = JSON.parse(size);
                const parts = [];
                if (parsed.height) parts.push(`${parsed.height}${parsed.heightUnit || 'mm'}H`);
                if (parsed.width) parts.push(`${parsed.width}${parsed.widthUnit || 'mm'}W`);
                if (parsed.length) parts.push(`${parsed.length}${parsed.lengthUnit || 'mm'}L`);
                if (parsed.radius) parts.push(`R:${parsed.radius}${parsed.radiusUnit || 'mm'}`);
                if (parsed.weight) parts.push(`${parsed.weight}${parsed.weightUnit || 'g'}`);
                return parts.length > 0 ? parts.join(" x ") : size;
            } catch (e) {
                return size;
            }
        }
        return size;
    };

    // FORCE EDIT MODE FOR DEBUGGING
    const isView = mode === "view";
    const { jwtToken, userId, vendorSettings } = useStore();
    const cashSaleByDefault = getBoolSetting(vendorSettings, "cashSaleByDefault", true);
    const addTimeOnTransactions = getBoolSetting(vendorSettings, 'addTimeOnTransactions', false);
    const calculateTaxBasedOnMrp = getBoolSetting(vendorSettings, 'calculateTaxBasedOnMrp', false);
    const transactionWiseTax = getBoolSetting(vendorSettings, "transactionWiseTax", false);
    const transactionWiseDiscount = getBoolSetting(vendorSettings, "transactionWiseDiscount", false);
    const roundOffTotal = getBoolSetting(vendorSettings, "roundOffTotal", false);
    const [loading, setLoading] = useState(true);
    const [orderData, setOrderData] = useState(null);
    const [purchaseOrderNumber, setPurchaseOrderNumber] = useState("");

    // Form State
    const [receivedDate, setReceivedDate] = useState(toApiDateOnly(new Date()));
    const [items, setItems] = useState([]);
    const [expandedItems, setExpandedItems] = useState({ 0: true });
    const toggleItemExpand = (index) => {
        setExpandedItems(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };
    const [showBreakdown, setShowBreakdown] = useState(true);

    // Global Toggles & Inputs
    const [payBasedOnOrdered, setPayBasedOnOrdered] = useState(false);
    const [damagedReturnedGoods, setDamagedReturnedGoods] = useState(false);
    const [addToCreditNote, setAddToCreditNote] = useState(true);
    const [isRoundOffChecked, setIsRoundOffChecked] = useState(false);

    const [overallTax, setOverallTax] = useState({ value: 0, type: '%' });
    const [overallDiscount, setOverallDiscount] = useState({ value: 0, type: '%' });
    const [previousCredit, setPreviousCredit] = useState(0);
    const [paymentStatus, setPaymentStatus] = useState("Pending"); // Default to Pending matching ENUM
    const [paymentType, setPaymentType] = useState(cashSaleByDefault ? "Cash" : "");
    const [amountPaidTime, setAmountPaidTime] = useState("");
    const [paidAmount, setPaidAmount] = useState(0);
    const [duedate, setDuedate] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const [taxGroups, setTaxGroups] = useState([]);

    useEffect(() => {
        const fetchTaxData = async () => {
            const activeBranchId = orderData?.branchId || 91;
            if (!jwtToken) return;
            try {
                const groupsRes = await getTaxGroups(jwtToken, activeBranchId);
                const ratesRes = await getTaxRates(jwtToken, activeBranchId);

                const groupsPayload = groupsRes?.data || groupsRes;
                const rawGroups = Array.isArray(groupsPayload) ? groupsPayload : (groupsPayload?.data || groupsPayload?.taxGroups || []);

                const ratesPayload = ratesRes?.data || ratesRes;
                const rawRates = Array.isArray(ratesPayload) ? ratesPayload : (ratesPayload?.data || ratesPayload?.taxes || []);
                const mappedRates = rawRates.map((r) => ({
                    ...r,
                    id: r.taxTableId || r.id,
                    value: parseFloat(r.value) || 0,
                }));

                const mappedGroups = rawGroups.map((group) => {
                    const ratesArray = group.rates || group.taxTableId || [];
                    const selectedRates = ratesArray
                        .map(rId => mappedRates.find(r => Number(r.id) === Number(rId)))
                        .filter(Boolean);
                    const percentage = selectedRates.reduce((sum, r) => sum + r.value, 0);

                    return {
                        ...group,
                        id: group.taxGroupId || group.id,
                        percentage
                    };
                });

                setTaxGroups(mappedGroups);

                setItems(prevItems => {
                    if (!prevItems || prevItems.length === 0) return prevItems;
                    return prevItems.map(item => {
                        const newBatches = item.batches.map(batch => {
                            const matchingGroup = findMatchingTaxGroup(batch, mappedGroups);
                            if (matchingGroup) {
                                return {
                                    ...batch,
                                    taxGroupId: matchingGroup.id,
                                    tax: matchingGroup.percentage
                                };
                            }
                            return batch;
                        });
                        return {
                            ...item,
                            batches: newBatches
                        };
                    });
                });
            } catch (err) {
                console.error("Failed to fetch tax groups in receive order form:", err);
            }
        };
        if (jwtToken && (orderData?.branchId || loading === false)) {
            fetchTaxData();
        }
    }, [jwtToken, orderData?.branchId, loading]);

    useEffect(() => {
        if (jwtToken && requestId) {
            fetchOrderDetails();
        }
    }, [jwtToken, requestId]);

    const fetchOrderDetails = async () => {
        setLoading(true);
        try {
            const res = await purchaseService.getPurchaseRequestSummary(jwtToken, requestId);
            if (res.status === "success") {
                setOrderData(res.data);
                setPurchaseOrderNumber(String(res.data.purchaseRequestId).padStart(6, '0'));
                const receivedDetails = res.data.receivedDetails;
                const rawItems = res.data.items || res.data.orderItems || [];

                const mapped = rawItems.map(item => {
                    const productInfo = item.itemDetails || item;
                    const savedItems = receivedDetails?.items?.filter(ri =>
                        (ri.productId === item.productId || ri.productId === productInfo.productId) &&
                        (ri.variantId === item.variantId || ri.variantId === productInfo.variantId)
                    ) || [];

                    let batches = [];
                    if (savedItems.length > 0) {
                        batches = savedItems.map(savedItem => ({
                            batchNumber: savedItem.batchNumber || "",
                            expDate: savedItem.expDate || "",
                            costPrice: savedItem.costPrice !== undefined && savedItem.costPrice !== null && savedItem.costPrice !== "" ? Number(savedItem.costPrice).toFixed(getAmountDecimalPlaces()) : "",
                            mrp: savedItem.mrp !== undefined && savedItem.mrp !== null && savedItem.mrp !== "" ? Number(savedItem.mrp).toFixed(getAmountDecimalPlaces()) : "",
                            receivedQty: savedItem.receivedQty ?? "",
                            damagedQty: savedItem.damagedQty ?? "",
                            tax: savedItem.taxPercentage ?? savedItem.tax ?? 0,
                            taxGroupId: savedItem.taxGroupId ?? savedItem.gst ?? null,
                            discount: savedItem.discount || 0,
                        }));
                    } else {
                        batches = [{
                            batchNumber: "",
                            expDate: "",
                            costPrice: item.costPrice !== undefined && item.costPrice !== null && item.costPrice !== "" ? Number(item.costPrice).toFixed(getAmountDecimalPlaces()) : "",
                            mrp: (item.mrp || productInfo.mrp || productInfo.variant?.mrp || productInfo.sellingPrice || item.sellingPrice) !== undefined && (item.mrp || productInfo.mrp || productInfo.variant?.mrp || productInfo.sellingPrice || item.sellingPrice) !== null && (item.mrp || productInfo.mrp || productInfo.variant?.mrp || productInfo.sellingPrice || item.sellingPrice) !== "" ? Number(item.mrp || productInfo.mrp || productInfo.variant?.mrp || productInfo.sellingPrice || item.sellingPrice).toFixed(getAmountDecimalPlaces()) : "",
                            receivedQty: "",
                            damagedQty: "",
                            tax: item.taxPercentage ?? productInfo.taxPercentage ?? item.tax ?? productInfo.tax ?? 0,
                            taxGroupId: item.taxGroupId ?? productInfo.taxGroupId ?? item.gst ?? productInfo.gst ?? null,
                            discount: 0,
                        }];
                    }

                    return {
                        productId: item.productId || productInfo.productId,
                        variantId: item.variantId || productInfo.variantId,
                        productName: productInfo.productName || "Unknown Product",
                        variantType: productInfo.variantType || productInfo.variant || {},
                        notes: savedItems.length > 0 ? savedItems[0].notes : "",
                        qty: item.qty || item.orderQuantity || 0,
                        batches
                    };
                });
                setItems(mapped);

                if (receivedDetails) {
                    setReceivedDate(receivedDetails.receivedDate || toApiDateOnly(new Date()));
                    setPayBasedOnOrdered(receivedDetails.toggles?.payBasedOnOrdered || receivedDetails.shortFallApplicable || false);
                    setDamagedReturnedGoods(receivedDetails.toggles?.damagedReturnedGoods || false);
                    setAddToCreditNote(receivedDetails.toggles?.addToCreditNote || false);
                    setOverallTax(receivedDetails.overallTax || { value: 0, type: '%' });
                    setOverallDiscount(receivedDetails.overallDiscount || { value: 0, type: '${currencySymbol}' });
                    setPreviousCredit(receivedDetails.previousCredit || 0);
                    setPaymentStatus(receivedDetails.paymentStatus || "Pending");
                    setPaidAmount(receivedDetails.paidAmount ? Number(receivedDetails.paidAmount).toFixed(getAmountDecimalPlaces()) : 0);
                    setDuedate(receivedDetails.duedate || "");
                }
            } else {
                toast.error("Failed to fetch order details");
                onClose();
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleBatchChange = (itemIndex, batchIndex, field, value) => {
        let finalValue = value;
        const numericFields = ["costPrice", "mrp", "receivedQty", "damagedQty", "tax", "discount"];
        if (numericFields.includes(field)) {
            if (typeof value === "string" && value.length > 1 && value.startsWith("0") && value[1] !== ".") {
                finalValue = value.replace(/^0+/, '') || "";
            }
        }

        setItems(prevItems => {
            const newItems = [...prevItems];
            const newItem = { ...newItems[itemIndex] };
            const newBatches = [...newItem.batches];
            newBatches[batchIndex] = { ...newBatches[batchIndex], [field]: finalValue };
            newItem.batches = newBatches;
            newItems[itemIndex] = newItem;
            return newItems;
        });
    };

    const addBatch = (itemIndex) => {
        setItems(prevItems => {
            const newItems = [...prevItems];
            const newItem = { ...newItems[itemIndex] };
            const lastBatch = newItem.batches[newItem.batches.length - 1] || {};
            newItem.batches = [
                ...newItem.batches,
                {
                    batchNumber: "",
                    expDate: "",
                    costPrice: lastBatch.costPrice !== undefined && lastBatch.costPrice !== null && lastBatch.costPrice !== "" ? Number(lastBatch.costPrice).toFixed(getAmountDecimalPlaces()) : "",
                    mrp: lastBatch.mrp !== undefined && lastBatch.mrp !== null && lastBatch.mrp !== "" ? Number(lastBatch.mrp).toFixed(getAmountDecimalPlaces()) : "",
                    receivedQty: "",
                    damagedQty: "",
                    tax: lastBatch.tax || 0,
                    discount: lastBatch.discount || 0
                }
            ];
            newItems[itemIndex] = newItem;
            return newItems;
        });
    };

    const removeBatch = (itemIndex, batchIndex) => {
        setItems(prevItems => {
            const newItems = [...prevItems];
            const newItem = { ...newItems[itemIndex] };
            newItem.batches = newItem.batches.filter((_, i) => i !== batchIndex);
            newItems[itemIndex] = newItem;
            return newItems;
        });
    };

    const totals = useMemo(() => {
        if (!items.length) return { totalCost: 0, subtotal: 0, shortfallAmount: 0, damagedAmount: 0, itemDiscountTotal: 0, itemTaxTotal: 0, grandTotal: 0, discountableAmount: 0 };

        let totalOrderValue = 0;
        let grandTotal = 0;
        let shortfallAmount = 0;
        let damagedAmount = 0;
        let itemDiscountTotal = 0;
        let itemTaxTotal = 0;
        let discountableAmountSum = 0;

        items.forEach(item => {
            const ordered = parseFloat(item.qty) || 0;
            let totalCostOfReceived = 0;
            let totalReceived = 0;
            let firstCost = 0;
            let hasEnteredBatch = false;

            item.batches.forEach((batch, bIdx) => {
                const isEntered = batch.costPrice !== "" && batch.receivedQty !== "";
                if (!isEntered) return;
                hasEnteredBatch = true;

                const cost = parseFloat(batch.costPrice) || 0;
                if (bIdx === 0 || firstCost === 0) firstCost = cost;

                const received = parseFloat(batch.receivedQty) || 0;
                const damaged = parseFloat(batch.damagedQty) || 0;
                const discountPercent = parseFloat(batch.discount) || 0;
                const taxPercent = parseFloat(batch.tax) || 0;

                totalReceived += received;
                totalCostOfReceived += (received * cost);

                // 3. Damage Amount = Damaged Qty × Cost Price
                damagedAmount += (damaged * cost);

                // 4. Effective Billing Qty based on toggles
                const effectiveOrdered = bIdx === 0 ? ordered : 0;
                const baseQty = payBasedOnOrdered ? effectiveOrdered : received;
                const billingQty = damagedReturnedGoods ? Math.max(0, baseQty - damaged) : baseQty;

                // 5. Billable Subtotal
                const billableSubtotal = billingQty * cost;
                discountableAmountSum += billableSubtotal;

                // 6. Discount Amount
                const discountAmount = (billableSubtotal * discountPercent / 100);
                itemDiscountTotal += discountAmount;

                // 7. Amount After Discount
                const amountAfterDiscount = billableSubtotal - discountAmount;

                // 8. Tax Amount
                const mrp = parseFloat(batch.mrp) || 0;
                const taxBase = calculateTaxBasedOnMrp && mrp > 0 ? (mrp * billingQty) : amountAfterDiscount;
                const taxAmount = (taxBase * taxPercent / 100);
                itemTaxTotal += taxAmount;

                // 9. Final Product Amount
                grandTotal += amountAfterDiscount + taxAmount;
            });

            if (hasEnteredBatch) {
                const averageCost = totalReceived > 0 ? (totalCostOfReceived / totalReceived) : firstCost;
                totalOrderValue += (ordered * averageCost);
                if (ordered > totalReceived) {
                    shortfallAmount += (ordered - totalReceived) * averageCost;
                }
            }
        });

        return {
            totalCost: totalOrderValue,
            shortfallAmount,
            damagedAmount,
            itemDiscountTotal,
            itemTaxTotal,
            grandTotal,
            discountableAmount: discountableAmountSum
        };
    }, [items, payBasedOnOrdered, damagedReturnedGoods, calculateTaxBasedOnMrp]);

    const breakdown = useMemo(() => {
        const { grandTotal } = totals;
        let discountVal = Number(overallDiscount.value) || 0;
        if (overallDiscount.type === '%') discountVal = (grandTotal * (overallDiscount.value / 100));

        let taxVal = Number(overallTax.value) || 0;
        if (overallTax.type === '%') taxVal = ((grandTotal - discountVal) * (overallTax.value / 100));

        const subtotal = grandTotal;
        const totalAfterGlobal = subtotal - discountVal + taxVal;
        let finalAmountBeforeRound = totalAfterGlobal - previousCredit;
        let finalAmount = finalAmountBeforeRound;
        let roundOffAmount = 0;

        if (isRoundOffChecked && vendorSettings?.transaction) {
            const rType = vendorSettings.transaction.roundOffType || "nearest";
            const rVal = Number(vendorSettings.transaction.roundOffValue) || 1;
            
            let roundedAmount = finalAmount;
            if (rVal > 0) {
                if (rType === "nearest") {
                    roundedAmount = Math.round(finalAmount / rVal) * rVal;
                } else if (rType === "down") {
                    roundedAmount = Math.floor(finalAmount / rVal) * rVal;
                } else if (rType === "up") {
                    roundedAmount = Math.ceil(finalAmount / rVal) * rVal;
                }
                roundOffAmount = roundedAmount - finalAmountBeforeRound;
                finalAmount = roundedAmount;
            }
        }

        return { discountVal, taxVal, subtotal, finalAmountBeforeRound, finalAmount, totalAfterGlobal, roundOffAmount };
    }, [totals, overallTax, overallDiscount, previousCredit, isRoundOffChecked, vendorSettings]);

    useEffect(() => {
        if (addTimeOnTransactions) {
            const now = new Date();
            setAmountPaidTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
        }
    }, [addTimeOnTransactions]);

    useEffect(() => {
        if (paymentStatus === "Full") {
            setPaidAmount(Number(breakdown.finalAmount).toFixed(getAmountDecimalPlaces()));
        }
    }, [breakdown.finalAmount, paymentStatus]);

    const handlePaymentStatusChange = (status) => {
        setPaymentStatus(status);
        if (status === "Full") {
            setPaidAmount(Number(breakdown.finalAmount).toFixed(getAmountDecimalPlaces()));
        } else if (status === "Pending" || status === "PayLaterWithRemainder") {
            setPaidAmount(0);
        } else if (status === "Partial") {
            setPaidAmount("");
        }
    };

    const scrollToFirstError = () => {
        setTimeout(() => {
            const firstErrorEl = document.querySelector(`.${styles.inputError}, .${styles.errorInput}`);
            if (firstErrorEl) {
                firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstErrorEl.focus?.();
            }
        }, 100);
    };

    const handleSave = async () => {
        setIsSubmitted(true);
        setLoading(true);
        console.log("Starting handleSave...");
        try {
            // Expand all invalid items so their inline errors can render in the DOM simultaneously
            const newExpanded = { ...expandedItems };
            let hasAnyItemError = false;

            items.forEach((item, idx) => {
                let totalReceived = 0;
                let hasItemError = false;
                item.batches.forEach(batch => {
                    const batchHasError = batch.costPrice === "" || batch.costPrice === undefined || batch.costPrice === null || Number(batch.costPrice) <= 0 ||
                        batch.mrp === "" || batch.mrp === undefined || batch.mrp === null || Number(batch.mrp) <= 0 ||
                        batch.receivedQty === "" || batch.receivedQty === undefined || batch.receivedQty === null || Number(batch.receivedQty) <= 0 ||
                        (batch.damagedQty !== "" && batch.damagedQty !== undefined && batch.damagedQty !== null && Number(batch.damagedQty) < 0) ||
                        (Number(batch.costPrice) > Number(batch.mrp) && batch.mrp > 0) ||
                        Number(batch.damagedQty) > Number(batch.receivedQty);

                    if (batchHasError) hasItemError = true;
                    totalReceived += Number(batch.receivedQty) || 0;
                });

                if (totalReceived > Number(item.qty)) hasItemError = true;

                if (hasItemError) {
                    newExpanded[idx] = true;
                    hasAnyItemError = true;
                }
            });

            if (hasAnyItemError) {
                setExpandedItems(newExpanded);
            }

            let hasEmptyFields = false;
            let hasInvalidPrices = false;
            let hasInvalidDamaged = false;
            let hasInvalidReceived = false;

            items.forEach(item => {
                let totalReceived = 0;
                item.batches.forEach(batch => {
                    if (batch.costPrice === "" || batch.costPrice === undefined || batch.costPrice === null || Number(batch.costPrice) <= 0 ||
                        batch.mrp === "" || batch.mrp === undefined || batch.mrp === null || Number(batch.mrp) <= 0 ||
                        batch.receivedQty === "" || batch.receivedQty === undefined || batch.receivedQty === null || Number(batch.receivedQty) <= 0 ||
                        (batch.damagedQty !== "" && batch.damagedQty !== undefined && batch.damagedQty !== null && Number(batch.damagedQty) < 0)) {
                        hasEmptyFields = true;
                    }
                    if (Number(batch.costPrice) > Number(batch.mrp) && batch.mrp > 0) hasInvalidPrices = true;
                    if (Number(batch.damagedQty) > Number(batch.receivedQty)) hasInvalidDamaged = true;
                    totalReceived += Number(batch.receivedQty) || 0;
                });
                if (totalReceived > Number(item.qty)) hasInvalidReceived = true;
            });

            if (!receivedDate) {
                setLoading(false);
                toast.error("Received date is required.");
                scrollToFirstError();
                return;
            }

            if (hasEmptyFields || hasInvalidPrices || hasInvalidReceived || hasInvalidDamaged) {
                setLoading(false);
                if (hasEmptyFields) toast.error("Please fill all required fields correctly.");
                else if (hasInvalidPrices) toast.error("Cost Price cannot be greater than MRP.");
                else if (hasInvalidReceived) toast.error("Total received quantity cannot exceed ordered quantity.");
                else if (hasInvalidDamaged) toast.error("Damaged quantity cannot exceed received quantity.");
                scrollToFirstError();
                return;
            }

            if ((paymentStatus === "Partial" || paymentStatus === "Full") && !paymentType) {
                setLoading(false);
                toast.error("Please select a payment type.");
                scrollToFirstError();
                return;
            }

            if (paymentStatus === "Partial" && (!paidAmount || Number(paidAmount) <= 0)) {
                setLoading(false);
                toast.error("Please enter a valid paid amount for Partial payment.");
                scrollToFirstError();
                return;
            }

            const todayStr = toApiDateOnly(new Date());
            if (paymentStatus !== "Full" && (!duedate || duedate < todayStr)) {
                setLoading(false);
                toast.error("Please enter a valid due date for pending/partial payments.");
                scrollToFirstError();
                return;
            }

            const receivedDateFields = dateOnlyWithTimeZone(
                "receivedDate",
                parseWallClockDate(receivedDate) || new Date(receivedDate),
            );
            const payload = {
                productsPurchaseRqstId: requestId,
                branchId: orderData?.branchId || 91,
                ...receivedDateFields,
                amountPaidToSupplier: paymentStatus === "Full" ? Number(breakdown.finalAmount) : Number(paidAmount),
                paymentMethod: paymentStatus !== "Pending" ? paymentType : undefined,
                paymentTime: paymentStatus !== "Pending" ? amountPaidTime : undefined,
                paymentStatus: paymentStatus,
                duedate: paymentStatus === "Full" ? null : duedate,
                returnsApplicable: damagedReturnedGoods,
                createdBy: userId || 1,
                additionalDetails: items[0]?.notes || "Purchase order received",
                taxGroupId: 1,
                overallTax: overallTax,
                overallDiscount: overallDiscount,
                previousCredit: Number(previousCredit),
                amount: Number(breakdown.finalAmount),
                overallBillAmount: Number(breakdown.totalAfterGlobal),
                itemDiscountAmount: Number(totals.itemDiscountTotal),
                itemTaxAmount: Number(totals.itemTaxTotal),
                damagedAmount: Number(totals.damagedAmount),
                shortfallAmount: Number(totals.shortfallAmount),
                shortFallApplicable: payBasedOnOrdered ? true : false,
                bill: {
                    billNumber: purchaseOrderNumber,
                    ...receivedDateFields,
                },
                billItems: items.flatMap(item =>
                    item.batches.map((batch) => ({
                        productId: item.productId,
                        variantId: item.variantId,
                        costPrice: Number(batch.costPrice),
                        mrp: Number(batch.mrp),
                        qty: Number(item.qty),
                        receivedQuantity: Number(batch.receivedQty),
                        damagedQuantity: Number(batch.damagedQty),
                        discount: Number(batch.discount),
                        taxGroupId: Number(batch.tax) || 0,
                        expiryDate: batch.expDate,
                        batchNumber: batch.batchNumber
                    }))
                )
            };

            console.log("Sending payload to vendor/bills:", payload);

            const res = await purchaseService.createBill(jwtToken, payload);
            console.log("API Response:", res);

            if (res.status === "success" || res.status === 200 || res.id) {
                toast.success("Bill created successfully");
                onSave();
                onClose();
            } else {
                toast.error(res.message || "Failed to save details");
            }
        } catch (error) {
            console.error("Save Error:", error);
            toast.error("An error occurred while saving");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !orderData) return <div className={styles.loading}>Loading order details...</div>;
    if (!orderData) return <div className={styles.error}>No order data found</div>;

    // IF ORDER IS RECEIVED, SHOW SUMMARY VIEW
    if (orderData.orderStatus === 'received' || isView) {
        return <PurchaseOrderSummary data={orderData} onClose={onClose} onRefresh={fetchOrderDetails} initialData={initialData} />;
    }

    return (
        <div className={styles.container}>
            <div className={styles.mainContent}>
                <div className={styles.headerSection}>
                    <h2 className={styles.title}>
                        Receive Purchase Order <span className={styles.poNumberText}>{purchaseOrderNumber}</span>
                    </h2>
                </div>

                <div className={styles.itemList}>
                    {items.map((item, index) => {
                        const ordered = parseFloat(item.qty) || 0;
                        let totalReceived = 0;
                        let totalDamaged = 0;
                        let itemRowTotal = 0;
                        let firstCost = 0;

                        item.batches.forEach((batch, bIdx) => {
                            const cost = parseFloat(batch.costPrice) || 0;
                            if (bIdx === 0) firstCost = cost;
                            const received = parseFloat(batch.receivedQty) || 0;
                            const damaged = parseFloat(batch.damagedQty) || 0;
                            totalReceived += received;
                            totalDamaged += damaged;

                            const effectiveOrdered = bIdx === 0 ? ordered : 0;
                            const baseQty = payBasedOnOrdered ? effectiveOrdered : received;
                            const billingQty = damagedReturnedGoods ? Math.max(0, baseQty - damaged) : baseQty;

                            const billableSubtotal = billingQty * cost;
                            const discPercent = parseFloat(batch.discount) || 0;
                            const discAmount = (billableSubtotal * discPercent / 100);
                            const afterDiscount = billableSubtotal - discAmount;
                            const taxPercent = parseFloat(batch.tax) || 0;
                            const taxAmount = afterDiscount * (taxPercent / 100);
                            itemRowTotal += afterDiscount + taxAmount;
                        });

                        const rowOrdered = ordered * firstCost;

                        return (
                            <div key={index} className={`${styles.productCard} ${expandedItems[index] ? styles.productCardActive : ""}`}>
                                <div className={styles.cardHeader} onClick={() => toggleItemExpand(index)}>
                                    <div className={styles.headerInfo}>
                                        <div className={styles.headerTitleLine}>
                                            <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
                                            <span className={styles.productName}>{item.productName} - {[formatVariantSize(item.variantType?.size), item.variantType?.variantName, item.variantType?.packType].filter(Boolean).join(" ")}</span>
                                        </div>
                                        <div className={styles.headerStatsLine}>
                                            <span>Ordered : {item.qty}</span>
                                            <span>Received : {totalReceived || 0}</span>
                                            <span>Damaged : {totalDamaged || 0}</span>
                                            <span>Shortfall : {Math.max(0, (Number(item.qty) || 0) - totalReceived)}</span>
                                        </div>
                                    </div>
                                    <div className={styles.headerRight}>
                                        <div className={styles.headerTotalValue}>Total Value : <span>{currencySymbol} {itemRowTotal.toLocaleString(undefined, { minimumFractionDigits: getAmountDecimalPlaces(), maximumFractionDigits: getAmountDecimalPlaces() })}</span></div>
                                        <FiChevronDown className={`${styles.expandIcon} ${expandedItems[index] ? styles.expandIconActive : ""}`} />
                                    </div>
                                </div>

                                {expandedItems[index] && (
                                    <div className={styles.cardContent}>
                                        {item.batches.map((batch, bIdx) => {
                                            const cost = parseFloat(batch.costPrice) || 0;
                                            const received = parseFloat(batch.receivedQty) || 0;
                                            const damaged = parseFloat(batch.damagedQty) || 0;
                                            const effectiveOrdered = bIdx === 0 ? ordered : 0;
                                            const baseQty = payBasedOnOrdered ? effectiveOrdered : received;
                                            const billingQty = damagedReturnedGoods ? Math.max(0, baseQty - damaged) : baseQty;

                                            const billableSubtotal = billingQty * cost;
                                            const discPercent = parseFloat(batch.discount) || 0;
                                            const discAmount = (billableSubtotal * discPercent / 100);
                                            const afterDiscount = billableSubtotal - discAmount;
                                            const taxPercent = parseFloat(batch.tax) || 0;
                                            const taxAmount = afterDiscount * (taxPercent / 100);
                                            const rowTotal = afterDiscount + taxAmount;

                                            return (
                                                <div key={bIdx} style={{ position: 'relative', marginBottom: bIdx < item.batches.length - 1 ? '32px' : '0', paddingBottom: bIdx < item.batches.length - 1 ? '32px' : '0', borderBottom: bIdx < item.batches.length - 1 ? '1px dashed #e5e7eb' : 'none' }}>
                                                    {bIdx > 0 && (
                                                        <div style={{ position: 'absolute', top: '-16px', right: '0', zIndex: 10 }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeBatch(index, bIdx)}
                                                                style={{ color: '#ef4444', background: '#fee2e2', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                                                            >
                                                                Remove Batch
                                                            </button>
                                                        </div>
                                                    )}
                                                    <div className={styles.fieldGrid}>
                                                        <div className={styles.fieldGroup}>
                                                            <div className={styles.labelWithInfo}>
                                                                <label className={styles.fieldLabel}>Batch Number</label>
                                                                <div className={styles.infoTooltip} data-tooltip="If not entered, a batch number will be automatically assigned">
                                                                    <FiInfo className={styles.infoIcon} style={{ color: '#EF4444' }} />
                                                                </div>
                                                            </div>
                                                            <input
                                                                type="text"
                                                                className={styles.input}
                                                                placeholder="0000"
                                                                value={batch.batchNumber ?? ""}
                                                                onChange={(e) => handleBatchChange(index, bIdx, "batchNumber", e.target.value)}
                                                            />
                                                        </div>

                                                        <div className={styles.fieldGroup}>
                                                            <label className={styles.fieldLabel}>Expire Date</label>
                                                            <input
                                                                type="date"
                                                                className={styles.input}
                                                                value={batch.expDate ?? ""}
                                                                min={toApiDateOnly(new Date())}
                                                                max="9999-12-31"
                                                                onChange={(e) => handleBatchChange(index, bIdx, "expDate", e.target.value)}
                                                            />
                                                        </div>

                                                        <div className={styles.fieldGroup}>
                                                            <label className={styles.fieldLabel}>Cost Price <span style={{ color: '#ff4d4f' }}>*</span></label>
                                                            <div className={styles.inputWrapper}>
                                                                <span className={styles.currencySymbol}>{currencySymbol}</span>
                                                                <input
                                                                    type="text"
                                                                    className={`${styles.input} ${styles.inputWithSymbol} ${(Number(batch.costPrice) > Number(batch.mrp) && batch.mrp > 0) || (batch.costPrice !== "" && batch.costPrice !== undefined && batch.costPrice !== null && Number(batch.costPrice) <= 0) || (isSubmitted && (batch.costPrice === "" || batch.costPrice === undefined || batch.costPrice === null)) ? styles.inputError : ""}`}
                                                                    placeholder="0"
                                                                    value={batch.costPrice === 0 ? "" : (mode === "view" ? Number(batch.costPrice || 0).toLocaleString(undefined, { minimumFractionDigits: getAmountDecimalPlaces(), maximumFractionDigits: getAmountDecimalPlaces() }) : (batch.costPrice ?? ""))}
                                                                    onFocus={(e) => e.target.select()}
                                                                    onChange={(e) => handleBatchChange(index, bIdx, "costPrice", e.target.value)}
                                                                    onBlur={(e) => {
                                                                        if (e.target.value !== "") {
                                                                            handleBatchChange(index, bIdx, "costPrice", Number(e.target.value).toFixed(getAmountDecimalPlaces()));
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                            {(Number(batch.costPrice) > Number(batch.mrp) && batch.mrp > 0) && (
                                                                <span className={styles.errorLabel} style={{ marginTop: '4px', display: 'block' }}>cost price can not be greater than mrp</span>
                                                            )}
                                                            {((batch.costPrice !== "" && batch.costPrice !== undefined && batch.costPrice !== null && Number(batch.costPrice) <= 0) || (isSubmitted && (batch.costPrice === "" || batch.costPrice === undefined || batch.costPrice === null))) && (
                                                                <span className={styles.errorLabel} style={{ marginTop: '4px', display: 'block' }}>Cost price is required and must be greater than 0</span>
                                                            )}
                                                        </div>

                                                        <div className={styles.fieldGroup}>
                                                            <label className={styles.fieldLabel}>MRP <span style={{ color: '#ff4d4f' }}>*</span></label>
                                                            <div className={styles.inputWrapper}>
                                                                <span className={styles.currencySymbol}>{currencySymbol}</span>
                                                                <input
                                                                    type="text"
                                                                    className={`${styles.input} ${styles.inputWithSymbol} ${(batch.mrp !== "" && batch.mrp !== undefined && batch.mrp !== null && Number(batch.mrp) <= 0) || (isSubmitted && (batch.mrp === "" || batch.mrp === undefined || batch.mrp === null)) ? styles.inputError : ""}`}
                                                                    placeholder="0"
                                                                    value={batch.mrp === 0 ? "" : (mode === "view" ? Number(batch.mrp || 0).toLocaleString(undefined, { minimumFractionDigits: getAmountDecimalPlaces(), maximumFractionDigits: getAmountDecimalPlaces() }) : (batch.mrp ?? ""))}
                                                                    onFocus={(e) => e.target.select()}
                                                                    onChange={(e) => handleBatchChange(index, bIdx, "mrp", e.target.value)}
                                                                    onBlur={(e) => {
                                                                        if (e.target.value !== "") {
                                                                            handleBatchChange(index, bIdx, "mrp", Number(e.target.value).toFixed(getAmountDecimalPlaces()));
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                            {((batch.mrp !== "" && batch.mrp !== undefined && batch.mrp !== null && Number(batch.mrp) <= 0) || (isSubmitted && (batch.mrp === "" || batch.mrp === undefined || batch.mrp === null))) && (
                                                                <span className={styles.errorLabel} style={{ marginTop: '4px', display: 'block' }}>MRP is required and must be greater than 0</span>
                                                            )}
                                                        </div>

                                                        <div className={styles.fieldGroup}>
                                                            <label className={styles.fieldLabel}>Received Qty. <span style={{ color: '#ff4d4f' }}>*</span></label>
                                                            <input
                                                                type="number"
                                                                placeholder="0"
                                                                className={`${styles.input} ${(totalReceived > Number(item.qty)) || (batch.receivedQty !== "" && batch.receivedQty !== undefined && batch.receivedQty !== null && Number(batch.receivedQty) <= 0) || (isSubmitted && (batch.receivedQty === "" || batch.receivedQty === undefined || batch.receivedQty === null)) ? styles.inputError : ""}`}
                                                                value={batch.receivedQty ?? ""}
                                                                onFocus={(e) => e.target.select()}
                                                                onChange={(e) => handleBatchChange(index, bIdx, "receivedQty", e.target.value)}
                                                            />
                                                            {((batch.receivedQty !== "" && batch.receivedQty !== undefined && batch.receivedQty !== null && Number(batch.receivedQty) <= 0) || (isSubmitted && (batch.receivedQty === "" || batch.receivedQty === undefined || batch.receivedQty === null))) ? (
                                                                <span className={styles.errorLabel} style={{ marginTop: '4px', display: 'block' }}>Received quantity is required and must be greater than 0</span>
                                                            ) : totalReceived > Number(item.qty) ? (
                                                                <span className={styles.errorLabel} style={{ marginTop: '4px', display: 'block' }}>Total received quantity across all batches ({totalReceived}) cannot exceed ordered quantity ({item.qty}).</span>
                                                            ) : null}
                                                        </div>

                                                        <div className={styles.fieldGroup}>
                                                            <div className={styles.labelWithInfo}>
                                                                <label className={styles.fieldLabel}>Damaged Items</label>
                                                                <div className={styles.infoTooltip} data-tooltip="damage quanty will count from recived quantity">
                                                                    <FiInfo className={styles.infoIcon} style={{ color: '#EF4444' }} />
                                                                </div>
                                                            </div>
                                                            <input
                                                                type="number"
                                                                placeholder="0"
                                                                className={`${styles.input} ${(Number(batch.damagedQty) > Number(batch.receivedQty)) || (batch.damagedQty !== "" && batch.damagedQty !== undefined && batch.damagedQty !== null && Number(batch.damagedQty) < 0) ? styles.inputError : ""}`}
                                                                value={batch.damagedQty ?? ""}
                                                                onFocus={(e) => e.target.select()}
                                                                onChange={(e) => handleBatchChange(index, bIdx, "damagedQty", e.target.value)}
                                                            />
                                                            {Number(batch.damagedQty) > Number(batch.receivedQty) && (
                                                                <span className={styles.errorLabel} style={{ marginTop: '4px', display: 'block' }}>damaged qty can not be greater than recieved qty</span>
                                                            )}
                                                            {(batch.damagedQty !== "" && batch.damagedQty !== undefined && batch.damagedQty !== null && Number(batch.damagedQty) < 0) && (
                                                                <span className={styles.errorLabel} style={{ marginTop: '4px', display: 'block' }}>Damaged quantity cannot be negative</span>
                                                            )}
                                                        </div>

                                                        <div className={styles.fieldGroup}>
                                                            <label className={styles.fieldLabel}>Discountable Amount</label>
                                                            <div className={styles.inputWrapper}>
                                                                <span className={styles.currencySymbol}>{currencySymbol}</span>
                                                                <input
                                                                    type="text"
                                                                    className={`${styles.input} ${styles.inputWithSymbol}`}
                                                                    value={billableSubtotal.toLocaleString(undefined, { minimumFractionDigits: getAmountDecimalPlaces(), maximumFractionDigits: getAmountDecimalPlaces() })}
                                                                    readOnly
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className={styles.fieldGroup}>
                                                            <label className={styles.fieldLabel}>TAX (%)</label>
                                                            <select
                                                                className={styles.input}
                                                                value={batch.taxGroupId ?? ""}
                                                                onChange={(e) => {
                                                                    const selectedGroup = taxGroups.find(g => Number(g.id) === Number(e.target.value));
                                                                    if (selectedGroup) {
                                                                        handleBatchChange(index, bIdx, "taxGroupId", selectedGroup.id);
                                                                        handleBatchChange(index, bIdx, "tax", selectedGroup.percentage);
                                                                    } else {
                                                                        handleBatchChange(index, bIdx, "taxGroupId", null);
                                                                        handleBatchChange(index, bIdx, "tax", "");
                                                                    }
                                                                }}
                                                            >
                                                                <option value="">Select Tax Group</option>
                                                                {taxGroups.map((g) => (
                                                                    <option key={g.id} value={g.id}>
                                                                        {g.name} ({g.percentage}%)
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div className={styles.fieldGroup}>
                                                            <label className={styles.fieldLabel}>Discount (%)</label>
                                                            <div className={styles.inputWrapper}>
                                                                <span className={styles.currencySymbol}>%</span>
                                                                <input
                                                                    type="number"
                                                                    className={`${styles.input} ${styles.inputWithSymbol}`}
                                                                    value={batch.discount ?? ""}
                                                                    onFocus={(e) => e.target.select()}
                                                                    onChange={(e) => handleBatchChange(index, bIdx, "discount", e.target.value)}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className={styles.fieldGroup}>
                                                            <label className={styles.fieldLabel}>Amount</label>
                                                            <div className={styles.inputWrapper}>
                                                                <span className={styles.currencySymbol}>{currencySymbol}</span>
                                                                <input
                                                                    type="text"
                                                                    className={`${styles.input} ${styles.inputWithSymbol}`}
                                                                    value={rowTotal.toFixed(getAmountDecimalPlaces())}
                                                                    readOnly
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        <div style={{ marginTop: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                                            <button
                                                type="button"
                                                onClick={() => addBatch(index)}
                                                style={{ background: 'transparent', border: 'none', color: '#E93E64', padding: '8px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
                                            >
                                                + ADD BATCH
                                            </button>
                                        </div>

                                        <div className={styles.fieldGroups}>
                                            <label className={styles.fieldLabel}>Additional Details</label>
                                            <textarea className={styles.textarea} placeholder="Enter Additional details here" value={item.notes || ""} onChange={(e) => handleItemChange(index, 'notes', e.target.value)} />
                                        </div>



                                        <div className={styles.itemSummary}>
                                            <div className={styles.summaryItem}>
                                                <span className={styles.summaryLabel}>Total Ordered Value</span>
                                                <span className={styles.summaryValue}>{currencySymbol} {rowOrdered.toLocaleString(undefined, { minimumFractionDigits: getAmountDecimalPlaces(), maximumFractionDigits: getAmountDecimalPlaces() })}</span>
                                            </div>
                                            <div className={styles.summaryItem}>
                                                <span className={styles.summaryLabel}>Total Received Value</span>
                                                <span className={styles.summaryValue}>{currencySymbol} {(totalReceived * firstCost).toLocaleString(undefined, { minimumFractionDigits: getAmountDecimalPlaces(), maximumFractionDigits: getAmountDecimalPlaces() })}</span>
                                            </div>
                                            <div className={styles.summaryItem}>
                                                <span className={styles.summaryLabel}>Calculated Amount</span>
                                                <span className={styles.summaryValue}>{currencySymbol} {itemRowTotal.toLocaleString(undefined, { minimumFractionDigits: getAmountDecimalPlaces(), maximumFractionDigits: getAmountDecimalPlaces() })}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className={styles.sidebar}>
                <div className={styles.summarySection}>
                    <h3 className={styles.sidebarTitle}>Purchase Summary</h3>

                    <div className={styles.infoGroup}>
                        <span className={styles.infoLabel}>Supplier</span>
                        <span className={styles.infoValue}>{orderData.supplier?.supplierName}</span>
                        <span className={styles.infoSubValue}>India</span>
                    </div>

                    <div className={styles.infoGroup}>
                        <span className={styles.infoLabel}>Delivered To</span>
                        <span className={styles.infoValue}>{orderData.branchName}</span>
                        <span className={styles.infoSubValue}>{orderData.branchAddress?.addressText}</span>
                    </div>

                    <div className={styles.dateGrid}>
                        <div className={styles.infoGroup}>
                            <span className={styles.infoLabel}>Order Date</span>
                            <span className={styles.infoValue}>{new Date(orderData.orderDate).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className={styles.infoGroup}>
                            <span className={styles.infoLabel}>Received date <span style={{ color: '#ff4d4f' }}>*</span></span>
                            <div className={styles.inputWrapper}>
                                <input
                                    type="date"
                                    className={`${styles.input} ${isSubmitted && !receivedDate ? styles.inputError : ""}`}
                                    value={receivedDate}
                                    max={toApiDateOnly(new Date())}
                                    onChange={(e) => setReceivedDate(e.target.value)}
                                />
                            </div>
                            {isSubmitted && !receivedDate && (
                                <span className={styles.errorLabel} style={{ marginTop: '4px', display: 'block' }}>Received date is required.</span>
                            )}
                        </div>
                    </div>

                    <div className={styles.toggleRow}>
                        <span className={styles.toggleLabel}>Pay based on ordered quantity</span>
                        <div className={`${styles.toggle} ${payBasedOnOrdered ? styles.toggleActive : ""}`} onClick={() => setPayBasedOnOrdered(!payBasedOnOrdered)}>
                            <div className={`${styles.toggleCircle} ${payBasedOnOrdered ? styles.toggleCircleActive : ""}`} />
                        </div>
                    </div>

                    {payBasedOnOrdered && totals.shortfallAmount > 0 && (
                        <div className={styles.alertBox}>
                            <div className={styles.alertHeader}>
                                <span className={styles.alertValue}>{currencySymbol} {totals.shortfallAmount}</span>
                                <div className={styles.alertAction}>
                                    <FiCheckCircle className={styles.checkIconActive} />
                                    <span>Added to Credit Note</span>
                                </div>
                            </div>
                            <div className={styles.alertSub}>Delivery Shortfall</div>
                        </div>
                    )}

                    <div className={styles.alertBox}>
                        <div className={styles.alertHeader}>
                            <span className={styles.alertValue}>{currencySymbol} {totals.damagedAmount}</span>
                            <div className={`${styles.toggle} ${damagedReturnedGoods ? styles.toggleActive : ""}`} onClick={() => setDamagedReturnedGoods(!damagedReturnedGoods)}>
                                <div className={`${styles.toggleCircle} ${damagedReturnedGoods ? styles.toggleCircleActive : ""}`} />
                            </div>
                        </div>
                        <div className={styles.alertSub}>Damaged / Returned Goods</div>
                        <div className={styles.alertSmall}>Add damaged / returned goods to Credit</div>
                    </div>

                    <div className={styles.globalInputs}>
                        {transactionWiseTax && (
                            <div className={styles.inputGroup}>
                                <label className={styles.infoLabel}>Overall TAX</label>
                                <div className={styles.combinedInput}>
                                    <input type="number" className={styles.miniInput} value={overallTax.value} onChange={(e) => {
                                        let val = e.target.value;
                                        if (val.length > 1 && val.startsWith("0") && val[1] !== ".") val = val.slice(1);
                                        setOverallTax({ ...overallTax, value: val });
                                    }} />
                                    <select className={styles.miniSelect} value={overallTax.type} onChange={(e) => setOverallTax({ ...overallTax, type: e.target.value })}>
                                        <option>%</option>
                                        <option>{currencySymbol}</option>
                                    </select>
                                </div>
                            </div>
                        )}
                        {transactionWiseDiscount && (
                            <div className={styles.inputGroup}>
                                <label className={styles.infoLabel}>Overall Discount</label>
                                <div className={styles.combinedInput}>
                                    <input type="number" className={styles.miniInput} value={overallDiscount.value} onChange={(e) => {
                                        let val = e.target.value;
                                        if (val.length > 1 && val.startsWith("0") && val[1] !== ".") val = val.slice(1);
                                        setOverallDiscount({ ...overallDiscount, value: val });
                                    }} />
                                    <select className={styles.miniSelect} value={overallDiscount.type} onChange={(e) => setOverallDiscount({ ...overallDiscount, type: e.target.value })}>
                                        <option>{currencySymbol}</option>
                                        <option>%</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>



                    <div className={styles.breakdownContainer}>
                        <div className={styles.breakdownHeader} onClick={() => setShowBreakdown(!showBreakdown)}>
                            <span className={styles.breakdownTitle}>Cost Breakdown</span>
                            <FiChevronDown className={`${styles.expandIcon} ${showBreakdown ? styles.expandIconActive : ""}`} />
                        </div>
                        {showBreakdown && (
                            <div className={styles.breakdownContent}>
                                <div className={styles.breakdownRow}><span>Total cost</span><span>{currencySymbol} {totals.totalCost.toFixed(getAmountDecimalPlaces())}</span></div>

                                {!payBasedOnOrdered && totals.shortfallAmount > 0 && (
                                    <div className={styles.breakdownRow}><span>Shortfall Amount</span><span>- {currencySymbol} {totals.shortfallAmount.toFixed(getAmountDecimalPlaces())}</span></div>
                                )}

                                {damagedReturnedGoods && totals.damagedAmount > 0 && (
                                    <div className={styles.breakdownRow}><span>Damaged Amount</span><span>- {currencySymbol} {totals.damagedAmount.toFixed(getAmountDecimalPlaces())}</span></div>
                                )}

                                <div className={styles.breakdownRow}><span>Discountable Amount</span><span style={{ fontWeight: '700', color: '#000' }}>{currencySymbol} {totals.discountableAmount.toFixed(getAmountDecimalPlaces())}</span></div>

                                <div className={styles.breakdownRow}><span>Item Discount</span><span>- {currencySymbol} {totals.itemDiscountTotal.toFixed(getAmountDecimalPlaces())}</span></div>
                                <div className={styles.breakdownRow}><span>Item Tax</span><span>{currencySymbol} {totals.itemTaxTotal.toFixed(getAmountDecimalPlaces())}</span></div>
                                <div className={styles.breakdownDivider} />
                                <div className={styles.breakdownRow}><span>Subtotal</span><span>{currencySymbol} {breakdown.subtotal.toFixed(getAmountDecimalPlaces())}</span></div>
                                <div className={styles.breakdownRow}><span> Overall Discount</span><span>- {currencySymbol} {breakdown.discountVal.toFixed(getAmountDecimalPlaces())}</span></div>

                                <div className={styles.breakdownRow}><span>Overall Tax</span><span>{currencySymbol} {breakdown.taxVal.toFixed(getAmountDecimalPlaces())}</span></div>
                                {Number(previousCredit) > 0 && (
                                    <div className={styles.breakdownRow}><span> Previous Credit</span><span>- {currencySymbol} {Number(previousCredit).toFixed(getAmountDecimalPlaces())}</span></div>
                                )}
                                <div className={styles.breakdownRowBold}><span>Total</span><span>{currencySymbol} {breakdown.finalAmountBeforeRound.toFixed(getAmountDecimalPlaces())}</span></div>
                                
                                <div className={styles.breakdownDivider} style={{ marginTop: '8px' }} />
                                {roundOffTotal && (
                                    <>
                                        <div className={styles.breakdownRow} style={{ alignItems: 'center', marginTop: '8px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, color: '#000', fontSize: '14px' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={isRoundOffChecked}
                                                    onChange={(e) => setIsRoundOffChecked(e.target.checked)}
                                                    style={{ width: '16px', height: '16px', accentColor: '#000', cursor: 'pointer' }}
                                                />
                                                Round off
                                            </label>
                                            {isRoundOffChecked && (
                                                <span>{breakdown.roundOffAmount >= 0 ? '+' : '-'} {currencySymbol} {Math.abs(breakdown.roundOffAmount).toFixed(getAmountDecimalPlaces())}</span>
                                            )}
                                        </div>
                                        {isRoundOffChecked && (
                                            <div className={styles.breakdownRowBold} style={{ marginTop: '8px' }}>
                                                <span>Finalized Amount</span>
                                                <span>{currencySymbol} {breakdown.finalAmount.toFixed(getAmountDecimalPlaces())}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className={styles.infoGroup}>
                        <label className={styles.infoLabel}>Payment Status</label>
                        <div className={styles.statusGrid}>
                            {[
                                { label: "Full Payment", value: "Full" },
                                { label: "Pay Later", value: "PayLaterWithRemainder" },
                                { label: "Partial", value: "Partial" },
                                { label: "Not Paid", value: "Pending" }
                            ].map(status => (
                                <div key={status.value} className={`${styles.statusBadge} ${paymentStatus === status.value ? styles.statusBadgeActive : ""}`} onClick={() => handlePaymentStatusChange(status.value)}>
                                    <div className={styles.radioCircle} />
                                    <span>{status.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {(paymentStatus === "Partial" || paymentStatus === "Full") && (
                        <>
                        <div className={styles.infoGroup}>
                            <label className={styles.infoLabel}>Payment Type <span style={{ color: '#ff4d4f' }}>*</span></label>
                            <select
                                className={styles.input}
                                value={paymentType}
                                onChange={(e) => setPaymentType(e.target.value)}
                            >
                                <option value="" disabled hidden>Select Payment Type</option>
                                {['Cash', 'Cheque', 'UPI', 'Card', 'Bank'].map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            {isSubmitted && !paymentType && (
                                <span className={styles.errorLabel} style={{ marginTop: '4px', display: 'block' }}>Payment Type is required</span>
                            )}
                        </div>
                        {addTimeOnTransactions && (
                            <div className={styles.infoGroup}>
                                <label className={styles.infoLabel}>Payment Time</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <select 
                                        className={styles.input} 
                                        style={{ width: '30%', padding: '0 8px' }}
                                        value={amountPaidTime ? String(parseInt(amountPaidTime.split(':')[0]) % 12 || 12).padStart(2, '0') : '12'}
                                        onChange={(e) => {
                                            const h = parseInt(e.target.value);
                                            const m = amountPaidTime ? amountPaidTime.split(':')[1] : '00';
                                            const isPm = amountPaidTime ? parseInt(amountPaidTime.split(':')[0]) >= 12 : false;
                                            const newH = isPm ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
                                            setAmountPaidTime(`${String(newH).padStart(2, '0')}:${m}`);
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
                                        value={amountPaidTime ? amountPaidTime.split(':')[1] : '00'}
                                        onChange={(e) => {
                                            const currentH = amountPaidTime ? amountPaidTime.split(':')[0] : '00';
                                            setAmountPaidTime(`${currentH}:${e.target.value}`);
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
                                        value={amountPaidTime && parseInt(amountPaidTime.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                                        onChange={(e) => {
                                            const currentH = parseInt(amountPaidTime ? amountPaidTime.split(':')[0] : '00');
                                            const m = amountPaidTime ? amountPaidTime.split(':')[1] : '00';
                                            const isPm = e.target.value === 'PM';
                                            let newH = currentH;
                                            if (isPm && currentH < 12) newH = currentH + 12;
                                            if (!isPm && currentH >= 12) newH = currentH - 12;
                                            setAmountPaidTime(`${String(newH).padStart(2, '0')}:${m}`);
                                        }}
                                    >
                                        <option value="AM">AM</option>
                                        <option value="PM">PM</option>
                                    </select>
                                </div>
                            </div>
                        )}
                        <div className={styles.infoGroup}>
                            <label className={styles.infoLabel}>Paid Amount {paymentStatus === "Partial" && <span style={{ color: '#ff4d4f' }}>*</span>}</label>
                            <div className={styles.inputWrapper}>
                                <span className={styles.currencySymbol}>{currencySymbol}</span>
                                <input
                                    type="number"
                                    className={`${styles.input} ${styles.inputWithSymbol} ${isSubmitted && paymentStatus === "Partial" && (!paidAmount || Number(paidAmount) <= 0) ? styles.inputError : ""}`}
                                    placeholder="00000"
                                    value={paidAmount}
                                    readOnly={paymentStatus === "Full"}
                                    onChange={(e) => {
                                        let val = e.target.value;
                                        if (val.length > 1 && val.startsWith("0") && val[1] !== ".") val = val.slice(1);
                                        setPaidAmount(val);
                                    }}
                                    onBlur={() => {
                                        if (paidAmount) {
                                            setPaidAmount(Number(paidAmount).toFixed(getAmountDecimalPlaces()));
                                        }
                                    }}
                                />
                            </div>
                            {isSubmitted && paymentStatus === "Partial" && (!paidAmount || Number(paidAmount) <= 0) && (
                                <span className={styles.errorLabel} style={{ marginTop: '4px', display: 'block' }}>Paid amount is required for partial payment</span>
                            )}
                        </div>
                        </>
                    )}

                    {paymentStatus !== "Full" && (
                        <div className={styles.infoGroup}>
                            <label className={styles.infoLabel}>Payment Due Date <span style={{ color: '#ff4d4f' }}>*</span></label>
                            <div className={styles.inputWrapper}>
                                <input
                                    type="date"
                                    className={`${styles.input} ${isSubmitted && (!duedate || duedate < toApiDateOnly(new Date())) ? styles.inputError : ""}`}
                                    value={duedate}
                                    min={toApiDateOnly(new Date())}
                                    max="9999-12-31"
                                    onChange={(e) => setDuedate(e.target.value)}
                                    onBlur={(e) => {
                                        const today = toApiDateOnly(new Date());
                                        if (e.target.value && e.target.value < today) {
                                            setDuedate("");
                                            toast.error("Payment Due Date cannot be in the past");
                                        }
                                    }}
                                />
                            </div>
                            {isSubmitted && (!duedate || duedate < toApiDateOnly(new Date())) && (
                                <span className={styles.errorLabel} style={{ marginTop: '4px', display: 'block' }}>
                                    {!duedate ? "Payment Due Date is required" : "Payment Due Date cannot be in the past"}
                                </span>
                            )}
                        </div>
                    )}

                    <div className={styles.sidebarActions}>
                        <button className={styles.saveBtn} onClick={handleSave} disabled={loading}>Save</button>
                        <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiveOrderForm;
