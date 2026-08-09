import React from "react";
import { CiSearch } from "react-icons/ci";
import styles from "../assiduite.module.css";

const TableSearchBar = ({ searchText, setSearchText }) => (
  <div className={styles.searchB}>
    <input
      type="text"
      placeholder="Rechercher ..."
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
      style={{ width: "100%" }}
    />
    <CiSearch size={22} />
  </div>
);

export default TableSearchBar;