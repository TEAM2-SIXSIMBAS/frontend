import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import TopBanner from "./components/TopBanner";
import PartnershipCard from "./components/PartnershipCard";
import OceanWorld from "./pages/InfoDetail/OceanWorld";
import InfoMap from "./pages/InfoMap/c";
import ShopInfo from "./pages/ShopInfo/f";
import "./App.css";

/* =========================================================
   카테고리·정렬 파라미터 규약 (프론트 → 백엔드)
   - 프론트는 아래 값을 그대로 전송 (백엔드가 내부코드로 변환)
   - 단, "전체"는 서버 요구에 따라 category= (빈값) 전송
   - category: "전체"→""(빈값), "음식"→FOOD, "카페"→CAFE, "생활"→LIFE, "문화"→CULTURE
   - sort:
       idAsc        → CREATED_DESC   // 등록순 = created_at DESC(최근 등록 우선)
       popular      → POPULAR_DESC
       discountDesc → DISCOUNT_DESC
       discountAsc  → DISCOUNT_ASC
       deadlineAsc  → DEADLINE_ASC
       deadlineDesc → DEADLINE_DESC
   ========================================================= */

// fallback용 임시 썸네일 (DTO에 imageUrl 없을 때만 사용)
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
   DTO -> 카드 props 매핑
   - 서버 DTO: { id?, content, storeName, organization, category, type, imageUrl? }
   ========================================================= */
const toCard = (dto, idx = 0, offset = 0) => {
  const id = dto.id ?? offset + idx + 1;
  return {
    id,
    title: dto.content ?? "",
    merchant: dto.storeName ?? "",
    tags: [dto.organization, dto.type].filter(Boolean),
    category: dto.category ?? "",
    // 서버 DTO의 이미지 URL 사용 // 넘어오는 변수명에 맞추어 수정
    img: dto.url,
    hot: false,
  };
};

// "전체"는 빈 문자열로 전송
const encodeCategoryParam = (c) => (c === "전체" ? "" : c);

function HomePage() {
  const [activeTab, setActiveTab] = useState("제휴 정보");
  const [category, setCategory] = useState("전체"); // UI 상태: "전체" 유지
  const [sort, setSort] = useState("idAsc");        // 그대로 전송
  const [page, setPage] = useState(1);              // 1 기반
  const [pageCount, setPageCount] = useState(1);

  const [top3, setTop3]   = useState([]);
  const [allList, setAll] = useState([]);

  const API_BASE = import.meta.env.VITE_API_BASE ?? ""; // 없으면 상대경로
  console.log("[INIT] API_BASE =", API_BASE);

  // ===== MOCK 모드 토글 =====
  const USE_MOCK = false; // ← Mock 쓰려면 true로 변경

  // 서버 호출: category/sort/page 전송 (서버가 내부 코드로 변환/정렬/필터/페이징)
  useEffect(() => {
    if (USE_MOCK) return;

    const controller = new AbortController();
    const q = new URLSearchParams();
    q.set("category", encodeCategoryParam(category)); // "전체" → ""
    q.set("sort", sort);                              // "idAsc" | "popular" | ...
    q.set("page", String(page));                      // 1 기반

    const url = `${API_BASE}/partnership-info?${q.toString()}`;
    fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (res) => {
        const raw = await res.clone().text().catch(() => "");
        const time = new Date().toLocaleTimeString();

        const isAll = category === "전체";
        if (isAll) {
          console.groupCollapsed(`[ALL][${time}] ${res.status} ${url}`);
          console.log("[ALL] raw(첫 300자) =", raw.slice(0, 300));
        }

        if (!res.ok) {
          if (isAll) console.groupEnd();
          throw new Error(`HTTP ${res.status}`);
        }

        let json = {};
        try {
          json = raw ? JSON.parse(raw) : {};
        } catch (e) {
          if (isAll) {
            console.error("[ALL] JSON parse error:", e);
            console.log("[ALL] raw(문자열) =", raw.slice(0, 300));
            console.groupEnd();
          }
          throw e;
        }

        // 서버 스키마 고정: { top3: PartnershipInfoDto[], sort: PartnershipInfoDto[], pageAmount: number }
        const listRaw = Array.isArray(json.sort) ? json.sort : [];
        const pageAmount = Math.max(1, Number(json.pageAmount) || 1);

        if (isAll) {
          console.log("[ALL] keys =", Object.keys(json));
          console.log("[ALL] lengths =", {
            top3: Array.isArray(json.top3) ? json.top3.length : "n/a",
            list: listRaw.length,
          });
          console.log("[ALL] pageAmount =", pageAmount);
          const pick = (x) => ({
            content: x?.content,
            storeName: x?.storeName,
            category: x?.category,
            type: x?.type,
            imageUrl: x?.imageUrl,
          });
          console.table(listRaw.slice(0, 5).map(pick));
          console.groupEnd();
        }

        // Top3 매핑
        const mappedTop3 = Array.isArray(json.top3)
          ? json.top3.map((d, i) => ({ ...toCard(d, i, 1000), hot: true }))
          : [];

        // 서버 페이징 결과를 그대로 사용
        const mappedList = listRaw.map((d, i) => toCard(d, i, 0));

        // 상태 반영
        setTop3(mappedTop3);
        setAll(mappedList);
        setPageCount(pageAmount);

        // 현재 page가 범위를 넘으면 1페이지로 보정
        if (page > pageAmount) {
          setPage(1);
        }
      })
      .catch((e) => {
        if (e.name !== "AbortError") console.error("[API] fetch failed:", e);
        setTop3([]);
        setAll([]);
        setPageCount(1);
      });

    return () => controller.abort();
  }, [category, sort, page, API_BASE, USE_MOCK]);

  // 페이지 변경: page만 변경 (카테고리/정렬은 유지)
  const changePage = (p) => {
    previewRequest(category, sort, p);
    if (p < 1 || p > pageCount) return;
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 프리뷰 로그 (서버 1 기반)
  const previewRequest = (cat, srt, uiPage) => {
    const oneBased = uiPage;
    const catParam = encodeCategoryParam(cat);
    const url = `${API_BASE}/partnership-info?category=${encodeURIComponent(catParam)}&sort=${encodeURIComponent(srt)}&page=${oneBased}`;

    console.groupCollapsed("[PREVIEW] next request");
    console.table([{
      category_ui: cat,
      category_param: catParam === "" ? "(빈 문자열)" : catParam,
      sort: srt,
      pageUI: uiPage,
      page_if_one_based: oneBased,
    }]);
    console.log("url (1-based 가정):", url);
    console.groupEnd();
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
              {top3.map((item, i) => (
                <PartnershipCard key={`top-${item.id}-${i}`} item={item} to={`/OceanWorld`} />
              ))}
            </div>
          </section>

          {/* 나머지 목록: 서버 페이징(현재 페이지 항목 그대로 렌더) */}
          <section className="section section--list">
            <div className="section__head section__head--controls">
              <h3 className="section__title">제휴 정보</h3>

              <div className="controls">
                <select
                  value={category}
                  onChange={(e) => {
                    const nextCategory = e.target.value;
                    const nextPage = 1; // 규칙: 카테고리 변경 시 page=1
                    previewRequest(nextCategory, sort, nextPage);
                    setCategory(nextCategory);
                    setPage(nextPage);
                  }}
                  aria-label="카테고리"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select
                  value={sort}
                  onChange={(e) => {
                    const nextSort = e.target.value;
                    const nextPage = 1; // 규칙: 정렬 변경 시 page=1
                    previewRequest(category, nextSort, nextPage);
                    setSort(nextSort);
                    setPage(nextPage);
                  }}
                  aria-label="정렬"
                >
                  {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid--3">
              {allList.map((item, i) => (
                <PartnershipCard key={`list-${item.id}-${i}`} item={item} to={`/OceanWorld`} />
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