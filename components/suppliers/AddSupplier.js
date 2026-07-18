import React, { useState, useEffect } from "react";
import styles from "../../styles/purchase-bill/purchase-out.module.css"; // Reuse modal styles
import { FiX, FiChevronDown } from "react-icons/fi";
import { productService } from "../../services/productService";
import { getTaxGroups } from "../../services/settingsService";
import useStore from "../state/useStore";
import { toast } from "sonner";
import MultiSelectDropdown from "../MultiSelectDropdown";
import { useRouter } from "next/router";

const AddSupplier = ({ isOpen, onClose, onRefresh, mode = 'add', supplierId }) => {
    const router = useRouter();
    const branchId = router.query.branchId || "";
    const { jwtToken, userInfo, vendorSettings, selectedBranchId } = useStore();
    const enableGstin = vendorSettings?.general?.enableGstin;
    const [loading, setLoading] = useState(false);

    // Form states
    const [supplierName, setSupplierName] = useState("");
    const [supplierType, setSupplierType] = useState([]); // Multi-select
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [gstin, setGstin] = useState("");
    const [street, setStreet] = useState("");
    const [landmark, setLandmark] = useState("");
    const [state, setState] = useState("");
    const [city, setCity] = useState("");
    const [locality, setLocality] = useState("");
    const [areaPinCode, setAreaPinCode] = useState("");
    const [country, setCountry] = useState("India");
    const [selectedBranchIds, setSelectedBranchIds] = useState([]);
    const [additionalFields, setAdditionalFields] = useState([]);
    const [errors, setErrors] = useState({});

    const [groupName, setGroupName] = useState("");
    const [supplierGroups, setSupplierGroups] = useState([]);
    const [showGroupPopup, setShowGroupPopup] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");

    const [productsList, setProductsList] = useState([]);
    const [taxGroups, setTaxGroups] = useState([]);
    const [assignedProducts, setAssignedProducts] = useState([
        { products: [], taxType: "", taxGroupId: "" }
    ]);

    const showSupplierGrouping = vendorSettings?.party?.supplierGrouping || vendorSettings?.settings?.party?.supplierGrouping;

    // Available options
    const supplierTypes = [
        { id: 'Wholesaler', name: 'Wholesaler' },
        { id: 'Distributor', name: 'Distributor' },
        { id: 'Manufacturer', name: 'Manufacturer' },
        { id: 'Local Vendor', name: 'Local Vendor' },
        { id: 'PETS', name: 'PETS' },
        { id: 'MEDICAL', name: 'MEDICAL' },
        { id: 'PRODUCTS', name: 'PRODUCTS' }
    ];

    const branchesList = (userInfo?.vendorCompanies || []).flatMap(co =>
        (co.branches || []).map(br => ({ id: br.id, name: br.name }))
    );

    const fetchSupplierGroups = async () => {
        const activeBranchId = Number(selectedBranchId) || Number(branchId) || Number(selectedBranchIds[0]) || Number(branchesList[0]?.id);
        if (!activeBranchId) return;
        try {
            const res = await purchaseService.getSupplierGroups(jwtToken, activeBranchId);
            if (res.status === "success" || res.status === 200) {
                setSupplierGroups(res.data || []);
            }
        } catch (e) {
            console.error("Error fetching supplier groups:", e);
        }
    };

    useEffect(() => {
        if (isOpen && showSupplierGrouping && (selectedBranchId || branchId)) {
            fetchSupplierGroups();
        }
        if (isOpen) {
            fetchProducts();
            fetchTaxGroupsData();
        }
    }, [isOpen, branchId, selectedBranchId, showSupplierGrouping]);

    const fetchTaxGroupsData = async () => {
        const activeBranchId = Number(selectedBranchId) || Number(branchId) || Number(selectedBranchIds[0]);
        if (!activeBranchId) return;
        try {
            const res = await getTaxGroups(jwtToken, activeBranchId);
            const payload = res?.data || res;
            let rawGroups = [];
            if (Array.isArray(payload)) rawGroups = payload;
            else if (payload && Array.isArray(payload.data)) rawGroups = payload.data;
            else if (payload && Array.isArray(payload.taxGroups)) rawGroups = payload.taxGroups;
            else if (payload && Array.isArray(payload.payload)) rawGroups = payload.payload;
            
            console.log("Tax Groups Parsed:", rawGroups);
            setTaxGroups(rawGroups || []);
        } catch (err) {
            console.error("Failed to fetch tax groups:", err);
            setTaxGroups([]);
        }
    };

    const fetchProducts = async () => {
        const activeBranchId = Number(selectedBranchId) || Number(branchId) || Number(selectedBranchIds[0]) || Number(branchesList[0]?.id);
        if (!activeBranchId) return;
        try {
            const res = await productService.getAllProductsBrief(jwtToken, activeBranchId);
            const mapped = (res || []).map(p => ({ id: p.productId, name: p.productName }));
            setProductsList(mapped);
        } catch (e) {
            console.error("Error fetching products:", e);
        }
    };

    useEffect(() => {
        const settingsObj = vendorSettings?.settings || vendorSettings;
        const partySettings = settingsObj?.party;
        if (isOpen && partySettings?.additionalFields) {
            const activeFields = (partySettings.additionalFields || [])
                .filter(f => f.label && f.label.trim() !== "")
                .map(f => ({
                    label: f.label,
                    dataType: f.dataType || "string",
                    required: !!f.required,
                    showInPrint: !!f.showInPrint,
                    value: ""
                }));
            setAdditionalFields(activeFields);
            setErrors({});
        }
    }, [isOpen, vendorSettings]);

    useEffect(() => {
        if (mode === 'edit' && supplierId) {
            fetchSupplierDetails();
        }
    }, [mode, supplierId]);

    const fetchSupplierDetails = async () => {
        setLoading(true);
        try {
            const activeBranchId = selectedBranchId || branchId;
            if (!activeBranchId) {
                setLoading(false);
                return;
            }
            const res = await purchaseService.getSupplierById(jwtToken, supplierId, activeBranchId);
            if (res.status === "success") {
                const data = res.data;
                setSupplierName(data.supplierName || "");
                setSupplierType(data.supplierType ? (Array.isArray(data.supplierType) ? data.supplierType : data.supplierType.split(',').map(s => s.trim())) : []);
                setPhone(data.phone || "");
                setEmail(data.email || "");
                setGstin(data.gstin || "");
                setStreet(data.street || "");
                setLandmark(data.landmark || "");
                setState(data.state || "");
                setCity(data.city || "");
                setLocality(data.locality || "");
                setAreaPinCode(data.areaPinCode || "");
                setCountry(data.country || "India");
                if (data.assignedProducts && Array.isArray(data.assignedProducts) && data.assignedProducts.length > 0) {
                    setAssignedProducts(data.assignedProducts);
                } else {
                    const prods = data.productIds && Array.isArray(data.productIds) ? data.productIds : 
                                 (data.products && Array.isArray(data.products) ? data.products.map(p => p.productId || p.id) : []);
                    setAssignedProducts([{
                        products: prods,
                        taxType: data.taxType || "",
                        taxGroupId: data.taxGroupId || ""
                    }]);
                }
                
                setSelectedBranchIds(data.branches?.map(b => b.id) || []);
                setGroupName(data.groupName || "");

                const settingsObj = vendorSettings?.settings || vendorSettings;
                const partySettings = settingsObj?.party;
                const activeFields = (partySettings?.additionalFields || [])
                    .filter(f => f.label && f.label.trim() !== "")
                    .map(f => {
                        const savedValue = data.customFields?.[f.label] !== undefined ? data.customFields[f.label] : "";
                        return {
                            label: f.label,
                            dataType: f.dataType || "string",
                            required: !!f.required,
                            showInPrint: !!f.showInPrint,
                            value: savedValue
                        };
                    });
                setAdditionalFields(activeFields);
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to fetch supplier details");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGroup = async () => {
        if (!newGroupName || !newGroupName.trim()) {
            toast.error("Please enter group name");
            return;
        }
        const activeBranchId = branchId || selectedBranchIds[0] || branchesList[0]?.id || 1;
        try {
            const groupPayload = {
                branchId: parseInt(activeBranchId) || 1,
                name: newGroupName.trim()
            };
            const res = await purchaseService.createSupplierGroup(jwtToken, groupPayload);
            if (res.status === "success" || res.status === 200 || res.data?.status === "success") {
                toast.success("Group created successfully");
                await fetchSupplierGroups();
                setGroupName(newGroupName.trim());
                setNewGroupName("");
                setShowGroupPopup(false);
            } else {
                toast.error(res.message || "Failed to create group");
            }
        } catch (e) {
            console.error(e);
            toast.error("An error occurred while creating group");
        }
    };

    const handleSave = async () => {
        if (!supplierName || !phone || selectedBranchIds.length === 0 || supplierType.length === 0) {
            toast.error("Please fill all required fields correctly.");
            return;
        }

        if (gstin) {
            const trimmedGstin = gstin.trim().toUpperCase();
            const lettersCount = (trimmedGstin.match(/[A-Z]/g) || []).length;
            const digitsCount = (trimmedGstin.match(/[0-9]/g) || []).length;

            const isValidGstin = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(trimmedGstin);
            const isUserPattern = (trimmedGstin.length === 15 && lettersCount === 10 && digitsCount === 5);

            if (!isValidGstin && !isUserPattern) {
                toast.error("GSTIN must be exactly 15 characters (e.g., 10 letters and 5 numbers, or standard GSTIN format)");
                return;
            }
        }

        const fieldErrors = {};
        additionalFields.forEach(f => {
            if (f.required && (!f.value || !f.value.trim())) {
                fieldErrors[f.label] = `${f.label} is required`;
            }
        });

        if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            toast.error("Please fill all required additional fields.");
            return;
        }

        const customFieldsObj = {};
        additionalFields.forEach(f => {
            customFieldsObj[f.label] = f.value || "";
        });

        const payload = {
            supplierName,
            supplierType: supplierType,
            phone,
            email,
            gstin,
            street,
            landmark,
            state,
            city,
            locality,
            areaPinCode: parseInt(areaPinCode) || 0,
            country,
            createdBy: userInfo?.userId || 1,
            branchIds: selectedBranchIds,
            customFields: customFieldsObj,
            products: assignedProducts.flatMap(row => 
                (row.products || []).map(prodId => ({
                    productId: Number(prodId),
                    taxIncluded: row.taxType === "Include",
                    taxGroupId: Number(row.taxGroupId) || null
                }))
            ),
            ...(showSupplierGrouping ? { groupName } : {})
        };

        setLoading(true);
        try {
            let res;
            if (mode === 'edit') {
                res = await purchaseService.updateSupplier(jwtToken, supplierId, payload);
            } else {
                res = await purchaseService.createSupplier(jwtToken, payload);
            }

            if (res.status === "success" || res.status === 200) {
                toast.success(mode === 'edit' ? "Supplier updated successfully" : "Supplier added successfully");
                onRefresh();
                onClose();
            } else {
                toast.error(res.message || "Something went wrong");
            }
        } catch (e) {
            console.error(e);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal} style={{ maxWidth: '900px' }}>
                <div className={styles.modalHeader}>
                    <h3>{mode === 'edit' ? "Edit Supplier" : "Add Supplier"}</h3>
                    <button className={styles.closeBtn} onClick={onClose}><FiX /></button>
                </div>

                <div className={styles.modalContent}>
                    <h4 style={{ marginBottom: '20px', color: '#000' }}>Supplier Information</h4>
                    <div className={styles.topGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div className={styles.field}>
                            <label>Supplier name <span className={styles.requiredStar}>*</span></label>
                            <input
                                type="text" className={styles.input} placeholder="Enter Supplier Name"
                                value={supplierName} onChange={(e) => setSupplierName(e.target.value)}
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Branch Name <span className={styles.requiredStar}>*</span></label>
                            <MultiSelectDropdown
                                listItems={branchesList}
                                selectedIds={selectedBranchIds}
                                setSelectedIds={setSelectedBranchIds}
                                placeholder="Select Branch Name here"
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Supplier Type <span className={styles.requiredStar}>*</span></label>
                            <MultiSelectDropdown
                                listItems={supplierTypes}
                                selectedIds={supplierType}
                                setSelectedIds={setSupplierType}
                                placeholder="Select Supplier Type here"
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Phone Number <span className={styles.requiredStar}>*</span></label>
                            <input
                                type="text" className={styles.input} placeholder="Enter Phone Number"
                                value={phone} onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                        <div className={styles.field}>
                            <label>E-mail ID</label>
                            <input
                                type="email" className={styles.input} placeholder="Enter Email ID here"
                                value={email} onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        {enableGstin && (
                            <div className={styles.field}>
                                <label>GSTIN</label>
                                <input
                                    type="text" className={styles.input} placeholder="Enter GSTIN"
                                    value={gstin}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                                        if (val.length <= 15) {
                                            setGstin(val);
                                        }
                                    }}
                                />
                            </div>
                        )}
                        {showSupplierGrouping && (
                            <div className={styles.field}>
                                <label>Group Name</label>
                                <div style={{ position: 'relative' }}>
                                    <select 
                                        className={styles.select} 
                                        style={{ appearance: 'none', width: '100%', paddingRight: '40px' }} 
                                        value={groupName} 
                                        onChange={(e) => {
                                            if (e.target.value === "ADD_NEW_GROUP") {
                                                setShowGroupPopup(true);
                                                // Reset select choice back to empty so it doesn't stay on ADD_NEW_GROUP
                                                e.target.value = "";
                                            } else {
                                                setGroupName(e.target.value);
                                            }
                                        }}
                                    >
                                        <option value="">Select Group Name</option>
                                        {supplierGroups.map(g => (
                                            <option key={g.id} value={g.name}>{g.name}</option>
                                        ))}
                                        <option value="ADD_NEW_GROUP" style={{ color: '#E93E64', fontWeight: 'bold' }}>+ Add group name</option>
                                    </select>
                                    <FiChevronDown style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999', pointerEvents: 'none' }} />
                                </div>
                            </div>
                        )}

                        {/* Dynamic Additional Fields */}
                        {additionalFields.map((field, idx) => (
                            <div key={idx} className={styles.field}>
                                <label>
                                    {field.label} {field.required && <span className={styles.requiredStar}>*</span>}
                                </label>
                                <input
                                    type="text"
                                    className={`${styles.input} ${errors[field.label] ? styles.inputError : ""}`}
                                    placeholder={`Enter ${field.label}`}
                                    value={field.value}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (field.dataType === "number" && val !== "" && !/^\d*\.?\d*$/.test(val)) {
                                            return; // Only allow numbers
                                        }
                                        setAdditionalFields(prev => prev.map((item, i) => i === idx ? { ...item, value: val } : item));
                                        if (errors[field.label]) {
                                            setErrors(prev => {
                                                const next = { ...prev };
                                                delete next[field.label];
                                                return next;
                                            });
                                        }
                                    }}
                                />
                                {errors[field.label] && (
                                    <span className={styles.errorLabel}>
                                        {errors[field.label]}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    <h4 style={{ margin: '30px 0 20px', color: '#000', textTransform: 'uppercase' }}>Assigning Products</h4>
                    {assignedProducts.map((row, index) => (
                        <div key={index} className={styles.topGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '16px', alignItems: 'end', marginBottom: '16px' }}>
                            <div className={styles.field} style={{ marginBottom: 0 }}>
                                <label>Products</label>
                                <MultiSelectDropdown
                                    listItems={productsList}
                                    selectedIds={row.products}
                                    setSelectedIds={(ids) => {
                                        const next = [...assignedProducts];
                                        next[index].products = ids;
                                        setAssignedProducts(next);
                                    }}
                                    placeholder="Select Products here"
                                />
                            </div>
                            <div className={styles.field} style={{ marginBottom: 0 }}>
                                <label>Tax Include/Exclude</label>
                                <div style={{ position: 'relative' }}>
                                    <select className={styles.select} style={{ appearance: 'none', width: '100%', minHeight: '48px' }} 
                                        value={row.taxType} 
                                        onChange={(e) => {
                                            const next = [...assignedProducts];
                                            next[index].taxType = e.target.value;
                                            setAssignedProducts(next);
                                        }}>
                                        <option value="">Select Tax Type</option>
                                        <option value="Exclude">Exclude</option>
                                        <option value="Include">Include</option>
                                    </select>
                                    <FiChevronDown style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999', pointerEvents: 'none' }} />
                                </div>
                            </div>
                            <div className={styles.field} style={{ marginBottom: 0 }}>
                                <label>GST Group</label>
                                <div style={{ position: 'relative' }}>
                                    <select className={styles.select} style={{ appearance: 'none', width: '100%', minHeight: '48px' }} 
                                        value={row.taxGroupId || ""} 
                                        onChange={(e) => {
                                            const next = [...assignedProducts];
                                            next[index].taxGroupId = e.target.value;
                                            setAssignedProducts(next);
                                        }}>
                                        <option value="">Select GST Group</option>
                                        {(Array.isArray(taxGroups) ? taxGroups : []).map((g) => (
                                            <option key={g.id || g.taxGroupId} value={g.id || g.taxGroupId}>{g.name}</option>
                                        ))}
                                    </select>
                                    <FiChevronDown style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999', pointerEvents: 'none' }} />
                                </div>
                            </div>
                            {index > 0 ? (
                                <div style={{ marginBottom: '12px' }}>
                                    <FiX 
                                        style={{ cursor: 'pointer', color: '#E93E64', fontSize: '24px' }} 
                                        onClick={() => {
                                            const next = [...assignedProducts];
                                            next.splice(index, 1);
                                            setAssignedProducts(next);
                                        }} 
                                    />
                                </div>
                            ) : (
                                <div style={{ width: '24px' }}></div>
                            )}
                        </div>
                    ))}
                    <div style={{ marginTop: '0px', textAlign: 'left' }}>
                        <span 
                            onClick={() => {
                                setAssignedProducts([...assignedProducts, { products: [], taxType: "", taxGroupId: "" }]);
                            }}
                            style={{ color: '#E93E64', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                        >
                            + Assign Product
                        </span>
                    </div>

                    <h4 style={{ margin: '30px 0 20px', color: '#000' }}>Address Information</h4>
                    <div className={styles.topGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div className={styles.field}>
                            <label>Country</label>
                            <div style={{ position: 'relative' }}>
                                <select className={styles.select} style={{ appearance: 'none', width: '100%' }} value={country} onChange={(e) => setCountry(e.target.value)}>
                                    <option value="India">India</option>
                                    <option value="USA">USA</option>
                                </select>
                                <FiChevronDown style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999', pointerEvents: 'none' }} />
                            </div>
                        </div>
                        <div className={styles.field}>
                            <label>state</label>
                            <input
                                type="text" className={styles.input} placeholder="Select State here"
                                value={state} onChange={(e) => setState(e.target.value)}
                            />
                        </div>
                        <div className={styles.field}>
                            <label>City</label>
                            <input
                                type="text" className={styles.input} placeholder="Select City here"
                                value={city} onChange={(e) => setCity(e.target.value)}
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Area Name</label>
                            <input
                                type="text" className={styles.input} placeholder="Enter Area Name"
                                value={locality} onChange={(e) => setLocality(e.target.value)}
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Landmark</label>
                            <input
                                type="text" className={styles.input} placeholder="Enter Landmark here"
                                value={landmark} onChange={(e) => setLandmark(e.target.value)}
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Pin Code</label>
                            <input
                                type="text" className={styles.input} placeholder="Enter Pin Code here"
                                value={areaPinCode} onChange={(e) => setAreaPinCode(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button className={styles.cancelBtn} onClick={onClose} disabled={loading}>Cancel</button>
                    <button className={styles.saveBtn} onClick={handleSave} disabled={loading}>
                        {loading ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>

            {showGroupPopup && (
                <div className={styles.overlay} style={{ zIndex: 2010, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className={styles.modal} style={{ maxWidth: '450px', height: 'auto', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
                        <div className={styles.modalHeader} style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Add Group Name</h3>
                            <button className={styles.closeBtn} onClick={() => { setShowGroupPopup(false); setNewGroupName(""); }}><FiX /></button>
                        </div>
                        <div className={styles.modalContent} style={{ padding: '24px' }}>
                            <div className={styles.field}>
                                <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block', fontSize: '14px' }}>Group Name <span style={{ color: 'red' }}>*</span></label>
                                <input 
                                    type="text" 
                                    className={styles.input} 
                                    placeholder="Enter Group Name"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    style={{ width: '100%', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>
                        <div className={styles.modalFooter} style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button className={styles.cancelBtn} onClick={() => { setShowGroupPopup(false); setNewGroupName(""); }} style={{ padding: '10px 24px', border: '1px solid #ddd', background: '#fff', color: '#666', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
                            <button className={styles.saveBtn} onClick={handleSaveGroup} style={{ padding: '10px 24px', border: 'none', background: '#E93E64', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddSupplier;
