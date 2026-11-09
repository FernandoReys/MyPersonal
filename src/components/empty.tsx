"use client";
import { Activity } from "lucide-react";
export function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <Activity size={35} />
      <p>{text}</p>
    </div>
  );
}
