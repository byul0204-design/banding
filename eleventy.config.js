/**
 * LK 홈타운 밴딩머신 — 11ty 빌드 설정
 *
 *  src/            원본 (페이지·글·이미지)
 *  _site/          빌드 결과 (Netlify가 배포하는 폴더, 자동 생성)
 *
 *  npm run build   → _site 생성
 *  npm run dev     → http://localhost:8080 미리보기 (저장하면 자동 새로고침)
 */
import site from './src/_data/site.js';

const TZ = 'Asia/Seoul';

const kstParts = (d) => {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(d));
  const get = (t) => parts.find((x) => x.type === t).value;
  return { y: get('year'), m: get('month'), d: get('day') };
};

const stripHtml = (html = '') => String(html)
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z#0-9]+;/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export default function (eleventyConfig) {
  /* 정적 파일 그대로 복사 */
  eleventyConfig.addPassthroughCopy('src/assets');
  eleventyConfig.addPassthroughCopy('src/admin');
  eleventyConfig.addPassthroughCopy('src/naver*.html');

  /* 마크다운: 줄바꿈 그대로, HTML 허용 */
  eleventyConfig.amendLibrary('md', (md) => md.set({ html: true, breaks: true }));

  /* ---------- 필터 ---------- */
  eleventyConfig.addFilter('dateKR', (d) => { const p = kstParts(d); return `${p.y}.${p.m}.${p.d}`; });
  eleventyConfig.addFilter('dateISO', (d) => new Date(d).toISOString());
  eleventyConfig.addFilter('dateRFC', (d) => new Date(d).toUTCString());

  // /경로 → https://사이트주소/경로
  eleventyConfig.addFilter('absUrl', (p = '/') => {
    if (!p) return site.url + '/';
    if (/^https?:\/\//i.test(p)) return p;
    return site.url + (p.startsWith('/') ? '' : '/') + encodeURI(decodeURI(p));
  });

  eleventyConfig.addFilter('excerpt', (html, len = 140) => {
    const text = stripHtml(html);
    return text.length > len ? text.slice(0, len) + '…' : text;
  });
  eleventyConfig.addFilter('head', (arr = [], n) => arr.slice(0, n));
  eleventyConfig.addFilter('readingMinutes', (html) => Math.max(1, Math.round(stripHtml(html).length / 500)));

  // 본문 이미지 지연 로딩, 외부 링크는 새 창
  eleventyConfig.addFilter('postHtml', (html = '') => String(html)
    .replace(/<img /g, '<img loading="lazy" decoding="async" ')
    .replace(/<a href="(https?:\/\/[^"]+)"/g, (m, href) =>
      href.startsWith(site.url) ? m : `<a href="${href}" target="_blank" rel="noopener"`));

  // CDATA 안전하게 감싸기 (RSS)
  eleventyConfig.addFilter('cdata', (s = '') => `<![CDATA[${String(s).replace(/]]>/g, ']]]]><![CDATA[>')}]]>`);

  // 같은 카테고리 글 우선, 모자라면 최신 글로 채워 3개
  eleventyConfig.addFilter('relatedPosts', (posts, url, categoryKey, n = 3) => {
    const others = posts.filter((p) => p.url !== url);
    const same = others.filter((p) => p.data.categoryKey === categoryKey).slice(0, n);
    return [...same, ...others.filter((p) => !same.includes(p)).slice(0, n - same.length)];
  });

  /* ---------- 컬렉션 ---------- */
  const isPublished = (p) => p.data.draft !== true;

  eleventyConfig.addCollection('blogPosts', (api) => api
    .getFilteredByGlob('src/blog/posts/*.md')
    .filter(isPublished)
    .sort((a, b) => b.date - a.date));

  // 글이 1개 이상 있는 카테고리만 (site.js 순서대로, 목록에 없는 값은 뒤에)
  eleventyConfig.addCollection('categoryList', (api) => {
    const posts = api.getFilteredByGlob('src/blog/posts/*.md').filter(isPublished).sort((a, b) => b.date - a.date);
    const keys = [...site.categories.map((c) => c.key), ...posts.map((p) => p.data.categoryKey)];
    return [...new Set(keys)]
      .map((key) => ({
        key,
        label: site.categoryLabel(key),
        posts: posts.filter((p) => p.data.categoryKey === key),
      }))
      .filter((c) => c.posts.length);
  });

  return {
    dir: { input: 'src', output: '_site', includes: '_includes', data: '_data' },
    templateFormats: ['njk', 'md'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: false, // 글 본문의 {{ }} 를 그대로 둠
  };
}
