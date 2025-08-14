import React from "react";
import "../components/NaviBar.css";

function NaviBar() {
    return (
        <div className="navbar">
            <span className="nav-item">제휴 정보</span>
            <span className="nav-item">제휴 지도</span>
            <span className="nav-item">가게 정보</span>
        </div>
    );
}

export default NaviBar;
