/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const axios = require("axios");
const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(cors({origin: true}));
app.use(bodyParser.urlencoded({extended: true})); // Form Data 파싱

app.get("/toeic", async (req, res) => {
  try {
    // TOEIC API에 전달할 데이터 설정
    const formData = new URLSearchParams();
    formData.append("proc", "getReceiptScheduleList");
    formData.append("examCate", "TOE");

    // API 요청
    const response = await axios.post(
        "https://m.exam.toeic.co.kr/receipt/centerMapProc.php",
        formData.toString(), // Form Data 형식으로 변환
        {
          headers: {
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://m.exam.toeic.co.kr",
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
    );

    res.json(response.data); // 받은 데이터 반환
  } catch (error) {
    console.error("Error fetching TOEIC data:", error);
    res.status(500).json({error: "Failed to fetch data"});
  }
});

app.get("/toeic/centers", async (req, res) => {
  try {
    const {examCode, bigArea} = req.query;

    // TOEIC API에 전달할 데이터 설정
    const formData = new URLSearchParams();
    formData.append("proc", "getExamAreaInfo");
    formData.append("examCate", "TOE");
    formData.append("examCode", examCode);
    formData.append("bigArea", bigArea);
    formData.append("sbGoodsType1", "TOE");

    // API 요청
    const response = await axios.post(
        "https://m.exam.toeic.co.kr/receipt/centerMapProc.php",
        formData.toString(), // Form Data 형식으로 변환
        {
          headers: {
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://m.exam.toeic.co.kr",
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
    );

    res.json(response.data); // 받은 데이터 반환
  } catch (error) {
    console.error("Error fetching TOEIC data:", error);
    res.status(500).json({error: "Failed to fetch data"});
  }
});

// Firebase 함수로 등록
exports.api = functions.https.onRequest(app);

