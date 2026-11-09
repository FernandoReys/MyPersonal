"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import type { Assessment } from "@/lib/training";
import { assessmentSchema } from "@/lib/schemas";
import { muscles } from "@/lib/catalog";
const initialAssessment: Assessment = {
  name: "",
  age: 21,
  height: 170,
  weight: 70,
  goal: "Hipertrofia",
  experience: "Iniciante",
  months: 0,
  days: 3,
  minutes: 45,
  location: "Casa",
  equipment: [],
  priority: "Equilíbrio geral",
  limitations: false,
  notes: "",
  preferences: "",
  sleep: 8,
  activity: "Moderada",
  history: "",
  consent: false,
  aiConsent: false,
};
export function AssessmentForm({
  assessment,
  disabled,
  onSave,
}: {
  assessment: Assessment | null;
  disabled: boolean;
  onSave: (a: Assessment) => void;
}) {
  const [a, setA] = useState(assessment ?? initialAssessment);
  const [error, setError] = useState("");
  function field<K extends keyof Assessment>(k: K, v: Assessment[K]) {
    setA({ ...a, [k]: v });
  }
  return (
    <form
      className="card assessment"
      onSubmit={(e) => {
        e.preventDefault();
        const r = assessmentSchema.safeParse(a);
        if (!r.success) {
          setError(r.error.issues.map((i) => i.message).join(" · "));
          return;
        }
        onSave(r.data);
      }}
    >
      <span className="pill">AVALIAÇÃO INICIAL</span>
      <h2>Vamos conhecer você.</h2>
      <p>
        Responda no seu ritmo. Campos de saúde detalhados são opcionais.
        Atualizar a avaliação remove o plano ativo para evitar recomendações
        desatualizadas; seu histórico permanece.
      </p>
      {error && <p role="alert">{error}</p>}
      <h3>01 / Você e seus objetivos</h3>
      <div className="formgrid">
        <label>
          Como quer ser chamado?
          <input
            required
            value={a.name}
            onChange={(e) => field("name", e.target.value)}
          />
        </label>
        {[
          ["age", "Idade", 13, 100],
          ["height", "Altura (cm)", 100, 250],
          ["weight", "Peso (kg)", 25, 350],
          ["months", "Meses de prática", 0, 900],
        ].map(([k, label, min, max]) => (
          <label key={k}>
            {label}
            <input
              required
              type="number"
              min={min}
              max={max}
              step={k === "weight" ? "0.1" : "1"}
              value={a[k as "age"]}
              onChange={(e) => field(k as "age", Number(e.target.value))}
            />
          </label>
        ))}
        <label>
          Objetivo
          <select
            value={a.goal}
            onChange={(e) => field("goal", e.target.value)}
          >
            {["Hipertrofia", "Força", "Condicionamento"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Experiência
          <select
            value={a.experience}
            onChange={(e) => field("experience", e.target.value)}
          >
            {["Iniciante", "Intermediário", "Avançado"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Prioridade muscular
          <select
            value={a.priority}
            onChange={(e) => field("priority", e.target.value)}
          >
            <option>Equilíbrio geral</option>
            {muscles.map((m) => (
              <option key={m.id}>{m.name}</option>
            ))}
          </select>
        </label>
      </div>
      <h3>02 / Sua rotina</h3>
      <div className="formgrid">
        {[
          ["days", "Dias por semana", 2, 6],
          ["minutes", "Minutos por sessão", 20, 120],
          ["sleep", "Horas médias de sono", 0, 16],
        ].map(([k, l, min, max]) => (
          <label key={k}>
            {l}
            <input
              type="number"
              required
              min={min}
              max={max}
              value={a[k as "days"]}
              onChange={(e) => field(k as "days", Number(e.target.value))}
            />
          </label>
        ))}
        <label>
          Onde treina?
          <select
            value={a.location}
            onChange={(e) => field("location", e.target.value)}
          >
            <option>Casa</option>
            <option>Academia</option>
          </select>
        </label>
        <label>
          Atividade diária
          <select
            value={a.activity}
            onChange={(e) => field("activity", e.target.value)}
          >
            {["Baixa", "Moderada", "Alta"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      </div>
      <p>Equipamentos disponíveis (além do peso corporal)</p>
      <div className="checks">
        {["Halteres", "Elástico", "Academia"].map((x) => (
          <label key={x}>
            <input
              type="checkbox"
              checked={a.equipment.includes(x)}
              onChange={(e) =>
                field(
                  "equipment",
                  e.target.checked
                    ? [...a.equipment, x]
                    : a.equipment.filter((v) => v !== x),
                )
              }
            />
            {x}
          </label>
        ))}
      </div>
      <label>
        Preferências de exercícios
        <input
          value={a.preferences}
          maxLength={500}
          onChange={(e) => field("preferences", e.target.value)}
        />
      </label>
      <label>
        Histórico de treinos (opcional)
        <textarea
          maxLength={1000}
          value={a.history}
          onChange={(e) => field("history", e.target.value)}
        />
      </label>
      <h3>03 / Saúde e consentimento</h3>
      <label className="check">
        <input
          type="checkbox"
          checked={a.limitations}
          onChange={(e) => field("limitations", e.target.checked)}
        />
        Tenho dor, lesão, gestação, condição de saúde ou orientação médica que
        exige adaptação do exercício.
      </label>
      <label>
        Observações opcionais — compartilhe apenas o necessário
        <textarea
          maxLength={1000}
          value={a.notes}
          onChange={(e) => field("notes", e.target.value)}
        />
      </label>
      <label className="check">
        <input
          type="checkbox"
          required
          checked={a.consent}
          onChange={(e) => field("consent", e.target.checked)}
        />
        Autorizo armazenar minha avaliação e meus registros para acompanhar meu
        treino. Posso exportar e excluir meus dados em Configurações.
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={a.aiConsent}
          onChange={(e) => field("aiConsent", e.target.checked)}
        />
        Autorizo enviar contexto de treino à OpenAI quando usar o My Personal AI
        (opcional).
      </label>
      <button className="primary" disabled={disabled}>
        <Check size={18} />
        Salvar avaliação
      </button>
    </form>
  );
}
