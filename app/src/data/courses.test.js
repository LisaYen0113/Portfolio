import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const courses = JSON.parse(readFileSync(join(here, "courses.json"), "utf8"));

// 課程跟專案共用同一張卡片（WorkCard），因此卡片欄位的要求與 projects.json 一致；
// 少一個欄位不會拋錯，只會在作品集頁上開天窗。
const REQUIRED = [
  "id",
  "num",
  "pill",
  "category",
  "title",
  "lead",
  "cardTitle",
  "cardDesc",
  "cardTags",
  "cardRole",
  "mediaLabel",
  "spec",
  "flow",
];

const NON_EMPTY_TEXT = [
  "id",
  "num",
  "pill",
  "category",
  "title",
  "lead",
  "cardTitle",
  "cardDesc",
  "cardRole",
  "mediaLabel",
];

const BLOCK_FIELDS = {
  prose: ["text"],
  roles: ["items"],
  result: ["k", "v", "p"],
  demo: ["demo"],
};

test("id 不重複，否則 /courses/:id 會指向錯誤的課程", () => {
  const ids = courses.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("每筆課程都有作品集卡片與詳細頁需要的欄位", () => {
  for (const c of courses) {
    for (const key of REQUIRED) {
      assert.ok(c[key] !== undefined && c[key] !== null, `${c.id} 缺少 ${key}`);
    }
    for (const key of NON_EMPTY_TEXT) {
      assert.ok(typeof c[key] === "string" && c[key].length > 0, `${c.id} 的 ${key} 是空字串`);
    }
    assert.ok(Array.isArray(c.cardTags) && c.cardTags.length > 0, `${c.id} cardTags 為空`);
    assert.ok(Array.isArray(c.spec) && c.spec.length > 0, `${c.id} spec 為空`);
  }
});

test("編號與陣列順序一致，且從 01 連續遞增", () => {
  courses.forEach((c, i) => {
    assert.equal(c.num, String(i + 1).padStart(2, "0"), `${c.id} 的編號與排序不符`);
  });
});

test("flow 區塊都有 FlowSection 依 type 取用的欄位", () => {
  for (const c of courses) {
    assert.ok(c.flow.length > 0, `${c.id} 沒有 flow`);
    for (const block of c.flow) {
      assert.ok(block.type && block.idx && block.heading, `${c.id} 有 flow 區塊缺少欄位`);
      assert.ok(BLOCK_FIELDS[block.type], `${c.id} 出現未支援的 flow type：${block.type}`);
      for (const key of BLOCK_FIELDS[block.type]) {
        assert.ok(block[key] !== undefined, `${c.id} 的 ${block.type} 區塊缺少 ${key}`);
      }
      if (block.type === "roles") {
        assert.ok(block.items.length > 0, `${c.id} 的 roles 區塊沒有項目`);
        for (const it of block.items) {
          assert.ok(it.n && it.h && it.p, `${c.id} 有 role 項目缺少欄位`);
        }
      }
    }
  }
});

// 詳細頁把「相關連結」排在第一個內容區塊之前，所以連結拿 01、flow 從 02 起算；
// 沒有連結的課程則由 01 起算。編號不連續時頁面上的區塊序號會跳號。
test("區塊編號依實際渲染順序從 01 連續遞增", () => {
  for (const c of courses) {
    const ordered = [...(c.links ? [c.links.idx] : []), ...c.flow.map((b) => b.idx)];
    const nums = ordered.map((s) => Number(String(s).split("—")[0].trim()));
    assert.deepEqual(
      nums,
      ordered.map((_, i) => i + 1),
      `${c.id} 的編號不連續：${ordered.join(" · ")}`
    );
  }
});

test("相關連結與截圖區塊要嘛有內容，要嘛整個欄位不存在", () => {
  for (const c of courses) {
    if (c.shots !== undefined) {
      assert.ok(Array.isArray(c.shots) && c.shots.length > 0, `${c.id} 的 shots 是空陣列，應整欄移除`);
      assert.ok(c.screensHeading, `${c.id} 有 shots 卻沒有 screensHeading，會出現空標題`);
      for (const s of c.shots) assert.ok(s.cap, `${c.id} 有截圖缺少說明文字`);
    }
    if (c.links !== undefined) {
      for (const key of ["idx", "heading", "name", "label", "url"]) {
        assert.ok(c.links[key], `${c.id} 的 links 缺少 ${key}`);
      }
      assert.ok(c.links.idx.startsWith("01"), `${c.id} 的連結沒有排在最上面（編號應為 01）`);
    }
  }
});
