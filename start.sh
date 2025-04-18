#!/bin/sh
# 디버깅을 위해 명령어 출력 켜기
set -ex

# 로그 디렉토리 생성
mkdir -p /var/log/nginx
mkdir -p /var/log/api

# API 서버 모듈 설치 및 시작
cd /app/api
echo "Installing API server dependencies..."
npm install --production

echo "Starting API server..."
node index.js > /var/log/api/api.log 2>&1 &
API_PID=$!

# API 서버 정상 작동 확인을 위한 대기
echo "Waiting for API server to be ready..."
sleep 5

# 실제로 서버가 돌아가고 있는지 확인 (Alpine에서는 ps를 다르게 사용)
if ! ps | grep -v grep | grep -q $API_PID; then
  echo "API server process died! Check logs:"
  cat /var/log/api/api.log
  exit 1
fi

# 서버 상태 확인
for i in $(seq 1 12); do
  if curl -s http://127.0.0.1:4000/api/health > /dev/null; then
    echo "API server is ready! (Attempt $i)"
    break
  fi
  
  # 마지막 시도에서도 실패하면 로그 출력
  if [ $i -eq 12 ]; then
    echo "API server failed to start within timeout. Check logs:"
    cat /var/log/api/api.log
    # 서버 프로세스가 살아있는지 다시 확인 (Alpine용 명령어)
    ps
    netstat -tulpn | grep LISTEN
  else
    echo "Waiting for API server... (Attempt $i/12)"
    sleep 5
  fi
done

# Nginx 설정 파일 권한 확인 및 문법 검사
nginx -t

# Nginx 시작
echo "Starting Nginx..."
nginx -g 'daemon off;'