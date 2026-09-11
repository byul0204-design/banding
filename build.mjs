#!/usr/bin/env node
/**
 * LK 홈타운 밴딩머신 — 사이트 빌드 스크립트
 *
 * 하는 일
 *  1. content/posts/*.md 글을 읽어 /blog/ 목록, 카테고리, 글 상세 페이지를 만듭니다.
 *  2. index.html 의 머리말·꼬리말을 그대로 가져와 블로그 페이지에도 똑같이 씁니다.
 *  3. data/settings.json(관리자 > 사이트 설정)의 전화번호·사업자 정보·네이버 인증 코드를 넣습니다.
 *  4. 네이버 서치어드바이저용 sitemap.xml, rss.xml, robots.txt 를 만듭니다.
 *
 * 사용법
 *  npm run build        → _site 폴더에 결과물 생성 (Netlify가 배포할 때 자동 실행)
 *  npm run dev          → 빌드 후 http://localhost:8080 에서 미리보기
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, '_site');
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const PER_PAGE = 12;

/* 카테고리 (admin/config.yml 의 선택지와 같아야 합니다) */
const CATEGORIES = [
  { key: 'product', label: '제품 소개' },
  { key: 'cases', label: '설치 사례' },
  { key: 'startup', label: '창업·운영 정보' },
  { key: 'notice', label: '공지사항' },
];

/* ---------- 설정 ---------- */
const settings = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'settings.json'), 'utf8'));
const SITE_NAME = settings.siteName || 'LK 홈타운 밴딩머신';
const SITE_URL = (settings.siteUrl || process.env.URL || 'http://localhost:8080').trim().replace(/\/+$/, '');
const PHONE = (settings.phone || '010-7773-2425').trim();
const TEL = PHONE.replace(/[^0-9+]/g, '');
const company = settings.company || {};

/* ---------- 도우미 ---------- */
const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const absUrl = (p = '/') => {
  if (!p) return SITE_URL + '/';
  if (/^https?:\/\//i.test(p)) return p;
  return SITE_URL + (p.startsWith('/') ? '' : '/') + encodeURI(decodeURI(p));
};

const kstParts = (d) => {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(d);
  const get = (t) => parts.find((x) => x.type === t).value;
  return { y: get('year'), m: get('month'), d: get('day') };
};
const fmtDate = (d) => { const p = kstParts(d); return `${p.y}.${p.m}.${p.d}`; };

const stripMarkdown = (md) => md
  .replace(/```[\s\S]*?```/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
  .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/[#>*_`~|\-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const toSlug = (s) => String(s || '')
  .toLowerCase().trim()
  .replace(/[^a-z0-9-]+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

const write = (rel, content) => {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

const copyDir = (src, dest) => {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
};

const replaceBlock = (html, name, content) => {
  const re = new RegExp(`<!-- ${name}:START -->[\\s\\S]*?<!-- ${name}:END -->`);
  return html.replace(re, () => `<!-- ${name}:START -->${content}<!-- ${name}:END -->`);
};
const extractBlock = (html, name) => {
  const m = html.match(new RegExp(`<!-- ${name}:START -->([\\s\\S]*?)<!-- ${name}:END -->`));
  if (!m) throw new Error(`index.html 에서 ${name} 표시를 찾지 못했어요.`);
  return m[1];
};

/* 전화번호를 설정값으로 바꾸기 */
const applyPhone = (html) => html
  .replace(/href="tel:[^"]*"/g, `href="tel:${TEL}"`)
  .replace(/href="sms:[^"]*"/g, `href="sms:${TEL}"`)
  .replace(/<span data-phone>[^<]*<\/span>/g, `<span data-phone>${esc(PHONE)}</span>`);

/* 메인 페이지의 상대 경로를 어느 페이지에서나 통하는 절대 경로로 */
const absolutize = (html) => html
  .replace(/href="index\.html"/g, 'href="/"')
  .replace(/href="#/g, 'href="/#')
  .replace(/(href|src)="(?!https?:|\/|#|tel:|sms:|mailto:|data:)([^"]+)"/g, '$1="/$2"');

/* ---------- 글 불러오기 ---------- */
const catMap = new Map(CATEGORIES.map((c) => [c.key, c]));

function loadPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const files = fs.readdirSync(POSTS_DIR).filter((f) => /\.(md|markdown)$/i.test(f));
  const used = new Set();
  const posts = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    let parsed;
    try { parsed = matter(raw); } catch (e) {
      console.warn(`⚠️  ${file}: 머리말(front matter)을 읽지 못해 건너뜁니다. (${e.message})`);
      continue;
    }
    const { data, content } = parsed;
    if (data.draft === true) continue;
    if (!data.title) { console.warn(`⚠️  ${file}: 제목이 없어 건너뜁니다.`); continue; }

    const date = data.date ? new Date(data.date) : fs.statSync(path.join(POSTS_DIR, file)).mtime;
    if (Number.isNaN(date.getTime())) { console.warn(`⚠️  ${file}: 날짜 형식이 올바르지 않아 건너뜁니다.`); continue; }

    let slug = toSlug(data.slug) || toSlug(path.basename(file, path.extname(file))) || `post-${posts.length + 1}`;
    let n = 2; const base = slug;
    while (used.has(slug)) slug = `${base}-${n++}`;
    used.add(slug);

    let catKey = String(data.category || 'product');
    if (!catMap.has(catKey)) {
      const key = toSlug(catKey) || 'etc';
      catMap.set(key, { key, label: catKey });
      catKey = key;
    }

    let html = marked.parse(content, { gfm: true, breaks: true });
    html = html
      .replace(/<img /g, '<img loading="lazy" decoding="async" ')
      .replace(/<a href="(https?:\/\/[^"]+)"/g, (m, href) =>
        href.startsWith(SITE_URL) ? m : `<a href="${href}" target="_blank" rel="noopener"`);

    const text = stripMarkdown(content);
    const description = String(data.description || '').trim() || (text.length > 140 ? text.slice(0, 140) + '…' : text);
    const tags = Array.isArray(data.tags) ? data.tags.map(String).filter(Boolean)
      : (data.tags ? String(data.tags).split(',').map((t) => t.trim()).filter(Boolean) : []);

    posts.push({
      file, slug, title: String(data.title), date, description, tags,
      category: catMap.get(catKey),
      thumbnail: data.thumbnail ? String(data.thumbnail) : '',
      html, minutes: Math.max(1, Math.round(text.length / 500)),
      url: `/blog/${slug}/`,
    });
  }
  return posts.sort((a, b) => b.date - a.date);
}

/* ---------- 공통 틀 ---------- */
const indexSrc = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const HEADER = applyPhone(absolutize(extractBlock(indexSrc, 'HEADER')));
const FOOTER_RAW = applyPhone(absolutize(extractBlock(indexSrc, 'FOOTER')));

function bizInfoHtml() {
  const items = [];
  if (company.name) items.push(`상호 ${esc(company.name)}`);
  if (company.ceo) items.push(`대표 ${esc(company.ceo)}`);
  if (company.bizNumber) items.push(`사업자등록번호 ${esc(company.bizNumber)}`);
  if (company.address) items.push(`주소 ${esc(company.address)}`);
  items.push(`상담 전화 <a href="tel:${TEL}" style="color:inherit">${esc(PHONE)}</a>`);
  if (company.email) items.push(`이메일 <a href="mailto:${esc(company.email)}" style="color:inherit">${esc(company.email)}</a>`);
  return `\n    <p class="biz">${items.map((i) => `<span>${i}</span>`).join('')}</p>\n    `;
}
const FOOTER = replaceBlock(FOOTER_RAW, 'BIZINFO', bizInfoHtml())
  .replace(/© <span data-year>\d+<\/span> [^<]*/, `© <span data-year>${new Date().getFullYear()}</span> ${esc(company.name || SITE_NAME)}`);

const orgJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: company.name || SITE_NAME,
  url: SITE_URL + '/',
  logo: absUrl('/assets/img/apple-touch-icon.png'),
  telephone: PHONE,
  ...(company.email ? { email: company.email } : {}),
  ...(company.address ? { address: company.address } : {}),
});

function layout({ title, description, canonical, image, type = 'website', jsonLd = [], body, current = '', robots = '' }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const img = absUrl(image || '/assets/img/og-image.jpg');
  let header = HEADER;
  if (current === 'blog') header = header.replace('<a href="/blog/">', '<a href="/blog/" aria-current="page">');
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
${robots ? `<meta name="robots" content="${robots}">\n` : ''}<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${esc(SITE_NAME)}">
<meta property="og:title" content="${esc(title || SITE_NAME)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(img)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="alternate" type="application/rss+xml" title="${esc(SITE_NAME)} 블로그" href="/rss.xml">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/wanteddev/wanted-sans@v1.0.3/packages/wanted-sans/fonts/webfonts/variable/split/WantedSansVariable.min.css">
<link rel="stylesheet" href="/assets/css/style.css">
${jsonLd.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
</head>
<body>
<a class="skip" href="#main">본문 바로가기</a>
${header}
<main id="main">
${body}
</main>
${FOOTER}
<script src="/assets/js/main.js" defer></script>
</body>
</html>
`;
}

const postCard = (p, headingTag = 'h3') => `
        <li class="post-card"><a href="${p.url}">
          ${p.thumbnail
            ? `<div class="thumb"><img src="${esc(p.thumbnail)}" alt="" loading="lazy" decoding="async"></div>`
            : `<div class="thumb thumb--empty">${esc(SITE_NAME)}</div>`}
          <span class="cat">${esc(p.category.label)}</span>
          <${headingTag}>${esc(p.title)}</${headingTag}>
          <p>${esc(p.description)}</p>
          <time datetime="${p.date.toISOString()}">${fmtDate(p.date)}</time>
        </a></li>`;

const postGrid = (list) => list.length
  ? `<ul class="post-grid">${list.map((p) => postCard(p, 'h2')).join('')}\n      </ul>`
  : `<div class="empty"><p>아직 발행된 글이 없어요.</p></div>`;

function catNav(posts, currentKey) {
  const used = [...catMap.values()].filter((c) => posts.some((p) => p.category.key === c.key));
  const link = (href, label, on) => `<a href="${href}"${on ? ' aria-current="page"' : ''}>${esc(label)}</a>`;
  return `<nav class="cat-nav" aria-label="카테고리">${link('/blog/', '전체', !currentKey)}${used
    .map((c) => link(`/blog/category/${c.key}/`, c.label, c.key === currentKey)).join('')}</nav>`;
}

function pagination(page, pages) {
  if (pages <= 1) return '';
  const href = (n) => (n === 1 ? '/blog/' : `/blog/page/${n}/`);
  let out = '<nav class="pagination" aria-label="페이지">';
  if (page > 1) out += `<a href="${href(page - 1)}" rel="prev">이전</a>`;
  for (let n = 1; n <= pages; n++) {
    out += n === page ? `<span aria-current="page">${n}</span>` : `<a href="${href(n)}">${n}</a>`;
  }
  if (page < pages) out += `<a href="${href(page + 1)}" rel="next">다음</a>`;
  return out + '</nav>';
}

/* ---------- 빌드 ---------- */
function build() {
  const t0 = Date.now();
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  // 정적 파일
  copyDir(path.join(ROOT, 'assets'), path.join(OUT, 'assets'));
  copyDir(path.join(ROOT, 'admin'), path.join(OUT, 'admin'));

  const posts = loadPosts();

  /* 메인 페이지 */
  let home = indexSrc.replace(/href="index\.html"/g, 'href="/"');
  const verify = [
    settings.naverVerification && `<meta name="naver-site-verification" content="${esc(String(settings.naverVerification).trim())}">`,
    settings.googleVerification && `<meta name="google-site-verification" content="${esc(String(settings.googleVerification).trim())}">`,
  ].filter(Boolean).join('\n');
  home = replaceBlock(home, 'SEO', `
<link rel="canonical" href="${SITE_URL}/">
<meta property="og:url" content="${SITE_URL}/">
${verify}
<script type="application/ld+json">${JSON.stringify(orgJsonLd())}</script>
`);
  home = home.replace(/content="assets\/img\/og-image\.jpg"/, `content="${absUrl('/assets/img/og-image.jpg')}"`);
  home = replaceBlock(home, 'LATEST_POSTS', posts.length
    ? `\n      <ul class="post-grid">${posts.slice(0, 3).map((p) => postCard(p)).join('')}\n      </ul>\n      `
    : `\n      <div class="empty"><p>첫 글을 준비하고 있어요.</p></div>\n      `);
  home = replaceBlock(home, 'HOURS', settings.hours ? `<p class="hours">상담 시간 ${esc(settings.hours)}</p>` : '');
  home = replaceBlock(home, 'BIZINFO', bizInfoHtml())
    .replace(/© <span data-year>\d+<\/span> [^<]*/, `© <span data-year>${new Date().getFullYear()}</span> ${esc(company.name || SITE_NAME)}`);
  home = applyPhone(home);
  write('index.html', home);

  /* 블로그 목록 (페이지 나누기) */
  const pages = Math.max(1, Math.ceil(posts.length / PER_PAGE));
  for (let page = 1; page <= pages; page++) {
    const list = posts.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const url = page === 1 ? '/blog/' : `/blog/page/${page}/`;
    write(path.join(url, 'index.html'), layout({
      title: page === 1 ? '블로그' : `블로그 ${page}페이지`,
      description: '스마트 자판기와 무인매장 운영에 필요한 제품 소식, 설치 사례, 창업 정보를 전해요.',
      canonical: absUrl(url),
      current: 'blog',
      body: `
  <section class="page-head"><div class="wrap">
    <h1>블로그</h1>
    <p>제품 소식과 설치 사례, 무인 운영 팁을 전해요.</p>
  </div></section>
  <section class="blog-body"><div class="wrap">
    ${catNav(posts)}
    ${postGrid(list)}
    ${pagination(page, pages)}
  </div></section>`,
    }));
  }

  /* 카테고리 */
  for (const cat of catMap.values()) {
    const list = posts.filter((p) => p.category.key === cat.key);
    if (!list.length) continue;
    const url = `/blog/category/${cat.key}/`;
    write(path.join(url, 'index.html'), layout({
      title: `${cat.label} | 블로그`,
      description: `${cat.label} 관련 글 모음`,
      canonical: absUrl(url),
      current: 'blog',
      body: `
  <section class="page-head"><div class="wrap">
    <h1>${esc(cat.label)}</h1>
    <p>글 ${list.length}개</p>
  </div></section>
  <section class="blog-body"><div class="wrap">
    ${catNav(posts, cat.key)}
    ${postGrid(list)}
  </div></section>`,
    }));
  }

  /* 글 상세 */
  for (const p of posts) {
    const canonical = absUrl(p.url);
    const related = posts.filter((x) => x !== p && x.category.key === p.category.key).slice(0, 3);
    const more = related.length < 3 ? posts.filter((x) => x !== p && !related.includes(x)).slice(0, 3 - related.length) : [];
    const relatedList = [...related, ...more];
    const jsonLd = [{
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: p.title,
      description: p.description,
      datePublished: p.date.toISOString(),
      dateModified: p.date.toISOString(),
      image: absUrl(p.thumbnail || '/assets/img/og-image.jpg'),
      mainEntityOfPage: canonical,
      author: { '@type': 'Organization', name: company.name || SITE_NAME },
      publisher: { '@type': 'Organization', name: company.name || SITE_NAME, logo: { '@type': 'ImageObject', url: absUrl('/assets/img/apple-touch-icon.png') } },
      keywords: p.tags.join(', '),
    }, {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: SITE_URL + '/' },
        { '@type': 'ListItem', position: 2, name: '블로그', item: absUrl('/blog/') },
        { '@type': 'ListItem', position: 3, name: p.title, item: canonical },
      ],
    }];

    write(path.join('blog', p.slug, 'index.html'), layout({
      title: p.title,
      description: p.description,
      canonical,
      image: p.thumbnail,
      type: 'article',
      jsonLd,
      current: 'blog',
      body: `
  <article class="post"><div class="post-wrap">
    <nav class="crumbs" aria-label="현재 위치"><a href="/">홈</a><span aria-hidden="true">›</span><a href="/blog/">블로그</a><span aria-hidden="true">›</span><a href="/blog/category/${p.category.key}/">${esc(p.category.label)}</a></nav>
    <a class="post-cat" href="/blog/category/${p.category.key}/">${esc(p.category.label)}</a>
    <h1>${esc(p.title)}</h1>
    <div class="post-meta"><time datetime="${p.date.toISOString()}">${fmtDate(p.date)}</time><span>읽는 데 약 ${p.minutes}분</span></div>
    ${p.thumbnail ? `<figure class="post-cover"><img src="${esc(p.thumbnail)}" alt="" fetchpriority="high"></figure>` : ''}
    <div class="prose">
${p.html}
    </div>
    ${p.tags.length ? `<ul class="tags" aria-label="태그">${p.tags.map((t) => `<li>#${esc(t)}</li>`).join('')}</ul>` : ''}
    <div class="post-tools">
      <a class="btn btn-line" href="/blog/">목록으로</a>
      <button class="btn btn-line" type="button" data-copy-url="${esc(canonical)}">글 주소 복사</button>
    </div>
    <aside class="post-cta">
      <div>
        <h2>우리 공간에도 놓을 수 있을까요?</h2>
        <p>설치 장소와 판매할 상품을 알려주시면 맞는 구성을 제안해 드려요.</p>
      </div>
      <div class="btns">
        <a class="btn btn-call" href="tel:${TEL}">${esc(PHONE)}</a>
        <a class="btn btn-ghost" href="/#contact">문의 남기기</a>
      </div>
    </aside>
  </div></article>
  ${relatedList.length ? `<section class="related section--white"><div class="wrap">
    <h2>함께 읽으면 좋은 글</h2>
    <ul class="post-grid">${relatedList.map((x) => postCard(x)).join('')}
    </ul>
  </div></section>` : ''}`,
    }));
  }

  /* 문의 완료 · 404 */
  write('thanks/index.html', layout({
    title: '문의가 접수됐어요',
    description: '문의가 접수됐어요.',
    canonical: absUrl('/thanks/'),
    robots: 'noindex',
    body: `
  <section class="notice-page"><div class="wrap">
    <h1>문의가 접수됐어요</h1>
    <p>남겨 주신 연락처로 곧 연락드릴게요. 급하시면 전화 주세요.</p>
    <div class="btns"><a class="btn btn-call" href="tel:${TEL}">${esc(PHONE)}</a><a class="btn btn-line" href="/">메인으로</a></div>
  </div></section>`,
  }));

  write('404.html', layout({
    title: '페이지를 찾을 수 없어요',
    description: '요청하신 페이지를 찾을 수 없어요.',
    canonical: absUrl('/404.html'),
    robots: 'noindex',
    body: `
  <section class="notice-page"><div class="wrap">
    <h1>페이지를 찾을 수 없어요</h1>
    <p>주소가 바뀌었거나 삭제된 페이지예요. 메인이나 블로그에서 다시 찾아보세요.</p>
    <div class="btns"><a class="btn btn-primary" href="/">메인으로</a><a class="btn btn-line" href="/blog/">블로그 보기</a></div>
  </div></section>`,
  }));

  /* sitemap.xml */
  const lastPost = posts[0] ? posts[0].date : new Date();
  const urls = [
    { loc: SITE_URL + '/', lastmod: lastPost, pr: '1.0' },
    { loc: absUrl('/blog/'), lastmod: lastPost, pr: '0.8' },
    ...[...catMap.values()].filter((c) => posts.some((p) => p.category.key === c.key))
      .map((c) => ({ loc: absUrl(`/blog/category/${c.key}/`), lastmod: posts.find((p) => p.category.key === c.key).date, pr: '0.5' })),
    ...posts.map((p) => ({ loc: absUrl(p.url), lastmod: p.date, pr: '0.7' })),
  ];
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(u.loc)}</loc><lastmod>${u.lastmod.toISOString()}</lastmod><priority>${u.pr}</priority></url>`).join('\n')}
</urlset>
`);

  /* rss.xml (네이버 서치어드바이저 RSS 제출용) */
  const cdata = (s) => `<![CDATA[${String(s).replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
  write('rss.xml', `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(SITE_NAME)} 블로그</title>
  <link>${SITE_URL}/</link>
  <description>스마트 자판기와 무인매장 운영에 필요한 제품 소식, 설치 사례, 창업 정보</description>
  <language>ko</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${posts.slice(0, 50).map((p) => `  <item>
    <title>${cdata(p.title)}</title>
    <link>${esc(absUrl(p.url))}</link>
    <guid isPermaLink="true">${esc(absUrl(p.url))}</guid>
    <pubDate>${p.date.toUTCString()}</pubDate>
    <category>${cdata(p.category.label)}</category>
    <description>${cdata(p.description)}</description>
  </item>`).join('\n')}
</channel>
</rss>
`);

  /* robots.txt */
  write('robots.txt', `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /thanks/

Sitemap: ${SITE_URL}/sitemap.xml
`);

  console.log(`✅ 빌드 완료: 글 ${posts.length}개, 사이트 주소 ${SITE_URL} (${Date.now() - t0}ms)`);
}

/* ---------- 미리보기 서버 (npm run dev) ---------- */
function serve(port = 8080) {
  const types = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
    '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.webp': 'image/webp', '.gif': 'image/gif', '.yml': 'text/yaml', '.ico': 'image/x-icon',
  };
  http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(OUT, p);
    if (!file.startsWith(OUT)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404, { 'Content-Type': types['.html'] }); return res.end(fs.readFileSync(path.join(OUT, '404.html'))); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  }).listen(port, () => console.log(`👀 미리보기: http://localhost:${port}`));
}

build();
if (process.argv.includes('--serve')) serve(Number(process.env.PORT) || 8080);
