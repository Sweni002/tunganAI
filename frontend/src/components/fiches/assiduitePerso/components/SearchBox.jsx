import React from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import styles from "../assiduite.module.css";

const SearchBox = ({ searchText, setSearchText }) => (
  <div className={styles.searchB}>
    <input
      type="text"
      placeholder="Rechercher ..."
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
    />
    <MagnifyingGlassIcon size={22} color="#14535f" />
  </div>
);

export default SearchBox;
