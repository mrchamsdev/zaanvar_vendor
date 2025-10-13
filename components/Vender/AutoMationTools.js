import React from 'react'

import styles from "../../styles/vender/automationTools.module.css"
import { PetIcon } from '@/public/SVG'

const AutomationTools = () => {
  const data = [
    { img:<PetIcon/>, title: "Built For Pet Space", para: "We’re not a generic tool trying" },
    { img:<PetIcon/>, title: "Quick & Secure", para: "Easy to use, lightning-fast, and" },
    { img:<PetIcon/>, title: "Mobile Friendly", para: "Don’t let a desktop hold you back." },
    { img:<PetIcon/>, title: "Most Affordable", para: "Great software shouldn’t break the bank" },
    { img:<PetIcon/>, title: "Easy Setup", para: "Get started in minutes with no hassle" },
    { img:<PetIcon/>, title: "Support 24/7", para: "We are always here to help you" },
  ]

  return (
    <>
      <div className={styles["header-block"]}>
        <p className={styles["header-text"]}>AUTOMATION TOOLS FOR</p>
        <h3 className={styles["Below-text"]}>Your Pet Business</h3>
      </div>

      <div className={styles["contain-block"]}>
        {data.map((item, index) => {
          return (
            <div key={index} className={styles["card"]}>
              <div className={styles["icon"]}>{item.img}</div>
              <h4 className={styles["title"]}>{item.title}</h4>
              <p className={styles["para"]}>{item.para}</p>
            </div>
          )
        })}
      </div>
    </>
  )
}

export default AutomationTools
