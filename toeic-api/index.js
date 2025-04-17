const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true }));
app.use(bodyParser.urlencoded({ extended: true }));

// 시험 일정 리스트
app.get("/api/toeic", async (req, res) => {
  try {
    const formData = new URLSearchParams();
    formData.append("proc", "getReceiptScheduleList");
    formData.append("examCate", "TOE");

    const response = await axios.post(
      "https://m.exam.toeic.co.kr/receipt/centerMapProc.php",
      formData.toString(),
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Referer": "https://m.exam.toeic.co.kr",
          "Content-Type": "application/x-www-form-urlencoded",
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching TOEIC schedule:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// 시험장 정보
app.get("/api/toeic/centers", async (req, res) => {
  try {
    const { examCode, bigArea } = req.query;

    const formData = new URLSearchParams();
    formData.append("proc", "getExamAreaInfo");
    formData.append("examCate", "TOE");
    formData.append("examCode", examCode);
    formData.append("bigArea", bigArea);
    formData.append("sbGoodsType1", "TOE");

    const response = await axios.post(
      "https://m.exam.toeic.co.kr/receipt/centerMapProc.php",
      formData.toString(),
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Referer": "https://m.exam.toeic.co.kr",
          "Content-Type": "application/x-www-form-urlencoded",
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching TOEIC center info:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.listen(PORT, () => {
  console.log(`TOEIC API server listening on port ${PORT}`);
});
