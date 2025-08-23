import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../../styles/InfoMap/cc.css';
import TopBanner from '../../components/TopBanner';

const API_BASE = import.meta.env.VITE_API_BASE;
const SCHOOL_CENTER = { lat: 37.4868, lng: 126.8015 }; // 가톨릭대학교(부천)

// ---------- 유틸 ----------
const CATEGORY_COLORS = {
  전체: '#47609F', // 서브컬러
  음식: '#0C2E86', // 메인컬러
  카페: '#788BBC',
  생활: '#F59E0B',
  문화: '#10B981',
};

function svgPin(color = '#47609F') {
  const svg = `<svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg">
      <defs><filter id="s" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.25"/>
      </filter></defs>
      <g filter="url(#s)">
        <path d="M14 38c6.8-10.1 12-14.8 12-22C26 7.8 20.2 2 14 2S2 7.8 2 16c0 7.2 5.2 11.9 12 22z" fill="${color}"/>
        <circle cx="14" cy="16" r="6" fill="#fff"/>
      </g>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// 숫자/날짜 파싱 보조
const toNumber = (v) => (typeof v === 'number' ? v : Number(v));
const toDate = (v) => (v ? new Date(v) : null);

// 공용 정규화(각 엔드포인트 스키마 혼합 대응)
function normalizeItem(d) {
  // 위경도: 숫자 or 문자열 모두 허용
  const latRaw = d.lat ?? d.latitude;
  const lngRaw = d.lng ?? d.longitude;
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  // id 우선순위: storeId > id > _id > 좌표
  const id = d.storeId ?? d.id ?? d._id ?? `${lat},${lng}`;

  return {
    id,
    storeId: d.storeId ?? d.id ?? d._id ?? id,
    name: d.name ?? d.title ?? '매장',
    lat,
    lng,
    address: d.address ?? d.roadAddress ?? d.addr ?? '',
    placeUrl: d.placeUrl ?? d.url ?? '',
    category: d.category ?? d.type ?? '기타',
    discount: d.discount ?? d.benefit ?? d.partnershipBenefit ?? '',
    deadline: d.deadline ?? d.expireAt ?? d.partnershipDeadline ?? '',
    popularity:
      typeof d.popularity === 'number'
        ? d.popularity
        : toNumber(d.viewCount) || undefined,
    rating:
      typeof d.rating === 'number'
        ? d.rating
        : toNumber(d.avgRating) || undefined,
    reviewCount:
      typeof d.reviewCount === 'number'
        ? d.reviewCount
        : toNumber(d.reviews) || undefined,
    // 원본 전체 보관(디버그/확장용)
    _raw: d,
  };
}

// 클라이언트 폴백 정렬
function sortClient(items, key) {
  const arr = [...items];
  const num = (v) => (typeof v === 'number' ? v : Number(v) || 0);
  const getDiscPct = (s) => {
    // "10%" 또는 "₩1000" 형태 모두 대비
    if (!s || typeof s !== 'string') return 0;
    const pct = s.match(/(\d+(?:\.\d+)?)\s*%/);
    if (pct) return Number(pct[1]);
    const won = s.replace(/[^\d.]/g, '');
    return Number(won) / 1000; // 대략치
  };
  const getDeadline = (d) => toDate(d)?.getTime() || Number.MAX_SAFE_INTEGER;

  switch (key) {
    case 'popular':
      return arr.sort((a, b) => num(b.popularity) - num(a.popularity));
    case 'discountDesc':
      return arr.sort(
        (a, b) => getDiscPct(b.discount) - getDiscPct(a.discount)
      );
    case 'discountAsc':
      return arr.sort(
        (a, b) => getDiscPct(a.discount) - getDiscPct(b.discount)
      );
    case 'deadlineAsc':
      return arr.sort(
        (a, b) => getDeadline(a.deadline) - getDeadline(b.deadline)
      );
    case 'deadlineDesc':
      return arr.sort(
        (a, b) => getDeadline(b.deadline) - getDeadline(a.deadline)
      );
    case 'idAsc':
    default:
      return arr.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }
}

// ---------- 메인 컴포넌트 ----------
export default function InfoMap() {
  const [category, setCategory] = useState('전체');
  const [sort, setSort] = useState('idAsc');
  const [keyword, setKeyword] = useState('');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // 지도 refs
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const clustererRef = useRef(null);

  // 지도 초기화
  useEffect(() => {
    let retryId;
    function init() {
      const { kakao } = window;
      if (!kakao || !kakao.maps) {
        retryId = setTimeout(init, 120);
        return;
      }
      const onReady = () => {
        if (!mapEl.current) return;
        const map = new kakao.maps.Map(mapEl.current, {
          center: new kakao.maps.LatLng(SCHOOL_CENTER.lat, SCHOOL_CENTER.lng),
          level: 4,
        });
        mapRef.current = map;
        clustererRef.current = new kakao.maps.MarkerClusterer({
          map,
          averageCenter: true,
          minLevel: 7,
        });
      };
      if (typeof kakao.maps.load === 'function') kakao.maps.load(onReady);
      else onReady();
    }
    init();
    return () => retryId && clearTimeout(retryId);
  }, []);

  // 키워드 디바운스
  const [debouncedQ, setDebouncedQ] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(keyword.trim()), 400);
    return () => clearTimeout(t);
  }, [keyword]);

  // 데이터 로드: 단일 or 분리 스키마 모두 대응
  useEffect(() => {
    if (!API_BASE) {
      setErr('VITE_API_BASE 환경변수가 비었습니다.');
      return;
    }
    const ac = new AbortController();
    (async () => {
      setLoading(true);
      setErr('');
      try {
        // 1) 단일 엔드포인트 우선 시도
        const qs1 = new URLSearchParams();
        if (category && category !== '전체') qs1.set('category', category);
        if (sort) qs1.set('sort', sort);
        if (debouncedQ) qs1.set('q', debouncedQ);
        const url1 = `${API_BASE}/partnership-map${
          qs1.toString() ? `?${qs1}` : ''
        }`;

        const try1 = await fetch(url1, {
          headers: { Accept: 'application/json' },
          signal: ac.signal,
        });
        if (try1.ok) {
          const data = await try1.json();
          const normalized = (Array.isArray(data) ? data : [])
            .map(normalizeItem)
            .filter(Boolean);
          setItems(normalized);
          return;
        }

        // 2) 분리 엔드포인트 폴백(stores/partnerships/reviews)
        const qs2 = new URLSearchParams();
        if (category && category !== '전체') qs2.set('category', category);
        if (debouncedQ) qs2.set('q', debouncedQ);

        const [storesRes, partsRes, reviewsRes] = await Promise.all([
          fetch(`${API_BASE}/stores${qs2.toString() ? `?${qs2}` : ''}`, {
            headers: { Accept: 'application/json' },
            signal: ac.signal,
          }),
          fetch(`${API_BASE}/partnerships${qs2.toString() ? `?${qs2}` : ''}`, {
            headers: { Accept: 'application/json' },
            signal: ac.signal,
          }),
          fetch(
            `${API_BASE}/reviews/summary${qs2.toString() ? `?${qs2}` : ''}`,
            { headers: { Accept: 'application/json' }, signal: ac.signal }
          ).catch(() => null),
        ]);

        if (!storesRes.ok) {
          const tt = await storesRes.text().catch(() => '');
          throw new Error(`/stores 실패: ${storesRes.status} ${tt}`);
        }

        const stores = (await storesRes.json()) ?? [];
        const parts = partsRes?.ok ? await partsRes.json() : [];
        const revs = reviewsRes && reviewsRes.ok ? await reviewsRes.json() : [];

        // 인덱스화
        const partByStore = new Map(
          (Array.isArray(parts) ? parts : []).map((p) => [
            p.storeId ?? p.id ?? p._id,
            p,
          ])
        );
        const reviewByStore = new Map(
          (Array.isArray(revs) ? revs : []).map((r) => [
            r.storeId ?? r.id ?? r._id,
            r,
          ])
        );

        // 병합 -> 정규화
        const merged = (Array.isArray(stores) ? stores : [])
          .map((s) => {
            const p = partByStore.get(s.id ?? s._id) || {};
            const r = reviewByStore.get(s.id ?? s._id) || {};
            return normalizeItem({
              ...s,
              storeId: s.id ?? s._id,
              partnershipBenefit: p.benefit ?? p.discount,
              partnershipDeadline: p.deadline ?? p.expireAt,
              viewCount: s.viewCount ?? p.popularity,
              avgRating: r.avgRating,
              reviews: r.count,
            });
          })
          .filter(Boolean);

        // 정렬 폴백
        setItems(sortClient(merged, sort));
      } catch (e) {
        // 요청이 취소된 경우(AbortError)는 무시
        if (e.name === 'AbortError' || String(e.message).includes('aborted')) {
          return;
        }
        setErr(e.message || '데이터 로드 실패');
        setItems([]);
      } finally {
        if (!ac.signal.aborted) {
          setLoading(false);
        }
      }
    })();
    return () => ac.abort();
  }, [category, sort, debouncedQ]);

  // 마커 렌더링
  useEffect(() => {
    const { kakao } = window;
    const map = mapRef.current;
    const clusterer = clustererRef.current;
    if (!kakao || !map || !clusterer) return;

    clusterer.clear();

    const col = CATEGORY_COLORS[category] || '#47609F';
    const markerImage = new kakao.maps.MarkerImage(
      svgPin(col),
      new kakao.maps.Size(28, 40),
      {
        offset: new kakao.maps.Point(14, 40),
      }
    );

    const markers = items.map((m) => {
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(m.lat, m.lng),
        image: markerImage,
        title: m.name,
      });
      kakao.maps.event.addListener(marker, 'click', () => {
        const html = `
          <div style="padding:8px 10px;max-width:260px;line-height:1.4">
            <strong style="display:block;margin-bottom:4px">${
              m.name ?? '매장'
            }</strong>
            ${m.address ? `<div>${m.address}</div>` : ''}
            ${
              m.discount
                ? `<div style="margin-top:4px">혜택: ${m.discount}</div>`
                : ''
            }
            ${m.deadline ? `<div>기한: ${m.deadline}</div>` : ''}
            ${
              m.rating
                ? `<div>평점: ${m.rating}${
                    m.reviewCount ? ` (${m.reviewCount})` : ''
                  }</div>`
                : ''
            }
            ${
              m.placeUrl
                ? `<div style="margin-top:6px"><a href="${m.placeUrl}" target="_blank" rel="noreferrer">상세보기</a></div>`
                : ''
            }
          </div>`;
        new kakao.maps.InfoWindow({ content: html }).open(map, marker);
      });
      return marker;
    });

    clusterer.addMarkers(markers);

    if (items.length > 0) {
      const bounds = new kakao.maps.LatLngBounds();
      items.forEach((m) => bounds.extend(new kakao.maps.LatLng(m.lat, m.lng)));
      map.setBounds(bounds);
    } else {
      map.setCenter(
        new kakao.maps.LatLng(SCHOOL_CENTER.lat, SCHOOL_CENTER.lng)
      );
      map.setLevel(4);
    }
  }, [items, category]);

  // 결과 요약
  const resultText = useMemo(() => {
    if (loading) return '불러오는 중…';
    if (err) return `오류: ${err}`;
    return `결과 ${items.length}개`;
  }, [loading, err, items.length]);

  return (
    <div className="app">
      <div className="app__container">
        <TopBanner activeTab="제휴 지도" />
        <main>
          <section className="section">
            <h1 className="mappage__title sr-only">가대제휴</h1>
            <p className="mappage__sub">
              가톨릭대학교 주변 제휴 매장을 지도로 확인하세요.
            </p>
          </section>

          <section className="section">
            <div className="section__head section__head--controls">
              <h2 className="section__title">제휴 지도</h2>
              <div className="controls">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  aria-label="카테고리"
                >
                  <option value="전체">전체</option>
                  <option value="음식">음식</option>
                  <option value="카페">카페</option>
                  <option value="생활">생활</option>
                  <option value="문화">문화</option>
                </select>

                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  aria-label="정렬"
                >
                  <option value="idAsc">등록순</option>
                  <option value="popular">조회수 높은 순</option>
                  <option value="discountDesc">할인율 높은 순</option>
                  <option value="discountAsc">할인율 낮은 순</option>
                  <option value="deadlineAsc">기한 빠른 순</option>
                  <option value="deadlineDesc">기한 느린 순</option>
                </select>

                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="키워드(예: 파스타, 치킨)"
                  style={{
                    padding: '8px 10px',
                    border: '1px solid #d0d4da',
                    borderRadius: 8,
                  }}
                />
              </div>
            </div>

            <div className="mapcard">
              <div
                ref={mapEl}
                className="mapcard__inner"
                style={{ height: '420px' }}
              />
            </div>

            <div style={{ marginTop: 10 }}>
              <span
                style={{ color: err ? '#c00' : '#47609F', fontWeight: 700 }}
              >
                {resultText}
              </span>
            </div>

            {!loading && !err && items.length > 0 && (
              <ul style={{ marginTop: 12 }}>
                {items.map((m) => (
                  <li
                    key={m.id}
                    style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}
                  >
                    <strong>{m.name}</strong>{' '}
                    {m.address ? `— ${m.address}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
