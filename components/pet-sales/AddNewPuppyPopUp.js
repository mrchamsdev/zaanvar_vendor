// // import useStore from "@/components/state/useStore";
// // import { WebApimanager } from "@/components/utilities/WebApiManager";
// // import React, { useEffect, useRef, useState, useMemo } from "react";
// // import styles from "../../styles/register/settingsregister.module.css";
// // import ImageCropperModal from "@/components/register/imageCropperModule";
// // import CustomInputElement2 from "@/components/register/customInputcom";
// // import DropDownv1 from "@/components/register/dropdown";
// // import CustomInputComp from "@/components/register/customInput";
// // import BackHeader from "@/components/pet-sales/backHeader";
// // import AddressDropdown from "./addAddressDropDown";
// // import Cookies from "js-cookie";
// // import { toast } from "sonner";
// // import { IMAGE_URL } from "@/components/utilities/Constants";
// // import { createPortal } from "react-dom";

// // const calculateAge = (dob) => {
// //   const dobDate = new Date(dob);
// //   const today = new Date();
// //   let years = today.getFullYear() - dobDate.getFullYear();
// //   let months = today.getMonth() - dobDate.getMonth();
// //   if (months < 0) {
// //     years--;
// //     months += 12;
// //   }
// //   return `${years} years ${months} month${months !== 1 ? "s" : ""}`;
// // };

// // const AddNewPuppyPopup = ({
// //   closePopup,
// //   petData,
// //   fetchPetData = () => {},
// // }) => {
// //   const { getJwtToken, getUserInfo } = useStore();
// //   const jwt = getJwtToken();
// //   const webApi = new WebApimanager(jwt);
// //   const userInfo = getUserInfo();

// //   const imageFileInputRef = useRef(null);
// //   const videoFileInputRef = useRef(null);
// //   const isProcessingCrop = useRef(false);
// //   const blobUrlsRef = useRef([]);

// //   const [imageFiles, setImageFiles] = useState([]);
// //   const [imagePreviews, setImagePreviews] = useState([]);
// //   const [videoFiles, setVideoFiles] = useState([]);
// //   const [videoPreviews, setVideoPreviews] = useState([]);

// //   const [cropperOpen, setCropperOpen] = useState(false);
// //   const [imageToCrop, setImageToCrop] = useState(null);
// //   const [filesToCrop, setFilesToCrop] = useState([]);
// //   const [isCropping, setIsCropping] = useState(false);

// //   const [breedOptions, setBreedOptions] = useState([]);
// //   const [breed, setBreed] = useState([]);
// //   const [errorMessage, setErrorMessage] = useState("");
// //   const [errors, setErrors] = useState({});
// //   const [locationDetails, setLocationDetails] = useState("");
// //   const [apiProcessing, setApiProcessing] = useState({ loader: false, message: "Loading..." });
// //   const [isMobile, setIsMobile] = useState(false);
// //   const [hasSubmitted, setHasSubmitted] = useState(false);
// //   const [isLoading, setIsLoading] = useState(false);

// //   const selectedLocation = useStore((s) => s.selectedLocation);
// //   const selectedCountryName = useStore((s) => s.selectedCountryName);

// //   const petColors = [
// //     "Select Color", "Black", "White", "Brown", "Red", "Gold", "Cream", "Yellow",
// //     "Gray", "Blue", "Fawn", "Tan", "Buff", "Brindle", "Merle", "Harlequin",
// //     "Sable", "Bicolor", "Tricolor", "Tuxedo", "Roan", "Spotted", "Ticked",
// //     "Particolor", "Blenheim", "Domino",
// //   ];

// //   const [formData, setFormData] = useState({
// //     petName: "", petAge: "", petType: "", color: "", breed: "", additionalInfo: "",
// //     weight: "", vaccinated: null, kci: null, championship: "", Events: "", skills: "",
// //     instagramLink: "", petGender: "", vaccineCertificate: "", kciCertificate: "",
// //     dob: "", spayedOrNeutered: "", medication: "", size: "", healthCondition: "",
// //     petWeightIn: "", microchipNo: "", howmanyTimesBreedingDone: "",
// //     addressId: "", address: "", isTransportService: "", price: "", haveParents: "select"
// //   });

// //   useEffect(() => {
// //     return () => {
// //       blobUrlsRef.current.forEach((url) => {
// //         if (url && url.startsWith("blob:")) {
// //           URL.revokeObjectURL(url);
// //         }
// //       });
// //     };
// //   }, []);

// //   useEffect(() => {
// //     if (selectedLocation) setLocationDetails(selectedLocation);
// //   }, [selectedLocation]);

// //   useEffect(() => {
// //     if (selectedLocation) return;
// //     try {
// //       const userLocation = Cookies.get("user_location");
// //       if (!userLocation) return;
// //       const locationObj = JSON.parse(userLocation);
// //       let { city, region } = locationObj || {};
// //       if (city) city = decodeURIComponent(city);
// //       if (region) region = decodeURIComponent(region);
// //       let loc = "";
// //       if (city && city !== "Unknown") loc += city;
// //       if (region && region !== "Unknown") loc += loc ? `, ${region}` : region;
// //       if (!loc) loc = "Unknown Location";
// //       setLocationDetails(loc);
// //     } catch (_) {}
// //   }, [selectedLocation]);

// //   useEffect(() => {
// //     if (typeof window !== "undefined") {
// //       const handleResize = () => setIsMobile(window.innerWidth <= 768);
// //       handleResize();
// //       window.addEventListener("resize", handleResize);
// //       return () => window.removeEventListener("resize", handleResize);
// //     }
// //   }, []);

// //   // Populate form when editing
// //   useEffect(() => {
// //     if (petData) {
// //       // Find the address object from userInfo if addressId exists
// //       const selectedAddress = userInfo?.addresses?.find(
// //         (addr) => addr.id?.toString() === petData?.addressId?.toString() ||
// //           addr._id?.toString() === petData?.addressId?.toString()
// //       ) || userInfo?.addresses?.[0];

// //       const formattedAddress = selectedAddress
// //         ? [
// //             selectedAddress.flatOrHouseNoOrBuildingOrCompanyOrApartment,
// //             selectedAddress.areaOrStreetOrSectorOrVillage,
// //             selectedAddress.landmark,
// //             selectedAddress.townOrCity,
// //             selectedAddress.state,
// //             selectedAddress.country,
// //             selectedAddress.pinCode,
// //           ]
// //             .filter(Boolean)
// //             .join(", ")
// //         : petData?.address || "";

// //       setFormData({
// //         petName: petData.petName || "",
// //         petAge: petData.petAge || "",
// //         petType: petData.petType || "",
// //         color: petData.color || "",
// //         breed: petData.breed || "",
// //         additionalInfo: petData.description || petData.additionalInfo || "",
// //         weight: petData?.weight?.endsWith("kg") || petData?.weight?.endsWith("lb")
// //           ? petData.weight.split(" ")[0]
// //           : petData?.weight || "",
// //         petWeightIn: petData?.weight?.endsWith("kg") ? "kg" : "lb",
// //         vaccinated: petData.vaccinated ?? null,
// //         kci: petData.kciRegistration || petData.kci || "",
// //         championship: petData.championship || "",
// //         Events: petData.Events || "",
// //         skills: petData.skills || "",
// //         instagramLink: petData.instagramLink || "",
// //         petGender: petData.petGender || "",
// //         vaccineCertificate: petData.vaccineCertificate || "",
// //         kciCertificate: petData.kciCertificate || "",
// //         spayedOrNeutered: petData.spayedOrNeutered || "",
// //         dob: petData?.birthday?.slice(0, 10) || "",
// //         medication: petData.medication || "",
// //         size: petData.size || "",
// //         healthCondition: petData.healthCondition || petData.doesYourPetHasAnyHealthIssues || "",
// //         microchipNo: petData.microchipNo || "",
// //         howmanyTimesBreedingDone: petData.howmanyTimesBreedingDone || "",
// //         addressId: selectedAddress?.id?.toString() || petData?.addressId?.toString() || "",
// //         address: formattedAddress,
// //         isTransportService: petData.transportService || petData.isTransportService || "",
// //         price: petData.price || "",
// //         haveParents: petData.doesThisPetHaveParents === "Yes" || petData.doesThisPetHaveParents === "Both" ? "Yes" : "No",
// //       });

// //       // Show existing images from server
// //       if (petData.morePhotos && petData.morePhotos.length > 0) {
// //         const imageUrls = petData.morePhotos.map(photo => {
// //           const baseUrl = IMAGE_URL.endsWith('/') ? IMAGE_URL : `${IMAGE_URL}/`;
// //           const cleanPath = photo.startsWith('/') ? photo.slice(1) : photo;
// //           return `${baseUrl}${cleanPath}`;
// //         });
// //         setImagePreviews(imageUrls);
// //         setImageFiles(Array(petData.morePhotos.length).fill("existing"));
// //       }
// //       if (petData.moreVideos && petData.moreVideos.length > 0) {
// //         const videoUrls = petData.moreVideos.map(video => {
// //           const baseUrl = IMAGE_URL.endsWith('/') ? IMAGE_URL : `${IMAGE_URL}/`;
// //           const cleanPath = video.startsWith('/') ? video.slice(1) : video;
// //           return `${baseUrl}${cleanPath}`;
// //         });
// //         setVideoPreviews(videoUrls);
// //         setVideoFiles(Array(petData.moreVideos.length).fill("existing"));
// //       }
// //     } else {
// //       setFormData({
// //         petName: "", petAge: "", petType: "", color: "", breed: "", additionalInfo: "",
// //         weight: "", vaccinated: null, kci: "", championship: "", Events: "", skills: "",
// //         instagramLink: "", petGender: "", vaccineCertificate: "", kciCertificate: "",
// //         dob: "", spayedOrNeutered: "", medication: "", size: "", healthCondition: "",
// //         petWeightIn: "", microchipNo: "", howmanyTimesBreedingDone: "",
// //         addressId: "", address: "", isTransportService: "", price: "", haveParents: "select"
// //       });
// //       setImageFiles([]);
// //       setImagePreviews([]);
// //       setVideoFiles([]);
// //       setVideoPreviews([]);
// //       setErrorMessage("");
// //     }
// //   }, [petData, userInfo]);

// //   // Clear address error as soon as an address is selected/added
// //   useEffect(() => {
// //     if (formData.addressId) {
// //       setErrors((prev) => {
// //         const { address, ...rest } = prev;
// //         if (!hasSubmitted) {
// //           const { file, video } = rest;
// //           return { file: file || "", video: video || "" };
// //         }
// //         return rest;
// //       });
// //     }
// //   }, [formData.addressId, hasSubmitted]);

// //   // Fetch breeds when editing
// //   useEffect(() => {
// //     if (petData?.petType && breedOptions.length === 0) {
// //       fetchBreeds(petData.petType);
// //     }
// //   }, [petData?.petType]);

// //   // Auto-fill size from breed (only for new pets)
// //   useEffect(() => {
// //     if (petData) return;
// //     if (formData.breed && formData.breed !== "select" && breed.length > 0) {
// //       const selectedBreed = breed.find((b) => b["breedName"] === formData.breed);
// //       if (selectedBreed?.size) {
// //         setFormData((prev) => ({ ...prev, size: selectedBreed.size.trim() }));
// //         setErrors((prev) => ({ ...prev, size: "" }));
// //       } else {
// //         setFormData((prev) => ({ ...prev, size: "select" }));
// //       }
// //     }
// //   }, [breed, formData.breed, petData]);

// //   // Auto-calculate age from DOB
// //   useEffect(() => {
// //     if (formData.dob) {
// //       const age = calculateAge(formData.dob);
// //       setFormData((prev) => {
// //         if (prev.petAge === age) return prev;
// //         return { ...prev, petAge: age };
// //       });
// //     }
// //   }, [formData.dob]);

// //   const instagramRegex = /^(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/[A-Za-z0-9._%-]+\/?$/;

// //   const handleVictoriaInfoChange = (inputValue) => {
// //     setFormData((prev) => ({ ...prev, additionalInfo: inputValue }));
// //   };

// //   const handleInputChange = (field, value) => {
// //     if (field === "weight") value = value.replace(/[^0-9]/g, "");
// //     if (field === "instagramLink") {
// //       setErrors((prev) => ({
// //         ...prev,
// //         instagramLink: value && !instagramRegex.test(value)
// //           ? "Please check your Instagram URL & enter a valid Instagram URL (ex: https://instagram.com/john_doe)"
// //           : "",
// //       }));
// //     }
// //     setFormData((prev) => ({ ...prev, [field]: value }));

// //     if (field === "breed" && value !== "select") {
// //       const selectedBreed = breed.find((b) => b["breedName"] === value);
// //       if (selectedBreed?.size) {
// //         setFormData((prev) => ({ ...prev, size: selectedBreed.size.trim() }));
// //         setErrors((prev) => ({ ...prev, size: "" }));
// //       } else {
// //         setFormData((prev) => ({ ...prev, size: "select" }));
// //         setErrors((prev) => ({ ...prev, size: "Size not available for this breed." }));
// //       }
// //     }
// //   };

// //   const fetchBreeds = async (petType) => {
// //     try {
// //       const response = await webApi.get(`breeds?petType=${petType}`);
// //       if (response.status === 200) {
// //         setBreedOptions(response.data.data.map((b) => b?.["breedName"]));
// //         setBreed(response.data.data);
// //       }
// //     } catch (error) {
// //       console.log(error.message);
// //     }
// //   };

// //   const handleImageFileChange = (e) => {
// //     const files = Array.from(e.target.files);
// //     e.target.value = "";

// //     if (errors.images) setErrors((prev) => ({ ...prev, images: "" }));

// //     const remainingSlots = 4 - imageFiles.length;
// //     if (remainingSlots <= 0) {
// //       setErrors((prev) => ({ ...prev, images: `Maximum 4 images allowed.` }));
// //       return;
// //     }

// //     const validFiles = [];
// //     for (const file of files) {
// //       if (!file.type.startsWith("image/")) {
// //         setErrors((prev) => ({ ...prev, images: "Please upload valid image files." }));
// //         return;
// //       }
// //       const isDuplicate = imageFiles.some(
// //         (f) => typeof f !== "string" && f.name === file.name && f.size === file.size
// //       );
// //       if (!isDuplicate) validFiles.push(file);
// //     }

// //     if (!validFiles.length) return;

// //     const queue = validFiles.slice(0, remainingSlots);
// //     setFilesToCrop(queue);
// //     setImageToCrop(queue[0]);
// //     setCropperOpen(true);
// //     setIsCropping(true);
// //   };

// //   const handleCropComplete = (croppedBlob) => {
// //     if (isProcessingCrop.current) return;
// //     isProcessingCrop.current = true;

// //     try {
// //       const croppedFile = new File(
// //         [croppedBlob],
// //         `cropped-${Date.now()}.jpg`,
// //         { type: "image/jpeg" }
// //       );

// //       const previewUrl = URL.createObjectURL(croppedFile);
// //       blobUrlsRef.current.push(previewUrl);

// //       setImageFiles((prev) => [...prev, croppedFile].slice(0, 4));
// //       setImagePreviews((prev) => [...prev, previewUrl].slice(0, 4));

// //       if (errors.images) setErrors((prev) => ({ ...prev, images: "" }));

// //       setFilesToCrop((prevQueue) => {
// //         const remaining = prevQueue.slice(1);
// //         if (remaining.length > 0) {
// //           setImageToCrop(remaining[0]);
// //           setCropperOpen(true);
// //           setIsCropping(true);
// //         } else {
// //           setImageToCrop(null);
// //           setCropperOpen(false);
// //           setIsCropping(false);
// //         }
// //         return remaining;
// //       });
// //     } catch (error) {
// //       console.error("Error in crop complete:", error);
// //     } finally {
// //       setTimeout(() => { isProcessingCrop.current = false; }, 500);
// //     }
// //   };

// //   const handleCropCancel = () => {
// //     isProcessingCrop.current = false;
// //     setIsCropping(false);
// //     setFilesToCrop((prevQueue) => {
// //       const remaining = prevQueue.slice(1);
// //       if (remaining.length > 0) {
// //         setImageToCrop(remaining[0]);
// //         setCropperOpen(true);
// //         setIsCropping(true);
// //       } else {
// //         setImageToCrop(null);
// //         setCropperOpen(false);
// //         setIsCropping(false);
// //       }
// //       return remaining;
// //     });
// //   };

// //   const handleDeleteMedia = async (index, type) => {
// //     const isPhoto = type === "photo";
// //     const files = isPhoto ? imageFiles : videoFiles;
// //     const fileToRemove = files[index];

// //     if (fileToRemove === "existing") {
// //       const confirmDelete = window.confirm(`Permanently delete this ${type}?`);
// //       if (!confirmDelete) return;

// //       try {
// //         setApiProcessing({ loader: true, message: `Deleting ${type}...` });
// //         const endpoint = isPhoto 
// //           ? `vendorPetSales/deleteMedia/${petData.id}?index=${index}` 
// //           : `vendorPetSales/deleteMedia/${petData.id}?index=${index}`;
// //         const response = await webApi.delete(endpoint);

// //         if (response.status === "success" || response.status === 200) {
// //           await fetchPetData();
// //         } else {
// //           setErrorMessage(response.message || "Server failed to delete item.");
// //           return;
// //         }
// //       } catch (error) {
// //         setErrorMessage(error.response?.data?.message || "Failed to delete from server.");
// //         return;
// //       } finally {
// //         setApiProcessing({ loader: false, message: "" });
// //       }
// //     }

// //     if (isPhoto) {
// //       setImageFiles((prev) => prev.filter((_, i) => i !== index));
// //       setImagePreviews((prev) => {
// //         const url = prev[index];
// //         if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
// //         return prev.filter((_, i) => i !== index);
// //       });
// //     } else {
// //       setVideoFiles((prev) => prev.filter((_, i) => i !== index));
// //       setVideoPreviews((prev) => {
// //         const url = prev[index];
// //         if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
// //         return prev.filter((_, i) => i !== index);
// //       });
// //     }
// //   };

// //   const handleVideoFileChange = (e) => {
// //     const files = Array.from(e.target.files);
// //     e.target.value = "";

// //     if (errors.videos) setErrors((prev) => ({ ...prev, videos: "" }));

// //     const remainingSlots = 3 - videoFiles.length;
// //     if (remainingSlots <= 0) {
// //       setErrors((prev) => ({ ...prev, videos: `Maximum 3 videos allowed.` }));
// //       return;
// //     }

// //     const validFiles = [];
// //     for (const file of files) {
// //       if (!file.type.startsWith("video/")) {
// //         setErrors((prev) => ({ ...prev, videos: "Please upload valid video files." }));
// //         return;
// //       }
// //       const isDuplicate = videoFiles.some(
// //         (f) => f.name === file.name && f.size === file.size
// //       );
// //       if (!isDuplicate) validFiles.push(file);
// //     }

// //     if (!validFiles.length) return;

// //     const toAdd = validFiles.slice(0, remainingSlots);
// //     const previews = toAdd.map((f) => {
// //       const url = URL.createObjectURL(f);
// //       blobUrlsRef.current.push(url);
// //       return url;
// //     });

// //     setVideoFiles((prev) => [...prev, ...toAdd].slice(0, 3));
// //     setVideoPreviews((prev) => [...prev, ...previews].slice(0, 3));
// //   };

// //   const validate = () => {
// //     const newErrors = {};
// //     if (!formData.petName.trim()) newErrors.petName = "Pet Name is required.";
// //     if (imageFiles.length === 0) newErrors.images = "Please upload at least 1 image.";
// //     if (!formData.dob.trim()) newErrors.dob = "Date of Birth is required.";
// //     if (!formData.color.trim() || formData.color === "Select Color") newErrors.color = "Pet color is required.";
// //     if (!formData.medication.trim()) newErrors.medication = "Medication is required.";
// //     if (!String(formData.weight).trim()) newErrors.weight = "Pet weight is required.";
// //     else if (!formData.petWeightIn) newErrors.weight = "Select pet weight type";
// //     if (!formData.petType || formData.petType === "select") newErrors.petType = "Pet Type is required.";
// //     if (!formData.petGender || formData.petGender === "select") newErrors.petGender = "Pet Gender is required.";
// //     if (!formData.breed || formData.breed === "select") newErrors.breed = "Pet Breed is required.";
// //     if (!formData.addressId) newErrors.address = "Address is required.";
// //     if (formData.instagramLink && !instagramRegex.test(formData.instagramLink))
// //       newErrors.instagramLink = "Please check your Instagram URL & enter a valid Instagram URL";

// //     return newErrors;
// //   };

// //   const handleSubmit = async () => {
// //     setHasSubmitted(true);

// //     // Ensure we have the address string from selected address
// //     if (formData.addressId && (!formData.address || typeof formData.address !== 'string')) {
// //       const selectedAddressObj = userInfo?.addresses?.find(
// //         addr => addr.id?.toString() === formData.address?.toString() ||
// //           addr._id?.toString() === formData.address?.toString()
// //       );
// //       const displayAddress = selectedAddressObj
// //         ? [
// //             selectedAddressObj.flatOrHouseNoOrBuildingOrCompanyOrApartment,
// //             selectedAddressObj.areaOrStreetOrSectorOrVillage,
// //             selectedAddressObj.landmark,
// //             selectedAddressObj.townOrCity,
// //             selectedAddressObj.state,
// //             selectedAddressObj.country,
// //             selectedAddressObj.pinCode,
// //           ].filter(Boolean).join(', ')
// //         : '';
// //       if (displayAddress) {
// //         setFormData(prev => ({ ...prev, address: displayAddress }));
// //       }
// //     }

// //     const newErrors = validate();

// //     if (Object.keys(newErrors).length > 0) {
// //       setErrors(newErrors);
// //       setTimeout(() => {
// //         const firstErrorElement = document.querySelector(`.${styles["error-text"]}`);
// //         if (firstErrorElement) {
// //           firstErrorElement.scrollIntoView({ behavior: "smooth", block: "center" });
// //         }
// //       }, 100);
// //       return;
// //     }

// //     setErrors({});
// //     setErrorMessage("");

// //     const payload = {
// //       petAge: formData.petAge,
// //       petName: formData.petName,
// //       petType: formData.petType,
// //       breed: formData.breed,
// //       description: formData.additionalInfo,
// //       weight: `${formData.weight} ${formData.petWeightIn}`,
// //       vaccinated: formData.vaccinated,
// //       petGender: formData.petGender,
// //       kciRegistration: formData.kci,
// //       color: formData.color,
// //       championship: formData.championship,
// //       Events: formData.Events,
// //       skills: formData.skills,
// //       instagramLink: formData.instagramLink,
// //       birthday: formData.dob,
// //       spayedOrNeutered: formData.spayedOrNeutered,
// //       medication: formData.medication,
// //       doesYourPetHasAnyHealthIssues: formData.healthCondition,
// //       size: formData.size,
// //       microchipNo: formData.microchipNo,
// //       howmanyTimesBreedingDone: formData.howmanyTimesBreedingDone,
// //       address: formData.address ? Number(formData.address) : null,
// //       transportService: formData.isTransportService,
// //       price: formData.price,
// //       doesThisPetHaveParents: formData.haveParents === "Yes" ? "Both" : "No",
// //     };

// //     setIsLoading(true);
// //     setApiProcessing({ loader: true, message: "Saving profile..." });

// //     try {
// //       let response;
// //       if (!petData) {
// //         response = await webApi.post("vendorPetSales/create", payload);
// //         console.log("Create response:", response);
// //       } else {
// //         response = await webApi.put(`vendorPetSales/update/${petData.id}`, payload);
// //         console.log("Update response:", response);
// //       }

// //       if (response.status === "success" || response.status === 200) {
// //         const petId = response.data?.petProfile?.id || response.data?.id || petData?.id;

// //         if (petId) {
// //           // Upload Images
// //           for (const file of imageFiles) {
// //             if (file && file !== "existing") {
// //               const fd = new FormData();
// //               fd.append("morePhotos", file);
// //               try {
// //                 await webApi.imagePut(`vendorPetSales/morePhotos/${petId}`, fd);
// //               } catch (err) {
// //                 console.error("Image upload failed:", err);
// //               }
// //             }
// //           }

// //           // Upload Videos
// //           for (const file of videoFiles) {
// //             if (file && file !== "existing") {
// //               const fd = new FormData();
// //               fd.append("moreVideos", file);
// //               try {
// //                 await webApi.imagePut(`vendorPetSales/moreVideos/${petId}`, fd);
// //               } catch (err) {
// //                 console.error("Video upload failed:", err);
// //               }
// //             }
// //           }
// //         }

// //         setErrorMessage("");
// //         toast.success(petData ? "Pet updated successfully" : "Pet added successfully");

// //         if (fetchPetData) {
// //           await fetchPetData();
// //         }

// //         closePopup();
// //       } else {
// //         setErrorMessage(response.message || "Failed to save profile.");
// //         toast.error(response.message || "Failed to save profile.");
// //       }
// //     } catch (err) {
// //       console.error("Submit Error:", err);
// //       const errorMsg = err.response?.data?.message || "An error occurred while saving.";
// //       setErrorMessage(errorMsg);
// //       toast.error(errorMsg);
// //     } finally {
// //       setIsLoading(false);
// //       setApiProcessing({ loader: false, message: "" });
// //     }
// //   };

// //   const sizeOptions = useMemo(() => {
// //     if (petData && formData.size && formData.size !== "select size" && formData.size !== "") {
// //       return [formData.size];
// //     }
// //     if (!petData && formData.breed !== "select" && formData.size && formData.size !== "select size" && formData.size !== "") {
// //       return [formData.size];
// //     }
// //     return ["select size", "Toy", "Small", "Medium", "Large", "Giant"];
// //   }, [petData, formData.breed, formData.size]);

// //   const MAX_IMAGES = 4;
// //   const MAX_VIDEOS = 3;

// //   return (
// //     <div className={styles.popupContainer} style={{ background: "#fff", borderRadius: "10px", width: "100%", position: "relative" }}>
// //       <div className={styles.header} style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
// //         <div style={{ display: "flex", alignItems: "center", padding: "0 10px 0 0" }}>
// //           <BackHeader onClick={closePopup} />
// //           <h2>{petData ? "Edit Pet" : "Add New Pet"}</h2>
// //         </div>
// //         <button style={{ background: "transparent", border: "none", fontSize: "1.2rem", cursor: "pointer", padding: "20px" }} onClick={closePopup}>&#x2715;</button>
// //       </div>

// //       <div className={styles.mainContainer}>
// //         <div className={styles.formDiv2}>
// //           <DropDownv1
// //             options={["select", "Dog", "Cat", "Bird", "Fish", "Small Pet"]}
// //             question={"Pet Type *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
// //             value={formData.petType}
// //             onChange={(value) => {
// //               handleInputChange("petType", value);
// //               if (value && value !== "select") fetchBreeds(value);
// //               else setBreedOptions([]);
// //             }}
// //             CustomInputElementAddpet={{ color: "#000000" }} error={errors.petType}
// //           />
// //           <CustomInputElement2
// //             question={"Pet Name *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
// //             placeholder="Enter Pet Name" type="text" value={formData.petName}
// //             onChange={(e) => handleInputChange("petName", e.target.value)}
// //             custommarrgin={{ marginBottom: "14px" }} error={errors.petName} ownMargin={true}
// //           />
// //           <DropDownv1
// //             options={petData ? [formData.breed] : ["select", ...breedOptions]}
// //             question={"Pet Breed *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
// //             value={formData.breed} onChange={(value) => handleInputChange("breed", value)}
// //             CustomInputElementAddpet={{ color: "#000000" }} error={errors.breed}
// //           />
// //           <CustomInputElement2
// //             question={"Date Of Birth *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
// //             placeholder="Date Of Birth" type="date" value={formData.petAge}
// //             onChange={(e) => handleInputChange("dob", e.target.value)}
// //             custommarrgin={{ marginBottom: "14px" }} error={errors.dob} ownMargin={true}
// //           />
// //           <DropDownv1
// //             options={["select", "Male", "Female"]} question={"Gender *"}
// //             width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.petGender}
// //             onChange={(value) => handleInputChange("petGender", value)}
// //             CustomInputElementAddpet={{ color: "#000000" }} error={errors.petGender}
// //           />
// //           <DropDownv1
// //             options={sizeOptions} question={"Size *"} width={isMobile ? "100%" : "48%"}
// //             backgroundColor="#FFFFFF" value={formData.size || ""}
// //             onChange={(value) => {
// //               if (!petData) {
// //                 handleInputChange("size", value === "select size" ? "" : value);
// //               }
// //             }}
// //             CustomInputElementAddpet={{ color: "#000000" }} error={errors.size}
// //           />
// //           <DropDownv1
// //             options={petColors} question={"Color *"} width={isMobile ? "100%" : "48%"}
// //             backgroundColor="#FFFFFF" value={formData.color}
// //             onChange={(value) => handleInputChange("color", value)}
// //             error={errors.color}
// //           />
// //           <CustomInputComp
// //             question={"Weight *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
// //             type="text" placeholder="Enter Pet Weight" value={formData.weight}
// //             onChange={(e) => {
// //               const numericValue = e.target.value.replace(/[^0-9]/g, "").slice(0, 3);
// //               handleInputChange("weight", numericValue);
// //             }}
// //             custommarrgin={{ marginBottom: "14px" }} error={errors.weight} ownMargin={true}
// //             filter={formData.weight ? "weight" : ""} setFormData={setFormData} formData={formData}
// //           />
// //           <DropDownv1
// //             options={["select", "Yes", "No"]} question={"Spayed/Neutered *"}
// //             width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.spayedOrNeutered}
// //             onChange={(value) => handleInputChange("spayedOrNeutered", value)}
// //             CustomInputElementAddpet={{ color: "#000000" }} error={errors.spayedOrNeutered}
// //           />
// //           <CustomInputElement2
// //             question={"Medication *"} width={isMobile ? "100%" : "48%"} type="text"
// //             backgroundColor="#FFFFFF" value={formData.medication} placeholder="Enter Medication"
// //             onChange={(e) => handleInputChange("medication", e.target.value)}
// //             custommarrgin={{ marginBottom: "14px" }} error={errors.medication} ownMargin={true}
// //           />
// //               {/* Address Field */}
// //           <div style={{ width: isMobile ? "100%" : "48%" }}>
// //             <p>Address <span className={styles["required"]}>*</span></p>
// //             <div className={styles["form-input-container"]}>
// //               <AddressDropdown
// //                 formData={formData}
// //                 setFormData={setFormData}
// //                 errors={errors}
// //                 userInfo={userInfo}
// //               />
// //               {hasSubmitted && errors.address && (
// //                 <span className={styles["error-text"]}>{errors.address}</span>
// //               )}
// //             </div>
// //           </div>
// //           <CustomInputElement2
// //             question={"Price *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
// //             placeholder="Enter Price" type="text" value={formData.price}
// //             onChange={(e) => handleInputChange("price", e.target.value)}
// //             custommarrgin={{ marginBottom: "14px" }} error={errors.price} ownMargin={true}
// //           />
// //         </div>

// //         <div className={styles.formDiv2}>
// //           <DropDownv1
// //             options={["select", "Yes", "No"]} question={"Negotiable?"}
// //             width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.negotiable}
// //             onChange={(value) => handleInputChange("negotiable", value)}
// //             CustomInputElementAddpet={{ color: "#000000" }}
// //           />
// //           <CustomInputElement2
// //             question={"Health Condition *"} width={isMobile ? "100%" : "48%"} type="text"
// //             backgroundColor="#FFFFFF" value={formData.healthCondition}
// //             placeholder="Enter Health Conditions"
// //             onChange={(e) => handleInputChange("healthCondition", e.target.value)}
// //             custommarrgin={{ marginBottom: "14px" }} error={errors.healthCondition} ownMargin={true}
// //           />
// //           <CustomInputElement2
// //             question={"Microchip Number"} width={isMobile ? "100%" : "48%"} type="text"
// //             backgroundColor="#FFFFFF" value={formData.microchipNo}
// //             placeholder="Enter Microchip Number"
// //             onChange={(e) => handleInputChange("microchipNo", e.target.value)}
// //             custommarrgin={{ marginBottom: "14px" }} ownMargin={true}
// //           />
// //            <DropDownv1
// //             options={["select", "Yes", "No"]} question={"Have Parents?"}
// //             width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.haveParents}
// //             onChange={(value) => handleInputChange("haveParents", value)}
// //             CustomInputElementAddpet={{ color: "#000000" }}
// //           />
// //           <DropDownv1
// //             options={petData ? [formData.breed] : ["select", ...breedOptions]}
// //             question={"Breed of Mother"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
// //             value={formData.breed} onChange={(value) => handleInputChange("breed", value)}
// //             CustomInputElementAddpet={{ color: "#000000" }} error={errors.breed}
// //           />
// //            <DropDownv1
// //             options={petData ? [formData.breed] : ["select", ...breedOptions]}
// //             question={"Breed of Father"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
// //             value={formData.breed} onChange={(value) => handleInputChange("breed", value)}
// //             CustomInputElementAddpet={{ color: "#000000" }} error={errors.breed}
// //           />
// //           <DropDownv1
// //             options={["select", "Yes", "No"]} question={"Vaccinated"}
// //             width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.vaccinated}
// //             onChange={(value) => handleInputChange("vaccinated", value)}
// //             CustomInputElementAddpet={{ color: "#000000" }}
// //           />
// //           {formData.vaccinated === "Yes" && (
// //             <CustomInputElement2
// //               question={"Type of vaccination"} width={isMobile ? "100%" : "48%"} type="text"
// //               backgroundColor="#FFFFFF" value={formData.vaccineCertificate}
// //               placeholder="Enter Type of Vaccination"
// //               onChange={(e) => handleInputChange("vaccineCertificate", e.target.value)}
// //               custommarrgin={{ marginBottom: "14px" }} ownMargin={true}
// //             />
// //           )}
// //           <DropDownv1
// //             options={["select", "Yes", "No"]} question={"KCI"} width={isMobile ? "100%" : "48%"}
// //             backgroundColor="#FFFFFF" value={formData.kci}
// //             onChange={(value) => handleInputChange("kci", value)}
// //             CustomInputElementAddpet={{ color: "#000000" }}
// //           />
// //           <DropDownv1
// //             options={["select", "Yes", "No"]} question={"Transport Service"}
// //             width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.isTransportService}
// //             onChange={(value) => handleInputChange("isTransportService", value)}
// //             CustomInputElementAddpet={{ color: "#000000" }}
// //           />
// //           <CustomInputElement2
// //             question={"How many times breeding done earlier?"} width={isMobile ? "100%" : "48%"}
// //             type="number" backgroundColor="#FFFFFF" value={formData.howmanyTimesBreedingDone}
// //             placeholder="Enter Breeding Count"
// //             onChange={(e) => handleInputChange("howmanyTimesBreedingDone", e.target.value)}
// //             custommarrgin={{ marginBottom: "14px" }} ownMargin={true}
// //           />
// //           <DropDownv1
// //             question={"Skills"} options={["select", "Good", "Bad"]} width={isMobile ? "100%" : "48%"}
// //             backgroundColor="#FFFFFF" value={formData.skills}
// //             onChange={(value) => handleInputChange("skills", value)}
// //             CustomInputElementAddpet={{ color: "#000000" }}
// //           />
// //           <DropDownv1
// //             question={"Championship"} options={["select", "Yes", "No"]}
// //             width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.championship}
// //             onChange={(value) => handleInputChange("championship", value)}
// //             CustomInputElementAddpet={{ color: "#000000" }}
// //           />
// //           <DropDownv1
// //             question={"Events"} options={["select", "Yes", "No"]} width={isMobile ? "100%" : "48%"}
// //             backgroundColor="#FFFFFF" value={formData.Events}
// //             onChange={(value) => handleInputChange("Events", value)}
// //             CustomInputElementAddpet={{ color: "#000000" }}
// //           />
// //           <CustomInputElement2
// //             question={"Instagram Link"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
// //             placeholder="URL" value={formData.instagramLink}
// //             onChange={(e) => handleInputChange("instagramLink", e.target.value)}
// //             error={errors.instagramLink} custommarrgin={{ marginBottom: "14px" }} ownMargin={true}
// //           />
// //           {/* <CustomInputElement2
// //             question="Status" width={isMobile ? "100%" : "48%"}
// //             backgroundColor="#FFFFFF" placeholder="Add more information"
// //             onInputChange={handleVictoriaInfoChange}
// //             onChange={(e) => handleInputChange("additionalInfo", e.target.value)}
// //             rows={3}
// //             customStylestext={{ backgroundColor: "#fff", border: "1px solid rgb(217, 217, 217)", marginBottom: "16px" }}
// //           /> */}


// //           {/* Upload Section */}
// //           <div className={styles.uploadSections}>
// //             <div className={styles.uploadSection}>
// //               <p className={styles.uploadLabel}>
// //                 Pet Images <span className={styles.required}>*</span>
// //               </p>
// //               <div className={styles["image-grid"]}>
// //                 {Array.from({ length: MAX_IMAGES }).map((_, index) => {
// //                   const hasImage = !!imagePreviews[index];
// //                   const isMandatory = index === 0;
// //                   return (
// //                     <div key={index} className={styles["slot-column"]}>
// //                       {!hasImage ? (
// //                         <label
// //                           className={`${styles["image-slot-empty"]} ${isMandatory ? styles["mandatory-border"] : ""}`}
// //                           onClick={() => imageFileInputRef.current?.click()}
// //                           style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", width: "100%", height: "100%", minHeight: "120px", border: isMandatory ? "2px solid red" : "2px dashed #ccc", borderRadius: "8px", backgroundColor: "#f9f9f9" }}
// //                         >
// //                           <div style={{ fontSize: "32px", marginBottom: "8px" }}>+</div>
// //                           <div style={{ fontSize: "12px", textAlign: "center" }}>{isMandatory ? "Add Photo *" : "Add Photo"}</div>
// //                         </label>
// //                       ) : (
// //                         <div className={styles["image-preview-below"]} style={{ position: "relative", width: "100%", height: "100%" }}>
// //                           <img src={imagePreviews[index]} alt={`pet-${index}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
// //                           <button type="button" onClick={() => handleDeleteMedia(index, "photo")} style={{ position: "absolute", top: "-9px", right: "-12px", background: "rgba(0, 0, 0, 0.6)", color: "#fff", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "none", fontSize: "14px" }}>✕</button>
// //                         </div>
// //                       )}
// //                     </div>
// //                   );
// //                 })}
// //               </div>
// //               <input ref={imageFileInputRef} type="file" accept="image/*" multiple hidden onChange={handleImageFileChange} />
// //               {errors.images && <span className={styles["error-text"]} style={{ color: "red", fontSize: "12px", marginTop: "5px", display: "block" }}>{errors.images}</span>}
// //             </div>

// //             {cropperOpen && imageToCrop && (
// //               <ImageCropperModal
// //                 open={cropperOpen}
// //                 image={imageToCrop}
// //                 onClose={() => {
// //                   setCropperOpen(false);
// //                   setImageToCrop(null);
// //                   setIsCropping(false);
// //                   setFilesToCrop((prevQueue) => {
// //                     const remaining = prevQueue.slice(1);
// //                     if (remaining.length > 0) {
// //                       setImageToCrop(remaining[0]);
// //                       setCropperOpen(true);
// //                     }
// //                     return remaining;
// //                   });
// //                 }}
// //                 onCropComplete={handleCropComplete}
// //               />
// //             )}

// //             <div className={styles.uploadSection} style={{ marginTop: "20px" }}>
// //               <p className={styles.uploadLabel}>Pet Videos (Max {MAX_VIDEOS})</p>
// //               <div className={styles["image-grid"]}>
// //                 {Array.from({ length: MAX_VIDEOS }).map((_, index) => {
// //                   const hasVideo = !!videoPreviews[index];
// //                   return (
// //                     <div key={index} className={styles["slot-column"]}>
// //                       {!hasVideo ? (
// //                         <label className={styles["image-slot-empty"]} onClick={() => videoFileInputRef.current?.click()} style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", width: "100%", height: "100%", minHeight: "120px", border: "2px dashed #ccc", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
// //                           <div style={{ fontSize: "32px", marginBottom: "8px" }}>+</div>
// //                           <div style={{ fontSize: "12px", textAlign: "center" }}>Add Video</div>
// //                         </label>
// //                       ) : (
// //                         <div className={styles["image-preview-below"]} style={{ position: "relative", width: "100%", height: "100%" }}>
// //                           <video src={videoPreviews[index]} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} controls />
// //                           <button type="button" onClick={() => handleDeleteMedia(index, "video")} style={{ position: "absolute", top: "-9px", right: "-12px", background: "rgba(0, 0, 0, 0.6)", color: "#fff", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "none", fontSize: "14px" }}>✕</button>
// //                         </div>
// //                       )}
// //                     </div>
// //                   );
// //                 })}
// //               </div>
// //               <input ref={videoFileInputRef} type="file" accept="video/*" multiple hidden onChange={handleVideoFileChange} />
// //               {errors.videos && <span className={styles["error-text"]} style={{ color: "red", fontSize: "12px", marginTop: "5px", display: "block" }}>{errors.videos}</span>}
// //             </div>

// //             {errorMessage && <p className={styles.errorMsg} style={{ color: "red", marginTop: "10px" }}>{errorMessage}</p>}
// //           </div>

// //           <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
// //             <div className={styles.deskSubmit}>
// //               <div className={styles.mobSubmit}>
// //                 <button className={styles.submitButton} onClick={handleSubmit} disabled={apiProcessing.loader || isLoading} style={{ background: "#F5790C", color: "white", padding: "10px 20px", borderRadius: "5px", border: "none", cursor: "pointer", fontSize: "16px" }}>
// //                   {apiProcessing.loader || isLoading ? "Saving..." : (petData ? "Save" : "Add Pet")}
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default AddNewPuppyPopup;



// import useStore from "@/components/state/useStore";
// import { WebApimanager } from "@/components/utilities/WebApiManager";
// import React, { useEffect, useRef, useState, useMemo } from "react";
// import styles from "../../styles/register/settingsregister.module.css";
// import { AddIcon } from "@/public/images/SVG";
// import ImageCropperModal from "@/components/register/imageCropperModule";
// import CustomInputElement2 from "@/components/register/customInputcom";
// import DropDownv1 from "@/components/register/dropdown";
// import CustomInputComp from "@/components/register/customInput";
// import BackHeader from "@/components/pet-sales/backHeader";
// import AddressDropdown from "./addAddressDropDown";
// import Cookies from "js-cookie";
// import { toast } from "sonner";
// import { IMAGE_URL } from "@/components/utilities/Constants";

// // const calculateAge = (dateOfBirth) => {
// //   const dobDate = new Date(dateOfBirth);
// //   const today = new Date();
// //   let years = today.getFullYear() - dobDate.getFullYear();
// //   let months = today.getMonth() - dobDate.getMonth();
// //   if (months < 0) {
// //     years--;
// //     months += 12;
// //   }
// //   return `${years} years ${months} month${months !== 1 ? "s" : ""}`;
// // };

// const AddNewPuppyPopup = ({
//   closePopup,
//   petData,
//   fetchPetData = () => {},
// }) => {
//   const { getJwtToken, getUserInfo } = useStore();
//   const jwt = getJwtToken();
//   const webApi = new WebApimanager(jwt);
//   const userInfo = getUserInfo();

//   const imageFileInputRef = useRef(null);
//   const videoFileInputRef = useRef(null);
//   const isProcessingCrop = useRef(false);
//   const blobUrlsRef = useRef([]);

//   const [imageFiles, setImageFiles] = useState([]);
//   const [imagePreviews, setImagePreviews] = useState([]);
//   const [videoFiles, setVideoFiles] = useState([]);
//   const [videoPreviews, setVideoPreviews] = useState([]);

//   const [cropperOpen, setCropperOpen] = useState(false);
//   const [imageToCrop, setImageToCrop] = useState(null);
//   const [filesToCrop, setFilesToCrop] = useState([]);
//   const [isCropping, setIsCropping] = useState(false);

//   const [breedOptions, setBreedOptions] = useState([]);
//   const [breed, setBreed] = useState([]);
//   const [errorMessage, setErrorMessage] = useState("");
//   const [errors, setErrors] = useState({});
//   const [locationDetails, setLocationDetails] = useState("");
//   const [apiProcessing, setApiProcessing] = useState({ loader: false, message: "Loading..." });
//   const [isMobile, setIsMobile] = useState(false);
//   const [hasSubmitted, setHasSubmitted] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);

//   const selectedLocation = useStore((s) => s.selectedLocation);
//   const selectedCountryName = useStore((s) => s.selectedCountryName);

//   const petColors = [
//     "Select Color", "Black", "White", "Brown", "Red", "Gold", "Cream", "Yellow",
//     "Gray", "Blue", "Fawn", "Tan", "Buff", "Brindle", "Merle", "Harlequin",
//     "Sable", "Bicolor", "Tricolor", "Tuxedo", "Roan", "Spotted", "Ticked",
//     "Particolor", "Blenheim", "Domino",
//   ];

//    const [formData, setFormData] = useState({
//     petName: "", petAge: "", petType: "", color: "", breed: "", additionalInfo: "",
//     weight: "", vaccinated: null, kci: null, championship: "", Events: "", skills: "",
//     instagramLink: "", petGender: "", vaccineCertificate: "", kciCertificate: "",
//     dateOfBirth: "", spayedOrNeutered: "", medication: "", size: "", healthCondition: "",
//     petWeightIn: "", microchipNo: "", howmanyTimesBreedingDone: "",
//     address: {
//       area: "",
//       city: "",
//       state: "",
//       street: "",
//       pincode: "",
//       landmark: ""
//     }, isTransportService: "", price: "", haveParentsOf: "",
//     negotiable: ""
//   });

//   useEffect(() => {
//     return () => {
//       blobUrlsRef.current.forEach((url) => {
//         if (url && url.startsWith("blob:")) {
//           URL.revokeObjectURL(url);
//         }
//       });
//     };
//   }, []);

//   useEffect(() => {
//     if (selectedLocation) setLocationDetails(selectedLocation);
//   }, [selectedLocation]);

//   useEffect(() => {
//     if (selectedLocation) return;
//     try {
//       const userLocation = Cookies.get("user_location");
//       if (!userLocation) return;
//       const locationObj = JSON.parse(userLocation);
//       let { city, region } = locationObj || {};
//       if (city) city = decodeURIComponent(city);
//       if (region) region = decodeURIComponent(region);
//       let loc = "";
//       if (city && city !== "Unknown") loc += city;
//       if (region && region !== "Unknown") loc += loc ? `, ${region}` : region;
//       if (!loc) loc = "Unknown Location";
//       setLocationDetails(loc);
//     } catch (_) {}
//   }, [selectedLocation]);

//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       const handleResize = () => setIsMobile(window.innerWidth <= 768);
//       handleResize();
//       window.addEventListener("resize", handleResize);
//       return () => window.removeEventListener("resize", handleResize);
//     }
//   }, []);

//   // // Populate form when editing - map response fields correctly
//   useEffect(() => {
//     if (petData) {
//   //     const selectedAddress = userInfo?.addresses?.find(
//   //       (addr) => addr.id?.toString() === petData?.addressId?.toString() ||
//   //         addr._id?.toString() === petData?.addressId?.toString()
//   //     ) || userInfo?.addresses?.[0];

//   //     const formattedAddress = selectedAddress
//   //       ? [
//   //           selectedAddress.flatOrHouseNoOrBuildingOrCompanyOrApartment,
//   //           selectedAddress.areaOrStreetOrSectorOrVillage,
//   //           selectedAddress.landmark,
//   //           selectedAddress.townOrCity,
//   //           selectedAddress.state,
//   //           selectedAddress.country,
//   //           selectedAddress.pinCode,
//   //         ]
//   //           .filter(Boolean)
//   //           .join(", ")
//   //       : petData?.address || "";

//       setFormData({
//         petName: petData.petName || "",
//         petAge: petData.petAge || "",
//         petType: petData.petType || "",
//         color: petData.color || "",
//         breed: petData.breed || "",
//         additionalInfo: petData.description || "",
//         weight: petData?.weight?.endsWith("kg") || petData?.weight?.endsWith("lb")
//           ? petData.weight.split(" ")[0]
//           : petData?.weight || "",
//         petWeightIn: petData?.weight?.endsWith("kg") ? "kg" : "lb",
//         vaccinated: petData.vaccinated || null,
//         kci: petData.kciRegistration || "",
//         championship: petData.championship || "",
//         Events: petData.Events || "",
//         skills: petData.skills || "",
//         instagramLink: petData.instagramLink || "",
//         petGender: petData.petGender || "",
//         vaccineCertificate: petData.vaccineCertificate || "",
//         kciCertificate: petData.kciCertificate || "",
//         spayedOrNeutered: petData.spayedOrNeutered || "",
//         dateOfBirth: petData?.birthday?.slice(0, 10) || "",
//         medication: petData.medication || "",
//         size: petData.size || "",
//         healthCondition: petData.healthCondition || petData.doesYourPetHasAnyHealthIssues || "",
//         microchipNo: petData.microchipNo || "",
//         howmanyTimesBreedingDone: petData.howmanyTimesBreedingDone || "",
//        address: {
//         street: address?.street || "",
//         area: address?.area || "",
//         city: address?.city || "",
//         state: address?.state || "",
//         pincode: address?.pincode || "",
//         landmark: address?.landmark || ""
//       },
//         address: formattedAddress,
//         isTransportService: petData.transportService || "",
//         price: petData.price || "",
//         haveParents: petData.doesThisPetHaveParents === "Both" ? "Yes" : (petData.doesThisPetHaveParents || "select"),
//         negotiable: petData.negotiable || ""
//       });

//       // Show existing images from server
//       if (petData.morePhotos && petData.morePhotos.length > 0) {
//         const imageUrls = petData.morePhotos.map(photo => {
//           const baseUrl = IMAGE_URL.endsWith('/') ? IMAGE_URL : `${IMAGE_URL}/`;
//           const cleanPath = photo.startsWith('/') ? photo.slice(1) : photo;
//           return `${baseUrl}${cleanPath}`;
//         });
//         setImagePreviews(imageUrls);
//         setImageFiles(Array(petData.morePhotos.length).fill("existing"));
//       }
//       if (petData.moreVideos && petData.moreVideos.length > 0) {
//         const videoUrls = petData.moreVideos.map(video => {
//           const baseUrl = IMAGE_URL.endsWith('/') ? IMAGE_URL : `${IMAGE_URL}/`;
//           const cleanPath = video.startsWith('/') ? video.slice(1) : video;
//           return `${baseUrl}${cleanPath}`;
//         });
//         setVideoPreviews(videoUrls);
//         setVideoFiles(Array(petData.moreVideos.length).fill("existing"));
//       }
//     } else {
//       setFormData({
//         petName: "", petAge: "", petType: "", color: "", breed: "", additionalInfo: "",
//         weight: "", vaccinated: null, kci: "", championship: "", Events: "", skills: "",
//         instagramLink: "", petGender: "", vaccineCertificate: "", kciCertificate: "",
//         dateOfBirth: "", spayedOrNeutered: "", medication: "", size: "", healthCondition: "",
//         petWeightIn: "", microchipNo: "", howmanyTimesBreedingDone: "",
//         address: {
//         street:  "",
//         area: "",
//         city: "",
//         state:"",
//         pincode: "",
//         landmark: ""
//       }, isTransportService: "", price: "", haveParents: "select",
//         negotiable: ""
//       });
//       setImageFiles([]);
//       setImagePreviews([]);
//       setVideoFiles([]);
//       setVideoPreviews([]);
//       setErrorMessage("");
//     }
//   }, [petData, userInfo]);

//   // Clear address error as soon as an address is selected/added
//   // useEffect(() => {
//   //   if (formData.addressId) {
//   //     setErrors((prev) => {
//   //       const { address, ...rest } = prev;
//   //       if (!hasSubmitted) {
//   //         const { file, video } = rest;
//   //         return { file: file || "", video: video || "" };
//   //       }
//   //       return rest;
//   //     });
//   //   }
//   // }, [formData.addressId, hasSubmitted]);

//   // Fetch breeds when editing
//   useEffect(() => {
//     if (petData?.petType && breedOptions.length === 0) {
//       fetchBreeds(petData.petType);
//     }
//   }, [petData?.petType]);

//   // Auto-fill size from breed (only for new pets)
//   useEffect(() => {
//     if (petData) return;
//     if (formData.breed && formData.breed !== "select" && breed.length > 0) {
//       const selectedBreed = breed.find((b) => b["breedName"] === formData.breed);
//       if (selectedBreed?.size) {
//         setFormData((prev) => ({ ...prev, size: selectedBreed.size.trim() }));
//         setErrors((prev) => ({ ...prev, size: "" }));
//       } else {
//         setFormData((prev) => ({ ...prev, size: "select" }));
//       }
//     }
//   }, [breed, formData.breed, petData]);

//   // // Auto-calculate age from DOB
//   //  useEffect(() => {
//   //   if (formData.dateOfBirth) {
//   //     const age = calculateAge(formData.dateOfBirth);
//   //     setFormData((prev) => {
//   //       if (prev.petAge === age) return prev;
//   //       return { ...prev, petAge: age };
//   //     });
//   //   }
//   // }, [formData.dateOfBirth]);

//   const instagramRegex = /^(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/[A-Za-z0-9._%-]+\/?$/;

//   const handleVictoriaInfoChange = (inputValue) => {
//     setFormData((prev) => ({ ...prev, additionalInfo: inputValue }));
//   };

//   const handleInputChange = (field, value) => {
//     if (field === "weight") value = value.replace(/[^0-9]/g, "");
//     if (field === "instagramLink") {
//       setErrors((prev) => ({
//         ...prev,
//         instagramLink: value && !instagramRegex.test(value)
//           ? "Please check your Instagram URL & enter a valid Instagram URL (ex: https://instagram.com/john_doe)"
//           : "",
//       }));
//     }
//     if (field === "dateOfBirth") {
//     const selectedDate = new Date(value);
//     const today = new Date();
    
//     // If the date is in the future, don't update state or show an error immediately
//     if (selectedDate > today) {
//       setErrors(prev => ({ ...prev, dateOfBirth: "Date of Birth cannot be in the future." }));
//       // Optional: return; // Uncomment this to block the entry entirely
//     } else {
//       setErrors(prev => ({ ...prev, dateOfBirth: "" }));
//     }
//   }
//     setFormData((prev) => ({ ...prev, [field]: value }));


//     if (field === "breed" && value !== "select") {
//       const selectedBreed = breed.find((b) => b["breedName"] === value);
//       if (selectedBreed?.size) {
//         setFormData((prev) => ({ ...prev, size: selectedBreed.size.trim() }));
//         setErrors((prev) => ({ ...prev, size: "" }));
//       } else {
//         setFormData((prev) => ({ ...prev, size: "select" }));
//         setErrors((prev) => ({ ...prev, size: "Size not available for this breed." }));
//       }
//     }
//   };

//   const fetchBreeds = async (petType) => {
//     try {
//       const response = await webApi.get(`breeds?petType=${petType}`);
//       if (response.status === 200) {
//         setBreedOptions(response.data.data.map((b) => b?.["breedName"]));
//         setBreed(response.data.data);
//       }
//     } catch (error) {
//       console.log(error.message);
//     }
//   };

//   const handleImageFileChange = (e) => {
//     const files = Array.from(e.target.files);
//     e.target.value = "";

//     if (errors.images) setErrors((prev) => ({ ...prev, images: "" }));

//     const remainingSlots = 4 - imageFiles.length;
//     if (remainingSlots <= 0) {
//       setErrors((prev) => ({ ...prev, images: `Maximum 4 images allowed.` }));
//       return;
//     }

//     const validFiles = [];
//     for (const file of files) {
//       if (!file.type.startsWith("image/")) {
//         setErrors((prev) => ({ ...prev, images: "Please upload valid image files." }));
//         return;
//       }
//       const isDuplicate = imageFiles.some(
//         (f) => typeof f !== "string" && f.name === file.name && f.size === file.size
//       );
//       if (!isDuplicate) validFiles.push(file);
//     }

//     if (!validFiles.length) return;

//     const queue = validFiles.slice(0, remainingSlots);
//     setFilesToCrop(queue);
//     setImageToCrop(queue[0]);
//     setCropperOpen(true);
//     setIsCropping(true);
//   };

//   const handleCropComplete = (croppedBlob) => {
//     if (isProcessingCrop.current) return;
//     isProcessingCrop.current = true;

//     try {
//       const croppedFile = new File(
//         [croppedBlob],
//         `cropped-${Date.now()}.jpg`,
//         { type: "image/jpeg" }
//       );

//       const previewUrl = URL.createObjectURL(croppedFile);
//       blobUrlsRef.current.push(previewUrl);

//       setImageFiles((prev) => [...prev, croppedFile].slice(0, 4));
//       setImagePreviews((prev) => [...prev, previewUrl].slice(0, 4));

//       if (errors.images) setErrors((prev) => ({ ...prev, images: "" }));

//       setFilesToCrop((prevQueue) => {
//         const remaining = prevQueue.slice(1);
//         if (remaining.length > 0) {
//           setImageToCrop(remaining[0]);
//           setCropperOpen(true);
//           setIsCropping(true);
//         } else {
//           setImageToCrop(null);
//           setCropperOpen(false);
//           setIsCropping(false);
//         }
//         return remaining;
//       });
//     } catch (error) {
//       console.error("Error in crop complete:", error);
//     } finally {
//       setTimeout(() => { isProcessingCrop.current = false; }, 500);
//     }
//   };

//   const handleCropCancel = () => {
//     isProcessingCrop.current = false;
//     setIsCropping(false);
//     setFilesToCrop((prevQueue) => {
//       const remaining = prevQueue.slice(1);
//       if (remaining.length > 0) {
//         setImageToCrop(remaining[0]);
//         setCropperOpen(true);
//         setIsCropping(true);
//       } else {
//         setImageToCrop(null);
//         setCropperOpen(false);
//         setIsCropping(false);
//       }
//       return remaining;
//     });
//   };
// const todayString = new Date().toISOString().split("T")[0];
//   const handleDeleteMedia = async (index, type) => {
//     const isPhoto = type === "photo";
//     const files = isPhoto ? imageFiles : videoFiles;
//     const fileToRemove = files[index];

//     if (fileToRemove === "existing") {
//       const confirmDelete = window.confirm(`Permanently delete this ${type}?`);
//       if (!confirmDelete) return;

//       try {
//         setApiProcessing({ loader: true, message: `Deleting ${type}...` });
//         const endpoint = isPhoto 
//           ? `vendorPetSales/deleteMedia/${petData.id}?type=photo&index=${index}` 
//           : `vendorPetSales/deleteMedia/${petData.id}?type=video&index=${index}`;
//         const response = await webApi.delete(endpoint);

//         if (response.status === "success" || response.status === 200) {
//          fetchPetData();
//         } else {
//           setErrorMessage(response.message || "Server failed to delete item.");
//           return;
//         }
//       } catch (error) {
//         setErrorMessage(error.response?.data?.message || "Failed to delete from server.");
//         return;
//       } finally {
//         setApiProcessing({ loader: false, message: "" });
//       }
//     }

//     if (isPhoto) {
//       setImageFiles((prev) => prev.filter((_, i) => i !== index));
//       setImagePreviews((prev) => {
//         const url = prev[index];
//         if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
//         return prev.filter((_, i) => i !== index);
//       });
//     } else {
//       setVideoFiles((prev) => prev.filter((_, i) => i !== index));
//       setVideoPreviews((prev) => {
//         const url = prev[index];
//         if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
//         return prev.filter((_, i) => i !== index);
//       });
//     }
//   };

//   const handleVideoFileChange = (e) => {
//     const files = Array.from(e.target.files);
//     e.target.value = "";

//     if (errors.videos) setErrors((prev) => ({ ...prev, videos: "" }));

//     const remainingSlots = 3 - videoFiles.length;
//     if (remainingSlots <= 0) {
//       setErrors((prev) => ({ ...prev, videos: `Maximum 3 videos allowed.` }));
//       return;
//     }

//     const validFiles = [];
//     for (const file of files) {
//       if (!file.type.startsWith("video/")) {
//         setErrors((prev) => ({ ...prev, videos: "Please upload valid video files." }));
//         return;
//       }
//       const isDuplicate = videoFiles.some(
//         (f) => f.name === file.name && f.size === file.size
//       );
//       if (!isDuplicate) validFiles.push(file);
//     }

//     if (!validFiles.length) return;

//     const toAdd = validFiles.slice(0, remainingSlots);
//     const previews = toAdd.map((f) => {
//       const url = URL.createObjectURL(f);
//       blobUrlsRef.current.push(url);
//       return url;
//     });

//     setVideoFiles((prev) => [...prev, ...toAdd].slice(0, 3));
//     setVideoPreviews((prev) => [...prev, ...previews].slice(0, 3));
//   };

//   const validate = () => {
//     const newErrors = {};
//     if (!formData.petName.trim()) newErrors.petName = "Pet Name is required.";
//     if (imageFiles.length === 0) newErrors.images = "Please upload at least 1 image.";
//     if (!formData.dateOfBirth.trim()) newErrors.dateOfBirth = "Date of Birth is required.";
//     if (!formData.color.trim() || formData.color === "Select Color") newErrors.color = "Pet color is required.";
//     if (!formData.medication.trim()) newErrors.medication = "Medication is required.";
//     if (!String(formData.weight).trim()) newErrors.weight = "Pet weight is required.";
//     else if (!formData.petWeightIn) newErrors.weight = "Select pet weight type";
//     if (!formData.petType || formData.petType === "select") newErrors.petType = "Pet Type is required.";
//     if (!formData.petGender || formData.petGender === "select") newErrors.petGender = "Pet Gender is required.";
//     if (!formData.breed || formData.breed === "select") newErrors.breed = "Pet Breed is required.";
//     if (!formData.address) newErrors.address = "Address is required.";
//     if (formData.instagramLink && !instagramRegex.test(formData.instagramLink))
//       newErrors.instagramLink = "Please check your Instagram URL & enter a valid Instagram URL";
//     if(!formData.spayedOrNeutered) newErrors.spayedOrNeutered = "This field is required.";
//      if(!formData.price.trim()) newErrors.price = "Price is required."; 
//       else if (isNaN(formData.price) || Number(formData.price) < 0) newErrors.price = "Price must be a valid non-negative number.";
//     if(formData.haveParents === "yes" && !formData.breedMother || !formData.breedFather)   newErrors.breedMother = "Please specify if the pet has parents or not.";
//     if(!formData.healthCondition.trim()) newErrors.healthCondition = "Health condition is required.";
//     return newErrors;
 
//   };

//   const handleSubmit = async () => {
//     setHasSubmitted(true);

//     // if (formData.addressId && (!formData.address || typeof formData.address !== 'string')) {
//     //   const selectedAddressObj = userInfo?.addresses?.find(
//     //     addr => addr.id?.toString() === formData.addressId?.toString() ||
//     //       addr._id?.toString() === formData.addressId?.toString()
//     //   );
//     //   const displayAddress = selectedAddressObj
//     //     ? [
//     //         selectedAddressObj.flatOrHouseNoOrBuildingOrCompanyOrApartment,
//     //         selectedAddressObj.areaOrStreetOrSectorOrVillage,
//     //         selectedAddressObj.landmark,
//     //         selectedAddressObj.townOrCity,
//     //         selectedAddressObj.state,
//     //         selectedAddressObj.country,
//     //         selectedAddressObj.pinCode,
//     //       ].filter(Boolean).join(', ')
//     //     : '';
//     //   if (displayAddress) {
//     //     setFormData(prev => ({ ...prev, address: displayAddress }));
//     //   }
//     // }

//     const newErrors = validate();

//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors);
//       setTimeout(() => {
//         const firstErrorElement = document.querySelector(`.${styles["error-text"]}`);
//         if (firstErrorElement) {
//           firstErrorElement.scrollIntoView({ behavior: "smooth", block: "center" });
//         }
//       }, 100);
//       return;
//     }

//     setErrors({});
//     setErrorMessage("");

//     // const payload = {
//     //   petAge: formData.petAge,
//     //   petName: formData.petName,
//     //   petType: formData.petType,
//     //   breed: formData.breed,
//     //   description: formData.additionalInfo,
//     //   weight: `${formData.weight} ${formData.petWeightIn}`,
//     //   vaccinated: formData.vaccinated,
//     //   howManyVaccinationsDone: formData.howManyVaccinationsDone,
//     //   petGender: formData.petGender,
//     //   kciRegistration: formData.kci,
//     //   color: formData.color,
//     //   championship: formData.championship,
//     //   Events: formData.Events,
//     //   skills: formData.skills,
//     //   instagramLink: formData.instagramLink,
//     //   dateOfBirth: formData.dateOfBirth,
//     //   spayedOrNeutered: formData.spayedOrNeutered,
//     //   medication: formData.medication,
//     //   doesYourPetHasAnyHealthIssues: formData.healthCondition,
//     //   size: formData.size,
//     //   microchipNo: formData.microchipNo,
//     //   howmanyTimesBreedingDone: formData.howmanyTimesBreedingDone,
//     //   address: formData.address,
//     //   transportService: formData.isTransportService,
//     //   price: formData.price,
//     //   doesThisPetHaveParents: formData.haveParents === "Yes" ? "Both" : "No",
//     //   negotiable: formData.negotiable
//     // };
//     const payload = {
//     petName: formData.petName,
//     petType: formData.petType,
//     breed: formData.breed,
//     color: formData.color,
//     petGender: formData.petGender,
//     size: formData.size,
//     petAge: formData.petAge,
//     weight: `${formData.weight} ${formData.petWeightIn}`,
//     dateOfBirth: formData.dob ? new Date(formData.dob).toISOString() : null,
//     price: formData.price.toString(),
//     negotiable: formData.negotiable,
//     vaccinated: formData.vaccinated,
//     // Mapping vaccinations to an array if they aren't already
//     howManyVaccinationsDone: formData.howManyVaccinationsDone 
//       ? Array.isArray(formData.howManyVaccinationsDone)
//       : [],
//     microchipNo: formData.microchipNo,
//     kciRegistration: formData.kci,
//     transportService: formData.isTransportService,
//     petStatus: petData ? petData.petStatus : "Ready for Sale",
//     address: {
//       street: formData.address.street,
//       area: formData.address.area,
//       city: formData.address.city,
//       state: formData.address.state,
//       pincode: formData.address.pincode,
//       landmark: formData.address.landmark
//     },
//     description: formData.additionalInfo,
//     haveParentsOfThisPet: formData.haveParentsOfThisPet,
//     doesThisPetHaveParents: formData.haveParentsOfThisPet ,
//     father: formData.fatherId,
//     mother: formData.motherId,
//     petVariety: formData.skills,
//   };

//     setIsLoading(true);
//     setApiProcessing({ loader: true, message: "Saving profile..." });

//     try {
//       let response;
//       if (!petData) {
//         response = await webApi.post("vendorPetSales/create", payload);
//         console.log("Create response:", response);
//       } else {
//         response = await webApi.put(`vendorPetSales/update/${petData.id}`, payload);
//         console.log("Update response:", response);
//       }

//       if (response.status === "success" || response.status === 200) {
//         const petId = response.data?.petProfile?.id || response.data?.id || petData?.id;

//         if (petId) {
//           for (const file of imageFiles) {
//             if (file && file !== "existing") {
//               const fd = new FormData();
//               fd.append("morePhotos", file);
//               try {
//                 await webApi.imagePut(`vendorPetSales/morePhotos/${petId}`, fd);
//               } catch (err) {
//                 console.error("Image upload failed:", err);
//               }
//             }
//           }

//           for (const file of videoFiles) {
//             if (file && file !== "existing") {
//               const fd = new FormData();
//               fd.append("moreVideos", file);
//               try {
//                 await webApi.imagePut(`vendorPetSales/moreVideos/${petId}`, fd);
//               } catch (err) {
//                 console.error("Video upload failed:", err);
//               }
//             }
//           }
//         }

//         setErrorMessage("");
//         toast.success(petData ? "Pet updated successfully" : "Pet added successfully");

//         if (fetchPetData) {
//           fetchPetData();
//         }

//         closePopup();
//       } else {
//         setErrorMessage(response.message || "Failed to save profile.");
//         toast.error(response.message || "Failed to save profile.");
//       }
//     } catch (err) {
//       console.error("Submit Error:", err);
//       const errorMsg = err.response?.data?.message || "An error occurred while saving.";
//       setErrorMessage(errorMsg);
//       toast.error(errorMsg);
//     } finally {
//       setIsLoading(false);
//       setApiProcessing({ loader: false, message: "" });
//     }
//   };

//   const sizeOptions = useMemo(() => {
//     if (petData && formData.size && formData.size !== "select size" && formData.size !== "") {
//       return [formData.size];
//     }
//     if (!petData && formData.breed !== "select" && formData.size && formData.size !== "select size" && formData.size !== "") {
//       return [formData.size];
//     }
//     return ["select size", "Toy", "Small", "Medium", "Large", "Giant"];
//   }, [petData, formData.breed, formData.size]);

//   const MAX_IMAGES = 3;
//   const MAX_VIDEOS = 3;

//   return (
//     <div className={styles.popupContainer} style={{ background: "#fff", borderRadius: "10px", width: "100%", position: "relative" }}>
//       <div className={styles.header} style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
//         <div style={{ display: "flex", alignItems: "center", padding: "0 10px 0 0" }}>
//           <BackHeader onClick={closePopup} />
//           <h2>{petData ? "Edit Puppy" : "Add New Puppy"}</h2>
//         </div>
//         <button style={{ background: "transparent", border: "none", fontSize: "1.2rem", cursor: "pointer", padding: "20px" }} onClick={closePopup}>&#x2715;</button>
//       </div>

//       <div className={styles.mainContainer}>
//         <div className={styles.formDiv2}>
//           <DropDownv1
//             options={["select", "Dog", "Cat", "Bird", "Fish", "Small Pet"]}
//             question={"Pet Type *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
//             value={formData.petType}
//             onChange={(value) => {
//               handleInputChange("petType", value);
//               if (value && value !== "select") fetchBreeds(value);
//               else setBreedOptions([]);
//             }}
//             CustomInputElementAddpet={{ color: "#000000"}} error={errors.petType}
//           />
//           <CustomInputElement2
//             question={"Pet Name *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
//             placeholder="Enter Pet Name" type="text" value={formData.petName}
//             onChange={(e) => handleInputChange("petName", e.target.value)}
//             custommarrgin={{ marginBottom: "14px" }} error={errors.petName} ownMargin={true}
//           />
//           <DropDownv1
//             options={petData ? [formData.breed] : ["select", ...breedOptions]}
//             question={"Pet Breed *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
//             value={formData.breed} onChange={(value) => handleInputChange("breed", value)}
//             CustomInputElementAddpet={{ color: "#000000" }} error={errors.breed}
//           />
//           <CustomInputElement2
//             question={"Date Of Birth *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
//             placeholder="Date Of Birth" type="date" value={formData.dob}
//             onChange={(e) => handleInputChange("dob", e.target.value)}
//            max={todayString} custommarrgin={{ marginBottom: "14px" }} error={errors.dob} ownMargin={true}
//           />
//           <DropDownv1
//             options={["select", "Male", "Female"]} question={"Gender *"}
//             width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.petGender}
//             onChange={(value) => handleInputChange("petGender", value)}
//             CustomInputElementAddpet={{ color: "#000000" }} error={errors.petGender}
//           />
//           <DropDownv1
//             options={sizeOptions} question={"Size *"} width={isMobile ? "100%" : "48%"}
//             backgroundColor="#FFFFFF" value={formData.size || ""}
//             onChange={(value) => {
//               if (!petData) {
//                 handleInputChange("size", value === "select size" ? "" : value);
//               }
//             }}
//             CustomInputElementAddpet={{ color: "#000000" }} error={errors.size}
//           />
//           <DropDownv1
//             options={petColors} question={"Color *"} width={isMobile ? "100%" : "48%"}
//             backgroundColor="#FFFFFF" value={formData.color}
//             onChange={(value) => handleInputChange("color", value)}
//             error={errors.color}
//           />
//           <CustomInputComp
//             question={"Weight *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
//             type="text" placeholder="Enter Pet Weight" value={formData.weight}
//             onChange={(e) => {
//               const numericValue = e.target.value.replace(/[^0-9]/g, "").slice(0, 3);
//               handleInputChange("weight", numericValue);
//             }}
//             custommarrgin={{ marginBottom: "14px" }} error={errors.weight} ownMargin={true}
//             filter={formData.weight ? "weight" : ""} setFormData={setFormData} formData={formData}
//           />
//           <DropDownv1
//             options={["select", "Yes", "No"]} question={"Spayed/Neutered *"}
//             width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.spayedOrNeutered}
//             onChange={(value) => handleInputChange("spayedOrNeutered", value)}
//             CustomInputElementAddpet={{ color: "#000000" }} error={errors.spayedOrNeutered}
//           />
//           <CustomInputElement2
//             question={"Medication *"} width={isMobile ? "100%" : "48%"} type="text"
//             backgroundColor="#FFFFFF" value={formData.medication} placeholder="Enter Medication"
//             onChange={(e) => handleInputChange("medication", e.target.value)}
//             custommarrgin={{ marginBottom: "14px" }} error={errors.medication} ownMargin={true}
//           />
//           <div style={{ width: isMobile ? "100%" : "48%" }}>
//             <p>Address <span className={styles["required"]}>*</span></p>
//             <div className={styles["form-input-container"]}>
//               <AddressDropdown
//                 formData={formData}
//                 setFormData={setFormData}
//                 errors={errors}
//                 userInfo={userInfo}
//               />
//               {hasSubmitted && errors.address && (
//                 <span className={styles["error-text"]}>{errors.address}</span>
//               )}
//             </div>
//           </div>
//           <CustomInputElement2
//             question={"Price *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
//             placeholder="Enter Price" type="number" value={formData.price}
//             onChange={(e) => handleInputChange("price", e.target.value)}
//             custommarrgin={{ marginBottom: "14px" }} error={errors.price} ownMargin={true}
//           />
//         </div>

//         <div className={styles.formDiv2}>
//           <DropDownv1
//             options={["select", "Yes", "No"]} question={"Negotiable?"}
//             width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.negotiable}
//             onChange={(value) => handleInputChange("negotiable", value)}
//             CustomInputElementAddpet={{ color: "#000000" }}
//           />
//           <CustomInputElement2
//             question={"Health Condition *"} width={isMobile ? "100%" : "48%"} type="text"
//             backgroundColor="#FFFFFF" value={formData.healthCondition}
//             placeholder="Enter Health Conditions"
//             onChange={(e) => handleInputChange("healthCondition", e.target.value)}
//             custommarrgin={{ marginBottom: "14px" }} error={errors.healthCondition} ownMargin={true}
//           />
//           <CustomInputElement2
//             question={"Microchip Number"} width={isMobile ? "100%" : "48%"} type="number" max = "16"
//             backgroundColor="#FFFFFF" value={formData.microchipNo}
//             placeholder="Enter Microchip Number"
//             onChange={(e) => handleInputChange("microchipNo", e.target.value)}
//             custommarrgin={{ marginBottom: "14px" }} ownMargin={true}
//           />
//           <DropDownv1
//             options={["select", "Yes", "No"]} question={"Have Parents?"}
//             width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.haveParents}
//             onChange={(value) => handleInputChange("haveParents", value)}
//             CustomInputElementAddpet={{ color: "#000000" }}
//           />
//           <DropDownv1
//             options={["select", "Yes", "No"]} question={"Vaccinated"}
//             width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.vaccinated}
//             onChange={(value) => handleInputChange("vaccinated", value)}
//             CustomInputElementAddpet={{ color: "#000000" }}
//           />
//           {formData.vaccinated === "Yes" && (
//             <CustomInputElement2
//               question={"Type of vaccination"} width={isMobile ? "100%" : "48%"} type="text"
//               backgroundColor="#FFFFFF" value={formData.vaccineCertificate}
//               placeholder="Enter Type of Vaccination"
//               onChange={(e) => handleInputChange("vaccineCertificate", e.target.value)}
//               custommarrgin={{ marginBottom: "14px" }} ownMargin={true}
//             />
//           )}
//           <DropDownv1
//             options={["select", "Yes", "No"]} question={"KCI"} width={isMobile ? "100%" : "48%"}
//             backgroundColor="#FFFFFF" value={formData.kci}
//             onChange={(value) => handleInputChange("kci", value)}
//             CustomInputElementAddpet={{ color: "#000000" }}
//           />
//           <DropDownv1
//             options={["select", "Yes", "No"]} question={"Transport Service"}
//             width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.isTransportService}
//             onChange={(value) => handleInputChange("isTransportService", value)}
//             CustomInputElementAddpet={{ color: "#000000" }}
//           />
//           <CustomInputElement2
//             question={"How many times breeding done earlier?"} width={isMobile ? "100%" : "48%"}
//             type="number" backgroundColor="#FFFFFF" value={formData.howmanyTimesBreedingDone}
//             placeholder="Enter Breeding Count"
//             onChange={(e) => handleInputChange("howmanyTimesBreedingDone", e.target.value)}
//             custommarrgin={{ marginBottom: "14px" }} ownMargin={true}
//           />
//           <DropDownv1
//             question={"Skills"} options={["select", "Good", "Bad"]} width={isMobile ? "100%" : "48%"}
//             backgroundColor="#FFFFFF" value={formData.skills}
//             onChange={(value) => handleInputChange("skills", value)}
//             CustomInputElementAddpet={{ color: "#000000" }}
//           />
//           <DropDownv1
//             question={"Championship"} options={["select", "Yes", "No"]}
//             width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.championship}
//             onChange={(value) => handleInputChange("championship", value)}
//             CustomInputElementAddpet={{ color: "#000000" }}
//           />
//           <DropDownv1
//             question={"Events"} options={["select", "Yes", "No"]} width={isMobile ? "100%" : "48%"}
//             backgroundColor="#FFFFFF" value={formData.Events}
//             onChange={(value) => handleInputChange("Events", value)}
//             CustomInputElementAddpet={{ color: "#000000" }}
//           />
//           <CustomInputElement2
//             question={"Instagram Link"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
//             placeholder="URL" value={formData.instagramLink}
//             onChange={(e) => handleInputChange("instagramLink", e.target.value)}
//             error={errors.instagramLink} custommarrgin={{ marginBottom: "14px" }} ownMargin={true}
//           />

//           {/* Upload Section */}
//           <div className={styles.uploadSections}>
//             <div className={styles.uploadSection}>
//     <p className={styles.uploadLabel}>
//       Pet Images <span className={styles.required}>*</span>
//     </p>
//     <div className={styles["image-grid"]}>
//       {/* ✅ Use isMobile to limit slots to 1, otherwise show MAX_IMAGES */}
//       {Array.from({ length: isMobile ? 1 : MAX_IMAGES }).map((_, index) => {
//         const hasImage = !!imagePreviews[index];
//         const isMandatory = index === 0;
//         return (
//           <div key={index} className={styles["slot-column"]}>
//             {!hasImage ? (
//               <label
//                 className={`${styles["image-slot-empty"]} ${isMandatory ? styles["mandatory-border"] : ""}`}
//                 onClick={() => imageFileInputRef.current?.click()}
//                 style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", width: "100%", height: "100%", minHeight: "120px", border: isMandatory ? "2px dashed #ccc" : "1px dashed #ccc", borderRadius: "8px", backgroundColor: "#f9f9f9" }}
//               >
//                 <AddIcon />
//               </label>
//             ) : (
//               <div className={styles["image-preview-below"]} style={{ position: "relative", width: "100%", height: "100%" }}>
//                 <img src={imagePreviews[index]} alt={`pet-${index}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
//                 <button type="button" onClick={() => handleDeleteMedia(index, "photo")} style={{ position: "absolute", top: "-9px", right: "-12px", background: "rgba(0, 0, 0, 0.6)", color: "#fff", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "none", fontSize: "14px" }}>✕</button>
//               </div>
//             )}
//           </div>
//         );
//       })}
//     </div>
//     <input ref={imageFileInputRef} type="file" accept="image/*" multiple={!isMobile} hidden onChange={handleImageFileChange} />
//     {errors.images && <span className={styles["error-text"]} style={{ color: "red", fontSize: "12px", marginTop: "5px", display: "block" }}>{errors.images}</span>}
//   </div>
//             {cropperOpen && imageToCrop && (
//               <ImageCropperModal
//                 open={cropperOpen}
//                 image={imageToCrop}
//                 onClose={() => {
//                   setCropperOpen(false);
//                   setImageToCrop(null);
//                   setIsCropping(false);
//                   setFilesToCrop((prevQueue) => {
//                     const remaining = prevQueue.slice(1);
//                     if (remaining.length > 0) {
//                       setImageToCrop(remaining[0]);
//                       setCropperOpen(true);
//                     }
//                     return remaining;
//                   });
//                 }}
//                 onCropComplete={handleCropComplete}
//               />
//             )}

//             <div className={styles.uploadSection} style={{ marginTop: isMobile ? "10px" : "0" }}>
//     <p className={styles.uploadLabel}>Pet Videos <span style={{ color: "#666" }}>(Optional)</span></p>
//     <div className={styles["image-grid"]}>
//       {/* Use isMobile to limit slots to 1, otherwise show MAX_VIDEOS */}
//       {Array.from({ length: isMobile ? 1 : MAX_VIDEOS }).map((_, index) => {
//         const hasVideo = !!videoPreviews[index];
//         return (
//           <div key={index} className={styles["slot-column"]}>
//             {!hasVideo ? (
//               <label className={styles["image-slot-empty"]} onClick={() => videoFileInputRef.current?.click()} style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", width: "100%", height: "100%", minHeight: "120px", border: "2px dashed #ccc", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
//                 <div style={{ fontSize: "32px", marginBottom: "8px" }}>+</div>
//                 <div style={{ fontSize: "12px", textAlign: "center" }}>Add Video</div>
//               </label>
//             ) : (
//               <div className={styles["image-preview-below"]} style={{ position: "relative", width: "100%", height: "100%" }}>
//                 <video src={videoPreviews[index]} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} controls />
//                 <button type="button" onClick={() => handleDeleteMedia(index, "video")} style={{ position: "absolute", top: "-9px", right: "-12px", background: "rgba(0, 0, 0, 0.6)", color: "#fff", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "none", fontSize: "14px" }}>✕</button>
//               </div>
//             )}
//           </div>
//         );
//       })}
//     </div>
//     <input ref={videoFileInputRef} type="file" accept="video/*" multiple={!isMobile} hidden onChange={handleVideoFileChange} />
//     {errors.videos && <span className={styles["error-text"]} style={{ color: "red", fontSize: "12px", marginTop: "5px", display: "block" }}>{errors.videos}</span>}
//   </div>
// </div>
//           <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
//             <div className={styles.deskSubmit}>
//               <div className={styles.mobSubmit}>
//                 <button className={styles.submitButton} onClick={handleSubmit} disabled={apiProcessing.loader || isLoading} style={{ background: "#F5790C", color: "white", padding: "10px 20px", borderRadius: "5px", border: "none", cursor: "pointer", fontSize: "16px" }}>
//                   {apiProcessing.loader || isLoading ? "Saving..." : (petData ? "Save" : "Add Pet")}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AddNewPuppyPopup;



// import useStore from "@/components/state/useStore";
// import { WebApimanager } from "@/components/utilities/WebApiManager";
// import React, { useEffect, useRef, useState, useMemo } from "react";
// import styles from "../../styles/register/settingsregister.module.css";
// import { AddIcon } from "@/public/images/SVG";
// import ImageCropperModal from "@/components/register/imageCropperModule";
// import CustomInputElement2 from "@/components/register/customInputcom";
// import DropDownv1 from "@/components/register/dropdown";
// import CustomInputComp from "@/components/register/customInput";
// import BackHeader from "@/components/pet-sales/backHeader";
// import AddressDropdown from "./addAddressDropDown";
// import Cookies from "js-cookie";
// import { toast } from "sonner";
// import { IMAGE_URL } from "@/components/utilities/Constants";

// const calculateAge = (dateOfBirth) => {
//   if (!dateOfBirth) return "";
//   const dobDate = new Date(dateOfBirth);
//   const today = new Date();
//   let years = today.getFullYear() - dobDate.getFullYear();
//   let months = today.getMonth() - dobDate.getMonth();
//   if (months < 0) {
//     years--;
//     months += 12;
//   }
//   if (years < 0) return "0 years 0 months";
//   return `${years} years ${months} month${months !== 1 ? "s" : ""}`;
// };

// const AddNewPuppyPopup = ({
//   closePopup,
//   petData,
//   fetchPetData = () => {},
// }) => {
//   const { getJwtToken, getUserInfo } = useStore();
//   const jwt = getJwtToken();
//   const webApi = new WebApimanager(jwt);
//   const userInfo = getUserInfo();

//   const imageFileInputRef = useRef(null);
//   const videoFileInputRef = useRef(null);
//   const isProcessingCrop = useRef(false);
//   const blobUrlsRef = useRef([]);

//   const [imageFiles, setImageFiles] = useState([]);
//   const [imagePreviews, setImagePreviews] = useState([]);
//   const [videoFiles, setVideoFiles] = useState([]);
//   const [videoPreviews, setVideoPreviews] = useState([]);

//   const [cropperOpen, setCropperOpen] = useState(false);
//   const [imageToCrop, setImageToCrop] = useState(null);
//   const [filesToCrop, setFilesToCrop] = useState([]);
//   const [isCropping, setIsCropping] = useState(false);

//   const [breedOptions, setBreedOptions] = useState([]);
//   const [breed, setBreed] = useState([]);
//   const [errorMessage, setErrorMessage] = useState("");
//   const [errors, setErrors] = useState({});
//   const [locationDetails, setLocationDetails] = useState("");
//   const [apiProcessing, setApiProcessing] = useState({ loader: false, message: "Loading..." });
//   const [isMobile, setIsMobile] = useState(false);
//   const [hasSubmitted, setHasSubmitted] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [vaccinationsList, setVaccinationsList] = useState([]);

//   const selectedLocation = useStore((s) => s.selectedLocation);
//   const selectedCountryName = useStore((s) => s.selectedCountryName);

//   const petColors = [
//     "Select Color", "Black", "White", "Brown", "Red", "Gold", "Cream", "Yellow",
//     "Gray", "Blue", "Fawn", "Tan", "Buff", "Brindle", "Merle", "Harlequin",
//     "Sable", "Bicolor", "Tricolor", "Tuxedo", "Roan", "Spotted", "Ticked",
//     "Particolor", "Blenheim", "Domino",
//   ];

//   const vaccinationOptions = [
//     "Rabies",
//     "DHLPP",
//     "Bordetella",
//     "Leptospirosis",
//     "Lyme Disease",
//     "Canine Influenza",
//     "Parvovirus",
//     "Distemper",
//     "Adenovirus",
//     "Parainfluenza"
//   ];

//   const [formData, setFormData] = useState({
//     petName: "", petAge: "", petType: "", color: "", breed: "", additionalInfo: "",
//     weight: "", vaccinated: null, kci: null, championship: "", Events: "", skills: "",
//     instagramLink: "", petGender: "", vaccineCertificate: "", kciCertificate: "",
//     dateOfBirth: "", spayedOrNeutered: "", medication: "", size: "", healthCondition: "",
//     petWeightIn: "", microchipNo: "", howmanyTimesBreedingDone: "",
//     addressId: "",
//     address: {
//       street: "",
//       area: "",
//       city: "",
//       state: "",
//       pincode: "",
//       landmark: ""
//     },
//     isTransportService: "", price: "", haveParents: "select",
//     negotiable: "", father: "", mother: "", petVariety: "", numberVisibility: false,
//     howManyVaccinationsDone: []
//   });

//   useEffect(() => {
//     return () => {
//       blobUrlsRef.current.forEach((url) => {
//         if (url && url.startsWith("blob:")) {
//           URL.revokeObjectURL(url);
//         }
//       });
//     };
//   }, []);

//   useEffect(() => {
//     if (selectedLocation) setLocationDetails(selectedLocation);
//   }, [selectedLocation]);

//   useEffect(() => {
//     if (selectedLocation) return;
//     try {
//       const userLocation = Cookies.get("user_location");
//       if (!userLocation) return;
//       const locationObj = JSON.parse(userLocation);
//       let { city, region } = locationObj || {};
//       if (city) city = decodeURIComponent(city);
//       if (region) region = decodeURIComponent(region);
//       let loc = "";
//       if (city && city !== "Unknown") loc += city;
//       if (region && region !== "Unknown") loc += loc ? `, ${region}` : region;
//       if (!loc) loc = "Unknown Location";
//       setLocationDetails(loc);
//     } catch (_) {}
//   }, [selectedLocation]);

//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       const handleResize = () => setIsMobile(window.innerWidth <= 768);
//       handleResize();
//       window.addEventListener("resize", handleResize);
//       return () => window.removeEventListener("resize", handleResize);
//     }
//   }, []);

//   // Populate form when editing
//   useEffect(() => {
//     if (petData) {
//       // const selectedAddress = userInfo?.addresses?.find(
//       //   (addr) => addr.id?.toString() === petData?.addressId?.toString() ||
//       //     addr._id?.toString() === petData?.addressId?.toString()
//       // ) || userInfo?.addresses?.[0];

//       setFormData({
//         petName: petData.petName || "",
//         petAge: petData.petAge || "",
//         petType: petData.petType || "",
//         color: petData.color || "",
//         breed: petData.breed || "",
//         additionalInfo: petData.description || petData.additionalInfo || "",
//         weight: petData?.weight?.endsWith("kg") || petData?.weight?.endsWith("lb")
//           ? petData.weight.split(" ")[0]
//           : petData?.weight || "",
//         petWeightIn: petData?.weight?.endsWith("kg") ? "kg" : "lb",
//         vaccinated: petData.vaccinated || null,
//         kci: petData.kciRegistration || petData.kci || "",
//         championship: petData.championship || "",
//         Events: petData.Events || "",
//         skills: petData.skills || "",
//         instagramLink: petData.instagramLink || "",
//         petGender: petData.petGender || "",
//         vaccineCertificate: petData.vaccineCertificate || "",
//         kciCertificate: petData.kciCertificate || "",
//         spayedOrNeutered: petData.spayedOrNeutered || "",
//         dateOfBirth: petData?.dateOfBirth?.slice(0, 10) || petData?.birthday?.slice(0, 10) || "",
//         medication: petData.medication || "",
//         size: petData.size || "",
//         healthCondition: petData.healthCondition || petData.doesYourPetHasAnyHealthIssues || "",
//         microchipNo: petData.microchipNo || "",
//         howmanyTimesBreedingDone: petData.howmanyTimesBreedingDone || "",
//         // addressId: selectedAddress?.id?.toString() || petData?.addressId?.toString() || "",
//         address: {
//           street: petData?.address?.street || "",
//           area: petData?.address?.area || "",
//           city: petData?.address?.city || "",
//           state: petData?.address?.state || "",
//           pincode: petData?.address?.pincode || "",
//           landmark: petData?.address?.landmark || ""
//         },
//         isTransportService: petData.transportService || "",
//         price: petData.price || "",
//         haveParents: petData.doesThisPetHaveParents === "Both" ? "Yes" : (petData.doesThisPetHaveParents || "select"),
//         negotiable: petData.negotiable || "",
//         father: petData.father || "",
//         mother: petData.mother || "",
//         petVariety: petData.petVariety || petData.petsVariety || "",
//         numberVisibility: petData.numberVisibility === "on",
//         howManyVaccinationsDone: petData.howManyVaccinationsDone || []
//       });

//       // Show existing images from server
//       if (petData.morePhotos && petData.morePhotos.length > 0) {
//         const imageUrls = petData.morePhotos.map(photo => {
//           const baseUrl = IMAGE_URL.endsWith('/') ? IMAGE_URL : `${IMAGE_URL}/`;
//           const cleanPath = photo.startsWith('/') ? photo.slice(1) : photo;
//           return `${baseUrl}${cleanPath}`;
//         });
//         setImagePreviews(imageUrls);
//         setImageFiles(Array(petData.morePhotos.length).fill("existing"));
//       }
//       if (petData.moreVideos && petData.moreVideos.length > 0) {
//         const videoUrls = petData.moreVideos.map(video => {
//           const baseUrl = IMAGE_URL.endsWith('/') ? IMAGE_URL : `${IMAGE_URL}/`;
//           const cleanPath = video.startsWith('/') ? video.slice(1) : video;
//           return `${baseUrl}${cleanPath}`;
//         });
//         setVideoPreviews(videoUrls);
//         setVideoFiles(Array(petData.moreVideos.length).fill("existing"));
//       }
//     } else {
//       setFormData({
//         petName: "", petAge: "", petType: "", color: "", breed: "", additionalInfo: "",
//         weight: "", vaccinated: null, kci: "", championship: "", Events: "", skills: "",
//         instagramLink: "", petGender: "", vaccineCertificate: "", kciCertificate: "",
//         dateOfBirth: "", spayedOrNeutered: "", medication: "", size: "", healthCondition: "",
//         petWeightIn: "", microchipNo: "", howmanyTimesBreedingDone: "",
//         addressId: "",
//         address: {
//           street: "",
//           area: "",
//           city: "",
//           state: "",
//           pincode: "",
//           landmark: ""
//         },
//         isTransportService: "", price: "", haveParents: "select",
//         negotiable: "", father: "", mother: "", petVariety: "", numberVisibility: false,
//         howManyVaccinationsDone: []
//       });
//       setImageFiles([]);
//       setImagePreviews([]);
//       setVideoFiles([]);
//       setVideoPreviews([]);
//       setErrorMessage("");
//     }
//   }, [petData, userInfo]);

//   // Clear address error as soon as an address is selected/added
//   useEffect(() => {
//     if (formData.addressId) {
//       setErrors((prev) => {
//         const { address, ...rest } = prev;
//         if (!hasSubmitted) {
//           const { file, video } = rest;
//           return { file: file || "", video: video || "" };
//         }
//         return rest;
//       });
//     }
//   }, [formData.addressId, hasSubmitted]);

//   // Fetch breeds when editing
//   useEffect(() => {
//     if (petData?.petType && breedOptions.length === 0) {
//       fetchBreeds(petData.petType);
//     }
//   }, [petData?.petType]);

//   // Auto-fill size from breed (only for new pets)
//   useEffect(() => {
//     if (petData) return;
//     if (formData.breed && formData.breed !== "select" && breed.length > 0) {
//       const selectedBreed = breed.find((b) => b["breedName"] === formData.breed);
//       if (selectedBreed?.size) {
//         setFormData((prev) => ({ ...prev, size: selectedBreed.size.trim() }));
//         setErrors((prev) => ({ ...prev, size: "" }));
//       } else {
//         setFormData((prev) => ({ ...prev, size: "select" }));
//       }
//     }
//   }, [breed, formData.breed, petData]);

//   // Auto-calculate age from DOB
//   useEffect(() => {
//     if (formData.dateOfBirth) {
//       const age = calculateAge(formData.dateOfBirth);
//       setFormData((prev) => {
//         if (prev.petAge === age) return prev;
//         return { ...prev, petAge: age };
//       });
//     }
//   }, [formData.dateOfBirth]);

//   const instagramRegex = /^(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/[A-Za-z0-9._%-]+\/?$/;

//   const handleVictoriaInfoChange = (inputValue) => {
//     setFormData((prev) => ({ ...prev, additionalInfo: inputValue }));
//   };

//   const handleInputChange = (field, value) => {
//     if (field === "weight") value = value.replace(/[^0-9]/g, "");
//     if (field === "instagramLink") {
//       setErrors((prev) => ({
//         ...prev,
//         instagramLink: value && !instagramRegex.test(value)
//           ? "Please check your Instagram URL & enter a valid Instagram URL (ex: https://instagram.com/john_doe)"
//           : "",
//       }));
//     }
//     if (field === "dateOfBirth") {
//       const selectedDate = new Date(value);
//       const today = new Date();
//       if (selectedDate > today) {
//         setErrors(prev => ({ ...prev, dateOfBirth: "Date of Birth cannot be in the future." }));
//       } else {
//         setErrors(prev => ({ ...prev, dateOfBirth: "" }));
//       }
//     }
//     setFormData((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleVaccinationChange = (e) => {
//     const value = e.target.value;
//     const currentVaccinations = [...formData.howManyVaccinationsDone];
    
//     if (currentVaccinations.includes(value)) {
//       setFormData(prev => ({
//         ...prev,
//         howManyVaccinationsDone: currentVaccinations.filter(v => v !== value)
//       }));
//     } else {
//       setFormData(prev => ({
//         ...prev,
//         howManyVaccinationsDone: [...currentVaccinations, value]
//       }));
//     }
//   };

//   const fetchBreeds = async (petType) => {
//     try {
//       const response = await webApi.get(`breeds?petType=${petType}`);
//       if (response.status === 200) {
//         setBreedOptions(response.data.data.map((b) => b?.["breedName"]));
//         setBreed(response.data.data);
//       }
//     } catch (error) {
//       console.log(error.message);
//     }
//   };

//   const handleImageFileChange = (e) => {
//     const files = Array.from(e.target.files);
//     e.target.value = "";

//     if (errors.images) setErrors((prev) => ({ ...prev, images: "" }));

//     const remainingSlots = 4 - imageFiles.length;
//     if (remainingSlots <= 0) {
//       setErrors((prev) => ({ ...prev, images: `Maximum 4 images allowed.` }));
//       return;
//     }

//     const validFiles = [];
//     for (const file of files) {
//       if (!file.type.startsWith("image/")) {
//         setErrors((prev) => ({ ...prev, images: "Please upload valid image files." }));
//         return;
//       }
//       const isDuplicate = imageFiles.some(
//         (f) => typeof f !== "string" && f.name === file.name && f.size === file.size
//       );
//       if (!isDuplicate) validFiles.push(file);
//     }

//     if (!validFiles.length) return;

//     const queue = validFiles.slice(0, remainingSlots);
//     setFilesToCrop(queue);
//     setImageToCrop(queue[0]);
//     setCropperOpen(true);
//     setIsCropping(true);
//   };

//   const handleCropComplete = (croppedBlob) => {
//     if (isProcessingCrop.current) return;
//     isProcessingCrop.current = true;

//     try {
//       const croppedFile = new File(
//         [croppedBlob],
//         `cropped-${Date.now()}.jpg`,
//         { type: "image/jpeg" }
//       );

//       const previewUrl = URL.createObjectURL(croppedFile);
//       blobUrlsRef.current.push(previewUrl);

//       setImageFiles((prev) => [...prev, croppedFile].slice(0, 4));
//       setImagePreviews((prev) => [...prev, previewUrl].slice(0, 4));

//       if (errors.images) setErrors((prev) => ({ ...prev, images: "" }));

//       setFilesToCrop((prevQueue) => {
//         const remaining = prevQueue.slice(1);
//         if (remaining.length > 0) {
//           setImageToCrop(remaining[0]);
//           setCropperOpen(true);
//           setIsCropping(true);
//         } else {
//           setImageToCrop(null);
//           setCropperOpen(false);
//           setIsCropping(false);
//         }
//         return remaining;
//       });
//     } catch (error) {
//       console.error("Error in crop complete:", error);
//     } finally {
//       setTimeout(() => { isProcessingCrop.current = false; }, 500);
//     }
//   };

//   const handleCropCancel = () => {
//     isProcessingCrop.current = false;
//     setIsCropping(false);
//     setFilesToCrop((prevQueue) => {
//       const remaining = prevQueue.slice(1);
//       if (remaining.length > 0) {
//         setImageToCrop(remaining[0]);
//         setCropperOpen(true);
//         setIsCropping(true);
//       } else {
//         setImageToCrop(null);
//         setCropperOpen(false);
//         setIsCropping(false);
//       }
//       return remaining;
//     });
//   };

//   const todayString = new Date().toISOString().split("T")[0];

//   const handleDeleteMedia = async (index, type) => {
//     const isPhoto = type === "photo";
//     const files = isPhoto ? imageFiles : videoFiles;
//     const fileToRemove = files[index];

//     if (fileToRemove === "existing") {
//       const confirmDelete = window.confirm(`Permanently delete this ${type}?`);
//       if (!confirmDelete) return;

//       try {
//         setApiProcessing({ loader: true, message: `Deleting ${type}...` });
//         const endpoint = isPhoto 
//           ? `vendorPetSales/deleteMedia/${petData.id}?type=photo&index=${index}` 
//           : `vendorPetSales/deleteMedia/${petData.id}?type=video&index=${index}`;
//         const response = await webApi.delete(endpoint);

//         if (response.status === "success" || response.status === 200) {
//           await fetchPetData();
//         } else {
//           setErrorMessage(response.message || "Server failed to delete item.");
//           return;
//         }
//       } catch (error) {
//         setErrorMessage(error.response?.data?.message || "Failed to delete from server.");
//         return;
//       } finally {
//         setApiProcessing({ loader: false, message: "" });
//       }
//     }

//     if (isPhoto) {
//       setImageFiles((prev) => prev.filter((_, i) => i !== index));
//       setImagePreviews((prev) => {
//         const url = prev[index];
//         if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
//         return prev.filter((_, i) => i !== index);
//       });
//     } else {
//       setVideoFiles((prev) => prev.filter((_, i) => i !== index));
//       setVideoPreviews((prev) => {
//         const url = prev[index];
//         if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
//         return prev.filter((_, i) => i !== index);
//       });
//     }
//   };

//   const handleVideoFileChange = (e) => {
//     const files = Array.from(e.target.files);
//     e.target.value = "";

//     if (errors.videos) setErrors((prev) => ({ ...prev, videos: "" }));

//     const remainingSlots = 3 - videoFiles.length;
//     if (remainingSlots <= 0) {
//       setErrors((prev) => ({ ...prev, videos: `Maximum 3 videos allowed.` }));
//       return;
//     }

//     const validFiles = [];
//     for (const file of files) {
//       if (!file.type.startsWith("video/")) {
//         setErrors((prev) => ({ ...prev, videos: "Please upload valid video files." }));
//         return;
//       }
//       const isDuplicate = videoFiles.some(
//         (f) => f.name === file.name && f.size === file.size
//       );
//       if (!isDuplicate) validFiles.push(file);
//     }

//     if (!validFiles.length) return;

//     const toAdd = validFiles.slice(0, remainingSlots);
//     const previews = toAdd.map((f) => {
//       const url = URL.createObjectURL(f);
//       blobUrlsRef.current.push(url);
//       return url;
//     });

//     setVideoFiles((prev) => [...prev, ...toAdd].slice(0, 3));
//     setVideoPreviews((prev) => [...prev, ...previews].slice(0, 3));
//   };

//   const validate = () => {
//     const newErrors = {};
//     if (!formData.petName?.trim()) newErrors.petName = "Pet Name is required.";
//     if (imageFiles.length === 0) newErrors.images = "Please upload at least 1 image.";
//     if (!formData.dateOfBirth?.trim()) newErrors.dateOfBirth = "Date of Birth is required.";
//     if (!formData.color?.trim() || formData.color === "Select Color") newErrors.color = "Pet color is required.";
//     if (!formData.medication?.trim()) newErrors.medication = "Medication is required.";
//     if (!String(formData.weight).trim()) newErrors.weight = "Pet weight is required.";
//     else if (!formData.petWeightIn) newErrors.weight = "Select pet weight type";
//     if (!formData.petType || formData.petType === "select") newErrors.petType = "Pet Type is required.";
//     if (!formData.petGender || formData.petGender === "select") newErrors.petGender = "Pet Gender is required.";
//     if (!formData.breed || formData.breed === "select") newErrors.breed = "Pet Breed is required.";
//     if (!formData.addressId) newErrors.address = "Address is required.";
//     if (formData.instagramLink && !instagramRegex.test(formData.instagramLink))
//       newErrors.instagramLink = "Please check your Instagram URL & enter a valid Instagram URL";
//     if (!formData.spayedOrNeutered || formData.spayedOrNeutered === "select") 
//       newErrors.spayedOrNeutered = "Spayed/Neutered is required.";
//     if (!formData.price?.trim()) newErrors.price = "Price is required.";
//     if (!formData.healthCondition?.trim()) newErrors.healthCondition = "Health condition is required.";
    
//     return newErrors;
//   };

//   const handleSubmit = async () => {
//     setHasSubmitted(true);

//     const newErrors = validate();

//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors);
//       setTimeout(() => {
//         const firstErrorElement = document.querySelector(`.${styles["error-text"]}`);
//         if (firstErrorElement) {
//           firstErrorElement.scrollIntoView({ behavior: "smooth", block: "center" });
//         }
//       }, 100);
//       return;
//     }

//     setErrors({});
//     setErrorMessage("");

//     // Get selected address details
//     const selectedAddressObj = userInfo?.addresses?.find(
//       addr => addr.id?.toString() === formData.addressId?.toString() ||
//         addr._id?.toString() === formData.addressId?.toString()
//     );

//     // Format address exactly as required by API
//     const addressPayload = {
//       street: selectedAddressObj?.flatOrHouseNoOrBuildingOrCompanyOrApartment || formData.address?.street || "",
//       area: selectedAddressObj?.areaOrStreetOrSectorOrVillage || formData.address?.area || "",
//       city: selectedAddressObj?.townOrCity || formData.address?.city || "",
//       state: selectedAddressObj?.state || formData.address?.state || "",
//       pincode: selectedAddressObj?.pinCode || formData.address?.pincode || "",
//       landmark: selectedAddressObj?.landmark || formData.address?.landmark || ""
//     };

//     const payload = {
//       petName: formData.petName,
//       petType: formData.petType,
//       breed: formData.breed,
//       color: formData.color,
//       petGender: formData.petGender,
//       size: formData.size,
//       petAge: formData.petAge,
//       weight: `${formData.weight} ${formData.petWeightIn}`,
//       dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
//       price: formData.price,
//       negotiable: formData.negotiable || "No",
//       vaccinated: formData.vaccinated || "No",
//       howManyVaccinationsDone: formData.howManyVaccinationsDone || [],
//       microchipNo: formData.microchipNo || "",
//       kciRegistration: formData.kci || "No",
//       transportService: formData.isTransportService || "No",
//       petStatus: petData?.petStatus || "Ready for Sale",
//       address: addressPayload,
//       description: formData.additionalInfo || "",
//       haveParentsOfThisPet: formData.haveParents === "Yes" ? "Yes" : "No",
//       doesThisPetHaveParents: formData.haveParents === "Yes" ? "Both" : "No",
//       father: formData.father ? Number(formData.father) : null,
//       mother: formData.mother ? Number(formData.mother) : null,
//       petVariety: formData.petVariety || "",
//       numberVisibility: formData.numberVisibility ? "on" : "off"
//     };

//     setIsLoading(true);
//     setApiProcessing({ loader: true, message: "Saving profile..." });

//     try {
//       let response;
//       if (!petData) {
//         response = await webApi.post("vendorPetSales/create", payload);
//         console.log("Create response:", response);
//       } else {
//         response = await webApi.put(`vendorPetSales/update/${petData.id}`, payload);
//         console.log("Update response:", response);
//       }

//       if (response.status === "success" || response.status === 200) {
//         const petId = response.data?.petProfile?.id || response.data?.id || petData?.id;

//         if (petId) {
//           // Upload Images
//           for (const file of imageFiles) {
//             if (file && file !== "existing") {
//               const fd = new FormData();
//               fd.append("morePhotos", file);
//               try {
//                 await webApi.imagePut(`vendorPetSales/morePhotos/${petId}`, fd);
//               } catch (err) {
//                 console.error("Image upload failed:", err);
//               }
//             }
//           }

//           // Upload Videos
//           for (const file of videoFiles) {
//             if (file && file !== "existing") {
//               const fd = new FormData();
//               fd.append("moreVideos", file);
//               try {
//                 await webApi.imagePut(`vendorPetSales/moreVideos/${petId}`, fd);
//               } catch (err) {
//                 console.error("Video upload failed:", err);
//               }
//             }
//           }
//         }

//         setErrorMessage("");
//         toast.success(petData ? "Pet updated successfully" : "Pet added successfully");

//         if (fetchPetData) {
//           await fetchPetData();
//         }

//         closePopup();
//       } else {
//         setErrorMessage(response.message || "Failed to save profile.");
//         toast.error(response.message || "Failed to save profile.");
//       }
//     } catch (err) {
//       console.error("Submit Error:", err);
//       const errorMsg = err.response?.data?.message || "An error occurred while saving.";
//       setErrorMessage(errorMsg);
//       toast.error(errorMsg);
//     } finally {
//       setIsLoading(false);
//       setApiProcessing({ loader: false, message: "" });
//     }
//   };

//   const sizeOptions = useMemo(() => {
//     if (petData && formData.size && formData.size !== "select size" && formData.size !== "") {
//       return [formData.size];
//     }
//     if (!petData && formData.breed !== "select" && formData.size && formData.size !== "select size" && formData.size !== "") {
//       return [formData.size];
//     }
//     return ["select size", "Toy", "Small", "Medium", "Large", "Giant"];
//   }, [petData, formData.breed, formData.size]);

//   const MAX_IMAGES = 3;
//   const MAX_VIDEOS = 3;

//   return (
//     <div className={styles.popupContainer} style={{ background: "#fff", borderRadius: "10px", width: "100%", position: "relative" }}>
//       <div className={styles.header} style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
//         <div style={{ display: "flex", alignItems: "center", padding: "0 10px 0 0" }}>
//           <BackHeader onClick={closePopup} />
//           <h2>{petData ? "Edit Puppy" : "Add New Puppy"}</h2>
//         </div>
//         <button style={{ background: "transparent", border: "none", fontSize: "1.2rem", cursor: "pointer", padding: "20px" }} onClick={closePopup}>&#x2715;</button>
//       </div>

//       <div className={styles.mainContainer}>
//         <div className={styles.formDiv2}>
//           <DropDownv1
//             options={["select", "Dog", "Cat", "Bird", "Fish", "Small Pet"]}
//             question={"Pet Type *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
//             value={formData.petType}
//             onChange={(value) => {
//               handleInputChange("petType", value);
//               if (value && value !== "select") fetchBreeds(value);
//               else setBreedOptions([]);
//             }}
//             CustomInputElementAddpet={{ color: "#000000"}} error={errors.petType}
//           />
//           <CustomInputElement2
//             question={"Pet Name *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
//             placeholder="Enter Pet Name" type="text" value={formData.petName}
//             onChange={(e) => handleInputChange("petName", e.target.value)}
//             custommarrgin={{ marginBottom: "14px" }} error={errors.petName} ownMargin={true}
//           />
//           <DropDownv1
//             options={petData ? [formData.breed] : ["select", ...breedOptions]}
//             question={"Pet Breed *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
//             value={formData.breed} onChange={(value) => handleInputChange("breed", value)}
//             CustomInputElementAddpet={{ color: "#000000" }} error={errors.breed}
//           />
//           <CustomInputElement2
//             question={"Date Of Birth *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
//             placeholder="Date Of Birth" type="date" value={formData.dateOfBirth}
//             onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
//             max={todayString} custommarrgin={{ marginBottom: "14px" }} error={errors.dateOfBirth} ownMargin={true}
//           />
//           <DropDownv1
//             options={["select", "Male", "Female"]} question={"Gender *"}
//             width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.petGender}
//             onChange={(value) => handleInputChange("petGender", value)}
//             CustomInputElementAddpet={{ color: "#000000" }} error={errors.petGender}
//           />
//           <DropDownv1
//             options={sizeOptions} question={"Size *"} width={isMobile ? "100%" : "48%"}
//             backgroundColor="#FFFFFF" value={formData.size || ""}
//             onChange={(value) => {
//               if (!petData) {
//                 handleInputChange("size", value === "select size" ? "" : value);
//               }
//             }}
//             CustomInputElementAddpet={{ color: "#000000" }} error={errors.size}
//           />
//           <DropDownv1
//             options={petColors} question={"Color *"} width={isMobile ? "100%" : "48%"}
//             backgroundColor="#FFFFFF" value={formData.color}
//             onChange={(value) => handleInputChange("color", value)}
//             error={errors.color}
//           />
//           <CustomInputComp
//             question={"Weight *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
//             type="text" placeholder="Enter Pet Weight" value={formData.weight}
//             onChange={(e) => {
//               const numericValue = e.target.value.replace(/[^0-9]/g, "").slice(0, 3);
//               handleInputChange("weight", numericValue);
//             }}
//             custommarrgin={{ marginBottom: "14px" }} error={errors.weight} ownMargin={true}
//             filter={formData.weight ? "weight" : ""} setFormData={setFormData} formData={formData}
//           />
//           <DropDownv1
//             options={["select", "Yes", "No"]} question={"Spayed/Neutered *"}
//             width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.spayedOrNeutered}
//             onChange={(value) => handleInputChange("spayedOrNeutered", value)}
//             CustomInputElementAddpet={{ color: "#000000" }} error={errors.spayedOrNeutered}
//           />
//           <CustomInputElement2
//             question={"Medication *"} width={isMobile ? "100%" : "48%"} type="text"
//             backgroundColor="#FFFFFF" value={formData.medication} placeholder="Enter Medication"
//             onChange={(e) => handleInputChange("medication", e.target.value)}
//             custommarrgin={{ marginBottom: "14px" }} error={errors.medication} ownMargin={true}
//           />
//           <div style={{ width: isMobile ? "100%" : "48%" }}>
//             <p>Address <span className={styles["required"]}>*</span></p>
//             <div className={styles["form-input-container"]}>
//               <AddressDropdown
//                 formData={formData}
//                 setFormData={setFormData}
//                 errors={errors}
//                 userInfo={userInfo}
//               />
//               {hasSubmitted && errors.address && (
//                 <span className={styles["error-text"]}>{errors.address}</span>
//               )}
//             </div>
//           </div>
//           <CustomInputElement2
//             question={"Price *"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
//             placeholder="Enter Price" type="number" value={formData.price}
//             onChange={(e) => handleInputChange("price", e.target.value)}
//             custommarrgin={{ marginBottom: "14px" }} error={errors.price} ownMargin={true}
//           />
//         </div>

//         <div className={styles.formDiv2}>
//           <DropDownv1
//             options={["select", "Yes", "No"]} question={"Negotiable?"}
//             width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.negotiable}
//             onChange={(value) => handleInputChange("negotiable", value)}
//             CustomInputElementAddpet={{ color: "#000000" }}
//           />
//           <CustomInputElement2
//             question={"Health Condition *"} width={isMobile ? "100%" : "48%"} type="text"
//             backgroundColor="#FFFFFF" value={formData.healthCondition}
//             placeholder="Enter Health Conditions"
//             onChange={(e) => handleInputChange("healthCondition", e.target.value)}
//             custommarrgin={{ marginBottom: "14px" }} error={errors.healthCondition} ownMargin={true}
//           />
//           <CustomInputElement2
//             question={"Microchip Number"} width={isMobile ? "100%" : "48%"} type="number"
//             backgroundColor="#FFFFFF" value={formData.microchipNo}
//             placeholder="Enter Microchip Number"
//             onChange={(e) => handleInputChange("microchipNo", e.target.value)}
//             custommarrgin={{ marginBottom: "14px" }} ownMargin={true}
//           />
//           <DropDownv1
//             options={["select", "Yes", "No"]} question={"Have Parents?"}
//             width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.haveParents}
//             onChange={(value) => handleInputChange("haveParents", value)}
//             CustomInputElementAddpet={{ color: "#000000" }}
//           />
//           <CustomInputElement2
//             question={"Father ID"} width={isMobile ? "100%" : "48%"} type="number"
//             backgroundColor="#FFFFFF" value={formData.father}
//             placeholder="Enter Father Pet ID"
//             onChange={(e) => handleInputChange("father", e.target.value)}
//             custommarrgin={{ marginBottom: "14px" }} ownMargin={true}
//           />
//           <CustomInputElement2
//             question={"Mother ID"} width={isMobile ? "100%" : "48%"} type="number"
//             backgroundColor="#FFFFFF" value={formData.mother}
//             placeholder="Enter Mother Pet ID"
//             onChange={(e) => handleInputChange("mother", e.target.value)}
//             custommarrgin={{ marginBottom: "14px" }} ownMargin={true}
//           />
//           <DropDownv1
//             options={["select", "Pet Quality", "Show Quality", "KCI Registration"]}
//             question={"Pet Variety"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
//             value={formData.petVariety} onChange={(value) => handleInputChange("petVariety", value)}
//             CustomInputElementAddpet={{ color: "#000000" }}
//           />
//           <DropDownv1
//             options={["select", "Yes", "No"]} question={"Vaccinated"}
//             width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.vaccinated}
//             onChange={(value) => handleInputChange("vaccinated", value)}
//             CustomInputElementAddpet={{ color: "#000000" }}
//           />
//           {formData.vaccinated === "Yes" && (
//             <div style={{ width: isMobile ? "100%" : "48%" }}>
//               <p>Vaccinations Given</p>
//               <select
//                 multiple
//                 value={formData.howManyVaccinationsDone}
//                 onChange={handleVaccinationChange}
//                 style={{ width: "100%", padding: "10px", border: "1px solid #d9d9d9", borderRadius: "8px", minHeight: "100px" }}
//               >
//                 {vaccinationOptions.map((vaccine) => (
//                   <option key={vaccine} value={vaccine}>
//                     {vaccine}
//                   </option>
//                 ))}
//               </select>
//               <small style={{ color: "#666", fontSize: "12px" }}>Hold Ctrl/Cmd to select multiple</small>
//             </div>
//           )}
//           <DropDownv1
//             options={["select", "Yes", "No"]} question={"KCI"} width={isMobile ? "100%" : "48%"}
//             backgroundColor="#FFFFFF" value={formData.kci}
//             onChange={(value) => handleInputChange("kci", value)}
//             CustomInputElementAddpet={{ color: "#000000" }}
//           />
//           <DropDownv1
//             options={["select", "Yes", "No"]} question={"Transport Service"}
//             width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.isTransportService}
//             onChange={(value) => handleInputChange("isTransportService", value)}
//             CustomInputElementAddpet={{ color: "#000000" }}
//           />
//           <CustomInputElement2
//             question={"How many times breeding done earlier?"} width={isMobile ? "100%" : "48%"}
//             type="number" backgroundColor="#FFFFFF" value={formData.howmanyTimesBreedingDone}
//             placeholder="Enter Breeding Count"
//             onChange={(e) => handleInputChange("howmanyTimesBreedingDone", e.target.value)}
//             custommarrgin={{ marginBottom: "14px" }} ownMargin={true}
//           />
//           <DropDownv1
//             question={"Skills"} options={["select", "Good", "Bad"]} width={isMobile ? "100%" : "48%"}
//             backgroundColor="#FFFFFF" value={formData.skills}
//             onChange={(value) => handleInputChange("skills", value)}
//             CustomInputElementAddpet={{ color: "#000000" }}
//           />
//           <DropDownv1
//             question={"Championship"} options={["select", "Yes", "No"]}
//             width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.championship}
//             onChange={(value) => handleInputChange("championship", value)}
//             CustomInputElementAddpet={{ color: "#000000" }}
//           />
//           <DropDownv1
//             question={"Events"} options={["select", "Yes", "No"]} width={isMobile ? "100%" : "48%"}
//             backgroundColor="#FFFFFF" value={formData.Events}
//             onChange={(value) => handleInputChange("Events", value)}
//             CustomInputElementAddpet={{ color: "#000000" }}
//           />
//           <CustomInputElement2
//             question={"Instagram Link"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
//             placeholder="URL" value={formData.instagramLink}
//             onChange={(e) => handleInputChange("instagramLink", e.target.value)}
//             error={errors.instagramLink} custommarrgin={{ marginBottom: "14px" }} ownMargin={true}
//           />
//           <CustomInputElement2
//             question="Additional Information" width={isMobile ? "100%" : "48%"}
//             backgroundColor="#FFFFFF" placeholder="Add more information"
//             onInputChange={handleVictoriaInfoChange}
//             onChange={(e) => handleInputChange("additionalInfo", e.target.value)}
//             rows={3}
//             customStylestext={{ backgroundColor: "#fff", border: "1px solid rgb(217, 217, 217)", marginBottom: "16px" }}
//           />

//           <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
//             <input
//               type="checkbox"
//               id="numberVisibility"
//               checked={formData.numberVisibility}
//               onChange={(e) => handleInputChange("numberVisibility", e.target.checked)}
//               style={{ width: "18px", height: "18px" }}
//             />
//             <label htmlFor="numberVisibility">Show your mobile number</label>
//           </div>

//           {/* Upload Section */}
//           <div className={styles.uploadSections}>
//             <div className={styles.uploadSection}>
//               <p className={styles.uploadLabel}>
//                 Pet Images <span className={styles.required}>*</span>
//               </p>
//               <div className={styles["image-grid"]}>
//                 {Array.from({ length: isMobile ? 1 : MAX_IMAGES }).map((_, index) => {
//                   const hasImage = !!imagePreviews[index];
//                   const isMandatory = index === 0;
//                   return (
//                     <div key={index} className={styles["slot-column"]}>
//                       {!hasImage ? (
//                         <label
//                           className={`${styles["image-slot-empty"]} ${isMandatory ? styles["mandatory-border"] : ""}`}
//                           onClick={() => imageFileInputRef.current?.click()}
//                           style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", width: "100%", height: "100%", minHeight: "120px", border: isMandatory ? "2px dashed #ccc" : "1px dashed #ccc", borderRadius: "8px", backgroundColor: "#f9f9f9" }}
//                         >
//                           <AddIcon />
//                         </label>
//                       ) : (
//                         <div className={styles["image-preview-below"]} style={{ position: "relative", width: "100%", height: "100%" }}>
//                           <img src={imagePreviews[index]} alt={`pet-${index}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
//                           <button type="button" onClick={() => handleDeleteMedia(index, "photo")} style={{ position: "absolute", top: "-1px", right: "-3px", background: "rgba(0, 0, 0, 0.6)", color: "#fff", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "none", fontSize: "14px" }}>✕</button>
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>
//               <input ref={imageFileInputRef} type="file" accept="image/*" multiple={!isMobile} hidden onChange={handleImageFileChange} />
//               {errors.images && <span className={styles["error-text"]} style={{ color: "red", fontSize: "12px", marginTop: "5px", display: "block" }}>{errors.images}</span>}
//             </div>

//             {cropperOpen && imageToCrop && (
//               <ImageCropperModal
//                 open={cropperOpen}
//                 image={imageToCrop}
//                 onClose={() => {
//                   setCropperOpen(false);
//                   setImageToCrop(null);
//                   setIsCropping(false);
//                   setFilesToCrop((prevQueue) => {
//                     const remaining = prevQueue.slice(1);
//                     if (remaining.length > 0) {
//                       setImageToCrop(remaining[0]);
//                       setCropperOpen(true);
//                     }
//                     return remaining;
//                   });
//                 }}
//                 onCropComplete={handleCropComplete}
//               />
//             )}

//             <div className={styles.uploadSection} style={{ marginTop: isMobile ? "10px" : "0" }}>
//               <p className={styles.uploadLabel}>Pet Videos <span style={{ color: "#666" }}>(Optional)</span></p>
//               <div className={styles["image-grid"]}>
//                 {Array.from({ length: isMobile ? 1 : MAX_VIDEOS }).map((_, index) => {
//                   const hasVideo = !!videoPreviews[index];
//                   return (
//                     <div key={index} className={styles["slot-column"]}>
//                       {!hasVideo ? (
//                         <label className={styles["image-slot-empty"]} onClick={() => videoFileInputRef.current?.click()} style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", width: "100%", height: "100%", minHeight: "120px", border: "2px dashed #ccc", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
//                           <div style={{ fontSize: "32px", marginBottom: "8px" }}>+</div>
//                           <div style={{ fontSize: "12px", textAlign: "center" }}>Add Video</div>
//                         </label>
//                       ) : (
//                         <div className={styles["image-preview-below"]} style={{ position: "relative", width: "100%", height: "100%" }}>
//                           <video src={videoPreviews[index]} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} controls />
//                           <button type="button" onClick={() => handleDeleteMedia(index, "video")} style={{ position: "absolute", top: "-1px", right: "-3px", background: "rgba(0, 0, 0, 0.6)", color: "#fff", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "none", fontSize: "14px" }}>✕</button>
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>
//               <input ref={videoFileInputRef} type="file" accept="video/*" multiple={!isMobile} hidden onChange={handleVideoFileChange} />
//               {errors.videos && <span className={styles["error-text"]} style={{ color: "red", fontSize: "12px", marginTop: "5px", display: "block" }}>{errors.videos}</span>}
//             </div>
//           </div>

//           {errorMessage && <p className={styles.errorMsg} style={{ color: "red", marginTop: "10px" }}>{errorMessage}</p>}

//           <div style={{ display: "flex", justifyContent: "center", width: "100%", marginTop: "20px" }}>
//             <div className={styles.deskSubmit}>
//               <div className={styles.mobSubmit}>
//                 <button className={styles.submitButton} onClick={handleSubmit} disabled={apiProcessing.loader || isLoading} style={{ background: "#F5790C", color: "white", padding: "10px 20px", borderRadius: "5px", border: "none", cursor: "pointer", fontSize: "16px" }}>
//                   {apiProcessing.loader || isLoading ? "Saving..." : (petData ? "Save" : "Add Pet")}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AddNewPuppyPopup;






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
  const userInfo = getUserInfo();

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

  const [breedOptions, setBreedOptions] = useState([]);
  const [breed, setBreed] = useState([]);
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
      pincode: "",
      landmark: ""
    },
    isTransportService: "", price: "", haveParents: "select",
    negotiable: "", fatherId: "", motherId: "", petVariety: "", numberVisibility: false,
    howManyVaccinationsDone: []
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

  // Populate form when editing
  useEffect(() => {
    if (petData) {
      const selectedAddress = userInfo?.addresses?.find(
        (addr) => addr.id?.toString() === petData?.addressId?.toString() ||
          addr._id?.toString() === petData?.addressId?.toString()
      ) || userInfo?.addresses?.[0];

      setFormData({
        petName: petData.petName || "",
        petAge: petData.petAge || "",
        petType: petData.petType || "",
        color: petData.color || "",
        breed: petData.breed || "",
        additionalInfo: petData.description || petData.additionalInfo || "",
        weight: petData?.weight?.endsWith("kg") || petData?.weight?.endsWith("lb")
          ? petData.weight.split(" ")[0]
          : petData?.weight || "",
        petWeightIn: petData?.weight?.endsWith("kg") ? "kg" : "lb",
        vaccinated: petData.vaccinated || null,
        kci: petData.kciRegistration || petData.kci || "",
        championship: petData.championship || "",
        Events: petData.Events || "",
        skills: petData.skills || "",
        instagramLink: petData.instagramLink || "",
        petGender: petData.petGender || "",
        vaccineCertificate: petData.vaccineCertificate || "",
        kciCertificate: petData.kciCertificate || "",
        spayedOrNeutered: petData.spayedOrNeutered || "",
        dateOfBirth: petData?.dateOfBirth?.slice(0, 10) || petData?.birthday?.slice(0, 10) || "",
        medication: petData.medication || "",
        size: petData.size || "",
        healthCondition: petData.healthCondition || petData.doesYourPetHasAnyHealthIssues || "",
        microchipNo: petData.microchipNo || "",
        howmanyTimesBreedingDone: petData.howmanyTimesBreedingDone || "",
        addressId: selectedAddress?.id?.toString() || petData?.addressId?.toString() || "",
        address: {
          street: petData.address?.street || "",
          area: petData.address?.area || "",
          city: petData.address?.city || "",
          state: petData.address?.state || "",
          pincode: petData.address?.pincode || "",
          landmark: petData.address?.landmark || ""
        },
        isTransportService: petData.transportService || "",
        price: petData.price || "",
        haveParents: petData.doesThisPetHaveParents === "Both" ? "Yes" : (petData.doesThisPetHaveParents || "select"),
        negotiable: petData.negotiable || "",
        fatherId: petData.father || "",
        motherId: petData.mother || "",
        petVariety: petData.petVariety || petData.petsVariety || "",
        numberVisibility: petData.numberVisibility === "on",
        howManyVaccinationsDone: petData.howManyVaccinationsDone || [],
        status: petData.petStatus || ""
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
          landmark: ""
        },
        isTransportService: "", price: "", haveParents: "select",
        negotiable: "", fatherId: "", motherId: "", petVariety: "", numberVisibility: false,
        howManyVaccinationsDone: []
      });
      setImageFiles([]);
      setImagePreviews([]);
      setVideoFiles([]);
      setVideoPreviews([]);
      setErrorMessage("");
    }
  }, [petData, userInfo]);

  // Clear address error as soon as an address is selected/added
  useEffect(() => {
    if (formData.addressId) {
      setErrors((prev) => {
        const { address, ...rest } = prev;
        if (!hasSubmitted) {
          const { file, video } = rest;
          return { file: file || "", video: video || "" };
        }
        return rest;
      });
    }
  }, [formData.addressId, hasSubmitted]);

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
    if (field === "weight") value = value.replace(/[^0-9]/g, "");
    if (field === "instagramLink") {
      setErrors((prev) => ({
        ...prev,
        instagramLink: value && !instagramRegex.test(value)
          ? "Please check your Instagram URL & enter a valid Instagram URL (ex: https://instagram.com/john_doe)"
          : "",
      }));
    }
    if (field === "dateOfBirth") {
      const selectedDate = new Date(value);
      const today = new Date();
      if (selectedDate > today) {
        setErrors(prev => ({ ...prev, dateOfBirth: "Date of Birth cannot be in the future." }));
      } else {
        setErrors(prev => ({ ...prev, dateOfBirth: "" }));
      }
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleVaccinationChange = (e) => {
    const value = e.target.value;
    const currentVaccinations = [...formData.howManyVaccinationsDone];
    
    if (currentVaccinations.includes(value)) {
      setFormData(prev => ({
        ...prev,
        howManyVaccinationsDone: currentVaccinations.filter(v => v !== value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        howManyVaccinationsDone: [...currentVaccinations, value]
      }));
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

  const todayString = new Date().toISOString().split("T")[0];

  const handleDeleteMedia = async (index, type) => {
    const isPhoto = type === "photo";
    const files = isPhoto ? imageFiles : videoFiles;
    const fileToRemove = files[index];

    if (fileToRemove === "existing") {
      const confirmDelete = window.confirm(`Permanently delete this ${type}?`);
      if (!confirmDelete) return;

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
    if (!formData.petName?.trim()) newErrors.petName = "Pet Name is required.";
    if (imageFiles.length === 0) newErrors.images = "Please upload at least 1 image.";
    if (!formData.dateOfBirth?.trim()) newErrors.dateOfBirth = "Date of Birth is required.";
    if (!formData.color?.trim() || formData.color === "Select Color") newErrors.color = "Pet color is required.";
    if (!String(formData.weight).trim()) newErrors.weight = "Pet weight is required.";
    else if (!formData.petWeightIn) newErrors.weight = "Select pet weight type";
    if (!formData.petType || formData.petType === "select") newErrors.petType = "Pet Type is required.";
    if (!formData.petGender || formData.petGender === "select") newErrors.petGender = "Pet Gender is required.";
    if (!formData.breed || formData.breed === "select") newErrors.breed = "Pet Breed is required.";
    if (!formData.addressId) newErrors.address = "Address is required.";
   
    if (!formData.price?.trim()) newErrors.price = "Price is required.";
   
    
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
      landmark: selectedAddressObj?.landmark || formData.address?.landmark || ""
    };

    const payload = {
      petName: formData.petName,
      petType: formData.petType,
      breed: formData.breed,
      color: formData.color,
      petGender: formData.petGender,
      size: formData.size,
      petAge: formData.petAge,
      weight: `${formData.weight} ${formData.petWeightIn}`,
      dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
      price: formData.price,
      negotiable: formData.negotiable || "No",
      vaccinated: formData.vaccinated || "No",
      howManyVaccinationsDone: formData.howManyVaccinationsDone || [],
      microchipNo: formData.microchipNo || "",
      kciRegistration: formData.kci || "No",
      transportService: formData.isTransportService || "No",
      petStatus: petData?.petStatus || "Ready for Sale",
      address: addressPayload,
      description: formData.additionalInfo || "",
      haveParentsOfThisPet: formData.haveParents === "Yes" ? "Yes" : "No",
      doesThisPetHaveParents: formData.haveParents === "Yes" ? "Both" : "No",
      father: formData.fatherId ? Number(formData.fatherId) : null,
      mother: formData.motherId ? Number(formData.motherId) : null,
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
        const petId = response.data?.petProfile?.id || response.data?.id || petData?.id;

        if (petId) {
          // Upload Images
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

          // Upload Videos
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

        if (fetchPetData) {
          await fetchPetData();
        }

        closePopup();
      } else {
        setErrorMessage(response.message || "Failed to save profile.");
        toast.error(response.message || "Failed to save profile.");
      }
    } catch (err) {
      console.error("Submit Error:", err);
      const errorMsg = err.response?.data?.message || "An error occurred while saving.";
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
      setApiProcessing({ loader: false, message: "" });
    }
  };

  const sizeOptions = useMemo(() => {
    if (petData && formData.size && formData.size !== "select size" && formData.size !== "") {
      return [formData.size];
    }
    if (!petData && formData.breed !== "select" && formData.size && formData.size !== "select size" && formData.size !== "") {
      return [formData.size];
    }
    return ["select size", "Toy", "Small", "Medium", "Large", "Giant"];
  }, [petData, formData.breed, formData.size]);

  const MAX_IMAGES = 3;
  const MAX_VIDEOS = 3;

  return (
    <div className={styles.popupContainer} style={{ background: "#fff", borderRadius: "10px", width: "100%", position: "relative" }}>
      <div className={styles.header} style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "0 10px 0 0" }}>
          <BackHeader onClick={closePopup} />
          <h2>{petData ? "Edit Puppy" : "Add New Puppy"}</h2>
        </div>
        <button style={{ background: "transparent", border: "none", fontSize: "1.2rem", cursor: "pointer", padding: "20px" }} onClick={closePopup}>&#x2715;</button>
      </div>

      <div className={styles.mainContainer}>
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
            CustomInputElementAddpet={{ color: "#000000"}} error={errors.petType}
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
            placeholder="Date Of Birth" type="date" value={formData.dateOfBirth}
            onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
            max={todayString} custommarrgin={{ marginBottom: "14px" }} error={errors.dateOfBirth} ownMargin={true}
          />
          <DropDownv1
            options={["select", "Male", "Female"]} question={"Gender *"}
            width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.petGender}
            onChange={(value) => handleInputChange("petGender", value)}
            CustomInputElementAddpet={{ color: "#000000" }} error={errors.petGender}
          />
          <DropDownv1
            options={sizeOptions} question={"Size *"} width={isMobile ? "100%" : "48%"}
            backgroundColor="#FFFFFF" value={formData.size || ""}
            onChange={(value) => {
              if (!petData) {
                handleInputChange("size", value === "select size" ? "" : value);
              }
            }}
            CustomInputElementAddpet={{ color: "#000000" }} error={errors.size}
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
         
          <div style={{ width: isMobile ? "100%" : "48%" }}>
            <p>Address <span className={styles["required"]}>*</span></p>
            <div className={styles["form-input-container"]}>
              <AddressDropdown
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                userInfo={userInfo}
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
            options={["select", "Only Father", "Only Mother", "Both Father and Mother"]} question={"Have Parents?"}
            width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.haveParents}
            onChange={(value) => handleInputChange("haveParents", value)}
            CustomInputElementAddpet={{ color: "#000000" }}
          />
          
          {/* Father Dropdown - Filtered by breed */}
          <div style={{ width: isMobile ? "100%" : "48%" }}>
            <p>Breed of Father</p>
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
              {/* {formData.breed && formData.breed !== "select" && filteredFathers.length === 0 && (
                <span className={styles["error-text"]} style={{ fontSize: "12px", color: "#999" }}>
                  No {formData.breed} male pets available
                </span>
              )} */}
              
            </div>
          </div>

          {/* Mother Dropdown - Filtered by breed */}
          <div style={{ width: isMobile ? "100%" : "48%" }}>
            <p>Breed of Mother</p>
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
              {/* {formData.breed && formData.breed !== "select" && filteredMothers.length === 0 && (
                <span className={styles["error-text"]} style={{ fontSize: "12px", color: "#999" }}>
                  No {formData.breed} female pets available
                </span>
              )} */}
            
            </div>
          </div>

          <DropDownv1
            options={["select", "Pet Quality", "Show Quality", "KCI Registration"]}
            question={"Pet Variety"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
            value={formData.petVariety} onChange={(value) => handleInputChange("petVariety", value)}
            CustomInputElementAddpet={{ color: "#000000" }}
          />
          <DropDownv1
            options={["select", "Yes", "No"]} question={"Vaccinated"}
            width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.vaccinated}
            onChange={(value) => handleInputChange("vaccinated", value)}
            CustomInputElementAddpet={{ color: "#000000" }}
          />
          {formData.vaccinated === "Yes" && (
            <div style={{ width: isMobile ? "100%" : "48%" }}>
              <p>Type of Vaccination</p>
              <select
                multiple
                value={formData.howManyVaccinationsDone}
                onChange={handleVaccinationChange}
                style={{ width: "100%", padding: "10px", border: "1px solid #d9d9d9", borderRadius: "8px", minHeight: "100px" }}
              >
                {vaccinationOptions.map((vaccine) => (
                  <option key={vaccine} value={vaccine}>
                    {vaccine}
                  </option>
                ))}
              </select>
              
            </div>
          )}
         
          <DropDownv1
            options={["select", "Yes", "No"]} question={"Transport Service"}
            width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF" value={formData.isTransportService}
            onChange={(value) => handleInputChange("isTransportService", value)}
            CustomInputElementAddpet={{ color: "#000000" }}
          />
          <DropDownv1
            question={"Status *"} options={["select", "Ready For Sale", "Not For Sale"]} width={isMobile ? "100%" : "48%"}
            backgroundColor="#FFFFFF" value={formData.status}
            onChange={(value) => handleInputChange("status", value)}
            CustomInputElementAddpet={{ color: "#000000" }}
          />
          {/* <CustomInputElement2
            question={"Instagram Link"} width={isMobile ? "100%" : "48%"} backgroundColor="#FFFFFF"
            placeholder="URL" value={formData.instagramLink}
            onChange={(e) => handleInputChange("instagramLink", e.target.value)}
            error={errors.instagramLink} custommarrgin={{ marginBottom: "14px" }} ownMargin={true}
          /> */}
          <CustomInputElement2
            question="Add Description" width={isMobile ? "100%" : "48%"}
            backgroundColor="#FFFFFF" placeholder="Add more information"
            onInputChange={handleVictoriaInfoChange}
            onChange={(e) => handleInputChange("description", e.target.value)}
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