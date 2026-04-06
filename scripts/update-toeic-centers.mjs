#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DEFAULT_UPSTREAM_URL =
  "https://m.exam.toeic.co.kr/receipt/centerMapProc.php";
const DEFAULT_CSV_PATH = path.resolve(process.cwd(), "public/toeic_centers.csv");
const DEFAULT_REPORT_PATH = path.resolve(
  process.cwd(),
  "reports/toeic-centers-report.json",
);
const DEFAULT_STATE_PATH = path.resolve(
  process.cwd(),
  "reports/toeic-centers-state.json",
);

const HTML_ENTITY_MAP = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

const sortByCenterCode = (left, right) => left.centerCode.localeCompare(right.centerCode);

const decodeHtmlEntities = (text = "") =>
  text
    .replace(/&#(\d+);/g, (_, codePoint) =>
      String.fromCodePoint(Number.parseInt(codePoint, 10)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, codePoint) =>
      String.fromCodePoint(Number.parseInt(codePoint, 16)),
    )
    .replace(/&([a-z]+);/gi, (match, name) => HTML_ENTITY_MAP[name] ?? match);

const normalizeText = (text = "") =>
  decodeHtmlEntities(text).replace(/\s+/g, " ").trim();

const isValidCoordinate = (latText, lngText) => {
  const lat = Number.parseFloat(latText);
  const lng = Number.parseFloat(lngText);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= 30 &&
    lat <= 40 &&
    lng >= 120 &&
    lng <= 140
  );
};

const toCoordinateRecord = (latText, lngText) => ({
  latText,
  lngText,
  lat: Number.parseFloat(latText),
  lng: Number.parseFloat(lngText),
});

const parseCsvRows = (csvText) =>
  csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

export const parseCenterCsv = (csvText) => {
  const centers = new Map();

  for (const line of parseCsvRows(csvText)) {
    const [centerCode, latText, lngText] = line.split(",").map((part) => part.trim());

    if (!centerCode || !latText || !lngText) {
      continue;
    }

    centers.set(centerCode, {
      centerCode,
      ...toCoordinateRecord(latText, lngText),
      csvLine: `${centerCode},${latText},${lngText}`,
    });
  }

  return centers;
};

const stringifyCsv = (existingLines, newLines, hasBom, hasTrailingNewline) => {
  const baseText = existingLines.join("\n");

  if (newLines.length === 0) {
    const nextBody = hasTrailingNewline ? `${baseText}\n` : baseText;
    return hasBom ? `\uFEFF${nextBody}` : nextBody;
  }

  const nextBody = `${baseText}\n${newLines.join("\n")}\n`;
  return hasBom ? `\uFEFF${nextBody}` : nextBody;
};

const readTextIfExists = async (targetPath) => {
  try {
    return await readFile(targetPath, "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
};

const writeTextIfChanged = async (targetPath, nextText) => {
  const currentText = await readTextIfExists(targetPath);

  if (currentText === nextText) {
    return false;
  }

  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, nextText, "utf8");
  return true;
};

const formatUpstreamParams = (params) =>
  JSON.stringify({
    proc: params.proc ?? null,
    examCate: params.examCate ?? null,
    examCode: params.examCode ?? null,
    bigArea: params.bigArea ?? null,
    centerCode: params.centerCode ?? null,
  });

const summarizeResponseText = (text) =>
  text.replace(/\s+/g, " ").trim().slice(0, 200);

const postToToeicUpstream = async (fetchImpl, upstreamUrl, params) => {
  const requestContext = formatUpstreamParams(params);
  let response;

  try {
    response = await fetchImpl(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "Mozilla/5.0",
        Referer: "https://m.exam.toeic.co.kr/receipt/centerMap.php",
      },
      body: new URLSearchParams(params).toString(),
    });
  } catch (error) {
    throw new Error(`TOEIC upstream fetch failed for ${requestContext}`, {
      cause: error,
    });
  }

  if (!response.ok) {
    const responseText = (await response.text()).trim();
    const responseSummary = responseText
      ? ` | body: ${summarizeResponseText(responseText)}`
      : "";
    throw new Error(
      `TOEIC upstream request failed for ${requestContext}: ${response.status}${responseSummary}`,
    );
  }

  const responseText = (await response.text()).trim();

  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch (error) {
    throw new Error(
      `TOEIC upstream returned invalid JSON for ${requestContext}: ${summarizeResponseText(responseText)}`,
      { cause: error },
    );
  }
};

export const selectExamSchedules = (schedules) => {
  const selectedSchedules = [];

  for (const examDay of [...new Set(schedules.map((schedule) => schedule.exam_day.split(" ")[0]))].sort()) {
    const schedule = schedules.find((item) => item.exam_day.startsWith(examDay));

    if (!schedule?.exam_code) {
      continue;
    }

    selectedSchedules.push({
      examDay,
      examCode: schedule.exam_code,
    });
  }

  return selectedSchedules;
};

const toCenterMetadata = ({ centerCode, centerName, address, bigArea }) => ({
  centerCode,
  centerName: normalizeText(centerName),
  address: normalizeText(address),
  bigArea: normalizeText(bigArea),
});

const loadPreviousState = async (statePath) => {
  const rawState = await readTextIfExists(statePath);

  if (!rawState) {
    return new Map();
  }

  const parsedState = JSON.parse(rawState);
  const previousCenters = Array.isArray(parsedState?.centers) ? parsedState.centers : [];

  return new Map(
    previousCenters.map((center) => [
      center.centerCode,
      {
        centerCode: center.centerCode,
        centerName: normalizeText(center.centerName),
        address: normalizeText(center.address),
        bigArea: normalizeText(center.bigArea),
      },
    ]),
  );
};

const buildStateJson = (centersByCode) =>
  JSON.stringify(
    {
      version: 1,
      centers: [...centersByCode.values()].sort(sortByCenterCode),
    },
    null,
    2,
  ) + "\n";

const buildReportMarkdown = (report) => {
  const lines = [
    "# TOEIC Center Refresh Report",
    "",
    "## Summary",
    `- Scanned schedules: ${report.summary.scannedScheduleCount}`,
    `- Observed centers: ${report.summary.observedCenterCount}`,
    `- CSV centers: ${report.summary.csvCenterCount}`,
    `- New centers: ${report.summary.newCenterCount}`,
    `- Stale candidates: ${report.summary.staleCenterCount}`,
    `- Changed metadata: ${report.summary.changedMetadataCount}`,
    `- Manual review: ${report.summary.manualReviewCount}`,
    "",
    "## Scanned Schedules",
    ...report.scannedSchedules.map(
      (schedule) => `- ${schedule.examDay} (${schedule.examCode})`,
    ),
  ];

  const appendSection = (title, items, formatter) => {
    lines.push("", `## ${title}`);

    if (items.length === 0) {
      lines.push("- None");
      return;
    }

    lines.push(...items.map(formatter));
  };

  appendSection("New Centers", report.newCenters, (center) =>
    `- ${center.centerCode} ${center.centerName} | ${center.bigArea} | ${center.lat}, ${center.lng}`,
  );
  appendSection("Stale Candidates", report.staleCenters, (center) =>
    `- ${center.centerCode} ${center.centerName || "(unknown)"} | ${center.bigArea || "-"}`,
  );
  appendSection("Changed Metadata", report.changedMetadata, (change) =>
    `- ${change.centerCode} | prev: ${change.previous.centerName} / ${change.previous.address} | current: ${change.current.centerName} / ${change.current.address}`,
  );
  appendSection("Manual Review", report.manualReview, (item) =>
    `- ${item.centerCode} ${item.centerName} | reason: ${item.reason} | raw: ${item.rawLat ?? "null"}, ${item.rawLng ?? "null"}`,
  );

  return `${lines.join("\n")}\n`;
};

const buildReportJson = (report) => `${JSON.stringify(report, null, 2)}\n`;

const getMarkdownReportPath = (reportPath) =>
  reportPath.endsWith(".json") ? reportPath.replace(/\.json$/u, ".md") : `${reportPath}.md`;

const parseArgs = (argv) => {
  const options = {
    check: false,
    csvPath: DEFAULT_CSV_PATH,
    reportPath: DEFAULT_REPORT_PATH,
    reportPathExplicit: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--check") {
      options.check = true;
      continue;
    }

    if (value === "--csv") {
      options.csvPath = path.resolve(process.cwd(), argv[index + 1]);
      index += 1;
      continue;
    }

    if (value === "--report") {
      options.reportPath = path.resolve(process.cwd(), argv[index + 1]);
      options.reportPathExplicit = true;
      index += 1;
      continue;
    }

    throw new Error(`Unsupported argument: ${value}`);
  }

  return options;
};

export const runCenterRefresh = async ({
  fetchImpl = fetch,
  upstreamUrl = process.env.TOEIC_UPSTREAM_BASE_URL || DEFAULT_UPSTREAM_URL,
  csvPath = DEFAULT_CSV_PATH,
  reportPath = DEFAULT_REPORT_PATH,
  compareReportPath = reportPath,
  statePath = DEFAULT_STATE_PATH,
  check = false,
} = {}) => {
  const csvText = await readFile(csvPath, "utf8");
  const hasBom = csvText.startsWith("\uFEFF");
  const hasTrailingNewline = /\r?\n$/u.test(csvText);
  const existingCsvCenters = parseCenterCsv(csvText);
  const existingCsvLines = parseCsvRows(csvText);
  const previousStateByCode = await loadPreviousState(statePath);

  const schedules = await postToToeicUpstream(fetchImpl, upstreamUrl, {
    proc: "getReceiptScheduleList",
    examCate: "TOE",
  });

  if (!Array.isArray(schedules)) {
    throw new Error("Unexpected schedule payload from TOEIC upstream.");
  }

  const scannedSchedules = selectExamSchedules(schedules);
  const observedCentersByCode = new Map();

  for (const schedule of scannedSchedules) {
    const regionPayload = await postToToeicUpstream(fetchImpl, upstreamUrl, {
      proc: "getExamAreaInfo",
      examCate: "TOE",
      sbGoodsType1: "TOE",
      examCode: schedule.examCode,
      bigArea: "",
    });

    const bigAreas = Array.isArray(regionPayload?.[0])
      ? regionPayload[0].map((area) => area.big_area).filter(Boolean)
      : [];

    for (const bigArea of bigAreas) {
      const areaPayload = await postToToeicUpstream(fetchImpl, upstreamUrl, {
        proc: "getExamAreaInfo",
        examCate: "TOE",
        sbGoodsType1: "TOE",
        examCode: schedule.examCode,
        bigArea,
      });

      const centers = Array.isArray(areaPayload?.[2]) ? areaPayload[2] : [];

      for (const center of centers) {
        if (!center?.center_code || observedCentersByCode.has(center.center_code)) {
          continue;
        }

        observedCentersByCode.set(center.center_code, {
          centerCode: center.center_code,
          centerName: normalizeText(center.center_name),
          address: normalizeText(center.address),
          bigArea: normalizeText(bigArea),
          examCode: schedule.examCode,
          examDay: schedule.examDay,
        });
      }
    }
  }

  const newCenters = [];
  const manualReview = [];

  for (const observedCenter of [...observedCentersByCode.values()].sort(sortByCenterCode)) {
    if (existingCsvCenters.has(observedCenter.centerCode)) {
      continue;
    }

    const detailPayload = await postToToeicUpstream(fetchImpl, upstreamUrl, {
      proc: "getExamAreaInfo",
      examCate: "TOE",
      sbGoodsType1: "TOE",
      examCode: observedCenter.examCode,
      bigArea: observedCenter.bigArea,
      centerCode: observedCenter.centerCode,
    });

    const detail = Array.isArray(detailPayload?.[3]) ? detailPayload[3][0] : null;
    const rawLat = detail?.map_x ?? null;
    const rawLng = detail?.map_y ?? null;

    if (!rawLat || !rawLng || !isValidCoordinate(rawLat, rawLng)) {
      manualReview.push({
        centerCode: observedCenter.centerCode,
        centerName: observedCenter.centerName,
        address: observedCenter.address,
        bigArea: observedCenter.bigArea,
        examCode: observedCenter.examCode,
        examDay: observedCenter.examDay,
        rawLat,
        rawLng,
        reason: !rawLat || !rawLng ? "missing_coordinates" : "invalid_coordinates",
        mapUrlNaver: detail?.map_url_naver ?? null,
        mapUrlDaum: detail?.map_url_daum ?? null,
        mapUrlGoogle: detail?.map_url_google ?? null,
      });
      continue;
    }

    newCenters.push({
      centerCode: observedCenter.centerCode,
      centerName: observedCenter.centerName,
      address: observedCenter.address,
      bigArea: observedCenter.bigArea,
      examCode: observedCenter.examCode,
      examDay: observedCenter.examDay,
      lat: rawLat,
      lng: rawLng,
      csvLine: `${observedCenter.centerCode},${rawLat},${rawLng}`,
    });
  }

  const changedMetadata = [];

  for (const observedCenter of [...observedCentersByCode.values()].sort(sortByCenterCode)) {
    const previousCenter = previousStateByCode.get(observedCenter.centerCode);

    if (!previousCenter) {
      continue;
    }

    const currentMetadata = toCenterMetadata(observedCenter);

    if (
      previousCenter.centerName !== currentMetadata.centerName ||
      previousCenter.address !== currentMetadata.address ||
      previousCenter.bigArea !== currentMetadata.bigArea
    ) {
      changedMetadata.push({
        centerCode: observedCenter.centerCode,
        previous: previousCenter,
        current: currentMetadata,
      });
    }
  }

  const staleCenters = [...existingCsvCenters.keys()]
    .filter((centerCode) => !observedCentersByCode.has(centerCode))
    .sort()
    .map((centerCode) => {
      const knownCenter = previousStateByCode.get(centerCode);

      return {
        centerCode,
        centerName: knownCenter?.centerName ?? null,
        address: knownCenter?.address ?? null,
        bigArea: knownCenter?.bigArea ?? null,
      };
    });

  const mergedStateByCode = new Map(previousStateByCode);

  for (const observedCenter of observedCentersByCode.values()) {
    mergedStateByCode.set(observedCenter.centerCode, toCenterMetadata(observedCenter));
  }

  const nextCsvText = stringifyCsv(
    existingCsvLines,
    newCenters.map((center) => center.csvLine),
    hasBom,
    hasTrailingNewline,
  );
  const nextStateText = buildStateJson(mergedStateByCode);
  const pendingReport = {
    version: 1,
    summary: {
      scannedScheduleCount: scannedSchedules.length,
      observedCenterCount: observedCentersByCode.size,
      csvCenterCount: existingCsvCenters.size,
      newCenterCount: newCenters.length,
      staleCenterCount: staleCenters.length,
      changedMetadataCount: changedMetadata.length,
      manualReviewCount: manualReview.length,
    },
    scannedSchedules,
    newCenters,
    staleCenters,
    changedMetadata,
    manualReview,
  };

  const stableReport = {
    ...pendingReport,
    summary: {
      ...pendingReport.summary,
      csvCenterCount: existingCsvCenters.size + newCenters.length,
      newCenterCount: 0,
      changedMetadataCount: 0,
    },
    newCenters: [],
    changedMetadata: [],
  };
  const nextReportText = buildReportJson(stableReport);
  const nextMarkdownText = buildReportMarkdown(stableReport);
  const markdownReportPath = getMarkdownReportPath(reportPath);
  const compareMarkdownReportPath = getMarkdownReportPath(compareReportPath);

  const currentCsvText = await readTextIfExists(csvPath);
  const currentReportText = await readTextIfExists(compareReportPath);
  const currentStateText = await readTextIfExists(statePath);
  const currentMarkdownText = await readTextIfExists(compareMarkdownReportPath);

  const hasDiff =
    currentCsvText !== nextCsvText ||
    currentReportText !== nextReportText ||
    currentStateText !== nextStateText ||
    currentMarkdownText !== nextMarkdownText;

  if (!check) {
    await writeTextIfChanged(csvPath, nextCsvText);
    await writeTextIfChanged(reportPath, nextReportText);
    await writeTextIfChanged(markdownReportPath, nextMarkdownText);
    await writeTextIfChanged(statePath, nextStateText);
  }

  return {
    changed: hasDiff,
    pendingReport,
    report: stableReport,
    csvPath,
    reportPath,
    markdownReportPath,
    statePath,
  };
};

const runCli = async () => {
  const options = parseArgs(process.argv.slice(2));
  const result = await runCenterRefresh({
    csvPath: options.csvPath,
    reportPath: options.reportPath,
    compareReportPath:
      options.check && options.reportPathExplicit ? DEFAULT_REPORT_PATH : options.reportPath,
    statePath: DEFAULT_STATE_PATH,
    check: options.check,
  });

  if (options.check && options.reportPathExplicit) {
    await writeTextIfChanged(options.reportPath, buildReportJson(result.pendingReport));
    await writeTextIfChanged(
      getMarkdownReportPath(options.reportPath),
      buildReportMarkdown(result.pendingReport),
    );
  }

  console.log(
    JSON.stringify(
      {
        mode: options.check ? "check" : "refresh",
        changed: result.changed,
        csvPath: result.csvPath,
        reportPath: result.reportPath,
        markdownReportPath: result.markdownReportPath,
        statePath: result.statePath,
        summary: result.report.summary,
        pendingSummary: result.pendingReport.summary,
      },
      null,
      2,
    ),
  );

  if (options.check && result.changed) {
    process.exitCode = 1;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error : String(error));
    process.exitCode = 1;
  });
}
