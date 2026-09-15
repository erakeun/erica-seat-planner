import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const app = readFileSync(new URL("../dist/app.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");

function declaration(name) {
  const match = app.match(new RegExp(`  function ${name}\\([^]*?(?=\\n  function |\\n  async function )`));
  assert.ok(match, `${name} declaration should exist`);
  return match[0];
}

test("V1 persistence contract and approved seat totals stay intact", () => {
  assert.match(app, /const STORAGE_KEY = "erica-seat-planner:v1"/);
  assert.match(app, /schemaVersion: 1/);
  assert.match(app, /roomTemplate\.seats\.length !== 63/);
  assert.match(app, /monitorSeats\.length !== 49/);
  assert.match(app, /roomTemplate\.geometry\.staffTables\.length !== 7/);
});

test("attendee modal cancellation bypasses required-field validation", () => {
  const dialog = html.match(/<dialog id="attendee-dialog"[^]*?<\/dialog>/)?.[0] || "";
  assert.match(dialog, /id="attendee-name" required/);
  assert.equal((dialog.match(/data-close-dialog type="button"/g) || []).length, 2);
  assert.doesNotMatch(dialog, /value="cancel" type="submit"/);
});

test("V2 institution, bulk preview, fixed-seat and draft controls exist", () => {
  for (const id of [
    "institution-inline-button", "bulk-attendee-button", "auto-layout-button",
    "attendee-institution", "attendee-rank", "attendee-fixed-seat", "attendee-locked",
    "bulk-preview-body", "auto-preview-body", "auto-include-head", "auto-fill-staff", "nameplate-button",
  ]) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(app, /institutions: \[\]/);
  assert.match(app, /seatLocked: Boolean/);
  assert.match(app, /autoDraft = \{ assignments, rows, errors, warnings, referenceMap \}/);
});

test("CSV parser handles quoted commas and doubled quotes", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${declaration("parseCsv")}\nthis.parseCsv = parseCsv;`, context);
  assert.deepEqual(
    JSON.parse(JSON.stringify(context.parseCsv('이름,비고\r\n"가,온","말 ""인용"""\r\n'))),
    [["이름", "비고"], ["가,온", '말 "인용"']]
  );
});

test("example CSV is BOM encoded and uses the required V2 columns", () => {
  assert.match(app, /const BULK_HEADERS = \["이름", "소속", "직위", "기관", "기관역할", "기관내순위", "좌석고정", "참석구분", "비고"\]/);
  assert.match(app, /new Blob\(\["\\ufeff", csv\]/);
});

test("nameplate handoff keeps personal data out of URLs and uses an origin-bound message", () => {
  const handoff = declaration("openNameplateMaker");
  assert.match(handoff, /postMessage\(payload, targetOrigin\)/);
  assert.match(handoff, /transferId: crypto\.randomUUID\(\)/);
  assert.doesNotMatch(handoff, /URLSearchParams|location\.search|encodeURIComponent\(.*people/);
});

test("nameplate is a visible primary action with canonical disabled-state data", () => {
  assert.match(html, /class="button nameplate-action" id="nameplate-button"/);
  assert.match(html, /id="nameplate-action-help"/);
  const actionState = declaration("renderNameplateAction");
  assert.match(actionState, /const people = nameplatePeople\(\)/);
  assert.match(actionState, /button\.disabled = people\.length === 0/);
  assert.match(actionState, /전송할 참석자가 없습니다/);
  const handoff = declaration("openNameplateMaker");
  assert.match(handoff, /const people = nameplatePeople\(\)/);
});
