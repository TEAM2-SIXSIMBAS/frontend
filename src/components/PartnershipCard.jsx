import React from "react";
import "./PartnershipCard.css";

export default function PartnershipCard(props) {
  const item = props.item ?? {
    img: props.imageUrl,
    title: props.benefit,
    merchant: props.name,
    tags: props.tags,
  };

  const { img, title, merchant } = item;
  const tags = Array.isArray(item.tags) ? item.tags : [];

  const toneFor = (label) => {
    if (/가맹|기본|blue/i.test(label)) return "blue";
    if (/추천|신규|green/i.test(label)) return "green";
    if (/혜택|한도|이벤트|yellow/i.test(label)) return "yellow";
    return "blue";
  };

  return (
    <article className="partnership-card" onClick={props.onClick}>
      <div className="card-image-wrapper">
        <img
          src={img}
          alt={title || "benefit image"}
          className="card-image"
          loading="lazy"
          draggable={false}
        />
      </div>

      <div className="card-info">
        <p className="card-benefit">{title}</p>

        <div className="card-bottom">
          <span className="card-name">{merchant}</span>

          <div className="card-tags">
            {tags.map((label, i) => (
              <span key={`${label}-${i}`} className={`card-tag ${toneFor(label)}`}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}