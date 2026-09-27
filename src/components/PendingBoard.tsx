import { useMemo, useState } from "react";
import {
  ANGLE_FIELDS,
  BOARD_TYPES,
  checkDispatch,
  fmtAngle,
  type Machine,
  type Order,
} from "../rules";

interface Props {
  orders: Order[];
  machines: Machine[];
  onDispatch: (orderId: string, machineId: string, slot: number) => void;
}

export default function PendingBoard({ orders, machines, onDispatch }: Props) {
  const pending = orders
    .filter((o) => o.status === "pending")
    .sort((a, b) => a.createdAt - b.createdAt);

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>待排工单（{pending.length}）</p>
          <h2>磨刃派工</h2>
        </div>
        <span className="hint">选机器与槽位后按板长扣减砂轮寿命；冲突工单留在此处</span>
      </div>

      {pending.length === 0 ? (
        <p className="empty">没有待排工单，新登记的工单会出现在这里。</p>
      ) : (
        <div className="pending-list">
          {pending.map((order) => (
            <PendingCard
              key={order.id}
              order={order}
              machines={machines}
              allOrders={orders}
              onDispatch={onDispatch}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface CardProps {
  order: Order;
  machines: Machine[];
  allOrders: Order[];
  onDispatch: (orderId: string, machineId: string, slot: number) => void;
}

function PendingCard({ order, machines, allOrders, onDispatch }: CardProps) {
  const firstCapable = machines.find((m) => m.accepts.includes(order.boardType));
  const [machineId, setMachineId] = useState(firstCapable?.id ?? machines[0]?.id ?? "");
  const [slot, setSlot] = useState(1);
  const [rejected, setRejected] = useState<string[] | null>(null);

  const machine = useMemo(
    () => machines.find((m) => m.id === machineId) ?? machines[0],
    [machines, machineId]
  );

  // 页面只做实时提示；最终是否派工由 rules 层裁定
  const preview = machine
    ? checkDispatch(machine, order, allOrders, slot)
    : { ok: false, conflicts: ["无可用机器"], codes: [] as const };

  const dispatch = () => {
    if (!machine) return;
    if (preview.ok) {
      onDispatch(order.id, machine.id, slot);
      setRejected(null);
    } else {
      setRejected(preview.conflicts);
    }
  };

  const shownConflicts = rejected ?? order.conflicts;

  return (
    <article className="pending-card">
      <header>
        <div>
          <h3>{order.id}</h3>
          <p className="sub">
            {order.customer} · {order.board} · {BOARD_TYPES[order.boardType]} · {order.length}cm
          </p>
        </div>
        <div className="targets">
          {ANGLE_FIELDS.map(({ key, label }) => (
            <span key={key} className="tag">
              {label}目标 {fmtAngle(order.targets[key])}
            </span>
          ))}
        </div>
      </header>

      <div className="dispatch-row">
        <label>
          <span>派往机器</span>
          <select value={machineId} onChange={(e) => setMachineId(e.target.value)}>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}（余 {m.wheelRemaining}cm · {m.slotCount} 槽）
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>磨头槽位</span>
          <select value={slot} onChange={(e) => setSlot(Number(e.target.value))}>
            {Array.from({ length: machine?.slotCount ?? 0 }, (_, i) => i + 1).map((s) => {
              const busy = allOrders.some(
                (o) =>
                  o.id !== order.id &&
                  o.machineId === machine?.id &&
                  o.slot === s &&
                  (o.status === "scheduled" || o.status === "returned")
              );
              return (
                <option key={s} value={s}>
                  {s} 号槽{busy ? "（占用）" : ""}
                </option>
              );
            })}
          </select>
        </label>
        <button
          className={preview.ok ? "primary" : "danger-btn"}
          onClick={dispatch}
          disabled={!machine}
        >
          {preview.ok ? `确认派工（砂轮 -${order.length}cm）` : "尝试派工"}
        </button>
      </div>

      {shownConflicts.length > 0 && (
        <ul className="conflict-box">
          {shownConflicts.map((c, i) => (
            <li key={i}>⛔ {c}</li>
          ))}
          <li className="conflict-note">工单留在待排，解决冲突后再派。</li>
        </ul>
      )}
      {preview.ok && shownConflicts.length === 0 && (
        <p className="ok-hint">✅ {machine?.name} {slot} 号槽可派，派工后砂轮寿命扣减 {order.length}cm。</p>
      )}
    </article>
  );
}
