import useStore from "@/components/state/useStore";
import { WebApimanager } from "@/components/utilities/WebApiManager";
import React, { useEffect, useRef, useState } from "react";
import styles from "../../styles/register/settingsregister.module.css"
import ImageCropperModal from "@/components/register/imageCropperModule";
import CustomInputElement2 from "@/components/register/customInputcom";
import DropDownv1 from "@/components/register/dropdown";
import CustomInputComp from "@/components/register/customInput";
import Cookies from "js-cookie";

const calculateAge = (dob) => {
  const dobDate = new Date(dob);
  const today = new Date();

  let years = today.getFullYear() - dobDate.getFullYear();
  let months = today.getMonth() - dobDate.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  return `${years} years ${months} month${months !== 1 ? "s" : ""}`;
};

const AddNewPetPopup = ({
  isAddPopupOpen,
  setIsAddPopupOpen,
  fetchPetData = () => { },
  petData = null,
  IMAGE_URL = ""
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

  const selectedLocation = useStore((s) => s.selectedLocation);
  const selectedCountryName = useStore((s) => s.selectedCountryName);
  const petColors = [
    "Select Color", "Black", "White", "Brown", "Red", "Gold", "Cream", "Yellow",
    "Gray", "Blue", "Fawn", "Tan", "Buff", "Brindle", "Merle", "Harlequin",
    "Sable", "Bicolor", "Tricolor", "Tuxedo", "Roan", "Spotted", "Ticked",
    "Particolor", "Blenheim", "Domino",
  ];

  useEffect(() => {
    if (selectedLocation) {
      setLocationDetails(selectedLocation);
    }
  }, [selectedLocation]);

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
    } catch (_) { }
  }, [selectedLocation]);

  const [apiProcessing, setApiProcessing] = useState({ loader: false, message: "Loading..." });
  const [isMobile, setIsMobile] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => setIsMobile(window.innerWidth <= 768);
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  const [formData, setFormData] = useState({
    petName: "", petAge: "", petType: "", color: "", breed: "", additionalInfo: "", weight: "",
    vaccinated: null, kci: null, championship: "", Events: "", skills: "", instagramLink: "",
    petGender: "", petImage: "", vaccineCertificate: "", kciCertificate: "", dob: "",
    spayedOrNeutered: "", medication: "", size: "", healthCondition: "", petWeightIn: "",
  });

  useEffect(() => {
    if (petData) {
      setFormData({
        petName: petData.petName || "", petAge: petData.petAge || "", petType: petData.petType || "",
        color: petData.color || "", breed: petData.breed || "", additionalInfo: petData.additionalInfo || "",
        weight: petData?.weight?.endsWith("kg") || petData?.weight?.endsWith("lb") ? petData.weight.split(" ")[0] : petData?.weight,
        petWeightIn: petData?.weight?.endsWith("kg") ? "kg" : "lb", vaccinated: petData.vaccinated ?? null,
        kci: petData.kci || "", championship: petData.championship || "", Events: petData.Events || "",
        skills: petData.skills || "", instagramLink: petData.instagramLink || "", petGender: petData.petGender || "",
        petImage: petData.petImage, vaccineCertificate: petData.vaccineCertificate || "",
        kciCertificate: petData.kciCertificate || "", spayedOrNeutered: petData.spayedOrNeutered || "",
        dob: petData?.birthday?.slice(0, 10) || "", medication: petData.medication || "",
        size: petData.size || "", healthCondition: petData.doesYourPetHasAnyHealthIssues || "",
      });
    } else {
      setFormData({
        petName: "", petAge: "", petType: "", color: "", breed: "", additionalInfo: "", weight: "",
        vaccinated: null, kci: "", championship: "", Events: "", skills: "", instagramLink: "",
        petGender: "", petImage: "", vaccineCertificate: "", kciCertificate: "", dob: "",
        spayedOrNeutered: "", medication: "", size: "", healthCondition: "", petWeightIn: "",
      });
    }
  }, [petData]);

  useEffect(() => {
    if (petData) {
      if (petData.petType === "Dog") getDogTypes();
      else if (petData.petType === "Cat") getcatTypes();
    }
  }, [petData]);

  useEffect(() => {
    if (formData.breed && formData.breed !== "select" && breed.length > 0) {
      const selectedBreed = breed.find((b) => b["Breed Name"] === formData.breed);
      if (selectedBreed && selectedBreed.Size) {
        setFormData((prev) => ({ ...prev, size: selectedBreed.Size.trim() }));
        setErrors((prev) => ({ ...prev, size: "" }));
      } else {
        setFormData((prev) => ({ ...prev, size: "select" }));
      }
    }
  }, [breed, formData.breed]);

  const handleVictoriaInfoChange = (inputValue) => {
    setFormData((prev) => ({ ...prev, additionalInfo: inputValue }));
  };

  const handleChange = async (e) => {
    const { name, value, type, files } = e.target;
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setErrors((prev) => ({
      ...prev, [name]: value.trim() === "" ? `${name} is required.` : "",
    }));

    if (type === "file") {
      setFormData({ ...formData, [name]: files[0] });
      if (name === "vaccineCertificate" && files[0]) setSelectedFile(files[0].name);
    } else setFormData({ ...formData, [name]: value });
  };

  const handleChange2 = async (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setFormData({ ...formData, [name]: files[0] });
      if (name === "kciCertificate" && files[0]) setSelectedFilekci(files[0].name);
    } else setFormData({ ...formData, [name]: value });
  };

  const instagramRegex = /^(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/[A-Za-z0-9._%-]+\/?$/;

  const handleInputChange = (field, value) => {
    if (field === "weight") value = value.replace(/[^0-9]/g, "");
    if (field === "instagramLink") {
      if (value && !instagramRegex.test(value)) {
        setErrors((prev) => ({ ...prev, instagramLink: "Please check your Instagram URL & enter a valid Instagram URL (ex: https://instagram.com/john_doe)" }));
      } else setErrors((prev) => ({ ...prev, instagramLink: "" }));
    }
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === "breed" && value !== "select") {
      const selectedBreed = breed.find((b) => b["Breed Name"] === value);
      if (selectedBreed && selectedBreed.Size) {
        setFormData((prev) => ({ ...prev, size: selectedBreed.Size.trim() }));
        setErrors((prev) => ({ ...prev, size: "" }));
      } else {
        setFormData((prev) => ({ ...prev, size: "select" }));
        setErrors((prev) => ({ ...prev, size: "Size not available for this breed." }));
      }
    }
  };

  const getDogTypes = async () => {
    try {
      const dogResponse = await webApi.get("dog/dogsFromSheet");
      if (dogResponse.status === 200) {
        setBreedOptions(dogResponse.data.data.map((breed) => breed?.["Breed Name"]));
        setBreed(dogResponse.data.data);
      }
    } catch (error) { console.log(error.message); }
  };

  const getcatTypes = async () => {
    try {
      const dogResponse = await webApi.get("dogAndCat/catTypes");
      if (dogResponse.status === 200) {
        setBreedOptions(dogResponse.data.data.map((breed) => breed.name));
      }
    } catch (error) { console.log(error.message); }
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (!formData.petName.trim()) newErrors.petName = "Pet Name is required.";
    if (!formData.petImage) newErrors.petImage = "Please upload an Image.";
    if (!formData.petAge.trim()) newErrors.petAge = "Pet Age is required.";
    if (!formData.color.trim() || formData.color === "Select Color") newErrors.color = "Pet color is required.";
    if (!formData.medication.trim()) newErrors.medication = "Medication is required.";
    if (!String(formData.weight).trim()) newErrors.weight = "Pet weight is required.";
    else if (!formData.petWeightIn) newErrors.weight = "Select pet weight type";
    if (!formData.petType || formData.petType === "select") newErrors.petType = "Pet Type is required.";
    if (!formData.petGender || formData.petGender === "select") newErrors.petGender = "Pet Gender is required.";
    if (!formData.breed || formData.breed === "select") newErrors.breed = "Pet Breed is required.";
    if (formData.instagramLink && !instagramRegex.test(formData.instagramLink)) {
      newErrors.instagramLink = "Please check your Instagram URL & enter a valid Instagram URL";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    const payload = {
      petAge: formData.petAge, petName: formData.petName, petType: formData.petType, breed: formData.breed,
      additionalInfo: formData.additionalInfo, weight: `${formData.weight} ${formData.petWeightIn}`,
      vaccinated: formData.vaccinated, petGender: formData.petGender, kci: formData.kci, color: formData.color,
      championship: formData.championship, Events: formData.Events, skills: formData.skills,
      instagramLink: formData.instagramLink, birthday: formData.dob, spayedOrNeutered: formData.spayedOrNeutered,
      medication: formData.medication, doesYourPetHasAnyHealthIssues: formData.healthCondition,
    };

    setApiProcessing({ loader: true, message: "Requesting..." });

    try {
      let response;
      let petId;
      if (!petData) response = await webApi.post("vendorPetProfile/create", payload);
      else response = await webApi.put(`petProfile/update/${petData.id}`, payload);

      if (response.status === "success") {
        petId = response.data?.petProfile?.id;
        if (formData.petImage) {
          const imageFormData = new FormData();
          imageFormData.append("petImage", formData.petImage);
          await webApi.imagePut(`petProfile/updatePetImage/${petId}`, imageFormData);
        }
        if (formData.vaccineCertificate) {
          const vaccineFormData = new FormData();
          vaccineFormData.append("vaccineCertificate", formData.vaccineCertificate);
          await webApi.imagePut(`petProfile/updatevaccineCertificate/${petId}`, vaccineFormData);
        }
        if (formData.kciCertificate) {
          const kciFormData = new FormData();
          kciFormData.append("kciCertificate", formData.kciCertificate);
          await webApi.imagePut(`petProfile/updateKci/${petId}`, kciFormData);
        }

        setIsAddPopupOpen(false);
        fetchPetData();
      } else setErrorMessage(response.data?.message || "An unexpected error occurred.");
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Something went wrong. Please try again later.");
    } finally { setApiProcessing({ loader: false, message: "" }); }
  };

  useEffect(() => {
    setFormData((prev) => ({ ...prev, petAge: calculateAge(formData.dob) }));
  }, [formData.dob]);

  const handleImageAreaClick = () => document.getElementById("fileInput").click();
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) { setImageToCrop(file); setCropperOpen(true); }
  };
  const handleCropComplete = (croppedBlob) => {
    setFormData((prev) => ({ ...prev, petImage: croppedBlob }));
    setImage(croppedBlob);
  };

  const sizeOptions = formData.breed !== "select" && formData.size && formData.size !== "select size"
    ? [formData.size] : ["select size", "Toy", "Small", "Medium", "Large", "Giant"];

  // REMOVED Background entirely to render inline in table container
  return (
    <div className={styles.popupContainer} style={{ background: "#fff", padding: "20px", borderRadius: "10px", width: "100%", position: "relative" }}>
      <div className={styles.header} style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <h2>{petData ? "Edit Pet" : "Add New Pet"}</h2>
        <button style={{ background: "transparent", border: "none", fontSize: "1.2rem", cursor: "pointer" }} onClick={() => setIsAddPopupOpen(false)}>&#x2715;</button>
      </div>
      <div className={styles.mainContainer}>
        <div className={styles.addButtonDiv} onClick={handleImageAreaClick} style={{ position: "relative" }}>
          {formData.petImage ? (
            <img src={typeof formData.petImage === "string" ? (petData?.petImage ? `${IMAGE_URL}${petData.petImage}` : "") : URL.createObjectURL(formData.petImage)} alt="Selected" className={styles.previewImg} />
          ) : <p className={styles.imgP}>+</p>}
          {errors.petImage && <p style={{ fontSize: "12px", color: "red", position: "absolute", top: "100%", fontWeight: "500" }}>{errors.petImage}</p>}
        </div>
        <input id="fileInput" type="file" name="petImage" accept="image/*" style={{ display: "none" }} onChange={handleFileInputChange} />
        <ImageCropperModal open={cropperOpen} image={imageToCrop} onClose={() => setCropperOpen(false)} onCropComplete={handleCropComplete} />
        <p style={{ fontSize: "16px", fontWeight: 500, color: "#909AA3", paddingBottom: "25px" }}>Tap to Select Photo</p>

        <div className={styles.formDiv2}>
          <CustomInputElement2 question={"Pet Name *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" placeholder="Enter Pet Name" type="text" value={formData.petName} onChange={(e) => handleInputChange("petName", e.target.value)} custommarrgin={{ marginBottom: "14px" }} error={errors.petName} ownMargin={true} />
          <DropDownv1 options={["select", "Dog", "Cat"]} question={"Pet Type *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.petType} onChange={(value) => { handleInputChange("petType", value); if (value === "Dog") getDogTypes(); else if (value === "Cat") getcatTypes(); else setBreedOptions([]); }} CustomInputElementAddpet={{ color: "#000000" }} error={errors.petType} />
          <DropDownv1 options={petData ? [formData.breed] : ["select", ...breedOptions]} question={"Pet Breed *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.breed} onChange={(value) => handleInputChange("breed", value)} CustomInputElementAddpet={{ color: "#000000" }} error={errors.breed} />
          <DropDownv1 options={sizeOptions} question={"Size *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.size || ""} onChange={(value) => handleInputChange("size", value === "select size" ? "" : value)} CustomInputElementAddpet={{ color: "#000000" }} error={errors.size} />
          <DropDownv1 options={["select", "Male", "Female"]} question={"Gender *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.petGender} onChange={(value) => handleInputChange("petGender", value)} CustomInputElementAddpet={{ color: "#000000" }} error={errors.petGender} />
          <DropDownv1 options={["select", "0-6 Months", "6-12 Months", "1-2 Years", "2-6 Years", "6+ Years"]} question={"Age *"} type="age" width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" placeholder="Select Pet Age" value={formData.petAge} onChange={(value) => handleInputChange("petAge", value)} custommarrgin={{ marginBottom: "14px" }} error={errors.petAge} ownMargin={true} />
          <DropDownv1 options={petColors} question={"Color *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" type="text" placeholder="Enter Pet Color" value={formData.color} onChange={(value) => handleInputChange("color", value)} custommarrgin={{ marginBottom: "14px" }} error={errors.color} ownMargin={true} />
          <CustomInputComp question={"Weight *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" type="text" placeholder="Enter Pet Weight" value={formData.weight} onChange={(e) => { const numericValue = e.target.value.replace(/[^0-9]/g, "").slice(0, 3); handleInputChange("weight", numericValue); }} custommarrgin={{ marginBottom: "14px" }} error={errors.weight} ownMargin={true} filter={formData.weight ? "weight" : ""} setFormData={setFormData} formData={formData} />
          <DropDownv1 options={["select", "Yes", "No"]} question={"Spayed/Neutered *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.spayedOrNeutered} onChange={(value) => handleInputChange("spayedOrNeutered", value)} CustomInputElementAddpet={{ color: "#000000" }} error={errors.spayedOrNeutered} />
          <CustomInputElement2 question={"Medication *"} width={isMobile ? "100%" : "48%"} type="text" backgroundColor="#FFFFFF" value={formData.medication} placeholder="Enter Medication" onChange={(e) => handleInputChange("medication", e.target.value)} custommarrgin={{ marginBottom: "14px" }} error={errors.medication} ownMargin={true} />
        </div>

        <div className={styles.formDiv2}>
          <DropDownv1 options={["select", "Yes", "No"]} question={"Vaccine Certificate"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.vaccinated} onChange={(value) => handleInputChange("vaccinated", value)} CustomInputElementAddpet={{ color: "#000000" }} />
          {formData.vaccinated === "Yes" && (
            <div className={styles.fileContainer}>
              <p className={styles.fileDescription}>Vaccine certificate</p>
              <label className={styles.fileLabel}>
                <div style={{ backgroundColor: "#727271", color: "#FFFFFF", padding: "10px 20px", cursor: "pointer", fontSize: "16px" }}>Choose File</div>
                <input type="file" style={{ display: "none" }} name="vaccineCertificate" onChange={handleChange} />
                <span style={{ fontSize: "16px", color: "#727271", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "400px" }}>{selectedFile}</span>
              </label>
            </div>
          )}
          <DropDownv1 options={["select", "Yes", "No"]} question={"KCI"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.kci} onChange={(value) => handleInputChange("kci", value)} CustomInputElementAddpet={{ color: "#000000" }} />
          {formData.kci === "Yes" && (
            <div className={styles.fileContainer}>
              <p className={styles.fileDescription}>KCI</p>
              <label className={styles.fileLabel}>
                <div style={{ backgroundColor: "#727271", color: "#FFFFFF", padding: "10px 20px", cursor: "pointer", fontSize: "16px" }}>Choose File</div>
                <input type="file" style={{ display: "none" }} name="kciCertificate" onChange={handleChange2} />
                <span style={{ fontSize: "16px", color: "#727271", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "400px" }}>{selectedFilekci}</span>
              </label>
            </div>
          )}
          <DropDownv1 question={"Skills"} options={["select", "Good", "Bad"]} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.skills} onChange={(value) => handleInputChange("skills", value)} CustomInputElementAddpet={{ color: "#000000" }} />
          <DropDownv1 question={"Championship"} options={["select", "Yes", "No"]} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.championship} onChange={(value) => handleInputChange("championship", value)} CustomInputElementAddpet={{ color: "#000000" }} />
          <DropDownv1 question={"Events"} options={["select", "Yes", "No"]} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.Events} onChange={(value) => handleInputChange("Events", value)} CustomInputElementAddpet={{ color: "#000000" }} />
          <CustomInputElement2 question={"Instagram Link"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" placeholder="URL" value={formData.instagramLink} onChange={(e) => handleInputChange("instagramLink", e.target.value)} error={errors.instagramLink} custommarrgin={{ marginBottom: "14px" }} ownMargin={true} />
          <CustomInputElement2 question="Additional Information" width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" placeholder="Add more information" onInputChange={handleVictoriaInfoChange} onChange={(e) => handleInputChange("additionalInfo", e.target.value)} rows={3} customStylestext={{ backgroundColor: "#fff", border: "1px solid rgb(217, 217, 217)", margingBottom: "16px" }} />

          <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
            <div className={styles.mobSubmit}>
              <button className={styles.submitButton} onClick={handleSubmit} disabled={apiProcessing.loader} style={{ background: "#F5790C", color: "white", padding: "10px 20px", borderRadius: "5px", border: "none", cursor: "pointer", fontSize: "16px" }}>
                {apiProcessing.loader ? "Saving..." : (petData ? "Save Pet" : "Add Pet")}
              </button>
            </div>
          </div>
          {errorMessage && (
            <p style={{ color: "red", fontSize: "14px", marginTop: "10px" }}>{errorMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
};
export default AddNewPetPopup;
