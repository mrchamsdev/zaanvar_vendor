import React from 'react'
// import styles from "../../styles/vender/chooseUs.module.css"
import { Pet2Icon } from '@/public/SVG'
import styles from "../../styles/vender/ourValue.module.css"

const OurValue = () => {
  const data = [
    { img:<Pet2Icon/>, title: "Trust", para: "We value transparency and build solutions that earn the confidence of our vendors and users" },

    { img:<Pet2Icon/>, title: "Simplicity", para: "Our platform is designed to be intuitive, user-friendly, and accessible to all types of businesses—big or small." },

    { img:<Pet2Icon/>, title: "Growth", para: "We focus on empowering pet businesses to scale, gain visibility, and thrive in a competitive digital marketplace" },

  ]

  return (
    <>
      <div className={styles["header-block"]}>
        <p className={styles["header-text"]}>Our Values</p>
        <h3 className={styles["Below-text"]}>At Zaanvar, we uphold the following core values</h3>
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

export default OurValue
