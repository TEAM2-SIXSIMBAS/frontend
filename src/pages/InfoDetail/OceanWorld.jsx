import React, { useState } from "react";
import "../../styles/InfoDetail/OceanWorld.css";
function OceanWorld() {
    const [activeTab, setActiveTab] = useState("info");

    return (
        <div className="oceanworld-container">
            {/* 상단 타이틀 & 네비게이션 (현재는 텍스트만) */}
            <div className="top-header">
                <h1 className="title-text">가대제휴</h1>
                <div className="nav-texts">
                    <span className="nav-item">제휴 정보</span>
                    <span className="nav-item">제휴 지도</span>
                    <span className="nav-item">가게 정보</span>
                </div>
            </div>

            {/* 메인 카드 */}
            <div className="detail-card">
                <h2 className="store-name">오션월드</h2>

                {/* 이미지 영역 */}
                <div className="image-wrapper">
                    <img
                        src="/oceanworld.png"
                        alt="오션월드"
                        className="main-image"
                    />
                </div>

                {/* 탭 버튼 */}
                <div className="tab-buttons">
                    <button
                        className={`tab-btn ${
                            activeTab === "info" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("info")}
                    >
                        정보
                    </button>
                    <button
                        className={`tab-btn ${
                            activeTab === "review" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("review")}
                    >
                        리뷰
                    </button>
                </div>

                {/* 탭 내용 */}
                <div className="tab-content">
                    {activeTab === "info" && (
                        <div className="info-section">
                            <p>
                                <strong>대상:</strong> 대학(원) 재/휴학생,
                                교직원
                            </p>
                            <p>
                                <strong>혜택:</strong> 할인
                            </p>
                            <p>
                                <strong>판매 기간:</strong> 25.07.03 ~ 25.07.23
                            </p>
                            <p>
                                <strong>사용 기간:</strong> 25.07.04 ~ 25.07.24
                            </p>
                            <p>
                                <strong>비고:</strong> 구명조끼 + 입장권 32,000~
                                ㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁ
                                ㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁㅁ
                            </p>
                        </div>
                    )}
                    {activeTab === "review" && (
                        <div className="review-section">
                            <button className="review-write-btn">
                                리뷰 작성
                            </button>
                            <p>아직 작성된 리뷰가 없습니다.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default OceanWorld;
