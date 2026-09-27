import { slotHolder, wheelRemainingM } from "../domain/rules";
import type { Machine, WorkOrder } from "../domain/types";

interface Props {
  machines: Machine[];
  orders: WorkOrder[];
}

/** 机器与槽位看板：砂轮寿命按板长（米）扣减，余量低于 2 米预警 */
export function MachineBoard({ machines, orders }: Props) {
  return (
    <aside className="panel">
      <h2>机器与槽位</h2>
      <p className="hint">砂轮寿命按板长扣减（米），余量不足 2 米预警。</p>
      <div className="machine-list">
        {machines.map((m) => {
          const remaining = wheelRemainingM(m);
          const pct = Math.max(0, Math.min(100, (remaining / m.wheelTotalM) * 100));
          const low = remaining < 2;
          return (
            <article className="machine" key={m.id}>
              <header>
                <strong>
                  {m.id} · {m.name}
                </strong>
                <span className="kind">{m.kind}</span>
              </header>
              <p className="compat">适配：{m.compatibleTypes.join(" / ")}</p>
              <div className={`wheel ${low ? "wheel-low" : ""}`}>
                <div className="wheel-bar">
                  <i style={{ width: `${pct}%` }} />
                </div>
                <span>
                  砂轮余量 {remaining.toFixed(1)} / {m.wheelTotalM} 米
                  {low ? "（预警）" : ""}
                </span>
              </div>
              <div className="slots">
                {m.slots.map((s) => {
                  const holder = slotHolder(orders, m.id, s.id);
                  return (
                    <span className={`slot ${holder ? "slot-busy" : ""}`} key={s.id}>
                      {s.label} · {holder ? holder.id : "空"}
                    </span>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </aside>
  );
}
