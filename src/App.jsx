import { useMemo, useState } from "react";
import TopBanner from "./components/TopBanner";
import PartnershipCard from "./components/PartnershipCard";
import "./App.css";

const ALL_ITEMS = Array.from({ length: 27 }).map((_, i) => ({
  id: i + 1,
  title: "혜택내요오오오오오오오오오오오오옹",
  merchant: "상호명",
  category: ["식당", "카페", "편의점", "뷰티", "생활"][i % 5],
  tags: ["가입", "현장", "서비스"].slice(0, (i % 3) + 1),
  img: `https://picsum.photos/seed/benefit-${i}/640/400`,
}));

export default function App() {
  const [activeTab, setActiveTab] = useState("제휴 정보");

  // 필터/정렬/페이지 위치
  const [category, setCategory] = useState("전체");
  const [sort, setSort] = useState("정렬");
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 9;
  const categories = ["전체", ...new Set(ALL_ITEMS.map((d) => d.category))];

  // 필터 + 정렬
  const filtered = useMemo(() => {
    let arr = [...ALL_ITEMS];
    if (category !== "전체") arr = arr.filter((d) => d.category === category);
    if (sort === "가나다순") arr.sort((a, b) => a.title.localeCompare(b.title, "ko"));
    if (sort === "신규순") arr.sort((a, b) => b.id - a.id);
    return arr;
  }, [category, sort]);

  // 페이지 계산
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const startIdx = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  // Top 3 (배너 아래 섹션에 표시)
  const top3 = ALL_ITEMS.slice(0, 3);

  return (
    <div className="app">
      {/* 상단 제목 + 탭 */}
      <TopBanner activeTab={activeTab} onChange={setActiveTab} />

      {/* 탭별 컨텐츠 */}
      {activeTab === "제휴 정보" && (
        <main>
          {/* 지금 핫한 혜택 Top 3 */}
          <section className="panel">
            <h2 className="panel-title">지금 핫한 혜택 Top 3</h2>
            <div className="card-grid">
              {top3.map((item) => (
                <PartnershipCard key={item.id} item={item} />
              ))}
            </div>
          </section>

          {/* 제휴 정보 리스트 */}
          <section className="list-section">
            <h3 className="section-title">제휴 정보</h3>

            {/* 필터/정렬 */}
            <div className="filters">
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "전체" ? "카테고리" : c}
                  </option>
                ))}
              </select>

              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
              >
                <option value="정렬">정렬</option>
                <option value="신규순">신규순</option>
                <option value="가나다순">가나다순</option>
              </select>
            </div>

            {/* 카드 그리드 */}
            <div className="card-grid">
              {pageItems.map((item) => (
                <PartnershipCard key={item.id} item={item} />
              ))}
            </div>

            {/* 페이지네이션 */}
            <div className="pagination">
              {Array.from({ length: totalPages }).map((_, i) => {
                const n = i + 1;
                return (
                  <button
                    key={n}
                    className={page === n ? "active" : ""}
                    onClick={() => setPage(n)}
                    aria-current={page === n ? "page" : undefined}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </section>
        </main>
      )}

      {activeTab === "제휴 지도" && (
        <main className="placeholder">
          <p>여기에 지도 컴포넌트를 붙일 예정입니다.</p>
        </main>
      )}

      {activeTab === "제휴사 정보" && (
        <main className="placeholder">
          <p>여기에 제휴사 정보 화면이 들어갑니다.</p>
        </main>
      )}
    </div>
  );
}