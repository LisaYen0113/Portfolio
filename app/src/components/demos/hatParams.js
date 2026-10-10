// 墨西哥帽子 demo 的可調參數。範圍與增減量對應原始檔的 button.js。
export const HAT_LIMITS = Object.freeze({
  moonSpeed: Object.freeze({ min: 0.01, max: 0.1, step: 0.005, initial: 0.05 }),
  earthSpeed: Object.freeze({ min: 0.001, max: 0.05, step: 0.002, initial: 0.01 }),
  earth1Distance: Object.freeze({ min: 100, max: 400, step: 10, initial: 200 }),
  earth2Distance: Object.freeze({ min: 150, max: 500, step: 10, initial: 250 }),
});

/**
 * 依原檔規則調整參數：增加時若已達上限則維持不變，
 * 減少時若已達下限也維持不變。
 */
export function adjust(current, key, direction) {
  const limit = HAT_LIMITS[key];
  if (!limit) throw new Error(`未知的帽子參數：${key}`);

  const next = current + direction * limit.step;
  // toFixed 消除浮點累積誤差，否則連續增減後會出現 0.30000000000000004 這類值，
  // 讓「已達上限」的比較失準
  const rounded = Number(next.toFixed(6));
  return Math.min(limit.max, Math.max(limit.min, rounded));
}
