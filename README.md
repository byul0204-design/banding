# LK 홈타운 밴딩머신 홈페이지

메인 소개 페이지 + 블로그 + 관리자 모드 + 문의 폼을 갖춘 정적 사이트입니다.
[11ty(Eleventy)](https://www.11ty.dev/)로 빌드하고, GitHub에 올리면 Netlify가 자동으로 배포합니다.

글을 하나 추가하면 **글 페이지 · 블로그 목록 · 카테고리 · 메인 '블로그 새 글' · sitemap.xml · rss.xml** 이 모두 자동으로 다시 만들어집니다.

---

## 폴더 구조

```
├── eleventy.config.js        빌드 설정 (필터·컬렉션, 거의 손댈 일 없음)
├── netlify.toml              Netlify 배포 설정
├── package.json
└── src/                      ★ 사이트 원본은 전부 여기에
    ├── index.njk             메인 페이지 (문구·사양·FAQ·설치 사례)
    ├── index.11tydata.js     메인 페이지 검색엔진용 업체 정보
    ├── _data/
    │   ├── settings.json     전화번호·사업자 정보·인증 코드 (관리자 > 사이트 설정이 저장하는 곳)
    │   └── site.js           사이트 이름·주소·카테고리 목록
    ├── _includes/
    │   ├── base.njk          모든 페이지 공통 뼈대 (<head>, 머리말, 꼬리말)
    │   ├── header.njk        머리말 (상단 메뉴)
    │   ├── footer.njk        꼬리말 (사업자 정보, 하단 고정 버튼)
    │   ├── post.njk          글 상세 레이아웃
    │   ├── post-card.njk     블로그 목록의 글 카드
    │   └── cat-nav.njk       카테고리 탭
    ├── blog/
    │   ├── index.njk         블로그 목록 (12개씩 페이지 나눔)
    │   ├── category.njk      카테고리 페이지 (글이 있는 카테고리만 자동 생성)
    │   └── posts/            ★ 블로그 글 (.md)
    │       └── posts.11tydata.js   글 공통 규칙 (주소, 카테고리 이름 등)
    ├── assets/
    │   ├── css/style.css     디자인 (색상·글꼴은 맨 위 :root)
    │   ├── js/main.js        메뉴·탭·문의 폼 동작
    │   ├── img/              사이트 사진
    │   └── uploads/          관리자 모드에서 올린 이미지
    ├── admin/                관리자 모드 (Decap CMS)
    ├── thanks.njk  404.njk   문의 완료 · 페이지 없음 화면
    ├── sitemap.njk  rss.njk  robots.njk
    └── naver….html           네이버 소유확인 파일 (지우지 마세요)
```

`_site/`, `node_modules/` 는 빌드할 때 자동으로 생기므로 GitHub에 올리지 않습니다(`.gitignore`).

---

## 글 쓰는 방법

### 방법 1. 관리자 모드 (권장)

1. `https://내사이트/admin/` → GitHub으로 로그인
2. **블로그 글 → 새 글** → 제목, 글 주소(영문), 카테고리, 대표 이미지, 본문 입력
3. 오른쪽 위 **발행** → 1~2분 뒤 사이트에 반영

### 방법 2. 파일 직접 추가

`src/blog/posts/` 에 `.md` 파일을 만들고 GitHub에 올리면 됩니다.

```markdown
---
title: 학원 자판기 설치 후기
slug: academy-vending-machine          # 글 주소 → /blog/academy-vending-machine/
date: 2026-10-01T09:00:00+09:00
category: cases                        # product | cases | startup | tip | notice
thumbnail: /assets/uploads/사진.webp    # 대표 이미지 (선택)
coverAlt: 학원 복도에 놓인 음료 자판기    # 대표 이미지 설명 (선택)
description: 검색 결과에 보이는 요약. 80~150자 권장.
tags:
  - 학원 자판기
draft: false                           # true 면 사이트에 나오지 않음
---

본문을 마크다운으로 씁니다.
```

| 항목 | 설명 |
| --- | --- |
| `slug` | 글 주소. 비워 두면 파일 이름이 주소가 됩니다. **발행 후에는 바꾸지 마세요** (검색에 등록된 주소가 깨짐) |
| `thumbnail` 또는 `cover` | 대표 이미지. 둘 중 하나만 쓰면 됩니다 |
| `description` | 비워 두면 목록에는 본문 앞부분이 대신 보입니다 |
| `updated` | 글을 크게 고쳤을 때 수정일 (선택) |

팁
- 대표 이미지는 가로 1200px 정도의 가로형 사진, **WebP 또는 JPG로 500KB 이하**를 권장합니다. PNG 사진은 용량이 매우 커져 페이지가 느려집니다.
- 발행 후 네이버 서치어드바이저 → **요청 → 웹 페이지 수집**에 글 주소를 넣으면 더 빨리 노출됩니다.

### 카테고리 추가·변경

`src/_data/site.js` 의 `categories` 와 `src/admin/config.yml` 의 카테고리 선택지, **두 곳**을 같이 고치세요.

---

## 내 컴퓨터에서 미리보기 (Node.js 18 이상)

```bash
npm install          # 처음 한 번만
npm run dev          # http://localhost:8080  (파일을 저장하면 자동 새로고침)
npm run build        # _site 폴더만 만들기
```

관리자 모드를 로컬에서 테스트하려면 터미널을 하나 더 열어 `npm run cms` 실행 후 `http://localhost:8080/admin/` 접속.
(로컬에서 쓴 글은 내 컴퓨터 파일에만 저장되니, GitHub에 올려야 사이트에 반영돼요)

---

## 처음 설정 (한 번만)

### 1. Netlify 연결

1. [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project → GitHub** → 저장소 선택
2. 빌드 설정은 `netlify.toml` 에 들어 있으니 그대로 **Deploy**
   (Build command `npm run build` · Publish directory `_site` · Node 22)
3. 빌드가 실패하면 Netlify **Deploys** 탭의 로그에 이유가 나옵니다.

### 2. 관리자 로그인 (GitHub 로그인)

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
   - Homepage URL: 내 사이트 주소
   - Authorization callback URL: **`https://api.netlify.com/auth/done`**
2. **Client ID** 복사, **Generate a new client secret** 으로 Secret 생성 후 복사
3. Netlify → **Site configuration → Access & security → OAuth → Install provider → GitHub** → 붙여넣기
4. `https://내사이트/admin/` → **GitHub으로 로그인**

> 저장소에 쓰기 권한이 있는 GitHub 계정만 로그인할 수 있어요. 직원을 추가하려면 저장소 **Settings → Collaborators** 에서 초대하세요.

### 3. 사이트 설정

`/admin` → **사이트 설정 → 기본 정보 · 네이버 연동** 에서 입력 후 **발행**

- 상담 전화번호 (사이트의 모든 전화 버튼에 반영)
- 상담 가능 시간, 사업자 정보 (사이트 하단에 표시)
- 도메인을 연결했다면 사이트 주소 (비워 두면 Netlify 기본 주소 사용)

### 4. 네이버 서치어드바이저

1. [searchadvisor.naver.com](https://searchadvisor.naver.com) → 사이트 등록 → 소유확인
   (HTML 파일 방식은 `src/naver….html` 로 이미 되어 있고, HTML 태그 방식을 쓰려면 `content="..."` 값만 `/admin` 사이트 설정에 붙여넣기)
2. **요청 → 사이트맵 제출**: `https://내사이트/sitemap.xml`
3. **요청 → RSS 제출**: `https://내사이트/rss.xml`

구글도 같은 방식입니다 (Search Console → HTML 태그 → 구글 인증 코드 칸).

---

## 문의 폼

메인 페이지 문의 폼으로 들어온 내용은 Netlify → **Forms → contact** 에서 볼 수 있어요.
이메일 알림: **Site configuration → Notifications → Form submission notifications → Email**. (무료 플랜 월 100건)

---

## 내용 수정 위치

| 바꾸고 싶은 것 | 위치 |
| --- | --- |
| 전화번호, 사업자 정보, 상담 시간 | `/admin` → 사이트 설정 (코드 수정 불필요) |
| 메인 페이지 문구·사양·FAQ·설치 사례 | `src/index.njk` |
| 상단 메뉴 / 하단 정보 | `src/_includes/header.njk` / `footer.njk` |
| 글 상세 화면 (하단 상담 안내 등) | `src/_includes/post.njk` |
| 사진 | `src/assets/img/` |
| 색상·글꼴 | `src/assets/css/style.css` 맨 위 `:root` |
| 블로그 카테고리 | `src/_data/site.js` 와 `src/admin/config.yml` (두 곳 모두) |
| 메인에 보이는 최신 글 개수 | `src/_data/site.js` 의 `postsOnHome` |
