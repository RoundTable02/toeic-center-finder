# 리액트용 Dockerfile (빌드 전용)
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG REACT_APP_GOOGLE_MAPS_API_KEY
ENV REACT_APP_GOOGLE_MAPS_API_KEY=$REACT_APP_GOOGLE_MAPS_API_KEY
# 아래 줄 수정 필요 - nginx 경로 설정을 위한 PUBLIC_URL 추가
RUN REACT_APP_PUBLIC_URL="/location-map-app" npm run build
