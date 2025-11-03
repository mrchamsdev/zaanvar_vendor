import useStore from "@/components/state/useStore";
import { WebApimanager } from "@/components/utilities/WebApiManager";
import React, { useEffect, useRef, useState } from "react";
import styles from "../../styles/register/settingsregister.module.css"
import ImageCropperModal from "@/components/register/imageCropperModule";
import CustomInputElement2 from "@/components/register/customInputcom";
import DropDownv1 from "@/components/register/dropdown";
import CustomInputComp from "@/components/register/customInput";

const calculateAge = (dob) => {
  const dobDate = new Date(dob);
  const today = new Date();

  let years = today.getFullYear() - dobDate.getFullYear();
  let months = today.getMonth() - dobDate.getMonth();

  // Adjust if the birth month hasn't occurred yet this year
  if (months < 0) {
    years--;
    months += 12;
  }

  return `${years} years ${months} month${months !== 1 ? "s" : ""}`;
};

const AddNewPetPopup = ({
    
  isAddPopupOpen,
  setIsAddPopupOpen,
  fetchPetData = [],
  petData = null,
}) => {
  const { getJwtToken } = useStore();
  const jwt = getJwtToken();
  const webApi = new WebApimanager(jwt);
  const popupRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [image, setImage] = useState(null);
  const [breedOptions, setBreedOptions] = useState([]);
  const [breed, setBreed] = useState([]);
  const [selectedFile, setSelectedFile] = useState("No file chosen");
  const [selectedFilekci, setSelectedFilekci] = useState("No file chosen");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [locationDetails, setLocationDetails] = useState("");

  // Subscribe to global location selected from CountryStateCityDropdown
  const selectedLocation = useStore((s) => s.selectedLocation);
  const selectedCountryName = useStore((s) => s.selectedCountryName);
  const petColors = [
    "Select Color",
    "Black",
    "White",
    "Brown",
    "Red",
    "Gold",
    "Cream",
    "Yellow",
    "Gray",
    "Blue",
    "Fawn",
    "Tan",
    "Buff",
    "Brindle",
    "Merle",
    "Harlequin",
    "Sable",
    "Bicolor",
    "Tricolor",
    "Tuxedo",
    "Roan",
    "Spotted",
    "Ticked",
    "Particolor",
    "Blenheim",
    "Domino",
  ];

  // Keep local fallback in sync when user selects location from dropdown
  useEffect(() => {
    if (selectedLocation) {
      setLocationDetails(selectedLocation);
    }
    console.log(selectedCountryName, "selectedLocation");
  }, [selectedLocation]);
  console.log(breed, "breedOptions");

  // Fallback: initialize from cookie if store is empty
  useEffect(() => {
    if (selectedLocation) return;
    try {
      const userLocation = Cookies.get("user_location");
      if (!userLocation) return;
      const locationObj = JSON.parse(userLocation);
      let { city, region } = locationObj || {};
      if (city) city = decodeURIComponent(city);
      if (region) region = decodeURIComponent(region);
      let loc = "";
      if (city && city !== "Unknown") {
        loc += city;
      }
      if (region && region !== "Unknown") {
        loc += loc ? `, ${region}` : region;
      }
      if (!loc) loc = "Unknown Location";
      setLocationDetails(loc);
    } catch (_) {
      // ignore cookie parse errors
    }
  }, [selectedLocation]);

  const [apiProcessing, setApiProcessing] = useState({
    loader: false,
    message: "Loading...",
  });
  const [isMobile, setIsMobile] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);

  useEffect(() => {
    // Only run in client-side
    if (typeof window !== "undefined") {
      // Function to update screen size
      const handleResize = () => {
        setIsMobile(window.innerWidth <= 768);
      };

      // Set initial value
      handleResize();

      // Add event listener
      window.addEventListener("resize", handleResize);

      // Cleanup on unmount
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  const [formData, setFormData] = useState({
    petName: "",
    petAge: "",
    petType: "",
    color: "",
    breed: "",
    additionalInfo: "",
    weight: "",
    vaccinated: null,
    kci: null,
    championship: "",
    Events: "",
    skills: "",
    instagramLink: "",
    petGender: "",
    petImage: "",
    vaccineCertificate: "",
    kciCertificate: "",
    dob: "",
    spayedOrNeutered: "",
    medication: "",
    size: "",
    healthCondition: "",
    petWeightIn: "",
  });

  useEffect(() => {
    if (petData) {
      console.log(petData, "petData");
      setFormData({
        petName: petData.petName || "",
        petAge: petData.petAge || "",
        petType: petData.petType || "",
        color: petData.color || "",
        breed: petData.breed || "",
        additionalInfo: petData.additionalInfo || "",
        weight:
          petData?.weight?.endsWith("kg") || petData?.weight?.endsWith("lb")
            ? petData.weight.split(" ")[0]
            : petData?.weight,
        petWeightIn: petData?.weight?.endsWith("kg") ? "kg" : "lb",
        vaccinated: petData.vaccinated ?? null,
        kci: petData.kci || "",
        championship: petData.championship || "",
        Events: petData.Events || "",
        skills: petData.skills || "",
        instagramLink: petData.instagramLink || "",
        petGender: petData.petGender || "",
        petImage: petData.petImage,
        vaccineCertificate: petData.vaccineCertificate || "",
        kciCertificate: petData.kciCertificate || "",
        spayedOrNeutered: petData.spayedOrNeutered || "",
        dob: petData?.birthday?.slice(0, 10) || "",
        medication: petData.medication || "",
        size: petData.size || "",
        healthCondition: petData.doesYourPetHasAnyHealthIssues || "",
      });
    } else {
      // Reset formData when adding a new pet
      setFormData({
        petName: "",
        petAge: "",
        petType: "",
        color: "",
        breed: "",
        additionalInfo: "",
        weight: "",
        vaccinated: null,
        kci: "",
        championship: "",
        Events: "",
        skills: "",
        instagramLink: "",
        petGender: "",
        petImage: "",
        vaccineCertificate: "",
        kciCertificate: "",
        dob: "",
        spayedOrNeutered: "",
        medication: "",
        size: "",
        healthCondition: "",
        petWeightIn: "",
      });
    }
  }, [petData]);

  // Load breed data for edits based on petType
  useEffect(() => {
    if (petData) {
      if (petData.petType === "Dog") {
        getDogTypes();
      } else if (petData.petType === "Cat") {
        getcatTypes();
      }
    }
  }, [petData]);

  // Auto-set size when breed data is loaded or breed changes
  useEffect(() => {
    if (formData.breed && formData.breed !== "select" && breed.length > 0) {
      const selectedBreed = breed.find(
        (b) => b["Breed Name"] === formData.breed
      );
      if (selectedBreed && selectedBreed.Size) {
        setFormData((prev) => ({
          ...prev,
          size: selectedBreed.Size.trim(),
        }));
        setErrors((prev) => ({ ...prev, size: "" }));
      } else {
        setFormData((prev) => ({
          ...prev,
          size: "select",
        }));
        // setErrors((prev) => ({
        //   ...prev,
        //   size: "Size not available for this breed.",
        // }));
      }
    }
  }, [breed, formData.breed]);

  const handleVictoriaInfoChange = (inputValue) => {
    setFormData((prev) => ({
      ...prev,
      additionalInfo: inputValue,
    }));
  };

  const handleChange = async (e) => {
    const { name, value, type, files } = e.target;
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setErrors((prev) => ({
      ...prev,
      [name]:
        value.trim() === ""
          ? `${
              name === "petName"
                ? "Pet Name"
                : name === "petAge"
                ? "Pet Age"
                : name === "color"
                ? "Color"
                : name === "weight"
                ? "Weight"
                : name === "petType"
                ? "Pet Type"
                : name === "petGender"
                ? "Gender"
                : name === "breed"
                ? "Breed"
                : name === "dob"
                ? "DOB"
                : name === "spayedOrNeutered"
                ? "Spayed/Nuetral"
                : name === "medication"
                ? "Medication"
                : name === "size"
                ? "Size"
                : name === "healthCondition"
                ? "Health Condition"
                : ""
            } is required.`
          : "",
    }));

    if (type === "file") {
      setFormData({
        ...formData,
        [name]: files[0],
      });
      if (name === "vaccineCertificate" && files[0]) {
        setSelectedFile(files[0].name);
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleChange2 = async (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      setFormData({
        ...formData,
        [name]: files[0],
      });
      if (name === "kciCertificate" && files[0]) {
        setSelectedFilekci(files[0].name);
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  useEffect(() => {
    if (isAddPopupOpen) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
    return () => document.body.classList.remove("no-scroll");
  }, [isAddPopupOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setIsAddPopupOpen(false);
        setCurrentStep(1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setIsAddPopupOpen]);

  const instagramRegex =
    /^(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/[A-Za-z0-9._%-]+\/?$/;

  const handleInputChange = (field, value) => {
    // Allow only numbers for weight, but not for petAge
    if (field === "weight") {
      value = value.replace(/[^0-9]/g, "");
    }

    // Instagram URL validation
    if (field === "instagramLink") {
      if (value && !instagramRegex.test(value)) {
        setErrors((prev) => ({
          ...prev,
          instagramLink:
            "Please check your Instagram URL & enter a valid Instagram URL (ex: https://instagram.com/john_doe)",
        }));
      } else {
        setErrors((prev) => ({ ...prev, instagramLink: "" }));
      }
    }

    // Update form data
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-populate size when breed is selected
    if (field === "breed" && value !== "select") {
      const selectedBreed = breed.find((b) => b["Breed Name"] === value);
      if (selectedBreed && selectedBreed.Size) {
        const size = selectedBreed.Size.trim();
        console.log(`Selected Breed: ${value}, Size: ${size}`);
        setFormData((prev) => ({
          ...prev,
          size: size,
        }));
        setErrors((prev) => ({ ...prev, size: "" }));
      } else {
        setFormData((prev) => ({
          ...prev,
          size: "select",
        }));
        setErrors((prev) => ({
          ...prev,
          size: "Size not available for this breed.",
        }));
      }
    }
  };

  const getDogTypes = async () => {
    try {
      const dogResponse = await webApi.get("dog/dogsFromSheet");
      if (dogResponse.status === 200) {
        const breedNames = dogResponse.data.data.map(
          (breed) => breed?.["Breed Name"]
        );
        setBreedOptions(breedNames);
        setBreed(dogResponse.data.data);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const getcatTypes = async () => {
    try {
      const dogResponse = await webApi.get("dogAndCat/catTypes");
      if (dogResponse.status === 200) {
        const breedNames = dogResponse.data.data.map((breed) => breed.name);
        setBreedOptions(breedNames);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleSubmit = async () => {
    const newErrors = {};

    if (!formData.petName.trim()) {
      newErrors.petName = "Pet Name is required.";
    }
    if (!formData.petImage) {
      newErrors.petImage = "Please upload an Image.";
    }
    if (!formData.petAge.trim()) {
      newErrors.petAge = "Pet Age is required.";
    }
    if (!formData.color.trim() || formData.color === "Select Color") {
      newErrors.color = "Pet color is required.";
    }
    // if (!formData.dob.trim()) {
    //   newErrors.dob = "DOB is required.";
    // }
    // if (!formData.size || formData.size === "select") {
    //   newErrors.size = "Pet size is required.";
    // }
    // if (!formData.healthCondition.trim()) {
    //   newErrors.healthCondition = "Health Condition is required.";
    // }
    if (!formData.medication.trim()) {
      newErrors.medication = "Medication is required.";
    }
    if (!String(formData.weight).trim()) {
      newErrors.weight = "Pet weight is required.";
    } else if (!formData.petWeightIn) {
      newErrors.weight = "Select pet weight type";
    }
    if (!formData.petType || formData.petType === "select") {
      newErrors.petType = "Pet Type is required.";
    }
    if (!formData.petGender || formData.petGender === "select") {
      newErrors.petGender = "Pet Gender is required.";
    }
    if (!formData.breed || formData.breed === "select") {
      newErrors.breed = "Pet Breed is required.";
    }
    if (
      formData.instagramLink &&
      !instagramRegex.test(formData.instagramLink)
    ) {
      newErrors.instagramLink =
        "Please check your Instagram URL & enter a valid Instagram URL (ex: https://instagram.com/john_doe)";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      console.log(newErrors,"ssssssssss")
      return; // Stop processing if there are errors
    }

    setErrors(newErrors);
    const {
      petName,
      petAge,
      petType,
      color,
      breed,
      additionalInfo,
      weight,
      vaccinated,
      kci,
      championship,
      Events,
      skills,
      instagramLink,
      petGender,
      dob,
      spayedOrNeutered,
      medication,
    //   size,
      healthCondition,
    } = formData;

  

    // Compose final location: City, State from dropdown/cookie + Country from 

    const payload = {
      petAge: petAge,
      petName: petName,
      petType: petType,
      breed: breed,
      additionalInfo: additionalInfo,
      weight: `${weight} ${formData.petWeightIn}`,
      vaccinated: vaccinated,
      petGender: petGender,
      kci: kci,
      color: color,
      championship: championship,
      Events: Events,
      skills: skills,
      instagramLink: instagramLink,
    //   location: composedLocation,
      birthday: dob,
      spayedOrNeutered: spayedOrNeutered,
      medication: medication,
    //   size: size,
      doesYourPetHasAnyHealthIssues: healthCondition,
    };
console.log(payload,"payload")
    setApiProcessing({
      loader: true,
      message: "Requesting...",
    });

    try {
      let response;
      let petId;

      // Create or update pet profile
      if (!petData) {
        response = await webApi.post("petProfile", payload);
        console.log("Raw", response);
        
        
      } else {
        response = await webApi.put(
          `petProfile/update/${petData.id}`,
          payload
        );
      }
      

      


      console.log("Pet Profile Response:", response); // Debug API response

      if (response.status === "success") {
        petId =  response.data?.petProfile?.id;
        console.log("petId",petId)
        // Handle file uploads using FormData
        if (formData.petImage) {
          const imageFormData = new FormData();
          imageFormData.append("petImage", formData.petImage);
          const imageUploadResponse = await webApi.imagePut(
            `petProfile/updatePetImage/${petId}`,
            imageFormData
          );
          console.log("Image Upload Response:", imageUploadResponse); // Debug
        }

        if (formData.vaccineCertificate) {
          const vaccineFormData = new FormData();
          vaccineFormData.append(
            "vaccineCertificate",
            formData.vaccineCertificate
          );
          const vaccineUploadResponse = await webApi.imagePut(
            `petProfile/updatevaccineCertificate/${petId}`,
            vaccineFormData
          );
          console.log(
            "Vaccine Certificate Upload Response:",
            vaccineUploadResponse
          ); // Debug
        }

        if (formData.kciCertificate) {
          const kciFormData = new FormData();
          kciFormData.append("kciCertificate", formData.kciCertificate);
          const kciUploadResponse = await webApi.imagePut(
            `petProfile/updateKci/${petId}`,
            kciFormData
          );
          console.log("KCI Certificate Upload Response:", kciUploadResponse); // Debug
        }

        setCurrentStep(1);
        setFormData({
          petName: "",
          petAge: "",
          petType: "",
          color: "",
          breed: "",
          additionalInfo: "",
          weight: "",
          vaccinated: null,
          kci: null,
          championship: "",
          Events: "",
          skills: "",
          instagramLink: "",
          petGender: "",
          petImage: "",
          vaccineCertificate: "",
          kciCertificate: "",
          dob: "",
          spayedOrNeutered: "",
          medication: "",
          size: "",
          healthCondition: "",
          petWeightIn: "",
        });
        fetchPetData();
      } else {
        setErrorMessage(
          response.data?.message || "An unexpected error occurred."
        );
        setApiProcessing({ loader: false, message: "" });
      }
    } catch (err) {
      console.error("Error occurred:", err);
      setErrorMessage(
        err.response?.data?.message ||
          "Something went wrong. Please try again later."
      );
      setApiProcessing({ loader: false, message: "" });
    } finally {
      setApiProcessing({ loader: false, message: "" });
    }
  };

  useEffect(() => {
    if (isAddPopupOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isAddPopupOpen]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, petAge: calculateAge(formData.dob) }));
  }, [formData.dob]);

  useEffect(() => {
    console.log(petData, "petData");
  }, [petData]);

  const handleImageAreaClick = () => {
    document.getElementById("fileInput").click();
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageToCrop(file);
      setCropperOpen(true);
    }
  };

  const handleCropComplete = (croppedBlob) => {
    setFormData((prev) => ({
      ...prev,
      petImage: croppedBlob,
    }));
    setImage(croppedBlob);
  };

  // Dynamic options for size dropdown
  const sizeOptions =
    formData.breed !== "select" &&
    formData.size &&
    formData.size !== "select size"
      ? [formData.size]
      : ["select size", "Toy", "Small", "Medium", "Large", "Giant"];

  return (
    <>
  
        <div className={styles.Background}>
          <div
            className={styles.popupContainer}
            ref={popupRef}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={styles.header}>
              <p
                style={{ margin: "0px", cursor: "pointer" }}
                onClick={() => {
                  setIsAddPopupOpen(false);
                  setCurrentStep(1);
                  setFormData({
                    petName: "",
                    petAge: "",
                    petType: "",
                    color: "",
                    breed: "",
                    additionalInfo: "",
                    weight: "",
                    vaccinated: null,
                    kci: null,
                    championship: "",
                    Events: "",
                    skills: "",
                    instagramLink: "",
                    petGender: "",
                    petImage: "",
                    vaccineCertificate: "",
                    kciCertificate: "",
                    medication: "",
                    size: "",
                    healthCondition: "",
                  });
                }}
              >
                <div className={styles.webback}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="21"
                    height="15"
                    viewBox="0 0 21 15"
                    fill="none"
                  >
                    <path
                      d="M19.6873 6.57402H3.20042L8.16261 1.61183C8.25215 1.52535 8.32357 1.4219 8.37271 1.30752C8.42184 1.19315 8.4477 1.07013 8.44878 0.945646C8.44987 0.821166 8.42615 0.697716 8.37901 0.582501C8.33187 0.467285 8.26226 0.362612 8.17423 0.274587C8.08621 0.186563 7.98153 0.116951 7.86632 0.0698122C7.7511 0.0226738 7.62765 -0.00104631 7.50317 3.53972e-05C7.37869 0.0011171 7.25567 0.0269792 7.14129 0.0761127C7.02692 0.125246 6.92347 0.196667 6.83699 0.286208L0.274487 6.84871C0.0987332 7.02452 0 7.26293 0 7.51152C0 7.76011 0.0987332 7.99853 0.274487 8.17433L6.83699 14.7368C7.0138 14.9076 7.25062 15.0021 7.49642 15C7.74223 14.9978 7.97737 14.8992 8.15119 14.7254C8.32501 14.5516 8.42361 14.3165 8.42574 14.0706C8.42788 13.8248 8.33338 13.588 8.16261 13.4112L3.20042 8.44902H19.6873C19.9359 8.44902 20.1744 8.35025 20.3502 8.17443C20.526 7.99862 20.6248 7.76016 20.6248 7.51152C20.6248 7.26288 20.526 7.02442 20.3502 6.84861C20.1744 6.67279 19.9359 6.57402 19.6873 6.57402Z"
                      fill="#121212"
                    />
                  </svg>{" "}
                </div>
                <div className={styles.mobback}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="44"
                    height="44"
                    viewBox="0 0 44 44"
                    fill="none"
                  >
                    <g filter="url(#filter0_d_23851_13527)">
                      <circle cx="22" cy="22" r="20" fill="white" />
                    </g>
                    <path
                      d="M24.0038 28.9464C23.8721 28.9471 23.7416 28.9219 23.6197 28.8721C23.4978 28.8223 23.3869 28.749 23.2935 28.6563L17.2909 22.6537C17.1046 22.4663 17 22.2127 17 21.9484C17 21.6841 17.1046 21.4306 17.2909 21.2431L23.2935 15.2406C23.4849 15.0767 23.731 14.991 23.9828 15.0007C24.2346 15.0105 24.4734 15.1148 24.6516 15.293C24.8298 15.4712 24.9342 15.71 24.9439 15.9618C24.9536 16.2136 24.868 16.4598 24.7041 16.6512L19.4118 21.9434L24.7041 27.2357C24.8445 27.375 24.9406 27.5528 24.98 27.7467C25.0194 27.9406 25.0004 28.1419 24.9254 28.325C24.8505 28.5081 24.7229 28.6649 24.5588 28.7755C24.3948 28.8861 24.2016 28.9456 24.0038 28.9464Z"
                      fill="#263238"
                    />
                    <defs>
                      <filter
                        id="filter0_d_23851_13527"
                        x="0"
                        y="0"
                        width="44"
                        height="44"
                        filterUnits="userSpaceOnUse"
                        color-interpolation-filters="sRGB"
                      >
                        <feFlood
                          flood-opacity="0"
                          result="BackgroundImageFix"
                        />
                        <feColorMatrix
                          in="SourceAlpha"
                          type="matrix"
                          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                          result="hardAlpha"
                        />
                        <feOffset />
                        <feGaussianBlur stdDeviation="1" />
                        <feComposite in2="hardAlpha" operator="out" />
                        <feColorMatrix
                          type="matrix"
                          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"
                        />
                        <feBlend
                          mode="normal"
                          in2="BackgroundImageFix"
                          result="effect1_dropShadow_23851_13527"
                        />
                        <feBlend
                          mode="normal"
                          in="SourceGraphic"
                          in2="effect1_dropShadow_23851_13527"
                          result="shape"
                        />
                      </filter>
                    </defs>
                  </svg>
                </div>
              </p>
              <p
                style={{
                  margin: "0px",
                  marginBottom: isMobile ? "10px" : "0px",
                }}
              >
                Add New Pet
              </p>{" "}
              <div
                style={{ marginRight: "25px", cursor: "pointer" }}
                onClick={() => {
                  setIsAddPopupOpen(false);
                  setCurrentStep(1);
                  setFormData({
                    petName: "",
                    petAge: "",
                    petType: "",
                    color: "",
                    breed: "",
                    additionalInfo: "",
                    weight: "",
                    vaccinated: null,
                    kci: null,
                    championship: "",
                    Events: "",
                    skills: "",
                    instagramLink: "",
                    petGender: "",
                    petImage: "",
                    vaccineCertificate: "",
                    kciCertificate: "",
                    medication: "",
                    size: "",
                    healthCondition: "",
                  });
                }}
              ></div>
            </div>
            <div className={styles.mainContainer}>
              <div
                className={styles.addButtonDiv}
                onClick={handleImageAreaClick}
                style={{ position: "relative" }}
              >
                {formData.petImage ? (
                  <img
                    src={
                      typeof formData.petImage === "string"
                        ? petData?.petImage
                          ? `${IMAGE_URL}${petData.petImage}`
                          : ""
                        : URL.createObjectURL(formData.petImage)
                    }
                    alt="Selected"
                    className={styles.previewImg}
                  />
                ) : (
                  <p className={styles.imgP}>+</p>
                )}
                {errors.petImage && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "red",
                      position: "absolute",
                      top: "100%",
                      fontWeight: "500",
                    }}
                  >
                    {errors.petImage}
                  </p>
                )}
              </div>
              <input
                id="fileInput"
                type="file"
                name="petImage"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileInputChange}
              />
              <ImageCropperModal
                open={cropperOpen}
                image={imageToCrop}
                onClose={() => setCropperOpen(false)}
                onCropComplete={handleCropComplete}
              />
              <p
                style={{
                  fontSize: "16px",
                  fontWeight: 500,
                  color: "#909AA3",
                  paddingBottom: "25px",
                }}
              >
                Tap to Select Photo
              </p>
              <div className={styles.formDiv2}>
                <CustomInputElement2
                  question={"Pet Name *"}
                  width={isMobile ? "100%" : "48%"}
                  backgroundColor="#FFFFFF"
                  placeholder="Enter Pet Name"
                  type="text"
                  value={formData.petName}
                  onChange={(e) => handleInputChange("petName", e.target.value)}
                  custommarrgin={{ marginBottom: "14px" }}
                  error={errors.petName}
                  ownMargin={true}
                />
                 <DropDownv1
                  options={["select", "Dog", "Cat"]}
                  question={"Pet Type *"}
                  width={isMobile ? "100%" : "48%"}
                  backgroundColor="#FFFFFF"
                  value={formData.petType}
                  onChange={(value) => {
                    handleInputChange("petType", value);
                    if (value === "Dog") {
                      getDogTypes();
                    } else if (value === "Cat") {
                      getcatTypes();
                    } else {
                      setBreedOptions([]);
                    }
                  }}
                  CustomInputElementAddpet={{ color: "#000000" }}
                  error={errors.petType}
                />
                   <DropDownv1
                  options={
                    petData ? [formData.breed] : ["select", ...breedOptions]
                  }
                  question={"Pet Breed *"}
                  width={isMobile ? "100%" : "48%"}
                  backgroundColor="#FFFFFF"
                  value={formData.breed}
                  onChange={(value) => handleInputChange("breed", value)}
                  CustomInputElementAddpet={{ color: "#000000" }}
                  error={errors.breed}
                />
                  <DropDownv1
                  options={sizeOptions}
                  question={"Size *"}
                  width={isMobile ? "100%" : "48%"}
                  backgroundColor="#FFFFFF"
                  value={formData.size || ""}
                  onChange={(value) =>
                    handleInputChange(
                      "size",
                      value === "select size" ? "" : value
                    )
                  }
                  CustomInputElementAddpet={{ color: "#000000" }}
                  error={errors.size}
                />
                 <DropDownv1
                  options={["select", "Male", "Female"]}
                  question={"Gender *"}
                  width={isMobile ? "100%" : "48%"}
                  backgroundColor="#FFFFFF"
                  value={formData.petGender}
                  onChange={(value) => handleInputChange("petGender", value)}
                  CustomInputElementAddpet={{ color: "#000000" }}
                  error={errors.petGender}
                />
                  <DropDownv1
                  options={[
                    "select",
                    "0-6 Months",
                    "6-12 Months",
                    "1-2 Years",
                    "2-6 Years",
                    "6+ Years",
                  ]}
                  question={"Age *"}
                  type="age"
                  width={isMobile ? "100%" : "48%"}
                  backgroundColor="#FFFFFF"
                  placeholder="Select Pet Age"
                  value={formData.petAge}
                  onChange={(value) => handleInputChange("petAge", value)}
                  custommarrgin={{ marginBottom: "14px" }}
                  error={errors.petAge}
                  ownMargin={true}
                />
                {/* <CustomInputElement
                  question={"Date Of Birth *"}
                  type="date"
                  width={isMobile ? "100%" : "48%"}
                  backgroundColor="#FFFFFF"
                  value={formData.dob}
                  onChange={(e) => {
                    handleInputChange("dob", e.target.value);
                  }}
                  custommarrgin={{ marginBottom: "14px" }}
                  error={errors.dob}
                  ownMargin={true}
                /> */}
                 <DropDownv1
                  options={petColors}
                  question={"Color *"}
                  width={isMobile ? "100%" : "48%"}
                  backgroundColor="#FFFFFF"
                  type="text"
                  placeholder="Enter Pet Color"
                  value={formData.color}
                  onChange={(value) => handleInputChange("color", value)}
                  custommarrgin={{ marginBottom: "14px" }}
                  error={errors.color}
                  ownMargin={true}
                />
                <CustomInputComp
                  question={"Weight *"}
                  width={isMobile ? "100%" : "48%"}
                  backgroundColor="#FFFFFF"
                  type="text"
                  placeholder="Enter Pet Weight"
                  value={formData.weight}
                  onChange={(e) => {
                    const numericValue = e.target.value
                      .replace(/[^0-9]/g, "")
                      .slice(0, 3);
                    handleInputChange("weight", numericValue);
                  }}
                  custommarrgin={{ marginBottom: "14px" }}
                  error={errors.weight}
                  ownMargin={true}
                  filter={formData.weight ? "weight" : ""}
                  setFormData={setFormData}
                  formData={formData}
                />
                 <DropDownv1
                  options={["select", "Yes", "No"]}
                  question={"Spayed/Neutered *"}
                  width={isMobile ? "100%" : "48%"}
                  backgroundColor="#FFFFFF"
                  value={formData.spayedOrNeutered}
                  onChange={(value) =>
                    handleInputChange("spayedOrNeutered", value)
                  }
                  CustomInputElementAddpet={{ color: "#000000" }}
                  error={errors.spayedOrNeutered}
                />
                {/* <CustomInputElement
                  question={"Health Condition *"}
                  width="48%"
                  type="text"
                  backgroundColor="#FFFFFF"
                  value={formData.healthCondition}
                  placeholder="Enter Health Condition"
                  onChange={(e) => {
                    handleInputChange("healthCondition", e.target.value);
                  }}
                  custommarrgin={{ marginBottom: "14px" }}
                  error={errors.healthCondition}
                  ownMargin={true}
                /> */}
                <CustomInputElement2
                  question={"Medication *"}
                  width="48%"
                  type="text"
                  backgroundColor="#FFFFFF"
                  value={formData.medication}
                  placeholder="Enter Medication"
                  onChange={(e) => {
                    handleInputChange("medication", e.target.value);
                  }}
                  custommarrgin={{ marginBottom: "14px" }}
                  error={errors.medication}
                  ownMargin={true}
                />
              </div>

              <div className={styles.formDiv2}>
                 <DropDownv1
                  options={["select", "Yes", "No"]}
                  question={"Vaccine Certificate"}
                  width={isMobile ? "100%" : "48%"}
                  backgroundColor="#FFFFFF"
                  value={formData.vaccinated}
                  onChange={(value) => handleInputChange("vaccinated", value)}
                  CustomInputElementAddpet={{ color: "#000000" }}
                />
                {formData.vaccinated === "Yes" && (
                  <>
                    <div className={styles.fileContainer}>
                      <p className={styles.fileDescription}>
                        Vaccine certificate
                      </p>
                      <label className={styles.fileLabel}>
                        <div
                          style={{
                            backgroundColor: "#727271",
                            color: "#FFFFFF",
                            padding: "10px 20px",
                            cursor: "pointer",
                            fontSize: "16px",
                          }}
                        >
                          Choose File
                        </div>
                        <input
                          type="file"
                          style={{ display: "none" }}
                          name="vaccineCertificate"
                          onChange={(e) => {
                            handleChange(e);
                          }}
                        />
                        <span
                          style={{
                            fontSize: "16px",
                            color: "#727271",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "400px",
                          }}
                        >
                          {selectedFile}
                        </span>
                      </label>
                    </div>
                  </>
                )}
                 <DropDownv1
                  options={["select", "Yes", "No"]}
                  question={"KCI"}
                  width={isMobile ? "100%" : "48%"}
                  backgroundColor="#FFFFFF"
                  value={formData.kci}
                  onChange={(value) => handleInputChange("kci", value)}
                  CustomInputElementAddpet={{ color: "#000000" }}
                />
                {formData.kci === "Yes" && (
                  <>
                    <div className={styles.fileContainer}>
                      <p className={styles.fileDescription}>KCI</p>
                      <label className={styles.fileLabel}>
                        <div
                          style={{
                            backgroundColor: "#727271",
                            color: "#FFFFFF",
                            padding: "10px 20px",
                            cursor: "pointer",
                            fontSize: "16px",
                          }}
                        >
                          Choose File
                        </div>
                        <input
                          type="file"
                          style={{ display: "none" }}
                          name="kciCertificate"
                          onChange={(e) => {
                            handleChange2(e);
                          }}
                        />
                        <span
                          style={{
                            fontSize: "16px",
                            color: "#727271",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "400px",
                          }}
                        >
                          {selectedFilekci}
                        </span>
                      </label>
                    </div>
                  </>
                )}
                 <DropDownv1
                  question={"Skills"}
                  options={["select", "Good", "Bad"]}
                  width={isMobile ? "100%" : "48%"}
                  backgroundColor="#FFFFFF"
                  value={formData.skills}
                  onChange={(value) => handleInputChange("skills", value)}
                  CustomInputElementAddpet={{ color: "#000000" }}
                />
                 <DropDownv1
                  question={"Championship"}
                  options={["select", "Yes", "No"]}
                  width={isMobile ? "100%" : "48%"}
                  backgroundColor="#FFFFFF"
                  value={formData.championship}
                  onChange={(value) => handleInputChange("championship", value)}
                  CustomInputElementAddpet={{ color: "#000000" }}
                />
                 <DropDownv1
                  question={"Events"}
                  options={["select", "Yes", "No"]}
                  width={isMobile ? "100%" : "48%"}
                  backgroundColor="#FFFFFF"
                  value={formData.Events}
                  onChange={(value) => handleInputChange("Events", value)}
                  CustomInputElementAddpet={{ color: "#000000" }}
                />
                <CustomInputElement2
                  question={"Instagram Link"}
                  width={isMobile ? "100%" : "48%"}
                  backgroundColor="#FFFFFF"
                  placeholder="URL"
                  value={formData.instagramLink}
                  onChange={(e) =>
                    handleInputChange("instagramLink", e.target.value)
                  }
                  error={errors.instagramLink}
                  custommarrgin={{ marginBottom: "14px" }}
                  ownMargin={true}
                />
                <CustomInputElement2
                  question="Additional Information"
                  width="48%"
                  backgroundColor="#FFFFFF"
                  placeholder="Add more information"
                  onInputChange={handleVictoriaInfoChange}
                  onChange={(e) =>
                    handleInputChange("additionalInfo", e.target.value)
                  }
                  rows={3}
                  customStylestext={{
                    backgroundColor: "#fff",
                    border: "1px solid rgb(217, 217, 217)",
                    margingBottom: "16px",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    width: "100%",
                  }}
                >
                  <div className={styles.mobSubmit}>
                    <button
                      className={styles.submitButton}
                      onClick={handleSubmit}
                      disabled={apiProcessing.loader}
                    >
                      {apiProcessing.loader ? "Adding Pet..." : "Add Pet"}
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <p
                    style={{
                      color: "red",
                      fontSize: "14px",
                    //   textAlign: "center",
                      marginTop: "10px",
                    }}
                  >
                    {errorMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
   
    </>
  );
};

export default AddNewPetPopup;

