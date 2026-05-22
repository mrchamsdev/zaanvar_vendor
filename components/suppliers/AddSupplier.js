import React, { useState, useEffect } from "react";
import styles from "../../styles/purchase-bill/purchase-out.module.css"; // Reuse modal styles
import { FiX, FiChevronDown } from "react-icons/fi";
import { purchaseService } from "../../services/purchaseService";
import useStore from "../state/useStore";
import { toast } from "sonner";
import MultiSelectDropdown from "../MultiSelectDropdown";

const AddSupplier = ({ isOpen, onClose, onRefresh, mode = 'add', supplierId }) => {
    const { jwtToken, userInfo } = useStore();
    const [loading, setLoading] = useState(false);

    // Form states
    const [supplierName, setSupplierName] = useState("");
    const [supplierType, setSupplierType] = useState([]); // Multi-select
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [street, setStreet] = useState("");
    const [landmark, setLandmark] = useState("");
    const [state, setState] = useState("");
    const [city, setCity] = useState("");
    const [locality, setLocality] = useState("");
    const [areaPinCode, setAreaPinCode] = useState("");
    const [country, setCountry] = useState("India");
    const [selectedBranchIds, setSelectedBranchIds] = useState([]);

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

    useEffect(() => {
        if (mode === 'edit' && supplierId) {
            fetchSupplierDetails();
        }
    }, [mode, supplierId]);

    const fetchSupplierDetails = async () => {
        setLoading(true);
        try {
            const res = await purchaseService.getSupplierById(jwtToken, supplierId);
            if (res.status === "success") {
                const data = res.data;
                setSupplierName(data.supplierName || "");
                setSupplierType(data.supplierType ? (Array.isArray(data.supplierType) ? data.supplierType : data.supplierType.split(',').map(s => s.trim())) : []);
                setPhone(data.phone || "");
                setEmail(data.email || "");
                setStreet(data.street || "");
                setLandmark(data.landmark || "");
                setState(data.state || "");
                setCity(data.city || "");
                setLocality(data.locality || "");
                setAreaPinCode(data.areaPinCode || "");
                setCountry(data.country || "India");
                setSelectedBranchIds(data.branches?.map(b => b.id) || []);
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to fetch supplier details");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!supplierName || !phone || selectedBranchIds.length === 0) {
            toast.error("Please fill required fields (Name, Phone, Branch)");
            return;
        }

        const payload = {
            supplierName,
            supplierType: supplierType,
            phone,
            email,
            street,
            landmark,
            state,
            city,
            locality,
            areaPinCode: parseInt(areaPinCode) || 0,
            country,
            createdBy: userInfo?.userId || 1,
            branchIds: selectedBranchIds
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
                            <label>Supplier name <span style={{color: 'red'}}>*</span></label>
                            <input 
                                type="text" className={styles.input} placeholder="Enter Supplier Name"
                                value={supplierName} onChange={(e) => setSupplierName(e.target.value)}
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Branch Name <span style={{color: 'red'}}>*</span></label>
                            <MultiSelectDropdown 
                                listItems={branchesList}
                                selectedIds={selectedBranchIds}
                                setSelectedIds={setSelectedBranchIds}
                                placeholder="Select Branch Name here"
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Supplier Type <span style={{color: 'red'}}>*</span></label>
                            <MultiSelectDropdown 
                                listItems={supplierTypes}
                                selectedIds={supplierType}
                                setSelectedIds={setSupplierType}
                                placeholder="Select Supplier Type here"
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Phone Number <span style={{color: 'red'}}>*</span></label>
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
        </div>
    );
};

export default AddSupplier;
