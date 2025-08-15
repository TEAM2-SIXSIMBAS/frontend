import React, { useState } from 'react';
import '../../styles/InfoMap/cc.css';
import TopBanner from '../../components/TopBanner';

function InfoMap() {
  const [category, setCategory] = useState('전체');
  const [sort, setSort] = useState('idAsc');

  // 데모 마커 데이터 (좌표 %)
  const markers = [
    { id: 1, name: '문과관카페', x: 62, y: 36, color: 'amber' },
    { id: 2, name: '연남디저트', x: 34, y: 58, color: 'sky' },
  ];

  return (
    <div className="app">
      <div className="app__container">
        {/* 다른 페이지와 동일한 TopBanner 사용 */}
        <TopBanner activeTab="제휴 지도" />

        <main>
          {/* 페이지 타이틀 섹션 (App.css 토큰 사용) */}
          <section className="section">
            {/* 화면에는 숨기되 구조 유지 */}
            <h1 className="mappage__title sr-only">가대제휴</h1>
            <p className="mappage__sub">
              학교 주변 제휴 매장을 지도로 확인하세요.
            </p>
          </section>

          {/* 지도 카드 섹션 */}
          <section className="section">
            <div className="section__head section__head--controls">
              <h2 className="section__title">제휴 지도</h2>

              {/* 셀렉트는 App.css의 공통 스타일을 그대로 사용 */}
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
              </div>
            </div>

            {/* 지도 영역 */}
            <div className="mapcard">
              <div className="mapcard__inner">
                {markers.map((m) => (
                  <button
                    key={m.id}
                    className={`pin pin--${m.color}`}
                    style={{ left: `${m.x}%`, top: `${m.y}%` }}
                    title={m.name}
                    aria-label={m.name}
                    onClick={() => alert(m.name)}
                  >
                    <span className="pin__dot" />
                  </button>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default InfoMap;
