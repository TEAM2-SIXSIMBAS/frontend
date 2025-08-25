import React from "react";
import { Link } from "react-router-dom";
import "./PartnershipCard.css";

export default function PartnershipCard({ item, to, onClick, state }) {
  if (!item) return null;

  const { id, title, merchant, img, category } = item;

  const organization = Array.isArray(item.tags) ? item.tags[0] : undefined; // blue
  const serviceType  = Array.isArray(item.tags) ? item.tags[1] : undefined; // yellow

  const tags = [
    { label: organization, tone: "blue" },
    { label: category,     tone: "green" },
    { label: serviceType,  tone: "yellow" },
  ].filter(t => typeof t.label === "string" && t.label.trim() !== "");

  const href = to ?? (id != null ? `/info/${id}` : undefined);

  const stateToPass = state ?? { storeName: merchant, benefit: title };

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
      state={stateToPass}
    >
      {Inner}
    </Link>
  ) : (
    <article
      className="partnership-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={title ? `${title} 상세 보기` : "상세 보기"}
    >
      {Inner}
    </article>
  );
}