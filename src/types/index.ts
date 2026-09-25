export type Role = 'master' | 'admin' | 'leader' | 'subleader' | 'member';

export type ViewScope = 'all' | '2ka_all' | 'own_team' | 'custom';

export type JapaneseLevel = 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | 'Bản ngữ' | 'Chưa thi';

export type EmployeeRank =
  | 'D3'
  | 'D2'
  | 'D1'
  | 'C3'
  | 'C2'
  | 'C1'
  | 'B3'
  | 'B2'
  | 'B1'
  | 'A3'
  | 'A2'
  | 'A1';

export const ALL_RANKS: EmployeeRank[] = [
  'A1', 'A2', 'A3',
  'B1', 'B2', 'B3',
  'C1', 'C2', 'C3',
  'D1', 'D2', 'D3',
];

export const RANK_STYLE_CONFIG: Record<
  EmployeeRank,
  { bg: string; text: string; border?: string; label: string }
> = {
  D3: { bg: '#DCE8F5', text: '#1E3A5F', border: '#B8D1EB', label: 'D3' },
  D2: { bg: '#DCE8F5', text: '#1E3A5F', border: '#B8D1EB', label: 'D2' },
  D1: { bg: '#DCE8F5', text: '#1E3A5F', border: '#B8D1EB', label: 'D1' },

  C3: { bg: '#3B5D82', text: '#FFFFFF', border: '#2C496A', label: 'C3' },
  C2: { bg: '#3B5D82', text: '#FFFFFF', border: '#2C496A', label: 'C2' },
  C1: { bg: '#3B5D82', text: '#FFFFFF', border: '#2C496A', label: 'C1' },

  B3: { bg: '#D9A441', text: '#FFFFFF', border: '#BA882E', label: 'B3' },
  B2: { bg: '#D9A441', text: '#FFFFFF', border: '#BA882E', label: 'B2' },
  B1: { bg: '#D9A441', text: '#FFFFFF', border: '#BA882E', label: 'B1' },

  A3: { bg: '#C15B4A', text: '#FFFFFF', border: '#A44434', label: 'A3' },
  A2: { bg: '#C15B4A', text: '#FFFFFF', border: '#A44434', label: 'A2' },
  A1: { bg: '#C15B4A', text: '#FFFFFF', border: '#A44434', label: 'A1' },
};

export interface User {
  id: string;
  employee_code: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  rank?: EmployeeRank;
  japanese_level?: JapaneseLevel;
  role: Role;
  view_scope: ViewScope;
  allowed_team_ids: string[];
  team_id: string;
  is_active: boolean;
  position?: string;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  parent_team_id: string | null;
  leader_ids: string[];
  subleader_ids: string[];
  description?: string;
  order: number;
}

export interface ProjectDetail {
  id: string;
  name: string;
  description: string;
  role: string;
}

export interface KpiRecord {
  id: string;
  user_id: string;
  team_id: string;
  year: number;
  quarter_id: string; // 'Q1', 'Q2', 'Q3', 'Q4'
  month: number; // 1 - 12 (0 for quarterly aggregated)
  period_label: string; // e.g., 'Tháng 03/2026', 'Quý 1/2026'
  target: number;
  achieved: number;
  unit: string; // 'task', 'hồ sơ', 'giờ'
  miss_count: number;
  late_count: number;
  projects: ProjectDetail[];
  notes?: string;
  evaluator_id?: string;
  updated_at: string;
}

export type MendanStatus = 'not_started' | 'pre_mendan' | 'completed';
export type MendanVisibilityScope = 'member_and_leader' | 'leader_only' | 'manager_only';
export type MendanVisibilityType = 'public' | 'private';

export interface MendanRecord {
  id: string;
  user_id: string;
  evaluator_id: string;
  team_id: string;
  quarter_id: string | null; // null if ad-hoc
  evaluation_type: 'quarterly' | 'adhoc';
  scheduled_date: string;
  actual_date?: string;
  status: MendanStatus; // 'not_started' (Chưa đánh giá), 'pre_mendan' (Đã đánh giá), 'completed' (Hoàn thành mendan)
  visibility_scope?: MendanVisibilityScope;
  visibility_type?: MendanVisibilityType; // 'public' (Công Khai: Nhân sự + Người đánh giá + người được chọn) | 'private' (Không công khai: Chỉ người đánh giá)
  allowed_viewer_ids?: string[]; // Danh sách thành viên khác được chọn thêm để xem
  
  // Leader/Subleader preparation assessment for Manager
  leader_evaluator_id?: string;
  leader_evaluated_at?: string;
  leader_good_points?: string; // Điểm tốt:
  leader_improvements?: string; // Điểm chưa tốt cần bạn khắc phục:
  leader_risks?: string; // Rủi ro:
  leader_other?: string; // Khác(Nếu có):

  // Manager Mendan final result
  manager_evaluator_id?: string;
  content_format?: 'standard_3' | 'single_note';
  single_note?: string;

  // Criteria (standard 3 items):
  good_points: string;
  improvements: string;
  next_goals: string;
  
  pre_notes?: string; // Private notes for leader/evaluator
  memo?: string; // Final memo
  
  created_at: string;
  updated_at: string;
}

export interface EvaluationCriterion {
  id: string;
  name: string; // e.g. タスク処理能力
  vietnamese_name: string; // e.g. Khả năng xử lý tác vụ
  weight: number; // e.g. 5, 4, 4, 3, 2, 2, 0
  order: number;
  levels: {
    level1: string;
    level2: string;
    level3: string;
    level4: string;
    level5: string;
  };
}

export interface MemberEvaluationRecord {
  id: string;
  user_id: string;
  evaluator_id: string;
  team_id: string;
  quarter_id: string; // e.g. 'Q1'
  year: number;
  scores: Record<string, number>; // criterionId -> chosen level (1..5 or 0..5)
  total_score: number;
  rank_grade?: string; // 'S' | 'A' | 'B' | 'C' | 'D'
  note?: string;
  status: 'draft' | 'finalized';
  updated_at: string;
}

export interface CriteriaProposal {
  id: string;
  proposed_by: string;
  proposed_by_name: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_note?: string;
  criteria: EvaluationCriterion[];
}

export interface AwardCategory {
  id: string;
  name: string;
  icon: string;
  criteria_description: string;
  order: number;
}

export type ProposalStatus = 'pending' | 'approved' | 'rejected';

export interface AwardProposal {
  id: string;
  user_id: string;
  category_id: string;
  quarter_id: string;
  year: number;
  proposed_by: string;
  reason: string;
  status: ProposalStatus;
  feedback?: string;
  is_published: boolean;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export type NotificationType = 'kpi_updated' | 'award_result' | 'mendan_scheduled';

export interface AppNotification {
  id: string;
  user_id: string; // specific user or 'all'
  title: string;
  message: string;
  type: NotificationType;
  link_module?: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  kpi_updates: boolean;
  award_results: boolean;
  mendan_alerts: boolean;
}

export interface QuarterConfig {
  id: string;
  year: number;
  name: string; // 'Q1', 'Q2', 'Q3', 'Q4'
  label: string; // 'Quý 1 (T1 - T3)'
  months: number[];
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_published_awards: boolean;
}

export interface KpiThresholds {
  exceeded_rate: number; // e.g. 102 or 105
  achieved_rate: number; // e.g. 100
  needs_improvement_rate: number; // < 100
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: 'import_kpi' | 'export_kpi' | 'approve_award' | 'reject_award' | 'complete_mendan' | 'config_update';
  details: string;
  file_name?: string;
  records_count?: number;
  timestamp: string;
}

export interface KpiImportRow {
  row_number: number;
  employee_code: string;
  full_name?: string;
  team_code?: string;
  period: string; // e.g. '2026-03' or '2026-Q1'
  target: number;
  achieved: number;
  miss_count: number;
  late_count: number;
  project_count: number;
  notes?: string;
  status: 'valid' | 'invalid';
  error_message?: string;
  existing_record?: KpiRecord;
}
