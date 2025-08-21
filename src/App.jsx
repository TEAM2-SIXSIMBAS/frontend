import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import TopBanner from "./components/TopBanner";
import PartnershipCard from "./components/PartnershipCard";
import OceanWorld from "./pages/InfoDetail/OceanWorld";
import InfoMap from "./pages/InfoMap/c";
import ShopInfo from "./pages/ShopInfo/f";
import "./App.css";

/* =========================================================
   파라미터 규약 (프론트 → 백엔드)
   - "전체"는 빈 문자열("") 전송 (=필터 미적용)
   - 최종 요청:
     /partnership-info?organization=a,b,c&category=x,y&type=m,n&sort={정렬}&page={페이지}
   ========================================================= */

// fallback용 임시 썸네일 (DTO에 imageUrl 없을 때만 사용)
const random_img = (id) => `https://picsum.photos/400/300?random=${id}`;

// ▼ 드롭다운 옵션
const ORGANIZATIONS = ["전체", "총학", "총동", "단과대", "학과", "기타"];
const CATEGORIES    = ["전체", "음식", "카페", "생활", "문화"];
const TYPES         = ["전체", "할인", "서비스"];

const SORTS = [
  { key: "idAsc", label: "등록순" },
  { key: "popular", label: "조회수 높은 순" },
  { key: "discountDesc", label: "할인율 높은 순" },
  { key: "discountAsc", label: "할인율 낮은 순" },
  { key: "deadlineAsc", label: "기한 빠른 순" },
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
    img: dto.partnershipImageUrl || random_img(id),
    hot: false,
  };
};

// "전체" → 빈 문자열, 배열 선택값은 콤마로 합치기
const encodeMultiParam = (arr) => {
  if (!arr || arr.length === 0 || arr.includes("전체")) return "";
  return arr.join(",");
};

const isAllSelected = (arr) => !arr || arr.length === 0 || arr.includes("전체");

/* =========================================================
   커스텀 멀티셀렉트 (정렬 드롭다운처럼 보이는 UI)
   - props:
     options: string[]
     value: string[]          // ["전체"] 또는 ["음식","카페"] 등
     onChange(next: string[]) // 제어 컴포넌트
     label: string            // 버튼 placeholder (예: "기관")
   - 특징:
     • "전체" 선택 시 나머지 해제
     • 모두 해제되면 자동으로 ["전체"]
     • 버튼 라벨: "전체" 또는 "N개 선택"
     • 키보드: Enter/Space 열기/체크, Esc 닫기, Tab 포커스 이동
   ========================================================= */
function MultiSelect({ options, value, onChange, label, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const displayText = isAllSelected(value)
    ? "전체"
    : `${value.length}개 선택`;

  const toggleOpen = () => setOpen((v) => !v);
  const close = () => setOpen(false);

  // 외부 클릭 닫기
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (!menuRef.current && !btnRef.current) return;
      if (
        menuRef.current?.contains(e.target) ||
        btnRef.current?.contains(e.target)
      ) return;
      setOpen(false);
    };
    const onEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const handleToggle = (opt) => {
    if (opt === "전체") {
      onChange(["전체"]);
      return;
    }
    let next = Array.isArray(value) ? [...value] : [];
    // 전체가 포함돼 있으면 제거
    next = next.filter((v) => v !== "전체");
    if (next.includes(opt)) {
      next = next.filter((v) => v !== opt);
    } else {
      next.push(opt);
    }
    if (next.length === 0) next = ["전체"];
    onChange(next);
  };

  return (
    <div className="ms">
      <button
        ref={btnRef}
        type="button"
        className="ms__button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel || label}
        onClick={toggleOpen}
      >
        <span className="ms__button-label">{label}</span>
        <span className="ms__button-value">{displayText}</span>
        <span className="ms__chevron" aria-hidden>▾</span>
      </button>

      {open && (
        <div
          ref={menuRef}
          className="ms__menu"
          role="listbox"
          aria-multiselectable="true"
        >
          {options.map((opt) => {
            const checked =
              opt === "전체"
                ? isAllSelected(value)
                : Array.isArray(value) && value.includes(opt);
            return (
              <label key={opt} className="ms__option" role="option" aria-selected={checked}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleToggle(opt)}
                />
                <span>{opt}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SingleSelect({ options, value, onChange, label, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const current = options.find((o) => o.key === value);
  const displayText = current ? current.label : "";

  const toggleOpen = () => setOpen((v) => !v);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (menuRef.current?.contains(e.target)) return;
      if (btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onEsc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const pick = (k) => { onChange(k); setOpen(false); };

  return (
    <div className="ms">
      <button
        ref={btnRef}
        type="button"
        className="ms__button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel || label}
        onClick={toggleOpen}
      >
        <span className="ms__button-label">{label}</span>
        <span className="ms__button-value">{displayText}</span>
        <span className="ms__chevron" aria-hidden>▾</span>
      </button>

      {open && (
        <div
          ref={menuRef}
          className="ms__menu"
          role="listbox"
          aria-multiselectable="false"
        >
          {options.map((opt) => {
            const checked = opt.key === value;
            return (
              <label key={opt.key} className="ms__option" role="option" aria-selected={checked}>
                <input
                  type="radio"
                  name={`single-${label}`}
                  checked={checked}
                  onChange={() => pick(opt.key)}
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HomePage() {
  const [activeTab, setActiveTab] = useState("제휴 정보");

  // 🔹 멀티셀렉트 상태
  const [organizations, setOrganizations] = useState(["전체"]); // ORGANIZATION(기관)
  const [categories, setCategories] = useState(["전체"]); // CATEGORY(업종)
  const [types, setTypes] = useState(["전체"]); // TYPE(혜택)

  const [sort, setSort] = useState("idAsc");
  const [page, setPage] = useState(1); // 1 기반
  const [pageCount, setPageCount] = useState(1);

  const [top3, setTop3] = useState([]);
  const [allList, setAll] = useState([]);

  const API_BASE = import.meta.env.VITE_API_BASE ?? "";
  const USE_MOCK = false;

  // 서버 호출
  useEffect(() => {
    if (USE_MOCK) return;

    const controller = new AbortController();
    const q = new URLSearchParams();
    q.set("organization", encodeMultiParam(organizations));
    q.set("category",     encodeMultiParam(categories));
    q.set("type",         encodeMultiParam(types));
    q.set("sort",         sort);
    q.set("page",         String(page));

    const url = `${API_BASE}/partnership-info?${q.toString()}`;

    const allAll =
      isAllSelected(organizations) &&
      isAllSelected(categories) &&
      isAllSelected(types);
    const time = new Date().toLocaleTimeString();
    if (allAll) {
      console.groupCollapsed(`[ALL][${time}] ${url}`);
    }

    fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (res) => {
        const raw = await res.clone().text().catch(() => "");

        if (!res.ok) {
          if (allAll) console.groupEnd();
          throw new Error(`HTTP ${res.status}`);
        }

        let json = {};
        try {
          json = raw ? JSON.parse(raw) : {};
        } catch (e) {
          if (allAll) {
            console.error("[ALL] JSON parse error:", e);
            console.log("[ALL] raw(문자열) =", raw.slice(0, 300));
            console.groupEnd();
          }
          throw e;
        }

        // 서버 스키마: { top3: [], sort: [], pageAmount: number }
        const listRaw    = Array.isArray(json.sort) ? json.sort : [];
        const pageAmount = Math.max(1, Number(json.pageAmount) || 1);

        if (allAll) {
          console.log("[ALL] keys =", Object.keys(json));
          console.log("[ALL] lengths =", {
            top3: Array.isArray(json.top3) ? json.top3.length : "n/a",
            list: listRaw.length,
          });
          console.log("[ALL] pageAmount =", pageAmount);
          const pick = (x) => ({
            content: x?.content,
            storeName: x?.storeName,
            organization: x?.organization,
            category: x?.category,
            type: x?.type,
            partnershipImageUrl: x?.partnershipImageUrl,
          });
          console.table(listRaw.slice(0, 5).map(pick));
          console.groupEnd();
        }

        const mappedTop3 = Array.isArray(json.top3)
          ? json.top3.map((d, i) => ({ ...toCard(d, i, 1000), hot: true }))
          : [];
        const mappedList = listRaw.map((d, i) => toCard(d, i, 0));

        setTop3(mappedTop3);
        setAll(mappedList);
        setPageCount(pageAmount);

        if (page > pageAmount) setPage(1);
      })
      .catch((e) => {
        if (e.name !== "AbortError") console.error("[API] fetch failed:", e);
        setTop3([]);
        setAll([]);
        setPageCount(1);
      });

    return () => controller.abort();
  }, [organizations, categories, types, sort, page, API_BASE, USE_MOCK]);

  // 페이지 변경: page만 변경 (필터/정렬은 유지)
  const changePage = (p) => {
    if (p < 1 || p > pageCount) return;
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 필터 변경 시 page=1
  const resetToFirstPage = () => setPage(1);

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
                <PartnershipCard
                  key={`top-${item.id}-${i}`}
                  item={item}
                  to={`/info/${item.id}`}
                />
              ))}
            </div>
          </section>

          {/* 나머지 목록 */}
          <section className="section section--list">
            <div className="section__head section__head--controls">
              <h3 className="section__title">제휴 정보</h3>

              <div className="controls controls--flex">
                {/* 🔹 기관 */}
                <MultiSelect
                  options={ORGANIZATIONS}
                  value={organizations}
                  onChange={(next) => { setOrganizations(next); resetToFirstPage(); }}
                  label="기관"
                  ariaLabel="기관 필터"
                />

                {/* 🔹 업종 */}
                <MultiSelect
                  options={CATEGORIES}
                  value={categories}
                  onChange={(next) => { setCategories(next); resetToFirstPage(); }}
                  label="업종"
                  ariaLabel="업종 필터"
                />

                {/* 🔹 혜택 */}
                <MultiSelect
                  options={TYPES}
                  value={types}
                  onChange={(next) => { setTypes(next); resetToFirstPage(); }}
                  label="혜택"
                  ariaLabel="혜택 필터"
                />

                {/* 정렬 (단일 네이티브 셀렉트 유지) */}
                <SingleSelect
                    options={SORTS}
                    value={sort}
                    onChange={(next) => { setSort(next); setPage(1); }}
                    label="정렬"
                    ariaLabel="정렬 기준"
                />
              </div>
            </div>

            <div className="grid grid--3">
              {allList.map((item, i) => (
                <PartnershipCard
                  key={`list-${item.id}-${i}`}
                  item={item}
                  to={`/info/${item.id}`}
                />
              ))}
            </div>

            <nav className="pagination" aria-label="페이지네이션">
              <button
                className="pagination__btn"
                onClick={() => changePage(page - 1)}
                disabled={page === 1}
              >
                이전
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`pagination__num ${p === page ? "is-active" : ""}`}
                  onClick={() => changePage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="pagination__btn"
                onClick={() => changePage(page + 1)}
                disabled={page === pageCount}
              >
                다음
              </button>
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
                <Route path="/info/:partnershipId" element={<OceanWorld />} />
                <Route path="/map" element={<InfoMap />} />
                <Route path="/partners" element={<ShopInfo />} />
            </Routes>
        </BrowserRouter>
    );
}