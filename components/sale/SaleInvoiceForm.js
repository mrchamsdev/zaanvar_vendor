import { toApiDateOnly, dateOnlyWithTimeZone } from "@/utilities/date-time-utils";
import React, { useState, useEffect, useMemo } from "react";
import styles from "../../styles/sale/add-sale-invoice.module.css";
import { FiCalendar, FiChevronDown, FiTrash2, FiPrinter } from "react-icons/fi";
import { saleService } from "../../services/saleService";
import SalePaymentDetailsPopup from "./SalePaymentDetailsPopup";
import { productService } from "../../services/productService";
import useStore from "../../components/state/useStore";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { toast } from "sonner";
import { useRouter } from "next/router";
import PrintInvoiceTemplate from "../shared/PrintInvoiceTemplate";

const SaleInvoiceForm = ({ mode = "add", saleId, tabId, initialData, onSave, onCancel, onTitleChange }) => {
    const router = useRouter();
    const { jwtToken, userInfo } = useStore();
    const { branchId } = useDashboardData({ skipReviews: true });
    const isViewOnly = mode === "view";

    const getActiveQty = (qty) => {
        if (qty === "" || qty === null || qty === undefined || parseFloat(qty) === 0) {
            return 1;
        }
        return parseFloat(qty) || 0;
    };

    const calculateItemValues = (price, qty, discountPercent, taxPercent) => {
        const subtotal = price * qty;
        const discountAmount = Math.round(((subtotal * discountPercent) / 100) * 100) / 100;
        const amtAfterDiscount = subtotal - discountAmount;
        const taxAmount = Math.round(((amtAfterDiscount * taxPercent) / 100) * 100) / 100;
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
            qty: "",
            price: 0,
            discount: 0,
            discountAmount: 0,
            taxPercent: 0,
            taxAmount: 0,
            amount: 0,
            availableQty: 0,
            availableVariants: []
        }
    ]);

    const [payments, setPayments] = useState([{ method: "Cash", amount: 0, referenceNumber: "" }]);

    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [showProductDropdown, setShowProductDropdown] = useState(null); // index
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [saleInvoiceData, setSaleInvoiceData] = useState(null);

    const resetForm = () => {
        setFormData({
            partyName: "",
            phone: "",
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
                qty: "",
                price: 0,
                discount: 0,
                discountAmount: 0,
                taxPercent: 0,
                taxAmount: 0,
                amount: 0,
                availableQty: 0,
                availableVariants: []
            }
        ]);
        setPayments([{ method: "Cash", amount: 0, referenceNumber: "" }]);
        setErrors({});
    };

    const populateForm = (data) => {
        setSaleInvoiceData(data);
        const customerName = data.customer ? `${data.customer.firstName} ${data.customer.lastName}`.trim() : (data.partyName || "");
        const customerPhone = data.customer?.phoneNumber || data.phone || "";

        setFormData({
            partyName: customerName,
            phone: customerPhone,
            vendorCustomerId: data.vendorCustomerId || null,
            discountForCustomer: data.discountForCustomer || 0,
            userOrderId: data.userOrderId || "",
            invoiceNumber: data.invoiceNumber || "",
            invoiceDate: (data.invoiceDate || data.createdDate) ? (data.invoiceDate || data.createdDate).split("T")[0] : "",
            status: data.status || "Pending"
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
                productName: it.productName || it.product?.productName || variant.SKU || "Product",
                unit: unitLabel,
                qty: qty,
                price: price,
                discount: discountPercent,
                discountAmount: discountAmount,
                taxPercent: parseFloat(it.taxPercentage || 0),
                taxAmount: taxAmount,
                amount: amount,
                availableQty: variant.currentQty || 0,
                availableVariants: variant.variantId ? [variant] : []
            };
        });
        setItems(
            mappedItems.length > 0
                ? mappedItems
                : [
                    {
                        productId: "",
                        variantId: "",
                        productName: "",
                        unit: "Unit Type",
                        qty: 1,
                        price: 0,
                        discount: 0,
                        taxPercent: 0,
                        taxAmount: 0,
                        amount: 0,
                        availableQty: 0,
                        availableVariants: []
                    }
                ]
        );

        // Map payments if available, otherwise construct from paidAmount
        if (data.payments && data.payments.length > 0) {
            setPayments(data.payments.map(pm => ({
                method: pm.method || pm.paymentMethod || pm.paymentType || "Cash",
                amount: parseFloat(pm.amount || 0),
                referenceNumber: pm.referenceNumber || pm.transactionRef || ""
            })));
        } else if (data.paidAmount) {
            setPayments([{ method: data.paymentMethod || "Cash", amount: parseFloat(data.paidAmount), referenceNumber: data.referenceNumber || "" }]);
        }
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
            if (exact) setFormData((prev) => ({ ...prev, phone: exact.phoneNumber, vendorCustomerId: exact.vendorCustomerId }));
        } else {
            setFormData({ ...formData, phone: val });
            if (errors.phone) {
                setErrors((prev) => ({ ...prev, phone: null }));
            }
            if (val.length === 10) {
                const found = customers.find((c) => c.phoneNumber === val);
                if (found) {
                    setFormData((prev) => ({ ...prev, partyName: `${found.firstName} ${found.lastName}`.trim(), vendorCustomerId: found.vendorCustomerId }));
                }
            }
        }
    };

    const handleProductSelect = (index, prod) => {
        const newItems = [...items];
        const variants = prod.variants || [];
        const selectedVariant = variants.length > 0 ? variants[0] : null;

        const price = parseFloat(selectedVariant?.sellingPrice || selectedVariant?.mrp || 0);
        const tax = parseFloat(prod.taxGroupId || 0);
        const qty = ""; // Leave blank so placeholder 0 shows
        const calcQty = getActiveQty(qty);
        const discount = 0;
        const { discountAmount, taxAmount, amount } = calculateItemValues(price, calcQty, discount, tax);

        const vType = selectedVariant?.variantType || {};
        const unitParts = [formatVariantSize(vType.size), vType.type, vType.packType].filter(Boolean);
        const unitVal = unitParts.length > 0 ? unitParts.join(" ") : "Unit";

        const availableQty = selectedVariant?.stockUpdates?.qtyForSale !== undefined ? selectedVariant.stockUpdates.qtyForSale : (selectedVariant?.currentQty || 0);

        newItems[index] = {
            productId: prod.productId,
            variantId: selectedVariant?.variantId || "",
            productName: prod.productName,
            unit: unitVal,
            qty: qty,
            price: price,
            discount: discount,
            discountAmount: discountAmount,
            taxPercent: tax,
            taxAmount: taxAmount,
            amount: amount,
            availableQty: availableQty,
            availableVariants: variants,
            productError: null,
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
            const price = parseFloat(v.sellingPrice || v.mrp || 0);
            const calcQty = getActiveQty(it.qty);
            const discount = parseFloat(it.discount || 0);
            const { discountAmount, taxAmount, amount } = calculateItemValues(price, calcQty, discount, it.taxPercent);

            const vType = v.variantType || {};
            const unitParts = [formatVariantSize(vType.size), vType.type, vType.packType].filter(Boolean);
            const unitVal = unitParts.length > 0 ? unitParts.join(" ") : "Unit";

            const availableQty = v.stockUpdates?.qtyForSale !== undefined ? v.stockUpdates.qtyForSale : (v.currentQty || 0);
            newItems[index] = {
                ...it,
                variantId: v.variantId,
                unit: unitVal,
                price: price,
                discount: discount,
                discountAmount: discountAmount,
                taxAmount: taxAmount,
                amount: amount,
                availableQty: availableQty,
                error: calcQty > availableQty ? `Cannot exceed quantity (${availableQty})` : null
            };
            setItems(newItems);
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
        const { discountAmount, taxAmount, amount } = calculateItemValues(it.price, calcQty, discount, it.taxPercent);

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

    const handleAddRow = () => {
        setItems([...items, { productId: "", productName: "", qty: "", price: 0, discount: 0, discountAmount: 0, taxPercent: 0, taxAmount: 0, amount: 0, availableQty: 0 }]);
    };

    const handleRemoveRow = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems.length > 0 ? newItems : [{ productId: "", productName: "", qty: "", price: 0, discount: 0, discountAmount: 0, taxPercent: 0, taxAmount: 0, amount: 0, availableQty: 0 }]);
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

    const totalBillAmount = items.reduce((acc, it) => acc + (it.amount || 0), 0);
    const discountForCustomer = parseFloat(formData.discountForCustomer || 0);
    const totalPaidAmount = payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
    const balanceAmount = totalBillAmount - discountForCustomer - totalPaidAmount;

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
            paidAmount: totalPaidAmount,
            dueAmount: balanceAmount,
            cartItems: saleInvoiceData.cartItems || []
        };
    }, [saleInvoiceData, totalBillAmount, totalPaidAmount, balanceAmount]);

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
            return {
                ...it,
                productError: itemErrors.product || null,
                qtyError: itemErrors.qty || null,
                error: itemErrors.qty || null
            };
        });

        const hasItemErrors = updatedItems.some(it => it.productError || it.qtyError);
        const hasFormErrors = Object.keys(validationErrors).length > 0;

        if (hasFormErrors || hasItemErrors) {
            setErrors(validationErrors);
            setItems(updatedItems);
            toast.error("Please fill in all required fields correctly.");
            return;
        }

        const validItems = items.filter((it) => it.productId);
        const payload = {
            branchId,
            invoiceNumber: formData.invoiceNumber,
            vendorCustomerId: formData.vendorCustomerId,
            discountForCustomer: parseFloat(formData.discountForCustomer || 0),
            amountPaid: totalPaidAmount,
            paymentMethod: payments[0]?.method || "Cash",
            referenceNumber: payments[0]?.referenceNumber || "",
            payments: payments.map(p => ({
                paymentMethod: p.method,
                paymentType: p.method,
                method: p.method,
                amount: parseFloat(p.amount) || 0,
                referenceNumber: p.referenceNumber || ""
            })),
            paymentMethods: payments.map(p => ({
                paymentMethod: p.method,
                paymentType: p.method,
                method: p.method,
                amount: parseFloat(p.amount) || 0,
                transactionRef: p.referenceNumber || "",
                referenceNumber: p.referenceNumber || ""
            })),
            items: validItems.map((it) => ({
                productId: it.productId,
                variantId: it.variantId,
                quantity: getActiveQty(it.qty),
                discountForItem: parseFloat(it.discount || 0),
                sellingPrice: it.price,
                taxPercentage: it.taxPercent,
                taxAmount: it.taxAmount,
                itemTotal: it.amount
            })),
            createdBy: userInfo?.id || 1,
            modifiedBy: mode === "edit" ? userInfo?.id || 1 : null
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
            { label: "Subtotal", value: subtotal.toFixed(2) },
            { label: "Total Discount", value: totalDiscount.toFixed(2) },
            { label: "Total Tax", value: totalTax.toFixed(2) },
            { label: "Customer Discount", value: parseFloat(formData.discountForCustomer || 0).toFixed(2) },
            { label: "Grand Total", value: totalBillAmount.toFixed(2), isTotal: true },
            { label: "Amount Paid", value: totalPaidAmount.toFixed(2) },
            { label: "Balance Due", value: balanceAmount.toFixed(2) }
        ];

        return (
            <PrintInvoiceTemplate
                title="SALE INVOICE"
                customerDetails={{
                    name: formData.partyName || 'N/A',
                    phone: formData.phone || '',
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
                                                }}
                                            >
                                                {c.firstName} {c.lastName} ({c.phoneNumber})
                                            </div>
                                        ))}
                                    {customers.filter((c) => !formData.partyName || `${c.firstName} ${c.lastName}`.toLowerCase().includes(formData.partyName.toLowerCase())).length === 0 && (
                                        <div className={styles.noResults}>No customers found</div>
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
                    {mode !== "add" && (
                        <div className={styles.field}>
                            <label>Invoice Id</label>
                            <input type="text" className={styles.input} value={formData.userOrderId} readOnly />
                        </div>
                    )}
                    <div className={styles.field}>
                        <label>Invoice Number</label>
                        <input type="text" className={styles.input} value={formData.invoiceNumber} readOnly />
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
                                <th rowSpan="2">Product Name</th>
                                <th rowSpan="2" style={{ minWidth: "120px" }}>UNIT</th>
                                <th rowSpan="2">QTY</th>
                                <th colSpan="1">PRICE</th>
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
                                <th className={styles.subHeader}>%</th>
                                <th className={styles.subHeader}>AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it, idx) => (
                                <tr key={idx}>
                                    <td>{String(idx + 1).padStart(2, "0")}</td>
                                    <td style={{ position: "relative", width: "28%" }}>
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
                                                            <div key={p.productId} className={styles.dropdownItem} onClick={() => handleProductSelect(idx, p)}>
                                                                <span style={{ fontWeight: "600" }}>{p.productName}</span>
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
                                    <td style={{ verticalAlign: "top", paddingTop: "12px" }}>
                                        <input
                                            type="number"
                                            className={styles.tableInputCenter}
                                            style={it.error || it.qtyError ? { border: "1px solid #ff4d4f", background: "#fffcfc" } : {}}
                                            placeholder="0"
                                            value={it.qty === "" || it.qty === 0 || it.qty === "0" ? "" : it.qty}
                                            onChange={(e) => handleQtyChange(idx, e.target.value)}
                                            disabled={isViewOnly}
                                        />
                                        {(it.error || it.qtyError) && (
                                            <div style={{ color: "#ff4d4f", fontSize: "10px", marginTop: "4px", textAlign: "center", fontWeight: "500", whiteSpace: "nowrap" }}>
                                                {it.qtyError || it.error}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ fontWeight: "700", textAlign: "center" }}>{Number(it.price || 0).toFixed(2)}</td>
                                    <td style={{ fontWeight: "700", textAlign: "center" }}>{it.taxPercent}%</td>
                                    <td style={{ fontWeight: "700", textAlign: "center" }}>{Number(it.taxAmount || 0).toFixed(2)}</td>
                                    <td style={{ verticalAlign: "top", paddingTop: "12px" }}>
                                        <input
                                            type="number"
                                            className={styles.tableInputCenter}
                                            placeholder="0"
                                            value={it.discount === 0 || it.discount === "0" ? "" : it.discount}
                                            onChange={(e) => handleDiscountChange(idx, e.target.value)}
                                            disabled={isViewOnly}
                                        />
                                    </td>
                                    <td style={{ fontWeight: "700", textAlign: "center" }}>{Number(it.discountAmount || 0).toFixed(2)}</td>
                                    <td style={{ fontWeight: "700", textAlign: "right" }}>{Number(it.amount || 0).toFixed(2)}</td>
                                    {!isViewOnly && (
                                        <td>
                                            <FiTrash2 onClick={() => handleRemoveRow(idx)} style={{ cursor: "pointer", color: "#E93E64" }} />
                                        </td>
                                    )}
                                </tr>
                            ))}
                            <tr className={styles.totalRowSummary}>
                                <td colSpan="2" style={{ fontWeight: "700", paddingLeft: "40px" }}>
                                    TOTAL
                                </td>
                                <td></td>
                                <td style={{ fontWeight: "600", textAlign: "center" }}>
                                    {items.reduce((acc, it) => acc + getActiveQty(it.qty), 0)}
                                </td>
                                <td style={{ fontWeight: "600", textAlign: "center" }}>{Number(items.reduce((acc, it) => acc + (it.price || 0), 0)).toFixed(2)}</td>
                                <td></td>
                                <td style={{ fontWeight: "600", textAlign: "center" }}>{Number(items.reduce((acc, it) => acc + (it.taxAmount || 0), 0)).toFixed(2)}</td>
                                <td></td>
                                <td style={{ fontWeight: "600", textAlign: "center" }}>{Number(items.reduce((acc, it) => acc + (it.discountAmount || 0), 0)).toFixed(2)}</td>
                                <td style={{ fontWeight: "700", textAlign: "right" }}>{Number(totalBillAmount || 0).toFixed(2)}</td>
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

                <div className={styles.paymentSection} style={{ gridTemplateColumns: "1.5fr 0.5fr 1.2fr" }}>
                    <div className={styles.paymentList}>
                        <label style={{ fontWeight: "700" }}>Payment Details</label>
                        {payments.map((p, idx) => (
                            <div key={idx} className={styles.paymentEntry}>
                                <div className={styles.paymentRow} style={{ gridTemplateColumns: "1fr 1fr" }}>
                                    <div className={styles.field}>
                                        <label>payment type</label>
                                        <select className={styles.select} value={p.method} onChange={(e) => handlePaymentChange(idx, "method", e.target.value)} disabled={isViewOnly}>
                                            <option value="Cash">Cash</option>
                                            <option value="UPI">UPI</option>
                                            <option value="Card">Card</option>
                                            <option value="Cheque">Cheque</option>
                                            <option value="Bank">Bank</option>
                                        </select>
                                    </div>
                                    <div className={styles.field}>
                                        <label>amount paid</label>
                                        <input
                                            type="number"
                                            className={styles.input}
                                            value={p.amount === "" || p.amount === 0 || p.amount === "0" ? "" : p.amount}
                                            placeholder="0"
                                            onChange={(e) => handlePaymentChange(idx, "amount", e.target.value)}
                                            disabled={isViewOnly}
                                        />
                                    </div>
                                </div>
                                {(p.method === "UPI" || p.method === "Cheque") && (
                                    <div className={styles.field} style={{ marginTop: "12px" }}>
                                        <label>{p.method === "Cheque" ? "check no" : "reference number"}</label>
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
                    <div className={styles.spacer}></div>
                    <div className={styles.totalSection}>
                        <div className={styles.totalRow} style={{ width: "250px" }}>
                            <span>Sub Total</span>
                            <span>Rs {Number(totalBillAmount || 0).toFixed(2)}</span>
                        </div>
                        {mode !== "add" && (
                            <div className={styles.totalRow} style={{ width: "250px", alignItems: "center" }}>
                                <span>Discount (After Tax)</span>
                                {isViewOnly ? (
                                    <span>Rs {Number(formData.discountForCustomer || 0).toFixed(2)}</span>
                                ) : (
                                    <input
                                        type="number"
                                        className={styles.input}
                                        style={{
                                            width: "100px",
                                            padding: "6px 8px",
                                            border: "1px solid #e5e7eb",
                                            borderRadius: "6px",
                                            textAlign: "right",
                                            fontWeight: "600",
                                            background: "#fcfcfc",
                                            outline: "none"
                                        }}
                                        value={formData.discountForCustomer === "" || formData.discountForCustomer === 0 || formData.discountForCustomer === "0" ? "" : formData.discountForCustomer}
                                        placeholder="0"
                                        onChange={(e) => {
                                            let val = e.target.value;
                                            if (val.startsWith("0") && val.length > 1 && val[1] !== ".") {
                                                val = String(Number(val));
                                            }
                                            if (val.includes(".")) {
                                                const parts = val.split(".");
                                                if (parts[1].length > 2) {
                                                    val = `${parts[0]}.${parts[1].slice(0, 2)}`;
                                                }
                                            }
                                            setFormData({ ...formData, discountForCustomer: val === "" ? "" : val });
                                        }}
                                    />
                                )}
                            </div>
                        )}
                        <div className={styles.totalRow} style={{ width: "250px" }}>
                            <span>Total Paid</span>
                            <span style={{ color: "#1E8E3E" }}>Rs {Number(totalPaidAmount || 0).toFixed(2)}</span>
                        </div>
                        <div className={`${styles.totalRow} ${styles.main}`} style={{ width: "250px" }}>
                            <span>Balance</span>
                            <span style={{ color: balanceAmount > 0 ? "#D93025" : "#1E8E3E" }}>Rs {Number(balanceAmount || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className={styles.shareBtn} onClick={onCancel}>
                        Cancel
                    </button>
                    {isViewOnly && (
                        <>
                            <button
                                className={styles.saveBtn}
                                onClick={() => setPaymentModalOpen(true)}
                                style={{ marginRight: '12px', background: '#000' }}
                            >
                                Make Payment
                            </button>
                            <button className={styles.saveBtn} onClick={() => window.print()} >
                                Print Invoice
                            </button>
                        </>
                    )}
                    {!isViewOnly && (
                        <button className={styles.saveBtn} onClick={handleSave} disabled={loading}>
                            {loading ? "Saving..." : "Save Invoice"}
                        </button>
                    )}
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
                    }}
                    data={{
                        totalAmount: totalBillAmount,
                        previousPaidAmount: totalPaidAmount,
                        balanceAmount: balanceAmount,
                        vendorCustomerId: formData.vendorCustomerId || (saleInvoiceData && saleInvoiceData.vendorCustomerId),
                        branchId: branchId,
                        userOrderId: saleId || formData.userOrderId
                    }}
                />
            )}
        </div>
    );
};

export default SaleInvoiceForm;
