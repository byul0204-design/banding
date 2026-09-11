# LK 홈타운 밴딩머신 홈페이지

메인 소개 페이지 + 블로그 + 관리자 모드 + 문의 폼을 갖춘 정적 사이트입니다.
GitHub에 올리고 Netlify로 배포하며, 글은 `/admin`에서 작성합니다.

---

## 폴더 구조

```
├── index.html            메인 페이지 (머리말·꼬리말은 블로그에도 그대로 쓰여요)
├── assets/
│   ├── css/style.css     디자인
│   ├── js/main.js        메뉴·탭·문의 폼 동작
│   ├── img/              사이트 사진
│   └── uploads/          관리자 모드에서 올린 이미지가 저장되는 곳
├── content/posts/        블로그 글 (관리자 모드가 여기에 저장해요)
├── data/settings.json    사이트 설정 (전화번호·사업자 정보·네이버 인증 코드)
├── admin/                관리자 모드 (Decap CMS)
│   ├── index.html
│   └── config.yml        ← 저장소 이름 1줄만 수정
├── build.mjs             블로그 페이지·sitemap·RSS를 만드는 빌드 스크립트
├── netlify.toml          Netlify 배포 설정
└── package.json
```

`_site/`, `node_modules/` 폴더는 자동으로 만들어지므로 GitHub에 올리지 않아도 됩니다(.gitignore에 포함).

---

## 1단계. GitHub에 올리기

1. GitHub에서 새 저장소를 만듭니다. (예: `lk-vending`)
2. 이 폴더의 파일을 모두 업로드합니다. (웹에서 "Add file → Upload files"로 끌어다 놓아도 됩니다)
3. `admin/config.yml`을 열어 아래 줄을 본인 저장소로 바꿉니다.

```yaml
repo: YOUR-GITHUB-ID/YOUR-REPO-NAME   →   repo: 내아이디/lk-vending
```

## 2단계. Netlify에 연결하기

1. [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project → GitHub** → 저장소 선택
2. 빌드 설정은 `netlify.toml`에 들어 있으니 그대로 **Deploy** 를 누릅니다.
3. 1~2분 뒤 `https://무언가.netlify.app` 주소가 생깁니다.
   사이트 이름은 **Site configuration → Change site name** 에서 바꿀 수 있어요.

## 3단계. 관리자 로그인 연결 (GitHub 로그인)

Netlify Identity는 2025년부터 신규 사용이 권장되지 않아, GitHub 계정으로 로그인하는 방식을 씁니다.

1. GitHub → 오른쪽 위 프로필 → **Settings → Developer settings → OAuth Apps → New OAuth App**
   - Application name: 아무 이름 (예: LK 관리자)
   - Homepage URL: 내 사이트 주소 (예: `https://lk-vending.netlify.app`)
   - Authorization callback URL: **`https://api.netlify.com/auth/done`**
2. 만들어진 앱에서 **Client ID** 복사, **Generate a new client secret** 으로 Secret 생성 후 복사
3. Netlify → 내 사이트 → **Site configuration → Access & security → OAuth → Install provider**
   → **GitHub** 선택 → Client ID, Secret 붙여넣기
4. `https://내사이트/admin/` 접속 → **GitHub으로 로그인**

> 저장소에 쓰기 권한이 있는 GitHub 계정만 로그인할 수 있어요. 직원에게 권한을 주려면 저장소 **Settings → Collaborators** 에서 초대하세요.

## 4단계. 사이트 설정 입력

`/admin` → **사이트 설정 → 기본 정보 · 네이버 연동** 에서 입력 후 **발행(Publish)**

- 상담 전화번호 (사이트의 모든 전화 버튼에 반영)
- 상담 가능 시간
- 사업자 정보 (상호·대표자·사업자등록번호·주소·이메일 → 사이트 하단에 표시)
- 도메인을 연결했다면 사이트 주소

## 5단계. 네이버 서치어드바이저 연동

1. [searchadvisor.naver.com](https://searchadvisor.naver.com) → **웹마스터 도구 → 사이트 등록** → 내 사이트 주소 입력
2. 소유확인 방법에서 **HTML 태그** 선택 → 아래 형태의 태그가 나옵니다.
   ```html
   <meta name="naver-site-verification" content="1a2b3c4d5e..." />
   ```
3. `content="..."` 따옴표 **안의 값만** 복사 → `/admin` → 사이트 설정 → **네이버 사이트 인증 코드**에 붙여넣고 발행
4. 1~2분 뒤(재배포 완료 후) 서치어드바이저에서 **소유확인** 클릭
5. **요청 → 사이트맵 제출**: `https://내사이트/sitemap.xml`
6. **요청 → RSS 제출**: `https://내사이트/rss.xml`
7. 새 글을 쓴 뒤 빨리 노출시키고 싶다면 **요청 → 웹 페이지 수집**에 글 주소를 넣으세요.

구글도 같은 방식입니다(Search Console → HTML 태그 → 구글 인증 코드 칸).

---

## 글 쓰는 방법

1. `/admin` → **블로그 글 → 새 글**
2. 제목, 글 주소(영문, 예: `academy-vending-machine`), 카테고리, 대표 이미지, 본문 입력
3. 오른쪽 위 **발행** → 1~2분 뒤 사이트에 자동 반영

팁
- **글 주소**는 한 번 발행한 뒤에는 바꾸지 마세요. 검색에 등록된 주소가 깨집니다.
- **요약 설명**을 직접 쓰면 검색 결과에 더 깔끔하게 보여요. (80~150자)
- 대표 이미지는 가로형 JPG, 가로 1200px 정도를 권장해요. 사진 용량이 크면 페이지가 느려지니 2MB 이하로 올려 주세요.
- 공개 전에 숨기고 싶으면 **임시저장** 스위치를 켜세요.

## 문의 폼 확인

메인 페이지 하단 문의 폼으로 들어온 내용은 Netlify → 내 사이트 → **Forms → contact** 에서 볼 수 있어요.
이메일 알림: **Site configuration → Notifications → Form submission notifications → Add notification → Email**.
(무료 플랜 기준 월 100건)

## 도메인 연결 (선택)

Netlify → **Domain management → Add a domain** → 안내에 따라 DNS 설정.
연결 후 `/admin` 사이트 설정의 **사이트 주소**에 `https://새도메인` 을 넣고, 네이버 서치어드바이저에도 새 주소로 다시 등록하세요.

---

## 내 컴퓨터에서 미리보기 (선택, Node.js 18 이상 필요)

```bash
npm install
npm run dev          # http://localhost:8080
```

관리자 모드를 로컬에서 테스트하려면 터미널을 하나 더 열어 `npm run cms` 실행 후 `http://localhost:8080/admin/` 접속.
(로컬에서 쓴 글은 내 컴퓨터 파일에만 저장되니, GitHub에 올려야 사이트에 반영돼요)

## 내용 수정 위치

| 바꾸고 싶은 것 | 위치 |
| --- | --- |
| 전화번호, 사업자 정보, 상담 시간 | `/admin` → 사이트 설정 (코드 수정 불필요) |
| 메인 페이지 문구·사양·FAQ | `index.html` |
| 설치 사례 사진 | `assets/img/` 에 사진 추가 후 `index.html` 의 `#cases` 부분 |
| 색상·글꼴 | `assets/css/style.css` 맨 위 `:root` |
| 블로그 카테고리 | `admin/config.yml` 과 `build.mjs` 의 CATEGORIES (두 곳 모두) |
