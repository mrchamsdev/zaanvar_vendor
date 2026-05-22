
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import styles from "../../styles/pet-sales/viewDetails.module.css";
import {
  Age,
  Call,
  Color,
  Gender,
  PetType,
  Size,
  ThreeDots,
} from "@/public/images/SVG";
import BackHeader from "@/components/pet-sales/backHeader";
import { IMAGE_URL } from "@/components/utilities/Constants";
import { WebApimanager } from "@/components/utilities/WebApiManager";
import useStore from "@/components/state/useStore";
import AddNewPetPopup from "@/components/pet-sales/AddNewPetPopup";
import ChangeStatusForPet from "@/components/pet-sales/ChangeStatusForPet";
import SharePopup from "../../components/pet-sales/SharePopup";

const ViewDetails = () => {
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [sharePopup, setSharePopup] = useState(false);
  
  const desktopMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const router = useRouter();
  const { slug } = router.query;

  const { getJwtToken } = useStore();
  const jwt = getJwtToken();
  const webApi = new WebApimanager(jwt);

  const FALLBACK_IMAGE = "https://zaanvar-care.b-cdn.net/media/1760510016605-how-ai-is-helping-us-understand-what-our-pets-are-saying.jpg";

  // Helpers
  const shouldShow = (value) => {
    if (!value || value === "" || value === "select" || value === "N/A" || value === "null" || value === "undefined") return false;
    return true;
  };

  const getAge = (birthday) => {
    if (!birthday) return "N/A";
    const birth = new Date(birthday);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    if (months < 0) { years--; months += 12; }
    if (years === 0) return `${months} Months`;
    return `${years} Years, ${months} Months`;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return FALLBACK_IMAGE;
    if (imagePath.startsWith("http")) return imagePath;
    const baseUrl = IMAGE_URL?.endsWith("/") ? IMAGE_URL : `${IMAGE_URL}/`;
    const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
    return `${baseUrl}${cleanPath}`;
  };

  // Logic Handlers from commented code
  const handleLocalStatusUpdate = (updatedPetId, newStatus) => {
    setPet((prev) => (prev && prev.id === updatedPetId ? { ...prev, petStatus: newStatus } : prev));
  };

  const handleShare = (e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    setShowMenu(false);
    setSharePopup(true);
  };

  const handleEdit = (e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    setShowMenu(false);
    setShowEditPopup(true);
  };

  const handleDelete = (e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    setShowMenu(false);
    setShowDeletePopup(true);
  };

  const fetchPetDetails = async (id) => {
    try {
      setLoading(true);
      const response = await webApi.get(`vendorPetProfile/${id}`);
      if (response.status === 200 || response.data?.status === "success") {
        setPet(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching pet details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      const id = slug.split("-").pop();
      if (id && id !== "view" && id !== "undefined") fetchPetDetails(id);
    }
  }, [slug]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideDesktop = !desktopMenuRef.current || !desktopMenuRef.current.contains(event.target);
      if (isOutsideDesktop) setShowMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) return <div className={styles.loader}>Loading...</div>;
  if (!pet) return <div className={styles.error}>Pet not found.</div>;

  const displayImage = pet.morePhotos?.[0] ? getImageUrl(pet.morePhotos[0]) : FALLBACK_IMAGE;
  const qrImageUrl = getImageUrl(pet.qrCode);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerWrapper}>
        <BackHeader text= "Pet Details" />
        <div className={styles.menuContainer} ref={desktopMenuRef}>
          <button className={styles.threeDotsBtn} onClick={() => setShowMenu(!showMenu)}>
            <ThreeDots />
          </button>
          {showMenu && (
            <div className={styles.dropdownMenu}>
              <button onClick={handleEdit} className={styles.menuItem}>Edit</button>
              <button onClick={handleDelete} className={`${styles.menuItem} ${styles.deleteItem}`}>Delete</button>
              <button onClick={handleShare} className={styles.menuItem}>Share</button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.mainLayout}>
        <div className={styles.identityGrid}>
          {/* PET IDENTITY CARD */}
          <div className={styles.identityCard}>
            <div className={styles.cardBadge}>{pet.petStatus || "Visible"}</div>
            <div className={styles.cardBody}>
              <div className={styles.avatarBox}>
                <Image src={displayImage} alt="Pet" fill className={styles.petImg} />
              </div>
              <div className={styles.identityInfo}>
                <h2 className={styles.petNameHeader}>{pet.petName} ({pet.petType})</h2>
                <p className={styles.breedTxt}>{pet.breed}</p>
                <p className={styles.metaTxt}>Pet Age: {getAge(pet.birthday)}</p>
                <p className={styles.metaTxt}>Gender: {pet.petGender}</p>
              </div>
            </div>
            <div className={styles.cardFooter}>
              <div className={styles.petIdCode}>{pet.petId}</div>
              <div className={styles.footerTag}>Secure Every Pet's Identity</div>
            </div>
          </div>

          {/* OWNER IDENTITY CARD */}
          <div className={styles.identityCard}>
            <div className={styles.cardBadgeOwner}>Owner</div>
            <div className={styles.cardBody}>
              <div className={styles.qrBox}>
                <Image src={qrImageUrl} alt="QR Code" fill className={styles.qrImg} />
              </div>
              <div className={styles.identityInfo}>
                <h2 className={styles.petNameHeader}>{pet.owner?.firstName} {pet.owner?.lastName}</h2>
                <p className={styles.addressTxt}>{pet.owner?.email}</p>
              <p className={styles.addressTxt}>
  {pet.owner?.homeAddress 
    ? `${pet.owner.homeAddress.addressText}, ${pet.owner.homeAddress.city}, ${pet.owner.homeAddress.state} - ${pet.owner.homeAddress.pincode}`
    : 'Address not available'}
</p>
                <p className={styles.metaTxt}>{pet.owner?.phoneNumber}</p>
              </div>
            </div>
            <div className={styles.cardFooter}>
              <div className={styles.petIdCode}>{pet.petId}</div>
              <div className={styles.footerTag}>Secure Every Pet's Identity</div>
            </div>
          </div>
        </div>

        <div className={styles.detailsGrid}>
          {/* BASIC INFORMATION */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoCardTitle}>Basic Information</h3>
            <div className={styles.infoList}>
              {shouldShow(pet.petType) && <InfoRow icon={<PetType />} label="Pet Type" value={pet.petType} />}
              <InfoRow icon={<Age />} label="Pet Age" value={getAge(pet.birthday)} />
              {shouldShow(pet.petGender) && <InfoRow icon={<Gender />} label="Pet Gender" value={pet.petGender} />}
              {shouldShow(pet.color) && <InfoRow icon={<Color />} label="Color" value={pet.color} />}
              {shouldShow(pet.size) && <InfoRow icon={<Size />} label="Size" value={pet.size} />}
              {shouldShow(pet.weight) && <InfoRow icon={<Age />} label="Weight" value={pet.weight} />}
            </div>
          </div>

          {/* MORE INFORMATION */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoCardTitle}>More Information</h3>
            <div className={styles.infoList}>
              {shouldShow(pet.medication) && <InfoRow2 label="Medication" value={pet.medication} />}
              {shouldShow(pet.doesYourPetHasAnyHealthIssues) && <InfoRow2 label="Health Condition" value={pet.doesYourPetHasAnyHealthIssues} />}
              {shouldShow(pet.skills) && <InfoRow2 label="Skills" value={pet.skills} />}
              {shouldShow(pet.kci) && <InfoRow2 label="KCI" value={pet.kci} />}
            </div>
          </div>

          {/* ADDITIONAL INFORMATION */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoCardTitle}>Additional Information</h3>
            <div className={styles.booleanList}>
              <div className={styles.boolRow}>
                <span className={pet.spayedOrNeutered === "Yes" ? styles.check : styles.cross}>
                  {pet.spayedOrNeutered === "Yes" ? "✓" : "✕"}
                </span>
                <p>Spayed/Neutered</p>
              </div>
              <div className={styles.boolRow}>
                <span className={pet.vaccinated === "Yes" ? styles.check : styles.cross}>
                  {pet.vaccinated === "Yes" ? "✓" : "✕"}
                </span>
                <p>Vaccinated</p>
              </div>
            </div>
          </div>
           <div className={styles.infoCard}>
          {pet.howManyVaccinationsDone?.length > 0 && (
               <div className={styles.vaccineBox}>
                  <p className={styles.vaccineLabel}>Vaccinations Done:</p>
                  {pet.howManyVaccinationsDone.map((v, i) => (
                    <span key={i} className={styles.vaccinePill}>{v}<br /></span>
                  ))}
               </div>
            )}
            </div>
        </div>
      </div>

      {showEditPopup && (
        <div className={styles.popupOverlay}>
          <AddNewPetPopup 
            closePopup={() => setShowEditPopup(false)} 
            petData={pet} 
            fetchPetData={() => fetchPetDetails(pet.id || pet._id)} 
          />
        </div>
      )}

      {showDeletePopup && (
        <ChangeStatusForPet
          pet={pet}
          onClose={() => setShowDeletePopup(false)}
          onStatusChange={(newStatus) => {
             handleLocalStatusUpdate(pet.id || pet._id, newStatus);
             if (newStatus === "Deleted") router.push('/my-pets');
          }}
        />
      )}

      {sharePopup && (
        <SharePopup pet={pet} onClose={() => setSharePopup(false)} />
      )}
    </div>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className={styles.itemRow}>
    <div className={styles.iconBox}>{icon}</div>
    <div className={styles.itemLabel}>{label}</div>
    <div className={styles.itemValue}>{value}</div>
  </div>
);

const InfoRow2 = ({ label, value }) => (
  <div className={styles.itemRow}>
    <div className={styles.itemLabel}>{label}</div>
    <div className={styles.itemValue}>{value}</div>
  </div>
);

export default ViewDetails;