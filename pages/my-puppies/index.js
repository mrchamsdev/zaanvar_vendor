import Layout from "@/components/pet-sales/layout";
import MyPuppies from "@/components/pet-sales/myPuppins";
import { BackButton, Calender3, FourDots } from "@/public/image/SVG";
import React, { useEffect, useState } from "react";
import { WebApimanager } from "@/components/utilities/WebApiManager";
import useStore from "@/components/state/useStore";
const index = () => {
  const menuItems = [
    { name: "Dashboard", icon: <Calender3 />, path: "/pet-sales" },
    { name: "My Pets", icon: <Calender3 />, path: "/my-pets" },
    { name: "My Puppies", icon: <FourDots />, path: "/my-puppies" },
    { name: "Settings", icon: <Calender3 />, path: "/settings" },
  ];
  const { getJwtToken, getUserInfo } = useStore();
  console.log(getUserInfo,"getUserInfo")
  const jwttoken = getJwtToken();
  const webApi = new WebApimanager(jwttoken);

  const [myPetData, setMyPetData] = useState([]);
  const FetchAllData = async () => {
    try {
      const response = await webApi.get(`petSales/mySales`);
      console.log(response, "response22");
      // console.log(response?.data, "response33");
      console.log(response?.data?.data, "response44");
      setMyPetData(response?.data?.data || []);

    } catch {
      console.error("error");
    }
  };

  useEffect(() => {
    FetchAllData();
  }, []);

  return (
    <>
      <Layout
        menuItems={menuItems}
        // topbarButtons={topbarButtons}
        logoText="Zaanvar"
        sidebarToggleButton={<BackButton />}
      >
        <MyPuppies pets={myPetData}/>
      </Layout>
    </>
  );
};

export default index;
