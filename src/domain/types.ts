/** 板型 */
export type BoardType = "竞速板" | "公园板" | "粉雪板" | "全能板";

/** 三面刃角：左侧刃 / 右侧刃 / 底刃（度） */
export interface EdgeAngles {
  sideLeft: number;
  sideRight: number;
  base: number;
}

/** 机器槽位 */
export interface Slot {
  id: string;
  label: string;
}

/** 磨刃机：砂轮寿命按可磨板长（米）计 */
export interface Machine {
  id: string;
  name: string;
  kind: string;
  compatibleTypes: BoardType[];
  wheelTotalM: number;
  wheelUsedM: number;
  slots: Slot[];
}

/**
 * 工单状态：
 * pending 待排（含派工冲突未解决的）
 * active  磨刃中（已占槽、已扣砂轮寿命）
 * rework  退回返工（实测超差，原槽不释放）
 * done    完工（槽位已释放）
 */
export type OrderStatus = "pending" | "active" | "rework" | "done";

export interface WorkOrder {
  id: string;
  customer: string;
  brand: string;
  boardType: BoardType;
  boardLengthCm: number;
  target: EdgeAngles;
  status: OrderStatus;
  /** 最近一次派工失败的冲突说明，留在待排时展示 */
  conflict: string | null;
  assignment: { machineId: string; slotId: string } | null;
  measured: EdgeAngles | null;
  /** 最近一次完工登记被退回的原因 */
  rejectNote: string | null;
  createdAt: number;
  completedAt: number | null;
}

/** 客户历史条目：保留机器、槽位和实测角度 */
export interface HistoryEntry {
  id: string;
  orderId: string;
  customer: string;
  boardLabel: string;
  machineId: string;
  machineName: string;
  slotLabel: string;
  measured: EdgeAngles;
  result: "pass" | "reject";
  at: number;
}

/** 新工单登记表单草稿 */
export interface OrderDraft {
  customer: string;
  brand: string;
  boardType: BoardType;
  boardLengthCm: number;
  target: EdgeAngles;
}

/** 持久化到浏览器的完整状态 */
export interface AppState {
  version: number;
  /** 工单号自增序列 */
  seq: number;
  machines: Machine[];
  orders: WorkOrder[];
  history: HistoryEntry[];
}
