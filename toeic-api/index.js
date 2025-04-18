const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 4000;

// 타임아웃 값을 늘려서 설정
const axiosInstance = axios.create({
  timeout: 30000, // 30초로 타임아웃 설정
  headers: {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Referer": "https://m.exam.toeic.co.kr",
    "Content-Type": "application/x-www-form-urlencoded",
  }
});

// CORS 설정 - 모든 출처 허용 (개발 및 배포 환경)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 서버 상태 확인 엔드포인트
app.get("/api/health", (req, res) => {
  console.log("Health check requested");
  res.json({ status: "ok", message: "TOEIC API server is running", timestamp: new Date().toISOString() });
});

// 시험 일정 리스트
app.get("/api/toeic", async (req, res) => {
  console.log("Request received: /api/toeic");
  try {
    const formData = new URLSearchParams();
    formData.append("proc", "getReceiptScheduleList");
    formData.append("examCate", "TOE");

    console.log('요청 시작: /api/toeic');
    const response = await axiosInstance.post(
      "https://m.exam.toeic.co.kr/receipt/centerMapProc.php",
      formData.toString()
    );
    console.log('응답 수신 완료: /api/toeic');

    if (response.data) {
      return res.json(response.data);
    } else {
      return res.status(404).json({ error: "No data received from TOEIC server" });
    }
  } catch (error) {
    console.error("Error fetching TOEIC schedule:", error);
    return res.status(500).json({ 
      error: "Failed to fetch data", 
      message: error.message,
      code: error.code
    });
  }
});

// 시험장 정보
app.get("/api/toeic/centers", async (req, res) => {
  console.log("Request received: /api/toeic/centers");
  try {
    const { examCode, bigArea } = req.query;
    
    if (!examCode || !bigArea) {
      return res.status(400).json({ error: "Missing required parameters: examCode or bigArea" });
    }

    const formData = new URLSearchParams();
    formData.append("proc", "getExamAreaInfo");
    formData.append("examCate", "TOE");
    formData.append("examCode", examCode);
    formData.append("bigArea", bigArea);
    formData.append("sbGoodsType1", "TOE");

    console.log(`요청 시작: /api/toeic/centers - examCode: ${examCode}, bigArea: ${bigArea}`);
    const response = await axiosInstance.post(
      "https://m.exam.toeic.co.kr/receipt/centerMapProc.php",
      formData.toString()
    );
    console.log('응답 수신 완료: /api/toeic/centers');

    if (response.data) {
      return res.json(response.data);
    } else {
      return res.status(404).json({ error: "No data received from TOEIC server" });
    }
  } catch (error) {
    console.error("Error fetching TOEIC center info:", error);
    return res.status(500).json({ 
      error: "Failed to fetch data", 
      message: error.message,
      code: error.code
    });
  }
});

// 서버 실행 시 모든 네트워크 인터페이스에서 리슨
app.listen(PORT, '0.0.0.0', () => {
  console.log(`TOEIC API server listening on port ${PORT} (http://0.0.0.0:${PORT})`);
});
