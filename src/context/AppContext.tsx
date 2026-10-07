import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  User,
  Team,
  KpiRecord,
  MendanRecord,
  AwardCategory,
  AwardProposal,
  AppNotification,
  QuarterConfig,
  KpiThresholds,
  AuditLog,
  ProposalStatus,
  KpiImportRow,
  MendanStatus,
  MendanVisibilityType,
  EvaluationCriterion,
  MemberEvaluationRecord,
  CriteriaProposal,
} from '../types';
import { storageService, excelService } from '../services/storage';
import { notificationPoller } from '../services/notificationPoller';

export type NavTab = 
  | 'home'
  | 'kpi'
  | 'mendan'
  | 'evaluations'
  | 'awards'
  | 'profile'
  | 'admin-team'
  | 'admin-config';

interface AppContextType {
  currentUser: User;
  switchUser: (userId: string) => void;
  users: User[];
  teams: Team[];
  kpiRecords: KpiRecord[];
  mendanRecords: MendanRecord[];
  awardCategories: AwardCategory[];
  awardProposals: AwardProposal[];
  quarterConfigs: QuarterConfig[];
  kpiThresholds: KpiThresholds;
  auditLogs: AuditLog[];
  notifications: AppNotification[];
  unreadCount: number;

  // Navigation
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;

  // Filters for KPI & Data
  selectedMonth: number | 'all';
  setSelectedMonth: (m: number | 'all') => void;
  selectedQuarter: string | 'all';
  setSelectedQuarter: (q: string | 'all') => void;
  selectedTeamId: string | 'all';
  setSelectedTeamId: (teamId: string | 'all') => void;

  // Permissions & Scopes
  isMaster: boolean;
  isAdmin: boolean;
  isLeaderOrAdmin: boolean;
  canCreateMendan: boolean;
  canViewTeam: (teamId: string) => boolean;
  visibleTeams: Team[];
  visibleUsers: User[];
  visibleKpiRecords: KpiRecord[];

  // Evaluation Rubric Data
  evaluationCriteria: EvaluationCriterion[];
  memberEvaluations: MemberEvaluationRecord[];
  criteriaProposals: CriteriaProposal[];
  saveMemberEvaluation: (record: MemberEvaluationRecord) => void;
  updateEvaluationCriteria: (criteria: EvaluationCriterion[], note?: string) => { status: 'applied' | 'proposed' };
  reviewCriteriaProposal: (proposalId: string, status: 'approved' | 'rejected', reviewNote?: string) => void;

  // Actions
  updateMendanVisibility: (mendanId: string, visibilityType: MendanVisibilityType, allowedViewerIds: string[]) => void;
  updateMendanStatus: (mendanId: string, status: MendanStatus) => void;
  bulkApplyImportedKpis: (
    rows: KpiImportRow[],
    filename: string,
    periodLabel: string
  ) => Promise<{ successCount: number; errorCount: number }>;
  exportCurrentKpis: () => void;
  downloadSampleTemplate: () => void;
  createOrUpdateMendan: (record: Partial<MendanRecord> & { id?: string }) => void;
  submitAwardProposal: (proposal: Omit<AwardProposal, 'id' | 'created_at' | 'status'>) => void;
  reviewAwardProposal: (
    proposalId: string,
    status: ProposalStatus,
    feedback: string,
    visibilityType?: 'public' | 'private' | 'custom',
    allowedViewerIds?: string[],
    extra?: {
      rejection_reason?: string;
      revision_notes?: string;
    }
  ) => void;
  updateAwardVisibility: (
    proposalId: string,
    visibilityType: 'public' | 'private' | 'custom',
    allowedViewerIds?: string[]
  ) => void;
  bulkUpdateAwardVisibility: (
    proposalIds: string[],
    visibilityType: 'public' | 'private' | 'custom',
    allowedViewerIds?: string[]
  ) => void;
  bulkUpdateEvaluationAndMendanVisibility: (
    userIds: string[],
    isPublic: boolean,
    quarterId?: string
  ) => { updatedCount: number; skippedCount: number };
  toggleSingleEvaluationVisibility: (
    userId: string,
    quarterId?: string
  ) => void;
  toggleSingleMendanVisibility: (
    userId: string,
    quarterId?: string
  ) => void;
  togglePublishAwards: (quarterId: string, isPublished: boolean) => void;
  updateQuarterConfig: (config: QuarterConfig) => void;
  updateKpiThresholds: (thresholds: KpiThresholds) => void;
  updateKpiRecord: (record: KpiRecord) => void;
  updateUser: (user: User) => void;
  createUser: (user: Omit<User, 'id'>) => void;
  updateTeam: (team: Team) => void;
  createTeam: (team: Omit<Team, 'id'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetAllSystemData: () => void;
  triggerToast: (title: string, message: string) => void;
  toastAlert: { title: string; message: string } | null;
  clearToast: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [kpiRecords, setKpiRecords] = useState<KpiRecord[]>([]);
  const [mendanRecords, setMendanRecords] = useState<MendanRecord[]>([]);
  const [awardCategories, setAwardCategories] = useState<AwardCategory[]>([]);
  const [awardProposals, setAwardProposals] = useState<AwardProposal[]>([]);
  const [quarterConfigs, setQuarterConfigs] = useState<QuarterConfig[]>([]);
  const [kpiThresholds, setKpiThresholds] = useState<KpiThresholds>(storageService.getKpiThresholds());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('user-admin');

  // Evaluation Rubric Data
  const [evaluationCriteria, setEvaluationCriteria] = useState<EvaluationCriterion[]>([]);
  const [memberEvaluations, setMemberEvaluations] = useState<MemberEvaluationRecord[]>([]);
  const [criteriaProposals, setCriteriaProposals] = useState<CriteriaProposal[]>([]);

  // Navigation
  const [activeTab, setActiveTab] = useState<NavTab>('kpi'); // Default to 'Thành Tích' as shown in the screenshot

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [selectedQuarter, setSelectedQuarter] = useState<string | 'all'>('all');
  const [selectedTeamId, setSelectedTeamId] = useState<string | 'all'>('all');

  // Toast
  const [toastAlert, setToastAlert] = useState<{ title: string; message: string } | null>(null);

  const clearToast = () => setToastAlert(null);
  const triggerToast = (title: string, message: string) => {
    setToastAlert({ title, message });
    setTimeout(() => {
      setToastAlert((prev) => (prev?.title === title ? null : prev));
    }, 4500);
  };

  // Initial load
  useEffect(() => {
    setUsers(storageService.getUsers());
    setTeams(storageService.getTeams());
    setKpiRecords(storageService.getKpiRecords());
    setMendanRecords(storageService.getMendanRecords());
    setAwardCategories(storageService.getAwardCategories());
    setAwardProposals(storageService.getAwardProposals());
    setQuarterConfigs(storageService.getQuarterConfigs());
    setKpiThresholds(storageService.getKpiThresholds());
    setAuditLogs(storageService.getAuditLogs());
    setEvaluationCriteria(storageService.getEvaluationCriteria());
    setMemberEvaluations(storageService.getMemberEvaluations());
    setCriteriaProposals(storageService.getCriteriaProposals());
    const initialUid = storageService.getCurrentUserId();
    setCurrentUserId(initialUid);

    // Start notification poller
    notificationPoller.start();
    const unsubscribe = notificationPoller.subscribe((notifs, newAlert) => {
      setNotifications(notifs);
      if (newAlert) {
        triggerToast(newAlert.title, newAlert.message);
      }
    });

    return () => {
      unsubscribe();
      notificationPoller.stop();
    };
  }, []);

  const currentUser = useMemo(() => {
    return users.find((u) => u.id === currentUserId) || users[0] || storageService.getUsers()[0];
  }, [users, currentUserId]);

  const switchUser = (userId: string) => {
    setCurrentUserId(userId);
    storageService.setCurrentUserId(userId);
    notificationPoller.poll();
    const newUser = users.find((u) => u.id === userId);
    triggerToast(
      'Chuyển đổi tài khoản',
      `Đang hoạt động với vai trò: ${newUser?.full_name} (${newUser?.role.toUpperCase()})`
    );
  };

  const isMaster = currentUser?.role === 'master';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'master';
  const isLeaderOrAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'master' ||
    currentUser?.role === 'leader' ||
    currentUser?.role === 'subleader';
  const canCreateMendan = currentUser?.role === 'admin' || currentUser?.role === 'master';

  // Permission / ViewScope checking according to spec:
  // 'all': See entire department (default for Admin)
  // '2ka_all': See 2課 and all child teams (2課-A / 2課-B / 2課-S)
  // 'own_team': See only direct team
  // 'custom': See allowed_team_ids
  const canViewTeam = (teamId: string): boolean => {
    if (isAdmin || currentUser.view_scope === 'all') return true;

    if (currentUser.view_scope === '2ka_all') {
      const team2Ids = ['team-2', 'team-2a', 'team-2b', 'team-2s'];
      return team2Ids.includes(teamId);
    }

    if (currentUser.view_scope === 'own_team') {
      return currentUser.team_id === teamId;
    }

    if (currentUser.view_scope === 'custom') {
      return currentUser.allowed_team_ids.includes(teamId);
    }

    return currentUser.team_id === teamId;
  };

  const visibleTeams = useMemo(() => {
    return teams.filter((t) => canViewTeam(t.id));
  }, [teams, currentUser]);

  const visibleUsers = useMemo(() => {
    if (isAdmin || currentUser.view_scope === 'all') return users;
    return users.filter((u) => canViewTeam(u.team_id));
  }, [users, currentUser]);

  const visibleKpiRecords = useMemo(() => {
    let records = kpiRecords.filter((rec) => canViewTeam(rec.team_id));

    if (selectedTeamId !== 'all') {
      if (selectedTeamId === 'team-2') {
        // 2課 includes children 2a, 2b, 2s
        records = records.filter(
          (r) => r.team_id === 'team-2' || r.team_id === 'team-2a' || r.team_id === 'team-2b' || r.team_id === 'team-2s'
        );
      } else {
        records = records.filter((r) => r.team_id === selectedTeamId);
      }
    }

    if (selectedQuarter !== 'all') {
      records = records.filter((r) => r.quarter_id === selectedQuarter);
    }

    if (selectedMonth !== 'all') {
      records = records.filter((r) => r.month === selectedMonth);
    }

    return records;
  }, [kpiRecords, selectedTeamId, selectedQuarter, selectedMonth, currentUser]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  // Bulk Apply Imported KPI with Audit Log & Notifications (Module 2 & 6 & 7)
  const bulkApplyImportedKpis = async (
    rows: KpiImportRow[],
    filename: string,
    periodLabel: string
  ): Promise<{ successCount: number; errorCount: number }> => {
    const validRows = rows.filter((r) => r.status === 'valid');
    if (validRows.length === 0) {
      return { successCount: 0, errorCount: rows.length };
    }

    const updatedKpis = [...kpiRecords];
    const userByCode = new Map(users.map((u) => [u.employee_code.trim().toUpperCase(), u]));
    const notifiedUserIds = new Set<string>();

    validRows.forEach((row) => {
      const user = userByCode.get(row.employee_code.trim().toUpperCase());
      if (!user) return;

      notifiedUserIds.add(user.id);
      const existingIdx = updatedKpis.findIndex(
        (r) => r.user_id === user.id && (r.period_label.includes(row.period) || r.period_label === periodLabel)
      );

      const parsedMonth = parseInt(row.period.split('-')[1] || '3', 10) || 3;
      const parsedQuarter = row.period.includes('Q') ? row.period.split('-')[1] : 'Q1';

      const newRecord: KpiRecord = {
        id: existingIdx >= 0 ? updatedKpis[existingIdx].id : `kpi-import-${Date.now()}-${user.id}`,
        user_id: user.id,
        team_id: user.team_id,
        year: 2026,
        quarter_id: parsedQuarter || 'Q1',
        month: parsedMonth,
        period_label: periodLabel || `Kỳ ${row.period}`,
        target: row.target,
        achieved: row.achieved,
        unit: 'task',
        miss_count: row.miss_count,
        late_count: row.late_count,
        projects: [
          {
            id: `p-${Date.now()}`,
            name: `${row.project_count || 1} Đề án công việc kỳ ${row.period}`,
            description: row.notes || 'Cập nhật từ file nhập liệu Excel',
            role: 'Thành viên',
          },
        ],
        notes: row.notes || 'Nhập từ file Excel',
        evaluator_id: currentUser.id,
        updated_at: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        updatedKpis[existingIdx] = newRecord;
      } else {
        updatedKpis.push(newRecord);
      }
    });

    setKpiRecords(updatedKpis);
    storageService.saveKpiRecords(updatedKpis);

    // Save Audit Log
    const log = storageService.addAuditLog({
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      action: 'import_kpi',
      details: `Nhập KPI thành công cho ${validRows.length} nhân sự từ file ${filename}`,
      file_name: filename,
      records_count: validRows.length,
    });
    setAuditLogs((prev) => [log, ...prev]);

    // Send notification to affected users
    notifiedUserIds.forEach((uid) => {
      notificationPoller.notifyNewItem({
        user_id: uid,
        title: 'KPI cá nhân vừa được cập nhật',
        message: `Chỉ số KPI kỳ ${periodLabel} đã được quản lý cập nhật từ hệ thống.`,
        type: 'kpi_updated',
        link_module: 'kpi',
      });
    });

    triggerToast(
      'Nhập KPI Thành Công',
      `Đã cập nhật ${validRows.length} bản ghi vào hệ thống từ ${filename}.`
    );

    return {
      successCount: validRows.length,
      errorCount: rows.length - validRows.length,
    };
  };

  const exportCurrentKpis = () => {
    excelService.exportKpiToExcel(
      visibleKpiRecords,
      users,
      teams,
      `DYM_ThanhTich_KPI_${selectedMonth !== 'all' ? `T${selectedMonth}` : 'TatCa'}`
    );
    const log = storageService.addAuditLog({
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      action: 'export_kpi',
      details: `Xuất file Excel cho ${visibleKpiRecords.length} bản ghi`,
      records_count: visibleKpiRecords.length,
    });
    setAuditLogs((prev) => [log, ...prev]);
    triggerToast('Xuất File Excel', 'File KPI .xlsx đã được tạo và tải xuống thành công.');
  };

  const downloadSampleTemplate = () => {
    excelService.downloadSampleImportTemplate(users, teams);
    triggerToast('Tải Mẫu Excel', 'Đã tải xuống file Mau_Nhap_KPI_DYM.xlsx.');
  };

  const createOrUpdateMendan = (record: Partial<MendanRecord> & { id?: string }) => {
    const list = [...mendanRecords];
    const isNew = !record.id || record.id.startsWith('temp-');
    const now = new Date().toISOString();

    if (isNew) {
      const newMendan: MendanRecord = {
        id: `mendan-${Date.now()}`,
        user_id: record.user_id || users[0].id,
        evaluator_id: record.evaluator_id || currentUser.id,
        team_id: record.team_id || currentUser.team_id,
        quarter_id: record.quarter_id ?? 'Q1',
        evaluation_type: record.evaluation_type || 'quarterly',
        scheduled_date: record.scheduled_date || now.slice(0, 10),
        actual_date: record.actual_date,
        status: record.status || 'not_started',
        
        leader_evaluator_id: record.leader_evaluator_id,
        leader_evaluated_at: record.leader_evaluated_at,
        leader_good_points: record.leader_good_points || '',
        leader_improvements: record.leader_improvements || '',
        leader_risks: record.leader_risks || '',
        leader_other: record.leader_other || '',

        manager_evaluator_id: record.manager_evaluator_id,
        content_format: record.content_format || 'standard_3',
        single_note: record.single_note || '',
        good_points: record.good_points || '',
        improvements: record.improvements || '',
        next_goals: record.next_goals || '',
        pre_notes: record.pre_notes || '',
        memo: record.memo || '',
        visibility_scope: record.visibility_scope || 'member_and_leader',
        created_at: now,
        updated_at: now,
      };
      list.unshift(newMendan);
      setMendanRecords(list);
      storageService.saveMendanRecords(list);

      if (record.status === 'pre_mendan') {
        triggerToast('Nộp Đánh Giá Cho Manager', 'Đã lưu thông tin đánh giá sơ bộ và chuyển cho Manager.');
      } else if (record.status === 'completed') {
        triggerToast('Hoàn Thành Mendan', 'Đã lưu biên bản trao đổi Mendan thành công.');
      } else {
        triggerToast('Lưu Bản Nháp', 'Đã lưu bản nháp thông tin Mendan.');
      }
    } else {
      const idx = list.findIndex((m) => m.id === record.id);
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          ...record,
          updated_at: now,
        };
        setMendanRecords(list);
        storageService.saveMendanRecords(list);

        if (record.status === 'pre_mendan') {
          triggerToast('Nộp Đánh Giá Cho Manager', 'Đã cập nhật và nộp đánh giá cho Manager.');
        } else if (record.status === 'completed') {
          triggerToast('Hoàn Thành Mendan', 'Đã lưu biên bản trao đổi Mendan thành công.');
        } else {
          triggerToast('Cập Nhật Mendan', 'Đã cập nhật thông tin đánh giá Mendan.');
        }
      }
    }
  };

  const submitAwardProposal = (proposal: Omit<AwardProposal, 'id' | 'created_at' | 'status'>) => {
    const list = [...awardProposals];
    const newProposal: AwardProposal = {
      ...proposal,
      id: `prop-${Date.now()}`,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    list.unshift(newProposal);
    setAwardProposals(list);
    storageService.saveAwardProposals(list);

    // Notify admins
    notificationPoller.notifyNewItem({
      user_id: 'user-admin',
      title: 'Đề xuất khen thưởng mới cần duyệt',
      message: `${currentUser.full_name} đã đề xuất giải thưởng cho nhân sự trong kỳ.`,
      type: 'award_result',
      link_module: 'awards',
    });
    triggerToast('Đã Gửi Đề Xuất', 'Đề xuất khen thưởng đang chờ Admin phê duyệt.');
  };

  const reviewAwardProposal = (
    proposalId: string,
    status: ProposalStatus,
    feedback: string,
    visibilityType: 'public' | 'private' | 'custom' = 'public',
    allowedViewerIds: string[] = [],
    extra?: {
      rejection_reason?: string;
      revision_notes?: string;
    }
  ) => {
    const list = [...awardProposals];
    const idx = list.findIndex((p) => p.id === proposalId);
    if (idx >= 0) {
      list[idx].status = status;
      list[idx].feedback = feedback;
      if (extra?.rejection_reason !== undefined) {
        list[idx].rejection_reason = extra.rejection_reason;
      }
      if (extra?.revision_notes !== undefined) {
        list[idx].revision_notes = extra.revision_notes;
      }
      if (status === 'approved') {
        list[idx].visibility_type = visibilityType;
        list[idx].allowed_viewer_ids = allowedViewerIds;
        list[idx].is_published = visibilityType !== 'private';
      } else {
        list[idx].is_published = false;
      }
      list[idx].reviewed_at = new Date().toISOString();
      list[idx].reviewed_by = currentUser.id;
      setAwardProposals(list);
      storageService.saveAwardProposals(list);

      // Audit log
      const log = storageService.addAuditLog({
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        action:
          status === 'approved'
            ? 'approve_award'
            : status === 'rejected'
            ? 'reject_award'
            : 'revision_award',
        details: `${
          status === 'approved'
            ? 'Duyệt'
            : status === 'rejected'
            ? 'Từ chối'
            : 'Yêu cầu xem xét lại'
        } đề xuất khen thưởng ID: ${proposalId}`,
      });
      setAuditLogs((prev) => [log, ...prev]);

      // Notify the proposer
      const statusTitle =
        status === 'approved'
          ? 'duyệt'
          : status === 'rejected'
          ? 'từ chối'
          : 'yêu cầu xem xét lại';
      notificationPoller.notifyNewItem({
        user_id: list[idx].proposed_by,
        title: `Đề xuất khen thưởng đã được ${statusTitle}`,
        message:
          extra?.revision_notes ||
          extra?.rejection_reason ||
          feedback ||
          (status === 'approved'
            ? 'Chúc mừng! Đề xuất đã được thông qua.'
            : status === 'rejected'
            ? 'Đề xuất chưa đạt tiêu chuẩn kỳ này.'
            : 'Vui lòng bổ sung hoặc chỉnh sửa thông tin đề xuất.'),
        type: 'award_result',
        link_module: 'awards',
      });

      const modeText =
        status === 'approved'
          ? ` (${visibilityType === 'public' ? 'Công Khai' : visibilityType === 'private' ? 'Không Công Khai' : 'Tùy chọn đối tượng'})`
          : '';
      const statusLabel =
        status === 'approved'
          ? 'ĐÃ DUYỆT'
          : status === 'rejected'
          ? 'ĐÃ TỪ CHỐI'
          : status === 'revision_requested'
          ? 'ĐÃ YÊU CẦU XEM XÉT LẠI'
          : 'CHỜ DUYỆT';
      triggerToast('Đã Cập Nhật Đề Xuất', `Trạng thái: ${statusLabel}${modeText}`);
    }
  };

  const updateAwardVisibility = (
    proposalId: string,
    visibilityType: 'public' | 'private' | 'custom',
    allowedViewerIds: string[] = []
  ) => {
    const list = [...awardProposals];
    const idx = list.findIndex((p) => p.id === proposalId);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        visibility_type: visibilityType,
        allowed_viewer_ids: allowedViewerIds,
        is_published: visibilityType !== 'private',
      };
      setAwardProposals(list);
      storageService.saveAwardProposals(list);

      const labelMap = {
        public: 'Công Khai (Tất cả mọi người cùng thấy)',
        private: 'Không Công Khai (Chỉ Master và Admin)',
        custom: `Tùy chọn đối tượng (${allowedViewerIds.length} người được xem)`,
      };
      triggerToast('Cập Nhật Chế Độ Hiển Thị', `Đã chuyển sang: ${labelMap[visibilityType]}`);
    }
  };

  const bulkUpdateAwardVisibility = (
    proposalIds: string[],
    visibilityType: 'public' | 'private' | 'custom',
    allowedViewerIds: string[] = []
  ) => {
    const list = [...awardProposals];
    let count = 0;
    proposalIds.forEach((pid) => {
      const idx = list.findIndex((p) => p.id === pid);
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          visibility_type: visibilityType,
          allowed_viewer_ids: allowedViewerIds,
          is_published: visibilityType !== 'private',
        };
        count++;
      }
    });
    setAwardProposals(list);
    storageService.saveAwardProposals(list);

    const labelMap = {
      public: 'Công Khai (Tất cả mọi người)',
      private: 'Không Công Khai (Chỉ Master & Admin)',
      custom: `Tùy chọn đối tượng (${allowedViewerIds.length} người xem)`,
    };
    triggerToast('Cập Nhật Chế Độ Hiển Thị', `Đã cập nhật ${count} giải thưởng sang: ${labelMap[visibilityType]}`);
  };

  const bulkUpdateEvaluationAndMendanVisibility = (
    userIds: string[],
    isPublic: boolean,
    quarterId = 'Q1'
  ) => {
    let updatedCount = 0;
    let skippedCount = 0;

    // Filter which users current user can edit:
    // Master can edit anyone in any team
    // Admin can edit members belonging to Admin's own team (or teams Admin manages)
    const allowedUserIds = userIds.filter((uid) => {
      if (isMaster) return true;
      if (isAdmin) {
        const u = users.find((x) => x.id === uid);
        return u && (u.team_id === currentUser.team_id || canViewTeam(u.team_id));
      }
      return false;
    });

    skippedCount = userIds.length - allowedUserIds.length;

    if (allowedUserIds.length === 0) {
      triggerToast(
        'Không có quyền thay đổi',
        'Chỉ có quyền thay đổi chế độ hiển thị cho nhân sự thuộc team quản lý.'
      );
      return { updatedCount: 0, skippedCount };
    }

    // 1. Update member evaluations
    const evals = [...memberEvaluations];
    allowedUserIds.forEach((uid) => {
      const idx = evals.findIndex((e) => e.user_id === uid && e.quarter_id === quarterId);
      if (idx >= 0) {
        evals[idx] = {
          ...evals[idx],
          is_public: isPublic,
          updated_at: new Date().toISOString(),
        };
      } else {
        const u = users.find((x) => x.id === uid);
        evals.unshift({
          id: `eval-${uid}-${quarterId}`,
          user_id: uid,
          evaluator_id: currentUser.id,
          team_id: u?.team_id || currentUser.team_id,
          quarter_id: quarterId,
          year: 2026,
          scores: {},
          total_score: 0,
          rank_grade: u?.rank ? (u.rank.startsWith('A') ? 'A' : u.rank.startsWith('B') ? 'B' : u.rank.startsWith('S') ? 'S' : 'C') : 'B',
          status: 'draft',
          is_public: isPublic,
          updated_at: new Date().toISOString(),
        });
      }
    });
    setMemberEvaluations(evals);
    storageService.saveMemberEvaluations(evals);

    // 2. Update mendan records
    const mendans = [...mendanRecords];
    allowedUserIds.forEach((uid) => {
      const idx = mendans.findIndex((m) => m.user_id === uid && (m.quarter_id === quarterId || !m.quarter_id));
      if (idx >= 0) {
        mendans[idx] = {
          ...mendans[idx],
          visibility_type: isPublic ? 'public' : 'private',
          updated_at: new Date().toISOString(),
        };
      }
    });
    setMendanRecords(mendans);
    storageService.saveMendanRecords(mendans);

    updatedCount = allowedUserIds.length;
    const modeLabel = isPublic ? 'Công Khai (Cá nhân, Admin & Master)' : 'Không Công Khai (Chỉ Admin & Master)';
    triggerToast(
      'Cập Nhật Hiển Thị Hàng Loạt',
      `Đã chuyển ${updatedCount} nhân sự sang: ${modeLabel}${skippedCount > 0 ? ` (Bỏ qua ${skippedCount} nhân sự do khác team).` : '.'}`
    );

    return { updatedCount, skippedCount };
  };

  const toggleSingleEvaluationVisibility = (userId: string, quarterId = 'Q1') => {
    // Check permission
    const targetUser = users.find((u) => u.id === userId);
    if (!isMaster) {
      if (!isAdmin || !targetUser || (targetUser.team_id !== currentUser.team_id && !canViewTeam(targetUser.team_id))) {
        triggerToast('Không có quyền', 'Chỉ Master hoặc Admin của team này mới có thể thay đổi chế độ hiển thị.');
        return;
      }
    }

    const evals = [...memberEvaluations];
    const idx = evals.findIndex((e) => e.user_id === userId && e.quarter_id === quarterId);
    let newIsPublic = true;
    if (idx >= 0) {
      newIsPublic = !evals[idx].is_public;
      evals[idx] = {
        ...evals[idx],
        is_public: newIsPublic,
        updated_at: new Date().toISOString(),
      };
    } else {
      evals.unshift({
        id: `eval-${userId}-${quarterId}`,
        user_id: userId,
        evaluator_id: currentUser.id,
        team_id: targetUser?.team_id || currentUser.team_id,
        quarter_id: quarterId,
        year: 2026,
        scores: {},
        total_score: 0,
        status: 'draft',
        is_public: false, // toggled from true to false
        updated_at: new Date().toISOString(),
      });
      newIsPublic = false;
    }
    setMemberEvaluations(evals);
    storageService.saveMemberEvaluations(evals);

    triggerToast(
      'Chế Độ Hiển Thị Đánh Giá',
      `Đã chuyển sang: ${newIsPublic ? 'Công Khai (Cá nhân, Admin & Master)' : 'Không Công Khai (Chỉ Admin & Master)'}`
    );
  };

  const toggleSingleMendanVisibility = (userId: string, quarterId = 'Q1') => {
    const targetUser = users.find((u) => u.id === userId);
    if (!isMaster) {
      if (!isAdmin || !targetUser || (targetUser.team_id !== currentUser.team_id && !canViewTeam(targetUser.team_id))) {
        triggerToast('Không có quyền', 'Chỉ Master hoặc Admin của team này mới có thể thay đổi chế độ hiển thị.');
        return;
      }
    }

    const mendans = [...mendanRecords];
    const idx = mendans.findIndex((m) => m.user_id === userId && (m.quarter_id === quarterId || !m.quarter_id));
    let newType: MendanVisibilityType = 'public';
    if (idx >= 0) {
      newType = mendans[idx].visibility_type === 'public' ? 'private' : 'public';
      mendans[idx] = {
        ...mendans[idx],
        visibility_type: newType,
        updated_at: new Date().toISOString(),
      };
    }
    setMendanRecords(mendans);
    storageService.saveMendanRecords(mendans);

    triggerToast(
      'Chế Độ Hiển Thị Biên Bản Mendan',
      `Đã chuyển sang: ${newType === 'public' ? 'Công Khai (Cá nhân, Admin & Master)' : 'Không Công Khai (Chỉ Admin & Master)'}`
    );
  };

  const togglePublishAwards = (quarterId: string, isPublished: boolean) => {
    const quarters = [...quarterConfigs];
    const qIdx = quarters.findIndex((q) => q.id === quarterId);
    if (qIdx >= 0) {
      quarters[qIdx].is_published_awards = isPublished;
      setQuarterConfigs(quarters);
      storageService.saveQuarterConfigs(quarters);

      // Update proposals in this quarter
      const updatedProps = awardProposals.map((p) => {
        if (p.quarter_id === quarterId) {
          return { ...p, is_published: isPublished };
        }
        return p;
      });
      setAwardProposals(updatedProps);
      storageService.saveAwardProposals(updatedProps);

      if (isPublished) {
        notificationPoller.notifyNewItem({
          user_id: 'all',
          title: `Bảng Vàng ${quarterId} đã chính thức xuất bản!`,
          message: `Kính mời toàn thể nhân sự bộ phận xem danh sách vinh danh các cá nhân xuất sắc.`,
          type: 'award_result',
          link_module: 'awards',
        });
      }

      triggerToast(
        isPublished ? 'Đã Xuất Bản Bảng Vàng' : 'Đã Đóng Bảng Vàng',
        `Trạng thái công khai Quý ${quarterId}: ${isPublished ? 'Công Khai Toàn Bộ Phận' : 'Ẩn (Chỉ Nội Bộ Leader/Admin)'}`
      );
    }
  };

  const updateQuarterConfig = (config: QuarterConfig) => {
    const list = quarterConfigs.map((q) => (q.id === config.id ? config : q));
    setQuarterConfigs(list);
    storageService.saveQuarterConfigs(list);
    triggerToast('Cập Nhật Quý', `Cấu hình ${config.name} đã được lưu.`);
  };

  const updateKpiThresholds = (thresholds: KpiThresholds) => {
    setKpiThresholds(thresholds);
    storageService.saveKpiThresholds(thresholds);
    triggerToast('Cập Nhật Ngưỡng KPI', 'Ngưỡng đánh giá % đã được điều chỉnh.');
  };

  const updateKpiRecord = (record: KpiRecord) => {
    const list = kpiRecords.map((k) => (k.id === record.id ? record : k));
    setKpiRecords(list);
    storageService.saveKpiRecords(list);
    triggerToast('Cập Nhật Đề Án & KPI', `Đã cập nhật danh sách đề án kỳ ${record.period_label}.`);
  };

  const updateUser = (user: User) => {
    const list = users.map((u) => (u.id === user.id ? user : u));
    setUsers(list);
    storageService.saveUsers(list);
    triggerToast('Cập Nhật Nhân Sự', `Đã lưu thông tin ${user.full_name}.`);
  };

  const createUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
    };
    const list = [...users, newUser];
    setUsers(list);
    storageService.saveUsers(list);
    triggerToast('Thêm Nhân Sự Mới', `Đã tạo tài khoản cho ${newUser.full_name}.`);
  };

  const updateTeam = (team: Team) => {
    const list = teams.map((t) => (t.id === team.id ? team : t));
    setTeams(list);
    storageService.saveTeams(list);
    triggerToast('Cập Nhật Team', `Đã lưu thông tin ${team.name}.`);
  };

  const createTeam = (teamData: Omit<Team, 'id'>) => {
    const newTeam: Team = {
      ...teamData,
      id: `team-${Date.now()}`,
    };
    const list = [...teams, newTeam];
    setTeams(list);
    storageService.saveTeams(list);
    triggerToast('Tạo Team Mới', `Đã tạo ${newTeam.name}.`);
  };

  const markNotificationRead = (id: string) => {
    const list = notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n));
    setNotifications(list);
    storageService.saveNotifications(list);
  };

  const markAllNotificationsRead = () => {
    const list = notifications.map((n) => ({ ...n, is_read: true }));
    setNotifications(list);
    storageService.saveNotifications(list);
  };

  const saveMemberEvaluation = (record: MemberEvaluationRecord) => {
    const list = [...memberEvaluations];
    const idx = list.findIndex(
      (e) => e.user_id === record.user_id && e.quarter_id === record.quarter_id
    );
    const now = new Date().toISOString();
    const newRecord = { ...record, updated_at: now };
    if (idx >= 0) {
      list[idx] = newRecord;
    } else {
      list.unshift(newRecord);
    }
    setMemberEvaluations(list);
    storageService.saveMemberEvaluations(list);
    triggerToast(
      'Đã Lưu Đánh Giá Điểm',
      `Đã lưu kết quả đánh giá năng lực (${record.total_score}/100 điểm).`
    );
  };

  const updateEvaluationCriteria = (
    criteria: EvaluationCriterion[],
    note?: string
  ): { status: 'applied' | 'proposed' } => {
    if (isMaster) {
      setEvaluationCriteria(criteria);
      storageService.saveEvaluationCriteria(criteria);
      triggerToast('Đã Cập Nhật Tiêu Chuẩn', 'Master đã trực tiếp lưu cấu hình bảng tiêu chuẩn & thang điểm.');
      return { status: 'applied' };
    }

    // Admin creates a proposal that requires Master approval
    const proposal: CriteriaProposal = {
      id: `prop-crit-${Date.now()}`,
      proposed_by: currentUser.id,
      proposed_by_name: currentUser.full_name,
      created_at: new Date().toISOString(),
      status: 'pending',
      review_note: note,
      criteria,
    };
    const list = [proposal, ...criteriaProposals];
    setCriteriaProposals(list);
    storageService.saveCriteriaProposals(list);

    notificationPoller.notifyNewItem({
      user_id: 'user-master',
      title: 'Đề xuất thay đổi tiêu chuẩn đánh giá',
      message: `${currentUser.full_name} (Admin) vừa gửi đề xuất điều chỉnh bảng tiêu chuẩn & thang điểm cần Master duyệt.`,
      type: 'kpi_updated',
      link_module: 'mendan',
    });

    triggerToast('Đã Gửi Đề Xuất Cho Master', 'Chỉnh sửa của Admin đã được chuyển đến Master để duyệt trước khi áp dụng.');
    return { status: 'proposed' };
  };

  const reviewCriteriaProposal = (
    proposalId: string,
    status: 'approved' | 'rejected',
    reviewNote?: string
  ) => {
    if (!isMaster) {
      triggerToast('Từ Chối Quyền', 'Chỉ tài khoản Master mới có quyền phê duyệt đề xuất tiêu chuẩn.');
      return;
    }
    const list = [...criteriaProposals];
    const idx = list.findIndex((p) => p.id === proposalId);
    if (idx < 0) return;

    list[idx] = {
      ...list[idx],
      status,
      reviewed_by: currentUser.id,
      reviewed_at: new Date().toISOString(),
      review_note: reviewNote,
    };
    setCriteriaProposals(list);
    storageService.saveCriteriaProposals(list);

    if (status === 'approved') {
      setEvaluationCriteria(list[idx].criteria);
      storageService.saveEvaluationCriteria(list[idx].criteria);
      triggerToast('Phê Duyệt Thành Công', 'Master đã duyệt áp dụng bảng tiêu chuẩn đánh giá mới.');
    } else {
      triggerToast('Đã Từ Chối Đề Xuất', 'Master đã từ chối áp dụng đề xuất chỉnh sửa tiêu chuẩn.');
    }

    notificationPoller.notifyNewItem({
      user_id: list[idx].proposed_by,
      title: status === 'approved' ? 'Đề xuất tiêu chuẩn đã được duyệt' : 'Đề xuất tiêu chuẩn bị từ chối',
      message: `Master đã ${status === 'approved' ? 'phê duyệt' : 'từ chối'} đề xuất thay đổi bảng tiêu chuẩn đánh giá của Admin.`,
      type: 'kpi_updated',
      link_module: 'mendan',
    });
  };

  const updateMendanVisibility = (
    mendanId: string,
    visibilityType: MendanVisibilityType,
    allowedViewerIds: string[]
  ) => {
    const list = [...mendanRecords];
    const idx = list.findIndex((m) => m.id === mendanId);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        visibility_type: visibilityType,
        allowed_viewer_ids: allowedViewerIds,
        visibility_scope: visibilityType === 'public' ? 'member_and_leader' : 'manager_only',
        updated_at: new Date().toISOString(),
      };
      setMendanRecords(list);
      storageService.saveMendanRecords(list);
      triggerToast(
        'Cập Nhật Quyền Xem',
        visibilityType === 'public'
          ? `Đã cài đặt Công Khai (Nhân sự được đánh giá + Người đánh giá + ${allowedViewerIds.length} thành viên khác).`
          : 'Đã cài đặt Không Công Khai (Chỉ người đánh giá).'
      );
    }
  };

  const updateMendanStatus = (mendanId: string, status: MendanStatus) => {
    const list = [...mendanRecords];
    const idx = list.findIndex((m) => m.id === mendanId);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        status,
        updated_at: new Date().toISOString(),
      };
      setMendanRecords(list);
      storageService.saveMendanRecords(list);
      triggerToast(
        'Đổi Trạng Thái',
        `Đã chuyển trạng thái Mendan sang: ${status === 'completed' ? 'Hoàn thành mendan' : status === 'pre_mendan' ? 'Đã đánh giá' : 'Chưa đánh giá'}`
      );
    }
  };

  const resetAllSystemData = () => {
    storageService.resetAllData();
    window.location.reload();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        switchUser,
        users,
        teams,
        kpiRecords,
        mendanRecords,
        awardCategories,
        awardProposals,
        quarterConfigs,
        kpiThresholds,
        auditLogs,
        notifications,
        unreadCount,

        activeTab,
        setActiveTab,

        selectedMonth,
        setSelectedMonth,
        selectedQuarter,
        setSelectedQuarter,
        selectedTeamId,
        setSelectedTeamId,

        isAdmin,
        isMaster,
        isLeaderOrAdmin,
        canCreateMendan,
        canViewTeam,
        visibleTeams,
        visibleUsers,
        visibleKpiRecords,

        evaluationCriteria,
        memberEvaluations,
        criteriaProposals,
        saveMemberEvaluation,
        updateEvaluationCriteria,
        reviewCriteriaProposal,
        updateMendanVisibility,
        updateMendanStatus,

        bulkApplyImportedKpis,
        exportCurrentKpis,
        downloadSampleTemplate,
        createOrUpdateMendan,
        submitAwardProposal,
        reviewAwardProposal,
        updateAwardVisibility,
        bulkUpdateAwardVisibility,
        bulkUpdateEvaluationAndMendanVisibility,
        toggleSingleEvaluationVisibility,
        toggleSingleMendanVisibility,
        togglePublishAwards,
        updateQuarterConfig,
        updateKpiThresholds,
        updateKpiRecord,
        updateUser,
        createUser,
        updateTeam,
        createTeam,
        markNotificationRead,
        markAllNotificationsRead,
        resetAllSystemData,
        triggerToast,
        toastAlert,
        clearToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
