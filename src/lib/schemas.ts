import { z } from "zod";
import { exercises } from "./catalog.ts";
export const assessmentSchema = z.object({
  name: z.string().trim().min(2).max(80),
  age: z.number().int().min(13).max(100),
  height: z.number().min(100).max(250),
  weight: z.number().min(25).max(350),
  goal: z.enum(["Hipertrofia", "Força", "Condicionamento"]),
  experience: z.enum(["Iniciante", "Intermediário", "Avançado"]),
  months: z.number().int().min(0).max(900),
  days: z.number().int().min(2).max(6),
  minutes: z.number().int().min(20).max(120),
  location: z.enum(["Casa", "Academia"]),
  equipment: z.array(z.enum(["Halteres", "Elástico", "Academia"])).max(3),
  priority: z.string().max(100),
  limitations: z.boolean(),
  notes: z.string().max(1000),
  preferences: z.string().max(500),
  sleep: z.number().min(0).max(16),
  activity: z.string().max(100),
  history: z.string().max(1000),
  consent: z.literal(true),
  aiConsent: z.boolean(),
});
const exerciseId = z
  .string()
  .refine((id) => exercises.some((e) => e.id === id), "Exercício inválido");
export const stateSchema = z.object({
  assessment: assessmentSchema.nullable(),
  plan: z
    .object({
      id: z.uuid(),
      createdAt: z.iso.datetime(),
      weeks: z.number().int().min(4).max(8),
      reason: z.string().max(3000),
      days: z
        .array(
          z.object({
            name: z.string().max(100),
            items: z
              .array(
                z.object({
                  exerciseId,
                  sets: z.number().int().min(1).max(5),
                  reps: z.number().int().min(1).max(30),
                  rest: z.number().int().min(30).max(300),
                  rir: z.number().int().min(1).max(5),
                }),
              )
              .min(1)
              .max(10),
          }),
        )
        .min(1)
        .max(6),
    })
    .nullable(),
  sessions: z
    .array(
      z.object({
        id: z.uuid(),
        day: z.string().max(100),
        startedAt: z.iso.datetime(),
        finishedAt: z.iso.datetime(),
        discomfort: z.boolean(),
        sets: z
          .array(
            z.object({
              exerciseId,
              set: z.number().int().min(0).max(10),
              kg: z.number().min(0).max(500),
              reps: z.number().int().min(1).max(100),
              rpe: z.number().min(1).max(10),
            }),
          )
          .min(1)
          .max(60),
      }),
    )
    .max(2000),
  measurements: z
    .array(
      z.object({
        id: z.uuid(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        weight: z.number().min(25).max(350),
        waist: z.number().min(30).max(250).nullable(),
      }),
    )
    .max(2000),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(12000),
      }),
    )
    .max(200),
});
