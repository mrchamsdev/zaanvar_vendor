import { useEffect, useState } from "react";
import styles from "../../styles/pet-sales/addNewAddressPopup.module.css";

const AddNewAddressPopup = ({ postFormData, onSaveAddress, onClose }) => {
  const [formData, setFormData] = useState({
    fullName: postFormData?.fullName || "",
    mobileNumber: postFormData?.phone || "",
    flat: "",
    street: "",
    landmark: "",
    country: "",
    state: "",
    pinCode: "",
    city: "",
    isDefault: false,
  });

  const [errors, setErrors] = useState({});
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  // 🧭 1️⃣ Fetch all countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch("https://countriesnow.space/api/v0.1/countries");
        const data = await res.json();
        setCountries(data.data || []);
      } catch (err) {
        console.error("Error fetching countries:", err);
      }
    };
    fetchCountries();
  }, []);

  // 🧭 2️⃣ Fetch states when country changes
  const handleCountryChange = async (e) => {
    const countryName = e.target.value;
    setFormData((prev) => ({
      ...prev,
      country: countryName,
      state: "",
      city: "",
    }));

    if (!countryName) return;

    try {
      const res = await fetch(
        "https://countriesnow.space/api/v0.1/countries/states",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country: countryName }),
        }
      );
      const data = await res.json();
      setStates(data?.data?.states || []);
    } catch (err) {
      console.error("Error fetching states:", err);
      setStates([]);
    }
  };

  // 🧭 3️⃣ Fetch cities when state changes
  const handleStateChange = async (e) => {
    const stateName = e.target.value;
    setFormData((prev) => ({
      ...prev,
      state: stateName,
      city: "",
    }));

    if (!stateName) return;

    try {
      const res = await fetch(
        "https://countriesnow.space/api/v0.1/countries/state/cities",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            country: formData.country,
            state: stateName,
          }),
        }
      );
      const data = await res.json();
      setCities(data?.data || []);
    } catch (err) {
      console.error("Error fetching cities:", err);
      setCities([]);
    }
  };

  // 🔄 Handle Input Change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  // 🧾 Validate Before Save
  const handleSave = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = "Full Name is required";
    if (!formData.mobileNumber.trim())
      newErrors.mobileNumber = "Mobile Number is required";
    else if (!/^\d{10}$/.test(formData.mobileNumber))
      newErrors.mobileNumber = "Enter valid 10-digit number";

    if (!formData.flat.trim()) newErrors.flat = "Flat/House no. required";
    if (!formData.street.trim()) newErrors.street = "Street required";
    if (!formData.landmark.trim()) newErrors.landmark = "Landmark required";
    if (!formData.country.trim()) newErrors.country = "Country required";
    if (!formData.state.trim()) newErrors.state = "State required";
    if (!formData.city.trim()) newErrors.city = "City required";
    if (!formData.pinCode.trim()) newErrors.pinCode = "Pin Code required";
    else if (!/^\d{6}$/.test(formData.pinCode))
      newErrors.pinCode = "Enter valid 6-digit pin code";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Compose full address
    const fullAddress = `${formData.flat}, ${formData.street}, ${formData.landmark}, ${formData.city}, ${formData.state}, ${formData.country} - ${formData.pinCode}`;

    // Pass address to parent
    if (onSaveAddress) onSaveAddress(fullAddress, formData.isDefault);

    if (onClose) onClose();
  };

  // 🪟 Close on outside click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && onClose) onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={onClose}>
            ←
          </button>
          <span className={styles.headerTitle}>Add New Address</span>
        </div>

        <div className={styles.content}>
          {/* Full Name */}
          <div className={styles.formGroup}>
            <label>Full Name</label>
            <input
              name="fullName"
              placeholder="Enter First and Last Name"
              value={formData?.fullName}
              onChange={handleChange}
            />
            {errors.fullName && (
              <span className={styles.error}>{errors.fullName}</span>
            )}
          </div>

          {/* Mobile Number */}
          <div className={styles.formGroup}>
            <label>Mobile Number</label>
            <input
              name="mobileNumber"
              placeholder="Enter Here"
              value={formData.mobileNumber}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d*$/.test(val) && val.length <= 10) handleChange(e);
              }}
            />
            {errors.mobileNumber && (
              <span className={styles.error}>{errors.mobileNumber}</span>
            )}
          </div>

          {/* Flat */}
          <div className={styles.formGroup}>
            <label>Flat, House no., Building, Company, Apartment</label>
            <input
              name="flat"
              placeholder="Enter Here"
              value={formData.flat}
              onChange={handleChange}
            />
            {errors.flat && <span className={styles.error}>{errors.flat}</span>}
          </div>

          {/* Street */}
          <div className={styles.formGroup}>
            <label>Area, Street, Sector, Village</label>
            <input
              name="street"
              placeholder="Enter Here"
              value={formData.street}
              onChange={handleChange}
            />
            {errors.street && (
              <span className={styles.error}>{errors.street}</span>
            )}
          </div>

          {/* Landmark */}
          <div className={styles.formGroup}>
            <label>Landmark</label>
            <input
              name="landmark"
              placeholder="Enter Here"
              value={formData.landmark}
              onChange={handleChange}
            />
            {errors.landmark && (
              <span className={styles.error}>{errors.landmark}</span>
            )}
          </div>

          {/* Country & State */}
          <div className={styles.row}>
            <div className={styles.formContainer}>
              <label>Country</label>
              <select
                name="country"
                value={formData.country}
                onChange={handleCountryChange}
              >
                <option value="">Select Country</option>
                {countries.map((c, idx) => (
                  <option key={idx} value={c.country}>
                    {c.country}
                  </option>
                ))}
              </select>
              {errors.country && (
                <span className={styles.error}>{errors.country}</span>
              )}
            </div>

            <div className={styles.formContainer}>
              <label>State</label>
              <select
                name="state"
                value={formData.state}
                onChange={handleStateChange}
              >
                <option value="">Select State</option>
                {states.map((s, idx) => (
                  <option key={idx} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.state && (
                <span className={styles.error}>{errors.state}</span>
              )}
            </div>
          </div>

          {/* City & Pin Code */}
          <div className={styles.row}>
            <div className={styles.formContainer}>
              <label>City/Town</label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
              >
                <option value="">Select City</option>
                {cities.map((city, idx) => (
                  <option key={idx} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              {errors.city && (
                <span className={styles.error}>{errors.city}</span>
              )}
            </div>

            <div className={styles.formContainer}>
              <label>Pin code</label>
              <input
                name="pinCode"
                placeholder="Enter Here"
                value={formData.pinCode}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val) && val.length <= 6) handleChange(e);
                }}
              />
              {errors.pinCode && (
                <span className={styles.error}>{errors.pinCode}</span>
              )}
            </div>
          </div>

          {/* Default Address */}
          <div className={styles.formGroupCheckbox}>
            <input
              type="checkbox"
              name="isDefault"
              checked={formData.isDefault}
              onChange={handleChange}
            />
            <label>Make this my default address</label>
          </div>
        </div>

        <div className={styles["button-container"]}>
          <button className={styles.saveButton} onClick={handleSave}>
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddNewAddressPopup;
