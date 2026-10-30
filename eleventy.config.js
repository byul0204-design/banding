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
import fs from 'node:fs';
import path from 'node:path';

const readBanners = () => {
  try { return JSON.parse(fs.readFileSync('src/_data/banners.json', 'utf8')); } catch { return {}; }
};
const escAttr = (s = '') => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
// 배너 하나를 HTML로. 이미지 폴더가 비어 있으면 아무것도 출력하지 않음
const bannerHtml = (key) => {
  const b = readBanners()[key];
  const dir = path.join('src/assets/img/banners', key);
  if (!b || !fs.existsSync(dir)) return '';
  const files = fs.readdirSync(dir).filter((f) => /\.(webp|jpe?g|png)$/i.test(f)).sort();
  if (!files.length) return '';
  const imgs = files.map((f, i) => `<img data-banner-src="/assets/img/banners/${key}/${f}" alt="${i === 0 ? escAttr(b.alt) : ''}" loading="lazy" decoding="async">`).join('');
  const body = b.link ? `<a href="${escAttr(b.link)}" aria-label="${escAttr(b.label || '')}">${imgs}</a>` : imgs;
  return `<figure class="promo-banner" data-banner="${key}">${body}</figure>`;
};

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
      href.startsWith(site.url) ? m : `<a href="${href}" target="_blank" rel="noopener"`)
    // 본문의 <!-- banner:이름 --> 자리에 반복 배너를 넣음
    .replace(/<!--\s*banner:([a-z0-9-]+)\s*-->/g, (m, key) => bannerHtml(key)));

  // 반복 배너 (워드프레스 스니펫 역할)
  // 이미지: src/assets/img/banners/<이름>/ 폴더의 파일을 이름순으로 이어 붙임
  // 설정: src/_data/banners.json (alt, 링크, 자동으로 붙일 카테고리)
  // auto 에 적은 카테고리 글에 자동으로 붙고, 본문에 이미 넣었으면 다시 붙이지 않음
  // position: "top" 이면 대표 이미지 바로 아래(본문 앞), 없거나 "bottom" 이면 본문 끝
  eleventyConfig.addFilter('autoBanners', (categoryKey, html = '', position = 'bottom') => {
    const all = readBanners();
    return Object.keys(all)
      .filter((key) => (all[key].auto || []).includes(categoryKey))
      .filter((key) => (all[key].position || 'bottom') === position)
      .filter((key) => !new RegExp(`<!--\\s*banner:${key}\\s*-->`).test(String(html)))
      .map((key) => bannerHtml(key))
      .join('');
  });

  // 본문의 '## 자주 묻는 질문' 아래 '### 질문' + 답변을 뽑아 FAQ 구조화 데이터로
  eleventyConfig.addFilter('faqItems', (html = '') => {
    const m = String(html).match(/<h2[^>]*>\s*자주 묻는 질문\s*<\/h2>([\s\S]*?)(?=<h2|$)/);
    if (!m) return [];
    return m[1].split(/<h3[^>]*>/).slice(1).map((part) => {
      const [q, a = ''] = part.split(/<\/h3>/);
      return { q: stripHtml(q), a: stripHtml(a) };
    }).filter((x) => x.q && x.a);
  });

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
