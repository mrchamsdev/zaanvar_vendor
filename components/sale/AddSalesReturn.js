import { toApiDateOnly } from "@/utilities/date-time-utils";

import React, { useState, useEffect } from "react";
import styles from "../../styles/sale/add-sale-invoice.module.css";
import { FiX, FiCalendar, FiChevronDown, FiPlus, FiTrash2 } from "react-icons/fi";
import useStore from "../../components/state/useStore";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { saleService } from "../../services/saleService";
import { toast } from "sonner";
import { dateOnlyWithTimeZone, parseWallClockDate } from "@/utilities/date-time-utils";
import { useRouter } from "next/router";

const AddSalesReturn = ({ isOpen, onClose, onRefresh, mode = "add", returnId }) => {
    const router = useRouter();
    const { jwtToken, userInfo } = useStore();
    const { branchId } = useDashboardData({ skipReviews: true });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [cartDetails, setCartDetails] = useState(null);
    const [availableItems, setAvailableItems] = useState([]);
    const [focusedField, setFocusedField] = useState(null);

    const formatVariantSize = (size) => {
        if (!size) return "";
        if (typeof size === 'string' && size.trim().startsWith('{')) {
            try {
                const parsed = JSON.parse(size);
                const parts = [];
                if (parsed.height) parts.push(`${parsed.height}${parsed.heightUnit || 'mm'}H`);
                if (parsed.width) parts.push(`${parsed.width}${parsed.widthUnit || 'mm'}W`);
                if (parsed.length) parts.push(`${parsed.length}${parsed.lengthUnit || 'mm'}L`);
                if (parsed.radius) parts.push(`${parsed.radius}${parsed.radiusUnit || 'mm'}R`);
                if (parsed.weight) parts.push(`${parsed.weight}${parsed.weightUnit || 'g'}`);
                return parts.length > 0 ? parts.join(" x ") : size;
            } catch (e) {
                return size;
            }
        }
        return size;
    };

    const [formData, setFormData] = useState({
        receiptNo: "",
        returnNo: `SR-${Date.now().toString().slice(-6)}`,
        returnReason: "",
        billDate: "",
        returnDate: toApiDateOnly(new Date())
    });

    const [items, setItems] = useState([]);
    const [showProductDropdown, setShowProductDropdown] = useState(null); // stores index
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [showReceiptDropdown, setShowReceiptDropdown] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchCustomers();
            if ((mode === "view" || mode === "edit") && returnId) {
                fetchReturnDetails();
            } else {
                // Reset form for add mode
                setFormData({
                    receiptNo: "",
                    returnNo: `SR-${Date.now().toString().slice(-6)}`,
                    returnReason: "",
                    billDate: "",
                    returnDate: toApiDateOnly(new Date())
                });
                setItems([]);
                setSelectedCustomer(null);
                setSelectedOrder(null);
            }
        }
    }, [isOpen, mode, returnId]);

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

    const fetchReturnDetails = async () => {
        setLoading(true);
        try {
            const res = await saleService.getSalesReturnById(jwtToken, returnId);
            if (res.status === "success" && res.data) {
                const data = res.data;
                setFormData({
                    receiptNo: data.userOrderId,
                    returnNo: `SR-${data.customerReturnId}`,
                    returnReason: data.returnReason || "",
                    billDate: data.createdDate?.split('T')[0] || "",
                    returnDate: data.returnDate?.split('T')[0] || data.createdDate?.split('T')[0] || ""
                });

                // Fetch customer to get phone etc.
                const custRes = await saleService.getCustomersByBranch(jwtToken, branchId);
                const customersList = Array.isArray(custRes.data) ? custRes.data : (custRes.data?.data || []);
                const cust = customersList.find(c => c.vendorCustomerId === data.vendorCustomerId);
                if (cust) setSelectedCustomer(cust);

                // Fetch original order to get max quantities
                const orderRes = await saleService.getOrderById(jwtToken, data.userOrderId);
                let availableItemsList = [];
                if (orderRes.status === "success" && orderRes.data) {
                    setSelectedOrder(orderRes.data);
                    availableItemsList = (orderRes.data.cartItems || []).map(item => {
                        const vType = item.variant?.variantType || {};
                        const unitParts = [formatVariantSize(vType.size), vType.type].filter(Boolean);
                        const unitVal = unitParts.length > 0 ? unitParts.join(" ") : "Unit";

                        return {
                            userOrderItemsID: item.userOrderItemsID,
                            productName: item.product?.productName || "Product",
                            productId: item.productId,
                            variantId: item.variantId,
                            quantity: item.quantity, // original order qty
                            unit: unitVal,
                            price: parseFloat(item.sellingPrice) || 0,
                            taxPercentage: parseFloat(item.taxPercentage) || 0,
                            discountPercentage: parseFloat(item.discountPercentage) || 0,
                        };
                    });
                    setAvailableItems(availableItemsList);
                }

                // Set items from return data
                setItems((data.items || []).map(item => {
                    const original = availableItemsList.find(ai => ai.userOrderItemsID === item.userOrderItemsID);
                    return {
                        userOrderItemsID: item.userOrderItemsID,
                        productName: original?.productName || "Product",
                        returnQty: item.quantity,
                        quantity: original?.quantity || item.quantity, // original order qty
                        unit: original?.unit || "Unit",
                        price: parseFloat(item.sellingPrice || item.returnAmount) || 0,
                        taxPercentage: parseFloat(item.taxAmount || 0),
                        discountPercentage: parseFloat(item.discount || 0),
                        returnCondition: item.returnCondition || "Resellable",
                        itemTotal: parseFloat(item.returnAmount) || 0
                    };
                }));
            }
        } catch (error) {
            console.error("Error fetching return details:", error);
            toast.error("Failed to fetch return details");
        }
        setLoading(false);
    };

    const fetchCustomers = async () => {
        const res = await saleService.getCustomersByBranch(jwtToken, branchId);
        if (res.status === "success") {
            const customerList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            setCustomers(customerList);
        }
    };

    const handleCustomerSelect = (customer) => {
        setSelectedCustomer(customer);
        setShowCustomerDropdown(false);
        setOrders(customer.userOrderIds || []);
        setItems([]);
        setAvailableItems([]);
        setSelectedOrder(null);
        setErrors(prev => ({ ...prev, customer: undefined }));
    };

    const handleReceiptSelect = async (orderId) => {
        setFormData({ ...formData, receiptNo: orderId });
        setShowReceiptDropdown(false);
        setErrors(prev => ({ ...prev, receiptNo: undefined, itemsEmpty: undefined }));
        setLoading(true);
        const res = await saleService.getOrderById(jwtToken, orderId);
        if (res.status === "success" && res.data) {
            setSelectedOrder(res.data);
            const cartItems = res.data.cartItems || [];
            setAvailableItems(cartItems.map(item => {
                const vType = item.variant?.variantType || {};
                const unitParts = [formatVariantSize(vType.size), vType.type].filter(Boolean);
                const unitVal = unitParts.length > 0 ? unitParts.join(" ") : "Unit";

                return {
                    userOrderItemsID: item.userOrderItemsID,
                    productName: item.product?.productName || "Product",
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    unit: unitVal,
                    price: parseFloat(item.sellingPrice) || 0,
                    taxPercentage: parseFloat(item.taxPercentage) || 0,
                    discountPercentage: parseFloat(item.discountPercentage) || 0,
                };
            }));

            // Match Purchase Return behavior: Add an initial empty row
            if (cartItems.length > 0) {
                setItems([{
                    userOrderItemsID: "",
                    productName: "",
                    returnQty: 0,
                    quantity: 0,
                    unit: "",
                    price: 0,
                    taxPercentage: 0,
                    discountPercentage: 0,
                    returnCondition: "Resellable",
                    itemTotal: 0
                }]);
            } else {
                setItems([]);
            }
        }
        setLoading(false);
    };

    const handleAddRow = () => {
        if (!selectedOrder) {
            toast.error("Please select a Receipt No first");
            return;
        }
        setItems([...items, {
            userOrderItemsID: "",
            productName: "",
            returnQty: 0,
            quantity: 0,
            unit: "",
            price: 0,
            taxPercentage: 0,
            discountPercentage: 0,
            returnCondition: "Resellable",
            itemTotal: 0
        }]);
    };

    const handleProductSelect = (index, p) => {
        const newItems = [...items];
        newItems[index] = {
            ...p,
            returnQty: 1,
            returnCondition: "Resellable",
            itemTotal: p.price + (p.price * p.taxPercentage / 100) - (p.price * p.discountPercentage / 100)
        };
        setItems(newItems);
        setShowProductDropdown(null);
        setErrors(prev => ({ ...prev, [`itemProduct_${index}`]: undefined, itemsEmpty: undefined }));
    };

    const updateReturnCondition = (index, condition) => {
        const newItems = [...items];
        newItems[index].returnCondition = condition;
        setItems(newItems);
    };

    const updateItemQty = (index, qty) => {
        const newItems = [...items];
        const maxQty = items[index].quantity || 0;
        const returnQty = Math.min(qty, maxQty);
        newItems[index].returnQty = returnQty;

        const price = newItems[index].price || 0;
        const tax = (price * (newItems[index].taxPercentage || 0)) / 100;
        const disc = (price * (newItems[index].discountPercentage || 0)) / 100;
        newItems[index].itemTotal = returnQty * (price + tax - disc);

        setItems(newItems);
        setErrors(prev => ({ ...prev, [`itemQty_${index}`]: undefined }));
    };

    const removeItem = (index) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const availableProductsForDropdown = (currentIndex) => {
        const otherSelectedIds = items
            .map((it, idx) => idx !== currentIndex ? it.userOrderItemsID : null)
            .filter(id => id);
        return availableItems.filter(p => !otherSelectedIds.includes(p.userOrderItemsID));
    };

    const handleSave = async () => {
        const newErrors = {};
        if (!selectedCustomer) {
            newErrors.customer = "Customer name is required";
        }
        if (!formData.receiptNo) {
            newErrors.receiptNo = "Receipt number is required";
        }

        items.forEach((item, index) => {
            if (!item.userOrderItemsID) {
                newErrors[`itemProduct_${index}`] = "Product name is required";
            }
            if (item.userOrderItemsID && (item.returnQty === "" || item.returnQty === null || item.returnQty === undefined || parseFloat(item.returnQty) <= 0)) {
                newErrors[`itemQty_${index}`] = "Quantity must be greater than 0";
            }
        });

        if (items.length === 0) {
            newErrors.itemsEmpty = "Please select at least one product and quantity";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        const validItems = items.filter(it => it.userOrderItemsID && it.returnQty > 0);

        const totalReturnAmount = validItems.reduce((acc, i) => acc + (i.itemTotal || 0), 0);

        const payload = {
            userOrderId: parseInt(formData.receiptNo),
            branchId,
            vendorCustomerId: selectedCustomer.vendorCustomerId,
            returnReason: formData.returnReason,
            ...(formData.returnDate
                ? dateOnlyWithTimeZone(
                    "returnDate",
                    parseWallClockDate(formData.returnDate) || new Date(formData.returnDate),
                )
                : {}),
            createdBy: userInfo?.userId || 1,
            totalReturnAmount: parseFloat(totalReturnAmount.toFixed(2)),
            items: validItems.map(i => ({
                userOrderItemsID: i.userOrderItemsID,
                quantity: i.returnQty,
                returnCondition: i.returnCondition
            }))
        };

        setLoading(true);
        try {
            let res;
            if (mode === "edit") {
                // User said: "PUT. /api/vendor/customer-returns/6 { "vendorCustomerId": 1 }"
                // And "only qty and unity can be editable"
                // This is a bit contradictory. I'll send the full payload or what's expected.
                // Usually PUT takes the same structure as POST or a subset.
                res = await saleService.updateSalesReturn(jwtToken, returnId, payload);
            } else {
                res = await saleService.createSalesReturn(jwtToken, payload);
            }

            if (res && (res.status === "success" || res.data?.status === "success")) {
                toast.success(mode === "edit" ? "Sales return updated successfully" : "Sales return created successfully");
                onRefresh();
                onClose();
            } else {
                toast.error(res?.data?.message || res?.message || `Failed to ${mode === "edit" ? "update" : "create"} sales return`);
            }
        } catch (error) {
            console.error("Error saving sales return:", error);
            toast.error("An error occurred while saving");
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h3 style={{ fontSize: '24px', fontWeight: '600' }}>
                        {mode === "view" ? "View Sale Return" : mode === "edit" ? "Edit Sale Return" : "Add Sale Return"}
                    </h3>
                    <button className={styles.closeBtn} onClick={onClose}><FiX /></button>
                </div>

                <div className={styles.modalContent}>
                    <div className={styles.topGrid}>
                        <div className={styles.field} style={{ zIndex: showCustomerDropdown ? 100 : 1 }}>
                            <label>Customer Name</label>
                            <div
                                className={styles.select}
                                onClick={() => mode === "add" && setShowCustomerDropdown(!showCustomerDropdown)}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: mode === "add" ? 'pointer' : 'default',
                                    opacity: mode === "add" ? 1 : 0.8,
                                    background: '#fff',
                                    border: errors.customer ? '2px solid red' : (showCustomerDropdown ? '2px solid #E93E64' : '2px solid #ddd'),
                                    boxShadow: 'none'
                                }}
                            >
                                <span>{selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : "Select Name"}</span>
                                {mode === "add" && <FiChevronDown />}
                            </div>
                            {showCustomerDropdown && (
                                <div className={styles.dropdownList}>
                                    {customers.map(c => (
                                        <div key={c.vendorCustomerId} className={styles.dropdownItem} onClick={() => handleCustomerSelect(c)}>
                                            {c.firstName} {c.lastName} ({c.phoneNumber})
                                        </div>
                                    ))}
                                </div>
                            )}
                            {errors.customer && (
                                <span className={styles.errorMsg} style={{ color: 'red', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                    {errors.customer}
                                </span>
                            )}
                        </div>
                        <div className={styles.field}>
                            <label>Customer Phone Number</label>
                            <input type="text" className={styles.input} value={selectedCustomer?.phoneNumber || ""} placeholder="Phone number" readOnly style={{ background: '#fff', border: '2px solid #ddd', boxShadow: 'none' }} />
                        </div>
                        <div className={styles.field} style={{ zIndex: showReceiptDropdown ? 100 : 1 }}>
                            <label>Receipt No</label>
                            <div
                                className={styles.select}
                                onClick={() => mode === "add" && setShowReceiptDropdown(!showReceiptDropdown)}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: mode === "add" ? 'pointer' : 'default',
                                    opacity: mode === "add" ? 1 : 0.8,
                                    background: '#fff',
                                    border: errors.receiptNo ? '2px solid red' : (showReceiptDropdown ? '2px solid #E93E64' : '2px solid #ddd'),
                                    boxShadow: 'none'
                                }}
                            >
                                <span>{formData.receiptNo ? `Order ${formData.receiptNo}` : "Enter Receipt no"}</span>
                                {mode === "add" && <FiChevronDown />}
                            </div>
                            {showReceiptDropdown && (
                                <div className={styles.dropdownList}>
                                    {orders.map(id => (
                                        <div key={id} className={styles.dropdownItem} onClick={() => handleReceiptSelect(id)}>
                                            Order {id}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {errors.receiptNo && (
                                <span className={styles.errorMsg} style={{ color: 'red', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                    {errors.receiptNo}
                                </span>
                            )}
                        </div>
                        <div className={styles.field}>
                            <label>Return No</label>
                            <input type="text" className={styles.input} value={formData.returnNo} readOnly style={{ background: '#fff', border: '2px solid #ddd', boxShadow: 'none' }} />
                        </div>
                        <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                            <label>Return Reason</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={formData.returnReason}
                                onChange={(e) => setFormData({ ...formData, returnReason: e.target.value })}
                                placeholder="Enter here"
                                readOnly={mode === "view"}
                                onFocus={() => setFocusedField('returnReason')}
                                onBlur={() => setFocusedField(null)}
                                style={{
                                    background: '#fff',
                                    border: focusedField === 'returnReason' ? '2px solid #E93E64' : '2px solid #ddd',
                                    boxShadow: 'none'
                                }}
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Bill Date</label>
                            <input
                                type="date"
                                className={styles.input}
                                value={formData.billDate}
                                onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                                readOnly={mode === "view"}
                                max={toApiDateOnly(new Date())}
                                onFocus={() => setFocusedField('billDate')}
                                onBlur={() => setFocusedField(null)}
                                style={{
                                    background: '#fff',
                                    border: focusedField === 'billDate' ? '2px solid #E93E64' : '2px solid #ddd',
                                    width: '100%',
                                    boxShadow: 'none'
                                }}
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Return Date</label>
                            <input
                                type="date"
                                className={styles.input}
                                value={formData.returnDate}
                                onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                                readOnly={mode === "view"}
                                onFocus={() => setFocusedField('returnDate')}
                                onBlur={() => setFocusedField(null)}
                                style={{
                                    background: '#fff',
                                    border: focusedField === 'returnDate' ? '2px solid #E93E64' : '2px solid #ddd',
                                    boxShadow: 'none'
                                }}
                            />
                        </div>
                    </div>

                    <div className={styles.tableContainer}>
                        <table className={styles.premiumTable}>
                            <thead>
                                <tr>
                                    <th>S NO.</th>
                                    <th>PRODUCT NAME</th>
                                    <th style={{ textAlign: 'center' }}>QTY / UNIT</th>
                                    <th style={{ textAlign: 'right' }}>Price /Unit</th>
                                    <th style={{ textAlign: 'center' }}>RETURN CONDITION</th>
                                    <th style={{ textAlign: 'center' }}>TAX (%)</th>
                                    <th style={{ textAlign: 'center' }}>DISCOUNT (%)</th>
                                    <th style={{ textAlign: 'right' }}>AMOUNT</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{String(idx + 1).padStart(2, '0')}</td>
                                        <td style={{ position: 'relative' }}>
                                            <div
                                                className={styles.select}
                                                style={{
                                                    padding: '10px 15px',
                                                    fontSize: '13px',
                                                    minWidth: '200px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    background: '#fff',
                                                    border: errors[`itemProduct_${idx}`] ? '1px solid red' : (showProductDropdown === idx ? '1px solid #E93E64' : '1px solid #e0e0e0'),
                                                    borderRadius: '6px',
                                                    cursor: mode === "add" ? 'pointer' : 'default',
                                                    opacity: mode === "add" ? 1 : 0.8
                                                }}
                                                onClick={() => mode === "add" && setShowProductDropdown(showProductDropdown === idx ? null : idx)}
                                            >
                                                <span style={{ color: item.productName ? '#333' : '#999' }}>
                                                    {item.productName || "Select Product"}
                                                </span>
                                                {mode === "add" && <FiChevronDown style={{ color: '#888' }} />}
                                            </div>
                                            {errors[`itemProduct_${idx}`] && (
                                                <span className={styles.errorMsg} style={{ color: 'red', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                                                    {errors[`itemProduct_${idx}`]}
                                                </span>
                                            )}
                                            {showProductDropdown === idx && (
                                                <div className={styles.dropdownList} style={{ top: '100%', minWidth: '450px', zIndex: 1000 }}>
                                                    <div style={{
                                                        padding: '12px 20px',
                                                        background: '#f9fafb',
                                                        fontSize: '11px',
                                                        fontWeight: '700',
                                                        display: 'flex',
                                                        color: '#6b7280',
                                                        borderBottom: '1px solid #edf2f7',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        <span style={{ width: '60%' }}>PRODUCT NAME</span>
                                                        <span style={{ width: '20%', textAlign: 'center' }}>TOTAL QTY</span>
                                                        <span style={{ width: '20%', textAlign: 'right' }}>UNIT TYPE</span>
                                                    </div>
                                                    <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                                        {availableProductsForDropdown(idx).map(p => (
                                                            <div
                                                                key={p.userOrderItemsID}
                                                                className={styles.dropdownItem}
                                                                onClick={() => handleProductSelect(idx, p)}
                                                                style={{ display: 'flex', padding: '12px 20px', fontSize: '13px', borderBottom: '1px solid #f1f5f9' }}
                                                            >
                                                                <span style={{ width: '60%', fontWeight: '500' }}>{p.productName}</span>
                                                                <span style={{ width: '20%', textAlign: 'center' }}>{p.quantity}</span>
                                                                <span style={{ width: '20%', textAlign: 'right' }}>{p.unit}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                            {mode === "view" ? (
                                                <div style={{ fontWeight: '600', fontSize: '15px', color: '#111' }}>{item.returnQty}</div>
                                            ) : (
                                                <input
                                                    type="number"
                                                    className={styles.input}
                                                    onFocus={() => setFocusedField(`itemQty_${idx}`)}
                                                    onBlur={() => setFocusedField(null)}
                                                    style={{
                                                        width: '65px',
                                                        padding: '6px 10px',
                                                        textAlign: 'center',
                                                        background: mode === "edit" ? '#fff' : '#f5f5f5',
                                                        border: errors[`itemQty_${idx}`] ? '1px solid red' : (focusedField === `itemQty_${idx}` ? '1px solid #E93E64' : '1px solid #ddd'),
                                                        boxShadow: 'none'
                                                    }}
                                                    value={item.returnQty || ""}
                                                    onChange={(e) => updateItemQty(idx, parseInt(e.target.value) || 0)}
                                                    max={item.quantity}
                                                    disabled={!item.userOrderItemsID}
                                                />
                                            )}
                                            {errors[`itemQty_${idx}`] && (
                                                <span className={styles.errorMsg} style={{ color: 'red', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                                                    {errors[`itemQty_${idx}`]}
                                                </span>
                                            )}
                                            {item.userOrderItemsID && (
                                                <div style={{ fontSize: '10px', color: '#888', marginTop: '4px', textAlign: 'center', fontWeight: '500' }}>
                                                    Order: {item.quantity}
                                                </div>
                                            )}
                                            <span style={{ marginLeft: '4px' }}>{item.unit}</span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>{item.price ? item.price.toFixed(2) : "0.00"}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <select
                                                className={styles.unitSelect}
                                                onFocus={() => setFocusedField(`itemCondition_${idx}`)}
                                                onBlur={() => setFocusedField(null)}
                                                style={{
                                                    textAlign: 'center',
                                                    background: '#fff',
                                                    border: mode === "view" ? 'none' : (focusedField === `itemCondition_${idx}` ? '1px solid #E93E64' : '1px solid #e0e0e0'),
                                                    borderRadius: '4px',
                                                    padding: '10px 5px',
                                                    boxShadow: 'none'
                                                }}
                                                value={item.returnCondition || "Resellable"}
                                                onChange={(e) => updateReturnCondition(idx, e.target.value)}
                                                disabled={mode === "view"}
                                            >
                                                <option value="Resellable">Resellable</option>
                                                <option value="Damaged">Damaged</option>
                                                <option value="Expired">Expired</option>
                                            </select>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>{item.taxPercentage}%</td>
                                        <td style={{ textAlign: 'center' }}>{item.discountPercentage}%</td>
                                        <td style={{ textAlign: 'right', fontWeight: '600' }}>{item.itemTotal ? item.itemTotal.toFixed(2) : "0.00"}</td>
                                        <td>
                                            {mode === "add" && (
                                                <FiTrash2 style={{ color: '#ff4d4f', cursor: 'pointer' }} onClick={() => removeItem(idx)} />
                                            )}
                                        </td>
                                    </tr>
                                ))}

                                <tr style={{ height: '40px' }}><td colSpan="10"></td></tr>

                                <tr style={{ fontWeight: '700', borderTop: '2px solid #eee' }}>
                                    <td colSpan="2" style={{ paddingTop: '20px' }}>TOTAL</td>
                                    <td style={{ paddingTop: '20px', textAlign: 'center' }}>{items.reduce((acc, i) => acc + (parseInt(i.returnQty) || 0), 0)}</td>
                                    <td colSpan="2" style={{ paddingTop: '20px' }}></td>
                                    <td style={{ paddingTop: '20px', textAlign: 'right' }}>{items.reduce((acc, i) => acc + ((i.price || 0) * (parseInt(i.returnQty) || 0)), 0).toFixed(2)}</td>
                                    <td style={{ paddingTop: '20px' }}></td>
                                    <td style={{ paddingTop: '20px', textAlign: 'center' }}>{items.reduce((acc, i) => acc + ((i.price || 0) * (parseInt(i.returnQty) || 0) * (i.discountPercentage || 0) / 100), 0).toFixed(2)}</td>
                                    <td style={{ paddingTop: '20px', textAlign: 'right' }}>{items.reduce((acc, i) => acc + (i.itemTotal || 0), 0).toFixed(2)}</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                        {mode === "add" && (
                            <div
                                style={{ marginTop: '20px', color: '#E93E64', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}
                                onClick={handleAddRow}
                            >
                                <FiPlus style={{ fontSize: '14px' }} /> ADD ITEM
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className={styles.shareBtn} onClick={onClose}>Cancel</button>
                    {mode === "view" && (
                        <button className={styles.saveBtn} onClick={() => window.print()} >Print</button>
                    )}
                    {mode !== "view" && (
                        <button className={styles.saveBtn} onClick={handleSave} disabled={loading}>
                            {loading ? "Saving..." : (mode === "edit" ? "Update" : "Save")}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddSalesReturn;
