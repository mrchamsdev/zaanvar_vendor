import { useState, useEffect } from 'react';
import styles from "../../styles/pet-sales/addNewAddressPopup.module.css";
import AddNewAddressPopup from './addNewAddressPopup';

const AddressDropdown = ({ formData, setFormData, userInfo, errors }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [localNewAddresses, setLocalNewAddresses] = useState([]);
  const [userAddresses, setUserAddresses] = useState([]);

  // Load user addresses from userInfo
  useEffect(() => {
    if (userInfo?.addresses) {
      setUserAddresses(userInfo.addresses);
    }
  }, [userInfo]);

  // Combine server addresses with locally added ones
  const allAddresses = [...userAddresses, ...localNewAddresses];

  // Sort addresses - default address first, then others
  const sortedAddresses = [...allAddresses].sort((a, b) => {
    // Default address comes first
    if (a.addressStatus === 'Default') return -1;
    if (b.addressStatus === 'Default') return 1;
    return 0;
  });

  const handleNewAddressSaved = (addressObj, formattedAddress) => {
    // Add to local list so it appears in dropdown
    setLocalNewAddresses(prev => [...prev, addressObj]);
    
    // If this is a default address, update the userAddresses to ensure other addresses are marked as non-default
    if (addressObj.addressStatus === 'Default') {
      // Update local state to mark other addresses as non-default
      setUserAddresses(prev => 
        prev.map(addr => ({
          ...addr,
          addressStatus: addr.id === addressObj.id ? 'Default' : 'Active'
        }))
      );
    }

    // Automatically select the newly created address
    setFormData(prev => ({
      ...prev,
      addressId: addressObj.id?.toString() || addressObj._id?.toString(),
      address: formattedAddress
    }));
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
        // Format address as object for API payload
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

  // Format address for display in dropdown
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
    
    // Add " (Default)" suffix if it's the default address
    if (item.addressStatus === 'Default') {
      return `${displayText} (Default)`;
    }
    
    return displayText;
  };

  return (
    <div className={styles.addressDropdownContainer}>
      <select 
        className={`${styles['input-field']} ${errors.address ? styles.error : ''}`}
        value={formData.addressId || ''} 
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