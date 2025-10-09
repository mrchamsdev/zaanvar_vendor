import React from 'react'
import PetBusinessForm from './components/register/PetBusinessForm'
import Header from './components/header/header'
import Footer from './components/Footer/footer'
import WeManageBussiness from './components/Vender/WeManageBussiness'
import SimplyAndGrow from './components/register/simplyAndGrow'

const register = () => {
  return (
   
   <>
   <Header/>
   <PetBusinessForm/>
   <SimplyAndGrow/>
   <Footer/>
   </>
  )
}

export default register