import { useState } from "react";
import { ANGLE_TOLERANCE, angleText } from "../domain/rules";
import type { EdgeAngles, Machine, WorkOrder } from "../domain/types";

interface Props {
  orders: WorkOrder[];
  machines: Machine[];
  onComplete: (orderId: string, measured: EdgeAngles) => void;
}

/** 在制列表：完工登记实测刃角，超差退回且原槽不释放 */
export function ActiveList({ orders, machines, onComplete }: Props) {
  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>在制 · {orders.length} 单</p>
          <h2>磨刃中与返工</h2>
        </div>
      </div>
      {orders.length === 0 ? (
        <p className="empty">当前没有在制工单。</p>
      ) : (
        <div className="order-list">
          {orders.map((o) => (
            <ActiveCard key={o.id} order={o} machines={machines} onComplete={onComplete} />
          ))}
        </div>
      )}
    </section>
  );
}

interface CardProps {
  order: WorkOrder;
  machines: Machine[];
  onComplete: (orderId: string, measured: EdgeAngles) => void;
}

function ActiveCard({ order, machines, onComplete }: CardProps) {
  const machine = machines.find((m) => m.id === order.assignment?.machineId);
  const slot = machine?.slots.find((s) => s.id === order.assignment?.slotId);
  const start = order.measured ?? order.target;
  const [sideLeft, setSideLeft] = useState(start.sideLeft.toFixed(1));
  const [sideRight, setSideRight] = useState(start.sideRight.toFixed(1));
  const [base, setBase] = useState(start.base.toFixed(1));

  const submit = () => {
    const measured = {
      sideLeft: Number(sideLeft),
      sideRight: Number(sideRight),
      base: Number(base),
    };
    if ([measured.sideLeft, measured.sideRight, measured.base].some((v) => !Number.isFinite(v))) return;
    onComplete(order.id, measured);
  };

  return (
    <article className={`order ${order.status === "rework" ? "order-rework" : ""}`}>
      <header>
        <strong>{order.id}</strong>
        <span className={`badge ${order.status === "rework" ? "badge-rework" : "badge-active"}`}>
          {order.status === "rework" ? "退回返工" : "磨刃中"}
        </span>
      </header>
      <p className="order-line">
        {order.customer} · {order.brand || "未填品牌"} · {order.boardType} {order.boardLengthCm}cm
      </p>
      <p className="order-line">
        机位：{machine ? `${machine.id} · ${machine.name}` : "—"} / {slot?.label ?? "—"}
      </p>
      <p className="order-line">目标刃角：{angleText(order.target)}</p>
      {order.rejectNote && <p className="conflict">⚠ {order.rejectNote}</p>}
      <div className="measure-row">
        <label>
          <span>实测左侧刃（°）</span>
          <input type="number" step={0.1} value={sideLeft} onChange={(e) => setSideLeft(e.target.value)} />
        </label>
        <label>
          <span>实测右侧刃（°）</span>
          <input type="number" step={0.1} value={sideRight} onChange={(e) => setSideRight(e.target.value)} />
        </label>
        <label>
          <span>实测底刃（°）</span>
          <input type="number" step={0.1} value={base} onChange={(e) => setBase(e.target.value)} />
        </label>
        <button className="primary" onClick={submit}>
          完工登记
        </button>
      </div>
      <p className="hint">容差 ±{ANGLE_TOLERANCE.toFixed(1)}°，超差退回且原槽不释放。</p>
    </article>
  );
}
