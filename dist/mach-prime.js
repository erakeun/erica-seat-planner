/* PRIME owns seats; roster changes never recalculate the room. */
(function (root) {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const fields = ['name', 'organization', 'position', 'status', 'replacesParticipantId'];
  const active = person => !['absent', 'replaced'].includes(person.status);
  const current = person => ({ participantId: person.participantId || person.id, name: person.name, organization: person.org || '', position: person.title || '', status: person.status || 'attending', replacesParticipantId: person.replacesParticipantId || '' });
  const equal = (a, b) => String(a ?? '').replace(/\s+/g, ' ').trim() === String(b ?? '').replace(/\s+/g, ' ').trim();
  const sourceFingerprint = person => JSON.stringify(fields.map(field => person[field] || ''));
  const seatFor = (state, id) => Object.keys(state.assignments).find(seat => state.assignments[seat] === id) || '';
  function preview(state, transfer, resume = false) {
    if (state.mach.linked && state.mach.eventId !== transfer.eventId) throw new Error('다른 행사입니다. 현재 배치를 JSON으로 보관한 뒤 새 배치에서 연결해 주세요.');
    if (state.mach.receipts[transfer.transferId] && state.mach.transferPayloads?.[transfer.transferId] !== JSON.stringify(transfer)) throw new Error('같은 전달 번호에 다른 내용이 들어 있습니다. 원큐에서 새 전달을 만들어 주세요.');
    if (state.mach.receipts[transfer.transferId] && !resume) return { duplicate: state.mach.receipts[transfer.transferId], rows: [] };
    if (state.mach.linked && transfer.baseRevision > state.mach.rosterRevision) throw new Error('현재 배치보다 새로운 기준의 변경입니다. 해당 기준 배치 JSON을 복원하거나 새 배치에서 명단을 확인해 주세요.');
    if (transfer.revision < (state.mach.rosterRevision || 0)) throw new Error('오래된 명단입니다. 원큐에서 최신 명단을 다시 보내 주세요.');
    const staleBase = state.mach.linked && transfer.baseRevision < state.mach.rosterRevision && transfer.revision > state.mach.rosterRevision;
    const rows = transfer.participants.map(incoming => {
      const seen = state.mach.sourceVersions?.[incoming.participantId];
      if (seen && seen.revision === transfer.revision && seen.fingerprint !== sourceFingerprint(incoming)) throw new Error('이미 확인한 명단에 다른 참석자 내용이 있습니다. 원큐의 최신 저장본을 다시 확인해 주세요.');
      const local = state.attendees.find(p => (p.participantId || p.id) === incoming.participantId);
      const base = Object.hasOwn(state.mach.baseline, incoming.participantId) ? state.mach.baseline[incoming.participantId] : undefined;
      const value = local ? current(local) : null;
      const changed = fields.filter(key => !equal(value?.[key], incoming[key]));
      const conflicts = local ? fields.filter(key => changed.includes(key) && (staleBase || !base || (!equal(value[key], base[key]) && !equal(incoming[key], base[key])))) : [];
      const replacement = incoming.replacesParticipantId && state.attendees.find(p => (p.participantId || p.id) === incoming.replacesParticipantId);
      return { participantId: incoming.participantId, incoming, localId: local?.id || '', before: value, base, changed, conflicts, seatId: local ? seatFor(state, local.id) : '', replacementId: replacement?.id || '', replacementSeatId: replacement ? seatFor(state, replacement.id) : '', locked: Boolean(local?.seatLocked || replacement?.seatLocked), candidates: !local && !state.mach.linked ? state.attendees.filter(p => equal(p.name, incoming.name)).map(p => ({ id: p.id, name: p.name, organization: p.org, seatId: seatFor(state, p.id) })) : [] };
    }).filter(row => row.changed.length || !row.localId);
    return { rows, staleBase, sourceSnapshot: JSON.stringify(state), transfer: clone(transfer) };
  }
  function apply(state, preview, choices, seatIds) {
    if (preview.sourceSnapshot !== JSON.stringify(state)) throw new Error('미리보기 후 배치가 바뀌었습니다. 다시 비교해 주세요.');
    const next = clone(state), selected = preview.rows.filter(row => choices[row.participantId]?.selected);
    if (!selected.length && preview.rows.length) throw new Error('반영할 변경을 선택해 주세요.');
    const idMap = new Map(next.attendees.map(p => [p.participantId || p.id, p]));
    const appliedIds = [...(state.mach.receipts[preview.transfer.transferId]?.appliedIds || []), ...(!preview.rows.length ? preview.transfer.participants.map(person=>person.participantId) : [])], pendingIds = [];
    // First resolve identity and participant-owned fields. Seats are handled only after all rows validate.
    for (const row of selected) {
      const choice = choices[row.participantId], incoming = row.incoming;
      let person = idMap.get(row.participantId);
      if (!person && row.candidates.length && !choice.matchId) throw new Error('동일 이름의 기존 참석자와 연결할지, 새 참석자로 등록할지 선택해 주세요.');
      if (!person && choice.matchId && choice.matchId !== 'new') {
        person = next.attendees.find(p => p.id === choice.matchId);
        if (!person || (person.participantId && person.participantId !== incoming.participantId && (state.mach.linked || person.participantId !== person.id)) || selected.some(other => other.localId === person.id)) throw new Error('참석자 연결이 중복되거나 유효하지 않습니다.');
        const alreadyMapped = next.attendees.some(p => p.id !== person.id && p.participantId === incoming.participantId);
        if (alreadyMapped) throw new Error('이미 연결된 참석자입니다.');
        const conflicts = fields.filter(key => !equal(current(person)[key], incoming[key]));
        if (conflicts.some(key => !['incoming', 'local', 'manual'].includes(choice.fields?.[key]?.mode || choice.fields?.[key]))) throw new Error('기존 참석자 연결 시 변경할 정보를 확인해 주세요.');
      }
      if (!person) {
        person = { id: incoming.participantId, participantId: incoming.participantId, name: '', org: '', title: '', replacedByParticipantId: '', status: 'attending', type: '기타', group: '', note: '', institutionId: '', institutionRank: null, fixedSeatId: '', seatLocked: false };
        if (next.attendees.some(p => p.id === person.id)) throw new Error('참석자 ID가 기존 자료와 충돌합니다.');
        next.attendees.push(person);
      }
      person.participantId = incoming.participantId;
      const value = current(person), baseline = { ...(next.mach.baseline[incoming.participantId] || {}) };
      let pending = false;
      for (const key of fields) {
        const resolution = choice.fields?.[key];
        if (row.conflicts.includes(key) && !['incoming', 'local', 'manual'].includes(resolution?.mode || resolution)) throw new Error('충돌 항목은 원큐 내용, 로컬 유지 또는 직접 정정을 선택해 주세요.');
        const mode = typeof resolution === 'object' ? resolution.mode : resolution;
        let resolved = incoming[key] || (key === 'status' ? 'attending' : '');
        // A source field unchanged since the last agreement must not erase a local edit.
        if (row.localId && equal(incoming[key], value[key])) resolved = value[key];
        if (row.localId && row.base && equal(incoming[key], row.base[key]) && !equal(value[key], row.base[key]) && !mode) { resolved = value[key]; pending = true; }
        if (mode === 'local') { resolved = value[key]; if (!equal(resolved, incoming[key])) pending = true; }
        if (mode === 'manual') { if (typeof resolution.value !== 'string' || resolution.value.length > 2000) throw new Error('직접 정정 값을 확인해 주세요.'); resolved = resolution.value; if (!equal(resolved, incoming[key])) pending = true; }
        if (key === 'status' && !['attending', 'absent', 'replaced'].includes(resolved)) throw new Error('참석 상태를 확인해 주세요.');
        person[({organization:'org',position:'title'})[key] || key] = resolved;
        if (equal(resolved, incoming[key])) baseline[key] = incoming[key];
      }
      baseline.participantId = incoming.participantId;
      next.mach.baseline[incoming.participantId] = baseline;
      idMap.set(incoming.participantId, person);
      (pending ? pendingIds : appliedIds).push(incoming.participantId);
    }
    // Only a selected absence or an explicitly chosen replacement releases its old seat.
    for (const row of selected) {
      const choice = choices[row.participantId], person = idMap.get(row.participantId);
      if (!active(person)) {
        if (person.seatLocked && !choice.confirmLock) throw new Error('고정석 비우기는 별도 확인이 필요합니다.');
        const seat = seatFor(next, person.id);
        if (seat) delete next.assignments[seat];
        person.fixedSeatId = ''; person.seatLocked = false;
      }
      if (person.replacesParticipantId && active(person) && !row.localId) {
        const original = idMap.get(person.replacesParticipantId);
        if (!original) throw new Error('대리참석 대상 원 참석자를 먼저 전달해 주세요.');
        if (!['inherit', 'unassigned', 'other'].includes(choice.seatMode)) throw new Error('대리참석자의 자리 처리 방식을 선택해 주세요.');
        if ((row.locked || original.seatLocked) && !choice.confirmLock) throw new Error('고정석 대리참석 처리는 별도 확인이 필요합니다.');
        const originalSeat = row.replacementSeatId || seatFor(next, original.id);
        const wasLocked = row.locked;
        const target = choice.seatMode === 'inherit' ? originalSeat : choice.seatMode === 'other' ? choice.seatId : '';
        if (target && (!seatIds.includes(target) || (next.assignments[target] && next.assignments[target] !== original.id && next.assignments[target] !== person.id))) throw new Error('선택한 자리가 없거나 이미 사용 중입니다.');
        if (target === 'HEAD-01' && !choice.confirmLock) throw new Error('중앙석 승계·신규 배정은 별도 확인이 필요합니다.');
        if (originalSeat) delete next.assignments[originalSeat];
        original.status = 'replaced'; original.replacedByParticipantId = person.participantId; original.seatLocked = false; original.fixedSeatId = '';
        if (target) next.assignments[target] = person.id;
        if (target && choice.seatMode === 'inherit' && wasLocked) { person.seatLocked = true; person.fixedSeatId = target; }
      }
    }
    if (next.attendees.filter(active).length > 63) throw new Error('활성 참석자는 최대 63명입니다.');
    if (next.attendees.filter(p => active(p) && p.type === '수행원').length > 14) throw new Error('수행원석 정원을 초과합니다.');
    next.mach.eventId = preview.transfer.eventId; next.mach.linked = true;
    next.mach.sourceVersions ||= {};
    for (const person of preview.transfer.participants) next.mach.sourceVersions[person.participantId] = {revision:preview.transfer.revision,fingerprint:sourceFingerprint(person)};
    next.mach.rosterRevision = Math.max(next.mach.rosterRevision || 0, preview.transfer.revision);
    next.mach.revision += 1;
    next.mach.needsSend = true;
    const remaining = preview.rows.filter(row => !appliedIds.includes(row.participantId)).map(row => row.participantId);
    const result = { status: remaining.length ? 'pending' : 'applied', appliedIds: [...new Set(appliedIds)], pendingIds: remaining, revision: next.mach.revision };
    // A partial receipt remains revisitable using a fresh transfer; retransmission returns the same outcome.
    next.mach.receipts[preview.transfer.transferId] = result;
    next.mach.transferPayloads ||= {};
    next.mach.transferPayloads[preview.transfer.transferId] = JSON.stringify(preview.transfer);
    next.mach.pendingIds = [...new Set([...(state.mach.pendingIds || []).filter(id => !result.appliedIds.includes(id)), ...remaining])];
    next.mach.history.push({ transferId: preview.transfer.transferId, at: new Date().toISOString(), appliedIds: result.appliedIds, pendingIds: remaining });
    return { state: next, result };
  }
  root.MachPrime = { preview, apply, current, active, seatFor };
  if (typeof module !== 'undefined') module.exports = root.MachPrime;
})(typeof globalThis !== 'undefined' ? globalThis : this);
