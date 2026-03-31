// import React, { useState, useEffect } from "react";
// import Image from "next/image";
// import { useRouter } from "next/router";
// import styles from "../../styles/pet-sales/viewDetails.module.css";
// import {
//   Age,
//   Call,
//   Color,
//   Facebook,
//   Gender,
//   PetType,
//   Share,
//   Size,
//   Whatsapp,
// } from "@/public/images/SVG";
// import BackHeader from "@/components/pet-sales/backHeader";
// import { IMAGE_URL } from "@/components/utilities/Constants";
// import { WebApimanager } from "@/components/utilities/WebApiManager";
// import useStore from "@/components/state/useStore";
// import ChangeStatus from "@/components/pet-sales/changeStutus";

// const ViewDetails = () => {
//   const [pet, setPet] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [showChangeStatus, setShowChangeStatus] = useState(false);
//   const router = useRouter();
//   const { slug } = router.query;

//   const { getJwtToken } = useStore();
//   const jwt = getJwtToken();
//   const webApi = new WebApimanager(jwt);

//   const FALLBACK_IMAGE = "https://zaanvar-care.b-cdn.net/media/1760510016605-how-ai-is-helping-us-understand-what-our-pets-are-saying.jpg";

//   // Helper function to get proper image URL
//   const getImageUrl = (imagePath) => {
//     if (!imagePath) return FALLBACK_IMAGE;
//     if (imagePath.startsWith('http')) return imagePath;
    
//     const baseUrl = IMAGE_URL?.endsWith('/') ? IMAGE_URL : `${IMAGE_URL}/`;
//     const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
//     return `${baseUrl}${cleanPath}`;
//   };

//   useEffect(() => {
//     if (slug) {
//       const parts = slug.split("-");
//       const id = parts[parts.length - 1];

//       if (id && id !== "view" && id !== "undefined") {
//         fetchPetDetails(id);
//       }
//     }
//   }, [slug]);

//   const fetchPetDetails = async (id) => {
//     try {
//       setLoading(true);
//       const response = await webApi.get(`vendorPetProfile/${id}`);
//       if (response.status === 200 || response.data?.status === "success") {
//         setPet(response.data.data);
//       }
//     } catch (err) {
//       console.error("Error fetching pet details:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLocalStatusUpdate = (updatedPetId, newStatus) => {
//     setPet((prev) => (prev && prev.id === updatedPetId ? { ...prev, petStatus: newStatus } : prev));
//   };

//   const PostDate = (petData) => {
//     if (!petData?.createdAt) return "N/A";
//     return new Date(petData.createdAt).toISOString().split("T")[0];
//   };

//   if (loading) return <div className={styles.loader}>Loading Pet Details...</div>;
//   if (!pet) return <div className={styles.error}>Pet not found.</div>;

//   const displayImage = pet?.morePhotos?.length > 0 
//     ? getImageUrl(pet.morePhotos[0]) 
//     : getImageUrl(pet?.petImage);

//   return (
//     <>
//       <div className={styles["web-view"]}>
//         <BackHeader text={pet?.petName || "Pet Details"} />
//         <div className={styles["viewDetailsMainWrapper"]}>
//           <div className={styles["viewDetailsMainContainer"]}>
//             <div className={styles["viewDetailsLeftContainer"]}>
//               <div className={styles["breed-post-date"]}>
//                 <span className={styles["post-date"]}> Post Date:</span> {PostDate(pet)}
//               </div>
//               <div className={styles["Image-content-details"]}>
//                 <div className={styles["viewDetailsPetImageContainer"]}>
//                   <div className={styles["image-relative-wrapper"]}>
//                     <Image
//                       src={displayImage}
//                       alt={pet?.petName}
//                       fill
//                       style={{ objectFit: "cover" }}
//                       priority
//                       unoptimized={displayImage.includes('b-cdn.net')} // Speed up external CDN loading
//                     />
//                   </div>
//                 </div>
//                 <div className={styles["below-text"]}>
//                   <h4>{pet?.breed || "Unknown Breed"}</h4>
//                   <p>{pet?.location || "Unknown Location"}</p>
//                   <h5 className={styles["status"]}>
//                     Status: <span onClick={() => setShowChangeStatus(true)} style={{cursor: 'pointer', textDecoration: 'underline'}}>
//                       {pet?.petStatus || "Active"}
//                     </span>
//                   </h5>
//                 </div>
//               </div>

//               <div className={styles["content2"]}>
//                 <h4 className={styles["additional"]}>Additional Information</h4>
//                 <InfoRow2 label="Vaccinations Done" value={pet?.vaccinated} />
//                 <InfoRow2 label="Negotiable" value={pet?.negotiable} />
//                 <InfoRow2 label="Father" value={pet?.father} />
//                 <InfoRow2 label="Mother" value={pet?.mother} />
//                 <InfoRow2 label="Description" value={pet?.description} />
//               </div>
//             </div>

//             <div className={styles["viewDetailsRightContainer"]}>
//               <div className={styles["viewDetails-details-container"]}>
//                 <div className={styles["card"]}>
//                   <div className={styles["header"]}>Basic Information</div>
//                   <div className={styles["content"]}>
//                     <InfoRow icon={<PetType />} label="Pet Type" value={pet?.petType} />
//                     <InfoRow icon={<Age />} label="Age" value={pet?.petAge} />
//                     <InfoRow icon={<Color />} label="Color" value={pet?.color} />
//                     <InfoRow icon={<Size />} label="Size" value={pet?.size} />
//                     <InfoRow icon={<Gender />} label="Gender" value={pet?.petGender} />
//                     <InfoRow icon={<Call />} label="Microchip" value={pet?.microchipNumber} />
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* MOBILE VIEW */}
//       <div className={styles["mobile-view"]}>
//         <BackHeader text={pet?.petName || "Pet Details"} />
//         <div className={styles["mob-wrapper"]}>
//           <div className={styles["breed-post-date"]}>
//             <span className={styles["post-date"]}> Post Date:</span> {PostDate(pet)}
//           </div>
//         </div>
//         <div className={styles["Image-content-details"]}>
//           <div className={styles["viewDetailsPetImageContainer"]}>
//             <div className={styles["image-relative-wrapper"]}>
//               <Image 
//                 src={displayImage} 
//                 alt={pet?.petName} 
//                 fill 
//                 style={{ objectFit: "cover", borderRadius: "20px" }} 
//               />
//             </div>
//           </div>
//           <div className={styles["below-text"]}>
//             <h4>{pet?.breed}</h4>
//             <p>{pet?.location}</p>
//             <h5 className={styles["status"]}>
//               Status: <span onClick={() => setShowChangeStatus(true)}>{pet?.petStatus || "N/A"}</span>
//             </h5>
//           </div>
//         </div>

//         <div className={styles["viewDetails-details-container"]}>
//           <div className={styles["card"]}>
//             <div className={styles["header"]}>Basic Information</div>
//             <div className={styles["content"]}>
//               <InfoRow icon={<PetType />} label="Pet Type" value={pet?.petType} />
//               <InfoRow icon={<Age />} label="Age" value={pet?.petAge} />
//               <InfoRow icon={<Color />} label="Color" value={pet?.color} />
//               <InfoRow icon={<Size />} label="Size" value={pet?.size} />
//               <InfoRow icon={<Gender />} label="Gender" value={pet?.petGender} />
//               <InfoRow icon={<Call />} label="Microchip" value={pet?.microchipNumber} />
//             </div>
//           </div>
//         </div>
        
//         <div className={styles["content2"]}>
//           <h4 className={styles["additional"]}>Additional Information</h4>
//           <InfoRow2 label="Vaccinations Done" value={pet?.vaccinated} />
//           <InfoRow2 label="Negotiable" value={pet?.negotiable} />
//           <InfoRow2 label="Father" value={pet?.father} />
//           <InfoRow2 label="Mother" value={pet?.mother} />
//           <InfoRow2 label="Description" value={pet?.description} />
//         </div>
//       </div>

//       {showChangeStatus && (
//         <ChangeStatus
//           pet={pet}
//           setpet={setPet} // This matches the 'setpet' prop in your ChangeStatus component
//           onClose={() => setShowChangeStatus(false)}
//           onStatusChange={handleLocalStatusUpdate}
//           filter="petSales"
//         />
//       )}
//     </>
//   );
// };

// const InfoRow = ({ icon, label, value }) => (
//   <div className={styles["row"]}>
//     {icon}
//     <div className={styles["label"]}>{label}</div>
//     <div className={styles["value"]}>{value || "N/A"}</div>
//   </div>
// );

// const InfoRow2 = ({ label, value }) => (
//   <div className={styles["row2"]}>
//     <div className={styles["label2"]}>{label}</div>
//     <div className={styles["value"]}>{value || "N/A"}</div>
//   </div>
// );

// export default ViewDetails;
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import styles from "../../styles/pet-sales/viewDetails.module.css";
import {
  Age,
  Call,
  Color,
  Facebook,
  Gender,
  PetType,
  ShareIcon,
  Size,
  Whatsapp,
  ThreeDots
} from "@/public/images/SVG";
import BackHeader from "@/components/pet-sales/backHeader";
import { IMAGE_URL } from "@/components/utilities/Constants";
import { WebApimanager } from "@/components/utilities/WebApiManager";
import useStore from "@/components/state/useStore";
import ChangeStatus from "@/components/pet-sales/ChangeStatus";


const ViewDetails = () => {
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChangeStatus, setShowChangeStatus] = useState(false);
  const [sharePopup, setSharePopup] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const menuRef = useRef(null);
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
        if (menuRef.current && !menuRef.current.contains(event.target)) {
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
  const handleShare = () => {
    setSharePopup(true);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log("Opening Edit Popup");
    setShowMenu(false);
    setShowEditPopup(true);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    e.preventDefault();
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
        <div className={styles.menuContainer} ref={menuRef}>
            <button 
              type="button"
              className={styles.threeDotsBtn} 
              onClick={(e) => {
                e.stopPropagation();
                console.log("Three Dots Clicked");
                setShowMenu(!showMenu);
              }}
              style={{ cursor: 'pointer', background: 'none', border: 'none', padding: '10px', position: 'relative', zIndex: 110 }}
            >
              <ThreeDots />
            </button>
            {showMenu && (
              <div className={styles.dropdownMenu} style={{ position: 'absolute', right: 0, top: '40px', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', borderRadius: '8px', width: '150px', zIndex: 200 }}>
                <div onClick={handleEdit} className={styles.menuItem} style={{ padding: '12px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                  Edit
                </div>
                <div onClick={handleDelete} className={`${styles.menuItem} ${styles.deleteItem}`} style={{ padding: '12px', cursor: 'pointer', color: 'red' }}>
                  Delete
                </div>
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
                  <div className={styles["image-relative-wrapper"]}>
                    <Image
                      src={displayImage}
                      alt={pet?.petName}
                      fill
                      style={{ objectFit: "cover" }}
                      priority
                      unoptimized={displayImage.includes('b-cdn.net')}
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
                 <p>Share:</p>                 
                  <div className={styles["Icons"]}>
                  <span onClick={handleShare} style={{ cursor: "pointer" }}>
                    <ShareIcon />
                  </span>
                  </div>
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
        <div className={styles.menuContainer} ref={menuRef}>
            <button 
              className={styles.threeDotsBtn} 
              onClick={() => setShowMenu(!showMenu)}
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
            <div className={styles["image-relative-wrapper"]}>
              <Image 
                src={displayImage} 
                alt={pet?.petName} 
                fill 
                style={{ objectFit: "cover", borderRadius: "20px" }} 
              />
            </div>
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

      {showChangeStatus && (
        <ChangeStatus
          pet={pet}
          setpet={setPet}
          onClose={() => setShowChangeStatus(false)}
          onStatusChange={handleLocalStatusUpdate}
          filter="petSales"
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
// import React, { useState, useEffect } from "react";
// import Image from "next/image";
// import { useRouter } from "next/router";
// import styles from "../../styles/pet-sales/viewDetails.module.css";
// import {
//   Age,
//   Call,
//   Color,
//   Facebook,
//   Gender,
//   PetType,
//   Share,
//   Size,
//   Whatsapp,
// } from "@/public/images/SVG";
// import BackHeader from "@/components/pet-sales/backHeader";
// import { IMAGE_URL } from "@/components/utilities/Constants";
// import { WebApimanager } from "@/components/utilities/WebApiManager";
// import useStore from "@/components/state/useStore";
// import ChangeStatus from "@/components/pet-sales/changeStutus";

// const ViewDetails = () => {
//   const [pet, setPet] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [showChangeStatus, setShowChangeStatus] = useState(false);
//   const router = useRouter();
//   const { slug } = router.query;

//   const { getJwtToken } = useStore();
//   const jwt = getJwtToken();
//   const webApi = new WebApimanager(jwt);

//   const FALLBACK_IMAGE = "https://zaanvar-care.b-cdn.net/media/1760510016605-how-ai-is-helping-us-understand-what-our-pets-are-saying.jpg";

//   // Helper function to check if value should be shown
//   const shouldShow = (value) => {
//     if (!value) return false;
//     if (value === null) return false;
//     if (value === "") return false;
//     if (value === "null") return false;
//     if (value === "undefined") return false;
//     if (value === "N/A") return false;
//     if (value === "select") return false;
//     return true;
//   };

//   // Helper function to get proper image URL
//   const getImageUrl = (imagePath) => {
//     if (!imagePath) return FALLBACK_IMAGE;
//     if (imagePath.startsWith('http')) return imagePath;
    
//     const baseUrl = IMAGE_URL?.endsWith('/') ? IMAGE_URL : `${IMAGE_URL}/`;
//     const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
//     return `${baseUrl}${cleanPath}`;
//   };

//    useEffect(() => {
//     if (slug) {
//       const parts = slug.split("-");
//       const id = parts[parts.length - 1];

//       if (id && id !== "view" && id !== "undefined") {
//         fetchPetDetails(id);
//       }
//     }
//   }, [slug]);

//   const fetchPetDetails = async (id) => {
//     try {
//       setLoading(true);
//       const response = await webApi.get(`vendorPetProfile/${id}`);
//       if (response.status === 200 || response.data?.status === "success") {
//         setPet(response.data.data);
//       }
//     } catch (err) {
//       console.error("Error fetching pet details:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLocalStatusUpdate = (updatedPetId, newStatus) => {
//     setPet((prev) => (prev && prev.id === updatedPetId ? { ...prev, petStatus: newStatus } : prev));
//   };

//   const PostDate = (petData) => {
//     if (!petData?.createdDate) return "N/A";
//     return new Date(petData.createdDate).toISOString().split("T")[0];
//   };

//   if (loading) return <div className={styles.loader}>Loading Pet Details...</div>;
//   if (!pet) return <div className={styles.error}>Pet not found.</div>;

//   const displayImage = pet?.morePhotos?.length > 0 
//     ? getImageUrl(pet.morePhotos[0]) 
//     : getImageUrl(pet?.petImage);

//   // Check if there are any additional info fields to show
//   const hasAdditionalInfo = shouldShow(pet?.vaccinated) || 
//     shouldShow(pet?.negotiable) || 
//     shouldShow(pet?.father) || 
//     shouldShow(pet?.mother) || 
//     shouldShow(pet?.description);

//   return (
//     <>
//       <div className={styles["web-view"]}>
//         <BackHeader text={pet?.petName || "Pet Details"} />
//         <div className={styles["viewDetailsMainWrapper"]}>
//           <div className={styles["viewDetailsMainContainer"]}>
//             <div className={styles["viewDetailsLeftContainer"]}>
//               <div className={styles["breed-post-date"]}>
//                 <span className={styles["post-date"]}> Post Date:</span> {PostDate(pet)}
//               </div>
//               <div className={styles["Image-content-details"]}>
//                 <div className={styles["viewDetailsPetImageContainer"]}>
//                   <div className={styles["image-relative-wrapper"]}>
//                     <Image
//                       src={displayImage}
//                       alt={pet?.petName || "Pet Image"}
//                       fill
//                       sizes="(max-width: 768px) 100vw, 50vw"
//                       style={{ objectFit: "cover" }}
//                       priority
//                     />
//                   </div>
//                 </div>
//                 <div className={styles["below-text"]}>
//                   <h4>{pet?.breed || "Unknown Breed"}</h4>
//                   {shouldShow(pet?.address) && <p>{pet?.address}</p>}
//                   <h5 className={styles["status"]}>
//                     Status: <span onClick={() => setShowChangeStatus(true)} style={{cursor: 'pointer', textDecoration: 'underline'}}>
//                       {pet?.petStatus || "Active"}
//                     </span>
//                   </h5>
//                 </div>
//               </div>

//               {hasAdditionalInfo && (
//                 <div className={styles["content2"]}>
//                   <h4 className={styles["additional"]}>Additional Information</h4>
//                   {shouldShow(pet?.vaccinated) && (
//                     <InfoRow2 label="Vaccinations Done" value={pet?.vaccinated} />
//                   )}
//                   {shouldShow(pet?.negotiable) && (
//                     <InfoRow2 label="Negotiable" value={pet?.negotiable} />
//                   )}
//                   {shouldShow(pet?.father) && (
//                     <InfoRow2 label="Father" value={pet?.father} />
//                   )}
//                   {shouldShow(pet?.mother) && (
//                     <InfoRow2 label="Mother" value={pet?.mother} />
//                   )}
//                   {shouldShow(pet?.description) && (
//                     <InfoRow2 label="Description" value={pet?.description} />
//                   )}
//                 </div>
//               )}
//             </div>

//             <div className={styles["viewDetailsRightContainer"]}>
//               <div className={styles["viewDetails-details-container"]}>
//                 <div className={styles["card"]}>
//                   <div className={styles["header"]}>Basic Information</div>
//                   <div className={styles["content"]}>
//                     {shouldShow(pet?.petType) && (
//                       <InfoRow icon={<PetType />} label="Pet Type" value={pet?.petType} />
//                     )}
//                     {shouldShow(pet?.petAge) && (
//                       <InfoRow icon={<Age />} label="Age" value={pet?.petAge} />
//                     )}
//                     {shouldShow(pet?.color) && (
//                       <InfoRow icon={<Color />} label="Color" value={pet?.color} />
//                     )}
//                     {shouldShow(pet?.size) && (
//                       <InfoRow icon={<Size />} label="Size" value={pet?.size} />
//                     )}
//                     {shouldShow(pet?.petGender) && (
//                       <InfoRow icon={<Gender />} label="Gender" value={pet?.petGender} />
//                     )}
//                     {shouldShow(pet?.microchipNo) && (
//                       <InfoRow icon={<Call />} label="Microchip" value={pet?.microchipNo} />
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* MOBILE VIEW */}
//       <div className={styles["mobile-view"]}>
//         <BackHeader text={pet?.petName || "Pet Details"} />
//         <div className={styles["mob-wrapper"]}>
//           <div className={styles["breed-post-date"]}>
//             <span className={styles["post-date"]}> Post Date:</span> {PostDate(pet)}
//           </div>
//         </div>
//         <div className={styles["Image-content-details"]}>
//           <div className={styles["viewDetailsPetImageContainer"]}>
//             <div className={styles["image-relative-wrapper"]}>
//               <Image 
//                 src={displayImage} 
//                 alt={pet?.petName || "Pet Image"} 
//                 fill
//                 sizes="100vw"
//                 style={{ objectFit: "cover", borderRadius: "20px" }} 
//               />
//             </div>
//           </div>
//           <div className={styles["below-text"]}>
//             <h4>{pet?.breed}</h4>
//             {shouldShow(pet?.address) && <p>{pet?.address}</p>}
//             <h5 className={styles["status"]}>
//               Status: <span onClick={() => setShowChangeStatus(true)}>{pet?.petStatus || "N/A"}</span>
//             </h5>
//           </div>
//         </div>

//         <div className={styles["viewDetails-details-container"]}>
//           <div className={styles["card"]}>
//             <div className={styles["header"]}>Basic Information</div>
//             <div className={styles["content"]}>
//               {shouldShow(pet?.petType) && (
//                 <InfoRow icon={<PetType />} label="Pet Type" value={pet?.petType} />
//               )}
//               {shouldShow(pet?.petAge) && (
//                 <InfoRow icon={<Age />} label="Age" value={pet?.petAge} />
//               )}
//               {shouldShow(pet?.color) && (
//                 <InfoRow icon={<Color />} label="Color" value={pet?.color} />
//               )}
//               {shouldShow(pet?.size) && (
//                 <InfoRow icon={<Size />} label="Size" value={pet?.size} />
//               )}
//               {shouldShow(pet?.petGender) && (
//                 <InfoRow icon={<Gender />} label="Gender" value={pet?.petGender} />
//               )}
//               {shouldShow(pet?.microchipNo) && (
//                 <InfoRow icon={<Call />} label="Microchip" value={pet?.microchipNo} />
//               )}
//             </div>
//           </div>
//         </div>
        
//         {hasAdditionalInfo && (
//           <div className={styles["content2"]}>
//             <h4 className={styles["additional"]}>Additional Information</h4>
//             {shouldShow(pet?.vaccinated) && (
//               <InfoRow2 label="Vaccinations Done" value={pet?.vaccinated} />
//             )}
//             {shouldShow(pet?.negotiable) && (
//               <InfoRow2 label="Negotiable" value={pet?.negotiable} />
//             )}
//             {shouldShow(pet?.father) && (
//               <InfoRow2 label="Father" value={pet?.father} />
//             )}
//             {shouldShow(pet?.mother) && (
//               <InfoRow2 label="Mother" value={pet?.mother} />
//             )}
//             {shouldShow(pet?.description) && (
//               <InfoRow2 label="Description" value={pet?.description} />
//             )}
//           </div>
//         )}
//       </div>

//       {showChangeStatus && (
//         <ChangeStatus
//           pet={pet}
//           setpet={setPet}
//           onClose={() => setShowChangeStatus(false)}
//           onStatusChange={handleLocalStatusUpdate}
//           filter="petSales"
//         />
//       )}
//     </>
//   );
// };

// const InfoRow = ({ icon, label, value }) => (
//   <div className={styles["row"]}>
//     {icon}
//     <div className={styles["label"]}>{label}</div>
//     <div className={styles["value"]}>{value}</div>
//   </div>
// );

// const InfoRow2 = ({ label, value }) => (
//   <div className={styles["row2"]}>
//     <div className={styles["label2"]}>{label}</div>
//     <div className={styles["value"]}>{value}</div>
//   </div>
// );

// export default ViewDetails;