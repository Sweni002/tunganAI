import React from "react";
import Button from "@mui/material/Button";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import frLocale from "date-fns/locale/fr";
import dayjs from "dayjs";
import styles from "../assiduite.module.css";

const MonthFilter = ({
  anchorRef,
  open1,
  setOpen,
  selectedDate,
  setSelectedDate,
  setMoisAll,
  setAnneeAll,
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={frLocale}>
      <div className={styles.debuts}>
        <Button
          ref={anchorRef}
          onClick={() => setOpen(true)}
          variant="outlined"
          sx={{
            py: 1.3,
            px: 1,
            width: 180,
            gap: 1,
            color: "gray",
            backgroundColor: "transparent",
            border: "1px solid #ebecee",
            textTransform: "none",
            fontSize: "0.75rem",
            fontFamily: " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
            "@media (max-width:1369px)": {
              py: 0.8,
            },
            "@media (max-width:480px)": {
              width: "100%",
              px: 2,
              py: 1,
            },
            "&:hover": {
              backgroundColor: " rgba(27, 105, 121, 0.08)",
            },
          }}
          endIcon={
            <i
              className="fa-solid fa-chevron-down"
              style={{
                paddingLeft: 1,
                fontSize: "0.75rem",
                color: "#1B6979",
              }}
            ></i>
          }
        >
          {selectedDate ? dayjs(selectedDate).format("MMMM YYYY") : "Filtrer par mois"}
        </Button>
      </div>

      <DatePicker
        open={open1}
        onClose={() => setOpen(false)}
        views={["month"]}
        minDate={new Date("2020-01-01")}
        maxDate={new Date("2030-12-31")}
        value={selectedDate ? new Date(selectedDate) : null}
        onChange={(newValue) => {
          if (newValue) {
            const year = newValue.getFullYear();
            const month = (newValue.getMonth() + 1).toString().padStart(2, "0");
            setMoisAll(month);
            setAnneeAll(year);

            const formattedDate = `${year}-${month.toString().padStart(2, "0")}-01`;
            setSelectedDate(formattedDate);
          }
          setOpen(false);
        }}
        slots={{
          field: () => null,
        }}
        slotProps={{
          popper: {
            anchorEl: () => anchorRef.current,
            placement: "bottom-start",
          },
        }}
      />
    </LocalizationProvider>
  );
};

export default MonthFilter;
