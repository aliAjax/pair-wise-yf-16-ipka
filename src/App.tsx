import { useEffect, useMemo, useState } from "react";
import "./styles.css";
import OrderForm, { type OrderDraft } from "./components/OrderForm";
import PendingBoard from "./components/PendingBoard";
import MachineBoard from "./components/MachineBoard";
import FinishDialog from "./components/FinishDialog";
import CustomerHistory from "./components/CustomerHistory";
import { loadState, resetState, saveState } from "./storage";
import {
  BOARD_TYPES,
  checkDispatch,
  consumeWheel,
  evaluateFinish,
  type AngleActuals,
  type Order,
  type ShopState,
} from "./rules";

export default function App() {
  const [state, setState] = useState<ShopState>(() => loadState());
  const [finishOrderId, setFinishOrderId] = useState<string | null>(null);

  // 任何变更都写回浏览器
  useEffect(() => {
    saveState(state);
  }, [state]);

  const createOrder = (draft: OrderDraft) => {
    setState((s) => {
      const id = `WO-${s.orderSeq}`;
      const order: Order = {
        id,
        customer: draft.customer,
        board: draft.board,
        boardType: draft.boardType,
        length: draft.length,
        targets: {
          leftSide: draft.leftSide,
          rightSide: draft.rightSide,
          base: draft.base,
        },
        status: "pending",
        machineId: null,
        slot: null,
        conflicts: [],
        actuals: null,
        deviations: null,
        createdAt: Date.now(),
        scheduledAt: null,
        finishedAt: null,
      };
      return { ...s, orderSeq: s.orderSeq + 1, orders: [order, ...s.orders] };
    });
  };

  const dispatchOrder = (orderId: string, machineId: string, slot: number) => {
    setState((s) => {
      const order = s.orders.find((o) => o.id === orderId);
      const machine = s.machines.find((m) => m.id === machineId);
      if (!order || !machine) return s;

      // 规则层裁定：冲突则留在待排并写明原因
      const result = checkDispatch(machine, order, s.orders, slot);
      if (!result.ok) {
        return {
          ...s,
          orders: s.orders.map((o) =>
            o.id === orderId ? { ...o, conflicts: result.conflicts } : o
          ),
        };
      }

      return {
        ...s,
        machines: s.machines.map((m) =>
          m.id === machineId ? consumeWheel(m, order.length) : m
        ),
        orders: s.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: "scheduled",
                machineId,
                slot,
                conflicts: [],
                scheduledAt: Date.now(),
              }
            : o
        ),
      };
    });
  };

  const finishOrder = (orderId: string, actuals: AngleActuals) => {
    setState((s) => {
      const order = s.orders.find((o) => o.id === orderId);
      if (!order || !order.machineId || order.slot === null) return s;
      const machine = s.machines.find((m) => m.id === order.machineId);

      const result = evaluateFinish(order.targets, actuals);
      const at = Date.now();

      // 每次登记都进入客户历史（含机器、槽位与实测角度）
      const history =
        machine
          ? [
              {
                customer: order.customer,
                orderId: order.id,
                board: order.board,
                boardType: order.boardType,
                machineId: machine.id,
                machineName: machine.name,
                slot: order.slot,
                targets: order.targets,
                actuals: result.actuals,
                passed: result.passed,
                at,
              },
              ...s.history,
            ]
          : s.history;

      // 超差退回：状态置为 returned，原槽不释放
      if (!result.passed) {
        return {
          ...s,
          history,
          orders: s.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: "returned",
                  actuals: result.actuals,
                  deviations: result.deviations,
                  conflicts: result.failures,
                }
              : o
          ),
        };
      }

      // 合格：完工并释放槽位
      return {
        ...s,
        history,
        orders: s.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: "done",
                machineId: null,
                slot: null,
                conflicts: [],
                actuals: result.actuals,
                deviations: result.deviations,
                finishedAt: at,
              }
            : o
        ),
      };
    });
    setFinishOrderId(null);
  };

  const replaceWheel = (machineId: string) => {
    setState((s) => ({
      ...s,
      machines: s.machines.map((m) =>
        m.id === machineId ? { ...m, wheelRemaining: m.wheelCapacity } : m
      ),
    }));
  };

  const clearLocal = () => {
    if (window.confirm("确定清空浏览器数据并恢复演示数据？")) {
      setState(resetState());
    }
  };

  const activeOrder = state.orders.find((o) => o.id === finishOrderId) ?? null;
  const finishMachine = activeOrder?.machineId
    ? state.machines.find((m) => m.id === activeOrder.machineId)
    : undefined;

  const metrics = useMemo(() => {
    const pending = state.orders.filter((o) => o.status === "pending").length;
    const working = state.orders.filter(
      (o) => o.status === "scheduled" || o.status === "returned"
    ).length;
    const done = state.orders.filter((o) => o.status === "done").length;
    const returned = state.orders.filter((o) => o.status === "returned").length;
    return { pending, working, done, returned };
  }, [state.orders]);

  const boardSummary = useMemo(() => {
    const map = new Map<string, number>();
    state.orders
      .filter((o) => o.status === "pending")
      .forEach((o) => map.set(o.boardType, (map.get(o.boardType) ?? 0) + 1));
    return map;
  }, [state.orders]);

  return (
    <main className="app">
      <section className="hero compact">
        <div>
          <p>Edge Sharpener Desk · 磨刃排程台</p>
          <h1>磨刃排程台</h1>
          <span>
            工单登记板型、左右侧刃与底刃目标；派工按板长扣减砂轮寿命，机型不合、余量不足或槽位占用即留单写明冲突；
            完工登记实测刃角，偏差超过 0.3° 退回且原槽不释放。
          </span>
        </div>
        <button className="ghost-btn" onClick={clearLocal}>
          重置本地数据
        </button>
      </section>

      <section className="metrics">
        <article>
          <small>待排工单</small>
          <strong>{metrics.pending}</strong>
        </article>
        <article>
          <small>槽位在制（含退回）</small>
          <strong>{metrics.working}</strong>
        </article>
        <article>
          <small>合格完工</small>
          <strong>{metrics.done}</strong>
        </article>
        <article className={metrics.returned > 0 ? "alarm" : ""}>
          <small>超差退回</small>
          <strong>{metrics.returned}</strong>
        </article>
      </section>

      <section className="workspace">
        <div className="stack">
          <OrderForm onCreate={createOrder} />
          {boardSummary.size > 0 && (
            <section className="panel chips-panel">
              <span className="hint">待排板型分布：</span>
              <div className="chips">
                {[...boardSummary.entries()].map(([t, n]) => (
                  <button key={t} className="static-chip">
                    {BOARD_TYPES[t as keyof typeof BOARD_TYPES]} × {n}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
        <PendingBoard orders={state.orders} machines={state.machines} onDispatch={dispatchOrder} />
      </section>

      <MachineBoard
        machines={state.machines}
        orders={state.orders}
        onOpenFinish={setFinishOrderId}
        onReplaceWheel={replaceWheel}
      />

      <CustomerHistory history={state.history} />

      {activeOrder && (
        <FinishDialog
          order={activeOrder}
          machine={finishMachine}
          onClose={() => setFinishOrderId(null)}
          onSubmit={(orderId, actuals) => finishOrder(orderId, actuals)}
        />
      )}
    </main>
  );
}
