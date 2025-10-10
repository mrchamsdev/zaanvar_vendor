import React, { useState } from "react";
// import styles from "./PetBusinessForm.module.css";
import styles from "../../../styles/register/petBusinessForm.module.css";
import { Tik } from "@/public/SVG";

const PetBusinessForm = () => {

  const [formData, setFormData] = useState({
    bussinessname: "",
    ownerName: "",
    email: "",
    phone: "",
    website: "",
    location: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Data:", formData);
  };

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <h1>
          If You’re Here, <br />
          You’ve Made The Right Choice.
        </h1>
        <p>Just drop in your details & we’ll have you onboarded quickly.</p>
        <div className={styles.features}>
          {[
            "Breeding",
            "Pet Sales",
            "Grooming",
            "Photographers",
            "Blood Bank",
            "NGO’s",
            "Day Care",
            "Events",
            "Training",
            "E-Commerce",
            "Location",
            "Clinics",
          ].map((feature) => (
            <div key={feature} className={styles.feature}>
              <h4>{feature}</h4>
              <ul className={styles["ul"]}>
                <li>
                  <span>
                    <Tik />{" "}
                  </span>{" "}
                  Breeding
                </li>
                <li>
                  <span>
                    <Tik />{" "}
                  </span>{" "}
                  Breeding
                </li>
                <li>
                  <span>
                    <Tik />{" "}
                  </span>{" "}
                  Breeding
                </li>
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.right}>
        <h2>Register Your Pet Business Free</h2>
        <form className={styles.form}>
          <div className={styles.row}>
            <div className={styles["row-title"]}>
              <h4 className={styles["title-tag"]}>Business Name</h4>
              <input
                type="text"
                name="bussinessname"
                placeholder="Enter Business Name"
                onChange={handleInputChange}
              />
            </div>

            <div className={styles["row-title"]}>
              <h4 className={styles["title-tag"]}>Owner's Name</h4>
              <input
                type="text"
                name="ownerName"
                placeholder="Enter Owner's Name"
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles["row-title"]}>
              <h4 className={styles["title-tag"]}>Email</h4>
              <input
                type="email"
                name="email"
                placeholder="Enter Email Id"
                onChange={handleInputChange}
              />
            </div>
            <div className={styles["row-title"]}>
              <h4 className={styles["title-tag"]}>Phone Number</h4>
              <input
                type="number"
                name="phone"
                placeholder="Phone Number"
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className={styles.checkboxGroup}>
            {[
              "Breeders",
              "Pet Sales",
              "Grooming",
              "Training",
              "Photographers",
              "Blood Bank",
              "NGO’s",
              "Day Care",
              "Clinics",
              "Events",
              "Location",
              "E-Commerce",
            ].map((type) => (
              <label key={type} className={styles["label"]}>
                <input type="checkbox" className={styles["checkBox"]} /> {type}
              </label>
            ))}
          </div>

          <div className={styles.row}>
            <div className={styles["row-title"]}>
              <h4 className={styles["title-tag"]}>Business Location</h4>
              <input
                type="text"
                name="location"
                placeholder="Enter Business Location"
                onChange={handleInputChange}
              />
            </div>

            <div className={styles["row-title"]}>
              <h4 className={styles["title-tag"]}>
                Website/Social Links (Optional)
              </h4>
              <input
                type="text"
                name="website"
                placeholder="Enter Owner's Name"
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className={styles.radioGroup}>
            <label className={styles["label2"]}>
              <input type="radio" name="operations" /> We use paper
            </label>
            <label className={styles["label2"]}>
              <input type="radio" name="operations" /> Other Software
            </label>
            <label className={styles["label2"]}>
              <input type="radio" name="operations" /> Just started new business
            </label>
          </div>

          <p className={styles.privacy}>
            We're committed to your privacy and will only use the above
            information to contact you sparingly
          </p>

          <button
            className={styles["submit-btn"]}
            type="submit"
            onClick={handleSubmit}
          >
            Submit Details
          </button>
        </form>
      </div>
    </div>
  );
};

export default PetBusinessForm;
