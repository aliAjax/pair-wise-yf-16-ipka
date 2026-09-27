import { useState } from "react";
import { BOARD_TYPES } from "../domain/rules";
import type { BoardType, OrderDraft } from "../domain/types";

interface Props {
  onRegister: (draft: OrderDraft) => void;
}

/** 工单登记：板型、左右侧刃与底刃目标角度 */
export function OrderForm({ onRegister }: Props) {
  const [customer, setCustomer] = useState("");
  const [brand, setBrand] = useState("");
  const [boardType, setBoardType] = useState<BoardType>("全能板");
  const [boardLengthCm, setBoardLengthCm] = useState("160");
  const [sideLeft, setSideLeft] = useState("88.0");
  const [sideRight, setSideRight] = useState("88.0");
  const [base, setBase] = useState("0.8");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const length = Number(boardLengthCm);
    const target = {
      sideLeft: Number(sideLeft),
      sideRight: Number(sideRight),
      base: Number(base),
    };
    if (
      customer.trim() === "" ||
      !Number.isFinite(length) ||
      length < 100 ||
      length > 220 ||
      [target.sideLeft, target.sideRight, target.base].some((v) => !Number.isFinite(v))
    ) {
      return;
    }
    onRegister({ customer: customer.trim(), brand: brand.trim(), boardType, boardLengthCm: length, target });
    setCustomer("");
    setBrand("");
  };

  return (
    <section className="panel form-panel">
      <div className="heading">
        <div>
          <p>工单登记</p>
          <h2>新磨刃工单</h2>
        </div>
      </div>
      <form onSubmit={submit}>
        <div className="field-grid">
          <label>
            <span>客户姓名 *</span>
            <input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="如：老周" required />
          </label>
          <label>
            <span>雪板品牌</span>
            <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="如：Burton Custom" />
          </label>
          <label>
            <span>板型 *</span>
            <select value={boardType} onChange={(e) => setBoardType(e.target.value as BoardType)}>
              {BOARD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>板长（cm，决定砂轮扣减）*</span>
            <input
              type="number"
              min={100}
              max={220}
              step={1}
              value={boardLengthCm}
              onChange={(e) => setBoardLengthCm(e.target.value)}
              required
            />
          </label>
          <label>
            <span>左侧刃目标（°）</span>
            <input type="number" min={85} max={90} step={0.1} value={sideLeft} onChange={(e) => setSideLeft(e.target.value)} required />
          </label>
          <label>
            <span>右侧刃目标（°）</span>
            <input type="number" min={85} max={90} step={0.1} value={sideRight} onChange={(e) => setSideRight(e.target.value)} required />
          </label>
          <label>
            <span>底刃目标（°）</span>
            <input type="number" min={0} max={2} step={0.1} value={base} onChange={(e) => setBase(e.target.value)} required />
          </label>
        </div>
        <button className="primary" type="submit">
          登记工单
        </button>
      </form>
    </section>
  );
}
