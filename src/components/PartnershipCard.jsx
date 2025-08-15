import React from "react";
import { Link } from "react-router-dom";
import "./PartnershipCard.css";

export default function PartnershipCard(props) {
  // props 정리
  const item = props.item ?? {
    img: props.imageUrl,
    title: props.benefit,
    merchant: props.name,
    tags: props.tags,
  };
  const { img, title, merchant } = item;
  const tags = Array.isArray(item.tags) ? item.tags : [];

  // 라우팅용: to가 오면 그대로, 없으면 id로 경로 생성
  const href = props.to ?? (props.id != null ? `/benefits/${props.id}` : undefined);

  const toneFor = (label) => {
    if (/총학|총동연|컴공|공과대|blue/i.test(label)) return "blue";
    if (/식당|카페|의류|의료|green/i.test(label)) return "green";
    if (/할인|서비스|yellow/i.test(label)) return "yellow";
    return "blue";
  };

  // 공통 내부 UI (Link든 article이든 재사용)
  const Inner = (
    <>
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
    </>
  );

  // 1) 링크 가능하면 Link로 감싸 접근성/라우팅 OK
  if (href) {
    return (
      <Link
        to={href}
        className="partnership-card"
        onClick={props.onClick}
        aria-label={title ? `${title} 상세 보기` : "상세 보기"}
        state={{ item }} // 필요하면 상세페이지에서 useLocation().state로 즉시 사용 가능
      >
        {Inner}
      </Link>
    );
  }

  // 2) 링크 경로가 없을 때는 기존 onClick 동작 유지 (임시)
  return (
    <article className="partnership-card" onClick={props.onClick} role="button" tabIndex={0}>
      {Inner}
    </article>
  );
}