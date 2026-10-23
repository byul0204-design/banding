// 사이트 전역 정보.
// 전화번호·사업자 정보·인증 코드는 관리자(/admin) > 사이트 설정에서 바꾸면
// src/_data/settings.json 에 저장되고, 여기서 읽어 전체 페이지에 반영됩니다.
import fs from 'node:fs';

const settings = JSON.parse(fs.readFileSync(new URL('./settings.json', import.meta.url), 'utf8'));
const phone = (settings.phone || '010-7773-2425').trim();

/* 블로그 카테고리 (src/admin/config.yml 의 선택지와 같아야 합니다) */
// desc: 카테고리 페이지의 검색 설명(meta description)과 상단 소개 문구
const categories = [
  { key: 'product', label: '제품 소개', desc: 'LK 광고형 홈타운 밴딩머신과 칸마다 잠기는 냉동 블록형 쇼케이스의 기능, 사양, 공간별 활용 방법을 소개합니다.' },
  { key: 'cases', label: '설치 사례', desc: '카페, 학원, 병원, 호텔, 회사, 캠핑장 등 실제로 스마트 자판기를 설치한 공간의 사례를 모았습니다.' },
  { key: 'startup', label: '창업·운영 정보', desc: '자판기·무인매장 창업 비용, 입지 분석, 영업신고, 자리 계약처럼 무인 창업을 준비할 때 알아야 할 정보를 정리했습니다.' },
  { key: 'tip', label: '운영 팁', desc: '업종별 상품 구성, 회사 복지 자판기 운영 방식처럼 자판기를 설치한 뒤 매출과 만족도를 높이는 운영 방법을 정리했습니다.' },
  { key: 'local', label: '지역별 설치 안내', desc: '지역별 스마트 자판기·무인매장 설치 상담과 방문 설치 안내를 모았습니다. 우리 지역에서 LK 홈타운 밴딩머신을 들이는 방법을 확인하세요.' },
  { key: 'notice', label: '공지사항', desc: 'LK 홈타운 밴딩머신의 새 소식과 안내 사항을 전합니다.' },
];

export default {
  name: settings.siteName || 'LK 홈타운 밴딩머신',
  tagline: '스마트 자판기·무인매장',
  description: '스마트 자판기와 무인매장 운영에 필요한 제품 소식, 설치 사례, 창업 정보를 전해요.',
  // 관리자에서 입력한 주소 → Netlify 기본 주소 → 내 컴퓨터 미리보기 순
  url: (settings.siteUrl || process.env.URL || 'http://localhost:8080').trim().replace(/\/+$/, ''),
  phone,
  tel: phone.replace(/[^0-9+]/g, ''),
  hours: (settings.hours || '').trim(),
  naverVerification: String(settings.naverVerification || '').trim(),
  googleVerification: String(settings.googleVerification || '').trim(),
  company: settings.company || {},
  ogImage: '/assets/img/og-image.jpg',
  postsPerPage: 12,
  postsOnHome: 6,
  year: new Date().getFullYear(),
  buildTime: new Date(),
  categories,
  categoryLabel: (key) => (categories.find((c) => c.key === key) || {}).label || key,
  categoryDesc: (key) => (categories.find((c) => c.key === key) || {}).desc || '',
};
