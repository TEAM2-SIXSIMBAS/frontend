import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import TopBanner from '../../components/TopBanner';
import '../../styles/ShopInfo/ff.css';

const API_BASE = (import.meta.env.VITE_API_BASE ?? 'http://13.125.159.81:8080').replace(/\/$/, '');

/** 응답 정규화 */
function normalizeStore(d) {
  return {
    id: d.storeId,
    name: d.storeName,
    phone: d.phoneNumber ? String(d.phoneNumber) : '',
    email: d.email ?? '',
    address: d.address ?? '',
    hours: d.startTime && d.endTime ? `${d.startTime} ~ ${d.endTime}` : '',
    parking: d.parkingAvailable === '가능',
  };
}

/** API 호출 */
async function fetchStores({ storeId, page, signal }) {
  const url = `${API_BASE}/store-info/${storeId}?page=${page}`;
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`불러오기 실패 (${res.status})`);
  const json = await res.json();

  const list = (json.storeList ?? []).map(normalizeStore);
  const pageAmount = json.pageAmount ?? 1;
  return { list, pageAmount };
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
          <dt>주차여부</dt><dd>{shop.parking ? '가능' : '불가능'}</dd>
        </dl>
      </div>
    </article>
  );
}

export default function ShopInfo() {
  const navigate = useNavigate();
  const { storeId } = useParams();
  const [sp, setSp] = useSearchParams();

  const [page, setPage] = useState(Number(sp.get('page') || 1));
  const [data, setData] = useState([]);
  const [pageAmount, setPageAmount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const syncQuery = (next = {}) => {
    const params = new URLSearchParams(sp);
    Object.entries(next).forEach(([k, v]) => {
      if (!v) params.delete(k);
      else params.set(k, String(v));
    });
    setSp(params, { replace: true });
  };

  useEffect(() => {
    if (!storeId) return;
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { list, pageAmount } = await fetchStores({
          storeId,
          page,
          signal: controller.signal,
        });
        setData(list);
        setPageAmount(pageAmount);
      } catch (e) {
        if (e.name === 'AbortError') return;
        setError(String(e.message || '불러오기 실패'));
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [storeId, page]);

  const changePage = (p) => {
    if (p < 1 || p > pageAmount) return;
    setPage(p);
    syncQuery({ page: p });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app__container">
      <TopBanner activeTab={'제휴사 정보'} onChange={() => navigate('/partners')} />
      <main className="section shop">
        <div className="section__head shop__head">
          <h2 className="section__title shop__title">가게 정보</h2>
        </div>

        {loading && <p className="hint">불러오는 중…</p>}
        {!!error && <p className="hint hint--warn">{error}</p>}

        <div className="shop-grid">
          {data.map((shop) => (
            <ShopInfoCard key={shop.id} shop={shop} />
          ))}
          {!loading && data.length === 0 && (
            <p className="hint">가게 정보가 없습니다.</p>
          )}
        </div>

        <nav className="pagination" aria-label="페이지네이션">
          <button onClick={() => changePage(page - 1)} disabled={page === 1}>
            이전
          </button>
          {Array.from({ length: pageAmount }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`pagination__num ${p === page ? 'is-active' : ''}`}
              onClick={() => changePage(p)}
            >
              {p}
            </button>
          ))}
          <button onClick={() => changePage(page + 1)} disabled={page === pageAmount}>
            다음
          </button>
        </nav>
      </main>
    </div>
  );
}