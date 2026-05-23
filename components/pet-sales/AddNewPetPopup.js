import { toApiDateOnly } from "@/utilities/date-time-utils";


import useStore from "@/components/state/useStore";
import { WebApimanager } from "@/components/utilities/WebApiManager";
import {
  dateOnlyWithTimeZone,
  formatDobInputValue,
  parseWallClockDate,
} from "@/utilities/date-time-utils";
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { AddIcon } from "@/public/images/SVG";
import styles from "../../styles/register/settingsregister.module.css";
import ImageCropperModal from "@/components/register/imageCropperModule";
import CustomInputElement2 from "@/components/register/customInputcom";
import DropDownv1 from "@/components/register/dropdown";
import CustomInputComp from "@/components/register/customInput";
import BackHeader from "@/components/pet-sales/backHeader";
import Cookies from "js-cookie";
import SearchableDropdown from "../register/FilterDropDown";
import { formatDate, IMAGE_URL } from "../utilities/Constants";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const MAX_IMAGES = 1;
const MAX_VIDEOS = 1;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const calculateAge = (dob) => {
  if (!dob) return "";
  const dobDate = parseWallClockDate(dob);
  if (!dobDate) return "";
  const today = new Date();
  let years = today.getFullYear() - dobDate.getFullYear();
  let months = today.getMonth() - dobDate.getMonth();
  if (months < 0) { years--; months += 12; }
  return `${years} years ${months} month${months !== 1 ? "s" : ""}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const AddNewPetPopup = ({
  closePopup,
  petData,
  fetchPetData = () => { },
}) => {
  const { getJwtToken } = useStore();
  const jwt = getJwtToken();
  const webApi = new WebApimanager(jwt);

  const imageFileInputRef = useRef(null);
  const videoFileInputRef = useRef(null);
  const isProcessingCrop = useRef(false);
  const blobUrlsRef = useRef([]);
  const vaccMenuRef = useRef(null);

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);
  const [showVaccDropdown, setShowVaccDropdown] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [filesToCrop, setFilesToCrop] = useState([]);
  const [isCropping, setIsCropping] = useState(false);
  const [breedOptions, setBreedOptions] = useState([]);
  const [breed, setBreed] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [locationDetails, setLocationDetails] = useState("");
  const [apiProcessing, setApiProcessing] = useState({ loader: false, message: "Loading..." });
  const [isMobile, setIsMobile] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const selectedLocation = useStore((s) => s.selectedLocation);

  const petColors = [
    "Select Color", "Black", "White", "Brown", "Red", "Gold", "Cream", "Yellow",
    "Gray", "Blue", "Fawn", "Tan", "Buff", "Brindle", "Merle", "Harlequin",
    "Sable", "Bicolor", "Tricolor", "Tuxedo", "Roan", "Spotted", "Ticked",
    "Particolor", "Blenheim", "Domino",
  ];

  const [formData, setFormData] = useState({
    petName: "", petAge: "", petType: "", color: "", breed: "", additionalInfo: "",
    weight: "", vaccinated: null, kci: null, championship: "", Events: "", skills: "",
    instagramLink: "", petGender: "", vaccineCertificate: "", kciCertificate: "",
    dob: "", spayedOrNeutered: "", medication: "", size: "", healthCondition: "",
    petWeightIn: "", microchipNo: "", howmanyTimesBreedingDone: "", howManyVaccinationsDone: [],
  });

  const vaccinationOptions = [
    "DHPP (Distemper, Hepatitis, Parvo, Parainfluenza)",
    "DA2PP (Distemper, Cav-2, Parvo, Parainfluenza)",
    "Bordetella",
    "Canine Coronavirus (CCoV)",
    "Canine Distemper",
    "Canine influenza (H3H2)",
    "Canine influenza (H3N8)",
    "Adenovirus Type 1 (Cav-1, Canine Hepatitis)",
    "Adenovirus Type 2 (Cav-2, Kennel Cough)",
    "Leptospirosis",
    "Lyme disease",
    "Parainfluenza",
    "Parvovirus",
  ];

  const instagramRegex = /^(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/[A-Za-z0-9._%-]+\/?$/;

  // ─────────────────────────────────────────────────────────────────────────────
  // Validation Functions
  // ─────────────────────────────────────────────────────────────────────────────
  const validateField = (field, value) => {
    let error = "";

    switch (field) {
      case "petName":
        if (!value || value.trim() === "") {
          error = "Pet Name is required.";
        } else if (value.length < 2) {
          error = "Pet Name must be at least 2 characters.";
        } else if (value.length > 50) {
          error = "Pet Name cannot exceed 50 characters.";
        }
        break;

      case "petType":
        if (!value || value === "select") {
          error = "Please select a pet type.";
        }
        break;

      case "breed":
        if (!value || value === "select") {
          error = "Please select a pet breed.";
        }
        break;

      case "dob":
        if (!value) {
          error = "Date of Birth is required.";
        } else {
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (selectedDate > today) {
            error = "Date of Birth cannot be in the future.";
          } else if (selectedDate.getFullYear() < 1900) {
            error = "Please enter a valid year (1900 or later).";
          }
        }
        break;

      case "petGender":
        if (!value || value === "select") {
          error = "Please select gender.";
        }
        break;

      case "color":
        if (!value || value === "Select Color") {
          error = "Please select a color.";
        }
        break;

      case "weight":
        if (!value) {
          error = "Weight is required.";
        } else if (isNaN(value) || value <= 0) {
          error = "Please enter a valid weight.";
        } else if (value > 200) {
          error = "Weight seems too high. Please verify.";
        }
        break;

      case "petWeightIn":
        if (!value) {
          error = "Please select weight unit (kg/lb).";
        }
        break;

      case "spayedOrNeutered":
        if (!value || value === "select") {
          error = "Please specify if pet is spayed/neutered.";
        }
        break;

      case "medication":
        if (!value || value.trim() === "") {
          error = "Medication information is required.";
        }
        break;

      case "healthCondition":
        if (!value || value.trim() === "") {
          error = "Please specify if pet has any health issues.";
        }
        break;

      case "vaccinated":
        if (!value || value === "select") {
          error = "Please specify if pet is vaccinated.";
        }
        break;

      case "microchipNo":
        if (value && value.length > 0 && value.length !== 15) {
          error = "Microchip number must be exactly 15 digits.";
        }
        break;

      case "instagramLink":
        if (value && !instagramRegex.test(value)) {
          error = "Please enter a valid Instagram URL (ex: https://instagram.com/username)";
        }
        break;

      default:
        break;
    }

    return error;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Lifecycle Hooks
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => {
        if (url && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (selectedLocation) setLocationDetails(selectedLocation);
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
      if (city && city !== "Unknown") loc += city;
      if (region && region !== "Unknown") loc += loc ? `, ${region}` : region;
      if (!loc) loc = "Unknown Location";
      setLocationDetails(loc);
    } catch (_) { }
  }, [selectedLocation]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => setIsMobile(window.innerWidth <= 768);
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (vaccMenuRef.current && !vaccMenuRef.current.contains(event.target)) {
        setShowVaccDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Populate form when editing - FIXED MAPPING
  useEffect(() => {
    if (petData) {
      console.log("PetData received:", petData);

      // Extract weight value and unit
      let weightValue = "";
      let weightUnit = "";
      if (petData.weight) {
        const weightParts = petData.weight.split(" ");
        weightValue = weightParts[0] || "";
        weightUnit = weightParts[1] || "";
      }

      setFormData({
        petName: petData.petName || "",
        petAge: petData.petAge || "",
        petType: typeof petData.petType === 'object' ? petData.petType?.petType : (petData.petType || ""),
        color: petData.color || "",
        breed: petData.breed || "",
        additionalInfo: petData.additionalInfo || petData.description || "",
        weight: weightValue,
        petWeightIn: weightUnit,
        vaccinated: petData.vaccinated || null,
        kci: petData.kci || "",
        championship: petData.championship || "",
        Events: petData.Events || "",
        skills: petData.skills || "",
        instagramLink: petData.instagramLink || "",
        petGender: petData.petGender || "",
        spayedOrNeutered: petData.spayedOrNeutered || "",
        dob: formatDobInputValue(petData.birthday || petData.dob || ""),
        medication: petData.medication || "",
        howManyVaccinationsDone: petData.howManyVaccinationsDone || [],
        size: petData.size || "",
        healthCondition: petData.doesYourPetHasAnyHealthIssues || "",
        microchipNo: petData.microchipNo || "",
        howmanyTimesBreedingDone: petData.howmanyTimesBreedingDone || "",
      });

      // Show existing images from server
      if (petData.morePhotos && petData.morePhotos.length > 0) {
        const imageUrls = petData.morePhotos.map(photo => {
          const baseUrl = IMAGE_URL.endsWith('/') ? IMAGE_URL : `${IMAGE_URL}/`;
          const cleanPath = photo.startsWith('/') ? photo.slice(1) : photo;
          return `${baseUrl}${cleanPath}`;
        });
        setImagePreviews(imageUrls);
        setImageFiles(Array(petData.morePhotos.length).fill("existing"));
      }
      if (petData.moreVideos && petData.moreVideos.length > 0) {
        const videoUrls = petData.moreVideos.map(video => {
          const baseUrl = IMAGE_URL.endsWith('/') ? IMAGE_URL : `${IMAGE_URL}/`;
          const cleanPath = video.startsWith('/') ? video.slice(1) : video;
          return `${baseUrl}${cleanPath}`;
        });
        setVideoPreviews(videoUrls);
        setVideoFiles(Array(petData.moreVideos.length).fill("existing"));
      }
    } else {
      // Reset for new pet
      setFormData({
        petName: "", petAge: "", petType: "", color: "", breed: "", additionalInfo: "",
        weight: "", vaccinated: null, kci: "", championship: "", Events: "", skills: "",
        instagramLink: "", petGender: "", vaccineCertificate: "", kciCertificate: "",
        dob: "", spayedOrNeutered: "", medication: "", size: "", healthCondition: "",
        petWeightIn: "", microchipNo: "", howmanyTimesBreedingDone: "", howManyVaccinationsDone: [],
      });
      setImageFiles([]);
      setImagePreviews([]);
      setVideoFiles([]);
      setVideoPreviews([]);
      setErrorMessage("");
      setErrors({});
    }
  }, [petData]);

  // Fetch breeds when editing
  useEffect(() => {
    if (petData?.petType && breedOptions.length === 0) {
      fetchBreeds(petData.petType);
    }
  }, [petData?.petType]);

  // Auto-fill size from breed (only for new pets)
  useEffect(() => {
    if (petData) return;
    if (formData.breed && formData.breed !== "select" && breed.length > 0) {
      const selectedBreed = breed.find((b) => b["breedName"] === formData.breed);
      if (selectedBreed?.size) {
        setFormData((prev) => ({ ...prev, size: selectedBreed.size.trim() }));
        setErrors((prev) => ({ ...prev, size: "" }));
      } else {
        setFormData((prev) => ({ ...prev, size: "select" }));
      }
    }
  }, [breed, formData.breed, petData]);

  // Auto-calculate age from DOB
  useEffect(() => {
    if (formData.dob) {
      const age = calculateAge(formData.dob);
      setFormData((prev) => {
        if (prev.petAge === age) return prev;
        return { ...prev, petAge: age };
      });
    }
  }, [formData.dob]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Event Handlers
  // ─────────────────────────────────────────────────────────────────────────────
  const handleVictoriaInfoChange = (inputValue) => {
    setFormData((prev) => ({ ...prev, additionalInfo: inputValue }));
  };

  const handleInputChange = (field, value) => {
    // Handle Weight (Numbers only)
    if (field === "weight") {
      value = value.replace(/[^0-9]/g, "");
    }

    if (field === "microchipNo") {
      value = value.replace(/[^0-9]/g, "").slice(0, 15);
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, microchipNo: error }));
    }

    // Handle Date of Birth Validation
    if (field === "dob") {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedYear = selectedDate.getFullYear();
      const currentYear = today.getFullYear();
      const isValidDate = !isNaN(selectedDate.getTime());

      if (value && isValidDate) {
        if (selectedDate > today) {
          setErrors((prev) => ({ ...prev, dob: "Date of Birth cannot be in the future." }));
        } else if (selectedYear < 1900 || selectedYear > currentYear) {
          setErrors((prev) => ({ ...prev, dob: `Please enter a valid year between 1900 and ${currentYear}.` }));
        } else {
          setErrors((prev) => ({ ...prev, dob: "" }));
        }
      } else if (value && value.length >= 4) {
        setErrors((prev) => ({ ...prev, dob: "Invalid date format." }));
      } else {
        setErrors((prev) => ({ ...prev, dob: "" }));
      }
    }

    // Handle Instagram Validation
    if (field === "instagramLink") {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, instagramLink: error }));
    }

    // Update State
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validate on change for other fields
    if (!["dob", "instagramLink", "microchipNo"].includes(field)) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }

    // Auto-fill size from breed
    if (field === "breed" && value !== "select") {
      const selectedBreed = breed.find((b) => b["breedName"] === value);
      if (selectedBreed?.size) {
        setFormData((prev) => ({ ...prev, size: selectedBreed.size.trim() }));
        setErrors((prev) => ({ ...prev, size: "" }));
      } else {
        setFormData((prev) => ({ ...prev, size: "select" }));
        setErrors((prev) => ({ ...prev, size: "Size not available for this breed." }));
      }
    }
  };

  const handleBlur = (field, value) => {
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const fetchBreeds = async (petType) => {
    try {
      const response = await webApi.get(`breeds?petType=${petType}`);
      if (response.status === 200) {
        setBreedOptions(response.data.data.map((b) => b?.["breedName"]));
        setBreed(response.data.data);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleVaccinationToggle = (vaccine) => {
    setFormData(prev => {
      const current = prev.howManyVaccinationsDone || [];
      const updated = current.includes(vaccine)
        ? current.filter(v => v !== vaccine)
        : [...current, vaccine];
      return { ...prev, howManyVaccinationsDone: updated };
    });
  };

  const handleImageFileChange = (e) => {
    const files = Array.from(e.target.files);
    e.target.value = "";

    if (errors.images) setErrors((prev) => ({ ...prev, images: "" }));

    const remainingSlots = MAX_IMAGES - imageFiles.length;
    if (remainingSlots <= 0) {
      setErrors((prev) => ({ ...prev, images: `Maximum ${MAX_IMAGES} images allowed.` }));
      return;
    }

    const validFiles = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, images: "Please upload valid image files." }));
        return;
      }
      const isDuplicate = imageFiles.some(
        (f) => typeof f !== "string" && f.name === file.name && f.size === file.size
      );
      if (!isDuplicate) validFiles.push(file);
    }

    if (!validFiles.length) return;

    const queue = validFiles.slice(0, remainingSlots);
    setFilesToCrop(queue);
    setImageToCrop(queue[0]);
    setCropperOpen(true);
    setIsCropping(true);
  };

  const handleCropComplete = (croppedBlob) => {
    if (isProcessingCrop.current) return;
    isProcessingCrop.current = true;

    try {
      const croppedFile = new File(
        [croppedBlob],
        `cropped-${Date.now()}.jpg`,
        { type: "image/jpeg" }
      );

      const previewUrl = URL.createObjectURL(croppedFile);
      blobUrlsRef.current.push(previewUrl);

      setImageFiles((prev) => [...prev, croppedFile].slice(0, MAX_IMAGES));
      setImagePreviews((prev) => [...prev, previewUrl].slice(0, MAX_IMAGES));

      if (errors.images) setErrors((prev) => ({ ...prev, images: "" }));

      setFilesToCrop((prevQueue) => {
        const remaining = prevQueue.slice(1);
        if (remaining.length > 0) {
          setImageToCrop(remaining[0]);
          setCropperOpen(true);
          setIsCropping(true);
        } else {
          setImageToCrop(null);
          setCropperOpen(false);
          setIsCropping(false);
        }
        return remaining;
      });
    } catch (error) {
      console.error("Error in crop complete:", error);
    } finally {
      setTimeout(() => { isProcessingCrop.current = false; }, 500);
    }
  };

  const handleCropCancel = () => {
    isProcessingCrop.current = false;
    setIsCropping(false);
    setFilesToCrop((prevQueue) => {
      const remaining = prevQueue.slice(1);
      if (remaining.length > 0) {
        setImageToCrop(remaining[0]);
        setCropperOpen(true);
        setIsCropping(true);
      } else {
        setImageToCrop(null);
        setCropperOpen(false);
        setIsCropping(false);
      }
      return remaining;
    });
  };

  const handleDeleteMedia = async (index, type) => {
    const isPhoto = type === "photo";
    const files = isPhoto ? imageFiles : videoFiles;
    const fileToRemove = files[index];

    if (fileToRemove === "existing") {
      try {
        setApiProcessing({ loader: true, message: `Deleting ${type}...` });
        const endpoint = isPhoto
          ? `vendorPetProfile/deleteMedia/${petData.id}?index=${index}`
          : `vendorPetProfile/deleteMedia/${petData.id}?index=${index}`;
        const response = await webApi.delete(endpoint);

        if (response.status === "success" || response.status === 200) {
          fetchPetData();
        } else {
          setErrorMessage(response.message || "Server failed to delete item.");
          return;
        }
      } catch (error) {
        console.error("Delete Error:", error.response?.data || error.message);
        setErrorMessage(error.response?.data?.message || "Failed to delete from server.");
        return;
      } finally {
        setApiProcessing({ loader: false, message: "" });
      }
    }

    if (isPhoto) {
      setImageFiles((prev) => prev.filter((_, i) => i !== index));
      setImagePreviews((prev) => {
        const url = prev[index];
        if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
        return prev.filter((_, i) => i !== index);
      });
    } else {
      setVideoFiles((prev) => prev.filter((_, i) => i !== index));
      setVideoPreviews((prev) => {
        const url = prev[index];
        if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
        return prev.filter((_, i) => i !== index);
      });
    }
  };

  const handleVideoFileChange = (e) => {
    const files = Array.from(e.target.files);
    e.target.value = "";

    if (errors.videos) setErrors((prev) => ({ ...prev, videos: "" }));

    const remainingSlots = MAX_VIDEOS - videoFiles.length;
    if (remainingSlots <= 0) {
      setErrors((prev) => ({ ...prev, videos: `Maximum ${MAX_VIDEOS} videos allowed.` }));
      return;
    }

    const validFiles = [];
    for (const file of files) {
      if (!file.type.startsWith("video/")) {
        setErrors((prev) => ({ ...prev, videos: "Please upload valid video files." }));
        return;
      }
      const isDuplicate = videoFiles.some(
        (f) => f.name === file.name && f.size === file.size
      );
      if (!isDuplicate) validFiles.push(file);
    }

    if (!validFiles.length) return;

    const toAdd = validFiles.slice(0, remainingSlots);
    const previews = toAdd.map((f) => {
      const url = URL.createObjectURL(f);
      blobUrlsRef.current.push(url);
      return url;
    });

    setVideoFiles((prev) => [...prev, ...toAdd].slice(0, MAX_VIDEOS));
    setVideoPreviews((prev) => [...prev, ...previews].slice(0, MAX_VIDEOS));
  };

  const handleSubmit = async () => {
    setHasSubmitted(true);

    // Validate all fields
    const newErrors = {};

    if (!formData.petName.trim()) newErrors.petName = "Pet Name is required.";
    if (imageFiles.length === 0) newErrors.images = "Please upload at least 1 image.";
    if (!formData.dob.trim()) newErrors.dob = "Date of Birth is required.";
    if (!formData.color.trim() || formData.color === "Select Color") newErrors.color = "Pet color is required.";
    if (!formData.medication.trim()) newErrors.medication = "Medication is required.";
    if (!String(formData.weight).trim()) newErrors.weight = "Pet weight is required.";
    else if (!formData.petWeightIn) newErrors.petWeightIn = "Select pet weight type";
    if (!formData.petType || formData.petType === "select") newErrors.petType = "Pet Type is required.";
    if (!formData.petGender || formData.petGender === "select") newErrors.petGender = "Pet Gender is required.";
    if (!formData.breed || formData.breed === "select") newErrors.breed = "Pet Breed is required.";
    if (!formData.vaccinated) newErrors.vaccinated = "Please specify if pet is vaccinated.";
    if (!formData.healthCondition.trim()) newErrors.healthCondition = "Please specify if pet has any health issues.";
    if (!formData.spayedOrNeutered || formData.spayedOrNeutered === "select") newErrors.spayedOrNeutered = "Please specify if pet is spayed or neutered.";
    if (formData.microchipNo && formData.microchipNo.length > 0) {
      if (formData.microchipNo.length !== 15) {
        newErrors.microchipNo = "Microchip number must be exactly 15 digits.";
      } else if (!/^\d+$/.test(formData.microchipNo)) {
        newErrors.microchipNo = "Microchip number must contain only digits.";
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTimeout(() => {
        const firstErrorElement = document.querySelector(`.${styles["error-text"]}`);
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
      return;
    }

    setErrors({});
    setErrorMessage("");

    const payload = {
      petName: formData.petName,
      petType: formData.petType,
      breed: formData.breed,
      additionalInfo: formData.additionalInfo,
      weight: `${formData.weight} ${formData.petWeightIn}`,
      vaccinated: formData.vaccinated,
      petGender: formData.petGender,
      kci: formData.kci,
      color: formData.color,
      championship: formData.championship,
      Events: formData.Events,
      skills: formData.skills,
      instagramLink: formData.instagramLink,
      ...(formData.dob
        ? dateOnlyWithTimeZone("birthday", parseWallClockDate(formData.dob) || new Date(formData.dob))
        : { birthday: null }),
      spayedOrNeutered: formData.spayedOrNeutered,
      medication: formData.medication,
      doesYourPetHasAnyHealthIssues: formData.healthCondition,
      size: formData.size,
      howManyVaccinationsDone: formData.howManyVaccinationsDone || [],
      microchipNo: formData.microchipNo || "",
      howmanyTimesBreedingDone: formData.howmanyTimesBreedingDone || ""
    };

    try {
      setApiProcessing({ loader: true, message: "Saving profile..." });
      let response;

      if (!petData) {
        response = await webApi.post("vendorPetProfile/create", payload);
      } else {
        response = await webApi.put(`vendorPetProfile/update/${petData.id}`, payload);
      }

      if (response.status === "success" || response.status === 200) {
        const petId = response.data?.petProfile?.id || response.data?.id || petData?.id;

        if (petId) {
          for (const file of imageFiles) {
            if (file && file !== "existing") {
              const fd = new FormData();
              fd.append("morePhotos", file);
              try {
                await webApi.imagePut(`vendorPetProfile/morePhotos/${petId}`, fd);
              } catch (err) {
                console.error("Image upload failed:", err);
              }
            }
          }

          for (const file of videoFiles) {
            if (file && file !== "existing") {
              const fd = new FormData();
              fd.append("moreVideos", file);
              try {
                await webApi.imagePut(`vendorPetProfile/moreVideos/${petId}`, fd);
              } catch (err) {
                console.error("Video upload failed:", err);
              }
            }
          }
        }

        setErrorMessage("");
        closePopup(true);
      } else {
        setErrorMessage(response.message || "Failed to save profile.");
      }
    } catch (err) {
      console.error("Submit Error:", err);
      setErrorMessage(err.response?.data?.message || "An error occurred while saving.");
    } finally {
      setApiProcessing({ loader: false, message: "" });
    }
  };

  const maxDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  const sizeOptions = useMemo(() => {
    if (petData && formData.size && formData.size !== "select size" && formData.size !== "") {
      return [formData.size];
    }
    if (!petData && formData.breed !== "select" && formData.size && formData.size !== "select size" && formData.size !== "") {
      return [formData.size];
    }
    return ["select size"];
  }, [petData, formData.breed, formData.size]);

  return (
    <div className={styles.popupContainer} style={{ background: "#fff", borderRadius: "10px", width: "100%", position: "relative" }}>
      {/* Header */}
      <div className={styles.header} style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "0 10px 0 0" }}>
          <span><BackHeader onClick={closePopup} /></span>
          <h2>{petData ? "Edit Pet Details" : "Add New Pet"}</h2>
        </div>
        {/* <button style={{ background: "transparent", border: "none", fontSize: "1.2rem", padding: "20px", cursor: "pointer" }} onClick={closePopup}>&#x2715;</button> */}
      </div>

      <div className={styles.mainContainer}>
        {/* Section 1: Basic Info */}
        <div className={styles.formDiv2}>
          {!!petData ? (
            <div style={{ width: isMobile ? "100%" : "48%" }}>
              <p>Pet Type <span style={{ color: "red" }}>*</span></p>
              <div style={{ padding: "12px", border: "1px solid #e0e0e0", color: "#666", }}>
                {typeof formData.petType === 'object' ? formData.petType?.petType : formData.petType}
              </div>
            </div>
          ) : (
            <DropDownv1
              options={["select", "Dog", "Cat", "Bird", "Fish", "Small Pet"]}
              question={"Pet Type *"}
              width={isMobile ? "100%" : "48%"}
              backgroundColor="#FFFFFF"
              value={formData.petType}
              onChange={(value) => {
                handleInputChange("petType", value);
                if (value && value !== "select") fetchBreeds(value);
                else setBreedOptions([]);
              }}
              CustomInputElementAddpet={{ color: "#000000" }}
              error={errors.petType}
            />
          )}

          <CustomInputElement2
            question={"Pet Name *"}
            width={isMobile ? "100%" : "48%"}
            backgroundColor="#FFFFFF"
            placeholder="Enter Pet Name"
            type="text"
            value={formData.petName}
            onChange={(e) => handleInputChange("petName", e.target.value)}
            onBlur={(e) => handleBlur("petName", e.target.value)}
            custommarrgin={{ marginBottom: "14px" }}
            error={errors.petName}
            ownMargin={true}
          />

          {!!petData ? (
            <div style={{ width: isMobile ? "100%" : "48%" }}>
              <p>Pet Breed <span style={{ color: "red" }}>*</span></p>
              <div style={{ padding: "12px", border: "1px solid #e0e0e0", color: "#666", }}>
                {formData.breed}
              </div>
            </div>
          ) : (
            <SearchableDropdown
              options={["select", ...breedOptions]}
              value={formData.breed}
              onChange={(value) => handleInputChange("breed", value)}
              placeholder="Breed"
              label="Pet Breed"
              error={errors.breed}
              disabled={false}
              isMobile={isMobile}
            />
          )}

          <CustomInputElement2
            question={"Date Of Birth *"}
            width={isMobile ? "100%" : "48%"}
            backgroundColor="#FFFFFF"
            type="date"
            value={formData.dob}
            onChange={(e) => handleInputChange("dob", e.target.value)}
            onBlur={(e) => handleBlur("dob", e.target.value)}
            max={maxDate}
            error={errors.dob}
            custommarrgin={{ marginBottom: "14px" }}
            ownMargin={true}
          />

          {!!petData ? (
            <div style={{ width: isMobile ? "100%" : "48%" }}>
              <p>Gender <span style={{ color: "red" }}>*</span></p>
              <div style={{ padding: "12px", border: "1px solid #e0e0e0", color: "#666", }}>
                {formData.petGender}
              </div>
            </div>
          ) : (
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
          )}

          <div style={{ width: isMobile ? "100%" : "48%" }}>
            <p>Size <span style={{ color: "red" }}>*</span></p>
            <div style={{ padding: "12px", border: "1px solid #e0e0e0", }}>
              {formData.size || (petData ? "Not specified" : "Select pet breed")}
            </div>
          </div>

          <SearchableDropdown
            options={petColors}
            value={formData.color}
            onChange={(value) => handleInputChange("color", value)}
            placeholder="Color"
            label="Color"
            error={errors.color}
            disabled={false}
            isMobile={isMobile}
          />

          <CustomInputComp
            question={"Weight *"}
            width={isMobile ? "100%" : "48%"}
            backgroundColor="#FFFFFF"
            type="text"
            placeholder="Enter Pet Weight (e.g., 12 kg or 25 lb)"
            value={formData.weight ? `${formData.weight} ${formData.petWeightIn}` : ""}
            onChange={(e) => {
              const value = e.target.value;
              // Extract number and unit from input
              const numberMatch = value.match(/\d+/);
              const unitMatch = value.match(/(kg|lb|KG|LB)/i);

              if (numberMatch) {
                const numericValue = numberMatch[0].slice(0, 3);
                handleInputChange("weight", numericValue);
              }
              if (unitMatch) {
                const unit = unitMatch[0].toLowerCase();
                handleInputChange("petWeightIn", unit);
              }
            }}
            onBlur={(e) => {
              handleBlur("weight", formData.weight);
              if (!formData.petWeightIn && formData.weight) {
                setErrors((prev) => ({ ...prev, petWeightIn: "Please specify weight unit (kg or lb)" }));
              }
            }}
            custommarrgin={{ marginBottom: "14px" }}
            error={errors.weight || errors.petWeightIn}
            ownMargin={true}
            filter={formData.weight ? "weight" : ""}
            setFormData={setFormData}
            formData={formData}
          />
          {errors.petWeightIn && !errors.weight && (
            <span style={{ color: "red", fontSize: "12px", marginTop: "-10px", display: "block" }}>
              {errors.petWeightIn}
            </span>
          )}

          <DropDownv1
            options={["select", "Yes", "No"]}
            question={"Spayed/Neutered *"}
            width={isMobile ? "100%" : "48%"}
            backgroundColor="#FFFFFF"
            value={formData.spayedOrNeutered}
            onChange={(value) => handleInputChange("spayedOrNeutered", value)}
            CustomInputElementAddpet={{ color: "#000000" }}
            error={errors.spayedOrNeutered}
          />

          <CustomInputElement2
            question={"Medication *"}
            width={isMobile ? "100%" : "48%"}
            type="text"
            backgroundColor="#FFFFFF"
            value={formData.medication}
            placeholder="Enter Medication"
            onChange={(e) => handleInputChange("medication", e.target.value)}
            onBlur={(e) => handleBlur("medication", e.target.value)}
            custommarrgin={{ marginBottom: "14px" }}
            error={errors.medication}
            ownMargin={true}
          />
        </div>

        {/* Section 2: Extra Info */}
        <div className={styles.formDiv2}>
          <CustomInputElement2
            question={"Health Condition *"}
            width={isMobile ? "100%" : "48%"}
            type="text"
            backgroundColor="#FFFFFF"
            value={formData.healthCondition}
            placeholder="Enter Health Conditions"
            onChange={(e) => handleInputChange("healthCondition", e.target.value)}
            onBlur={(e) => handleBlur("healthCondition", e.target.value)}
            custommarrgin={{ marginBottom: "14px" }}
            error={errors.healthCondition}
            ownMargin={true}
          />

          <CustomInputElement2
            question={"Microchip Number"}
            width={isMobile ? "100%" : "48%"}
            type="text"
            backgroundColor="#FFFFFF"
            value={formData.microchipNo || ""}
            placeholder="Enter Microchip Number (15 digits)"
            onChange={(e) => handleInputChange("microchipNo", e.target.value)}
            onBlur={(e) => handleBlur("microchipNo", e.target.value)}
            custommarrgin={{ marginBottom: "14px" }}
            error={errors.microchipNo}
            ownMargin={true}
          />

          <DropDownv1
            options={["select", "Yes", "No"]}
            question={"Vaccinated *"}
            width={isMobile ? "100%" : "48%"}
            backgroundColor="#FFFFFF"
            value={formData.vaccinated}
            onChange={(value) => handleInputChange("vaccinated", value)}
            CustomInputElementAddpet={{ color: "#000000" }}
            error={errors.vaccinated}
          />

          {formData.vaccinated === "Yes" && (
            <div style={{ width: isMobile ? "100%" : "48%", position: "relative" }} ref={vaccMenuRef}>
              <p>Vaccinations Done</p>
              <div
                className={styles.customSelectHeader}
                onClick={() => setShowVaccDropdown(!showVaccDropdown)}
                style={{ border: "1px solid #d9d9d9", padding: "10px", borderRadius: "8px", cursor: "pointer", background: "#fff" }}
              >
                {formData.howManyVaccinationsDone.length > 0
                  ? `${formData.howManyVaccinationsDone.length} Selected`
                  : "Select Vaccinations"}
                <span style={{ float: "right" }}>{showVaccDropdown ? "▲" : "▼"}</span>
              </div>

              {showVaccDropdown && (
                <div className={styles.checkboxDropdownList} style={{ position: "absolute", zIndex: 10, background: "#fff", width: "100%", border: "1px solid #ddd", maxHeight: "200px", overflowY: "auto", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
                  {vaccinationOptions.map(v => (
                    <label key={v} style={{ display: "flex", alignItems: "center", padding: "8px", cursor: "pointer", borderBottom: "1px solid #f0f0f0" }}>
                      <input
                        type="checkbox"
                        checked={formData.howManyVaccinationsDone.includes(v)}
                        onChange={() => handleVaccinationToggle(v)}
                        style={{ marginRight: "10px" }}
                      />
                      <span style={{ fontSize: "13px" }}>{v}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
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

          <CustomInputElement2
            question={"How many times breeding done earlier?"}
            width={isMobile ? "100%" : "48%"}
            type="number"
            backgroundColor="#FFFFFF"
            value={formData.howmanyTimesBreedingDone || ""}
            placeholder="Enter Breeding Count"
            onChange={(e) => handleInputChange("howmanyTimesBreedingDone", e.target.value)}
            custommarrgin={{ marginBottom: "14px" }}
            ownMargin={true}
          />

          <CustomInputElement2
            question={"Skills"}
            width={isMobile ? "100%" : "48%"}
            backgroundColor="#FFFFFF"
            value={formData.skills}
            placeholder="Enter Skills"
            onChange={(e) => handleInputChange("skills", e.target.value)}
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

          <CustomInputElement2
            question={"Events"}
            width={isMobile ? "100%" : "48%"}
            backgroundColor="#FFFFFF"
            value={formData.Events}
            placeholder="Enter Events"
            onChange={(e) => handleInputChange("Events", e.target.value)}
            CustomInputElementAddpet={{ color: "#000000" }}
          />

          <CustomInputElement2
            question={"Instagram Link"}
            width={isMobile ? "100%" : "48%"}
            backgroundColor="#FFFFFF"
            placeholder="URL"
            value={formData.instagramLink}
            onChange={(e) => handleInputChange("instagramLink", e.target.value)}
            onBlur={(e) => handleBlur("instagramLink", e.target.value)}
            error={errors.instagramLink}
            custommarrgin={{ marginBottom: "14px" }}
            ownMargin={true}
          />

          <CustomInputElement2
            question="Additional Information"
            width={isMobile ? "100%" : "48%"}
            backgroundColor="#FFFFFF"
            placeholder="Add more information"
            onInputChange={handleVictoriaInfoChange}
            value={formData.additionalInfo}
            onChange={(e) => handleInputChange("additionalInfo", e.target.value)}
            rows={3}
            customStylestext={{ backgroundColor: "#fff", border: "1px solid rgb(217, 217, 217)", marginBottom: "16px" }}
          />

          {/* Upload Section */}
          <div className={styles.uploadSections}>
            <div className={styles.uploadSection}>
              <p className={styles.uploadLabel}>
                Pet Images <span className={styles.required}>*</span>
              </p>
              <div className={styles["image-grid"]}>
                {Array.from({ length: isMobile ? 1 : MAX_IMAGES }).map((_, index) => {
                  const hasImage = !!imagePreviews[index];
                  const isMandatory = index === 0;
                  return (
                    <div key={index} className={styles["slot-column"]}>
                      {!hasImage ? (
                        <label
                          className={`${styles["image-slot-empty"]} ${isMandatory ? styles["mandatory-border"] : ""}`}
                          onClick={() => imageFileInputRef.current?.click()}
                          style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", width: "100%", height: "100%", minHeight: "120px", border: "2px dashed #ccc", borderRadius: "8px", backgroundColor: "#f9f9f9" }}
                        >
                          <AddIcon />
                        </label>
                      ) : (
                        <div className={styles["image-preview-below"]} style={{ position: "relative", width: "100%", height: "100%" }}>
                          <img src={imagePreviews[index]} alt={`pet-${index}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
                          <button type="button" onClick={() => handleDeleteMedia(index, "photo")} style={{ position: "absolute", top: "-1px", right: "-3px", background: "rgba(0, 0, 0, 0.6)", color: "#fff", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "none", fontSize: "14px" }}>✕</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <input ref={imageFileInputRef} type="file" accept="image/*" multiple={!isMobile} hidden onChange={handleImageFileChange} />
              {errors.images && <span className={styles["error-text"]} style={{ color: "red", fontSize: "12px", marginTop: "5px", display: "block" }}>{errors.images}</span>}
            </div>

            {cropperOpen && imageToCrop && (
              <ImageCropperModal
                open={cropperOpen}
                image={imageToCrop}
                onClose={handleCropCancel}
                onCropComplete={handleCropComplete}
              />
            )}

            {/* <div className={styles.uploadSection} style={{ marginTop: isMobile ? "10px" : "0" }}>
              <p className={styles.uploadLabel}>Pet Videos <span style={{ color: "#666" }}>(Optional)</span></p>
              <div className={styles["image-grid"]}>
                {Array.from({ length: isMobile ? 1 : MAX_VIDEOS }).map((_, index) => {
                  const hasVideo = !!videoPreviews[index];
                  return (
                    <div key={index} className={styles["slot-column"]}>
                      {!hasVideo ? (
                        <label className={styles["image-slot-empty"]} onClick={() => videoFileInputRef.current?.click()} style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", width: "100%", height: "100%", minHeight: "120px", border: "2px dashed #ccc", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
                          <div style={{ fontSize: "32px", marginBottom: "8px" }}>+</div>
                          <div style={{ fontSize: "12px", textAlign: "center" }}>Add Video</div>
                        </label>
                      ) : (
                        <div className={styles["image-preview-below"]} style={{ position: "relative", width: "100%", height: "100%" }}>
                          <video src={videoPreviews[index]} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} controls />
                          <button type="button" onClick={() => handleDeleteMedia(index, "video")} style={{ position: "absolute", top: "-1px", right: "-3px", background: "rgba(0, 0, 0, 0.6)", color: "#fff", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "none", fontSize: "14px" }}>✕</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <input ref={videoFileInputRef} type="file" accept="video/*" multiple={!isMobile} hidden onChange={handleVideoFileChange} />
              {errors.videos && <span className={styles["error-text"]} style={{ color: "red", fontSize: "12px", marginTop: "5px", display: "block" }}>{errors.videos}</span>}
            </div> */}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
            <div className={styles.deskSubmit}>
              <div className={styles.mobSubmit}>
                <button
                  className={styles.submitButton}
                  onClick={handleSubmit}
                  disabled={apiProcessing.loader}
                  style={{
                    background: "#F5790C", color: "white", padding: "10px 20px",
                    borderRadius: "5px", border: "none", cursor: "pointer", fontSize: "16px",
                  }}
                >
                  {apiProcessing.loader ? "Saving..." : petData ? "Save" : "Add Pet"}
                </button>
              </div>
            </div>
          </div>

          {errorMessage && (
            <p style={{ color: "red", fontSize: "14px", marginTop: "10px", textAlign: "center" }}>{errorMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddNewPetPopup;
