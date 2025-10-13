import React from 'react'
import styles from "../../styles/vender/weManageBussiness.module.css"
import { PetIcon } from '@/public/SVG'

const WeManageBussiness = () => {
  const data = [
    { img:<PetIcon/>, title: "Built For Pet Space", para: "We’re not a generic tool trying" },
    { img:<PetIcon/>, title: "Quick & Secure", para: "Easy to use, lightning-fast, and" },
    { img:<PetIcon/>, title: "Mobile Friendly", para: "Don’t let a desktop hold you back." },
    { img:<PetIcon/>, title: "Most Affordable", para: "Great software shouldn’t break the bank" },
  ]

  return (
    <>
      <div className={styles["header-block"]}>
        <p className={styles["header-text"]}>WE MANAGE &</p>
        <h3 className={styles["Below-text"]}>Grow Your Business</h3>
      </div>

      <div className={styles["contain-block"]}>
        {data.map((item, index) => {
          return (  
           <div key={index} className={styles["card"]}>
  {item.img && <span className={styles["icon"]}>{item.img}</span>}
  <h4 className={styles["title"]}>{item.title}</h4>
  <p className={styles["para"]}>{item.para}</p>
</div>

          )
        })}
      </div>
    </>
  )
}

export default WeManageBussiness
