import * as XLSX from 'xlsx';
import {
  User,
  Team,
  KpiRecord,
  MendanRecord,
  AwardCategory,
  AwardProposal,
  QuarterConfig,
  KpiThresholds,
  AuditLog,
  KpiImportRow,
  EvaluationCriterion,
  MemberEvaluationRecord,
  CriteriaProposal,
} from '../types';

const STORAGE_KEYS = {
  USERS: 'dym_users_v5',
  TEAMS: 'dym_teams_v2',
  KPI_RECORDS: 'dym_kpi_records_v3',
  MENDAN_RECORDS: 'dym_mendan_records_v8',
  AWARD_CATEGORIES: 'dym_award_categories_v2',
  AWARD_PROPOSALS: 'dym_award_proposals_v2',
  QUARTER_CONFIGS: 'dym_quarter_configs_v2',
  KPI_THRESHOLDS: 'dym_kpi_thresholds_v2',
  AUDIT_LOGS: 'dym_audit_logs_v2',
  CURRENT_USER_ID: 'dym_current_user_id_v2',
  EVALUATION_CRITERIA: 'dym_eval_criteria_v1',
  MEMBER_EVALUATIONS: 'dym_member_evals_v1',
  CRITERIA_PROPOSALS: 'dym_criteria_proposals_v1',
};

export * from '../data/seed';
import {
  INITIAL_TEAMS,
  INITIAL_USERS,
  INITIAL_KPIS,
  INITIAL_QUARTERS,
  INITIAL_AWARD_CATEGORIES,
  INITIAL_PROPOSALS,
  INITIAL_MENDANS,
  INITIAL_THRESHOLDS,
  INITIAL_AUDIT_LOGS,
  INITIAL_EVALUATION_CRITERIA,
  INITIAL_MEMBER_EVALUATIONS,
  INITIAL_CRITERIA_PROPOSALS,
} from '../data/seed';

// Helper to compute evaluation total score consistently across the entire system
export const calculateEvaluationTotalScore = (
  scores: Record<string, number>,
  criteria: EvaluationCriterion[] = INITIAL_EVALUATION_CRITERIA
): number => {
  let total = 0;
  criteria.forEach((crit) => {
    const level = scores[crit.id] ?? (crit.id === 'crit-late' ? 0 : 3);
    if (crit.id === 'crit-late') {
      if (level > 1) {
        total -= (level - 1) * 2;
      }
    } else {
      total += level * crit.weight;
    }
  });
  return Math.max(0, Math.min(100, total));
};

// Helper to get from local storage or fallback to initial
function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch (err) {
    console.error(`Error reading storage key ${key}:`, err);
    return fallback;
  }
}

function setToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error setting storage key ${key}:`, err);
  }
}

// Storage API
export const storageService = {
  getUsers: (): User[] => {
    const stored = getFromStorage<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const initialMap = new Map(INITIAL_USERS.map((u) => [u.id, u.rank]));
    return stored.map((u) => ({
      ...u,
      full_name: (u.full_name || '').replace(/\s*\([^)]*\)/g, '').trim(),
      rank: u.rank || initialMap.get(u.id) || 'C2',
    }));
  },
  saveUsers: (users: User[]) => setToStorage(STORAGE_KEYS.USERS, users),

  getTeams: (): Team[] => {
    const stored = getFromStorage<Team[]>(STORAGE_KEYS.TEAMS, INITIAL_TEAMS);
    return stored.map((t) => ({
      ...t,
      name: t.name.replace(/\s*\([^)]*\)/g, '').trim(),
    }));
  },
  saveTeams: (teams: Team[]) => setToStorage(STORAGE_KEYS.TEAMS, teams),

  getKpiRecords: (): KpiRecord[] => getFromStorage(STORAGE_KEYS.KPI_RECORDS, INITIAL_KPIS),
  saveKpiRecords: (records: KpiRecord[]) => setToStorage(STORAGE_KEYS.KPI_RECORDS, records),

  getMendanRecords: (): MendanRecord[] => {
    const stored = getFromStorage<MendanRecord[]>(STORAGE_KEYS.MENDAN_RECORDS, INITIAL_MENDANS);
    const existingIds = new Set(stored.map((r) => r.id));
    const missing = INITIAL_MENDANS.filter((r) => !existingIds.has(r.id));
    const merged = missing.length > 0 ? [...stored, ...missing] : stored;
    return merged.map((r) => ({
      ...r,
      quarter_id: r.quarter_id || 'Q1',
      visibility_scope: r.visibility_scope || 'member_and_leader',
    }));
  },
  saveMendanRecords: (records: MendanRecord[]) => setToStorage(STORAGE_KEYS.MENDAN_RECORDS, records),

  getAwardCategories: (): AwardCategory[] => getFromStorage(STORAGE_KEYS.AWARD_CATEGORIES, INITIAL_AWARD_CATEGORIES),
  saveAwardCategories: (cats: AwardCategory[]) => setToStorage(STORAGE_KEYS.AWARD_CATEGORIES, cats),

  getAwardProposals: (): AwardProposal[] => {
    const stored = getFromStorage<AwardProposal[]>(STORAGE_KEYS.AWARD_PROPOSALS, INITIAL_PROPOSALS);
    const existingIds = new Set(stored.map((p) => p.id));
    const missing = INITIAL_PROPOSALS.filter((p) => !existingIds.has(p.id));
    const merged = missing.length > 0 ? [...stored, ...missing] : stored;
    return merged.map((p) => ({
      ...p,
      visibility_type: p.visibility_type || (p.status === 'approved' ? 'public' : 'private'),
      allowed_viewer_ids: p.allowed_viewer_ids || [],
    }));
  },
  saveAwardProposals: (proposals: AwardProposal[]) => setToStorage(STORAGE_KEYS.AWARD_PROPOSALS, proposals),

  getQuarterConfigs: (): QuarterConfig[] => getFromStorage(STORAGE_KEYS.QUARTER_CONFIGS, INITIAL_QUARTERS),
  saveQuarterConfigs: (quarters: QuarterConfig[]) => setToStorage(STORAGE_KEYS.QUARTER_CONFIGS, quarters),

  getKpiThresholds: (): KpiThresholds => getFromStorage(STORAGE_KEYS.KPI_THRESHOLDS, INITIAL_THRESHOLDS),
  saveKpiThresholds: (thresholds: KpiThresholds) => setToStorage(STORAGE_KEYS.KPI_THRESHOLDS, thresholds),

  getAuditLogs: (): AuditLog[] => getFromStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS),
  saveAuditLogs: (logs: AuditLog[]) => setToStorage(STORAGE_KEYS.AUDIT_LOGS, logs),

  getEvaluationCriteria: (): EvaluationCriterion[] =>
    getFromStorage(STORAGE_KEYS.EVALUATION_CRITERIA, INITIAL_EVALUATION_CRITERIA),
  saveEvaluationCriteria: (items: EvaluationCriterion[]) =>
    setToStorage(STORAGE_KEYS.EVALUATION_CRITERIA, items),

  getMemberEvaluations: (): MemberEvaluationRecord[] => {
    const stored = getFromStorage<MemberEvaluationRecord[]>(STORAGE_KEYS.MEMBER_EVALUATIONS, INITIAL_MEMBER_EVALUATIONS);
    const existingIds = new Set(stored.map((r) => r.id));
    const missing = INITIAL_MEMBER_EVALUATIONS.filter((r) => !existingIds.has(r.id));
    const merged = missing.length > 0 ? [...stored, ...missing] : stored;
    return merged.map((r) => {
      // Fix cached discrepancy if eval-cuong-q1 had crit-horenso: 3
      const updatedScores = { ...(r.scores || {}) };
      if (r.id === 'eval-cuong-q1' && updatedScores['crit-horenso'] === 3) {
        updatedScores['crit-horenso'] = 4;
      }
      if (r.id === 'eval-cuong-q4' && updatedScores['crit-flexibility'] === 3) {
        updatedScores['crit-flexibility'] = 4;
        updatedScores['crit-horenso'] = 4;
        updatedScores['crit-quality'] = 3;
      }
      if (r.id === 'eval-giang-q4' && updatedScores['crit-horenso'] !== 4) {
        updatedScores['crit-horenso'] = 4;
      }

      // Calculate total score from criteria to guarantee 100% agreement between table and modal
      let calculatedTotal = r.total_score;
      if (Object.keys(updatedScores).length > 0) {
        calculatedTotal = calculateEvaluationTotalScore(updatedScores, INITIAL_EVALUATION_CRITERIA);
      }

      return {
        ...r,
        scores: updatedScores,
        total_score: calculatedTotal,
        is_public: r.is_public !== undefined ? r.is_public : true,
      };
    });
  },
  saveMemberEvaluations: (records: MemberEvaluationRecord[]) =>
    setToStorage(STORAGE_KEYS.MEMBER_EVALUATIONS, records),

  getCriteriaProposals: (): CriteriaProposal[] =>
    getFromStorage(STORAGE_KEYS.CRITERIA_PROPOSALS, INITIAL_CRITERIA_PROPOSALS),
  saveCriteriaProposals: (proposals: CriteriaProposal[]) =>
    setToStorage(STORAGE_KEYS.CRITERIA_PROPOSALS, proposals),

  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const logs = storageService.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    storageService.saveAuditLogs(logs);
    return newLog;
  },

  getCurrentUserId: (): string => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'user-admin';
  },
  setCurrentUserId: (id: string) => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
  },

  resetAllData: () => {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.TEAMS);
    localStorage.removeItem(STORAGE_KEYS.KPI_RECORDS);
    localStorage.removeItem(STORAGE_KEYS.MENDAN_RECORDS);
    localStorage.removeItem(STORAGE_KEYS.AWARD_CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.AWARD_PROPOSALS);
    localStorage.removeItem(STORAGE_KEYS.QUARTER_CONFIGS);
    localStorage.removeItem(STORAGE_KEYS.KPI_THRESHOLDS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    localStorage.removeItem(STORAGE_KEYS.EVALUATION_CRITERIA);
    localStorage.removeItem(STORAGE_KEYS.MEMBER_EVALUATIONS);
    localStorage.removeItem(STORAGE_KEYS.CRITERIA_PROPOSALS);
  },
};

// Excel Processing Service using sheetjs (xlsx)
export const excelService = {
  /**
   * Export KPI records to a clean formatted .xlsx file
   */
  exportKpiToExcel: (
    records: KpiRecord[],
    users: User[],
    teams: Team[],
    title: string = 'DYM_KPI_Report'
  ) => {
    const userMap = new Map(users.map((u) => [u.id, u]));
    const teamMap = new Map(teams.map((t) => [t.id, t]));

    const data = records.map((rec, index) => {
      const user = userMap.get(rec.user_id);
      const team = teamMap.get(rec.team_id);
      const completionRate = rec.target > 0 ? ((rec.achieved / rec.target) * 100).toFixed(1) + '%' : '0%';
      const errorRate = rec.achieved > 0 ? ((rec.miss_count / rec.achieved) * 100).toFixed(2) + '%' : '0%';

      return {
        'STT': index + 1,
        'Mã Nhân Viên': user?.employee_code || '',
        'Họ và Tên': user?.full_name || '',
        'Team': team?.name || '',
        'Kỳ Đánh Giá': rec.period_label,
        'Mục Tiêu (Target)': rec.target,
        'Đã Đạt (Achieved)': rec.achieved,
        'Tỷ Lệ Đạt': completionRate,
        'Số Lỗi (Miss)': rec.miss_count,
        'Tỷ Lệ Lỗi': errorRate,
        'Số Lần Trễ (Late)': rec.late_count,
        'Số Đề Án': rec.projects ? rec.projects.length : 0,
        'Mô Tả Đề Án': rec.projects ? rec.projects.map((p) => `${p.name} (${p.role})`).join('; ') : '',
        'Ghi Chú': rec.notes || '',
        'Ngày Cập Nhật': new Date(rec.updated_at).toLocaleDateString('vi-VN'),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'KPI_Report');

    // Generate buffer & trigger browser download
    const filename = `${title}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, filename);
  },

  /**
   * Generate an empty sample Excel template for bulk import
   */
  downloadSampleImportTemplate: (users: User[], teams: Team[]) => {
    const sampleData = users.slice(0, 4).map((u, i) => {
      const team = teams.find((t) => t.id === u.team_id);
      return {
        'Mã NV': u.employee_code,
        'Họ Tên': u.full_name,
        'Team': team?.code || '2ka',
        'Kỳ (VD: 2026-03 hoặc 2026-Q1)': '2026-03',
        'Mục Tiêu (Target)': 500 + i * 100,
        'Đạt Được (Achieved)': 520 + i * 105,
        'Số Lỗi (Miss)': i % 2,
        'Số Lần Trễ (Late)': i % 2,
        'Số Đề Án': 1,
        'Ghi Chú': 'Hoàn thành tốt nhiệm vụ được giao',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mau_Import_KPI');

    XLSX.writeFile(workbook, 'Mau_Nhap_KPI_DYM.xlsx');
  },

  /**
   * Parse an uploaded Excel file for KPI Import
   */
  parseKpiImportFile: async (
    file: File,
    users: User[],
    teams: Team[],
    existingRecords: KpiRecord[]
  ): Promise<KpiImportRow[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

    const userByCode = new Map(users.map((u) => [u.employee_code.trim().toUpperCase(), u]));

    const parsedRows: KpiImportRow[] = rawRows.map((row, idx) => {
      // Find employee code from possible column names
      const empCodeRaw = String(row['Mã NV'] || row['Mã Nhân Viên'] || row['Employee Code'] || row['Code'] || '').trim().toUpperCase();
      const targetRaw = row['Mục Tiêu (Target)'] ?? row['Target'] ?? row['Mục tiêu'] ?? row['Mục Tiêu'];
      const achievedRaw = row['Đạt Được (Achieved)'] ?? row['Achieved'] ?? row['Đạt được'] ?? row['Đạt'];
      const missRaw = row['Số Lỗi (Miss)'] ?? row['Miss'] ?? row['Lỗi'] ?? 0;
      const lateRaw = row['Số Lần Trễ (Late)'] ?? row['Late'] ?? row['Trễ'] ?? 0;
      const projectCountRaw = row['Số Đề Án'] ?? row['Projects'] ?? 0;
      const periodRaw = String(row['Kỳ'] || row['Kỳ (VD: 2026-03 hoặc 2026-Q1)'] || row['Period'] || '2026-03').trim();
      const notesRaw = String(row['Ghi Chú'] || row['Notes'] || '').trim();

      const user = userByCode.get(empCodeRaw);

      const target = Number(targetRaw);
      const achieved = Number(achievedRaw);
      const miss_count = Number(missRaw);
      const late_count = Number(lateRaw);
      const project_count = Number(projectCountRaw);

      let status: 'valid' | 'invalid' = 'valid';
      let error_message = '';

      if (!empCodeRaw) {
        status = 'invalid';
        error_message = 'Thiếu mã nhân viên';
      } else if (!user) {
        status = 'invalid';
        error_message = `Mã nhân viên '${empCodeRaw}' không tồn tại trong hệ thống`;
      } else if (isNaN(target) || target < 0) {
        status = 'invalid';
        error_message = 'Mục tiêu (Target) không hợp lệ';
      } else if (isNaN(achieved) || achieved < 0) {
        status = 'invalid';
        error_message = 'Đạt được (Achieved) không hợp lệ';
      }

      // Check existing record
      const existing = user
        ? existingRecords.find((r) => r.user_id === user.id && r.period_label.includes(periodRaw))
        : undefined;

      return {
        row_number: idx + 2, // 1-based + 1 header
        employee_code: empCodeRaw,
        full_name: user?.full_name || String(row['Họ Tên'] || row['Họ và Tên'] || ''),
        team_code: user ? teams.find((t) => t.id === user.team_id)?.name : String(row['Team'] || ''),
        period: periodRaw,
        target: isNaN(target) ? 0 : target,
        achieved: isNaN(achieved) ? 0 : achieved,
        miss_count: isNaN(miss_count) ? 0 : miss_count,
        late_count: isNaN(late_count) ? 0 : late_count,
        project_count: isNaN(project_count) ? 0 : project_count,
        notes: notesRaw,
        status,
        error_message,
        existing_record: existing,
      };
    });

    return parsedRows;
  },
};
