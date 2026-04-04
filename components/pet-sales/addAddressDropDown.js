

import { useState, useEffect } from 'react';
import styles from "../../styles/pet-sales/addNewAddressPopup.module.css";
import AddNewAddressPopup from './addNewAddressPopup';

const AddressDropdown = ({ formData, setFormData, userInfo, errors, petData }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [localNewAddresses, setLocalNewAddresses] = useState([]);
  const [userAddresses, setUserAddresses] = useState([]);
  const [hasAddedTempAddress, setHasAddedTempAddress] = useState(false);

  // Load user addresses from userInfo
  useEffect(() => {
    if (userInfo?.addresses) {
      setUserAddresses(userInfo.addresses);
    }
  }, [userInfo]);

  // Combine server addresses with locally added ones
  const allAddresses = [...userAddresses, ...localNewAddresses];

  // Remove duplicates based on address ID
  const uniqueAddresses = Array.from(
    new Map(allAddresses.map(addr => [(addr.id || addr._id), addr])).values()
  );

  // Sort addresses - default address first, then others
  const sortedAddresses = [...uniqueAddresses].sort((a, b) => {
    if (a.addressStatus === 'Default') return -1;
    if (b.addressStatus === 'Default') return 1;
    return 0;
  });

  // Set the selected address ID when editing
  useEffect(() => {
    if (petData && petData.address && !formData.addressId && !hasAddedTempAddress) {
      // Try to find matching address from user's addresses
      const matchingAddress = userAddresses.find(addr => {
        const addrCity = addr.townOrCity?.toLowerCase().trim();
        const petCity = petData.address?.city?.toLowerCase().trim();
        const addrPincode = addr.pinCode?.toString();
        const petPincode = petData.address?.pincode?.toString();
        
        return addrCity === petCity && addrPincode === petPincode;
      });
      
      if (matchingAddress) {
        const addressId = matchingAddress.id || matchingAddress._id;
        setFormData(prev => ({
          ...prev,
          addressId: addressId?.toString(),
          address: {
            street: matchingAddress.flatOrHouseNoOrBuildingOrCompanyOrApartment || "",
            area: matchingAddress.areaOrStreetOrSectorOrVillage || "",
            city: matchingAddress.townOrCity || "",
            state: matchingAddress.state || "",
            pincode: matchingAddress.pinCode || "",
            landmark: matchingAddress.landmark || "",
            country: matchingAddress.country || ""
          }
        }));
      } else if (petData.address && userAddresses.length === 0) {
        // Only add temp address once
        setHasAddedTempAddress(true);
        
        const tempAddress = {
          id: "temp_address",
          _id: "temp_address",
          flatOrHouseNoOrBuildingOrCompanyOrApartment: petData.address.street || "",
          areaOrStreetOrSectorOrVillage: petData.address.area || "",
          townOrCity: petData.address.city || "",
          state: petData.address.state || "",
          pinCode: petData.address.pincode || "",
          landmark: petData.address.landmark || "",
          country: petData.address.country || "",
          addressStatus: "Active"
        };
        setLocalNewAddresses(prev => {
          // Check if temp address already exists
          const exists = prev.some(addr => addr.id === "temp_address");
          if (!exists) {
            return [...prev, tempAddress];
          }
          return prev;
        });
        setFormData(prev => ({
          ...prev,
          addressId: "temp_address",
          address: {
            street: petData.address.street || "",
            area: petData.address.area || "",
            city: petData.address.city || "",
            state: petData.address.state || "",
            pincode: petData.address.pincode || "",
            landmark: petData.address.landmark || "",
            country: petData.address.country || ""
          }
        }));
      }
    }
  }, [petData, userAddresses, formData.addressId, setFormData, hasAddedTempAddress]);

  const handleNewAddressSaved = (addressObj, formattedAddress) => {
    setLocalNewAddresses(prev => [...prev, addressObj]);
    
    if (addressObj.addressStatus === 'Default') {
      setUserAddresses(prev => 
        prev.map(addr => ({
          ...addr,
          addressStatus: addr.id === addressObj.id ? 'Default' : 'Active'
        }))
      );
    }

    setFormData(prev => ({
      ...prev,
      addressId: addressObj.id?.toString() || addressObj._id?.toString(),
      address: formattedAddress
    }));
    setShowPopup(false);
  };

  const handleSelectChange = (e) => {
    const selected = e.target.value;
    
    if (selected === 'add_new') {
      setShowPopup(true);
    } else if (selected) {
      const selectedAddress = sortedAddresses.find(addr => 
        (addr.id?.toString() === selected || addr._id?.toString() === selected)
      );
      
      if (selectedAddress) {
        const formattedAddress = {
          street: selectedAddress.flatOrHouseNoOrBuildingOrCompanyOrApartment || "",
          area: selectedAddress.areaOrStreetOrSectorOrVillage || "",
          city: selectedAddress.townOrCity || "",
          state: selectedAddress.state || "",
          pincode: selectedAddress.pinCode || "",
          landmark: selectedAddress.landmark || ""
        };
        
        setFormData(prev => ({
          ...prev,
          addressId: selected,
          address: formattedAddress
        }));
      }
    }
  };

  const formatAddressDisplay = (item) => {
    const addressParts = [];
    
    if (item.flatOrHouseNoOrBuildingOrCompanyOrApartment) {
      addressParts.push(item.flatOrHouseNoOrBuildingOrCompanyOrApartment);
    }
    if (item.areaOrStreetOrSectorOrVillage) {
      addressParts.push(item.areaOrStreetOrSectorOrVillage);
    }
    if (item.landmark) {
      addressParts.push(item.landmark);
    }
    if (item.townOrCity) {
      addressParts.push(item.townOrCity);
    }
    if (item.state) {
      addressParts.push(item.state);
    }
    if (item.country) {
      addressParts.push(item.country);
    }
    if (item.pinCode) {
      addressParts.push(`PIN: ${item.pinCode}`);
    }
    
    const displayText = addressParts.length > 0 ? addressParts.join(', ') : 'Address';
    
    if (item.addressStatus === 'Default') {
      return `${displayText} (Default)`;
    }
    
    return displayText;
  };

  // Get the current value for the select
  const getSelectValue = () => {
    if (formData.addressId) {
      // Check if the addressId exists in the options
      const exists = sortedAddresses.some(addr => 
        (addr.id?.toString() === formData.addressId || addr._id?.toString() === formData.addressId)
      );
      if (exists) {
        return formData.addressId;
      }
    }
    return "";
  };

  return (
    <div className={styles.addressDropdownContainer}>
      <div className={styles.selectWrapper}>
        <select 
          className={`${styles['input-field']} ${errors.address ? styles.error : ''}`}
          value={getSelectValue()} 
          onChange={handleSelectChange}
        >
          <option value="">Select Address</option>
          <option value="add_new" style={{ color: '#F5790C', fontWeight: '500' }}>
            + Add New Address
          </option>
          {sortedAddresses.map((item) => {
            const addressId = item.id || item._id;
            const displayText = formatAddressDisplay(item);
            
            return (
              <option key={addressId} value={addressId}>
                {displayText}
              </option>
            );
          })}
        </select>
        <div className={styles.dropdownArrow}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      {showPopup && (
        <AddNewAddressPopup
          onClose={() => setShowPopup(false)}
          onSaveAddress={handleNewAddressSaved}
        />
      )}
    </div>
  );
};

export default AddressDropdown;