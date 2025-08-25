import React, { useState, useEffect, useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
import "../../styles/InfoDetail/OceanWorld.css";
import TopBanner from "../../components/TopBanner";
import ReviewModal from "../ReviewWrite/ReviewModal";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

// 상대 경로("/files/...") → 절대 경로
function toAbsUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const slash = path.startsWith("/") ? "" : "/";
  return `${API_BASE}${slash}${path}`;
}

function OceanWorld() {
  const { partnershipId } = useParams();
  const { state } = useLocation(); // 목록에서 넘어온 값 (이미지는 절대 안 받음)
  const passedStoreName = state?.storeName;   // 가게명
  const passedBenefit   = state?.benefit;     // 혜택(카드 title)

  const [activeTab, setActiveTab] = useState("info");
  const [showModal, setShowModal] = useState(false);

  // --- 연동용 상태 ---
  const [infoData, setInfoData] = useState(null);

  const [reviewData, setReviewData] = useState({
    partnershipImageUrl: "",
    summary: "",
    items: [],
  });
  const [loadingReview, setLoadingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // 페이지네이션 상태
  const [reviewPage, setReviewPage] = useState(1);
  const REVIEWS_PER_PAGE = 7;

  useEffect(() => {
    if (!partnershipId) return;

    // 정보
    fetch(`${API_BASE}/partnership-info/detail/${partnershipId}/inform`)
      .then((res) => res.json())
      .then((data) => setInfoData(data))
      .catch(() => console.error("정보 불러오기 실패"));

    // 리뷰
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
          partnershipImageUrl: data?.partnershipImageUrl || "",
          summary: data?.summary || "",
          items,
        });
        setReviewPage(1);
      })
      .catch(() => {
        console.error("리뷰 불러오기 실패");
        setReviewError("리뷰 정보를 불러오지 못했습니다.");
      })
      .finally(() => setLoadingReview(false));
  }, [partnershipId]);

  // 메인 이미지: (API 이미지) → (기본)
  const mainImgSrc =
    useMemo(() => toAbsUrl(reviewData.partnershipImageUrl), [reviewData.partnershipImageUrl]) ||
    "/oceanworld.png";

  // 페이지네이션 계산
  const totalReviews = reviewData.items.length;
  const totalReviewPages = Math.max(1, Math.ceil(totalReviews / REVIEWS_PER_PAGE));
  const pagedReviews = useMemo(() => {
    const start = (reviewPage - 1) * REVIEWS_PER_PAGE;
    return reviewData.items.slice(start, start + REVIEWS_PER_PAGE);
  }, [reviewData.items, reviewPage]);

  return (
    <div className="oceanworld-container">
      {/* 상단 네비바 */}
      <TopBanner activeTab={activeTab} onChange={setActiveTab} />

      {/* 메인 카드 */}
      <div className="detail-card">
        <h2 className="benefit-name">
    {state?.benefit || infoData?.type || "제휴 혜택"}
  </h2>
        <p className="store-name">
    {passedStoreName || infoData?.name || "제휴 매장"}
  </p>

        {/* 이미지 영역 (이미지는 API 값만 사용) */}
        <div className="image-wrapper">
    <img
      src={mainImgSrc}
      alt={passedStoreName || infoData?.name || "제휴 이미지"}
      className="main-image"
    />
  </div>

        {/* 탭 버튼 */}
        <div className="tab-buttons" role="tablist" aria-label="상세 정보 탭">
          <button
            role="tab"
            aria-selected={activeTab === "info"}
            className={`tab-btn ${activeTab === "info" ? "active" : ""}`}
            onClick={() => setActiveTab("info")}
          >
            정보
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "review"}
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
                    <strong>혜택:</strong> {passedBenefit || infoData.type}
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
                  <span className="review-summary-emoji" aria-hidden>
                    🤖
                  </span>
                  <span className="review-summary-label">AI 요약</span>
                </div>
                <div className="review-summary-card">
                  {reviewData.summary || "리뷰 요약이 없습니다."}
                </div>
              </div>

              {/* 리뷰 작성 버튼 */}
              <button className="review-write-btn" onClick={() => setShowModal(true)}>
                리뷰 작성
              </button>

              {/* 리뷰 리스트 제목 */}
              <h3 className="review-list-title">
                {(passedStoreName || infoData?.name || "매장")} 리뷰 ({totalReviews})
              </h3>

              {loadingReview ? (
                <p className="muted">불러오는 중...</p>
              ) : reviewError ? (
                <p className="error">{reviewError}</p>
              ) : pagedReviews.length > 0 ? (
                <>
                  {pagedReviews.map((review, idx) => (
                    <div key={`${idx}-${review.text}`} className="review-item">
                      {/* 리뷰 사진 */}
                      {review.photoUrl?.length > 0 && (
                        <div className="review-photos">
                          {review.photoUrl.map((url, i) => (
                            <img
                              key={`${idx}-${i}`}
                              src={toAbsUrl(url)}
                              alt={`review-${i}`}
                              className="review-photo"
                              loading="lazy"
                            />
                          ))}
                        </div>
                      )}
                      {review.text && <p className="review-text">{review.text}</p>}
                    </div>
                  ))}

                  {/* 페이지네이션 */}
                  {totalReviewPages > 1 && (
                    <div className="review-pagination" role="navigation" aria-label="리뷰 페이지네이션">
                      <button
                        type="button"
                        className="page-btn"
                        onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                        disabled={reviewPage === 1}
                      >
                        이전
                      </button>
                      <span className="page-status">
                        {reviewPage} / {totalReviewPages}
                      </span>
                      <button
                        type="button"
                        className="page-btn"
                        onClick={() => setReviewPage((p) => Math.min(totalReviewPages, p + 1))}
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
        <ReviewModal partnershipId={partnershipId} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

export default OceanWorld;