import Charts from '@/components/pet-sales/charts'
import ChatOnline from '@/components/pet-sales/chatOnline'
import Layout from '@/components/pet-sales/layout'
import Topbar from '@/components/pet-sales/Topbar'
import { BackButton, Calender3, FourDots } from '@/public/SVG'
import React from 'react'

const index = () => {
    const menuItems = [
        { name: "Dashboard", icon: <FourDots />, path: "/grooming" },
        { name: "Bookings", icon: <Calender3 />, path: "/bookings" },
        { name: "My Puppies", icon: <Calender3 />, path: "/my-puppies" },
        { name: "Settings", icon: <Calender3 />, path: "/settings" },
      ];
  return (
   <Layout menuItems={menuItems}
   sidebarToggleButton={<BackButton />}>
    <Topbar  buttons={[
          { label: "+ Add Puppies", color: "purple", action: "addRoom" },
          { label: "+ Add Bookings", color: "red", action: "addBooking" },
          { label: "+ Add More", color: "gray", action: "addMore" },
        ]}/>

        <div style={{display:'flex'}}>
        <Charts/>
        <ChatOnline/>
        </div>
        
    </Layout>
  )
}

export default index