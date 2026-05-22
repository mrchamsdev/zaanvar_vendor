import { toApiDateOnly } from "@/utilities/date-time-utils";

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

    const [payments, setPayments] = useState([{ method: "Cash", amount: 0 }]);
    
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [showProductDropdown, setShowProductDropdown] = useState(null); // index

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
        setPayments([{ method: "Cash", amount: 0 }]);
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
                    invoiceNumber: data.userOrderId || data.invoiceNumber || "",
                    invoiceDate: data.createdDate ? data.createdDate.split('T')[0] : "",
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
                        productName: it.productName || variant.SKU || "Product",
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
                    setPayments(data.payments);
                } else if (data.paidAmount) {
                    setPayments([{ method: "Cash", amount: parseFloat(data.paidAmount) }]);
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
            // Just updating the name, phone update happens on selection from dropdown usually
            // But if there's an exact match, we can fill it
            const exact = customers.find(c => `${c.firstName} ${c.lastName}`.toLowerCase() === val.toLowerCase());
            if (exact) setFormData(prev => ({ ...prev, phone: exact.phoneNumber, vendorCustomerId: exact.vendorCustomerId }));
        } else {
            setFormData({ ...formData, phone: val });
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
        const tax = parseFloat(prod.taxGroupId === 2 ? 18 : prod.taxGroupId === 3 ? 12 : 0);
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
            error: qty > it.availableQty ? `Cannot exceed quantity (${it.availableQty})` : null
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
        setPayments([...payments, { method: "Cash", amount: 0 }]);
    };

    const handlePaymentChange = (index, field, val) => {
        const newPayments = [...payments];
        newPayments[index][field] = val;
        setPayments(newPayments);
    };

    const totalBillAmount = items.reduce((acc, it) => acc + (it.amount || 0), 0);
    const totalPaidAmount = payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
    const balanceAmount = totalBillAmount - totalPaidAmount;

    const handleSave = async () => {
        if (!formData.partyName || !formData.phone) {
            toast.error("Please provide customer name and phone");
            return;
        }

        const validItems = items.filter(it => it.productId);
        if (validItems.length === 0) {
            toast.error("Please add at least one product");
            return;
        }

        for (const it of validItems) {
            if (it.qty > it.availableQty) {
                toast.error(`Quantity for ${it.productName} cannot exceed ${it.availableQty}`);
                return;
            }
        }

        const payload = {
            branchId,
            vendorCustomerId: formData.vendorCustomerId,
            discountForCustomer: parseFloat(formData.discountForCustomer || 0),
            amountPaid: totalPaidAmount,
            paymentMethod: payments[0]?.method || "Cash",
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
                        </div>
                        <div className={styles.field}>
                            <label>Invoice No</label>
                            <input type="text" className={styles.input} value={formData.invoiceNumber} readOnly />
                        </div>
                        <div className={styles.field}>
                            <label>Invoice Date</label>
                            <input type="date" className={styles.input} value={formData.invoiceDate} onChange={(e) => setFormData({...formData, invoiceDate: e.target.value})} disabled={isViewOnly} />
                        </div>
                    </div>

                    <div className={styles.tableContainer}>
                        <table className={styles.premiumTable}>
                            <thead>
                                <tr>
                                    <th rowSpan="2">S NO.</th>
                                    <th rowSpan="2">ENTER ITEM</th>
                                    <th rowSpan="2">QTY</th>
                                    <th rowSpan="2">UNIT</th>
                                    <th colSpan="1">Price /Unit</th>
                                    <th colSpan="2" style={{textAlign: 'center'}}>TAX</th>
                                    <th rowSpan="2" style={{textAlign: 'right'}}>AMOUNT</th>
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
                                        <td style={{position: 'relative', width: '35%'}}>
                                            <div className={styles.searchableDropdown}>
                                                <input 
                                                    type="text" 
                                                    className={styles.tableInput} 
                                                    placeholder="Select product"
                                                    value={it.productName}
                                                    onChange={(e) => {
                                                        const newItems = [...items];
                                                        newItems[idx].productName = e.target.value;
                                                        setItems(newItems);
                                                        setShowProductDropdown(idx);
                                                    }}
                                                    onFocus={() => setShowProductDropdown(idx)}
                                                    disabled={isViewOnly}
                                                />
                                                {showProductDropdown === idx && !isViewOnly && (
                                                    <div className={styles.dropdownList}>
                                                        {products
                                                            .filter(p => {
                                                                const search = (it.productName || "").toLowerCase();
                                                                return !search || (p.productName || "").toLowerCase().includes(search);
                                                            })
                                                            .map((p) => (
                                                                <div key={p.productId} className={styles.dropdownItem} onClick={() => handleProductSelect(idx, p)}>
                                                                    <span style={{fontWeight: '600'}}>{p.productName}</span>
                                                                </div>
                                                            ))
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{verticalAlign: 'top', paddingTop: '12px'}}>
                                            <input 
                                                type="number" 
                                                className={styles.tableInputCenter} 
                                                style={it.error ? { border: '1px solid #ff4d4f', background: '#fffcfc' } : {}}
                                                value={it.qty === 0 ? "" : it.qty} 
                                                onChange={(e) => handleQtyChange(idx, e.target.value)} 
                                                disabled={isViewOnly} 
                                            />
                                            {it.error && (
                                                <div style={{color: '#ff4d4f', fontSize: '10px', marginTop: '4px', textAlign: 'center', fontWeight: '500', whiteSpace: 'nowrap'}}>
                                                    {it.error}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {it.availableVariants && it.availableVariants.length > 0 ? (
                                                <select 
                                                    className={styles.unitSelect} 
                                                    value={it.variantId} 
                                                    onChange={(e) => handleVariantChange(idx, e.target.value)}
                                                    disabled={isViewOnly}
                                                >
                                                    {it.availableVariants.map(v => (
                                                        <option key={v.variantId} value={v.variantId}>
                                                            {formatVariantSize(v.variantType?.size) || v.variantType?.type || "Unit"}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className={styles.unitSelector}>
                                                    <span>{it.unit || 'Unit Type'}</span>
                                                    <FiChevronDown size={12} />
                                                </div>
                                            )}
                                        </td>
                                        <td style={{fontWeight: '700', textAlign: 'center'}}>{it.price.toLocaleString()}</td>
                                        <td style={{fontWeight: '700', textAlign: 'center'}}>{it.taxPercent}%</td>
                                        <td style={{fontWeight: '700', textAlign: 'center'}}>{it.taxAmount.toLocaleString()}</td>
                                        <td style={{fontWeight: '700', textAlign: 'right'}}>{it.amount.toLocaleString()}</td>
                                        {!isViewOnly && (
                                            <td><FiTrash2 onClick={() => handleRemoveRow(idx)} style={{cursor: 'pointer', color: '#E93E64'}} /></td>
                                        )}
                                    </tr>
                                ))}
                                <tr className={styles.totalRowSummary}>
                                    <td colSpan="2" style={{fontWeight: '700', paddingLeft: '40px'}}>TOTAL</td>
                                    <td style={{fontWeight: '600', textAlign: 'center'}}>{String(items.reduce((acc, it) => acc + (parseFloat(it.qty) || 0), 0)).padStart(3, '0')}</td>
                                    <td></td>
                                    <td style={{fontWeight: '600', textAlign: 'center'}}>{items.reduce((acc, it) => acc + (it.price || 0), 0).toLocaleString()}</td>
                                    <td></td>
                                    <td style={{fontWeight: '600', textAlign: 'center'}}>{items.reduce((acc, it) => acc + (it.taxAmount || 0), 0).toLocaleString()}</td>
                                    <td style={{fontWeight: '700', textAlign: 'right'}}>{totalBillAmount.toLocaleString()}</td>
                                    {!isViewOnly && <td></td>}
                                </tr>
                            </tbody>
                        </table>
                        {!isViewOnly && (
                            <span className={styles.addBtn} onClick={handleAddRow}>+ Add Item</span>
                        )}
                    </div>

                    <div className={styles.paymentSection}>
                        <div className={styles.paymentList}>
                            <label style={{fontWeight: '700'}}>Payment Details</label>
                            {payments.map((p, idx) => (
                                <div key={idx} className={styles.paymentRow}>
                                    <select className={styles.select} value={p.method} onChange={(e) => handlePaymentChange(idx, 'method', e.target.value)} disabled={isViewOnly}>
                                        <option value="Cash">Cash</option>
                                        <option value="Online">Online</option>
                                        <option value="Card">Card</option>
                                        <option value="Cheque">Cheque</option>
                                    </select>
                                    <input type="number" className={styles.input} placeholder="Amount" value={p.amount} onChange={(e) => handlePaymentChange(idx, 'amount', e.target.value)} disabled={isViewOnly} />
                                </div>
                            ))}
                            {!isViewOnly && (
                                <span className={styles.addAnotherPayment} onClick={handleAddPayment}>+ Add another payment</span>
                            )}
                        </div>
                        <div className={styles.spacer}></div>
                        <div className={styles.totalSection}>
                            <div className={styles.totalRow}>
                                <span>Sub Total</span>
                                <span>Rs {totalBillAmount.toLocaleString()}</span>
                            </div>
                            <div className={styles.totalRow}>
                                <span>Total Paid</span>
                                <span style={{color: '#1E8E3E'}}>Rs {totalPaidAmount.toLocaleString()}</span>
                            </div>
                            <div className={`${styles.totalRow} ${styles.main}`}>
                                <span>Balance</span>
                                <span style={{color: balanceAmount > 0 ? '#D93025' : '#1E8E3E'}}>Rs {balanceAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className={styles.shareBtn} onClick={onClose}>Cancel</button>
                    {isViewOnly && (
                        <button className={styles.saveBtn} onClick={() => window.print()} style={{ background: '#4285F4' }}>
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
