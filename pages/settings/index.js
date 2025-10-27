import Layout from "@/components/pet-sales/layout";
import React, { useState } from "react";
import styles from "../../styles/settings/settings.module.css";
import Image from "next/image";
import Topbar from "@/components/pet-sales/Topbar";
import { BackButton, Calender3, FourDots, FrontArror, MsgProflie, ShareProfile } from "@/public/SVG";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar as BarElement,
} from "recharts";

// Data separated for each section
const enquiriesData = [
  {
    name: "Shubham Pawar",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    img: "https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg",
  },
  {
    name: "Shubham Pawar",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    img: "https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg",
  },
];

const myDogsData = [
  {
    name: "Rottweiler",
    type: "Dog, Female",
    age: "1 month",
    price: 1500,
    description: "Lorem ipsum dolor sit amet.",
    status: "Not for sale",
    img: "https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg",
  },
  {
    name: "Rottweiler",
    type: "Dog, Female",
    age: "1 month",
    price: 1500,
    status: "Not for sale",
    img: "https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg",
  },
];

const myPuppiesData = [
  {
    name: "Rottweiler",
    type: "Dog, Female",
    age: "1 month",
    price: 1500,
    status: "Not for sale",
    img: "https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg",
  },
  {
    name: "Rottweiler",
    type: "Dog, Female",
    age: "1 month",
    price: 1500,
    status: "Not for sale",
    img: "https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg",
  },
];

// Chart Data
const dailyBarData = [
  { name: "SUN", total: 20, available: 12 },
  { name: "MON", total: 15, available: 8 },
  { name: "TUE", total: 25, available: 15 },
  { name: "WED", total: 18, available: 10 },
  { name: "THU", total: 12, available: 7 },
  { name: "FRI", total: 22, available: 17 },
  { name: "SAT", total: 14, available: 3 },
];

// Separate Components for each section
const EnquiryCard = ({ item }) => (
  <div className={styles.card}>
    <div className={`${styles.cardLeft} ${styles.enquiriesCardLeft}`}>
      <Image src={item.img} alt={item.name} width={50} height={50} />
      <div>
        <p className={styles.name}>{item.name}</p>
        <p className={styles.description}>{item.description}</p>
      </div>
    </div>
  </div>
);

const DogCard = ({ item }) => (
  <div className={`${styles.card} ${styles.noBorder} ${styles.spaceBetween}`}>
    <div className={`${styles.cardLeft} ${styles.myDogsCardLeft}`}>
      <Image src={item.img} alt={item.name} width={50} height={50} />
      <div className={styles["div-name"]}>

    
      <div>
        <p className={styles.name}>{item.name}</p>
        <p className={styles.type}>{item.type}</p>
        <p className={styles.age}>{item.age}</p>
      </div>
      <div>
      <p className={styles.price}>₹ {item.price}</p>
      <p className={styles.status}>{item.status}</p>
      </div>
      </div>
    </div>

  </div>
);

const PuppyCard = ({ item }) => (
  <div className={`${styles.card} ${styles.noBorder} ${styles.spaceBetween}`}>
    <div className={`${styles.cardLeft} ${styles.myPuppiesCardLeft}`}>
      <Image src={item.img} alt={item.name} width={50} height={50} />
      
      <div className={styles["div-name"]}>

    
      <div>
        <p className={styles.name}>{item.name}</p>
        <p className={styles.type}>{item.type}</p>
        <p className={styles.age}>{item.age}</p>
      </div>
      <div>
      <p className={styles.price}>₹ {item.price}</p>
      <p className={styles.status}>{item.status}</p>
      </div>
      </div>
    </div>
    
    

    <div>
    
    </div>
  </div>
);

const Settings = () => {
  const [barData, setBarData] = useState(dailyBarData);

  const menuItems = [
    { name: "Dashboard", icon: <Calender3 />, path: "/pet-sales" },
    { name: "My Pets", icon: <Calender3 />, path: "/my-pets" },
    { name: "My Puppies", icon: <Calender3 />, path: "/my-puppies" },
    { name: "Settings", icon: <FourDots />, path: "/settings" },
  ];  
  return (
    <Layout menuItems={menuItems}
        // topbarButtons={topbarButtons}
        logoText="Pet Management"
        sidebarToggleButton={<BackButton />}>
      
      <Topbar
        buttons={[
          { label: "+ Add Puppies", color: "purple", action: "addRoom" },
          { label: "+ Add Bookings", color: "red", action: "addBooking" },
          { label: "+ Add More", color: "gray", action: "addMore" },
        ]}
        onButtonClick={() => {}}
      />

      <div className={styles["main-wrapper"]}>
        {/* Left Profile + Chart */}
        <div className={styles["wrapper-div"]}>
          <div className={styles["first-div"]}>
            <Image
              src="https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg"
              alt="profile"
              width={100}
              height={100}
              className={styles["image-div"]}
            />
            <p className={styles.para}>Shubham Pawar</p>
            <p className={styles["para-div"]}>Hitech City, Hyderabad</p>
            <span className={styles["span-div"]}>
              Brown Labrador with a white patch on the chest, wearing a red
              collar with a name tag
            </span>
            <div className={styles["svg-div"]}>
              <MsgProflie />
              <ShareProfile />
            </div>

            <div className={styles["counter-wrapper"]}>
              <div className={styles["number-counter"]}>
                <p>45</p>
                <span>My Dogs</span>
              </div>
              <div className={styles["number-counter"]}>
                <p>75</p>
                <span>My Puppies</span>
              </div>
              <div
                className={styles["number-counter"]}
                style={{ border: "none" }}
              >
                <p>450k</p>
                <span>Followers</span>
              </div>
            </div>

            <div className={styles.chartBox}>
            <div className={styles.graphLegend}>
  <p className={styles["analytics"]}>Analytics</p>
  <div className={styles.colors}>
    <span className={styles.red}></span> Enquiries
    <span className={styles.blue}></span> Sales
  </div>
</div>
            <ResponsiveContainer width="100%" height={300}>
  <BarChart data={barData}>
    <CartesianGrid strokeDasharray="0 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    {/* Bar on TOP */}
    <Bar dataKey="total" stackId="stack" fill="#F5790C" barSize={25} />
    {/* Bar BELOW it */}
    <Bar dataKey="available" stackId="stack" fill="#F5790C33" barSize={25} />
  </BarChart>
</ResponsiveContainer>

            </div>
          </div>
        </div>

        {/* Right Sections */}
        <div className={styles["second-div"]}>
          <div className={styles.container}>
            {/* Enquiries */}
            <section className={styles.enquiriesSection}>
            <div className={styles["svg-container"]}> 
               <h3>Enquiries</h3>
               <FrontArror/>
            </div>
              {enquiriesData.map((item, i) => (
                <EnquiryCard key={i} item={item} />
              ))}
            </section>

            {/* My Dogs */}
            <section className={styles.myDogsSection}>
            <div className={styles["svg-container"]}> 
               <h3>My Dogs</h3>
               <FrontArror/>
            </div>
              {myDogsData.map((item, i) => (
                <DogCard key={i} item={item} />
              ))}
            </section>

            {/* My Puppies */}
            <section className={styles.myPuppiesSection}>
            <div className={styles["svg-container"]}> 
               <h3>My Puppies</h3>
               <FrontArror/>
            </div>
              {myPuppiesData.map((item, i) => (
                <PuppyCard key={i} item={item} />
              ))}
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
