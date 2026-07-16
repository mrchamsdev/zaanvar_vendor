import { getAmountDecimalPlaces } from "@/components/utilities/formatAmount";
import { getBoolSetting } from "@/utilities/settings-utils";
import { toApiDateOnly, dateOnlyWithTimeZone } from "@/utilities/date-time-utils";
import React, { useState, useEffect, useMemo } from "react";
import styles from "../../styles/sale/add-sale-invoice.module.css";
import { FiCalendar, FiChevronDown, FiTrash2, FiPrinter, FiPlus, FiTrendingUp } from "react-icons/fi";
import { saleService } from "../../services/saleService";
import SalePaymentDetailsPopup from "./SalePaymentDetailsPopup";
import CostCalculationPopup from "./CostCalculationPopup";
import { productService } from "../../services/productService";
import useStore from "../../components/state/useStore";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { toast } from "sonner";
import { useRouter } from "next/router";
import { getTermsAndConditions } from "../../services/settingsService";
import PrintInvoiceTemplate from "../shared/PrintInvoiceTemplate";
import useCurrencySymbol from "@/components/utilities/useCurrencySymbol";

const convertToBulletPoints = (text) => {
    if (!text) return "";
    return text
        .split('\n')
        .map(line => {
            const trimmed = line.trim();
            if (!trimmed) return "";
            if (trimmed.startsWith("• ")) return trimmed;
            if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
                return "• " + trimmed.substring(1).trimStart();
            }
            return "• " + trimmed;
        })
        .filter(Boolean)
        .join('\n');
};

const SaleInvoiceForm = ({ mode = "add", saleId, tabId, initialData, onSave, onCancel, onTitleChange }) => {
    const currencySymbol = useCurrencySymbol();

    const router = useRouter();
    const { jwtToken, userInfo, vendorSettings } = useStore();
    const roundOffTotal = getBoolSetting(vendorSettings, 'roundOffTotal', false);
    const { branchId } = useDashboardData({ skipReviews: true });

    const blockNewCustomerFromTxn = vendorSettings?.general?.blockNewCustomerFromTxn;
    const invoiceBillNoEditable = getBoolSetting(vendorSettings, 'invoiceBillNoEditable', false);
    const billingNameOfCustomer = getBoolSetting(vendorSettings, 'billingNameOfCustomer', false);
    const cashSaleByDefault = getBoolSetting(vendorSettings, 'cashSaleByDefault', true);
    const addTimeOnTransactions = getBoolSetting(vendorSettings, 'addTimeOnTransactions', false);
    const calculateTaxBasedOnMrp = getBoolSetting(vendorSettings, 'calculateTaxBasedOnMrp', false);
    const showProfitWhileMakingInvoice = getBoolSetting(vendorSettings, 'showProfitWhileMakingInvoice', false);
    const isViewOnly = mode === "view";

    const getActiveQty = (qty) => {
        return parseFloat(qty) || 0;
    };

    const calculateItemValues = (price, qty, discountPercent, taxPercent, itemMrp) => {
        const subtotal = price * qty;
        const discountAmount = Math.round(((subtotal * discountPercent) / 100) * 100) / 100;
        const amtAfterDiscount = subtotal - discountAmount;

        const taxableAmount = calculateTaxBasedOnMrp && itemMrp > 0 ? (itemMrp * qty) : amtAfterDiscount;
        const taxAmount = Math.round(((taxableAmount * taxPercent) / 100) * 100) / 100;

        // Amount is selling price based, plus tax
        const amount = Math.round((amtAfterDiscount + taxAmount) * 100) / 100;
        return { discountAmount, taxAmount, amount };
    };

    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);

    const formatVariantSize = (size) => {
        if (!size) return "";
        let formattedSize = size;
        if (typeof size === "string" && size.trim().startsWith("{")) {
            try {
                const parsed = JSON.parse(size);
                const parts = [];
                if (parsed.height) parts.push(`${parsed.height}${parsed.heightUnit || "mm"}H`);
                if (parsed.width) parts.push(`${parsed.width}${parsed.widthUnit || "mm"}W`);
                if (parsed.length) parts.push(`${parsed.length}${parsed.lengthUnit || "mm"}L`);
                if (parsed.radius) parts.push(`${parsed.radius}${parsed.radiusUnit || "mm"}R`);
                if (parsed.weight) parts.push(`${parsed.weight}${parsed.weightUnit || "g"}`);
                formattedSize = parts.length > 0 ? parts.join(" x ") : size;
            } catch (e) {
                formattedSize = size;
            }
        }
        const sizeStr = formattedSize.toString().trim();
        if (/^\d+(\.\d+)?$/.test(sizeStr)) {
            return `${sizeStr} pcs`;
        }
        return formattedSize;
    };

    const [formData, setFormData] = useState({
        partyName: "",
        billingName: "",
        phone: "",
        vendorCustomerId: null,
        discountForCustomer: 0,
        userOrderId: "",
        invoiceNumber: "",
        invoiceDate: toApiDateOnly(new Date()),
        status: "Pending"
    });

    const [items, setItems] = useState([
        {
            productId: "",
            variantId: "",
            productName: "",
            unit: "Unit Type",
            batchNumber: "",
            qty: "",
            purchasePrice: 0,
            price: 0,
            discount: 0,
            discountAmount: 0,
            taxPercent: 0,
            taxAmount: 0,
            amount: 0,
            availableQty: 0,
            availableVariants: [],
            availableBatches: []
        }
    ]);

    const [payments, setPayments] = useState([{ method: cashSaleByDefault ? "Cash" : "", amount: 0, referenceNumber: "" }]);

    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [showProductDropdown, setShowProductDropdown] = useState(null); // index
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [showCostCalcModal, setShowCostCalcModal] = useState(false);
    const [saleInvoiceData, setSaleInvoiceData] = useState(null);
    const [useWallet, setUseWallet] = useState(false);
    const [termsAndCondition, setTermsAndCondition] = useState("");

    const handleTermsChange = (val) => {
        if (!val) {
            setTermsAndCondition("");
            return;
        }

        // If they just typed the first character in an empty box:
        if (val.length === 1 && val !== "•" && val !== " ") {
            setTermsAndCondition("• " + val);
            return;
        }

        let lines = val.split('\n');
        let formattedLines = lines.map((line) => {
            if (line === "") return "";
            const trimmed = line.trim();
            if (trimmed !== "" && !line.startsWith("• ")) {
                if (line.startsWith("•")) {
                    return "• " + line.slice(1).trimStart();
                }
                if (line.startsWith("- ")) {
                    return "• " + line.slice(2);
                }
                if (line.startsWith("-")) {
                    return "• " + line.slice(1).trimStart();
                }
                return "• " + line;
            }
            return line;
        });
        setTermsAndCondition(formattedLines.join('\n'));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const textarea = e.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const val = textarea.value;

            // Text before cursor and text after cursor
            const textBefore = val.substring(0, start);
            const textAfter = val.substring(end);

            // If the textarea is completely empty, start with a bullet point
            let newValue;
            let offset = 3; // length of '\n• '

            if (val === "") {
                newValue = "• ";
                offset = 2; // length of '• '
            } else {
                newValue = textBefore + '\n• ' + textAfter;
            }

            setTermsAndCondition(newValue);

            // Set cursor position right after the newly inserted bullet point
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + offset;
            }, 0);
        }
    };

    // Fetch default terms if enabled
    useEffect(() => {
        const fetchDefaultTerms = async () => {
            if (vendorSettings?.transaction?.termsAndConditions && mode === "add" && branchId) {
                try {
                    const res = await getTermsAndConditions(jwtToken, branchId);
                    let items = [];
                    if (res && res.status === "success" || res?.status === 200) {
                        if (Array.isArray(res.data)) items = res.data;
                        else if (res.data && Array.isArray(res.data.data)) items = res.data.data;
                    } else if (Array.isArray(res)) {
                        items = res;
                    } else if (res && Array.isArray(res.data)) {
                        items = res.data;
                    }
                    const saleTerm = items.find(t => t.transactionType === "Sale Invoice");
                    if (saleTerm) {
                        setTermsAndCondition(convertToBulletPoints(saleTerm.termsText || ""));
                    }
                } catch (e) {
                    console.error("Failed to load terms");
                }
            }
        };
        fetchDefaultTerms();
    }, [vendorSettings?.transaction?.termsAndConditions, mode, branchId, jwtToken]);
    const [savedWalletAmount, setSavedWalletAmount] = useState(0);
    const [isRoundOffChecked, setIsRoundOffChecked] = useState(false);

    const selectedCustomerObj = useMemo(() => {
        if (formData.vendorCustomerId) {
            return customers.find(c => c.vendorCustomerId === formData.vendorCustomerId) || null;
        }
        if (formData.phone) {
            return customers.find(c => c.phoneNumber === formData.phone) || null;
        }
        if (formData.partyName) {
            return customers.find(c => `${c.firstName} ${c.lastName}`.trim().toLowerCase() === formData.partyName.trim().toLowerCase()) || null;
        }
        return null;
    }, [customers, formData.vendorCustomerId, formData.phone, formData.partyName]);

    const availableWalletAmount = useMemo(() => {
        return selectedCustomerObj?.overallTotals?.walletAmount || selectedCustomerObj?.walletAmount || 0;
    }, [selectedCustomerObj]);

    const resetForm = () => {
        setFormData({
            partyName: "",
            billingName: "",
            phone: "",
            address: "",
            vendorCustomerId: null,
            discountForCustomer: 0,
            userOrderId: "",
            invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
            invoiceDate: toApiDateOnly(new Date()),
            status: "Pending"
        });
        setItems([
            {
                productId: "",
                variantId: "",
                productName: "",
                unit: "Unit Type",
                batchNumber: "",
                qty: "",
                purchasePrice: 0,
                price: 0,
                discount: 0,
                discountAmount: 0,
                taxPercent: 0,
                taxAmount: 0,
                amount: 0,
                availableQty: 0,
                availableVariants: [],
                availableBatches: []
            }
        ]);
        setPayments([{ method: cashSaleByDefault ? "Cash" : "", amount: 0, referenceNumber: "" }]);
        setErrors({});
        setUseWallet(false);
        setSavedWalletAmount(0);
    };

    const populateForm = (data) => {
        setSaleInvoiceData(data);
        const customerName = data.customer ? `${data.customer.firstName} ${data.customer.lastName}`.trim() : (data.partyName || "");
        const customerPhone = data.customer?.phoneNumber || data.phone || "";

        setFormData({
            partyName: customerName,
            billingName: data.billingName || "",
            phone: customerPhone,
            address: data.customer?.shippingAddress || data.customer?.serviceableAddress || data.shippingAddress || data.serviceableAddress || "",
            vendorCustomerId: data.vendorCustomerId || null,
            discountForCustomer: data.discountForCustomer || 0,
            userOrderId: data.userOrderId || "",
            invoiceNumber: data.invoiceNumber || "",
            invoiceDate: (data.invoiceDate || data.createdDate) ? (data.invoiceDate || data.createdDate).split("T")[0] : "",
            status: data.billStatus === "Full" ? "Completed" : (data.status || "Pending")
        });

        // Mapping cartItems based on the latest API response
        const mappedItems = (data.cartItems || []).map((it) => {
            const variant = it.variant || it.Variant || {};
            const vType = variant.variantType || {};
            const unitLabel = formatVariantSize(vType.size) || vType.type || "Unit";

            const price = parseFloat(it.sellingPrice || 0);
            const qty = it.quantity || 0;
            const discountPercent = parseFloat(it.discountForItem || 0);
            const subtotal = price * qty;
            const discountAmount = Math.round(((subtotal * discountPercent) / 100) * 100) / 100;
            const taxAmount = Math.round(parseFloat(it.taxAmount || 0) * 100) / 100;
            const amount = Math.round(parseFloat(it.itemTotal || 0) * 100) / 100;

            return {
                productId: it.productId,
                variantId: it.variantId,
                batchNumber: it.batchNumber || "",
                productName: it.productName || it.product?.productName || variant.SKU || "Product",
                unit: unitLabel,
                qty: qty,
                purchasePrice: parseFloat(it.purchasePrice || it.costPrice || variant.purchasePrice || variant.costPrice || variant.cost || 0),
                mrp: parseFloat(it.mrp || variant.mrp || variant.sellingPrice || it.sellingPrice || 0),
                price: price,
                discount: discountPercent,
                discountAmount: discountAmount,
                taxPercent: parseFloat(it.taxPercentage || 0),
                taxAmount: taxAmount,
                amount: amount,
                availableQty: it.openQty !== undefined ? it.openQty : (variant.currentQty || 0),
                availableVariants: variant.variantId ? [variant] : [],
                availableBatches: variant.batchNumbers || []
            };
        });
        setItems(
            mappedItems.length > 0
                ? mappedItems
                : [
                    {
                        productId: "",
                        variantId: "",
                        batchNumber: "",
                        productName: "",
                        unit: "Unit Type",
                        qty: 1,
                        purchasePrice: 0,
                        mrp: 0,
                        price: 0,
                        discount: 0,
                        taxPercent: 0,
                        taxAmount: 0,
                        amount: 0,
                        availableQty: 0,
                        availableVariants: [],
                        availableBatches: []
                    }
                ]
        );

        // Map payments if available, otherwise construct from paidAmount
        let hasWalletPayment = false;
        let walletPaidAmt = 0;

        if (data.payments && data.payments.length > 0) {
            const nonWallet = [];
            data.payments.forEach(pm => {
                const m = pm.method || pm.paymentMethod || pm.paymentType || "Cash";
                if (m === "Wallet") {
                    hasWalletPayment = true;
                    walletPaidAmt = parseFloat(pm.amount || 0);
                } else {
                    nonWallet.push({
                        method: m,
                        amount: parseFloat(pm.amount || 0),
                        referenceNumber: pm.referenceNumber || pm.transactionRef || ""
                    });
                }
            });
            setPayments(nonWallet);
        } else if (data.paidAmount && parseFloat(data.paidAmount) > 0) {
            if (data.paymentMethod === "Wallet") {
                hasWalletPayment = true;
                walletPaidAmt = parseFloat(data.paidAmount);
                setPayments([]);
            } else {
                setPayments([{ method: data.paymentMethod || "Cash", amount: parseFloat(data.paidAmount), referenceNumber: data.referenceNumber || "" }]);
            }
        } else {
            setPayments([]);
        }
        setUseWallet(hasWalletPayment);
        setSavedWalletAmount(walletPaidAmt);
        setTermsAndCondition(convertToBulletPoints(data.termsAndConditions || data.termsAndCondition || ""));
        setIsRoundOffChecked(!!data.roundOff);
    };

    const fetchSaleDetails = async (id) => {
        setLoading(true);
        try {
            const res = await saleService.getSaleInvoiceById(jwtToken, id);
            if (res.status === "success" && res.data) {
                populateForm(res.data);
            }
        } catch (error) {
            console.error("Error fetching sale details:", error);
            toast.error("Failed to load sale details");
        } finally {
            setLoading(false);
        }
    };

    const fetchInitialData = async () => {
        try {
            const custRes = await saleService.getCustomers(jwtToken, branchId).catch(() => ({ status: "success", data: [] }));
            const prodRes = await productService.getAllProductsBrief(jwtToken, branchId).catch(() => []);

            if (custRes.status === "success") setCustomers(custRes.data || []);
            setProducts(prodRes || []);
        } catch (error) {
            console.error("Error in fetchInitialData:", error);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, [branchId, jwtToken]);

    useEffect(() => {
        if (initialData && Object.keys(initialData).length > 0) {
            populateForm(initialData);
        } else if ((mode === "view" || mode === "edit") && saleId) {
            fetchSaleDetails(saleId);
        } else {
            resetForm();
        }
    }, [saleId, initialData, mode]);

    // Send dynamic tab title updates to parent manager
    useEffect(() => {
        const title = formData.partyName || formData.invoiceNumber || "New Sale";
        const shortTitle = formData.invoiceNumber ? String(formData.invoiceNumber).slice(-6) : (formData.partyName ? String(formData.partyName).slice(0, 5) : "New");
        if (onTitleChange && tabId) {
            onTitleChange(tabId, title, shortTitle);
        }
    }, [formData.partyName, formData.invoiceNumber, onTitleChange, tabId]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest(`.${styles.searchableDropdown}`)) {
                setShowCustomerDropdown(false);
                setShowProductDropdown(null);
            }
        };
        window.addEventListener("mousedown", handleClickOutside);
        return () => window.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!loading && isViewOnly && router.query.print === "true") {
            const timer = setTimeout(() => {
                window.print();
                if (router.query.pdf !== "true") {
                    const { print, ...rest } = router.query;
                    router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
                }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [loading, isViewOnly, router.query.print, router.query.pdf]);

    const handleCustomerSearch = (val, type) => {
        if (type === "name") {
            setFormData({ ...formData, partyName: val });
            setShowCustomerDropdown(true);
            if (errors.partyName) {
                setErrors((prev) => ({ ...prev, partyName: null }));
            }
            const exact = customers.find((c) => `${c.firstName} ${c.lastName}`.toLowerCase() === val.toLowerCase());
            if (exact) {
                setFormData((prev) => ({ ...prev, phone: exact.phoneNumber, vendorCustomerId: exact.vendorCustomerId }));
                setUseWallet(false);
                setSavedWalletAmount(0);
            }
        } else {
            setFormData({ ...formData, phone: val });
            if (errors.phone) {
                setErrors((prev) => ({ ...prev, phone: null }));
            }
            if (val.length === 10) {
                const found = customers.find((c) => c.phoneNumber === val);
                if (found) {
                    setFormData((prev) => ({ ...prev, partyName: `${found.firstName} ${found.lastName}`.trim(), vendorCustomerId: found.vendorCustomerId }));
                    setUseWallet(false);
                    setSavedWalletAmount(0);
                }
            }
        }
    };

    const handleProductSelect = (index, prod) => {
        const newItems = [...items];
        const variants = prod.variants || [];
        const selectedVariant = variants.length > 0 ? variants[0] : null;

        const batches = selectedVariant?.batchNumbers || [];

        const purchasePrice = parseFloat(selectedVariant?.purchasePrice || selectedVariant?.costPrice || selectedVariant?.cost || prod.purchasePrice || prod.costPrice || prod.cost || 0);
        const price = parseFloat(selectedVariant?.sellingPrice || selectedVariant?.mrp || 0);
        const mrp = parseFloat(selectedVariant?.mrp || prod.mrp || price);
        const tax = parseFloat(prod.taxPercentage ?? prod.taxGroupId ?? 0);
        const qty = ""; // Leave blank so placeholder 0 shows
        const calcQty = getActiveQty(qty);
        const discount = 0;
        const { discountAmount, taxAmount, amount } = calculateItemValues(price, calcQty, discount, tax, mrp);

        const vType = selectedVariant?.variantType || {};
        const unitParts = [formatVariantSize(vType.size), vType.type, vType.packType].filter(Boolean);
        const unitVal = unitParts.length > 0 ? unitParts.join(" ") : "Unit";

        const availableQty = selectedVariant?.stockUpdates?.qtyForSale !== undefined ? selectedVariant.stockUpdates.qtyForSale : (selectedVariant?.currentQty || 0);

        newItems[index] = {
            productId: prod.productId,
            variantId: selectedVariant?.variantId || "",
            batchNumber: "",
            productName: prod.productName,
            unit: unitVal,
            qty: qty,
            purchasePrice: purchasePrice,
            mrp: mrp,
            price: price,
            discount: discount,
            discountAmount: discountAmount,
            taxPercent: tax,
            taxAmount: taxAmount,
            amount: amount,
            availableQty: availableQty,
            availableVariants: variants,
            availableBatches: batches,
            productError: null,
            batchError: null,
            error: calcQty > availableQty ? `Cannot exceed quantity (${availableQty})` : null
        };
        setItems(newItems);
        setShowProductDropdown(null);
    };

    const handleVariantChange = (index, variantId) => {
        const newItems = [...items];
        const it = newItems[index];
        const v = it.availableVariants.find((varnt) => String(varnt.variantId) === String(variantId));

        if (v) {
            const batches = v.batchNumbers || [];

            const purchasePrice = parseFloat(v.purchasePrice || v.costPrice || v.cost || 0);
            const price = parseFloat(v.sellingPrice || v.mrp || 0);
            const mrp = parseFloat(v.mrp || price);
            const calcQty = getActiveQty(it.qty);
            const discount = parseFloat(it.discount || 0);
            const { discountAmount, taxAmount, amount } = calculateItemValues(price, calcQty, discount, it.taxPercent, mrp);

            const vType = v.variantType || {};
            const unitParts = [formatVariantSize(vType.size), vType.type, vType.packType].filter(Boolean);
            const unitVal = unitParts.length > 0 ? unitParts.join(" ") : "Unit";

            const availableQty = v.stockUpdates?.qtyForSale !== undefined ? v.stockUpdates.qtyForSale : (v.currentQty || 0);

            newItems[index] = {
                ...it,
                variantId: v.variantId,
                batchNumber: "",
                unit: unitVal,
                purchasePrice: purchasePrice,
                mrp: mrp,
                price: price,
                discount: discount,
                discountAmount: discountAmount,
                taxAmount: taxAmount,
                amount: amount,
                availableQty: availableQty,
                availableBatches: batches,
                batchError: null,
                error: calcQty > availableQty ? `Cannot exceed quantity (${availableQty})` : null
            };
            setItems(newItems);
        }
    };

    const handleBatchChange = (index, batchNum) => {
        const newItems = [...items];
        const it = newItems[index];
        const batch = it.availableBatches.find(b => b.batchNumber === batchNum);

        if (batch) {
            const v = it.availableVariants.find((varnt) => String(varnt.variantId) === String(it.variantId));
            const purchasePrice = parseFloat(batch.purchasePrice || batch.costPrice || batch.cost || it.purchasePrice || 0);
            const price = parseFloat(batch.sellingPrice || v?.sellingPrice || batch.mrp || v?.mrp || 0);
            const calcQty = getActiveQty(it.qty);
            const discount = parseFloat(it.discount || 0);
            const { discountAmount, taxAmount, amount } = calculateItemValues(price, calcQty, discount, it.taxPercent, it.mrp);

            const availableQty = batch.stockUpdates?.qtyForSale !== undefined ? batch.stockUpdates.qtyForSale : (batch.quantity || 0);

            newItems[index] = {
                ...it,
                batchNumber: batch.batchNumber,
                purchasePrice: purchasePrice,
                price: price,
                discount: discount,
                discountAmount: discountAmount,
                taxAmount: taxAmount,
                amount: amount,
                availableQty: availableQty,
                batchError: null,
                error: calcQty > availableQty ? `Cannot exceed quantity (${availableQty})` : null
            };
            setItems(newItems);
        } else if (batchNum === "") {
            const v = it.availableVariants.find((varnt) => String(varnt.variantId) === String(it.variantId));
            if (v) {
                const purchasePrice = parseFloat(v.purchasePrice || v.costPrice || v.cost || 0);
                const price = parseFloat(v.sellingPrice || v.mrp || 0);
                const calcQty = getActiveQty(it.qty);
                const discount = parseFloat(it.discount || 0);
                const { discountAmount, taxAmount, amount } = calculateItemValues(price, calcQty, discount, it.taxPercent, it.mrp);
                const availableQty = v.stockUpdates?.qtyForSale !== undefined ? v.stockUpdates.qtyForSale : (v.currentQty || 0);

                newItems[index] = {
                    ...it,
                    batchNumber: "",
                    purchasePrice: purchasePrice,
                    price: price,
                    discount: discount,
                    discountAmount: discountAmount,
                    taxAmount: taxAmount,
                    amount: amount,
                    availableQty: availableQty,
                    batchError: "Batch number is required",
                    error: calcQty > availableQty ? `Cannot exceed quantity (${availableQty})` : null
                };
                setItems(newItems);
            }
        }
    };

    const handleQtyChange = (index, val) => {
        let formattedVal = val;
        if (val.startsWith("0") && val.length > 1 && val[1] !== ".") {
            formattedVal = String(Number(val));
        }
        const calcQty = getActiveQty(val === "" ? "" : formattedVal);
        const newItems = [...items];
        const it = newItems[index];

        const discount = parseFloat(it.discount || 0);
        const { discountAmount, taxAmount, amount } = calculateItemValues(it.price, calcQty, discount, it.taxPercent, it.mrp);

        newItems[index] = {
            ...it,
            qty: val === "" ? "" : formattedVal,
            discountAmount: discountAmount,
            taxAmount: taxAmount,
            amount: amount,
            qtyError: calcQty <= 0 ? "Quantity must be greater than 0" : (calcQty > it.availableQty ? `Cannot exceed quantity (${it.availableQty})` : null),
            error: calcQty <= 0 ? "Quantity must be greater than 0" : (calcQty > it.availableQty ? `Cannot exceed quantity (${it.availableQty})` : null)
        };
        setItems(newItems);
    };

    const handlePriceChange = (index, val) => {
        let formattedVal = val;
        if (val.startsWith("0") && val.length > 1 && val[1] !== ".") {
            formattedVal = String(Number(val));
        }
        const priceNum = parseFloat(formattedVal || 0);

        const newItems = [...items];
        const it = newItems[index];
        const calcQty = getActiveQty(it.qty);
        const discount = parseFloat(it.discount || 0);
        const { discountAmount, taxAmount, amount } = calculateItemValues(priceNum, calcQty, discount, it.taxPercent, it.mrp);

        newItems[index] = {
            ...it,
            price: formattedVal,
            discountAmount: discountAmount,
            taxAmount: taxAmount,
            amount: amount
        };
        setItems(newItems);
    };

    const handleAddRow = () => {
        setItems([...items, { productId: "", productName: "", unit: "Unit Type", batchNumber: "", qty: "", purchasePrice: 0, price: 0, discount: 0, discountAmount: 0, taxPercent: 0, taxAmount: 0, amount: 0, availableQty: 0, availableVariants: [], availableBatches: [] }]);
    };

    const handleRemoveRow = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems.length > 0 ? newItems : [{ productId: "", productName: "", unit: "Unit Type", batchNumber: "", qty: "", purchasePrice: 0, price: 0, discount: 0, discountAmount: 0, taxPercent: 0, taxAmount: 0, amount: 0, availableQty: 0, availableVariants: [], availableBatches: [] }]);
    };

    const handleDiscountChange = (index, val) => {
        let formattedVal = val;
        if (val.startsWith("0") && val.length > 1 && val[1] !== ".") {
            formattedVal = String(Number(val));
        }
        if (formattedVal.includes(".")) {
            const parts = formattedVal.split(".");
            if (parts[1].length > 2) {
                formattedVal = `${parts[0]}.${parts[1].slice(0, 2)}`;
            }
        }
        const discount = val === "" ? 0 : (parseFloat(formattedVal) || 0);
        const newItems = [...items];
        const it = newItems[index];

        const calcQty = getActiveQty(it.qty);
        const { discountAmount, taxAmount, amount } = calculateItemValues(it.price, calcQty, discount, it.taxPercent);

        newItems[index] = {
            ...it,
            discount: val === "" ? "" : formattedVal,
            discountAmount: discountAmount,
            taxAmount: taxAmount,
            amount: amount
        };
        setItems(newItems);
    };

    const handleAddPayment = () => {
        setPayments([...payments, { method: "Cash", amount: 0, referenceNumber: "" }]);
    };

    const handlePaymentChange = (index, field, val) => {
        const newPayments = [...payments];
        if (field === "amount") {
            // Strip leading zeros unless followed by decimal (like amount "01" -> "1")
            let formattedVal = val;
            if (val.startsWith("0") && val.length > 1 && val[1] !== ".") {
                formattedVal = String(Number(val));
            }
            newPayments[index][field] = val === "" ? "" : formattedVal;
        } else {
            newPayments[index][field] = val;
        }
        setPayments(newPayments);
    };

    const totalBillAmountBeforeRound = items.reduce((acc, it) => acc + (it.amount || 0), 0);
    const discountForCustomer = 0;
    const totalPaidAmount = isViewOnly && saleInvoiceData?.paidAmount !== undefined
        ? Number(saleInvoiceData.paidAmount || 0)
        : payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);

    const itemsSubtotal = items.reduce((acc, it) => acc + ((parseFloat(it.price) || 0) * (parseFloat(it.qty) || 0)), 0);
    const itemsDiscount = items.reduce((acc, it) => acc + (it.discountAmount || 0), 0);
    const itemsTax = items.reduce((acc, it) => acc + (it.taxAmount || 0), 0);

    let totalBillAmount = totalBillAmountBeforeRound;
    let roundOffAmount = 0;

    if (isRoundOffChecked && vendorSettings?.transaction) {
        const rType = vendorSettings.transaction.roundOffType || "nearest";
        const rVal = Number(vendorSettings.transaction.roundOffValue) || 1;

        let roundedAmount = totalBillAmount;
        if (rVal > 0) {
            if (rType === "nearest") {
                roundedAmount = Math.round(totalBillAmount / rVal) * rVal;
            } else if (rType === "down") {
                roundedAmount = Math.floor(totalBillAmount / rVal) * rVal;
            } else if (rType === "up") {
                roundedAmount = Math.ceil(totalBillAmount / rVal) * rVal;
            }
            roundOffAmount = roundedAmount - totalBillAmountBeforeRound;
            totalBillAmount = roundedAmount;
        }
    }

    const appliedWalletAmount = useMemo(() => {
        if (!useWallet) return 0;
        if (mode !== 'add' && savedWalletAmount > 0) {
            return savedWalletAmount;
        }
        if (availableWalletAmount <= 0) return 0;

        const netBill = Math.max(0, totalBillAmount - discountForCustomer);
        return Math.min(availableWalletAmount, netBill);
    }, [useWallet, availableWalletAmount, savedWalletAmount, totalBillAmount, discountForCustomer, mode]);

    const balanceAmount = isViewOnly && saleInvoiceData?.dueAmount !== undefined
        ? Number(saleInvoiceData.dueAmount || 0)
        : totalBillAmount - discountForCustomer - totalPaidAmount - appliedWalletAmount;

    const prefillData = useMemo(() => {
        if (!saleInvoiceData) return null;
        return {
            userOrderId: saleInvoiceData.userOrderId,
            customer: saleInvoiceData.customer || {
                vendorCustomerId: saleInvoiceData.vendorCustomerId,
                firstName: saleInvoiceData.partyName || "",
                lastName: "",
                phoneNumber: saleInvoiceData.phone || ""
            },
            totalAmount: totalBillAmount,
            paidAmount: totalPaidAmount + appliedWalletAmount,
            dueAmount: balanceAmount,
            cartItems: saleInvoiceData.cartItems || []
        };
    }, [saleInvoiceData, totalBillAmount, totalPaidAmount, balanceAmount, appliedWalletAmount]);

    const [errors, setErrors] = useState({});

    const handleSave = async () => {
        const validationErrors = {};
        if (!formData.partyName) {
            validationErrors.partyName = "Customer name is required";
        }
        if (!formData.phone) {
            validationErrors.phone = "Phone number is required";
        }
        if (!formData.invoiceDate) {
            validationErrors.invoiceDate = "Invoice date is required";
        } else {
            const todayStr = toApiDateOnly(new Date());
            if (formData.invoiceDate > todayStr) {
                validationErrors.invoiceDate = "Invoice date cannot be in the future";
            }
        }

        const updatedItems = items.map(it => {
            const itemErrors = {};
            if (!it.productId) {
                itemErrors.product = "Please select a product";
            }
            const qtyVal = parseFloat(it.qty) || 0;
            if (qtyVal <= 0) {
                itemErrors.qty = "Quantity must be greater than 0";
            } else if (qtyVal > it.availableQty) {
                itemErrors.qty = `Cannot exceed quantity (${it.availableQty})`;
            }
            if (it.productId && it.availableBatches && it.availableBatches.length > 0 && !it.batchNumber) {
                itemErrors.batch = "Batch number is required";
            }
            return {
                ...it,
                productError: itemErrors.product || null,
                qtyError: itemErrors.qty || null,
                batchError: itemErrors.batch || null,
                error: itemErrors.qty || null
            };
        });

        const hasItemErrors = updatedItems.some(it => it.productError || it.qtyError || it.batchError);
        const hasFormErrors = Object.keys(validationErrors).length > 0;

        if (hasFormErrors || hasItemErrors) {
            setErrors(validationErrors);
            setItems(updatedItems);
            toast.error("Please fill in all required fields correctly.");
            return;
        }

        const validItems = items.filter((it) => it.productId);
        const activePayments = payments.map(p => ({
            paymentMethod: p.method,
            paymentType: p.method,
            method: p.method,
            amount: parseFloat(p.amount) || 0,
            referenceNumber: p.referenceNumber || ""
        }));

        if (useWallet && appliedWalletAmount > 0) {
            activePayments.push({
                paymentMethod: "Wallet",
                paymentType: "Wallet",
                method: "Wallet",
                amount: appliedWalletAmount,
                referenceNumber: "Wallet Deduction"
            });
        }

        const payload = {
            branchId,
            invoiceNumber: formData.invoiceNumber,
            vendorCustomerId: formData.vendorCustomerId,
            billingName: formData.billingName || "",
            discountForCustomer: 0,
            amountPaid: totalPaidAmount + appliedWalletAmount,
            paymentMethod: activePayments[0]?.paymentMethod || "Cash",
            referenceNumber: activePayments[0]?.referenceNumber || "",
            payments: activePayments,
            roundOff: isRoundOffChecked,
            beforeRoundOff: totalBillAmountBeforeRound,
            paymentMethods: activePayments.map(p => ({
                paymentMethod: p.paymentMethod,
                paymentType: p.paymentType,
                method: p.method,
                amount: p.amount,
                transactionRef: p.referenceNumber,
                referenceNumber: p.referenceNumber
            })),
            items: validItems.map((it, idx) => ({
                productId: it.productId,
                variantId: it.variantId,
                batchNumber: it.batchNumber || null,
                quantity: getActiveQty(it.qty),
                purchasePrice: it.purchasePrice,
                discountForItem: parseFloat(it.discount || 0),
                sellingPrice: it.price,
                taxPercentage: it.taxPercent,
                taxAmount: it.taxAmount,
                itemTotal: idx === validItems.length - 1 ? (it.amount + roundOffAmount) : it.amount,
                openQty: parseInt(it.availableQty) || 0
            })),
            createdBy: userInfo?.id || 1,
            modifiedBy: mode === "edit" ? userInfo?.id || 1 : null,
            termsAndConditions: termsAndCondition || ""
        };

        Object.assign(payload, dateOnlyWithTimeZone("invoiceDate", formData.invoiceDate));

        setLoading(true);
        try {
            let res;
            if (mode === "edit") {
                res = await saleService.updateSaleInvoice(jwtToken, saleId, payload);
            } else {
                res = await saleService.createSaleInvoice(jwtToken, payload);
            }

            if (res.status === "success" || res.status === 200) {
                toast.success(`Sale ${mode === "edit" ? "updated" : "created"} successfully`);
                resetForm();
                if (onSave) onSave();
            } else {
                toast.error(res.message || "Failed to save sale invoice");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (loading && items.length === 1 && !items[0].productId) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", minHeight: "300px" }}>
                <div style={{ width: "40px", height: "40px", border: "3px solid #E93E64", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const isPdf = router.query.pdf === 'true' || router.query.print === 'true' || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('print') === 'true');

    if (isPdf) {
        const columns = [
            { header: "S NO.", align: "left", render: (item, idx) => String(idx + 1).padStart(2, '0') },
            { header: "PRODUCT NAME", accessor: "productName", align: "left" },
            { header: "QTY", accessor: "qty", align: "center" },
            { header: "UNIT", accessor: "unit", align: "center" },
            { header: "PRICE", accessor: "price", align: "right" },
            { header: "TAX (%)", accessor: "taxPercent", align: "center" },
            { header: "DISCOUNT (%)", accessor: "discount", align: "center" },
            { header: "AMOUNT", accessor: "amount", align: "right" }
        ];

        const totalQty = items.reduce((acc, it) => acc + (parseFloat(it.qty) || 0), 0);
        const subtotal = items.reduce((acc, it) => acc + ((parseFloat(it.price) || 0) * (parseFloat(it.qty) || 0)), 0);
        const totalDiscount = items.reduce((acc, it) => acc + (it.discountAmount || 0), 0);
        const totalTax = items.reduce((acc, it) => acc + (it.taxAmount || 0), 0);

        const summary = [
            { label: "Total Quantity", value: totalQty },
            { label: "Subtotal", value: subtotal.toFixed(getAmountDecimalPlaces()) },
            { label: "Total Discount", value: totalDiscount.toFixed(getAmountDecimalPlaces()) },
            { label: "Total Tax", value: totalTax.toFixed(getAmountDecimalPlaces()) }
        ];

        if (useWallet && appliedWalletAmount > 0) {
            summary.push({ label: "Wallet Applied", value: `-${appliedWalletAmount.toFixed(getAmountDecimalPlaces())}` });
        }

        summary.push(
            { label: "Grand Total", value: totalBillAmount.toFixed(getAmountDecimalPlaces()), isTotal: true },
            { label: "Amount Paid", value: totalPaidAmount.toFixed(getAmountDecimalPlaces()) },
            { label: "Balance Due", value: balanceAmount.toFixed(getAmountDecimalPlaces()) }
        );

        return (
            <PrintInvoiceTemplate
                title="SALE INVOICE"
                customerDetails={{
                    name: formData.partyName || 'N/A',
                    phone: formData.phone || '',
                    address: formData.address || selectedCustomerObj?.shippingAddress || selectedCustomerObj?.serviceableAddress || ''
                }}
                invoiceDetails={{
                    "Invoice No": formData.invoiceNumber || 'N/A',
                    "Order Id": formData.userOrderId || 'N/A',
                    "Date": formData.invoiceDate || 'N/A',
                    "Status": formData.status || 'N/A'
                }}
                columns={columns}
                items={items.filter(it => it.productId)}
                summary={summary}
                onClose={onCancel}
            />
        );
    }

    return (
        <div className={styles.formContainer}>
            <div className={styles.modalContent}>
                <div className={styles.topGrid}>
                    <div className={styles.field}>
                        <label>Customer Name</label>
                        <div className={styles.searchableDropdown}>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="Enter customer name"
                                value={formData.partyName}
                                onChange={(e) => handleCustomerSearch(e.target.value, "name")}
                                onFocus={() => setShowCustomerDropdown(true)}
                                disabled={isViewOnly}
                            />
                            <FiChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' }} />
                            {showCustomerDropdown && !isViewOnly && (
                                <div className={styles.dropdownList}>
                                    {customers
                                        .filter((c) => !formData.partyName || `${c.firstName} ${c.lastName}`.toLowerCase().includes(formData.partyName.toLowerCase()))
                                        .map((c) => (
                                            <div
                                                key={c.vendorCustomerId || c.id}
                                                className={styles.dropdownItem}
                                                onClick={() => {
                                                    const fullName = `${c.firstName} ${c.lastName}`.trim();
                                                    setFormData((prev) => ({ ...prev, partyName: fullName, phone: c.phoneNumber, vendorCustomerId: c.vendorCustomerId }));
                                                    setShowCustomerDropdown(false);
                                                    setErrors((prev) => ({ ...prev, partyName: null, phone: null }));
                                                    setUseWallet(false);
                                                    setSavedWalletAmount(0);
                                                }}
                                            >
                                                {c.firstName} {c.lastName} ({c.phoneNumber})
                                            </div>
                                        ))}
                                    {customers.filter((c) => !formData.partyName || `${c.firstName} ${c.lastName}`.toLowerCase().includes(formData.partyName.toLowerCase())).length === 0 && (
                                        <div className={styles.noResults}>No customers found</div>
                                    )}
                                    {!blockNewCustomerFromTxn && (
                                        <div
                                            className={styles.dropdownItem}
                                            style={{
                                                color: '#E93E64',
                                                fontWeight: 'bold',
                                                borderTop: '1px solid #e2e8f0',
                                                marginTop: '4px',
                                                paddingTop: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                            onClick={() => {
                                                router.push({
                                                    pathname: "/customers",
                                                    query: { action: "add", returnUrl: router.asPath }
                                                });
                                            }}
                                        >
                                            <FiPlus /> Add Customer
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {errors.partyName && (
                            <div style={{ color: "#ff4d4f", fontSize: "11px", marginTop: "4px", fontWeight: "500" }}>
                                {errors.partyName}
                            </div>
                        )}
                    </div>
                    <div className={styles.field}>
                        <label>Phone Number</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="Enter Phone"
                            value={formData.phone}
                            onChange={(e) => handleCustomerSearch(e.target.value, "phone")}
                            disabled={isViewOnly}
                        />
                        {errors.phone && (
                            <div style={{ color: "#ff4d4f", fontSize: "11px", marginTop: "4px", fontWeight: "500" }}>
                                {errors.phone}
                            </div>
                        )}
                    </div>
                    {billingNameOfCustomer && (
                        <div className={styles.field}>
                            <label>Billing Name</label>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="Enter Billing Name"
                                value={formData.billingName}
                                onChange={(e) => setFormData({ ...formData, billingName: e.target.value })}
                                disabled={isViewOnly}
                            />
                        </div>
                    )}
                    {mode !== "add" && (
                        <div className={styles.field}>
                            <label>Invoice Id</label>
                            <input type="text" className={styles.input} value={formData.userOrderId} readOnly />
                        </div>
                    )}
                    <div className={styles.field}>
                        <label>Invoice Number</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={formData.invoiceNumber}
                            readOnly={!invoiceBillNoEditable}
                            onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                        />
                    </div>
                    <div className={styles.field}>
                        <label>Invoice Date</label>
                        <input
                            type="date"
                            className={styles.input}
                            value={formData.invoiceDate}
                            max={toApiDateOnly(new Date())}
                            onChange={(e) => {
                                setFormData({ ...formData, invoiceDate: e.target.value });
                                if (errors.invoiceDate) {
                                    setErrors(prev => ({ ...prev, invoiceDate: null }));
                                }
                            }}
                            disabled={isViewOnly}
                        />
                        {errors.invoiceDate && (
                            <div style={{ color: "#ff4d4f", fontSize: "11px", marginTop: "4px", fontWeight: "500" }}>
                                {errors.invoiceDate}
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.tableContainer}>
                    <table className={styles.premiumTable}>
                        <thead>
                            <tr>
                                <th rowSpan="2">S NO.</th>
                                <th rowSpan="2" style={{ minWidth: "160px", width: "20%" }}>Product Name</th>
                                <th rowSpan="2" style={{ minWidth: "90px" }}>UNIT</th>
                                <th rowSpan="2" style={{ minWidth: "110px" }}>BATCH</th>
                                <th rowSpan="2" style={{ minWidth: "70px" }}>OPEN QTY</th>
                                <th rowSpan="2" style={{ minWidth: "70px" }}>QTY</th>
                                {vendorSettings?.transaction?.displayPurchasePriceOfItems && (
                                    <th rowSpan="2" style={{ minWidth: "90px", textAlign: "center" }}>PURCHASE PRICE</th>
                                )}
                                <th colSpan="1" style={{ minWidth: "60px", width: "60px", maxWidth: "70px" }}>PRICE</th>
                                <th colSpan="2" style={{ textAlign: "center" }}>
                                    TAX
                                </th>
                                <th colSpan="2" style={{ textAlign: "center" }}>
                                    DISCOUNT
                                </th>
                                <th rowSpan="2" style={{ textAlign: "right" }}>
                                    AMOUNT
                                </th>
                                {!isViewOnly && <th rowSpan="2"></th>}
                            </tr>
                            <tr>
                                <th className={styles.subHeader}></th>
                                <th className={styles.subHeader}>%</th>
                                <th className={styles.subHeader}>AMOUNT</th>
                                <th className={styles.subHeader} style={{ minWidth: "45px", width: "45px", maxWidth: "45px" }}>%</th>
                                <th className={styles.subHeader}>AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it, idx) => (
                                <tr key={idx}>
                                    <td>{String(idx + 1).padStart(2, "0")}</td>
                                    <td style={{ position: "relative", width: "20%", minWidth: "160px" }}>
                                        <div className={styles.searchableDropdown} style={{ display: "flex", alignItems: "center", position: "relative" }}>
                                            <input
                                                type="text"
                                                className={styles.tableInput}
                                                style={{ paddingRight: "20px" }}
                                                placeholder="Select product"
                                                value={it.productName}
                                                onChange={(e) => {
                                                    const newItems = [...items];
                                                    newItems[idx].productName = e.target.value;
                                                    newItems[idx].productError = null;
                                                    setItems(newItems);
                                                    setShowProductDropdown(idx);
                                                }}
                                                onFocus={() => setShowProductDropdown(idx)}
                                                disabled={isViewOnly}
                                            />
                                            {!isViewOnly && (
                                                <FiChevronDown
                                                    size={14}
                                                    style={{
                                                        position: "absolute",
                                                        right: "8px",
                                                        pointerEvents: "none",
                                                        color: "#999"
                                                    }}
                                                />
                                            )}
                                            {showProductDropdown === idx && !isViewOnly && (
                                                <div className={styles.dropdownList}>
                                                    {products
                                                        .filter((p) => {
                                                            const search = (it.productName || "").toLowerCase();
                                                            return !search || (p.productName || "").toLowerCase().includes(search);
                                                        })
                                                        .map((p) => (
                                                            <div key={p.productId} className={styles.dropdownItem} onClick={() => handleProductSelect(idx, p)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                <span style={{ fontWeight: "600" }}>{p.productName}</span>
                                                                {p.productType === "Medical" && p.rack && (
                                                                    <span style={{ fontSize: "11px", color: "#666", background: "#f0f0f0", padding: "2px 6px", borderRadius: "4px" }}>
                                                                        Rack: {p.rack}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                </div>
                                            )}
                                        </div>
                                        {it.productError && (
                                            <div style={{ color: "#ff4d4f", fontSize: "10px", marginTop: "4px", fontWeight: "500" }}>
                                                {it.productError}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ minWidth: "120px" }}>
                                        {isViewOnly ? (
                                            <div className={styles.unitSelector} style={{ justifyContent: "center" }}>
                                                <span>{it.unit || (it.availableVariants?.find(v => String(v.variantId) === String(it.variantId))?.variantType?.size ? formatVariantSize(it.availableVariants.find(v => String(v.variantId) === String(it.variantId)).variantType.size) : "Unit")}</span>
                                            </div>
                                        ) : (
                                            it.availableVariants && it.availableVariants.length > 0 ? (
                                                <div className={styles.unitSelector}>
                                                    <select
                                                        className={styles.unitSelect}
                                                        value={it.variantId}
                                                        onChange={(e) => handleVariantChange(idx, e.target.value)}
                                                        style={{
                                                            appearance: "none",
                                                            WebkitAppearance: "none",
                                                            MozAppearance: "none",
                                                            paddingRight: "16px",
                                                            width: "100%",
                                                            cursor: "pointer",
                                                            fontWeight: "600",
                                                            color: "#333",
                                                            background: "transparent",
                                                            border: "none",
                                                            outline: "none"
                                                        }}
                                                    >
                                                        {it.availableVariants.map((v) => (
                                                            <option key={v.variantId} value={v.variantId}>
                                                                {formatVariantSize(v.variantType?.size) || v.variantType?.type || "Unit"}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <FiChevronDown size={12} style={{ pointerEvents: "none", marginLeft: "-12px", color: "#666" }} />
                                                </div>
                                            ) : (
                                                <div className={styles.unitSelector}>
                                                    <span>{it.unit || "Unit Type"}</span>
                                                    <FiChevronDown size={12} />
                                                </div>
                                            )
                                        )}
                                    </td>
                                    <td style={{ minWidth: "140px" }}>
                                        {isViewOnly ? (
                                            <div className={styles.unitSelector} style={{ justifyContent: "center" }}>
                                                <span>{it.batchNumber || "N/A"}</span>
                                            </div>
                                        ) : (
                                            <>
                                                {it.availableBatches && it.availableBatches.length > 0 ? (
                                                    <div className={styles.unitSelector} style={it.batchError ? { border: "1px solid #ff4d4f", background: "#fffcfc" } : {}}>
                                                        <select
                                                            className={styles.unitSelect}
                                                            value={it.batchNumber || ""}
                                                            onChange={(e) => handleBatchChange(idx, e.target.value)}
                                                            style={{
                                                                appearance: "none",
                                                                WebkitAppearance: "none",
                                                                MozAppearance: "none",
                                                                paddingRight: "16px",
                                                                width: "100%",
                                                                cursor: "pointer",
                                                                fontWeight: "600",
                                                                color: "#333",
                                                                background: "transparent",
                                                                border: "none",
                                                                outline: "none",
                                                                fontSize: "12px"
                                                            }}
                                                        >
                                                            <option value="">Select Batch No</option>
                                                            {it.availableBatches
                                                                .filter(b => !items.some((item, i) => i !== idx && item.productId === it.productId && item.batchNumber === b.batchNumber))
                                                                .map(b => (
                                                                    <option key={b.batchNumber} value={b.batchNumber}>
                                                                        {b.batchNumber} {b.expiryDate && b.expiryDate !== "0000-00-00" ? `(Exp: ${b.expiryDate.substring(0, 7)})` : ''}
                                                                    </option>
                                                                ))
                                                            }
                                                        </select>
                                                        <FiChevronDown size={12} style={{ pointerEvents: "none", marginLeft: "-12px", color: "#666" }} />
                                                    </div>
                                                ) : (
                                                    <div className={styles.unitSelector} style={it.batchError ? { border: "1px solid #ff4d4f", background: "#fffcfc", justifyContent: "center" } : { justifyContent: "center" }}>
                                                        <span style={{ color: "#999" }}>N/A</span>
                                                    </div>
                                                )}
                                                {it.batchError && (
                                                    <div style={{ color: "#ff4d4f", fontSize: "10px", marginTop: "4px", fontWeight: "500", textAlign: "center" }}>
                                                        {it.batchError}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </td>
                                    <td style={{ verticalAlign: 'middle', textAlign: 'center', fontWeight: '600', color: '#333' }}>
                                        {it.availableQty}
                                    </td>
                                    <td style={{ verticalAlign: "top", paddingTop: "12px" }}>
                                        {isViewOnly ? (
                                            <div style={{ textAlign: "center", fontWeight: "600" }}>
                                                {it.qty || "0"}
                                            </div>
                                        ) : (
                                            <input
                                                type="number"
                                                className={styles.tableInputCenter}
                                                style={it.error || it.qtyError ? { border: "1px solid #ff4d4f", background: "#fffcfc" } : {}}
                                                placeholder="0"
                                                value={it.qty === "" || it.qty === 0 || it.qty === "0" ? "" : it.qty}
                                                onChange={(e) => handleQtyChange(idx, e.target.value)}
                                            />
                                        )}
                                        {(it.error || it.qtyError) && (
                                            <div style={{ color: "#ff4d4f", fontSize: "10px", marginTop: "4px", textAlign: "center", fontWeight: "500", whiteSpace: "nowrap" }}>
                                                {it.qtyError || it.error}
                                            </div>
                                        )}
                                    </td>
                                    {vendorSettings?.transaction?.displayPurchasePriceOfItems && (
                                        <td style={{ verticalAlign: "top", paddingTop: "12px", minWidth: "90px", textAlign: "center", fontWeight: "700", color: "#666" }}>
                                            {Number(it.purchasePrice || 0).toFixed(getAmountDecimalPlaces())}
                                        </td>
                                    )}
                                    <td style={{ verticalAlign: "top", paddingTop: "12px", minWidth: "60px", width: "60px", maxWidth: "60px" }}>
                                        {isViewOnly ? (
                                            <div style={{ textAlign: "center", fontWeight: "700" }}>
                                                {Number(it.price || 0).toFixed(getAmountDecimalPlaces())}
                                            </div>
                                        ) : (
                                            <input
                                                type="number"
                                                className={styles.tableInputCenter}
                                                placeholder="0.00"
                                                value={it.price === "" ? "" : it.price}
                                                onChange={(e) => handlePriceChange(idx, e.target.value)}
                                            />
                                        )}
                                    </td>
                                    <td style={{ fontWeight: "700", textAlign: "center" }}>{it.taxPercent}%</td>
                                    <td style={{ fontWeight: "700", textAlign: "center" }}>{Number(it.taxAmount || 0).toFixed(getAmountDecimalPlaces())}</td>
                                    <td style={{ verticalAlign: "top", paddingTop: "12px", minWidth: "45px", width: "45px", maxWidth: "45px" }}>
                                        {isViewOnly ? (
                                            <div style={{ textAlign: "center", fontWeight: "600" }}>
                                                {it.discount || "0"}
                                            </div>
                                        ) : (
                                            <input
                                                type="number"
                                                className={styles.tableInputCenter}
                                                placeholder="0"
                                                value={it.discount === 0 || it.discount === "0" ? "" : it.discount}
                                                onChange={(e) => handleDiscountChange(idx, e.target.value)}
                                            />
                                        )}
                                    </td>
                                    <td style={{ fontWeight: "700", textAlign: "center" }}>{Number(it.discountAmount || 0).toFixed(getAmountDecimalPlaces())}</td>
                                    <td style={{ fontWeight: "700", textAlign: "right" }}>{Number(it.amount || 0).toFixed(getAmountDecimalPlaces())}</td>
                                    {!isViewOnly && (
                                        <td>
                                            {idx !== 0 && (
                                                <FiTrash2 onClick={() => handleRemoveRow(idx)} style={{ cursor: "pointer", color: "#E93E64" }} />
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                            <tr className={styles.totalRowSummary}>
                                <td colSpan="2" style={{ fontWeight: "700", paddingLeft: "40px" }}>
                                    TOTAL
                                </td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td style={{ fontWeight: "600", textAlign: "center" }}>
                                    {items.reduce((acc, it) => acc + getActiveQty(it.qty), 0)}
                                </td>
                                {vendorSettings?.transaction?.displayPurchasePriceOfItems && (
                                    <td style={{ fontWeight: "600", textAlign: "center" }}>
                                        {Number(items.reduce((acc, it) => acc + (it.purchasePrice || 0), 0)).toFixed(getAmountDecimalPlaces())}
                                    </td>
                                )}
                                <td style={{ fontWeight: "600", textAlign: "center" }}>{Number(items.reduce((acc, it) => acc + (it.price || 0), 0)).toFixed(getAmountDecimalPlaces())}</td>
                                <td></td>
                                <td style={{ fontWeight: "600", textAlign: "center" }}>{Number(items.reduce((acc, it) => acc + (it.taxAmount || 0), 0)).toFixed(getAmountDecimalPlaces())}</td>
                                <td></td>
                                <td style={{ fontWeight: "600", textAlign: "center" }}>{Number(items.reduce((acc, it) => acc + (it.discountAmount || 0), 0)).toFixed(getAmountDecimalPlaces())}</td>
                                <td style={{ fontWeight: "700", textAlign: "right" }}>{Number(totalBillAmount || 0).toFixed(getAmountDecimalPlaces())}</td>
                                {!isViewOnly && <td></td>}
                            </tr>
                        </tbody>
                    </table>
                    {!isViewOnly && (
                        <span className={styles.addBtn} onClick={handleAddRow}>
                            + Add Item
                        </span>
                    )}
                </div>

                <div className={styles.paymentSection} style={vendorSettings?.transaction?.termsAndConditions ? { gridTemplateColumns: "1.2fr 1.5fr 0.2fr 1.2fr" } : { gridTemplateColumns: "1.5fr 0.5fr 1.2fr" }}>
                    {vendorSettings?.transaction?.termsAndConditions && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', color: '#333' }}>Terms & Conditions</h3>
                            <textarea
                                value={termsAndCondition}
                                onChange={(e) => handleTermsChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isViewOnly}
                                placeholder="Thank you for doing business with us..!"
                                style={{
                                    width: '100%',
                                    height: '140px',
                                    padding: '12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    background: '#fafafa',
                                    resize: 'none',
                                    fontSize: '14px',
                                    color: '#333',
                                    outline: 'none',
                                    fontFamily: 'inherit',
                                    cursor: isViewOnly ? 'default' : 'text'
                                }}
                            />
                        </div>
                    )}
                    {(!isViewOnly || (payments && payments.length > 0) || (useWallet && appliedWalletAmount > 0)) ? (
                        <div className={styles.paymentList}>
                            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', color: '#333' }}>Payment Details</h3>
                            {availableWalletAmount > 0 && (
                                <div className={styles.walletToggle} onClick={() => !isViewOnly && setUseWallet(!useWallet)} style={{ cursor: isViewOnly ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={useWallet}
                                        disabled={isViewOnly}
                                        style={{ width: '16px', height: '16px', cursor: isViewOnly ? 'not-allowed' : 'pointer', margin: 0 }}
                                    />
                                    <span style={{ fontWeight: '600', marginLeft: '8px' }}>
                                        Use Wallet Amount (Available: {currencySymbol} {availableWalletAmount.toLocaleString(undefined, { minimumFractionDigits: getAmountDecimalPlaces(), maximumFractionDigits: getAmountDecimalPlaces() })})
                                    </span>
                                    {useWallet && appliedWalletAmount > 0 && (
                                        <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#666' }}>
                                            Applied: {currencySymbol} {appliedWalletAmount.toFixed(getAmountDecimalPlaces())}
                                        </div>
                                    )}
                                </div>
                            )}
                            {payments.map((p, idx) => (
                                <div key={idx} className={styles.paymentEntry} style={{ position: 'relative', marginBottom: '12px' }}>
                                    <div className={styles.paymentRow} style={{ gridTemplateColumns: payments.length > 1 && !isViewOnly ? "1fr 1fr 24px" : "1fr 1fr", display: 'grid', gap: '12px', alignItems: 'flex-end' }}>
                                        <div className={styles.field}>
                                            <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#666', display: 'block', marginBottom: '4px' }}>payment type</label>
                                            <select className={styles.select} value={p.method} onChange={(e) => handlePaymentChange(idx, "method", e.target.value)} disabled={isViewOnly}>
                                                <option value="" disabled hidden>Select Payment Type</option>
                                                <option value="Cash">Cash</option>
                                                <option value="UPI">UPI</option>
                                                <option value="Card">Card</option>
                                                <option value="Cheque">Cheque</option>
                                                <option value="Bank">Bank</option>
                                            </select>
                                        </div>
                                        <div className={styles.field}>
                                            <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#666', display: 'block', marginBottom: '4px' }}>amount paid</label>
                                            <input
                                                type="number"
                                                className={styles.input}
                                                value={p.amount === "" || p.amount === 0 || p.amount === "0" ? "" : p.amount}
                                                placeholder="0"
                                                onChange={(e) => handlePaymentChange(idx, "amount", e.target.value)}
                                                disabled={isViewOnly}
                                            />
                                        </div>
                                        {payments.length > 1 && !isViewOnly && (
                                            <div
                                                style={{ color: '#E93E64', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                onClick={() => {
                                                    const newPayments = [...payments];
                                                    newPayments.splice(idx, 1);
                                                    setPayments(newPayments);
                                                }}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            </div>
                                        )}
                                    </div>
                                    {(p.method === "UPI" || p.method === "Cheque") && (
                                        <div className={styles.field} style={{ marginTop: "12px" }}>
                                            <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#666', display: 'block', marginBottom: '4px' }}>{p.method === "Cheque" ? "check no" : "reference number"}</label>
                                            <input
                                                type="text"
                                                className={styles.input}
                                                placeholder="****************"
                                                value={p.referenceNumber || ""}
                                                onChange={(e) => handlePaymentChange(idx, "referenceNumber", e.target.value)}
                                                disabled={isViewOnly}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                            {!isViewOnly && (
                                <span className={styles.addAnotherPayment} onClick={handleAddPayment}>
                                    + Add another payment
                                </span>
                            )}
                        </div>
                    ) : (
                        <div></div>
                    )}

                    <div className={styles.spacer}></div>

                    <div className={styles.totalSectionContainer}>
                        <div className={styles.totalBoxGray}>
                            <div className={styles.totalRowGray}>
                                <span>Total Cost</span>
                                <span>{currencySymbol}{Number(itemsSubtotal || 0).toFixed(getAmountDecimalPlaces())}</span>
                            </div>
                            <div className={styles.totalRowGray}>
                                <span>Discount Amount</span>
                                <span>{currencySymbol}{Number(itemsDiscount || 0).toFixed(getAmountDecimalPlaces())}</span>
                            </div>
                            <div className={styles.totalRowGray}>
                                <span>Tax Amount</span>
                                <span>{currencySymbol}{Number(itemsTax || 0).toFixed(getAmountDecimalPlaces())}</span>
                            </div>
                            <div className={styles.totalRowBold} style={{ marginTop: '8px' }}>
                                <span>Bill Cost</span>
                                <span>{currencySymbol}{(isViewOnly && saleInvoiceData?.beforeRoundOff !== undefined && saleInvoiceData?.beforeRoundOff !== null ? Number(saleInvoiceData.beforeRoundOff) : (totalBillAmountBeforeRound || 0)).toFixed(getAmountDecimalPlaces())}</span>
                            </div>

                            {((!isViewOnly && roundOffTotal) || isRoundOffChecked) && (
                                <div className={styles.totalRowBold} style={{ alignItems: 'center' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: isViewOnly ? 'default' : 'pointer', margin: 0, fontSize: '15px' }}>
                                        <input
                                            type="checkbox"
                                            checked={isRoundOffChecked}
                                            disabled={isViewOnly}
                                            onChange={(e) => !isViewOnly && setIsRoundOffChecked(e.target.checked)}
                                            style={{ width: '18px', height: '18px', accentColor: '#111827', cursor: isViewOnly ? 'not-allowed' : 'pointer', margin: 0, borderRadius: '4px' }}
                                        />
                                        Round off
                                    </label>
                                    <span></span>
                                </div>
                            )}

                            <div className={styles.totalRowBold}>
                                <span>Finalized Cost</span>
                                <span>{currencySymbol}{Number(totalBillAmount || 0).toFixed(getAmountDecimalPlaces())}</span>
                            </div>

                            {useWallet && appliedWalletAmount > 0 && (
                                <div className={styles.totalRowGray}>
                                    <span>Wallet Applied</span>
                                    <span>{currencySymbol}-{Number(appliedWalletAmount).toFixed(getAmountDecimalPlaces())}</span>
                                </div>
                            )}
                            <div className={styles.totalRowGray}>
                                <span>Total Paid</span>
                                <span>{currencySymbol}{Number(totalPaidAmount || 0).toFixed(getAmountDecimalPlaces())}</span>
                            </div>
                        </div>

                        <div className={styles.balanceBox}>
                            <span className={styles.balanceLabel}>Balance Amount</span>
                            <span className={balanceAmount > 0 ? styles.balanceValueRed : styles.balanceValueGreen}>
                                {currencySymbol}{balanceAmount.toLocaleString(undefined, { minimumFractionDigits: getAmountDecimalPlaces(), maximumFractionDigits: getAmountDecimalPlaces() })}
                            </span>
                        </div>
                    </div>
                </div>

                <div className={styles.minimizedBar}>
                    {showProfitWhileMakingInvoice && (
                        <button
                            className={styles.profitBtn}
                            onClick={() => setShowCostCalcModal(true)}
                            title="Cost Calculation"
                        >
                            <FiTrendingUp className={styles.profitIcon} />
                        </button>
                    )}

                    <div className={styles.minimizedActions}>
                        <button className={styles.shareBtn} onClick={onCancel} style={{ margin: 0 }}>
                            Cancel
                        </button>
                        {isViewOnly && (
                            <>
                                {saleInvoiceData?.billStatus !== "Full" && balanceAmount > 0 && (
                                    <button
                                        className={styles.saveBtn}
                                        onClick={() => setPaymentModalOpen(true)}
                                        style={{ background: '#000', margin: 0 }}
                                    >
                                        Make Payment
                                    </button>
                                )}
                                <button className={styles.saveBtn} onClick={() => {
                                    const printUrl = `${window.location.pathname}?view=true&id=${saleId || formData.userOrderId}&print=true&pdf=true`;
                                    const iframe = document.createElement('iframe');
                                    iframe.style.position = 'fixed';
                                    iframe.style.width = '0';
                                    iframe.style.height = '0';
                                    iframe.style.border = '0';
                                    iframe.src = printUrl;
                                    document.body.appendChild(iframe);
                                    const cleanup = () => {
                                        window.removeEventListener('focus', cleanup);
                                        setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 1000);
                                    };
                                    window.addEventListener('focus', cleanup);
                                }} style={{ margin: 0 }}>
                                    Print Invoice
                                </button>
                            </>
                        )}
                        {!isViewOnly && (
                            <button className={styles.saveBtn} onClick={handleSave} disabled={loading} style={{ margin: 0, background: '#000', color: '#fff' }}>
                                {loading ? "Saving..." : "Save Invoice"}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isPaymentModalOpen && (
                <SalePaymentDetailsPopup
                    isOpen={isPaymentModalOpen}
                    onClose={() => setPaymentModalOpen(false)}
                    onRefresh={() => {
                        if (saleId) {
                            fetchSaleDetails(saleId);
                        } else if (formData.userOrderId) {
                            fetchSaleDetails(formData.userOrderId);
                        }
                        fetchInitialData();
                    }}
                    data={{
                        totalAmount: totalBillAmount,
                        previousPaidAmount: totalPaidAmount,
                        balanceAmount: balanceAmount,
                        vendorCustomerId: formData.vendorCustomerId || (saleInvoiceData && saleInvoiceData.vendorCustomerId),
                        branchId: branchId,
                        userOrderId: saleId || formData.userOrderId,
                        walletAmount: availableWalletAmount
                    }}
                />
            )}

            <CostCalculationPopup
                isOpen={showCostCalcModal}
                onClose={() => setShowCostCalcModal(false)}
                items={items}
                subtotal={itemsSubtotal}
                totalTax={itemsTax}
                invoiceDate={formData.invoiceDate}
            />
        </div>
    );
};

export default SaleInvoiceForm;
