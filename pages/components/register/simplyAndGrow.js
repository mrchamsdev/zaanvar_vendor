import React from 'react';
import styles from "../../../styles/register/simpleAndGrow.module.css";

const SimplyAndGrow = () => {
  const data = [
    { 
      color: "#DAE3F880", 
      buttonColor: "#DAE3F880",
      title: "Everything you need to run daily operations — in one dashboard", 
      para: "Discover how Zaanvar’s free, easy-to-use tools let you manage bookings, clients, staff, and service lists from a single screen. Save time with automated reminders, quick invoicing, and an appointment calendar designed for pet businesses" ,
      buttonText: "Explore Tools"

    },
    { 
      color: "#F5790C1A", 
      buttonColor: "#F5790C1A",
      title: "Free Forever — No Hidden Costs", 
      para: "Zaanvar gives pet businesses unlimited listings, client management, and appointment tools at zero cost. There are no trial periods, no forced upgrades, and no surprise fees — just reliable features to help you operate and grow.",
      buttonText: "Start Free "
    },
    { 
      color: "#E1F4F880", 
      buttonColor: "#E1F4F880",
      title: "Stay Ahead With Insights & Resources", 
      para: "Access practical resources, case studies, and growth tips created for pet businesses. From marketing checklists to revenue-boosting best practices, Zaanvar helps you turn everyday improvements into measurable growth." ,
      buttonText: "View Resources"
    },
  ];

  return (
    <>
      <div className={styles["header-block"]}>
        <h3 className={styles["Below-text"]}>
          "Grow and Simplify Your Pet Business With <span>Zaanvar</span>"
        </h3>
      </div>

      <div className={styles["contain-block"]}>
        {data.map((item, index) => (
          <div 
            key={index} 
            className={styles["card"]} 
            style={{ backgroundColor: item.color }}
          >
           
            <h4 className={styles["title"]}>{item.title}</h4>
            <p className={styles["para"]}>{item.para}</p>
             <button 
              className={styles["card-button"]} 
              style={{  }}
            >
              {item.buttonText}
            </button>
          </div>
        ))}
      </div>

      < div className={styles["para-container"]}>
        <p>Running a pet business comes with challenges — but managing operations shouldn’t be one of them. Whether you run a <b>grooming salon, clinic, boarding, breeder service, daycare, store, NGO, or training center,</b> <span><b>Zaanvar</b></span> helps you simplify and grow your business.

</p>
<p>


With tools like <b>online booking, reminders, WhatsApp integration, inventory & invoice management, and advanced reports, you can manage clients, pets, and services in one place.</b> No more manual tracking — <b>our cloud platform </b> keeps everything accessible anytime, anywhere.


</p>
<p>
Create a verified business profile, showcase services, gain visibility, and use insights to attract more customers. <b>Zaanvar is free for vendors, designed to boost bookings, improve retention, and streamline daily operations — from any place, on any device</b>
</p>
      </div>
    </>
  );
};

export default SimplyAndGrow;
