import React from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { Table, Spin } from "antd";
import styles from "../assiduite.module.css";
import RetardCardList from "./RetardCardList";

const RetardModal = ({
  open,
  onClose,
  loading,
  loadingPdf,
  downloadPDF,
  selectionType,
  rowSelection,
  columns,
  dataSource,
  isMobile,
  variant,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="retard-modal-title"
      aria-describedby="retard-modal-description"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          maxWidth: 1700,
          bgcolor: "background.paper",
          borderRadius: 3,
          boxShadow: 24,
          p: isMobile ? 2 : 3,
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0 }}>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 0 }}>
            <Button
              onClick={downloadPDF}
              disabled={loadingPdf}
              variant="outlined"
              color="secondary"
              sx={{
                p: 1.2,
                pl: 3,
                pr: 3,
                color: "#2DAC60",
                fontSize: "0.75rem",
                fontFamily: " 'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif",
                "@media (max-width:1369px)": {
                  py: 0.8,
                },
              }}
              startIcon={
                loadingPdf ? (
                  <Spin size="small" />
                ) : (
                  <i className="fa-solid fa-download" style={{ fontSize: "0.9rem" }}></i>
                )
              }
            >
              Exporter en excel
            </Button>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 0 }}>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {isMobile ? (
          <Box sx={{ mt: 2 }}>
            <RetardCardList dataSource={dataSource} variant={variant} loading={loading} />
          </Box>
        ) : (
          <div className={styles.cardTab}>
            <div className={`${styles.tableau} ${styles.shadowedTable}`}>
              <Table
                loading={loading}
                pagination={{ position: ["bottomCenter"], pageSize: 10 }}
                scroll={{ x: 1300, y: 540 }}
                rowSelection={{ type: selectionType, ...rowSelection }}
                columns={columns}
                dataSource={dataSource.map((p) => ({ ...p, key: p.idpointage }))}
                rowClassName={() => styles.largeRow}
                onHeaderRow={() => ({ className: styles.largeHeader })}
              />
            </div>
          </div>
        )}
      </Box>
    </Modal>
  );
};

export default RetardModal;