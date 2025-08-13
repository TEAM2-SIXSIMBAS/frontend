import "./TopBanner.css";

const TABS = ["제휴 정보", "제휴 지도", "제휴사 정보"];

export default function TopBanner({ activeTab = "제휴 정보", onChange }) {
  return (
    <header className="top-banner">
      <div className="top-banner-inner">
        <h1 className="top-banner-title">가대제휴</h1>

        <nav className="top-banner-tabs" aria-label="페이지 탭">
          {TABS.map((tab) => {
            const selected = tab === activeTab;
            return (
              <button
                key={tab}
                type="button"
                className={`top-banner-tab ${selected ? "is-active" : ""}`}
                onClick={() => onChange && onChange(tab)}
              >
                {tab}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}