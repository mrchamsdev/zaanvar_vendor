import { useState } from 'react';
// import styles from "@/styles/AddressDropdown.module.css";
import styles from "../../styles/pet-sales/addNewAddressPopup.module.css"
import AddNewAddressPopup from './addNewAddressPopup';
// import AddNewAddressPopup from './AddNewAddressPopup';

const AddressDropdown = ({ formData, setFormData, userInfo, errors }) => {
  const [showPopup, setShowPopup] = useState(false);

  const sortedAddresses = [...(userInfo?.addresses || [])].sort((a, b) => {
    if (a.addressStatus === 'Default') return -1;
    if (b.addressStatus === 'Default') return 1;
    return 0;
  });

  console.log("AddressDropdown - formData.address:", formData.address);
  console.log("AddressDropdown - formData.addressId:", formData.addressId);
  console.log("AddressDropdown - userInfo.addresses:", userInfo?.addresses);
  console.log("AddressDropdown - userInfo.addresses.length:", userInfo?.addresses?.length);
  console.log("AddressDropdown - sortedAddresses:", sortedAddresses);

  const handleSelectChange = (e) => {
    const selected = e.target.value;
    if (selected === 'add_new') {
      setShowPopup(true);
    } else {
      // Find the selected address object by ID
      const selectedAddress = sortedAddresses.find(
        (addr) => (addr.id || addr._id) == selected
      );
      if (selectedAddress) {
        // Store the address ID as a number in formData.address
        setFormData((prev) => ({
          ...prev,
          address: Number(selectedAddress.id || selectedAddress._id), // Ensure it's a number
          addressId: selected, // Optionally keep addressId for reference
        }));
      }
    }
  };

  return (
    <>
      <select
        id="address"
        name="address"
        className={styles['input-field']}
        value={formData.addressId || ''} // Use addressId for the dropdown value
        onChange={handleSelectChange}
      >
        <option value="">Select Address</option>
        <option value="add_new">Add New Address</option>
        {sortedAddresses.map((item) => {
          // Create a detailed address string using individual fields for display
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
          
          const displayText =
            addressParts.length > 0 ? addressParts.join(', ') : 'Address';

          return (
            <option key={item?.id || item?._id} value={item?.id || item?._id}>
              {displayText}
            </option>
          );
        })}
      </select>

      {errors.address && (
        <span className={styles["error-text"]}>{errors.address}</span>
      )}

      {showPopup && (
        <AddNewAddressPopup
          onClose={() => setShowPopup(false)}
          userInfo={userInfo}
          postFormData={formData}
          setPostFormData={setFormData}
        />
      )}
    </>
  );
};

export default AddressDropdown;