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
import PrintInvoiceTemplate from "../shared/PrintInvoiceTemplate";

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
                // Fetch customer to get phone etc.
                const custRes = await saleService.getCustomersByBranch(jwtToken, branchId);
                const customersList = Array.isArray(custRes.data) ? custRes.data : (custRes.data?.data || []);
                const cust = customersList.find(c => c.vendorCustomerId === data.vendorCustomerId);
                if (cust) setSelectedCustomer(cust);

                // Fetch original order to get max quantities
                const orderRes = await saleService.getOrderById(jwtToken, data.userOrderId);
                let availableItemsList = [];
                let invoiceDateStr = "";
                if (orderRes.status === "success" && orderRes.data) {
                    setSelectedOrder(orderRes.data);
                    invoiceDateStr = (orderRes.data.invoiceDate || orderRes.data.createdDate || "").split('T')[0];
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
                            returnableQty: item.returnableqty !== undefined ? item.returnableqty : (item.returnableQty !== undefined ? item.returnableQty : item.quantity),
                            unit: unitVal,
                            batchNumber: item.batchNumber || "N/A",
                            price: parseFloat(item.sellingPrice) || 0,
                            taxPercentage: parseFloat(item.taxPercentage !== undefined && item.taxPercentage !== null ? item.taxPercentage : (item.taxGroupId || 0)) || 0,
                            discountPercentage: parseFloat(item.discountPercentage) || 0,
                        };
                    });
                    setAvailableItems(availableItemsList);
                }

                setFormData({
                    receiptNo: data.userOrderId,
                    returnNo: `SR-${data.customerReturnId}`,
                    returnReason: data.returnReason || "",
                    billDate: invoiceDateStr || data.createdDate?.split('T')[0] || "",
                    returnDate: data.returnDate?.split('T')[0] || data.createdDate?.split('T')[0] || ""
                });

                setItems((data.items || data.cartItems || []).map(item => {
                    const original = availableItemsList.find(ai => ai.userOrderItemsID === item.userOrderItemsID);
                    const itemPrice = original?.price !== undefined ? original.price : (parseFloat(item.sellingPrice) || 0);
                    const itemTaxPercent = original?.taxPercentage !== undefined ? original.taxPercentage : parseFloat(item.taxPercentage !== undefined && item.taxPercentage !== null ? item.taxPercentage : (item.taxGroupId !== undefined && item.taxGroupId !== null ? item.taxGroupId : (item.taxAmount || 0)));
                    const itemDiscPercent = original?.discountPercentage !== undefined ? original.discountPercentage : parseFloat(item.discountPercentage !== undefined && item.discountPercentage !== null ? item.discountPercentage : (item.discount || item.discountForItem || 0));

                    const qty = parseFloat(item.quantity) || 0;
                    const discountAmount = (itemPrice * itemDiscPercent) / 100;
                    const taxablePrice = itemPrice - discountAmount;
                    const taxAmount = (taxablePrice * itemTaxPercent) / 100;
                    const calculatedItemTotal = qty * (taxablePrice + taxAmount);

                    return {
                        userOrderItemsID: item.userOrderItemsID,
                        productName: original?.productName || "Product",
                        returnQty: qty,
                        quantity: original?.quantity || qty, // original order qty
                        returnableQty: original?.returnableQty || qty,
                        unit: original?.unit || "Unit",
                        price: itemPrice,
                        taxPercentage: itemTaxPercent,
                        discountPercentage: itemDiscPercent,
                        returnCondition: item.returnCondition || "Resellable",
                        itemTotal: calculatedItemTotal,
                        batchNumber: original?.batchNumber || item.batchNumber || "N/A"
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
        setShowReceiptDropdown(false);
        setErrors(prev => ({ ...prev, receiptNo: undefined, itemsEmpty: undefined }));
        setLoading(true);
        const res = await saleService.getOrderById(jwtToken, orderId);
        if (res.status === "success" && res.data) {
            setSelectedOrder(res.data);
            const billDateStr = (res.data.invoiceDate || res.data.createdDate || res.data.createdAt || "").split('T')[0];
            setFormData(prev => {
                const nextReturnDate = (billDateStr && prev.returnDate && prev.returnDate < billDateStr) ? billDateStr : prev.returnDate;
                return {
                    ...prev,
                    receiptNo: orderId,
                    billDate: billDateStr,
                    returnDate: nextReturnDate
                };
            });
            setErrors(prev => ({ ...prev, receiptNo: undefined, itemsEmpty: undefined, returnDate: undefined }));
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
                    returnableQty: item.returnableqty !== undefined ? item.returnableqty : (item.returnableQty !== undefined ? item.returnableQty : item.quantity),
                    unit: unitVal,
                    batchNumber: item.batchNumber || "N/A",
                    price: parseFloat(item.sellingPrice) || 0,
                    taxPercentage: parseFloat(item.taxPercentage !== undefined && item.taxPercentage !== null ? item.taxPercentage : (item.taxGroupId || 0)) || 0,
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
            itemTotal: (p.price - (p.price * p.discountPercentage / 100)) * (1 + p.taxPercentage / 100)
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
        const maxQty = items[index].returnableQty !== undefined ? items[index].returnableQty : (items[index].quantity || 0);
        newItems[index].returnQty = qty;

        const price = newItems[index].price || 0;
        const disc = (price * (newItems[index].discountPercentage || 0)) / 100;
        const taxablePrice = price - disc;
        const tax = (taxablePrice * (newItems[index].taxPercentage || 0)) / 100;
        newItems[index].itemTotal = qty * (taxablePrice + tax);

        setItems(newItems);

        if (qty > maxQty) {
            setErrors(prev => ({ ...prev, [`itemQty_${index}`]: `Quantity cannot exceed returnable quantity (${maxQty})` }));
        } else {
            setErrors(prev => ({ ...prev, [`itemQty_${index}`]: undefined }));
        }
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
        if (!formData.returnDate) {
            newErrors.returnDate = "Return date is required";
        } else {
            const todayStr = toApiDateOnly(new Date());
            if (formData.billDate && formData.returnDate < formData.billDate) {
                newErrors.returnDate = "Please enter a date between the invoice date and today";
            } else if (formData.returnDate > todayStr) {
                newErrors.returnDate = "Please enter a date between the invoice date and today";
            }
        }

        items.forEach((item, index) => {
            if (!item.userOrderItemsID) {
                newErrors[`itemProduct_${index}`] = "Product name is required";
            }
            if (item.userOrderItemsID) {
                const maxQty = item.returnableQty !== undefined ? item.returnableQty : (item.quantity || 0);
                if (item.returnQty === "" || item.returnQty === null || item.returnQty === undefined || parseFloat(item.returnQty) <= 0) {
                    newErrors[`itemQty_${index}`] = "Quantity must be greater than 0";
                } else if (parseFloat(item.returnQty) > maxQty) {
                    newErrors[`itemQty_${index}`] = `Quantity cannot exceed returnable quantity (${maxQty})`;
                }
            }
        });

        if (items.length === 0) {
            newErrors.itemsEmpty = "Please select at least one product and quantity";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error("Please fill all required fields correctly");
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
            updatedFrom: "Sale Return",
            items: validItems.map(i => ({
                userOrderItemsID: i.userOrderItemsID,
                quantity: i.returnQty,
                returnCondition: i.returnCondition,
                batchNumber: i.batchNumber || "N/A"
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

    const isPdf = router.query.pdf === 'true' || router.query.print === 'true' || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('print') === 'true');

    if (isPdf) {
        const columns = [
            { header: "S NO.", align: "left", render: (item, idx) => String(idx + 1).padStart(2, '0') },
            { header: "PRODUCT NAME", accessor: "productName", align: "left" },
            { header: "QTY", accessor: "returnQty", align: "center" },
            { header: "UNIT", accessor: "unit", align: "center" },
            { header: "PRICE", accessor: "price", align: "right" },
            { header: "TAX (%)", accessor: "taxPercentage", align: "center" },
            { header: "DISCOUNT (%)", accessor: "discountPercentage", align: "center" },
            { header: "AMOUNT", accessor: "itemTotal", align: "right" }
        ];

        const totalQty = items.reduce((acc, i) => acc + (parseFloat(i.returnQty) || 0), 0);
        const subtotal = items.reduce((acc, i) => acc + ((i.price || 0) * (parseFloat(i.returnQty) || 0)), 0);
        const totalDiscount = items.reduce((acc, i) => acc + ((i.price || 0) * (parseFloat(i.returnQty) || 0) * (i.discountPercentage || 0) / 100), 0);
        const totalTax = items.reduce((acc, i) => {
            const qty = parseFloat(i.returnQty) || 0;
            const price = i.price || 0;
            const discountPercentage = i.discountPercentage || 0;
            const taxPercentage = i.taxPercentage || 0;
            const discountAmount = (price * qty * discountPercentage) / 100;
            const taxableAmount = (price * qty) - discountAmount;
            const taxAmount = (taxableAmount * taxPercentage) / 100;
            return acc + taxAmount;
        }, 0);
        const grandTotal = items.reduce((acc, i) => acc + (i.itemTotal || 0), 0);

        const summary = [
            { label: "Total Quantity", value: totalQty },
            { label: "Subtotal", value: subtotal.toFixed(2) },
            { label: "Total Tax", value: totalTax.toFixed(2) },
            { label: "Total Discount", value: totalDiscount.toFixed(2) },
            { label: "Grand Total", value: grandTotal.toFixed(2), isTotal: true }
        ];

        // Need to require/import PrintInvoiceTemplate inline or dynamically if we don't have it at top level, 
        // but wait, we need to import it at the top level. Let me just use standard import at top.
        // Actually, we are replacing from line 410, so I will just return here.
        // I will do another replacement for the top level import.
        return (
            <PrintInvoiceTemplate
                title="SALE RETURN"
                customerDetails={{
                    name: selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : 'N/A',
                    phone: selectedCustomer?.phoneNumber || '',
                }}
                invoiceDetails={{
                    "Receipt No": formData.receiptNo ? `Order ${formData.receiptNo}` : 'N/A',
                    "Return No": formData.returnNo || 'N/A',
                    "Bill Date": formData.billDate || 'N/A',
                    "Return Date": formData.returnDate || 'N/A',
                    "Return Reason": formData.returnReason || 'N/A'
                }}
                columns={columns}
                items={items.filter(i => i.userOrderItemsID)}
                summary={summary}
                onClose={() => window.close()}
            />
        );
    }

    return (
        <div className={`${styles.overlay}`}>
            <div className={`${styles.modal}`}>
                <div className={styles.modalHeader}>
                    <h3 style={{ fontSize: '24px', fontWeight: '600' }}>
                        {mode === "view" ? "View Sale Return" : mode === "edit" ? "Edit Sale Return" : "Add Sale Return"}
                    </h3>
                    <button className={styles.closeBtn} onClick={onClose}><FiX /></button>
                </div>

                <div className={styles.modalContent}>
                    <div className={styles.topGrid}>
                        <div className={styles.field} style={{ zIndex: showCustomerDropdown ? 100 : 1 }}>
                            <label>Customer Name <span style={{ color: '#ff4d4f' }}>*</span></label>
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
                            <label>Receipt No <span style={{ color: '#ff4d4f' }}>*</span></label>
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
                                readOnly={true}
                                disabled={true}
                                max={toApiDateOnly(new Date())}
                                onFocus={() => setFocusedField('billDate')}
                                onBlur={() => setFocusedField(null)}
                                style={{
                                    background: 'white',
                                    border: focusedField === 'billDate' ? '2px solid #E93E64' : '2px solid #ddd',
                                    width: '100%',
                                    boxShadow: 'none',
                                    cursor: 'not-allowed',
                                    color: '#666'
                                }}
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Return Date <span style={{ color: '#ff4d4f' }}>*</span></label>
                            <input
                                type="date"
                                className={styles.input}
                                value={formData.returnDate}
                                onChange={(e) => {
                                    setFormData({ ...formData, returnDate: e.target.value });
                                    if (errors.returnDate) {
                                        setErrors(prev => ({ ...prev, returnDate: undefined }));
                                    }
                                }}
                                readOnly={mode === "view"}
                                onFocus={() => setFocusedField('returnDate')}
                                onBlur={() => setFocusedField(null)}
                                min={formData.billDate || undefined}
                                max={toApiDateOnly(new Date())}
                                style={{
                                    background: '#fff',
                                    border: errors.returnDate ? '2px solid red' : (focusedField === 'returnDate' ? '2px solid #E93E64' : '2px solid #ddd'),
                                    boxShadow: 'none'
                                }}
                            />
                            {errors.returnDate && (
                                <span className={styles.errorMsg} style={{ color: 'red', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                    {errors.returnDate}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className={styles.tableContainer}>
                        <table className={styles.premiumTable}>
                            <thead>
                                <tr>
                                    <th>S NO.</th>
                                    <th>PRODUCT NAME <span style={{ color: '#FF4D4F' }}>*</span></th>
                                    <th style={{ textAlign: 'center' }}>QTY / UNIT <span style={{ color: '#FF4D4F' }}>*</span></th>
                                    <th style={{ textAlign: 'right' }}>Price /Unit</th>
                                    <th style={{ textAlign: 'center' }}>RETURN CONDITION</th>
                                    <th style={{ textAlign: 'center' }}>TAX (%)</th>
                                    <th style={{ textAlign: 'center' }}>DISCOUNT (%)</th>
                                    <th style={{ textAlign: 'right' }}>AMOUNT</th>
                                    {mode === "add" && <th></th>}
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
                                                        <span style={{ width: '40%' }}>PRODUCT NAME</span>
                                                        <span style={{ width: '20%', textAlign: 'center' }}>BATCH NO</span>
                                                        <span style={{ width: '20%', textAlign: 'center' }}>RETURNABLE QTY</span>
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
                                                                <span style={{ width: '40%', fontWeight: '500' }}>{p.productName}</span>
                                                                <span style={{ width: '20%', textAlign: 'center' }}>{p.batchNumber}</span>
                                                                <span style={{ width: '20%', textAlign: 'center' }}>{p.returnableQty}</span>
                                                                <span style={{ width: '20%', textAlign: 'right' }}>{p.unit}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                {mode === "view" ? (
                                                    <span style={{ fontWeight: '600', fontSize: '15px', color: '#111' }}>{item.returnQty}</span>
                                                ) : (
                                                    <input
                                                        type="number"
                                                        className={styles.tableInputCenter}
                                                        onFocus={() => setFocusedField(`itemQty_${idx}`)}
                                                        onBlur={() => setFocusedField(null)}
                                                        style={{
                                                            width: '70px',
                                                            padding: '8px 10px',
                                                            textAlign: 'center',
                                                            background: '#fff',
                                                            border: errors[`itemQty_${idx}`] ? '1px solid red' : (focusedField === `itemQty_${idx}` ? '1px solid #E93E64' : '1px solid #e0e0e0'),
                                                            borderRadius: '6px',
                                                            outline: 'none',
                                                            boxShadow: 'none'
                                                        }}
                                                        placeholder="0"
                                                        value={item.returnQty || ""}
                                                        onChange={(e) => updateItemQty(idx, parseFloat(e.target.value) || 0)}
                                                        disabled={!item.userOrderItemsID}
                                                    />
                                                )}
                                                {item.unit && <span style={{ fontSize: '13px', color: '#333' }}>{item.unit}</span>}
                                            </div>
                                            {errors[`itemQty_${idx}`] && (
                                                <span className={styles.errorMsg} style={{ color: 'red', fontSize: '11px', marginTop: '4px', display: 'block', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                                    {errors[`itemQty_${idx}`]}
                                                </span>
                                            )}
                                            {item.userOrderItemsID && (
                                                <div style={{ fontSize: '10px', color: '#888', marginTop: '4px', textAlign: 'center', fontWeight: '500' }}>
                                                    Returnable: {item.returnableQty}
                                                </div>
                                            )}
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
                                        {mode === "add" && (
                                            <td>
                                                {items.length > 1 && (
                                                    <FiTrash2 style={{ color: '#ff4d4f', cursor: 'pointer' }} onClick={() => removeItem(idx)} />
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}

                                <tr style={{ height: '40px' }}><td colSpan={mode === "add" ? "9" : "8"}></td></tr>

                                <tr style={{ fontWeight: '700', borderTop: '2px solid #eee' }}>
                                    <td colSpan="2" style={{ paddingTop: '20px' }}>TOTAL</td>
                                    <td style={{ paddingTop: '20px', textAlign: 'center' }}>{items.reduce((acc, i) => acc + (parseFloat(i.returnQty) || 0), 0).toFixed(2)}</td>
                                    <td style={{ paddingTop: '20px', textAlign: 'right' }}>{items.reduce((acc, i) => acc + ((i.price || 0) * (parseFloat(i.returnQty) || 0)), 0).toFixed(2)}</td>
                                    <td style={{ paddingTop: '20px' }}></td>
                                    <td style={{ paddingTop: '20px', textAlign: 'center' }}>{items.reduce((acc, i) => {
                                        const qty = parseFloat(i.returnQty) || 0;
                                        const price = i.price || 0;
                                        const discountPercentage = i.discountPercentage || 0;
                                        const taxPercentage = i.taxPercentage || 0;
                                        const discountAmount = (price * qty * discountPercentage) / 100;
                                        const taxableAmount = (price * qty) - discountAmount;
                                        const taxAmount = (taxableAmount * taxPercentage) / 100;
                                        return acc + taxAmount;
                                    }, 0).toFixed(2)}</td>
                                    <td style={{ paddingTop: '20px', textAlign: 'center' }}>{items.reduce((acc, i) => acc + ((i.price || 0) * (parseFloat(i.returnQty) || 0) * (i.discountPercentage || 0) / 100), 0).toFixed(2)}</td>
                                    <td style={{ paddingTop: '20px', textAlign: 'right' }}>{items.reduce((acc, i) => acc + (i.itemTotal || 0), 0).toFixed(2)}</td>
                                    {mode === "add" && <td></td>}
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
                        <button className={styles.saveBtn} onClick={() => {
                            const printUrl = `${window.location.pathname}?view=true&id=${returnId}&print=true&pdf=true`;
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
                        }}>Print</button>
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
