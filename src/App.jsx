import { useMemo, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import TopBanner from "./components/TopBanner";
import PartnershipCard from "./components/PartnershipCard";
import OceanWorld from "./pages/InfoDetail/OceanWorld";
import InfoMap from "./pages/InfoMap/c";
import ShopInfo from "./pages/ShopInfo/f";
import "./App.css";


// 임시 썸네일: 서버가 imageUrl 주면 toCard에서 교체할 예정
const random_img = (id) => `https://picsum.photos/400/300?random=${id}`;

const CATEGORIES = ["전체", "음식", "카페", "생활", "문화"];
const SORTS = [
  { key: "idAsc",        label: "등록순" },
  { key: "popular",      label: "조회수 높은 순" },
  { key: "discountDesc", label: "할인율 높은 순" },
  { key: "discountAsc",  label: "할인율 낮은 순" },
  { key: "deadlineAsc",  label: "기한 빠른 순" },
  { key: "deadlineDesc", label: "기한 느린 순" },
];

/* =========================================================
   MOCK (백엔드 응답 형태와 동일: PartnershipInfoDto[])
   ========================================================= */
const MOCK_DTO_TOP3 = [
  { id: 101, content: "전 메뉴 25% 할인", storeName: "연남카페", organization: "총학",   category: "카페", type: "추천" },
  { id: 102, content: "세트 구매 시 1+1", storeName: "성심당",   organization: "총동연", category: "생활", type: "이벤트" },
  { id: 103, content: "학생증 제시 20%↓", storeName: "상도식당", organization: "컴공",   category: "음식", type: "신규" },
];

const MOCK_DTO_LIST = [
  { id: 1,  content: "아메리카노 사이즈업",       storeName: "문과관카페",  organization: "총학",   category: "카페", type: "혜택" },
  { id: 2,  content: "파스타 2개 주문 시 1개 무료", storeName: "홍대이탈리안", organization: "총동연", category: "음식", type: "이벤트" },
  { id: 3,  content: "빵 3개 20% 할인",           storeName: "성심당",      organization: "총학",   category: "생활", type: "혜택" },
  { id: 4,  content: "티라미수 세일",             storeName: "연남디저트",  organization: "컴공",   category: "카페", type: "신규" },
  { id: 5,  content: "전시 입장권 학생 30%",       storeName: "미술관",      organization: "총동연", category: "문화", type: "혜택" },
  { id: 6,  content: "커피 2+1",                  storeName: "상도카페",    organization: "총학",   category: "카페", type: "이벤트" },
  { id: 7,  content: "도시락 15% 할인",           storeName: "정문분식",    organization: "총학",   category: "음식", type: "혜택" },
  { id: 8,  content: "문구 10% 상시",             storeName: "교내문구",    organization: "총동연", category: "생활", type: "혜택" },
  { id: 9,  content: "극장 예매권 25%",           storeName: "영화관",      organization: "컴공",   category: "문화", type: "혜택" },
  { id: 10, content: "디카페인 무료 변경",         storeName: "충무로카페",  organization: "총학",   category: "카페", type: "혜택" },
  { id: 11, content: "치킨 세트 10%↓",            storeName: "역곡치킨",    organization: "총동연", category: "음식", type: "혜택" },
  { id: 12, content: "빨래방 1,000원 할인",        storeName: "셀프빨래",    organization: "총학",   category: "생활", type: "혜택" },
  { id: 13, content: "전시 도슨트 무료",           storeName: "갤러리",      organization: "컴공",   category: "문화", type: "이벤트" },
  { id: 14, content: "샌드위치 콤보 18%↓",         storeName: "성의관샌드",  organization: "총동연", category: "음식", type: "혜택" },
  { id: 15, content: "디저트 1+1",                 storeName: "연희베이커리",organization: "총학",   category: "카페", type: "이벤트" },
];

/* =========================================================
   DTO -> 카드 props 매핑 (서버/모크 공용)
   - TODO(API): imageUrl 등 실제 필드명 들어오면 교체
   ========================================================= */
const toCard = (dto) => {
  const id = dto.id;
  const pad2 = (n) => String(n).padStart(2, "0");
  const deadline = new Date(2025, 7, 10 + (id % 25)); // 2025-08-??
  const discountTable = [8,10,12,14,16,18,20,22,25,28];

  return {
    id,
    title: dto.content,
    merchant: dto.storeName,
    tags: [dto.organization, dto.type].filter(Boolean),
    category: dto.category,

    // TODO(API): 서버가 imageUrl 제공되면 아래 한 줄로 교체
    // img: dto.imageUrl,
    img: random_img(id),

    // 아래 3개는 데모용 합성값 (정렬 데모를 위해서만 사용)
    views: 200 + ((id * 37) % 1200),
    discount: discountTable[id % discountTable.length],
    deadline: `${deadline.getFullYear()}-${pad2(deadline.getMonth() + 1)}-${pad2(deadline.getDate())}`,

    hot: false,
  };
};

function HomePage() {
  const [activeTab, setActiveTab] = useState("제휴 정보");
  const [category, setCategory] = useState("전체");
  const [sort, setSort] = useState("idAsc");
  const [page, setPage] = useState(1);

  // 한 페이지에 "나머지 9개"만 (Top3는 항상 고정 3개)
  const LIST_PAGE_SIZE = 9;

  const byId = (a, b) => a.id - b.id;

  // ===== 현재는 MOCK으로 렌더 =====
  const top3 = useMemo(
    () => MOCK_DTO_TOP3.map(toCard).map((c) => ({ ...c, hot: true })),
    []
  );
  const allList = useMemo(() => MOCK_DTO_LIST.map(toCard).sort(byId), []);
  const filtered = useMemo(() => {
    let list = category === "전체" ? allList : allList.filter(m => m.category === category);
    switch (sort) {
      case "discountDesc": return [...list].sort((a,b)=> b.discount - a.discount);
      case "discountAsc":  return [...list].sort((a,b)=> a.discount - b.discount);
      case "deadlineAsc":  return [...list].sort((a,b)=> new Date(a.deadline) - new Date(b.deadline));
      case "deadlineDesc": return [...list].sort((a,b)=> new Date(b.deadline) - new Date(a.deadline));
      case "popular":      return [...list].sort((a,b)=> b.views - a.views);
      case "idAsc":
      default:             return [...list].sort(byId);
    }
  }, [category, sort, allList]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / LIST_PAGE_SIZE));
  const current = useMemo(
    () => filtered.slice((page - 1) * LIST_PAGE_SIZE, page * LIST_PAGE_SIZE),
    [filtered, page]
  );

  /* =========================================================
     [API 연동 준비] — 주석 해제하면 즉시 서버 모드로 동작
     필요 전제:
       1) 백엔드: GET /partnership-info?category=..&sort=..&page=..
       2) 프록시 또는 VITE_API_BASE 설정
          - 프록시(vite.config.js): server.proxy['/partnership-info'] = { target:'http://localhost:8080', changeOrigin:true }
          - 또는 .env: VITE_API_BASE=http://localhost:8080
  ========================================================= */
  /*
  const API_BASE = import.meta.env.VITE_API_BASE ?? ""; // 없으면 상대경로
  const [top3, setTop3]   = useState([]);
  const [allList, setAll] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    const q = new URLSearchParams();
    if (category && category !== "전체") q.set("category", category);
    if (sort) q.set("sort", sort);

    fetch(`${API_BASE}/partnership-info?${q.toString()}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setTop3((json.top3 ?? []).map(toCard).map(c => ({ ...c, hot: true })));
        setAll((json.sort ?? []).map(toCard).sort(byId));   // 전체 결과가 온다고 가정
        setPage(1); // 필터/정렬 바뀔 때 1페이지로
      })
      .catch((e) => {
        console.error("[API] partnership-info error:", e);
        setTop3([]); setAll([]);
      });

    return () => controller.abort();
  }, [category, sort]);
  */

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
          {/* Top3: 3개 고정 */}
          <section className="section section--hot">
            <div className="section__head">
              <h2 className="section__title">지금 핫한 혜택 Top 3</h2>
            </div>
            <div className="grid grid--3">
              {top3.map(item => (
                <PartnershipCard key={item.id} item={item} to={`/OceanWorld`} />
                // <PartnershipCard key={item.id} item={item} to={`/info/${item.id}`} />
              ))}
            </div>
          </section>

          {/* 나머지 목록: 9개씩 페이징 (Top3와 합쳐 화면엔 총 12개) */}
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
                <PartnershipCard key={item.id} item={item} to={`/OceanWorld`} />
                // <PartnershipCard key={item.id} item={item} to={`/info/${item.id}`} />
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
        {/* <Route path="/info/:id" element={<InfoDetail />} /> */}
        <Route path="/OceanWorld" element={<OceanWorld />} />
        <Route path="/map" element={<InfoMap />} />
        <Route path="/partners" element={<ShopInfo />} />
      </Routes>
    </BrowserRouter>
  );
}

// !!!!!!! 서버 연결 !!!!!!!
// 1. 파일 중간의 [API 연동 준비] 블록 전체 주석 해제
// 2. (둘 중 하나 선택)
//    a) .env에 VITE_API_BASE=http://localhost:8080 추가, 또는
//    b) vite.config.js에 프록시 설정:
//       server: {
//       proxy: { '/partnership-info': {
//                  target: 'http://localhost:8080',
//                  changeOrigin: true }
//              }
//       }
// 3. 필요하면 toCard()에서
//    a)img: dto.imageUrl 로 교체
//    b) views/discount/deadline도 서버 필드로 교체