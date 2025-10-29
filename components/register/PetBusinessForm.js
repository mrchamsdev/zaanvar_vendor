import React, { useState } from "react";
import styles from "../../styles/register/petBusinessForm.module.css";
import { Tik } from "@/public/image/SVG";

const PetBusinessForm = () => {
  const [formData, setFormData] = useState({
    bussinessname: "",
    ownerName: "",
    email: "",
    phone: "",
    website: "",
    location: "",
    operations: "",      
    selectedTypes: [],   
  });

  const [errors , setErrors] = useState({});

  // ---------------------------
  // Full Form Validation (on submit)
  // ---------------------------
  const Validate = () => {
    const newErrors = {};

    if(!formData.bussinessname.trim()){
      newErrors.bussinessname = "Bussiness Name is Required";
    }
    if(!formData.ownerName.trim()){
      newErrors.ownerName = "Owner Name is Required";
    }
    if(!formData.email.trim()){
      newErrors.email = "Email is required";
    } else if(!/\S+@\S+\.\S+/.test(formData.email)){
      newErrors.email = "Email is invalid";
    }
    if(!formData.phone.trim()){
      newErrors.phone = "Phone number is required";
    }
    if(!formData.location.trim()){
      newErrors.location = "Location is Required";
    }
    if(!formData.operations){
      newErrors.operations = "Please select an option";
    }
    if(formData.selectedTypes.length === 0){
      newErrors.selectedTypes = "Select at least one business type";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------------------
  // Real-time Input Validation
  // ---------------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    let fieldError = "";

    if (name === "bussinessname" && !value.trim()) fieldError = "Bussiness Name is Required";
    else if (name === "ownerName" && !value.trim()) fieldError = "Owner Name is Required";
    else if (name === "email") {
      if (!value.trim()) fieldError = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(value)) fieldError = "Email is invalid";
    }
    else if (name === "phone" && !value.trim()) fieldError = "Phone number is required";
    else if (name === "location" && !value.trim()) fieldError = "Location is Required";

    setErrors((prev) => ({
      ...prev,
      [name]: fieldError,
    }));
  };

  // ---------------------------
  // Real-time Checkbox Validation
  // ---------------------------
  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;

    setFormData((prev) => {
      const updatedSelected = checked
        ? [...prev.selectedTypes, value]
        : prev.selectedTypes.filter((item) => item !== value);

      setErrors((prevErrors) => ({
        ...prevErrors,
        selectedTypes: updatedSelected.length === 0 ? "Select at least one business type" : "",
      }));

      return { ...prev, selectedTypes: updatedSelected };
    });
  };

  // ---------------------------
  // Real-time Radio Validation
  // ---------------------------
  const handleRadioChange = (e) => {
    const { value } = e.target;

    setFormData((prev) => ({ ...prev, operations: value }));

    setErrors((prev) => ({
      ...prev,
      operations: value ? "" : "Please select an option",
    }));
  };

  // ---------------------------
  // Form Submit
  // ---------------------------
  const handleSubmit = (e) => {
    e.preventDefault();
    if(Validate()){
      console.log("Form Data:", formData);
    } else {
      console.log("Errors:", errors);
    }
  };

  return (
    <div className={styles.container}>
      {/* ---------------------------
          Left Section: Features
          --------------------------- */}
      <div className={styles.left}>
        <h1>If You’re Here, <br />You’ve Made The Right Choice.</h1>
        <p>Just drop in your details & we’ll have you onboarded quickly.</p>
        <h3 className={styles["tailored-feature"]}>Tailored Features</h3>
        <div className={styles.features}>
          {[
            "Breeding", "Pet Sales", "Grooming", "Photographers",
            "Blood Bank", "NGO’s", "Day Care", "Events",
            "Training", "E-Commerce", "Location", "Clinics"
          ].map((feature) => (
            <div key={feature} className={styles.feature}>
              <h4>{feature}</h4>
              <ul className={styles["ul"]}>
                <li><span><Tik /> </span>Breeding</li>
                <li><span><Tik /> </span>Breeding</li>
                <li><span><Tik /> </span>Breeding</li>
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------------------
          Right Section: Form
          --------------------------- */}
      <div className={styles.right}>
        <h2>Register Your Pet Business Free</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* ---------------------------
              Row 1: Business & Owner Name
              --------------------------- */}
          <div className={styles.row}>
            <div className={styles["row-title"]}>
              <h4 className={styles["title-tag"]}>Business Name</h4>
              <input
                type="text"
                name="bussinessname"
                placeholder="Enter Business Name"
                value={formData.bussinessname}
                onChange={handleInputChange}
              />
              {errors.bussinessname && <span className={styles.errorMsg}>{errors.bussinessname}</span>}
            </div>
            <div className={styles["row-title"]}>
              <h4 className={styles["title-tag"]}>Owner's Name</h4>
              <input
                type="text"
                name="ownerName"
                placeholder="Enter Owner's Name"
                value={formData.ownerName}
                onChange={handleInputChange}
              />
              {errors.ownerName && <span className={styles.errorMsg}>{errors.ownerName}</span>}
            </div>
          </div>

          {/* ---------------------------
              Row 2: Email & Phone
              --------------------------- */}
          <div className={styles.row}>
            <div className={styles["row-title"]}>
              <h4 className={styles["title-tag"]}>Email</h4>
              <input
                type="email"
                name="email"
                placeholder="Enter Email Id"
                value={formData.email}
                onChange={handleInputChange}
              />
              {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
            </div>
            <div className={styles["row-title"]}>
              <h4 className={styles["title-tag"]}>Phone Number</h4>
              <input
                type="number"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleInputChange}
              />
              {errors.phone && <span className={styles.errorMsg}>{errors.phone}</span>}
            </div>
          </div>  

          {/* ---------------------------
              Checkbox Section: Business Types
              --------------------------- */}
          <div className={styles.checkboxGroup}>
            {[
              "Breeders", "Pet Sales", "Grooming", "Training", "Photographers",
              "Blood Bank", "NGO’s", "Day Care", "Clinics", "Events",
              "Location", "E-Commerce"
            ].map((type) => (
              <label key={type} className={styles["label"]}>
                <input
                  type="checkbox"
                  value={type}
                  checked={formData.selectedTypes.includes(type)}
                  onChange={handleCheckboxChange}
                  className={styles["checkBox"]}
                />
                {type}
              </label>
            ))}
          </div>
          {errors.selectedTypes && <span className={styles.errorMsg}>{errors.selectedTypes}</span>}

          {/* ---------------------------
              Row 3: Location & Website
              --------------------------- */}
          <div className={styles.row}>
            <div className={styles["row-title"]}>
              <h4 className={styles["title-tag"]}>Business Location</h4>
              <input
                type="text"
                name="location"
                placeholder="Enter Business Location"
                value={formData.location}
                onChange={handleInputChange}
              />
              {errors.location && <span className={styles.errorMsg}>{errors.location}</span>}
            </div>
            <div className={styles["row-title"]}>
              <h4 className={styles["title-tag"]}>Website/Social Links (Optional)</h4>
              <input
                type="text"
                name="website"
                placeholder="Enter Website/Social Link"
                value={formData.website}
                onChange={handleInputChange}
               style={{ textTransform: "none" }}
              />
            </div>
          </div>

          {/* ---------------------------
              Radio Buttons: Operations
              --------------------------- */}
          <div className={styles.radioGroup}>
            {["We use paper", "Other Software", "Just started new business"].map((option) => (
              <label key={option} className={styles["label2"]}>
                <input
                  type="radio"
                  name="operations"
                  value={option}
                  checked={formData.operations === option}
                  onChange={handleRadioChange}
                />
                {option}
              </label>
            ))}
          </div>
          {errors.operations && <span className={styles.errorMsg}>{errors.operations}</span>}

          {/* ---------------------------
              Privacy Note & Submit Button
              --------------------------- */}
          <p className={styles.privacy}>
            We're committed to your privacy and will only use the above information to contact you sparingly
          </p>

          <button className={styles["submit-btn"]} type="submit">
            Submit Details
          </button>
        </form>
      </div>
    </div>
  );
};

export default PetBusinessForm;
``
