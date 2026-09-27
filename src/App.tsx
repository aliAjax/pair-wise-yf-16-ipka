import { useEffect, useMemo, useState } from "react";
import "./styles.css";
import {
  BOARD_TYPES,
  dispatchConflicts,
  overToleranceText,
  passesTolerance,
  round2,
  wheelConsumptionM,
} from "./domain/rules";
import type { AppState, BoardType, EdgeAngles, HistoryEntry, OrderDraft, WorkOrder } from "./domain/types";
import { loadState, resetState, saveState } from "./storage/store";
import { ActiveList } from "./ui/ActiveList";
import { HistoryPanel } from "./ui/HistoryPanel";
import { MachineBoard } from "./ui/MachineBoard";
import { MetricsBar } from "./ui/MetricsBar";
import { OrderForm } from "./ui/OrderForm";
import { PendingQueue } from "./ui/PendingQueue";

type TypeFilter = "全部" | BoardType;

function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [filter, setFilter] = useState<TypeFilter>("全部");

  // 状态变更即写入浏览器存储
  useEffect(() => {
    saveState(state);
  }, [state]);

  const matches = (o: WorkOrder) => filter === "全部" || o.boardType === filter;
  const pending = useMemo(() => state.orders.filter((o) => o.status === "pending" && matches(o)), [state.orders, filter]);
  const inProgress = useMemo(
    () => state.orders.filter((o) => (o.status === "active" || o.status === "rework") && matches(o)),
    [state.orders, filter]
  );

  /** 登记工单：进入待排队列 */
  const registerOrder = (draft: OrderDraft) => {
    setState((s) => {
      const order: WorkOrder = {
        id: `MO-${s.seq}`,
        customer: draft.customer,
        brand: draft.brand,
        boardType: draft.boardType,
        boardLengthCm: draft.boardLengthCm,
        target: draft.target,
        status: "pending",
        conflict: null,
        assignment: null,
        measured: null,
        rejectNote: null,
        createdAt: Date.now(),
        completedAt: null,
      };
      return { ...s, seq: s.seq + 1, orders: [order, ...s.orders] };
    });
  };

  /** 派工：机型不合 / 余量不足 / 槽位占用则留在待排并写明冲突，否则占槽并按板长扣砂轮寿命 */
  const dispatchOrder = (orderId: string, machineId: string, slotId: string) => {
    setState((s) => {
      const order = s.orders.find((o) => o.id === orderId);
      const machine = s.machines.find((m) => m.id === machineId);
      if (!order || !machine) return s;
      const slotLabel = machine.slots.find((sl) => sl.id === slotId)?.label ?? slotId;
      const conflicts = dispatchConflicts(order, machine, slotId, s.orders);
      if (conflicts.length > 0) {
        const conflict = `上次派工 ${machineId}·${slotLabel}：${conflicts.join("、")}`;
        return { ...s, orders: s.orders.map((o) => (o.id === orderId ? { ...o, conflict } : o)) };
      }
      const consumption = wheelConsumptionM(order);
      return {
        ...s,
        machines: s.machines.map((m) =>
          m.id === machineId ? { ...m, wheelUsedM: round2(m.wheelUsedM + consumption) } : m
        ),
        orders: s.orders.map((o) =>
          o.id === orderId
            ? { ...o, status: "active" as const, assignment: { machineId, slotId }, conflict: null, rejectNote: null }
            : o
        ),
      };
    });
  };

  /** 完工登记：偏差超 0.3° 退回且原槽不释放；合格则完工放槽，两侧都写入客户历史 */
  const completeOrder = (orderId: string, measured: EdgeAngles) => {
    setState((s) => {
      const order = s.orders.find((o) => o.id === orderId);
      if (!order || !order.assignment) return s;
      const machine = s.machines.find((m) => m.id === order.assignment!.machineId);
      const slotLabel =
        machine?.slots.find((sl) => sl.id === order.assignment!.slotId)?.label ?? order.assignment.slotId;
      const pass = passesTolerance(order.target, measured);
      const entry: HistoryEntry = {
        id: `H-${orderId}-${Date.now()}`,
        orderId: order.id,
        customer: order.customer,
        boardLabel: `${order.brand || "未填品牌"} · ${order.boardType} ${order.boardLengthCm}cm`,
        machineId: machine?.id ?? "",
        machineName: machine?.name ?? "未知机器",
        slotLabel,
        measured,
        result: pass ? "pass" : "reject",
        at: Date.now(),
      };
      const orders = s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (pass) {
          return { ...o, status: "done" as const, measured, rejectNote: null, completedAt: Date.now() };
        }
        const note = `超差：${overToleranceText(order.target, measured)}（容差 ±0.3°），原槽保留返工`;
        return { ...o, status: "rework" as const, measured, rejectNote: note };
      });
      return { ...s, orders, history: [entry, ...s.history] };
    });
  };

  const resetAll = () => {
    if (window.confirm("清空浏览器中的排程数据并恢复演示数据？")) {
      setState(resetState());
    }
  };

  return (
    <main className="app">
      <section className="hero">
        <p>磨刃排程台 · 滑雪板调校维护</p>
        <h1>磨刃排程台</h1>
        <span>
          工单登记板型与左右侧刃、底刃目标角度；派工选机器与槽位，按板长扣减砂轮寿命，机型不合、余量不足或槽位占用即留待排并写明冲突；完工登记实测刃角，偏差超
          0.3° 退回且原槽不释放；客户历史保留机器、槽位与实测角度，数据保存在浏览器。
        </span>
        <div className="hero-actions">
          <button onClick={resetAll}>重置演示数据</button>
        </div>
      </section>

      <MetricsBar orders={state.orders} />

      <div className="filter-bar">
        {(["全部", ...BOARD_TYPES] as TypeFilter[]).map((t) => (
          <button key={t} className={filter === t ? "chip chip-on" : "chip"} onClick={() => setFilter(t)}>
            {t}
          </button>
        ))}
      </div>

      <section className="workspace">
        <MachineBoard machines={state.machines} orders={state.orders} />
        <OrderForm onRegister={registerOrder} />
      </section>

      <section className="queues">
        <PendingQueue orders={pending} machines={state.machines} allOrders={state.orders} onDispatch={dispatchOrder} />
        <ActiveList orders={inProgress} machines={state.machines} onComplete={completeOrder} />
      </section>

      <HistoryPanel history={state.history} />
    </main>
  );
}

export default App;
