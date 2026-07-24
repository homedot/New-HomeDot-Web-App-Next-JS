"use client";

import { colors } from "@/constants/colors";
import { spacing, radius, shadow } from "@/utils/size";
import ProDashboardActivityChart from "@/components/ProDashboardActivityChart";
import type { ProfessionalProjectRecord } from "@/services/ProfessionalDashboardService";

function mk(id: string, monthsAgo: number, status: string): ProfessionalProjectRecord {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return { _id: id, projectName: `Project ${id}`, projectStatus: status, startDate: d.toISOString(), projectSlug: id };
}
const mockProjects: ProfessionalProjectRecord[] = [
  mk("1", 5, "completed"),
  mk("2", 5, "completed"),
  mk("3", 4, "cancelled"),
  mk("4", 3, "ongoing"),
  mk("5", 3, "ongoing"),
  mk("6", 3, "ongoing"),
  mk("7", 2, "completed"),
  mk("8", 1, "ongoing"),
  mk("9", 0, "completed"),
  mk("10", 0, "completed"),
  mk("11", 0, "ongoing"),
];

export default function ScratchPreviewPage() {
  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16, background: colors.bg }}>
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: spacing.xl }}>
        <div id="chart-panel" style={{ background: colors.card, border: `1px solid ${colors.line}`, borderRadius: radius.lg, boxShadow: shadow.sm }}>
          <ProDashboardActivityChart projects={mockProjects} />
        </div>
        <div style={{ background: colors.card, border: `1px solid ${colors.line}`, borderRadius: radius.lg, boxShadow: shadow.sm, padding: 20 }}>
          <ProDashboardActivityChart projects={[]} />
        </div>
      </div>
    </div>
  );
}
