import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // ✅ URL 파라미터 읽기
import "../../styles/InfoDetail/OceanWorld.css";
import TopBanner from "../../components/TopBanner";
import ReviewModal from "../ReviewWrite/ReviewModal";

function OceanWorld() {
    const { partnershipId } = useParams(); // ✅ 주소에서 partnershipID 추출
    const [activeTab, setActiveTab] = useState("info");
    const [showModal, setShowModal] = useState(false);

    // --- 연동용 상태 ---
    const [infoData, setInfoData] = useState(null);
    const [reviewData, setReviewData] = useState([]);

    useEffect(() => {
        if (!partnershipId) return;

        fetch(
            `${
                import.meta.env.VITE_API_BASE
            }/partnership-info/detail/${partnershipId}/inform`
        )
            .then((res) => res.json())
            .then((data) => setInfoData(data))
            .catch(() => console.error("정보 불러오기 실패"));

        fetch(
            `${
                import.meta.env.VITE_API_BASE
            }/partnership-info/detail/${partnershipId}/review`
        )
            .then((res) => res.json())
            .then((data) => setReviewData(data))
            .catch(() => console.error("리뷰 불러오기 실패"));
    }, [partnershipId]);

    return (
        <div className="oceanworld-container">
            {/* 상단 네비바 */}
            <TopBanner activeTab={activeTab} onChange={setActiveTab} />

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
                            {infoData ? (
                                <>
                                    <p>
                                        <strong>대상:</strong> {infoData.target}
                                    </p>
                                    <p>
                                        <strong>혜택:</strong> {infoData.type}
                                    </p>
                                    <p>
                                        <strong>판매 기간:</strong>{" "}
                                        {infoData.saleStartDate} ~{" "}
                                        {infoData.saleEndDate}
                                    </p>
                                    <p>
                                        <strong>사용 기간:</strong>{" "}
                                        {infoData.useStartDate} ~{" "}
                                        {infoData.useEndDate}
                                    </p>
                                    <p>
                                        <strong>비고:</strong> {infoData.note}
                                    </p>
                                </>
                            ) : (
                                <p>정보를 불러오는 중...</p>
                            )}
                        </div>
                    )}
                    {activeTab === "review" && (
                        <div className="review-section">
                            <button
                                className="review-write-btn"
                                onClick={() => setShowModal(true)}
                            >
                                리뷰 작성
                            </button>
                            {reviewData.length > 0 ? (
                                reviewData.map((review, idx) => (
                                    <div key={idx} className="review-item">
                                        {review.photoUrl?.map((url, i) => (
                                            <img
                                                key={i}
                                                src={url}
                                                alt={`review-${i}`}
                                                className="review-photo"
                                            />
                                        ))}
                                        <p>{review.text}</p>
                                    </div>
                                ))
                            ) : (
                                <p>아직 작성된 리뷰가 없습니다.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 리뷰 모달 */}
            {showModal && (
                <ReviewModal
                    partnershipId={partnershipId} // ✅ props로 전달
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
}

export default OceanWorld;
