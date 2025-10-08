import React from 'react'
import styles from "../../../styles/vender/chooseUs.module.css"
import { Pet2Icon } from '@/public/SVG'

const ChooseUs = () => {
  const data = [
    { img:<Pet2Icon/>, title: "Free to Use", para: "We have no hidden fee or subscription and the pet vendors can expand their business without having to concern themselves with running costs. You receive all the necessary equipment to run and sell your goods effectively without any charge." },

    { img:<Pet2Icon/>, title: "Tailored for Pet Vendors", para: "Each of the features is pet-vender friendly - inventory management, displays of pet-specific products, etc. We know your niche and thus our platform would be ideal to your requirements." },

    { img:<Pet2Icon/>, title: "Easy Dashboard & Tools", para: "Having a clean and simple dashboard, you can manage your listings, sales and analytics with a few clicks. No technical expertise was required - it is all designed to do your work without any problems." },
    { img:<Pet2Icon/>, title: "Secure & Mobile Ready", para: "Advanced security ensures that your data and business are safeguarded in order to have total peace of mind. In addition, our mobile-enabling design means you can be able to manage your store anywhere anytime." },
  ]

  return (
    <>
      <div className={styles["header-block"]}>
        <p className={styles["header-text"]}>WHY</p>
        <h3 className={styles["Below-text"]}>Choose Us</h3>
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

export default ChooseUs
