import React, { useState, useEffect } from 'react'
// import styles from '../../styles/about/OurFounder.module.css'
import styles from "../../../styles/about/ourFounder.module.css"
// import { AboutQuote } from '@/public/images/SVG';
import Image from 'next/image';
import { AboutQuote } from '@/public/SVG';

const OurFounder = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const founderData = [
        {
            image: "https://zaanvar-care.b-cdn.net/media/1760075317656-RanjithSoma.png",
            name: "Ranjith & Simba",
            role: "Founder & CEO",
            description: [
              "Ranjith Soma, the founder of Zaanvar, is a passionate pet lover whose journey into the pet care industry began with his beloved Shih Tzu, Simba. Inspired by the deep bond he shared with Simba, Ranjith envisioned a platform that would make pet care more accessible and efficient for pet parents everywhere.",
              "Recognizing the challenges pet parents face in finding trustworthy services, Ranjith set out to build Zaanvar – a platform that connects pet owners with top-quality services, products, and resources. With a focus on convenience, trust, and love for pets, Zaanvar was created to simplify the pet care experience and ensure that every pet has access to the best care."
            ]
          },
      // {
      //   image: "/images/about/Rahul.png",
      //   name: "Rahul Repala",
      //   role: "CTO",
      //   description: [
      //   "Rahul Repala, CTO of Zaanvar, is dedicated to transforming pet care through innovative technology. Passionate about empowering individuals, he creates opportunities for growth while ensuring pets receive the best care. His expertise bridges technology and pet welfare, making quality services more accessible to pet owners.",
      //   "With strong leadership in software development, Rahul drives Zaanvar's mission to connect pet businesses and owners through seamless, user-friendly solutions. His commitment to fostering a supportive environment and advancing technology continues to shape Zaanvar's impact in the pet tech industry."
      //   ]
      // },
      
    ];
    
    useEffect(() => {
      let timer;
      if (!isPaused) { // Only run timer if not paused
          timer = setInterval(() => {
              setCurrentSlide((prevSlide) => 
                  prevSlide === founderData.length - 1 ? 0 : prevSlide + 1
              );
          }, 5000);
      }

      return () => clearInterval(timer); 
  }, [isPaused]); 
  const handleMouseEnter = () => {
    setIsPaused(true);
};

const handleMouseLeave = () => {
    setIsPaused(false);
};
 

    // Add handleDotClick function
    const handleDotClick = (index) => {
        setCurrentSlide(index);
    };
  return (
    <div className={styles.founderContainer}>
      <h5 className={styles.mainTitle}>Our Founder</h5>
      <div className={styles.founderLayout}
         onMouseEnter={handleMouseEnter}
         onMouseLeave={handleMouseLeave}>
        <div className={styles.imageContainer}
     
        >
         
<Image
  src={founderData[currentSlide].image}
  alt={founderData[currentSlide].name}
  className={styles.founderImage}
  width={200} 
  height={200} 
  unoptimized
/>
          <h3 className={styles.founderName}>{founderData[currentSlide].name}</h3>
        </div>

        <div className={styles.contentSection}>
          <div className={styles.slideshow}>
            <div 
              className={styles.slideshowSlider}
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {founderData.map((founder, index) => (
                <div key={index} className={styles.textContent}>
                  {founder.description.map((paragraph, i) => (
                    <p key={i} className={styles.founderDescription}>
                      {paragraph}
                    </p>
                  ))}
                  <div className={styles.bottomContent}>
                    <div className={styles.signatureBlock}>
                      <span className={styles.signatureText}>
                        With gratitude and determination,
                        <br />
                        <strong className={styles.founderRoleSignature}>
                          {founder.name.split('&')[0].trim()} - {founder.role}
                        </strong>
                      </span>
                    </div>
                    {/* <div className={styles.slideshowDots}>
                      {founderData.map((_, idx) => (
                        <div
                          key={idx}
                          className={`${styles.slideshowDot} ${currentSlide === idx ? styles.active : ''}`}
                          onClick={() => handleDotClick(idx)}
                        />
                      ))}
                    </div> */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.quoteContainer}>
                <AboutQuote />
            </div>
      </div>
      
    </div>
  )
}

export default OurFounder