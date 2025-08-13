// src/App.jsx
import { useMemo, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import TopBanner from "./components/TopBanner";
import PartnershipCard from "./components/PartnershipCard";
import InfoDetail from "./pages/InfoDetail/a";
import "./App.css";

// 랜덤 이미지 함수
const random_img = (id) => `https://picsum.photos/400/300?random=${id}`;

const MOCK = [
  { id: 1, img: random_img(1),  title: "혜택내요오오오옹", merchant: "삼성점", tags: ["총학", "가을", "한도"], category: "음식", views: 1200, discount: 25, deadline: "2025-08-31", hot: true },
  { id: 2, img: random_img(2),  title: "혜택내요오오오옹", merchant: "송파점", tags: ["총학"], category: "음식", views: 980,  discount: 20, deadline: "2025-08-25", hot: true },
  { id: 3, img: random_img(3),  title: "혜택내요오오오옹", merchant: "연남점", tags: ["총학", "신규"], category: "카페", views: 1510, discount: 10, deadline: "2025-08-22", hot: true },
  { id: 4, img: random_img(4),  title: "혜택내요오오오옹", merchant: "성심당", tags: ["총학"], category: "생활", views: 410,  discount: 12, deadline: "2025-09-10" },
  { id: 5, img: random_img(5),  title: "혜택내요오오오옹", merchant: "문과관", tags: ["총학", "이벤트"], category: "카페", views: 820,  discount: 18, deadline: "2025-09-02" },
  { id: 6, img: random_img(6),  title: "혜택내요오오오옹", merchant: "미술관", tags: ["총동연"], category: "문화", views: 300,  discount: 5,  deadline: "2025-08-25" },
  { id: 7, img: random_img(7),  title: "혜택내요오오오옹", merchant: "정문점", tags: ["총동연"], category: "생활", views: 520,  discount: 14, deadline: "2025-08-29" },
  { id: 8, img: random_img(8),  title: "혜택내요오오오옹", merchant: "상도점", tags: ["컴공", "혜택"], category: "음식", views: 770,  discount: 22, deadline: "2025-08-28" },
  { id: 9, img: random_img(9),  title: "혜택내요오오오옹", merchant: "충무로", tags: ["컴공"], category: "카페", views: 640,  discount: 16, deadline: "2025-09-01" },
  { id:10, img: random_img(10), title: "혜택내요오오오옹", merchant: "홍대점", tags: ["공대"], category: "문화", views: 210,  discount: 8,  deadline: "2025-08-21" },
  { id:11, img: random_img(11), title: "혜택내요오오오옹", merchant: "역곡점", tags: ["공대"], category: "생활", views: 430,  discount: 12, deadline: "2025-08-27" },
  { id:12, img: random_img(12), title: "혜택내요오오오옹", merchant: "성의관", tags: ["공대"], category: "음식", views: 1110, discount: 28, deadline: "2025-09-05" },
];

const CATEGORIES = ["전체", "음식", "카페", "생활", "문화"];
const SORTS = [
  { key: "idAsc",        label: "등록순" },
  { key: "popular",      label: "조회수 높은 순" },
  { key: "discountDesc", label: "할인율 높은 순" },
  { key: "discountAsc",  label: "할인율 낮은 순" },
  { key: "deadlineAsc",  label: "기한 빠른 순" },
  { key: "deadlineDesc", label: "기한 느린 순" },
];

function HomePage() {
  const [activeTab, setActiveTab] = useState("제휴 정보");
  const [category, setCategory] = useState("전체");
  const [sort, setSort] = useState("idAsc");
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 9;

  const byId = (a, b) => a.id - b.id;

  const top3 = useMemo(() => MOCK.filter(m => m.hot).sort(byId).slice(0, 3), []);
  const listBase = useMemo(() => MOCK.filter(m => !m.hot).sort(byId), []);

  const filtered = useMemo(() => {
    let list = category === "전체" ? listBase : listBase.filter(m => m.category === category);

    switch (sort) {
      case "idAsc":
        list = [...list].sort(byId);
        break;
      case "discountDesc":
        list = [...list].sort((a,b)=> b.discount - a.discount);
        break;
      case "discountAsc":
        list = [...list].sort((a,b)=> a.discount - b.discount);
        break;
      case "deadlineAsc":
        list = [...list].sort((a,b)=> new Date(a.deadline) - new Date(b.deadline));
        break;
      case "deadlineDesc":
        list = [...list].sort((a,b)=> new Date(b.deadline) - new Date(a.deadline));
        break;
      case "popular":
        list = [...list].sort((a,b)=> b.views - a.views);
        break;
      default:
        // 기본은 idAsc와 동일하게 유지
        list = [...list].sort(byId);
    }
    return list;
  }, [category, sort, listBase]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const changePage = (p) => {
    if (p < 1 || p > pageCount) return;
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app">
      <div className="app__container">
        <TopBanner activeTab={activeTab} onChange={setActiveTab} />

        <main>
          <section className="section section--hot">
            <div className="section__head">
              <h2 className="section__title">지금 핫한 혜택 Top 3</h2>
            </div>
            <div className="grid grid--3">
              {top3.map(item => (
                <PartnershipCard key={item.id} item={item} to={`/info/${item.id}`} />
              ))}
            </div>
          </section>

          <section className="section section--list">
            <div className="section__head section__head--controls">
              <h3 className="section__title">제휴 정보</h3>

              <div className="controls">
                <select
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                  aria-label="카테고리"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setPage(1); }}
                  aria-label="정렬"
                >
                  {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid--3">
              {current.map(item => (
                <PartnershipCard key={item.id} item={item} to={`/info/${item.id}`} />
              ))}
            </div>

            <nav className="pagination" aria-label="페이지네이션">
              <button className="pagination__btn" onClick={() => changePage(page - 1)} disabled={page === 1}>이전</button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`pagination__num ${p === page ? "is-active" : ""}`}
                  onClick={() => changePage(p)}
                >
                  {p}
                </button>
              ))}
              <button className="pagination__btn" onClick={() => changePage(page + 1)} disabled={page === pageCount}>다음</button>
            </nav>
          </section>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/info/:id" element={<InfoDetail />} />
      </Routes>
    </BrowserRouter>
  );
}