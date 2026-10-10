import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const projects = JSON.parse(readFileSync(join(here, "projects.json"), "utf8"));

const REQUIRED = ["id", "num", "pill", "category", "title", "lead", "cardTitle", "cardDesc", "cardTags", "cardRole", "mediaLabel", "spec", "flow"];

// 這些欄位會直接印在頁面上，空字串等於開天窗，因此要求非空字串
const NON_EMPTY_TEXT = ["id", "num", "pill", "category", "title", "lead", "cardTitle", "cardDesc", "cardRole", "mediaLabel"];

// FlowSection 依 type 取用不同欄位；漏掉這些欄位會讓整個詳細頁拋錯（路由層沒有 error boundary）
const BLOCK_FIELDS = {
  prose: ["text"],
  roles: ["items"],
  result: ["k", "v", "p"],
  demo: ["demo"],
};

test("id 不重複，否則 /portfolio/:id 會指向錯誤的專案", () => {
  const ids = projects.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("每筆專案都有列表頁與詳細頁需要的欄位", () => {
  for (const p of projects) {
    for (const key of REQUIRED) {
      assert.ok(p[key] !== undefined && p[key] !== null, `${p.id} 缺少 ${key}`);
    }
    for (const key of NON_EMPTY_TEXT) {
      assert.ok(typeof p[key] === "string" && p[key].length > 0, `${p.id} 的 ${key} 是空字串`);
    }
    assert.ok(Array.isArray(p.cardTags) && p.cardTags.length > 0, `${p.id} cardTags 為空`);
    assert.ok(Array.isArray(p.spec) && p.spec.length > 0, `${p.id} spec 為空`);
  }
});

test("編號與陣列順序一致，且從 01 連續遞增", () => {
  projects.forEach((p, i) => {
    assert.equal(p.num, String(i + 1).padStart(2, "0"), `${p.id} 的編號與排序不符`);
  });
});

test("flow 區塊都有 FlowSection 依 type 取用的欄位", () => {
  for (const p of projects) {
    assert.ok(p.flow.length > 0, `${p.id} 沒有 flow`);
    for (const block of p.flow) {
      assert.ok(block.type && block.idx && block.heading, `${p.id} 有 flow 區塊缺少欄位`);
      assert.ok(BLOCK_FIELDS[block.type], `${p.id} 出現未支援的 flow type：${block.type}`);
      for (const key of BLOCK_FIELDS[block.type]) {
        assert.ok(block[key] !== undefined, `${p.id} 的 ${block.type} 區塊缺少 ${key}`);
      }
      if (block.type === "roles") {
        assert.ok(block.items.length > 0, `${p.id} 的 roles 區塊沒有項目`);
        for (const it of block.items) {
          assert.ok(it.n && it.h && it.p, `${p.id} 有 role 項目缺少欄位`);
        }
      }
    }
  }
});

test("截圖與原始碼區塊要嘛有內容，要嘛整個欄位不存在", () => {
  for (const p of projects) {
    if (p.shots !== undefined) {
      assert.ok(Array.isArray(p.shots) && p.shots.length > 0, `${p.id} 的 shots 是空陣列，應整欄移除`);
      assert.ok(p.screensHeading, `${p.id} 有 shots 卻沒有 screensHeading，會出現空標題`);
      for (const s of p.shots) assert.ok(s.cap, `${p.id} 有截圖缺少說明文字`);
    }
    if (p.repo !== undefined) {
      for (const key of ["idx", "heading", "name", "label", "url"]) {
        assert.ok(p.repo[key], `${p.id} 的 repo 缺少 ${key}`);
      }
    }
  }
});

test("featured 為 true 的專案會出現在首頁，數量不為零", () => {
  assert.ok(projects.some((p) => p.featured));
});
