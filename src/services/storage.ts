import * as XLSX from 'xlsx';
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
  NOTIFICATIONS: 'dym_notifications_v2',
  NOTIFICATION_PREFS: 'dym_notification_prefs_v2',
  QUARTER_CONFIGS: 'dym_quarter_configs_v2',
  KPI_THRESHOLDS: 'dym_kpi_thresholds_v2',
  AUDIT_LOGS: 'dym_audit_logs_v2',
  CURRENT_USER_ID: 'dym_current_user_id_v2',
  EVALUATION_CRITERIA: 'dym_eval_criteria_v1',
  MEMBER_EVALUATIONS: 'dym_member_evals_v1',
  CRITERIA_PROPOSALS: 'dym_criteria_proposals_v1',
};

// Initial Seed Data matching spec & PDF
export const INITIAL_TEAMS: Team[] = [
  {
    id: 'team-1',
    name: '1課',
    code: '1ka',
    parent_team_id: null,
    leader_ids: ['user-yamamoto'],
    subleader_ids: ['user-nguyen-van-a'],
    description: 'Xử lý hồ sơ sự vụ nghiệp vụ khối 1',
    order: 1,
  },
  {
    id: 'team-2',
    name: '2課',
    code: '2ka',
    parent_team_id: null,
    leader_ids: ['user-sato'],
    subleader_ids: ['user-tran-thi-b'],
    description: 'Bộ phận quản lý vận hành chính (A / B / S)',
    order: 2,
  },
  {
    id: 'team-2a',
    name: '2課-A',
    code: '2ka-A',
    parent_team_id: 'team-2',
    leader_ids: ['user-sato'],
    subleader_ids: ['user-tran-thi-b'],
    description: 'Xử lý dữ liệu và giấy tờ định kỳ',
    order: 3,
  },
  {
    id: 'team-2b',
    name: '2課-B',
    code: '2ka-B',
    parent_team_id: 'team-2',
    leader_ids: ['user-sato'],
    subleader_ids: ['user-le-van-c'],
    description: 'Đối soát chứng từ và báo cáo tài chính',
    order: 4,
  },
  {
    id: 'team-2s',
    name: '2課-S',
    code: '2ka-S',
    parent_team_id: 'team-2',
    leader_ids: ['user-sato'],
    subleader_ids: ['user-pham-thi-d'],
    description: 'Xử lý case đặc biệt và hỗ trợ khách hàng',
    order: 5,
  },
  {
    id: 'team-3',
    name: '3課',
    code: '3ka',
    parent_team_id: null,
    leader_ids: ['user-tanaka'],
    subleader_ids: ['user-hoang-van-e'],
    description: 'Quy trình kiểm soát chất lượng & dịch thuật nghiệp vụ',
    order: 6,
  },
  {
    id: 'team-gs',
    name: 'GS',
    code: 'GS',
    parent_team_id: null,
    leader_ids: ['user-suzuki'],
    subleader_ids: ['user-vu-thi-f'],
    description: 'Hỗ trợ hành chính, nhân sự, IT & hệ thống tổng vụ',
    order: 7,
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-master',
    employee_code: 'DYM-000',
    full_name: 'Mizutani Yuta',
    email: 'mizutani.y@dym.jp',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    rank: 'A1',
    japanese_level: 'Bản ngữ',
    role: 'master',
    view_scope: 'all',
    allowed_team_ids: [],
    team_id: 'team-gs',
    is_active: true,
    position: 'Tổng Quản Lý Tập Đoàn & Đại Diện Ban Giám Đốc (Master)',
  },
  {
    id: 'user-admin',
    employee_code: 'DYM-001',
    full_name: 'Phạm Tiến Đạt',
    email: 'dat-p@dymvietnam.net',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rank: 'A1',
    japanese_level: 'N1',
    role: 'admin',
    view_scope: 'all',
    allowed_team_ids: [],
    team_id: 'team-gs',
    is_active: true,
    position: 'Giám Đốc Vận Hành & Quản Trị Hệ Thống',
  },
  {
    id: 'user-sato',
    employee_code: 'DYM-002',
    full_name: 'Sato Kenji',
    email: 'sato.k@dymvietnam.net',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rank: 'A2',
    japanese_level: 'Bản ngữ',
    role: 'leader',
    view_scope: '2ka_all',
    allowed_team_ids: ['team-2', 'team-2a', 'team-2b', 'team-2s'],
    team_id: 'team-2',
    is_active: true,
    position: 'Trưởng bộ phận 2課',
  },
  {
    id: 'user-yamamoto',
    employee_code: 'DYM-003',
    full_name: 'Yamamoto Hiroshi',
    email: 'yamamoto.h@dymvietnam.net',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    rank: 'A3',
    japanese_level: 'Bản ngữ',
    role: 'leader',
    view_scope: 'own_team',
    allowed_team_ids: ['team-1'],
    team_id: 'team-1',
    is_active: true,
    position: 'Trưởng bộ phận 1課',
  },
  {
    id: 'user-tanaka',
    employee_code: 'DYM-004',
    full_name: 'Tanaka Yuka',
    email: 'tanaka.y@dymvietnam.net',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    rank: 'A3',
    japanese_level: 'Bản ngữ',
    role: 'leader',
    view_scope: 'own_team',
    allowed_team_ids: ['team-3'],
    team_id: 'team-3',
    is_active: true,
    position: 'Trưởng bộ phận 3課',
  },
  {
    id: 'user-suzuki',
    employee_code: 'DYM-005',
    full_name: 'Suzuki Daiki',
    email: 'suzuki.d@dymvietnam.net',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    rank: 'B1',
    japanese_level: 'Bản ngữ',
    role: 'leader',
    view_scope: 'own_team',
    allowed_team_ids: ['team-gs'],
    team_id: 'team-gs',
    is_active: true,
    position: 'Trưởng nhóm GS',
  },
  {
    id: 'user-tran-thi-b',
    employee_code: 'DYM-012',
    full_name: 'Trần Thị Bích',
    email: 'bich.tt@dymvietnam.net',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    rank: 'B2',
    japanese_level: 'N2',
    role: 'subleader',
    view_scope: 'own_team',
    allowed_team_ids: ['team-2a'],
    team_id: 'team-2a',
    is_active: true,
    position: 'Phó nhóm 2課-A',
  },
  {
    id: 'user-nguyen-van-a',
    employee_code: 'DYM-011',
    full_name: 'Nguyễn Văn An',
    email: 'an.nv@dymvietnam.net',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    rank: 'B3',
    japanese_level: 'N2',
    role: 'subleader',
    view_scope: 'own_team',
    allowed_team_ids: ['team-1'],
    team_id: 'team-1',
    is_active: true,
    position: 'Chuyên viên xử lý nghiệp vụ 1課',
  },
  {
    id: 'user-le-van-c',
    employee_code: 'DYM-013',
    full_name: 'Lê Văn Cường',
    email: 'cuong.lv@dymvietnam.net',
    avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    rank: 'C2',
    japanese_level: 'N3',
    role: 'member',
    view_scope: 'own_team',
    allowed_team_ids: ['team-2b'],
    team_id: 'team-2b',
    is_active: true,
    position: 'Nhân viên kiểm toán đối soát',
  },
  {
    id: 'user-pham-thi-d',
    employee_code: 'DYM-014',
    full_name: 'Phạm Thị Dung',
    email: 'dung.pt@dymvietnam.net',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    rank: 'C1',
    japanese_level: 'N1',
    role: 'member',
    view_scope: 'own_team',
    allowed_team_ids: ['team-2s'],
    team_id: 'team-2s',
    is_active: true,
    position: 'Chuyên viên hồ sơ VIP',
  },
  {
    id: 'user-hoang-van-e',
    employee_code: 'DYM-015',
    full_name: 'Hoàng Văn Em',
    email: 'em.hv@dymvietnam.net',
    avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    rank: 'C3',
    japanese_level: 'N2',
    role: 'member',
    view_scope: 'own_team',
    allowed_team_ids: ['team-3'],
    team_id: 'team-3',
    is_active: true,
    position: 'Biên dịch viên kiểm chuẩn',
  },
  {
    id: 'user-vu-thi-f',
    employee_code: 'DYM-016',
    full_name: 'Vũ Thị Phương',
    email: 'phuong.vt@dymvietnam.net',
    avatar_url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
    rank: 'D1',
    japanese_level: 'N3',
    role: 'member',
    view_scope: 'own_team',
    allowed_team_ids: ['team-gs'],
    team_id: 'team-gs',
    is_active: true,
    position: 'Chuyên viên nhân sự & hỗ trợ',
  },
];

// Seed KPI records matching the PDF exact overview:
// Total target: 4.332, achieved: 4.512 (104.2%), miss: 8, late: 5
// 1課: target 220, achieved 224, miss 1, late 1
// 2課 (2a+2b+2s): target 2.982, achieved 3.097, miss 5, late 1
// 3課: target 635, achieved 672, miss 0, late 1
// GS: target 495, achieved 519, miss 2, late 2
export const INITIAL_KPIS: KpiRecord[] = [
  // 1課: Target 220, Achieved 224 -> 101.8% (>100% Vượt chỉ tiêu - gradient xanh đậm nhất)
  {
    id: 'kpi-2026-03-team1-1',
    user_id: 'user-nguyen-van-a',
    team_id: 'team-1',
    year: 2026,
    quarter_id: 'Q1',
    month: 3,
    period_label: 'Tháng 03/2026',
    target: 220,
    achieved: 224,
    unit: 'task',
    miss_count: 1,
    late_count: 1,
    projects: [
      { id: 'p1', name: 'Đề án số hoá hồ sơ đợt 1', description: 'Chuẩn hoá 120 hồ sơ bảo hiểm Tokyo', role: 'Chủ trì' },
      { id: 'p2', name: 'Rà soát chứng từ lưu trữ', description: 'Đảm bảo tuân thủ tiêu chuẩn ISO nội bộ', role: 'Tham gia' }
    ],
    notes: 'Tiến độ hoàn thành vượt kỳ vọng, cần chú ý double-check để tránh 1 lỗi định dạng ngày.',
    evaluator_id: 'user-yamamoto',
    updated_at: '2026-03-22T10:00:00Z',
  },
  // 2課 - A: Target 1100, Achieved 1145 -> 104.1% (>100% Vượt chỉ tiêu - gradient xanh đậm)
  {
    id: 'kpi-2026-03-team2a-1',
    user_id: 'user-tran-thi-b',
    team_id: 'team-2a',
    year: 2026,
    quarter_id: 'Q1',
    month: 3,
    period_label: 'Tháng 03/2026',
    target: 1100,
    achieved: 1145,
    unit: 'task',
    miss_count: 2,
    late_count: 0,
    projects: [
      { id: 'p3', name: 'Tự động hoá phân loại phiếu nhập', description: 'Viết công thức đối chiếu tự động rút ngắn 30% thời gian', role: 'Khởi xướng' }
    ],
    notes: 'Hiệu suất nhóm rất cao, hỗ trợ tốt cho các bạn mới.',
    evaluator_id: 'user-sato',
    updated_at: '2026-03-22T10:00:00Z',
  },
  // 2課 - B: Target 1050, Achieved 892 -> 85.0% (<100% Khá - gradient xanh vừa đậm)
  {
    id: 'kpi-2026-03-team2b-1',
    user_id: 'user-le-van-c',
    team_id: 'team-2b',
    year: 2026,
    quarter_id: 'Q1',
    month: 3,
    period_label: 'Tháng 03/2026',
    target: 1050,
    achieved: 892,
    unit: 'task',
    miss_count: 3,
    late_count: 2,
    projects: [
      { id: 'p4', name: 'Quyết toán đối soát quý 1', description: 'Khớp 100% dữ liệu kế toán với chi nhánh Osaka', role: 'Thành viên' }
    ],
    notes: 'Tiến độ đạt 85%, nỗ lực hoàn thành nốt khối lượng tồn đọng.',
    evaluator_id: 'user-sato',
    updated_at: '2026-03-22T10:00:00Z',
  },
  // 2課 - S: Target 800, Achieved 400 -> 50.0% (Mức 50% - gradient xanh nhạt rõ rệt)
  {
    id: 'kpi-2026-03-team2s-1',
    user_id: 'user-pham-thi-d',
    team_id: 'team-2s',
    year: 2026,
    quarter_id: 'Q1',
    month: 3,
    period_label: 'Tháng 03/2026',
    target: 800,
    achieved: 400,
    unit: 'task',
    miss_count: 1,
    late_count: 0,
    projects: [
      { id: 'p5', name: 'Xử lý phản hồi đối tác VIP', description: 'Giải quyết 98% thắc mắc trong vòng 2 giờ', role: 'Phụ trách chính' }
    ],
    notes: 'Giai đoạn 1 hoàn thành 50% chỉ tiêu theo kế hoạch điều phối mới.',
    evaluator_id: 'user-sato',
    updated_at: '2026-03-22T10:00:00Z',
  },
  // 3課: Target 635, Achieved 495 -> 77.9% (<100% Trung bình khá - gradient xanh trung bình)
  {
    id: 'kpi-2026-03-team3-1',
    user_id: 'user-hoang-van-e',
    team_id: 'team-3',
    year: 2026,
    quarter_id: 'Q1',
    month: 3,
    period_label: 'Tháng 03/2026',
    target: 635,
    achieved: 495,
    unit: 'task',
    miss_count: 1,
    late_count: 1,
    projects: [
      { id: 'p6', name: 'Hiệu đính tài liệu chuyên ngành', description: 'Dịch thuật và kiểm tra chuẩn xác 15 bộ tài liệu pháp lý', role: 'Trưởng dự án' }
    ],
    notes: 'Chất lượng tốt, đang tăng tốc tuần cuối để tiệm cận 100%.',
    evaluator_id: 'user-tanaka',
    updated_at: '2026-03-22T10:00:00Z',
  },
  // GS: Target 500, Achieved 250 -> 50.0% (Mức 50% - gradient xanh nhạt)
  {
    id: 'kpi-2026-03-teamgs-1',
    user_id: 'user-vu-thi-f',
    team_id: 'team-gs',
    year: 2026,
    quarter_id: 'Q1',
    month: 3,
    period_label: 'Tháng 03/2026',
    target: 500,
    achieved: 250,
    unit: 'task',
    miss_count: 2,
    late_count: 2,
    projects: [
      { id: 'p7', name: 'Triển khai khảo sát gắn kết nội bộ', description: 'Thu thập 100% phản hồi của nhân sự toàn công ty', role: 'Điều phối' }
    ],
    notes: 'Đang triển khai 50% kế hoạch khảo sát nội bộ đợt 1.',
    evaluator_id: 'user-suzuki',
    updated_at: '2026-03-22T10:00:00Z',
  },
];

export const INITIAL_QUARTERS: QuarterConfig[] = [
  {
    id: 'Q1',
    year: 2026,
    name: 'Q1',
    label: 'Quý 1 (T1 - T3/2026)',
    months: [1, 2, 3],
    start_date: '2026-01-01',
    end_date: '2026-03-31',
    is_active: true,
    is_published_awards: true,
  },
  {
    id: 'Q2',
    year: 2026,
    name: 'Q2',
    label: 'Quý 2 (T4 - T6/2026)',
    months: [4, 5, 6],
    start_date: '2026-04-01',
    end_date: '2026-06-30',
    is_active: false,
    is_published_awards: false,
  },
  {
    id: 'Q3',
    year: 2026,
    name: 'Q3',
    label: 'Quý 3 (T7 - T9/2026)',
    months: [7, 8, 9],
    start_date: '2026-07-01',
    end_date: '2026-09-30',
    is_active: false,
    is_published_awards: false,
  },
  {
    id: 'Q4',
    year: 2026,
    name: 'Q4',
    label: 'Quý 4 (T10 - T12/2026)',
    months: [10, 11, 12],
    start_date: '2026-10-01',
    end_date: '2026-12-31',
    is_active: false,
    is_published_awards: false,
  },
];

export const INITIAL_AWARD_CATEGORIES: AwardCategory[] = [
  {
    id: 'cat-mvp',
    name: 'MVP Quý (Most Valuable Player)',
    icon: 'Trophy',
    criteria_description: 'Cá nhân có thành tích xuất sắc toàn diện, hoàn thành vượt chỉ tiêu KPI, đóng góp vượt trội cho team.',
    order: 1,
  },
  {
    id: 'cat-quality',
    name: 'Thành Tích Chất Lượng (Zero Miss)',
    icon: 'ShieldCheck',
    criteria_description: 'Đạt tỷ lệ hoàn thành KPI 100% liên tục và không phát sinh bất kỳ lỗi nghiệp vụ nào trong kỳ.',
    order: 2,
  },
  {
    id: 'cat-kaizen',
    name: 'Sáng Kiến Cải Tiến (Kaizen Award)',
    icon: 'Sparkles',
    criteria_description: 'Có đề xuất hoặc cải tiến quy trình công việc giúp tiết kiệm thời gian hoặc nâng cao năng suất nhóm.',
    order: 3,
  },
  {
    id: 'cat-dedication',
    name: 'Tận Tâm Cống Hiến (Dedication Award)',
    icon: 'HeartHandshake',
    criteria_description: 'Thái độ làm việc chuyên nghiệp, luôn sẵn sàng hỗ trợ đồng đội và đối tác trong các tình huống phát sinh.',
    order: 4,
  },
  {
    id: 'cat-customer',
    name: 'Làm Hài Lòng Khách Hàng (Customer Delight)',
    icon: 'Star',
    criteria_description: 'Nhận được phản hồi tích cực và thư cảm ơn trực tiếp từ đối tác / khách hàng Nhật Bản.',
    order: 5,
  },
];

export const INITIAL_PROPOSALS: AwardProposal[] = [
  {
    id: 'prop-1',
    user_id: 'user-pham-thi-d',
    category_id: 'cat-mvp',
    quarter_id: 'Q1',
    year: 2026,
    proposed_by: 'user-sato',
    reason: 'Đạt tỷ lệ hoàn thành 103.8% chỉ tiêu, hỗ trợ xử lý 98% hồ sơ khách hàng VIP hài lòng tuyệt đối.',
    status: 'approved',
    feedback: 'Đồng ý vinh danh MVP Quý 1! Thành tích rất xứng đáng.',
    is_published: true,
    created_at: '2026-03-20T08:30:00Z',
    reviewed_at: '2026-03-22T09:00:00Z',
    reviewed_by: 'user-admin',
  },
  {
    id: 'prop-2',
    user_id: 'user-hoang-van-e',
    category_id: 'cat-quality',
    quarter_id: 'Q1',
    year: 2026,
    proposed_by: 'user-tanaka',
    reason: 'Thực hiện 672 task dịch thuật và kiểm chuẩn mà không có bất kỳ sai sót nào (0 Miss).',
    status: 'approved',
    feedback: 'Zero Miss chuẩn mực theo tiêu chuẩn chất lượng Nhật Bản.',
    is_published: true,
    created_at: '2026-03-21T10:15:00Z',
    reviewed_at: '2026-03-22T09:15:00Z',
    reviewed_by: 'user-admin',
  },
  {
    id: 'prop-3',
    user_id: 'user-tran-thi-b',
    category_id: 'cat-kaizen',
    quarter_id: 'Q1',
    year: 2026,
    proposed_by: 'user-sato',
    reason: 'Tạo bảng tính tự động hoá phân loại phiếu nhập, giúp toàn nhóm 2課-A tiết kiệm hơn 40 giờ thao tác mỗi tháng.',
    status: 'approved',
    feedback: 'Kaizen xuất sắc mang lại hiệu quả thiết thực.',
    is_published: true,
    created_at: '2026-03-23T14:00:00Z',
    reviewed_at: '2026-03-24T10:00:00Z',
    reviewed_by: 'user-admin',
  },
  {
    id: 'prop-4',
    user_id: 'user-nguyen-van-a',
    category_id: 'cat-dedication',
    quarter_id: 'Q1',
    year: 2026,
    proposed_by: 'user-admin',
    reason: 'Tinh thần trách nhiệm cao, luôn đồng hành hỗ trợ mọi thành viên 1課 vượt khó khăn.',
    status: 'approved',
    feedback: 'Tấm gương tận tâm đáng khen ngợi.',
    is_published: true,
    created_at: '2026-03-22T08:00:00Z',
    reviewed_at: '2026-03-23T15:00:00Z',
    reviewed_by: 'user-admin',
  },
  {
    id: 'prop-5',
    user_id: 'user-pham-thi-d',
    category_id: 'cat-customer',
    quarter_id: 'Q1',
    year: 2026,
    proposed_by: 'user-sato',
    reason: '100% khách hàng doanh nghiệp Nhật Bản đánh giá 5 sao về thái độ phục vụ và tốc độ giải quyết case.',
    status: 'approved',
    feedback: 'Dịch vụ chuẩn mực Nhật Bản.',
    is_published: true,
    created_at: '2026-03-23T16:00:00Z',
    reviewed_at: '2026-03-24T11:00:00Z',
    reviewed_by: 'user-admin',
  },
  {
    id: 'prop-6',
    user_id: 'user-tran-thi-b',
    category_id: 'cat-quality',
    quarter_id: 'Q1',
    year: 2026,
    proposed_by: 'user-sato',
    reason: 'Không phát sinh lỗi dữ liệu trong 3 tháng liên tiếp kiểm soát chứng từ 2課-A.',
    status: 'approved',
    feedback: 'Chất lượng kiểm soát hồ sơ rất đáng tin cậy.',
    is_published: true,
    created_at: '2026-03-24T09:00:00Z',
    reviewed_at: '2026-03-24T14:30:00Z',
    reviewed_by: 'user-admin',
  },
];

export const INITIAL_MENDANS: MendanRecord[] = [
  {
    id: 'mendan-1',
    user_id: 'user-pham-thi-d',
    evaluator_id: 'user-admin',
    team_id: 'team-2s',
    quarter_id: 'Q1',
    evaluation_type: 'quarterly',
    scheduled_date: '2026-03-24',
    actual_date: '2026-03-24',
    status: 'completed',
    content_format: 'standard_3',
    leader_evaluator_id: 'user-sato',
    leader_evaluated_at: '2026-03-22T10:00:00Z',
    leader_good_points: 'Khả năng tiếng Nhật N1 xuất sắc, phản hồi case VIP nhanh nhẹn và chính xác. Được khách hàng Nhật khen ngợi nhiều lần.',
    leader_improvements: 'Cần chủ động chia sẻ bí quyết xử lý tài liệu khó cho các bạn mới trong 2課.',
    leader_risks: 'Khối lượng hồ sơ VIP dồn dập vào tuần chốt tháng, có nguy cơ quá tải nếu không có bạn hỗ trợ dự phòng.',
    leader_other: 'Nguyện vọng muốn thử sức thêm với vai trò Mentor đào tạo và định hướng phát triển lên Subleader.',
    good_points: 'Khả năng tiếng Nhật N1 xuất sắc, giao tiếp tự tin và nhạy bén khi trao đổi với khách hàng Nhật Bản. Tốc độ giải quyết case VIP rất nhanh.',
    improvements: 'Nên chia sẻ thêm kinh nghiệm xử lý tài liệu cho các thành viên mới gia nhập team.',
    next_goals: 'Đảm nhận vai trò Trainer cho khoá đào tạo kỹ năng trao đổi email thương mại Nhật Bản trong Q2.',
    pre_notes: 'Cần trao đổi kỹ về định hướng thăng tiến Subleader trong năm 2026.',
    memo: 'Buổi trao đổi diễn ra rất cởi mở. Em Dung đồng ý phụ trách thêm mảng đào tạo nội bộ trong Quý 2.',
    created_at: '2026-03-15T09:00:00Z',
    updated_at: '2026-03-24T16:00:00Z',
  },
  {
    id: 'mendan-2',
    user_id: 'user-le-van-c',
    evaluator_id: 'user-admin',
    team_id: 'team-2b',
    quarter_id: 'Q1',
    evaluation_type: 'quarterly',
    scheduled_date: '2026-03-26',
    status: 'pre_mendan',
    content_format: 'standard_3',
    leader_evaluator_id: 'user-sato',
    leader_evaluated_at: '2026-03-23T14:30:00Z',
    leader_good_points: 'Chăm chỉ, chịu khó học hỏi, thái độ hợp tác và tuân thủ kỷ luật tốt. Tinh thần trách nhiệm cao.',
    leader_improvements: 'Tốc độ đối soát chứng từ còn chậm vào ngày cao điểm, cần cải thiện để tránh nộp sát hạn.',
    leader_risks: 'Còn ngại ngần khi phát hiện lỗi lệch số liệu với đối tác Osaka, cần khuyến khích Hou-Ren-So báo cáo ngay.',
    leader_other: 'Đề xuất hỗ trợ đào tạo thêm các hàm nâng cao trong Excel và kỹ năng soát chứng từ.',
    good_points: 'Chăm chỉ, chịu khó học hỏi, thái độ hợp tác và tuân thủ kỷ luật tốt.',
    improvements: 'Tốc độ đối soát chứng từ cần cải thiện để tránh nộp sát hạn.',
    next_goals: 'Rút ngắn thời gian xử lý mỗi bộ hồ sơ xuống dưới 15 phút, giảm số lần trễ về 0.',
    pre_notes: 'Lưu ý hỏi thêm về những khó khăn trong việc phối hợp với chi nhánh Osaka.',
    memo: '',
    created_at: '2026-03-18T11:00:00Z',
    updated_at: '2026-03-23T14:30:00Z',
  },
  {
    id: 'mendan-3',
    user_id: 'user-hoang-van-e',
    evaluator_id: 'user-tanaka',
    team_id: 'team-3',
    quarter_id: 'Q1',
    evaluation_type: 'quarterly',
    scheduled_date: '2026-03-28',
    status: 'not_started',
    content_format: 'standard_3',
    leader_evaluator_id: '',
    leader_good_points: '',
    leader_improvements: '',
    leader_risks: '',
    leader_other: '',
    good_points: 'Độ chính xác cao, khả năng dịch thuật thuật ngữ pháp lý và hợp đồng vững vàng.',
    improvements: 'Chủ động hơn trong việc đề xuất các công cụ hỗ trợ dịch thuật tự động.',
    next_goals: 'Thử nghiệm công cụ hỗ trợ tra cứu thuật ngữ nội bộ.',
    memo: '',
    created_at: '2026-03-20T14:00:00Z',
    updated_at: '2026-03-20T14:00:00Z',
  },
  {
    id: 'mendan-4',
    user_id: 'user-nguyen-van-a',
    evaluator_id: 'user-admin',
    team_id: 'team-1',
    quarter_id: 'Q1',
    evaluation_type: 'quarterly',
    scheduled_date: '2026-03-25',
    actual_date: '2026-03-25',
    status: 'completed',
    content_format: 'standard_3',
    leader_evaluator_id: 'user-yamamoto',
    leader_evaluated_at: '2026-03-21T09:00:00Z',
    leader_good_points: 'Quản lý 1課 vững vàng, chỉ số KPI đạt 101.8%, xử lý rủi ro tốt.',
    leader_improvements: 'Cần phân bổ công việc cho các thành viên mới thay vì tự gánh vác.',
    leader_risks: 'Làm thêm giờ nhiều vào cuối tháng.',
    leader_other: 'Đề xuất khen thưởng Subleader tiêu biểu.',
    good_points: 'Khả năng quản lý đầu việc 1課 xuất sắc, tỷ lệ hoàn thành đạt 101.8%, kiểm soát lỗi chặt chẽ.',
    improvements: 'Phân bổ thời gian hỗ trợ các dự án mới hợp lý hơn để tránh quá tải cuối tháng.',
    next_goals: 'Duy trì tỷ lệ đạt >100% và chuẩn bị đào tạo 2 nhân sự mới cho 1課 trong Q2.',
    pre_notes: 'Thảo luận về lộ trình thăng tiến và mở rộng quy mô dự án Nhất khóa.',
    memo: 'Đã thống nhất mục tiêu Quý 2. Anh An cam kết dẫn dắt 1課 đạt mốc 105% sản lượng.',
    created_at: '2026-03-19T08:30:00Z',
    updated_at: '2026-03-25T15:30:00Z',
  },
  {
    id: 'mendan-5',
    user_id: 'user-tran-thi-b',
    evaluator_id: 'user-admin',
    team_id: 'team-2a',
    quarter_id: 'Q1',
    evaluation_type: 'adhoc',
    scheduled_date: '2026-03-27',
    actual_date: '2026-03-27',
    status: 'completed',
    content_format: 'standard_3',
    leader_evaluator_id: 'user-sato',
    leader_evaluated_at: '2026-03-24T10:00:00Z',
    leader_good_points: 'Sáng kiến Kaizen tự động hoá phân loại phiếu nhập mang lại hiệu quả cao, đạt 104.1% KPI.',
    leader_improvements: 'Cần chú ý sức khoẻ và cân bằng ca làm việc trong các tuần cao điểm.',
    leader_risks: 'Áp lực công việc cao.',
    leader_other: 'Đề xuất giải thưởng Sáng tạo & Kaizen.',
    good_points: 'Sáng kiến Kaizen tự động hoá phân loại phiếu nhập mang lại hiệu quả cao, đạt 104.1% KPI.',
    improvements: 'Cần chú ý sức khoẻ và cân bằng ca làm việc trong các tuần cao điểm.',
    next_goals: 'Nhân rộng bảng tính tự động hoá sang cho 2課-B và 2課-S.',
    pre_notes: 'Khen ngợi giải pháp Kaizen và đề xuất phần thưởng quý.',
    memo: 'Trao đổi không định kì về việc triển khai tool tự động hoá cho toàn bộ 2課. Tinh thần làm việc rất tích cực.',
    created_at: '2026-03-21T10:00:00Z',
    updated_at: '2026-03-27T11:30:00Z',
  },
  {
    id: 'mendan-6',
    user_id: 'user-vu-thi-f',
    evaluator_id: 'user-admin',
    team_id: 'team-gs',
    quarter_id: 'Q1',
    evaluation_type: 'adhoc',
    scheduled_date: '2026-03-29',
    status: 'pre_mendan',
    content_format: 'single_note',
    single_note: 'Đã hoàn thành tốt các đầu việc hỗ trợ nghiệp vụ chung. Cần chú ý cải thiện việc đi làm đúng giờ.',
    leader_evaluator_id: 'user-suzuki',
    leader_evaluated_at: '2026-03-22T09:00:00Z',
    leader_good_points: 'Nhiệt huyết, chu đáo, hỗ trợ hậu cần và quy trình cho tất cả các team nghiệp vụ rất nhanh.',
    leader_improvements: 'Giảm thiểu tình trạng đi muộn (hiện tại 2 lần trong tháng).',
    leader_risks: 'Dễ bị phân tán vì nhận nhiều yêu cầu cùng lúc.',
    leader_other: 'Mong muốn được tham gia lớp đào tạo kỹ năng quản lý thời gian.',
    good_points: 'Nhiệt huyết, chu đáo, hỗ trợ hậu cần và quy trình cho tất cả các team nghiệp vụ rất nhanh.',
    improvements: 'Giảm thiểu tình trạng đi muộn (hiện tại 2 lần trong tháng).',
    next_goals: 'Rà soát và chuẩn hoá lại kho lưu trữ biểu mẫu hành chính trong tháng tới.',
    pre_notes: 'Nhắc nhở nhẹ nhàng về quy định giờ giấc làm việc chuẩn Nhật.',
    memo: '',
    created_at: '2026-03-22T09:00:00Z',
    updated_at: '2026-03-22T09:00:00Z',
  },
  // Historical Q4/2025 records for viewing past quarters:
  {
    id: 'mendan-hist-q4-dung',
    user_id: 'user-pham-thi-d',
    evaluator_id: 'user-admin',
    team_id: 'team-2s',
    quarter_id: 'Q4',
    evaluation_type: 'quarterly',
    scheduled_date: '2025-12-24',
    actual_date: '2025-12-24',
    status: 'completed',
    content_format: 'standard_3',
    leader_evaluator_id: 'user-sato',
    leader_evaluated_at: '2025-12-20T10:00:00Z',
    leader_good_points: 'Đạt 102.5% sản lượng Q4, xử lý trơn tru các hồ sơ phát sinh cuối năm.',
    leader_improvements: 'Cần trau dồi thêm kỹ năng làm việc nhóm với các bạn mới.',
    leader_risks: 'Không có rủi ro lớn.',
    leader_other: 'Dự kiến thi chứng chỉ tiếng Nhật cấp độ cao.',
    good_points: 'Hoàn thành 100% KPI quý 4, không có sai sót trong các hồ sơ VIP khách hàng Kansai.',
    improvements: 'Cần nâng cao kỹ năng đàm phán hồ sơ phức tạp.',
    next_goals: 'Đạt chứng chỉ N1 và phụ trách toàn bộ nhóm khách hàng VIP.',
    memo: 'Đạt giải thưởng MVP Quý 4/2025. Định hướng thăng tiến trong năm 2026.',
    created_at: '2025-12-15T09:00:00Z',
    updated_at: '2025-12-24T16:00:00Z',
  },
  {
    id: 'mendan-hist-q4-cuong',
    user_id: 'user-le-van-c',
    evaluator_id: 'user-admin',
    team_id: 'team-2b',
    quarter_id: 'Q4',
    evaluation_type: 'quarterly',
    scheduled_date: '2025-12-26',
    actual_date: '2025-12-26',
    status: 'completed',
    content_format: 'standard_3',
    leader_evaluator_id: 'user-sato',
    leader_evaluated_at: '2025-12-22T08:00:00Z',
    leader_good_points: 'Thái độ hoà nhã, chăm chỉ tiếp thu chỉ đạo từ trưởng bộ phận.',
    leader_improvements: 'Còn nhầm lẫn một số mã phân loại phí ngân hàng.',
    leader_risks: 'Tốc độ thao tác phần mềm còn chậm.',
    leader_other: 'Cần kèm cặp thêm 1-1.',
    good_points: 'Tuân thủ giờ giấc làm việc tốt, phối hợp tốt với đồng nghiệp trong 2課-B.',
    improvements: 'Hạn chế lỗi nhập sai mã chứng từ.',
    next_goals: 'Nâng tỷ lệ chính xác lên 99% trong Q1.',
    memo: 'Hoàn thành trao đổi cuối năm. Tinh thần cầu tiến tốt.',
    created_at: '2025-12-18T10:00:00Z',
    updated_at: '2025-12-26T15:00:00Z',
  },
  {
    id: 'mendan-hist-q4-an',
    user_id: 'user-nguyen-van-a',
    evaluator_id: 'user-admin',
    team_id: 'team-1',
    quarter_id: 'Q4',
    evaluation_type: 'quarterly',
    scheduled_date: '2025-12-25',
    actual_date: '2025-12-25',
    status: 'completed',
    content_format: 'standard_3',
    leader_evaluator_id: 'user-yamamoto',
    leader_evaluated_at: '2025-12-21T09:00:00Z',
    leader_good_points: 'Lãnh đạo 1課 hoàn thành vượt mức kế hoạch năm 2025.',
    leader_improvements: 'Cần chú ý bồi dưỡng thế hệ kế cận.',
    leader_risks: 'Áp lực mở rộng dự án mới.',
    leader_other: 'Đề xuất tăng chỉ tiêu tuyển dụng.',
    good_points: 'Xuất sắc dẫn dắt toàn đội 1課, chất lượng nghiệp vụ ổn định tuyệt đối.',
    improvements: 'Cần đào tạo thêm nhân sự phụ trách khi vắng mặt.',
    next_goals: 'Mở rộng quy mô 1課 và thử nghiệm quy trình kiểm tra kép.',
    memo: 'Đã tổng kết xuất sắc năm 2025. Ban giám đốc đánh giá rất cao.',
    created_at: '2025-12-19T08:30:00Z',
    updated_at: '2025-12-25T17:00:00Z',
  },
  {
    id: 'mendan-hist-q4-dat',
    user_id: 'user-admin',
    evaluator_id: 'user-admin',
    team_id: 'team-gs',
    quarter_id: 'Q4',
    evaluation_type: 'quarterly',
    scheduled_date: '2025-12-28',
    actual_date: '2025-12-28',
    status: 'completed',
    content_format: 'standard_3',
    leader_evaluator_id: 'user-admin',
    leader_evaluated_at: '2025-12-24T09:00:00Z',
    leader_good_points: 'Khả năng điều phối và vận hành toàn hệ thống GS xuất sắc. Đạt 105% chỉ tiêu chuyển đổi số.',
    leader_improvements: 'Cần phân quyền và ủy quyền sâu hơn cho các Subleader để giảm tải công việc.',
    leader_risks: 'Khối lượng đầu việc quản trị hệ thống quá lớn, cần bổ sung trợ lý vận hành.',
    leader_other: 'Đề xuất kế hoạch nâng cấp hạ tầng số hóa toàn diện năm 2026.',
    good_points: 'Duy trì sự ổn định 99.9% cho toàn bộ quy trình vận hành và báo cáo của công ty.',
    improvements: 'Tối ưu hóa các quy trình phê duyệt liên phòng ban.',
    next_goals: 'Triển khai thành công nền tảng Đánh giá & Quản trị KPI Mendan tự động hóa trong Q1/2026.',
    memo: 'Định hướng chiến lược năm 2026: Nâng cao hiệu suất toàn công ty và chuẩn hóa hệ thống quản trị nhân sự.',
    created_at: '2025-12-20T08:00:00Z',
    updated_at: '2025-12-28T16:30:00Z',
  },
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    user_id: 'all',
    title: 'KPI Toàn bộ phận Tháng 03 đạt 104.2%',
    message: 'Toàn bộ 4 khối 1課, 2課, 3課, GS đã hoàn thành vượt chỉ tiêu tháng 03/2026.',
    type: 'kpi_updated',
    link_module: 'kpi',
    is_read: false,
    created_at: '2026-03-23T18:30:00Z',
  },
  {
    id: 'notif-2',
    user_id: 'all',
    title: 'Đã xuất bản Bảng Vàng Khen Thưởng Quý 1',
    message: 'Admin đã phê duyệt và công khai danh sách vinh danh cá nhân xuất sắc Quý 1/2026.',
    type: 'award_result',
    link_module: 'awards',
    is_read: false,
    created_at: '2026-03-22T09:30:00Z',
  },
  {
    id: 'notif-3',
    user_id: 'user-pham-thi-d',
    title: 'Buổi trao đổi Mendan hoàn tất',
    message: 'Trưởng nhóm Sato Kenji đã hoàn thành biên bản trao đổi Mendan Quý 1 cho bạn.',
    type: 'mendan_scheduled',
    link_module: 'profile',
    is_read: true,
    created_at: '2026-03-24T16:05:00Z',
  },
];

export const INITIAL_THRESHOLDS: KpiThresholds = {
  exceeded_rate: 102, // >= 102% is exceeded
  achieved_rate: 100, // 100% - 101.9% is achieved
  needs_improvement_rate: 100, // < 100% is needs improvement
};

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    user_id: 'user-admin',
    user_name: 'Phạm Tiến Đạt (Admin)',
    action: 'import_kpi',
    details: 'Nhập KPI hàng loạt cho 6 nhân sự kỳ Tháng 03/2026',
    file_name: 'DYM_KPI_Thang03_2026.xlsx',
    records_count: 6,
    timestamp: '2026-03-22T10:00:00Z',
  },
  {
    id: 'log-2',
    user_id: 'user-admin',
    user_name: 'Phạm Tiến Đạt (Admin)',
    action: 'approve_award',
    details: 'Phê duyệt đề xuất MVP Quý 1 cho Phạm Thị Dung',
    timestamp: '2026-03-22T09:00:00Z',
  },
];

export const INITIAL_EVALUATION_CRITERIA: EvaluationCriterion[] = [
  {
    id: 'crit-task',
    name: 'タスク処理能力',
    vietnamese_name: 'Khả năng xử lý tác vụ',
    weight: 5,
    order: 1,
    levels: {
      level1: '一部の限定されたタスクのみ対応できる\n新しい依頼に対しては多くのサポートを要する\n要件がわずかに変更された場合でも対応できないことがある',
      level2: '基本的なタスクは概ね対応できる\nサポートがあれば新しいタスクにも対応できる\n自力での対応力はまだ限定的である',
      level3: '複数種類のタスクを安定して対応できる\n異なる要件にも柔軟に対応できる\nサポートへの依存が少ない',
      level4: '複数の複雑な依頼を自力で対応できる\n前例のない、または要件が不明確な依頼にも対応できる\n他メンバーを支援・育成し、能力向上を図ることができる',
      level5: '複数の高度かつ複雑な依頼を自力で対応できる\n前例のない、または要件が不明確な依頼にも安定して対応できる\n複数のメンバーを支援・育成し、能力向上に貢献できる\n知識共有を主導し、チーム全体の対応力を向上させることができる',
    },
  },
  {
    id: 'crit-flexibility',
    name: '柔軟性・主体性',
    vietnamese_name: 'Tính linh hoạt & Chủ động',
    weight: 4,
    order: 2,
    levels: {
      level1: '状況が変化すると対応できない\n指示を待つ姿勢が強く、主体的な行動が見られない',
      level2: '指示やガイダンスがあれば対応できる\n指示・指導への依存度が高い',
      level3: '担当業務を安定して遂行できる\n責任範囲内で発生する問題に対して主体的に対応できる\n指示があれば他メンバーを支援できる',
      level4: '担当業務を確実に遂行できる\n自ら追加の業務を引き受けたり、他メンバーを支援したりできる\n全体最適を考慮し、タスクの優先順位を主体的に調整できる',
      level5: '複雑な状況や高いプレッシャー下でも柔軟に対応できる\n自ら追加業務を引き受け、または他メンバーを支援できる\n緊急時には優先順位を自ら判断できる\n状況に応じて業務を適切に調整・連携できる\nチームの処理速度や安定性を高める対応策を主体的に提案できる',
    },
  },
  {
    id: 'crit-horenso',
    name: '報連相',
    vietnamese_name: 'Hou-Ren-So (Báo cáo - Liên lạc - Thảo luận)',
    weight: 4,
    order: 3,
    levels: {
      level1: '求められた場合のみ報告する\n情報共有が不足していることが多い',
      level2: '報告・連絡・相談が遅れることがある\n伝え方が分かりにくい場合がある',
      level3: '問題が発生した際には適切に報告できる\n基本的な情報共有はできている',
      level4: '適切なタイミングで主体的に報告・連絡・相談ができる\n要点を押さえ、分かりやすく伝えることができる',
      level5: '状況を先読みし、適切な内容で報告・連絡・相談ができる\n相手に応じて伝え方を調整できる\n他メンバーの報告・共有を支援し、質の向上に貢献できる',
    },
  },
  {
    id: 'crit-quality',
    name: '品質（ミス）',
    vietnamese_name: 'Chất lượng công việc (Lỗi sai)',
    weight: 3,
    order: 4,
    levels: {
      level1: '2ミス以上',
      level2: '1ミス',
      level3: '0ミス',
      level4: '0ミス\nチェックリスト、早期報告、ダブルチェック等の具体的な行動により、ミスを主体的に予防できる\nミス防止に向けた行動が評価期間中に確認できる',
      level5: '0ミス\n品質リスクが発生した際に、他メンバーを支援できる\nミス防止策を組織化・展開し、複数のメンバーのリスク低減に貢献できる\nミス防止策が複数のメンバー/複数のタスクにおいて繰り返し適用されている',
    },
  },
  {
    id: 'crit-japanese',
    name: 'コミュニケーション能力（日本語）',
    vietnamese_name: 'Giao tiếp tiếng Nhật nghiệp vụ',
    weight: 2,
    order: 5,
    levels: {
      level1: '簡単なメッセージのみ対応できる\n依頼内容を誤解したり、誤って伝達したりすることがある\n他者による再説明や確認が必要',
      level2: 'メッセージで内容を理解・伝達できる\nサポートがあれば、対面またはZoomでの会話が可能',
      level3: 'メッセージで内容を理解・伝達できる\n対面またはZoomでの会話が可能\n主な内容は理解できるが、確認・明確化は受動的',
      level4: 'メッセージで内容を理解・伝達できる\n対面またはZoomでの会話が可能\n主体的に質問・確認・明確化ができる\n他メンバーのやり取りを支援できる',
      level5: 'チャットで内容を正確に理解・伝達できる\n業務タスクに限らず、日本語での会議に参加できる\n目的・背景を理解し、チームへ正確に共有できる\n複数人に対して双方向の情報調整・進行ができる',
    },
  },
  {
    id: 'crit-kpi',
    name: 'KPI（目標達成率）',
    vietnamese_name: 'Tỷ lệ hoàn thành mục tiêu KPI',
    weight: 2,
    order: 6,
    levels: {
      level1: '80%',
      level2: '90%',
      level3: '100%',
      level4: '110%',
      level5: '120%',
    },
  },
  {
    id: 'crit-late',
    name: '遅刻',
    vietnamese_name: 'Kỷ luật giờ giấc (Vi phạm đi muộn)',
    weight: 0,
    order: 7,
    levels: {
      level1: '初回面談後 2回目の違反',
      level2: '初回面談後 3回目の違反',
      level3: '初回面談後 4回目の違反',
      level4: '初回面談後 5回目の違反',
      level5: '初回面談後 6回目の違反',
    },
  },
];

// Sample evaluation records matching exact image rubric score (83 points for user-admin)
export const INITIAL_MEMBER_EVALUATIONS: MemberEvaluationRecord[] = [
  {
    id: 'eval-admin-q1',
    user_id: 'user-admin',
    evaluator_id: 'user-master',
    team_id: 'team-gs',
    quarter_id: 'Q1',
    year: 2026,
    scores: {
      'crit-task': 5, // 5*5 = 25
      'crit-flexibility': 4, // 4*4 = 16
      'crit-horenso': 4, // 4*4 = 16
      'crit-quality': 4, // 4*3 = 12
      'crit-japanese': 4, // 4*2 = 8
      'crit-kpi': 3, // 3*2 = 6
      'crit-late': 0, // 0*0 = 0
    },
    total_score: 83, // Total: 25 + 16 + 16 + 12 + 8 + 6 + 0 = 83 (matches image exactly!)
    rank_grade: 'A',
    note: 'Thành tích vận hành xuất sắc, năng lực xử lý tác vụ độc lập tối đa.',
    status: 'finalized',
    updated_at: '2026-03-24T10:00:00Z',
  },
  {
    id: 'eval-dung-q1',
    user_id: 'user-pham-thi-d',
    evaluator_id: 'user-sato',
    team_id: 'team-2s',
    quarter_id: 'Q1',
    year: 2026,
    scores: {
      'crit-task': 5, // 25
      'crit-flexibility': 5, // 20
      'crit-horenso': 5, // 20
      'crit-quality': 5, // 15
      'crit-japanese': 5, // 10
      'crit-kpi': 4, // 8
      'crit-late': 0, // 0
    },
    total_score: 98,
    rank_grade: 'S',
    note: 'MVP quý 1, xử lý hồ sơ VIP trọn vẹn và đạt điểm giao tiếp tiếng Nhật tối đa.',
    status: 'finalized',
    updated_at: '2026-03-24T11:00:00Z',
  },
  {
    id: 'eval-bich-q1',
    user_id: 'user-tran-thi-b',
    evaluator_id: 'user-sato',
    team_id: 'team-2a',
    quarter_id: 'Q1',
    year: 2026,
    scores: {
      'crit-task': 5, // 25
      'crit-flexibility': 5, // 20
      'crit-horenso': 4, // 16
      'crit-quality': 4, // 12
      'crit-japanese': 4, // 8
      'crit-kpi': 4, // 8
      'crit-late': 0, // 0
    },
    total_score: 89,
    rank_grade: 'A',
    note: 'Sáng kiến Kaizen tự động hoá phiếu nhập mang lại hiệu quả cao cho toàn nhóm.',
    status: 'finalized',
    updated_at: '2026-03-24T12:00:00Z',
  },
];

export const INITIAL_CRITERIA_PROPOSALS: CriteriaProposal[] = [];

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
    if (missing.length > 0) {
      const merged = [...stored, ...missing];
      setToStorage(STORAGE_KEYS.AWARD_PROPOSALS, merged);
      return merged;
    }
    return stored;
  },
  saveAwardProposals: (proposals: AwardProposal[]) => setToStorage(STORAGE_KEYS.AWARD_PROPOSALS, proposals),

  getNotifications: (): AppNotification[] => getFromStorage(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS),
  saveNotifications: (notifs: AppNotification[]) => setToStorage(STORAGE_KEYS.NOTIFICATIONS, notifs),

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

  getMemberEvaluations: (): MemberEvaluationRecord[] =>
    getFromStorage(STORAGE_KEYS.MEMBER_EVALUATIONS, INITIAL_MEMBER_EVALUATIONS),
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
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
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
