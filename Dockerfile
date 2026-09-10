# syntax=docker/dockerfile:1

# 1단계: Node로 정적 파일을 빌드합니다.
FROM node:22-alpine AS build
WORKDIR /app

# 의존성 설치는 소스가 바뀌어도 다시 돌 필요가 없으므로 먼저 캐시되게 둡니다.
COPY package.json package-lock.json ./
RUN npm ci

# node_modules, .git, dist 같은 것을 함께 넘기지 않도록 필요한 것만 고릅니다.
COPY tsconfig.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src

RUN npm run build

# 2단계: 빌드 결과물만 정적으로 서빙합니다. 새 npm 의존성이 필요 없는
# 공개 이미지를 씁니다.
FROM nginx:alpine AS serve
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
