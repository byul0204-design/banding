// 사이트 전역 정보.
// 전화번호·사업자 정보·인증 코드는 관리자(/admin) > 사이트 설정에서 바꾸면
// src/_data/settings.json 에 저장되고, 여기서 읽어 전체 페이지에 반영됩니다.
import fs from 'node:fs';

const settings = JSON.parse(fs.readFileSync(new URL('./settings.json', import.meta.url), 'utf8'));
const phone = (settings.phone || '010-7773-2425').trim();

/* 블로그 카테고리 (src/admin/config.yml 의 선택지와 같아야 합니다) */
const categories = [
  { key: 'product', label: '제품 소개' },
  { key: 'cases', label: '설치 사례' },
  { key: 'startup', label: '창업·운영 정보' },
  { key: 'tip', label: '운영 팁' },
  { key: 'notice', label: '공지사항' },
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
};
