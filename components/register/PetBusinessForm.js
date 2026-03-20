import React, { useEffect, useRef, useState } from "react";
import styles from "../../styles/register/petBusinessForm.module.css";
import { Tik } from "@/public/images/SVG";
import { Country, State, City } from "country-state-city";
import { VENDOR_API_URL } from "../utilities/Constants";

const PetBusinessForm = () => {
  // API base URL – centralised in Constants.js (business.zaanvar.com = prod)
  const API_URL = VENDOR_API_URL;

  // ── Business type toggle ──────────────────────────────────────────────────
  const [businessType, setBusinessType] = useState("single"); // "single" | "company"

  // ── Shared user info ──────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    professionaldomain: "",
    professionalroletype: "",
    workidentity: "",
    // Single branch fields
    branchName: "",
    branchEmail: "",
    branchPhone: "",
    branchWebsite: "",
    branchStartedDate: "",
    aboutBranch: "",
    selectedTypes: [],
    socialPlatform: "",
    socialUrl: "",
    socialLinks: [],
    // Branch address
    branchCountry: "",
    branchState: "",
    branchCity: "",
    branchPinCode: "",
    branchArea: "",
    branchFlat: "",
    // Company fields
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyWebsite: "",
    companyStartedDate: "",
    aboutCompany: "",
    companySelectedTypes: [],
    companySocialPlatform: "",
    companySocialUrl: "",
    companySocialLinks: [],
    // Company address
    companyCountry: "",
    companyState: "",
    companyCity: "",
    companyPinCode: "",
    companyArea: "",
    companyFlat: "",
    // Branch details (company mode)
    cbBranchName: "",
    cbBranchLocation: "",
    cbBranchOpeningDate: "",
    cbDataStoreModel: "",
    cbBusinessName: "",
    cbBranchEmail: "",
    cbBranchPhone: "",
    cbHowManyBranches: "",
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const locationRef = useRef(null);

  // ── Auto-clear messages ───────────────────────────────────────────────────
  useEffect(() => {
    if (submitSuccess || submitError) {
      const timer = setTimeout(() => {
        setSubmitSuccess("");
        setSubmitError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submitSuccess, submitError]);

  // ── Google Places autocomplete ────────────────────────────────────────────
  useEffect(() => {
    if (window.google && locationRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        locationRef.current,
        { types: ["address"], componentRestrictions: { country: "in" } }
      );
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        setFormData((prev) => ({
          ...prev,
          cbBranchLocation: place.formatted_address || "",
        }));
      });
    }
  }, []);

  // ── Dropdown options ──────────────────────────────────────────────────────
  const IDENTITY_OPTIONS = [
    "Veterinarian","Vet Assistant","Pet Groomer","Dog Trainer",
    "Pet Nutritionist","Pet Shop Owner","Boarding Manager",
    "Licensed Breeder","Rescue Coordinator","Pet Walker / Sitter",
    "Pet Product Manager",
  ];
  const ROLE_OPTIONS = [
    "Medical Professional","Service Provider","Specialist / Expert",
    "Business Owner","Operations Manager","Sales & Growth",
    "Educator / Trainer","Content Creator","Consultant / Advisor","Volunteer",
  ];
  const DOMAIN_OPTIONS = [
    "Veterinary & Medical Care","Grooming & Hygiene","Training & Behavior",
    "Nutrition & Food","Retail & Sales","Boarding & Daycare",
    "Breeding & Kennels","Animal Welfare & Rescue","Media, Marketing & Content",
    "Manufacturing & Supply","Technology & Platforms",
  ];
  const SERVICE_OPTIONS = [
    "Breeders","Pet Sales","Grooming","Training","Photographers",
    "Blood Bank","NGO's","Day Care","Clinics","Events","Location","E-Commerce",
  ];
  const SOCIAL_PLATFORMS = ["Instagram","Facebook","Twitter","YouTube","LinkedIn","WhatsApp","Website"];
  const DATA_STORE_OPTIONS = ["Manual","Software","Both"];
  const BRANCH_COUNT_OPTIONS = ["1","2","3","4","5","6-10","10+"];

  // ── Country / State / City helpers ───────────────────────────────────────
  const allCountries = Country.getAllCountries().map((c) => ({
    id: c.isoCode, name: c.name, code: c.isoCode,
  }));
  const getStates = (code) =>
    code
      ? State.getStatesOfCountry(code).map((s) => ({ id: s.isoCode, name: s.name, code: s.isoCode }))
      : [];
  const getCities = (countryCode, stateCode) =>
    countryCode && stateCode
      ? City.getCitiesOfState(countryCode, stateCode).map((c) => ({ id: c.name, name: c.name }))
      : [];

  // ── Generic input handler ─────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone" || name === "branchPhone" || name === "companyPhone" || name === "cbBranchPhone") {
      const onlyNums = value.replace(/[^0-9]/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: onlyNums }));
      setErrors((prev) => ({
        ...prev,
        [name]: onlyNums.length > 0 && onlyNums.length < 10 ? "Must be 10 digits" : "",
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: value.trim() ? "" : prev[name] }));
  };

  // ── Checkbox handler ──────────────────────────────────────────────────────
  const handleCheckboxChange = (e, field = "selectedTypes") => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      const updated = checked
        ? [...(prev[field] || []), value]
        : (prev[field] || []).filter((i) => i !== value);
      setErrors((prevE) => ({ ...prevE, [field]: updated.length === 0 ? "Select at least one" : "" }));
      return { ...prev, [field]: updated };
    });
  };

  // ── Social links ──────────────────────────────────────────────────────────
  const handleAddSocial = (platformField, urlField, linksField) => {
    const platform = formData[platformField];
    const url = formData[urlField];
    if (!platform || !url.trim()) return;
    setFormData((prev) => ({
      ...prev,
      [linksField]: [...(prev[linksField] || []), { platform, url }],
      [platformField]: "",
      [urlField]: "",
    }));
  };

  const removeSocialLink = (linksField, idx) => {
    setFormData((prev) => ({
      ...prev,
      [linksField]: prev[linksField].filter((_, i) => i !== idx),
    }));
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!formData.firstName.trim()) e.firstName = "First Name is required";
    if (!formData.lastName.trim()) e.lastName = "Last Name is required";
    if (!formData.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = "Email is invalid";
    if (!formData.phone.trim()) e.phone = "Phone is required";
    else if (!/^\d{10}$/.test(formData.phone)) e.phone = "Must be 10 digits";
    if (!formData.gender) e.gender = "Please select gender";
    if (!formData.professionaldomain) e.professionaldomain = "Please select a domain";
    if (!formData.professionalroletype) e.professionalroletype = "Please select a role";
    if (!formData.workidentity) e.workidentity = "Please select identity";

    if (businessType === "single") {
      if (!formData.branchName.trim()) e.branchName = "Branch Name is required";
      if (!formData.branchEmail.trim()) e.branchEmail = "Branch Email is required";
      if (!formData.branchPhone.trim()) e.branchPhone = "Branch Phone is required";
      if (!formData.branchStartedDate) e.branchStartedDate = "Start date is required";
      if ((formData.selectedTypes || []).length === 0) e.selectedTypes = "Select at least one service";
      if (!formData.branchCountry) e.branchCountry = "Country is required";
    } else {
      if (!formData.companyName.trim()) e.companyName = "Company Name is required";
      if (!formData.companyEmail.trim()) e.companyEmail = "Company Email is required";
      if (!formData.companyPhone.trim()) e.companyPhone = "Company Phone is required";
      if (!formData.companyStartedDate) e.companyStartedDate = "Start date is required";
      if ((formData.companySelectedTypes || []).length === 0) e.companySelectedTypes = "Select at least one service";
      if (!formData.companyCountry) e.companyCountry = "Country is required";
      if (!formData.cbBranchName.trim()) e.cbBranchName = "Branch Name is required";
      if (!formData.cbBranchLocation.trim()) e.cbBranchLocation = "Branch Location is required";
      if (!formData.cbBranchOpeningDate) e.cbBranchOpeningDate = "Opening date is required";
      if (!formData.cbDataStoreModel) e.cbDataStoreModel = "Please select a data store model";
      if (!formData.cbBranchEmail.trim()) e.cbBranchEmail = "Branch Email is required";
      if (!formData.cbBranchPhone.trim()) e.cbBranchPhone = "Branch Phone is required";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");
    if (!validate()) {
      setSubmitError("Please fill in all required fields correctly.");
      const firstError = document.querySelector(`.${styles.errorMsg}`);
      if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload =
        businessType === "single"
          ? {
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phoneNumber: formData.phone,
              gender: formData.gender,
              professionalRoleType: formData.professionalroletype,
              workIdentity: formData.workidentity,
              professionalDomain: formData.professionaldomain,
              branchName: formData.branchName,
              branchEmail: formData.branchEmail,
              branchPhone: formData.branchPhone,
              branchWebsite: formData.branchWebsite,
              branchStartedDate: formData.branchStartedDate,
              aboutBranch: formData.aboutBranch,
              services: formData.selectedTypes,
              socialMediaLinks: formData.socialLinks,
              businessType: "single",
            }
          : {
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phoneNumber: formData.phone,
              gender: formData.gender,
              professionalRoleType: formData.professionalroletype,
              workIdentity: formData.workidentity,
              professionalDomain: formData.professionaldomain,
              companyName: formData.companyName,
              companyEmail: formData.companyEmail,
              companyPhone: formData.companyPhone,
              companyWebsite: formData.companyWebsite,
              companyStartedDate: formData.companyStartedDate,
              aboutCompany: formData.aboutCompany,
              services: formData.companySelectedTypes,
              socialMediaLinks: formData.companySocialLinks,
              businessType: "company",
              branchDetails: {
                branchName: formData.cbBranchName,
                branchLocation: formData.cbBranchLocation,
                branchOpeningDate: formData.cbBranchOpeningDate,
                dataStoreModel: formData.cbDataStoreModel,
                businessName: formData.cbBusinessName,
                branchEmail: formData.cbBranchEmail,
                branchPhone: formData.cbBranchPhone,
                howManyBranches: formData.cbHowManyBranches,
              },
            };

      const response = await fetch(`${API_URL}vendor-users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSubmitSuccess("Business Registered Successfully!");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const errorData = await response.json();
        setSubmitError(errorData.message || "Registration failed. Please check your details.");
      }
    } catch (err) {
      console.error("Network Error:", err);
      setSubmitError("Server is unreachable. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Reusable field components ─────────────────────────────────────────────
  const Field = ({ label, required, children, error }) => (
    <div className={styles["row-title"]}>
      <h4 className={styles["title-tag"]}>
        {label} {required && <span style={{ color: "#F5790C" }}>*</span>}
      </h4>
      {children}
      {error && <span className={styles.errorMsg}>{error}</span>}
    </div>
  );

  // Social link adder block
  const SocialAdder = ({ platformField, urlField, linksField }) => (
    <div className={styles["row-title"]} style={{ gridColumn: "1 / -1" }}>
      <h4 className={styles["title-tag"]}>Social Medias</h4>
      <div className={styles.socialRow}>
        <select
          name={platformField}
          value={formData[platformField]}
          onChange={handleInputChange}
          className={styles.selectInput}
          style={{ flex: "0 0 160px" }}
        >
          <option value="">Platform</option>
          {SOCIAL_PLATFORMS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input
          type="text"
          name={urlField}
          placeholder="User name (or) full Link"
          value={formData[urlField]}
          onChange={handleInputChange}
          style={{ flex: 1 }}
        />
        <button
          type="button"
          className={styles.addSocialBtn}
          onClick={() => handleAddSocial(platformField, urlField, linksField)}
        >
          Add
        </button>
      </div>
      {(formData[linksField] || []).length > 0 && (
        <div className={styles.socialList}>
          {formData[linksField].map((link, i) => (
            <span key={i} className={styles.socialChip}>
              {link.platform}: {link.url}
              <button type="button" onClick={() => removeSocialLink(linksField, i)}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );

  // Address block
  const AddressBlock = ({ prefix, title }) => {
    const countryKey = `${prefix}Country`;
    const stateKey = `${prefix}State`;
    const cityKey = `${prefix}City`;
    const pinKey = `${prefix}PinCode`;
    const areaKey = `${prefix}Area`;
    const flatKey = `${prefix}Flat`;
    return (
      <div className={styles.addressBlock}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        <div className={styles.formCard}>
          <div className={styles.row}>
            <Field label="Country" required error={errors[countryKey]}>
              <select
                name={countryKey}
                value={formData[countryKey]}
                onChange={(e) => {
                  handleInputChange(e);
                  setFormData((prev) => ({ ...prev, [stateKey]: "", [cityKey]: "" }));
                }}
                className={styles.selectInput}
              >
                <option value="">Select Country</option>
                {allCountries.map((c) => (
                  <option key={c.id} value={c.code}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="State" error={errors[stateKey]}>
              <select
                name={stateKey}
                value={formData[stateKey]}
                onChange={(e) => {
                  handleInputChange(e);
                  setFormData((prev) => ({ ...prev, [cityKey]: "" }));
                }}
                className={styles.selectInput}
                disabled={!formData[countryKey]}
              >
                <option value="">Select State</option>
                {getStates(formData[countryKey]).map((s) => (
                  <option key={s.id} value={s.code}>{s.name}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className={styles.row}>
            <Field label="City" error={errors[cityKey]}>
              <select
                name={cityKey}
                value={formData[cityKey]}
                onChange={handleInputChange}
                className={styles.selectInput}
                disabled={!formData[stateKey]}
              >
                <option value="">Select City</option>
                {getCities(formData[countryKey], formData[stateKey]).map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Pin Code" error={errors[pinKey]}>
              <input
                type="text"
                name={pinKey}
                placeholder="Enter Pin Code"
                value={formData[pinKey]}
                onChange={handleInputChange}
                maxLength={6}
              />
            </Field>
          </div>
          <div className={styles.row}>
            <Field label="Area/Street" error={errors[areaKey]}>
              <input
                type="text"
                name={areaKey}
                placeholder="Enter Area/Street"
                value={formData[areaKey]}
                onChange={handleInputChange}
              />
            </Field>
            <Field label="Flat/House no." error={errors[flatKey]}>
              <input
                type="text"
                name={flatKey}
                placeholder="Enter Flat/House no."
                value={formData[flatKey]}
                onChange={handleInputChange}
              />
            </Field>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* ── Left panel ── */}
      <div className={styles.left}>
        <h1>If You're Here, <br />You've Made The Right Choice.</h1>
        <p>Just drop in your details & we'll have you onboarded quickly.</p>
        <h3 className={styles["tailored-feature"]}>Tailored Features</h3>
        <div className={styles.features}>
          {["Pet Sales"].map((feature) => (
            <div key={feature} className={styles.feature}>
              <h4>{feature}</h4>
              <ul className={styles["ul"]}>
                <li><span><Tik /></span> Mobile App</li>
                <li><span><Tik /></span> Easy Communications</li>
                <li><span><Tik /></span> Advanced Analytics</li>
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className={styles.right}>
        <h2>Register Your Pet Business Free</h2>

        {submitSuccess && (
          <div className={styles.successMessage}>
            <svg className={styles.successIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{submitSuccess}</span>
          </div>
        )}
        {submitError && (
          <div className={styles.errorMessage}>
            <svg className={styles.errorIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{submitError}</span>
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>

          {/* ══════════════════════════════════════════════════
              BUSINESS TYPE
          ══════════════════════════════════════════════════ */}
          <div className={styles.businessTypeSection}>
            <h3 className={styles.sectionTitle}>Business Type</h3>
            <div className={styles.radioGroup}>
              <label className={styles.label2}>
                <input
                  type="radio"
                  name="businessType"
                  value="single"
                  checked={businessType === "single"}
                  onChange={() => setBusinessType("single")}
                />
                Single Branch
              </label>
              <label className={styles.label2}>
                <input
                  type="radio"
                  name="businessType"
                  value="company"
                  checked={businessType === "company"}
                  onChange={() => setBusinessType("company")}
                />
                Company With Branch
              </label>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              USER INFORMATION (shared for both modes)
          ══════════════════════════════════════════════════ */}
          <h3 className={styles.sectionTitle}>Enter User Information</h3>
          <div className={styles.formCard}>
            <div className={styles.row}>
              <Field label="Full Name" required error={errors.firstName}>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Enter Full Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                />
              </Field>
              <Field label="Gender" required error={errors.gender}>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className={styles.selectInput}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Trans">Trans</option>
                </select>
              </Field>
            </div>
            <div className={styles.row}>
              <Field label="Email" required error={errors.email}>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter Email ID"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </Field>
              <Field label="Enter Mobile Number" required error={errors.phone}>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Enter 10-digit mobile Number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  maxLength={10}
                />
              </Field>
            </div>
            <div className={styles.row}>
              <Field label="Role Type" error={errors.professionalroletype}>
                <select
                  name="professionalroletype"
                  value={formData.professionalroletype}
                  onChange={handleInputChange}
                  className={styles.selectInput}
                >
                  <option value="">Select Role Type</option>
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </Field>
              <Field label="Work Identity" error={errors.workidentity}>
                <select
                  name="workidentity"
                  value={formData.workidentity}
                  onChange={handleInputChange}
                  className={styles.selectInput}
                >
                  <option value="">Select Work Identity</option>
                  {IDENTITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className={styles.row}>
              <Field label="Professional Domain" error={errors.professionaldomain}>
                <select
                  name="professionaldomain"
                  value={formData.professionaldomain}
                  onChange={handleInputChange}
                  className={styles.selectInput}
                >
                  <option value="">Select Professional Domain</option>
                  {DOMAIN_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </Field>
              {/* Empty cell to keep grid alignment */}
              <div className={styles["row-title"]} />
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              SINGLE BRANCH — Branch Information
          ══════════════════════════════════════════════════ */}
          {businessType === "single" && (
            <>
              <h3 className={styles.sectionTitle}>Enter Branch Information</h3>
              <div className={styles.formCard}>
                <div className={styles.row}>
                  <Field label="Branch Name" required error={errors.branchName}>
                    <input
                      type="text"
                      name="branchName"
                      placeholder="Enter Business Name"
                      value={formData.branchName}
                      onChange={handleInputChange}
                    />
                  </Field>
                  <Field label="Branch Email" required error={errors.branchEmail}>
                    <input
                      type="email"
                      name="branchEmail"
                      placeholder="Enter Branch Email"
                      value={formData.branchEmail}
                      onChange={handleInputChange}
                    />
                  </Field>
                </div>
                <div className={styles.row}>
                  <Field label="Branch Phone" required error={errors.branchPhone}>
                    <input
                      type="tel"
                      name="branchPhone"
                      placeholder="Enter Branch Phone number"
                      value={formData.branchPhone}
                      onChange={handleInputChange}
                      maxLength={10}
                    />
                  </Field>
                  <Field label="Branch Website" error={errors.branchWebsite}>
                    <input
                      type="text"
                      name="branchWebsite"
                      placeholder="Enter Branch Website"
                      value={formData.branchWebsite}
                      onChange={handleInputChange}
                    />
                  </Field>
                </div>
                <div className={styles.row}>
                  <Field label="Branch Started Date" required error={errors.branchStartedDate}>
                    <input
                      type="date"
                      name="branchStartedDate"
                      value={formData.branchStartedDate}
                      onChange={handleInputChange}
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </Field>
                  {/* Social adder inline */}
                  <div className={styles["row-title"]}>
                    <h4 className={styles["title-tag"]}>Social Medias</h4>
                    <div className={styles.socialRow}>
                      <select
                        name="socialPlatform"
                        value={formData.socialPlatform}
                        onChange={handleInputChange}
                        className={styles.selectInput}
                        style={{ flex: "0 0 120px" }}
                      >
                        <option value="">Platform</option>
                        {SOCIAL_PLATFORMS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        name="socialUrl"
                        placeholder="User name (or) full Link"
                        value={formData.socialUrl}
                        onChange={handleInputChange}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className={styles.addSocialBtn}
                        onClick={() => handleAddSocial("socialPlatform", "socialUrl", "socialLinks")}
                      >
                        Add
                      </button>
                    </div>
                    {(formData.socialLinks || []).length > 0 && (
                      <div className={styles.socialList}>
                        {formData.socialLinks.map((link, i) => (
                          <span key={i} className={styles.socialChip}>
                            {link.platform}: {link.url}
                            <button type="button" onClick={() => removeSocialLink("socialLinks", i)}>×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pet Services checkboxes */}
                <div>
                  <h4 className={styles["checkbox-tag"]}>Pet Services</h4>
                  <div className={styles.checkboxGroup}>
                    {SERVICE_OPTIONS.map((type) => (
                      <label key={type} className={styles.label}>
                        <input
                          type="checkbox"
                          value={type}
                          checked={(formData.selectedTypes || []).includes(type)}
                          onChange={(e) => handleCheckboxChange(e, "selectedTypes")}
                          className={styles.checkBox}
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                  {errors.selectedTypes && (
                    <span className={styles.errorMsg}>{errors.selectedTypes}</span>
                  )}
                </div>

                {/* About Branch */}
                <div className={styles["row-title"]} style={{ width: "100%" }}>
                  <h4 className={styles["title-tag"]}>About Branch</h4>
                  <textarea
                    name="aboutBranch"
                    placeholder="Tell us something about your Branch......(max 500 characters)"
                    value={formData.aboutBranch}
                    onChange={handleInputChange}
                    maxLength={500}
                    rows={4}
                    style={{resize: "vertical", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #ccc", fontFamily: "Poppins", fontSize: "14px" }}
                  />
                </div>
              </div>

              {/* Branch Address */}
              <AddressBlock prefix="branch" title="Branch Address" />
            </>
          )}

          {/* ══════════════════════════════════════════════════
              COMPANY WITH BRANCH — Company Information
          ══════════════════════════════════════════════════ */}
          {businessType === "company" && (
            <>
              <h3 className={styles.sectionTitle}>Enter Company Information</h3>
              <div className={styles.formCard}>
                <div className={styles.row}>
                  <Field label="Company Name" required error={errors.companyName}>
                    <input
                      type="text"
                      name="companyName"
                      placeholder="Enter Business Name"
                      value={formData.companyName}
                      onChange={handleInputChange}
                    />
                  </Field>
                  <Field label="Company Email" required error={errors.companyEmail}>
                    <input
                      type="email"
                      name="companyEmail"
                      placeholder="Enter Company Email"
                      value={formData.companyEmail}
                      onChange={handleInputChange}
                    />
                  </Field>
                </div>
                <div className={styles.row}>
                  <Field label="Company Phone" required error={errors.companyPhone}>
                    <input
                      type="tel"
                      name="companyPhone"
                      placeholder="Enter Company Phone number"
                      value={formData.companyPhone}
                      onChange={handleInputChange}
                      maxLength={10}
                    />
                  </Field>
                  <Field label="Company Website" error={errors.companyWebsite}>
                    <input
                      type="text"
                      name="companyWebsite"
                      placeholder="Enter company Website"
                      value={formData.companyWebsite}
                      onChange={handleInputChange}
                    />
                  </Field>
                </div>
                <div className={styles.row}>
                  <Field label="Company Started Date" required error={errors.companyStartedDate}>
                    <input
                      type="date"
                      name="companyStartedDate"
                      value={formData.companyStartedDate}
                      onChange={handleInputChange}
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </Field>
                  {/* Company Social Medias */}
                  <div className={styles["row-title"]}>
                    <h4 className={styles["title-tag"]}>Social Medias</h4>
                    <div className={styles.socialRow}>
                      <select
                        name="companySocialPlatform"
                        value={formData.companySocialPlatform}
                        onChange={handleInputChange}
                        className={styles.selectInput}
                        style={{ flex: "0 0 120px" }}
                      >
                        <option value="">Platform</option>
                        {SOCIAL_PLATFORMS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        name="companySocialUrl"
                        placeholder="User name (or) full Link"
                        value={formData.companySocialUrl}
                        onChange={handleInputChange}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className={styles.addSocialBtn}
                        onClick={() =>
                          handleAddSocial("companySocialPlatform", "companySocialUrl", "companySocialLinks")
                        }
                      >
                        Add
                      </button>
                    </div>
                    {(formData.companySocialLinks || []).length > 0 && (
                      <div className={styles.socialList}>
                        {formData.companySocialLinks.map((link, i) => (
                          <span key={i} className={styles.socialChip}>
                            {link.platform}: {link.url}
                            <button type="button" onClick={() => removeSocialLink("companySocialLinks", i)}>×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pet Services */}
                <div>
                  <h4 className={styles["checkbox-tag"]}>Pet Services</h4>
                  <div className={styles.checkboxGroup}>
                    {SERVICE_OPTIONS.map((type) => (
                      <label key={type} className={styles.label}>
                        <input
                          type="checkbox"
                          value={type}
                          checked={(formData.companySelectedTypes || []).includes(type)}
                          onChange={(e) => handleCheckboxChange(e, "companySelectedTypes")}
                          className={styles.checkBox}
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                  {errors.companySelectedTypes && (
                    <span className={styles.errorMsg}>{errors.companySelectedTypes}</span>
                  )}
                </div>

                {/* About Company */}
                <div className={styles["row-title"]} style={{ width: "100%" }}>
                  <h4 className={styles["title-tag"]}>
                    About Company <span style={{ color: "#F5790C" }}>*</span>
                  </h4>
                  <textarea
                    name="aboutCompany"
                    placeholder="Tell us something about your company......(max 500 characters)"
                    value={formData.aboutCompany}
                    onChange={handleInputChange}
                    maxLength={500}
                    rows={4}
                    style={{ width: "100%", resize: "vertical", padding: "0.6rem 0.8rem", borderRadius: "6px", border: "1px solid #ccc", fontFamily: "Poppins", fontSize: "14px" }}
                  />
                </div>
              </div>

              {/* Company Address */}
              <AddressBlock prefix="company" title="Company Address" />

              {/* ── Branch Details ── */}
              <h3 className={styles.sectionTitle}>Enter Branch Details</h3>
              <div className={styles.formCard}>
                <div className={styles.row}>
                  <Field label="Branch name" required error={errors.cbBranchName}>
                    <input
                      type="text"
                      name="cbBranchName"
                      placeholder="Enter Branch Name"
                      value={formData.cbBranchName}
                      onChange={handleInputChange}
                    />
                  </Field>
                  <Field label="Branch Location" required error={errors.cbBranchLocation}>
                    <input
                      ref={locationRef}
                      type="text"
                      name="cbBranchLocation"
                      placeholder="Select Branch location"
                      value={formData.cbBranchLocation}
                      onChange={handleInputChange}
                    />
                  </Field>
                </div>
                <div className={styles.row}>
                  <Field label="Branch Opening Date" required error={errors.cbBranchOpeningDate}>
                    <input
                      type="date"
                      name="cbBranchOpeningDate"
                      value={formData.cbBranchOpeningDate}
                      onChange={handleInputChange}
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </Field>
                  <Field label="Present Data store model" required error={errors.cbDataStoreModel}>
                    <select
                      name="cbDataStoreModel"
                      value={formData.cbDataStoreModel}
                      onChange={handleInputChange}
                      className={styles.selectInput}
                    >
                      <option value="">Select Data store type</option>
                      {DATA_STORE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className={styles.row}>
                  <Field label="Business Name (optional)" error={errors.cbBusinessName}>
                    <input
                      type="text"
                      name="cbBusinessName"
                      placeholder="Enter Business name"
                      value={formData.cbBusinessName}
                      onChange={handleInputChange}
                    />
                  </Field>
                  <Field label="Branch Email" required error={errors.cbBranchEmail}>
                    <input
                      type="email"
                      name="cbBranchEmail"
                      placeholder="Enter branch email"
                      value={formData.cbBranchEmail}
                      onChange={handleInputChange}
                    />
                  </Field>
                </div>
                <div className={styles.row}>
                  <Field label="Branch Phone Number" required error={errors.cbBranchPhone}>
                    <input
                      type="tel"
                      name="cbBranchPhone"
                      placeholder="Enter 10-digit phone number"
                      value={formData.cbBranchPhone}
                      onChange={handleInputChange}
                      maxLength={10}
                    />
                  </Field>
                  <Field label="How many branches you have" error={errors.cbHowManyBranches}>
                    <select
                      name="cbHowManyBranches"
                      value={formData.cbHowManyBranches}
                      onChange={handleInputChange}
                      className={styles.selectInput}
                    >
                      <option value="">Select options here</option>
                      {BRANCH_COUNT_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            </>
          )}

          {/* ── Privacy + Submit ── */}
          <p className={styles.privacy}>
            We're committed to your privacy and will only use the above information to contact you sparingly.
          </p>
          <button
            className={`${styles["submit-btn"]} ${isSubmitting ? styles.submitting : ""}`}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Sumbit"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PetBusinessForm;