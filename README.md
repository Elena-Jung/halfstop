# halfstop

halfstop은 사진에 촬영 정보(EXIF)를 프레임으로 붙여 내려받는 정적 웹 앱입니다.

JPEG, PNG, WebP 사진을 불러오면 카메라, 렌즈, 초점 거리, 조리개, 셔터 속도, ISO, 촬영
일시 같은 정보를 자동으로 읽어 프레임에 표시합니다. 여러 프리셋 중에서 고를 수 있고,
결과물은 원본 해상도의 JPEG로 브라우저 안에서 바로 내려받습니다. 사진 파일은 서버로
전송되지 않고 브라우저를 벗어나지 않습니다. 업로드 경로 자체가 없습니다.

HEIC, RAW 파일 열기와 여러 장을 한 번에 처리하는 기능, 브랜드 로고 표시, EXIF 값을 손으로
고치는 기능은 아직 없습니다.

## 개발

```
npm install
npm run dev       # 개발 서버
npm test          # 테스트(vitest run)
npm run build     # tsc --noEmit 뒤 dist/ 에 정적 파일 빌드
```

Node 22 이상이 필요합니다(`package.json`의 `engines` 참고).

## 배포 전에 컨테이너로 확인하기

`Dockerfile`은 두 단계로 되어 있습니다. 앞 단계는 Node로 `npm run build`를 돌리고, 뒤
단계는 `nginx:alpine`으로 그 결과물만 서빙합니다.

```
docker build -t halfstop .
docker run --rm -p 8080:80 halfstop
```

그 뒤 `http://localhost:8080`을 열어 확인합니다. docker가 없으면
`npm run build && npm run preview`로 빌드 결과물을 확인할 수 있습니다.

## 배포(Cloudflare Pages Git 연동)

Cloudflare Pages 가 저장소를 직접 보고 빌드해 올립니다. GitHub Actions 는 배포하지 않고
검사만 합니다(`.github/workflows/ci.yml`). 두 곳에서 배포하면 같은 사이트에 두 갈래로 들어가
서로 덮어쓰기 때문입니다. 이 방식이면 Cloudflare API 토큰을 GitHub 에 넣을 일이 없습니다.

Cloudflare 대시보드에서 Workers & Pages → Pages → 저장소 연결로 `Elena-Jung/halfstop` 을
고른 뒤 다음 값을 넣습니다.

| 칸 | 값 |
|---|---|
| 프로젝트 이름 | `halfstop` |
| 프로덕션 분기 | `main` |
| 프레임워크 미리 설정 | 없음 |
| 빌드 명령 | `npm run build` |
| 빌드 출력 디렉터리 | `dist` |
| 루트 디렉터리 | 비워 둡니다 |
| 환경 변수 | `NODE_VERSION` = `22` |

`NODE_VERSION` 을 빼면 빌드가 실패합니다. 이 프로젝트는 Node 22 이상이 필요한데 Cloudflare
의 기본 Node 는 그보다 낮습니다.

프로덕션 분기가 아닌 브랜치에 push 하면 미리 보기 배포가 따로 만들어집니다.

## 도메인 바꾸기

지금은 Cloudflare Pages의 기본 주소인 `https://halfstop.pages.dev`를 쓰고 있습니다.
실제 도메인이 정해지면 다음 세 파일에 적힌 주소를 바꾸십시오.

- `index.html`(`canonical`, `og:url`)
- `public/robots.txt`(`Sitemap` 줄)
- `public/sitemap.xml`(`loc`)

## Cloudflare Web Analytics 켜기

저장소에는 아무것도 추가하지 않습니다. beacon 토큰 같은 값도 코드에 넣지 않습니다.
Cloudflare 대시보드에서 Workers & Pages → 이 프로젝트 선택 → Metrics(지표) 탭의
Web Analytics 항목에서 Enable(사용)을 누르면 다음 배포부터 스크립트가 자동으로
끼워집니다. 이 순서는 실제로 대시보드에 들어가 눌러보지 못하고 Cloudflare 문서로만
확인했으므로, 화면 구성이 바뀌었다면 "Web Analytics"라는 이름으로 찾으십시오.

## 참고한 프로젝트

이 프로젝트는 [exif-frame.yuru.cam](https://exif-frame.yuru.cam/)
(`jeonghyeon-net/exif-frame`, GPL-3.0)을 참고했습니다. 코드를 가져오지는 않았고 화면
구성과 프리셋 발상만 참고했습니다. 원본 저장소와 줄 단위로 비교해 코드를 베끼지
않았음을 확인하지는 못했습니다.
