import React, { useState, useEffect } from "react";
import Image from "next/image";
import styles from "../../styles/pet-sales/viewDetails.module.css";
import {
  Age,
  Call,
  Color,
  Facebook,
  Gender,
  PetType,
  Share,
  Size,
  Whatsapp,
} from "@/public/image/SVG";
import BackHeader from "@/components/pet-sales/backHeader";
import { useRouter } from "next/router";

const ViewDetails = () => {
  const [pet, setPet] = useState(null);
  const [sharePopup, setSharePopup] = useState(false);
  const router = useRouter();
  const { data } = router.query;

  console.log(pet, "433434")
  useEffect(() => {
    if (data) {
      try {
        const decoded = decodeURIComponent(data);
        setPet(JSON.parse(decoded));
      } catch (err) {
        console.error("Error parsing pet data:", err);
      }
    }
  }, [data]);

  const handleShare = () => {
    setSharePopup(true);
  };

  return (
    <>
      <BackHeader text={pet?.petName || "Pet Details"} />

      <div className={styles["viewDetailsMainWrapper"]}>
        <div className={styles["viewDetailsMainContainer"]}>
          {/* Left Container */}
          <div className={styles["viewDetailsLeftContainer"]}>
            <div className={styles["breed-post-date"]}>
              <span className={styles["post-date"]}> Post Date:</span>{" "}
              {pet?.postDate || "23/09/2025"}
            </div>

            <div className={styles["Image-content-details"]}>
              <div className={styles["viewDetailsPetImageContainer"]}>
                <div
                  style={{ position: "relative", width: "100%", height: "400px" }}
                >
                  <Image
                    src={
                      pet?.petImage
                        ? pet?.petImage.startsWith("http")
                          ? pet.petImage
                          : `https://zaanvar-care.b-cdn.net/${pet.petImage}`
                        : "https://zaanvar-care.b-cdn.net/media/1760510016605-how-ai-is-helping-us-understand-what-our-pets-are-saying.jpg"
                    }
                    alt={pet?.petName || "Pet Image"}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>

                <div className={styles["reward-container"]}>
                  <p>₹ {pet?.price || "N/A"}</p>
                </div>
              </div>

              <div className={styles["below-text"]}>
                <h4>{pet?.breed || "Unknown Breed"}</h4>
                <p>{pet?.location || "Unknown Location"}</p>
                <h5 className={styles["status"]}>
                  Status: <span>{pet?.status || "Ready for sale"}</span>
                </h5>
              </div>
            </div>

            <div className={styles["content2"]}>
              <h4 className={styles["additional"]}>Additional Information</h4>
              <div className={styles["row2"]}>
                <div className={styles["label2"]}>
                  How many Vaccinations Done?
                </div>
                <div className={styles["value"]}>
                  {pet?.vaccinated || "N/A"}
                </div>
              </div>
              <div className={styles["row2"]}>
                <div className={styles["label2"]}>Negotiable</div>
                <div className={styles["value"]}>
                  {pet?.negotiable || "Yes"}
                </div>
              </div>
              <div className={styles["row2"]}>
                <div className={styles["label2"]}>Father</div>
                <div className={styles["value"]}>{pet?.father || "N/A"}</div>
              </div>
              <div className={styles["row2"]}>
                <div className={styles["label2"]}>Mother</div>
                <div className={styles["value"]}>{pet?.mother || "N/A"}</div>
              </div>
              <div className={styles["row2"]}>
                <div className={styles["label2"]}>Description</div>
                <div className={styles["value"]}>
                  {pet?.description || "No description available."}
                </div>
              </div>
            </div>
          </div>

          {/* Right Container */}
          <div className={styles["viewDetailsRightContainer"]}>
            <div className={styles["viewDetailsShareIconsContainer"]}>
              <div className={styles["shareContainer"]}>
                <p>Share:</p>
                <div className={styles["Icons"]}>
                  <span onClick={handleShare} style={{ cursor: "pointer" }}>
                    <Share />
                  </span>
                  <span onClick={handleShare} style={{ cursor: "pointer" }}>
                    <Facebook />
                  </span>
                  <span onClick={handleShare} style={{ cursor: "pointer" }}>
                    <Whatsapp />
                  </span>
                </div>
              </div>
            </div>

            <div className={styles["viewDetails-details-container"]}>
              <div className={styles["viewDetails-content-container"]}>
                <div className={styles["card"]}>
                  <div className={styles["header"]}>Basic Information</div>
                  <div className={styles["content"]}>
                    <div className={styles["row"]}>
                      <PetType />
                      <div className={styles["label"]}>Pet Type</div>
                      <div className={styles["value"]}>
                        {pet?.petType || "N/A"}
                      </div>
                    </div>
                    <div className={styles["row"]}>
                      <Age />
                      <div className={styles["label"]}>Age</div>
                      <div className={styles["value"]}>
                        {pet?.petAge || "N/A"}
                      </div>
                    </div>
                    <div className={styles["row"]}>
                      <Color />
                      <div className={styles["label"]}>Color</div>
                      <div className={styles["value"]}>
                        {pet?.color || "N/A"}
                      </div>
                    </div>
                    <div className={styles["row"]}>
                      <Size />
                      <div className={styles["label"]}>Size</div>
                      <div className={styles["value"]}>
                        {pet?.size || "N/A"}
                      </div>
                    </div>
                    <div className={styles["row"]}>
                      <Gender />
                      <div className={styles["label"]}>Gender</div>
                      <div className={styles["value"]}>
                        {pet?.petGender || "N/A"}
                      </div>
                    </div>
                    <div className={styles["row"]}>
                      <Call />
                      <div className={styles["label"]}>Pet Variety</div>
                      <div className={styles["value"]}>
                        {pet?.variety || "Pet Quality"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewDetails;
