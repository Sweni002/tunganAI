import React from "react";
import IconButton from "@mui/material/IconButton";

const localStyles = `
  @keyframes fadeInDivisionSelector {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .division-selector-scrollbtns::-webkit-scrollbar {
    display: none;
  }
`;

const DivisionSelector = ({
  isMobile,
  divisions,
  selectedDivision,
  setSelectedDivision,
  scrollRef,
  scrollBtnsRef,
  showLeft,
  showRight,
  scroll,
}) => {
  const useScrollable = isMobile || divisions.length > 10;

  return (
    <>
      <style>{localStyles}</style>

      {useScrollable ? (
        <div
          style={{
            marginTop: "15px",
            position: "relative",
            display: "flex",
            alignItems: "center",
            width: "100%",
            maxWidth: "100%",
            userSelect: "none",
          }}
        >
          {showLeft && (
            <div
              style={{
                position: "absolute",
                left: 3,
                top: 2,
                zIndex: 888,
                display: "flex",
                alignContent: "center",
              }}
            >
              <IconButton
                onClick={() => scroll("left")}
                sx={{
                  bgcolor: "transparent",
                  position: "relative",
                  "&:hover": { bgcolor: "transparent", transform: "scale(1.1)" },
                  transition: "all, 0.2s ease",
                }}
              >
                <i className="fa-solid fa-chevron-left" style={{ color: "black" }}></i>
              </IconButton>
            </div>
          )}

          <div
            ref={scrollRef}
            className="division-selector-scrollbtns"
            style={{
              display: "flex",
              flexWrap: "nowrap",
              gap: "14px",
              overflowX: "auto",
              overflowY: "hidden",
              flex: 1,
              position: "relative",
              zIndex: 1,
              paddingLeft: "8px",
              paddingRight: "8px",
              scrollbarWidth: "none",
            }}
          >
            {divisions.map((s) => {
              const isActive = selectedDivision === s.iddiv;
              return (
                <button
                  key={s.iddiv}
                  ref={(el) => (scrollBtnsRef.current[s.iddiv] = el)}
                  onClick={() => setSelectedDivision(isActive ? null : s.iddiv)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "0 16px",
                    height: "56px",
                    minWidth: "200px",
                    background: isActive ? "rgba(27, 105, 121, 0.08)" : "#ffffff",
                    border: isActive ? "1px solid #1b6979" : "1px solid #ebecee",
                    borderRadius: "12px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s ease",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = "#c7d3d5";
                      e.currentTarget.style.background = "#fafbfb";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = "#ebecee";
                      e.currentTarget.style.background = "#ffffff";
                    }
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: isActive ? "#ffffff" : "#f5f6f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <i
                      className="fa-solid fa-building"
                      style={{ fontSize: "13px", color: "#1b6979" }}
                    ></i>
                  </div>
                  <div style={{ textAlign: "left", minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: isActive ? "#1b6979" : "#2c2c2a",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {s.nomdivision}
                    </div>
                    <div
                      style={{
                        fontSize: "0.65rem",
                        color: isActive ? "#1b6979" : "#9a9a95",
                        opacity: isActive ? 0.75 : 1,
                        marginTop: "1px",
                      }}
                    >
                      {isActive ? "Sélectionnée" : "Voir les personnels"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {showRight && (
            <div
              style={{
                position: "absolute",
                top: 2,
                zIndex: 888,
                right: 3,
                display: "flex",
                alignContent: "center",
              }}
            >
              <IconButton
                onClick={() => scroll("right")}
                sx={{
                  bgcolor: "transparent",
                  "&:hover": { bgcolor: "transparent", transform: "scale(1.1)" },
                  transition: "all 0.2s ease",
                }}
              >
                <i className="fa-solid fa-chevron-right" style={{ color: "black" }}></i>
              </IconButton>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            animation: "fadeInDivisionSelector 1s ease-in-out",
            marginTop: "25px",
            alignItems: "center",
            justifyContent: isMobile ? "flex-start" : "center",
            gap: "14px",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            flexWrap: "nowrap",
            width: "100%",
            maxWidth: "1700px", // 👈 AJOUTÉ
        
            backgroundColor: "transparent",
            padding: "7px",
            userSelect: "none",
            overflowX: isMobile ? "visible" : "auto",
          }}
        >
          {divisions.length === 0 ? (
            <p>Chargement des divisions...</p>
          ) : (
            divisions.map((division) => {
              const isActive = selectedDivision === division.iddiv;
              return (
                <div
                  key={division.iddiv}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flex: isMobile ? "none" : "1", // 👈 chaque carte prend une part égale de la largeur
                    width: isMobile ? "100%" : "auto", // 👈 largeur pleine en mobile, auto sinon (géré par flex)
                    height: "56px",
                    padding: "0 18px",
                    border: isActive ? "1px solid #1b6979" : "1px solid #ebecee",
                    backgroundColor: isActive ? "rgba(27, 105, 121, 0.08)" : "#ffffff",
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s ease-in-out",
                  }}
                  onClick={() => setSelectedDivision(isActive ? null : division.iddiv)}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = "#c7d3d5";
                      e.currentTarget.style.backgroundColor = "#fafbfb";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = "#ebecee";
                      e.currentTarget.style.backgroundColor = "#ffffff";
                    }
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: isActive ? "#ffffff" : "#f5f6f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <i
                      className="fa-solid fa-building"
                      style={{ fontSize: "13px", color: "#1b6979" }}
                    ></i>
                  </div>
                  <div style={{ textAlign: "left", minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: isActive ? "#1b6979" : "#2c2c2a",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {division.nomdivision}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </>
  );
};

export default DivisionSelector;