
import React, { useEffect, useState } from "react";
// import styles from "../../styles/ui.module.css";
import styles from "../../styles/register/ui.module.css"

const CustomInputElement2 = ({
  question,
  width = "45%",
  backgroundColor = "rgba(243, 243, 243, 0.50)",
  placeholder,
  onChange,
  value,
  error,
  CustomInputElement1,
  custommarrgin,
  ownMargin = false,
  type="text"
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

  return (
    <div
      className={styles.inputDiv}
      style={{
        flex: width === "94%" ? `1 1 ${width}` : "",
        width: isSmallScreen ? "100%" : width,
        padding: "0px 0px 23px 0px",
        borderBottom: CustomInputElement1?.borderBottom || "",
        gap: "0px",
      }}
    >
      <p
        style={{
          color: "#000000",
          marginBottom: ownMargin ? "16px" : custommarrgin?.marginBottom,
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
      <input
        type={type}
        style={{
          backgroundColor: backgroundColor,
          border: "1px solid #D9D9D9",
          boxShadow: "none",
          padding: "10px",
        }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e)}
        className="input"
        max={type==="date"?new Date().toISOString().split("T")[0]:""}
        required // Add the required attribute
      />
      {error && (
        <span
          style={{
            color: "red",
            fontSize: "0.875rem",
            justifyContent: "center",
            alignItems: "center",
            // textAlign: "center",
            marginTop: "5px",
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
};

export default CustomInputElement2;
