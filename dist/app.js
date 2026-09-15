(() => {
  "use strict";

  const STORAGE_KEY = "erica-seat-planner:v1";
  const FULL_VIEW = { x: 0, y: 0, width: 1400, height: 1000, zoom: 1 };
  const GROUP_COLORS = ["#1268b3", "#7b4ca0", "#b55725", "#2b7a65", "#8f3e55", "#556b2f"];

  const roomTemplate = Object.freeze({
    id: "prime-conference-hall",
    name: "PRIME Conference Hall",
    areaReference: "252.19㎡",
    seats: Object.freeze([
      ...Array.from({ length: 24 }, (_, index) => ({
        id: `MAIN-L-${String(index + 1).padStart(2, "0")}`,
        section: "main-left",
        sectionLabel: "메인 왼쪽",
        number: index + 1,
        x: 410 + Math.sin((index / 23) * Math.PI) * 34,
        y: 246 + index * 26.1,
        width: 132,
        height: 23,
      })),
      ...Array.from({ length: 24 }, (_, index) => ({
        id: `MAIN-R-${String(index + 1).padStart(2, "0")}`,
        section: "main-right",
        sectionLabel: "메인 오른쪽",
        number: index + 1,
        x: 990 - Math.sin((index / 23) * Math.PI) * 34,
        y: 246 + index * 26.1,
        width: 132,
        height: 23,
      })),
      {
        id: "HEAD-01",
        section: "head",
        sectionLabel: "중앙 상석",
        number: 1,
        x: 700,
        y: 139,
        width: 174,
        height: 38,
      },
      ...Array.from({ length: 7 }, (_, index) => ({
        id: `STAFF-${String(index + 1).padStart(2, "0")}`,
        section: "staff-left",
        sectionLabel: "수행원 왼쪽",
        number: index + 1,
        x: 175,
        y: 270 + index * 88,
        width: 130,
        height: 40,
      })),
      ...Array.from({ length: 7 }, (_, index) => ({
        id: `STAFF-${String(index + 8).padStart(2, "0")}`,
        section: "staff-right",
        sectionLabel: "수행원 오른쪽",
        number: index + 8,
        x: 1225,
        y: 270 + index * 88,
        width: 130,
        height: 40,
      })),
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
    assignments: {},
    settings: { showSeatNumbers: true, mode: "edit" },
  });

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

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const seatById = new Map(roomTemplate.seats.map((seat) => [seat.id, seat]));

  const elements = {
    shell: $("#app-shell"),
    roomSvg: $("#room-svg"),
    roomViewport: $("#room-viewport"),
    seatLayer: $("#seat-layer"),
    attendeeList: $("#attendee-list"),
    selectedCard: $("#selected-card"),
    dragGhost: $("#drag-ghost"),
    attendeeDialog: $("#attendee-dialog"),
    resetDialog: $("#reset-dialog"),
    attendeeForm: $("#attendee-form"),
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
    saveTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, snapshot());
      $("#save-status").textContent = "자동저장됨";
      $(".save-dot").style.background = "#178459";
    }, 260);
  }

  function attendeeById(id) {
    return state.attendees.find((attendee) => attendee.id === id) || null;
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
    const source = attendee.group || attendee.org || attendee.type || attendee.name;
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

  function renderSeats() {
    elements.seatLayer.replaceChildren();
    for (const seat of roomTemplate.seats) {
      const attendee = attendeeById(state.assignments[seat.id]);
      const isStaff = seat.section.startsWith("staff");
      const isHead = seat.section === "head";
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

      const border = attendee ? colorFor(attendee) : isStaff ? "#75808b" : isHead ? "#b98a39" : "#a8b1ba";
      const fill = attendee ? "#ffffff" : isStaff ? "#eef0f2" : "#f9fafb";
      group.append(svgNode("rect", {
        class: "seat-hit",
        x: 0,
        y: 0,
        width: seat.width,
        height: seat.height,
        rx: isHead ? 8 : 5,
        fill,
        stroke: border,
        "stroke-width": attendee ? 2.2 : 1.2,
      }));

      if (attendee) {
        group.append(svgNode("rect", { x: 0, y: 0, width: 5, height: seat.height, rx: 3, fill: border }));
      }

      if (!isStaff) {
        const monitorX = seat.section === "main-right" ? 4 : seat.width - 16;
        group.append(svgNode("rect", {
          x: monitorX,
          y: seat.height / 2 - 5,
          width: 12,
          height: 10,
          rx: 1.5,
          fill: attendee ? "#203040" : "#3d4751",
          opacity: attendee ? .85 : .55,
        }));
        const micX = seat.section === "main-right" ? seat.width - 7 : 7;
        group.append(svgNode("path", {
          d: `M${micX} ${seat.height - 3} q0 -7 ${seat.section === "main-right" ? -6 : 6} -9`,
          fill: "none",
          stroke: "#29333c",
          "stroke-width": 1.2,
          opacity: .65,
        }));
      }

      const textAnchor = "middle";
      const centerX = seat.width / 2;
      if (attendee) {
        const nameY = isStaff || isHead ? seat.height / 2 - 3 : seat.height / 2 + 3.5;
        group.append(svgNode("text", {
          class: "seat-text",
          x: centerX,
          y: nameY,
          "text-anchor": textAnchor,
          "font-size": isStaff || isHead ? 11.5 : 10.5,
          "font-weight": 800,
          fill: "#12263a",
        }, truncate(attendee.name, isStaff || isHead ? 12 : 10)));
        if ((isStaff || isHead || view.zoom >= 1.38) && (attendee.org || attendee.title)) {
          group.append(svgNode("text", {
            class: "seat-text",
            x: centerX,
            y: isStaff || isHead ? seat.height / 2 + 11 : seat.height - 2.4,
            "text-anchor": textAnchor,
            "font-size": 7.4,
            fill: "#687586",
          }, truncate([attendee.org, attendee.title].filter(Boolean).join(" · "), isStaff || isHead ? 20 : 15)));
        }
      } else {
        group.append(svgNode("text", {
          class: "seat-text",
          x: centerX,
          y: seat.height / 2 + 3.5,
          "text-anchor": textAnchor,
          "font-size": isStaff ? 9 : 8.5,
          "font-weight": 700,
          fill: "#74808b",
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
          <span>${escapeHtml([attendee.org, attendee.title].filter(Boolean).join(" · ") || attendee.type)}</span>
          ${seatId ? `<em class="seat-chip">${escapeHtml(seatId)}</em>` : ""}
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
    $("#selected-meta").textContent = [attendee.org, attendee.title, assignedSeatFor(attendee.id) || "미배정"].filter(Boolean).join(" · ");
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
      selectedAttendeeId = attendeeId;
    }, displacedAttendeeId && sourceSeatId ? "두 좌석을 교환했습니다." : displacedAttendeeId ? "기존 참석자를 미배정으로 이동했습니다." : `${targetSeatId}에 배정했습니다.`);
  }

  function unassignAttendee(attendeeId) {
    const seatId = assignedSeatFor(attendeeId);
    if (!seatId) return;
    transact(() => {
      delete state.assignments[seatId];
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

  function openAttendeeDialog(attendeeId = null) {
    const attendee = attendeeById(attendeeId);
    $("#attendee-dialog-title").textContent = attendee ? "참석자 수정" : "참석자 추가";
    $("#attendee-id").value = attendee?.id || "";
    $("#attendee-name").value = attendee?.name || "";
    $("#attendee-org").value = attendee?.org || "";
    $("#attendee-title").value = attendee?.title || "";
    $("#attendee-type").value = attendee?.type || "교내";
    $("#attendee-group").value = attendee?.group || "";
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
    };
    transact(() => {
      if (id) Object.assign(attendeeById(id), values);
      else state.attendees.push({ id: crypto.randomUUID(), ...values });
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
    $("#event-organizations").value = state.event.organizations;
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
    view.x = Math.min(1400 - view.width + paddingX, Math.max(-paddingX, view.x));
    view.y = Math.min(1000 - view.height + paddingY, Math.max(-paddingY, view.y));
  }

  function zoomTo(nextZoom, anchorX = 700, anchorY = 500) {
    const zoom = Math.min(2.4, Math.max(.72, nextZoom));
    const worldAnchorX = view.x + (anchorX / 1400) * view.width;
    const worldAnchorY = view.y + (anchorY / 1000) * view.height;
    view.zoom = zoom;
    view.width = 1400 / zoom;
    view.height = 1000 / zoom;
    view.x = worldAnchorX - (anchorX / 1400) * view.width;
    view.y = worldAnchorY - (anchorY / 1000) * view.height;
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
    const headers = ["이름", "소속", "직위", "구분", "기관·그룹", "비고", "좌석ID"];
    const rows = state.attendees.map((attendee) => [
      attendee.name,
      attendee.org,
      attendee.title,
      attendee.type,
      attendee.group,
      attendee.note,
      assignedSeatFor(attendee.id) || "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
    downloadBlob(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }), safeFilename("csv"));
    toast("참석자 명단을 CSV로 내보냈습니다.");
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

  function importCsv(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCsv(String(reader.result).replace(/^\ufeff/, "")).filter((row) => row.some((field) => field.trim()));
        if (rows.length < 2) throw new Error("empty");
        const headers = rows.shift().map((header) => header.trim());
        const aliases = {
          name: ["이름", "성명", "name"], org: ["소속", "기관", "organization", "org"], title: ["직위", "직책", "title"],
          type: ["구분", "type"], group: ["기관·그룹", "기관/그룹", "그룹", "group"], note: ["비고", "note"], seat: ["좌석ID", "좌석", "seat", "seatid"],
        };
        const indexes = Object.fromEntries(Object.entries(aliases).map(([key, values]) => [key, headers.findIndex((header) => values.some((value) => value.toLowerCase() === header.toLowerCase()))]));
        if (indexes.name < 0) throw new Error("name");
        const imported = rows.map((row) => ({
          id: crypto.randomUUID(),
          name: (row[indexes.name] || "").trim(),
          org: indexes.org >= 0 ? (row[indexes.org] || "").trim() : "",
          title: indexes.title >= 0 ? (row[indexes.title] || "").trim() : "",
          type: indexes.type >= 0 ? (row[indexes.type] || "기타").trim() || "기타" : "기타",
          group: indexes.group >= 0 ? (row[indexes.group] || "").trim() : "",
          note: indexes.note >= 0 ? (row[indexes.note] || "").trim() : "",
          requestedSeat: indexes.seat >= 0 ? (row[indexes.seat] || "").trim() : "",
        })).filter((attendee) => attendee.name);
        if (!imported.length) throw new Error("empty");
        transact(() => {
          imported.forEach(({ requestedSeat, ...attendee }) => {
            state.attendees.push(attendee);
            if (requestedSeat && seatById.has(requestedSeat) && !state.assignments[requestedSeat]) state.assignments[requestedSeat] = attendee.id;
          });
        }, `${imported.length}명의 참석자를 불러왔습니다.`);
      } catch (error) {
        toast(error.message === "name" ? "CSV 첫 행에 ‘이름’ 열이 필요합니다." : "CSV 명단을 읽지 못했습니다.", true);
      }
    };
    reader.readAsText(file, "UTF-8");
  }

  async function exportPng() {
    try {
      const clone = elements.roomSvg.cloneNode(true);
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clone.setAttribute("viewBox", "0 0 1400 1000");
      clone.setAttribute("width", "1680");
      clone.setAttribute("height", "1200");
      const svgText = new XMLSerializer().serializeToString(clone);
      const image = new Image();
      image.decoding = "sync";
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 1680;
      canvas.height = 1360;
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#1268b3";
      context.font = "700 18px sans-serif";
      context.textAlign = "center";
      context.fillText("HANYANG UNIVERSITY ERICA", 840, 35);
      context.fillStyle = "#182638";
      context.font = "700 36px sans-serif";
      context.fillText(state.event.title || "PRIME 컨퍼런스홀 좌석배치", 840, 80);
      context.fillStyle = "#687586";
      context.font = "20px sans-serif";
      const meta = [formatDate(state.event.date), state.event.organizations, state.event.location].filter(Boolean).join(" · ");
      context.fillText(meta, 840, 116);
      context.drawImage(image, 0, 160, 1680, 1200);
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
    $("#save-attendee-button").addEventListener("click", saveAttendee);
    $("#delete-attendee-button").addEventListener("click", deleteCurrentAttendee);
    $("#clear-selection-button").addEventListener("click", () => selectAttendee(selectedAttendeeId));
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
      const anchorX = ((event.clientX - rect.left) / rect.width) * 1400;
      const anchorY = ((event.clientY - rect.top) / rect.height) * 1000;
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
      if (action === "csv-import") $("#csv-file-input").click();
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
    syncEventInputs();
    bindEventInputs();
    bindControls();
    applyMode();
    updateViewBox();
    renderAll();
    registerWebMcpTools();
  }

  init();
})();
