import React, { useState, useEffect, useMemo } from "react";
import styles from "../../styles/purchase-bill/add-purchase-return.module.css";
import { FiX, FiCalendar, FiPlus, FiTrash2, FiChevronDown } from "react-icons/fi";
import { purchaseService } from "../../services/purchaseService";
import useStore from "../../components/state/useStore";
import useDashboardData from "../../components/dashboard/useDashboardData";
import { toast } from "sonner";
import { useRouter } from "next/router";

const AddPurchaseReturn = ({ isOpen, onClose, onRefresh, mode = 'add', returnId }) => {
    const router = useRouter();
    const { jwtToken, userInfo } = useStore();
    const { branchId } = useDashboardData({ skipReviews: true });
    const isViewOnly = mode === 'view';

    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [phone, setPhone] = useState("");
    const [receipts, setReceipts] = useState([]);
    const [selectedBillId, setSelectedBillId] = useState("");
    const [billDetails, setBillDetails] = useState(null);
    
    const [returnNo, setReturnNo] = useState("");
    const [billDate, setBillDate] = useState("");
    const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
    const [returnReason, setReturnReason] = useState("");
    const [allReturns, setAllReturns] = useState([]);

    const [items, setItems] = useState([]); // [{ productsBillItemsId, productId, productName, receivedQty, returnQty, costPrice, taxGroupId, amount }]
    const [showProductDropdown, setShowProductDropdown] = useState(null); // index of the row showing dropdown

    useEffect(() => {
        const init = async () => {
            try {
                // Fetch suppliers
                const supRes = await purchaseService.getSuppliers(jwtToken, branchId);
                if (supRes.status === "success") {
                    setSuppliers(supRes.data || []);
                }

                if (mode === 'add') {
                    // Fetch returns to calculate return number for new returns
                    const retRes = await purchaseService.getBranchReturns(jwtToken, branchId);
                    if (retRes.status === "success") {
                        const returnData = retRes.data || [];
                        setAllReturns(returnData);
                        const count = returnData.length;
                        setReturnNo((count + 1).toString());
                    }
                }
            } catch (error) {
                console.error("Error during initialization:", error);
            }
        };
        if (isOpen) {
            init();
            if ((mode === 'view' || mode === 'edit') && returnId) {
                fetchReturnDetails(returnId);
            }
        }
    }, [isOpen, branchId, jwtToken, mode, returnId]);

    const fetchReturnDetails = async (id) => {
        setLoading(true);
        try {
            const res = await purchaseService.getReturnById(jwtToken, id);
            if (res.status === "success") {
                const data = res.data;
                setSelectedBillId(data.productsBillId?.toString() || "");
                setReturnNo(data.returnProductsId);
                setReturnReason(data.returnReason || "");
                
                if (data.productsBill) {
                    setBillDate(data.productsBill.createdDate ? data.productsBill.createdDate.split('T')[0] : "");
                    // Set supplier details from bill
                    const supplierData = {
                        supplierId: data.productsBill.supplierId,
                        supplierName: data.productsBill.vendor?.supplierName || "N/A",
                        phone: data.productsBill.vendor?.phone || ""
                    };
                    setSelectedSupplier(supplierData);
                    setPhone(supplierData.phone);
                    
                    // Ensure the current bill is in the receipts list so it shows in dropdown
                    setReceipts([{ productsBillId: data.productsBillId }]);

                    // Fetch full bill details to populate dropdowns and available products
                    try {
                        const billRes = await purchaseService.getBillById(jwtToken, data.productsBillId);
                        if (billRes.status === "success") {
                            const billData = billRes.data;
                            setBillDetails(billData);

                            // Update supplier info from full bill data
                            if (billData.vendor) {
                                const supplierData = {
                                    supplierId: billData.vendor.supplierId,
                                    supplierName: billData.vendor.supplierName || "N/A",
                                    phone: billData.vendor.phone || ""
                                };
                                setSelectedSupplier(supplierData);
                                setPhone(supplierData.phone);
                            }

                            // Update mapped items with actual receivedQty from bill
                            const mappedItems = (data.items || []).map(it => {
                                const billItem = (billData.billItems || []).find(bi => bi.productsBillItemsId === it.productsBillItemsId);
                                return {
                                    productsBillItemsId: it.productsBillItemsId,
                                    productId: it.productId,
                                    productName: it.productName || "Product",
                                    receivedQty: billItem ? billItem.receivedQuantity : it.qty, 
                                    currentQty: billItem?.stockUpdates?.[0]?.currentQty || it.qty,
                                    returnQty: it.qty,
                                    costPrice: parseFloat(it.costPrice || 0),
                                    tax: billItem ? parseFloat(billItem.taxGroupId || 0) : 0,
                                    taxAmount: parseFloat(it.taxAmount || 0),
                                    amount: parseFloat(it.amount || 0)
                                };
                            });
                            setItems(mappedItems);
                        }
                    } catch (err) {
                        console.error("Error fetching bill details for return:", err);
                        // Fallback to basic mapping if bill fetch fails
                        const mappedItems = (data.items || []).map(it => ({
                            productsBillItemsId: it.productsBillItemsId,
                            productId: it.productId,
                            productName: it.productName || "Product",
                            receivedQty: it.qty, 
                            returnQty: it.qty,
                            costPrice: parseFloat(it.costPrice || 0),
                            tax: 0,
                            taxAmount: parseFloat(it.taxAmount || 0),
                            amount: parseFloat(it.amount || 0)
                        }));
                        setItems(mappedItems);
                    }
                }

                setReturnDate(data.createdDate ? data.createdDate.split('T')[0] : "");
            }
        } catch (error) {
            console.error("Error fetching return details:", error);
            toast.error("Failed to fetch return details");
        } finally {
            setLoading(false);
        }
    };

    const handleSupplierChange = (supplierId) => {
        const id = parseInt(supplierId);
        const supplier = suppliers.find(s => s.supplierId === id);
        if (supplier) {
            setSelectedSupplier(supplier);
            setPhone(supplier.phone || "");
            
            // Filter returns by supplier and extract unique productsBillId
            const supplierReturns = allReturns.filter(r => r.supplierId === id);
            const uniqueBillIds = [...new Set(supplierReturns.map(r => r.productsBillId))];
            const filteredReceipts = uniqueBillIds.map(billId => ({ productsBillId: billId }));
            
            setReceipts(filteredReceipts);
            setSelectedBillId("");
            setBillDetails(null);
            setItems([]);
        } else {
            setSelectedSupplier(null);
            setPhone("");
            setReceipts([]);
            setSelectedBillId("");
            setBillDetails(null);
            setItems([]);
        }
    };

    const handlePhoneChange = (val) => {
        setPhone(val);
        const supplier = suppliers.find(s => s.phone === val);
        if (supplier) {
            setSelectedSupplier(supplier);
            
            // Filter returns by supplier and extract unique productsBillId
            const supplierReturns = allReturns.filter(r => r.supplierId === supplier.supplierId);
            const uniqueBillIds = [...new Set(supplierReturns.map(r => r.productsBillId))];
            const filteredReceipts = uniqueBillIds.map(billId => ({ productsBillId: billId }));
            
            setReceipts(filteredReceipts);
            setSelectedBillId("");
            setBillDetails(null);
            setItems([]);
        }
    };

    const handleBillChange = async (billId) => {
        setSelectedBillId(billId);
        if (!billId) {
            setBillDetails(null);
            setItems([]);
            return;
        }
        
        // We only trigger fetch if it looks like a complete ID (usually numeric)
        // or if it was selected from the datalist.
        setLoading(true);
        try {
            const res = await purchaseService.getBillById(jwtToken, billId);
            if (res.status === "success") {
                const data = res.data;
                
                // Check if bill belongs to this branch
                if (data.branchId !== branchId) {
                    toast.error("This receipt number is not related to this branch");
                    setBillDetails(null);
                    setItems([]);
                    return;
                }

                setBillDetails(data);
                setBillDate(data.createdDate ? data.createdDate.split('T')[0] : "");
                
                // Add an initial empty row if bill has items
                if (data.billItems && data.billItems.length > 0) {
                    setItems([{ 
                        productsBillItemsId: "", 
                        productId: "", 
                        productName: "", 
                        receivedQty: 0, 
                        returnQty: 0, 
                        costPrice: 0, 
                        tax: 0, 
                        taxAmount: 0, 
                        amount: 0 
                    }]);
                } else {
                    setItems([]);
                }

                // Auto-set supplier from bill data
                if (data.vendor) {
                    const vendorId = data.vendor.supplierId;
                    const existingSupplier = suppliers.find(s => s.supplierId === vendorId);
                    
                    if (existingSupplier) {
                        setSelectedSupplier(existingSupplier);
                        setPhone(existingSupplier.phone || "");
                    } else {
                        setSelectedSupplier(data.vendor);
                        setPhone(data.vendor.phone || "");
                    }

                    // Maintain receipts from the returns data source
                    const supplierReturns = allReturns.filter(r => r.supplierId === vendorId);
                    const uniqueBillIds = [...new Set(supplierReturns.map(r => r.productsBillId))];
                    const filteredReceipts = uniqueBillIds.map(billId => ({ productsBillId: billId }));
                    
                    setReceipts(filteredReceipts);
                }
            } else {
                // If the API returns success: false or similar
                toast.error("Receipt number not found or invalid");
                setBillDetails(null);
                setItems([]);
            }
        } catch (error) {
            console.error("Error fetching bill details:", error);
            if (error.response?.status === 404) {
                toast.error("This receipt number is not related to this branch");
            }
            setBillDetails(null);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddRow = () => {
        if (!billDetails) {
            toast.error("Please select a Receipt first");
            return;
        }
        setItems([...items, {
            productsBillItemsId: "",
            productId: "",
            productName: "",
            receivedQty: 0,
            returnQty: 1,
            costPrice: 0,
            tax: 0,
            amount: 0
        }]);
    };

    const handleRemoveRow = (index) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleProductSelect = (index, billItem) => {
        const taxPercent = parseFloat(billItem.taxGroupId || 0);
        const costPrice = parseFloat(billItem.costPrice || 0);
        const qty = 1;
        const taxAmount = (qty * costPrice * taxPercent) / 100;

        const newItems = [...items];
        newItems[index] = {
            ...newItems[index],
            productsBillItemsId: billItem.productsBillItemsId,
            productId: billItem.productId,
            productName: billItem.productDetails?.productName || "Product",
            receivedQty: billItem.receivedQuantity || 0,
            currentQty: billItem.stockUpdates?.[0]?.currentQty || 0,
            returnQty: qty,
            costPrice: costPrice,
            tax: taxPercent,
            taxAmount: taxAmount,
            amount: (qty * costPrice) + taxAmount
        };
        setItems(newItems);
        setShowProductDropdown(null);
    };

    const handleQtyChange = (index, val) => {
        if (val === "") {
            const newItems = [...items];
            newItems[index].returnQty = "";
            newItems[index].amount = 0;
            newItems[index].taxAmount = 0;
            setItems(newItems);
            return;
        }
        const qty = parseInt(val) || 0;
        const item = items[index];
        if (qty > item.receivedQty) {
            toast.warning(`Return quantity cannot exceed received quantity (${item.receivedQty})`);
            return;
        }
        if (qty > (item.currentQty || 0)) {
            toast.warning(`Return quantity cannot exceed current stock (${item.currentQty || 0})`);
            return;
        }
        const taxAmount = (qty * item.costPrice * item.tax) / 100;
        const newItems = [...items];
        newItems[index].returnQty = qty;
        newItems[index].taxAmount = taxAmount;
        newItems[index].amount = (qty * item.costPrice) + taxAmount;
        setItems(newItems);
    };

    const availableProducts = useMemo(() => {
        if (!billDetails || !billDetails.billItems) return [];
        const selectedIds = items.map(it => it.productsBillItemsId).filter(id => id);
        return billDetails.billItems.filter(bi => !selectedIds.includes(bi.productsBillItemsId));
    }, [billDetails, items]);

    const availableProductsForDropdown = (currentIndex) => {
        if (!billDetails || !billDetails.billItems) return [];
        const currentSelectedId = items[currentIndex]?.productsBillItemsId;
        const otherSelectedIds = items
            .map((it, idx) => idx !== currentIndex ? it.productsBillItemsId : null)
            .filter(id => id);
        return billDetails.billItems.filter(bi => !otherSelectedIds.includes(bi.productsBillItemsId));
    };

    const totalQty = items.reduce((acc, it) => acc + (parseInt(it.returnQty) || 0), 0);
    const totalPrice = items.reduce((acc, it) => acc + (parseFloat(it.costPrice) || 0), 0);
    const totalTax = items.reduce((acc, it) => acc + (parseFloat(it.taxAmount) || 0), 0);
    const totalAmount = items.reduce((acc, it) => acc + (parseFloat(it.amount) || 0), 0);

    const handleSave = async () => {
        if (!selectedBillId) {
            toast.error("Please select a Receipt No");
            return;
        }
        if (items.length === 0) {
            toast.error("Please add at least one product");
            return;
        }

        // Validate items
        for (const it of items) {
            if (!it.productsBillItemsId) {
                toast.error("Please select a product for all rows");
                return;
            }
            if (!it.returnQty || it.returnQty <= 0) {
                toast.error(`Please enter a valid Return Qty for ${it.productName}`);
                return;
            }
            if (it.returnQty > it.receivedQty) {
                toast.error(`Return Qty for ${it.productName} cannot exceed Received Qty (${it.receivedQty})`);
                return;
            }
        }

        const payload = {
            branchId: branchId,
            productsBillId: parseInt(selectedBillId),
            returnReason: returnReason,
            createdBy: userInfo?.userId || 1,
            modifiedBy: userInfo?.userId || 1,
            items: items.map(it => ({
                productsBillItemsId: it.productsBillItemsId,
                qty: it.returnQty
            }))
        };

        setLoading(true);
        try {
            let res;
            if (mode === 'edit') {
                res = await purchaseService.updateReturn(jwtToken, returnId, payload);
            } else {
                res = await purchaseService.createReturn(jwtToken, payload);
            }

            if (res && (res.status === "success" || res.status === 200)) {
                toast.success(mode === 'edit' ? "Purchase return updated successfully" : "Purchase return recorded successfully");
                
                // Allow the toast to be visible before navigating
                setTimeout(() => {
                    window.location.assign(`/purchase-bill/purchase-return?branchId=${branchId}`);
                }, 1000);
            } else {
                if (res.message === "RETURNS_NOT_APPLICABLE") {
                    toast.error("This product is not applicable for return");
                } else {
                    toast.error(res.message || (mode === 'edit' ? "Failed to update return" : "Failed to record purchase return"));
                }
            }
        } catch (error) {
            console.error("Error saving return:", error);
            toast.error("An error occurred while saving");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h3 style={{fontSize: '24px', fontWeight: '600'}}>
                        {mode === 'view' ? "View Purchase Return" : (mode === 'edit' ? "Edit Purchase Return" : "Add Purchase Return")}
                    </h3>
                    <button className={styles.closeBtn} onClick={onClose}><FiX /></button>
                </div>

                <div className={styles.modalContent}>
                    <div className={styles.topGrid}>
                        <div className={styles.field}>
                            <label>Supplier Name</label>
                            <select 
                                className={styles.select}
                                value={selectedSupplier?.supplierId || ""}
                                onChange={(e) => handleSupplierChange(e.target.value)}
                                disabled={isViewOnly}
                            >
                                <option value="">Select Name</option>
                                {suppliers.map(s => (
                                    <option key={s.supplierId} value={s.supplierId}>{s.supplierName}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label>Supplier Phone Number</label>
                            <input 
                                type="text"
                                className={styles.input}
                                placeholder="Phone number"
                                value={phone}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                disabled={isViewOnly}
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Receipt No</label>
                            <select 
                                className={styles.select}
                                value={selectedBillId}
                                onChange={(e) => handleBillChange(e.target.value)}
                                disabled={isViewOnly}
                            >
                                <option value="">Select Receipt no</option>
                                {receipts && receipts.map(r => (
                                    <option key={r.productsBillId} value={r.productsBillId}>{r.productsBillId}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label>Return No</label>
                            <input 
                                type="text" 
                                className={styles.input}
                                placeholder="Return no"
                                value={returnNo}
                                readOnly
                                disabled={isViewOnly}
                            />
                        </div>

                        <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                            <label>Return Reason</label>
                            <input 
                                type="text" 
                                className={styles.input}
                                placeholder="Enter here"
                                value={returnReason}
                                onChange={(e) => setReturnReason(e.target.value)}
                                disabled={isViewOnly}
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Bill Date</label>
                            <div className={styles.dateWrapper}>
                                <input 
                                    type="text" 
                                    className={`${styles.input}`}
                                    value={billDate ? new Date(billDate).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}) : "Select Date here"}
                                    readOnly
                                    disabled={isViewOnly}
                                />
                                <FiCalendar className={styles.calendarIcon} />
                            </div>
                        </div>
                        <div className={styles.field}>
                            <label>Return Date</label>
                            <div className={styles.dateWrapper}>
                                <input 
                                    type="date" 
                                    className={styles.input}
                                    style={{ color: returnDate ? '#333' : '#999' }}
                                    value={returnDate}
                                    onChange={(e) => setReturnDate(e.target.value)}
                                    disabled={isViewOnly}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.snoCol}>S NO.</th>
                                    <th className={styles.productCol}>ENTER ITEM</th>
                                    <th className={styles.qtyCol}>RETURN QTY</th>
                                    <th className={styles.priceCol}>
                                        <div className={styles.priceHeader}>
                                            <span>Price /Unit</span>
                                            <div style={{display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#999', fontWeight: '400'}}>
                                                WITHOUT TAX <FiChevronDown />
                                            </div>
                                        </div>
                                    </th>
                                    <th className={styles.taxCol}>
                                        <div className={styles.taxHeader}>
                                            <span>TAX</span>
                                            <div className={styles.taxSubHeaders}>
                                                <span style={{flex: 1, textAlign: 'center'}}>%</span>
                                                <span style={{flex: 1, textAlign: 'center'}}>AMOUNT</span>
                                            </div>
                                        </div>
                                    </th>
                                    <th className={styles.amountCol}>AMOUNT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className={styles.snoCol}>{(idx + 1).toString().padStart(2, '0')}</td>
                                        <td className={styles.productCol} style={{position: 'relative'}}>
                                            <div 
                                                className={styles.productSelectBox}
                                                onClick={() => !isViewOnly && setShowProductDropdown(showProductDropdown === idx ? null : idx)}
                                                style={{cursor: isViewOnly ? 'default' : 'pointer'}}
                                            >
                                                <span>{item.productName || "Select Item"}</span>
                                                {!isViewOnly && <FiChevronDown />}
                                            </div>
                                            {showProductDropdown === idx && (
                                                <div className={styles.dropdownOverlay}>
                                                    <table className={styles.dropdownTable}>
                                                        <thead>
                                                            <tr>
                                                                <th>PRODUCT NAME</th>
                                                                <th>TOTAL QTY</th>
                                                                <th>ORDER QTY</th>
                                                                <th>RECIVED QTY</th>
                                                                <th>DAMAGED QTY</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {availableProductsForDropdown(idx).map((bi, bIdx) => (
                                                                <tr 
                                                                    key={bIdx} 
                                                                    onClick={() => handleProductSelect(idx, bi)}
                                                                >
                                                                    <td style={{fontWeight: '600'}}>{bi.productDetails?.productName}</td>
                                                                    <td>{bi.stockUpdates?.[0]?.currentQty || 0}</td>
                                                                    <td>{bi.qty}</td>
                                                                    <td>{bi.receivedQuantity}</td>
                                                                    <td>{bi.damagedQuantity}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </td>
                                        <td className={styles.qtyCol}>
                                            <input 
                                                type="number" 
                                                className={styles.input} 
                                                style={{background: '#f9f9f9', textAlign: 'center', border: '1px solid #eee'}}
                                                value={item.returnQty === 0 ? "" : item.returnQty}
                                                onChange={(e) => handleQtyChange(idx, e.target.value)}
                                                onFocus={(e) => e.target.select()}
                                                disabled={isViewOnly}
                                            />
                                        </td>
                                        <td className={styles.priceCol}>
                                            <div style={{textAlign: 'center'}}>{item.costPrice.toLocaleString()}</div>
                                        </td>
                                        <td className={styles.taxCol}>
                                            <div style={{display: 'flex', width: '100%'}}>
                                                <span style={{flex: 1, textAlign: 'center'}}>{item.tax}%</span>
                                                <span style={{flex: 1, textAlign: 'center'}}>{(item.taxAmount || 0).toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className={styles.amountCol}>
                                            <div style={{fontWeight: '600'}}>{item.amount.toLocaleString()}</div>
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{height: '100px', border: 'none'}}></td>
                                    </tr>
                                )}
                                {availableProducts.length > 0 && !isViewOnly && (
                                    <tr>
                                        <td colSpan="6" style={{border: 'none', padding: '16px 0'}}>
                                            <span 
                                                className={styles.addBtn}
                                                onClick={handleAddRow}
                                            >
                                                +ADD ITEM
                                            </span>
                                        </td>
                                    </tr>
                                )}
                                <tr className={styles.totalRow}>
                                    <td colSpan="2" className={styles.totalLabel}>TOTAL</td>
                                    <td className={styles.qtyCol}>{totalQty.toString().padStart(3, '0')}</td>
                                    <td className={styles.priceCol}>{totalPrice.toLocaleString()}</td>
                                    <td className={styles.taxCol}>
                                        <div style={{display: 'flex', width: '100%'}}>
                                            <span style={{flex: 1, textAlign: 'center'}}></span>
                                            <span style={{flex: 1, textAlign: 'center'}}>{totalTax.toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className={styles.amountCol}>{totalAmount.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className={styles.shareBtn} onClick={onClose}>{isViewOnly ? "Close" : "Cancel"}</button>
                    {!isViewOnly && (
                        <button 
                            className={styles.saveBtn} 
                            onClick={handleSave} 
                            disabled={loading}
                        >
                            {loading ? "Saving..." : "Save"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddPurchaseReturn;
