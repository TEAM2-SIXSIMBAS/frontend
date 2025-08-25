import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../../styles/InfoDetail/OceanWorld.css";
import TopBanner from "../../components/TopBanner";
import ReviewModal from "../ReviewWrite/ReviewModal";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

// 서버에서 내려주는 "/files/..." 경로를 절대경로로 바꿔주는 함수
function toAbsUrl(path) {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const slash = path.startsWith("/") ? "" : "/";
    return `${API_BASE}${slash}${path}`;
}

function OceanWorld() {
    const { partnershipId } = useParams();
    const [activeTab, setActiveTab] = useState("info");
    const [showModal, setShowModal] = useState(false);

    // --- 연동용 상태 ---
    const [infoData, setInfoData] = useState(null);
    const [reviewData, setReviewData] = useState({ partnershipImageUrl: "", summary: "", items: [] });
    const [loadingReview, setLoadingReview] = useState(false);
    const [reviewError, setReviewError] = useState("");

    // 페이지네이션 상태
    const [reviewPage, setReviewPage] = useState(1);
    const REVIEWS_PER_PAGE = 7; // 한 페이지에 표시할 리뷰 개수

    useEffect(() => {
        if (!partnershipId) return;

        fetch(`${API_BASE}/partnership-info/detail/${partnershipId}/inform`)
            .then((res) => res.json())
            .then((data) => setInfoData(data))
            .catch(() => console.error("정보 불러오기 실패"));

        setLoadingReview(true);
        setReviewError("");
        fetch(`${API_BASE}/partnership-info/detail/${partnershipId}/review`)
            .then((res) => res.json())
            .then((data) => {
                const items = Array.isArray(data.items)
                    ? data.items.map((it) => ({
                          text: it?.text ?? "",
                          photoUrl: Array.isArray(it?.photoUrl) ? it.photoUrl : [],
                      }))
                    : [];
                setReviewData({
                    partnershipImageUrl: data.partnershipImageUrl || "",
                    summary: data.summary || "",
                    items,
                });
                setReviewPage(1); // 새 데이터 오면 첫 페이지로 초기화
            })
            .catch(() => {
                console.error("리뷰 불러오기 실패");
                setReviewError("리뷰 정보를 불러오지 못했습니다.");
            })
            .finally(() => setLoadingReview(false));
    }, [partnershipId]);

    const mainImgSrc = toAbsUrl(reviewData.partnershipImageUrl) || "/oceanworld.png";

    // 페이지네이션 계산
    const totalReviews = reviewData.items?.length || 0;
    const totalReviewPages = Math.max(1, Math.ceil(totalReviews / REVIEWS_PER_PAGE));
    const pagedReviews = reviewData.items.slice(
        (reviewPage - 1) * REVIEWS_PER_PAGE,
        reviewPage * REVIEWS_PER_PAGE
    );

    return (
        <div className="oceanworld-container">
            {/* 상단 네비바 */}
            <TopBanner activeTab={activeTab} onChange={setActiveTab} />

            {/* 메인 카드 */}
            <div className="detail-card">
                <h2 className="store-name">{infoData?.name || "제휴 매장"}</h2>

                {/* 이미지 영역 */}
                <div className="image-wrapper">
                    <img src={mainImgSrc} alt={infoData?.name || "제휴 이미지"} className="main-image" />
                </div>

                {/* 탭 버튼 */}
                <div className="tab-buttons">
                    <button
                        className={`tab-btn ${activeTab === "info" ? "active" : ""}`}
                        onClick={() => setActiveTab("info")}
                    >
                        정보
                    </button>
                    <button
                        className={`tab-btn ${activeTab === "review" ? "active" : ""}`}
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
                                        <strong>판매 기간:</strong> {infoData.saleStartDate} ~ {infoData.saleEndDate}
                                    </p>
                                    <p>
                                        <strong>사용 기간:</strong> {infoData.useStartDate} ~ {infoData.useEndDate}
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
                            {/* AI 요약 */}
                            <div className="review-summary-block">
                                <div className="review-summary-head">
                                    <span className="review-summary-emoji" aria-hidden>🤖</span>
                                    <span className="review-summary-label">AI 요약</span>
                                </div>
                                <div className="review-summary-card">{reviewData.summary || "리뷰 요약이 없습니다."}</div>
                            </div>

                            {/* 리뷰 작성 버튼 */}
                            <button
                                className="review-write-btn"
                                onClick={() => setShowModal(true)}
                            >
                                리뷰 작성
                            </button>

                            {/* 리뷰 리스트 제목 */}
                            <h3 className="review-list-title">리뷰 ({reviewData.items?.length || 0})</h3>

                            {loadingReview ? (
                                <p className="muted">불러오는 중...</p>
                            ) : reviewError ? (
                                <p className="error">{reviewError}</p>
                            ) : pagedReviews && pagedReviews.length > 0 ? (
                                <>
                                    {pagedReviews.map((review, idx) => (
                                        <div key={idx} className="review-item">
                                            {review.photoUrl?.map((url, i) => (
                                                <img
                                                    key={i}
                                                    src={toAbsUrl(url)}
                                                    alt={`review-${i}`}
                                                    className="review-photo"
                                                    loading="lazy"
                                                />
                                            ))}
                                            <p className="review-text">{review.text}</p>
                                        </div>
                                    ))}
                                    {/* 페이지네이션 */}
                                    {totalReviewPages > 1 && (
                                        <div className="review-pagination" role="navigation" aria-label="리뷰 페이지네이션">
                                            <button
                                                type="button"
                                                className="page-btn"
                                                onClick={() => setReviewPage(p => Math.max(1, p - 1))}
                                                disabled={reviewPage === 1}
                                            >
                                                이전
                                            </button>
                                            <span className="page-status">{reviewPage} / {totalReviewPages}</span>
                                            <button
                                                type="button"
                                                className="page-btn"
                                                onClick={() => setReviewPage(p => Math.min(totalReviewPages, p + 1))}
                                                disabled={reviewPage === totalReviewPages}
                                            >
                                                다음
                                            </button>
                                        </div>
                                    )}
                                </>
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
                    partnershipId={partnershipId}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
}

export default OceanWorld;