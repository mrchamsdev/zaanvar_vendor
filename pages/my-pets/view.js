import React, { useState } from "react";
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
} from "@/public/SVG";
import BackHeader from "@/components/pet-sales/backHeader";

const ViewDetails = () => {
  const [sharePopup, setSharePopup] = useState(false);

  const handleShare = () => {
    setSharePopup(true);
  };

  return (
    <>
      <div className={styles["web-view"]}>
        <BackHeader text="Simba" />
        <div className={styles["viewDetailsMainWrapper"]}>
          <div className={styles["viewDetailsMainContainer"]}>
            {/* Left Container */}
            <div className={styles["viewDetailsLeftContainer"]}>
              <div className={styles["breed-post-date"]}>
                <span className={styles["post-date"]}> Post Date:</span>
                {"23/09/2025 "}
              </div>
              <div className={styles["Image-content-details"]}>
                <div className={styles["viewDetailsPetImageContainer"]}>
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "400px",
                    }}
                  >
                    <Image
                      src="https://zaanvar-care.b-cdn.net/media/1760510016605-how-ai-is-helping-us-understand-what-our-pets-are-saying.jpg"
                      alt="Pet Image"
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>

                  <div className={styles["reward-container"]}>
                    <p>Price: ₹ {"3434 /-"}</p>
                  </div>
                </div>
                <div className={styles["below-text"]}>
                  <h4>American Staffordshire terrier terrier terrier</h4>
                  <p>SR Nagar, Hyderabad - Telangana</p>
                  <h5 className={styles["status"]}>
                    Status: <span>Ready for sale</span>
                  </h5>
                </div>
              </div>
              <div className={styles["content2"]}>
                <h4 className={styles["additional"]}>Additional Information</h4>
                <div className={styles["row2"]}>
                  <div className={styles["label2"]}>
                    {" "}
                    How many Vaccinations Done?
                  </div>
                  <div className={styles["value"]}>{"4 Vaccinations"}</div>
                </div>
                <div className={styles["row2"]}>
                  <div className={styles["label2"]}>Negotiable</div>
                  <div className={styles["value"]}>{"Yes"}</div>
                </div>
                <div className={styles["row2"]}>
                  <div className={styles["label2"]}>Dan(Father)</div>
                  <div className={styles["value"]}>{"Lorem Ipsum"}</div>
                </div>
                <div className={styles["row2"]}>
                  <div className={styles["label2"]}>Sire(Mother)</div>
                  <div className={styles["value"]}>{"Lorem Ipsum"}</div>
                </div>
                <div className={styles["row2"]}>
                  <div className={styles["label2"]}>Description</div>
                  <div className={styles["value"]}>
                    {
                      "Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Ipsum"
                    }
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
                    {/* WhatsApp */}
                    <span onClick={handleShare} style={{ cursor: "pointer" }}>
                      <Share />
                    </span>
                    {/* Facebook */}
                    <span onClick={handleShare} style={{ cursor: "pointer" }}>
                      <Facebook />
                    </span>
                    {/* Twitter */}
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
                        <div className={styles["label"]}> Pet Type</div>
                        <div className={styles["value"]}>{"Dog"}</div>
                      </div>
                      <div className={styles["row"]}>
                        {" "}
                        <Age />
                        <div className={styles["label"]}>Age</div>
                        <div className={styles["value"]}>
                          {"2 years  4 month"}
                        </div>
                      </div>
                      <div className={styles["row"]}>
                        <Color />
                        <div className={styles["label"]}>Color</div>
                        <div className={styles["value"]}>{"Blue"}</div>
                      </div>
                      <div className={styles["row"]}>
                        <Size />
                        <div className={styles["label"]}>Size</div>
                        <div className={styles["value"]}>{"6.4"}</div>
                      </div>
                      <div className={styles["row"]}>
                        <Gender />
                        <div className={styles["label"]}>Gender</div>
                        <div className={styles["value"]}>{"Male"}</div>
                      </div>
                      <div className={styles["row"]}>
                        <Call />
                        <div className={styles["label"]}>Pet Variety</div>
                        <div className={styles["value"]}>{"Pet Quality"}</div>
                      </div>
                    </div>
                  </div>

                  {/* <div className={styles["viewDetailsPetIdentifications"]}>
                <h5>About {"this breed"}</h5>
                <p>{"No description available."}</p>
              </div> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles["mobile-view"]}>
        {/* <BackHeader text="Simba" /> */}

        <div className={styles["mob-wrapper"]}>
          <div className={styles["breed-post-date"]}>
            <span className={styles["post-date"]}> Post Date:</span>
            {"23/09/2025 "}
          </div>
          <div className={styles["shareContainer"]}>
            <p>Share:</p>
            <div className={styles["Icons"]}>
              {/* WhatsApp */}
              <span onClick={handleShare} style={{ cursor: "pointer" }}>
                <Share />
              </span>
              {/* Facebook */}
              <span onClick={handleShare} style={{ cursor: "pointer" }}>
                <Facebook />
              </span>
              {/* Twitter */}
              <span onClick={handleShare} style={{ cursor: "pointer" }}>
                <Whatsapp />
              </span>
            </div>
          </div>
        </div>
        <div className={styles["Image-content-details"]}>
          <div className={styles["viewDetailsPetImageContainer"]}>
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                borderRadius: "10px",
              }}
            >
              <Image
                src="https://zaanvar-care.b-cdn.net/media/1760510016605-how-ai-is-helping-us-understand-what-our-pets-are-saying.jpg"
                alt="Pet Image"
                fill
                style={{ objectFit: "cover", borderRadius: "20px" }}
              />
            </div>

            <div className={styles["reward-container"]}>
              <p>Price: ₹ {"3434 /-"}</p>
            </div>
          </div>
          <div className={styles["below-text"]}>
            <h4>American Staffordshire terrier terrier terrier</h4>
            <p>SR Nagar, Hyderabad - Telangana</p>
            <h5 className={styles["status"]}>
              Status: <span>Ready for sale</span>
            </h5>
          </div>
        </div>
        <div className={styles["viewDetails-details-container"]}>
          <div className={styles["viewDetails-content-container"]}>
            <div className={styles["card"]}>
              <div className={styles["header"]}>Basic Information</div>
              <div className={styles["content"]}>
                <div className={styles["row"]}>
                  <PetType />
                  <div className={styles["label"]}> Pet Type</div>
                  <div className={styles["value"]}>{"Dog"}</div>
                </div>
                <div className={styles["row"]}>
                  {" "}
                  <Age />
                  <div className={styles["label"]}>Age</div>
                  <div className={styles["value"]}>{"2 years  4 month"}</div>
                </div>
                <div className={styles["row"]}>
                  <Color />
                  <div className={styles["label"]}>Color</div>
                  <div className={styles["value"]}>{"Blue"}</div>
                </div>
                <div className={styles["row"]}>
                  <Size />
                  <div className={styles["label"]}>Size</div>
                  <div className={styles["value"]}>{"6.4"}</div>
                </div>
                <div className={styles["row"]}>
                  <Gender />
                  <div className={styles["label"]}>Gender</div>
                  <div className={styles["value"]}>{"Male"}</div>
                </div>
                <div className={styles["row"]}>
                  <Call />
                  <div className={styles["label"]}>Pet Variety</div>
                  <div className={styles["value"]}>{"Pet Quality"}</div>
                </div>
              </div>
            </div>

            {/* <div className={styles["viewDetailsPetIdentifications"]}>
                <h5>About {"this breed"}</h5>
                <p>{"No description available."}</p>
              </div> */}
          </div>
        </div>
        <div className={styles["content2"]}>
          <h4 className={styles["additional"]}>Additional Information</h4>
          <div className={styles["row2"]}>
            <div className={styles["label2"]}> How many Vaccinations Done?</div>
            <div className={styles["value"]}>{"4 Vaccinations"}</div>
          </div>
          <div className={styles["row2"]}>
            <div className={styles["label2"]}>Negotiable</div>
            <div className={styles["value"]}>{"Yes"}</div>
          </div>
          <div className={styles["row2"]}>
            <div className={styles["label2"]}>Dan(Father)</div>
            <div className={styles["value"]}>{"Lorem Ipsum"}</div>
          </div>
          <div className={styles["row2"]}>
            <div className={styles["label2"]}>Sire(Mother)</div>
            <div className={styles["value"]}>{"Lorem Ipsum"}</div>
          </div>
          <div className={styles["row2"]}>
            <div className={styles["label2"]}>Description</div>
            <div className={styles["value"]}>
              {
                "Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Lorem ipsum Ipsum"
              }
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewDetails;
