import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import styles from "../../styles/pet-sales/viewDetailsForPuppy.module.css";
import {
  Age,
  Call,
  Color,
  Gender,
  PetType,
  Size,
  ThreeDots,
  ShareIcon
} from "@/public/images/SVG";
import BackHeader from "@/components/pet-sales/backHeader";
import { IMAGE_URL } from "@/components/utilities/Constants";
import { WebApimanager } from "@/components/utilities/WebApiManager";
import useStore from "@/components/state/useStore";
import AddNewPuppyPopup from "@/components/pet-sales/AddNewPuppyPopUp";
import ChangeStatus from "@/components/pet-sales/ChangeStatus";
import SharePopup from "@/components/pet-sales/SharePopup";
import { formatInOriginalTz, parseWallClockDate } from "@/utilities/date-time-utils";

const ViewDetails = () => {
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [sharePopup, setSharePopup] = useState(false);
  
  const desktopMenuRef = useRef(null);
  const router = useRouter();
  const { slug } = router.query;

  const { getJwtToken } = useStore();
  const jwt = getJwtToken();
  const webApi = new WebApimanager(jwt);

  const FALLBACK_IMAGE = "https://zaanvar-care.b-cdn.net/media/1760510016605-how-ai-is-helping-us-understand-what-our-pets-are-saying.jpg";

  const shouldShow = (value) => {
    if (!value || value === "" || value === "select" || value === "N/A" || value === "null") return false;
    return true;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return FALLBACK_IMAGE;
    if (imagePath.startsWith("http")) return imagePath;
    const baseUrl = IMAGE_URL?.endsWith("/") ? IMAGE_URL : `${IMAGE_URL}/`;
    const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
    return `${baseUrl}${cleanPath}`;
  };

  const fetchPetDetails = async (postId) => {
    try {
      setLoading(true);
      const response = await webApi.get(`vendorPetSales/post/${postId}`);
      if (response.status === 200 || response.data?.status === "success") {
        setPet(response.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (slug) fetchPetDetails(slug); }, [slug]);

  const handleLocalStatusUpdate = (updatedPetId, newStatus) => {
    setPet((prev) => (prev && prev.id === updatedPetId ? { ...prev, petStatus: newStatus } : prev));
  };

  if (loading) return <div className={styles.loader}>Loading...</div>;
  if (!pet) return <div className={styles.error}>Pet not found.</div>;

  const displayImage = pet.morePhotos?.[0] ? getImageUrl(pet.morePhotos[0]) : FALLBACK_IMAGE;

  return (
    <div className={styles.pageContainer}>
     <div className={styles.headerWrapper}>
        
        {/* ROW 1: Breed Title and Three Dots */}
        <div className={styles.headerTopRow}>
          <div className={styles.headerLeft}>
            <BackHeader text={pet.breed} />
          </div>
          <div className={styles.menuContainer}>
            <button className={styles.threeDotsBtn} onClick={() => setShowMenu(!showMenu)}>
              <ThreeDots />
            </button>
            {showMenu && (
              <div className={styles.dropdownMenu}>
                <button onClick={() => setShowEditPopup(true)} className={styles.menuItem}>Edit</button>
                <button onClick={() => setShowDeletePopup(true)} className={styles.menuItem}>Delete</button>
              </div>
            )}
          </div>
        </div>

        {/* ROW 2: Location, Status Badge, and Share Button */}
        <div className={styles.headerBottomRow}>
          <div className={styles.locationAndStatus}>
            <div className={styles.locationWrapper}>
              <p className={styles.locationHeader}>
                {/* Use a simple icon placeholder or SVG here */}
                {/* <span className={styles.iconPlaceholder}>📍</span>  */}
                {pet.address?.city}, {pet.address?.state}
              </p>
            </div>
            <div className={styles.statusWrapper}>
              <span className={styles.soldBadge}>{pet.petStatus}</span>
            </div>
          </div>
          <div className={styles.headerRight}>
            <button className={styles.shareBtn} onClick={() => setSharePopup(true)}>
              <ShareIcon />
            </button>
          </div>
        </div>
      </div>
      <div className={styles.mainContentGrid}>
        {/* LEFT COLUMN: HERO IMAGE & BREED INFO */}
        <div className={styles.leftCol}>
          <div className={styles.heroImageContainer}>
            <Image src={displayImage} alt="Pet" fill className={styles.heroImg} />
            <div className={styles.priceTag}>Price: ₹ {pet.price}</div>
          </div>
          
          <p className={styles.postDate}>
            Post Date:{" "}
            {formatInOriginalTz(pet.createdDate, pet.createdDateTimeZone, { dateStyle: "medium" }) ||
              (parseWallClockDate(pet.createdDate)
                ? parseWallClockDate(pet.createdDate).toLocaleDateString("en-GB")
                : "-")}
          </p>

         
          <div className={styles.breedInfoBox}>
  <h3 className={styles.sectionTitle}>{pet.breed} Breed Information</h3>
  
  {pet.breedInfo ? (
    <>
      <InfoRow2 
        label="Origin" 
        value={pet.breedInfo.Origin || "N/A"} 
      />
      <InfoRow2 
        label="Ideal Space" 
        value={pet.breedInfo["Ideal Space"] || "N/A"} 
      />
      <InfoRow2 
        label="Coat Length" 
        value={pet.breedInfo["Coat Length"] || "N/A"} 
      />
      <InfoRow2 
        label="Life Expectancy" 
        value={pet.breedInfo["Life Expectancy"] || "N/A"} 
      />
      <InfoRow2 
        label="Coat Type" 
        value={pet.breedInfo["Coat Type"] || "N/A"} 
      />
      <InfoRow2 
        label="Ideal Weather" 
        value={pet.breedInfo["Ideal Weather"] || "N/A"} 
      />
      {/* Optional: Mapping monthly expenses if needed */}
      <InfoRow2 
        label="Monthly Expense (Basic)" 
        value={pet.breedInfo["Average Monthly Expenses Basic"] || "N/A"} 
      />
    </>
  ) : (
    <p className={styles.noInfo}>No breed information available.</p>
  )}
</div>
        </div>

        {/* RIGHT COLUMN: BASIC & ADDITIONAL INFO */}
        <div className={styles.rightCol}>
          <div className={styles.infoCard}>
            <h3 className={styles.sectionTitle}>Basic Information</h3>
            <InfoRow icon={<PetType />} label="Pet Type" value={pet.petType} />
            <InfoRow icon={<Gender />} label="Gender" value={pet.petGender} />
            <InfoRow icon={<Age />} label="Age" value={pet.petAge} />
            <InfoRow icon={<Color />} label="Color" value={pet.color} />
            <InfoRow icon={<Size />} label="Size" value={pet.size} />
            <InfoRow icon={<PetType />} label="Pet Variety" value={pet.petVariety} />
          </div>

          <div className={styles.infoCard}>
            <h3 className={styles.sectionTitle}>Additional Information</h3>
            <div className={styles.boolGrid}>
              <div className={styles.boolItem}>
                <span className={pet.vaccinated === "Yes" ? styles.check : styles.cross}>
                   {pet.vaccinated === "Yes" ? "✓" : "✕"}
                </span>
                <p>{pet.vaccinated === "Yes" ? "Vaccinated" : "Not Vaccinated"}</p>
              </div>
              <div className={styles.boolItem}>
                <span className={styles.check}>✓</span>
                <p>{pet.doesThisPetHaveParents} had Parents</p>
              </div>
              <div className={styles.boolItem}>
                <span className={styles.check}>✓</span>
                <p>Transport service included</p>
              </div>
            </div>
          </div>

          
          <div className={styles.knowMoreBox}>
  <h3 className={styles.sectionTitle}>What you should know about {pet.breed}</h3>
  <p className={styles.descriptionText}>
    {pet.breedInfo?.["About Breed"] || pet.description}
  </p>
</div>
        </div>
      </div>
      {showEditPopup && (
        <div className={styles.popupOverlay}>
          <AddNewPuppyPopup closePopup={() => setShowEditPopup(false)} petData={pet} fetchPetData={() => fetchPetDetails(slug)} />
        </div>
      )}
      {showDeletePopup && (
        <ChangeStatus pet={pet} onClose={() => setShowDeletePopup(false)} onStatusChange={(s) => s === "Deleted" && router.push('/my-puppies')} />
      )}
      {sharePopup && <SharePopup pet={pet} onClose={() => setSharePopup(false)} />}
    </div>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className={styles.itemRow}>
    <div className={styles.iconBox}>{icon}</div>
    <div className={styles.itemLabel}>{label}</div>
    <div className={styles.itemValue}>{value || "N/A"}</div>
  </div>
);

const InfoRow2 = ({ label, value }) => (
  <div className={styles.itemRow}>
    <div className={styles.itemLabel}>{label}</div>
    <div className={styles.itemValue}>{value || "None"}</div>
  </div>
);

export default ViewDetails;