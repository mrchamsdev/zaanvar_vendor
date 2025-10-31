"use client";
import React, { useEffect, useState } from "react";
import styles from "../../styles/settings/addAddress.module.css";
import useStore from "@/components/state/useStore";
import { WebApimanager } from "@/components/utilities/WebApiManager";
import Layout from "@/components/pet-sales/layout";
import Topbar from "@/components/pet-sales/Topbar";
import {
  AddIcon,
  BackButton,
  Calender3,
  FourDots,
  LeftArrowIcon2,
  RightArrow,
  SearchIcon,
} from "@/public/image/SVG";
import AddNewAddressPopup from "@/components/pet-sales/addNewAddressPopup";

const Settingsaddress = ({ setIsSidebarOpen, setShowMobSettings }) => {
  const { getJwtToken } = useStore();
  const jwt = getJwtToken();
  const webApi = new WebApimanager(jwt);

  const [addresses, setAddresses] = useState([]);
  const [userDetails, setUserDetails] = useState({});
  const [addNew, setAddNew] = useState(false);
  const [address, setAddress] = useState(true);
  const [rowAddress, setRowAddress] = useState({});
  const [searchValue, setSearchValue] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobileNumber: "",
    country: "India",
    state: "",
    address1: "",
    address2: "",
    landmark: "",
    pincode: "",
    defaultAddress: false,
  });

  // 🧭 Fetch user info (and addresses)
  const fetchUserInfo = async () => {
    try {
      const userResponse = await webApi.get("users/userDetails");
      console.log("API response:", userResponse?.data);
  
      const user = userResponse?.data?.data?.user;
      const addrArray = user?.addresses || [];
  
      console.log("Fetched addresses:", addrArray);
  
      // Prevent .split() on null
      const formattedAddresses = addrArray.map((item) => ({
        ...item,
        splitAddress: item.address ? item.address.split(",") : [],
      }));
  
      setAddresses(formattedAddresses);
      setUserDetails(user);
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };
  

  useEffect(() => {
    fetchUserInfo();
  }, [address, addNew]);

  // 🟢 Add new address API integration
  const handleSaveAddress = async (fullAddress, isDefault) => {
    try {
      // Compose payload
      const payload = {
        address: fullAddress,
        addressStatus: isDefault ? "Default" : "Active",
      };

      // ✅ Backend API call
      const res = await webApi.put("users/updateAddress", payload);
      console.log(res,"rerere")
      if (res?.data?.message?.includes("success")) {
        fetchUserInfo();
        setAddNew(false);
        setAddress(true);
      } else {
        console.error("Add address failed:", res?.data);
      }
    } catch (error) {
      console.error("Error saving address:", error);
    }
  };

  const handleRemoveClick = async (id) => {
    try {
      const payload = { addressId: id };
      const res = await webApi.delete(`users/deleteAddress`, payload);
      if (res.data.message === "Address deleted successfully") fetchUserInfo();
    } catch (error) {
      console.error("Error deleting address:", error);
    }
  };

  const handleDefault = async (id) => {
    try {
      const payload = { addressId: id, status: "Default" };
      await webApi.put(`users/updateAddressStatus`, payload);
      fetchUserInfo();
    } catch (error) {
      console.error("Error setting default address:", error);
    }
  };

  const handleAddClick = () => {
    setAddNew(true);
    setAddress(false);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      mobileNumber: "",
      country: "India",
      state: "",
      address1: "",
      address2: "",
      landmark: "",
      pincode: "",
      defaultAddress: false,
    });
  };

  const handleAddClose = () => {
    setAddNew(false);
    setAddress(true);
  };
  const editHandleClick = (data) => {
    setAddNew(true);
    setAddress(false);
    setRowAddress(data);
    setFormData({
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      email: data.email || "",
      mobileNumber: data.mobileNo || data.phoneNumber || "",
      country: data.country || "India",
      state: data.state || "",
      address1: data.address ? data.address.split(",")[0] || "" : "",
      address2: data.address ? data.address.split(",")[1] || "" : "",
      landmark: data.landmark || "",
      pincode: data.pincode || "",
      defaultAddress: data.addressStatus === "Default",
    });
  };
  

  const handleBackClick = () => {
    if (setShowMobSettings) setShowMobSettings(true);
    else if (setIsSidebarOpen) setIsSidebarOpen(true);
  };

  const menuItems = [
    { name: "Dashboard", icon: <Calender3 />, path: "/pet-sales" },
    { name: "My Pets", icon: <Calender3 />, path: "/my-pets" },
    { name: "My Puppies", icon: <Calender3 />, path: "/my-puppies" },
    { name: "Settings", icon: <FourDots />, path: "/settings" },
  ];

  return (
    <Layout
      menuItems={menuItems}
      logoText="Pet Management"
      sidebarToggleButton={<BackButton />}
    >
      <Topbar
        buttons={[
          { label: "+ Add Puppies", color: "purple", action: "addRoom" },
          { label: "+ Add Bookings", color: "red", action: "addBooking" },
          { label: "+ Add More", color: "gray", action: "addMore" },
        ]}
      />

      <div className={styles["address-page"]} style={{ width: "100%" }}>
        {address && (
          <div className={styles["address-content"]}>
            <div className={styles.Head}>
              <span
                className={styles["leftArrowIcon"]}
                onClick={handleBackClick}
              >
                <LeftArrowIcon2 />
              </span>
              <h1 className={styles["heading"]}> Address</h1>
            </div>

            <div className={styles.Body}>
              <div
                className={styles["add-address"]}
                style={{ cursor: "pointer" }}
                onClick={handleAddClick}
              >
                <h2>Add New Address</h2>
                <span className={styles["right-arrow"]}>
                  <RightArrow onClick={handleAddClick} height={14} width={14} />
                </span>
              </div>

              <div
  style={{
    width: "100%",
    height: "calc(100vh - 340px)",
    overflow: "auto",
  }}
>
  {addresses && addresses.length > 0 ? (
    addresses
      // 🔧 Fix: handle cases where add.address is null or undefined
      .filter((add) =>
        (add.address || "")
          .toLowerCase()
          .includes(searchValue.toLowerCase())
      )
      .map((add, index) => {
        const addressText = add.address || "No address provided";
        const splitAddress = addressText.split(",");

        return (
          <div className={styles["address-list"]} key={add?.id || index}>
            <div className={styles["address-card-container"]}>
              <div className={styles["address-conntent-container"]}>
                <div className={styles["address-card-wrapper"]}>
                  <p className={styles["Name"]}>
                    {add.firstName || add.lastName
                      ? `${add.firstName || ""} ${add.lastName || ""}`
                      : "Unnamed Address"}
                  </p>

                  <p className={styles["address"]}>
                    {splitAddress.length > 1
                      ? splitAddress.join(", ")
                      : addressText}
                  </p>

                  <p>{add.mobileNo || add.phoneNumber || ""}</p>
                </div>

                <div className={styles["address-button-container"]}>
                  <button
                    className={styles["Edit"]}
                    onClick={() => editHandleClick(add)}
                  >
                    Edit
                  </button>
                  <button
                    className={styles["Remove"]}
                    onClick={() => handleRemoveClick(add?.id)}
                  >
                    Remove
                  </button>

                  {add.addressStatus !== "Default" && (
                    <button
                      className={styles["Edit"]}
                      onClick={() => handleDefault(add?.id)}
                    >
                      Set as Default
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })
  ) : (
    <p style={{ textAlign: "center", marginTop: "2rem", color: "#666" }}>
      No addresses found
    </p>
  )}
</div>
{console.log("Addresses in render:", addresses)}

            </div>
          </div>
        )}

{/* {addNew && (
  <AddNewAddressPopup
    postFormData={rowAddress?.id ? rowAddress : formData} // ✅ if editing, use rowAddress
    onSaveAddress={async (fullAddress, isDefault) => {
      if (rowAddress?.id) {
        // ✅ UPDATE existing address
        try {
          const payload = {
            addressId: rowAddress.id,
            address: fullAddress,
            addressStatus: isDefault ? "Default" : rowAddress.addressStatus || "Active",
          };
          const res = await webApi.put("users/updateAddress", payload);
          if (res?.data?.message?.includes("success")) {
            fetchUserInfo();
            setAddNew(false);
            setAddress(true);
            setRowAddress({});
          } else {
            console.error("Update failed:", res?.data);
          }
        } catch (err) {
          console.error("❌ Error updating address:", err);
        }
      } else {
        // ✅ CREATE new address (existing logic)
        await handleSaveAddress(fullAddress, isDefault);
      }
    }}
    onClose={handleAddClose}
    userInfo={{ addresses }}
  />
)} */}
{addNew && (
  <AddNewAddressPopup
    key={rowAddress?.id || "new-address"} // 🔑 re-render when editing a different address
    postFormData={rowAddress?.id ? rowAddress : formData}
    isEditing={!!rowAddress?.id} // 👈 pass a flag
    onSaveAddress={async (fullAddress, isDefault) => {
      if (rowAddress?.id) {
        // ✅ UPDATE existing address
        try {
          const payload = {
            addressId: rowAddress.id,
            address: fullAddress,
            addressStatus: isDefault
              ? "Default" 
              : rowAddress.addressStatus || "Active",
          };
          const res = await webApi.put("users/updateAddress", payload);
          if (res?.data?.message?.includes("success")) {
            fetchUserInfo();
            setAddNew(false);
            setAddress(true);
            setRowAddress({});
          } else {
            console.error("Update failed:", res?.data);
          }
        } catch (err) {
          console.error("❌ Error updating address:", err);
        }
      } else {
        // ✅ CREATE new address
        await handleSaveAddress(fullAddress, isDefault);
      }
    }}
    onClose={handleAddClose}
    userInfo={{ addresses }}
  />
)}


      </div>
    </Layout>
  );
};

export default Settingsaddress;
