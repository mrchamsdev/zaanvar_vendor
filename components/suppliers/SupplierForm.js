import React, { useState, useEffect, useRef } from "react";
import styles from "../../styles/purchase-bill/purchase-out.module.css";
import { purchaseService } from "../../services/purchaseService";
import useStore from "../state/useStore";
import useDashboardData from "../dashboard/useDashboardData";
import { toast } from "sonner";
import MultiSelectDropdown from "../MultiSelectDropdown";
import { FiChevronDown, FiX } from "react-icons/fi";
import { Country, State, City } from 'country-state-city';
import { useRouter } from "next/router";

const SupplierForm = ({ initialData, onSave, onBack, mode = 'Add', onChange }) => {
    const router = useRouter();
    const branchId = router.query.branchId || "";
    const { jwtToken, userInfo } = useStore();
    const { branches } = useDashboardData();
    const [loading, setLoading] = useState(false);
    const [errorPopupMessage, setErrorPopupMessage] = useState(null);

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
    const isInitialized = useRef(false);
    const hasUserEditedBranches = useRef(false);

    useEffect(() => {
        if (supplierId && jwtToken) {
            const fetchFullDetails = async () => {
                try {
                    const res = await purchaseService.getSupplierById(jwtToken, supplierId, branchId);
                    const data = res?.data || res;
                    if (data && data.branches && !hasUserEditedBranches.current) {
                        const fullBranchIds = data.branches.map(b => Number(b.id || b.branchId || b._id));
                        setSelectedBranchIds(fullBranchIds);
                    }
                } catch (err) {
                    console.error("Failed to fetch full supplier details in form:", err);
                }
            };
            fetchFullDetails();
        }
    }, [supplierId, jwtToken]);

    const lastSupplierIdRef = useRef(null);

    useEffect(() => {
        const currentSupplierId = initialData?.supplierId || "new";
        if (lastSupplierIdRef.current !== currentSupplierId) {
            isInitialized.current = false;
            lastSupplierIdRef.current = currentSupplierId;
        }

        if (isInitialized.current) return;
        isInitialized.current = true;

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
            setSelectedBranchIds(
                initialData.selectedBranchIds?.map(Number) ||
                initialData.branches?.map(b => Number(b.id || b.branchId || b._id)) ||
                []
            );

            // Handle edit mode hydration for dropdowns
            const allCountries = Country.getAllCountries();
            setCountries(allCountries);

            if (initialData.countries && initialData.countries.length > 0) {
                setCountries(initialData.countries);
            }
            if (initialData.states && initialData.states.length > 0) {
                setStates(initialData.states);
            }
            if (initialData.cities && initialData.cities.length > 0) {
                setCities(initialData.cities);
            }

            setSelectedCountryCode(initialData.selectedCountryCode || "");
            setSelectedStateCode(initialData.selectedStateCode || "");

            if (!initialData.selectedCountryCode && initialData.country) {
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

    useEffect(() => {
        if (!isInitialized.current) return;
        if (onChange) {
            onChange({
                ...initialData,
                supplierName,
                supplierType,
                phone,
                email,
                street,
                landmark,
                state,
                city,
                locality,
                areaPinCode,
                country,
                selectedBranchIds,
                countries,
                states,
                cities,
                selectedCountryCode,
                selectedStateCode
            });
        }
    }, [
        supplierName,
        supplierType,
        phone,
        email,
        street,
        landmark,
        state,
        city,
        locality,
        areaPinCode,
        country,
        selectedBranchIds,
        countries,
        states,
        cities,
        selectedCountryCode,
        selectedStateCode
    ]);

    const supplierTypes = [
        { id: 'Wholesaler', name: 'Wholesaler' },
        { id: 'Distributor', name: 'Distributor' },
        { id: 'Manufacturer', name: 'Manufacturer' },
        { id: 'Local Vendor', name: 'Local Vendor' },
        { id: 'PETS', name: 'PETS' },
        { id: 'MEDICAL', name: 'MEDICAL' },
        { id: 'PRODUCTS', name: 'PRODUCTS' }
    ];

    // Combine company branches with the supplier's own branches to guarantee that all associated branches are present in the list
    const combinedBranches = [...(branches || [])];
    if (initialData?.branches && Array.isArray(initialData.branches)) {
        initialData.branches.forEach(ib => {
            const id = ib.id || ib.branchId || ib._id;
            if (id && !combinedBranches.some(b => (b.id || b.branchId || b._id) === id)) {
                combinedBranches.push(ib);
            }
        });
    }

    const branchesList = combinedBranches.map(br => ({
        id: Number(br.id || br._id || br.branchId),
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

        if (hasError) {
            toast.error("Please fill all required fields correctly.");
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
            if (supplierId) {
                res = await purchaseService.updateSupplier(jwtToken, supplierId, payload);
            } else {
                res = await purchaseService.createSupplier(jwtToken, payload);
            }

            const isSuccess = res && 
                              (res.status === "success" || res.status === 200) && 
                              (!res.data || (res.data.status !== "fail" && res.data.status !== "error"));

            if (isSuccess) {
                toast.success(supplierId ? "Supplier updated successfully" : "Supplier added successfully");
                onSave();
            } else {
                const errMsg = res ? (res.message || res.data?.message || res.msg || res.data?.msg) : null;
                if (errMsg) {
                    setErrorPopupMessage(errMsg);
                } else {
                    toast.error("Something went wrong");
                }
            }
        } catch (e) {
            console.error(e);
            const errMsg = e.response?.data?.message || e.response?.data?.msg || e.message || "An error occurred";
            if (errMsg && (errMsg.includes("branches") || errMsg.includes("Branch"))) {
                setErrorPopupMessage(errMsg);
            } else {
                toast.error(errMsg);
            }
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
                                Supplier name <span style={{ color: '#FF4D4F' }}>*</span>
                            </label>
                            <input
                                type="text" style={{ boxSizing: 'border-box', width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '14px', color: '#333', outline: 'none' }} placeholder="Enter Supplier Name"
                                value={supplierName} onChange={(e) => { setSupplierName(e.target.value); if (supplierNameError) setSupplierNameError(""); }}
                            />
                            {supplierNameError && <span style={{ color: '#FF4D4F', fontSize: '12px', marginTop: '4px', display: 'block' }}>{supplierNameError}</span>}
                        </div>
                        <div className={styles.field}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>
                                Branch Name <span style={{ color: '#FF4D4F' }}>*</span>
                            </label>
                            <MultiSelectDropdown
                                listItems={branchesList}
                                selectedIds={selectedBranchIds}
                                setSelectedIds={(ids) => {
                                    hasUserEditedBranches.current = true;
                                    setSelectedBranchIds(ids.map(Number));
                                    if (branchError) setBranchError("");
                                }}
                                placeholder="Select Branch Name here"
                                customStyles={{ background: '#fff', border: '1px solid #E5E7EB', padding: '8px 16px', borderRadius: '8px' }}
                            />
                            {branchError && <span style={{ color: '#FF4D4F', fontSize: '12px', marginTop: '4px', display: 'block' }}>{branchError}</span>}
                        </div>
                        <div className={styles.field}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>
                                Supplier Type <span style={{ color: '#FF4D4F' }}>*</span>
                            </label>
                            <MultiSelectDropdown
                                listItems={supplierTypes}
                                selectedIds={supplierType}
                                setSelectedIds={(ids) => { setSupplierType(ids); if (supplierTypeError) setSupplierTypeError(""); }}
                                placeholder="Select Supplier Type here"
                                customStyles={{ background: '#fff', border: '1px solid #E5E7EB', padding: '8px 16px', borderRadius: '8px' }}
                            />
                            {supplierTypeError && <span style={{ color: '#FF4D4F', fontSize: '12px', marginTop: '4px', display: 'block' }}>{supplierTypeError}</span>}
                        </div>
                        <div className={styles.field}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>
                                Phone Number <span style={{ color: '#FF4D4F' }}>*</span>
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
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>E-mail ID <span style={{ color: '#FF4D4F' }}>*</span></label>
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
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>Country <span style={{ color: '#FF4D4F' }}>*</span></label>
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
                                        if (countryError) setCountryError("");
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
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>State <span style={{ color: '#FF4D4F' }}>*</span></label>
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
                                        if (stateError) setStateError("");
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
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>City <span style={{ color: '#FF4D4F' }}>*</span></label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    style={{ boxSizing: 'border-box', width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '14px', color: city ? '#333' : '#777', appearance: 'none', outline: 'none' }}
                                    value={city}
                                    onChange={(e) => {
                                        setCity(e.target.value);
                                        if (cityError) setCityError("");
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
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>Pin Code <span style={{ color: '#FF4D4F' }}>*</span></label>
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
            
            {errorPopupMessage && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        backgroundColor: '#fff',
                        borderRadius: '16px',
                        padding: '32px',
                        maxWidth: '480px',
                        width: '90%',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        position: 'relative',
                        border: '1px solid #f1f5f9',
                        fontFamily: "'Inter', sans-serif"
                    }}>
                        <button 
                            onClick={() => setErrorPopupMessage(null)}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '20px',
                                color: '#94a3b8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '4px',
                                borderRadius: '50%'
                            }}
                        >
                            <FiX />
                        </button>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            
                            <div>
                                <h3 style={{
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    color: '#0f172a',
                                    margin: '0 0 8px 0'
                                }}>
                                    Unable to Update Branches
                                </h3>
                                <p style={{
                                    fontSize: '14px',
                                    color: '#64748b',
                                    lineHeight: '1.6',
                                    margin: 0
                                }}>
                                    {errorPopupMessage}
                                </p>
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                marginTop: '8px'
                            }}>
                                <button
                                    onClick={() => setErrorPopupMessage(null)}
                                    style={{
                                        padding: '10px 24px',
                                        backgroundColor: '#0f172a',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupplierForm;
