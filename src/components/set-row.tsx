"use client";
import { Check, Plus } from "lucide-react";
import type { SetLog } from "@/lib/training";
export function SetRow({
  index,
  log,
  defaultReps,
  onLog,
}: {
  index: number;
  log?: SetLog;
  defaultReps: number;
  onLog: (v: { kg: number; reps: number; rpe: number }) => void;
}) {
  return (
    <form
      className="setrow"
      action={(f) =>
        onLog({
          kg: Number(f.get("kg")),
          reps: Number(f.get("reps")),
          rpe: Number(f.get("rpe")),
        })
      }
    >
      <span>{index + 1}</span>
      <label>
        Kg
        <input
          name="kg"
          aria-label={`Carga da série ${index + 1}`}
          type="number"
          min={0}
          max={500}
          step="0.5"
          required
          defaultValue={log?.kg ?? 0}
        />
      </label>
      <label>
        Reps
        <input
          name="reps"
          type="number"
          min={1}
          max={100}
          required
          defaultValue={log?.reps ?? defaultReps}
        />
      </label>
      <label>
        RPE (1–10)
        <input
          name="rpe"
          type="number"
          min={1}
          max={10}
          required
          defaultValue={log?.rpe ?? 7}
        />
      </label>
      <button className={log ? "logged" : "secondary"}>
        {log ? <Check size={16} /> : <Plus size={16} />}
        <span>{log ? "Atualizar" : "Registrar"}</span>
      </button>
    </form>
  );
}
