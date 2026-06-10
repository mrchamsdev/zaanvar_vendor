import React, { useState, useEffect, useRef } from "react";
import styles from "../../styles/customers/customerForm.module.css";
import { customerService } from "../../services/customerService";
import useStore from "../state/useStore";
import useDashboardData from "../dashboard/useDashboardData";
import { toast } from "sonner";
import MultiSelectDropdown from "../MultiSelectDropdown";
import { FiChevronDown, FiX } from "react-icons/fi";

const CustomerForm = ({ initialData, onSave, onBack, mode = 'Add', onChange }) => {
    const { jwtToken, userInfo } = useStore();
    const { branches } = useDashboardData();
    const [loading, setLoading] = useState(false);
    const [errorPopupMessage, setErrorPopupMessage] = useState(null);

    // Customer Details
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [veterinarianName, setVeterinarianName] = useState("");
    const [veterinarianNumber, setVeterinarianNumber] = useState("");
    const [alternatePhoneNumber, setAlternatePhoneNumber] = useState("");
    const [source, setSource] = useState("");
    const [idProof, setIdProof] = useState("");
    const [selectedBranchIds, setSelectedBranchIds] = useState([]);

    // Address Details
    const [serviceableAddress, setServiceableAddress] = useState("");
    const [locationLink, setLocationLink] = useState("");

    // Emergency Contact
    const [emergencyContactName, setEmergencyContactName] = useState("");
    const [emergencyMobileNumber, setEmergencyMobileNumber] = useState("");

    // Pets
    const [pets, setPets] = useState([]);
    const [customerId, setCustomerId] = useState(initialData?.vendorCustomerId || null);

    const [errors, setErrors] = useState({});
    const isInitialized = useRef(false);

    useEffect(() => {
        const fetchFullCustomerData = async () => {
            if (initialData?.vendorCustomerId && !isInitialized.current) {
                setCustomerId(initialData.vendorCustomerId);
                setLoading(true);
                try {
                    const res = await customerService.getCustomerById(jwtToken, initialData.vendorCustomerId);
                    const fullData = res?.data || res?.customer || res || initialData;
                    
                    setFirstName(fullData.firstName || "");
                    setLastName(fullData.lastName || "");
                    setPhone(fullData.phoneNumber || fullData.phone || "");
                    setEmail(fullData.email || "");
                    setVeterinarianName(fullData.veterinarianName || "");
                    setVeterinarianNumber(fullData.veterinarianNumber || "");
                    setAlternatePhoneNumber(fullData.alternatePhoneNumber || "");
                    setSource(fullData.Source?.source || fullData.Source || "");
                    setIdProof(fullData.uploadIDProof || "");
                    setSelectedBranchIds(
                        Array.isArray(fullData.branchIds) ? fullData.branchIds.map(Number) : 
                        (typeof fullData.branchIds === 'string' ? fullData.branchIds.split(',').map(Number) : 
                        (fullData.branchIds ? [Number(fullData.branchIds)] : []))
                    );
        
                    setServiceableAddress(fullData.serviceableAddress || "");
                    setLocationLink(fullData.locationLink || "");
                    setEmergencyContactName(fullData.emergencyContactName || "");
                    setEmergencyMobileNumber(fullData.emergencyMobileNumber || "");
        
                    if (fullData.pets && Array.isArray(fullData.pets)) {
                        setPets(fullData.pets.map(p => ({
                            id: p.petId || p._id || p.id || Date.now() + Math.random(),
                            petPhoto: p.photo || "",
                            petType: p.petType ? (p.petType.toLowerCase() === 'cat' ? 'Cat' : 'Dog') : "Dog",
                            petName: p.petName || "",
                            petBreed: p.breed || "",
                            petGender: p.gender || "",
                            ageType: p.dateOfBirth ? "exact" : "approx",
                            years: p.approximateAge ? p.approximateAge.split(' ')[0] : "",
                            months: "",
                            dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : "",
                            isNeutered: p.isSpayedOrNeutered === true,
                            isUnknown: p.isSpayedOrNeutered === null,
                            bloodType: p.bloodType || "",
                            weight: p.weight || "",
                            microchipNo: p.microchipNo || "",
                            rabiesTag: p.rabiesTag || "",
                            notes: p.medicalNotes || ""
                        })));
                    } else {
                        setPets([]);
                    }
                } catch (err) {
                    console.error("Error fetching full customer data", err);
                } finally {
                    setLoading(false);
                    isInitialized.current = true;
                }
            } else if (initialData && Object.keys(initialData).length > 0 && !isInitialized.current) {
                if (initialData.vendorCustomerId) setCustomerId(initialData.vendorCustomerId);
                setFirstName(initialData.firstName || "");
                setLastName(initialData.lastName || "");
                setPhone(initialData.phoneNumber || "");
                setEmail(initialData.email || "");
                setVeterinarianName(initialData.veterinarianName || "");
                setVeterinarianNumber(initialData.veterinarianNumber || "");
                setAlternatePhoneNumber(initialData.alternatePhoneNumber || "");
                setSource(initialData.Source?.source || initialData.Source || "");
                setIdProof(initialData.uploadIDProof || "");
                setSelectedBranchIds(
                    Array.isArray(initialData.branchIds) ? initialData.branchIds.map(Number) : 
                    (typeof initialData.branchIds === 'string' ? initialData.branchIds.split(',').map(Number) : 
                    (initialData.branchIds ? [Number(initialData.branchIds)] : []))
                );
    
                setServiceableAddress(initialData.serviceableAddress || "");
                setLocationLink(initialData.locationLink || "");
                setEmergencyContactName(initialData.emergencyContactName || "");
                setEmergencyMobileNumber(initialData.emergencyMobileNumber || "");
    
                if (initialData.pets && Array.isArray(initialData.pets)) {
                    setPets(initialData.pets.map(p => ({
                        id: p.petId || p._id || p.id || Date.now() + Math.random(),
                        petPhoto: p.photo || "",
                        petType: p.petType ? (p.petType.toLowerCase() === 'cat' ? 'Cat' : 'Dog') : "Dog",
                        petName: p.petName || "",
                        petBreed: p.breed || "",
                        petGender: p.gender || "",
                        ageType: p.dateOfBirth ? "exact" : "approx",
                        years: p.approximateAge ? p.approximateAge.split(' ')[0] : "",
                        months: "",
                        dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : "",
                        isNeutered: p.isSpayedOrNeutered === true,
                        isUnknown: p.isSpayedOrNeutered === null,
                        bloodType: p.bloodType || "",
                        weight: p.weight || "",
                        microchipNo: p.microchipNo || "",
                        rabiesTag: p.rabiesTag || "",
                        notes: p.medicalNotes || ""
                    })));
                } else {
                    setPets([]);
                }
                isInitialized.current = true;
            }
        };

        fetchFullCustomerData();
    }, [initialData, jwtToken]);

    useEffect(() => {
        if (!isInitialized.current && mode === 'Add') {
            setPets([{
                id: Date.now(),
                petPhoto: "",
                petType: "Dog",
                petName: "",
                petBreed: "",
                petGender: "",
                ageType: "approx",
                years: "",
                months: "",
                dateOfBirth: "",
                isNeutered: false,
                isUnknown: false,
                bloodType: "",
                weight: "",
                microchipNo: "",
                rabiesTag: "",
                notes: ""
            }]);
            isInitialized.current = true;
        }
    }, [mode]);

    useEffect(() => {
        if (onChange && isInitialized.current) {
            onChange({
                vendorCustomerId: customerId,
                firstName, lastName, phone, email, pets
            });
        }
    }, [firstName, lastName, phone, email, pets, customerId]);

    const branchesList = (branches || []).map(br => ({
        id: Number(br.id || br._id || br.branchId),
        name: br.name || br.branchName
    }));

    const handleAddPet = () => {
        setPets([...pets, {
            id: Date.now(),
            petPhoto: "",
            petType: "Dog",
            petName: "",
            petBreed: "",
            petGender: "",
            ageType: "approx",
            years: "",
            months: "",
            dateOfBirth: "",
            isNeutered: false,
            isUnknown: false,
            bloodType: "",
            weight: "",
            microchipNo: "",
            rabiesTag: "",
            notes: ""
        }]);
    };

    const updatePet = (id, field, value) => {
        setPets(pets.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const removePet = (id) => {
        setPets(pets.filter(p => p.id !== id));
    };

    const handleSave = async () => {
        let newErrors = {};
        if (!firstName) newErrors.firstName = "First name is required";
        if (!phone) newErrors.phone = "Phone number is required";
        else if (phone.length !== 10) newErrors.phone = "Phone number must be exactly 10 digits";
        if (selectedBranchIds.length === 0) newErrors.branch = "Branch is required";

        pets.forEach((p, idx) => {
            if (p.microchipNo && p.microchipNo.length !== 15) {
                newErrors[`pet_${idx}_microchip`] = "Must be exactly 15 digits";
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error("Please fix the highlighted errors before saving");
            return;
        }

        const payload = {
            firstName,
            lastName,
            email,
            phoneNumber: phone,
            alternatePhoneNumber,
            veterinarianName,
            veterinarianNumber,
            Source: source ? { source } : null,
            uploadIDProof: typeof idProof === 'string' ? idProof : null,
            branchIds: selectedBranchIds,
            serviceableAddress,
            locationLink,
            emergencyContactName,
            emergencyMobileNumber,
            pets: pets.map(p => ({
                petName: p.petName,
                petType: p.petType,
                breed: p.petBreed,
                gender: p.petGender,
                approximateAge: p.ageType === 'approx' ? `${p.years} years ${p.months} months` : null,
                dateOfBirth: p.ageType === 'exact' ? p.dateOfBirth : null,
                weight: parseFloat(p.weight) || null,
                microchipNo: p.microchipNo,
                rabiesTag: p.rabiesTag,
                bloodType: p.bloodType,
                isSpayedOrNeutered: p.isUnknown ? null : p.isNeutered,
                medicalNotes: p.notes,
                photo: typeof p.petPhoto === 'string' ? p.petPhoto : null
            }))
        };

        setLoading(true);
        try {
            if (mode === 'Edit' && !customerId) {
                toast.error("Internal Error: Customer ID is missing. Please close this tab and reopen it.");
                setLoading(false);
                return;
            }

            let res;
            const uploadImagesSequentially = async (customerRefId, resData) => {
                const responsePets = resData?.pets || resData?.data?.pets || resData?.customer?.pets || [];
                
                if (idProof instanceof File) {
                    const idFormData = new FormData();
                    idFormData.append('uploadIDProof', idProof);
                    await customerService.updateCustomer(jwtToken, customerRefId, idFormData);
                }

                for (let i = 0; i < pets.length; i++) {
                    if (pets[i].petPhoto instanceof File) {
                        const petFormData = new FormData();
                        petFormData.append('photo', pets[i].petPhoto);
                        
                        let petId = responsePets[i]?.petId || responsePets[i]?._id || responsePets[i]?.id;
                        if (!petId && customerId) {
                            if (typeof pets[i].id === 'number' && pets[i].id > 1000000000000) {
                                // Skip if local temporary ID and backend didn't return a real one
                            } else {
                                petId = pets[i].id; 
                            }
                        }
                        
                        if (petId) {
                            petFormData.append('petId', petId);
                            await customerService.updateCustomer(jwtToken, customerRefId, petFormData);
                        }
                    }
                }
            };

            if (customerId) {
                res = await customerService.updateCustomer(jwtToken, customerId, payload);
                if (res && (res.status === "success" || res.status === 200)) {
                    await uploadImagesSequentially(customerId, res);
                }
            } else {
                res = await customerService.createCustomer(jwtToken, payload);
                if (res && (res.status === "success" || res.status === 200)) {
                    const newId = res.vendorCustomerId || res.data?.vendorCustomerId || res.data?._id || res.data?.id;
                    if (newId) {
                        await uploadImagesSequentially(newId, res);
                    }
                }
            }

            if (res && (res.status === "success" || res.status === 200)) {
                toast.success(customerId ? "Customer updated successfully" : "Customer added successfully");
                onSave();
            } else {
                toast.error(res?.msg || res?.message || "Failed to save customer");
            }
        } catch (e) {
            toast.error("An error occurred while saving customer");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.formLayout}>
            
            {/* Left side: scrollable form */}
            <div className={styles.leftPanel}>
                {/* Customer Details */}
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Customer Details</h3>
                </div>
            <div className={styles.sectionContainer}>
                <div className={styles.grid2}>
                    <div>
                        <label className={styles.labelStyle}>First name <span className={styles.asterisk}>*</span></label>
                        <input type="text" className={styles.inputStyle} placeholder="Enter first name" value={firstName} onChange={e => { setFirstName(e.target.value); setErrors({ ...errors, firstName: null }) }} />
                        {errors.firstName && <span className={styles.errorText}>{errors.firstName}</span>}
                    </div>
                    <div>
                        <label className={styles.labelStyle}>Last Name</label>
                        <input type="text" className={styles.inputStyle} placeholder="Enter last name" value={lastName} onChange={e => setLastName(e.target.value)} />
                    </div>
                    <div>
                        <label className={styles.labelStyle}>Phone Number <span className={styles.asterisk}>*</span></label>
                        <input type="text" className={styles.inputStyle} placeholder="Enter Phone Number" maxLength={10} value={phone} onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            setPhone(val);
                            setErrors({ ...errors, phone: null });
                        }} />
                        {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
                    </div>
                    <div>
                        <label className={styles.labelStyle}>Email (Optional)</label>
                        <input type="email" className={styles.inputStyle} placeholder="Enter mail id" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div>
                        <label className={styles.labelStyle}>Veterinarian Name (Optional)</label>
                        <input type="text" className={styles.inputStyle} placeholder="Enter Veterinarian Name" value={veterinarianName} onChange={e => setVeterinarianName(e.target.value)} />
                    </div>
                    <div>
                        <label className={styles.labelStyle}>Veterinarian Number (Optional)</label>
                        <input type="text" className={styles.inputStyle} placeholder="Enter Veterinarian Number" value={veterinarianNumber} onChange={e => setVeterinarianNumber(e.target.value)} />
                    </div>
                    <div>
                        <label className={styles.labelStyle}>Alternate Phone Number (Optional)</label>
                        <input type="text" className={styles.inputStyle} placeholder="Enter Alternate Phone Number" maxLength={10} value={alternatePhoneNumber} onChange={e => setAlternatePhoneNumber(e.target.value.replace(/\D/g, ''))} />
                    </div>
                    <div>
                        <label className={styles.labelStyle}>Branch <span className={styles.asterisk}>*</span></label>
                        <MultiSelectDropdown
                            listItems={branchesList}
                            selectedIds={selectedBranchIds}
                            setSelectedIds={(ids) => {
                                setSelectedBranchIds(ids.map(Number));
                                setErrors({ ...errors, branch: null });
                            }}
                            placeholder="Select Branch"
                            customStyles={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '6px 16px', borderRadius: '8px' }}
                        />
                        {errors.branch && <span className={styles.errorText}>{errors.branch}</span>}
                    </div>
                    <div>
                        <label className={styles.labelStyle}>Source (Optional)</label>
                        <div className={styles.relative}>
                            <select className={styles.inputStyleSelect} value={source} onChange={e => setSource(e.target.value)}>
                                <option value="">Select here</option>
                                <option value="Walk-in">Walk-in</option>
                                <option value="Referral">Referral</option>
                                <option value="Instagram">Instagram</option>
                            </select>
                            <FiChevronDown className={styles.selectChevron} />
                        </div>
                    </div>
                    <div>
                        <label className={styles.labelStyle}>ID Proof (optional)</label>
                        <div className={styles.fileInputContainer}>
                            <label className={styles.fileInputBtn}>
                                Choose file
                                <input type="file" className={styles.hidden} onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setIdProof(e.target.files[0]);
                                    }
                                }} accept="image/*,.pdf" />
                            </label>
                            <span className={styles.fileName}>
                                {idProof ? (idProof.name || (typeof idProof === 'string' ? idProof.split('/').pop() : "File Selected")) : "No file Choosen"}
                            </span>
                            {idProof && (
                                <button type="button" onClick={() => setIdProof("")} className={styles.removeBtn}>Remove</button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Address Details */}
            <div className={styles.sectionTitleMargin}>
                <h3 className={styles.sectionTitle}>Address Details <span className={styles.optionalText}>(Optional)</span></h3>
            </div>
            <div className={styles.sectionContainer}>
                <div className={styles.flexCol}>
                    <div>
                        <label className={styles.labelStyle}>Serviceable Address (Optional)</label>
                        <textarea className={`${styles.inputStyle} ${styles.textAreaStyle}`} placeholder="Please enter your address here for the groomer to refer to" value={serviceableAddress} onChange={e => setServiceableAddress(e.target.value)}></textarea>
                    </div>
                    <div>
                        <label className={styles.labelStyle}>Location Link (Optional)</label>
                        <input type="text" className={styles.inputStyle} placeholder="Paste google map location link here" value={locationLink} onChange={e => setLocationLink(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Emergency Contact */}
            <div className={styles.sectionTitleMargin}>
                <h3 className={styles.sectionTitle}>Emergency Contact Details <span className={styles.optionalText}>(Optional)</span></h3>
            </div>
            <div className={styles.sectionContainer}>
                <div className={styles.grid2}>
                    <div>
                        <label className={styles.labelStyle}>Emergency Contact Name (Optional)</label>
                        <input type="text" className={styles.inputStyle} placeholder="Enter Emergency Contact Name" value={emergencyContactName} onChange={e => setEmergencyContactName(e.target.value)} />
                    </div>
                    <div>
                        <label className={styles.labelStyle}>Mobile Number (Optional)</label>
                        <input type="text" className={styles.inputStyle} placeholder="Enter Mobile Number" maxLength={10} value={emergencyMobileNumber} onChange={e => setEmergencyMobileNumber(e.target.value.replace(/\D/g, ''))} />
                    </div>
                </div>
            </div>

            {/* Pet Details */}
            <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Pet Details</h3>
                <button onClick={handleAddPet} className={styles.addPetBtn}>+ Add Pet</button>
            </div>

            {pets.map((pet, index) => (
                <div key={pet.id} className={styles.petContainer}>
                    {pets.length > 1 && (
                        <button onClick={() => removePet(pet.id)} className={styles.removePetBtn}><FiX size={20} /></button>
                    )}

                    <h4 className={styles.petSubtitle}>Pet Profile Photo</h4>
                    <div className={styles.petPhotoSection}>
                        <div className={styles.petPhotoCircle}>
                            {pet.petPhoto && (typeof pet.petPhoto === 'object' ? (
                                <img src={URL.createObjectURL(pet.petPhoto)} alt="Pet" className={styles.petPhotoImg} />
                            ) : (
                                <img src={pet.petPhoto} alt="Pet" className={styles.petPhotoImg} />
                            ))}
                        </div>
                        <div>
                            <div className={styles.photoInstructionTitle}>Upload Pet Photo <span className={styles.optionalText}>(Optional)</span></div>
                            <div className={styles.photoInstructionSub}>File size not more than 2 MB</div>
                            {pet.petPhoto && typeof pet.petPhoto === 'object' && (
                                <div className={styles.photoFileName}>{pet.petPhoto.name}</div>
                            )}
                        </div>
                        <div className={styles.photoActions}>
                            <label className={styles.uploadPhotoBtn}>
                                {pet.petPhoto ? "Change Picture" : "Upload Picture"}
                                <input type="file" className={styles.hidden} accept="image/*" onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        updatePet(pet.id, 'petPhoto', e.target.files[0]);
                                    }
                                }} />
                            </label>
                            {pet.petPhoto && (
                                <button type="button" onClick={() => updatePet(pet.id, 'petPhoto', "")} className={styles.removePhotoBtn}>Remove</button>
                            )}
                        </div>
                    </div>

                    <div className={styles.grid2}>
                        <div>
                            <label className={styles.labelStyle}>Pet Type</label>
                            <div className={styles.flexRow}>
                                <label className={styles.radioLabel}>
                                    <input type="radio" checked={pet.petType === 'Dog'} className={styles.radioInput} onChange={() => updatePet(pet.id, 'petType', 'Dog')} /> Dog
                                </label>
                                <label className={styles.radioLabel}>
                                    <input type="radio" checked={pet.petType === 'Cat'} className={styles.radioInput} onChange={() => updatePet(pet.id, 'petType', 'Cat')} /> Cat
                                </label>
                            </div>
                        </div>
                        <div className={`${styles.grid2} ${styles.gridFull}`}>
                            <div>
                                <label className={styles.labelStyle}>Pet name</label>
                                <input type="text" className={styles.inputStyle} placeholder="Enter Pet name" value={pet.petName} onChange={e => updatePet(pet.id, 'petName', e.target.value)} />
                            </div>
                            <div>
                                <label className={styles.labelStyle}>Pet Breed</label>
                                <div className={styles.relative}>
                                    <select className={styles.inputStyleSelect} value={pet.petBreed} onChange={e => updatePet(pet.id, 'petBreed', e.target.value)}>
                                        <option value="">Select here</option>
                                        <option value="Golden Retriever">Golden Retriever</option>
                                        <option value="German Shepherd">German Shepherd</option>
                                        <option value="Siamese">Siamese</option>
                                    </select>
                                    <FiChevronDown className={styles.selectChevron} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className={styles.labelStyle}>Pet Gender</label>
                            <div className={styles.relative}>
                                <select className={styles.inputStyleSelect} value={pet.petGender} onChange={e => updatePet(pet.id, 'petGender', e.target.value)}>
                                    <option value="">Select here</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                                <FiChevronDown className={styles.selectChevron} />
                            </div>
                        </div>
                    </div>

                    <div className={styles.sectionTitleMargin}>
                        <label className={styles.labelStyle}>Pet Age</label>
                        <div className={styles.petAgeSection}>
                            <label className={styles.radioLabelSimple}>
                                <input type="radio" checked={pet.ageType === 'approx'} className={styles.radioInput} onChange={() => updatePet(pet.id, 'ageType', 'approx')} /> Approximate Age
                            </label>
                            {pet.ageType === 'approx' && (
                                <div className={styles.petAgeGrid}>
                                    <div>
                                        <label className={styles.labelStyle}>Years</label>
                                        <input type="number" className={styles.inputStyle} value={pet.years} onChange={e => updatePet(pet.id, 'years', e.target.value)} placeholder="0" />
                                    </div>
                                    <div>
                                        <label className={styles.labelStyle}>Months</label>
                                        <input type="number" className={styles.inputStyle} value={pet.months} onChange={e => updatePet(pet.id, 'months', e.target.value)} placeholder="0" />
                                    </div>
                                </div>
                            )}

                            <label className={styles.radioLabelSimple}>
                                <input type="radio" checked={pet.ageType === 'exact'} className={styles.radioInput} onChange={() => updatePet(pet.id, 'ageType', 'exact')} /> Exact Age
                            </label>
                            {pet.ageType === 'exact' && (
                                <div className={styles.petAgeExact}>
                                    <label className={styles.labelStyle}>Date of Birth</label>
                                    <input type="date" className={styles.inputStyle} value={pet.dateOfBirth} onChange={e => updatePet(pet.id, 'dateOfBirth', e.target.value)} />
                                </div>
                            )}
                        </div>
                    </div>

                    <h4 className={styles.petSubtitle}>Pet Medical Information <span className={styles.optionalText}>(Optional)</span></h4>
                    <div className={styles.petMedicalSection}>
                        <div className={styles.flexRow} style={{ marginBottom: '24px' }}>
                            <label className={styles.radioLabelSimple}>
                                <input type="radio" checked={pet.isNeutered} className={styles.radioInput} onChange={e => {
                                    setPets(pets.map(p => p.id === pet.id ? { ...p, isNeutered: true, isUnknown: false } : p));
                                }} onClick={e => {
                                    if (pet.isNeutered) {
                                        e.preventDefault();
                                        setPets(pets.map(p => p.id === pet.id ? { ...p, isNeutered: false } : p));
                                    }
                                }} /> Neutered
                            </label>
                            <label className={styles.radioLabelSimple}>
                                <input type="radio" checked={pet.isUnknown} className={styles.radioInput} onChange={e => {
                                    setPets(pets.map(p => p.id === pet.id ? { ...p, isUnknown: true, isNeutered: false } : p));
                                }} onClick={e => {
                                    if (pet.isUnknown) {
                                        e.preventDefault();
                                        setPets(pets.map(p => p.id === pet.id ? { ...p, isUnknown: false } : p));
                                    }
                                }} /> Unknown
                            </label>
                        </div>

                        <div className={styles.grid2}>
                            <div>
                                <label className={styles.labelStyle}>Blood Type (Optional)</label>
                                <div className={styles.relative}>
                                    <select className={styles.inputStyleSelect} value={pet.bloodType} onChange={e => updatePet(pet.id, 'bloodType', e.target.value)}>
                                        <option value="">Select Blood Type</option>
                                        <option value="DEA 1.1">DEA 1.1</option>
                                        <option value="DEA 1.2">DEA 1.2</option>
                                    </select>
                                    <FiChevronDown className={styles.selectChevron} />
                                </div>
                            </div>
                            <div>
                                <label className={styles.labelStyle}>Weight (Optional)</label>
                                <div className={styles.relative}>
                                    <input type="text" className={styles.inputStyle} placeholder="Enter Weight" value={pet.weight} onChange={e => updatePet(pet.id, 'weight', e.target.value)} />
                                    <span className={styles.weightUnit}>KG <FiChevronDown style={{ verticalAlign: 'middle', marginLeft: '4px' }} /></span>
                                </div>
                            </div>
                            <div>
                                <label className={styles.labelStyle}>Microchip ID (Optional)</label>
                                <input type="text" className={styles.inputStyle} placeholder="Enter Microchip ID" maxLength={15} value={pet.microchipNo} onChange={e => {
                                    updatePet(pet.id, 'microchipNo', e.target.value.replace(/\D/g, ''));
                                    if (errors[`pet_${index}_microchip`]) {
                                        setErrors({ ...errors, [`pet_${index}_microchip`]: null });
                                    }
                                }} />
                                {errors[`pet_${index}_microchip`] && <span className={styles.errorText}>{errors[`pet_${index}_microchip`]}</span>}
                            </div>
                            <div>
                                <label className={styles.labelStyle}>Rabies Tag (Optional)</label>
                                <input type="text" className={styles.inputStyle} placeholder="Enter Rabies Tag" value={pet.rabiesTag} onChange={e => updatePet(pet.id, 'rabiesTag', e.target.value)} />
                            </div>
                            <div className={styles.gridFull}>
                                <label className={styles.labelStyle}>Notes (Optional)</label>
                                <textarea className={`${styles.inputStyle} ${styles.textAreaStyle}`} placeholder="Enter here..." value={pet.notes} onChange={e => updatePet(pet.id, 'notes', e.target.value)}></textarea>
                            </div>
                        </div>
                    </div>

                </div>
            ))}

            <div className={styles.footer}>
                <button
                    className={styles.cancelBtn}
                    onClick={onBack}
                >
                    Cancel
                </button>
                <button
                    className={styles.saveBtn}
                    onClick={handleSave}
                    disabled={loading}
                >
                    {loading ? "Saving..." : "Save"}
                </button>
            </div>
            </div>

            {/* Right side: sticky summary */}
            <div className={styles.rightPanel}>
                <h3 className={styles.summaryTitle}>Summary</h3>
                
                <h4 className={styles.summarySectionTitle}>Customer Details</h4>
                <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Source</span>
                    <span className={styles.summaryValue}>{source || 'Unknown'}</span>
                </div>
                <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Customer Name</span>
                    <span className={styles.summaryValue}>{`${firstName} ${lastName}`.trim() || '-'}</span>
                </div>
                <div className={styles.summaryRowSpaced}>
                    <span className={styles.summaryLabel}>Mobile Number</span>
                    <span className={styles.summaryValue}>{phone ? `+91 ${phone}` : '-'}</span>
                </div>

                <h4 className={styles.summarySectionTitle}>Pet Details</h4>
                {pets.map((pet, idx) => (
                    <div key={pet.id} className={`${styles.petSummaryBlock} ${idx === pets.length - 1 ? styles.petSummaryBlockLast : ''}`}>
                        <div className={styles.summaryRow}>
                            <span className={styles.summaryLabel}>Pet Type</span>
                            <span className={styles.summaryValue}>{pet.petType || '-'}</span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span className={styles.summaryLabel}>Pet Name</span>
                            <span className={styles.summaryValue}>{pet.petName || '-'}</span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span className={styles.summaryLabel}>Breed</span>
                            <span className={styles.summaryValue}>{pet.petBreed || '-'}</span>
                        </div>
                        {pet.ageType === 'exact' ? (
                            <div className={styles.summaryRow}>
                                <span className={styles.summaryLabel}>Date of Birth</span>
                                <span className={styles.summaryValue}>{pet.dateOfBirth ? new Date(pet.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '-'}</span>
                            </div>
                        ) : (
                            <div className={styles.summaryRow}>
                                <span className={styles.summaryLabel}>Age</span>
                                <span className={styles.summaryValue}>{(pet.years || pet.months) ? `${pet.years || 0}y ${pet.months || 0}m` : '-'}</span>
                            </div>
                        )}
                        <div className={styles.summaryRow}>
                            <span className={styles.summaryLabel}>Gender</span>
                            <span className={styles.summaryValue}>{pet.petGender || '-'}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CustomerForm;
