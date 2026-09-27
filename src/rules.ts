// 磨刃排程台 · 业务规则层
// 机型、板型、砂轮寿命、派工冲突与完工判定全部在这里维护，页面与存储不内嵌规则。

export type BoardType = "race" | "all" | "park" | "powder";

export type OrderStatus = "pending" | "scheduled" | "returned" | "done";

export interface AngleTargets {
  /** 左侧刃目标角度（°） */
  leftSide: number;
  /** 右侧刃目标角度（°） */
  rightSide: number;
  /** 底刃目标角度（°） */
  base: number;
}

export interface AngleActuals {
  leftSide: number;
  rightSide: number;
  base: number;
}

export interface Machine {
  id: string;
  name: string;
  /** 砂轮可磨总长度（厘米） */
  wheelCapacity: number;
  /** 当前剩余砂轮寿命（厘米） */
  wheelRemaining: number;
  /** 磨头槽位数 */
  slotCount: number;
  /** 可磨板型 */
  accepts: BoardType[];
}

export interface Order {
  id: string;
  customer: string;
  board: string;
  boardType: BoardType;
  /** 板长（厘米），即本单占用的砂轮寿命 */
  length: number;
  targets: AngleTargets;
  status: OrderStatus;
  machineId: string | null;
  slot: number | null;
  /** 待排 / 退回时留存的冲突与返工说明 */
  conflicts: string[];
  actuals: AngleActuals | null;
  /** 各刃实测与目标的偏差绝对值（°） */
  deviations: AngleActuals | null;
  createdAt: number;
  scheduledAt: number | null;
  finishedAt: number | null;
}

/** 客户历史条目：始终保留机器、槽位与实测角度 */
export interface HistoryEntry {
  customer: string;
  orderId: string;
  board: string;
  boardType: BoardType;
  machineId: string;
  machineName: string;
  slot: number;
  targets: AngleTargets;
  actuals: AngleActuals;
  passed: boolean;
  at: number;
}

export interface ShopState {
  version: number;
  orderSeq: number;
  machines: Machine[];
  orders: Order[];
  history: HistoryEntry[];
}

export const STORAGE_VERSION = 1;
/** 任一刃实测与目标偏差超过该值即退回（°） */
export const ANGLE_TOLERANCE = 0.3;

export const BOARD_TYPES: Record<BoardType, string> = {
  race: "竞速板",
  all: "全地域",
  park: "公园板",
  powder: "粉雪板",
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "待排",
  scheduled: "已排程",
  returned: "退回返工",
  done: "完工",
};

export const ANGLE_FIELDS = [
  { key: "leftSide", label: "左侧刃" },
  { key: "rightSide", label: "右侧刃" },
  { key: "base", label: "底刃" },
] as const;

export function slotLabel(slot: number): string {
  return `${slot} 号槽`;
}

/** 槽位是否被已派工或退回返工的工单占用（退回原槽不释放） */
export function isSlotOccupied(
  orders: Order[],
  machineId: string,
  slot: number,
  excludeOrderId?: string
): boolean {
  return orders.some(
    (o) =>
      o.id !== excludeOrderId &&
      o.machineId === machineId &&
      o.slot === slot &&
      (o.status === "scheduled" || o.status === "returned")
  );
}

export function occupiedSlots(orders: Order[], machineId: string): number[] {
  return orders
    .filter(
      (o) =>
        o.machineId === machineId &&
        (o.status === "scheduled" || o.status === "returned")
    )
    .map((o) => o.slot as number);
}

export type ConflictCode = "machine" | "wheel" | "slot";

export interface DispatchCheck {
  ok: boolean;
  conflicts: string[];
  codes: ConflictCode[];
}

/** 派工校验：机型不合 / 砂轮余量不足 / 槽位占用，逐项写明 */
export function checkDispatch(
  machine: Machine,
  order: Order,
  orders: Order[],
  slot: number
): DispatchCheck {
  const conflicts: string[] = [];
  const codes: ConflictCode[] = [];

  if (!machine.accepts.includes(order.boardType)) {
    codes.push("machine");
    conflicts.push(
      `机型不合：${machine.name} 不支持${BOARD_TYPES[order.boardType]}`
    );
  }

  if (machine.wheelRemaining < order.length) {
    codes.push("wheel");
    conflicts.push(
      `砂轮余量不足：剩余 ${machine.wheelRemaining}cm，本单板长 ${order.length}cm 需扣减`
    );
  }

  if (isSlotOccupied(orders, machine.id, slot, order.id)) {
    codes.push("slot");
    conflicts.push(`槽位占用：${slotLabel(slot)}已有未完工工单`);
  }

  return { ok: conflicts.length === 0, conflicts, codes };
}

/** 按板长扣减砂轮寿命 */
export function consumeWheel(machine: Machine, length: number): Machine {
  return { ...machine, wheelRemaining: machine.wheelRemaining - length };
}

export function deviationOf(target: number, actual: number): number {
  return Math.abs(actual - target);
}

export interface FinishResult {
  passed: boolean;
  actuals: AngleActuals;
  deviations: AngleActuals;
  /** 超差的刃说明 */
  failures: string[];
}

/** 完工判定：任一刃偏差超过 0.3° 即整单退回 */
export function evaluateFinish(targets: AngleTargets, actuals: AngleActuals): FinishResult {
  const deviations = {
    leftSide: deviationOf(targets.leftSide, actuals.leftSide),
    rightSide: deviationOf(targets.rightSide, actuals.rightSide),
    base: deviationOf(targets.base, actuals.base),
  };

  const failures: string[] = [];
  for (const { key, label } of ANGLE_FIELDS) {
    if (deviations[key] > ANGLE_TOLERANCE) {
      failures.push(
        `${label}偏差 ${deviations[key].toFixed(2)}°（目标 ${targets[key]}°，实测 ${actuals[key]}°，允差 ${ANGLE_TOLERANCE}°）`
      );
    }
  }

  return { passed: failures.length === 0, actuals, deviations, failures };
}

export function fmtAngle(n: number): string {
  return `${n.toFixed(2)}°`;
}
