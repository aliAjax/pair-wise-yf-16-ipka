import { useMemo, useState } from "react";
import {
  ANGLE_FIELDS,
  ANGLE_TOLERANCE,
  BOARD_TYPES,
  evaluateFinish,
  fmtAngle,
  type Machine,
  type Order,
} from "../rules";

interface Props {
  order: Order;
  machine: Machine | undefined;
  onClose: () => void;
  onSubmit: (
    orderId: string,
    actuals: { leftSide: number; rightSide: number; base: number }
  ) => void;
}

export default function FinishDialog({ order, machine, onClose, onSubmit }: Props) {
  const [values, setValues] = useState({
    leftSide: String(order.targets.leftSide),
    rightSide: String(order.targets.rightSide),
    base: String(order.targets.base),
  });
  const [error, setError] = useState<string | null>(null);

  const parsed = {
    leftSide: Number(values.leftSide),
    rightSide: Number(values.rightSide),
    base: Number(values.base),
  };

  const valid = ANGLE_FIELDS.every(({ key }) => Number.isFinite(parsed[key]));

  const preview = useMemo(
    () => (valid ? evaluateFinish(order.targets, parsed) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values, order]
  );

  const submit = () => {
    if (!valid) return setError("三个刃角都必须填写数字");
    onSubmit(order.id, parsed);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="heading">
          <div>
            <p>完工登记</p>
            <h2>
              {order.id} · {order.customer}
            </h2>
          </div>
          <button onClick={onClose}>关闭</button>
        </div>

        <p className="sub">
          {order.board} · {BOARD_TYPES[order.boardType]} · {machine?.name ?? "未知机器"} ·{" "}
          {order.slot} 号槽
          {order.status === "returned" && " · 返工重测，原槽未释放"}
        </p>

        <div className="field-grid">
          {ANGLE_FIELDS.map(({ key, label }) => {
            const deviation = preview?.deviations[key];
            const over = deviation !== undefined && deviation > ANGLE_TOLERANCE;
            return (
              <label key={key} className={over ? "over" : ""}>
                <span>
                  {label}实测（°） · 目标 {fmtAngle(order.targets[key])}
                </span>
                <input
                  type="number"
                  step="0.05"
                  value={values[key]}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [key]: e.target.value }))
                  }
                />
                {deviation !== undefined && (
                  <small className={over ? "over-text" : "within-text"}>
                    偏差 {deviation.toFixed(2)}°{over ? "，超差退回" : "，合格"}
                  </small>
                )}
              </label>
            );
          })}
        </div>

        <p className="rule-note">
          规则：任一刃偏差超过 {ANGLE_TOLERANCE}° 整单退回，机器槽位不释放，砂轮寿命不返还。
        </p>

        {preview && !preview.passed && (
          <ul className="conflict-box">
            {preview.failures.map((f, i) => (
              <li key={i}>⛔ {f}</li>
            ))}
          </ul>
        )}
        {preview?.passed && <p className="ok-hint">✅ 三刃均在允差内，可完工交付并释放槽位。</p>}
        {error && <p className="form-error">⚠ {error}</p>}

        <div className="modal-actions">
          <button onClick={onClose}>取消</button>
          <button className={preview?.passed ? "primary" : "danger-btn"} onClick={submit}>
            {preview?.passed ? "确认完工，释放槽位" : "登记实测（超差将退回）"}
          </button>
        </div>
      </div>
    </div>
  );
}
