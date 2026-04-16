export const priorityMap: Record<string, { label: string; color: string; bg: string }> = {
  urgent_important: { label: "Gấp & Quan trọng", color: "#DC2626", bg: "#FEF2F2" },
  urgent_not_important: { label: "Gấp & Không quan trọng", color: "#F59E0B", bg: "#FFFBEB" },
  not_urgent_important: { label: "Không gấp & Quan trọng", color: "#3B82F6", bg: "#EFF6FF" },
  not_urgent_not_important: { label: "Không gấp & Không QT", color: "#6B7280", bg: "#F9FAFB" },
};

export const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  todo: { label: "Cần làm", color: "#6B7280", bg: "#F3F4F6" },
  in_progress: { label: "Đang làm", color: "#3B82F6", bg: "#DBEAFE" },
  done: { label: "Hoàn thành", color: "#00b24e", bg: "#DCFCE7" },
};

export type Watcher = { user_id: number; name: string };
export type TaskItem = {
  id: number; title: string; description: string;
  assignee_id: number | null; assignee_name: string;
  creator_id: number; creator_name: string;
  priority: string; status: string; progress: number;
  linked_objective_id: number | null; objective_name: string;
  linked_kr_id: number | null; kr_name: string;
  deadline: string | null; created_at: string;
  watchers: Watcher[];
};

export type StaffOption = { user_id: number; name: string };
export type ObjOption = { id: number; name: string; key_results?: { id: number; name: string }[] };

export function formatDate(d: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}
