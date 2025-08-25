// src/pages/ShopInfo/f.jsx  (상세 전용)
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TopBanner from '../../components/TopBanner';
import '../../styles/ShopInfo/ff.css';

/** 서버 기본값 */
const API_BASE = (import.meta.env.VITE_API_BASE ?? 'http://13.125.159.81:8080').replace(/\/$/, '');

/** 응답 → 정확 스키마 정규화 (요구한 키만 사용) */
function normalizeStore(d, fallbackId = 0) {
  return {
    id: d.storeId ?? fallbackId,
    name: d.storeName ?? '매장',
    // NOTE: 스펙이 대문자 Number 로 온다고 명시됨 → 그 키만 신뢰
    phone: d.Number != null ? String(d.Number) : '',
    email: d.email ?? '',
    address: d.address ?? '',
    hours: d.openTime && d.closeTime ? `${d.openTime} ~ ${d.closeTime}` : '',
  };
}

/** 상세 API 호출: GET /store-info/{storeId} */
async function fetchStoreDetail(storeId, signal) {
  const url = `${API_BASE}/store-info/${storeId}`;
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`상세 실패(${res.status}) /store-info/${storeId}`);
  const json = await res.json();
  return normalizeStore(json, storeId);
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
        </dl>
      </div>
    </article>
  );
}

export default function ShopInfo() {
  const navigate = useNavigate();
  const { storeId } = useParams(); // 라우트: /store/:storeId 같은 형태 가정
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const changeTab = (tab) => {
    const t = String(tab);
    if (t.includes('제휴') && t.includes('정보')) return navigate('/');
    if (t.includes('지도')) return navigate('/map');
    return navigate('/partners');
  };

  useEffect(() => {
    if (!storeId) {
      setError('storeId가 필요합니다.');
      return;
    }
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchStoreDetail(storeId, controller.signal);
        if (!controller.signal.aborted) setShop(data);
      } catch (e) {
        if (e && e.name === 'AbortError') return;
        setError(String(e.message || '불러오기 실패'));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [storeId]);

  return (
    <div className="app__container">
      <TopBanner activeTab={'제휴사 정보'} onChange={changeTab} />
      <main className="section shop">
        <div className="section__head shop__head">
          <h2 className="section__title shop__title">가게 정보</h2>
        </div>

        {loading && <p className="hint">불러오는 중…</p>}
        {!!error && <p className="hint hint--warn">{error}</p>}
        {shop && (
          <div className="shop-grid">
            <ShopInfoCard shop={shop} />
          </div>
        )}

        <div style={{ marginTop: '16px' }}>
          <button className="pagination__btn" onClick={() => navigate(-1)}>뒤로</button>
        </div>
      </main>
    </div>
  );
}