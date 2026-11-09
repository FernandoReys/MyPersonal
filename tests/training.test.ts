import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generatePlan,
  eligibility,
  review,
  volume,
  type Assessment,
} from "../src/lib/training.ts";
import { exercises } from "../src/lib/catalog.ts";
const a: Assessment = {
  name: "Teste",
  age: 25,
  height: 170,
  weight: 70,
  goal: "Hipertrofia",
  experience: "Iniciante",
  months: 0,
  days: 3,
  minutes: 45,
  location: "Casa",
  equipment: ["Elástico"],
  priority: "Equilíbrio geral",
  limitations: false,
  notes: "",
  preferences: "",
  sleep: 8,
  activity: "Moderada",
  history: "",
  consent: true,
  aiConsent: false,
};
test("blocks pain, medical notes, minors and missing consent", () => {
  for (const value of [
    { ...a, limitations: true },
    { ...a, notes: "dor no joelho" },
    { ...a, age: 16 },
    { ...a, consent: false },
  ]) {
    assert.ok(eligibility(value));
    assert.throws(() => generatePlan(value));
  }
});
test("requires a pulling option, never invents unavailable equipment", () => {
  assert.throws(() => generatePlan({ ...a, equipment: [] }));
  const p = generatePlan(a);
  assert.equal(p.days.length, 3);
  for (const d of p.days) {
    assert.ok(
      d.items.some(
        (i) =>
          exercises.find((e) => e.id === i.exerciseId)?.pattern === "Puxar",
      ),
    );
    for (const i of d.items) {
      const e = exercises.find((e) => e.id === i.exerciseId)!;
      assert.ok(["Peso corporal", "Elástico"].includes(e.equipment));
      assert.equal(i.sets, 2);
    }
  }
});
test("experience and sleep change split independently of days", () => {
  assert.match(generatePlan({ ...a, days: 4 }).days[0].name, /Corpo inteiro/);
  assert.match(
    generatePlan({ ...a, days: 4, experience: "Intermediário" }).days[0].name,
    /Superiores/,
  );
  assert.match(
    generatePlan({ ...a, days: 4, experience: "Intermediário", sleep: 5 })
      .days[0].name,
    /Corpo inteiro/,
  );
});
test("volume uses logged data only", () =>
  assert.equal(
    volume([
      { exerciseId: "row", set: 0, kg: 10, reps: 12, rpe: 7 },
      { exerciseId: "row", set: 1, kg: 12, reps: 10, rpe: 8 },
    ]),
    240,
  ));
test("empty history does not claim progress", () =>
  assert.match(review([]), /poucos registros/));
test("discomfort prevents progression recommendation", () =>
  assert.match(
    review([
      {
        id: "x",
        day: "A",
        startedAt: "",
        finishedAt: "",
        sets: [],
        discomfort: true,
      },
    ]),
    /suspenda/,
  ));
