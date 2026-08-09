import React, { useState } from "react";
import { Table } from "antd";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import WifiIcon from "@mui/icons-material/Wifi"; // <-- nouvelle icône
import { EditOutlined } from "@ant-design/icons";
import styles from "./service.module.css";

const FONT = "'Poppins', system-ui, Avenir, Helvetica, Arial, sans-serif";

const renderPeriode = (horaires, entreeKey, sortieKey) => {
  if (!horaires) {
    return (
      <span style={{ color: "#b5b5b5", fontStyle: "italic", fontSize: "0.78rem" }}>
        Non définis
      </span>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: "0.8rem" }}>
      <span>{horaires[entreeKey]}</span>
      <span>{horaires[sortieKey]}</span>
    </div>
  );
};

const RowActionsMenu = ({ record, onEdit, onDelete, onEditHoraires, onManageMacAddresses }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action) => {
    handleClose();
    action(record);
  };

  return (
    <>
      <IconButton
        aria-label="actions"
        aria-controls={open ? "row-actions-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleOpen}
        size="small"
      >
        <MoreVertIcon style={{ fontSize: "1.1rem", color: "#4f4f4f" }} />
      </IconButton>

      <Menu
        id="row-actions-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { fontFamily: FONT } } }}
      >
        <MenuItem onClick={() => handleAction(onEdit)} sx={{ fontFamily: FONT, fontSize: "0.85rem" }}>
          <ListItemIcon>
            <EditOutlined style={{ color: "#1B6979", fontSize: "1rem" }} />
          </ListItemIcon>
          <ListItemText>Modifier</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleAction(onEditHoraires)} sx={{ fontFamily: FONT, fontSize: "0.85rem" }}>
          <ListItemIcon>
            <i className="fa-regular fa-clock" style={{ color: "#3390a2", fontSize: "0.95rem" }}></i>
          </ListItemIcon>
          <ListItemText>Modifier les horaires</ListItemText>
        </MenuItem>

        {/* Nouvelle entrée : ouvre le drawer des adresses MAC */}
        <MenuItem onClick={() => handleAction(onManageMacAddresses)} sx={{ fontFamily: FONT, fontSize: "0.85rem" }}>
          <ListItemIcon>
            <WifiIcon style={{ color: "#3390a2", fontSize: "1.05rem" }} />
          </ListItemIcon>
          <ListItemText>Adresses MAC autorisées</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleAction(onDelete)} sx={{ fontFamily: FONT, fontSize: "0.85rem" }}>
          <ListItemIcon>
            <i className="fa-regular fa-trash-can" style={{ color: "#ff4d4f", fontSize: "0.95rem" }}></i>
          </ListItemIcon>
          <ListItemText sx={{ color: "#ff4d4f" }}>Supprimer</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

const buildColumns = ({ onEdit, onDelete, onEditHoraires, onManageMacAddresses }) => [
  {
    title: "",
    dataIndex: "logo",
    key: "logo",
    width: 60,
    render: (logo) => (
      <Avatar src={`data:image/png;base64,${logo}`} alt="logo" sx={{ width: 55, height: 50 }} />
    ),
    align: "center",
  },
  { title: "Code service", dataIndex: "code_service", key: "code_service", align: "center" },
  { title: "Nom", dataIndex: "nom", key: "nom", align: "center" },
  { title: "Sigle", dataIndex: "sigle", key: "sigle", align: "center" },
  { title: "Addresse", dataIndex: "addresse", key: "addresse", align: "center" },
  {
    title: <span>Horaires matin</span>,
    dataIndex: "horaires",
    key: "horaires_matin",
    align: "center",
    render: (horaires) => renderPeriode(horaires, "entree_matin", "sortie_matin"),
  },
  {
    title: <span>Horaires soir</span>,
    dataIndex: "horaires",
    key: "horaires_soir",
    align: "center",
    render: (horaires) => renderPeriode(horaires, "entree_soir", "sortie_soir"),
  },
  {
    title: "",
    key: "actions",
    width: 60,
    align: "center",
    render: (_, record) => (
      <RowActionsMenu
        record={record}
        onEdit={onEdit}
        onDelete={onDelete}
        onEditHoraires={onEditHoraires}
        onManageMacAddresses={onManageMacAddresses}
      />
    ),
  },
];

const rowSelection = {
  onChange: (selectedRowKeys, selectedRows) => {
    console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
  },
  getCheckboxProps: (record) => ({ disabled: false, name: record.nom }),
};

const ServiceTable = ({ services, loading, onEdit, onDelete, onEditHoraires, onManageMacAddresses }) => {
  const columns = buildColumns({ onEdit, onDelete, onEditHoraires, onManageMacAddresses });

  return (
    <div className={`${styles.tableau} ${styles.shadowedTable}`}>
      <Table
        pagination={{ position: ["bottomCenter"], pageSize: 10 }}
        scroll={{ y: 540 }}
        loading={loading}
        rowSelection={{ type: "checkbox", ...rowSelection }}
        columns={columns}
        dataSource={services.map((p) => ({ ...p, key: p.idserv }))}
        rowClassName={() => styles.largeRow}
        onHeaderRow={() => ({ className: styles.largeHeader })}
      />
    </div>
  );
};

export default ServiceTable;