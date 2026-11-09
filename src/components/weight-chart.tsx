"use client";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { State } from "@/lib/training";
import { Empty } from "./empty";
export function WeightChart({ state }: { state: State }) {
  if (state.measurements.length < 2)
    return (
      <Empty text="Registre pelo menos duas medidas para acompanhar sua evolução. Nenhum dado de exemplo é utilizado." />
    );
  return (
    <div style={{ height: 240, width: "100%" }}>
      <ResponsiveContainer>
        <LineChart
          data={[...state.measurements].sort((a, b) =>
            a.date.localeCompare(b.date),
          )}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" />
          <YAxis domain={["auto", "auto"]} unit="kg" />
          <Tooltip />
          <Line
            dataKey="weight"
            name="Peso informado (kg)"
            stroke="#168869"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
