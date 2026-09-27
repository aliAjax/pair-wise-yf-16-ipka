import { useState } from "react";
import { BOARD_TYPES, type BoardType } from "../rules";

export interface OrderDraft {
  customer: string;
  board: string;
  boardType: BoardType;
  length: number;
  leftSide: number;
  rightSide: number;
  base: number;
}

interface Props {
  onCreate: (draft: OrderDraft) => void;
}

interface FormState {
  customer: string;
  board: string;
  boardType: BoardType;
  length: string;
  leftSide: string;
  rightSide: string;
  base: string;
}

const initialForm: FormState = {
  customer: "",
  board: "",
  boardType: "all",
  length: "160",
  leftSide: "88",
  rightSide: "88",
  base: "1",
};

export default function OrderForm({ onCreate }: Props) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const submit = () => {
    const length = Number(form.length);
    const leftSide = Number(form.leftSide);
    const rightSide = Number(form.rightSide);
    const base = Number(form.base);

    if (!form.customer.trim()) return setError("请填写客户姓名");
    if (!form.board.trim()) return setError("请填写雪板品牌与型号");
    if (!Number.isFinite(length) || length < 80 || length > 230)
      return setError("板长需在 80–230cm 之间");
    if (![leftSide, rightSide].every((v) => Number.isFinite(v) && v >= 80 && v <= 90))
      return setError("侧刃角度需在 80–90° 之间");
    if (!Number.isFinite(base) || base < 0 || base > 5)
      return setError("底刃角度需在 0–5° 之间");

    onCreate({
      customer: form.customer.trim(),
      board: form.board.trim(),
      boardType: form.boardType,
      length,
      leftSide,
      rightSide,
      base,
    });
    setForm(initialForm);
    setError(null);
  };

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>新工单</p>
          <h2>工单登记</h2>
        </div>
        <button className="primary" onClick={submit}>
          登记入待排
        </button>
      </div>

      <div className="field-grid">
        <label>
          <span>客户姓名</span>
          <input value={form.customer} onChange={set("customer")} placeholder="例如：张弛" />
        </label>
        <label>
          <span>雪板品牌 / 型号</span>
          <input value={form.board} onChange={set("board")} placeholder="例如：Blizzard GS 165" />
        </label>
        <label>
          <span>板型</span>
          <select value={form.boardType} onChange={set("boardType")}>
            {(Object.keys(BOARD_TYPES) as BoardType[]).map((t) => (
              <option key={t} value={t}>
                {BOARD_TYPES[t]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>板长（cm，按此扣减砂轮寿命）</span>
          <input type="number" value={form.length} onChange={set("length")} />
        </label>
        <label>
          <span>左侧刃目标角度（°）</span>
          <input type="number" step="0.1" value={form.leftSide} onChange={set("leftSide")} />
        </label>
        <label>
          <span>右侧刃目标角度（°）</span>
          <input type="number" step="0.1" value={form.rightSide} onChange={set("rightSide")} />
        </label>
        <label>
          <span>底刃目标角度（°）</span>
          <input type="number" step="0.05" value={form.base} onChange={set("base")} />
        </label>
      </div>

      {error && <p className="form-error">⚠ {error}</p>}
    </section>
  );
}
