import useStore from "@/components/state/useStore";
import { WebApimanager } from "@/components/utilities/WebApiManager";
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { AddIcon } from "@/public/images/SVG";
import styles from "../../styles/register/settingsregister.module.css";
import ImageCropperModal from "@/components/register/imageCropperModule";
import CustomInputElement2 from "@/components/register/customInputcom";
import DropDownv1 from "@/components/register/dropdown";
import CustomInputComp from "@/components/register/customInput";
import BackHeader from "@/components/pet-sales/backHeader";
import Cookies from "js-cookie";
import { IMAGE_URL } from "../utilities/Constants";
// import { GalleryIcon } from "@/src/icons/GalleryIcon";
// import { CrossIcon } from "@/src/icons/CrossIcon";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const MAX_IMAGES = 3; // 1 primary + 3 extra  (adjust as needed)
const MAX_VIDEOS = 3;


// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const calculateAge = (dob) => {
  const dobDate = new Date(dob);
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
  fetchPetData = () => {},
}) => {
  const { getJwtToken } = useStore();
  const jwt = getJwtToken();
  const webApi = new WebApimanager(jwt);

   const imageFileInputRef = useRef(null);
  const videoFileInputRef = useRef(null);
  const isProcessingCrop = useRef(false);
  const blobUrlsRef = useRef([]);

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);

  // Cropper queue
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [filesToCrop, setFilesToCrop] = useState([]);
  const [isCropping, setIsCropping] = useState(false);

  // ── Other state ───────────────────────────────────────────────────────────
  const [breedOptions, setBreedOptions] = useState([]);
  const [breed, setBreed]               = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors]             = useState({});
  const [locationDetails, setLocationDetails] = useState("");
  const [apiProcessing, setApiProcessing] = useState({ loader: false, message: "Loading..." });
  const [isMobile, setIsMobile]         = useState(false);

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
    petWeightIn: "", microchipNo: "", howmanyTimesBreedingDone: "",
  });
  const vaccinationOptions = [
    "Rabies",
    "DHLPP",
    "Bordetella",
    "Leptospirosis",
    "Lyme Disease",
    "Canine Influenza",
    "Parvovirus",
    "Distemper",
    "Adenovirus",
    "Parainfluenza"
  ];
 useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => {
        if (url && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  // ── Location ──────────────────────────────────────────────────────────────
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
    } catch (_) {}
  }, [selectedLocation]);

  // ── Responsive ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => setIsMobile(window.innerWidth <= 768);
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  

  // ── Populate form when editing ────────────────────────────────────────────
  // useEffect(() => {
  //   if (petData) {
  //     setFormData({
  //       petName: petData.petName || "",
  //       petAge: petData.petAge || "",
  //       petType: petData.petType || "",
  //       color: petData.color || "",
  //       breed: petData.breed || "",
  //       additionalInfo: petData.additionalInfo || "",
  //       weight:
  //         petData?.weight?.endsWith("kg") || petData?.weight?.endsWith("lb")
  //           ? petData.weight.split(" ")[0]
  //           : petData?.weight || "",
  //       petWeightIn: petData?.weight?.endsWith("kg") ? "kg" : "lb",
  //       vaccinated: petData.vaccinated ?? null,
  //       kci: petData.kci || "",
  //       championship: petData.championship || "",
  //       Events: petData.Events || "",
  //       skills: petData.skills || "",
  //       instagramLink: petData.instagramLink || "",
  //       petGender: petData.petGender || "",
  //       vaccineCertificate: petData.vaccineCertificate || "",
  //       kciCertificate: petData.kciCertificate || "",
  //       spayedOrNeutered: petData.spayedOrNeutered || "",
  //       dob: petData?.birthday?.slice(0, 10) || "",
  //       medication: petData.medication || "",
  //       size: petData.size || "",
  //       healthCondition: petData.doesYourPetHasAnyHealthIssues || "",
  //       microchipNumber: petData.microchipNumber || "",
  //       breedingCount: petData.breedingCount || "",
  //     });
  //     // Show existing primary image from server
  //     if (petData.morePhotos && petData.morePhotos.length > 0) {
  //       setImagePreviews([`${IMAGE_URL}${petData.morePhotos[0]}`]);
  //       setImageFiles(["existing"]); // sentinel so validation passes
  //     }
  //   } else {
  //     setFormData({
  //       petName: "", petAge: "", petType: "", color: "", breed: "", additionalInfo: "",
  //       weight: "", vaccinated: null, kci: "", championship: "", Events: "", skills: "",
  //       instagramLink: "", petGender: "", vaccineCertificate: "", kciCertificate: "",
  //       dob: "", spayedOrNeutered: "", medication: "", size: "", healthCondition: "",
  //       petWeightIn: "", microchipNumber: "", breedingCount: "",
  //     });
  //     setImageFiles([]);
  //     setImagePreviews([]);
  //     setVideoFiles([]);
  //     setVideoPreviews([]);
  //   }
  // }, [petData]);
  useEffect(() => {
  if (petData) {
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
          : petData?.weight || "",
      petWeightIn: petData?.weight?.endsWith("kg") ? "kg" : "lb",
      vaccinated: petData.vaccinated ?? null,
      kci: petData.kci || "",
      championship: petData.championship || "",
      Events: petData.Events || "",
      skills: petData.skills || "",
      instagramLink: petData.instagramLink || "",
      petGender: petData.petGender || "",
      vaccineCertificate: petData.vaccineCertificate || "",
      kciCertificate: petData.kciCertificate || "",
      spayedOrNeutered: petData.spayedOrNeutered || "",
      dob: petData?.birthday?.slice(0, 10) || "",
      medication: petData.medication || "",
      size: petData.size || "",
      healthCondition: petData.doesYourPetHasAnyHealthIssues || "",
      microchipNo: petData.microchipNo || "",
      howmanyTimesBreedingDone: petData.howmanyTimesBreedingDone || "",
    });
    
    // Show existing images from server
    if (petData.morePhotos && petData.morePhotos.length > 0) {
      const imageUrls = petData.morePhotos.map(photo => {
        // Ensure the URL is properly formatted
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
      petWeightIn: "", microchipNo: "", howmanyTimesBreedingDone: "",
    });
    setImageFiles([]);
    setImagePreviews([]);
    setVideoFiles([]);
    setVideoPreviews([]);
    setErrorMessage(""); // Clear any errors when resetting
  }
}, [petData]);

  // ── Fetch breeds when editing ─────────────────────────────────────────────
  useEffect(() => {
    if (petData?.petType && breedOptions.length === 0) {
      fetchBreeds(petData.petType);
    }
  }, [petData?.petType]);

  // ── Auto-fill size from breed ─────────────────────────────────────────────
  // ── Auto-fill size from breed ─────────────────────────────────────────────
useEffect(() => {
  // Don't auto-fill size when editing an existing pet
  if (petData) {
    return;
  }
  
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

  // ── Auto-calculate age from DOB ───────────────────────────────────────────
  useEffect(() => {
    if (formData.dob) {
      const age = calculateAge(formData.dob);
      setFormData((prev) => {
        if (prev.petAge === age) return prev;
        return { ...prev, petAge: age };
      });
    }
  }, [formData.dob]);

  // ── Field helpers ─────────────────────────────────────────────────────────
  const instagramRegex =
    /^(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/[A-Za-z0-9._%-]+\/?$/;

  const handleVictoriaInfoChange = (inputValue) => {
    setFormData((prev) => ({ ...prev, additionalInfo: inputValue }));
  };

  const handleInputChange = (field, value) => {
    if (field === "weight") value = value.replace(/[^0-9]/g, "");
    if (value.trim() !== "") {
    setErrors((prev) => ({
      ...prev,
      [field]: "", // This clears the error for the specific field
    }));
  }
    if (field === "instagramLink") {
      setErrors((prev) => ({
        ...prev,
        instagramLink:
          value && !instagramRegex.test(value)
            ? "Please check your Instagram URL & enter a valid Instagram URL (ex: https://instagram.com/john_doe)"
            : "",
      }));
      
      if (field === "dob") {
    const selectedDate = new Date(value);
    const today = new Date();
    
    // If the date is in the future, don't update state or show an error immediately
    if (selectedDate > today) {
      setErrors(prev => ({ ...prev, dob: "Date of Birth cannot be in the future." }));
      // Optional: return; // Uncomment this to block the entry entirely
    } else {
      setErrors(prev => ({ ...prev, dob: "" }));
    }
  }

    }
    setFormData((prev) => ({ ...prev, [field]: value }));

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
  const handleVaccinationCheckboxChange = (vaccine) => {
    const currentVaccinations = [...formData.howManyVaccinationsDone];
    
    if (currentVaccinations.includes(vaccine)) {
      setFormData(prev => ({
        ...prev,
        howManyVaccinationsDone: currentVaccinations.filter(v => v !== vaccine)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        howManyVaccinationsDone: [...currentVaccinations, vaccine]
      }));
    }
  };

 
  const handleImageFileChange = (e) => {
    const files = Array.from(e.target.files);
    e.target.value = "";

    console.log("Files selected:", files);
    console.log("First file type:", files[0]?.type);
    console.log("First file size:", files[0]?.size);

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
      // if (file.size > MAX_FILE_SIZE) {
      //   setErrors((prev) => ({ ...prev, images: "Each image must be under 5 MB." }));
      //   return;
      // }
      const isDuplicate = imageFiles.some(
        (f) => typeof f !== "string" && f.name === file.name && f.size === file.size
      );
      if (!isDuplicate) validFiles.push(file);
    }

    if (!validFiles.length) return;

    console.log("Valid files:", validFiles);
    console.log("Opening cropper for:", validFiles[0].name);

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
      console.log("Crop complete, blob size:", croppedBlob.size);
      
      const croppedFile = new File(
        [croppedBlob],
        `cropped-${Date.now()}.jpg`,
        { type: "image/jpeg" }
      );

      // Create preview URL immediately
      const previewUrl = URL.createObjectURL(croppedFile);
      blobUrlsRef.current.push(previewUrl);
      
      // Update state
      setImageFiles((prev) => [...prev, croppedFile].slice(0, MAX_IMAGES));
      setImagePreviews((prev) => [...prev, previewUrl].slice(0, MAX_IMAGES));
      
      console.log("Image added. Total images:", imagePreviews.length + 1);

      if (errors.images) setErrors((prev) => ({ ...prev, images: "" }));

      // Process next file in queue
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
    console.log("Crop cancelled");
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

  // const handleRemoveImage = (index) => {
  //   console.log("Removing image at index:", index);
  //   const urlToRemove = imagePreviews[index];
  //   if (urlToRemove && urlToRemove.startsWith("blob:")) {
  //     URL.revokeObjectURL(urlToRemove);
  //     blobUrlsRef.current = blobUrlsRef.current.filter(url => url !== urlToRemove);
  //   }
  //   setImageFiles((prev) => prev.filter((_, i) => i !== index));
  //   setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  // };
  
const handleDeleteMedia = async (index, type) => {
  const isPhoto = type === "photo";
  const files = isPhoto ? imageFiles : videoFiles;
  const fileToRemove = files[index];

  // 1. Logic for EXISTING media on server
  if (fileToRemove === "existing") {
    const confirmDelete = window.confirm(`Permanently delete this ${type}?`);
    if (!confirmDelete) return;

    try {
      setApiProcessing({ loader: true, message: `Deleting ${type}...` });

      // Build the URL with query parameters if your backend uses ?index=X&type=Y
      // Example: vendorPetProfile/deletePhoto/23?index=0
      const endpoint = isPhoto 
        ? `vendorPetProfile/deleteMedia/${petData.id}?index=${index}` 
        : `vendorPetProfile/deleteMedia/${petData.id}?index=${index}`;

      const response = await webApi.delete(endpoint);

      if (response.status === "success" || response.status === 200) {
        console.log(`${type} deleted successfully from server`);
        // Refresh the data so the server and UI are in sync
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

  // 2. Local State Cleanup (runs for both new and existing files)
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

  // ─────────────────────────────────────────────────────────────────────────
  // VIDEO UPLOAD
  // ─────────────────────────────────────────────────────────────────────────

  const handleVideoFileChange = (e) => {
    const files = Array.from(e.target.files);
    e.target.value = "";

    console.log("Videos selected:", files.length);

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
    
    console.log("Videos added. Total videos:", videoFiles.length + toAdd.length);
  };

  // const handleRemoveVideo = (index) => {
  //   console.log("Removing video at index:", index);
  //   const urlToRemove = videoPreviews[index];
  //   if (urlToRemove && urlToRemove.startsWith("blob:")) {
  //     URL.revokeObjectURL(urlToRemove);
  //     blobUrlsRef.current = blobUrlsRef.current.filter(url => url !== urlToRemove);
  //   }
  //   setVideoFiles((prev) => prev.filter((_, i) => i !== index));
  //   setVideoPreviews((prev) => prev.filter((_, i) => i !== index));
  // };

  // ─────────────────────────────────────────────────────────────────────────
  // SUBMIT
  // ─────────────────────────────────────────────────────────────────────────
//   const handleSubmit = async () => {
//     const newErrors = {};
//     if (!formData.petName.trim()) newErrors.petName = "Pet Name is required.";
//     if (imageFiles.length === 0) newErrors.images = "Please upload at least 1 image.";
//     if (!formData.dob.trim()) newErrors.dob = "Date of Birth is required.";
//     if (!formData.color.trim() || formData.color === "Select Color") newErrors.color = "Pet color is required.";
//     if (!formData.medication.trim()) newErrors.medication = "Medication is required.";
//     if (!String(formData.weight).trim()) newErrors.weight = "Pet weight is required.";
//     else if (!formData.petWeightIn) newErrors.weight = "Select pet weight type";
//     if (!formData.petType || formData.petType === "select") newErrors.petType = "Pet Type is required.";
//     if (!formData.petGender || formData.petGender === "select") newErrors.petGender = "Pet Gender is required.";
//     if (!formData.breed || formData.breed === "select") newErrors.breed = "Pet Breed is required.";
//     if (formData.instagramLink && !instagramRegex.test(formData.instagramLink))
//       newErrors.instagramLink = "Please check your Instagram URL & enter a valid Instagram URL";

//     if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

//     setErrors({});
//     const payload = {
//       petAge: formData.petAge, petName: formData.petName, petType: formData.petType,
//       breed: formData.breed, additionalInfo: formData.additionalInfo,
//       weight: `${formData.weight} ${formData.petWeightIn}`,
//       vaccinated: formData.vaccinated, petGender: formData.petGender, kci: formData.kci,
//       color: formData.color, championship: formData.championship, Events: formData.Events,
//       skills: formData.skills, instagramLink: formData.instagramLink, birthday: formData.dob,
//       spayedOrNeutered: formData.spayedOrNeutered, medication: formData.medication,
//       doesYourPetHasAnyHealthIssues: formData.healthCondition, size: formData.size,
//     };

//   try {
//     setApiProcessing({ loader: true, message: "Saving profile..." });
//     let response;
//     if (!petData) response = await webApi.post("vendorPetProfile/create", payload);
//     else response = await webApi.put(`vendorPetProfile/update/${petData.id}`, payload);

//     if (response.status === "success") {
//       const petId = response.data?.petProfile?.id;
//       const uploadPromises = [];

//       // Queue Image Uploads
//       imageFiles.forEach((file) => {
//         if (file && file !== "existing") {
//           const fd = new FormData();
//           fd.append("petImage", file);
//           uploadPromises.push(webApi.imagePut(`vendorPetProfile/morePhotos/${petData.id}`));
//         }
//       });

//       // Queue Video Uploads
//       videoFiles.forEach((file) => {
//         const fd = new FormData();
//         fd.append("petVideo", file);
//         uploadPromises.push(webApi.imagePut(`/vendorPetProfile/moreVideos/${petData.id}`));
//       });

//       // Execute all uploads at once
//       if (uploadPromises.length > 0) {
//         setApiProcessing({ loader: true, message: "Uploading media..." });
//         await Promise.all(uploadPromises);
//       }

//       closePopup();
//       fetchPetData();
//     }
//   } catch (err) {
//     setErrorMessage("Failed to save profile. Please check your connection.");
//   } finally {
//     setApiProcessing({ loader: false, message: "" });
//   }
// };
// const handleSubmit = async () => {
//   const newErrors = {};
//   if (!formData.petName.trim()) newErrors.petName = "Pet Name is required.";
//   if (imageFiles.length === 0) newErrors.images = "Please upload at least 1 image.";
//   if (!formData.dob.trim()) newErrors.dob = "Date of Birth is required.";
//   if (!formData.color.trim() || formData.color === "Select Color") newErrors.color = "Pet color is required.";
//   if (!formData.medication.trim()) newErrors.medication = "Medication is required.";
//   if (!String(formData.weight).trim()) newErrors.weight = "Pet weight is required.";
//   else if (!formData.petWeightIn) newErrors.weight = "Select pet weight type";
//   if (!formData.petType || formData.petType === "select") newErrors.petType = "Pet Type is required.";
//   if (!formData.petGender || formData.petGender === "select") newErrors.petGender = "Pet Gender is required.";
//   if (!formData.breed || formData.breed === "select") newErrors.breed = "Pet Breed is required.";
//   if (formData.instagramLink && !instagramRegex.test(formData.instagramLink))
//     newErrors.instagramLink = "Please check your Instagram URL & enter a valid Instagram URL";

//   if (Object.keys(newErrors).length > 0) { 
//     setErrors(newErrors); 
//     return; 
//   }

//   setErrors({});
  
//   const payload = {
//     petAge: formData.petAge, 
//     petName: formData.petName, 
//     petType: formData.petType,
//     breed: formData.breed, 
//     additionalInfo: formData.additionalInfo,
//     weight: `${formData.weight} ${formData.petWeightIn}`,
//     vaccinated: formData.vaccinated, 
//     petGender: formData.petGender, 
//     kci: formData.kci,
//     color: formData.color, 
//     championship: formData.championship, 
//     Events: formData.Events,
//     skills: formData.skills, 
//     instagramLink: formData.instagramLink, 
//     birthday: formData.dob,
//     spayedOrNeutered: formData.spayedOrNeutered, 
//     medication: formData.medication,
//     doesYourPetHasAnyHealthIssues: formData.healthCondition, 
//     size: formData.size,
//   };

//   try {
//     setApiProcessing({ loader: true, message: "Saving profile..." });
//     let response;
    
//     if (!petData) {
//       // Create new pet profile
//       response = await webApi.post("vendorPetProfile/create", payload);
//       console.log("Create response:", response);
//     } else {
//       // Update existing pet profile
//       response = await webApi.put(`vendorPetProfile/update/${petData.id}`, payload);
//       console.log("Update response:", response);
//     }

//     if (response.status === "success") {
//       // Get the pet ID from response - it might be in different places
//       let petId;
//       if (response.data?.petProfile?.id) {
//         petId = response.data.petProfile.id;
//       } else if (response.data?.id) {
//         petId = response.data.id;
//       } else if (petData?.id) {
//         petId = petData.id;
//       } else {
//         console.error("Could not find pet ID in response:", response);
//         setErrorMessage("Failed to get pet ID after creation");
//         return;
//       }
      
//       console.log("Pet ID for uploads:", petId);
      
//       const uploadPromises = [];

//       // Queue Image Uploads - Only upload new images (not "existing" sentinel)
//       imageFiles.forEach((file) => {
//         if (file && file !== "existing") {
//           const fd = new FormData();
//           fd.append("morePhotos", file);
//           // Use the correct endpoint with petId
//           uploadPromises.push(webApi.imagePut(`vendorPetProfile/morePhotos/${petId}`, fd));
//           console.log("Uploading image:", file.name);
//         }
//       });

//       // Queue Video Uploads
//       videoFiles.forEach((file) => {
//         const fd = new FormData();
//         fd.append("petVideo", file);
//         // Use the correct endpoint with petId
//         uploadPromises.push(webApi.imagePut(`vendorPetProfile/moreVideos/${petId}`, fd));
//         console.log("Uploading video:", file.name);
//       });

//       // Execute all uploads at once
//       if (uploadPromises.length > 0) {
//         setApiProcessing({ loader: true, message: `Uploading ${uploadPromises.length} media files...` });
        
//         try {
//           const uploadResults = await Promise.all(uploadPromises);
//           console.log("All uploads completed:", uploadResults);
//         } catch (uploadError) {
//           console.error("Error uploading media:", uploadError);
//           setErrorMessage("Pet profile saved but some media failed to upload.");
//           // Don't throw here - pet profile was saved successfully
//         }
//       }

//       closePopup();
//       fetchPetData();
//     } else {
//       console.error("API response error:", response);
//       setErrorMessage(response.message || "Failed to save profile. Please try again.");
//     }
//   } catch (err) {
//     console.error("Submit error details:", err);
//     setErrorMessage(`Failed to save profile: ${err.message || "Please check your connection."}`);
//   } finally {
//     setApiProcessing({ loader: false, message: "" });
//   }
// };

// const handleSubmit = async () => {
//   const newErrors = {};
//   if (!formData.petName.trim()) newErrors.petName = "Pet Name is required.";
//   if (imageFiles.length === 0) newErrors.images = "Please upload at least 1 image.";
//   if (!formData.dob.trim()) newErrors.dob = "Date of Birth is required.";
//   if (!formData.color.trim() || formData.color === "Select Color") newErrors.color = "Pet color is required.";
//   if (!formData.medication.trim()) newErrors.medication = "Medication is required.";
//   if (!String(formData.weight).trim()) newErrors.weight = "Pet weight is required.";
//   else if (!formData.petWeightIn) newErrors.weight = "Select pet weight type";
//   if (!formData.petType || formData.petType === "select") newErrors.petType = "Pet Type is required.";
//   if (!formData.petGender || formData.petGender === "select") newErrors.petGender = "Pet Gender is required.";
//   if (!formData.breed || formData.breed === "select") newErrors.breed = "Pet Breed is required.";
//   if (formData.instagramLink && !instagramRegex.test(formData.instagramLink))
//     newErrors.instagramLink = "Please check your Instagram URL & enter a valid Instagram URL";

//   if (Object.keys(newErrors).length > 0) { 
//     setErrors(newErrors); 
//     return; 
//   }

//   setErrors({});
//   setErrorMessage(""); // Clear any previous error messages
  
//   const payload = {
//     petAge: formData.petAge, 
//     petName: formData.petName, 
//     petType: formData.petType,
//     breed: formData.breed, 
//     additionalInfo: formData.additionalInfo,
//     weight: `${formData.weight} ${formData.petWeightIn}`,
//     vaccinated: formData.vaccinated, 
//     petGender: formData.petGender, 
//     kci: formData.kci,
//     color: formData.color, 
//     championship: formData.championship, 
//     Events: formData.Events,
//     skills: formData.skills, 
//     instagramLink: formData.instagramLink, 
//     birthday: formData.dob,
//     spayedOrNeutered: formData.spayedOrNeutered, 
//     medication: formData.medication,
//     doesYourPetHasAnyHealthIssues: formData.healthCondition, 
//     size: formData.size,
//   };

//   try {
//     setApiProcessing({ loader: true, message: "Saving profile..." });
//     let response;
    
//     if (!petData) {
//       // Create new pet profile
//       response = await webApi.post("vendorPetProfile/create", payload);
//       console.log("Create response:", response);
//     } else {
//       // Update existing pet profile
//       response = await webApi.put(`vendorPetProfile/update/${petData.id}`, payload);
//       console.log("Update response:", response);
//     }

//     if (response.status === "success") {
//       // Get the pet ID from response
//       let petId;
//       if (response.data?.petProfile?.id) {
//         petId = response.data.petProfile.id;
//       } else if (response.data?.id) {
//         petId = response.data.id;
//       } else if (petData?.id) {
//         petId = petData.id;
//       } else {
//         console.error("Could not find pet ID in response:", response);
//         setErrorMessage("Failed to get pet ID after creation");
//         setApiProcessing({ loader: false, message: "" });
//         return;
//       }
      
//       console.log("Pet ID for uploads:", petId);
      
//       const uploadPromises = [];

//       // Queue Image Uploads - Only upload new images (not "existing" sentinel)
//       imageFiles.forEach((file) => {
//         if (file && file !== "existing") {
//           const fd = new FormData();
//           fd.append("morePhotos", file);
//           uploadPromises.push(webApi.imagePut(`vendorPetProfile/morePhotos/${petId}`, fd));
//           console.log("Uploading image:", file.name);
//         }
//       });

//       // Queue Video Uploads
//       videoFiles.forEach((file) => {
//         const fd = new FormData();
//         fd.append("moreVideos", file);
//         uploadPromises.push(webApi.imagePut(`vendorPetProfile/moreVideos/${petId}`, fd));
//         console.log("Uploading video:", file.name);
//       });

//       // Execute all uploads at once
//       if (uploadPromises.length > 0) {
//         setApiProcessing({ loader: true, message: `Uploading ${uploadPromises.length} media files...` });
        
//         try {
//           const uploadResults = await Promise.allSettled(uploadPromises);
//           console.log("All uploads completed:", uploadResults);
          
//           const failedUploads = uploadResults.filter(r => r.status === 'rejected');
//           if (failedUploads.length > 0) {
//             console.warn(`${failedUploads.length} file(s) failed to upload`);
//             // Only show warning but don't block closing
//             setErrorMessage(`Note: ${failedUploads.length} file(s) failed to upload.`);
//             setTimeout(() => setErrorMessage(""), 3000); // Clear after 3 seconds
//           }
//         } catch (uploadError) {
//           console.error("Error uploading media:", uploadError);
//           // Don't block the success flow
//         }
//       }

//       // Clear any previous errors and close popup
//       setErrorMessage("");
//       closePopup();
//       fetchPetData();
//     } else {
//       console.error("API response error:", response);
//       setErrorMessage(response.message || "Failed to save profile. Please try again.");
//       setApiProcessing({ loader: false, message: "" });
//     }
//   } catch (err) {
//     console.error("Submit error details:", err);
//     setErrorMessage(`Failed to save profile: ${err.message || "Please check your connection."}`);
//     setApiProcessing({ loader: false, message: "" });
//   } finally {
//     // Only reset loading if we're not closing the popup
//     if (!closePopup) {
//       setApiProcessing({ loader: false, message: "" });
//     }
//   }
// };


// const handleSubmit = async () => {
//   const newErrors = {};
//   if (!formData.petName.trim()) newErrors.petName = "Pet Name is required.";
//   if (imageFiles.length === 0) newErrors.images = "Please upload at least 1 image.";
//   if (!formData.dob.trim()) newErrors.dob = "Date of Birth is required.";
//   if (!formData.color.trim() || formData.color === "Select Color") newErrors.color = "Pet color is required.";
//   if (!formData.medication.trim()) newErrors.medication = "Medication is required.";
//   if (!String(formData.weight).trim()) newErrors.weight = "Pet weight is required.";
//   else if (!formData.petWeightIn) newErrors.weight = "Select pet weight type";
//   if (!formData.petType || formData.petType === "select") newErrors.petType = "Pet Type is required.";
//   if (!formData.petGender || formData.petGender === "select") newErrors.petGender = "Pet Gender is required.";
//   if (!formData.breed || formData.breed === "select") newErrors.breed = "Pet Breed is required.";
//   if (formData.instagramLink && !instagramRegex.test(formData.instagramLink))
//     newErrors.instagramLink = "Please check your Instagram URL & enter a valid Instagram URL";

//   if (Object.keys(newErrors).length > 0) { 
//     setErrors(newErrors); 
//     return; 
//   }

//   setErrors({});
//   setErrorMessage(""); // Clear any previous error messages
  
//   const payload = {
//     petAge: formData.petAge, 
//     petName: formData.petName, 
//     petType: formData.petType,
//     breed: formData.breed, 
//     additionalInfo: formData.additionalInfo,
//     weight: `${formData.weight} ${formData.petWeightIn}`,
//     vaccinated: formData.vaccinated, 
//     petGender: formData.petGender, 
//     kci: formData.kci,
//     color: formData.color, 
//     championship: formData.championship, 
//     Events: formData.Events,
//     skills: formData.skills, 
//     instagramLink: formData.instagramLink, 
//     birthday: formData.dob,
//     spayedOrNeutered: formData.spayedOrNeutered, 
//     medication: formData.medication,
//     doesYourPetHasAnyHealthIssues: formData.healthCondition, 
//     size: formData.size,
//   };

//   let success = false; // Add flag to track success

//   try {
//     setApiProcessing({ loader: true, message: "Saving profile..." });
//     let response;
    
//     if (!petData) {
//       // Create new pet profile
//       response = await webApi.post("vendorPetProfile/create", payload);
//       console.log("Create response:", response);
//     } else {
//       // Update existing pet profile
//       response = await webApi.put(`vendorPetProfile/update/${petData.id}`, payload);
//       console.log("Update response:", response);
//     }

//     if (response.status === "success") {
//       success = true; // Set success flag
      
//       // Get the pet ID from response
//       let petId;
//       if (response.data?.petProfile?.id) {
//         petId = response.data.petProfile.id;
//       } else if (response.data?.id) {
//         petId = response.data.id;
//       } else if (petData?.id) {
//         petId = petData.id;
//       } else {
//         console.error("Could not find pet ID in response:", response);
//         setErrorMessage("Failed to get pet ID after creation");
//         setApiProcessing({ loader: false, message: "" });
//         return;
//       }
      
//       console.log("Pet ID for uploads:", petId);
      
//       const uploadPromises = [];

//       // Queue Image Uploads - Only upload new images (not "existing" sentinel)
//       imageFiles.forEach((file) => {
//         if (file && file !== "existing") {
//           const fd = new FormData();
//           fd.append("morePhotos", file);
//           uploadPromises.push(webApi.imagePut(`vendorPetProfile/morePhotos/${petId}`, fd));
//           console.log("Uploading image:", file.name);
//         }
//       });

//       // Queue Video Uploads
//       videoFiles.forEach((file) => {
//         const fd = new FormData();
//         fd.append("moreVideos", file);
//         uploadPromises.push(webApi.imagePut(`vendorPetProfile/moreVideos/${petId}`, fd));
//         console.log("Uploading video:", file.name);
//       });

//       // Execute all uploads at once
//       if (uploadPromises.length > 0) {
//         setApiProcessing({ loader: true, message: `Uploading ${uploadPromises.length} media files...` });
        
//         try {
//           const uploadResults = await Promise.allSettled(uploadPromises);
//           console.log("All uploads completed:", uploadResults);
          
//           const failedUploads = uploadResults.filter(r => r.status === 'rejected');
//           if (failedUploads.length > 0) {
//             console.warn(`${failedUploads.length} file(s) failed to upload`);
//             // Only show warning but don't block closing
//             setErrorMessage(`Note: ${failedUploads.length} file(s) failed to upload.`);
//             setTimeout(() => setErrorMessage(""), 3000); // Clear after 3 seconds
//           }
//         } catch (uploadError) {
//           console.error("Error uploading media:", uploadError);
//           // Don't block the success flow
//         }
//       }

//       // Clear any previous errors and close popup
//       setErrorMessage("");
//       closePopup();
//       fetchPetData();
//     } else {
//       console.error("API response error:", response);
//       setErrorMessage(response.message || "Failed to save profile. Please try again.");
//       setApiProcessing({ loader: false, message: "" });
//     }
//   } catch (err) {
//     console.error("Submit error details:", err);
//     setErrorMessage(`Failed to save profile: ${err.message || "Please check your connection."}`);
//     setApiProcessing({ loader: false, message: "" });
//   } finally {
//     // Only reset loading if we're not closing the popup AND it wasn't successful
//     if (!closePopup && !success) {
//       setApiProcessing({ loader: false, message: "" });
//     }
//   }
//   // 4. Handle Media Uploads
// console.log("Checking for files to upload...", imageFiles);

// // Image Uploads
// for (let i = 0; i < imageFiles.length; i++) {
//   const file = imageFiles[i];
  
//   // TRIGGER LOGIC:
//   // If it's a new File object (from the cropper), trigger the API.
//   // If it's the string "existing", skip it (it's already on the server).
//   if (file && file !== "existing") {
//     console.log(`Triggering Image API for file ${i}:`, file.name);
    
//     const fd = new FormData();
//     // Check if your API expects 'morePhotos' or 'petImage'
//     fd.append("morePhotos", file); 
    
//     try {
//       const imgRes = await webApi.imagePut(`vendorPetProfile/morePhotos/${petData.id}`, fd);
//       console.log(`Image ${i} upload success:`, imgRes);
//     } catch (imgErr) {
//       console.error(`Image ${i} upload failed:`, imgErr);
//     }
//   } else {
//     console.log(`Skipping image ${i} because it is already on the server.`);
//   }
// }
// };



// const handleSubmit = async () => {
//   // 1. Validation
//   const newErrors = {};
//   if (!formData.petName.trim()) newErrors.petName = "Pet Name is required.";
//   if (imageFiles.length === 0) newErrors.images = "Please upload at least 1 image.";
//   if (!formData.dob.trim()) newErrors.dob = "Date of Birth is required.";
//   if (!formData.color.trim() || formData.color === "Select Color") newErrors.color = "Pet color is required.";
//   if (!formData.medication.trim()) newErrors.medication = "Medication is required.";
//   if (!String(formData.weight).trim()) newErrors.weight = "Pet weight is required.";
//   else if (!formData.petWeightIn) newErrors.weight = "Select pet weight type";
//   if (!formData.petType || formData.petType === "select") newErrors.petType = "Pet Type is required.";
//   if (!formData.petGender || formData.petGender === "select") newErrors.petGender = "Pet Gender is required.";
//   if (!formData.breed || formData.breed === "select") newErrors.breed = "Pet Breed is required.";

//   if (Object.keys(newErrors).length > 0) {
//     setErrors(newErrors);
//     return;
//   }

//   setErrors({});
//   setErrorMessage("");

//   const payload = {
//     petAge: formData.petAge,
//     petName: formData.petName,
//     petType: formData.petType,
//     breed: formData.breed,
//     additionalInfo: formData.additionalInfo,
//     weight: `${formData.weight} ${formData.petWeightIn}`,
//     vaccinated: formData.vaccinated,
//     petGender: formData.petGender,
//     kci: formData.kci,
//     color: formData.color,
//     championship: formData.championship,
//     Events: formData.Events,
//     skills: formData.skills,
//     instagramLink: formData.instagramLink,
//     birthday: formData.dob,
//     spayedOrNeutered: formData.spayedOrNeutered,
//     medication: formData.medication,
//     doesYourPetHasAnyHealthIssues: formData.healthCondition,
//     size: formData.size,
//     microchipNo : formData.microchipNo, 
//     howmanyTimesBreedingDone : formData.howmanyTimesBreedingDone,
//   };

//   try {
//     setApiProcessing({ loader: true, message: "Saving profile..." });
//     let response;

//     if (!petData) {
//       response = await webApi.post("vendorPetProfile/create", payload);
//     } else {
//       response = await webApi.put(`vendorPetProfile/update/${petData.id}`, payload);
//     }

//     // Check for success string or status 200
//     if (response.status === "success" || response.status === 200) {
//       // Get the correct ID for media uploads
//       const petId = response.data?.petProfile?.id || response.data?.id || petData?.id;

//       if (!petId) {
//         setErrorMessage("Profile saved but Pet ID was not found for media upload.");
//         setApiProcessing({ loader: false, message: "" });
//         return;
//       }

//       // 2. Upload Images
//       setApiProcessing({ loader: true, message: "Uploading images..." });
//       for (const file of imageFiles) {
//         if (file && file !== "existing") {
//           const fd = new FormData();
//           fd.append("morePhotos", file);
//           try {
//             await webApi.imagePut(`vendorPetProfile/morePhotos/${petId}`, fd);
//             console.log("Image uploaded successfully to ID:", petId);
//           } catch (err) {
//             console.error("Image upload failed:", err);
//           }
//         }
//       }

//       // 3. Upload Videos
//       setApiProcessing({ loader: true, message: "Uploading videos..." });
//       for (const file of videoFiles) {
//         if (file && file !== "existing") {
//           const fd = new FormData();
//           fd.append("moreVideos", file);
//           try {
//             await webApi.imagePut(`vendorPetProfile/moreVideos/${petId}`, fd);
//             console.log("Video uploaded successfully to ID:", petId);
//           } catch (err) {
//             console.error("Video upload failed:", err);
//           }
//         }
//       }

//       // 4. Finalize
//       setErrorMessage("");
//       closePopup();
//       fetchPetData();
//     } else {
//       setErrorMessage(response.message || "Failed to save profile.");
//     }
//   } catch (err) {
//     console.error("Submit Error:", err);
//     setErrorMessage(err.response?.data?.message || "An error occurred while saving.");
//   } finally {
//     setApiProcessing({ loader: false, message: "" });
//   }
// };






const handleSubmit = async () => {
  // 1. Validation
  const newErrors = {};
  if (!formData.petName.trim()) newErrors.petName = "Pet Name is required.";
  if (imageFiles.length === 0) newErrors.images = "Please upload at least 1 image.";
  if (!formData.dob.trim()) newErrors.dob = "Date of Birth is required.";
  if (!formData.color.trim() || formData.color === "Select Color") newErrors.color = "Pet color is required.";
  if (!formData.medication.trim()) newErrors.medication = "Medication is required.";
  if (!String(formData.weight).trim()) newErrors.weight = "Pet weight is required.";
  else if (!formData.petWeightIn) newErrors.weight = "Select pet weight type";
  if (!formData.petType || formData.petType === "select") newErrors.petType = "Pet Type is required.";
  if (!formData.petGender || formData.petGender === "select") newErrors.petGender = "Pet Gender is required.";
  if (!formData.breed || formData.breed === "select") newErrors.breed = "Pet Breed is required.";

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  setErrors({});
  setErrorMessage("");

  const payload = {
    petAge: formData.petAge,
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
    birthday: formData.dob,
    spayedOrNeutered: formData.spayedOrNeutered,
    medication: formData.medication,
    doesYourPetHasAnyHealthIssues: formData.healthCondition,
    size: formData.size,
  };

  try {
    setApiProcessing({ loader: true, message: "Saving profile..." });
    let response;

    if (!petData) {
      response = await webApi.post("vendorPetProfile/create", payload);
      console.log("Create response:", response);
    } else {
      response = await webApi.put(`vendorPetProfile/update/${petData.id}`, payload);
      console.log("Update response:", response);
    }

    // Check for success
    if (response.status === "success" || response.status === 200) {
      const petId = response.data?.petProfile?.id || response.data?.id || petData?.id;

      if (petId) {
        // Upload Images
        for (const file of imageFiles) {
          if (file && file !== "existing") {
            const fd = new FormData();
            fd.append("morePhotos", file);
            try {
              await webApi.imagePut(`vendorPetProfile/morePhotos/${petId}`, fd);
              console.log("Image uploaded successfully");
            } catch (err) {
              console.error("Image upload failed:", err);
            }
          }
        }

        // Upload Videos
        for (const file of videoFiles) {
          if (file && file !== "existing") {
            const fd = new FormData();
            fd.append("moreVideos", file);
            try {
              await webApi.imagePut(`vendorPetProfile/moreVideos/${petId}`, fd);
              console.log("Video uploaded successfully");
            } catch (err) {
              console.error("Video upload failed:", err);
            }
          }
        }
      }

      setErrorMessage("");
     if (fetchPetData) {
  console.log("Calling fetchPetData from AddNewPetPopup");
  // Add a small delay to ensure backend has processed the update
  setTimeout(async () => {
    fetchPetData();
    console.log("fetchPetData completed");
    closePopup();
  }, 500);
} else {
  closePopup();
}
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















// const handleSubmit = async () => {
//   const newErrors = {};
//   if (!formData.petName.trim()) newErrors.petName = "Pet Name is required.";
//   if (imageFiles.length === 0) newErrors.images = "Please upload at least 1 image.";
//   if (!formData.dob.trim()) newErrors.dob = "Date of Birth is required.";
//   if (!formData.color.trim() || formData.color === "Select Color") newErrors.color = "Pet color is required.";
//   if (!formData.medication.trim()) newErrors.medication = "Medication is required.";
//   if (!String(formData.weight).trim()) newErrors.weight = "Pet weight is required.";
//   else if (!formData.petWeightIn) newErrors.weight = "Select pet weight type";
//   if (!formData.petType || formData.petType === "select") newErrors.petType = "Pet Type is required.";
//   if (!formData.petGender || formData.petGender === "select") newErrors.petGender = "Pet Gender is required.";
//   if (!formData.breed || formData.breed === "select") newErrors.breed = "Pet Breed is required.";
//   if (formData.instagramLink && !instagramRegex.test(formData.instagramLink))
//     newErrors.instagramLink = "Please check your Instagram URL & enter a valid Instagram URL";

//   if (Object.keys(newErrors).length > 0) { 
//     setErrors(newErrors); 
//     return; 
//   }

//   setErrors({});
//   setErrorMessage(""); // Clear any previous error messages
  
//   const payload = {
//     petAge: formData.petAge, 
//     petName: formData.petName, 
//     petType: formData.petType,
//     breed: formData.breed, 
//     additionalInfo: formData.additionalInfo,
//     weight: `${formData.weight} ${formData.petWeightIn}`,
//     vaccinated: formData.vaccinated, 
//     petGender: formData.petGender, 
//     kci: formData.kci,
//     color: formData.color, 
//     championship: formData.championship, 
//     Events: formData.Events,
//     skills: formData.skills, 
//     instagramLink: formData.instagramLink, 
//     birthday: formData.dob,
//     spayedOrNeutered: formData.spayedOrNeutered, 
//     medication: formData.medication,
//     doesYourPetHasAnyHealthIssues: formData.healthCondition, 
//     size: formData.size,
//   };

//   try {
//     setApiProcessing({ loader: true, message: "Saving profile..." });
//     let response;
    
//     if (!petData) {
//       // Create new pet profile
//       response = await webApi.post("vendorPetProfile/create", payload);
//       console.log("Create response:", response);
//     } else {
//       // Update existing pet profile
//       response = await webApi.put(`vendorPetProfile/update/${petData.id}`, payload);
//       console.log("Update response:", response);
//     }

//     // Check for success - status could be 200, 201, or "success"
//     const isSuccess = response.status === 200 || 
//                       response.status === 201 || 
//                       response.status === "success";
    
//     if (isSuccess) {
//       // Get the pet ID from response
//       let petId;
//       if (response.data?.petProfile?.id) {
//         petId = response.data.petProfile.id;
//       } else if (response.data?.data?.id) {
//         petId = response.data.data.id;
//       } else if (response.data?.id) {
//         petId = response.data.id;
//       } else if (petData?.id) {
//         petId = petData.id;
//       } else {
//         console.error("Could not find pet ID in response:", response);
//         setErrorMessage("Failed to get pet ID after creation");
//         setApiProcessing({ loader: false, message: "" });
//         return;
//       }
      
//       console.log("Pet ID for uploads:", petId);
      
//       const uploadPromises = [];

//       // Queue Image Uploads - Only upload new images (not "existing" sentinel)
//       imageFiles.forEach((file) => {
//         if (file && file !== "existing") {
//           const fd = new FormData();
//           fd.append("morePhotos", file);
//           uploadPromises.push(webApi.put(`vendorPetProfile/morePhotos/${petId}`));
//           console.log("Uploading image:", file.name);
//         }
//       });

//       // Queue Video Uploads
//       videoFiles.forEach((file) => {
//         const fd = new FormData();
//         fd.append("petVideo", file);
//         uploadPromises.push(webApi.put(`vendorPetProfile/moreVideos/${petId}`));
//         console.log("Uploading video:", file.name);
//       });

//       // Execute all uploads at once
//       if (uploadPromises.length > 0) {
//         setApiProcessing({ loader: true, message: `Uploading ${uploadPromises.length} media files...` });
        
//         try {
//           const uploadResults = await Promise.allSettled(uploadPromises);
//           console.log("All uploads completed:", uploadResults);
          
//           const failedUploads = uploadResults.filter(r => r.status === 'rejected');
//           if (failedUploads.length > 0) {
//             console.warn(`${failedUploads.length} file(s) failed to upload`);
//             // Only show warning but don't block closing
//             setErrorMessage(`Note: ${failedUploads.length} file(s) failed to upload.`);
//             setTimeout(() => setErrorMessage(""), 3000); // Clear after 3 seconds
//           }
//         } catch (uploadError) {
//           console.error("Error uploading media:", uploadError);
//           // Don't block the success flow
//         }
//       }

//       // Clear any previous errors and close popup
//       setErrorMessage("");
//       closePopup();
//       fetchPetData();
//     } else {
//       console.error("API response error:", response);
//       setErrorMessage(response.data?.message || response.message || "Failed to save profile. Please try again.");
//       setApiProcessing({ loader: false, message: "" });
//     }
//   } catch (err) {
//     console.error("Submit error details:", err);
//     setErrorMessage(`Failed to save profile: ${err.message || "Please check your connection."}`);
//     setApiProcessing({ loader: false, message: "" });
//   } finally {
//     // Only reset loading if we're not closing the popup
//     if (!closePopup) {
//       setApiProcessing({ loader: false, message: "" });
//     }
//   }
// };
// Update sizeOptions with useMemo
const sizeOptions = useMemo(() => {
  // For edit mode: if we have a size value from petData, show it
  if (petData && formData.size && formData.size !== "select size" && formData.size !== "") {
    return [formData.size];
  }
  
  // For new pet with selected breed that has size
  if (!petData && formData.breed !== "select" && formData.size && formData.size !== "select size" && formData.size !== "") {
    return [formData.size];
  }
  
  // Default size options for new pet
  return ["select size", "Toy", "Small", "Medium", "Large", "Giant"];
}, [petData, formData.breed, formData.size]);

  return (
    <div
      className={styles.popupContainer}
      style={{ background: "#fff", borderRadius: "10px", width: "100%", position: "relative" }}
    >
      {/* Header */}
      <div
        className={styles.header}
        style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}
      >
        <div style={{ display: "flex", alignItems: "center", padding: "0 10px 0 0" }}>
          <BackHeader />
          <h2>{petData ? "Edit Pet" : "Add New Pet"}</h2>
        </div>
        <button
          style={{ background: "transparent", border: "none", fontSize: "1.2rem", padding: "20px", cursor: "pointer" }}
          onClick={closePopup}
        >
          &#x2715;
        </button>
      </div>

      <div className={styles.mainContainer}>

        {/* ── Section 1: Basic Info ──────────────────────────────────────── */}
        <div className={styles.formDiv2}>
          <DropDownv1
            options={["select", "Dog", "Cat", "Bird", "Fish", "Small Pet"]}
            question={"Pet Type *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
            value={formData.petType}
            onChange={(value) => {
              handleInputChange("petType", value);
              if (value && value !== "select") fetchBreeds(value);
              else setBreedOptions([]);
            }}
            CustomInputElementAddpet={{ color: "#000000" }} error={errors.petType}
          />
          <CustomInputElement2
            question={"Pet Name *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
            placeholder="Enter Pet Name" type="text" value={formData.petName}
            onChange={(e) => handleInputChange("petName", e.target.value)}
            custommarrgin={{ marginBottom: "14px" }} error={errors.petName} ownMargin={true}
          />
          <DropDownv1
            options={petData ? [formData.breed] : ["select", ...breedOptions]}
            question={"Pet Breed *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
            value={formData.breed} onChange={(value) => handleInputChange("breed", value)}
            CustomInputElementAddpet={{ color: "#000000" }} error={errors.breed}
          />
          <CustomInputElement2
            question={"Date Of Birth *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
            placeholder="Date Of Birth" type="date" value={formData.dob}
            onChange={(e) => handleInputChange("dob", e.target.value)}
            custommarrgin={{ marginBottom: "14px" }} error={errors.dob} ownMargin={true}
          />
          <DropDownv1
            options={["select", "Male", "Female"]} question={"Gender *"}
            width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.petGender}
            onChange={(value) => handleInputChange("petGender", value)}
            CustomInputElementAddpet={{ color: "#000000" }} error={errors.petGender}
          />
          <DropDownv1
  options={sizeOptions} 
  question={"Size *"} 
  width={isMobile ? "100%" : "48%"}
  backgroundColor="#FFFFFF" 
  value={formData.size || ""}
  onChange={(value) => {
    // Only allow size change for new pets
    if (!petData) {
      handleInputChange("size", value === "select size" ? "" : value);
    }
  }}
  CustomInputElementAddpet={{ color: "#000000" }} 
  error={errors.size}
/>
          <DropDownv1
            options={petColors} question={"Color *"} width={isMobile ? "100%" : "48%"}
            backgroundColor="#FFFFFF" value={formData.color}
            onChange={(value) => handleInputChange("color", value)}
            error={errors.color}
          />
          <CustomInputComp
            question={"Weight *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
            type="text" placeholder="Enter Pet Weight" value={formData.weight}
            onChange={(e) => {
              const numericValue = e.target.value.replace(/[^0-9]/g, "").slice(0, 3);
              handleInputChange("weight", numericValue);
            }}
            custommarrgin={{ marginBottom: "14px" }} error={errors.weight} ownMargin={true}
            filter={formData.weight ? "weight" : ""} setFormData={setFormData} formData={formData}
          />
          <DropDownv1
            options={["select", "Yes", "No"]} question={"Spayed/Neutered *"}
            width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.spayedOrNeutered}
            onChange={(value) => handleInputChange("spayedOrNeutered", value)}
            CustomInputElementAddpet={{ color: "#000000" }} error={errors.spayedOrNeutered}
          />
          <CustomInputElement2
            question={"Medication *"} width={isMobile ? "100%" : "48%"} type="text"
            backgroundColor="#FFFFFF" value={formData.medication} placeholder="Enter Medication"
            onChange={(e) => handleInputChange("medication", e.target.value)}
            custommarrgin={{ marginBottom: "14px" }} error={errors.medication} ownMargin={true}
          />
        </div>

        {/* ── Section 2: Extra Info ──────────────────────────────────────── */}
        <div className={styles.formDiv2}>
          <CustomInputElement2
            question={"Health Condition *"} width={isMobile ? "100%" : "48%"} type="text"
            backgroundColor="#FFFFFF" value={formData.healthCondition}
            placeholder="Enter Health Conditions"
            onChange={(e) => handleInputChange("healthCondition", e.target.value)}
            custommarrgin={{ marginBottom: "14px" }} error={errors.healthCondition} ownMargin={true}
          />
          <CustomInputElement2
            question={"Microchip Number"} width={isMobile ? "100%" : "48%"} type="text"
            backgroundColor="#FFFFFF" value={formData.microchipNo}
            placeholder="Enter Microchip Number"
            onChange={(e) => handleInputChange("microchipNo", e.target.value)}
            custommarrgin={{ marginBottom: "14px" }} ownMargin={true}
          />
          <DropDownv1
            options={["select", "Yes", "No"]} question={"Vaccinated"}
            width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.vaccinated}
            onChange={(value) => handleInputChange("vaccinated", value)}
            CustomInputElementAddpet={{ color: "#000000" }}
          />
           {formData.vaccinated === "Yes" && (
            <div style={{ width: isMobile ? "100%" : "48%" }}>
              <p>Vaccinations Given</p>
              <div className={styles.vaccinationCheckboxGroup}>
                {vaccinationOptions.map((vaccine) => (
                  <label key={vaccine} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.howManyVaccinationsDone.includes(vaccine)}
                      onChange={() => handleVaccinationCheckboxChange(vaccine)}
                      className={styles.checkbox}
                    />
                    <span>{vaccine}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <DropDownv1
            options={["select", "Yes", "No"]} question={"KCI"} width={isMobile ? "100%" : "48%"}
            backgroundColor="#FFFFFF" value={formData.kci}
            onChange={(value) => handleInputChange("kci", value)}
            CustomInputElementAddpet={{ color: "#000000" }}
          />
          <CustomInputElement2
            question={"How many times breeding done earlier?"} width={isMobile ? "100%" : "48%"}
            type="number" backgroundColor="#FFFFFF" value={formData.howmanyTimesBreedingDone}
            placeholder="Enter Breeding Count"
            onChange={(e) => handleInputChange("howmanyTimesBreedingDone", e.target.value)}
            custommarrgin={{ marginBottom: "14px" }} ownMargin={true}
          />
          <DropDownv1
            question={"Skills"} options={["select", "Good", "Bad"]} width={isMobile ? "100%" : "48%"}
            backgroundColor="#FFFFFF" value={formData.skills}
            onChange={(value) => handleInputChange("skills", value)}
            CustomInputElementAddpet={{ color: "#000000" }}
          />
          <DropDownv1
            question={"Championship"} options={["select", "Yes", "No"]}
            width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.championship}
            onChange={(value) => handleInputChange("championship", value)}
            CustomInputElementAddpet={{ color: "#000000" }}
          />
          <DropDownv1
            question={"Events"} options={["select", "Yes", "No"]} width={isMobile ? "100%" : "48%"}
            backgroundColor="#FFFFFF" value={formData.Events}
            onChange={(value) => handleInputChange("Events", value)}
            CustomInputElementAddpet={{ color: "#000000" }}
          />
          <CustomInputElement2
            question={"Instagram Link"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
            placeholder="URL" value={formData.instagramLink}
            onChange={(e) => handleInputChange("instagramLink", e.target.value)}
            error={errors.instagramLink} custommarrgin={{ marginBottom: "14px" }} ownMargin={true}
          />
          <CustomInputElement2
            question="Additional Information" width={isMobile ? "100%" : "48%"}
            backgroundColor="#FFFFFF" placeholder="Add more information"
            onInputChange={handleVictoriaInfoChange}
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
                  {/* Use isMobile to limit slots to 1, otherwise show MAX_IMAGES */}
                  {Array.from({ length: isMobile ? 1 : MAX_IMAGES }).map((_, index) => {
                    const hasImage = !!imagePreviews[index];
                    const isMandatory = index === 0;
                    return (
                      <div key={index} className={styles["slot-column"]}>
                        {!hasImage ? (
                          <label
                            className={`${styles["image-slot-empty"]} ${isMandatory ? styles["mandatory-border"] : ""}`}
                            onClick={() => imageFileInputRef.current?.click()}
                            style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", width: "100%", height: "100%", minHeight: "120px", border:  "2px dashed #ccc", borderRadius: "8px", backgroundColor: "#f9f9f9" }}
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

            {/* Cropper Modal */}
            {cropperOpen && imageToCrop && (
              <ImageCropperModal
                open={cropperOpen}
                image={imageToCrop}
                onClose={handleCropCancel}
                onCropComplete={handleCropComplete}
              />
            )}

         <div className={styles.uploadSection} style={{ marginTop: isMobile ? "10px" : "0" }}>
             <p className={styles.uploadLabel}>Pet Videos <span style={{ color: "#666" }}>(Optional)</span></p>
             <div className={styles["image-grid"]}>
               {/* Use isMobile to limit slots to 1, otherwise show MAX_VIDEOS */}
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
           </div>
         </div>


          {/* ── Action Buttons ──────────────────────────────────────────── */}
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
            <p style={{ color: "red", fontSize: "14px", marginTop: "10px" }}>{errorMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddNewPetPopup;

