import React from "react";
import { Link } from "react-router-dom";
import "./PartnershipCard.css";

/**
 * 기대 props.item (App.jsx의 toCard() 결과)
 * {
 *   id: number,
 *   title: string,        // dto.content
 *   merchant: string,     // dto.storeName
 *   img: string,          // dto.url
 *   category: string,     // dto.category
 *   tags: [organization?, type?], // 순서 보장: [기관, 서비스]
 *   hot: boolean
 * }
 */

export default function PartnershipCard({ item, to, onClick }) {
  if (!item) return null;

  const { id, title, merchant, img, category } = item;

  // App.jsx의 toCard()가 tags = [organization, type] 으로 넣어줌
  const organization = Array.isArray(item.tags) ? item.tags[0] : undefined; // blue
  const serviceType  = Array.isArray(item.tags) ? item.tags[1] : undefined; // yellow

  // 태그는 "기관 / 업종 / 서비스" 순서로 교체 렌더링
  const tags = [
    { label: organization, tone: "blue" },   // 기관
    { label: category,     tone: "green" },  // 업종
    { label: serviceType,  tone: "yellow" }, // 서비스
  ].filter(t => typeof t.label === "string" && t.label.trim() !== "");

  // 라우팅: App.jsx에서 to를 넘겨주므로 우선 사용
  const href = to ?? (id != null ? `/benefits/${id}` : undefined);

  const Inner = (
    <>
      <div className="card-image-wrapper">
        <img
          src={img}
          alt={title || "benefit image"}
          className="card-image"
          loading="lazy"
          draggable={false}
          onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
        />
      </div>

      <div className="card-info">
        <p className="card-benefit">{title}</p>

        <div className="card-bottom">
          <span className="card-name">{merchant}</span>

          <div className="card-tags">
            {tags.map((t, i) => (
              <span key={`${t.label}-${i}`} className={`card-tag ${t.tone}`}>
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  return href ? (
    <Link
      to={href}
      className="partnership-card"
      onClick={onClick}
      aria-label={title ? `${title} 상세 보기` : "상세 보기"}
      state={{ item }}
    >
      {Inner}
    </Link>
  ) : (
    <article className="partnership-card" onClick={onClick} role="button" tabIndex={0}>
      {Inner}
    </article>
  );
}