import { useMemo, useState } from "react";
import { ANGLE_FIELDS, ANGLE_TOLERANCE, BOARD_TYPES, fmtAngle, type HistoryEntry } from "../rules";

interface Props {
  history: HistoryEntry[];
}

function fmtDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

export default function CustomerHistory({ history }: Props) {
  const [query, setQuery] = useState("");

  const entries = useMemo(() => {
    const q = query.trim();
    const list = q
      ? history.filter(
          (h) =>
            h.customer.includes(q) || h.orderId.includes(q) || h.board.includes(q)
        )
      : history;
    return [...list].sort((a, b) => b.at - a.at);
  }, [history, query]);

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>浏览器本地保存</p>
          <h2>客户完工历史（{history.length}）</h2>
        </div>
        <input
          className="search"
          placeholder="搜索客户 / 工单号 / 雪板型号"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {entries.length === 0 ? (
        <p className="empty">暂无完工记录。</p>
      ) : (
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>客户 / 工单</th>
                <th>雪板 / 板型</th>
                <th>机器</th>
                <th>槽位</th>
                <th>三刃实测角度</th>
                <th>结果</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.orderId + e.at} className={e.passed ? "" : "returned-row"}>
                  <td>{fmtDate(e.at)}</td>
                  <td>
                    <b>{e.customer}</b>
                    <br />
                    {e.orderId}
                  </td>
                  <td>
                    {e.board}
                    <br />
                    <small>{BOARD_TYPES[e.boardType]}</small>
                  </td>
                  <td>{e.machineName}</td>
                  <td>{e.slot} 号槽</td>
                  <td className="angles-cell">
                    {ANGLE_FIELDS.map(({ key, label }) => {
                      const deviation = Math.abs(e.actuals[key] - e.targets[key]);
                      const over = deviation > ANGLE_TOLERANCE;
                      return (
                        <span key={key} className={over ? "over-text" : ""}>
                          {label} {fmtAngle(e.actuals[key])}
                          <small>（目标 {fmtAngle(e.targets[key])}）</small>
                        </span>
                      );
                    })}
                  </td>
                  <td>{e.passed ? "✅ 合格交付" : "⛔ 超差退回"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
