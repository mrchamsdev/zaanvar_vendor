import React from 'react'
import BannerAbout from './components/about-us/bannerAbout'
import BannerComponent from './components/about-us/BannerComponent'
import Ourstory from './components/about-us/ourStory'
import OurMission from './components/about-us/ourMission'
import OurFounder from './components/about-us/outFounder'
import FAQ from './components/about-us/FAQ'
import Header from './components/header/header'
import Footer from './components/Footer/footer'
import BannerPhoto from './components/about-us/bannerPhoto'
import OurValue from './components/about-us/ourValue'

const AboutUs = () => {
  return (
   <>
   <Header/>
   <BannerAbout/>
   <BannerComponent/>
   <Ourstory/>
   <OurMission/>
   <OurValue/>
   <OurFounder/>
   <FAQ/>
<BannerPhoto/>
   <Footer/>
   </>
  )
}

export default AboutUs