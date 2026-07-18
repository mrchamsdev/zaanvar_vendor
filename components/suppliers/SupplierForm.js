import React, { useState, useEffect, useRef } from "react";
import styles from "../../styles/purchase-bill/purchase-out.module.css";
import { purchaseService } from "../../services/purchaseService";
import { productService } from "../../services/productService";
import { getTaxGroups } from "../../services/settingsService";
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
    const { jwtToken, userInfo, vendorSettings, selectedBranchId } = useStore();
    const enableGstin = vendorSettings?.general?.enableGstin;
    const { branches } = useDashboardData();
    const [loading, setLoading] = useState(false);
    const [errorPopupMessage, setErrorPopupMessage] = useState(null);
    const [additionalFields, setAdditionalFields] = useState([]);
    const [additionalErrors, setAdditionalErrors] = useState({});

    // Form states
    const [supplierName, setSupplierName] = useState("");
    const [supplierNameError, setSupplierNameError] = useState("");
    const [supplierType, setSupplierType] = useState([]);
    const [supplierTypeError, setSupplierTypeError] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [gstin, setGstin] = useState("");
    const [gstinError, setGstinError] = useState("");
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
    const showShippingAddress = vendorSettings?.party?.shippingAddress || vendorSettings?.settings?.party?.shippingAddress;

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
        if (showSupplierGrouping && jwtToken && (selectedBranchId || branchId)) {
            fetchSupplierGroups();
        }
    }, [branchId, selectedBranchId, selectedBranchIds, vendorSettings, jwtToken, showSupplierGrouping]);

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
        if (jwtToken && (selectedBranchId || branchId)) {
            fetchProducts();
            fetchTaxGroupsData();
        }
    }, [branchId, selectedBranchId, jwtToken]);

    const fetchTaxGroupsData = async () => {
        const activeBranchId = Number(selectedBranchId) || Number(branchId);
        if (!activeBranchId) return;
        try {
            const res = await getTaxGroups(jwtToken, activeBranchId);
            const payload = res?.data || res;
            let rawGroups = [];
            if (Array.isArray(payload)) rawGroups = payload;
            else if (payload && Array.isArray(payload.data)) rawGroups = payload.data;
            else if (payload && Array.isArray(payload.taxGroups)) rawGroups = payload.taxGroups;
            else if (payload && Array.isArray(payload.payload)) rawGroups = payload.payload;
            setTaxGroups(rawGroups || []);
        } catch (err) {
            console.error("Failed to fetch tax groups:", err);
            setTaxGroups([]);
        }
    };

    useEffect(() => {
        const settingsObj = vendorSettings?.settings || vendorSettings;
        const partySettings = settingsObj?.party;
        if (partySettings?.additionalFields) {
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
            setAdditionalErrors({});
        }
    }, [vendorSettings]);

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
                    const activeBranchId = selectedBranchId || branchId;
                    if (!activeBranchId) return;
                    const res = await purchaseService.getSupplierById(jwtToken, supplierId, activeBranchId);
                    const data = res?.data || res;
                    if (data && data.branches && !hasUserEditedBranches.current) {
                        const fullBranchIds = data.branches.map(b => Number(b.id || b.branchId || b._id));
                        setSelectedBranchIds(fullBranchIds);
                    }
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
                } catch (err) {
                    console.error("Failed to fetch full supplier details in form:", err);
                }
            };
            fetchFullDetails();
        }
    }, [supplierId, jwtToken, vendorSettings, selectedBranchId, branchId]);

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
            
            if (initialData.assignedProducts && Array.isArray(initialData.assignedProducts) && initialData.assignedProducts.length > 0) {
                setAssignedProducts(initialData.assignedProducts);
            } else if (initialData.products && Array.isArray(initialData.products) && initialData.products.length > 0 && initialData.products[0].productId) {
                const grouped = {};
                initialData.products.forEach(p => {
                    const key = `${p.taxIncluded}-${p.taxGroupId}`;
                    if (!grouped[key]) {
                        grouped[key] = {
                            products: [],
                            taxType: p.taxIncluded ? "Include" : "Exclude",
                            taxGroupId: p.taxGroupId || ""
                        };
                    }
                    grouped[key].products.push(p.productId);
                });
                setAssignedProducts(Object.values(grouped));
            } else {
                const prods = initialData.productIds && Array.isArray(initialData.productIds) ? initialData.productIds : 
                             (initialData.products && Array.isArray(initialData.products) ? initialData.products.map(p => p.productId || p.id) : []);
                setAssignedProducts([{
                    products: prods,
                    taxType: initialData.taxType || "",
                    taxGroupId: initialData.taxGroupId || ""
                }]);
            }

            setPhone(initialData.phone || "");
            setEmail(initialData.email || "");
            setGstin(initialData.gstin || "");
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
            setGroupName(initialData.groupName || "");

            const settingsObj = vendorSettings?.settings || vendorSettings;
            const partySettings = settingsObj?.party;
            const activeFields = (partySettings?.additionalFields || [])
                .filter(f => f.label && f.label.trim() !== "")
                .map(f => {
                    const savedValue = initialData.customFields?.[f.label] !== undefined ? initialData.customFields[f.label] : "";
                    return {
                        label: f.label,
                        dataType: f.dataType || "string",
                        required: !!f.required,
                        showInPrint: !!f.showInPrint,
                        value: savedValue
                    };
                });
            setAdditionalFields(activeFields);

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
    }, [initialData, vendorSettings]);

    useEffect(() => {
        if (!isInitialized.current) return;
        if (onChange) {
            onChange({
                ...initialData,
                supplierName,
                supplierType,
                phone,
                email,
                gstin,
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
                selectedStateCode,
                groupName,
                assignedProducts,
                customFields: additionalFields.reduce((acc, f) => {
                    acc[f.label] = f.value || "";
                    return acc;
                }, {})
            });
        }
    }, [
        supplierName,
        supplierType,
        phone,
        email,
        gstin,
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
        selectedStateCode,
        groupName,
        additionalFields
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
        let hasError = false;

        if (!supplierName) { setSupplierNameError("Supplier name is required"); hasError = true; } else setSupplierNameError("");
        if (selectedBranchIds.length === 0) { setBranchError("Branch is required"); hasError = true; } else setBranchError("");
        if (supplierType.length === 0) { setSupplierTypeError("Supplier type is required"); hasError = true; } else setSupplierTypeError("");
        if (showShippingAddress) {
            if (!country) { setCountryError("Country is required"); hasError = true; } else setCountryError("");
            if (!state) { setStateError("State is required"); hasError = true; } else setStateError("");
            if (!city) { setCityError("City is required"); hasError = true; } else setCityError("");
        } else {
            setCountryError("");
            setStateError("");
            setCityError("");
        }

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

        if (showShippingAddress) {
            if (!areaPinCode) {
                setPinCodeError("Pin Code is required");
                hasError = true;
            } else if (String(areaPinCode).length !== 6) {
                setPinCodeError("Pin Code must be exactly 6 digits");
                hasError = true;
            } else {
                setPinCodeError("");
            }
        } else {
            setPinCodeError("");
        }

        if (gstin) {
            const trimmedGstin = gstin.trim().toUpperCase();
            const lettersCount = (trimmedGstin.match(/[A-Z]/g) || []).length;
            const digitsCount = (trimmedGstin.match(/[0-9]/g) || []).length;

            const isValidGstin = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(trimmedGstin);
            const isUserPattern = (trimmedGstin.length === 15 && lettersCount === 10 && digitsCount === 5);

            if (!isValidGstin && !isUserPattern) {
                setGstinError("GSTIN must be exactly 15 characters (e.g., 10 letters and 5 numbers, or standard GSTIN format)");
                hasError = true;
            } else {
                setGstinError("");
            }
        } else {
            setGstinError("");
        }

        const fieldErrors = {};
        additionalFields.forEach(f => {
            if (f.required && (!f.value || !f.value.trim())) {
                fieldErrors[f.label] = `${f.label} is required`;
                hasError = true;
            }
        });
        setAdditionalErrors(fieldErrors);

        if (hasError) {
            toast.error("Please fill all required fields correctly.");
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
                                type="text" style={{
                                    boxSizing: 'border-box',
                                    width: '100%',
                                    padding: '14px 16px',
                                    borderRadius: '8px',
                                    border: supplierNameError ? '1px solid #FF4D4F' : '1px solid #E5E7EB',
                                    background: supplierNameError ? '#FFF1F0' : '#fff',
                                    fontSize: '14px',
                                    color: '#333',
                                    outline: 'none'
                                }} placeholder="Enter Supplier Name"
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
                                customStyles={{
                                    dropdown: {
                                        background: branchError ? '#FFF1F0' : '#fff',
                                        border: branchError ? '1px solid #FF4D4F' : '1px solid #E5E7EB',
                                        padding: '14px 16px',
                                        borderRadius: '8px',
                                        minHeight: '48px',
                                        boxSizing: 'border-box'
                                    }
                                }}
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
                                customStyles={{
                                    dropdown: {
                                        background: supplierTypeError ? '#FFF1F0' : '#fff',
                                        border: supplierTypeError ? '1px solid #FF4D4F' : '1px solid #E5E7EB',
                                        padding: '14px 16px',
                                        borderRadius: '8px',
                                        minHeight: '48px',
                                        boxSizing: 'border-box'
                                    }
                                }}
                            />
                            {supplierTypeError && <span style={{ color: '#FF4D4F', fontSize: '12px', marginTop: '4px', display: 'block' }}>{supplierTypeError}</span>}
                        </div>
                        <div className={styles.field}>
                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>
                                Phone Number <span style={{ color: '#FF4D4F' }}>*</span>
                            </label>
                            <input
                                type="text" style={{
                                    boxSizing: 'border-box',
                                    width: '100%',
                                    padding: '14px 16px',
                                    borderRadius: '8px',
                                    border: phoneError ? '1px solid #FF4D4F' : '1px solid #E5E7EB',
                                    background: phoneError ? '#FFF1F0' : '#fff',
                                    fontSize: '14px',
                                    color: '#333',
                                    outline: 'none'
                                }} placeholder="Enter Phone Number"
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
                                type="email" style={{
                                    boxSizing: 'border-box',
                                    width: '100%',
                                    padding: '14px 16px',
                                    borderRadius: '8px',
                                    border: emailError ? '1px solid #FF4D4F' : '1px solid #E5E7EB',
                                    background: emailError ? '#FFF1F0' : '#fff',
                                    fontSize: '14px',
                                    color: '#333',
                                    outline: 'none'
                                }} placeholder="Enter Email ID here"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (emailError) setEmailError("");
                                }}
                            />
                            {emailError && <span style={{ color: '#FF4D4F', fontSize: '12px', marginTop: '4px', display: 'block' }}>{emailError}</span>}
                        </div>
                        {enableGstin && (
                            <div className={styles.field}>
                                <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>GSTIN</label>
                                <input
                                    type="text" style={{
                                        boxSizing: 'border-box',
                                        width: '100%',
                                        padding: '14px 16px',
                                        borderRadius: '8px',
                                        border: gstinError ? '1px solid #FF4D4F' : '1px solid #E5E7EB',
                                        background: gstinError ? '#FFF1F0' : '#fff',
                                        fontSize: '14px',
                                        color: '#333',
                                        outline: 'none'
                                    }} placeholder="Enter GSTIN"
                                    value={gstin}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                                        if (val.length <= 15) {
                                            setGstin(val);
                                            if (gstinError) setGstinError("");
                                        }
                                    }}
                                />
                                {gstinError && <span style={{ color: '#FF4D4F', fontSize: '12px', marginTop: '4px', display: 'block' }}>{gstinError}</span>}
                            </div>
                        )}
                        {showSupplierGrouping && (
                            <div className={styles.field}>
                                <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>Group Name</label>
                                <div style={{ position: 'relative' }}>
                                    <select 
                                        style={{ boxSizing: 'border-box', width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '14px', color: '#333', appearance: 'none', outline: 'none', paddingRight: '40px' }} 
                                        value={groupName} 
                                        onChange={(e) => {
                                            if (e.target.value === "ADD_NEW_GROUP") {
                                                setShowGroupPopup(true);
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
                                    <FiChevronDown style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#777', pointerEvents: 'none', fontSize: '18px' }} />
                                </div>
                            </div>
                        )}

                        {/* Dynamic Additional Fields */}
                        {additionalFields.map((field, idx) => (
                            <div key={idx} className={styles.field}>
                                <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>
                                    {field.label} {field.required && <span style={{ color: '#FF4D4F' }}>*</span>}
                                </label>
                                <input
                                    type="text"
                                    style={{
                                        boxSizing: 'border-box',
                                        width: '100%',
                                        padding: '14px 16px',
                                        borderRadius: '8px',
                                        border: additionalErrors[field.label] ? '1px solid #FF4D4F' : '1px solid #E5E7EB',
                                        background: additionalErrors[field.label] ? '#FFF1F0' : '#fff',
                                        fontSize: '14px',
                                        color: '#333',
                                        outline: 'none'
                                    }}
                                    placeholder={`Enter ${field.label}`}
                                    value={field.value}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (field.dataType === "number" && val !== "" && !/^\d*\.?\d*$/.test(val)) {
                                            return; // Only allow numbers
                                        }
                                        setAdditionalFields(prev => prev.map((item, i) => i === idx ? { ...item, value: val } : item));
                                        if (additionalErrors[field.label]) {
                                            setAdditionalErrors(prev => {
                                                const next = { ...prev };
                                                delete next[field.label];
                                                return next;
                                            });
                                        }
                                    }}
                                />
                                {additionalErrors[field.label] && (
                                    <span style={{ color: '#FF4D4F', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                        {additionalErrors[field.label]}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '48px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#000', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px' }}>Assigning Products</h3>
                <div style={{ background: '#fff', padding: '48px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                    {assignedProducts.map((row, index) => (
                        <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '16px', alignItems: 'end', marginBottom: '16px' }}>
                            <div className={styles.field} style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>
                                    Products
                                </label>
                                <MultiSelectDropdown
                                    listItems={productsList}
                                    selectedIds={row.products}
                                    setSelectedIds={(ids) => {
                                        const next = [...assignedProducts];
                                        next[index].products = ids;
                                        setAssignedProducts(next);
                                    }}
                                    placeholder="Select Products here"
                                    customStyles={{
                                        dropdown: {
                                            background: '#fff',
                                            border: '1px solid #E5E7EB',
                                            padding: '14px 16px',
                                            borderRadius: '8px',
                                            minHeight: '48px',
                                            boxSizing: 'border-box'
                                        }
                                    }}
                                />
                            </div>
                            <div className={styles.field} style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>Tax Include/Exclude</label>
                                <div style={{ position: 'relative' }}>
                                    <select 
                                        style={{ boxSizing: 'border-box', width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '14px', color: '#333', appearance: 'none', outline: 'none', minHeight: '48px' }} 
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
                                    <FiChevronDown style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#777', pointerEvents: 'none', fontSize: '18px' }} />
                                </div>
                            </div>
                            <div className={styles.field} style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>GST Group</label>
                                <div style={{ position: 'relative' }}>
                                    <select 
                                        style={{ boxSizing: 'border-box', width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '14px', color: '#333', appearance: 'none', outline: 'none', minHeight: '48px' }} 
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
                                    <FiChevronDown style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#777', pointerEvents: 'none', fontSize: '18px' }} />
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
                            style={{
                                color: '#E93E64',
                                fontWeight: '600',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            + Assign Product
                        </span>
                    </div>
                </div>
            </div>

            {/* Section 2: Address Information */}
            {showShippingAddress && (
                <div style={{ marginBottom: '48px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#000', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px' }}>Address Information</h3>
                    <div style={{ background: '#fff', padding: '48px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px 48px' }}>
                            <div className={styles.field}>
                                <label style={{ fontSize: '14px', fontWeight: '500', color: '#000', marginBottom: '10px', display: 'block' }}>Country <span style={{ color: '#FF4D4F' }}>*</span></label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        style={{
                                            boxSizing: 'border-box',
                                            width: '100%',
                                            padding: '14px 16px',
                                            borderRadius: '8px',
                                            border: countryError ? '1px solid #FF4D4F' : '1px solid #E5E7EB',
                                            background: countryError ? '#FFF1F0' : '#fff',
                                            fontSize: '14px',
                                            color: country ? '#333' : '#777',
                                            appearance: 'none',
                                            outline: 'none'
                                        }}
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
                                        style={{
                                            boxSizing: 'border-box',
                                            width: '100%',
                                            padding: '14px 16px',
                                            borderRadius: '8px',
                                            border: stateError ? '1px solid #FF4D4F' : '1px solid #E5E7EB',
                                            background: stateError ? '#FFF1F0' : '#fff',
                                            fontSize: '14px',
                                            color: state ? '#333' : '#777',
                                            appearance: 'none',
                                            outline: 'none'
                                        }}
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
                                        style={{
                                            boxSizing: 'border-box',
                                            width: '100%',
                                            padding: '14px 16px',
                                            borderRadius: '8px',
                                            border: cityError ? '1px solid #FF4D4F' : '1px solid #E5E7EB',
                                            background: cityError ? '#FFF1F0' : '#fff',
                                            fontSize: '14px',
                                            color: city ? '#333' : '#777',
                                            appearance: 'none',
                                            outline: 'none'
                                        }}
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
                                    type="text" style={{
                                        boxSizing: 'border-box',
                                        width: '100%',
                                        padding: '14px 16px',
                                        borderRadius: '8px',
                                        border: pinCodeError ? '1px solid #FF4D4F' : '1px solid #E5E7EB',
                                        background: pinCodeError ? '#FFF1F0' : '#fff',
                                        fontSize: '14px',
                                        color: '#333',
                                        outline: 'none'
                                    }} placeholder="Enter Pin Code here"
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
            )}

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
            {showGroupPopup && (
                <div className={styles.overlay} style={{ zIndex: 2010, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className={styles.modal} style={{ maxWidth: '450px', height: 'auto', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', background: '#fff' }}>
                        <div className={styles.modalHeader} style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#000', margin: 0 }}>Add Group Name</h3>
                            <button className={styles.closeBtn} onClick={() => { setShowGroupPopup(false); setNewGroupName(""); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#999' }}><FiX /></button>
                        </div>
                        <div className={styles.modalContent} style={{ padding: '24px' }}>
                            <div className={styles.field} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontWeight: '500', color: '#000', fontSize: '14px' }}>Group Name <span style={{ color: 'red' }}>*</span></label>
                                <input 
                                    type="text" 
                                    style={{ boxSizing: 'border-box', width: '100%', padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                                    placeholder="Enter Group Name"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
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

export default SupplierForm;
