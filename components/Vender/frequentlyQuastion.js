import React, { useState } from "react";
import styles from "../../styles/vender/frequentlyQuastion.module.css"
import { Max, Min } from "@/public/image/SVG";


const faqData = [
  {
    question: "Is adopting a pet on Zaanvar free?",
    answer:  "Yes! Adoption through Zaanvar is completely free. However, some rescuers or foster homes may request minimal reimbursement for vaccination or medical expenses.",
  },
  {
    question: " Do I need to register or log in to adopt a pet?",
    answer: "  You can browse and explore pets without logging in. But to send an adoption request or contact the caretaker, you’ll need to sign up or log in for security and follow-up.",
  },
  {
    question: "How do I know if a pet is right for me?",
    answer: "Every pet profile on Zaanvar includes detailed info like age, breed, personality, and health. Still unsure? Our team offers pre-adoption guidance to help you choose based on your lifestyle and preferences.",
  },
  {
    question: "Can I meet the pet before adopting?",
    answer: "Yes, absolutely! We encourage virtual or physical meet-ups with the caretaker or shelter to ensure you and the pet are a good match before finalizing the adoption.",
  },
  {
    question: "What if I can’t keep the pet after adoption?",
    answer: "We understand that situations can change. Zaanvar offers a re-homing support feature to ensure pets are safely returned or re-adopted without judgment.",
  },
  {
    question: "Are all pets on Zaanvar vaccinated and healthy?",
    answer: "We verify all listings and work closely with shelters and foster homes to ensure pets are vaccinated, dewormed, and vet-checked before adoption. Health records are provided where available.",
  },
];

const FrequentlyQuastion = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const toggleAccordion = (index) => {
    setActiveIndex(index === activeIndex ? null : index);
  };

  return (
<>
    <div className={styles["top-heading"]}>
    <h2 className={styles["heading"]}>
           FREQUENTLY <span>Asked Questions</span>
        </h2>
        {/* <p className={styles["sub-text"]}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
          justo ligula, facilisis quis eros at.
        </p> */}
    </div>
    <div className={styles["container"]}>
        
      <div className={styles["left-wrapper"]}>
        <div className={styles["image-block-top"]}>
          <img
            src="https://zaanvar-care.b-cdn.net/media/1759914224264-quastionImage1.png"
            className={styles["img-main"]}
            alt="Dog"
          />
        </div>
        <div className={styles["image-block-bottom"]}>
          <img
            src="https://zaanvar-care.b-cdn.net/media/1759914237829-quastionImage2.png"
            className={styles["img-circle1"]}
            alt="Cat"
          />
          <img
            src="https://zaanvar-care.b-cdn.net/media/1759914258197-quastionImage3.png"
            className={styles["img-circle2"]}
            alt="Girl with dog"
          />
        </div>
      </div>

      <div className={styles["right-content"]}>
       
        <div className={styles["accordion"]}>
          {faqData.map((item, index) => (
            <div
              key={index}
              className={`${styles["accordion-item"]} ${
                index === activeIndex ? styles["active"] : ""
              }`}
              onClick={() => toggleAccordion(index)}
            >
              <div className={styles["accordion-header"]}>
                <p>{item.question}</p>
                <span>
                  {index === activeIndex ? <Min/> : <Max/>}

                </span>
              </div>
              {index === activeIndex && item.answer && (
                <div className={styles["accordion-body"]}>
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
};

export default FrequentlyQuastion;
