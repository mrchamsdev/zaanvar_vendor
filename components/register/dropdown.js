import React, { useState, useEffect } from "react";
// import styles from "../../styles/ui.module.css";
import styles from "../../styles/register/ui.module.css"

const DropDownv1 = ({
  question,
  options,
  width = "45%",
  backgroundColor = "rgba(243, 243, 243, 0.50)",
  value,
  onChange,
  CustomInputElementAddpet,
  error,
  Customdropdown,
  customFlex,
  custommarrgin,
  disabled,
  custompadding,
}) => {
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 660px)");

    // Update state based on the initial value
    setIsSmallScreen(mediaQuery.matches);

    // Add a listener to update state on resize
    const handleMediaChange = (e) => {
      setIsSmallScreen(e.matches);
    };

    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  const dynamicStyle = {
    flex:
      customFlex || (!Customdropdown && width === "45%" ? `1 1 ${width}` : ""),
    width: isSmallScreen ? "100%" : Customdropdown ? Customdropdown : width,
  };

  const handleChange = (e) => {
    if (onChange && !disabled) {
      onChange(e.target.value);
    }
  };

  return (
    <div className={styles.DropDownV1Div} style={dynamicStyle}>
      <p
        style={{
          color: CustomInputElementAddpet?.color,
          marginBottom: custommarrgin?.marginBottom,
          paddingBottom: custompadding?.paddingBottom,
        }}
      >
        {question.split("*").map((part, index, arr) => (
          <React.Fragment key={index}>
            {part}
            {index < arr.length - 1 && (
              <span style={{ color: "red", fontSize: "17px" }}>*</span>
            )}
          </React.Fragment>
        ))}
      </p>
      <select
        style={{
          backgroundColor: backgroundColor,
          width: "100%",
          border: "1px solid rgb(217, 217, 217)",
          padding: "10px",
          paddingRight: "40px",
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          marginTop: custommarrgin?.marginTop,
        }}
        value={disabled ? "Disabled" : value}
        onChange={handleChange}
        disabled={disabled}
      >
        {/* Render options */}
        {/* {options?.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))} */}

        {[...new Set(options)]?.map((option) => (
          <option key={option} value={option}>
            {option} 
          </option>
        ))}
      </select>
      {/* Show error message if value is 'select' or empty */}
      {(value === "select" || value === "") && error && (
        <span
          style={{
            color: "red",
            fontSize: "0.875rem",
            justifyContent: "center",
            alignItems: "center",
            // textAlign: "center",
            marginTop: "5px",
            // marginLeft: "50px",
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
};

export default DropDownv1;
