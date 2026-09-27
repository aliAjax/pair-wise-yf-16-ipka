import { useMemo } from "react";
import { angleText } from "../domain/rules";
import type { HistoryEntry } from "../domain/types";

interface Props {
  history: HistoryEntry[];
}

function fmtTime(at: number): string {
  const d = new Date(at);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 客户历史：按客户分组，保留机器、槽位和实测角度 */
export function HistoryPanel({ history }: Props) {
  const groups = useMemo(() => {
    const map = new Map<string, HistoryEntry[]>();
    for (const entry of history) {
      const list = map.get(entry.customer) ?? [];
      list.push(entry);
      map.set(entry.customer, list);
    }
    return [...map.entries()];
  }, [history]);

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>客户历史 · {history.length} 条</p>
          <h2>磨刃记录</h2>
        </div>
      </div>
      {groups.length === 0 ? (
        <p className="empty">还没有磨刃记录，完工登记后自动归档。</p>
      ) : (
        <div className="history-groups">
          {groups.map(([customer, entries]) => (
            <article className="history-group" key={customer}>
              <h3>
                {customer}
                <span>{entries.length} 条</span>
              </h3>
              <ul>
                {entries.map((e) => (
                  <li key={e.id}>
                    <span className={`badge ${e.result === "pass" ? "badge-done" : "badge-rework"}`}>
                      {e.result === "pass" ? "合格" : "退回"}
                    </span>
                    <div>
                      <strong>
                        {e.orderId} · {e.boardLabel}
                      </strong>
                      <p>
                        {e.machineName}（{e.machineId}）· {e.slotLabel} · 实测 {angleText(e.measured)} ·{" "}
                        {fmtTime(e.at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
