import type { WorkOrder } from "../domain/types";

interface Props {
  orders: WorkOrder[];
}

export function MetricsBar({ orders }: Props) {
  const count = (s: WorkOrder["status"]) => orders.filter((o) => o.status === s).length;
  const metrics = [
    { label: "待排工单", value: count("pending") },
    { label: "磨刃中", value: count("active") },
    { label: "退回返工", value: count("rework") },
    { label: "完工工单", value: count("done") },
  ];
  return (
    <section className="metrics">
      {metrics.map((m) => (
        <article key={m.label}>
          <small>{m.label}</small>
          <strong>{m.value}</strong>
        </article>
      ))}
    </section>
  );
}
