
import Layout from "@/components/pet-sales/layout";
import MyPets from "@/components/pet-sales/myPets";
import { BackButton, Calender3, FourDots } from "@/public/SVG";
// import MyPetsContent from "@/components/pet-sales/MyPetsContent";

export default function Index() {

  const menuItems = [
    { name: "Dashboard", icon: <Calender3 />, path: "/pet-sales" },
    { name: "My Pets", icon: <FourDots />, path: "/my-pets" },
    { name: "My Puppies", icon: <Calender3 />, path: "/my-puppies" },
    { name: "Settings", icon: <Calender3 />, path: "/settings" },
  ];

  return (
    <Layout menuItems={menuItems}
    // topbarButtons={topbarButtons}
    logoText="Pet Management"
    sidebarToggleButton={<BackButton />}>
      <MyPets/>
    </Layout>
  );
}
