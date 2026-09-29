// 메인 페이지 전용 데이터: 검색엔진용 업체 정보
import site from './_data/site.js';

export default {
  jsonLd: [{
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.company.name || site.name,
    url: site.url + '/',
    logo: site.url + '/assets/img/apple-touch-icon.png',
    telephone: site.phone,
    ...(site.company.email ? { email: site.company.email } : {}),
    ...(site.company.address ? { address: site.company.address } : {}),
  }],
};
