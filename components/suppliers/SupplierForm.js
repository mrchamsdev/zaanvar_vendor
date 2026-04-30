import React, { useState, useEffect } from "react";
import styles from "../../styles/purchase-bill/purchase-out.module.css";
import { purchaseService } from "../../services/purchaseService";
import useStore from "../state/useStore";
import { toast } from "sonner";
import MultiSelectDropdown from "../MultiSelectDropdown";

const SupplierForm = ({ initialData, onSave, onBack, mode = 'Add' }) => {
    const { jwtToken, userInfo } = useStore();
    const [loading, setLoading] = useState(false);

    // Form states
    const [supplierName, setSupplierName] = useState("");
    const [supplierType, setSupplierType] = useState([]);
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

    const supplierId = initialData?.supplierId;

    useEffect(() => {
        if (initialData && Object.keys(initialData).length > 0) {
            setSupplierName(initialData.supplierName || "");
            setSupplierType(initialData.supplierType ? initialData.supplierType.split(',').map(s => s.trim()) : []);
            setPhone(initialData.phone || "");
            setEmail(initialData.email || "");
            setStreet(initialData.street || "");
            setLandmark(initialData.landmark || "");
            setState(initialData.state || "");
            setCity(initialData.city || "");
            setLocality(initialData.locality || "");
            setAreaPinCode(initialData.areaPinCode || "");
            setCountry(initialData.country || "India");
            setSelectedBranchIds(initialData.branches?.map(b => b.id) || []);
        }
    }, [initialData]);

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

    const handleSave = async () => {
        if (!supplierName || !phone || selectedBranchIds.length === 0) {
            toast.error("Please fill required fields (Name, Phone, Branch)");
            return;
        }

        const payload = {
            supplierName,
            supplierType: supplierType.join(', '),
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
            if (supplierId) {
                res = await purchaseService.updateSupplier(jwtToken, supplierId, payload);
            } else {
                res = await purchaseService.createSupplier(jwtToken, payload);
            }

            if (res.status === "success" || res.status === 200) {
                toast.success(supplierId ? "Supplier updated successfully" : "Supplier added successfully");
                onSave();
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

    return (
        <div style={{ width: '100%', background: '#fff', padding: '48px', minHeight: '100%', fontFamily: "'Inter', sans-serif" }}>
            {/* Section 1: Supplier Information */}
            <div style={{ marginBottom: '48px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#E9315D', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px' }}>Supplier Information</h3>
                <div style={{ background: '#fff', padding: '48px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px 48px' }}>
                        <div className={styles.field}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>
                                Supplier name <span style={{color: '#FF4D4F'}}>*</span>
                            </label>
                            <input 
                                type="text" style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F8F9FA', fontSize: '14px', color: '#333' }} placeholder="Enter Supplier Name"
                                value={supplierName} onChange={(e) => setSupplierName(e.target.value)}
                            />
                        </div>
                        <div className={styles.field}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>
                                Branch Name <span style={{color: '#FF4D4F'}}>*</span>
                            </label>
                            <MultiSelectDropdown 
                                listItems={branchesList}
                                selectedIds={selectedBranchIds}
                                setSelectedIds={setSelectedBranchIds}
                                placeholder="Select Branch Name here"
                                customStyles={{ background: '#F8F9FA', border: '1px solid #E5E7EB', padding: '8px 16px', borderRadius: '8px' }}
                            />
                        </div>
                        <div className={styles.field}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>
                                Supplier Type <span style={{color: '#FF4D4F'}}>*</span>
                            </label>
                            <MultiSelectDropdown 
                                listItems={supplierTypes}
                                selectedIds={supplierType}
                                setSelectedIds={setSupplierType}
                                placeholder="Select Supplier Type here"
                                customStyles={{ background: '#F8F9FA', border: '1px solid #E5E7EB', padding: '8px 16px', borderRadius: '8px' }}
                            />
                        </div>
                        <div className={styles.field}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>
                                Phone Number <span style={{color: '#FF4D4F'}}>*</span>
                            </label>
                            <input 
                                type="text" style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F8F9FA', fontSize: '14px', color: '#333' }} placeholder="Enter Phone Number"
                                value={phone} onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                        <div className={styles.field}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>E-mail ID</label>
                            <input 
                                type="email" style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F8F9FA', fontSize: '14px', color: '#333' }} placeholder="Enter Email ID here"
                                value={email} onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 2: Address Information */}
            <div style={{ marginBottom: '48px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#E9315D', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px' }}>Address Information</h3>
                <div style={{ background: '#fff', padding: '48px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px 48px' }}>
                        <div className={styles.field}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>Country</label>
                            <select style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F8F9FA', fontSize: '14px', color: '#777', appearance: 'none' }} value={country} onChange={(e) => setCountry(e.target.value)}>
                                <option value="India">Select country here</option>
                                <option value="USA">USA</option>
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>state</label>
                            <input 
                                type="text" style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F8F9FA', fontSize: '14px', color: '#333' }} placeholder="Select State here"
                                value={state} onChange={(e) => setState(e.target.value)}
                            />
                        </div>
                        <div className={styles.field}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>City</label>
                            <input 
                                type="text" style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F8F9FA', fontSize: '14px', color: '#333' }} placeholder="Select City here"
                                value={city} onChange={(e) => setCity(e.target.value)}
                            />
                        </div>
                        <div className={styles.field}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>Area Name</label>
                            <input 
                                type="text" style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F8F9FA', fontSize: '14px', color: '#333' }} placeholder="Enter Area Name"
                                value={locality} onChange={(e) => setLocality(e.target.value)}
                            />
                        </div>
                        <div className={styles.field}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>Landmark</label>
                            <input 
                                type="text" style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F8F9FA', fontSize: '14px', color: '#333' }} placeholder="Enter Landmark here"
                                value={landmark} onChange={(e) => setLandmark(e.target.value)}
                            />
                        </div>
                        <div className={styles.field}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>Pin Code</label>
                            <input 
                                type="text" style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F8F9FA', fontSize: '14px', color: '#333' }} placeholder="Enter Pin Code here"
                                value={areaPinCode} onChange={(e) => setAreaPinCode(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', marginTop: '40px', paddingBottom: '40px' }}>
                <button 
                    style={{ padding: '12px 36px', borderRadius: '8px', border: '1px solid #333', background: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#333' }}
                    onClick={onBack}
                >
                    Cancel
                </button>
                <button 
                    style={{ padding: '12px 48px', borderRadius: '8px', border: 'none', background: '#E9315D', color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 12px rgba(233, 49, 93, 0.2)' }}
                    onClick={handleSave}
                    disabled={loading}
                >
                    {loading ? "Saving..." : "Save"}
                </button>
            </div>
        </div>
    );
};

export default SupplierForm;
