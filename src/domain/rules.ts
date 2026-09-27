import type { BoardType, EdgeAngles, Machine, WorkOrder } from "./types";

/** 刃角容差：实测与目标偏差超过 0.3° 即退回 */
export const ANGLE_TOLERANCE = 0.3;

export const BOARD_TYPES: BoardType[] = ["竞速板", "公园板", "粉雪板", "全能板"];

/** 按板长扣减砂轮寿命：板长（厘米）换算为米 */
export function wheelConsumptionM(order: Pick<WorkOrder, "boardLengthCm">): number {
  return order.boardLengthCm / 100;
}

export function wheelRemainingM(machine: Machine): number {
  return Math.max(0, machine.wheelTotalM - machine.wheelUsedM);
}

/** 占用槽位的工单：磨刃中与退回返工都占槽，完工才释放 */
export function slotHolder(
  orders: WorkOrder[],
  machineId: string,
  slotId: string
): WorkOrder | null {
  return (
    orders.find(
      (o) =>
        o.assignment !== null &&
        o.assignment.machineId === machineId &&
        o.assignment.slotId === slotId &&
        (o.status === "active" || o.status === "rework")
    ) ?? null
  );
}

/**
 * 派工冲突检测：机型不合 / 余量不足 / 槽位占用。
 * 返回冲突标签数组，空数组表示可以派工。
 */
export function dispatchConflicts(
  order: WorkOrder,
  machine: Machine,
  slotId: string,
  orders: WorkOrder[]
): string[] {
  const conflicts: string[] = [];
  if (!machine.compatibleTypes.includes(order.boardType)) {
    conflicts.push("机型不合");
  }
  if (wheelRemainingM(machine) + 1e-9 < wheelConsumptionM(order)) {
    conflicts.push("余量不足");
  }
  const holder = slotHolder(orders, machine.id, slotId);
  if (holder !== null && holder.id !== order.id) {
    conflicts.push("槽位占用");
  }
  return conflicts;
}

export interface Deviations {
  sideLeft: number;
  sideRight: number;
  base: number;
}

/** 各刃实测减目标的偏差（保留 1 位小数） */
export function deviations(target: EdgeAngles, measured: EdgeAngles): Deviations {
  return {
    sideLeft: round1(measured.sideLeft - target.sideLeft),
    sideRight: round1(measured.sideRight - target.sideRight),
    base: round1(measured.base - target.base),
  };
}

export function maxAbsDeviation(target: EdgeAngles, measured: EdgeAngles): number {
  const d = deviations(target, measured);
  return Math.max(Math.abs(d.sideLeft), Math.abs(d.sideRight), Math.abs(d.base));
}

/** 是否通过完工校验：三面刃偏差都不超过 0.3° */
export function passesTolerance(target: EdgeAngles, measured: EdgeAngles): boolean {
  return maxAbsDeviation(target, measured) <= ANGLE_TOLERANCE + 1e-9;
}

/** 超差说明，如「左侧刃 +0.4°、底刃 -0.5°」；未超差返回空串 */
export function overToleranceText(target: EdgeAngles, measured: EdgeAngles): string {
  const d = deviations(target, measured);
  const parts: string[] = [];
  const push = (label: string, v: number) => {
    if (Math.abs(v) > ANGLE_TOLERANCE + 1e-9) {
      parts.push(`${label} ${v > 0 ? "+" : ""}${v.toFixed(1)}°`);
    }
  };
  push("左侧刃", d.sideLeft);
  push("右侧刃", d.sideRight);
  push("底刃", d.base);
  return parts.join("、");
}

export function angleText(a: EdgeAngles): string {
  return `左 ${a.sideLeft.toFixed(1)}° · 右 ${a.sideRight.toFixed(1)}° · 底 ${a.base.toFixed(1)}°`;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
