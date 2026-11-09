"use client";
import { Play } from "lucide-react";
import { exercises, type Exercise } from "@/lib/catalog";
import type { Plan } from "@/lib/training";
export function PlanView({
  plan,
  onDetail,
  onStart,
  onChange,
  disabled,
}: {
  plan: Plan;
  onDetail: (e: Exercise) => void;
  onStart?: (i: number) => void;
  onChange?: (p: Plan) => void;
  disabled?: boolean;
}) {
  return (
    <div className="planlist">
      {plan.days.map((day, i) => (
        <section className="card" key={i}>
          <div className="cardheading">
            <div>
              <span className="eyebrow">SESSÃO {i + 1}</span>
              <h2>{day.name}</h2>
              <small>
                Estimativa:{" "}
                {8 +
                  Math.round(
                    day.items.reduce(
                      (s, x) => s + (x.sets * (45 + x.rest)) / 60,
                      0,
                    ),
                  )}{" "}
                min · ajuste pela resposta individual
              </small>
            </div>
            {onStart && (
              <button className="primary" onClick={() => onStart(i)}>
                <Play size={16} />
                Iniciar
              </button>
            )}
          </div>
          {day.items.map((item, j) => {
            const e = exercises.find((e) => e.id === item.exerciseId)!;
            return (
              <div className="planrow" key={item.exerciseId}>
                <span className="number">{String(j + 1).padStart(2, "0")}</span>
                <button className="exercisename" onClick={() => onDetail(e)}>
                  <b>{e.name}</b>
                  <small>
                    {e.equipment} · RIR {item.rir}
                  </small>
                </button>
                <span>
                  {item.sets} × {item.reps}
                </span>
                <small>{item.rest}s</small>
                {onChange && (
                  <label className="compactlabel">
                    Séries
                    <input
                      aria-label={`Séries de ${e.name}`}
                      type="number"
                      min={1}
                      max={5}
                      value={item.sets}
                      disabled={disabled}
                      onChange={(ev) => {
                        const sets = Number(ev.target.value);
                        if (sets < 1 || sets > 5) return;
                        const next = structuredClone(plan);
                        next.days[i].items[j].sets = sets;
                        onChange(next);
                      }}
                    />
                  </label>
                )}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
