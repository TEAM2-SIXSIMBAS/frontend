import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBanner from '../../components/TopBanner';
import '../../styles/ShopInfo/ff.css';

/** 카테고리/정렬 옵션 (제휴 정보 화면 톤과 동일) */
const CATEGORIES = ['전체', '음식', '카페', '생활', '문화'];
const SORTS = [
  { key: 'nameAsc', label: '가게명 오름차순' },
  { key: 'nameDesc', label: '가게명 내림차순' },
  { key: 'favDesc', label: '즐겨찾기 우선' },
  { key: 'parkingDesc', label: '주차 가능 우선' },
];

/** 데모 데이터 (API 연동 시 동일 필드로 교체) */
const MOCK_SHOPS = [
  {
    id: 1,
    name: '문과관카페',
    category: '카페',
    phone: '02-123-4567',
    email: 'cafe@uni.kr',
    address: '가대 문과관 1층',
    hours: '09:00~19:00',
    parking: false,
    isFav: true,
  },
  {
    id: 2,
    name: '홍대이탈리안',
    category: '음식',
    phone: '02-223-1234',
    email: 'italy@food.kr',
    address: '역곡로 12',
    hours: '11:00~22:00',
    parking: true,
    isFav: false,
  },
  {
    id: 3,
    name: '성심당',
    category: '생활',
    phone: '02-331-0000',
    email: 'bakery@shop.kr',
    address: '신관 앞',
    hours: '08:00~20:00',
    parking: false,
    isFav: false,
  },
  {
    id: 4,
    name: '연남디저트',
    category: '카페',
    phone: '02-991-1199',
    email: 'dessert@cake.kr',
    address: '정문 골목',
    hours: '10:00~21:00',
    parking: false,
    isFav: true,
  },
  {
    id: 5,
    name: '미술관',
    category: '문화',
    phone: '02-555-2222',
    email: 'art@museum.kr',
    address: '후문 맞은편',
    hours: '10:00~18:00',
    parking: true,
    isFav: false,
  },
  {
    id: 6,
    name: '상도카페',
    category: '카페',
    phone: '02-444-7777',
    email: 'sangdo@cafe.kr',
    address: '상도동 45',
    hours: '09:30~20:30',
    parking: false,
    isFav: false,
  },
  {
    id: 7,
    name: '정문분식',
    category: '음식',
    phone: '02-888-9999',
    email: 'bunsik@shop.kr',
    address: '정문앞',
    hours: '10:30~21:00',
    parking: false,
    isFav: false,
  },
  {
    id: 8,
    name: '교내문구',
    category: '생활',
    phone: '02-321-2221',
    email: 'stationery@uni.kr',
    address: '학생회관 1층',
    hours: '09:00~18:00',
    parking: false,
    isFav: true,
  },
  {
    id: 9,
    name: '영화관',
    category: '문화',
    phone: '02-100-2000',
    email: 'cinema@film.kr',
    address: '역곡역 3번출구',
    hours: '12:00~24:00',
    parking: true,
    isFav: false,
  },
  {
    id: 10,
    name: '충무로카페',
    category: '카페',
    phone: '02-712-8888',
    email: 'chung@cafe.kr',
    address: '충무로 12',
    hours: '08:30~19:30',
    parking: false,
    isFav: false,
  },
];

/** 내부 카드 컴포넌트 */
function ShopInfoCard({ shop, onToggleFav }) {
  return (
    <article
      className="shop-card"
      role="article"
      aria-labelledby={`shop-${shop.id}-title`}
    >
      <div className="shop-card__head">
        <h3 id={`shop-${shop.id}-title`} className="shop-card__title">
          {shop.name}
        </h3>
        <button
          type="button"
          className={`shop-card__fav ${shop.isFav ? 'is-on' : ''}`}
          onClick={() => onToggleFav?.(shop.id)}
          aria-pressed={shop.isFav}
        >
          {shop.isFav ? '★ 즐겨찾기됨' : '☆ 즐겨찾기'}
        </button>
      </div>

      <div className="shop-card__body">
        <dl className="shop-meta">
          <dt>전화번호</dt>
          <dd>{shop.phone || '-'}</dd>
          <dt>이메일</dt>
          <dd>{shop.email || '-'}</dd>
          <dt>주소</dt>
          <dd>{shop.address || '-'}</dd>
          <dt>운영시간</dt>
          <dd>{shop.hours || '-'}</dd>
          <dt>주차여부</dt>
          <dd>{shop.parking ? '가능' : '불가'}</dd>
        </dl>
      </div>
    </article>
  );
}

export default function ShopInfo() {
  const navigate = useNavigate();

  // TopBanner 탭 전환 → 라우팅 매핑
  const changeTab = (tab) => {
    const t = String(tab);
    if (t.includes('제휴') && t.includes('정보')) return navigate('/');
    if (t.includes('지도')) return navigate('/map');
    // '제휴사 정보' / '가게 정보' 등 → 현재 페이지
    return navigate('/partners');
  };

  const [category, setCategory] = useState('전체');
  const [sort, setSort] = useState('nameAsc');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(MOCK_SHOPS);

  const PAGE_SIZE = 6; // 2열 x 3행

  const filtered = useMemo(() => {
    let list =
      category === '전체' ? data : data.filter((s) => s.category === category);
    switch (sort) {
      case 'nameDesc':
        list = [...list].sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'favDesc':
        list = [...list].sort((a, b) => Number(b.isFav) - Number(a.isFav));
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
  }, [category, sort, data]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const changePage = (p) => {
    if (p < 1 || p > pageCount) return;
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFav = (id) => {
    setData((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isFav: !s.isFav } : s))
    );
  };

  return (
    <div className="app__container">
      {/* 상단 내비 (두 번째 화면과 동일한 컴포넌트) */}
      <TopBanner activeTab={'제휴사 정보'} onChange={changeTab} />

      <main className="section shop">
        <div className="section__head shop__head">
          <h2 className="section__title shop__title">가게 정보</h2>

          <div className="controls">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              aria-label="카테고리"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              aria-label="정렬 기준"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2열 그리드 */}
        <div className="shop-grid">
          {current.map((shop) => (
            <ShopInfoCard key={shop.id} shop={shop} onToggleFav={toggleFav} />
          ))}
        </div>

        {/* 페이지네이션 */}
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
              className={`pagination__num ${p === page ? 'is-active' : ''}`}
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
      </main>
    </div>
  );
}
