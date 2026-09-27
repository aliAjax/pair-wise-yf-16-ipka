// 磨刃排程台 · 存储层
// 只负责浏览器持久化与初始数据，不包含任何派工 / 完工判定规则。

import {
  STORAGE_VERSION,
  type HistoryEntry,
  type Machine,
  type Order,
  type ShopState,
} from "./rules";

const STORAGE_KEY = "edge-sharpener-shop-v1";

const now = Date.now();

function seedMachines(): Machine[] {
  return [
    {
      id: "M1",
      name: "精磨一号机",
      wheelCapacity: 4000,
      wheelRemaining: 2360,
      slotCount: 4,
      accepts: ["race", "all"],
    },
    {
      id: "M2",
      name: "通用二号机",
      wheelCapacity: 5000,
      wheelRemaining: 4120,
      slotCount: 6,
      accepts: ["race", "all", "park", "powder"],
    },
    {
      id: "M3",
      name: "板型修磨三号机",
      wheelCapacity: 3000,
      wheelRemaining: 1540,
      slotCount: 3,
      accepts: ["park", "powder", "all"],
    },
  ];
}

function seedOrders(): Order[] {
  return [
    {
      id: "WO-1001",
      customer: "张弛",
      board: "Blizzard Racing GS 165",
      boardType: "race",
      length: 165,
      targets: { leftSide: 87, rightSide: 87, base: 1 },
      status: "scheduled",
      machineId: "M1",
      slot: 2,
      conflicts: [],
      actuals: null,
      deviations: null,
      createdAt: now - 1000 * 60 * 60 * 26,
      scheduledAt: now - 1000 * 60 * 60 * 4,
      finishedAt: null,
    },
    {
      id: "WO-1002",
      customer: "李南",
      board: "Burton Custom 158",
      boardType: "all",
      length: 158,
      targets: { leftSide: 88, rightSide: 88, base: 1 },
      status: "pending",
      machineId: null,
      slot: null,
      conflicts: [],
      actuals: null,
      deviations: null,
      createdAt: now - 1000 * 60 * 60 * 5,
      scheduledAt: null,
      finishedAt: null,
    },
    {
      id: "WO-1003",
      customer: "王北",
      board: "Line Sakana 183",
      boardType: "powder",
      length: 183,
      targets: { leftSide: 89, rightSide: 89, base: 0.5 },
      status: "pending",
      machineId: null,
      slot: null,
      conflicts: [],
      actuals: null,
      deviations: null,
      createdAt: now - 1000 * 60 * 90,
      scheduledAt: null,
      finishedAt: null,
    },
    {
      id: "WO-1004",
      customer: "赵临",
      board: "Bataleon Goliath 159",
      boardType: "park",
      length: 159,
      targets: { leftSide: 88, rightSide: 88, base: 0.75 },
      status: "pending",
      machineId: null,
      slot: null,
      conflicts: [],
      actuals: null,
      deviations: null,
      createdAt: now - 1000 * 60 * 30,
      scheduledAt: null,
      finishedAt: null,
    },
  ];
}

function seedHistory(): HistoryEntry[] {
  return [
    {
      customer: "张弛",
      orderId: "WO-0997",
      board: "Head Worldcup GS 170",
      boardType: "race",
      machineId: "M1",
      machineName: "精磨一号机",
      slot: 1,
      targets: { leftSide: 87, rightSide: 87, base: 1 },
      actuals: { leftSide: 87.1, rightSide: 87.0, base: 1.05 },
      passed: true,
      at: now - 1000 * 60 * 60 * 24 * 3,
    },
    {
      customer: "赵临",
      orderId: "WO-0994",
      board: "Bataleon Goliath 159",
      boardType: "park",
      machineId: "M3",
      machineName: "板型修磨三号机",
      slot: 3,
      targets: { leftSide: 88, rightSide: 88, base: 0.75 },
      actuals: { leftSide: 88.4, rightSide: 88.1, base: 0.8 },
      passed: false,
      at: now - 1000 * 60 * 60 * 24 * 6,
    },
  ];
}

export function createInitialState(): ShopState {
  return {
    version: STORAGE_VERSION,
    orderSeq: 1005,
    machines: seedMachines(),
    orders: seedOrders(),
    history: seedHistory(),
  };
}

export function loadState(): ShopState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as Partial<ShopState>;
    if (parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.orders)) {
      return createInitialState();
    }
    return parsed as ShopState;
  } catch {
    return createInitialState();
  }
}

export function saveState(state: ShopState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 浏览器隐私模式或存储已满时静默失败，不影响当班操作
  }
}

export function resetState(): ShopState {
  const fresh = createInitialState();
  saveState(fresh);
  return fresh;
}
