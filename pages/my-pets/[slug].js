
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
  ShareIcon
} from "@/public/images/SVG";
import BackHeader from "@/components/pet-sales/backHeader";
import { IMAGE_URL } from "@/components/utilities/Constants";
import { WebApimanager } from "@/components/utilities/WebApiManager";
import useStore from "@/components/state/useStore";
import AddNewPetPopup from "@/components/pet-sales/AddNewPetPopup";
import ChangeStatusForPet from "@/components/pet-sales/ChangeStatusForPet";
import SharePopup from "@/components/pet-sales/SharePopup";


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

  // Helper function to check if value should be shown
  const shouldShow = (value) => {
    if (!value) return false;
    if (value === null) return false;
    if (value === "") return false;
    if (value === "null") return false;
    if (value === "undefined") return false;
    if (value === "N/A") return false;
    if (value === "select") return false;
    return true;
  };

  // Helper function to get proper image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return FALLBACK_IMAGE;
    if (imagePath.startsWith('http')) return imagePath;
    
    const baseUrl = IMAGE_URL?.endsWith('/') ? IMAGE_URL : `${IMAGE_URL}/`;
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${baseUrl}${cleanPath}`;
  };

  useEffect(() => {
    if (slug) {
      const parts = slug.split("-");
      const id = parts[parts.length - 1];

      if (id && id !== "view" && id !== "undefined") {
        fetchPetDetails(id);
      }
    }
  }, [slug]);
   useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click was outside BOTH desktop and mobile menus
      const isOutsideDesktop = !desktopMenuRef.current || !desktopMenuRef.current.contains(event.target);
      const isOutsideMobile = !mobileMenuRef.current || !mobileMenuRef.current.contains(event.target);
      
      if (isOutsideDesktop && isOutsideMobile) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleLocalStatusUpdate = (updatedPetId, newStatus) => {
    setPet((prev) => (prev && prev.id === updatedPetId ? { ...prev, petStatus: newStatus } : prev));
  };
   const handleShare = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    console.log("Opening Share Popup");
    setShowMenu(false);
    setSharePopup(true);
  };

   const handleEdit = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    console.log("Opening Edit Popup");
    setShowMenu(false);
    setShowEditPopup(true);
  };

  const handleDelete = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    console.log("Opening Delete Popup");
    setShowMenu(false);
    setShowDeletePopup(true);
  };
  const PostDate = (petData) => {
    if (!petData?.createdAt) return "N/A";
    return new Date(petData.createdAt).toISOString().split("T")[0];
  };

  if (loading) return <div className={styles.loader}>Loading Pet Details...</div>;
  if (!pet) return <div className={styles.error}>Pet not found.</div>;

  const displayImage = pet?.morePhotos?.length > 0 
    ? getImageUrl(pet.morePhotos[0]) 
    : getImageUrl(pet?.petImage);

  // Check if there are any additional info fields to show
  const hasAdditionalInfo = shouldShow(pet?.vaccinated) || 
    shouldShow(pet?.negotiable) || 
    shouldShow(pet?.father) || 
    shouldShow(pet?.mother) || 
    shouldShow(pet?.description);

  return (
    <>
      <div className={styles["web-view"]}>
        <div className={styles.headerWrapper}>
        <BackHeader text={pet?.petName || "Pet Details"} />
        <div className={styles.menuContainer} ref={desktopMenuRef}>
            <button 
              className={styles.threeDotsBtn} 
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              <ThreeDots/>
            </button>
             {showMenu && (
              <div className={styles.dropdownMenu}>
                <button onClick={handleEdit} className={styles.menuItem}>
                  Edit
                </button>
                <button onClick={handleDelete} className={styles.menuItem}>
                  Delete
                </button>
                {/* <button onClick={handleShare} className={styles.menuItem}>
                  Share
                </button> */}
              </div>
            )}
          </div>
        </div>

        <div className={styles["viewDetailsMainWrapper"]}>
          <div className={styles["viewDetailsMainContainer"]}>
            <div className={styles["viewDetailsLeftContainer"]}>
              <div className={styles["breed-post-date"]}>
                <span className={styles["post-date"]}> Post Date:</span> {PostDate(pet)}
              </div>
              <div className={styles["Image-content-details"]}>
                <div className={styles["viewDetailsPetImageContainer"]}>
                  <div style={{ position: "relative", width: "100%", height: "400px" }}>
                                      <Image
                                        src={
                                          pet?.morePhotos && pet.morePhotos.length > 0
                                            ? `${IMAGE_URL}${pet.morePhotos[0]}`
                                            : "https://zaanvar-care.b-cdn.net/media/1760510016605-how-ai-is-helping-us-understand-what-our-pets-are-saying.jpg"
                                        }
                                        alt={pet?.petName || "Pet Image"}
                                        fill
                                        style={{ objectFit: "cover" }}
                                      />
                                    </div>
                </div>
                <div className={styles["below-text"]}>
                  <h4>{pet?.breed || "Unknown Breed"}</h4>
                  {shouldShow(pet?.address) && <p>{pet?.address}</p>}
                  <h5 className={styles["status"]}>
                    Status: <span>
                      {pet?.petStatus || "Active"}
                    </span>
                  </h5>
                </div>
              </div>

              {hasAdditionalInfo && (
                <div className={styles["content2"]}>
                  <h4 className={styles["additional"]}>Additional Information</h4>
                  {shouldShow(pet?.vaccinated) && (
                    <InfoRow2 label="Vaccinations Done" value={pet?.vaccinated} />
                  )}
                  {shouldShow(pet?.negotiable) && (
                    <InfoRow2 label="Negotiable" value={pet?.negotiable} />
                  )}
                  {shouldShow(pet?.father) && (
                    <InfoRow2 label="Father" value={pet?.father} />
                  )}
                  {shouldShow(pet?.mother) && (
                    <InfoRow2 label="Mother" value={pet?.mother} />
                  )}
                  {shouldShow(pet?.description) && (
                    <InfoRow2 label="Description" value={pet?.description} />
                  )}
                </div>
              )}
            </div>

            <div className={styles["viewDetailsRightContainer"]}>
              <div className={styles["viewDetailsShareIconsContainer"]}>
                <div className={styles["shareContainer"]}>
                  <p>Share:</p><span style={{cursor: "pointer"}}onClick={handleShare} ><ShareIcon /></span>
                </div>
              </div>
          
              <div className={styles["viewDetails-details-container"]}>
                <div className={styles["card"]}>
                  <div className={styles["header"]}>Basic Information</div>
                  <div className={styles["content"]}>
                    {shouldShow(pet?.petType) && (
                      <InfoRow icon={<PetType />} label="Pet Type" value={pet?.petType} />
                    )}
                    {shouldShow(pet?.petAge) && (
                      <InfoRow icon={<Age />} label="Age" value={pet?.petAge} />
                    )}
                    {shouldShow(pet?.color) && (
                      <InfoRow icon={<Color />} label="Color" value={pet?.color} />
                    )}
                    {shouldShow(pet?.size) && (
                      <InfoRow icon={<Size />} label="Size" value={pet?.size} />
                    )}
                    {shouldShow(pet?.petGender) && (
                      <InfoRow icon={<Gender />} label="Gender" value={pet?.petGender} />
                    )}
                    {shouldShow(pet?.microchipNo) && (
                      <InfoRow icon={<Call />} label="Microchip" value={pet?.microchipNo} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE VIEW */}
      <div className={styles["mobile-view"]}>
         <div className={styles.headerWrapper}>
        <BackHeader text={pet?.petName || "Pet Details"} />
        <div className={styles.menuContainer} ref={mobileMenuRef}>
            <button 
              className={styles.threeDotsBtn} 
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              <ThreeDots/>
            </button>
            {showMenu && (
              <div className={styles.dropdownMenu}>
                <button onClick={handleEdit} className={styles.menuItem}>
                  Edit
                </button>
                <button onClick={handleDelete} className={`${styles.menuItem} ${styles.deleteItem}`}>
                  Delete
                </button>
                <button onClick={handleShare} className={styles.menuItem}>
                  Share
                </button>
              </div>
            )}
          </div>
          </div>
        <div className={styles["mob-wrapper"]}>
          <div className={styles["breed-post-date"]}>
            <span className={styles["post-date"]}> Post Date:</span> {PostDate(pet)}
          </div>
        </div>
        <div className={styles["Image-content-details"]}>
          <div className={styles["viewDetailsPetImageContainer"]}>
            <Image
                          src={
                            pet?.morePhotos && pet.morePhotos.length > 0
                              ? `${IMAGE_URL}${pet.morePhotos[0]}`
                              : "https://zaanvar-care.b-cdn.net/media/1760510016605-how-ai-is-helping-us-understand-what-our-pets-are-saying.jpg"
                          }
                          alt={pet?.petName || "Pet Image"}
                          fill
                          style={{ objectFit: "cover", borderRadius: "20px" }}
                        />
          </div>
          <div className={styles["below-text"]}>
            <h4>{pet?.breed}</h4>
            {shouldShow(pet?.address) && <p>{pet?.address}</p>}
            <h5 className={styles["status"]}>
              Status: <span onClick={() => setShowChangeStatus(true)}>{pet?.petStatus || "N/A"}</span>
            </h5>
          </div>
        </div>

        <div className={styles["viewDetails-details-container"]}>
          <div className={styles["card"]}>
            <div className={styles["header"]}>Basic Information</div>
            <div className={styles["content"]}>
              {shouldShow(pet?.petType) && (
                <InfoRow icon={<PetType />} label="Pet Type" value={pet?.petType} />
              )}
              {shouldShow(pet?.petAge) && (
                <InfoRow icon={<Age />} label="Age" value={pet?.petAge} />
              )}
              {shouldShow(pet?.color) && (
                <InfoRow icon={<Color />} label="Color" value={pet?.color} />
              )}
              {shouldShow(pet?.size) && (
                <InfoRow icon={<Size />} label="Size" value={pet?.size} />
              )}
              {shouldShow(pet?.petGender) && (
                <InfoRow icon={<Gender />} label="Gender" value={pet?.petGender} />
              )}
              {shouldShow(pet?.microchipNo) && (
                <InfoRow icon={<Call />} label="Microchip" value={pet?.microchipNo} />
              )}
            </div>
          </div>
        </div>
        
        {hasAdditionalInfo && (
          <div className={styles["content2"]}>
            <h4 className={styles["additional"]}>Additional Information</h4>
            {shouldShow(pet?.vaccinated) && (
              <InfoRow2 label="Vaccinations Done" value={pet?.vaccinated} />
            )}
            {shouldShow(pet?.negotiable) && (
              <InfoRow2 label="Negotiable" value={pet?.negotiable} />
            )}
            {shouldShow(pet?.father) && (
              <InfoRow2 label="Father" value={pet?.father} />
            )}
            {shouldShow(pet?.mother) && (
              <InfoRow2 label="Mother" value={pet?.mother} />
            )}
            {shouldShow(pet?.description) && (
              <InfoRow2 label="Description" value={pet?.description} />
            )}
          </div>
        )}
      </div>

      {showEditPopup && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{ width: '100%', overflow: 'auto' }}>
            <AddNewPetPopup
              closePopup={() => setShowEditPopup(false)}
              petData={pet}
              fetchPetData={() => fetchPetDetails(pet.id || pet._id)}
            />
          </div>
        </div>
      )}

      {showDeletePopup && (
        <ChangeStatusForPet
          pet={pet}
          onClose={() => setShowDeletePopup(false)}
          onStatusChange={(newStatus) => {
             handleLocalStatusUpdate(pet.id || pet._id, newStatus);
             // Optionally redirect to listing if deleted
             if (newStatus === "Deleted") {
               router.push('/my-pets');
             }
          }}
        />
      )}

      {sharePopup && (
        <SharePopup
          pet={pet}
          onClose={() => setSharePopup(false)}
        />
      )}
    </>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className={styles["row"]}>
    {icon}
    <div className={styles["label"]}>{label}</div>
    <div className={styles["value"]}>{value}</div>
  </div>
);

const InfoRow2 = ({ label, value }) => (
  <div className={styles["row2"]}>
    <div className={styles["label2"]}>{label}</div>
    <div className={styles["value"]}>{value}</div>
  </div>
);

export default ViewDetails;
