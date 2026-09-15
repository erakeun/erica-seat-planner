(() => {
  "use strict";

  const STORAGE_KEY = "erica-seat-planner:v1";
  const SCENE = { width: 1600, height: 900 };
  const FULL_VIEW = { x: 0, y: 0, width: SCENE.width, height: SCENE.height, zoom: 1 };
  const GROUP_COLORS = ["#1268b3", "#7b4ca0", "#b55725", "#2b7a65", "#8f3e55", "#556b2f"];
  const UNITS_PER_METER = 100;
  const mmToUnits = (millimeters) => (millimeters / 1000) * UNITS_PER_METER;
  const curveBow = (t) => 4 * t * (1 - t);
  const upperTableY = (t) => 390 - 24 * curveBow(t);
  const lowerTableY = (t) => 640 + 24 * curveBow(t);
  const STAFF_TABLE_MODULES = Object.freeze(Array.from({ length: 7 }, (_, index) => {
    const width = 106;
    const gap = 5;
    const x = 505 + index * (width + gap);
    return Object.freeze({
      id: `STAFF-TABLE-${String(index + 1).padStart(2, "0")}`,
      x,
      y: 185,
      width,
      depth: mmToUnits(800),
      seatIds: Object.freeze([
        `STAFF-${String(index * 2 + 1).padStart(2, "0")}`,
        `STAFF-${String(index * 2 + 2).padStart(2, "0")}`,
      ]),
    });
  }));

  const FIELD_MEASUREMENTS = Object.freeze([
    Object.freeze({ dimensionId: "MAIN-UPPER-DEPTH", valueMm: 800, source: "IMG_2248(1).jpg", meaning: "상단 메인 장변 상판 앞뒤 깊이", anchorA: "상판 안쪽 가장자리", anchorB: "상판 바깥쪽 가장자리", sourceType: "user-marked measurement", endpointStatus: "resolved", applicationStatus: "geometry-applied", valueConfidence: "high", geometryConfidence: "high" }),
    Object.freeze({ dimensionId: "MAIN-LOWER-DEPTH", valueMm: 800, source: "IMG_2248(1).jpg", meaning: "하단 메인 장변 상판 앞뒤 깊이", anchorA: "상판 안쪽 가장자리", anchorB: "상판 바깥쪽 가장자리", sourceType: "user-marked measurement", endpointStatus: "resolved", applicationStatus: "geometry-applied", valueConfidence: "high", geometryConfidence: "high" }),
    Object.freeze({ dimensionId: "STAFF-MODULE-DEPTH", valueMm: 800, source: "IMG_2245(1).jpg", meaning: "수행원 대표 테이블 모듈 앞뒤 깊이", anchorA: "대표 모듈 안쪽 가장자리", anchorB: "대표 모듈 바깥쪽 가장자리", sourceType: "user-marked measurement", endpointStatus: "resolved", applicationStatus: "geometry-applied", valueConfidence: "high", geometryConfidence: "medium" }),
    Object.freeze({ dimensionId: "SCREEN-END-CLEARANCE", valueMm: 1000, source: "IMG_2249(2).jpg", meaning: "오른쪽 열린 끝의 상판 끝과 스크린 쪽 벽 사이", anchorA: "메인 장변 상판의 오른쪽 외곽", anchorB: "스크린 쪽 벽 안쪽 면", sourceType: "user-marked measurement", endpointStatus: "resolved", applicationStatus: "geometry-applied", valueConfidence: "high", geometryConfidence: "medium" }),
    Object.freeze({ dimensionId: "HEAD-WALL-CLEARANCE", valueMm: 1800, source: "IMG_2241(1).jpg", meaning: "엠블럼 벽 쪽 상석 뒤 표시 구간", anchorA: "엠블럼 벽면", anchorB: "의자 등받이 또는 상판 외곽 - 사진상 불명확", sourceType: "user-marked measurement", endpointStatus: "unresolved", applicationStatus: "reference-only", valueConfidence: "high", geometryConfidence: "low" }),
    Object.freeze({ dimensionId: "HEAD-DOOR-WALL-CLEARANCE", valueMm: 2200, source: "IMG_2246(1).jpg", meaning: "상석 쪽 테이블 모서리와 목재 출입문 옆 벽 사이", anchorA: "상석 상판 모서리 - 사진상 후보", anchorB: "목재 출입문 옆 벽 또는 문틀 면 - 사진상 불명확", sourceType: "user-marked measurement", endpointStatus: "unresolved", applicationStatus: "reference-only", valueConfidence: "high", geometryConfidence: "low" }),
    Object.freeze({ dimensionId: "HEAD-CONNECTOR-DEPTH", valueMm: null, source: "IMG_2240(1).jpg", meaning: "상석 연결 상판 앞뒤 깊이", anchorA: "연결 상판 안쪽 가장자리", anchorB: "연결 상판 바깥쪽 가장자리", sourceType: "unmeasured visual reference", endpointStatus: "unresolved", applicationStatus: "reference-only", valueConfidence: "none", geometryConfidence: "medium" }),
  ]);

  const roomTemplate = Object.freeze({
    id: "prime-conference-hall",
    name: "PRIME Conference Hall",
    areaReference: "252.19㎡",
    displayMapping: Object.freeze({
      "main-left": "main-upper",
      "main-right": "main-lower",
      head: "left-head",
      staff: "upper-staff",
    }),
    geometry: Object.freeze({
      scene: SCENE,
      unitsPerMeter: UNITS_PER_METER,
      measurements: FIELD_MEASUREMENTS,
      roomPath: "M430 72 H1490 V828 H72 V286 H218 V244 H430 Z",
      corridorPath: "M40 45 H430 V244 H218 V286 H40 Z",
      doors: Object.freeze([
        { id: "door-1", label: "출입문 1", x: 430, y: 157, orientation: "vertical" },
        { id: "door-2", label: "출입문 2", x: 302, y: 244, orientation: "horizontal" },
      ]),
      mainTable: Object.freeze({
        xStart: 300,
        xEnd: 1350,
        openEndX: 1390,
        upperBaseY: 390,
        lowerBaseY: 640,
        upperCurveDepth: 24,
        lowerCurveDepth: 24,
        connectorX: 300,
        depth: mmToUnits(800),
        connectorDepth: 54,
        screenWallFaceX: 1490,
        screenEndClearance: mmToUnits(1000),
      }),
      staffTables: STAFF_TABLE_MODULES,
      screen: Object.freeze({ x: 1447, y: 412.5, width: 24, height: 205 }),
      pc: Object.freeze({ x: 1370, y: 150, width: 88, height: 82 }),
      planters: Object.freeze([{ x: 710, y: 515 }, { x: 1010, y: 515 }]),
      windows: Object.freeze({ x: 230, y: 805, width: 1110, panes: 6 }),
    }),
    seats: Object.freeze([
      ...Array.from({ length: 24 }, (_, index) => ({
        id: `MAIN-L-${String(index + 1).padStart(2, "0")}`,
        section: "main-left",
        displaySection: "main-upper",
        sectionLabel: "상단 메인석 · 벽체 측",
        number: index + 1,
        t: index / 23,
        x: 350 + (975 * index) / 23,
        y: upperTableY(index / 23) - 69,
        direction: "down",
        width: 38,
        height: 38,
      })),
      ...Array.from({ length: 24 }, (_, index) => ({
        id: `MAIN-R-${String(index + 1).padStart(2, "0")}`,
        section: "main-right",
        displaySection: "main-lower",
        sectionLabel: "하단 메인석 · 창가 측",
        number: index + 1,
        t: index / 23,
        x: 350 + (975 * index) / 23,
        y: lowerTableY(index / 23) + 69,
        direction: "up",
        width: 38,
        height: 38,
      })),
      {
        id: "HEAD-01",
        section: "head",
        displaySection: "left-head",
        sectionLabel: "왼쪽 중앙석",
        number: 1,
        x: 220,
        y: 515,
        direction: "right",
        width: 60,
        height: 48,
      },
      ...STAFF_TABLE_MODULES.flatMap((table, tableIndex) => table.seatIds.map((id, seatIndex) => ({
        id,
        section: "staff",
        displaySection: "upper-staff",
        sectionLabel: "상단 수행원석",
        staffTableId: table.id,
        number: tableIndex * 2 + seatIndex + 1,
        x: table.x + table.width * (seatIndex === 0 ? .29 : .71),
        y: 142,
        direction: "down",
        width: 44,
        height: 36,
      }))),
    ]),
  });

  const sectionCounts = roomTemplate.seats.reduce((counts, seat) => {
    const key = seat.section.startsWith("staff") ? "staff" : seat.section;
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});

  if (
    roomTemplate.seats.length !== 63 ||
    sectionCounts["main-left"] !== 24 ||
    sectionCounts["main-right"] !== 24 ||
    sectionCounts.head !== 1 ||
    sectionCounts.staff !== 14
  ) {
    throw new Error("PRIME 홀 좌석 Geometry 검증 실패");
  }

  const uniqueSeatIds = new Set(roomTemplate.seats.map((seat) => seat.id));
  const monitorSeats = roomTemplate.seats.filter((seat) => !seat.section.startsWith("staff"));
  const staffSeatIds = new Set(roomTemplate.seats.filter((seat) => seat.section === "staff").map((seat) => seat.id));
  const groupedStaffSeatIds = roomTemplate.geometry.staffTables.flatMap((table) => table.seatIds);
  const mainTableGeometry = roomTemplate.geometry.mainTable;
  const headSeatGeometry = roomTemplate.seats.find((seat) => seat.id === "HEAD-01");
  const screenCenterY = roomTemplate.geometry.screen.y + roomTemplate.geometry.screen.height / 2;
  const midpoint = .5;
  if (
    uniqueSeatIds.size !== 63 ||
    monitorSeats.length !== 49 ||
    roomTemplate.geometry.staffTables.length !== 7 ||
    roomTemplate.geometry.staffTables.some((table) => table.seatIds.length !== 2 || table.depth !== mmToUnits(800)) ||
    groupedStaffSeatIds.length !== 14 ||
    groupedStaffSeatIds.some((seatId) => !staffSeatIds.has(seatId)) ||
    new Set(groupedStaffSeatIds).size !== 14 ||
    mainTableGeometry.depth !== mmToUnits(800) ||
    mainTableGeometry.screenWallFaceX - mainTableGeometry.openEndX !== mainTableGeometry.screenEndClearance ||
    !headSeatGeometry ||
    Math.abs(headSeatGeometry.y - screenCenterY) > .001 ||
    upperTableY(midpoint) >= upperTableY(0) ||
    lowerTableY(midpoint) <= lowerTableY(0) ||
    roomTemplate.seats.filter((seat) => seat.section === "staff").some((seat) => seat.y > 220)
  ) {
    throw new Error("PRIME 홀 가로형 Geometry 방향 또는 수량 검증 실패");
  }

  const defaultState = () => ({
    schemaVersion: 1,
    roomTemplateId: roomTemplate.id,
    event: {
      title: "PRIME 컨퍼런스홀 좌석배치",
      date: "",
      organizations: "",
      location: "한양대학교 ERICA 본관 2층 PRIME 컨퍼런스홀",
      note: "",
    },
    attendees: [],
    institutions: [],
    assignments: {},
    settings: { showSeatNumbers: true, mode: "edit", includeHeadInAuto: false, autoFillStaff: true },
  });

  const seatById = new Map(roomTemplate.seats.map((seat) => [seat.id, seat]));
  let state = loadState();
  let selectedAttendeeId = null;
  let attendeeFilter = "unassigned";
  let searchTerm = "";
  let view = { ...FULL_VIEW };
  let undoStack = [];
  let redoStack = [];
  let saveTimer = null;
  let dragCandidate = null;
  let panCandidate = null;
  let bulkPreviewRows = [];
  let bulkPreviewIssues = { errors: [], warnings: [] };
  let autoDraft = null;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const elements = {
    shell: $("#app-shell"),
    roomSvg: $("#room-svg"),
    roomViewport: $("#room-viewport"),
    roomShell: $("#room-shell"),
    fixtureLayer: $("#fixture-layer"),
    seatLayer: $("#seat-layer"),
    attendeeList: $("#attendee-list"),
    selectedCard: $("#selected-card"),
    dragGhost: $("#drag-ghost"),
    attendeeDialog: $("#attendee-dialog"),
    resetDialog: $("#reset-dialog"),
    attendeeForm: $("#attendee-form"),
    bulkDialog: $("#bulk-dialog"),
    institutionsDialog: $("#institutions-dialog"),
    autoLayoutDialog: $("#auto-layout-dialog"),
    dataMenu: $("#data-menu"),
    toastRegion: $("#toast-region"),
  };

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || saved.schemaVersion !== 1 || !Array.isArray(saved.attendees)) return defaultState();
      return sanitizeState(saved);
    } catch {
      return defaultState();
    }
  }

  function sanitizeState(input) {
    const base = defaultState();
    const institutions = Array.isArray(input.institutions)
      ? input.institutions
          .filter((item) => item && typeof item.id === "string")
          .map((item, index) => ({
            id: item.id,
            name: String(item.name || "").slice(0, 120),
            role: ["host", "counterparty", "other"].includes(item.role) ? item.role : "other",
            displayOrder: Number.isInteger(Number(item.displayOrder)) ? Number(item.displayOrder) : index + 1,
            referenceSeatId: seatById.has(item.referenceSeatId) && !staffSeatIds.has(item.referenceSeatId) ? item.referenceSeatId : "",
            note: String(item.note || "").slice(0, 300),
          }))
      : [];
    const institutionIds = new Set(institutions.map((item) => item.id));
    const attendees = Array.isArray(input.attendees)
      ? input.attendees
          .filter((item) => item && typeof item.id === "string" && typeof item.name === "string")
          .map((item) => ({
            id: item.id,
            name: item.name.slice(0, 80),
            org: String(item.org || "").slice(0, 120),
            title: String(item.title || "").slice(0, 80),
            type: String(item.type || "기타").slice(0, 40),
            group: String(item.group || "").slice(0, 100),
            note: String(item.note || "").slice(0, 500),
            institutionId: institutionIds.has(item.institutionId) ? item.institutionId : "",
            institutionRank: Number.isInteger(Number(item.institutionRank)) && Number(item.institutionRank) > 0 ? Number(item.institutionRank) : null,
            fixedSeatId: seatById.has(item.fixedSeatId) ? item.fixedSeatId : "",
            seatLocked: Boolean(item.seatLocked),
          }))
      : [];
    const attendeeIds = new Set(attendees.map((item) => item.id));
    const usedAttendees = new Set();
    const assignments = {};
    for (const [seatId, attendeeId] of Object.entries(input.assignments || {})) {
      if (seatById.has(seatId) && attendeeIds.has(attendeeId) && !usedAttendees.has(attendeeId)) {
        assignments[seatId] = attendeeId;
        usedAttendees.add(attendeeId);
      }
    }
    return {
      schemaVersion: 1,
      roomTemplateId: roomTemplate.id,
      event: { ...base.event, ...(input.event || {}) },
      attendees,
      institutions,
      assignments,
      settings: { ...base.settings, ...(input.settings || {}) },
    };
  }

  function snapshot() {
    return JSON.stringify(state);
  }

  function transact(mutator, message) {
    undoStack.push(snapshot());
    if (undoStack.length > 80) undoStack.shift();
    redoStack = [];
    mutator();
    scheduleSave();
    renderAll();
    if (message) toast(message);
  }

  function restore(serialized) {
    state = sanitizeState(JSON.parse(serialized));
    selectedAttendeeId = null;
    syncEventInputs();
    applyMode();
    renderAll();
    scheduleSave();
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    $("#save-status").textContent = "저장 중…";
    $(".save-dot").style.background = "#c38a24";
    try {
      localStorage.setItem(STORAGE_KEY, snapshot());
    } catch {
      $("#save-status").textContent = "저장 실패";
      $(".save-dot").style.background = "#b52f39";
      return;
    }
    saveTimer = setTimeout(() => {
      $("#save-status").textContent = "자동저장됨";
      $(".save-dot").style.background = "#178459";
    }, 260);
  }

  function attendeeById(id) {
    return state.attendees.find((attendee) => attendee.id === id) || null;
  }

  function institutionById(id) {
    return state.institutions.find((institution) => institution.id === id) || null;
  }

  function institutionRoleLabel(role) {
    return ({ host: "주최", counterparty: "상대기관", other: "기타" })[role] || "기타";
  }

  function assignedSeatFor(attendeeId) {
    return Object.keys(state.assignments).find((seatId) => state.assignments[seatId] === attendeeId) || null;
  }

  function getInitials(name) {
    const compact = name.trim().replace(/\s+/g, "");
    return compact.slice(0, 2) || "—";
  }

  function truncate(text, max) {
    const value = String(text || "");
    return value.length > max ? `${value.slice(0, max - 1)}…` : value;
  }

  function colorFor(attendee) {
    const source = institutionById(attendee.institutionId)?.name || attendee.group || attendee.org || attendee.type || attendee.name;
    let hash = 0;
    for (const char of source) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    return GROUP_COLORS[hash % GROUP_COLORS.length];
  }

  function svgNode(name, attrs = {}, text = "") {
    const node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
    if (text) node.textContent = text;
    return node;
  }

  function renderRoom() {
    const geometry = roomTemplate.geometry;
    const table = geometry.mainTable;
    elements.roomShell.replaceChildren();
    elements.fixtureLayer.replaceChildren();
    elements.roomShell.setAttribute("pointer-events", "none");
    elements.fixtureLayer.setAttribute("pointer-events", "none");

    elements.roomShell.append(
      svgNode("rect", { x: 18, y: 18, width: 1564, height: 864, rx: 18, fill: "#30363c" }),
      svgNode("path", { d: geometry.roomPath, fill: "url(#roomFloor)", stroke: "#171c21", "stroke-width": 12, "stroke-linejoin": "round" }),
      svgNode("path", { d: geometry.corridorPath, fill: "#3b4147", stroke: "#171c21", "stroke-width": 12, "stroke-linejoin": "round" }),
      svgNode("text", { x: 214, y: 145, "text-anchor": "middle", "font-size": 18, "font-weight": 800, fill: "#f0f3f5", class: "svg-label" }, "복도"),
      svgNode("text", { x: 214, y: 168, "text-anchor": "middle", "font-size": 11, fill: "#c8d0d6", class: "svg-label" }, "CORRIDOR"),
    );

    for (const door of geometry.doors) {
      const group = svgNode("g", { "data-door-id": door.id });
      if (door.orientation === "vertical") {
        group.append(
          svgNode("path", { d: `M${door.x} ${door.y - 43}v86`, stroke: "#f2efe7", "stroke-width": 15 }),
          svgNode("path", { d: `M${door.x} ${door.y - 43}h-58`, stroke: "#7f684d", "stroke-width": 7 }),
          svgNode("path", { d: `M${door.x} ${door.y - 43}a58 58 0 0 0-58 58`, fill: "none", stroke: "#9b8d7a", "stroke-width": 2, "stroke-dasharray": "5 4" }),
          svgNode("text", { x: door.x + 17, y: door.y + 3, "font-size": 13, "font-weight": 800, fill: "#554d44", class: "svg-label" }, door.label),
        );
      } else {
        group.append(
          svgNode("path", { d: `M${door.x - 50} ${door.y}h100`, stroke: "#f2efe7", "stroke-width": 15 }),
          svgNode("path", { d: `M${door.x - 50} ${door.y}v-48M${door.x + 50} ${door.y}v-48`, stroke: "#7f684d", "stroke-width": 7 }),
          svgNode("path", { d: `M${door.x - 50} ${door.y}a50 50 0 0 1 50-50M${door.x + 50} ${door.y}a50 50 0 0 0-50-50`, fill: "none", stroke: "#9b8d7a", "stroke-width": 2, "stroke-dasharray": "5 4" }),
          svgNode("text", { x: door.x, y: door.y + 35, "text-anchor": "middle", "font-size": 13, "font-weight": 800, fill: "#554d44", class: "svg-label" }, door.label),
        );
      }
      elements.roomShell.append(group);
    }

    const halfDepth = table.depth / 2;
    const halfConnectorDepth = table.connectorDepth / 2;
    const leftOuterX = table.connectorX - halfConnectorDepth;
    const leftInnerX = table.connectorX + halfConnectorDepth;
    const outerControlX = (leftOuterX + table.openEndX) / 2;
    const innerControlX = (leftInnerX + table.openEndX) / 2;
    const upperOuterY = table.upperBaseY - halfDepth;
    const upperInnerY = table.upperBaseY + halfDepth;
    const lowerInnerY = table.lowerBaseY - halfDepth;
    const lowerOuterY = table.lowerBaseY + halfDepth;
    const tableOutlinePath = [
      `M${leftOuterX} ${upperOuterY}`,
      `Q${outerControlX} ${upperOuterY - table.upperCurveDepth * 2} ${table.openEndX} ${upperOuterY}`,
      `L${table.openEndX} ${upperInnerY}`,
      `Q${innerControlX} ${upperInnerY - table.upperCurveDepth * 2} ${leftInnerX} ${upperInnerY}`,
      `L${leftInnerX} ${lowerInnerY}`,
      `Q${innerControlX} ${lowerInnerY + table.lowerCurveDepth * 2} ${table.openEndX} ${lowerInnerY}`,
      `L${table.openEndX} ${lowerOuterY}`,
      `Q${outerControlX} ${lowerOuterY + table.lowerCurveDepth * 2} ${leftOuterX} ${lowerOuterY}`,
      "Z",
    ].join(" ");
    const tableGroup = svgNode("g", {
      id: "main-table",
      filter: "url(#softShadow)",
      "data-long-edge-depth-mm": 800,
      "data-screen-clearance-mm": 1000,
      "data-units-per-meter": geometry.unitsPerMeter,
      "data-connected-geometry": "true",
      "data-open-side": "right",
      "data-endcaps": "square",
      "data-head-screen-axis-y": screenCenterY,
    });
    tableGroup.append(
      svgNode("path", {
        id: "main-table-surface",
        d: tableOutlinePath,
        fill: "url(#tableWood)",
        stroke: "#492316",
        "stroke-width": 12,
        "stroke-linejoin": "miter",
        "data-measurement-status": "long-edges-measured-connector-unmeasured",
      }),
    );
    elements.fixtureLayer.append(tableGroup);

    const staffGroup = svgNode("g", { id: "staff-tables", filter: "url(#softShadow)", "data-module-count": geometry.staffTables.length, "data-module-depth-mm": 800 });
    for (const [index, staffTable] of geometry.staffTables.entries()) {
      const module = svgNode("g", {
        "data-staff-table-id": staffTable.id,
        "data-seat-ids": staffTable.seatIds.join(","),
        "data-depth-mm": 800,
      });
      module.append(
        svgNode("rect", { x: staffTable.x, y: staffTable.y, width: staffTable.width, height: staffTable.depth, rx: 4, fill: "#4a2418" }),
        svgNode("rect", { x: staffTable.x + 4, y: staffTable.y + 4, width: staffTable.width - 8, height: staffTable.depth - 8, rx: 2, fill: "url(#tableWood)" }),
        svgNode("path", { d: `M${staffTable.x + staffTable.width / 2} ${staffTable.y + 7}v${staffTable.depth - 14}`, stroke: "#5a2c1c", "stroke-width": 1.5, opacity: .82 }),
        svgNode("text", { x: staffTable.x + staffTable.width / 2, y: staffTable.y + staffTable.depth / 2 + 5, "text-anchor": "middle", "font-size": 11, "font-weight": 800, fill: "#f4e9df", class: "svg-label" }, `T${index + 1}`),
      );
      staffGroup.append(module);
    }
    elements.fixtureLayer.append(staffGroup);

    const screen = geometry.screen;
    const screenGroup = svgNode("g", {
      id: "screen-fixture",
      "data-center-y": screen.y + screen.height / 2,
      "data-aligned-seat-id": "HEAD-01",
    });
    screenGroup.append(
      svgNode("rect", { x: screen.x, y: screen.y, width: screen.width, height: screen.height, rx: 4, fill: "#132a44" }),
      svgNode("rect", { x: screen.x + 5, y: screen.y + 13, width: screen.width - 10, height: screen.height - 26, rx: 2, fill: "#edf5f8" }),
      svgNode("text", { x: screen.x - 10, y: screen.y + screen.height / 2, transform: `rotate(-90 ${screen.x - 10} ${screen.y + screen.height / 2})`, "text-anchor": "middle", "font-size": 14, "font-weight": 800, fill: "#183d60", class: "svg-label" }, "스크린"),
    );
    elements.fixtureLayer.append(screenGroup);

    const pc = geometry.pc;
    elements.fixtureLayer.append(
      svgNode("rect", { x: pc.x, y: pc.y, width: pc.width, height: pc.height, rx: 7, fill: "#734229", stroke: "#4a2418", "stroke-width": 4 }),
      svgNode("rect", { x: pc.x + 24, y: pc.y + 12, width: 42, height: 28, rx: 3, fill: "#26323c" }),
      svgNode("rect", { x: pc.x + 34, y: pc.y + 48, width: 23, height: 21, rx: 5, fill: "#202830" }),
      svgNode("text", { x: pc.x - 8, y: pc.y + pc.height / 2 + 5, "text-anchor": "end", "font-size": 14, "font-weight": 800, fill: "#4d6173", class: "svg-label" }, "PC"),
    );

    for (const planter of geometry.planters) {
      const group = svgNode("g", { transform: `translate(${planter.x} ${planter.y})`, class: "planter" });
      group.append(
        svgNode("ellipse", { cx: 0, cy: 17, rx: 38, ry: 16, fill: "#653522" }),
        svgNode("ellipse", { cx: 0, cy: 0, rx: 38, ry: 16, fill: "#7d4b35" }),
        svgNode("circle", { cx: -20, cy: -4, r: 16, fill: "#5a743f" }),
        svgNode("circle", { cx: 0, cy: -13, r: 19, fill: "#6f8e4c" }),
        svgNode("circle", { cx: 21, cy: -3, r: 16, fill: "#4f6c39" }),
      );
      elements.fixtureLayer.append(group);
    }

    const windows = geometry.windows;
    const paneWidth = windows.width / windows.panes;
    const windowGroup = svgNode("g", { id: "window-wall" });
    windowGroup.append(svgNode("path", { d: `M${windows.x} ${windows.y}h${windows.width}`, stroke: "#aeb8bb", "stroke-width": 12, "stroke-linecap": "round" }));
    for (let index = 0; index < windows.panes; index += 1) {
      windowGroup.append(svgNode("rect", { x: windows.x + index * paneWidth + 4, y: windows.y - 7, width: paneWidth - 8, height: 14, rx: 2, fill: "#cfe6ec", stroke: "#81999f" }));
    }
    windowGroup.append(svgNode("text", { x: windows.x + windows.width / 2, y: windows.y + 34, "text-anchor": "middle", "font-size": 14, "font-weight": 800, fill: "#66747d", class: "svg-label" }, "창가 · WINDOW"));
    elements.fixtureLayer.append(windowGroup);

    elements.fixtureLayer.append(
      svgNode("text", { x: 345, y: 290, "font-size": 12, "font-weight": 800, fill: "#7b6e62", class: "svg-label" }, "상단 메인석 · 벽체 측 · 24"),
      svgNode("text", { x: 345, y: 765, "font-size": 12, "font-weight": 800, fill: "#7b6e62", class: "svg-label" }, "하단 메인석 · 창가 측 · 24"),
      svgNode("text", { x: 184, y: 572, "text-anchor": "middle", "font-size": 12, "font-weight": 800, fill: "#7b6e62", class: "svg-label" }, "중앙석 · 1"),
      svgNode("text", { x: 92, y: 853, "font-size": 10, fill: "#8b8479", class: "svg-label" }, "PRIME CONFERENCE HALL · 화면 기준 평면"),
      svgNode("text", { x: 1490, y: 853, "text-anchor": "end", "font-size": 10, fill: "#8b8479", class: "svg-label" }, "252.19㎡ · 면적 참고"),
    );
  }

  function renderSeats() {
    elements.seatLayer.replaceChildren();
    for (const seat of roomTemplate.seats) {
      const attendee = attendeeById(state.assignments[seat.id]);
      const isStaff = seat.section.startsWith("staff");
      const isHead = seat.section === "head";
      const isUpper = seat.direction === "down";
      const isLower = seat.direction === "up";
      const group = svgNode("g", {
        class: `seat-group${selectedAttendeeId && attendee?.id === selectedAttendeeId ? " selected" : ""}`,
        transform: `translate(${seat.x - seat.width / 2} ${seat.y - seat.height / 2})`,
        tabindex: "0",
        role: "button",
        "data-seat-id": seat.id,
        "aria-label": attendee
          ? `${seat.id}, ${attendee.name}, ${attendee.org} ${attendee.title}`.trim()
          : `${seat.id}, 빈 좌석`,
      });

      const border = attendee ? colorFor(attendee) : isStaff ? "#5e6973" : isHead ? "#b98a39" : "#49545e";
      const fill = attendee ? "#ffffff" : isStaff ? "#35414b" : "#28343e";
      group.append(svgNode("rect", {
        class: "seat-hit",
        x: 0,
        y: 0,
        width: seat.width,
        height: seat.height,
        rx: isHead ? 9 : 6,
        fill,
        stroke: border,
        "stroke-width": attendee ? 2.2 : 1.2,
      }));

      if (attendee) {
        const accent = isLower
          ? { x: 0, y: seat.height - 5, width: seat.width, height: 5 }
          : isHead
            ? { x: 0, y: 0, width: 5, height: seat.height }
            : { x: 0, y: 0, width: seat.width, height: 5 };
        group.append(svgNode("rect", { ...accent, rx: 3, fill: border }));
      } else {
        const back = isLower
          ? { x: 3, y: seat.height - 8, width: seat.width - 6, height: 6 }
          : isHead
            ? { x: 2, y: 3, width: 7, height: seat.height - 6 }
            : { x: 3, y: 2, width: seat.width - 6, height: 6 };
        group.append(svgNode("rect", { ...back, rx: 2, fill: "#111a22", opacity: .78 }));
      }

      if (!isStaff) {
        const monitorGroup = svgNode("g", { "data-monitor-seat-id": seat.id });
        if (isHead) {
          monitorGroup.append(
            svgNode("rect", { x: seat.width + 28, y: seat.height / 2 - 11, width: 10, height: 22, rx: 2, fill: "#111a22", stroke: "#75808b" }),
            svgNode("path", { d: `M${seat.width + 26} ${seat.height / 2}h-8`, stroke: "#5e6871", "stroke-width": 2 }),
            svgNode("path", { d: `M${seat.width + 17} ${seat.height / 2 + 8}q8 0 8-7`, fill: "none", stroke: "#35414a", "stroke-width": 1.3 }),
          );
        } else {
          const monitorY = isUpper ? seat.height + 25 : -34;
          const standY = isUpper ? monitorY + 13 : monitorY + 18;
          const angle = (seat.t - .5) * (isUpper ? 6 : -6);
          monitorGroup.setAttribute("transform", `rotate(${angle} ${seat.width / 2} ${monitorY + 9})`);
          monitorGroup.append(
            svgNode("rect", { x: seat.width / 2 - 11, y: monitorY, width: 22, height: 13, rx: 2, fill: "#111a22", stroke: "#75808b", "stroke-width": 1 }),
            svgNode("path", { d: `M${seat.width / 2} ${monitorY + 13}v5`, stroke: "#5e6871", "stroke-width": 2 }),
            svgNode("path", { d: `M${seat.width / 2 - 6} ${standY}h12`, stroke: "#5e6871", "stroke-width": 2 }),
            svgNode("path", { d: isUpper ? `M${seat.width / 2 + 14} ${monitorY + 13}q7 6 0 12` : `M${seat.width / 2 + 14} ${monitorY + 8}q7-6 0-12`, fill: "none", stroke: "#35414a", "stroke-width": 1.2 }),
          );
        }
        group.append(monitorGroup);
      }

      const textAnchor = "middle";
      const centerX = seat.width / 2;
      if (attendee) {
        const nameY = seat.height / 2 + (isHead ? -2 : 3);
        group.append(svgNode("text", {
          class: "seat-text",
          x: centerX,
          y: nameY,
          "text-anchor": textAnchor,
          "font-size": isStaff || isHead ? 9.5 : 8.5,
          "font-weight": 800,
          fill: "#12263a",
        }, truncate(attendee.name, isStaff || isHead ? 8 : 5)));
        if ((isStaff || isHead || view.zoom >= 1.6) && (attendee.org || attendee.title)) {
          group.append(svgNode("text", {
            class: "seat-text",
            x: centerX,
            y: isStaff || isHead ? seat.height / 2 + 11 : seat.height - 4,
            "text-anchor": textAnchor,
            "font-size": 7.4,
            fill: "#687586",
          }, truncate([attendee.org, attendee.title].filter(Boolean).join(" · "), isStaff || isHead ? 12 : 7)));
        }
      } else {
        group.append(svgNode("text", {
          class: "seat-text",
          x: centerX,
          y: seat.height / 2 + 3.5,
          "text-anchor": textAnchor,
          "font-size": isStaff ? 7.4 : isHead ? 8.2 : 6.8,
          "font-weight": 700,
          fill: "#e9eef2",
        }, state.settings.showSeatNumbers ? seat.id : "+"));
      }

      if (attendee) {
        group.append(svgNode("title", {}, `${attendee.name}\n${attendee.org}${attendee.title ? ` · ${attendee.title}` : ""}\n${attendee.type}${attendee.group ? ` · ${attendee.group}` : ""}${attendee.note ? `\n${attendee.note}` : ""}`));
      }

      group.addEventListener("pointerdown", onSeatPointerDown);
      group.addEventListener("keydown", onSeatKeyDown);
      elements.seatLayer.append(group);
    }
  }

  function renderAttendees() {
    const assignedIds = new Set(Object.values(state.assignments));
    const term = searchTerm.trim().toLocaleLowerCase("ko");
    const attendees = state.attendees.filter((attendee) => {
      if (attendeeFilter === "unassigned" && assignedIds.has(attendee.id)) return false;
      if (!term) return true;
      return [attendee.name, attendee.org, attendee.title, attendee.type, attendee.group]
        .join(" ")
        .toLocaleLowerCase("ko")
        .includes(term);
    });

    elements.attendeeList.replaceChildren();
    if (!attendees.length) {
      const empty = document.createElement("div");
      empty.className = "empty-list";
      if (!state.attendees.length) {
        empty.innerHTML = "<i>＋</i><strong>참석자를 추가하세요</strong><p>이름과 소속을 입력한 뒤 좌석으로 끌거나, 참석자를 선택하고 좌석을 클릭해 배정할 수 있습니다.</p>";
      } else if (attendeeFilter === "unassigned" && !term) {
        empty.innerHTML = "<i>✓</i><strong>모두 배정되었습니다</strong><p>전체 탭에서 참석자의 배정 좌석을 확인하거나 자리 이동을 할 수 있습니다.</p>";
      } else {
        empty.innerHTML = "<i>⌕</i><strong>검색 결과가 없습니다</strong><p>검색어 또는 목록 필터를 확인해 주세요.</p>";
      }
      elements.attendeeList.append(empty);
    }

    for (const attendee of attendees) {
      const seatId = assignedSeatFor(attendee.id);
      const institution = institutionById(attendee.institutionId);
      const item = document.createElement("div");
      item.className = `attendee-item${selectedAttendeeId === attendee.id ? " selected" : ""}${seatId ? " assigned" : ""}`;
      item.dataset.attendeeId = attendee.id;
      item.tabIndex = 0;
      item.setAttribute("role", "button");
      item.setAttribute("aria-label", `${attendee.name}${seatId ? `, ${seatId} 배정됨` : ", 미배정"}`);
      item.innerHTML = `
        <div class="avatar" style="background:${colorFor(attendee)}">${escapeHtml(getInitials(attendee.name))}</div>
        <div class="attendee-copy">
          <strong>${escapeHtml(attendee.name)}</strong>
          <span>${escapeHtml([institution?.name || attendee.org, attendee.title, attendee.institutionRank ? `기관 ${attendee.institutionRank}순위` : ""].filter(Boolean).join(" · ") || attendee.type)}</span>
          ${seatId ? `<em class="seat-chip">${escapeHtml(seatId)}${attendee.seatLocked ? `<b class="lock-badge">고정</b>` : ""}</em>` : ""}
        </div>
        <div class="attendee-actions">
          <button class="mini-action" type="button" data-edit-attendee="${attendee.id}" aria-label="${escapeHtml(attendee.name)} 수정">•••</button>
        </div>`;
      item.addEventListener("pointerdown", onAttendeePointerDown);
      item.addEventListener("click", (event) => {
        if (event.target.closest("[data-edit-attendee]")) return;
        selectAttendee(attendee.id);
      });
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectAttendee(attendee.id);
        }
      });
      item.querySelector("[data-edit-attendee]").addEventListener("click", () => openAttendeeDialog(attendee.id));
      elements.attendeeList.append(item);
    }
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  }

  function renderCounts() {
    const assigned = Object.keys(state.assignments).length;
    const unassigned = Math.max(0, state.attendees.length - assigned);
    $("#total-count").textContent = state.attendees.length;
    $("#assigned-count").textContent = assigned;
    $("#unassigned-count").textContent = unassigned;
    $("#available-count").textContent = 63 - assigned;
    $("#tab-unassigned-count").textContent = unassigned;
    $("#tab-all-count").textContent = state.attendees.length;
  }

  function renderSelected() {
    const attendee = attendeeById(selectedAttendeeId);
    elements.selectedCard.hidden = !attendee;
    if (!attendee) return;
    $("#selected-name").textContent = attendee.name;
    $("#selected-meta").textContent = [institutionById(attendee.institutionId)?.name || attendee.org, attendee.title, assignedSeatFor(attendee.id) || "미배정", attendee.seatLocked ? "자리 고정" : ""].filter(Boolean).join(" · ");
  }

  function renderUndoRedo() {
    $("#undo-button").disabled = undoStack.length === 0;
    $("#redo-button").disabled = redoStack.length === 0;
  }

  function renderPrintHeading() {
    const meta = [formatDate(state.event.date), state.event.organizations, state.event.location, state.event.note].filter(Boolean);
    $("#print-event-title").textContent = state.event.title || "PRIME 컨퍼런스홀 좌석배치";
    $("#print-event-meta").textContent = meta.join(" · ");
  }

  function renderAll() {
    renderSeats();
    renderAttendees();
    renderCounts();
    renderSelected();
    renderUndoRedo();
    renderPrintHeading();
  }

  function selectAttendee(attendeeId) {
    selectedAttendeeId = selectedAttendeeId === attendeeId ? null : attendeeId;
    renderSeats();
    renderAttendees();
    renderSelected();
  }

  function assignAttendee(attendeeId, targetSeatId) {
    if (!attendeeById(attendeeId) || !seatById.has(targetSeatId)) return;
    const sourceSeatId = assignedSeatFor(attendeeId);
    const displacedAttendeeId = state.assignments[targetSeatId];
    if (sourceSeatId === targetSeatId) return;

    transact(() => {
      if (sourceSeatId) delete state.assignments[sourceSeatId];
      if (displacedAttendeeId && sourceSeatId) state.assignments[sourceSeatId] = displacedAttendeeId;
      state.assignments[targetSeatId] = attendeeId;
      const moved = attendeeById(attendeeId);
      if (moved?.seatLocked) moved.fixedSeatId = targetSeatId;
      const displaced = attendeeById(displacedAttendeeId);
      if (displaced?.seatLocked && sourceSeatId) displaced.fixedSeatId = sourceSeatId;
      selectedAttendeeId = attendeeId;
    }, displacedAttendeeId && sourceSeatId ? "두 좌석을 교환했습니다." : displacedAttendeeId ? "기존 참석자를 미배정으로 이동했습니다." : `${targetSeatId}에 배정했습니다.`);
  }

  function unassignAttendee(attendeeId) {
    const seatId = assignedSeatFor(attendeeId);
    if (!seatId) return;
    transact(() => {
      delete state.assignments[seatId];
      const attendee = attendeeById(attendeeId);
      if (attendee?.seatLocked) {
        attendee.seatLocked = false;
        attendee.fixedSeatId = "";
      }
      selectedAttendeeId = attendeeId;
    }, "좌석 배정을 해제했습니다.");
  }

  function onSeatPointerDown(event) {
    if (state.settings.mode !== "edit" || event.button !== 0) return;
    event.stopPropagation();
    const seatId = event.currentTarget.dataset.seatId;
    const attendeeId = state.assignments[seatId];
    dragCandidate = attendeeId
      ? { attendeeId, sourceSeatId: seatId, startX: event.clientX, startY: event.clientY, dragging: false }
      : { attendeeId: null, sourceSeatId: seatId, startX: event.clientX, startY: event.clientY, dragging: false };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function onSeatKeyDown(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    handleSeatClick(event.currentTarget.dataset.seatId);
  }

  function handleSeatClick(seatId) {
    const occupantId = state.assignments[seatId];
    if (selectedAttendeeId) {
      assignAttendee(selectedAttendeeId, seatId);
    } else if (occupantId) {
      selectAttendee(occupantId);
    } else {
      toast("먼저 참석자를 선택해 주세요.");
    }
  }

  function onAttendeePointerDown(event) {
    if (event.button !== 0 || event.target.closest("button")) return;
    const attendeeId = event.currentTarget.dataset.attendeeId;
    dragCandidate = {
      attendeeId,
      sourceSeatId: assignedSeatFor(attendeeId),
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function beginDrag(candidate, clientX, clientY) {
    candidate.dragging = true;
    const attendee = attendeeById(candidate.attendeeId);
    elements.dragGhost.textContent = `${attendee?.name || "참석자"} · 놓을 좌석을 선택하세요`;
    elements.dragGhost.hidden = false;
    moveDragGhost(clientX, clientY);
    document.body.style.cursor = "grabbing";
  }

  function moveDragGhost(clientX, clientY) {
    elements.dragGhost.style.left = `${clientX}px`;
    elements.dragGhost.style.top = `${clientY}px`;
    $$(".seat-group.drop-target").forEach((seat) => seat.classList.remove("drop-target"));
    elements.attendeeList.classList.remove("drag-over");
    const target = document.elementFromPoint(clientX, clientY);
    const seat = target?.closest?.("[data-seat-id]");
    if (seat) seat.classList.add("drop-target");
    if (target?.closest?.("[data-unassigned-drop]")) elements.attendeeList.classList.add("drag-over");
  }

  function finishDrag(clientX, clientY) {
    const candidate = dragCandidate;
    dragCandidate = null;
    elements.dragGhost.hidden = true;
    document.body.style.cursor = "";
    $$(".seat-group.drop-target").forEach((seat) => seat.classList.remove("drop-target"));
    elements.attendeeList.classList.remove("drag-over");
    if (!candidate) return;

    if (!candidate.dragging) {
      if (candidate.sourceSeatId) handleSeatClick(candidate.sourceSeatId);
      return;
    }

    const target = document.elementFromPoint(clientX, clientY);
    const seatTarget = target?.closest?.("[data-seat-id]");
    if (seatTarget && candidate.attendeeId) {
      assignAttendee(candidate.attendeeId, seatTarget.dataset.seatId);
    } else if (target?.closest?.("[data-unassigned-drop]") && candidate.attendeeId) {
      unassignAttendee(candidate.attendeeId);
    }
  }

  function onGlobalPointerMove(event) {
    if (dragCandidate) {
      const distance = Math.hypot(event.clientX - dragCandidate.startX, event.clientY - dragCandidate.startY);
      if (!dragCandidate.dragging && dragCandidate.attendeeId && distance > 6) beginDrag(dragCandidate, event.clientX, event.clientY);
      if (dragCandidate.dragging) {
        event.preventDefault();
        moveDragGhost(event.clientX, event.clientY);
      }
    }
    if (panCandidate) {
      event.preventDefault();
      const rect = elements.roomSvg.getBoundingClientRect();
      view.x = panCandidate.viewX - ((event.clientX - panCandidate.startX) / rect.width) * view.width;
      view.y = panCandidate.viewY - ((event.clientY - panCandidate.startY) / rect.height) * view.height;
      clampView();
      updateViewBox();
    }
  }

  function onGlobalPointerUp(event) {
    if (dragCandidate) finishDrag(event.clientX, event.clientY);
    if (panCandidate) {
      panCandidate = null;
      elements.roomViewport.classList.remove("panning");
    }
  }

  function populateInstitutionSelect(select, selectedId = "") {
    select.replaceChildren(new Option("기관 없음", ""));
    [...state.institutions]
      .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, "ko"))
      .forEach((institution) => select.add(new Option(`${institution.name} · ${institutionRoleLabel(institution.role)}`, institution.id)));
    select.value = selectedId;
  }

  function openAttendeeDialog(attendeeId = null) {
    const attendee = attendeeById(attendeeId);
    $("#attendee-dialog-title").textContent = attendee ? "참석자 수정" : "참석자 추가";
    $("#attendee-id").value = attendee?.id || "";
    $("#attendee-name").value = attendee?.name || "";
    $("#attendee-org").value = attendee?.org || "";
    $("#attendee-title").value = attendee?.title || "";
    $("#attendee-type").value = attendee?.type || "교내";
    $("#attendee-group").value = attendee?.group || "";
    populateInstitutionSelect($("#attendee-institution"), attendee?.institutionId || "");
    $("#attendee-rank").value = attendee?.institutionRank || "";
    $("#attendee-fixed-seat").value = attendee?.fixedSeatId || assignedSeatFor(attendee?.id) || "";
    $("#attendee-locked").checked = Boolean(attendee?.seatLocked);
    $("#attendee-note").value = attendee?.note || "";
    $("#delete-attendee-button").hidden = !attendee;
    elements.attendeeDialog.showModal();
    requestAnimationFrame(() => $("#attendee-name").focus());
  }

  function saveAttendee() {
    const id = $("#attendee-id").value;
    const name = $("#attendee-name").value.trim();
    if (!name) {
      $("#attendee-name").reportValidity();
      return;
    }
    const values = {
      name,
      org: $("#attendee-org").value.trim(),
      title: $("#attendee-title").value.trim(),
      type: $("#attendee-type").value,
      group: $("#attendee-group").value.trim(),
      note: $("#attendee-note").value.trim(),
      institutionId: $("#attendee-institution").value,
      institutionRank: $("#attendee-rank").value ? Number($("#attendee-rank").value) : null,
      fixedSeatId: $("#attendee-fixed-seat").value.trim().toUpperCase(),
      seatLocked: $("#attendee-locked").checked,
    };
    if (values.institutionId && !values.group) values.group = institutionById(values.institutionId)?.name || "";
    if (values.institutionRank !== null && (!Number.isInteger(values.institutionRank) || values.institutionRank < 1)) {
      toast("기관 내 순위는 1 이상의 정수로 입력해 주세요.", true);
      return;
    }
    if (values.fixedSeatId && !seatById.has(values.fixedSeatId)) {
      toast("유효한 좌석 ID를 입력해 주세요.", true);
      return;
    }
    if (values.seatLocked && !values.fixedSeatId) {
      values.fixedSeatId = id ? assignedSeatFor(id) || "" : "";
      if (!values.fixedSeatId) {
        toast("자리 고정에는 고정 좌석 ID가 필요합니다.", true);
        return;
      }
    }
    const occupiedBy = values.fixedSeatId ? state.assignments[values.fixedSeatId] : null;
    if (values.seatLocked && occupiedBy && occupiedBy !== id) {
      toast(`${values.fixedSeatId} 좌석은 이미 사용 중입니다.`, true);
      return;
    }
    transact(() => {
      let attendeeId = id;
      if (id) Object.assign(attendeeById(id), values);
      else {
        attendeeId = crypto.randomUUID();
        state.attendees.push({ id: attendeeId, ...values });
      }
      if (values.seatLocked && values.fixedSeatId) {
        const previousSeat = assignedSeatFor(attendeeId);
        if (previousSeat) delete state.assignments[previousSeat];
        state.assignments[values.fixedSeatId] = attendeeId;
      }
    }, id ? "참석자 정보를 수정했습니다." : "참석자를 추가했습니다.");
    elements.attendeeDialog.close();
  }

  function deleteCurrentAttendee() {
    const id = $("#attendee-id").value;
    const attendee = attendeeById(id);
    if (!attendee || !window.confirm(`${attendee.name} 참석자를 삭제할까요?`)) return;
    transact(() => {
      const seatId = assignedSeatFor(id);
      if (seatId) delete state.assignments[seatId];
      state.attendees = state.attendees.filter((item) => item.id !== id);
      if (selectedAttendeeId === id) selectedAttendeeId = null;
    }, "참석자를 삭제했습니다.");
    elements.attendeeDialog.close();
  }

  function syncEventInputs() {
    $("#event-title").value = state.event.title;
    $("#event-date").value = state.event.date;
    const institutionSummary = [...state.institutions].sort((a, b) => a.displayOrder - b.displayOrder).map((item) => item.name).filter(Boolean).join(" · ");
    $("#event-organizations").value = institutionSummary || state.event.organizations;
    $("#event-location").value = state.event.location;
    $("#event-note").value = state.event.note;
    $("#seat-number-toggle").checked = state.settings.showSeatNumbers;
  }

  function bindEventInputs() {
    const bindings = [
      ["event-title", "title"],
      ["event-date", "date"],
      ["event-organizations", "organizations"],
      ["event-location", "location"],
      ["event-note", "note"],
    ];
    for (const [id, key] of bindings) {
      $(`#${id}`).addEventListener("input", (event) => {
        state.event[key] = event.target.value;
        renderPrintHeading();
        scheduleSave();
      });
    }
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeStyle: "short" }).format(date);
  }

  function applyMode() {
    const output = state.settings.mode === "output";
    elements.shell.classList.toggle("output-mode", output);
    $$("[data-mode]").forEach((button) => button.classList.toggle("active", button.dataset.mode === state.settings.mode));
    if (output) fitView();
    scheduleSave();
  }

  function setMode(mode) {
    state.settings.mode = mode;
    selectedAttendeeId = null;
    applyMode();
    renderAll();
  }

  function updateViewBox() {
    elements.roomSvg.setAttribute("viewBox", `${view.x} ${view.y} ${view.width} ${view.height}`);
    $("#zoom-output").textContent = `${Math.round(view.zoom * 100)}%`;
  }

  function clampView() {
    const paddingX = view.width * .2;
    const paddingY = view.height * .2;
    view.x = Math.min(SCENE.width - view.width + paddingX, Math.max(-paddingX, view.x));
    view.y = Math.min(SCENE.height - view.height + paddingY, Math.max(-paddingY, view.y));
  }

  function zoomTo(nextZoom, anchorX = SCENE.width / 2, anchorY = SCENE.height / 2) {
    const zoom = Math.min(2.4, Math.max(.72, nextZoom));
    const worldAnchorX = view.x + (anchorX / SCENE.width) * view.width;
    const worldAnchorY = view.y + (anchorY / SCENE.height) * view.height;
    view.zoom = zoom;
    view.width = SCENE.width / zoom;
    view.height = SCENE.height / zoom;
    view.x = worldAnchorX - (anchorX / SCENE.width) * view.width;
    view.y = worldAnchorY - (anchorY / SCENE.height) * view.height;
    clampView();
    updateViewBox();
    renderSeats();
  }

  function fitView() {
    view = { ...FULL_VIEW };
    updateViewBox();
    renderSeats();
  }

  function startPan(event) {
    if (event.button !== 0 || event.target.closest("[data-seat-id]")) return;
    panCandidate = { startX: event.clientX, startY: event.clientY, viewX: view.x, viewY: view.y };
    elements.roomViewport.classList.add("panning");
    elements.roomSvg.setPointerCapture?.(event.pointerId);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  function safeFilename(extension) {
    const title = (state.event.title || "PRIME-좌석배치").replace(/[\\/:*?"<>|]/g, "-").trim();
    return `${title || "PRIME-좌석배치"}.${extension}`;
  }

  function exportJson() {
    const payload = {
      ...state,
      exportedAt: new Date().toISOString(),
      seatValidation: { mainLeft: 24, mainRight: 24, head: 1, staff: 14, total: 63 },
    };
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), safeFilename("json"));
    toast("배치 데이터를 내보냈습니다.");
  }

  function importJson(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed.attendees) || typeof parsed.assignments !== "object") throw new Error("invalid");
        undoStack.push(snapshot());
        redoStack = [];
        state = sanitizeState(parsed);
        selectedAttendeeId = null;
        syncEventInputs();
        applyMode();
        renderAll();
        scheduleSave();
        toast("JSON 배치 데이터를 불러왔습니다.");
      } catch {
        toast("올바른 좌석배치 JSON 파일이 아닙니다.", true);
      }
    };
    reader.readAsText(file);
  }

  function csvEscape(value) {
    const text = String(value || "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function exportCsv() {
    const headers = ["이름", "소속", "직위", "기관", "기관역할", "기관내순위", "좌석고정", "참석구분", "비고"];
    const rows = state.attendees.map((attendee) => [
      attendee.name,
      attendee.org,
      attendee.title,
      institutionById(attendee.institutionId)?.name || attendee.group,
      institutionRoleLabel(institutionById(attendee.institutionId)?.role),
      attendee.institutionRank || "",
      attendee.seatLocked ? attendee.fixedSeatId || assignedSeatFor(attendee.id) : "",
      attendee.type,
      attendee.note,
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
    downloadBlob(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }), safeFilename("csv"));
    toast("참석자 명단을 CSV로 내보냈습니다.");
  }

  const BULK_HEADERS = ["이름", "소속", "직위", "기관", "기관역할", "기관내순위", "좌석고정", "참석구분", "비고"];

  function downloadExampleCsv() {
    const rows = [
      BULK_HEADERS,
      ["가온", "대외협력팀", "팀장", "푸른대학교", "주최", "1", "MAIN-L-12", "주요 참석자", "예시 데이터"],
      ["나래", "국제처", "처장", "푸른대학교", "주최", "2", "", "교내", ""],
      ["다온", "전략기획실", "실장", "새봄연구원", "상대기관", "1", "", "외부", ""],
      ["라온", "수행팀", "매니저", "새봄연구원", "상대기관", "", "STAFF-01", "수행원", ""],
    ];
    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
    downloadBlob(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }), "PRIME_참석자_등록_예시.csv");
    toast("UTF-8 BOM 예시 CSV를 저장했습니다.");
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      if (quoted) {
        if (char === '"' && text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else if (char === '"') quoted = false;
        else field += char;
      } else if (char === '"') quoted = true;
      else if (char === ",") { row.push(field); field = ""; }
      else if (char === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
      else field += char;
    }
    if (field || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row); }
    return rows;
  }

  function roleFromCsv(value) {
    const text = String(value || "").trim().toLowerCase();
    if (["주최", "host"].includes(text)) return "host";
    if (["상대기관", "상대", "counterparty", "guest"].includes(text)) return "counterparty";
    return "other";
  }

  function normalizeBulkRows(rows) {
    const headers = rows.shift().map((header) => header.trim().replace(/^\ufeff/, ""));
    const aliases = {
      name: ["이름", "성명", "name"], org: ["소속", "organization", "org"], title: ["직위", "직책", "title"],
      institution: ["기관", "기관·그룹", "기관/그룹", "그룹", "group"], role: ["기관역할", "기관 역할", "role"],
      rank: ["기관내순위", "기관 내 순위", "순위", "rank"], fixedSeat: ["좌석고정", "고정좌석", "좌석id", "좌석", "seat", "seatid"],
      type: ["참석구분", "구분", "type"], note: ["비고", "note"],
    };
    const indexes = Object.fromEntries(Object.entries(aliases).map(([key, values]) => [key, headers.findIndex((header) => values.some((value) => value.toLowerCase() === header.toLowerCase()))]));
    if (indexes.name < 0) throw new Error("name");
    return rows.map((row) => ({
      name: (row[indexes.name] || "").trim(),
      org: indexes.org >= 0 ? (row[indexes.org] || "").trim() : "",
      title: indexes.title >= 0 ? (row[indexes.title] || "").trim() : "",
      institution: indexes.institution >= 0 ? (row[indexes.institution] || "").trim() : "",
      role: indexes.role >= 0 ? (row[indexes.role] || "").trim() : "",
      rank: indexes.rank >= 0 ? (row[indexes.rank] || "").trim() : "",
      fixedSeat: indexes.fixedSeat >= 0 ? (row[indexes.fixedSeat] || "").trim().toUpperCase() : "",
      type: indexes.type >= 0 ? (row[indexes.type] || "기타").trim() || "기타" : "기타",
      note: indexes.note >= 0 ? (row[indexes.note] || "").trim() : "",
    })).filter((row) => Object.values(row).some(Boolean));
  }

  function validateBulkRows() {
    const errors = [];
    const warnings = [];
    const seatClaims = new Map();
    const existingNames = new Set(state.attendees.map((a) => `${a.name}|${a.org}`.toLowerCase()));
    const seenNames = new Set();
    bulkPreviewRows.forEach((row, index) => {
      const line = index + 2;
      row._errors = [];
      row._warnings = [];
      if (!row.name.trim()) row._errors.push("이름 누락");
      if (row.rank && (!/^\d+$/.test(row.rank) || Number(row.rank) < 1)) row._errors.push("기관 내 순위 오류");
      if (row.fixedSeat && !seatById.has(row.fixedSeat)) row._errors.push("유효하지 않은 좌석 ID");
      if (row.type === "수행원" && row.fixedSeat && !staffSeatIds.has(row.fixedSeat)) row._warnings.push("수행원에게 메인 좌석 지정");
      if (row.fixedSeat) {
        if (seatClaims.has(row.fixedSeat)) row._errors.push(`${seatClaims.get(row.fixedSeat)}행과 고정 좌석 중복`);
        else seatClaims.set(row.fixedSeat, line);
        const occupant = state.assignments[row.fixedSeat];
        if (occupant) row._errors.push("현재 배정과 고정 좌석 충돌");
      }
      const identity = `${row.name}|${row.org}`.toLowerCase();
      if (row.name && (existingNames.has(identity) || seenNames.has(identity))) row._warnings.push("중복 참석자 가능성");
      if (row.name) seenNames.add(identity);
      row._errors.forEach((message) => errors.push(`${line}행: ${message}`));
      row._warnings.forEach((message) => warnings.push(`${line}행: ${message}`));
    });
    if (state.attendees.length + bulkPreviewRows.length > 63) errors.push("전체 참석자가 63명을 초과합니다.");
    const staffCount = state.attendees.filter((a) => a.type === "수행원").length + bulkPreviewRows.filter((row) => row.type === "수행원").length;
    if (staffCount > 14) errors.push("수행원 참석자가 14명을 초과합니다.");
    bulkPreviewIssues = { errors, warnings };
    return bulkPreviewIssues;
  }

  function renderBulkPreview() {
    validateBulkRows();
    $("#bulk-preview-head").innerHTML = `<tr><th>#</th>${BULK_HEADERS.map((header) => `<th>${header}</th>`).join("")}</tr>`;
    const body = $("#bulk-preview-body");
    body.replaceChildren();
    bulkPreviewRows.forEach((row, index) => {
      const tr = document.createElement("tr");
      tr.className = row._errors.length ? "row-error" : row._warnings.length ? "row-warning" : "";
      tr.innerHTML = `<td>${index + 1}</td>${[
        ["name", ""], ["org", ""], ["title", ""], ["institution", ""], ["role", ""], ["rank", "narrow-input"], ["fixedSeat", "seat-input"], ["type", ""], ["note", ""],
      ].map(([key, className]) => `<td><input class="${className}" data-bulk-row="${index}" data-bulk-key="${key}" value="${escapeHtml(row[key])}" aria-label="${BULK_HEADERS[["name","org","title","institution","role","rank","fixedSeat","type","note"].indexOf(key)]}" /></td>`).join("")}`;
      body.append(tr);
    });
    const summary = $("#bulk-validation");
    summary.className = `validation-summary${bulkPreviewIssues.errors.length ? " has-error" : bulkPreviewIssues.warnings.length ? " has-warning" : ""}`;
    summary.textContent = bulkPreviewIssues.errors.length
      ? `등록 불가 · ${bulkPreviewIssues.errors.join(" · ")}`
      : bulkPreviewIssues.warnings.length
        ? `확인 필요 · ${bulkPreviewIssues.warnings.join(" · ")}`
        : bulkPreviewRows.length ? `${bulkPreviewRows.length}명 검증 완료` : "CSV 파일을 선택해 주세요.";
    $("#bulk-register-button").disabled = !bulkPreviewRows.length || bulkPreviewIssues.errors.length > 0;
    $("#bulk-register-auto-button").disabled = !bulkPreviewRows.length || bulkPreviewIssues.errors.length > 0;
  }

  function openBulkDialog() {
    bulkPreviewRows = [];
    $("#bulk-file-name").textContent = "파일을 선택하면 편집 가능한 미리보기가 표시됩니다.";
    renderBulkPreview();
    elements.bulkDialog.showModal();
  }

  function importCsv(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCsv(String(reader.result).replace(/^\ufeff/, "")).filter((row) => row.some((field) => field.trim()));
        if (rows.length < 2) throw new Error("empty");
        bulkPreviewRows = normalizeBulkRows(rows);
        if (!bulkPreviewRows.length) throw new Error("empty");
        $("#bulk-file-name").textContent = `${file.name} · ${bulkPreviewRows.length}행`;
        if (!elements.bulkDialog.open) elements.bulkDialog.showModal();
        renderBulkPreview();
      } catch (error) {
        toast(error.message === "name" ? "CSV 첫 행에 ‘이름’ 열이 필요합니다." : "CSV 명단을 읽지 못했습니다.", true);
      }
    };
    reader.readAsText(file, "UTF-8");
  }

  function registerBulkRows(openAutoAfter = false) {
    validateBulkRows();
    if (!bulkPreviewRows.length || bulkPreviewIssues.errors.length) return;
    const createdIds = [];
    transact(() => {
      for (const row of bulkPreviewRows) {
        let institution = row.institution
          ? state.institutions.find((item) => item.name.toLocaleLowerCase("ko") === row.institution.toLocaleLowerCase("ko"))
          : null;
        if (row.institution && !institution) {
          institution = { id: crypto.randomUUID(), name: row.institution, role: roleFromCsv(row.role), displayOrder: state.institutions.length + 1, referenceSeatId: "", note: "" };
          state.institutions.push(institution);
        }
        const attendee = {
          id: crypto.randomUUID(), name: row.name, org: row.org, title: row.title, type: row.type, group: row.institution, note: row.note,
          institutionId: institution?.id || "", institutionRank: row.rank ? Number(row.rank) : null,
          fixedSeatId: row.fixedSeat, seatLocked: Boolean(row.fixedSeat),
        };
        state.attendees.push(attendee);
        createdIds.push(attendee.id);
        if (row.fixedSeat) state.assignments[row.fixedSeat] = attendee.id;
      }
      state.event.organizations = [...state.institutions].sort((a, b) => a.displayOrder - b.displayOrder).map((item) => item.name).join(" · ");
    }, `${createdIds.length}명의 참석자를 등록했습니다.`);
    syncEventInputs();
    elements.bulkDialog.close();
    bulkPreviewRows = [];
    if (openAutoAfter) openAutoLayoutDialog();
  }

  function institutionRowTemplate(institution = {}) {
    const id = institution.id || crypto.randomUUID();
    const role = institution.role || "other";
    const seatOptions = ['<option value="">선택 안 함</option>', ...roomTemplate.seats.filter((seat) => seat.section !== "staff").map((seat) => `<option value="${seat.id}"${seat.id === institution.referenceSeatId ? " selected" : ""}>${seat.id}</option>`)].join("");
    const tr = document.createElement("tr");
    tr.dataset.institutionId = id;
    tr.innerHTML = `
      <td><input data-inst="name" value="${escapeHtml(institution.name)}" placeholder="기관명" /></td>
      <td><select data-inst="role"><option value="host"${role === "host" ? " selected" : ""}>주최</option><option value="counterparty"${role === "counterparty" ? " selected" : ""}>상대기관</option><option value="other"${role === "other" ? " selected" : ""}>기타</option></select></td>
      <td><input class="narrow-input" data-inst="displayOrder" type="number" min="1" step="1" value="${institution.displayOrder || state.institutions.length + 1}" /></td>
      <td><select class="seat-input" data-inst="referenceSeatId">${seatOptions}</select></td>
      <td><input data-inst="note" value="${escapeHtml(institution.note)}" placeholder="메모" /></td>
      <td><button class="mini-action" data-remove-institution type="button" aria-label="기관 삭제">×</button></td>`;
    tr.querySelector("[data-remove-institution]").addEventListener("click", () => tr.remove());
    return tr;
  }

  function openInstitutionsDialog() {
    const body = $("#institutions-body");
    body.replaceChildren();
    [...state.institutions].sort((a, b) => a.displayOrder - b.displayOrder).forEach((institution) => body.append(institutionRowTemplate(institution)));
    elements.institutionsDialog.showModal();
  }

  function saveInstitutions() {
    const rows = $$("#institutions-body tr");
    const institutions = rows.map((row, index) => ({
      id: row.dataset.institutionId,
      name: row.querySelector('[data-inst="name"]').value.trim(),
      role: row.querySelector('[data-inst="role"]').value,
      displayOrder: Number(row.querySelector('[data-inst="displayOrder"]').value) || index + 1,
      referenceSeatId: row.querySelector('[data-inst="referenceSeatId"]').value,
      note: row.querySelector('[data-inst="note"]').value.trim(),
    }));
    if (institutions.some((item) => !item.name)) {
      toast("모든 참여기관에 기관명을 입력해 주세요.", true);
      return;
    }
    const names = institutions.map((item) => item.name.toLocaleLowerCase("ko"));
    if (new Set(names).size !== names.length) {
      toast("같은 이름의 참여기관이 중복되어 있습니다.", true);
      return;
    }
    const kept = new Set(institutions.map((item) => item.id));
    transact(() => {
      state.institutions = institutions;
      state.event.organizations = [...institutions].sort((a, b) => a.displayOrder - b.displayOrder).map((item) => item.name).join(" · ");
      state.attendees.forEach((attendee) => {
        if (attendee.institutionId && !kept.has(attendee.institutionId)) attendee.institutionId = "";
      });
    }, `${institutions.length}개 참여기관을 저장했습니다.`);
    syncEventInputs();
    elements.institutionsDialog.close();
  }

  function suggestedReferenceMap(institutions) {
    const map = new Map();
    const sectionGroups = [
      institutions.filter((_, index) => index % 2 === 0),
      institutions.filter((_, index) => index % 2 === 1),
    ];
    ["main-left", "main-right"].forEach((section, sectionIndex) => {
      const seats = roomTemplate.seats.filter((seat) => seat.section === section).sort((a, b) => a.x - b.x);
      const group = sectionGroups[sectionIndex];
      group.forEach((institution, slot) => {
        const position = Math.round(((slot + 1) * (seats.length - 1)) / (group.length + 1));
        map.set(institution.id, seats[position]?.id || "");
      });
    });
    return map;
  }

  function openAutoLayoutDialog() {
    const list = $("#auto-reference-list");
    list.replaceChildren();
    const institutions = [...state.institutions].sort((a, b) => a.displayOrder - b.displayOrder);
    const suggestions = suggestedReferenceMap(institutions);
    const usedSuggestions = new Set(state.institutions.map((item) => item.referenceSeatId).filter(Boolean));
    institutions.forEach((institution) => {
      let selected = institution.referenceSeatId;
      if (!selected) {
        selected = suggestions.get(institution.id) || "";
        if (selected) usedSuggestions.add(selected);
      }
      const card = document.createElement("label");
      card.className = "reference-card";
      card.dataset.institutionId = institution.id;
      const options = roomTemplate.seats
        .filter((seat) => seat.section === "main-left" || seat.section === "main-right")
        .sort((a, b) => a.x - b.x || a.section.localeCompare(b.section))
        .map((seat) => `<option value="${seat.id}"${seat.id === selected ? " selected" : ""}>${seat.id}</option>`).join("");
      card.innerHTML = `<span><strong>${escapeHtml(institution.name)}</strong><small>${institutionRoleLabel(institution.role)}</small></span><select aria-label="${escapeHtml(institution.name)} 기준 좌석"><option value="">미지정</option>${options}</select>`;
      list.append(card);
    });
    $("#auto-include-head").checked = Boolean(state.settings.includeHeadInAuto);
    $("#auto-fill-staff").checked = state.settings.autoFillStaff !== false;
    elements.autoLayoutDialog.showModal();
    calculateAutoDraft();
  }

  function alternatingSeats(referenceSeat) {
    const sectionSeats = roomTemplate.seats.filter((seat) => seat.section === referenceSeat.section).sort((a, b) => a.x - b.x);
    const pivot = sectionSeats.findIndex((seat) => seat.id === referenceSeat.id);
    const ordered = [referenceSeat];
    for (let offset = 1; ordered.length < sectionSeats.length; offset += 1) {
      if (pivot - offset >= 0) ordered.push(sectionSeats[pivot - offset]);
      if (pivot + offset < sectionSeats.length) ordered.push(sectionSeats[pivot + offset]);
    }
    return ordered;
  }

  function calculateAutoDraft() {
    const errors = [];
    const warnings = [];
    const rows = [];
    const assignments = {};
    const usedSeats = new Set();
    const placedAttendees = new Set();
    const fixedAttendees = state.attendees.filter((attendee) => attendee.seatLocked && (attendee.fixedSeatId || assignedSeatFor(attendee.id)));
    for (const attendee of fixedAttendees) {
      const seatId = attendee.fixedSeatId || assignedSeatFor(attendee.id);
      if (!seatById.has(seatId)) {
        errors.push(`${attendee.name}: 고정 좌석이 유효하지 않습니다.`);
        continue;
      }
      if (usedSeats.has(seatId)) {
        errors.push(`${seatId}: 고정 좌석이 중복되었습니다.`);
        continue;
      }
      assignments[seatId] = attendee.id;
      usedSeats.add(seatId);
      placedAttendees.add(attendee.id);
      rows.push({ status: "고정", institution: institutionById(attendee.institutionId)?.name || "-", attendee: attendee.name, seatId, reason: "자리 고정" });
    }
    for (const [seatId, attendeeId] of Object.entries(state.assignments)) {
      const attendee = attendeeById(attendeeId);
      const isAutoEligible = attendee && attendee.type !== "수행원" && attendee.institutionId && attendee.institutionRank;
      const isStaffEligible = attendee && attendee.type === "수행원" && $("#auto-fill-staff").checked;
      if (!attendee || placedAttendees.has(attendeeId) || isAutoEligible || isStaffEligible) continue;
      if (!usedSeats.has(seatId)) {
        assignments[seatId] = attendeeId;
        usedSeats.add(seatId);
        placedAttendees.add(attendeeId);
      }
    }
    const referenceMap = new Map();
    $$("#auto-reference-list .reference-card").forEach((card) => referenceMap.set(card.dataset.institutionId, card.querySelector("select").value));
    const claimedReferences = new Map();
    for (const institution of [...state.institutions].sort((a, b) => a.displayOrder - b.displayOrder)) {
      const attendees = state.attendees
        .filter((attendee) => attendee.institutionId === institution.id && attendee.type !== "수행원" && attendee.institutionRank && !placedAttendees.has(attendee.id))
        .sort((a, b) => a.institutionRank - b.institutionRank || a.name.localeCompare(b.name, "ko"));
      if (!attendees.length) continue;
      const referenceId = referenceMap.get(institution.id) || "";
      const referenceSeat = seatById.get(referenceId);
      if (!referenceSeat || !["main-left", "main-right"].includes(referenceSeat.section)) {
        errors.push(`${institution.name}: 기준 좌석을 지정해 주세요.`);
        attendees.forEach((attendee) => rows.push({ status: "충돌", institution: institution.name, attendee: attendee.name, seatId: "-", reason: "기준 좌석 없음" }));
        continue;
      }
      if (claimedReferences.has(referenceId)) {
        errors.push(`${referenceId}: ${claimedReferences.get(referenceId)}와 ${institution.name}의 기준 좌석이 중복됩니다.`);
      } else claimedReferences.set(referenceId, institution.name);
      if (usedSeats.has(referenceId)) {
        errors.push(`${institution.name}: 기준 좌석 ${referenceId}가 고정 또는 기존 배정과 충돌합니다.`);
        attendees.forEach((attendee) => rows.push({ status: "충돌", institution: institution.name, attendee: attendee.name, seatId: referenceId, reason: "기준 좌석 사용 중" }));
        continue;
      }
      const orderedSeats = alternatingSeats(referenceSeat);
      for (const attendee of attendees) {
        const seat = orderedSeats.find((candidate) => !usedSeats.has(candidate.id));
        if (!seat) {
          warnings.push(`${institution.name}: ${attendee.name}을 배치할 같은 장변 좌석이 부족합니다.`);
          rows.push({ status: "부족", institution: institution.name, attendee: attendee.name, seatId: "-", reason: "같은 장변 좌석 부족" });
          continue;
        }
        assignments[seat.id] = attendee.id;
        usedSeats.add(seat.id);
        placedAttendees.add(attendee.id);
        rows.push({ status: "초안", institution: institution.name, attendee: attendee.name, seatId: seat.id, reason: attendee.institutionRank === 1 ? "기관 기준 좌석" : `${attendee.institutionRank}순위 · 좌우 교차 확장` });
      }
    }
    if ($("#auto-include-head").checked) {
      const candidate = state.attendees.find((attendee) => attendee.type !== "수행원" && !placedAttendees.has(attendee.id));
      if (candidate && !usedSeats.has("HEAD-01")) {
        assignments["HEAD-01"] = candidate.id;
        usedSeats.add("HEAD-01");
        placedAttendees.add(candidate.id);
        rows.push({ status: "초안", institution: institutionById(candidate.institutionId)?.name || "-", attendee: candidate.name, seatId: "HEAD-01", reason: "HEAD-01 사용 옵션" });
      }
    }
    if ($("#auto-fill-staff").checked) {
      const staffAttendees = state.attendees.filter((attendee) => attendee.type === "수행원" && !placedAttendees.has(attendee.id));
      const staffSeats = roomTemplate.seats.filter((seat) => seat.section === "staff" && !usedSeats.has(seat.id)).sort((a, b) => a.number - b.number);
      staffAttendees.forEach((attendee, index) => {
        const seat = staffSeats[index];
        if (!seat) {
          warnings.push(`수행원 좌석 부족: ${attendee.name}`);
          rows.push({ status: "부족", institution: institutionById(attendee.institutionId)?.name || "-", attendee: attendee.name, seatId: "-", reason: "수행원석 부족" });
          return;
        }
        assignments[seat.id] = attendee.id;
        usedSeats.add(seat.id);
        placedAttendees.add(attendee.id);
        rows.push({ status: "초안", institution: institutionById(attendee.institutionId)?.name || "-", attendee: attendee.name, seatId: seat.id, reason: `수행원 빈자리 · ${seat.staffTableId || ""}` });
      });
    }
    autoDraft = { assignments, rows, errors, warnings, referenceMap };
    renderAutoDraft();
  }

  function renderAutoDraft() {
    const body = $("#auto-preview-body");
    body.replaceChildren();
    autoDraft.rows.forEach((row) => {
      const tr = document.createElement("tr");
      const tone = row.status === "충돌" ? "error" : row.status === "부족" ? "warning" : "";
      tr.innerHTML = `<td><span class="status-badge ${tone}">${row.status}</span></td><td>${escapeHtml(row.institution)}</td><td>${escapeHtml(row.attendee)}</td><td>${escapeHtml(row.seatId)}</td><td>${escapeHtml(row.reason)}</td>`;
      body.append(tr);
    });
    const summary = $("#auto-validation");
    summary.className = `validation-summary${autoDraft.errors.length ? " has-error" : autoDraft.warnings.length ? " has-warning" : ""}`;
    summary.textContent = autoDraft.errors.length ? `적용 불가 · ${autoDraft.errors.join(" · ")}` : autoDraft.warnings.length ? `확인 필요 · ${autoDraft.warnings.join(" · ")}` : `${autoDraft.rows.length}개 배정 초안 검증 완료`;
    $("#apply-auto-button").disabled = autoDraft.errors.length > 0;
  }

  function applyAutoDraft() {
    if (!autoDraft || autoDraft.errors.length) return;
    transact(() => {
      state.assignments = { ...autoDraft.assignments };
      state.settings.includeHeadInAuto = $("#auto-include-head").checked;
      state.settings.autoFillStaff = $("#auto-fill-staff").checked;
      for (const institution of state.institutions) institution.referenceSeatId = autoDraft.referenceMap.get(institution.id) || "";
    }, "자동배치 초안을 한 번의 작업으로 적용했습니다.");
    elements.autoLayoutDialog.close();
  }

  function openNameplateMaker() {
    const people = state.attendees
      .map((attendee) => ({ name: attendee.name, organization: attendee.org || institutionById(attendee.institutionId)?.name || "", position: attendee.title, logoKey: "default" }))
      .filter((person) => person.name || person.organization || person.position);
    if (!people.length) {
      toast("명패로 보낼 참석자가 없습니다.", true);
      return;
    }
    const localPreview = ["localhost", "127.0.0.1"].includes(location.hostname);
    const targetOrigin = localPreview ? "http://localhost:4174" : "https://erakeun.github.io";
    const child = window.open(`${targetOrigin}${localPreview ? "/" : "/nameplate-maker/"}`, "erica-nameplate-maker");
    if (!child) {
      toast("팝업이 차단되었습니다. 이 사이트의 팝업을 허용해 주세요.", true);
      return;
    }
    const payload = { type: "erica-seat-planner:nameplates:v1", source: "erica-seat-planner", transferId: crypto.randomUUID(), people };
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      child.postMessage(payload, targetOrigin);
      if (attempts >= 40) clearInterval(timer);
    }, 250);
    const onMessage = (event) => {
      if (event.origin === targetOrigin && event.source === child && event.data?.type === "erica-seat-planner:nameplates:accepted" && event.data.transferId === payload.transferId) {
        clearInterval(timer);
        window.removeEventListener("message", onMessage);
        toast(`${people.length}명의 명패 데이터를 전달했습니다.`);
      }
    };
    window.addEventListener("message", onMessage);
    child.postMessage(payload, targetOrigin);
  }

  async function exportPng() {
    try {
      const clone = elements.roomSvg.cloneNode(true);
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clone.setAttribute("viewBox", `0 0 ${SCENE.width} ${SCENE.height}`);
      clone.setAttribute("width", "1920");
      clone.setAttribute("height", "1080");
      const svgText = new XMLSerializer().serializeToString(clone);
      const image = new Image();
      image.decoding = "sync";
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 1920;
      canvas.height = 1240;
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#1268b3";
      context.font = "700 18px sans-serif";
      context.textAlign = "center";
      context.fillText("HANYANG UNIVERSITY ERICA", 960, 35);
      context.fillStyle = "#182638";
      context.font = "700 36px sans-serif";
      context.fillText(state.event.title || "PRIME 컨퍼런스홀 좌석배치", 960, 80);
      context.fillStyle = "#687586";
      context.font = "20px sans-serif";
      const meta = [formatDate(state.event.date), state.event.organizations, state.event.location].filter(Boolean).join(" · ");
      context.fillText(meta, 960, 116);
      context.drawImage(image, 0, 160, 1920, 1080);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1));
      if (!blob) throw new Error("png-encode-failed");
      downloadBlob(blob, safeFilename("png"));
      toast("PNG 이미지를 저장했습니다.");
    } catch {
      toast("PNG 생성 중 문제가 발생했습니다.", true);
    }
  }

  function toast(message, error = false) {
    const item = document.createElement("div");
    item.className = `toast${error ? " error" : ""}`;
    item.textContent = message;
    elements.toastRegion.append(item);
    setTimeout(() => item.remove(), 2900);
  }

  function closeDataMenu() {
    elements.dataMenu.hidden = true;
    $("#data-menu-button").setAttribute("aria-expanded", "false");
  }

  function bindControls() {
    $("#add-attendee-button").addEventListener("click", () => openAttendeeDialog());
    $("#bulk-attendee-button").addEventListener("click", openBulkDialog);
    $("#institutions-button").addEventListener("click", openInstitutionsDialog);
    $("#institution-inline-button").addEventListener("click", openInstitutionsDialog);
    $("#auto-layout-button").addEventListener("click", openAutoLayoutDialog);
    $("#nameplate-button").addEventListener("click", openNameplateMaker);
    $("#save-attendee-button").addEventListener("click", saveAttendee);
    $("#delete-attendee-button").addEventListener("click", deleteCurrentAttendee);
    $("#clear-selection-button").addEventListener("click", () => selectAttendee(selectedAttendeeId));
    $$("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => button.closest("dialog")?.close()));
    $$('dialog').forEach((dialog) => dialog.addEventListener("pointerdown", (event) => {
      const rect = dialog.getBoundingClientRect();
      const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
      if (event.target === dialog || outside) dialog.close();
    }));
    elements.attendeeForm.addEventListener("submit", (event) => {
      event.preventDefault();
      saveAttendee();
    });
    $("#download-example-csv-button").addEventListener("click", downloadExampleCsv);
    $("#choose-csv-button").addEventListener("click", () => $("#csv-file-input").click());
    $("#bulk-preview-body").addEventListener("change", (event) => {
      const rowIndex = Number(event.target.dataset.bulkRow);
      const key = event.target.dataset.bulkKey;
      if (!Number.isInteger(rowIndex) || !key || !bulkPreviewRows[rowIndex]) return;
      bulkPreviewRows[rowIndex][key] = key === "fixedSeat" ? event.target.value.trim().toUpperCase() : event.target.value;
      renderBulkPreview();
    });
    $("#bulk-register-button").addEventListener("click", () => registerBulkRows(false));
    $("#bulk-register-auto-button").addEventListener("click", () => registerBulkRows(true));
    $("#add-institution-button").addEventListener("click", () => $("#institutions-body").append(institutionRowTemplate()));
    $("#save-institutions-button").addEventListener("click", saveInstitutions);
    $("#recalculate-auto-button").addEventListener("click", calculateAutoDraft);
    $("#apply-auto-button").addEventListener("click", applyAutoDraft);
    $("#auto-reference-list").addEventListener("change", calculateAutoDraft);
    $("#auto-include-head").addEventListener("change", calculateAutoDraft);
    $("#auto-fill-staff").addEventListener("change", calculateAutoDraft);
    $("#new-button").addEventListener("click", () => elements.resetDialog.showModal());
    $("#confirm-reset-button").addEventListener("click", () => {
      undoStack.push(snapshot());
      redoStack = [];
      state = defaultState();
      selectedAttendeeId = null;
      syncEventInputs();
      applyMode();
      fitView();
      renderAll();
      scheduleSave();
      toast("새 배치를 만들었습니다.");
    });

    $("#undo-button").addEventListener("click", () => {
      if (!undoStack.length) return;
      redoStack.push(snapshot());
      restore(undoStack.pop());
      toast("이전 상태로 되돌렸습니다.");
    });
    $("#redo-button").addEventListener("click", () => {
      if (!redoStack.length) return;
      undoStack.push(snapshot());
      restore(redoStack.pop());
      toast("다음 상태를 복원했습니다.");
    });

    $$("[data-mode]").forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
    $$("[data-filter]").forEach((button) => button.addEventListener("click", () => {
      attendeeFilter = button.dataset.filter;
      $$("[data-filter]").forEach((item) => item.classList.toggle("active", item === button));
      renderAttendees();
    }));
    $("#attendee-search").addEventListener("input", (event) => {
      searchTerm = event.target.value;
      renderAttendees();
    });
    $("#seat-number-toggle").addEventListener("change", (event) => {
      state.settings.showSeatNumbers = event.target.checked;
      scheduleSave();
      renderSeats();
    });

    $("#zoom-in-button").addEventListener("click", () => zoomTo(view.zoom * 1.18));
    $("#zoom-out-button").addEventListener("click", () => zoomTo(view.zoom / 1.18));
    $("#fit-button").addEventListener("click", fitView);
    $("#reset-view-button").addEventListener("click", fitView);
    elements.roomSvg.addEventListener("pointerdown", startPan);
    elements.roomViewport.addEventListener("wheel", (event) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const rect = elements.roomSvg.getBoundingClientRect();
      const anchorX = ((event.clientX - rect.left) / rect.width) * SCENE.width;
      const anchorY = ((event.clientY - rect.top) / rect.height) * SCENE.height;
      zoomTo(view.zoom * (event.deltaY < 0 ? 1.12 : .89), anchorX, anchorY);
    }, { passive: false });

    $("#data-menu-button").addEventListener("click", (event) => {
      event.stopPropagation();
      elements.dataMenu.hidden = !elements.dataMenu.hidden;
      event.currentTarget.setAttribute("aria-expanded", String(!elements.dataMenu.hidden));
    });
    elements.dataMenu.addEventListener("click", (event) => {
      const action = event.target.dataset.action;
      if (!action) return;
      closeDataMenu();
      if (action === "json-export") exportJson();
      if (action === "json-import") $("#json-file-input").click();
      if (action === "csv-export") exportCsv();
      if (action === "csv-import") openBulkDialog();
    });
    document.addEventListener("click", closeDataMenu);
    $("#json-file-input").addEventListener("change", (event) => {
      if (event.target.files[0]) importJson(event.target.files[0]);
      event.target.value = "";
    });
    $("#csv-file-input").addEventListener("change", (event) => {
      if (event.target.files[0]) importCsv(event.target.files[0]);
      event.target.value = "";
    });
    $("#print-button").addEventListener("click", () => window.print());
    $("#png-button").addEventListener("click", exportPng);

    document.addEventListener("pointermove", onGlobalPointerMove, { passive: false });
    document.addEventListener("pointerup", onGlobalPointerUp);
    document.addEventListener("pointercancel", onGlobalPointerUp);
    document.addEventListener("keydown", (event) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "");
      if (event.key === "Escape" && selectedAttendeeId) selectAttendee(selectedAttendeeId);
      if (!typing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        (event.shiftKey ? $("#redo-button") : $("#undo-button")).click();
      }
      if (!typing && (event.key === "Backspace" || event.key === "Delete") && selectedAttendeeId && assignedSeatFor(selectedAttendeeId)) {
        event.preventDefault();
        unassignAttendee(selectedAttendeeId);
      }
    });
  }

  function registerWebMcpTools() {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    const reportError = () => {};

    try {
      void Promise.resolve(context.registerTool({
        name: "add_attendees",
        title: "참석자 일괄 추가",
        description: "PRIME 컨퍼런스홀 좌석배치에 한 명 이상의 참석자를 미배정 상태로 추가합니다.",
        inputSchema: {
          type: "object",
          properties: {
            attendees: {
              type: "array",
              minItems: 1,
              maxItems: 63,
              items: {
                type: "object",
                properties: {
                  name: { type: "string", minLength: 1, maxLength: 80 },
                  org: { type: "string", maxLength: 120 },
                  title: { type: "string", maxLength: 80 },
                  type: { type: "string", maxLength: 40 },
                  group: { type: "string", maxLength: 100 },
                  note: { type: "string", maxLength: 500 },
                },
                required: ["name"],
                additionalProperties: false,
              },
            },
          },
          required: ["attendees"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input) {
          if (!input || !Array.isArray(input.attendees) || !input.attendees.length) throw new Error("attendees 배열이 필요합니다.");
          const additions = input.attendees.map((item) => {
            if (!item || typeof item.name !== "string" || !item.name.trim()) throw new Error("모든 참석자에게 이름이 필요합니다.");
            return {
              id: crypto.randomUUID(),
              name: item.name.trim().slice(0, 80),
              org: String(item.org || "").trim().slice(0, 120),
              title: String(item.title || "").trim().slice(0, 80),
              type: String(item.type || "기타").trim().slice(0, 40),
              group: String(item.group || "").trim().slice(0, 100),
              note: String(item.note || "").trim().slice(0, 500),
            };
          });
          transact(() => state.attendees.push(...additions));
          return { added: additions.length, attendeeIds: additions.map((item) => item.id), totalAttendees: state.attendees.length };
        },
      }, { signal: controller.signal })).catch(reportError);

      void Promise.resolve(context.registerTool({
        name: "assign_seats",
        title: "좌석 일괄 배정",
        description: "참석자 ID를 PRIME 컨퍼런스홀 내부 좌석 ID에 일괄 배정합니다. 기존 배정 좌석은 이동되며 대상 좌석 점유자는 미배정 처리됩니다.",
        inputSchema: {
          type: "object",
          properties: {
            assignments: {
              type: "array",
              minItems: 1,
              maxItems: 63,
              items: {
                type: "object",
                properties: { attendeeId: { type: "string" }, seatId: { type: "string" } },
                required: ["attendeeId", "seatId"],
                additionalProperties: false,
              },
            },
          },
          required: ["assignments"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input) {
          if (!input || !Array.isArray(input.assignments) || !input.assignments.length) throw new Error("assignments 배열이 필요합니다.");
          const attendeeIds = new Set();
          const seatIds = new Set();
          for (const assignment of input.assignments) {
            if (!attendeeById(assignment.attendeeId)) throw new Error(`참석자 ID를 찾을 수 없습니다: ${assignment.attendeeId}`);
            if (!seatById.has(assignment.seatId)) throw new Error(`좌석 ID를 찾을 수 없습니다: ${assignment.seatId}`);
            if (attendeeIds.has(assignment.attendeeId) || seatIds.has(assignment.seatId)) throw new Error("한 요청 안에서 참석자 또는 좌석이 중복되었습니다.");
            attendeeIds.add(assignment.attendeeId);
            seatIds.add(assignment.seatId);
          }
          transact(() => {
            for (const assignment of input.assignments) {
              const sourceSeat = assignedSeatFor(assignment.attendeeId);
              if (sourceSeat) delete state.assignments[sourceSeat];
              state.assignments[assignment.seatId] = assignment.attendeeId;
            }
          });
          return { assigned: input.assignments.length, totalAssigned: Object.keys(state.assignments).length };
        },
      }, { signal: controller.signal })).catch(reportError);
    } catch {
      controller.abort();
    }
  }

  function init() {
    $("#seat-id-list").replaceChildren(...roomTemplate.seats.map((seat) => new Option(seat.id, seat.id)));
    syncEventInputs();
    bindEventInputs();
    bindControls();
    applyMode();
    updateViewBox();
    renderRoom();
    renderAll();
    registerWebMcpTools();
  }

  init();
})();
