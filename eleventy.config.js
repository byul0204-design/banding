// ─────────────────────────────────────────────────────────────
//  Eleventy 설정 — 대부분 손댈 일이 없습니다.
//  사이트 이름·주소 같은 값은 src/_data/site.js 에서 고치세요.
// ─────────────────────────────────────────────────────────────
export default function (eleventyConfig) {

  // 이미지·CSS·JS는 그대로 복사해서 내보냅니다.
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/_redirects");

  // ── 날짜 필터 ──────────────────────────────────────────
  const kst = (d) => new Date(d).toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  });
  // 2026.09.09
  eleventyConfig.addFilter("dateKR", (d) => kst(d).replace(/\.\s*$/, "").replace(/\.\s/g, "."));
  // 2026-09-09  (sitemap, <time datetime>)
  eleventyConfig.addFilter("dateISO", (d) => new Date(d).toISOString().slice(0, 10));
  // RSS용 RFC-822
  eleventyConfig.addFilter("dateRFC", (d) => new Date(d).toUTCString());
  // 요약이 없을 때 본문에서 잘라 쓰기
  eleventyConfig.addFilter("excerpt", (content = "", n = 150) => {
    const text = String(content).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return text.length > n ? text.slice(0, n) + "…" : text;
  });
  eleventyConfig.addFilter("absUrl", (path, base) => new URL(path, base).href);

  // ── 글 모음 (최신순) ───────────────────────────────────
  eleventyConfig.addCollection("blogPosts", (api) =>
    api.getFilteredByTag("post")
      .filter((p) => p.data.draft !== true)
      .sort((a, b) => b.date - a.date)
  );

  // ── 카테고리 목록 ──────────────────────────────────────
  eleventyConfig.addCollection("categoryList", (api) => {
    const posts = api.getFilteredByTag("post")
      .filter((p) => p.data.draft !== true)
      .sort((a, b) => b.date - a.date);

    const labels = {};   // slug → 보여줄 이름
    const bucket = {};   // slug → 글 배열

    for (const p of posts) {
      const slug = p.data.category || "etc";
      const label = p.data.categoryLabel || slug;
      labels[slug] = labels[slug] || label;
      (bucket[slug] = bucket[slug] || []).push(p);
    }
    return Object.keys(bucket).map((slug) => ({
      slug, label: labels[slug], posts: bucket[slug], count: bucket[slug].length,
    }));
  });

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
