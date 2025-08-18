import "./TopBanner.css";
import { useNavigate } from "react-router-dom";

const TABS = ["제휴 정보", "제휴 지도", "제휴사 정보"];
const TAB_ROUTES = {
  "제휴 정보": "/",
  "제휴 지도": "/map",
  "제휴사 정보": "/partners",
};

export default function TopBanner({ activeTab = "제휴 정보", onChange }) {
  const navigate = useNavigate();

  const handleClick = (tab) => {
    onChange && onChange(tab);
    const to = TAB_ROUTES[tab];
    if (to) navigate(to);
  };

  return (
    <header className="top-banner">
      <div className="top-banner-inner">
        <h1
          className="top-banner-title"
          onClick={() => handleClick("제휴 정보")}
          style={{ cursor: "pointer" }}
        >
          가대제휴
        </h1>

        <nav className="top-banner-tabs" aria-label="페이지 탭">
          {TABS.map((tab) => {
            const selected = tab === activeTab;
            return (
              <button
                key={tab}
                type="button"
                className={`top-banner-tab ${selected ? "is-active" : ""}`}
                onClick={() => handleClick(tab)}
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