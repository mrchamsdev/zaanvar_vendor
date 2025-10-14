// components/pet-sales/Layout.js
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const Layout = ({ children }) => {
  return (
    <>

    <div style={{ display: "flex" }}>

      <Sidebar />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
    </>
  );
};

export default Layout;
