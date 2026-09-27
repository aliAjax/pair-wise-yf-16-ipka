import { useState } from "react";
import { angleText, slotHolder, wheelConsumptionM } from "../domain/rules";
import type { Machine, WorkOrder } from "../domain/types";

interface Props {
  orders: WorkOrder[];
  machines: Machine[];
  allOrders: WorkOrder[];
  onDispatch: (orderId: string, machineId: string, slotId: string) => void;
}

/** 待排队列：派工选机器与槽位，冲突时留在待排并写明原因 */
export function PendingQueue({ orders, machines, allOrders, onDispatch }: Props) {
  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>待排 · {orders.length} 单</p>
          <h2>待排队列</h2>
        </div>
      </div>
      {orders.length === 0 ? (
        <p className="empty">没有待排工单。</p>
      ) : (
        <div className="order-list">
          {orders.map((o) => (
            <PendingCard key={o.id} order={o} machines={machines} allOrders={allOrders} onDispatch={onDispatch} />
          ))}
        </div>
      )}
    </section>
  );
}

interface CardProps {
  order: WorkOrder;
  machines: Machine[];
  allOrders: WorkOrder[];
  onDispatch: (orderId: string, machineId: string, slotId: string) => void;
}

function PendingCard({ order, machines, allOrders, onDispatch }: CardProps) {
  const [machineId, setMachineId] = useState(machines[0]?.id ?? "");
  const machine = machines.find((m) => m.id === machineId) ?? machines[0];
  const [slotId, setSlotId] = useState(machine?.slots[0]?.id ?? "");

  const pickMachine = (id: string) => {
    setMachineId(id);
    const next = machines.find((m) => m.id === id);
    setSlotId(next?.slots[0]?.id ?? "");
  };

  return (
    <article className="order">
      <header>
        <strong>{order.id}</strong>
        <span className="badge badge-pending">待排</span>
      </header>
      <p className="order-line">
        {order.customer} · {order.brand || "未填品牌"} · {order.boardType} {order.boardLengthCm}cm
      </p>
      <p className="order-line">目标刃角：{angleText(order.target)}</p>
      <p className="order-line">预计扣减砂轮 {wheelConsumptionM(order).toFixed(2)} 米</p>
      {order.conflict && <p className="conflict">⚠ {order.conflict}</p>}
      <div className="dispatch-row">
        <select value={machineId} onChange={(e) => pickMachine(e.target.value)} aria-label="选择机器">
          {machines.map((m) => (
            <option key={m.id} value={m.id}>
              {m.id} · {m.name}
            </option>
          ))}
        </select>
        <select value={slotId} onChange={(e) => setSlotId(e.target.value)} aria-label="选择槽位">
          {machine?.slots.map((s) => {
            const holder = slotHolder(allOrders, machine.id, s.id);
            return (
              <option key={s.id} value={s.id}>
                {s.label}
                {holder ? `（占用 ${holder.id}）` : "（空）"}
              </option>
            );
          })}
        </select>
        <button className="primary" onClick={() => machine && slotId && onDispatch(order.id, machine.id, slotId)}>
          派工
        </button>
      </div>
    </article>
  );
}
