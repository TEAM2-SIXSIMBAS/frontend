import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useParams } from "react-router-dom"; // URL에서 storeId 뽑을 때 사용 (선택)
import "./ReviewModal.css";

export default function ReviewModal({ onClose, storeId }) {
  const modalRef = useRef(null);
  const firstFocusableRef = useRef(null);

  // 이미지 상태
  const [receipt, setReceipt] = useState(null);              // { file, url }
  const [reviews, setReviews] = useState([null, null, null]); // [{file,url}|null, ...]

  // 텍스트/전송 상태
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // input refs (수정 버튼에서 직접 열기용)
  const receiptInputRef = useRef(null);
  const reviewInputRefs = useRef([]);

  // URL에서 storeId를 가져오는 경우 (prop 우선)
  const params = useParams();
  const effectiveStoreId = storeId ?? params?.storeId;

  // 바디 스크롤 잠금 + 초기 포커스 + ESC/Tab 처리
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstFocusableRef.current?.focus();

    const handleKey = (e) => {
      if (e.key === "Escape") onClose();

      if (e.key === "Tab") {
        const focusables = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKey);

      // Object URL 정리
      if (receipt?.url) URL.revokeObjectURL(receipt.url);
      reviews.forEach((r) => r?.url && URL.revokeObjectURL(r.url));
    };
  }, [onClose, receipt, reviews]);

  // ---------- 업로드 핸들러 ----------
  const handleReceiptChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setReceipt((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return { file, url };
    });
  };

  const removeReceipt = () => {
    setReceipt((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
    if (receiptInputRef.current) receiptInputRef.current.value = "";
  };

  const handleReviewChange = (idx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setReviews((prev) => {
      const next = [...prev];
      if (next[idx]?.url) URL.revokeObjectURL(next[idx].url);
      next[idx] = { file, url };
      return next;
    });
  };

  const removeReview = (idx) => {
    setReviews((prev) => {
      const next = [...prev];
      if (next[idx]?.url) URL.revokeObjectURL(next[idx].url);
      next[idx] = null;
      return next;
    });
    const input = reviewInputRefs.current[idx];
    if (input) input.value = "";
  };
  // -----------------------------------

  // ---------- 제출 핸들러 ----------
  const handleSubmit = async () => {
    if (!effectiveStoreId) {
      alert("storeId를 확인해 주세요.");
      return;
    }
    if (!content.trim()) {
      alert("리뷰 내용을 입력해 주세요.");
      return;
    }

    try {
      setSubmitting(true);

      const fd = new FormData();
      fd.append("content", content);

      if (receipt?.file) {
        fd.append("receipt", receipt.file, receipt.file.name);
      }

      // 서버가 photos[]를 요구하면 PHOTO_KEY를 "photos[]"로 변경
      const PHOTO_KEY = "photos";
      reviews.filter(Boolean).forEach((r) => {
        fd.append(PHOTO_KEY, r.file, r.file.name);
      });

      const res = await fetch(
        `/partnership-info/detail/${encodeURIComponent(effectiveStoreId)}/review/post`,
        {
          method: "POST",
          body: fd,
          // Content-Type은 넣지 말 것! (브라우저가 boundary 포함해 자동 설정)
          // headers: {},
          credentials: "include", // 세션/쿠키 인증 쓰면 유지
        }
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      // const data = await res.json().catch(() => null); // 필요 시 파싱
      alert("리뷰가 등록되었습니다.");
      onClose();
    } catch (err) {
      console.error(err);
      alert("리뷰 등록 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };
  // -----------------------------------

  const modal = (
    <div
      className="review-modal__overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="review-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reviewModalTitle"
        aria-describedby="reviewModalDesc"
        ref={modalRef}
      >
        <button className="review-modal__close" aria-label="닫기" onClick={onClose}>×</button>

        <h2 id="reviewModalTitle" className="review-modal__title">리뷰 작성</h2>

        <p id="reviewModalDesc" className="sr-only">
          영수증 사진 1장(비공개), 리뷰 사진 최대 3장, 그리고 리뷰 내용을 입력하는 모달입니다.
        </p>

        <h3 className="review-modal__section-title">
          1. 영수증 사진 등록 (다른 사람에게 공개되지 않습니다.)
        </h3>

        <div className="upload-row">
          <div className={`upload-box ${receipt ? "has-image" : ""}`}>
            <input
              ref={(el) => {
                receiptInputRef.current = el;
                if (firstFocusableRef.current == null) firstFocusableRef.current = el;
              }}
              type="file"
              accept="image/*"
              className="upload-input"
              aria-label="영수증 사진 업로드"
              onChange={handleReceiptChange}
            />
            {receipt ? (
              <>
                <img src={receipt.url} alt="영수증 미리보기" className="upload-preview" />
                <div className="upload-actions">
                  <button
                    type="button"
                    className="upload-action"
                    onClick={(e) => {
                      e.preventDefault(); e.stopPropagation();
                      receiptInputRef.current.value = "";
                      receiptInputRef.current.click();
                    }}
                    aria-label="영수증 사진 수정"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    className="upload-action upload-action--danger"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeReceipt(); }}
                    aria-label="영수증 사진 삭제"
                  >
                    삭제
                  </button>
                </div>
              </>
            ) : (
              <span className="upload-icon" aria-hidden>🖼️</span>
            )}
          </div>
        </div>

        <h3 className="review-modal__section-title">2. 리뷰 사진 등록 (선택사항, 최대 3개)</h3>
        <div className="upload-row">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`upload-box ${reviews[i] ? "has-image" : ""}`}>
              <input
                ref={(el) => (reviewInputRefs.current[i] = el)}
                type="file"
                accept="image/*"
                className="upload-input"
                aria-label={`리뷰 사진 ${i + 1} 업로드`}
                onChange={(e) => handleReviewChange(i, e)}
              />
              {reviews[i] ? (
                <>
                  <img
                    src={reviews[i].url}
                    alt={`리뷰 사진 ${i + 1} 미리보기`}
                    className="upload-preview"
                  />
                  <div className="upload-actions">
                    <button
                      type="button"
                      className="upload-action"
                      onClick={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        reviewInputRefs.current[i].value = "";
                        reviewInputRefs.current[i].click();
                      }}
                      aria-label={`리뷰 사진 ${i + 1} 수정`}
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className="upload-action upload-action--danger"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeReview(i); }}
                      aria-label={`리뷰 사진 ${i + 1} 삭제`}
                    >
                      삭제
                    </button>
                  </div>
                </>
              ) : (
                <span className="upload-icon" aria-hidden>🖼️</span>
              )}
            </div>
          ))}
        </div>

        <h3 className="review-modal__section-title">3. 리뷰 내용 작성</h3>
        <textarea
          className="review-textarea"
          placeholder="리뷰 내용을 입력해 주세요!"
          maxLength={1000}
          rows={7}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <div className="review-modal__footer">
          <button className="btn-brand" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "전송 중…" : "리뷰 작성"}
          </button>
        </div>
      </section>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}