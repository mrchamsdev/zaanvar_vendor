
import useStore from "@/components/state/useStore";
import { WebApimanager } from "@/components/utilities/WebApiManager";
import React, { useEffect, useRef, useState, useMemo } from "react";
import styles from "../../styles/register/settingsregister.module.css";
import { AddIcon } from "@/public/images/SVG";
import ImageCropperModal from "@/components/register/imageCropperModule";
import CustomInputElement2 from "@/components/register/customInputcom";
import DropDownv1 from "@/components/register/dropdown";
import CustomInputComp from "@/components/register/customInput";
import BackHeader from "@/components/pet-sales/backHeader";
import AddressDropdown from "./addAddressDropDown";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { IMAGE_URL } from "@/components/utilities/Constants";
import SearchableDropdown from "../register/FilterDropDown";

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return "";
  const dobDate = new Date(dateOfBirth);
  const today = new Date();
  let years = today.getFullYear() - dobDate.getFullYear();
  let months = today.getMonth() - dobDate.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years < 0) return "0 years 0 months";
  return `${years} years ${months} month${months !== 1 ? "s" : ""}`;
};

const AddNewPuppyPopup = ({
  closePopup,
  petData,
  fetchPetData = () => {},
}) => {
  const { getJwtToken, getUserInfo } = useStore();
  const jwt = getJwtToken();
  const webApi = new WebApimanager(jwt);
  const userInfo = useStore((state) => state.userInfo);

  const imageFileInputRef = useRef(null);
  const videoFileInputRef = useRef(null);
  const isProcessingCrop = useRef(false);
  const blobUrlsRef = useRef([]);

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);

  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [filesToCrop, setFilesToCrop] = useState([]);
  const [isCropping, setIsCropping] = useState(false);
  const vaccMenuRef = useRef(null);
  const [breedOptions, setBreedOptions] = useState([]);
  const [breed, setBreed] = useState([]);
  const [showVaccDropdown, setShowVaccDropdown] = useState(false);
  const [myPetsList, setMyPetsList] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [locationDetails, setLocationDetails] = useState("");
  const [apiProcessing, setApiProcessing] = useState({ loader: false, message: "Loading..." });
  const [isMobile, setIsMobile] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [vaccinationsList, setVaccinationsList] = useState([]);

  const selectedLocation = useStore((s) => s.selectedLocation);
  const selectedCountryName = useStore((s) => s.selectedCountryName);

  const petColors = [
    "Select Color", "Black", "White", "Brown", "Red", "Gold", "Cream", "Yellow",
    "Gray", "Blue", "Fawn", "Tan", "Buff", "Brindle", "Merle", "Harlequin",
    "Sable", "Bicolor", "Tricolor", "Tuxedo", "Roan", "Spotted", "Ticked",
    "Particolor", "Blenheim", "Domino",
  ];

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

  const [formData, setFormData] = useState({
    petName: "", petAge: "", petType: "", color: "", breed: "", additionalInfo: "",
    weight: "", vaccinated: null, kci: null, championship: "", Events: "", skills: "",
    instagramLink: "", petGender: "", vaccineCertificate: "", kciCertificate: "",
    dateOfBirth: "", spayedOrNeutered: "", medication: "", size: "", healthCondition: "",
    petWeightIn: "", microchipNo: "", howmanyTimesBreedingDone: "",
    addressId: "",
    address: {
      street: "",
      area: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
      landmark: ""
    },
    price: "",
    negotiable: "",
    mother: "",
    father: "",
    status: "",
    isTransportService: "",
    haveParents: "select",
    fatherId: "",
    motherId: "",
    petVariety: "",
    numberVisibility: false,
    howManyVaccinationsDone: [],
  });

  // Fetch user's pets for father/mother selection
  useEffect(() => {
    const fetchMyPets = async () => {
      try {
        const response = await webApi.get(`vendorPetProfile/myPets`);
        if (response.status === 200 || response.status === "success") {
          setMyPetsList(response.data?.data || response.data || []);
        }
      } catch (error) {
        console.error("Error fetching my pets:", error);
      }
    };
    fetchMyPets();
  }, []);

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
    const handleClickOutside = (event) => {
      if (vaccMenuRef.current && !vaccMenuRef.current.contains(event.target)) {
        setShowVaccDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    } catch (_) {}
  }, [selectedLocation]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => setIsMobile(window.innerWidth <= 768);
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Populate form when editing - EXACT MAPPING from API
  useEffect(() => {
    if (petData) {
      // Find matching address from user's addresses
      let selectedAddress = null;
      
      if (petData.address) {
        selectedAddress = userInfo?.addresses?.find((addr) => {
          const addrCity = addr.townOrCity?.toLowerCase().trim();
          const petCity = petData.address.city?.toLowerCase().trim();
          const addrPincode = addr.pinCode?.toString();
          const petPincode = petData.address.pincode?.toString();
          
          return addrCity === petCity && addrPincode === petPincode;
        });
      }
      
      if (!selectedAddress && userInfo?.addresses?.length > 0) {
        selectedAddress = userInfo.addresses[0];
      }
      
      // Parse weight to get value and unit
      let weightValue = "";
      let weightUnit = "";
      if (petData.weight) {
        const weightParts = petData.weight.split(" ");
        weightValue = weightParts[0] || "";
        weightUnit = weightParts[1] || "";
      }
      
      // Determine haveParents value
      let haveParentsValue = "select";
      if (petData.father || petData.mother) {
        if (petData.father && petData.mother) {
          haveParentsValue = "Both Father and Mother";
        } else if (petData.father) {
          haveParentsValue = "Only Father";
        } else if (petData.mother) {
          haveParentsValue = "Only Mother";
        }
      } else if (petData.doesThisPetHaveParents === "Both") {
        haveParentsValue = "Both Father and Mother";
      } else if (petData.doesThisPetHaveParents === "Father") {
        haveParentsValue = "Only Father";
      } else if (petData.doesThisPetHaveParents === "Mother") {
        haveParentsValue = "Only Mother";
      } else {
        haveParentsValue = "Don't Know";
      }
      
      setFormData({
        petName: petData.petName || "",
        petAge: petData.petAge || "",
        petType: typeof petData.petType === 'object' ? petData.petType?.petType : (petData.petType || ""),
        color: petData.color || "",
        breed: petData.breed || "",
        additionalInfo: petData.description || petData.additionalInfo || "",
        weight: weightValue,
        petWeightIn: weightUnit,
        vaccinated: petData.vaccinated || null,
        kci: petData.kciRegistration || petData.kci || "",
        championship: petData.championship || "",
        Events: petData.Events || "",
        skills: petData.skills || "",
        instagramLink: petData.instagramLink || "",
        petGender: petData.petGender || "",
        spayedOrNeutered: petData.spayedOrNeutered || "",
        dateOfBirth: petData.dateOfBirth ? petData.dateOfBirth.split("T")[0] : "",
        medication: petData.medication || "",
        howManyVaccinationsDone: petData.howManyVaccinationsDone || [],
        size: petData.size || "",
        healthCondition: petData.healthCondition || petData.doesYourPetHasAnyHealthIssues || "",
        microchipNo: petData.microchipNo || "",
        howmanyTimesBreedingDone: petData.howmanyTimesBreedingDone || "",
        addressId: selectedAddress?.id?.toString() || selectedAddress?._id?.toString() || "",
        address: {
          street: petData.address?.street || selectedAddress?.flatOrHouseNoOrBuildingOrCompanyOrApartment || "",
          area: petData.address?.area || selectedAddress?.areaOrStreetOrSectorOrVillage || "",
          city: petData.address?.city || selectedAddress?.townOrCity || "",
          state: petData.address?.state || selectedAddress?.state || "",
          pincode: petData.address?.pincode || selectedAddress?.pinCode || "",
          landmark: petData.address?.landmark || selectedAddress?.landmark || "",
          country: petData.address?.country || selectedCountryName || selectedAddress?.country || ""
        },
        isTransportService: petData.transportService || "",
        price: petData.price || "",
        haveParents: haveParentsValue,
        negotiable: petData.negotiable || "",
        fatherId: petData.father || "",
        motherId: petData.mother || "",
        petVariety: petData.petVariety || petData.petsVariety || "",
        numberVisibility: petData.numberVisibility === "on",
        howManyVaccinationsDone: petData.howManyVaccinationsDone || [],
        status: petData.petStatus || "select"
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
      setFormData({
        petName: "", petAge: "", petType: "", color: "", breed: "", additionalInfo: "",
        weight: "", vaccinated: null, kci: "", championship: "", Events: "", skills: "",
        instagramLink: "", petGender: "", vaccineCertificate: "", kciCertificate: "",
        dateOfBirth: "", spayedOrNeutered: "", medication: "", size: "", healthCondition: "",
        petWeightIn: "", microchipNo: "", howmanyTimesBreedingDone: "",
        addressId: "",
        address: {
          street: "",
          area: "",
          city: "",
          state: "",
          pincode: "",
          landmark: "",
          country: ""
        },
        isTransportService: "", price: "", haveParents: "select",
        negotiable: "", fatherId: "", motherId: "", petVariety: "", numberVisibility: false,
        howManyVaccinationsDone: [], status: "select",
      });
      setImageFiles([]);
      setImagePreviews([]);
      setVideoFiles([]);
      setVideoPreviews([]);
      setErrorMessage("");
    }
  }, [petData, userInfo, selectedCountryName]);

  // Clear address error as soon as an address is selected/added
  useEffect(() => {
    if (formData.addressId) {
      setErrors((prev) => {
        const { address, ...rest } = prev;
        return rest;
      });
    }
  }, [formData.addressId]);

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
    if (formData.dateOfBirth) {
      const age = calculateAge(formData.dateOfBirth);
      setFormData((prev) => {
        if (prev.petAge === age) return prev;
        return { ...prev, petAge: age };
      });
    }
  }, [formData.dateOfBirth]);

  const instagramRegex = /^(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/[A-Za-z0-9._%-]+\/?$/;

  const handleVictoriaInfoChange = (inputValue) => {
    setFormData((prev) => ({ ...prev, additionalInfo: inputValue }));
  };

  const handleInputChange = (field, value) => {
    if (field === "weight") {
      value = value.replace(/[^0-9]/g, "");
    }

    if (field === "dateOfBirth") {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedYear = selectedDate.getFullYear();
      const currentYear = today.getFullYear();
      const isValidDate = !isNaN(selectedDate.getTime());

      if (value && isValidDate) {
        if (selectedDate > today) {
          setErrors((prev) => ({ 
            ...prev, 
            dateOfBirth: "Date of Birth cannot be in the future." 
          }));
        } else if (selectedYear < 1900 || selectedYear > currentYear) {
          setErrors((prev) => ({ 
            ...prev, 
            dateOfBirth: `Please enter a valid year between 1900 and ${currentYear}.` 
          }));
        } else {
          setErrors((prev) => ({ ...prev, dateOfBirth: "" }));
        }
      } else if (value && value.length >= 4) {
        setErrors((prev) => ({ ...prev, dateOfBirth: "Invalid date format." }));
      } else {
        setErrors((prev) => ({ ...prev, dateOfBirth: "" }));
      }
    }

    if (field === "instagramLink") {
      setErrors((prev) => ({
        ...prev,
        instagramLink: value && !instagramRegex.test(value)
          ? "Please check your Instagram URL (ex: https://instagram.com/user)"
          : "",
      }));
    }

    if (field === "haveParents") {
      if (value === "Only Father") {
        setFormData((prev) => ({ ...prev, haveParents: value, motherId: "" }));
        return;
      } else if (value === "Only Mother") {
        setFormData((prev) => ({ ...prev, haveParents: value, fatherId: "" }));
        return;
      } else if (value === "Don't Know") {
        setFormData((prev) => ({ ...prev, haveParents: value, fatherId: "", motherId: "" }));
        return;
      } else if (value === "Both Father and Mother") {
        setFormData((prev) => ({ ...prev, haveParents: value }));
        return;
      }
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
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

  const handleImageFileChange = (e) => {
    const files = Array.from(e.target.files);
    e.target.value = "";

    if (errors.images) setErrors((prev) => ({ ...prev, images: "" }));

    const remainingSlots = 4 - imageFiles.length;
    if (remainingSlots <= 0) {
      setErrors((prev) => ({ ...prev, images: `Maximum 4 images allowed.` }));
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

      setImageFiles((prev) => [...prev, croppedFile].slice(0, 4));
      setImagePreviews((prev) => [...prev, previewUrl].slice(0, 4));

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
          ? `vendorPetSales/deleteMedia/${petData.id}?type=photo&index=${index}` 
          : `vendorPetSales/deleteMedia/${petData.id}?type=video&index=${index}`;
        const response = await webApi.delete(endpoint);

        if (response.status === "success" || response.status === 200) {
          await fetchPetData();
        } else {
          setErrorMessage(response.message || "Server failed to delete item.");
          return;
        }
      } catch (error) {
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

    const remainingSlots = 3 - videoFiles.length;
    if (remainingSlots <= 0) {
      setErrors((prev) => ({ ...prev, videos: `Maximum 3 videos allowed.` }));
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

    setVideoFiles((prev) => [...prev, ...toAdd].slice(0, 3));
    setVideoPreviews((prev) => [...prev, ...previews].slice(0, 3));
  };

  const validate = () => {
    const newErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!formData.dateOfBirth?.trim()) {
      newErrors.dateOfBirth = "Date of Birth is required.";
    } else {
      const dob = new Date(formData.dateOfBirth);
      const year = dob.getFullYear();
      
      if (dob > today) {
        newErrors.dateOfBirth = "Date of Birth cannot be in the future.";
      } else if (year < 1900) {
        newErrors.dateOfBirth = "Year must be 1900 or later.";
      }
    }
    if (!formData.petName?.trim()) newErrors.petName = "Pet Name is required.";
    if (imageFiles.length === 0) newErrors.images = "Please upload at least 1 image.";
    if (!formData.color?.trim() || formData.color === "Select Color") newErrors.color = "Pet color is required.";
    if (!String(formData.weight).trim()) newErrors.weight = "Pet weight is required.";
    else if (!formData.petWeightIn) newErrors.petWeightIn = "Select pet weight type";
    if (!formData.petType || formData.petType === "select") newErrors.petType = "Pet Type is required.";
    if (!formData.petGender || formData.petGender === "select") newErrors.petGender = "Pet Gender is required.";
    if (!formData.breed || formData.breed === "select") newErrors.breed = "Pet Breed is required.";
    if (!formData.addressId && !petData?.address) newErrors.address = "Address is required.";
    if (!formData.price?.trim()) newErrors.price = "Price is required.";
    if (!formData.status || formData.status === "select") newErrors.status = "Status is required.";
    
    return newErrors;
  };

  // Filter father options based on selected breed
  const filteredFathers = myPetsList.filter(pet => 
    pet.petGender === "Male" && 
    pet.id !== petData?.id &&
    (formData.breed === "select" || formData.breed === "" || pet.breed === formData.breed)
  );

  // Filter mother options based on selected breed
  const filteredMothers = myPetsList.filter(pet => 
    pet.petGender === "Female" && 
    pet.id !== petData?.id &&
    (formData.breed === "select" || formData.breed === "" || pet.breed === formData.breed)
  );

  // Function to render father/mother fields based on selection
  const renderParentFields = () => {
    const { haveParents } = formData;
    
    if (haveParents === "Only Father") {
      return (
        <div style={{ width: isMobile ? "100%" : "48%" }}>
          <p>Father</p>
          <div className={styles["form-input-container"]}>
            <select
              value={formData.fatherId}
              onChange={(e) => handleInputChange("fatherId", e.target.value)}
              className={styles.selectField}
              style={{ width: "100%", padding: "12px", border: "1px solid #d9d9d9", borderRadius: "8px" }}
              disabled={!formData.breed || formData.breed === "select"}
            >
              <option value="">Select Father</option>
              {filteredFathers.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.petName} ({pet.breed})
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    } else if (haveParents === "Only Mother") {
      return (
        <div style={{ width: isMobile ? "100%" : "48%" }}>
          <p>Mother</p>
          <div className={styles["form-input-container"]}>
            <select
              value={formData.motherId}
              onChange={(e) => handleInputChange("motherId", e.target.value)}
              className={styles.selectField}
              style={{ width: "100%", padding: "12px", border: "1px solid #d9d9d9", borderRadius: "8px" }}
              disabled={!formData.breed || formData.breed === "select"}
            >
              <option value="">Select Mother</option>
              {filteredMothers.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.petName} ({pet.breed})
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    } else if (haveParents === "Both Father and Mother") {
      return (
        <>
          <div style={{ width: isMobile ? "100%" : "48%" }}>
            <p>Father</p>
            <div className={styles["form-input-container"]}>
              <select
                value={formData.fatherId}
                onChange={(e) => handleInputChange("fatherId", e.target.value)}
                className={styles.selectField}
                style={{ width: "100%", padding: "12px", border: "1px solid #d9d9d9", borderRadius: "8px" }}
                disabled={!formData.breed || formData.breed === "select"}
              >
                <option value="">Select Father</option>
                {filteredFathers.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.petName} ({pet.breed})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ width: isMobile ? "100%" : "48%" }}>
            <p>Mother</p>
            <div className={styles["form-input-container"]}>
              <select
                value={formData.motherId}
                onChange={(e) => handleInputChange("motherId", e.target.value)}
                className={styles.selectField}
                style={{ width: "100%", padding: "12px", border: "1px solid #d9d9d9", borderRadius: "8px" }}
                disabled={!formData.breed || formData.breed === "select"}
              >
                <option value="">Select Mother</option>
                {filteredMothers.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.petName} ({pet.breed})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      );
    }
    return null;
  };

  const handleSubmit = async () => {
    setHasSubmitted(true);

    const newErrors = validate();

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

    // Get selected address details
    const selectedAddressObj = userInfo?.addresses?.find(
      addr => addr.id?.toString() === formData.addressId?.toString() ||
        addr._id?.toString() === formData.addressId?.toString()
    );

    // Format address exactly as required by API
    const addressPayload = {
      street: selectedAddressObj?.flatOrHouseNoOrBuildingOrCompanyOrApartment || formData.address?.street || "",
      area: selectedAddressObj?.areaOrStreetOrSectorOrVillage || formData.address?.area || "",
      city: selectedAddressObj?.townOrCity || formData.address?.city || "",
      state: selectedAddressObj?.state || formData.address?.state || "",
      pincode: selectedAddressObj?.pinCode || formData.address?.pincode || "",
      landmark: selectedAddressObj?.landmark || formData.address?.landmark || "",
      country: selectedCountryName || selectedAddressObj?.country || formData.address?.country || ""
    };

    // Determine father and mother values based on selection
    let fatherValue = null;
    let motherValue = null;
    
    if (formData.haveParents === "Only Father") {
      fatherValue = formData.fatherId ? Number(formData.fatherId) : null;
      motherValue = null;
    } else if (formData.haveParents === "Only Mother") {
      fatherValue = null;
      motherValue = formData.motherId ? Number(formData.motherId) : null;
    } else if (formData.haveParents === "Both Father and Mother") {
      fatherValue = formData.fatherId ? Number(formData.fatherId) : null;
      motherValue = formData.motherId ? Number(formData.motherId) : null;
    } else {
      fatherValue = null;
      motherValue = null;
    }

    const payload = {
      petName: formData.petName,
      petType: formData.petType,
      breed: formData.breed,
      color: formData.color,
      petGender: formData.petGender,
      size: formData.size,
      petAge: formData.petAge,
      weight: formData.weight ? `${formData.weight} ${formData.petWeightIn}` : "",
      dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
      price: formData.price,
      negotiable: formData.negotiable || "No",
      vaccinated: formData.vaccinated || "No",
      howManyVaccinationsDone: formData.howManyVaccinationsDone || [],
      microchipNo: formData.microchipNo || "",
      kciRegistration: formData.kci || "No",
      transportService: formData.isTransportService || "No",
      petStatus: formData.status || "Ready for Sale",
      address: addressPayload,
      description: formData.additionalInfo || "",
      haveParentsOfThisPet: formData.haveParents !== "select" && formData.haveParents !== "Don't Know" ? "Yes" : "No",
      doesThisPetHaveParents: formData.haveParents === "Both Father and Mother" ? "Both" : 
                              (formData.haveParents === "Only Father" ? "Father" :
                              (formData.haveParents === "Only Mother" ? "Mother" : "No")),
      father: fatherValue,
      mother: motherValue,
      petVariety: formData.petVariety || "",
      numberVisibility: formData.numberVisibility ? "on" : "off"
    };

    setIsLoading(true);
    setApiProcessing({ loader: true, message: "Saving profile..." });

    try {
      let response;
      if (!petData) {
        response = await webApi.post("vendorPetSales/create", payload);
        console.log("Create response:", response);
      } else {
        response = await webApi.put(`vendorPetSales/update/${petData.id}`, payload);
        console.log("Update response:", response);
      }

      if (response.status === "success" || response.status === 200) {
        const savedPet = response.data?.petProfile || response.data || null;
        
        let petToReturn = savedPet;
        if (petData && !savedPet) {
          petToReturn = {
            ...petData,
            ...payload,
            id: petData.id,
            _id: petData._id
          };
        }

        if (response.data?.id || petData?.id) {
          const petId = response.data?.id || petData?.id;
          
          for (const file of imageFiles) {
            if (file && file !== "existing") {
              const fd = new FormData();
              fd.append("morePhotos", file);
              try {
                await webApi.imagePut(`vendorPetSales/morePhotos/${petId}`, fd);
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
                await webApi.imagePut(`vendorPetSales/moreVideos/${petId}`, fd);
              } catch (err) {
                console.error("Video upload failed:", err);
              }
            }
          }
        }

        setErrorMessage("");
        toast.success(petData ? "Pet updated successfully" : "Pet added successfully");
        closePopup(petToReturn);
      } else {
        setErrorMessage(response.message || "Failed to save profile.");
        toast.error(response.message || "Failed to save profile.");
        closePopup(false);
      }
    } catch (err) {
      console.error("Submit Error:", err);
      const errorMsg = err.response?.data?.message || "An error occurred while saving.";
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
      closePopup(false);
    } finally {
      setIsLoading(false);
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

  const MAX_IMAGES = 3;
  const MAX_VIDEOS = 3;

  const formatAddressDisplay = () => {
    const addr = formData.address;
    const parts = [];
    if (addr.street) parts.push(addr.street);
    if (addr.area) parts.push(addr.area);
    if (addr.city) parts.push(addr.city);
    if (addr.state) parts.push(addr.state);
    if (addr.pincode) parts.push(addr.pincode);
    if (addr.country) parts.push(addr.country);
    return parts.length > 0 ? parts.join(", ") : "No address selected";
  };

  return (
    <div className={styles.popupContainer} style={{ background: "#fff", borderRadius: "10px", width: "100%", position: "relative" }}>
      <div className={styles.header} style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "0 10px 0 0" }}>
          <span><BackHeader onClick={closePopup}/></span>
          <h2>{petData ? "Edit Puppy" : "Add New Puppy"}</h2>
        </div>
        <button style={{ background: "transparent", border: "none", fontSize: "1.2rem", cursor: "pointer", padding: "20px" }} onClick={closePopup}>&#x2715;</button>
      </div>

      <div className={styles.mainContainer}>
        <div className={styles.formDiv2}>
          {!!petData ? (
            <div style={{ width: isMobile ? "100%" : "48%" }}>
              <p>Pet Type <span style={{ color: "red" }}>*</span></p>
              <div style={{ padding: "12px", border: "1px solid #e0e0e0", color: "#666",  }}>
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
            question={"Pet Name *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
            placeholder="Enter Pet Name" type="text" value={formData.petName}
            onChange={(e) => handleInputChange("petName", e.target.value)}
            custommarrgin={{ marginBottom: "14px" }} error={errors.petName} ownMargin={true}
          />
          
          {!!petData ? (
            <div style={{ width: isMobile ? "100%" : "48%" }}>
              <p>Pet Breed <span style={{ color: "red" }}>*</span></p>
              <div style={{ padding: "12px",  border: "1px solid #e0e0e0", color: "#666", }}>
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
            question={"Date Of Birth *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
            max={maxDate}
            error={errors.dateOfBirth} custommarrgin={{ marginBottom: "14px" }} ownMargin={true}
          />
          
          <DropDownv1
            options={["select", "Male", "Female"]} question={"Gender *"}
            width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.petGender}
            onChange={(value) => handleInputChange("petGender", value)}
            CustomInputElementAddpet={{ color: "#000000" }} error={errors.petGender}
          />
          
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
            question={"Weight *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
            type="text" placeholder="Enter Pet Weight" value={formData.weight}
            onChange={(e) => {
              const numericValue = e.target.value.replace(/[^0-9]/g, "").slice(0, 3);
              handleInputChange("weight", numericValue);
            }}
            custommarrgin={{ marginBottom: "14px" }} error={errors.weight} ownMargin={true}
            filter={formData.weight ? "weight" : ""} setFormData={setFormData} formData={formData}
          />
          
          <div style={{ width: isMobile ? "100%" : "48%" }}>
            <p>Address <span className={styles["required"]}>*</span></p>
            <div className={styles["form-input-container"]}>
              <AddressDropdown
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                userInfo={userInfo}
                petData={petData}
              />
              {hasSubmitted && errors.address && (
                <span className={styles["error-text"]}>{errors.address}</span>
              )}
            </div>
          </div>
          
          <CustomInputElement2
            question={"Price *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
            placeholder="Enter Price" type="number" value={formData.price}
            onChange={(e) => handleInputChange("price", e.target.value)}
            custommarrgin={{ marginBottom: "14px" }} error={errors.price} ownMargin={true}
          />
        </div>

        <div className={styles.formDiv2}>
          <DropDownv1
            options={["select", "Yes", "No"]} question={"Negotiable?"}
            width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.negotiable}
            onChange={(value) => handleInputChange("negotiable", value)}
            CustomInputElementAddpet={{ color: "#000000" }}
          />
      
          <DropDownv1
            options={["select", "Only Father", "Only Mother", "Both Father and Mother", "Don't Know"]} 
            question={"Have Parents? *"}
            width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.haveParents}
            onChange={(value) => handleInputChange("haveParents", value)}
            CustomInputElementAddpet={{ color: "#000000" }}
          />
          
          {renderParentFields()}
          
          <DropDownv1
            options={["select", "Pet Quality", "Show Quality", "KCI Registration"]}
            question={"Pet Variety *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
            value={formData.petVariety} onChange={(value) => handleInputChange("petVariety", value)}
            CustomInputElementAddpet={{ color: "#000000" }}
          />
          
          <DropDownv1
            options={["select", "Yes", "No"]} question={"Vaccinated *"}
            width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.vaccinated}
            onChange={(value) => handleInputChange("vaccinated", value)}
            CustomInputElementAddpet={{ color: "#000000" }}
          />
          
          {/* {formData.vaccinated === "Yes" && (
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
                <span style={{ float: "right"}}>{showVaccDropdown ? "▲" : "▼"}</span>
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
          )} */}
         
          <DropDownv1
            options={["select", "Yes", "No"]} question={"Transport Service *"}
            width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.isTransportService}
            onChange={(value) => handleInputChange("isTransportService", value)}
            CustomInputElementAddpet={{ color: "#000000" }}
          />
          
          <DropDownv1
            question={"Status *"} 
            options={["select", "Ready for Sale",
                "Reserved",
                "Sold Out",
                "On hold",
                "Not for Sale",]} 
            width={isMobile ? "100%" : "48%"}
            backgroundColor="#FFFFFF" 
            value={formData.status}
            onChange={(value) => handleInputChange("status", value)}
            CustomInputElementAddpet={{ color: "#000000" }}
            error={errors.status}
          />
          
          <CustomInputElement2
            question="Add Description" width={isMobile ? "100%" : "48%"}
            backgroundColor="#FFFFFF" placeholder="Add more information"
            onInputChange={handleVictoriaInfoChange}
            onChange={(e) => handleInputChange("additionalInfo", e.target.value)}
            rows={3}
            customStylestext={{ backgroundColor: "#fff", border: "1px solid rgb(217, 217, 217)", marginBottom: "16px" }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
            <input
              type="checkbox"
              id="numberVisibility"
              checked={formData.numberVisibility}
              onChange={(e) => handleInputChange("numberVisibility", e.target.checked)}
              style={{ width: "18px", height: "18px" }}
            />
            <label htmlFor="numberVisibility">Show your mobile number</label>
          </div>

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
                          style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", width: "100%", height: "100%", minHeight: "120px", border: isMandatory ? "2px dashed #ccc" : "1px dashed #ccc", borderRadius: "8px", backgroundColor: "#f9f9f9" }}
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
                onClose={() => {
                  setCropperOpen(false);
                  setImageToCrop(null);
                  setIsCropping(false);
                  setFilesToCrop((prevQueue) => {
                    const remaining = prevQueue.slice(1);
                    if (remaining.length > 0) {
                      setImageToCrop(remaining[0]);
                      setCropperOpen(true);
                    }
                    return remaining;
                  });
                }}
                onCropComplete={handleCropComplete}
              />
            )}

            <div className={styles.uploadSection} style={{ marginTop: isMobile ? "10px" : "0" }}>
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
            </div>
          </div>

          {errorMessage && <p className={styles.errorMsg} style={{ color: "red", marginTop: "10px" }}>{errorMessage}</p>}

          <div style={{ display: "flex", justifyContent: "center", width: "100%", marginTop: "20px" }}>
            <div className={styles.deskSubmit}>
              <div className={styles.mobSubmit}>
                <button className={styles.submitButton} onClick={handleSubmit} disabled={apiProcessing.loader || isLoading} style={{ background: "#F5790C", color: "white", padding: "10px 20px", borderRadius: "5px", border: "none", cursor: "pointer", fontSize: "16px" }}>
                  {apiProcessing.loader || isLoading ? "Saving..." : (petData ? "Save" : "Add Pet")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddNewPuppyPopup;