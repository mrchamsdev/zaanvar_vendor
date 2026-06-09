import React, { useState, useEffect, useRef } from "react";
import styles from "../../styles/purchase-bill/purchase-out.module.css";
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

    const [errors, setErrors] = useState({});
    const isInitialized = useRef(false);

    useEffect(() => {
        if (initialData && Object.keys(initialData).length > 0 && !isInitialized.current) {
            setFirstName(initialData.firstName || "");
            setLastName(initialData.lastName || "");
            setPhone(initialData.phoneNumber || "");
            setEmail(initialData.email || "");
            setVeterinarianName(initialData.veterinarianName || "");
            setVeterinarianNumber(initialData.veterinarianNumber || "");
            setAlternatePhoneNumber(initialData.alternatePhoneNumber || "");
            setSource(initialData.Source?.source || initialData.Source || "");
            setIdProof(initialData.uploadIDProof || "");
            setSelectedBranchIds(initialData.branchIds?.map(Number) || []);
            
            // If they are in metadata or we have standard fields
            setServiceableAddress(initialData.serviceableAddress || "");
            setLocationLink(initialData.locationLink || "");
            setEmergencyContactName(initialData.emergencyContactName || "");
            setEmergencyMobileNumber(initialData.emergencyMobileNumber || "");

            if (initialData.pets && Array.isArray(initialData.pets)) {
                setPets(initialData.pets.map(p => ({
                    id: p.petId || Date.now() + Math.random(),
                    petPhoto: p.photo || "",
                    petType: p.petType || "Dog",
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
    }, [initialData]);

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
                firstName, lastName, phone, email, pets
            });
        }
    }, [firstName, lastName, phone, email, pets]);

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
        if (selectedBranchIds.length === 0) newErrors.branch = "Branch is required";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
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
            uploadIDProof: idProof,
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
                photo: p.petPhoto
            }))
        };

        setLoading(true);
        try {
            let res;
            if (initialData?.vendorCustomerId) {
                res = await customerService.updateCustomer(jwtToken, initialData.vendorCustomerId, payload);
            } else {
                res = await customerService.createCustomer(jwtToken, payload);
            }

            if (res && (res.status === "success" || res.status === 200)) {
                toast.success(initialData?.vendorCustomerId ? "Customer updated successfully" : "Customer added successfully");
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

    const sectionTitleStyle = { fontSize: '16px', fontWeight: '700', color: '#111', marginBottom: '20px' };
    const sectionContainerStyle = { background: '#fff', padding: '32px', borderRadius: '12px', border: '1px solid #E5E7EB', marginBottom: '32px' };
    const inputStyle = { boxSizing: 'border-box', width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F9FAFB', fontSize: '14px', color: '#333', outline: 'none' };
    const labelStyle = { fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '8px', display: 'block' };

    return (
        <div style={{ boxSizing: 'border-box', width: '100%', background: '#fff', padding: '32px', minHeight: '100%', fontFamily: "'Inter', sans-serif" }}>
            
            {/* Customer Details */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={sectionTitleStyle}>Customer Details</h3>
            </div>
            <div style={sectionContainerStyle}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 32px' }}>
                    <div>
                        <label style={labelStyle}>First name <span style={{ color: '#FF4D4F' }}>*</span></label>
                        <input type="text" style={inputStyle} placeholder="Enter first name" value={firstName} onChange={e => {setFirstName(e.target.value); setErrors({...errors, firstName: null})}} />
                        {errors.firstName && <span style={{ color: '#FF4D4F', fontSize: '12px', marginTop: '4px' }}>{errors.firstName}</span>}
                    </div>
                    <div>
                        <label style={labelStyle}>Last Name</label>
                        <input type="text" style={inputStyle} placeholder="Enter last name" value={lastName} onChange={e => setLastName(e.target.value)} />
                    </div>
                    <div>
                        <label style={labelStyle}>Phone Number <span style={{ color: '#FF4D4F' }}>*</span></label>
                        <input type="text" style={inputStyle} placeholder="Enter Phone Number" value={phone} onChange={e => {setPhone(e.target.value); setErrors({...errors, phone: null})}} />
                        {errors.phone && <span style={{ color: '#FF4D4F', fontSize: '12px', marginTop: '4px' }}>{errors.phone}</span>}
                    </div>
                    <div>
                        <label style={labelStyle}>Email (Optional)</label>
                        <input type="email" style={inputStyle} placeholder="Enter mail id" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div>
                        <label style={labelStyle}>Veterinarian Name (Optional)</label>
                        <input type="text" style={inputStyle} placeholder="Enter Veterinarian Name" value={veterinarianName} onChange={e => setVeterinarianName(e.target.value)} />
                    </div>
                    <div>
                        <label style={labelStyle}>Veterinarian Number (Optional)</label>
                        <input type="text" style={inputStyle} placeholder="Enter Veterinarian Number" value={veterinarianNumber} onChange={e => setVeterinarianNumber(e.target.value)} />
                    </div>
                    <div>
                        <label style={labelStyle}>Alternate Phone Number (Optional)</label>
                        <input type="text" style={inputStyle} placeholder="Enter Alternate Phone Number" value={alternatePhoneNumber} onChange={e => setAlternatePhoneNumber(e.target.value)} />
                    </div>
                    <div>
                        <label style={labelStyle}>Branch <span style={{ color: '#FF4D4F' }}>*</span></label>
                        <MultiSelectDropdown
                            listItems={branchesList}
                            selectedIds={selectedBranchIds}
                            setSelectedIds={(ids) => {
                                setSelectedBranchIds(ids.map(Number));
                                setErrors({...errors, branch: null});
                            }}
                            placeholder="Select Branch"
                            customStyles={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '6px 16px', borderRadius: '8px' }}
                        />
                        {errors.branch && <span style={{ color: '#FF4D4F', fontSize: '12px', marginTop: '4px' }}>{errors.branch}</span>}
                    </div>
                    <div>
                        <label style={labelStyle}>Source (Optional)</label>
                        <div style={{ position: 'relative' }}>
                            <select style={{...inputStyle, appearance: 'none'}} value={source} onChange={e => setSource(e.target.value)}>
                                <option value="">Select here</option>
                                <option value="Walk-in">Walk-in</option>
                                <option value="Referral">Referral</option>
                                <option value="Instagram">Instagram</option>
                            </select>
                            <FiChevronDown style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#777', pointerEvents: 'none' }} />
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}>ID Proof (optional)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', ...inputStyle, padding: '4px' }}>
                            <label style={{ background: '#6B7280', color: '#fff', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                                Choose file
                                <input type="file" style={{ display: 'none' }} />
                            </label>
                            <span style={{ fontSize: '13px', color: '#888' }}>No file Choosen</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Address Details */}
            <div style={{ marginBottom: '16px' }}>
                <h3 style={sectionTitleStyle}>Address Details <span style={{color: '#888', fontWeight: 500, fontSize: '14px'}}>(Optional)</span></h3>
            </div>
            <div style={sectionContainerStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                        <label style={labelStyle}>Serviceable Address (Optional)</label>
                        <textarea style={{...inputStyle, minHeight: '80px', resize: 'vertical'}} placeholder="Please enter your address here for the groomer to refer to" value={serviceableAddress} onChange={e => setServiceableAddress(e.target.value)}></textarea>
                    </div>
                    <div>
                        <label style={labelStyle}>Location Link (Optional)</label>
                        <input type="text" style={inputStyle} placeholder="Paste google map location link here" value={locationLink} onChange={e => setLocationLink(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Emergency Contact */}
            <div style={{ marginBottom: '16px' }}>
                <h3 style={sectionTitleStyle}>Emergency Contact Details <span style={{color: '#888', fontWeight: 500, fontSize: '14px'}}>(Optional)</span></h3>
            </div>
            <div style={sectionContainerStyle}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 32px' }}>
                    <div>
                        <label style={labelStyle}>Emergency Contact Name (Optional)</label>
                        <input type="text" style={inputStyle} placeholder="Enter Emergency Contact Name" value={emergencyContactName} onChange={e => setEmergencyContactName(e.target.value)} />
                    </div>
                    <div>
                        <label style={labelStyle}>Mobile Number (Optional)</label>
                        <input type="text" style={inputStyle} placeholder="Enter Mobile Number" value={emergencyMobileNumber} onChange={e => setEmergencyMobileNumber(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Pet Details */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={sectionTitleStyle}>Pet Details</h3>
                <button onClick={handleAddPet} style={{ color: '#E9315D', background: 'none', border: 'none', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>+ Add Pet</button>
            </div>
            
            {pets.map((pet, index) => (
                <div key={pet.id} style={{...sectionContainerStyle, position: 'relative'}}>
                    {pets.length > 1 && (
                        <button onClick={() => removePet(pet.id)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}><FiX size={20}/></button>
                    )}
                    
                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Pet Profile Photo</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#E5E7EB' }}></div>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: '500' }}>Upload Pet Photo <span style={{color: '#888'}}>(Optional)</span></div>
                            <div style={{ fontSize: '11px', color: '#E9315D' }}>File size not more than 2 MB</div>
                        </div>
                        <button style={{ marginLeft: 'auto', background: '#000', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Upload Picture</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 32px', marginBottom: '32px' }}>
                        <div>
                            <label style={labelStyle}>Pet Type</label>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', ...inputStyle, cursor: 'pointer' }}>
                                    <input type="radio" name={`petType_${pet.id}`} checked={pet.petType === 'Dog'} onChange={() => updatePet(pet.id, 'petType', 'Dog')} /> Dog
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', ...inputStyle, cursor: 'pointer' }}>
                                    <input type="radio" name={`petType_${pet.id}`} checked={pet.petType === 'Cat'} onChange={() => updatePet(pet.id, 'petType', 'Cat')} /> Cat
                                </label>
                            </div>
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                            <div>
                                <label style={labelStyle}>Pet name</label>
                                <input type="text" style={inputStyle} placeholder="Enter Pet name" value={pet.petName} onChange={e => updatePet(pet.id, 'petName', e.target.value)} />
                            </div>
                            <div>
                                <label style={labelStyle}>Pet Breed</label>
                                <div style={{ position: 'relative' }}>
                                    <select style={{...inputStyle, appearance: 'none'}} value={pet.petBreed} onChange={e => updatePet(pet.id, 'petBreed', e.target.value)}>
                                        <option value="">Select here</option>
                                        <option value="Golden Retriever">Golden Retriever</option>
                                        <option value="German Shepherd">German Shepherd</option>
                                        <option value="Siamese">Siamese</option>
                                    </select>
                                    <FiChevronDown style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#777', pointerEvents: 'none' }} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Pet Gender</label>
                            <div style={{ position: 'relative' }}>
                                <select style={{...inputStyle, appearance: 'none'}} value={pet.petGender} onChange={e => updatePet(pet.id, 'petGender', e.target.value)}>
                                    <option value="">Select here</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                                <FiChevronDown style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#777', pointerEvents: 'none' }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <label style={labelStyle}>Pet Age</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500' }}>
                                <input type="radio" checked={pet.ageType === 'approx'} onChange={() => updatePet(pet.id, 'ageType', 'approx')} /> Approximate Age
                            </label>
                            {pet.ageType === 'approx' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginLeft: '24px' }}>
                                    <div>
                                        <label style={{...labelStyle, color: '#666'}}>Years</label>
                                        <input type="number" style={inputStyle} value={pet.years} onChange={e => updatePet(pet.id, 'years', e.target.value)} placeholder="0" />
                                    </div>
                                    <div>
                                        <label style={{...labelStyle, color: '#666'}}>Months</label>
                                        <input type="number" style={inputStyle} value={pet.months} onChange={e => updatePet(pet.id, 'months', e.target.value)} placeholder="0" />
                                    </div>
                                </div>
                            )}

                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', marginTop: '8px' }}>
                                <input type="radio" checked={pet.ageType === 'exact'} onChange={() => updatePet(pet.id, 'ageType', 'exact')} /> Exact Age
                            </label>
                            {pet.ageType === 'exact' && (
                                <div style={{ marginLeft: '24px', width: 'calc(50% - 16px)' }}>
                                    <label style={{...labelStyle, color: '#666'}}>Date of Birth</label>
                                    <input type="date" style={inputStyle} value={pet.dateOfBirth} onChange={e => updatePet(pet.id, 'dateOfBirth', e.target.value)} />
                                </div>
                            )}
                        </div>
                    </div>

                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Pet Medical Information <span style={{color: '#888', fontWeight: 500}}>(Optional)</span></h4>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500' }}>
                                <input type="checkbox" checked={pet.isNeutered} onChange={e => {updatePet(pet.id, 'isNeutered', e.target.checked); if(e.target.checked) updatePet(pet.id, 'isUnknown', false);}} /> Neutered
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500' }}>
                                <input type="checkbox" checked={pet.isUnknown} onChange={e => {updatePet(pet.id, 'isUnknown', e.target.checked); if(e.target.checked) updatePet(pet.id, 'isNeutered', false);}} /> Unknown
                            </label>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 32px' }}>
                            <div>
                                <label style={labelStyle}>Blood Type (Optional)</label>
                                <div style={{ position: 'relative' }}>
                                    <select style={{...inputStyle, appearance: 'none'}} value={pet.bloodType} onChange={e => updatePet(pet.id, 'bloodType', e.target.value)}>
                                        <option value="">Select Blood Type</option>
                                        <option value="DEA 1.1">DEA 1.1</option>
                                        <option value="DEA 1.2">DEA 1.2</option>
                                    </select>
                                    <FiChevronDown style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#777', pointerEvents: 'none' }} />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Weight (Optional)</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" style={inputStyle} placeholder="Enter Weight" value={pet.weight} onChange={e => updatePet(pet.id, 'weight', e.target.value)} />
                                    <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#777', background: '#F9FAFB', paddingLeft: '8px' }}>KG <FiChevronDown style={{verticalAlign: 'middle', marginLeft: '4px'}}/></span>
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Microchip ID (Optional)</label>
                                <input type="text" style={inputStyle} placeholder="Enter Microchip ID" value={pet.microchipNo} onChange={e => updatePet(pet.id, 'microchipNo', e.target.value)} />
                            </div>
                            <div>
                                <label style={labelStyle}>Rabies Tag (Optional)</label>
                                <input type="text" style={inputStyle} placeholder="Enter Rabies Tag" value={pet.rabiesTag} onChange={e => updatePet(pet.id, 'rabiesTag', e.target.value)} />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>Notes (Optional)</label>
                                <textarea style={{...inputStyle, minHeight: '80px', resize: 'vertical'}} placeholder="Enter here..." value={pet.notes} onChange={e => updatePet(pet.id, 'notes', e.target.value)}></textarea>
                            </div>
                        </div>
                    </div>

                </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', marginTop: '40px', paddingBottom: '40px', borderTop: '1px solid #eee', paddingTop: '24px' }}>
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

export default CustomerForm;
