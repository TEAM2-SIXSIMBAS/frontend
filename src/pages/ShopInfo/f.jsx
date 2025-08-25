// src/pages/ShopInfo/f.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TopBanner from '../../components/TopBanner';
import '../../styles/ShopInfo/ff.css';

/** 서버 기본값 */
const API_BASE = (import.meta.env.VITE_API_BASE ?? 'http://13.125.159.81:8080').replace(/\/$/, '');

/** 엔드포인트 후보 (v2 우선, 기본 폴백) */
const buildCandidates = (path) => [
  `${API_BASE}/v2${path}`,
  `${API_BASE}${path}`,
];

/** 폴백 목업(최종 폴백) */
const MOCK_SHOPS = [
  { id: 1,  name: '문과관카페',  phone: '02-123-4567', email: 'cafe@uni.kr',  address: '가대 문과관 1층', hours: '09:00~19:00', parking: false },
  { id: 2,  name: '홍대이탈리안',  phone: '02-223-1234', email: 'italy@food.kr', address: '역곡로 12', hours: '11:00~22:00', parking: true  },
  { id: 3,  name: '성심당',      phone: '02-331-0000', email: 'bakery@shop.kr', address: '신관 앞', hours: '08:00~20:00', parking: false },
  { id: 4,  name: '연남디저트',    phone: '02-991-1199', email: 'dessert@cake.kr', address: '정문 골목', hours: '10:00~21:00', parking: false },
  { id: 5,  name: '미술관',      phone: '02-555-2222', email: 'art@museum.kr', address: '후문 맞은편', hours: '10:00~18:00', parking: true  },
  { id: 6,  name: '상도카페',     phone: '02-444-7777', email: 'sangdo@cafe.kr', address: '상도동 45', hours: '09:30~20:30', parking: false },
  { id: 7,  name: '정문분식',     phone: '02-888-9999', email: 'bunsik@shop.kr', address: '정문앞', hours: '10:30~21:00', parking: false },
  { id: 8,  name: '교내문구',     phone: '02-321-2221', email: 'stationery@uni.kr', address: '학생회관 1층', hours: '09:00~18:00', parking: false },
  { id: 9,  name: '영화관',      phone: '02-100-2000', email: 'cinema@film.kr', address: '역곡역 3번출구', hours: '12:00~24:00', parking: true  },
  { id: 10, name: '충무로카페',    phone: '02-712-8888', email: 'chung@cafe.kr', address: '충무로 12', hours: '08:30~19:30', parking: false },
];

/** 상세 스펙 정규화 (백엔드: { storeName, number, email, address, openTime, closeTime }) */
function normalizeDetail(d, i = 0) {
  return {
    id: d.storeId ?? d.id ?? i + 1,
    name: d.storeName ?? '매장',
    phone: d.number ? String(d.number) : '',
    email: d.email ?? '',
    address: d.address ?? '',
    hours: d.openTime && d.closeTime ? `${d.openTime} ~ ${d.closeTime}` : '',
    parking: false, // 스펙에 없음
  };
}

/** 상세 호출 */
async function fetchStoreDetail(storeId, signal) {
  const url = `${API_BASE}/store-info/${storeId}`;
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`상세 실패(${res.status}) /store-info/${storeId}`);
  const json = await res.json();
  return normalizeDetail(json);
}

/** 목록 호출(있으면 사용), 없으면 상세 다건 폴백 */
async function fetchStores({ page, size, signal, idsParam }) {
  // 1) 목록 엔드포인트가 있다면 사용
  const qs = new URLSearchParams({ page: String(page), size: String(size) });
  const candidates = buildCandidates(`/store-info?${qs}`);

  for (const url of candidates) {
    try {
      const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
      if (!res.ok) continue;
      const json = await res.json();
      const raw = Array.isArray(json) ? json : (json.list ?? json.items ?? json.data ?? []);
      if (!Array.isArray(raw)) continue;
      const list = raw.map((d, i) => normalizeDetail(d, i));
      const total = json.total ?? json.totalElements ?? json.pageAmount ?? list.length;
      return { list, total };
    } catch (e) {
      if (e && e.name === 'AbortError') throw e;
    }
  }

  // 2) 상세 기반 폴백
  const ids = (idsParam ? idsParam.split(',').map(s => s.trim()).filter(Boolean) : [])
    .map(x => (Number.isNaN(Number(x)) ? x : Number(x)));
  const fallbackIds = ids.length ? ids : Array.from({ length: 10 }, (_, i) => i + 1);

  const start = (page - 1) * size;
  const end = page * size;
  const pageIds = fallbackIds.slice(start, end);

  const results = await Promise.allSettled(pageIds.map((id) => fetchStoreDetail(id, signal)));
  const list = results
    .filter(r => r.status === 'fulfilled')
    .map((r, i) => r.value ?? normalizeDetail({}, i));

  const total = ids.length ? ids.length : 10;
  return { list, total };
}

/** 카드 */
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

  // URL 상태: 페이지 & (옵션) ids
  const [page, setPage] = useState(Number(sp.get('page') || 1));
  const idsParam = sp.get('ids'); // 예: /partners?ids=1,2,3

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
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { list, total } = await fetchStores({
          page,
          size: PAGE_SIZE,
          signal: controller.signal,
          idsParam,
        });
        if (!controller.signal.aborted) {
          setData(list);
          setTotal(total);
        }
      } catch (e) {
        if (e && e.name === 'AbortError') return;
        setError('서버 데이터를 불러오지 못해 임시 데이터로 표시합니다.');
        setData(MOCK_SHOPS);
        setTotal(MOCK_SHOPS.length);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, idsParam]);

  // 현재 페이지 데이터만 렌더 (목록 API가 전체 반환했을 때도 안정적으로 나눔)
  const pageCount = Math.max(1, Math.ceil((total || data.length) / PAGE_SIZE));
  const current = useMemo(
    () => data.slice(0, PAGE_SIZE), // fetchStores가 페이지 단위로 잘라오므로 여기선 첫 PAGE_SIZE만
    [data]
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
        </div>

        {loading && <p className="hint">불러오는 중…</p>}
        {!!error && <p className="hint hint--warn">{error}</p>}

        <div className="shop-grid">
          {current.map((shop) => (
            <ShopInfoCard key={shop.id} shop={shop} />
          ))}
          {!loading && current.length === 0 && (
            <p className="hint">표시할 가게가 없습니다.</p>
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