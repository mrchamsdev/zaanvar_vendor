import Layout from '@/components/pet-sales/layout'
import MyPuppies from '@/components/pet-sales/myPuppins'
import { BackButton, Calender3, FourDots } from '@/public/image/SVG';
import React from 'react'

const index = () => {
   const menuItems = [
      { name: "Dashboard", icon: <Calender3 />, path: "/pet-sales" },
      { name: "My Pets", icon: <Calender3 />, path: "/my-pets" },
      { name: "My Puppies", icon: <FourDots />, path: "/my-puppies" },
      { name: "Settings", icon: <Calender3 />, path: "/settings" },
    ];
  return (
   <>
   <Layout menuItems={menuItems}
       // topbarButtons={topbarButtons}
       logoText="Zaanvar"
       sidebarToggleButton={<BackButton />}>
   <MyPuppies/>
   
   </Layout>
   </>
  )
}

export default index