// PetForm.js
import React, { useState } from "react";
import styles from "../../styles/pet-sales/petForm.module.css"
import { Max2 } from "@/public/SVG";

const PetForm = () => {
  const [formData, setFormData] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
const [videoPreview, setVideoPreview] = useState(null);

// For image
const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file) setImagePreview(URL.createObjectURL(file));
};

// For video
const handleVideoChange = (e) => {
  const file = e.target.files[0];
  if (file) setVideoPreview(URL.createObjectURL(file));
};


  const fieldsLeft = [
    { name: "petType", label: "Pet Type", options: ["Dog", "Cat"] },
    { name: "petBreed", label: "Pet Breed", options: ["Labrador", "Beagle", "Pug", "Husky"] },
    { name: "age", label: "Age", options: ["1 Month", "6 Months", "1 Year", "2+ Years"] },
    { name: "color", label: "Color", options: ["Black", "Brown", "White", "Golden"] },
    { name: "vaccination", label: "How many Vaccination done?", options: ["0", "1", "2", "3+"] },
    { name: "gender", label: "Gender", options: ["Male", "Female"] },
    { name: "size", label: "Size", options: ["Small", "Medium", "Large"] },
    { name: "weight", label: "Weight", options: ["1-5kg", "6-10kg", "11-20kg", "20kg+"] },
  ];

  const fieldsRight = [
    { name: "price", label: "Price", options: ["₹1000", "₹2000", "₹3000", "₹4000"] },
    { name: "status", label: "Availability Status", options: ["Available", "Not Available", "Sold"] },
    { name: "training", label: "Training Done?", options: ["Yes", "No"] },
    { name: "certified", label: "Certified?", options: ["Yes", "No"] },
    { name: "diet", label: "Diet Type", options: ["Veg", "Non-Veg", "Mixed"] },
    { name: "energy", label: "Energy Level", options: ["Low", "Medium", "High"] },
    { name: "friendly", label: "Is Friendly?", options: ["Yes", "No"] },
    { name: "branch", label: "Branch Location", options: ["Mumbai", "Delhi", "Pune", "Bangalore"] },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


  return (
    <div className={styles["div-wrapper"]}>
    <div className={styles["image-video-wrapper"]}>
  {/* Image Upload */}
  <div style={{ textAlign: "center", cursor: "pointer" }}>
    <label>
      <div className={styles["image-container"]}><Max2 /></div>
      <input
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => handleImageChange(e, "image")}
      />
    </label>
    <p>Add Your Image Here</p>

    {/* Image Preview */}
    {imagePreview && (
      <img
        src={imagePreview}
        alt="preview-image"
        className={styles.previewImage}
      />
    )}
  </div>

  {/* Video Upload */}
  <div style={{ textAlign: "center", cursor: "pointer" }}>
    <label>
      <div className={styles["image-container"]}><Max2 /></div>
      <input
        type="file"
        accept="video/*"
        style={{ display: "none" }}
        onChange={(e) => handleVideoChange(e)}
      />
    </label>
    <p>Add Your Video Here</p>

    {/* Video Preview */}
    {videoPreview && (
      <video
        src={videoPreview}
        controls
        className={styles.previewVideo}
        height={100}
        width={100}
      />
    )}
  </div>
</div>


      <div className={styles.formWrapper}>
        <h3 className={styles.formTitle}>Pet Details</h3>

        <div className={styles.twoColumn}>
          <div className={styles.column}>
            {fieldsLeft.map((field) => (
              <div key={field.name} className={styles.formField}>
                <label className={styles.label}>{field.label}</label>
                <select
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="">Select here</option>
                  {field.options.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className={styles.column}>
            {fieldsRight.map((field) => (
              <div key={field.name} className={styles.formField}>
                <label className={styles.label}>{field.label}</label>
                <select
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="">Select here</option>
                  {field.options.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetForm;
