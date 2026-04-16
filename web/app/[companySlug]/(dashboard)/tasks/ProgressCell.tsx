import { useState } from "react";

export function ProgressCell({ taskId, progress, onUpdate }: { taskId: number; progress: number; onUpdate: (id: number, p: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(progress);

  const save = () => {
    const clamped = Math.max(0, Math.min(100, val));
    onUpdate(taskId, clamped);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input type="range" min={0} max={100} step={5} value={val} onChange={e => setVal(Number(e.target.value))} className="flex-1 h-1.5 accent-[#00b24e]" />
        <input type="number" min={0} max={100} value={val} onChange={e => setVal(Number(e.target.value))} className="w-12 text-[12px] text-center border border-[#E2E8F0] rounded px-1 py-0.5" />
        <span className="text-[11px] text-[#5A6E85]">%</span>
        <button onClick={save} className="text-[11px] text-[#00b24e] font-semibold hover:underline">OK</button>
        <button onClick={() => { setVal(progress); setEditing(false); }} className="text-[11px] text-[#9CA3AF] hover:underline">Hủy</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setEditing(true)} title="Click để cập nhật tiến độ">
      <div className="w-16 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
        <div className="h-full bg-[#00b24e] rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>
      <span className="text-[12px] text-[#5A6E85] group-hover:text-[#00b24e] group-hover:font-semibold transition-colors">{progress}%</span>
    </div>
  );
}
