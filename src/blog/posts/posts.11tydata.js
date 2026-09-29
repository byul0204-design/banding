// 이 폴더의 모든 글에 공통으로 적용되는 설정
import site from '../../_data/site.js';

const toSlug = (s) => String(s || '')
  .toLowerCase().trim()
  .replace(/[^a-z0-9-]+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

export default {
  layout: 'post.njk',
  eleventyComputed: {
    // 글 주소: 머리말의 slug → 없으면 파일 이름
    permalink: (data) => (data.draft === true
      ? false
      : `/blog/${toSlug(data.slug) || toSlug(data.page.fileSlug)}/`),
    eleventyExcludeFromCollections: (data) => data.draft === true,
    categoryKey: (data) => toSlug(data.category) || 'product',
    categoryLabel: (data) => site.categoryLabel(toSlug(data.category) || 'product'),
    // 대표 이미지: thumbnail(관리자) 또는 cover(직접 작성)
    image: (data) => data.thumbnail || data.cover || '',
    // 태그: 목록 또는 쉼표로 구분한 문자열
    postTags: (data) => (Array.isArray(data.tags)
      ? data.tags.map(String).filter(Boolean)
      : String(data.tags || '').split(',').map((t) => t.trim()).filter(Boolean)),
    // 검색엔진용 구조화 데이터
    jsonLd: (data) => {
      if (!data.page.url) return [];
      const abs = (p) => (/^https?:/i.test(p) ? p : site.url + p);
      const url = abs(data.page.url);
      const date = new Date(data.page.date).toISOString();
      const org = site.company.name || site.name;
      return [{
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: data.title,
        description: data.description || '',
        datePublished: date,
        dateModified: data.updated ? new Date(data.updated).toISOString() : date,
        image: abs(data.thumbnail || data.cover || site.ogImage),
        mainEntityOfPage: url,
        author: { '@type': 'Organization', name: org },
        publisher: { '@type': 'Organization', name: org, logo: { '@type': 'ImageObject', url: abs('/assets/img/apple-touch-icon.png') } },
        keywords: (Array.isArray(data.tags) ? data.tags : []).join(', '),
      }, {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '홈', item: site.url + '/' },
          { '@type': 'ListItem', position: 2, name: '블로그', item: abs('/blog/') },
          { '@type': 'ListItem', position: 3, name: data.title, item: url },
        ],
      }];
    },
  },
};
