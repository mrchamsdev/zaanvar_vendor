import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
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
import { WebApimanager } from "@/components/utilities/WebApiManager";
import { useRouter } from "next/router";
import useStore from "@/components/state/useStore";
import { IMAGE_URL } from "@/components/utilities/Constants";
import ChangeStatus from "@/components/pet-sales/ChangeStatus";
import AddNewPuppyPopup from "@/components/pet-sales/AddNewPuppyPopUp";

const ViewDetails = ({
  showForm, 
  setShowForm, 
  setEditingPet, 
  refreshPets, 
  editingPet }) => {
  const [loading, setLoading] = useState(true);
  const [pet, setPet] = useState(null);
  const [sharePopup, setSharePopup] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showChangeStatus, setShowChangeStatus] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const menuRef = useRef(null);
  
  const router = useRouter();
  const { slug } = router.query;

  const { getJwtToken } = useStore();
  const jwt = getJwtToken();
  const webApi = new WebApimanager(jwt);

  useEffect(() => {
    if (slug) {
      fetchPetDetails(slug);
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

  const fetchPetDetails = async (postId) => {
    try {
      setLoading(true);
      const response = await webApi.get(`vendorPetSales/post/${postId}`);
      
      if (response.status === 200 || response.data?.status === "success") {
        setPet(response.data.data);
      } else {
        console.error("Server returned an error:", response);
        setPet(null);
      }
    } catch (err) {
      console.error("Error fetching pet details:", err);
      if (err.config) console.log("Attempted URL:", err.config.url);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    setSharePopup(true);
  };
  const handleDeleteClick = (pet) => {
    setSelectedPet(pet);
    setShowChangeStatus(true);
  };
   const handleAddEditSuccess = async () => {
    console.log("Add/Edit popup closed, refreshing data...");
    setShowForm(false);
    setEditingPet(null);
    if (refreshPets) {
      const refreshedData = await refreshPets();
      console.log("Refreshed data count:", refreshedData?.length);
    }
  };

  const handleStatusChangeSuccess = async () => {
    console.log("Status changed, refreshing data...");
    setShowChangeStatus(false);
    setSelectedPet(null);
    if (refreshPets) {
      const refreshedData = await refreshPets();
      console.log("Refreshed data count:", refreshedData?.length);
    }
  };

  const handleLocalUpdate = ({ status, details }) => {
    // Update local state immediately for better UX
    setPetList(prev =>
      prev.map(p =>
        p.id === selectedPet?.id || p._id === selectedPet?._id
          ? { ...p, petStatus: status }
          : p
      )
    );
    handleStatusChangeSuccess();
  };


  const handleDelete = (e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log("Opening Delete Popup");
    setShowMenu(false);
    setShowDeletePopup(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await webApi.delete(`vendorPetSales/Update/${pet?.id}`);
      if (response.status === "success" || response.status === 200) {
        router.push("/my-puppies");
      } else {
        console.error("Delete failed:", response);
      }
    } catch (error) {
      console.error("Error deleting pet:", error);
    }
    setShowDeletePopup(false);
  };

  const PostDate = (pet) => {
    if (!pet?.createdDate) return "N/A";
    return new Date(pet.createdDate).toISOString().split("T")[0];
  };

  // Helper function to format address object to string
  const formatAddress = (address) => {
    if (!address) return "";
    if (typeof address === 'string') return address;
    if (typeof address === 'object') {
      const parts = [];
      if (address.street) parts.push(address.street);
      if (address.area) parts.push(address.area);
      if (address.city) parts.push(address.city);
      if (address.state) parts.push(address.state);
      if (address.pincode) parts.push(address.pincode);
      if (address.landmark) parts.push(`(Landmark: ${address.landmark})`);
      return parts.filter(Boolean).join(', ');
    }
    return "";
  };

  // Helper function to check if value should be shown
  const shouldShow = (value) => {
    if (!value || value === "null" || value === "undefined" || value === "N/A") return false;
    if (typeof value === 'object') {
      return Object.values(value).some(val => val && val.toString().trim() !== "");
    }
    return value.toString().trim() !== "";
  };

  if (loading) return <div className={styles.loader}>Loading Pet Details...</div>;
  if (!pet) return <div className={styles.error}>Pet not found.</div>;

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
                <div onClick={() => {
                      console.log("Editing pet:", pet);
                      setEditingPet(pet);
                      setShowForm(true);
                    }} className={styles.menuItem} style={{ padding: '12px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                  Edit
                </div>
                <div onClick={() => handleDeleteClick(pet)} className={`${styles.menuItem} ${styles.deleteItem}`} style={{ padding: '12px', cursor: 'pointer', color: 'red' }}>
                  Delete
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles["viewDetailsMainWrapper"]}>
          <div className={styles["viewDetailsMainContainer"]}>
            {/* Left Container */}
            <div className={styles["viewDetailsLeftContainer"]}>
              <div className={styles["breed-post-date"]}>
                <span className={styles["post-date"]}> Post Date:</span>{" "}
                {PostDate(pet)}
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

                  <div className={styles["reward-container"]}>
                    <p>₹ {pet?.price || "N/A"} /-</p>
                  </div>
                </div>

                <div className={styles["below-text"]}>
                  <h4>{pet?.breed || "Unknown Breed"}</h4>
                  {shouldShow(pet?.address) && (
                    <p>{formatAddress(pet.address)}</p>
                  )}
                  <h5 className={styles["status"]}>
                    Status: <span>{pet?.petStatus || "Ready for sale"}</span>
                  </h5>
                </div>
              </div>

              {/* Additional Information */}
              {(shouldShow(pet?.vaccinated) || 
                shouldShow(pet?.negotiable) || 
                shouldShow(pet?.father) || 
                shouldShow(pet?.mother) || 
                shouldShow(pet?.description)) && (
                <div className={styles["content2"]}>
                  <h4 className={styles["additional"]}>Additional Information</h4>
                  
                  {shouldShow(pet?.vaccinated) && (
                    <div className={styles["row2"]}>
                      <div className={styles["label2"]}>Vaccinated</div>
                      <div className={styles["value"]}>
                        {Array.isArray(pet?.vaccinated) ? pet.vaccinated.join(', ') : pet?.vaccinated}
                      </div>
                    </div>
                  )}
                  
                  {shouldShow(pet?.negotiable) && (
                    <div className={styles["row2"]}>
                      <div className={styles["label2"]}>Negotiable</div>
                      <div className={styles["value"]}>{pet?.negotiable}</div>
                    </div>
                  )}
                  
                  {shouldShow(pet?.father) && (
                    <div className={styles["row2"]}>
                      <div className={styles["label2"]}>Father</div>
                      <div className={styles["value"]}>{pet?.father}</div>
                    </div>
                  )}
                  
                  {shouldShow(pet?.mother) && (
                    <div className={styles["row2"]}>
                      <div className={styles["label2"]}>Mother</div>
                      <div className={styles["value"]}>{pet?.mother}</div>
                    </div>
                  )}
                  
                  {shouldShow(pet?.description) && (
                    <div className={styles["row2"]}>
                      <div className={styles["label2"]}>Description</div>
                      <div className={styles["value"]}>{pet?.description}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Container - Basic Information */}
            <div className={styles["viewDetailsRightContainer"]}>
              <div className={styles["viewDetailsShareIconsContainer"]}>
                <div className={styles["shareContainer"]}>
                  <p>Share:</p>
                </div>
              </div>
              <div className={styles["viewDetails-details-container"]}>
                <div className={styles["viewDetails-content-container"]}>
                  <div className={styles["card"]}>
                    <div className={styles["header"]}>Basic Information</div>
                    <div className={styles["content"]}>
                      {shouldShow(pet?.petType) && (
                        <div className={styles["row"]}>
                          <PetType />
                          <div className={styles["label"]}>Pet Type</div>
                          <div className={styles["value"]}>{pet?.petType}</div>
                        </div>
                      )}
                      
                      {shouldShow(pet?.petAge) && (
                        <div className={styles["row"]}>
                          <Age />
                          <div className={styles["label"]}>Age</div>
                          <div className={styles["value"]}>{pet?.petAge}</div>
                        </div>
                      )}
                      
                      {shouldShow(pet?.color) && (
                        <div className={styles["row"]}>
                          <Color />
                          <div className={styles["label"]}>Color</div>
                          <div className={styles["value"]}>{pet?.color}</div>
                        </div>
                      )}
                      
                      {shouldShow(pet?.size) && (
                        <div className={styles["row"]}>
                          <Size />
                          <div className={styles["label"]}>Size</div>
                          <div className={styles["value"]}>{pet?.size}</div>
                        </div>
                      )}
                      
                      {shouldShow(pet?.petGender) && (
                        <div className={styles["row"]}>
                          <Gender />
                          <div className={styles["label"]}>Gender</div>
                          <div className={styles["value"]}>{pet?.petGender}</div>
                        </div>
                      )}
                      
                      {shouldShow(pet?.petVariety) && (
                        <div className={styles["row"]}>
                          <Call />
                          <div className={styles["label"]}>Pet Variety</div>
                          <div className={styles["value"]}>{pet?.petVariety}</div>
                        </div>
                      )}
                    </div>
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
                <button onClick={() => {
                      console.log("Editing pet:", pet);
                      setEditingPet(pet);
                      setShowForm(true);
                    }} className={styles.menuItem}>
                  Edit
                </button>
                <button onClick={() => handleDeleteClick(pet)} className={`${styles.menuItem} ${styles.deleteItem}`}>
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
            <span className={styles["post-date"]}> Post Date:</span>
            {PostDate(pet)}
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
            <h4>{pet?.breed || "Unknown Breed"}</h4>
            {shouldShow(pet?.address) && <p>{formatAddress(pet.address)}</p>}
            <h5 className={styles["status"]}>
              Status: <span>{pet?.petStatus || "N/A"}</span>
            </h5>
          </div>
        </div>

        {/* Mobile basic info */}
        <div className={styles["viewDetails-details-container"]}>
          <div className={styles["viewDetails-content-container"]}>
            <div className={styles["card"]}>
              <div className={styles["header"]}>Basic Information</div>
              <div className={styles["content"]}>
                {shouldShow(pet?.petType) && (
                  <div className={styles["row"]}>
                    <PetType />
                    <div className={styles["label"]}>Pet Type</div>
                    <div className={styles["value"]}>{pet?.petType}</div>
                  </div>
                )}
                
                {shouldShow(pet?.petAge) && (
                  <div className={styles["row"]}>
                    <Age />
                    <div className={styles["label"]}>Age</div>
                    <div className={styles["value"]}>{pet?.petAge}</div>
                  </div>
                )}
                
                {shouldShow(pet?.color) && (
                  <div className={styles["row"]}>
                    <Color />
                    <div className={styles["label"]}>Color</div>
                    <div className={styles["value"]}>{pet?.color}</div>
                  </div>
                )}
                
                {shouldShow(pet?.size) && (
                  <div className={styles["row"]}>
                    <Size />
                    <div className={styles["label"]}>Size</div>
                    <div className={styles["value"]}>{pet?.size}</div>
                  </div>
                )}
                
                {shouldShow(pet?.petGender) && (
                  <div className={styles["row"]}>
                    <Gender />
                    <div className={styles["label"]}>Gender</div>
                    <div className={styles["value"]}>{pet?.petGender}</div>
                  </div>
                )}
                
                {shouldShow(pet?.petVariety) && (
                  <div className={styles["row"]}>
                    <Call />
                    <div className={styles["label"]}>Pet Variety</div>
                    <div className={styles["value"]}>{pet?.petVariety}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile additional info */}
        {(shouldShow(pet?.vaccinated) || 
          shouldShow(pet?.negotiable) || 
          shouldShow(pet?.father) || 
          shouldShow(pet?.mother) || 
          shouldShow(pet?.description)) && (
          <div className={styles["content2"]}>
            <h4 className={styles["additional"]}>Additional Information</h4>
            
            {shouldShow(pet?.vaccinated) && (
              <div className={styles["row2"]}>
                <div className={styles["label2"]}>Vaccinated</div>
                <div className={styles["value"]}>
                  {Array.isArray(pet?.vaccinated) ? pet.vaccinated.join(', ') : pet?.vaccinated}
                </div>
              </div>
            )}
            
            {shouldShow(pet?.negotiable) && (
              <div className={styles["row2"]}>
                <div className={styles["label2"]}>Negotiable</div>
                <div className={styles["value"]}>{pet?.negotiable}</div>
              </div>
            )}
            
            {shouldShow(pet?.father) && (
              <div className={styles["row2"]}>
                <div className={styles["label2"]}>Father</div>
                <div className={styles["value"]}>{pet?.father}</div>
              </div>
            )}
            
            {shouldShow(pet?.mother) && (
              <div className={styles["row2"]}>
                <div className={styles["label2"]}>Mother</div>
                <div className={styles["value"]}>{pet?.mother}</div>
              </div>
            )}
            
            {shouldShow(pet?.description) && (
              <div className={styles["row2"]}>
                <div className={styles["label2"]}>Description</div>
                <div className={styles["value"]}>{pet?.description}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Popup - Same as MyPuppies */}
      {showForm && (
        <AddNewPuppyPopup
          closePopup={handleAddEditSuccess}
          petData={editingPet}
          fetchPetData={refreshPets}
        />
      )}

      {showChangeStatus && selectedPet && (
        <ChangeStatus
          pet={selectedPet}
          onClose={() => setShowChangeStatus(false)}
          onStatusChange={handleLocalUpdate}
        />
      )}

    </>
  );
};

export default ViewDetails;