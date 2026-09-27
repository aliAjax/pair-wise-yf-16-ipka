import type { AppState, HistoryEntry, Machine, WorkOrder } from "../domain/types";

const STORAGE_KEY = "sharpen-scheduler-v1";
const VERSION = 1;

/** 演示种子数据：三台机器、不同砂轮余量，覆盖待排/磨刃中/退回/完工各状态 */
export function seedState(): AppState {
  const now = Date.now();
  const hour = 3600 * 1000;

  const machines: Machine[] = [
    {
      id: "M1",
      name: "精密数控磨刃机",
      kind: "数控机",
      compatibleTypes: ["竞速板", "全能板"],
      wheelTotalM: 60,
      wheelUsedM: 58.9,
      slots: [
        { id: "A", label: "A槽" },
        { id: "B", label: "B槽" },
      ],
    },
    {
      id: "M2",
      name: "通用磨刃机",
      kind: "通用机",
      compatibleTypes: ["公园板", "粉雪板", "全能板"],
      wheelTotalM: 80,
      wheelUsedM: 39.8,
      slots: [
        { id: "A", label: "A槽" },
        { id: "B", label: "B槽" },
        { id: "C", label: "C槽" },
      ],
    },
    {
      id: "M3",
      name: "手工精修台",
      kind: "手工台",
      compatibleTypes: ["竞速板", "公园板", "粉雪板", "全能板"],
      wheelTotalM: 20,
      wheelUsedM: 8,
      slots: [{ id: "A", label: "A槽" }],
    },
  ];

  const orders: WorkOrder[] = [
    {
      id: "MO-2601",
      customer: "老周",
      brand: "Burton Custom",
      boardType: "公园板",
      boardLengthCm: 156,
      target: { sideLeft: 88, sideRight: 88, base: 0.8 },
      status: "pending",
      conflict: null,
      assignment: null,
      measured: null,
      rejectNote: null,
      createdAt: now - 26 * hour,
      completedAt: null,
    },
    {
      id: "MO-2602",
      customer: "小赵",
      brand: "Atomic Redster",
      boardType: "竞速板",
      boardLengthCm: 165,
      target: { sideLeft: 87.5, sideRight: 87.5, base: 0.5 },
      status: "pending",
      conflict: "上次派工 M1·A槽：余量不足",
      assignment: null,
      measured: null,
      rejectNote: null,
      createdAt: now - 22 * hour,
      completedAt: null,
    },
    {
      id: "MO-2603",
      customer: "阿岚",
      brand: "Jones Mountain Twin",
      boardType: "粉雪板",
      boardLengthCm: 158,
      target: { sideLeft: 88, sideRight: 88, base: 1 },
      status: "active",
      conflict: null,
      assignment: { machineId: "M2", slotId: "A" },
      measured: null,
      rejectNote: null,
      createdAt: now - 8 * hour,
      completedAt: null,
    },
    {
      id: "MO-2604",
      customer: "大伟",
      brand: "Salomon QST",
      boardType: "全能板",
      boardLengthCm: 162,
      target: { sideLeft: 88, sideRight: 88, base: 0.8 },
      status: "rework",
      conflict: null,
      assignment: { machineId: "M3", slotId: "A" },
      measured: { sideLeft: 88.4, sideRight: 88, base: 0.8 },
      rejectNote: "超差：左侧刃 +0.4°（容差 ±0.3°），原槽保留返工",
      createdAt: now - 30 * hour,
      completedAt: null,
    },
    {
      id: "MO-2605",
      customer: "老周",
      brand: "Head Worldcup",
      boardType: "竞速板",
      boardLengthCm: 165,
      target: { sideLeft: 88, sideRight: 88, base: 0.7 },
      status: "done",
      conflict: null,
      assignment: { machineId: "M1", slotId: "A" },
      measured: { sideLeft: 88.1, sideRight: 87.9, base: 0.7 },
      rejectNote: null,
      createdAt: now - 50 * hour,
      completedAt: now - 46 * hour,
    },
  ];

  const history: HistoryEntry[] = [
    {
      id: "H-2604-1",
      orderId: "MO-2604",
      customer: "大伟",
      boardLabel: "Salomon QST · 全能板 162cm",
      machineId: "M3",
      machineName: "手工精修台",
      slotLabel: "A槽",
      measured: { sideLeft: 88.4, sideRight: 88, base: 0.8 },
      result: "reject",
      at: now - 6 * hour,
    },
    {
      id: "H-2605-1",
      orderId: "MO-2605",
      customer: "老周",
      boardLabel: "Head Worldcup · 竞速板 165cm",
      machineId: "M1",
      machineName: "精密数控磨刃机",
      slotLabel: "A槽",
      measured: { sideLeft: 88.1, sideRight: 87.9, base: 0.7 },
      result: "pass",
      at: now - 46 * hour,
    },
  ];

  return { version: VERSION, seq: 2606, machines, orders, history };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as AppState;
    if (
      parsed.version !== VERSION ||
      !Array.isArray(parsed.machines) ||
      !Array.isArray(parsed.orders) ||
      !Array.isArray(parsed.history)
    ) {
      return seedState();
    }
    return parsed;
  } catch {
    return seedState();
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 浏览器存储不可用时静默降级，页面状态仍在内存中
  }
}

export function resetState(): AppState {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 同上
  }
  return seedState();
}
