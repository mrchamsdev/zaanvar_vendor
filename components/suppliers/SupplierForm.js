import React, { useState, useEffect } from "react";
import styles from "../../styles/purchase-bill/purchase-out.module.css";
import { purchaseService } from "../../services/purchaseService";
import useStore from "../state/useStore";
import useDashboardData from "../dashboard/useDashboardData";
import { toast } from "sonner";
import MultiSelectDropdown from "../MultiSelectDropdown";
import { FiChevronDown } from "react-icons/fi";
import { Country, State, City } from 'country-state-city';

const SupplierForm = ({ initialData, onSave, onBack, mode = 'Add' }) => {
    const { jwtToken, userInfo } = useStore();
    const { branches } = useDashboardData();
    const [loading, setLoading] = useState(false);

    // Form states
    const [supplierName, setSupplierName] = useState("");
    const [supplierNameError, setSupplierNameError] = useState("");
    const [supplierType, setSupplierType] = useState([]);
    const [supplierTypeError, setSupplierTypeError] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [pinCodeError, setPinCodeError] = useState("");
    const [street, setStreet] = useState("");
    const [landmark, setLandmark] = useState("");
    const [state, setState] = useState("");
    const [stateError, setStateError] = useState("");
    const [city, setCity] = useState("");
    const [cityError, setCityError] = useState("");
    const [locality, setLocality] = useState("");
    const [areaPinCode, setAreaPinCode] = useState("");
    const [country, setCountry] = useState("");
    const [countryError, setCountryError] = useState("");
    const [selectedBranchIds, setSelectedBranchIds] = useState([]);
    const [branchError, setBranchError] = useState("");
    
    // Dropdown lists
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    
    // Selection codes for fetching
    const [selectedCountryCode, setSelectedCountryCode] = useState("");
    const [selectedStateCode, setSelectedStateCode] = useState("");

    const supplierId = initialData?.supplierId;

    useEffect(() => {
        if (initialData && Object.keys(initialData).length > 0) {
            setSupplierName(initialData.supplierName || "");
            setSupplierType(initialData.supplierType ? (Array.isArray(initialData.supplierType) ? initialData.supplierType : initialData.supplierType.split(',').map(s => s.trim())) : []);
            setPhone(initialData.phone || "");
            setEmail(initialData.email || "");
            setStreet(initialData.street || "");
            setLandmark(initialData.landmark || "");
            setState(initialData.state || "");
            setCity(initialData.city || "");
            setLocality(initialData.locality || "");
            setAreaPinCode(initialData.areaPinCode || "");
            setCountry(initialData.country || "");
            setCity(initialData.city || "");
            setLocality(initialData.locality || "");
            setAreaPinCode(initialData.areaPinCode || "");
            setSelectedBranchIds(initialData.branches?.map(b => b.id) || []);

            // Handle edit mode hydration for dropdowns
            const allCountries = Country.getAllCountries();
            setCountries(allCountries);
            
            if (initialData.country) {
                const foundCountry = allCountries.find(c => c.name === initialData.country);
                if (foundCountry) {
                    setSelectedCountryCode(foundCountry.isoCode);
                    const foundStates = State.getStatesOfCountry(foundCountry.isoCode);
                    setStates(foundStates);
                    
                    if (initialData.state) {
                        const foundState = foundStates.find(s => s.name === initialData.state);
                        if (foundState) {
                            setSelectedStateCode(foundState.isoCode);
                            setCities(City.getCitiesOfState(foundCountry.isoCode, foundState.isoCode));
                        }
                    }
                }
            }
        } else {
            setCountries(Country.getAllCountries());
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

    const branchesList = (branches || []).map(br => ({ 
        id: br.id || br._id || br.branchId, 
        name: br.name || br.branchName 
    }));

    const handleSave = async () => {
        let hasError = false;

        if (!supplierName) { setSupplierNameError("Supplier name is required"); hasError = true; } else setSupplierNameError("");
        if (selectedBranchIds.length === 0) { setBranchError("Branch is required"); hasError = true; } else setBranchError("");
        if (supplierType.length === 0) { setSupplierTypeError("Supplier type is required"); hasError = true; } else setSupplierTypeError("");
        if (!country) { setCountryError("Country is required"); hasError = true; } else setCountryError("");
        if (!state) { setStateError("State is required"); hasError = true; } else setStateError("");
        if (!city) { setCityError("City is required"); hasError = true; } else setCityError("");

        if (!phone) {
            setPhoneError("Phone number is required");
            hasError = true;
        } else if (phone.length !== 10) {
            setPhoneError("Phone number must be exactly 10 digits");
            hasError = true;
        } else {
            setPhoneError("");
        }

        if (!email) {
            setEmailError("Email ID is required");
            hasError = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setEmailError("Please enter a valid email address");
            hasError = true;
        } else {
            setEmailError("");
        }

        if (!areaPinCode) {
            setPinCodeError("Pin Code is required");
            hasError = true;
        } else if (String(areaPinCode).length !== 6) {
            setPinCodeError("Pin Code must be exactly 6 digits");
            hasError = true;
        } else {
            setPinCodeError("");
        }

        if (hasError) return;

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
        <div style={{ boxSizing: 'border-box', width: '100%', background: '#fff', padding: '48px', minHeight: '100%', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ marginBottom: '48px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#000', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px' }}>Supplier Information</h3>
                <div style={{ background: '#fff', padding: '48px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px 48px' }}>
                        <div className={styles.field}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>
                                Supplier name
                            </label>
                            <input 
                                type="text" style={{ boxSizing: 'border-box', width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '14px', color: '#333', outline: 'none' }} placeholder="Enter Supplier Name"
                                value={supplierName} onChange={(e) => { setSupplierName(e.target.value); if(supplierNameError) setSupplierNameError(""); }}
                            />
                            {supplierNameError && <span style={{ color: '#FF4D4F', fontSize: '12px', marginTop: '4px', display: 'block' }}>{supplierNameError}</span>}
                        </div>
                        <div className={styles.field}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>
                                Branch Name
                            </label>
                            <MultiSelectDropdown 
                                listItems={branchesList}
                                selectedIds={selectedBranchIds}
                                setSelectedIds={(ids) => { setSelectedBranchIds(ids); if(branchError) setBranchError(""); }}
                                placeholder="Select Branch Name here"
                                customStyles={{ background: '#fff', border: '1px solid #E5E7EB', padding: '8px 16px', borderRadius: '8px' }}
                            />
                            {branchError && <span style={{ color: '#FF4D4F', fontSize: '12px', marginTop: '4px', display: 'block' }}>{branchError}</span>}
                        </div>
                        <div className={styles.field}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>
                                Supplier Type
                            </label>
                            <MultiSelectDropdown 
                                listItems={supplierTypes}
                                selectedIds={supplierType}
                                setSelectedIds={(ids) => { setSupplierType(ids); if(supplierTypeError) setSupplierTypeError(""); }}
                                placeholder="Select Supplier Type here"
                                customStyles={{ background: '#fff', border: '1px solid #E5E7EB', padding: '8px 16px', borderRadius: '8px' }}
                            />
                            {supplierTypeError && <span style={{ color: '#FF4D4F', fontSize: '12px', marginTop: '4px', display: 'block' }}>{supplierTypeError}</span>}
                        </div>
                        <div className={styles.field}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>
                                Phone Number
                            </label>
                            <input 
                                type="text" style={{ boxSizing: 'border-box', width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '14px', color: '#333', outline: 'none' }} placeholder="Enter Phone Number"
                                value={phone} 
                                maxLength={10}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val.length <= 10) {
                                        setPhone(val);
                                        if (phoneError) setPhoneError("");
                                    }
                                }}
                            />
                            {phoneError && <span style={{ color: '#FF4D4F', fontSize: '12px', marginTop: '4px', display: 'block' }}>{phoneError}</span>}
                        </div>
                        <div className={styles.field}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>E-mail ID</label>
                            <input 
                                type="email" style={{ boxSizing: 'border-box', width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '14px', color: '#333', outline: 'none' }} placeholder="Enter Email ID here"
                                value={email} 
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (emailError) setEmailError("");
                                }}
                            />
                            {emailError && <span style={{ color: '#FF4D4F', fontSize: '12px', marginTop: '4px', display: 'block' }}>{emailError}</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 2: Address Information */}
            <div style={{ marginBottom: '48px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#000', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px' }}>Address Information</h3>
                <div style={{ background: '#fff', padding: '48px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px 48px' }}>
                        <div className={styles.field}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>Country</label>
                            <div style={{ position: 'relative' }}>
                                <select 
                                    style={{ boxSizing: 'border-box', width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '14px', color: country ? '#333' : '#777', appearance: 'none', outline: 'none' }} 
                                    value={selectedCountryCode} 
                                    onChange={(e) => { 
                                        const code = e.target.value;
                                        const name = countries.find(c => c.isoCode === code)?.name || "";
                                        setSelectedCountryCode(code);
                                        setCountry(name);
                                        setStates(State.getStatesOfCountry(code));
                                        setSelectedStateCode("");
                                        setState("");
                                        setCities([]);
                                        setCity("");
                                        if(countryError) setCountryError(""); 
                                    }}
                                >
                                    <option value="">Select country here</option>
                                    {countries.map(c => (
                                        <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                                    ))}
                                </select>
                                <FiChevronDown style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#777', pointerEvents: 'none', fontSize: '18px' }} />
                            </div>
                            {countryError && <span style={{ color: '#FF4D4F', fontSize: '12px', marginTop: '4px', display: 'block' }}>{countryError}</span>}
                        </div>
                        <div className={styles.field}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>State</label>
                            <div style={{ position: 'relative' }}>
                                <select 
                                    style={{ boxSizing: 'border-box', width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '14px', color: state ? '#333' : '#777', appearance: 'none', outline: 'none' }} 
                                    value={selectedStateCode} 
                                    onChange={(e) => { 
                                        const code = e.target.value;
                                        const name = states.find(s => s.isoCode === code)?.name || "";
                                        setSelectedStateCode(code);
                                        setState(name);
                                        setCities(City.getCitiesOfState(selectedCountryCode, code));
                                        setCity("");
                                        if(stateError) setStateError(""); 
                                    }}
                                    disabled={!selectedCountryCode}
                                >
                                    <option value="">Select State here</option>
                                    {states.map(s => (
                                        <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                                    ))}
                                </select>
                                <FiChevronDown style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#777', pointerEvents: 'none', fontSize: '18px' }} />
                            </div>
                            {stateError && <span style={{ color: '#FF4D4F', fontSize: '12px', marginTop: '4px', display: 'block' }}>{stateError}</span>}
                        </div>
                        <div className={styles.field}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>City</label>
                            <div style={{ position: 'relative' }}>
                                <select 
                                    style={{ boxSizing: 'border-box', width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '14px', color: city ? '#333' : '#777', appearance: 'none', outline: 'none' }} 
                                    value={city} 
                                    onChange={(e) => { 
                                        setCity(e.target.value); 
                                        if(cityError) setCityError(""); 
                                    }}
                                    disabled={!selectedStateCode}
                                >
                                    <option value="">Select City here</option>
                                    {cities.map(c => (
                                        <option key={c.name} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                                <FiChevronDown style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#777', pointerEvents: 'none', fontSize: '18px' }} />
                            </div>
                            {cityError && <span style={{ color: '#FF4D4F', fontSize: '12px', marginTop: '4px', display: 'block' }}>{cityError}</span>}
                        </div>
                        <div className={styles.field}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>Area Name</label>
                            <input 
                                type="text" style={{ boxSizing: 'border-box', width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '14px', color: '#333', outline: 'none' }} placeholder="Enter Area Name"
                                value={locality} onChange={(e) => setLocality(e.target.value)}
                            />
                        </div>
                        <div className={styles.field}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>Landmark</label>
                            <input 
                                type="text" style={{ boxSizing: 'border-box', width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '14px', color: '#333', outline: 'none' }} placeholder="Enter Landmark here"
                                value={landmark} onChange={(e) => setLandmark(e.target.value)}
                            />
                        </div>
                        <div className={styles.field}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>Pin Code</label>
                            <input 
                                type="text" style={{ boxSizing: 'border-box', width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '14px', color: '#333', outline: 'none' }} placeholder="Enter Pin Code here"
                                value={areaPinCode} 
                                maxLength={6}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val.length <= 6) {
                                        setAreaPinCode(val);
                                        if (pinCodeError) setPinCodeError("");
                                    }
                                }}
                            />
                            {pinCodeError && <span style={{ color: '#FF4D4F', fontSize: '12px', marginTop: '4px', display: 'block' }}>{pinCodeError}</span>}
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
                    style={{ padding: '12px 48px', borderRadius: '8px', border: 'none', background: '#000', color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)' }}
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
