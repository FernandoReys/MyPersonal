import { exercises } from "./catalog.ts";
export type Assessment = {
  name: string;
  age: number;
  height: number;
  weight: number;
  goal: string;
  experience: string;
  months: number;
  days: number;
  minutes: number;
  location: string;
  equipment: string[];
  priority: string;
  limitations: boolean;
  notes: string;
  preferences: string;
  sleep: number;
  activity: string;
  history: string;
  consent: boolean;
  aiConsent: boolean;
};
export type PlanItem = {
  exerciseId: string;
  sets: number;
  reps: number;
  rest: number;
  rir: number;
};
export type PlanDay = { name: string; items: PlanItem[] };
export type Plan = {
  id: string;
  createdAt: string;
  weeks: number;
  reason: string;
  days: PlanDay[];
};
export type SetLog = {
  exerciseId: string;
  set: number;
  kg: number;
  reps: number;
  rpe: number;
};
export type Session = {
  id: string;
  day: string;
  startedAt: string;
  finishedAt: string;
  sets: SetLog[];
  discomfort: boolean;
};
export type Measurement = {
  id: string;
  date: string;
  weight: number;
  waist: number | null;
};
export type Message = { role: "user" | "assistant"; content: string };
export type State = {
  assessment: Assessment | null;
  plan: Plan | null;
  sessions: Session[];
  measurements: Measurement[];
  messages: Message[];
};
export const emptyState: State = {
  assessment: null,
  plan: null,
  sessions: [],
  measurements: [],
  messages: [],
};
export function eligibility(a: Assessment): string | null {
  if (!a.consent) return "É necessário consentir com o uso da avaliação.";
  if (a.age < 18)
    return "Esta primeira versão é destinada a adultos. Procure orientação individual de profissional habilitado.";
  if (a.limitations || a.notes.trim())
    return "Há limitações ou observações de saúde relatadas. A geração automática fica suspensa até avaliação presencial de profissional habilitado.";
  return null;
}
export function generatePlan(a: Assessment): Plan {
  const blocked = eligibility(a);
  if (blocked) throw new Error(blocked);
  const available = exercises.filter(
    (e) =>
      e.equipment === "Peso corporal" ||
      a.equipment.includes(e.equipment) ||
      (a.location === "Academia" && e.equipment === "Academia"),
  );
  if (!available.some((e) => e.pattern === "Puxar"))
    throw new Error(
      "Para um plano equilibrado, informe acesso a halteres, elástico com ancoragem segura ou academia. Sem equipamento de puxada, peça adaptação profissional.",
    );
  const split = a.days >= 4 && a.experience !== "Iniciante" && a.sleep >= 7;
  const sets = a.experience === "Iniciante" || a.sleep < 7 ? 2 : 3;
  const count = Math.max(
    3,
    Math.min(6, Math.floor((a.minutes - 8) / (sets * 2.5))),
  );
  const days = Array.from({ length: a.days }, (_, i) => {
    const patterns = split
      ? i % 2 === 0
        ? ["Empurrar", "Puxar", "Ombro", "Cotovelo"]
        : ["Agachar", "Quadril", "Tornozelo", "Estabilizar"]
      : ["Agachar", "Empurrar", "Puxar", "Quadril", "Estabilizar", "Ombro"];
    const items = patterns.slice(0, count).flatMap((pattern) => {
      const options = available.filter(
        (e) =>
          e.pattern === pattern &&
          (a.experience !== "Iniciante" || e.level === "Iniciante"),
      );
      const preferred = options.find((e) =>
        a.preferences.toLowerCase().includes(e.name.toLowerCase()),
      );
      const e = preferred ?? options[i % Math.max(1, options.length)];
      return e
        ? [
            {
              exerciseId: e.id,
              sets,
              reps: a.goal === "Força" && a.experience !== "Iniciante" ? 8 : 10,
              rest: 90,
              rir: 3,
            },
          ]
        : [];
    });
    return {
      name: `Treino ${String.fromCharCode(65 + i)} · ${split ? (i % 2 === 0 ? "Superiores" : "Inferiores") : "Corpo inteiro"}`,
      items,
    };
  });
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    weeks: 6,
    reason: `Proposta por regras, não gerada por IA. ${split ? "Upper/Lower" : "Full Body"} considerando experiência, recuperação, dias e tempo. Comece com carga confortável, cerca de 3 repetições em reserva e valide a técnica com um profissional. Prioridade informada (${a.priority}) é registrada para revisão; não adicionamos volume automaticamente. Distribua sessões com recuperação adequada.`,
    days,
  };
}
export function review(sessions: Session[]): string {
  if (sessions.some((s) => s.discomfort))
    return "Desconforto registrado: suspenda o movimento que provoca dor e procure avaliação antes de progredir.";
  if (sessions.length < 4)
    return "Ainda há poucos registros. Mantenha o acompanhamento antes de sugerir mudanças.";
  const recent = sessions.slice(-4).flatMap((s) => s.sets);
  if (recent.some((s) => s.rpe >= 9))
    return "Esforço elevado em sessões recentes. Revise descanso, técnica e recuperação antes de aumentar cargas.";
  return "Revise a evolução por exercício. Se todas as séries foram confortáveis e a técnica está consistente, discuta uma pequena progressão. Nenhuma carga será alterada automaticamente.";
}
export function volume(sets: SetLog[]) {
  return sets.reduce((n, s) => n + s.kg * s.reps, 0);
}
