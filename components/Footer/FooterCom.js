import React, { useEffect, useState } from "react";
// import Image from "next/image";
// import styles from "../../styles/footer/footer.module.css";
import Image from "next/image";
// import styles from "../../styles/footer/footer.module.css"
// import styles from "../../styles/footer/footer.module.css"
import styles from "../../styles/footer/footerCom.module.css"

const FooterCom = () => {

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 420);
    handleResize(); 
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  return (
    <footer className={styles.footerWrapper}>
      <div className={styles.footerContainer}>
        {/* Left Section - Logo & Subscribe */}
        <div className={styles.leftContainer}>
          <Image
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/78f832d72f9f367efc0ff0882e19b65026091938beafa18c8686f7b4126d4b25?apiKey=3e99c58a56f84e4cb0d84873c390b13e&"
            alt="Logo"
            width={100}
            height={50}
            className={styles.footerLogo}
          />
          <div className={styles.subscribeContainer}>
            <h5 className={styles["stay-update"]}>
              Stay updated with the Pet Industry
            </h5>
            <div className={styles.inputContainer}>
              <input type="email" placeholder="Email" />
              <span>Subscribe Now</span>
            </div>
          </div>
          <div className={styles.footerNav}>
            <p>For your daily dose of happiness, follow us on</p>
            <div className={styles.links}>
              {/* <img src="/images/Blog_Icons/blogwhatsapp.svg" alt="WhatsApp" className={styles.socialIcon} /> */}
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/ba7884bde25bf0dfd146a8050c79764f13b338aefa372c70618b7711094f0e8a?apiKey=3e99c58a56f84e4cb0d84873c390b13e&"
                alt="LinkedIn"
                className={styles.socialIcon}
              />
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/995aa139b3143c5f3bf50c2fb4d2127534320761d0fdb0e24f2fee9bd742d450?apiKey=3e99c58a56f84e4cb0d84873c390b13e&"
                alt="Twitter"
                className={styles.socialIcon}
              />
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/0f834d2a593e4f9bb766085ed949e9f5b939d223910580cb67714670e4ca4990?apiKey=3e99c58a56f84e4cb0d84873c390b13e&"
                alt="Instagram"
                className={styles.socialIcon}
              />
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/d6020af5b08200c2bae4af08d24b75a0d7ea8e6902580faeebe07c879fdf7333?apiKey=3e99c58a56f84e4cb0d84873c390b13e&"
                alt="Facebook"
                className={styles.socialIcon}
              />
            </div>
          </div>
        </div>

        {/* Right Section - Links */}
        <div className={styles.rightContainer}>
          <div className={styles.companyContainer}>
            <h5>Company</h5>
            <div className={styles.border}></div>
            <p>About Us</p>
            <p>Contact Us</p>
          </div>
          {/* <div className={styles.servicesGrid}>
    <p>Grooming</p>
    <p>Day Care</p>
    <p>Tinder</p>
    <p>Matting</p>
    <p>Pet Walker</p>
    <p>Events</p>
    <p>Training</p>
    <p>Insurance</p>
    <p>Cremation</p>
    <p>Nutrition Diet</p>
    <p>E-Reports</p>
    <p>Pet Diary</p>
    <p>Location</p>
    <p>Ride</p>
    <p>Tailgram</p>
    <p>Tail Talks</p>
    <p>Blood Bank</p>
    <p>Found & Missing</p>
    <p>Adoption</p>
    <p>Pet Breeds</p>
    <p>Animal NGOs</p>

  </div> */}
          <div className={styles.companyContainer}>
            <h5>Services</h5>
            <div className={styles.border}></div>
            <p>Grooming</p>
            <p>Day Care</p>
            <p>Tinder</p>
            <p>Matting</p>
            <p>Pet Walker</p>
            <p>Events</p>
            {/* <p>Training</p>
    <p>Insurance</p>
    <p>Cremation</p>
    <p>Nutrition Diet</p>
    <p>E-Reports</p>
    <p>Pet Diary</p>
    <p>Location</p> */}
            <p>Ride</p>
          </div>

          <div
            className={styles.companyContainer}
            style={{ marginTop: isMobile ? "17.5px" : "22px" }}
          >
            <h5></h5>
            <div className={styles.border}></div>
            <p>Training</p>
            <p>Insurance</p>
            <p>Cremation</p>
            <p>Nutrition Diet</p>
            <p>E-Reports</p>
            <p>Pet Diary</p>
            <p>Location</p>
          </div>

          <div
            className={styles.companyContainer}
            style={{ marginTop: isMobile ? "17.5px" : "22px" }}
          >
            <h5></h5>
            <div className={styles.border}></div>
            <p>Tailgram</p>
            <p>Tail Talks</p>
            <p>Blood Bank</p>
            <p>Found & Missing</p>
            <p>Adoption</p>
            <p>Pet Breeds</p>
            <p>Animal NGOs</p>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className={styles.footercontentWrapper}>
        <p>
          Terms & Condition | Privacy Policy | @ 2024 Mrchams Pvt Ltd | All
          Rights Reserved
        </p>
      </div>
    </footer>
  );
};

export default FooterCom;
