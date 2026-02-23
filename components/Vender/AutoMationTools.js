import React from 'react'

import styles from "../../styles/vender/automationTools.module.css"
import { PetIcon } from '@/public/image/SVG'

const AutomationTools = () => {
  const data = [
    { img:<PetIcon/>, title: "Calendar Management", para: "Stay on top of bookings, availability, & occupancy with smart scheduling tools." },
    { img:<PetIcon/>, title: "Staff Management", para: "Assign roles, set permissions, & manage staff effortlessly." },
    { img:<PetIcon/>, title: "Inventory Management", para: "Easily manage your inventory, from shampoos to treats across all branches." },
    { img:<PetIcon/>, title: "Mobile App & Multi-Branch", para: "Run your business on the go and across multiple locations. " },
    { img:<PetIcon/>, title: "Business Dashboard", para: "Monitor performance with real-time analytics and reports." },
    { img:<PetIcon/>, title: "Billing & Invoicing", para: "Generate invoices, track payments, and automate your billing process." },
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
