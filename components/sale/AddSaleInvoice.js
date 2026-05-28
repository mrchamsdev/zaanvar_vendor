import { toApiDateOnly, dateOnlyWithTimeZone } from "@/utilities/date-time-utils";

import React, { useState, useEffect, useMemo } from "react";
import styles from "../../styles/sale/add-sale-invoice.module.css";
import { FiX, FiCalendar, FiChevronDown, FiTrash2 } from "react-icons/fi";
import { saleService } from "../../services/saleService";
import { productService } from "../../services/productService";
import { useRouter } from "next/router";
import useStore from "../../components/state/useStore";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { toast } from "sonner";

const AddSaleInvoice = ({ isOpen, onClose, onRefresh, mode = 'add', saleId }) => {
    const router = useRouter();
    const { jwtToken, userInfo } = useStore();
    const { branchId } = useDashboardData({ skipReviews: true });
    const isViewOnly = mode === 'view';

    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);

    const formatVariantSize = (size) => {
        if (!size) return "";
        let formattedSize = size;
        if (typeof size === 'string' && size.trim().startsWith('{')) {
            try {
                const parsed = JSON.parse(size);
                const parts = [];
                if (parsed.height) parts.push(`${parsed.height}${parsed.heightUnit || 'mm'}H`);
                if (parsed.width) parts.push(`${parsed.width}${parsed.widthUnit || 'mm'}W`);
                if (parsed.length) parts.push(`${parsed.length}${parsed.lengthUnit || 'mm'}L`);
                if (parsed.radius) parts.push(`${parsed.radius}${parsed.radiusUnit || 'mm'}R`);
                if (parsed.weight) parts.push(`${parsed.weight}${parsed.weightUnit || 'g'}`);
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
        invoiceNumber: "",
        invoiceDate: toApiDateOnly(new Date()),
        status: "Pending"
    });

    const [items, setItems] = useState([{
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
    }]);

    const [payments, setPayments] = useState([{ method: "Cash", amount: 0, referenceNumber: "" }]);

    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [showProductDropdown, setShowProductDropdown] = useState(null); // index
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            if (mode === 'add') {
                resetForm();
            }
            fetchInitialData();
            if ((mode === 'view' || mode === 'edit') && saleId) {
                fetchSaleDetails(saleId);
            }
        }
    }, [isOpen, mode, saleId]);

    useEffect(() => {
        if (!loading && isOpen && mode === 'view' && router.query.print === 'true') {
            const timer = setTimeout(() => {
                window.print();
                // Clean up the URL to prevent re-printing on re-renders
                const { print, ...rest } = router.query;
                router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [loading, isOpen, mode, router.query.print]);

    const resetForm = () => {
        setFormData({
            partyName: "",
            phone: "",
            vendorCustomerId: null,
            discountForCustomer: 0,
            invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
            invoiceDate: toApiDateOnly(new Date()),
            status: "Pending"
        });
        setItems([{
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
        }]);
        setPayments([{ method: "Cash", amount: 0, referenceNumber: "" }]);
        setErrors({});
    };

    const fetchInitialData = async () => {
        try {
            // Using separate calls to handle individual failures gracefully
            const custRes = await saleService.getCustomers(jwtToken, branchId).catch(() => ({ status: "success", data: [] }));
            const prodRes = await productService.getAllProductsBrief(jwtToken, branchId).catch(() => []);

            if (custRes.status === "success") setCustomers(custRes.data || []);
            setProducts(prodRes || []);
        } catch (error) {
            console.error("Error in fetchInitialData:", error);
        }
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest(`.${styles.searchableDropdown}`)) {
                setShowCustomerDropdown(false);
                setShowProductDropdown(null);
            }
        };
        window.addEventListener('mousedown', handleClickOutside);
        return () => window.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSaleDetails = async (id) => {
        setLoading(true);
        try {
            const res = await saleService.getSaleInvoiceById(jwtToken, id);
            if (res.status === "success" && res.data) {
                const data = res.data;
                const customerName = data.customer ? `${data.customer.firstName} ${data.customer.lastName}`.trim() : (data.partyName || "");
                const customerPhone = data.customer?.phoneNumber || data.phone || "";

                setFormData({
                    partyName: customerName,
                    phone: customerPhone,
                    vendorCustomerId: data.vendorCustomerId || null,
                    discountForCustomer: data.discountForCustomer || 0,
                    invoiceNumber: data.userOrderId || data.invoiceNumber || "",
                    invoiceDate: (data.invoiceDate || data.createdDate) ? (data.invoiceDate || data.createdDate).split('T')[0] : "",
                    status: data.status || "Pending"
                });

                // Mapping cartItems based on the latest API response
                const mappedItems = (data.cartItems || []).map(it => {
                    const variant = it.variant || it.Variant || {};
                    const vType = variant.variantType || {};
                    const unitLabel = formatVariantSize(vType.size) || vType.type || "Unit";

                    return {
                        productId: it.productId,
                        variantId: it.variantId,
                        productName: it.productName || it.product?.productName || variant.SKU || "Product",
                        unit: unitLabel,
                        qty: it.quantity || 0,
                        price: parseFloat(it.sellingPrice || 0),
                        discount: parseFloat(it.discountForItem || 0),
                        taxPercent: parseFloat(it.taxPercentage || 0),
                        taxAmount: parseFloat(it.taxAmount || 0),
                        amount: parseFloat(it.itemTotal || 0),
                        availableQty: variant.currentQty || 0,
                        availableVariants: variant.variantId ? [variant] : []
                    };
                });
                setItems(mappedItems.length > 0 ? mappedItems : [{
                    productId: "", variantId: "", productName: "", unit: "Unit Type", qty: 1, price: 0, discount: 0, taxPercent: 0, taxAmount: 0, amount: 0, availableQty: 0, availableVariants: []
                }]);

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
            }
        } catch (error) {
            console.error("Error fetching sale details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCustomerSearch = (val, type) => {
        if (type === 'name') {
            setFormData({ ...formData, partyName: val });
            setShowCustomerDropdown(true);
            if (errors.partyName) {
                setErrors(prev => ({ ...prev, partyName: null }));
            }
            // Just updating the name, phone update happens on selection from dropdown usually
            // But if there's an exact match, we can fill it
            const exact = customers.find(c => `${c.firstName} ${c.lastName}`.toLowerCase() === val.toLowerCase());
            if (exact) setFormData(prev => ({ ...prev, phone: exact.phoneNumber, vendorCustomerId: exact.vendorCustomerId }));
        } else {
            setFormData({ ...formData, phone: val });
            if (errors.phone) {
                setErrors(prev => ({ ...prev, phone: null }));
            }
            // Auto-select customer if 10 digits are entered
            if (val.length === 10) {
                const found = customers.find(c => c.phoneNumber === val);
                if (found) {
                    setFormData(prev => ({ ...prev, partyName: `${found.firstName} ${found.lastName}`.trim(), vendorCustomerId: found.vendorCustomerId }));
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
        const qty = 1;
        const taxAmount = (price * qty * tax) / 100;

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
            taxPercent: tax,
            taxAmount: taxAmount,
            amount: (price * qty) + taxAmount,
            availableQty: availableQty,
            availableVariants: variants, // Store for the unit dropdown
            productError: null,
            error: qty > availableQty ? `Cannot exceed quantity (${availableQty})` : null
        };
        setItems(newItems);
        setShowProductDropdown(null);
    };

    const handleVariantChange = (index, variantId) => {
        const newItems = [...items];
        const it = newItems[index];
        const v = it.availableVariants.find(varnt => String(varnt.variantId) === String(variantId));

        if (v) {
            const price = parseFloat(v.sellingPrice || v.mrp || 0);
            const taxAmount = (price * it.qty * it.taxPercent) / 100;
            const vType = v.variantType || {};
            const unitParts = [formatVariantSize(vType.size), vType.type, vType.packType].filter(Boolean);
            const unitVal = unitParts.length > 0 ? unitParts.join(" ") : "Unit";

            const availableQty = v.stockUpdates?.qtyForSale !== undefined ? v.stockUpdates.qtyForSale : (v.currentQty || 0);
            newItems[index] = {
                ...it,
                variantId: v.variantId,
                unit: unitVal,
                price: price,
                taxAmount: taxAmount,
                amount: (price * it.qty) + taxAmount,
                availableQty: availableQty,
                error: it.qty > availableQty ? `Cannot exceed quantity (${availableQty})` : null
            };
            setItems(newItems);
        }
    };

    const handleQtyChange = (index, val) => {
        const qty = parseFloat(val) || 0;
        const newItems = [...items];
        const it = newItems[index];

        const taxAmount = (it.price * qty * it.taxPercent) / 100;
        newItems[index] = {
            ...it,
            qty: val === "" ? "" : qty,
            taxAmount: taxAmount,
            amount: (it.price * qty) + taxAmount,
            qtyError: qty <= 0 ? "Quantity must be greater than 0" : (qty > it.availableQty ? `Cannot exceed quantity (${it.availableQty})` : null),
            error: qty <= 0 ? "Quantity must be greater than 0" : (qty > it.availableQty ? `Cannot exceed quantity (${it.availableQty})` : null)
        };
        setItems(newItems);
    };

    const handleAddRow = () => {
        setItems([...items, { productId: "", productName: "", qty: 1, price: 0, taxPercent: 0, taxAmount: 0, amount: 0, availableQty: 0 }]);
    };

    const handleRemoveRow = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems.length > 0 ? newItems : [{ productId: "", productName: "", qty: 1, price: 0, taxPercent: 0, taxAmount: 0, amount: 0, availableQty: 0 }]);
    };

    const handleAddPayment = () => {
        setPayments([...payments, { method: "Cash", amount: 0, referenceNumber: "" }]);
    };

    const handlePaymentChange = (index, field, val) => {
        const newPayments = [...payments];
        newPayments[index][field] = val;
        setPayments(newPayments);
    };

    const totalBillAmount = items.reduce((acc, it) => acc + (it.amount || 0), 0);
    const discountForCustomer = parseFloat(formData.discountForCustomer || 0);
    const totalPaidAmount = payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
    const balanceAmount = totalBillAmount - discountForCustomer - totalPaidAmount;

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
            return;
        }

        const validItems = items.filter(it => it.productId);

        const payload = {
            branchId,
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
            items: validItems.map(it => ({
                productId: it.productId,
                variantId: it.variantId,
                quantity: it.qty,
                discountForItem: parseFloat(it.discount || 0),
                sellingPrice: it.price,
                taxPercentage: it.taxPercent,
                taxAmount: it.taxAmount,
                itemTotal: it.amount
            })),
            createdBy: userInfo?.id || 1,
            modifiedBy: mode === 'edit' ? (userInfo?.id || 1) : null
        };

        Object.assign(payload, dateOnlyWithTimeZone('invoiceDate', formData.invoiceDate));

        setLoading(true);
        try {
            let res;
            if (mode === 'edit') {
                res = await saleService.updateSaleInvoice(jwtToken, saleId, payload);
            } else {
                res = await saleService.createSaleInvoice(jwtToken, payload);
            }

            if (res.status === "success" || res.status === 200) {
                toast.success(`Sale ${mode === 'edit' ? 'updated' : 'created'} successfully`);
                resetForm();
                onRefresh();
                onClose();
            } else {
                toast.error(res.message || "Failed to save sale invoice");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h3>{mode === 'add' ? 'Add Sale Invoice' : mode === 'view' ? 'View Sale Invoice' : 'Edit Sale Invoice'}</h3>
                    <button className={styles.closeBtn} onClick={onClose}><FiX /></button>
                </div>

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
                                    onChange={(e) => handleCustomerSearch(e.target.value, 'name')}
                                    onFocus={() => setShowCustomerDropdown(true)}
                                    disabled={isViewOnly}
                                />
                                {showCustomerDropdown && !isViewOnly && (
                                    <div className={styles.dropdownList}>
                                        {customers
                                            .filter(c => !formData.partyName || `${c.firstName} ${c.lastName}`.toLowerCase().includes(formData.partyName.toLowerCase()))
                                            .map(c => (
                                                <div key={c.vendorCustomerId || c.id} className={styles.dropdownItem} onClick={() => {
                                                    const fullName = `${c.firstName} ${c.lastName}`.trim();
                                                    setFormData(prev => ({ ...prev, partyName: fullName, phone: c.phoneNumber, vendorCustomerId: c.vendorCustomerId }));
                                                    setShowCustomerDropdown(false);
                                                }}>
                                                    {c.firstName} {c.lastName} ({c.phoneNumber})
                                                </div>
                                            ))
                                        }
                                        {customers.filter(c => !formData.partyName || `${c.firstName} ${c.lastName}`.toLowerCase().includes(formData.partyName.toLowerCase())).length === 0 && (
                                            <div className={styles.noResults}>No customers found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {errors.partyName && (
                                <div style={{ color: '#ff4d4f', fontSize: '11px', marginTop: '4px', fontWeight: '500' }}>
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
                                onChange={(e) => handleCustomerSearch(e.target.value, 'phone')}
                                disabled={isViewOnly}
                            />
                            {errors.phone && (
                                <div style={{ color: '#ff4d4f', fontSize: '11px', marginTop: '4px', fontWeight: '500' }}>
                                    {errors.phone}
                                </div>
                            )}
                        </div>
                        <div className={styles.field}>
                            <label>Invoice No</label>
                            <input type="text" className={styles.input} value={formData.invoiceNumber} readOnly />
                        </div>
                        <div className={styles.field}>
                            <label>Invoice Date</label>
                            <input type="date" className={styles.input} value={formData.invoiceDate} onChange={(e) => {
                                setFormData({ ...formData, invoiceDate: e.target.value });
                                if (errors.invoiceDate) {
                                    setErrors(prev => ({ ...prev, invoiceDate: null }));
                                }
                            }} disabled={isViewOnly} />
                            {errors.invoiceDate && (
                                <div style={{ color: '#ff4d4f', fontSize: '11px', marginTop: '4px', fontWeight: '500' }}>
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
                                    <th rowSpan="2">ENTER ITEM</th>
                                    <th rowSpan="2" style={{ minWidth: "120px" }}>UNIT</th>
                                    <th rowSpan="2">QTY</th>
                                    <th colSpan="1">PRICE</th>
                                    <th colSpan="2" style={{ textAlign: 'center' }}>TAX</th>
                                    <th rowSpan="2" style={{ textAlign: 'right' }}>AMOUNT</th>
                                    {!isViewOnly && <th rowSpan="2"></th>}
                                </tr>
                                <tr>
                                    <th className={styles.subHeader}>WITHOUT TAX <FiChevronDown size={10} /></th>
                                    <th className={styles.subHeader}>%</th>
                                    <th className={styles.subHeader}>AMOUNT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((it, idx) => (
                                    <tr key={idx}>
                                        <td>{String(idx + 1).padStart(2, '0')}</td>
                                        <td style={{ position: 'relative', width: '28%' }}>
                                            <div className={styles.searchableDropdown} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                                                <input
                                                    type="text"
                                                    className={styles.tableInput}
                                                    style={{ paddingRight: '20px' }}
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
                                                            position: 'absolute',
                                                            right: '8px',
                                                            pointerEvents: 'none',
                                                            color: '#999'
                                                        }}
                                                    />
                                                )}
                                                {showProductDropdown === idx && !isViewOnly && (
                                                    <div className={styles.dropdownList}>
                                                        {products
                                                            .filter(p => {
                                                                const search = (it.productName || "").toLowerCase();
                                                                return !search || (p.productName || "").toLowerCase().includes(search);
                                                            })
                                                            .map((p) => (
                                                                 <div key={p.productId} className={styles.dropdownItem} onClick={() => handleProductSelect(idx, p)}>
                                                                    <span style={{ fontWeight: '600' }}>{p.productName}</span>
                                                                </div>
                                                            ))
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                            {it.productError && (
                                                <div style={{ color: '#ff4d4f', fontSize: '10px', marginTop: '4px', fontWeight: '500' }}>
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
                                                            {it.availableVariants.map(v => (
                                                                <option key={v.variantId} value={v.variantId}>
                                                                    {formatVariantSize(v.variantType?.size) || v.variantType?.type || "Unit"}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <FiChevronDown size={12} style={{ pointerEvents: "none", marginLeft: "-12px", color: "#666" }} />
                                                    </div>
                                                ) : (
                                                    <div className={styles.unitSelector}>
                                                        <span>{it.unit || 'Unit Type'}</span>
                                                        <FiChevronDown size={12} />
                                                    </div>
                                                )
                                            )}
                                        </td>
                                        <td style={{ verticalAlign: 'top', paddingTop: '12px' }}>
                                            <input
                                                type="number"
                                                className={styles.tableInputCenter}
                                                style={it.error || it.qtyError ? { border: '1px solid #ff4d4f', background: '#fffcfc' } : {}}
                                                value={it.qty === 0 ? "" : it.qty}
                                                onChange={(e) => handleQtyChange(idx, e.target.value)}
                                                disabled={isViewOnly}
                                            />
                                            {(it.error || it.qtyError) && (
                                                <div style={{ color: '#ff4d4f', fontSize: '10px', marginTop: '4px', textAlign: 'center', fontWeight: '500', whiteSpace: 'nowrap' }}>
                                                    {it.qtyError || it.error}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ fontWeight: '700', textAlign: 'center' }}>{it.price.toLocaleString()}</td>
                                        <td style={{ fontWeight: '700', textAlign: 'center' }}>{it.taxPercent}%</td>
                                        <td style={{ fontWeight: '700', textAlign: 'center' }}>{it.taxAmount.toLocaleString()}</td>
                                        <td style={{ fontWeight: '700', textAlign: 'right' }}>{it.amount.toLocaleString()}</td>
                                        {!isViewOnly && (
                                            <td><FiTrash2 onClick={() => handleRemoveRow(idx)} style={{ cursor: 'pointer', color: '#E93E64' }} /></td>
                                        )}
                                    </tr>
                                ))}
                                <tr className={styles.totalRowSummary}>
                                    <td colSpan="2" style={{ fontWeight: '700', paddingLeft: '40px' }}>TOTAL</td>
                                    <td></td>
                                    <td style={{ fontWeight: '600', textAlign: 'center' }}>{items.reduce((acc, it) => acc + (parseFloat(it.qty) || 0), 0)}</td>
                                    <td style={{ fontWeight: '600', textAlign: 'center' }}>{items.reduce((acc, it) => acc + (it.price || 0), 0).toLocaleString()}</td>
                                    <td></td>
                                    <td style={{ fontWeight: '600', textAlign: 'center' }}>{items.reduce((acc, it) => acc + (it.taxAmount || 0), 0).toLocaleString()}</td>
                                    <td style={{ fontWeight: '700', textAlign: 'right' }}>{totalBillAmount.toLocaleString()}</td>
                                    {!isViewOnly && <td></td>}
                                </tr>
                            </tbody>
                        </table>
                        {!isViewOnly && (
                            <span className={styles.addBtn} onClick={handleAddRow}>+ Add Item</span>
                        )}
                    </div>

                    <div className={styles.paymentSection} style={{ gridTemplateColumns: "1.5fr 0.5fr 1.2fr" }}>
                        <div className={styles.paymentList}>
                            <label style={{ fontWeight: '700' }}>Payment Details</label>
                            {payments.map((p, idx) => (
                                <div key={idx} className={styles.paymentRow} style={{ gridTemplateColumns: p.method === "UPI" || p.method === "Cheque" ? "1fr 1fr 1.2fr" : "1fr 1fr" }}>

                                    <select className={styles.select} value={p.method} onChange={(e) => handlePaymentChange(idx, 'method', e.target.value)} disabled={isViewOnly}>
                                        <option value="Cash">Cash</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Card">Card</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="Bank">Bank</option>
                                    </select>
                                    <input type="number" className={styles.input} placeholder="Amount" value={p.amount} onChange={(e) => handlePaymentChange(idx, 'amount', e.target.value)} disabled={isViewOnly} />
                                    {(p.method === "UPI" || p.method === "Cheque") && (
                                        <input
                                            type="text"
                                            className={styles.input}
                                            placeholder={p.method === "UPI" ? "Reference Number" : "Cheque No"}
                                            value={p.referenceNumber || ""}
                                            onChange={(e) => handlePaymentChange(idx, "referenceNumber", e.target.value)}
                                            disabled={isViewOnly}
                                        />
                                    )}
                                </div>
                            ))}
                            {!isViewOnly && (
                                <span className={styles.addAnotherPayment} onClick={handleAddPayment}>+ Add another payment</span>
                            )}
                        </div>
                        <div className={styles.spacer}></div>
                        <div className={styles.totalSection}>
                            <div className={styles.totalRow} style={{ width: "250px" }}>
                                <span>Sub Total</span>
                                <span>Rs {totalBillAmount.toLocaleString()}</span>
                            </div>
                            {mode !== "add" && (
                                <div className={styles.totalRow} style={{ width: "250px", alignItems: "center" }}>
                                    <span>Discount (After Tax)</span>
                                    {isViewOnly ? (
                                        <span>Rs {parseFloat(formData.discountForCustomer || 0).toLocaleString()}</span>
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
                                                setFormData({ ...formData, discountForCustomer: val === "" ? "" : val });
                                            }}
                                        />
                                    )}
                                </div>
                            )}
                            <div className={styles.totalRow} style={{ width: "250px" }}>
                                <span>Total Paid</span>
                                <span style={{ color: '#1E8E3E' }}>Rs {totalPaidAmount.toLocaleString()}</span>
                            </div>
                            <div className={`${styles.totalRow} ${styles.main}`} style={{ width: "250px" }}>
                                <span>Balance</span>
                                <span style={{ color: balanceAmount > 0 ? '#D93025' : '#1E8E3E' }}>Rs {balanceAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className={styles.shareBtn} onClick={onClose}>Cancel</button>
                    {isViewOnly && (
                        <button className={styles.saveBtn} onClick={() => window.print()} >
                            Print Invoice
                        </button>
                    )}
                    {!isViewOnly && (
                        <button className={styles.saveBtn} onClick={handleSave} disabled={loading}>
                            {loading ? 'Saving...' : 'Save Invoice'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddSaleInvoice;
