import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "../../styles/vendorregisteration/vendor-registeration.module.css";
import ImageCropperModal from "../../components/ImageCropperModal";
import MultiSelectDropdown from "../../components/MultiSelectDropdown";
import Header from "@/components/header/header";

import { Country, State, City } from "country-state-city";
import ClinicFields from "@/components/BranchFeatures/ClinicFields";
import DaycareFields from "@/components/BranchFeatures/DaycareFields";
import GroomingFields from "@/components/BranchFeatures/GroomingFields";
import PetStoreFields from "@/components/BranchFeatures/PetStoreFields";
import PetSalesFields from "@/components/BranchFeatures/PetSalesFields";
import { GalleryIcon } from "@/components/svg/svg2";
import BreederFields from "@/components/BranchFeatures/BreederFields";
import TrainingFields from "@/components/BranchFeatures/TrainingFields";
import SitterFields from "@/components/BranchFeatures/SitterFields";

const VendorRegistration = () => {
  const API_BASE_URL = typeof window !== "undefined" && window.location.hostname !== "support.zaanvar.com" ? "https://dev.zaanvar.com/api/vendorBusiness" : "https://prod.zaanvar.com/api/vendorBusiness";
  const API_URL = typeof window !== "undefined" && window.location.hostname !== "support.zaanvar.com" ? "https://dev.zaanvar.com/api/" : "https://prod.zaanvar.com/api/";
  const IMAGE_BASE_URL = typeof window !== "undefined" && window.location.hostname === "support.zaanvar.com" ? "https://zaanvarprods3.b-cdn.net/" : "https://zaanvaerwebstories.b-cdn.net/";
  const [showPopup, setShowPopup] = useState(true);
  const [currentStep, setCurrentStep] = useState(2);
  const [isAddingNewStoreOnly, setIsAddingNewStoreOnly] = useState(true);
  const [experienceInput, setExperienceInput] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    gender: "",
    profile: null,
    ownerAddress: {
      flat: "",
      area: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
    },
    businessName: "",
    businessProfile: null,
    featureNeeds: [],
    businessModel: "",
    experience: "",
    managePreviousWork: "",
    socialLinks: [],
    companyVerification: {
      manualVisit: false,
      emailVerification: false,
      numberVerification: false,
      callVerification: false,
      liveVideoVerification: false,
      videoCallVerification: false,
      userVerificationSent: false,
    },
  });
  const [branches, setBranches] = useState([
    {
      branchName: "",
      branchLocation: "",
      branchbussinessName: "",
      featureType: [],
      services: {},
      experience: "",
      dataStoreType: "",
      managePreviousWork: "",
      aboutShop: "",
      morePhotos: [],
      removedImagePaths: [],
      removeLogoRequested: false,
      isPrimary: true,
      verificationChecks: {
        manualVisit: false,
        emailVerification: false,
        numberVerification: false,
        callVerification: false,
        liveVideoVerification: false,
        videoCallVerification: false,
        userVerificationSent: false,
      },
      branchAddress: {
        flat: "",
        area: "",
        city: "",
        state: "",
        country: "",
        pincode: "",
      },
      is24x7: false,
      branchPhone: "",
      branchEmail: "",
      branchPetTypes: [],
      paymentMethods: [],
      timings: {
        Monday: "",
        Tuesday: "",
        Wednesday: "",
        Thursday: "",
        Friday: "",
        Saturday: "",
        Sunday: "",
      },
      branchLocation: "",
      latitude: "",
      longitude: "",
    },
  ]);
  const [errors, setErrors] = useState({});
  const [branchesList, setBranchesList] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [storeOwnerName, setStoreOwnerName] = useState("");
  const [storeOwnerLastName, setStoreOwnerLastName] = useState("");
  const [listItems, setListItems] = useState([]);
  const [editingBusinessId, setEditingBusinessId] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addMode, setAddMode] = useState("storeOnly");
  const [selectedRows, setSelectedRows] = useState([]);
  const [otpState, setOtpState] = useState({});
  const [branchExpInputs, setBranchExpInputs] = useState({});
  // ─── NEW: track branchIds returned after submit (for post-submit L3 trigger) ───
  const [pendingL3BranchIds, setPendingL3BranchIds] = useState([]);

  const verificationDefaults = {
    manualVisit: false,
    emailVerification: false,
    numberVerification: false,
    callVerification: false,
    liveVideoVerification: false,
    videoCallVerification: false,
    userVerificationSent: false,
  };

  const [croppingImage, setCroppingImage] = useState(null);
  const [croppingIndex, setCroppingIndex] = useState(null);
  const [croppingType, setCroppingType] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [currentSocial, setCurrentSocial] = useState({
    platform: "",
    url: "",
  });

  const paymentOptions = [
    { id: "Cash", name: "Cash" },
    { id: "UPI", name: "UPI" },
    { id: "NetBanking", name: "NetBanking" },
    { id: "CreditCard", name: "CreditCard" },
    { id: "DebitCard", name: "DebitCard" },
  ];

  const socialPlatforms = [
    { id: "instagram", name: "Instagram", icon: "📸", baseUrl: "https://instagram.com/" },
    { id: "youtube", name: "YouTube", icon: "▶️", baseUrl: "https://youtube.com/" },
    { id: "facebook", name: "Facebook", icon: "f", baseUrl: "https://facebook.com/" },
    { id: "twitter", name: "Twitter / X", icon: "🐦", baseUrl: "https://twitter.com/" },
    { id: "linkedin", name: "LinkedIn", icon: "in", baseUrl: "https://linkedin.com/company/" },
    { id: "whatsapp", name: "WhatsApp", icon: "💬", baseUrl: "https://wa.me/" },
    { id: "website", name: "Website", icon: "🌐", baseUrl: "" },
  ];

  // ════════════════════════════════════════════════════════════════
  // OTP / VERIFICATION API HELPERS
  // ════════════════════════════════════════════════════════════════

  /**
   * Send OTP to branch email.
   * POST /api/vendor/registration/send-email-otp/:branchId
   */
  const sendBranchEmailOTP = async (branchId) => {
    const res = await axios.post(`${API_URL}vendor/registration/send-email-otp/${branchId}`);
    return res.data;
  };

  /**
   * Send OTP to branch phone.
   * POST /api/vendor/registration/send-phone-otp/:branchId
   */
  const sendBranchPhoneOTP = async (branchId) => {
    const res = await axios.post(`${API_URL}vendor/registration/send-phone-otp/${branchId}`);
    return res.data;
  };

  /**
   * Verify branch email OTP.
   * POST /api/vendor/registration/verify-email-otp
   * body: { branchId, otp }
   */
  const verifyBranchEmailOTP = async (branchId, otp) => {
    const res = await axios.post(`${API_URL}vendor/registration/verify-email-otp`, { branchId, otp });
    return res.data;
  };

  /**
   * Verify branch phone OTP.
   * POST /api/vendor/registration/verify-phone-otp
   * body: { branchId, otp }
   */
  const verifyBranchPhoneOTP = async (branchId, otp) => {
    const res = await axios.post(`${API_URL}vendor/registration/verify-phone-otp`, { branchId, otp });
    return res.data;
  };

  /**
   * Trigger L3 verification for a branch.
   * POST /api/vendor/registration/send-l3-verification/:branchId
   */
  const sendL3Verification = async (l3Id) => {
    const res = await axios.post(`${API_URL}vendor/registration/send-l3-verification/${l3Id}`);
    return res.data;
  };

  /**
   * Trigger L3 verification for all branches whose
   * verificationChecks.userVerificationSent === true.
   * In edit mode, branchIds already exist on `branches`.
   * In add mode, pass the freshly-created branchIds.
   */
  const triggerL3ForBranches = async (branchList) => {
    const targets = branchList.filter(
      (b) => b.verificationChecks?.userVerificationSent && b.branchId
    );
    if (!targets.length) return;

    const l3TargetId = editingUser || targets[0].branchId;
    try {
      const result = await sendL3Verification(l3TargetId);
      console.log(`L3 sent for target ${l3TargetId}:`, result);
    } catch (e) {
      console.error(`L3 failed for target ${l3TargetId}:`, e?.response?.data || e.message);
    }
  };

  // ════════════════════════════════════════════════════════════════
  // UPDATED startOtpTimer – now calls the real API when branchId is available
  // ════════════════════════════════════════════════════════════════

  /**
   * otpKey format:
   *   "companyPhone" | "companyEmail"
   *   "branchPhone_<idx>" | "branchEmail_<idx>"
   *
   * For branch keys we derive the branchIndex and channel,
   * then hit the real API if a branchId exists.
   */
  const startOtpTimer = async (key) => {
    // Optimistically start the UI timer immediately
    setOtpState((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        otp: "",
        showOtp: true,
        verified: false,
        secondsLeft: 60,
        canResend: false,
        sending: true,
        sendError: null,
      },
    }));

    // Determine if this is a branch key and which channel
    const branchEmailMatch = key.match(/^branchEmail_(\d+)$/);
    const branchPhoneMatch = key.match(/^branchPhone_(\d+)$/);

    try {
      if (branchEmailMatch) {
        const branchIndex = parseInt(branchEmailMatch[1], 10);
        const branchId = branches[branchIndex]?.branchId;
        if (branchId) {
          await sendBranchEmailOTP(branchId);
        } else {
          console.warn("Branch email OTP: no branchId yet (will be available after save in add mode).");
        }
      } else if (branchPhoneMatch) {
        const branchIndex = parseInt(branchPhoneMatch[1], 10);
        const branchId = branches[branchIndex]?.branchId;
        if (branchId) {
          await sendBranchPhoneOTP(branchId);
        } else {
          console.warn("Branch phone OTP: no branchId yet (will be available after save in add mode).");
        }
      }
      // companyEmail / companyPhone – no dedicated API in spec; UI-only OTP flow kept as-is
    } catch (err) {
      console.error(`Send OTP failed for key "${key}":`, err?.response?.data || err.message);
      setOtpState((prev) => ({
        ...prev,
        [key]: {
          ...(prev[key] || {}),
          sendError: err?.response?.data?.message || "Failed to send OTP",
          showOtp: false,
          sending: false,
        },
      }));
      alert(`Failed to send OTP: ${err?.response?.data?.message || err.message}`);
      return;
    }

    setOtpState((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), sending: false },
    }));
  };

  // ════════════════════════════════════════════════════════════════
  // UPDATED verifyOtpCode – calls real API for branch email/phone
  // ════════════════════════════════════════════════════════════════

  const verifyOtpCode = async (key) => {
    const current = otpState[key] || {};
    if ((current.otp || "").trim().length < 4) return;

    const branchEmailMatch = key.match(/^branchEmail_(\d+)$/);
    const branchPhoneMatch = key.match(/^branchPhone_(\d+)$/);

    try {
      if (branchEmailMatch) {
        const branchIndex = parseInt(branchEmailMatch[1], 10);
        const branchId = branches[branchIndex]?.branchId;
        if (branchId) {
          await verifyBranchEmailOTP(branchId, current.otp.trim());
        }
      } else if (branchPhoneMatch) {
        const branchIndex = parseInt(branchPhoneMatch[1], 10);
        const branchId = branches[branchIndex]?.branchId;
        if (branchId) {
          await verifyBranchPhoneOTP(branchId, current.otp.trim());
        }
      }
      // companyEmail / companyPhone – UI-only verification kept as-is

      setOtpState((prev) => ({
        ...prev,
        [key]: {
          ...current,
          verified: true,
          showOtp: false,
          canResend: false,
          secondsLeft: 0,
        },
      }));
    } catch (err) {
      console.error(`Verify OTP failed for key "${key}":`, err?.response?.data || err.message);
      alert(`OTP verification failed: ${err?.response?.data?.message || "Invalid OTP"}`);
    }
  };

  // ════════════════════════════════════════════════════════════════
  // API Functions (unchanged)
  // ════════════════════════════════════════════════════════════════
  const fetchAllVendors = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}companies/organized-list`);
      const data = response.data?.data;

      const items = [];
      const processedCompanyIds = new Set();

      (data?.companyArray || []).forEach((company) => {
        if (company.compId && !processedCompanyIds.has(company.compId)) {
          processedCompanyIds.add(company.compId);
          items.push({
            type: "company",
            id: company.compId,
            displayName: company.name || company.user?.name || "Unnamed Company",
            email: company.email || company.user?.email || "",
            phone: company.phoneNo || company.user?.phoneNumber || "",
            branchesCount: company.noOfBranches || company.branches?.length || 0,
            branches: company.branches || [],
            user: company.user || null,
            address: company.address || null,
            createdAt: company.createdAt,
            raw: company,
          });
        }
      });

      (data?.branchArray || []).forEach((branch) => {
        const isActuallyStandalone = !branch.compId || !processedCompanyIds.has(branch.compId);
        if (isActuallyStandalone) {
          items.push({
            type: "standalone-branch",
            id: branch.id,
            displayName: branch.name || "Unnamed Branch",
            email: branch.contactUs?.email || branch.email || "",
            phone: branch.contactUs?.mobile || branch.phone || "",
            branchesCount: 1,
            branches: [branch],
            vendorDetails: branch.vendorDetails || null,
            createdAt: branch.createdAt,
            raw: branch,
          });
        }
      });

      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setListItems(items);
    } catch (error) {
      console.error("Error fetching list:", error);
      alert("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const updateCompanyAndStores = async (companyId, payload) => {
    const res = await axios.put(
      `${API_URL}companies/update-onboarding/${companyId}`,
      payload,
      { headers: { "Content-Type": "application/json" } }
    );
    return res.data;
  };

  const updateSingleStore = async (branchId, payload) => {
    const res = await axios.put(
      `${API_URL}branches/updateBranchById/${branchId}`,
      payload,
      { headers: { "Content-Type": "application/json" } }
    );
    return res.data;
  };

  const buildCompanyUpdatePayload = () => {
    return {
      user: {
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        gender: formData.gender,
      },
      company: {
        name: formData.businessName,
        email: formData.companyEmail || "",
        phoneNo: formData.companyPhone || "",
        website: formData.companyWebsite || "",
        servicesProvided: formData.featureNeeds || [],
        experienceDateOfCreation: formData.businessOpeningDate || "",
        businessType: formData.businessModel || "",
        aboutCompany: formData.aboutCompany || "",
        petTypes: formData.petTypes || [],
        addressDetails: {
          addressText: formData.ownerAddress.flat || "",
          flatNo: formData.ownerAddress.flat || "",
          area: formData.ownerAddress.area || "",
          city: formData.ownerAddress.city || "",
          state: formData.ownerAddress.state || "",
          country: formData.ownerAddress.country || "",
          pincode: formData.ownerAddress.pincode || "",
        },
      },
      branches: branches.map((b) => ({
        branchId: b.branchId,
        name: b.branchName || "",
        phone: b.branchPhone || "",
        email: b.branchEmail || "",
        location: b.branchLocation || "",
        petTypes: b.branchPetTypes || [],
        paymentMode: b.paymentMethods || [],
        timings: {
          monday: b.timings?.Monday || "",
          tuesday: b.timings?.Tuesday || "",
          wednesday: b.timings?.Wednesday || "",
          thursday: b.timings?.Thursday || "",
          friday: b.timings?.Friday || "",
          saturday: b.timings?.Saturday || "",
          sunday: b.timings?.Sunday || "",
        },
        addressDetails: {
          flatNo: b.branchAddress?.flat || "",
          area: b.branchAddress?.area || "",
          city: b.branchAddress?.city || "",
          state: b.branchAddress?.state || "",
          country: b.branchAddress?.country || "",
          pincode: b.branchAddress?.pincode || "",
          latitude: b.latitude || "",
          longitude: b.longitude || "",
        },
        experience: b.experience || calculateExperience(b.branchOpeningDate) || "0 Years",
        openingDate: b.branchOpeningDate || "",
        dataStoreType: b.dataStoreType || "manual",
        about: b.aboutShop || "",
        services: mapServicesToBackend(b.services, b),
      })),
    };
  };

  const buildStoreUpdatePayload = (branch) => {
    return {
      branch: {
        name: branch.branchName || "",
        phone: branch.branchPhone || "",
        email: branch.branchEmail || "",
        location: branch.branchLocation || "",
        petTypes: branch.branchPetTypes || [],
        paymentMode: branch.paymentMethods || [],
        timings: {
          monday: branch.timings?.Monday || "",
          tuesday: branch.timings?.Tuesday || "",
          wednesday: branch.timings?.Wednesday || "",
          thursday: branch.timings?.Thursday || "",
          friday: branch.timings?.Friday || "",
          saturday: branch.timings?.Saturday || "",
          sunday: branch.timings?.Sunday || "",
        },
        addressDetails: {
          flatNo: branch.branchAddress?.flat || "",
          area: branch.branchAddress?.area || "",
          city: branch.branchAddress?.city || "",
          state: branch.branchAddress?.state || "",
          country: branch.branchAddress?.country || "IN",
          pincode: branch.branchAddress?.pincode || "",
          latitude: branch.latitude || "",
          longitude: branch.longitude || "",
        },
        experience: branch.experience || calculateExperience(branch.branchOpeningDate) || "0 Years",
        openingDate: branch.branchOpeningDate || null,
        dataStoreType: branch.dataStoreType || "",
        about: branch.aboutShop || "",
        services: mapServicesToBackend(branch.services, branch),
      }
    };
  };

  const buildStoreEditPayload = (branch) => {
    return {
      branch: {
        branchId: branch.branchId || editingBusinessId,
        name: branch.branchName || "",
        phone: branch.branchPhone || "",
        email: branch.branchEmail || "",
        location: branch.branchLocation || "",
        about: branch.aboutShop || "",
        experience: branch.experience || calculateExperience(branch.branchOpeningDate) || "0 Years",
        openingDate: branch.branchOpeningDate || null,
        dataStoreType: branch.dataStoreType || "",
        petTypes: branch.branchPetTypes || [],
        paymentMode: branch.paymentMethods || [],
        timings: {
          monday: branch.timings?.Monday || "",
          tuesday: branch.timings?.Tuesday || "",
          wednesday: branch.timings?.Wednesday || "",
          thursday: branch.timings?.Thursday || "",
          friday: branch.timings?.Friday || "",
          saturday: branch.timings?.Saturday || "",
          sunday: branch.timings?.Sunday || "",
        },
        addressDetails: {
          addressText: branch.mapLocation || branch.branchLocation || "",
          flatNo: branch.branchAddress?.flat || "",
          area: branch.branchAddress?.area || "",
          city: branch.branchAddress?.city || "",
          state: branch.branchAddress?.state || "",
          country: branch.branchAddress?.country || "IN",
          pincode: branch.branchAddress?.pincode || "",
          latitude: branch.latitude ? parseFloat(branch.latitude) : null,
          longitude: branch.longitude ? parseFloat(branch.longitude) : null,
        },
        services: mapServicesToEditBackend(branch.services, branch),
      }
    };
  };

  const handleAddSocialLink = () => {
    if (!currentSocial.platform) { alert("Please select a platform"); return; }
    if (!currentSocial.url.trim()) { alert("Please enter username or link"); return; }

    let finalUrl = currentSocial.url.trim();
    const selectedPlatform = socialPlatforms.find(p => p.id === currentSocial.platform);

    if (selectedPlatform?.baseUrl && finalUrl.includes(selectedPlatform.baseUrl)) {
      finalUrl = finalUrl.replace(selectedPlatform.baseUrl, "");
    }
    if ((currentSocial.platform === "instagram" || currentSocial.platform === "twitter") && !finalUrl.startsWith("@")) {
      finalUrl = "@" + finalUrl;
    }

    setFormData(prev => ({
      ...prev,
      socialLinks: [
        ...(prev.socialLinks || []),
        { platform: currentSocial.platform, url: finalUrl, fullUrl: selectedPlatform?.baseUrl + finalUrl.replace(/^@/, "") }
      ]
    }));
    setCurrentSocial({ platform: "", url: "" });
  };

  const removeSocialLink = (index) => {
    setFormData(prev => ({ ...prev, socialLinks: prev.socialLinks.filter((_, i) => i !== index) }));
  };

  const createBusiness = async (payload) => {
    console.log("FINAL PAYLOAD:", payload);
    const res = await axios.post(`${API_URL}companies/onboard`, payload, { headers: { "Content-Type": "application/json" } });
    return res.data;
  };

  const addBranchToCompany = async (branchPayload) => {
    try {
      const response = await axios.post(`${API_URL}branches/createWithVendor`, branchPayload, { headers: { "Content-Type": "application/json" } });
      return response.data;
    } catch (error) {
      console.error("Failed to add store:", error.response?.data || error.message);
      throw error;
    }
  };

  const uploadImages = async ({ userId, businessId, branches, profileImage, businessProfile }) => {
    const userCompanyFormData = new FormData();
    if (profileImage instanceof Blob) userCompanyFormData.append("profile", profileImage, "profile.jpg");
    if (businessProfile instanceof Blob) userCompanyFormData.append("logo", businessProfile, "business.jpg");
    userCompanyFormData.append("userId", userId);
    userCompanyFormData.append("businessId", businessId);

    if (userCompanyFormData.entries().next().done === false) {
      try {
        const userCompanyRes = await axios.put(`${API_BASE_URL}/upload-images`, userCompanyFormData, { headers: { "Content-Type": "multipart/form-data" } });
        console.log("User & company images uploaded:", userCompanyRes.data);
      } catch (err) {
        console.error("User/company image upload failed:", err.response?.data || err.message);
        alert("Failed to upload profile/logo images.");
        throw err;
      }
    }

    for (const branch of branches) {
      if (!branch.branchId) { console.warn("Skipping branch without branchId:", branch.branchName || branch); continue; }
      if (branch.branchLogo instanceof Blob) {
        const logoFormData = new FormData();
        logoFormData.append("logo", branch.branchLogo, `branch_logo_${branch.branchId}.jpg`);
        try {
          await axios.put(`${API_URL}branches/upload-logo/${branch.branchId}`, logoFormData, { headers: { "Content-Type": "multipart/form-data" } });
        } catch (err) { console.error("Branch logo upload failed:", err.response?.data || err.message); }
      }
      if (!branch.morePhotos?.length) continue;

      const branchFormData = new FormData();
      branchFormData.append("branchId", branch.branchId);
      branch.morePhotos.forEach((photo, photoIndex) => {
        let fileToUpload = null, fileName = null;
        if (typeof photo === 'object' && photo.file) {
          fileToUpload = photo.file;
          fileName = photo.file instanceof File ? photo.file.name : `branch_${branch.branchId}_photo_${photoIndex}.${photo.file.type?.split("/")[1] || "jpg"}`;
        } else if (photo instanceof File || photo instanceof Blob) {
          fileToUpload = photo;
          fileName = photo instanceof File ? photo.name : `branch_${branch.branchId}_photo_${photoIndex}.${photo.type?.split("/")[1] || "jpg"}`;
        }
        if (fileToUpload) branchFormData.append("images", fileToUpload, fileName);
      });

      try {
        const branchRes = await axios.put(`${API_URL}branches/upload-images/`, branchFormData, { headers: { "Content-Type": "multipart/form-data" } });
        console.log(`Branch ${branch.branchId} images uploaded:`, branchRes.data);
      } catch (err) {
        console.error(`Branch ${branch.branchId} image upload failed:`, err.response?.data || err.message);
        alert(`Failed to upload images for branch: ${branch.branchName || branch.branchId}`);
      }
    }
    console.log("All image uploads completed.");
  };

  const deleteBranchLogo = async (branchId) => {
    if (!branchId) return;
    await axios.delete(`${API_URL}branches/upload-logo/${branchId}`);
  };

  const deleteBranchImage = async (branchId, imagePath) => {
    if (!branchId || !imagePath) return;
    await axios.delete(`${API_URL}branches/upload-images/${branchId}`, { data: { imagePath }, headers: { "Content-Type": "application/json" } });
  };

  const handleDownloadAll = () => {
    setLoading(true);
    try {
      window.open(`${API_URL}branches/download-all`, "_blank");
    } catch (error) {
      console.error("Download All failed:", error);
      alert("Failed to download all records.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (selectedRows.length === 0) { alert("Please select at least one branch."); return; }
    for (const id of selectedRows) {
      const link = document.createElement('a');
      link.href = `${API_URL}branches/download-single/${id}`;
      link.target = "_blank";
      link.setAttribute('download', '');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  };

  const parseDurationToMinutes = (duration = "") => {
    if (duration.includes("30")) return 30;
    if (duration.includes("1.5")) return 90;
    if (duration.includes("2")) return 120;
    if (duration.includes("1")) return 60;
    return 0;
  };

  const deriveClinicTimingMeta = (timings = {}) => {
    const days = Object.entries(timings);
    let openingTime = null, closingTime = null;
    const closedDays = [];

    days.forEach(([day, value]) => {
      if (!value || value.trim() === "" || value.trim() === "00" || value.trim() === "00:00") { closedDays.push(day.toLowerCase()); return; }
      const parts = value.split(" - ");
      if (parts.length !== 2) { closedDays.push(day.toLowerCase()); return; }
      const [open, close] = parts.map(t => t.trim());
      if (open === "00" || open === "00:00" || close === "00" || close === "00:00") { closedDays.push(day.toLowerCase()); return; }
      if (!openingTime) openingTime = open;
      if (!closingTime) closingTime = close;
    });

    return {
      openStatus: openingTime ? "Open" : "Closed",
      openingTime: openingTime || "",
      closingTime: closingTime || "",
      closedOn: closedDays.length ? closedDays.join(", ") : "",
    };
  };

  const normalizeTiming = (v) => {
    if (!v || v.trim() === "" || v.trim() === "00" || v.trim() === "00:00") return "Closed";
    if (v.trim() === "00:00 AM - 00:00 PM" || v.trim() === "00:00 - 00:00") return "Closed";
    return v.trim();
  };

  const mapServicesToBackend = (services, branch) => {
    const payload = {};

    if (services["Pet Clinic"]) {
      const clinic = services["Pet Clinic"];
      const firstItem = clinic.items?.[0] || {};
      const timingMeta = deriveClinicTimingMeta(branch.timings);
      payload.clinicDetails = {
        name: branch.branchName,
        about: branch.aboutShop,
        ...timingMeta,
        timings: {
          monday: normalizeTiming(branch.timings?.Monday),
          tuesday: normalizeTiming(branch.timings?.Tuesday),
          wednesday: normalizeTiming(branch.timings?.Wednesday),
          thursday: normalizeTiming(branch.timings?.Thursday),
          friday: normalizeTiming(branch.timings?.Friday),
          saturday: normalizeTiming(branch.timings?.Saturday),
          sunday: normalizeTiming(branch.timings?.Sunday),
        },
        petsSupported: firstItem.petTypes || [],
        services: clinic.items || [],
        consultationFee: firstItem.consultationFee || "",
        clinicType: clinic.clinicTypes,
        doctors: (clinic.doctors || []).map(d => ({ name: d.name, qualification: d.qualification, experience: String(d.experience || "0") })),
        contactUs: { phone: branch.branchPhone, email: branch.branchEmail },
        termsAndConditions: (clinic.terms || []).join(" | "),
      };
    }

    if (services["Pet Grooming"]) {
      const grooming = services["Pet Grooming"];
      const firstSrv = grooming.services?.[0] || {};
      payload.groomingDetails = {
        packages: grooming.packages,
        serviceName: grooming.services,
        petType: Array.isArray(firstSrv.petType) ? firstSrv.petType : firstSrv.petType ? [firstSrv.petType] : [],
        serviceMode: {
          inStore: (grooming.serviceMode || []).includes("In-store"),
          inHome: (grooming.serviceMode || []).includes("In-home"),
          inMobile: (grooming.serviceMode || []).includes("In-mobile"),
        },
        type: grooming.serviceMode,
        serviceArea: grooming.pickupLocations,
        termsAndConditions: (grooming.terms || []).join(" | "),
        timeRange: { startTime: grooming.slotTime?.start || "09:00", endTime: grooming.slotTime?.end || "19:00" },
        serviceableAreas: Array.isArray(grooming.pickupLocations) ? grooming.pickupLocations : (typeof grooming.pickupLocations === "string" ? grooming.pickupLocations.split(",").map((s) => s.trim()).filter(Boolean) : []),
      };
    }

    if (services["Pet Store"]) {
      const petStore = services["Pet Store"];
      const firstItem = petStore.items?.[0] || {};
      payload.petShopDetails = {
        supportedPets: firstItem.petTypes || [],
        categories: firstItem.categories || [],
        termsAndConditions: (petStore.terms || []).join(" | "),
      };
    }

    if (services["Pet Daycare"]) {
      const daycare = services["Pet Daycare"];
      const firstItem = daycare.items?.[0] || {};
      payload.daycareDetails = {
        breedType: firstItem.petTypes || [],
        petSizes: firstItem.petSizes || [],
        facilities: daycare.facilities || [],
        dayCareType: daycare.dayCareType || "General",
        consultationFee: { amount: Number(daycare.consultationFee?.amount || 0), currency: "INR" },
        serviceArea: daycare.pickupLocations,
        services: daycare.services,
        facilities: daycare.amenities,
        daycareId: branch.daycareId || `DAYCARE-${branch.branchId}`,
        packages: daycare.packages,
        termsAndConditions: (daycare.terms || []).join(" | "),
      };
    }

    if (services["Pet Sales"]) {
      const sales = services["Pet Sales"];
      const processedItems = (sales.items || []).map((item) => {
        const breedsName = { dogs: [], cats: [], fish: [], birds: [], smallPets: [] };
        const selectedType = item.petTypes[0] || "";
        (item.petBreeds || []).forEach((breed) => {
          const breedLower = breed.toLowerCase();
          const cleanName = breed.split(" (")[0].trim();
          if (breedLower.includes("(dog)")) breedsName.dogs.push(cleanName);
          else if (breedLower.includes("(cat)")) breedsName.cats.push(cleanName);
          else if (breedLower.includes("(fish)")) breedsName.fish.push(cleanName);
          else if (breedLower.includes("(bird)")) breedsName.birds.push(cleanName);
          else breedsName.smallPets.push(cleanName);
        });
        return { ...item, breedsName, petTypes: selectedType ? [selectedType] : [], vaccinated: item.vaccinated === true || item.vaccinated === "true", kciRegistered: item.kciRegistered === true || item.kciRegistered === "true" };
      });
      const firstItem = processedItems[0] || {};
      payload.petSalesDetails = {
        supportedPets: firstItem.petTypes || [],
        breedsName: firstItem.breedsName || { dogs: [], cats: [], fish: [], birds: [], smallPets: [] },
        amountRange: { min: Number(firstItem.amountRange?.min || 0), max: Number(firstItem.amountRange?.max || 0) },
        breedAgeRange: firstItem.ageRange ? `${firstItem.ageRange.min} ${firstItem.ageRange.minUnit || 'Months'} - ${firstItem.ageRange.max} ${firstItem.ageRange.maxUnit || 'Months'}` : "N/A",
        salesServices: processedItems,
        termsAndConditions: (sales.terms || []).join(" | "),
      };
    }

    if (services["Pet Breeder"]) {
      const breeder = services["Pet Breeder"];
      payload.breederDetails = {
        breederName: branch.branchName || "",
        petType: breeder.petTypes || [],
        phone: branch.branchPhone || "",
        email: branch.branchEmail || "",
        address: branch.mapLocation || branch.branchLocation || "",
        govtIdProof: breeder.govtIdProof || "",
        breederCertificate: breeder.breederCertificate || "",
        animalWelfareDeclaration: breeder.animalWelfareDeclaration || "Accepted",
        experienceYears: parseInt(branch.experience) || 0,
        specialization: (breeder.petTypes && breeder.petTypes.length > 0) ? breeder.petTypes[0] : "Other",
      };
    }

    if (services["Pet Training"]) {
      const training = services["Pet Training"];
      payload.trainingDetails = {
        trainingType: (training.trainingTypes || []).join(", "),
        petType: training.petTypes || [],
        servicableAreas: typeof training.serviceableAreas === 'string' ? training.serviceableAreas.split(",").map(s => s.trim()).filter(Boolean) : training.serviceableAreas || [],
        trainingServices: training.items || [],
        trainingPackages: training.packages || [],
        languages: typeof training.languages === 'string' ? training.languages.split(",").map(s => s.trim()).filter(Boolean) : training.languages || [],
        lastMinuteBookingProvided: training.lastMinuteBooking === true,
        minAge: training.minAge || "",
        maxAge: training.maxAge || "",
        maxPetsPerBatch: training.maxPetsPerBatch || "",

      };
    }

    if (services["Pet Sitter/Walker"]) {
      const sitter = services["Pet Sitter/Walker"];
      payload.sittingWalkerDetails = {
        petSizeWithTypes: { sizes: sitter.petSizes || [], types: sitter.petTypes || [] },
        servicableAreas: typeof sitter.serviceableAreas === 'string' ? sitter.serviceableAreas.split(",").map(s => s.trim()).filter(Boolean) : sitter.serviceableAreas || [],
        sittingServices: sitter.items || [],
        languages: typeof sitter.languages === 'string' ? sitter.languages.split(",").map(s => s.trim()).filter(Boolean) : sitter.languages || [],
        lastMinuteBookingProvided: sitter.lastMinuteBooking === true,
        others: sitter.others ? [sitter.others] : [],
        termsAndConditions: (sitter.terms || []).join(" | "),
      };
    }

    return payload;
  };

  const mapServicesToEditBackend = (services, branch) => {
    const payload = {};

    if (services["Pet Clinic"]) {
      const clinic = services["Pet Clinic"];
      const firstItem = clinic.items?.[0] || {};
      const timingMeta = deriveClinicTimingMeta(branch.timings);
      payload.clinicDetails = {
        name: branch.branchName,
        about: branch.aboutShop,
        ...timingMeta,
        petsSupported: firstItem.petTypes || [],
        consultationFee: firstItem.consultationFee || "",
        services: clinic.items || [],
        clinicType: clinic.clinicTypes || [],
        openStatus: timingMeta.openStatus || "Open",
        openingTime: timingMeta.openingTime || "10:00 AM",
        closingTime: timingMeta.closingTime || "08:00 PM",
      };
    }

    if (services["Pet Grooming"]) {
      const grooming = services["Pet Grooming"];
      const firstSrv = grooming.services?.[0] || {};
      payload.groomingDetails = {
        serviceName: grooming.services || [],
        packages: grooming.packages || [],
        timeRange: { startTime: grooming.slotTime?.start || "09:00", endTime: grooming.slotTime?.end || "19:00" },
        serviceMode: {
          inStore: (grooming.serviceMode || []).includes("In-store"),
          inHome: (grooming.serviceMode || []).includes("In-home"),
          inMobile: (grooming.serviceMode || []).includes("In-mobile"),
        },
        petType: Array.isArray(firstSrv.petType) ? firstSrv.petType : (firstSrv.petType ? [firstSrv.petType] : []),
      };
    }

    if (services["Pet Store"]) {
      const petStore = services["Pet Store"];
      const firstItem = petStore.items?.[0] || {};
      payload.petShopDetails = {
        categories: petStore.categories || firstItem.categories || [],
        supportedPets: petStore.supportedPets || firstItem.petTypes || [],
        about: branch.aboutShop || "Curated selection of the best treats and accessories for your pets."
      };
    }

    if (services["Pet Daycare"]) {
      const daycare = services["Pet Daycare"];
      const firstItem = daycare.items?.[0] || {};
      payload.daycareDetails = {
        dayCareType: daycare.dayCareType || "General",
        breedType: daycare.petTypes || firstItem.petTypes || [],
        petSizes: daycare.petSizes || firstItem.petSizes || [],
        facilities: daycare.amenities || daycare.facilities || [],
        services: daycare.services || [],
        packages: daycare.packages || [],
        consultationFee: { amount: Number(daycare.consultationFee?.amount || 0), currency: "INR" },
        description: branch.aboutShop || "Safe, supervised, and fun environment for your furry friends."
      };
    }

    if (services["Pet Sales"]) {
      const sales = services["Pet Sales"];
      const processedItems = (sales.items || []).map((item) => {
        const breedsName = { dogs: [], cats: [], fish: [], birds: [], smallPets: [] };
        const selectedType = item.petTypes[0] || "";
        (item.petBreeds || []).forEach((breed) => {
          const breedLower = breed.toLowerCase();
          const cleanName = breed.split(" (")[0].trim();
          if (breedLower.includes("(dog)")) breedsName.dogs.push(cleanName);
          else if (breedLower.includes("(cat)")) breedsName.cats.push(cleanName);
          else if (breedLower.includes("(fish)")) breedsName.fish.push(cleanName);
          else if (breedLower.includes("(bird)")) breedsName.birds.push(cleanName);
          else breedsName.smallPets.push(cleanName);
        });
        return { ...item, breedsName, petTypes: selectedType ? [selectedType] : [], vaccinated: !!item.vaccinated, kciRegistered: !!item.kciRegistered };
      });
      const firstItem = processedItems[0] || {};
      payload.petSalesDetails = {
        supportedPets: firstItem.petTypes || [],
        breedsName: firstItem.breedsName || { dogs: [], cats: [], fish: [], birds: [], smallPets: [] },
        breedAgeRange: firstItem.ageRange ? `${firstItem.ageRange.min} ${firstItem.ageRange.minUnit || 'Days'} - ${firstItem.ageRange.max} ${firstItem.ageRange.maxUnit || 'Days'}` : "45-60 Days",
        kciRegistered: !!firstItem.kciRegistered,
        vaccinationProvided: !!firstItem.vaccinated,
        amountRange: { min: Number(firstItem.amountRange?.min || 25000), max: Number(firstItem.amountRange?.max || 80000) },
        salesServices: processedItems,
      };
    }

    if (services["Pet Breeder"]) {
      const breeder = services["Pet Breeder"];
      payload.breederDetails = {
        breederName: branch.branchName || "",
        petType: breeder.petTypes || [],
        phone: branch.branchPhone || "",
        email: branch.branchEmail || "",
        address: branch.mapLocation || branch.branchLocation || "",
        experienceYears: parseInt(branch.experience) || 0,
        specialization: (breeder.petTypes && breeder.petTypes.length > 0) ? breeder.petTypes[0] : "Other",
      };
    }

    if (services["Pet Training"]) {
      const training = services["Pet Training"];
      payload.trainingDetails = {
        trainingType: (training.trainingTypes || []).join(", "),
        petType: training.petTypes || [],
        servicableAreas: typeof training.serviceableAreas === 'string' ? training.serviceableAreas.split(",").map(s => s.trim()) : training.serviceableAreas || [],
        trainingServices: training.items || [],
        trainingPackages: training.packages || [],
        minAge: training.minAge || "",
        maxAge: training.maxAge || "",
        maxPetsPerBatch: training.maxPetsPerBatch || "",
      };
    }

    if (services["Pet Sitter/Walker"]) {
      const sitter = services["Pet Sitter/Walker"];
      payload.sittingWalkerDetails = {
        petSizeWithTypes: { sizes: sitter.petSizes || [], types: sitter.petTypes || [] },
        servicableAreas: typeof sitter.serviceableAreas === 'string' ? sitter.serviceableAreas.split(",").map(s => s.trim()) : sitter.serviceableAreas || [],
        sittingServices: sitter.items || [],
        languages: typeof sitter.languages === 'string' ? sitter.languages.split(",").map(s => s.trim()) : sitter.languages || [],
        lastMinuteBookingProvided: !!sitter.lastMinuteBooking,
        others: sitter.others ? [sitter.others] : [],
      };
    }

    return payload;
  };

  const buildAddStorePayload = (branch) => {
    return {
      vendor: {
        firstName: storeOwnerName,
        lastName: storeOwnerLastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        gender: formData.gender,
      },
      branch: {
        name: branch.branchName,
        email: branch.branchEmail,
        phone: branch.branchPhone,
        location: branch.branchLocation,
        about: branch.aboutShop,
        experience: branch.experience || "0 Years",
        petTypes: branch.branchPetTypes || [],
        paymentMode: branch.paymentMethods || [],
        openingDate: branch.branchOpeningDate || null,
        dataStoreType: branch.dataStoreType || "",
        timings: {
          monday: branch.timings?.Monday || "",
          tuesday: branch.timings?.Tuesday || "",
          wednesday: branch.timings?.Wednesday || "",
          thursday: branch.timings?.Thursday || "",
          friday: branch.timings?.Friday || "",
          saturday: branch.timings?.Saturday || "",
          sunday: branch.timings?.Sunday || "Closed",
        },
        addressDetails: {
          type: "Branch",
          addressText: branch.mapLocation || branch.branchLocation || "",
          flatNo: branch.branchAddress?.flat || "",
          area: branch.branchAddress?.area || "",
          city: branch.branchAddress?.city || "",
          state: branch.branchAddress?.state || "",
          country: branch.branchAddress?.country || "IN",
          pincode: branch.branchAddress?.pincode || "",
          latitude: branch.latitude ? parseFloat(branch.latitude) : null,
          longitude: branch.longitude ? parseFloat(branch.longitude) : null,
        },
        services: mapServicesToBackend(branch.services, branch)
      }
    };
  };

  const buildCreateCompanyPayload = () => {
    return {
      user: {
        firstName: formData.firstName || "",
        lastName: formData.lastName || "",
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        gender: formData.gender,
        profile: "",
      },
      company: {
        name: formData.businessName,
        email: formData.companyEmail || "",
        phoneNo: formData.companyPhone || "",
        website: formData.companyWebsite || "",
        servicesProvided: formData.featureNeeds || [],
        experienceDateOfCreation: formData.businessOpeningDate || "",
        businessType: formData.businessModel || "",
        aboutCompany: formData.aboutCompany?.trim() || "",
        petTypes: formData.petTypes || [],
        addressDetails: {
          addressText: formData.ownerAddress.flat || "",
          area: formData.ownerAddress.area || "",
          city: formData.ownerAddress.city || "",
          state: formData.ownerAddress.state || "",
          country: formData.ownerAddress.country || "",
          pincode: formData.ownerAddress.pincode || "",
          landmark: "",
          logo: ""
        },
      },
      branches: branches.map((b) => ({
        name: b.branchName || "",
        branchType: b.featureType?.[0]?.toLowerCase().replace("pet ", "") || "",
        phone: b.branchPhone || "",
        email: b.branchEmail || "",
        location: b.branchLocation || "",
        petTypes: b.branchPetTypes || [],
        paymentMode: b.paymentMethods || [],
        experience: b.experience || calculateExperience(b.branchOpeningDate) || "0 Years",
        openingDate: b.branchOpeningDate || null,
        dataStoreType: b.dataStoreType || "manual",
        about: b.aboutShop || "",
        isEmailVerified: b.verificationChecks?.isEmailVerified || false,
        isPhoneVerified: b.verificationChecks?.isPhoneVerified || false,
        manualVisit: b.verificationChecks?.manualVisit || false,
        videoCallVerification: b.verificationChecks?.videoCallVerification || false,
        liveVideoVerification: b.verificationChecks?.liveVideoVerification || false,
        timings: {
          monday: b.timings?.Monday || "",
          tuesday: b.timings?.Tuesday || "",
          wednesday: b.timings?.Wednesday || "",
          thursday: b.timings?.Thursday || "",
          friday: b.timings?.Friday || "",
          saturday: b.timings?.Saturday || "",
          sunday: b.timings?.Sunday || "",
        },
        addressDetails: {
          addressText: b.mapLocation || b.branchLocation || "",
          flatNo: b.branchAddress?.flat || "",
          area: b.branchAddress?.area || "",
          city: b.branchAddress?.city || "",
          state: b.branchAddress?.state || "",
          country: b.branchAddress?.country || "",
          pincode: b.branchAddress?.pincode || "",
          latitude: b.latitude ? parseFloat(b.latitude) : null,
          longitude: b.longitude ? parseFloat(b.longitude) : null,
        },
        services: mapServicesToBackend(b.services, b),
      })),
    };
  };

  // ════════════════════════════════════════════════════════════════
  // UPDATED handleSubmit
  // ════════════════════════════════════════════════════════════════
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // ── EDIT MODE ──────────────────────────────────────────────
      if (editingBusinessId) {
        let res;

        if (!isAddingNewStoreOnly) {
          const payload = buildCompanyUpdatePayload();
          res = await updateCompanyAndStores(editingBusinessId, payload);
          alert("Company & stores updated successfully!");
        } else {
          const payload = buildStoreEditPayload(branches[0]);
          res = await updateSingleStore(editingBusinessId, payload);
          alert("Store updated successfully!");
        }

        // Delete removed media
        for (const branch of branches) {
          if (branch.removeLogoRequested && branch.branchId) {
            try { await deleteBranchLogo(branch.branchId); } catch (logoErr) { console.error("Failed to delete branch logo:", logoErr?.response?.data || logoErr.message); }
          }
          if (Array.isArray(branch.removedImagePaths) && branch.removedImagePaths.length > 0 && branch.branchId) {
            for (const imagePath of branch.removedImagePaths) {
              try { await deleteBranchImage(branch.branchId, imagePath); } catch (imgErr) { console.error("Failed to delete branch image:", imgErr?.response?.data || imgErr.message); }
            }
          }
        }

        // Upload images
        if (formData.profile || formData.businessProfile || branches.some((b) => b.morePhotos?.length > 0)) {
          await uploadImages({
            userId: formData.userId || res?.data?.userId,
            businessId: editingBusinessId,
            branches,
            profileImage: formData.profile,
            businessProfile: formData.businessProfile,
          });
        }

        // ── EDIT MODE: Trigger L3 immediately if userVerificationSent is checked ──
        await triggerL3ForBranches(branches);

        await fetchAllVendors();
        resetForm();
        setShowPopup(false);
        return;
      }

      // ── CREATE MODE ────────────────────────────────────────────
      if (addMode === "storeOnly") {
        if (!validateStep2()) {
          alert("Please fill all required fields correctly");
          return;
        }

        const payload = buildAddStorePayload(branches[0]);
        console.log("AddStore payload:", payload);
        const res = await addBranchToCompany(payload);

        // Attach the real branchId returned by the API
        const newBranchId = res?.data?.branches?.[0]?.id || res?.data?.id;
        const updatedBranch = { ...branches[0], branchId: newBranchId };

        // Upload images
        if (updatedBranch.morePhotos?.length > 0) {
          await uploadImages({
            userId: res?.data?.userId,
            businessId: res?.data?.compId || null,
            branches: [updatedBranch],
            profileImage: null,
            businessProfile: null,
          });
        }

        alert("Store added successfully!");
        await fetchAllVendors();

        // ── ADD MODE: Trigger L3 AFTER save ──
<<<<<<< Updated upstream
        const l3TargetId = res?.data?.vendorDetails?.UserId || res?.data?.userId || newBranchId;
=======
        const l3TargetId = res?.data?.vendorDetails?.userId || res?.data?.userId || newBranchId;
>>>>>>> Stashed changes
        if (l3TargetId) {
          try {
            const l3Res = await sendL3Verification(l3TargetId);
            console.log("L3 verification sent:", l3Res);
            alert(`L3 Verification initiated for user ID: ${l3TargetId}`);
          } catch (l3Err) {
            console.error("L3 verification failed:", l3Err?.response?.data || l3Err.message);
            alert(`L3 Verification failed: ${l3Err?.response?.data?.message || l3Err.message}`);
          }
        }

        // Return to first step
        resetForm();
        return;
      }

      // ── FULL COMPANY CREATE ────────────────────────────────────
      if (!validateStep1()) {
        alert("Please fill all required fields correctly");
        return;
      }

      const payload = buildCreateCompanyPayload();
      console.log("Create company payload:", payload);
      const res = await createBusiness(payload);

      // Attach real branchIds from response
      const updatedBranches = branches.map((b, idx) => ({
        ...b,
        branchId: res?.data?.branches?.[idx]?.id || b.branchId,
      }));

      // Upload images
      if (formData.profile || formData.businessProfile || updatedBranches.some((b) => b.morePhotos?.length > 0)) {
        await uploadImages({
          userId: res?.data?.userId,
          businessId: res?.data?.compId,
          branches: updatedBranches,
          profileImage: formData.profile,
          businessProfile: formData.businessProfile,
        });
      }

      alert("Vendor & stores created successfully!");
      await fetchAllVendors();

      // ── Trigger L3 AFTER save ──
      const branchesNeedingL3 = updatedBranches.filter((b) => b.branchId);

      if (branchesNeedingL3.length > 0) {
<<<<<<< Updated upstream
        const l3TargetId = res?.data?.vendorDetails?.UserId || res?.data?.userId || res?.data?.compId;
=======
        const l3TargetId = res?.data?.vendorDetails?.userId || res?.data?.userId || res?.data?.compId;
>>>>>>> Stashed changes
        if (l3TargetId) {
          try {
            const l3Res = await sendL3Verification(l3TargetId);
            console.log("L3 sent:", l3Res);
            alert(`L3 Verification initiated.`);
          } catch (l3Err) {
            console.error("L3 failed:", l3Err?.response?.data || l3Err.message);
            alert(`L3 Verification failed: ${l3Err?.response?.data?.message || l3Err.message}`);
          }
        }
      }

      // Return to first step
      resetForm();
      return;

    } catch (err) {
      console.error("Submit failed:", err);
      alert("Action failed. Check console.");
    }
  };

  const deleteBusiness = async (businessId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/${businessId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting business:", error.response ? error.response.data : error.message);
      throw error;
    }
  };

  useEffect(() => { fetchAllVendors(); }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      gender: "",
      profile: null,
      ownerAddress: { flat: "", area: "", city: "", state: "", country: "", pincode: "" },
      businessName: "",
      businessProfile: null,
      featureNeeds: [],
      businessModel: "",
      experience: "",
      managePreviousWork: "",
      companyVerification: {
        manualVisit: false, emailVerification: false, numberVerification: false,
        callVerification: false, liveVideoVerification: false, videoCallVerification: false, userVerificationSent: false,
      },
    });
    setBranches([{
      name: "", branchName: "", branchLocation: "", featureType: [], experience: "", dataStoreType: "",
      managePreviousWork: "", branchbussinessName: "", aboutShop: "", morePhotos: [], removedImagePaths: [],
      removeLogoRequested: false,
      verificationChecks: {
        manualVisit: false, emailVerification: false, numberVerification: false,
        callVerification: false, liveVideoVerification: false, videoCallVerification: false, userVerificationSent: false,
      },
      isPrimary: true,
      branchAddress: { flat: "", area: "", city: "", state: "", country: "", pincode: "" },
    }]);
    setCurrentStep(2);
    setIsAddingNewStoreOnly(true);
    setAddMode("storeOnly");
    setEditingBusinessId(null);
    setEditingUser(null);
    setStoreOwnerName("");
    setErrors({});
    setOtpState({});
    setPendingL3BranchIds([]);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setOtpState((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          const state = next[key];
          if (state?.showOtp && state.secondsLeft > 0) {
            next[key] = { ...state, secondsLeft: state.secondsLeft - 1 };
          } else if (state?.showOtp && state.secondsLeft === 0 && !state.canResend) {
            next[key] = { ...state, canResend: true };
          }
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, files, options } = e.target;

    if (type === "file") {
      if (name === "profile" || name === "businessProfile") {
        if (files && files[0]) {
          setCroppingImage(files[0]);
          setCroppingType(name);
          setCroppingIndex(null);
          setShowCropper(true);
        }
      }
    } else if (name === "featureNeeds") {
      const selectedOptions = Array.from(options).filter((option) => option.selected).map((option) => option.value);
      setFormData((prev) => ({ ...prev, [name]: selectedOptions }));
    } else if (name.startsWith("ownerAddress.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        ownerAddress: { ...prev.ownerAddress, [field]: value },
      }));
      if (field === "area" && areaPincodeMap[value]) {
        setFormData((prev) => ({ ...prev, ownerAddress: { ...prev.ownerAddress, pincode: areaPincodeMap[value] } }));
      }
      if (field === "state") {
        setFormData((prev) => ({ ...prev, ownerAddress: { ...prev.ownerAddress, city: "" } }));
      }
      if (field === "country") {
        setFormData((prev) => ({ ...prev, ownerAddress: { ...prev.ownerAddress, state: "", city: "" } }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCropComplete = (croppedBlob) => {
    if (croppingType === "profile" || croppingType === "businessProfile") {
      setFormData((prev) => ({ ...prev, [croppingType]: croppedBlob }));
    } else if (croppingType === "branchLogo" && croppingIndex !== null) {
      handleBranchChange(croppingIndex, "branchLogo", croppedBlob);
    } else if (croppingType === "branchPhoto" && croppingIndex !== null) {
      const previewUrl = URL.createObjectURL(croppedBlob);
      setBranches((prev) => {
        const newBranches = [...prev];
        const existingPhotos = newBranches[croppingIndex].morePhotos || [];
        newBranches[croppingIndex] = { ...newBranches[croppingIndex], morePhotos: [...existingPhotos, { type: "new", file: croppedBlob, preview: previewUrl }] };
        return newBranches;
      });
    }

    if (pendingFiles.length > 0) {
      const nextFile = pendingFiles[0];
      setPendingFiles((prev) => prev.slice(1));
      setCroppingImage(nextFile);
    } else {
      setShowCropper(false);
      setCroppingImage(null);
      setCroppingType(null);
      setCroppingIndex(null);
      setPendingFiles([]);
    }
  };

  const handleBranchChange = (index, field, value) => {
    setBranches((prev) => {
      const newBranches = [...prev];
      if (field === "featureType") {
        const existingServices = newBranches[index].services || {};
        const newServices = {};
        value.forEach(type => { newServices[type] = existingServices[type] || { services: [], petTypes: [], terms: [] }; });
        newBranches[index] = { ...newBranches[index], featureType: value, services: newServices };
      } else if (field === "isPrimary") {
        newBranches.forEach((branch, i) => { branch.isPrimary = i === index; });
      } else {
        newBranches[index] = { ...newBranches[index], [field]: value };
      }
      return newBranches;
    });
  };

  const handleBranchFileChange = (index, files) => {
    if (files && files.length > 0) {
      const filesArray = Array.from(files);
      setCroppingImage(filesArray[0]);
      setCroppingType("branchPhoto");
      setCroppingIndex(index);
      setShowCropper(true);
      if (filesArray.length > 1) {
        setPendingFiles(filesArray.slice(1));
      } else {
        setPendingFiles([]);
      }
    }
  };

  const handleBranchAddressChange = (index, field, value) => {
    setBranches((prev) => {
      const newBranches = [...prev];
      const updatedAddress = { ...newBranches[index].branchAddress, [field]: value };
      if (field === "area" && areaPincodeMap[value]) updatedAddress.pincode = areaPincodeMap[value];
      if (field === "city" && locationPincodeMap[value]) updatedAddress.pincode = locationPincodeMap[value];
      if (field === "state") updatedAddress.city = "";
      if (field === "country") { updatedAddress.state = ""; updatedAddress.city = ""; }
      newBranches[index] = { ...newBranches[index], branchAddress: updatedAddress };
      return newBranches;
    });
  };

  const handleBranchLocationChange = (index, value) => {
    setBranches((prev) => {
      const newBranches = [...prev];
      const updatedAddress = { ...newBranches[index].branchAddress };
      if (locationPincodeMap[value]) { updatedAddress.pincode = locationPincodeMap[value]; updatedAddress.city = value; }
      newBranches[index] = { ...newBranches[index], branchLocation: value, branchAddress: updatedAddress };
      return newBranches;
    });
  };

  const triggerGalleryInput = (index) => {
    const input = document.getElementById(`gallery-input-${index}`);
    if (input) input.click();
  };

  const addBranch = () => {
    setBranches((prev) => [...prev, {
      branchName: "", branchLocation: "", branchbussinessName: "", featureType: [], branchLogo: null,
      experience: "", dataStoreType: "", managePreviousWork: "", aboutShop: "", morePhotos: [],
      removedImagePaths: [], removeLogoRequested: false,
      verificationChecks: { ...verificationDefaults },
      isPrimary: false,
      branchAddress: { flat: "", area: "", city: "", state: "", country: "", pincode: "" },
      branchPhone: "", branchEmail: "", branchPetTypes: [], paymentMethods: [],
      timings: { Monday: "", Tuesday: "", Wednesday: "", Thursday: "", Friday: "", Saturday: "", Sunday: "" },
    }]);
  };

  const removeBranch = (index) => {
    if (branches.length > 1) {
      setBranches((prev) => prev.filter((_, i) => i !== index));
    } else {
      alert("At least one branch is required");
    }
  };

  const STEP1_REQUIRED_FIELDS = ["name", "email", "phoneNumber", "gender", "businessName", "businessOpeningDate", "featureNeeds", "petTypes"];

  const isValidEmail = (email) => {
    if (!email || !email.trim()) return false;
    const commonDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "mail.com", "protonmail.com", "aol.com", "icloud.com", "rediffmail.com", "yandex.com", "zoho.com", "tutanota.com", "fastmail.com", "mailbox.org", "inbox.com", "mail.ru", "bk.ru", "rambler.ru"];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;
    const domain = email.split("@")[1]?.toLowerCase();
    return commonDomains.includes(domain);
  };

  const validateStep1 = () => {
    let newErrors = {};
    if (!formData.name?.trim()) newErrors.name = "Full name is required";
    if (!formData.email?.trim()) newErrors.email = "Email is required";
    else if (!isValidEmail(formData.email)) newErrors.email = "Please use a valid email domain (gmail.com, yahoo.com, outlook.com, etc.)";
    if (!formData.phoneNumber?.trim()) newErrors.phoneNumber = "Mobile number is required";
    else if (!/^\d{10}$/.test(formData.phoneNumber)) newErrors.phoneNumber = "Enter valid 10-digit number";
    if (!formData.gender) newErrors.gender = "Please select gender";
    if (!formData.businessName?.trim()) newErrors.businessName = "Company name is required";
    if (!formData.businessOpeningDate) newErrors.businessOpeningDate = "Company started date is required";
    if (!formData.featureNeeds || formData.featureNeeds.length === 0) newErrors.featureNeeds = "Select at least one pet service";
    if (!formData.companyPhone?.trim()) newErrors.companyPhone = "Company phone is required";
    else if (!/^\d{10,12}$/.test(formData.companyPhone)) newErrors.companyPhone = "Enter valid company phone number";
    if (!formData.companyEmail?.trim()) newErrors.companyEmail = "Company email is required";
    else if (!isValidEmail(formData.companyEmail)) newErrors.companyEmail = "Please use a valid email domain (gmail.com, yahoo.com, outlook.com, etc.)";
    if (!formData.petTypes || formData.petTypes.length === 0) newErrors.petTypes = "Select at least one pet type";
    if (!formData.aboutCompany?.trim()) newErrors.aboutCompany = "About Company is required";
    setErrors(newErrors);
    console.log("Validation errors for Step 1:", newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    let newErrors = {};
    if (isAddingNewStoreOnly) {
      if (!storeOwnerName?.trim()) newErrors.storeOwnerName = "Full name is required";
      if (!formData.email?.trim()) newErrors.email = "Email is required";
      else if (!isValidEmail(formData.email)) newErrors.email = "Please use a valid email domain (gmail.com, yahoo.com, outlook.com, etc.)";
      if (!formData.gender) newErrors.gender = "Gender is required";
      if (!formData.phoneNumber?.trim()) newErrors.phoneNumber = "Mobile number is required";
      else if (!/^\d{10}$/.test(formData.phoneNumber)) newErrors.phoneNumber = "Enter valid 10-digit mobile number";
    }

    branches.forEach((branch, index) => {
      if (!branch.branchName?.trim()) newErrors[`branchName_${index}`] = `Branch ${index + 1}: Branch name is required`;
      const branchDate = branch.branchOpeningDate?.trim();
      if (!branchDate) {
        newErrors[`branchOpeningDate_${index}`] = `Branch ${index + 1}: Opening date is required`;
      } else {
        const dateObj = new Date(branchDate);
        if (dateObj > new Date()) newErrors[`branchOpeningDate_${index}`] = `Branch ${index + 1}: Opening date cannot be in the future`;
        if (!isAddingNewStoreOnly && formData.businessOpeningDate && dateObj < new Date(formData.businessOpeningDate)) {
          newErrors[`branchOpeningDate_${index}`] = `Branch ${index + 1}: Opening date cannot be before the company opening date`;
        }
      }
      if (!branch.branchPhone?.trim()) newErrors[`branchPhone_${index}`] = `Branch ${index + 1}: Phone number is required`;
      else if (!/^\d{10}$/.test(branch.branchPhone)) newErrors[`branchPhone_${index}`] = `Branch ${index + 1}: Enter valid 10-digit phone number`;
      if (!branch.dataStoreType) newErrors[`dataStoreType_${index}`] = "Please select a Data Store Model (Manual or Software)";
      if (!branch.branchEmail?.trim()) newErrors[`branchEmail_${index}`] = `Branch ${index + 1}: Email is required`;
      else if (!isValidEmail(branch.branchEmail)) newErrors[`branchEmail_${index}`] = `Branch ${index + 1}: Please use a valid email domain (gmail.com, yahoo.com, outlook.com, etc.)`;
      if (!branch.branchLocation) newErrors[`branchLocation_${index}`] = `Branch ${index + 1}: Location is required`;
      if (!branch.featureType || branch.featureType.length === 0) newErrors[`featureType_${index}`] = `Branch ${index + 1}: Branch type is required`;

      const hasAnyTiming = Object.values(branch.timings || {}).some(t => t?.trim());
      if (!hasAnyTiming) newErrors[`timings_${index}`] = `Branch ${index + 1}: Timings are required`;

      const addr = branch.branchAddress || {};
      if (!addr.country) newErrors[`country_${index}`] = "Country is required";
      if (!addr.state) newErrors[`state_${index}`] = "State is required";
      if (!addr.city) newErrors[`city_${index}`] = "City is required";
      if (!addr.flat?.trim()) newErrors[`flat_${index}`] = "Flat/House No. is required";
      if (!addr.area?.trim()) newErrors[`area_${index}`] = "Area/Street is required";
      if (!addr.pincode?.trim()) newErrors[`pincode_${index}`] = "Pin Code is required";
      else if (!/^\d{6}$/.test(addr.pincode)) newErrors[`pincode_${index}`] = "Enter a valid 6-digit Pin Code";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    }
  };

  useEffect(() => {
    if (currentStep === 2 && editingBusinessId) {
      setBranches((currentBranches) =>
        currentBranches.map((branch) => {
          if (branch.featureType?.length === 0 && formData.featureNeeds?.length > 0) {
            const inferred = formData.featureNeeds.flatMap(need => {
              if (need === "Pet Shops") return ["Pet Store"];
              if (need === "Pet Grooming") return ["Pet Grooming"];
              return [];
            }).filter(Boolean);
            if (inferred.length > 0) return { ...branch, featureType: inferred };
          }
          return branch;
        })
      );
    }
  }, [currentStep, editingBusinessId, formData.featureNeeds]);

  const handleBack = () => { if (currentStep === 2) setCurrentStep(1); };

  const calculateExperience = (openingDate) => {
    if (!openingDate) return "";
    const start = new Date(openingDate);
    const today = new Date();
    if (start > today) return "Date is in the future";
    let years = today.getFullYear() - start.getFullYear();
    let months = today.getMonth() - start.getMonth();
    let days = today.getDate() - start.getDate();
    if (days < 0) { months--; const lastDayPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate(); days += lastDayPrevMonth; }
    if (months < 0) { years--; months += 12; }
    const parts = [];
    if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
    if (months > 0) parts.push(`${months} ${months === 1 ? "month" : "months"}`);
    if (days > 0 || parts.length === 0) parts.push(`${days} ${days === 1 ? "day" : "days"}`);
    return parts.join(" ") || "Less than a day";
  };

  const normalizeBranchAddress = (raw = {}) => {
    const addr = raw.addressDetails || {};
    return { flat: addr.flatNo || "", area: addr.area || raw.location || "", city: addr.city || "", state: addr.state || "", country: addr.country === "India" ? "IN" : addr.country || "IN", pincode: addr.pincode || "" };
  };

  const normalizeServices = (rawSource = {}) => {
    const featureType = [];
    const services = {};

    const splitComma = (val) => {
      if (Array.isArray(val)) return val.map((s) => s.trim()).filter(Boolean);
      if (typeof val === "string" && val.trim()) return val.split(",").map((s) => s.trim()).filter(Boolean);
      return [];
    };

    const hasData = (raw) => {
      if (!raw) return false;
      if (Array.isArray(raw)) return raw.length > 0;
      return Object.keys(raw).length > 0;
    };

    const getData = (key) => rawSource.services?.[key] || rawSource[key];

    const clinic = getData("clinicDetails");
    if (hasData(clinic)) {
      featureType.push("Pet Clinic");
      services["Pet Clinic"] = {
        items: (clinic.services || []).map((i) => ({ petTypes: splitComma(i.petTypes || clinic.petsSupported), services: splitComma(i.services || ""), serviceFees: i.serviceFees || {} })),
        clinicTypes: clinic.clinicType || [],
        doctors: clinic.doctors || [],
        terms: clinic.termsAndConditions ? clinic.termsAndConditions.split(" | ") : [],
      };
    }

    const daycare = getData("daycareDetails");
    if (hasData(daycare)) {
      featureType.push("Pet Daycare");
      const daycareItems = (daycare.items && daycare.items.length > 0) ? daycare.items : [{
        petSizes: daycare.petSizes || (daycare.petSize ? [daycare.petSize] : []),
        petTypes: splitComma(daycare.breedType || ""),
        foodOption: daycare.foodOption || "No Food",
        pricing: daycare.pricing || { perDay: "", perHour: "", perWeek: "" },
      }];
      services["Pet Daycare"] = {
        items: daycareItems,
        amenities: daycare.facilities || daycare.amenities || [],
        services: daycare.services || [],
        pickupLocations: daycare.serviceArea || [],
        dayCareType: daycare.dayCareType || "General",
        packages: daycare.packages || [],
        terms: daycare.termsAndConditions ? daycare.termsAndConditions.split(" | ") : [],
      };
    }

    let grooming = getData("groomingDetails");
    if (Array.isArray(grooming) && grooming.length > 0) grooming = grooming[0];
    if (hasData(grooming)) {
      featureType.push("Pet Grooming");
      const mappedServices = (grooming.serviceName || []).map(s => ({
        serviceName: splitComma(s.serviceName || ""),
        price: s.price || s.priceMin || s.priceMax || "",
        priceMin: s.price || "",
        priceMax: s.price || "",
        petType: splitComma(s.petType || grooming.petType || ""),
        duration: s.duration || "",
        lifeStage: s.lifeStage || []
      }));
      services["Pet Grooming"] = {
        serviceMode: (() => { const modes = grooming.serviceMode || {}; const res = []; if (modes.inStore) res.push("In-store"); if (modes.inHome) res.push("In-home"); if (modes.inMobile) res.push("In-mobile"); return res; })(),
        services: mappedServices,
        packages: grooming.packages || [],
        terms: grooming.termsAndConditions ? grooming.termsAndConditions.split(" | ") : [],
        serviceableAreas: Array.isArray(grooming.pickupLocations) ? grooming.pickupLocations : (typeof grooming.pickupLocations === "string" ? grooming.pickupLocations.split(",").map((s) => s.trim()).filter(Boolean) : []),
      };
    }

    const shop = getData("petShopDetails");
    if (hasData(shop)) {
      featureType.push("Pet Store");
      services["Pet Store"] = {
        items: (shop.items || []).length > 0 ? shop.items : [{ categories: splitComma(shop.categories || ""), petTypes: splitComma(shop.supportedPets || "") }],
        terms: shop.termsAndConditions ? shop.termsAndConditions.split(" | ") : [],
      };
    }

    const sales = getData("petSalesDetails");
    if (hasData(sales)) {
      featureType.push("Pet Sales");
      services["Pet Sales"] = {
        items: (sales.salesServices || []).map(s => ({ petTypes: splitComma(s.petTypes || sales.supportedPets), petBreeds: s.petBreeds || sales.breedsName?.dogs || [], petSizes: s.petSizes || [], vaccinated: !!s.vaccinated, kciRegistered: !!s.kciRegistered })),
        terms: sales.termsAndConditions ? sales.termsAndConditions.split(" | ") : [],
      };
    }

    const training = getData("trainingDetails");
    if (hasData(training)) {
      featureType.push("Pet Training");
      services["Pet Training"] = {
        trainingTypes: typeof training.trainingType === 'string' ? training.trainingType.split(", ").filter(Boolean) : [],
        petTypes: training.petType || [],
        serviceableAreas: Array.isArray(training.servicableAreas) ? training.servicableAreas : (typeof training.servicableAreas === "string" ? training.servicableAreas.split(",").map((s) => s.trim()).filter(Boolean) : []),
        items: (training.trainingServices || []).length > 0 ? training.trainingServices : [{ serviceName: "", noOfDays: "", noOfSessions: "", timePeriod: "" }],
        packages: (training.trainingPackages || []).length > 0 ? training.trainingPackages : [{ packageName: "", serviceId: "", noOfDays: "", noOfSessions: "", durationPerHour: "" }],
        minAge: training.minAge || "",
        maxAge: training.maxAge || "",
        maxPetsPerBatch: training.maxPetsPerBatch || "",
      };
    }

    const sitter = getData("sittingWalkerDetails");
    if (hasData(sitter)) {
      featureType.push("Pet Sitter/Walker");
      services["Pet Sitter/Walker"] = {
        petSizes: sitter.petSizeWithTypes?.sizes || [],
        petTypes: sitter.petSizeWithTypes?.types || [],
        serviceableAreas: Array.isArray(sitter.servicableAreas) ? sitter.servicableAreas : (typeof sitter.servicableAreas === "string" ? sitter.servicableAreas.split(",").map((s) => s.trim()).filter(Boolean) : []),
        languages: Array.isArray(sitter.languages) ? sitter.languages.join(", ") : (sitter.languages || ""),
        items: (sitter.sittingServices || []).length > 0 ? sitter.sittingServices : [{ serviceName: "", timePeriod: "" }],
        lastMinuteBooking: sitter.lastMinuteBookingProvided === true,
        others: Array.isArray(sitter.others) ? sitter.others[0] : (sitter.others || ""),
        terms: sitter.termsAndConditions ? sitter.termsAndConditions.split(" | ") : [],
      };
    }

    return { featureType, services };
  };

  const handleEditItem = (item) => {
    resetForm();
    setEditingBusinessId(item.id);

    const mapTimings = (t) => ({
      Monday: t?.monday || "", Tuesday: t?.tuesday || "", Wednesday: t?.wednesday || "",
      Thursday: t?.thursday || "", Friday: t?.friday || "", Saturday: t?.saturday || "", Sunday: t?.sunday || "",
    });

    if (item.type === "company") {
      setAddMode("full");
      setIsAddingNewStoreOnly(false);
      setCurrentStep(1);
      const raw = item.raw;
      setFormData({
        ...formData,
        name: item.user?.name || raw.branches?.[0]?.vendor?.name || "",
        email: raw.email || "",
        phoneNumber: raw.phoneNo || "",
        gender: raw.branches?.[0]?.vendor?.gender || "",
        profile: raw.branches?.[0]?.vendor?.profile || null,
        businessName: raw.name || "",
        companyEmail: raw.email || "",
        companyPhone: raw.phoneNo || "",
        companyWebsite: raw.website || "",
        featureNeeds: raw.servicesProvided || [],
        petTypes: raw.petTypes || [],
        businessOpeningDate: raw.experienceDateOfCreation || "",
        aboutCompany: raw.aboutCompany || "",
        ownerAddress: {
          flat: item.address?.flatNo || "", area: item.address?.area || "",
          city: item.address?.city || "", state: item.address?.state || "",
          country: item.address?.country || "IN", pincode: item.address?.pincode || "",
        },
      });

      const mappedBranches = (item.branches || []).map((b) => {
        const normalized = normalizeServices(b);
        return {
          branchId: b.id,
          branchName: b.name || "",
          branchEmail: b.email || "",
          branchPhone: b.phone || "",
          branchLocation: b.location || "",
          branchAddress: { flat: b.addressDetails?.flatNo || "", area: b.addressDetails?.area || "", city: b.addressDetails?.city || "", state: b.addressDetails?.state || "", country: b.addressDetails?.country || "IN", pincode: b.addressDetails?.pincode || "" },
          timings: mapTimings(b.timings),
          morePhotos: (b.images || []).map((path) => ({ type: "existing", path })),
          removedImagePaths: [],
          removeLogoRequested: false,
          branchOpeningDate: b.openingDate || "",
          dataStoreType: b.dataStoreType || "manual",
          aboutShop: b.about || "",
          paymentMethods: Array.isArray(b.paymentMode) ? b.paymentMode : (typeof b.paymentMode === 'string' ? b.paymentMode.split(',').map(s => s.trim()) : []),
          featureType: normalized.featureType,
          services: normalized.services,
          verificationChecks: { ...verificationDefaults, ...(b.verificationChecks || {}) },
        };
      });
      setBranches(mappedBranches);
    } else if (item.type === "standalone-branch") {
      setAddMode("storeOnly");
      setIsAddingNewStoreOnly(true);
      setCurrentStep(2);
      const raw = item.raw;
      setFormData((prev) => ({
        ...prev,
        firstName: raw.vendor?.firstName || "",
        lastName: raw.vendor?.lastName || "",
        email: raw.vendor?.email || raw.email || "",
        phoneNumber: raw.vendor?.phoneNumber || raw.phone || "",
        gender: raw.vendor?.gender || "",
        profile: raw.vendor?.profile || null,
        featureNeeds: featureNeedsOptions,
      }));
      setStoreOwnerName(raw.vendor?.firstName || "");
      setStoreOwnerLastName(raw.vendor?.lastName || "");

      const normalized = normalizeServices(raw);
      setBranches([{
        branchId: raw.id,
        branchName: raw.name || "",
        branchEmail: raw.email || "",
        branchPhone: raw.phone || "",
        branchLogo: raw.logo || null,
        branchLocation: raw.location || "",
        mapLocation: raw.addressDetails?.addressText || raw.location || "",
        latitude: raw.addressDetails?.latitude || "",
        longitude: raw.addressDetails?.longitude || "",
        branchAddress: { flat: raw.addressDetails?.flatNo || "", area: raw.addressDetails?.area || "", city: raw.addressDetails?.city || "", state: raw.addressDetails?.state || "", country: raw.addressDetails?.country || "IN", pincode: raw.addressDetails?.pincode || "" },
        timings: mapTimings(raw.timings),
        morePhotos: (raw.images || []).map((path) => ({ type: "existing", path })),
        removedImagePaths: [],
        removeLogoRequested: false,
        branchOpeningDate: raw.openingDate || "",
        experience: raw.experience || "",
        dataStoreType: raw.dataStoreType || "manual",
        aboutShop: raw.about || "",
        paymentMethods: Array.isArray(raw.paymentMode) ? raw.paymentMode : (typeof raw.paymentMode === 'string' ? raw.paymentMode.split(',').map(s => s.trim()) : []),
        featureType: normalized.featureType,
        services: normalized.services,
        verificationChecks: { ...verificationDefaults, ...(raw.verificationChecks || {}) },
        isPrimary: true,
      }]);
    }
    setShowPopup(true);
  };

  const handleDelete = async (index) => {
    const business = users[index];
    const businessId = business._id || business.id || business.businessProfile.businessId;
    if (!businessId) { alert("Cannot delete: Business ID not found"); return; }
    if (window.confirm("Are you sure you want to delete this business?")) {
      try {
        await deleteBusiness(businessId);
        alert("Business deleted successfully!");
        await fetchAllVendors();
      } catch (error) {
        console.error("Error deleting business:", error.response ? error.response.data : error.message);
        alert("Failed to delete business: " + (error.response ? error.response.data.message : error.message));
      }
    }
  };
  const convertExperienceToDate = (value) => {
    if (!value) return "";

    const today = new Date();
    let years = 0;
    let months = 0;

    if (value.includes(".")) {
      const parts = value.split(".");
      years = parseInt(parts[0]) || 0;
      months = parseInt(parts[1]) || 0;
    } else {
      months = parseInt(value) || 0;
    }

    const newDate = new Date(today);
    newDate.setFullYear(today.getFullYear() - years);
    newDate.setMonth(today.getMonth() - months);

    return newDate.toISOString().split("T")[0];
  };
  const convertDateToExperience = (date) => {
    if (!date) return "";

    const start = new Date(date);
    const today = new Date();

    let years = today.getFullYear() - start.getFullYear();
    let months = today.getMonth() - start.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years === 0) return `${months}`;
    return `${years}.${months}`;
  };
  const allCountries = Country.getAllCountries();
  const countries = allCountries.map((country) => ({ id: country.isoCode, name: country.name, code: country.isoCode }));

  const areaPincodeMap = {
    "Banjara Hills": "500034", "Kukatpally": "500072", "Gachibowli": "500032", "Madhapur": "500081",
    "Hitech City": "500081", "Jubilee Hills": "500033", "Secunderabad": "500003", "Abids": "500001",
    "Ameerpet": "500016", "Kondapur": "500084",
  };

  const locationPincodeMap = {
    "Hyderabad": "500001", "Warangal": "506001", "Karimnagar": "505001", "Visakhapatnam": "530001",
    "Vijayawada": "520001", "Bangalore": "560001", "Mysore": "570001", "Chennai": "600001",
    "Coimbatore": "641001", "Mumbai": "400001", "Pune": "411001",
  };

  const getStates = (countryCode) => {
    if (!countryCode) return [];
    return State.getStatesOfCountry(countryCode).map((state) => ({ id: state.isoCode, name: state.name, code: state.isoCode }));
  };

  const getCities = (countryCode, stateCode) => {
    if (!countryCode || !stateCode) return [];
    return City.getCitiesOfState(countryCode, stateCode).map((city) => ({ id: city.name, name: city.name }));
  };

  const featureNeedsToFeatureTypeMap = {
    "Pet Shops": ["Pet Store"], "Pet Grooming": ["Pet Grooming"], "Pet Clinic": ["Pet Clinic"],
    "Pet Sales": ["Pet Sales"], "Pet Training": ["Pet Training"], "Pet Daycare": ["Pet Daycare"],
    "Pet Breeder": ["Pet Breeder"], "Pet Sitter/Walker": ["Pet Sitter/Walker"],
  };

  const serviceOptionsByFeatureType = {
    "Pet Clinic": ["General Consultation", "Vaccination", "Diagnostic Tests", "Surgery", "Post-Surgery Care", "Emergency", "Nutrition Consultation", "Health Certificate"],
    "Pet Grooming": ["Bath & Blow Dry", "Hair Cut / Styling", "Nail Clipping", "Ear Cleaning", "Teeth Cleaning", "De-shedding", "Flea & Tick Treatment", "Puppy Grooming", "Full Grooming Package"],
    "Pet Daycare": ["Day Boarding", "Half Day Care", "Full Day Care", "Hourly Day Care", "Play Time & Socialization", "Feeding Support", "Rest / Nap Area", "Basic Grooming (optional)", "Medication Support (non-medical)"],
    "Pet Store": ["Food", "Clothes", "Accessories", "Grooming"],
  };

  const featureNeedsOptions = ["Pet Shops", "Pet Grooming", "Pet Training", "Pet Daycare", "Pet Breeder", "Pet Clinic", "Pet Sitter/Walker", "Pet Sales"];
  const petType = ["Dog", "Cat", "Birds", "Fish", "Small Pets"];
  const petList = petType.map((option) => ({ id: option, name: option }));
  const featureNeedsListItems = featureNeedsOptions.map((option) => ({ id: option, name: option }));
  const businessModelOptions = ["Single", "Franchise"];
  const dataStoreTypeOptions = ["manual", "software"];

  const getFilteredFeatureTypeListItems = (selectedFeatureNeeds) => {
    return getFilteredFeatureTypeOptions(selectedFeatureNeeds).map((type) => ({ id: type, name: type }));
  };

  const getFilteredFeatureTypeOptions = (selectedFeatureNeeds) => {
    if (!selectedFeatureNeeds || selectedFeatureNeeds.length === 0) return [];
    const allFeatureTypes = new Set();
    selectedFeatureNeeds.forEach((need) => {
      if (featureNeedsToFeatureTypeMap[need]) featureNeedsToFeatureTypeMap[need].forEach((type) => allFeatureTypes.add(type));
    });
    return Array.from(allFeatureTypes);
  };

  const initAutocomplete = (input, index) => {
    if (!window.google || !input) return;
    const autocomplete = new window.google.maps.places.Autocomplete(input, { fields: ["formatted_address", "geometry", "address_components"], componentRestrictions: { country: "in" } });
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;
      let country = "", stateName = "", stateCode = "", city = "", pincode = "";
      place.address_components.forEach(component => {
        const types = component.types;
        if (types.includes("country")) country = component.short_name;
        if (types.includes("administrative_area_level_1")) stateName = component.long_name;
        if (types.includes("locality") || types.includes("sublocality_level_1") || types.includes("administrative_area_level_2")) city = component.long_name;
        if (types.includes("postal_code")) pincode = component.long_name;
      });
      const matchedState = State.getStatesOfCountry(country).find(s => s.name.toLowerCase() === stateName.toLowerCase());
      stateCode = matchedState?.isoCode || "";
      const cityList = City.getCitiesOfState(country, stateCode);
      const matchedCity = cityList.find(c => c.name.toLowerCase().includes(city.toLowerCase()));
      const finalCity = matchedCity?.name || city || "";
      setBranches(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], mapLocation: place.formatted_address, latitude: place.geometry.location.lat(), longitude: place.geometry.location.lng(), branchAddress: { ...updated[index].branchAddress, country, state: stateCode, city: finalCity, pincode } };
        return updated;
      });
    });
  };

  const applyTimingsToAll = (branchIndex) => {
    const branch = branches[branchIndex];
    const baseTime = branch.timings?.Monday || Object.values(branch.timings || {}).find(t => t);
    if (!baseTime) { alert("Please set timing for at least one day first."); return; }
    const newTimings = { Monday: baseTime, Tuesday: baseTime, Wednesday: baseTime, Thursday: baseTime, Friday: baseTime, Saturday: baseTime, Sunday: baseTime };
    handleBranchChange(branchIndex, "timings", newTimings);
  };

  // console.log(listItems, "responsee");

  const isAnySelected = selectedRows.length > 0;
  const verificationLabels = [
    ["manualVisit", "Manual Visit"], ["emailVerification", "Email Verification"],
    ["numberVerification", "Number Verification"], ["callVerification", "Call Verification"],
    ["liveVideoVerification", "Live Video Verification"], ["videoCallVerification", "Video Call Verification"],
  ];

  const renderVerificationSection = ({ title, values, onChange }) => (
    <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, marginTop: 10 }}>
      <h6 style={{ margin: "0 0 8px 0" }}>{title}</h6>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
        {verificationLabels.map(([key, label]) => (
          <label key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={!!values?.[key]} onChange={(e) => onChange(key, e.target.checked)} />
            {label}
          </label>
        ))}
      </div>
      <label style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 8 }}>
        <input type="checkbox" checked={!!values?.userVerificationSent} onChange={(e) => onChange("userVerificationSent", e.target.checked)} />
        Sent User Verification
      </label>
    </div>
  );

  // ════════════════════════════════════════════════════════════════
  // UPDATED renderOtpBlock – uses real API via startOtpTimer / verifyOtpCode
  // ════════════════════════════════════════════════════════════════
  const renderOtpBlock = ({ otpKey }) => {
    const state = otpState[otpKey] || {};
    return (
      <div style={{ marginTop: 6 }}>
        {state.sendError && (
          <small style={{ color: "red", display: "block", marginBottom: 4 }}>{state.sendError}</small>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {state.showOtp && (
            <input
              type="text"
              placeholder="Enter OTP"
              value={state.otp || ""}
              onChange={(e) =>
                setOtpState((prev) => ({
                  ...prev,
                  [otpKey]: { ...(prev[otpKey] || {}), otp: e.target.value.replace(/\D/g, "").slice(0, 6) },
                }))
              }
              style={{ maxWidth: 160 }}
            />
          )}
          {state.showOtp && (
            <button
              type="button"
              className={styles["add-btn"]}
              onClick={() => verifyOtpCode(otpKey)}
              disabled={!state.otp || state.otp.trim().length < 4}
            >
              Submit OTP
            </button>
          )}
        </div>
        {state.showOtp && state.secondsLeft > 0 && (
          <small style={{ color: "#666" }}>Resend in {state.secondsLeft}s</small>
        )}
        {state.showOtp && state.canResend && (
          <button
            type="button"
            style={{ background: "none", border: "none", color: "#000", textDecoration: "underline", cursor: "pointer", fontSize: 13, padding: 0, marginTop: 4 }}
            onClick={() => startOtpTimer(otpKey)}
          >
            Resend OTP
          </button>
        )}
        {state.verified && <small style={{ color: "green" }}>✓ Verified</small>}
        {state.sending && <small style={{ color: "#888" }}>Sending OTP…</small>}
      </div>
    );
  };

  return (
    <>
      <Header />
      <div className={styles["vendor-container"]}>
        <div className={styles["vendor-header"]} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>List Your Business</h2>
        </div>

        {loading ? (
          <div className={styles["loading"]}>Loading...</div>
        ) : null}

        {showPopup && (
          <div className={styles["full-page-form"]}>
            <div className={styles["form-container-main"]} style={{ background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>


              {/* Business Type Selection */}
              <div style={{ padding: "0 10px", marginBottom: "20px", display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap", borderBottom: "1px solid #eee", paddingBottom: "20px" }}>
                <span style={{ fontWeight: "600", fontSize: "1.05rem", color: "#333" }}>Registration Type:</span>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.95rem" }}>
                  <input
                    type="radio"
                    name="registrationType"
                    checked={isAddingNewStoreOnly}
                    onChange={() => {
                      setIsAddingNewStoreOnly(true);
                      setAddMode("storeOnly");
                      setCurrentStep(2);
                    }}
                    style={{ width: "16px", height: "16px", accentColor: "#000" }}
                  />
                  Single Branch
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.95rem" }}>
                  <input
                    type="radio"
                    name="registrationType"
                    checked={!isAddingNewStoreOnly}
                    onChange={() => {
                      setIsAddingNewStoreOnly(false);
                      setAddMode("full");
                      setCurrentStep(1);
                    }}
                    style={{ width: "16px", height: "16px", accentColor: "#000" }}
                  />
                  Company with Multiple Branches
                </label>
              </div>

              {!isAddingNewStoreOnly && (
                <div className={styles["progress-indicator"]}>
                  <div className={styles["progress-step"]}>
                    <div className={`${styles["step-circle"]} ${currentStep >= 1 ? styles["active"] : ""}`}>
                      {currentStep === 1 && <span className={styles["dog-icon"]}>🐕</span>}
                      <span className={styles["step-number"]}>1</span>
                    </div>
                  </div>
                  <div className={styles["progress-line"]}></div>
                  <div className={styles["progress-step"]}>
                    <div className={`${styles["step-circle"]} ${currentStep >= 2 ? styles["active"] : ""}`}>
                      {currentStep === 2 && <span className={styles["dog-icon"]}>🐕</span>}
                      <span className={styles["step-number"]}>2</span>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={currentStep === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className={styles["popup-form"]}>
                {currentStep === 1 && !isAddingNewStoreOnly && (
                  <div className={styles["step-content"]}>
                    <h4 className={styles["step-title"]}>Enter User information</h4>
                    <div className={styles["form-grid"]}>
                      <div className={styles["form-column"]}>
                        <div className={styles["form-field"]}>
                          <label>Full name <span style={{ color: "#e74c3c" }}>*</span></label>
                          <input name="name" type="text" value={formData.name} onChange={handleChange} placeholder="Enter first Name" />
                          {errors.name && <p className={styles["error"]}>{errors.name}</p>}
                        </div>
                        <div className={styles["form-field"]}>
                          <label>Email <span style={{ color: "#e74c3c" }}>*</span></label>
                          <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Enter Email id" />
                          {errors.email && <p className={styles["error"]}>{errors.email}</p>}
                        </div>
                        <div className={styles["form-field"]}>
                          <label>Company Name <span style={{ color: "#e74c3c" }}>*</span></label>
                          <input type="text" value={formData.businessName} onChange={handleChange} name="businessName" placeholder="Enter Business name" />
                          {errors.businessName && <p className={styles["error"]}>{errors.businessName}</p>}
                        </div>
                        <div className={styles["form-field"]}>
                          <label>Company Phone <span style={{ color: "#e74c3c" }}>*</span></label>
                          <input type="text" name="companyPhone" value={formData.companyPhone || ""} onChange={(e) => { const onlyNumbers = e.target.value.replace(/[^0-9]/g, ""); setFormData(prev => ({ ...prev, companyPhone: onlyNumbers })); }} placeholder="Enter Company Phone Number" maxLength="10" />
                          {errors.companyPhone && <p className={styles["error"]}>{errors.companyPhone}</p>}
                        </div>
                        <div className={styles["form-field"]}>
                          <MultiSelectDropdown listItems={featureNeedsListItems} selectedIds={formData.featureNeeds} setSelectedIds={(ids) => setFormData((prev) => ({ ...prev, featureNeeds: ids }))} heading="Pet Services" mandatory={true} />
                          {errors.featureNeeds && <p className={styles["error"]}>{errors.featureNeeds}</p>}
                        </div>
                        {/* <div className={styles["form-field"]}>
                        <label>Company Started <span style={{ color: "#e74c3c" }}>*</span></label>
                        <input type="date" name="businessOpeningDate" value={formData.businessOpeningDate || ""} onChange={(e) => { setFormData(prev => ({ ...prev, businessOpeningDate: e.target.value })); }} max={new Date().toISOString().split("T")[0]} />
                        {errors.businessOpeningDate && <p className={styles["error"]}>{errors.businessOpeningDate}</p>}
                        {formData.businessOpeningDate && <div style={{ marginTop: "8px", fontSize: "0.95rem", color: "#444", fontWeight: "500" }}>Experience: <strong>{calculateExperience(formData.businessOpeningDate)}</strong></div>}
                      </div> */}
                        <div className={styles["form-field"]}>
                          <label>
                            Company Started <span style={{ color: "#e74c3c" }}>*</span>
                          </label>

                          {/* 🔹 Experience Input */}
                          <input
                            type="text"
                            placeholder="Enter experience (e.g. 6 or 6.6)"
                            value={experienceInput}
                            onChange={(e) => {
                              const value = e.target.value;

                              // Allow only numbers + dot
                              if (!/^\d*\.?\d*$/.test(value)) return;

                              setExperienceInput(value);

                              const calculatedDate = convertExperienceToDate(value);

                              setFormData((prev) => ({
                                ...prev,
                                businessOpeningDate: calculatedDate,
                              }));
                            }}
                          />

                          {/* 🔹 Date Picker */}
                          <input
                            type="date"
                            name="businessOpeningDate"
                            value={formData.businessOpeningDate || ""}
                            onChange={(e) => {
                              const date = e.target.value;

                              setFormData((prev) => ({
                                ...prev,
                                businessOpeningDate: date,
                              }));

                              // Sync back to input
                              const exp = convertDateToExperience(date);
                              setExperienceInput(exp);
                            }}
                            max={new Date().toISOString().split("T")[0]}
                          />

                          {/* 🔹 Experience Display */}
                          {formData.businessOpeningDate && (
                            <div style={{ marginTop: "8px", fontWeight: "500" }}>
                              Experience:{" "}
                              <strong>
                                {calculateExperience(formData.businessOpeningDate)}
                              </strong>
                            </div>
                          )}

                          {errors.businessOpeningDate && (
                            <p className={styles["error"]}>{errors.businessOpeningDate}</p>
                          )}
                        </div>
                      </div>

                      <div className={styles["form-column"]}>
                        <div className={styles["form-field"]}>
                          <label>Gender <span style={{ color: "#e74c3c" }}>*</span></label>
                          <select name="gender" value={formData.gender || ""} onChange={handleChange}>
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Trans">Trans</option>
                          </select>
                          {errors.gender && <p className={styles["error"]}>{errors.gender}</p>}
                        </div>
                        <div className={styles["form-field"]}>
                          <label>Mobile Number <span style={{ color: "#e74c3c" }}>*</span></label>
                          <input name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={(e) => { const value = e.target.value.replace(/\D/g, ""); setFormData((prev) => ({ ...prev, phoneNumber: value })); if (value.length > 0 && value.length < 10) setErrors((prev) => ({ ...prev, phoneNumber: "Mobile number must be 10 digits" })); else if (value.length === 10) setErrors((prev) => { const newErrors = { ...prev }; delete newErrors.phoneNumber; return newErrors; }); }} placeholder="Enter 10-digit mobile number" maxLength={10} pattern="[0-9]*" inputMode="numeric" />
                          {errors.phoneNumber && <p className={styles["error"]}>{errors.phoneNumber}</p>}
                        </div>
                        <div className={styles["form-field"]}>
                          <label>Company Email <span style={{ color: "#e74c3c" }}>*</span></label>
                          <input type="email" name="companyEmail" value={formData.companyEmail || ""} onChange={handleChange} placeholder="Enter Company Email" />
                          {errors.companyEmail && <p className={styles["error"]}>{errors.companyEmail}</p>}
                        </div>
                        <div className={styles["form-field"]}>
                          <label>Company Website</label>
                          <input type="text" name="companyWebsite" value={formData.companyWebsite || ""} onChange={handleChange} placeholder="https://www.yourcompany.com" />
                        </div>
                        <div className={styles["form-field"]}>
                          <MultiSelectDropdown listItems={petList} selectedIds={formData.petTypes} setSelectedIds={(ids) => setFormData((prev) => ({ ...prev, petTypes: ids }))} heading="Pet Type" mandatory={true} />
                          {errors.featureNeeds && <p className={styles["error"]}>{errors.featureNeeds}</p>}
                        </div>
                        <div className={styles["form-field"]}>
                          <label>Social Media Links</label>
                          <div className={styles["social-add-row"]} style={{ display: "flex", gap: "10px", marginBottom: "12px", alignItems: "flex-end" }}>
                            <div style={{ flex: 1 }}>
                              <select value={currentSocial.platform} onChange={e => setCurrentSocial(prev => ({ ...prev, platform: e.target.value }))}>
                                <option value=""> Platform</option>
                                {socialPlatforms.map(platform => (<option key={platform.id} value={platform.id}>{platform.icon} {platform.name}</option>))}
                              </select>
                            </div>
                            <div style={{ flex: 2 }}>
                              <input type="text" placeholder="Username or full link" value={currentSocial.url} onChange={e => setCurrentSocial(prev => ({ ...prev, url: e.target.value }))} />
                            </div>
                            <button type="button" onClick={handleAddSocialLink} style={{ background: "#000", color: "white", border: "none", padding: "10px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "500" }}>Add</button>
                          </div>
                          {formData?.socialLinks?.length >= 0 && (
                            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                              {formData.socialLinks.map((link, index) => {
                                const platform = socialPlatforms.find(p => p.id === link.platform);
                                return (
                                  <div key={index} style={{ display: "flex", alignItems: "center", gap: "10px", background: "#f9f9f9", padding: "8px 12px", borderRadius: "6px", fontSize: "0.95rem" }}>
                                    <span style={{ fontSize: "1.2rem" }}>{platform?.icon}</span>
                                    <span style={{ fontWeight: "500" }}>{platform?.name}:</span>
                                    <a href={link.fullUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#000", textDecoration: "none" }}>{link.url}</a>
                                    <button type="button" onClick={() => removeSocialLink(index)} style={{ marginLeft: "auto", background: "transparent", border: "none", color: "#e74c3c", fontSize: "1.1rem", cursor: "pointer" }}>×</button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={styles["form-field"]} style={{ gridColumn: "1 / -1" }}>
                        <label>About Company <span style={{ color: "#e74c3c" }}>*</span></label>
                        <textarea name="aboutCompany" value={formData.aboutCompany || ""} onChange={handleChange} placeholder="Tell us something about your company... (max 500 characters)" rows={5} maxLength={500} style={{ resize: "vertical" }} />
                        <small style={{ display: "block", marginTop: "6px", color: "#666" }}>{formData.aboutCompany?.length || 0}/500 characters</small>
                        {errors.aboutCompany && <p className={styles["error"]}>{errors.aboutCompany}</p>}
                      </div>
                      <div className={styles["address-block"]} style={{ gridColumn: "1 / -1", marginTop: "1rem" }}>
                        <h6 className={styles["address-title"]}>Address</h6>
                        <div className={styles["form-grid"]}>
                          <div className={styles["form-column"]}>
                            <div className={styles["form-field"]}>
                              <label>Country</label>
                              <select name="ownerAddress.country" value={formData.ownerAddress?.country || ""} onChange={handleChange}>
                                <option value="">Select Country</option>
                                {countries.map((country) => (<option key={country.id} value={country.code}>{country.name}</option>))}
                              </select>
                            </div>
                            <div className={styles["form-field"]}>
                              <label>State</label>
                              <select name="ownerAddress.state" value={formData.ownerAddress?.state || ""} onChange={handleChange} disabled={!formData.ownerAddress?.country}>
                                <option value="">Select State</option>
                                {formData.ownerAddress?.country && getStates(formData.ownerAddress.country).map((state) => (<option key={state.id} value={state.code}>{state.name}</option>))}
                              </select>
                            </div>
                            <div className={styles["form-field"]}>
                              <label>City</label>
                              <select name="ownerAddress.city" value={formData.ownerAddress?.city || ""} onChange={handleChange} disabled={!formData.ownerAddress?.state}>
                                <option value="">Select City</option>
                                {formData.ownerAddress?.country && formData.ownerAddress?.state && getCities(formData.ownerAddress.country, formData.ownerAddress.state).map((city) => (<option key={city.id} value={city.name}>{city.name}</option>))}
                              </select>
                            </div>
                          </div>
                          <div className={styles["form-column"]}>
                            <div className={styles["form-field"]}>
                              <label>Flat/House No.</label>
                              <input type="text" name="ownerAddress.flat" value={formData.ownerAddress?.flat || ""} onChange={handleChange} placeholder="Enter Flat/House No." />
                            </div>
                            <div className={styles["form-field"]}>
                              <label>Area/Street</label>
                              <input type="text" name="ownerAddress.area" value={formData.ownerAddress?.area || ""} onChange={handleChange} placeholder="Enter Area/Street" />
                            </div>
                            <div className={styles["form-field"]}>
                              <label>Pin Code</label>
                              <input type="text" name="ownerAddress.pincode" value={formData.ownerAddress?.pincode || ""} onChange={handleChange} placeholder="Enter Pin Code" maxLength="6" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={styles["image-upload-section"]}>
                      <div className={styles["user-image-upload"]}>
                        <label>Upload User profile</label>
                        <div className={styles["image-row"]}>
                          <div className={styles["image-upload-box"]}>
                            <input type="file" name="profile" accept="image/*" onChange={handleChange} className={styles["file-input-hidden"]} />
                            <div className={styles["upload-placeholder"]}><GalleryIcon /></div>
                          </div>
                          {formData.profile && (
                            <div className={styles["image-preview-box"]}>
                              <img src={formData.profile instanceof Blob || formData.profile instanceof File ? URL.createObjectURL(formData.profile) : typeof formData.profile === 'string' ? (formData.profile.startsWith('http') ? formData.profile : `${IMAGE_BASE_URL}${formData.profile.replace(/^\/+/, "")}`) : ""} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                              <button type="button" className={styles["remove-image-btn"]} onClick={() => setFormData(prev => ({ ...prev, profile: null }))}>×</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={styles["business-logo-upload"]}>
                      <label>Upload company profile or Logo</label>
                      <div className={styles["image-row"]}>
                        <div className={styles["logo-upload-box"]}>
                          <input type="file" name="businessProfile" accept="image/*" onChange={handleChange} className={styles["file-input-hidden"]} />
                          <div className={styles["logo-placeholder"]}><GalleryIcon /></div>
                        </div>
                        {formData.businessProfile && (
                          <div className={styles["logo-preview-box"]}>
                            <img src={URL.createObjectURL(formData.businessProfile)} alt="Business Logo" />
                            <button type="button" className={styles["remove-image-btn"]} onClick={() => setFormData(prev => ({ ...prev, businessProfile: null }))}>×</button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles["form-actions"]}>
                      <button type="button" className={styles["next-btn"]} onClick={handleNext}>Next</button>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className={styles["step-content"]}>
                    <div className={styles["step-header"]}>
                      <h4 className={styles["step-title"]}>Enter Branch Details</h4>
                      {!isAddingNewStoreOnly && (
                        <button type="button" className={styles["add-branch-btn"]} onClick={addBranch}>+ Add New Branch</button>
                      )}
                    </div>

                    {branches.map((branch, branchIndex) => (
                      <div key={branchIndex} className={styles["branch-section"]}>
                        <div className={styles["branch-header"]}>
                          <h5>Enter {branchIndex + 1}{branchIndex === 0 ? "st" : branchIndex === 1 ? "nd" : branchIndex === 2 ? "rd" : "th"} Branch Details</h5>
                          {branches.length > 1 && (
                            <a href="#" type="button" className={styles["remove-branch-link"]} onClick={(e) => { e.preventDefault(); removeBranch(branchIndex); }}>Remove</a>
                          )}
                        </div>

                        {isAddingNewStoreOnly && (
                          <div style={{ marginBottom: "18px" }}>
                            <h6 style={{ margin: "0 0 10px 0" }}>Store Owner Details</h6>
                            <div className={styles["form-grid"]}>
                              <div className={styles["form-column"]}>
                                <div className={styles["form-field"]}>
                                  <label>First Name <span style={{ color: "#000" }}>*</span></label>
                                  <input type="text" value={storeOwnerName} onChange={(e) => setStoreOwnerName(e.target.value)} placeholder="Enter First Name" />
                                  {errors.storeOwnerName && <p className={styles["error"]}>{errors.storeOwnerName}</p>}
                                </div>
                                <div className={styles["form-field"]}>
                                  <label>Email <span style={{ color: "#000" }}>*</span></label>
                                  <input type="email" value={formData.email || ""} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="Enter Email" />
                                  {errors.email && <p className={styles["error"]}>{errors.email}</p>}
                                </div>
                              </div>
                              <div className={styles["form-column"]}>
                                <div className={styles["form-field"]}>
                                  <label>Last Name <span style={{ color: "#000" }}>*</span></label>
                                  <input type="text" value={storeOwnerLastName} onChange={(e) => setStoreOwnerLastName(e.target.value)} placeholder="Enter Last Name" />
                                </div>
                                <div className={styles["form-field"]}>
                                  <label>Gender <span style={{ color: "#000" }}>*</span></label>
                                  <select value={formData.gender || ""} onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}>
                                    <option value="">Select gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Trans">Trans</option>
                                  </select>
                                  {errors.gender && <p className={styles["error"]}>{errors.gender}</p>}
                                </div>
                              </div>
                              <div className={styles["form-column"]}>
                                <div className={styles["form-field"]}>
                                  <label>Mobile Number <span style={{ color: "#000" }}>*</span></label>
                                  <input type="tel" value={formData.phoneNumber || ""} onChange={(e) => { const onlyNumbers = e.target.value.replace(/[^0-9]/g, ""); setFormData(prev => ({ ...prev, phoneNumber: onlyNumbers })); }} maxLength="10" placeholder="Enter Mobile Number" />
                                  {errors.phoneNumber && <p className={styles["error"]}>{errors.phoneNumber}</p>}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className={styles["form-grid"]}>
                          <div className={styles["form-column"]}>
                            <div className={styles["form-field"]}>
                              <label>Branch name <span style={{ color: "#e74c3c" }}>*</span></label>
                              <input type="text" value={branch.branchName} onChange={(e) => handleBranchChange(branchIndex, "branchName", e.target.value)} placeholder="Enter Branch Name" />
                              {errors[`branchName_${branchIndex}`] && <p className={styles["error"]}>{errors[`branchName_${branchIndex}`]}</p>}
                            </div>
                            <div className={styles["form-field"]}>
                              <label>
                                Branch Opening Date <span style={{ color: "#e74c3c" }}>*</span>
                              </label>

                              {/* 🔹 Experience Input */}
                              <input
                                type="text"
                                placeholder="e.g. 6 or 6.6"
                                value={branchExpInputs[branchIndex] || ""}
                                onChange={(e) => {
                                  const value = e.target.value;

                                  // allow only numbers + dot
                                  if (!/^\d*\.?\d*$/.test(value)) return;

                                  setBranchExpInputs((prev) => ({
                                    ...prev,
                                    [branchIndex]: value,
                                  }));

                                  const calculatedDate = convertExperienceToDate(value);

                                  handleBranchChange(branchIndex, "branchOpeningDate", calculatedDate);

                                  const calculatedExp = calculateExperience(calculatedDate);
                                  handleBranchChange(branchIndex, "experience", calculatedExp);
                                }}
                              />

                              {/* 🔹 Date Picker */}
                              <input
                                type="date"
                                value={branch.branchOpeningDate || ""}
                                onChange={(e) => {
                                  const selectedDate = e.target.value;

                                  // Reset error
                                  setErrors((prev) => {
                                    const newErrors = { ...prev };
                                    delete newErrors[`branchOpeningDate_${branchIndex}`];
                                    return newErrors;
                                  });

                                  if (!selectedDate) {
                                    handleBranchChange(branchIndex, "branchOpeningDate", "");
                                    handleBranchChange(branchIndex, "experience", "");
                                    setBranchExpInputs((prev) => ({
                                      ...prev,
                                      [branchIndex]: "",
                                    }));
                                    return;
                                  }

                                  const dateObj = new Date(selectedDate + "T00:00:00");

                                  if (dateObj > new Date()) {
                                    setErrors((prev) => ({
                                      ...prev,
                                      [`branchOpeningDate_${branchIndex}`]:
                                        "Opening date cannot be in the future",
                                    }));
                                  }

                                  if (
                                    !isAddingNewStoreOnly &&
                                    formData.businessOpeningDate &&
                                    dateObj < new Date(formData.businessOpeningDate + "T00:00:00")
                                  ) {
                                    setErrors((prev) => ({
                                      ...prev,
                                      [`branchOpeningDate_${branchIndex}`]:
                                        "Branch opening date cannot be before the company opening date",
                                    }));
                                  }

                                  handleBranchChange(branchIndex, "branchOpeningDate", selectedDate);

                                  const calculatedExp = calculateExperience(selectedDate);
                                  handleBranchChange(branchIndex, "experience", calculatedExp);

                                  // 🔁 Sync back to input
                                  const exp = convertDateToExperience(selectedDate);
                                  setBranchExpInputs((prev) => ({
                                    ...prev,
                                    [branchIndex]: exp,
                                  }));
                                }}
                                max={new Date().toISOString().split("T")[0]}
                                required
                              />

                              {/* Experience Display */}
                              {branch.branchOpeningDate && (
                                <div style={{ marginTop: "8px", fontSize: "0.95rem" }}>
                                  Experience: <strong>{branch.experience || "Calculating..."}</strong>
                                </div>
                              )}

                              {/* Error */}
                              {errors[`branchOpeningDate_${branchIndex}`] && (
                                <p className={styles["error"]}>
                                  {errors[`branchOpeningDate_${branchIndex}`]}
                                </p>
                              )}

                              {/* Hint */}
                              {!isAddingNewStoreOnly && formData.businessOpeningDate && (
                                <small style={{ display: "block", marginTop: "6px" }}>
                                  Must be on or after{" "}
                                  {new Date(formData.businessOpeningDate).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </small>
                              )}
                            </div>
                            <div className={styles["form-field"]}>
                              <label>Business Name (optional)</label>
                              <input type="text" value={branch.branchbussinessName} onChange={(e) => handleBranchChange(branchIndex, "branchbussinessName", e.target.value)} name="branchbussinessName" placeholder="Enter Business name" />
                            </div>
                            <div className={styles["form-field"]}>
                              <label>Branch Phone Number <span style={{ color: "#e74c3c" }}>*</span></label>
                              <input type="text" value={branch.branchPhone || ""} onChange={(e) => { const onlyNumbers = e.target.value.replace(/[^0-9]/g, ""); handleBranchChange(branchIndex, "branchPhone", onlyNumbers); }} placeholder="Enter 10-digit phone number" maxLength="10" />
                              {errors[`branchPhone_${branchIndex}`] && <p className={styles["error"]}>{errors[`branchPhone_${branchIndex}`]}</p>}
                            </div>
                          </div>

                          <div className={styles["form-column"]}>
                            <div className={styles["form-field"]}>
                              <label>Branch Location <span style={{ color: "#e74c3c" }}>*</span></label>
                              <select value={branch.branchLocation} onChange={(e) => handleBranchLocationChange(branchIndex, e.target.value)}>
                                <option value="">Select Branch location</option>
                                {Object.keys(locationPincodeMap).map((location) => (<option key={location} value={location}>{location}</option>))}
                              </select>
                              {errors[`branchLocation_${branchIndex}`] && <p className={styles["error"]}>{errors[`branchLocation_${branchIndex}`]}</p>}
                            </div>
                            <div className={styles["form-field"]}>
                              <label>Present Data store model <span style={{ color: "#e74c3c" }}>*</span></label>
                              <select value={branch.dataStoreType} onChange={(e) => { handleBranchChange(branchIndex, "dataStoreType", e.target.value); handleBranchChange(branchIndex, "managePreviousWork", ""); }}>
                                <option value="">Select Data store type</option>
                                {dataStoreTypeOptions.map((option) => (<option key={option} value={option}>{option}</option>))}
                              </select>
                              {errors[`dataStoreType_${branchIndex}`] && <p className={styles["error"]}>{errors[`dataStoreType_${branchIndex}`]}</p>}
                            </div>
                            <div className={styles["form-field"]}>
                              <label>Branch Email <span style={{ color: "#e74c3c" }}>*</span></label>
                              <input type="email" value={branch.branchEmail || ""} onChange={(e) => handleBranchChange(branchIndex, "branchEmail", e.target.value)} placeholder="Enter branch email" />
                              {errors[`branchEmail_${branchIndex}`] && <p className={styles["error"]}>{errors[`branchEmail_${branchIndex}`]}</p>}
                            </div>
                            <div className={styles["form-field"]} style={{ gridColumn: "1 / -1" }}>
                              <MultiSelectDropdown listItems={paymentOptions} selectedIds={branch.paymentMethods || []} setSelectedIds={(ids) => handleBranchChange(branchIndex, "paymentMethods", ids)} heading="Accepted Payment Methods" mandatory={true} />
                              {errors[`paymentMethods_${branchIndex}`] && <p className={styles["error"]}>{errors[`paymentMethods_${branchIndex}`]}</p>}
                            </div>
                          </div>

                          <div style={{ gridColumn: "1 / -1" }}>
                            <MultiSelectDropdown listItems={getFilteredFeatureTypeListItems(formData.featureNeeds)} selectedIds={branch.featureType} setSelectedIds={(ids) => handleBranchChange(branchIndex, "featureType", ids)} heading="Feature Type" mandatory={true} />
                            {branch.featureType.map(type => (
                              <div key={type} className={styles["feature-box"]}>
                                {type === "Pet Clinic" && <ClinicFields branch={branch} branchIndex={branchIndex} type={type} setBranches={setBranches} petList={petList} availablePetTypes={isAddingNewStoreOnly ? petList : petList.filter(p => formData.petTypes.includes(p.id))} serviceOptionsByFeatureType={serviceOptionsByFeatureType} />}
                                {type === "Pet Daycare" && <DaycareFields branch={branch} branchIndex={branchIndex} type={type} setBranches={setBranches} petList={petList} availablePetTypes={isAddingNewStoreOnly ? petList : petList.filter(p => formData.petTypes.includes(p.id))} serviceOptionsByFeatureType={serviceOptionsByFeatureType} />}
                                {type === "Pet Grooming" && <GroomingFields branch={branch} branchIndex={branchIndex} type={type} setBranches={setBranches} petList={petList} availablePetTypes={isAddingNewStoreOnly ? petList : petList.filter(p => formData.petTypes.includes(p.id))} />}
                                {type === "Pet Store" && <PetStoreFields branch={branch} branchIndex={branchIndex} type={type} setBranches={setBranches} petList={petList} availablePetTypes={isAddingNewStoreOnly ? petList : petList.filter(p => formData.petTypes.includes(p.id))} />}
                                {type === "Pet Sales" && <PetSalesFields branch={branch} branchIndex={branchIndex} type={type} setBranches={setBranches} availablePetTypes={isAddingNewStoreOnly ? petList : petList.filter(p => formData.petTypes.includes(p.id))} />}
                                {type === "Pet Breeder" && <BreederFields branch={branch} branchIndex={branchIndex} setBranches={setBranches} petList={petList} />}
                                {type === "Pet Training" && <TrainingFields branch={branch} branchIndex={branchIndex} setBranches={setBranches} petList={petList} />}
                                {type === "Pet Sitter/Walker" && <SitterFields branch={branch} branchIndex={branchIndex} setBranches={setBranches} petList={petList} />}
                              </div>
                            ))}
                            {getFilteredFeatureTypeListItems(formData.featureNeeds).length === 0 && <small style={{ color: '#ff6b35' }}>Please select Feature Needs first</small>}
                            {errors[`featureType_${branchIndex}`] && <p className={styles["error"]}>{errors[`featureType_${branchIndex}`]}</p>}
                          </div>

                          {/* Timings */}
                          <div className={styles["form-field"]} style={{ gridColumn: "1 / -1" }}>
                            <h6 style={{ marginBottom: "16px", fontSize: "0.9rem", fontWeight: "400", color: "#333" }}>
                              Branch Timings <span style={{ color: "#e74c3c" }}>*</span>
                            </h6>
                            <div style={{ marginBottom: "12px", display: 'flex', justifyContent: 'space-between', alignItems: "center" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <input type="checkbox" checked={formData.is24x7} style={{ display: 'flex', flexDirection: 'row', justifyContent: 'left', width: 'fit-content', marginTop: '-7px' }} onChange={(e) => { const checked = e.target.checked; const fullDayTimings = { Monday: "12:00 AM - 11:59 PM", Tuesday: "12:00 AM - 11:59 PM", Wednesday: "12:00 AM - 11:59 PM", Thursday: "12:00 AM - 11:59 PM", Friday: "12:00 AM - 11:59 PM", Saturday: "12:00 AM - 11:59 PM", Sunday: "12:00 AM - 11:59 PM" }; const emptyTimings = { Monday: "", Tuesday: "", Wednesday: "", Thursday: "", Friday: "", Saturday: "", Sunday: "" }; handleBranchChange(branchIndex, "is24x7", checked); handleBranchChange(branchIndex, "timings", checked ? fullDayTimings : emptyTimings); }} />
                                <label>24/7 Open</label>
                              </div>
                              <button type="button" onClick={() => applyTimingsToAll(branchIndex)} style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #ccc", background: "#fff", cursor: "pointer", fontSize: "0.85rem" }}>Apply to All Days</button>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
                                const timeRange = branch.timings?.[day] || "";
                                const [openingStr = "", closingStr = ""] = timeRange.split(" - ");
                                const [openingTime = "09:00", openingPeriod = "AM"] = openingStr.split(" ");
                                const [closingTime = "08:00", closingPeriod = "PM"] = closingStr.split(" ");
                                const [openingHour = "09", openingMin = "00"] = openingTime.split(":");
                                const [closingHour = "08", closingMin = "00"] = closingTime.split(":");
                                const hours = ["00", ...Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'))];
                                const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
                                return (
                                  <div key={day} style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", background: "#f9f9f9", padding: "12px", borderRadius: "8px", border: "1px solid #eee" }}>
                                    <div style={{ minWidth: "100px", fontWeight: "500", color: "#444" }}>{day}</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "260px" }}>
                                      <select value={openingHour} onChange={(e) => { const nv = `${e.target.value}:${openingMin} ${openingPeriod} - ${closingHour}:${closingMin} ${closingPeriod}`; handleBranchChange(branchIndex, "timings", { ...(branch.timings || {}), [day]: nv }); }} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc", background: "white", width: "80px" }}>{hours.map(h => (<option key={h} value={h}>{h}</option>))}</select>
                                      <span>:</span>
                                      <select value={openingMin} onChange={(e) => { const nv = `${openingHour}:${e.target.value} ${openingPeriod} - ${closingHour}:${closingMin} ${closingPeriod}`; handleBranchChange(branchIndex, "timings", { ...(branch.timings || {}), [day]: nv }); }} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc", background: "white", width: "80px" }}>{minutes.map(m => (<option key={m} value={m}>{m}</option>))}</select>
                                      <select value={openingPeriod} onChange={(e) => { const nv = `${openingHour}:${openingMin} ${e.target.value} - ${closingHour}:${closingMin} ${closingPeriod}`; handleBranchChange(branchIndex, "timings", { ...(branch.timings || {}), [day]: nv }); }} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc", background: "white" }}><option>AM</option><option>PM</option></select>
                                    </div>
                                    <span style={{ color: "#777", fontWeight: "bold" }}>to</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "260px" }}>
                                      <select value={closingHour} onChange={(e) => { const nv = `${openingHour}:${openingMin} ${openingPeriod} - ${e.target.value}:${closingMin} ${closingPeriod}`; handleBranchChange(branchIndex, "timings", { ...(branch.timings || {}), [day]: nv }); }} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc", background: "white", width: "80px" }}>{hours.map(h => (<option key={h} value={h}>{h}</option>))}</select>
                                      <span>:</span>
                                      <select value={closingMin} onChange={(e) => { const nv = `${openingHour}:${openingMin} ${openingPeriod} - ${closingHour}:${e.target.value} ${closingPeriod}`; handleBranchChange(branchIndex, "timings", { ...(branch.timings || {}), [day]: nv }); }} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc", background: "white", width: "80px" }}>{minutes.map(m => (<option key={m} value={m}>{m}</option>))}</select>
                                      <select value={closingPeriod} onChange={(e) => { const nv = `${openingHour}:${openingMin} ${openingPeriod} - ${closingHour}:${closingMin} ${e.target.value}`; handleBranchChange(branchIndex, "timings", { ...(branch.timings || {}), [day]: nv }); }} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc", background: "white" }}><option>AM</option><option>PM</option></select>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {errors[`timings_${branchIndex}`] && <p className={styles["error"]} style={{ marginTop: "12px" }}>{errors[`timings_${branchIndex}`]}</p>}
                          </div>
                        </div>

                        {/* Branch Address */}
                        <div className={styles["address-block"]}>
                          <h6 className={styles["address-title"]}>Branch Address</h6>
                          <div className={styles["form-grid"]}>
                            <div className={styles["form-column"]}>
                              <div className={styles["form-field"]}>
                                <div className={styles["form-field"]} style={{ gridColumn: "1 / -1" }}>
                                  <label>Branch Location (Search on Map) <span style={{ color: "#e74c3c" }}>*</span></label>
                                  <input type="text" placeholder="Search your branch location" ref={(ref) => initAutocomplete(ref, branchIndex)} value={branches[branchIndex].mapLocation || ""} onChange={(e) => handleBranchChange(branchIndex, "mapLocation", e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }} />
                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", margin: "12px 0px" }}>
                                    <input value={branch.latitude || ""} readOnly placeholder="Latitude" />
                                    <input value={branch.longitude || ""} readOnly placeholder="Longitude" />
                                  </div>
                                </div>
                                <label>Country <span style={{ color: "#e74c3c" }}>*</span></label>
                                <select value={branch.branchAddress?.country || ""} onChange={(e) => handleBranchAddressChange(branchIndex, "country", e.target.value)}>
                                  <option value="">Select Country</option>
                                  {countries.map((country) => (<option key={country.id} value={country.code}>{country.name}</option>))}
                                </select>
                                {errors[`country_${branchIndex}`] && <p className={styles["error"]}>{errors[`country_${branchIndex}`]}</p>}
                              </div>
                              <div className={styles["form-field"]}>
                                <label>State <span style={{ color: "#e74c3c" }}>*</span></label>
                                <select value={branch.branchAddress?.state || ""} onChange={(e) => handleBranchAddressChange(branchIndex, "state", e.target.value)} disabled={!branch.branchAddress?.country}>
                                  <option value="">Select State</option>
                                  {branch.branchAddress?.country && getStates(branch.branchAddress.country).map((state) => (<option key={state.id} value={state.code}>{state.name}</option>))}
                                </select>
                                {errors[`state_${branchIndex}`] && <p className={styles["error"]}>{errors[`state_${branchIndex}`]}</p>}
                              </div>
                              <div className={styles["form-field"]}>
                                <label>City <span style={{ color: "#e74c3c" }}>*</span></label>
                                <select value={branch.branchAddress?.city || ""} onChange={(e) => handleBranchAddressChange(branchIndex, "city", e.target.value)} disabled={!branch.branchAddress?.state}>
                                  <option value="">Select City</option>
                                  {branch.branchAddress?.country && branch.branchAddress?.state && getCities(branch.branchAddress.country, branch.branchAddress.state).map((city) => (<option key={city.id} value={city.name}>{city.name}</option>))}
                                </select>
                                {errors[`city_${branchIndex}`] && <p className={styles["error"]}>{errors[`city_${branchIndex}`]}</p>}
                              </div>
                            </div>
                            <div className={styles["form-column"]}>
                              <div className={styles["form-field"]}>
                                <label>Flat/House No. <span style={{ color: "#e74c3c" }}>*</span></label>
                                <input type="text" value={branch.branchAddress?.flat || ""} onChange={(e) => handleBranchAddressChange(branchIndex, "flat", e.target.value)} placeholder="Enter Flat/House No." />
                                {errors[`flat_${branchIndex}`] && <p className={styles["error"]}>{errors[`flat_${branchIndex}`]}</p>}
                              </div>
                              <div className={styles["form-field"]}>
                                <label>Area/Street <span style={{ color: "#e74c3c" }}>*</span></label>
                                <input type="text" value={branch.branchAddress?.area || ""} onChange={(e) => handleBranchAddressChange(branchIndex, "area", e.target.value)} placeholder="Enter Area/Street" />
                                {errors[`area_${branchIndex}`] && <p className={styles["error"]}>{errors[`area_${branchIndex}`]}</p>}
                              </div>
                              <div className={styles["form-field"]}>
                                <label>Pin Code <span style={{ color: "#e74c3c" }}>*</span></label>
                                <input type="text" inputMode="numeric" pattern="[0-9]*" value={branch.branchAddress?.pincode || ""} onChange={(e) => { const value = e.target.value.replace(/\D/g, ""); if (value.length <= 6) handleBranchAddressChange(branchIndex, "pincode", value); }} placeholder="Enter Pin Code" maxLength={6} />
                                {errors[`pincode_${branchIndex}`] && <p className={styles["error"]}>{errors[`pincode_${branchIndex}`]}</p>}
                              </div>
                            </div>
                          </div>
                        </div>

                        {isAddingNewStoreOnly && (
                          <div className={styles["branch-image-upload-section"]} style={{ marginBottom: "20px" }}>
                            <label>Branch Logo</label>
                            <div className={styles["image-row"]}>
                              <div className={styles["branchimage-upload-box"]}>
                                <input type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) { setCroppingImage(e.target.files[0]); setCroppingType("branchLogo"); setCroppingIndex(branchIndex); setShowCropper(true); } }} className={styles["file-input-hidden"]} />
                                <div className={styles["upload-placeholder"]}><GalleryIcon /></div>
                              </div>
                              {branch.branchLogo && (
                                <div className={styles["image-preview-box"]}>
                                  <img src={branch.branchLogo instanceof Blob ? URL.createObjectURL(branch.branchLogo) : `${IMAGE_BASE_URL}${branch.branchLogo.replace(/^\/+/, "")}`} alt="Branch Logo" style={{ borderRadius: '50%', width: '100%', height: '100%', objectFit: 'cover' }} />
                                  <button type="button" className={styles["remove-image-btn"]} onClick={() => { setBranches((prev) => { const updated = [...prev]; const currentBranch = updated[branchIndex]; const existingLogo = typeof currentBranch.branchLogo === "string" ? currentBranch.branchLogo : ""; updated[branchIndex] = { ...currentBranch, branchLogo: null, removeLogoRequested: !!existingLogo }; return updated; }); }}>×</button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className={styles["gallery-section"]}>
                          <div className={styles["gallery-header"]}>
                            <label>More Photos</label>
                            <button type="button" className={styles["gallery-icon-btn"]} onClick={() => triggerGalleryInput(branchIndex)} title="Add Images">
                              <span className={styles["gallery-icon"]}>📷</span>
                              <span>Add Images</span>
                            </button>
                          </div>
                          <input type="file" id={`gallery-input-${branchIndex}`} accept="image/*" onChange={(e) => handleBranchFileChange(branchIndex, e.target.files)} style={{ display: "none" }} />
                          {branch.morePhotos && branch.morePhotos.length > 0 && (
                            <div className={styles["photos-preview"]}>
                              {Array.from(branch.morePhotos).map((photo, photoIndex) => {
                                let imageSrc = '';
                                if (typeof photo === 'object' && photo.type === 'existing') imageSrc = photo.path.startsWith('http') ? photo.path : `${IMAGE_BASE_URL}${photo.path.replace(/^\/+/, "")}`;
                                else if (typeof photo === 'object' && photo.preview) imageSrc = photo.preview;
                                else if (photo instanceof Blob || photo instanceof File) imageSrc = URL.createObjectURL(photo);
                                else if (typeof photo === 'string') imageSrc = photo.startsWith('blob:') || photo.startsWith('http') ? photo : `${IMAGE_BASE_URL}${photo.replace(/^\/+/, "")}`;
                                if (!imageSrc) return null;
                                return (
                                  <div key={photoIndex} className={styles["photo-preview-item"]}>
                                    <img src={imageSrc} alt={`Preview ${photoIndex + 1}`} onError={(e) => { e.target.style.display = 'none'; }} />
                                    <button type="button" className={styles["remove-photo-btn"]} onClick={() => { setBranches((prev) => { const updated = [...prev]; const targetBranch = { ...updated[branchIndex] }; const photos = Array.from(targetBranch.morePhotos || []); const removed = photos[photoIndex]; const nextPhotos = photos.filter((_, idx) => idx !== photoIndex); let removedImagePaths = [...(targetBranch.removedImagePaths || [])]; if (removed && typeof removed === "object" && removed.type === "existing" && removed.path) removedImagePaths.push(removed.path); targetBranch.morePhotos = nextPhotos; targetBranch.removedImagePaths = removedImagePaths; updated[branchIndex] = targetBranch; return updated; }); }}>×</button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className={styles["form-actions"]}>
                      {!isAddingNewStoreOnly && (
                        <button type="button" className={styles["back-btn"]} onClick={handleBack}>Back</button>
                      )}
                      <button type="submit" className={styles["submit-btn"]}>Save</button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {showCropper && croppingImage && (
          <ImageCropperModal
            open={showCropper}
            image={croppingImage}
            onClose={() => {
              if (pendingFiles.length > 0) {
                const nextFile = pendingFiles[0];
                setPendingFiles((prev) => prev.slice(1));
                setCroppingImage(nextFile);
              } else {
                setShowCropper(false);
                setCroppingImage(null);
                setCroppingType(null);
                setCroppingIndex(null);
                setPendingFiles([]);
              }
            }}
            onCropComplete={handleCropComplete}
          />
        )}
      </div>
    </>
  );
};

export default VendorRegistration;