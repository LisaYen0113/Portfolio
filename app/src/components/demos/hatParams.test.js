import test from "node:test";
import assert from "node:assert/strict";
import { HAT_LIMITS, adjust } from "./hatParams.js";

test("增加時加上一個 step", () => {
  assert.equal(adjust(0.05, "moonSpeed", 1), 0.055);
});

test("已在最大值時增加無效", () => {
  assert.equal(adjust(HAT_LIMITS.moonSpeed.max, "moonSpeed", 1), HAT_LIMITS.moonSpeed.max);
});

test("減少時減去一個 step", () => {
  assert.equal(adjust(0.05, "moonSpeed", -1), 0.045);
});

test("已在最小值時減少無效，且不會低於下限", () => {
  assert.equal(adjust(HAT_LIMITS.moonSpeed.min, "moonSpeed", -1), HAT_LIMITS.moonSpeed.min);
});

test("不會因浮點誤差累積而超出範圍", () => {
  let value = HAT_LIMITS.earthSpeed.initial;
  for (let i = 0; i < 200; i++) value = adjust(value, "earthSpeed", 1);
  assert.equal(value, HAT_LIMITS.earthSpeed.max);
});

test("四個參數的初始值都在範圍內", () => {
  for (const [key, limit] of Object.entries(HAT_LIMITS)) {
    assert.ok(limit.initial >= limit.min && limit.initial <= limit.max, `${key} 初始值超出範圍`);
  }
});

test("距離參數可增加到 400 / 500 且不會超過", () => {
  let a = HAT_LIMITS.earth1Distance.initial;
  for (let i = 0; i < 100; i++) a = adjust(a, "earth1Distance", 1);
  assert.equal(a, 400);

  let b = HAT_LIMITS.earth2Distance.initial;
  for (let i = 0; i < 100; i++) b = adjust(b, "earth2Distance", 1);
  assert.equal(b, 500);
});

test("未知的參數鍵會拋錯", () => {
  assert.throws(() => adjust(1, "notAKey", 1), /未知的帽子參數/);
});
