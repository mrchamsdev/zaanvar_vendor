import React, { useEffect, useRef, useState } from "react";
import styles from "../../styles/register/petBusinessForm.module.css";
import { Tik } from "@/public/image/SVG";

const PetBusinessForm = () => {
    const API_URL = typeof window !== "undefined" && window.location.hostname !== "support.zaanvar.com" ? "https://dev.zaanvar.com/api/" : "https://prod.zaanvar.com/api/";

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    professionaldomain: "",
    professionalroletype: "",
    workidentity: "",
    bussinessname: "",
    website: "",
    location: "",
    operations: "",
    selectedTypes: [],
  });

  const [errors , setErrors] = useState({});
const inputRef = useRef(null);
  // Add useRef to your imports: import { useState, useRef, useEffect } from "react";

useEffect(() => {
  // If the script is in index.html, window.google will be available
  if (window.google && inputRef.current) {
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "in" },
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      setFormData(prev => ({ ...prev, location: place.formatted_address || "" }));
    });
  }
}, []);
const IDENTITY_OPTIONS = [
  "Veterinarian", "Vet Assistant", "Pet Groomer", "Dog Trainer", 
  "Pet Nutritionist", "Pet Shop Owner", "Boarding Manager", 
  "Licensed Breeder", "Rescue Coordinator", "Pet Walker / Sitter", 
  "Pet Product Manager"
];
const ROLE_OPTIONS = [
  "Medical Professional", "Service Provider", "Specialist / Expert",
  "Business Owner", "Operations Manager", "Sales & Growth",
  "Educator / Trainer", "Content Creator", "Consultant / Advisor", "Volunteer"
];
  const DOMAIN_OPTIONS = [
  "Veterinary & Medical Care",
  "Grooming & Hygiene",
  "Training & Behavior",
  "Nutrition & Food",
  "Retail & Sales",
  "Boarding & Daycare",
  "Breeding & Kennels",
  "Animal Welfare & Rescue",
  "Media, Marketing & Content",
  "Manufacturing & Supply",
  "Technology & Platforms"
];
  // ---------------------------
  // Full Form Validation (on submit)
  // ---------------------------
  const Validate = () => {
    const newErrors = {};

    if(!formData.bussinessname.trim()){
      newErrors.bussinessname = "Bussiness Name is Required";
    }
    if (!formData.firstName.trim()) newErrors.firstName = "First Name is Required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last Name is Required";
    if(!formData.email.trim()){
      newErrors.email = "Email is required";
    } else if(!/\S+@\S+\.\S+/.test(formData.email)){
      newErrors.email = "Email is invalid";
    }
    if(!formData.phone.trim()){
      newErrors.phone = "Phone number is required";
    }
    if (!formData.professionaldomain) newErrors.professionaldomain = "Please select a Professional Domain";
  if (!formData.professionalroletype) newErrors.professionalroletype = "Please select a Role Type";
  if (!formData.workidentity) newErrors.workidentity = "Please select a Work Identity";
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

  // Update State
  setFormData((prev) => ({
    ...prev,
    [name]: value,
  }));

  let fieldError = "";

  // 1. Text Field Validation
  if (name === "firstName" && !value.trim()) fieldError = "First Name is Required";
  else if (name === "lastName" && !value.trim()) fieldError = "Last Name is Required";
  else if (name === "bussinessname" && !value.trim()) fieldError = "Business Name is Required";
  else if (name === "email") {
    if (!value.trim()) fieldError = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(value)) fieldError = "Email is invalid";
  }
  else if (name === "phone") {
  const onlyNums = value.replace(/[^0-9]/g, "");
  
  if (onlyNums.length > 10) return;

  setFormData((prev) => ({ ...prev, [name]: onlyNums }));

  let fieldError = "";
  if (onlyNums.length > 0 && onlyNums.length < 10) {
    fieldError = "Phone number must be 10 digits";
  }
  
  setErrors((prev) => ({ ...prev, [name]: fieldError }));
  return;
}
  else if (name === "location" && !value.trim()) fieldError = "Location is Required";

  // 2. Dropdown Validation (clears error when an option is picked)
  else if (["professionaldomain", "professionalroletype", "workidentity"].includes(name)) {
    if (!value) fieldError = "Please select an option";
  }

  // Update Errors
  setErrors((prev) => ({
    ...prev,
    [name]: fieldError,
  }));
};

  const handleSubmit = async (e) => {
    e.preventDefault();

   
    if (Validate()) {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phone,
        // gender: "Male",
       services: formData.selectedTypes,
       datastore: formData.operations,
        professionalRoleType: formData.professionalroletype,
        workIdentity: formData.workidentity,
        professionalDomain: formData.professionaldomain,
        type: typeof window !== "undefined" ? window.location.href : "",
    businessLocation: formData.location,
    socialMediaLinks: formData.website ? [formData.website] : [],
        // salary: 25000.00,
        // experience: "0 years",
        // branchAssigned: [1],
        
      };

      try {
        const response = await fetch(`${API_URL}vendor-users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const result = await response.json();
          alert("Business Registered Successfully!");
          console.log("Success:", result);
        } else {
          const errorData = await response.json();
          console.error("Submission Error:", errorData);
          alert(`Registration failed: ${errorData.message || "Please check your details."}`);
        }
      } catch (err) {
        console.error("Network Error:", err);
        alert("Server is unreachable. Please try again later.");
      }
    }
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
            // "Breeding", 
            "Pet Sales", 
            // "Grooming", "Photographers",
            // "Blood Bank", "NGO’s", "Day Care", "Events",
            // "Training", "E-Commerce", "Location", "Clinics"
          ].map((feature) => (
            <div key={feature} className={styles.feature}>
              <h4>{feature}</h4>
              <ul className={styles["ul"]}>
                <li><span><Tik /> </span>Mobile App</li>
                <li><span><Tik /> </span>Easy Communications</li>
                <li><span><Tik /> </span>Advanced Analytics</li>
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

           {/* <div className={styles.row}>
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
          </div> */}
          {/* ---------------------------
              Row 1: Business & Owner Name
              --------------------------- */}
              <div className={styles.row}>
    <div className={styles["row-title"]}>
      <h4 className={styles["title-tag"]}>First Name</h4>
      <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleInputChange} />
      {errors.firstName && <span className={styles.errorMsg}>{errors.firstName}</span>}
    </div>
    <div className={styles["row-title"]}>
      <h4 className={styles["title-tag"]}>Last Name</h4>
      <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleInputChange} />
      {errors.lastName && <span className={styles.errorMsg}>{errors.lastName}</span>}
    </div>
  </div>
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
            {/* <div className={styles["row-title"]}>
              <h4 className={styles["title-tag"]}>Owner's Name</h4>
              <input
                type="text"
                name="ownerName"
                placeholder="Enter Owner's Name"
                value={formData.ownerName}
                onChange={handleInputChange}
              />
              {errors.ownerName && <span className={styles.errorMsg}>{errors.ownerName}</span>}
            </div> */}
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
          </div>

          {/* ---------------------------
              Row 2: Email & Phone
              --------------------------- */}
          <div className={styles.row}>
            
          <div className={styles["row-title"]}>
  <h4 className={styles["title-tag"]}>Phone Number</h4>
  <input
    type="tel"
    name="phone"
    placeholder="Enter 10-digit Number"
    value={formData.phone}
    onChange={handleInputChange}
    maxLength={10}
  />
  {errors.phone && <span className={styles.errorMsg}>{errors.phone}</span>}
</div>
             <div className={styles["row-title"]}>
    <h4 className={styles["title-tag"]}>Professional Domain</h4>
    <select
      name="professionaldomain"
      value={formData.professionaldomain}
      onChange={handleInputChange}
      className={styles.selectInput}
    >
      <option value="">Select Domain</option>
      {DOMAIN_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
    {errors.professionaldomain && <span className={styles.errorMsg}>{errors.professionaldomain}</span>}
  </div>
          </div>  

     {/* --- Row: Professional Domain & Role Type --- */}
<div className={styles.row}>
 

  <div className={styles["row-title"]}>
    <h4 className={styles["title-tag"]}>Role Type</h4>
    <select
      name="professionalroletype"
      value={formData.professionalroletype}
      onChange={handleInputChange}
      className={styles.selectInput}
    >
      <option value="">Select Role</option>
      {ROLE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
    {errors.professionalroletype && <span className={styles.errorMsg}>{errors.professionalroletype}</span>}
  </div>
   <div className={styles["row-title"]}>
    <h4 className={styles["title-tag"]}>Work Identity</h4>
    <select
      name="workidentity"
      value={formData.workidentity}
      onChange={handleInputChange}
      className={styles.selectInput}
    >
      <option value="">Select Identity</option>
      {IDENTITY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
    {errors.workidentity && <span className={styles.errorMsg}>{errors.workidentity}</span>}
  </div>
</div>


          {/* ---------------------------
              Checkbox Section: Business Types
              --------------------------- */}
              <h4 className={styles["checkbox-tag"]}>Service Provided</h4>
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
              ref={inputRef}
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
