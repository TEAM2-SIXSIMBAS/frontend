import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TopBanner from '../../components/TopBanner';
import '../../styles/ShopInfo/ff.css';

/** 서버 기본값 */
const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://3.134.97.96:8080';

/** 화면 옵션 */
const CATEGORIES = ['전체', '음식', '카페', '생활', '문화'];
const SORTS = [
  { key: 'nameAsc', label: '가게명 오름차순' },
  { key: 'nameDesc', label: '가게명 내림차순' },
  { key: 'parkingDesc', label: '주차 가능 우선' },
];

/** 폴백 목업 (isFav는 더는 사용 안 함) */
const MOCK_SHOPS = [
  { id: 1,  name: '문과관카페',  category: '카페',  phone: '02-123-4567', email: 'cafe@uni.kr',  address: '가대 문과관 1층', hours: '09:00~19:00', parking: false },
  { id: 2,  name: '홍대이탈리안',  category: '음식',  phone: '02-223-1234', email: 'italy@food.kr', address: '역곡로 12', hours: '11:00~22:00', parking: true },
  { id: 3,  name: '성심당',      category: '생활', phone: '02-331-0000', email: 'bakery@shop.kr', address: '신관 앞', hours: '08:00~20:00', parking: false },
  { id: 4,  name: '연남디저트',    category: '카페',  phone: '02-991-1199', email: 'dessert@cake.kr', address: '정문 골목', hours: '10:00~21:00', parking: false },
  { id: 5,  name: '미술관',      category: '문화', phone: '02-555-2222', email: 'art@museum.kr', address: '후문 맞은편', hours: '10:00~18:00', parking: true },
  { id: 6,  name: '상도카페',     category: '카페',  phone: '02-444-7777', email: 'sangdo@cafe.kr', address: '상도동 45', hours: '09:30~20:30', parking: false },
  { id: 7,  name: '정문분식',     category: '음식',  phone: '02-888-9999', email: 'bunsik@shop.kr', address: '정문앞', hours: '10:30~21:00', parking: false },
  { id: 8,  name: '교내문구',     category: '생활', phone: '02-321-2221', email: 'stationery@uni.kr', address: '학생회관 1층', hours: '09:00~18:00', parking: false },
  { id: 9,  name: '영화관',      category: '문화', phone: '02-100-2000', email: 'cinema@film.kr', address: '역곡역 3번출구', hours: '12:00~24:00', parking: true },
  { id: 10, name: '충무로카페',    category: '카페',  phone: '02-712-8888', email: 'chung@cafe.kr', address: '충무로 12', hours: '08:30~19:30', parking: false },
];

/** 응답 → 공통 스키마로 정규화 (즐겨찾기 제거) */
function normalizeStore(d, i = 0) {
  const id = d.id ?? d._id ?? d.storeId ?? d.partnerId ?? i + 1;
  const name = d.name ?? d.storeName ?? d.partnerName ?? d.title ?? '매장';
  const category = d.category ?? d.categoryName ?? d.type ?? d.tags?.[0] ?? '기타';
  const phone = d.phone ?? d.tel ?? d.phoneNumber ?? '';
  const email = d.email ?? d.contactEmail ?? '';
  const address = d.address ?? d.addr ?? d.location ?? '';
  const hours = d.hours ?? d.openingHours ?? d.businessHours ?? '';
  const parking = Boolean(
    d.parking ?? d.hasParking ?? (typeof d.parkingYn === 'string' ? d.parkingYn === 'Y' : false)
  );
  return { id, name, category, phone, email, address, hours, parking };
}

/** 목록 API 유틸 */
async function fetchStores({ category, sort, q, page, size, signal }) {
  const candidates = [
    '/api/v1/stores',
    '/stores',
    '/api/v1/partnerships',
    '/partnerships',
    '/partnership-map',
  ];

  const qs = new URLSearchParams({
    category: category === '전체' ? '' : category,
    sort,
    q: q ?? '',
    page: String(page ?? 1),
    size: String(size ?? 10),

    // 대체 키들(백엔드 케이스 다양성 대응)
    keyword: q ?? '',
    pageIndex: String(page ?? 1),
    pageSize: String(size ?? 10),
    order: sort,
  });

  for (const path of candidates) {
    try {
      const res = await fetch(`${API_BASE.replace(/\/$/, '')}${path}?${qs}`, {
        signal,
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const items =
        json.items ??
        json.data ??
        json.content ??
        json.results ??
        (Array.isArray(json) ? json : []);

      if (!Array.isArray(items)) continue;

      const list = items.map((d, i) => normalizeStore(d, i));
      const total = json.total ?? json.totalElements ?? json.count ?? list.length;
      return { list, total };
    } catch (e) {
      // 사용자가 필터/검색/페이지를 바꾸면 이전 요청은 Abort됩니다 → 그대로 상위로 전달
      if (e?.name === 'AbortError' || String(e?.message).includes('aborted')) {
        throw e;
      }
      // 그 외엔 다음 후보 경로 시도
    }
  }
  throw new Error('No matching endpoint');
}

/** 카드 (즐겨찾기 버튼 삭제) */
function ShopInfoCard({ shop }) {
  return (
    <article className="shop-card" role="article" aria-labelledby={`shop-${shop.id}-title`}>
      <div className="shop-card__head">
        <h3 id={`shop-${shop.id}-title`} className="shop-card__title">
          {shop.name}
        </h3>
      </div>
      <div className="shop-card__body">
        <dl className="shop-meta">
          <dt>전화번호</dt><dd>{shop.phone || '-'}</dd>
          <dt>이메일</dt><dd>{shop.email || '-'}</dd>
          <dt>주소</dt><dd>{shop.address || '-'}</dd>
          <dt>운영시간</dt><dd>{shop.hours || '-'}</dd>
          <dt>주차여부</dt><dd>{shop.parking ? '가능' : '불가'}</dd>
        </dl>
      </div>
    </article>
  );
}

export default function ShopInfo() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  const changeTab = (tab) => {
    const t = String(tab);
    if (t.includes('제휴') && t.includes('정보')) return navigate('/');
    if (t.includes('지도')) return navigate('/map');
    return navigate('/partners');
  };

  // URL 초기값
  const [category, setCategory] = useState(sp.get('category') || '전체');
  const [sort, setSort] = useState(sp.get('sort') || 'nameAsc');
  const [keyword, setKeyword] = useState(sp.get('q') || '');
  const [page, setPage] = useState(Number(sp.get('page') || 1));

  // 데이터 상태
  const [data, setData] = useState(MOCK_SHOPS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(MOCK_SHOPS.length);

  const PAGE_SIZE = 6;

  const syncQuery = (next = {}) => {
    const params = new URLSearchParams(sp);
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') params.delete(k);
      else params.set(k, String(v));
    });
    setSp(params, { replace: true });
  };

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { list, total } = await fetchStores({
          category,
          sort,
          q: keyword.trim(),
          page,
          size: PAGE_SIZE,
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setData(list);
          setTotal(total);
        }
      } catch (e) {
        // 요청 취소는 정상 동작이므로 에러로 보여주지 않음
        if (e?.name === 'AbortError' || String(e?.message).includes('aborted')) {
          return;
        }
        setError('서버 데이터를 불러오지 못해 임시 데이터로 표시합니다.');
        setData(MOCK_SHOPS);
        setTotal(MOCK_SHOPS.length);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sort, keyword, page]);

  // 클라이언트 보정 정렬/필터 (즐겨찾기 제거됨)
  const filtered = useMemo(() => {
    let list = data;
    if (category !== '전체') list = list.filter((s) => s.category === category);
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(kw) ||
          s.address.toLowerCase().includes(kw) ||
          (s.category || '').toLowerCase().includes(kw)
      );
    }
    switch (sort) {
      case 'nameDesc':
        list = [...list].sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'parkingDesc':
        list = [...list].sort((a, b) => Number(b.parking) - Number(a.parking));
        break;
      case 'nameAsc':
      default:
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return list;
  }, [data, category, sort, keyword]);

  const pageCount = Math.max(1, Math.ceil((total || filtered.length) / PAGE_SIZE));
  const current = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const changePage = (p) => {
    if (p < 1 || p > pageCount) return;
    setPage(p);
    syncQuery({ page: p });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app__container">
      <TopBanner activeTab={'제휴사 정보'} onChange={changeTab} />
      <main className="section shop">
        <div className="section__head shop__head">
          <h2 className="section__title shop__title">가게 정보</h2>

          <div className="controls">
            <input
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
                syncQuery({ q: e.target.value, page: 1 });
              }}
              placeholder="가게/주소/카테고리 검색"
              aria-label="검색어"
              className="control__search"
            />
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
                syncQuery({ category: e.target.value, page: 1 });
              }}
              aria-label="카테고리"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
                syncQuery({ sort: e.target.value, page: 1 });
              }}
              aria-label="정렬 기준"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && <p className="hint">불러오는 중…</p>}
        {!!error && <p className="hint hint--warn">{error}</p>}

        <div className="shop-grid">
          {current.map((shop) => (
            <ShopInfoCard key={shop.id} shop={shop} />
          ))}
          {!loading && current.length === 0 && (
            <p className="hint">조건에 맞는 가게가 없습니다.</p>
          )}
        </div>

        <nav className="pagination" aria-label="페이지네이션">
          <button className="pagination__btn" onClick={() => changePage(page - 1)} disabled={page === 1}>
            이전
          </button>
          {Array.from({ length: Math.max(1, pageCount) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`pagination__num ${p === page ? 'is-active' : ''}`}
              onClick={() => changePage(p)}
            >
              {p}
            </button>
          ))}
          <button className="pagination__btn" onClick={() => changePage(page + 1)} disabled={page === pageCount}>
            다음
          </button>
        </nav>
      </main>
    </div>
  );
}
