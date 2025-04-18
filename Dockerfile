# 통합 Dockerfile
FROM node:18 as build

# React 앱 빌드
WORKDIR /app/frontend
COPY location-map-app/package*.json ./
RUN npm install
COPY location-map-app/ ./
ARG REACT_APP_GOOGLE_MAPS_API_KEY
ENV REACT_APP_GOOGLE_MAPS_API_KEY=$REACT_APP_GOOGLE_MAPS_API_KEY
RUN npm run build

# API 서버 설정 (여기서는 의존성만 복사하고 설치)
WORKDIR /app/api
COPY toeic-api/package*.json ./
RUN npm install
COPY toeic-api/ ./

# 최종 이미지
FROM nginx:alpine

# Node.js 설치
RUN apk add --update --no-cache nodejs npm curl

# Nginx 설정 및 빌드된 React 앱 복사
COPY --from=build /app/frontend/build /usr/share/nginx/html/location-map-app
COPY location-map-app/nginx.conf /etc/nginx/conf.d/default.conf

# API 서버 설치 (node_modules 없이)
WORKDIR /app/api
COPY toeic-api/package*.json ./
COPY toeic-api/*.js ./

# 로그 디렉토리 생성
RUN mkdir -p /var/log/api /var/log/nginx

# 시작 스크립트 복사
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 80 4000
CMD ["/start.sh"]