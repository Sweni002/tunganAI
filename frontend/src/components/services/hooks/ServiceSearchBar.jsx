import React, { useState } from "react";
import { Search } from "lucide-react";

const ServiceSearchBar = ({ searchText, onSearchChange }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        padding: 2,
        width: "100%",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: "25%",
          backgroundColor: "#e7edee",
          borderRadius: 34,
          border: isHovered ? "1px solid #14535f" : "1px solid transparent",
          padding: 10,
          display: "flex",
          alignItems: "center",
          paddingRight: 20,
          paddingLeft:25,
          marginRight: 45,
        }}
      >
        <Search
          size={20}
          color="#14535f"
          style={{ marginRight: 10, flexShrink: 0 }}
        />

        <input
          type="text"
          placeholder="Rechercher ..."
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            fontSize: "0.9rem",
            border: "none",
            backgroundColor: "transparent",
            outline: "none",
            boxShadow: "none",
            padding: 5,
            width: "78%",
            color: "#676767",
          }}
        />
      </div>
    </div>
  );
};

export default ServiceSearchBar;