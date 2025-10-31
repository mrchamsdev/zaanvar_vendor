import React, { useEffect, useState } from "react";
import styles from "../../styles/pet-sales/petForm.module.css";
import { Max2 } from "@/public/image/SVG";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import AddNewAddressPopup from "./addNewAddressPopup";
import { WebApimanager } from "../utilities/WebApiManager";
import useStore from "../state/useStore";
import AddressDropdown from "./addAddressDropDown";

const PetForm = ({ pets = [], onSave, initialData, currentUser }) => {
  const { getJwtToken, getUserInfo } = useStore();
  const userInfo = getUserInfo();
  const jwt = getJwtToken();
  const webApi = new WebApimanager(jwt);
  console.log(userInfo, "currentUsercurrentUser");
  // setData Here
  const [formData, setFormData] = useState(() => ({
    petType: initialData?.petType || "",
    petBreed: initialData?.breed || "",
    age: initialData?.petAge || "",
    color: initialData?.color || "",
    vaccination: initialData?.vaccination || initialData?.vaccinated || "N/A",
    negotiable: initialData?.negotiable || "",
    size: initialData?.size || "",
    hasParents: initialData?.hasParents || "",
    petName: initialData?.petName || "",
    gender: initialData?.petGender || "",
    petsVariety: initialData?.petVariety || "",
    price: initialData?.price?.replace("₹ ", "") || "",
    status: initialData?.petStatus || "",

    haveParentsOfThisPet: initialData?.sireMother || "",
    address: initialData?.petAddress || "",

    father: initialData?.father || "",
    mother: initialData?.mother || "",
    isAddingNew: false,
  }));

  const [imagePreviews, setImagePreviews] = useState(
    initialData?.img ? [initialData.img] : []
  );

  const [videoPreviews, setVideoPreviews] = useState(initialData?.videos || []);

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const selectedAddress =
    userInfo?.addresses?.find(
      (addr) => addr.id === pets?.addressId || addr.id === pets?.addressId
    ) ||
    userInfo?.addresses?.[0] ||
    pets?.id;

  const formattedAddress = selectedAddress
    ? [
        selectedAddress.flatOrHouseNoOrBuildingOrCompanyOrApartment,
        selectedAddress.areaOrStreetOrSectorOrVillage,
        selectedAddress.landmark,
        selectedAddress.townOrCity,
        selectedAddress.state,
        selectedAddress.country,
        selectedAddress.pinCode,
      ]
        .filter(Boolean)
        .join(", ")
    : pets?.address || "";

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (!value) {
      let message = "";
      switch (name) {
        case "petType":
          message = "Please select pet type";
          break;
        case "petBreed":
          message = "Please select pet breed";
          break;
        case "age":
          message = "Please select age";
          break;
        case "color":
          message = "Please select color";
          break;
        case "vaccination":
          message = "Please select vaccination";
          break;
        case "negotiable":
          message = "Please select negotiable option";
          break;
        case "size":
          message = "Please select size";
          break;
        case "hasParents":
          message = "Please select parent info";
          break;
        case "petName":
          message = "Please enter pet name";
          break;
        case "gender":
          message = "Please select gender";
          break;
        case "petVariety":
          message = "Please select pet variety";
          break;
        case "price":
          message = "Please enter price";
          break;
        case "status":
          message = "Please select status";
          break;
        case "sireMother":
          message = "Please select sire/mother info";
          break;
        case "address":
          message = "Please enter address";
          break;
        default:
          message = "This field is required";
      }
      setErrors((prev) => ({ ...prev, [name]: message }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...previews]);
    if (errors.images) setErrors({ ...errors, images: "" });
  };

  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setVideoPreviews((prev) => [...prev, ...previews]);
    if (errors.videos) setErrors({ ...errors, videos: "" });
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate
    const requiredFields = [
      "petType",
      "petBreed",
      "age",
      "color",
      "vaccination",
      "negotiable",
      "size",
      "hasParents",
      "petName",
      "gender",
      "petVariety",
      "price",
      "status",
      "sireMother",
      "address",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field]) {
        switch (field) {
          case "petType":
            newErrors[field] = "Please select pet type";
            break;
          case "petBreed":
            newErrors[field] = "Please select pet breed";
            break;
          case "age":
            newErrors[field] = "Please select age";
            break;
          case "color":
            newErrors[field] = "Please select color";
            break;
          case "vaccination":
            newErrors[field] = "Please select vaccination";
            break;
          case "negotiable":
            newErrors[field] = "Please select negotiable option";
            break;
          case "size":
            newErrors[field] = "Please select size";
            break;
          case "hasParents":
            newErrors[field] = "Please select parent info";
            break;
          case "petName":
            newErrors[field] = "Please enter pet name";
            break;
          case "gender":
            newErrors[field] = "Please select gender";
            break;
          case "petVariety":
            newErrors[field] = "Please select pet variety";
            break;
          case "price":
            newErrors[field] = "Please enter price";
            break;
          case "status":
            newErrors[field] = "Please select status";
            break;
          case "sireMother":
            newErrors[field] = "Please select sire/mother info";
            break;
          case "address":
            newErrors[field] = "Please enter address";
            break;
          default:
            newErrors[field] = "This field is required";
        }
      }
    });

    if (imagePreviews.length === 0)
      newErrors.images = "Please upload at least one image";

    if (formData.price && Number(formData.price) > 10000000000) {
      newErrors.price = "Please enter a value less than 100 crore.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    console.log(errors, "errors");
  });
  const handleSave = () => {
    if (validateForm()) {
      const newPet = {
        id: initialData?.id || Math.random().toString(36).substr(2, 9),
        petType: formData.petType,
        petBreed: formData.petBreed,
        age: formData.petAge,
        color: formData.color,
        vaccination: formData.vaccination,
        negotiable: formData.negotiable,
        size: formData.size,
        hasParents: formData.hasParents,
        petName: formData.petName,
        gender: formData.gender,
        petVariety: formData.petVariety,
        price: `₹ ${formData.price}`,
        stutus: formData.status,
        sireMother: formData.sireMother,
        // address: formData.address,
        fatherName: formData.fatherName,
        motherName: formData.motherName,
        img: imagePreviews[0],
        videos: videoPreviews,
        addressId: formData.addressId,
      };

      onSave(newPet);

      const saved = formData.savedAddresses || [];
      if (formData.address && !saved.includes(formData.address)) {
        setFormData({
          ...formData,
          savedAddresses: [...saved, formData.address],
          isAddingNew: false,
        });
      }
    }
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  return (
    <div className={styles.divWrapper}>
      {/* LEFT MEDIA SECTION */}
      <div className={styles.mediaSection}>
        {/* Images */}
        <div className={styles.uploadBox}>
          <label>
            <div className={styles.imageContainer}>
              <Max2 />
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={handleImageChange}
            />
          </label>
          <p>Add Your Images Here</p>

          {imagePreviews.length > 0 && (
            <Slider {...sliderSettings} className={styles.previewSlider}>
              {imagePreviews.map((src, i) => (
                <div key={i} className={styles.previewSlideWrapper}>
                  <img
                    src={src}
                    alt={`preview-${i}`}
                    className={styles.previewImage}
                  />
                  <button
                    onClick={() =>
                      setImagePreviews((prev) =>
                        prev.filter((_, idx) => idx !== i)
                      )
                    }
                    className={styles.removeBtn}
                  >
                    ×
                  </button>
                </div>
              ))}
            </Slider>
          )}
          {errors.images && (
            <span className={styles.mediaError}>{errors.images}</span>
          )}
        </div>

        {/* Videos */}
        <div className={styles.uploadBox}>
          <label>
            <div className={styles.imageContainer}>
              <Max2 />
            </div>
            <input
              type="file"
              accept="video/*"
              multiple
              style={{ display: "none" }}
              onChange={handleVideoChange}
            />
          </label>
          <p>Add Your Videos Here</p>

          <Slider {...sliderSettings} className={styles.previewSlider}>
            {videoPreviews.map((src, i) => (
              <div key={i} className={styles.previewSlideWrapper}>
                <video src={src} controls className={styles.previewVideo} />
                <button
                  onClick={() =>
                    setVideoPreviews((prev) =>
                      prev.filter((_, idx) => idx !== i)
                    )
                  }
                  className={styles.removeBtn}
                >
                  ×
                </button>
              </div>
            ))}
          </Slider>
        </div>
      </div>

      {/* FORM SECTION */}
      <div className={styles.formWrapper}>
        <div className={styles.scrollContainer}>
          <h3 className={styles.formTitle}>Pet Details</h3>

          <div className={styles.twoColumn}>
            {/* LEFT COLUMN */}
            <div className={styles.column}>
              {/* Pet Type */}
              <div className={styles.formField}>
                <label className={styles.label}>Pet Type</label>
                <select
                  name="petType"
                  value={formData.petType || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={styles.select}
                >
                  <option value="">Select here</option>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                </select>
                {errors.petType && (
                  <span className={styles.error}>{errors.petType}</span>
                )}
              </div>

              {/* Pet Breed */}
              <div className={styles.formField}>
                <label className={styles.label}>Pet Breed</label>
                <select
                  name="petBreed"
                  value={formData.petBreed || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={styles.select}
                >
                  <option value="">Select here</option>
                  <option value="Labrador">Labrador</option>
                  <option value="Beagle">Beagle</option>
                  <option value="Pug">Pug</option>
                  <option value="Husky">Husky</option>
                </select>
                {errors.petBreed && (
                  <span className={styles.error}>{errors.petBreed}</span>
                )}
              </div>

              {/* Age */}
              <div className={styles.formField}>
                <label className={styles.label}>Age</label>
                <select
                  name="age"
                  value={formData.age || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={styles.select}
                >
                  <option value="">Select here</option>
                  <option value="0 - 6 months">0 - 6 months</option>
                  <option value="6 - 12 Months">6 - 12 Months</option>
                  <option value="1 Year">1 Year</option>
                  <option value="2+ Years">2+ Years</option>
                </select>
                {errors.age && (
                  <span className={styles.error}>{errors.age}</span>
                )}
              </div>

              {/* Color */}
              <div className={styles.formField}>
                <label className={styles.label}>Color</label>
                <select
                  name="color"
                  value={formData.color || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={styles.select}
                >
                  <option value="">Select here</option>
                  <option value="Black">Black</option>
                  <option value="Brown">Brown</option>
                  <option value="White">White</option>
                  <option value="Golden">Golden</option>
                </select>
                {errors.color && (
                  <span className={styles.error}>{errors.color}</span>
                )}
              </div>

              {/* Vaccination */}
              <div className={styles.formField}>
                <label className={styles.label}>Vaccinations Done</label>
                <select
                  name="vaccination"
                  value={formData.vaccination || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={styles.select}
                >
                  <option value="">Select here</option>
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3+">3+</option>
                </select>
                {errors.vaccination && (
                  <span className={styles.error}>{errors.vaccination}</span>
                )}
              </div>

              {/* Negotiable */}
              <div className={styles.formField}>
                <label className={styles.label}>Negotiable</label>
                <select
                  name="negotiable"
                  value={formData.negotiable || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={styles.select}
                >
                  <option value="">Select here</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                {errors.negotiable && (
                  <span className={styles.error}>{errors.negotiable}</span>
                )}
              </div>

              {/* Size */}
              <div className={styles.formField}>
                <label className={styles.label}>Size</label>
                <select
                  name="size"
                  value={formData.size || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={styles.select}
                >
                  <option value="">Select here</option>
                  <option value="Small">Small</option>
                  <option value="Medium">Medium</option>
                  <option value="Large">Large</option>
                </select>
                {errors.size && (
                  <span className={styles.error}>{errors.size}</span>
                )}
              </div>

              {/* Has Parents */}
              {/* Has Parents */}
              <div className={styles.formField}>
                <label className={styles.label}>
                  Does this pet have parents?
                </label>
                <select
                  name="hasParents"
                  value={formData.hasParents || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={styles.select}
                >
                  <option value="">Select here</option>
                  <option value="Had Father">Had Father</option>
                  <option value="Had Mother">Had Mother</option>
                  <option value="Both">Both</option>
                </select>
                {errors.hasParents && (
                  <span className={styles.error}>{errors.hasParents}</span>
                )}
              </div>

              {/* Conditional Parent Fields */}

              {formData.hasParents === "Both" && (
                <>
                  <div className={styles.formField}>
                    <label className={styles.label}>Father's Name</label>
                    <input
                      type="text"
                      name="fatherName"
                      value={formData.fatherName || ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={styles.select}
                    />
                    {errors.fatherName && (
                      <span className={styles.error}>{errors.fatherName}</span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div className={styles.column}>
              {/* Pet Name */}
              <div className={styles.formField}>
                <label className={styles.label}>Pet Name</label>
                <input
                  type="text"
                  name="petName"
                  value={formData.petName || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={styles.select}
                />
                {errors.petName && (
                  <span className={styles.error}>{errors.petName}</span>
                )}
              </div>

              {/* Gender */}
              <div className={styles.formField}>
                <label className={styles.label}>Gender</label>
                <select
                  name="gender"
                  value={formData.gender || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={styles.select}
                >
                  <option value="">Select here</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                {errors.gender && (
                  <span className={styles.error}>{errors.gender}</span>
                )}
              </div>

              {/* Pet Variety */}
              <div className={styles.formField}>
                <label className={styles.label}>Pet Variety</label>
                <select
                  name="petVariety"
                  value={formData.petVariety || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={styles.select}
                >
                  <option value="">Select here</option>
                  <option value="Pet Quality">Pet Quality</option>
                  <option value="KCI Registered">KCI Registered</option>
                  <option value="Championship">Championship</option>
                </select>
                {errors.petVariety && (
                  <span className={styles.error}>{errors.petVariety}</span>
                )}
              </div>

              {/* Price */}
              <div className={styles.formField}>
                <label className={styles.label}>Price</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={styles.select}
                  max={10000000000}
                />
                {errors.price && (
                  <span className={styles.error}>{errors.price}</span>
                )}
              </div>

              {/* Status */}
              <div className={styles.formField}>
                <label className={styles.label}>Status</label>
                <select
                  name="status"
                  value={formData.status || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={styles.select}
                >
                  <option value="">Select here</option>
                  <option value="Available">Available</option>
                  <option value="Sold">Sold</option>
                </select>
                {errors.status && (
                  <span className={styles.error}>{errors.status}</span>
                )}
              </div>

              {/* Sire/Mother Info */}
              <div className={styles.formField}>
                <label className={styles.label}>Sire/Mother Info</label>
                <select
                  name="sireMother"
                  value={formData.sireMother || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={styles.select}
                >
                  <option value="">Select here</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                {errors.sireMother && (
                  <span className={styles.error}>{errors.sireMother}</span>
                )}
              </div>

              {/* Address */}
              {/* ADDRESS FIELD */}
              {/* Address */}
              <div className={styles.formField} style={{ width: "100%" }}>
                <label className={styles.label}>Address</label>

                {/* <select
                  name="addressId"
                  value={formData?.addressId || ""}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (value === "new") {
                      setFormData((prev) => ({
                        ...prev,
                        address: "",
                        addressId: "",
                        isAddingNew: true,
                      }));
                    } else {
                      const selectedAddr = userInfo?.addresses?.find(
                        (addr) => addr.id === Number(value)
                      );

                      const formattedAddr = selectedAddr
                        ? [
                            selectedAddr.flatOrHouseNoOrBuildingOrCompanyOrApartment,
                            selectedAddr.areaOrStreetOrSectorOrVillage,
                            selectedAddr.landmark,
                            selectedAddr.townOrCity,
                            selectedAddr.state,
                            selectedAddr.country,
                            selectedAddr.pinCode,
                          ]
                            .filter(Boolean)
                            .join(", ")
                        : pets?.address || ""; 

                      setFormData((prev) => ({
                        ...prev,
                        address: formattedAddr,
                        addressId: Number(value),
                        isAddingNew: false,
                      }));
                    }

                    if (errors.address) setErrors({ ...errors, address: "" });
                  }}
                  onBlur={handleBlur}
                  className={styles.select}
                >
                  <option value="">Select here</option>
                  <option value="new">+ Add New Address</option>

                
                  {userInfo?.addresses?.map((addr) => {
                    const formattedAddr = [
                      addr.flatOrHouseNoOrBuildingOrCompanyOrApartment,
                      addr.areaOrStreetOrSectorOrVillage,
                      addr.landmark,
                      addr.townOrCity,
                      addr.state,
                      addr.country,
                      addr.pinCode,
                    ]
                      .filter(Boolean)
                      .join(", ");
                    return (
                      <option key={addr.id} value={addr.id}>
                        {formattedAddr}
                      </option>
                    );
                  })}

                  {formData.savedAddresses?.map((addr) => (
                    <option key={addr.id} value={addr.id}>
                      {addr.value}
                    </option>
                  ))}
                </select> */}

               
                {formData.isAddingNew && (
    <AddNewAddressPopup
      postFormData={formData}
      onSaveAddress={(newAddress, isDefault) => {
        const newId = Math.floor(Math.random() * 1000000); 
        setFormData((prev) => ({
          ...prev,
          address: newAddress,
          address: newId,
          savedAddresses: [
            ...(prev.savedAddresses || []),
            { id: newId, value: newAddress },
          ],
          isAddingNew: false,
        }));
      }}
      onClose={() =>
        setFormData((prev) => ({
          ...prev,
          isAddingNew: false,
        }))
      }
    />
  )}
                <AddressDropdown
                  formData={formData}
                  setFormData={setFormData}
                  errors={errors}
                  userInfo={userInfo}
                />

                {errors.address && (
                  <span className={styles.error}>{errors.address}</span>
                )}
              </div>

              {/*Mother  */}
              {formData.hasParents === "Had Mother" && (
                <div className={styles.formField}>
                  <label className={styles.label}>Mother's Name</label>
                  <input
                    type="text"
                    name="motherName"
                    value={formData.motherName || ""}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={styles.select}
                  />
                  {errors.motherName && (
                    <span className={styles.error}>{errors.motherName}</span>
                  )}
                </div>
              )}

              {/* Father */}
              {formData.hasParents === "Had Father" && (
                <div className={styles.formField}>
                  <label className={styles.label}>Father's Name</label>
                  <input
                    type="text"
                    name="fatherName"
                    value={formData.fatherName || ""}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={styles.select}
                  />
                  {errors.fatherName && (
                    <span className={styles.error}>{errors.fatherName}</span>
                  )}
                </div>
              )}

              {/* Both */}
              {formData.hasParents === "Both" && (
                <>
                  <div className={styles.formField}>
                    <label className={styles.label}>Mother's Name</label>
                    <input
                      type="text"
                      name="motherName"
                      value={formData.motherName || ""}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={styles.select}
                    />
                    {errors.motherName && (
                      <span className={styles.error}>{errors.motherName}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* BUTTONS */}
        <div className={styles.buttonContainer}>
          {/* <button className={styles.cancelBtn} >Cancel</button> */}
          <button className={styles.saveBtn} onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default PetForm;
