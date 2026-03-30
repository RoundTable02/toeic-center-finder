import { createServer } from "node:http";

const port = Number(process.env.MOCK_UPSTREAM_PORT ?? "4010");

const schedules = [
  {
    exam_code: "EXAM_2026_04_26",
    exam_day: "2026-04-26 00:00:00",
  },
  {
    exam_code: "EXAM_2026_05_31",
    exam_day: "2026-05-31 00:00:00",
  },
];

const centersByArea = {
  서울: [
    {
      center_code: "PBT_004",
      center_name: "서울 송파 테스트센터",
      address: "서울특별시 강동구 성내로 13",
    },
    {
      center_code: "PBT_015",
      center_name: "서울 강북 &amp; 테스트센터",
      address: "서울특별시 강북구 삼양로 173 ",
    },
    {
      center_code: "MISSING_COORD_001",
      center_name: "좌표 없는 시험장",
      address: "서울특별시 종로구 세종대로 1",
    },
  ],
  경기: [
    {
      center_code: "PBT_231",
      center_name: "안양 테스트센터",
      address: "경기도 안양시 동안구 평촌대로 212",
    },
  ],
  인천: [
    {
      center_code: "PBT_720",
      center_name: "인천 테스트센터",
      address: "인천광역시 부평구 부평대로 88",
    },
  ],
};

const sendJson = (response, statusCode, body) => {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(typeof body === "string" ? body : JSON.stringify(body));
};

const sendEmpty = (response, statusCode) => {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end("");
};

const server = createServer(async (request, response) => {
  if (
    request.method !== "POST" ||
    request.url !== "/receipt/centerMapProc.php"
  ) {
    response.writeHead(404);
    response.end("Not Found");
    return;
  }

  let body = "";
  for await (const chunk of request) {
    body += chunk;
  }

  const params = new URLSearchParams(body);
  const proc = params.get("proc");

  if (proc === "getReceiptScheduleList") {
    sendJson(response, 200, schedules);
    return;
  }

  if (proc === "getExamAreaInfo") {
    const examCode = params.get("examCode");
    const bigArea = params.get("bigArea");

    if (examCode === "FAIL_500") {
      sendJson(response, 500, { error: "Mock upstream failure" });
      return;
    }

    if (bigArea === "세종") {
      await new Promise((resolve) => {
        setTimeout(resolve, 3000);
      });
      sendJson(response, 200, [null, null, []]);
      return;
    }

    if (bigArea === "제주") {
      sendEmpty(response, 200);
      return;
    }

    sendJson(response, 200, [null, null, centersByArea[bigArea] ?? []]);
    return;
  }

  sendJson(response, 400, { error: "Unsupported proc" });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`[mock-upstream] listening on http://127.0.0.1:${port}`);
});
