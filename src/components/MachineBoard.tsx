import { BOARD_TYPES, type Machine, type Order } from "../rules";

interface Props {
  machines: Machine[];
  orders: Order[];
  onOpenFinish: (orderId: string) => void;
  onReplaceWheel: (machineId: string) => void;
}

export default function MachineBoard({ machines, orders, onOpenFinish, onReplaceWheel }: Props) {
  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>车间实况</p>
          <h2>机器与槽位</h2>
        </div>
        <span className="hint">点击槽内工单登记实测刃角；退回工单原槽保留</span>
      </div>

      <div className="machine-grid">
        {machines.map((m) => {
          const occupancy = orders.filter(
            (o) =>
              o.machineId === m.id &&
              (o.status === "scheduled" || o.status === "returned")
          );
          const ratio = Math.max(0, Math.min(1, m.wheelRemaining / m.wheelCapacity));
          const low = ratio < 0.15;

          return (
            <article key={m.id} className="machine-card">
              <header>
                <h3>{m.name}</h3>
                <span className="machine-id">{m.id}</span>
              </header>
              <p className="sub">可磨：{m.accepts.map((t) => BOARD_TYPES[t]).join("、")}</p>

              <div className={"wheel-bar" + (low ? " low" : "")}>
                <div style={{ width: `${ratio * 100}%` }} />
              </div>
              <p className={"wheel-text" + (low ? " low" : "")}>
                砂轮寿命 {m.wheelRemaining} / {m.wheelCapacity} cm
                {low && " · 余量告急"}
              </p>
              <button className="link-btn" onClick={() => onReplaceWheel(m.id)}>
                换新砂轮（寿命重置）
              </button>

              <div className="slots">
                {Array.from({ length: m.slotCount }, (_, i) => i + 1).map((s) => {
                  const order = occupancy.find((o) => o.slot === s);
                  if (!order) {
                    return (
                      <div key={s} className="slot free">
                        <b>{s} 号槽</b>
                        <span>空闲</span>
                      </div>
                    );
                  }
                  return (
                    <button
                      key={s}
                      className={"slot occupied " + order.status}
                      onClick={() => onOpenFinish(order.id)}
                      title="登记完工实测"
                    >
                      <b>{s} 号槽 · {order.id}</b>
                      <span>
                        {order.customer} · {order.length}cm
                      </span>
                      <em>{order.status === "returned" ? "退回返工（原槽锁定）" : "已派工 · 登记完工"}</em>
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
