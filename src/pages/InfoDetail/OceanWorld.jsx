import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/InfoDetail/OceanWorld.css";

function OceanWorld() {
    return (
        <div className="info-section">
            <p>
                <strong>대상:</strong> 대학(원) 재/휴학생, 교직원
            </p>
            <p>
                <strong>할인가:</strong> 32,000원 ~
            </p>
            <p>
                <strong>판매 기간:</strong> 25.07.03 ~ 25.07.23
            </p>
            <p>
                <strong>사용 기간:</strong> 25.07.04 ~ 25.07.24
            </p>
            <p>
                <strong>설명:</strong> 설명 텍스트 입력
            </p>
        </div>
    );
}

export default OceanWorld;
