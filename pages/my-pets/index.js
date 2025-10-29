import Layout from "@/components/pet-sales/layout";
import MyPets from "@/components/pet-sales/myPets";
import useStore from "@/components/state/useStore";
import { WebApimanager } from "@/components/utilities/WebApiManager";
import { BackButton, Calender3, FourDots } from "@/public/image/SVG";
import { useEffect, useState } from "react";
// import MyPetsContent from "@/components/pet-sales/MyPetsContent";

export default function Index() {
  const { getJwtToken, getUserInfo } = useStore();
  const jwttoken = getJwtToken();
  // const currentUser = getUserInfo();
  const webApi = new WebApimanager(jwttoken);

  const [myPetData, setMyPetData] = useState([]);

  const menuItems = [
    { name: "Dashboard", icon: <Calender3 />, path: "/pet-sales" },
    { name: "My Pets", icon: <FourDots />, path: "/my-pets" },
    { name: "My Puppies", icon: <Calender3 />, path: "/my-puppies" },
    { name: "Settings", icon: <Calender3 />, path: "/settings" },
  ];
  const FetchAllData = async () => {
    try {
      const response = await webApi.get(`petProfile/ByPetOwner`);
      // console.log("response", response?.data);
      // console.log("response2", response?.data?.data);
      setMyPetData(response?.data?.data?.pets || []);
      console.log("response", response?.data?.data?.pets);
    } catch {
      console.error("error");
    }
  };

  useEffect(() => {
    FetchAllData();
  }, []);
  return (
    <Layout
      menuItems={menuItems}
      // topbarButtons={topbarButtons}
      logoText="Pet Management"
      sidebarToggleButton={<BackButton />}
    >
      <MyPets pets={myPetData} />
    </Layout>
  );
}
