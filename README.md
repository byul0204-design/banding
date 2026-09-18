# LK 홈타운 밴딩머신 — 11ty 블로그 구조

마크다운 파일 하나만 추가해서 푸시하면 **본문 페이지 · 블로그 목록 · 카테고리 · 메인 최신글 · sitemap.xml · rss.xml이 전부 자동으로 다시 만들어집니다.**
기존 주소 구조(`/blog/글주소/`, `/blog/category/product/`)를 그대로 유지하므로 이미 색인된 링크가 끊기지 않습니다.

```
├── eleventy.config.js          빌드 설정 (거의 손댈 일 없음)
├── netlify.toml                Netlify 빌드 설정
├── package.json
└── src/
    ├── _data/site.js           사이트 이름·주소·전화번호  ← 여기 먼저 확인
    ├── _includes/
    │   ├── base.njk            공통 뼈대 (header/footer 붙여넣는 곳)
    │   └── post.njk            글 상세 레이아웃 + JSON-LD
    ├── index.njk               메인 페이지
    ├── blog/
    │   ├── index.njk           블로그 목록
    │   ├── category.njk        카테고리 페이지 (자동 생성)
    │   └── posts/              ★ 글은 전부 여기에
    │       ├── posts.json      글 공통 설정 (주소 규칙 등)
    │       ├── _TEMPLATE.md.txt   새 글 쓸 때 복사해 쓰는 틀
    │       └── *.md            실제 글
    ├── admin/                  Decap CMS (선택)
    ├── assets/                 이미지·CSS·JS
    ├── sitemap.njk  rss.njk  robots.txt
```

---

## 1. 옮겨 붙이는 작업 (한 번만)

지금 사이트의 디자인을 그대로 살리려면 세 가지를 옮기시면 됩니다.

**① 이미지와 CSS**
기존 저장소의 `assets/` 폴더를 통째로 `src/assets/` 로 복사하세요.
`src/assets/css/style.css` 는 제가 임시로 만든 파일이니 **기존 파일로 덮어쓰시고**, 그 뒤에 이 임시 파일의 블로그용 클래스(`.post-list`, `.post-body`, `.blog-filter` 등)만 필요한 만큼 이어 붙이시면 됩니다.

**② 헤더와 푸터**
`src/_includes/base.njk` 안에 표시해 둔 두 자리에 기존 `index.html`의 `<header>…</header>` 와 `<footer>…</footer>` 를 그대로 붙여넣으세요.
앵커 링크만 절대경로로 바꿔야 합니다. `href="#products"` → `href="/#products"`

**③ 메인 페이지**
`src/index.njk` 의 표시된 자리에 기존 `index.html`의 `<main>` 안쪽 내용을 붙여넣으세요.
맨 아래 '블로그 새 글' 세 칸은 이미 자동 반복문으로 넣어 두었으니, 기존 HTML의 그 부분은 빼고 붙이시면 됩니다.

> `src/_data/site.js` 의 주소·전화번호·인증코드와 `src/_includes/base.njk` 의 네이버·구글 소유확인 메타태그도 확인해 주세요.

---

## 2. 내 컴퓨터에서 확인하기

```bash
npm install          # 처음 한 번만
npm run dev          # http://localhost:8080
```

`npm run dev` 를 켜두면 파일을 저장할 때마다 화면이 바로 갱신됩니다.

---

## 3. Netlify 설정 바꾸기

이제 빌드 단계가 생겼으므로 Netlify 설정을 한 번 바꿔야 합니다.
`netlify.toml` 에 이미 들어 있어서 보통은 자동으로 잡히지만, 화면에서 직접 확인하시려면:

| 항목 | 값 |
| --- | --- |
| Build command | `npm run build` |
| Publish directory | `_site` |
| Node version | 22 |

푸시하면 Netlify가 빌드해서 배포합니다. 실패하면 Deploys 탭의 로그에 이유가 나옵니다.

---

## 4. 글 발행하기 (매일 하는 일)

```bash
cp src/blog/posts/_TEMPLATE.md.txt src/blog/posts/새-글-주소.md
# 내용 작성 후
git add . && git commit -m "글: 제목" && git push
```

`새-글-주소.md` 의 파일 이름이 그대로 주소가 됩니다.
`/blog/새-글-주소/` 로 열립니다. 영문 소문자와 하이픈을 쓰세요.

머리말(front matter)에서 챙길 것은 다섯 가지입니다.

| 항목 | 설명 |
| --- | --- |
| `title` | 제목 |
| `description` | 요약. 검색 결과에 그대로 보입니다 |
| `date` | 발행일 `2026-09-20` |
| `category` | `product` / `startup` / `case` / `tip` |
| `cover` | 대표 사진 경로 |

`draft: true` 를 넣으면 빌드에서 빠져 사이트에 나오지 않습니다.
카테고리를 새로 만들고 싶으면 `src/blog/posts/posts.json` 의 이름표 목록에 한 줄만 추가하면 됩니다.

**발행 후 30초**
네이버 서치어드바이저 → 요청 → 웹페이지 수집에 그날 글 주소를 넣으세요.
sitemap과 RSS는 빌드 때 자동으로 갱신되므로 따로 손댈 필요가 없습니다.

---

## 5. 브라우저에서 글쓰기 (선택)

`src/admin/` 에 Decap CMS를 넣어 두었습니다. 설정하면 `/admin/` 에서 글을 쓰고 저장만 해도 깃허브에 커밋이 올라가서, 휴대폰으로도 발행할 수 있습니다.

다만 **인증 설정이 따로 필요합니다.** 기본값인 `git-gateway` 는 Netlify Identity를 켜야 동작하는데, 신규 사이트에서는 활성화가 제한되는 경우가 있습니다. 그럴 때는 `src/admin/config.yml` 의 backend를 GitHub 방식으로 바꾸고 OAuth 앱을 따로 연결해야 합니다.

번거로우시면 이 폴더는 지우고 4번 방식(파일 추가 후 푸시)만 쓰셔도 발행에는 아무 문제가 없습니다. 지금 사이트에 이미 `/admin/` 페이지가 있다면 충돌하지 않도록 둘 중 하나만 남기세요.

---

## 6. 확인 목록

옮긴 뒤 아래를 한 번씩 열어 보세요.

- `/blog/` 목록에 글 3개가 보이는지
- `/blog/lk-hometown-vending-machine/` 등 기존 주소가 그대로 열리는지
- `/blog/category/product/` 가 열리는지
- `/sitemap.xml` 에 모든 글이 들어 있는지
- `/rss.xml` 이 열리는지
- 메인 하단 '블로그 새 글'이 최신 3개로 채워지는지

---

## 참고

`src/blog/posts/` 의 글 3편은 현재 운영 중인 사이트를 보고 다시 옮겨 적은 것입니다.
원문과 문장이 다를 수 있으니, 기존 HTML에 있던 본문으로 바꿔 두시는 편이 좋습니다.
