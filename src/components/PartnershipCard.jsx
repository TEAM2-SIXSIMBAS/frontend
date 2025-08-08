import "./PartnershipCard.css";

export default function PartnershipCard({ item }) {
  return (
    <div className="partnership-card">
      <div className="partnership-card-image">
        <img src={item.img} alt={item.title} />
      </div>
      <div className="partnership-card-content">
        <div className="partnership-card-title">{item.title}</div>
        <div className="partnership-card-merchant">{item.merchant}</div>
        <div className="partnership-card-tags">
          {item.tags.map((t) => (
            <span key={t} className="partnership-tag">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}