import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Minus,
  Plus,
  AlertTriangle,
  RotateCcw,
  Check,
} from 'lucide-react';
import { Team, User, KpiRecord } from '../../types';

interface SetTeamKpiModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  users: User[];
  kpiRecords: KpiRecord[];
  currentQuarter: string;
  initialTeamId?: string | null;
  isEmbedded?: boolean;
  onSaveKpiTargets: (
    quarter: string,
    year: number,
    updates: { userId: string; teamId: string; target: number }[]
  ) => void;
}

// Cấu trúc dữ liệu của 1 tháng cho từng team
interface MonthData {
  kpi_manager: number;
  kpi_subleader: number;
  result: number;
}

// Dữ liệu mẫu lịch sử chuẩn theo từng team (1課, 2課, 3課, GS)
const HISTORICAL_MONTH_DATA: Record<string, Record<number, MonthData>> = {
  'team-1': {
    7: { kpi_manager: 9500, kpi_subleader: 9500, result: 9620 },
    8: { kpi_manager: 9500, kpi_subleader: 9500, result: 9226 },
    9: { kpi_manager: 9800, kpi_subleader: 9800, result: 10296 },
    10: { kpi_manager: 12000, kpi_subleader: 12000, result: 4215 },
  },
  'team-2': {
    7: { kpi_manager: 7900, kpi_subleader: 7900, result: 7300 },
    8: { kpi_manager: 8000, kpi_subleader: 8000, result: 7400 },
    9: { kpi_manager: 8030, kpi_subleader: 8030, result: 7407 },
    10: { kpi_manager: 7030, kpi_subleader: 7030, result: 2888 },
  },
  'team-3': {
    7: { kpi_manager: 2050, kpi_subleader: 2050, result: 1800 },
    8: { kpi_manager: 2050, kpi_subleader: 2050, result: 1900 },
    9: { kpi_manager: 1960, kpi_subleader: 1960, result: 1726 },
    10: { kpi_manager: 2000, kpi_subleader: 2000, result: 726 },
  },
  'team-gs': {
    7: { kpi_manager: 300, kpi_subleader: 300, result: 165 },
    8: { kpi_manager: 300, kpi_subleader: 300, result: 202 },
    9: { kpi_manager: 210, kpi_subleader: 210, result: 153 },
    10: { kpi_manager: 160, kpi_subleader: 160, result: 53 },
  },
};

// Định dạng số kiểu Việt Nam: 12.000
const formatVi = (val: number): string => {
  return Math.round(val).toLocaleString('vi-VN');
};

export const SetTeamKpiModal: React.FC<SetTeamKpiModalProps> = ({
  isOpen,
  onClose,
  teams,
  users,
  isEmbedded = false,
  onSaveKpiTargets,
}) => {
  // Chế độ xem: Tháng (mặc định) hoặc Quý
  const [periodType, setPeriodType] = useState<'month' | 'quarter'>('month');

  // Danh sách các tháng trước đã mở (mặc định mở Tháng 9 hoặc đóng theo người dùng click)
  const [openedMonths, setOpenedMonths] = useState<number[]>([9]);

  // Danh sách các quý trước đã mở ở chế độ Quý (mặc định mở Quý 3)
  const [openedQuarters, setOpenedQuarters] = useState<number[]>([3]);

  // Các team cấp 1 (root teams): 1課, 2課, 3課, GS
  const rootTeams = useMemo(() => {
    return teams
      .filter((t) => !t.parent_team_id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [teams]);

  // Giá trị KPI đã lưu ban đầu (Tháng 10/2026)
  const initialKpis: Record<string, number> = useMemo(() => {
    const init: Record<string, number> = {};
    rootTeams.forEach((t) => {
      init[t.id] = HISTORICAL_MONTH_DATA[t.id]?.[10]?.kpi_manager ?? 2000;
    });
    return init;
  }, [rootTeams]);

  // State lưu số đang nhập của từng team cho Tháng 10
  const [teamInputs, setTeamInputs] = useState<Record<string, number>>(initialKpis);

  // State lưu bản đã lưu gần nhất (dùng để so sánh "Đã sửa")
  const [savedInputs, setSavedInputs] = useState<Record<string, number>>(initialKpis);

  // Nút tăng nhanh đang chọn: 0, 5, 10, 15 hoặc null
  const [selectedGrowthPct, setSelectedGrowthPct] = useState<number | null>(null);

  // Dải xác nhận khi bấm tăng nhanh mà đã có số nhập tay chưa lưu
  const [pendingGrowthPct, setPendingGrowthPct] = useState<number | null>(null);

  // Lưu bản snapshot trước khi áp tăng nhanh để có thể Hoàn tác
  const [historyBeforeGrowth, setHistoryBeforeGrowth] = useState<Record<string, number> | null>(null);

  // Thông báo sau khi áp tăng nhanh
  const [growthAppliedNotice, setGrowthAppliedNotice] = useState<string | null>(null);

  // Thời gian lưu gần nhất
  const [lastSavedTime, setLastSavedTime] = useState<string>('09:30');

  // Quản lý ref cho các ô input để xử lý phím Enter nhảy ô tiếp theo
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  if (!isOpen && !isEmbedded) return null;

  // Lấy dữ liệu 1 tháng của 1 team
  const getTeamMonthData = (teamId: string, month: number): MonthData => {
    const data = HISTORICAL_MONTH_DATA[teamId]?.[month];
    if (data) return data;
    return { kpi_manager: 0, kpi_subleader: 0, result: 0 };
  };

  // Tính tỷ lệ của 1 tháng
  const calcRate = (result: number, kpi: number): { rate: number | null; label: string } => {
    if (kpi <= 0) return { rate: null, label: '–' };
    const r = Math.round((result / kpi) * 100);
    return { rate: r, label: `${r}%` };
  };

  // Kiểm tra xem người dùng đã sửa tay ô nào so với savedInputs chưa
  const hasUserEdited = rootTeams.some((t) => (teamInputs[t.id] ?? 0) !== (savedInputs[t.id] ?? 0));

  // Đếm số team đã sửa
  const editedTeamsCount = rootTeams.filter((t) => (teamInputs[t.id] ?? 0) !== (savedInputs[t.id] ?? 0)).length;

  // Thay đổi input của 1 team
  const handleInputChange = (teamId: string, val: number) => {
    const sanitized = Math.max(0, Math.floor(val));
    setTeamInputs((prev) => ({ ...prev, [teamId]: sanitized }));
    // Hủy trạng thái nút tăng nhanh và dải thông báo khi nhập tay
    setSelectedGrowthPct(null);
    setGrowthAppliedNotice(null);
    setPendingGrowthPct(null);
  };

  // Nút Stepper - / + bước 100
  const handleStep = (teamId: string, delta: number) => {
    const cur = teamInputs[teamId] ?? 0;
    handleInputChange(teamId, cur + delta);
  };

  // Xử lý phím Enter nhảy xuống ô của team kế tiếp
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % rootTeams.length;
      const nextTeam = rootTeams[nextIndex];
      if (nextTeam && inputRefs.current[nextTeam.id]) {
        inputRefs.current[nextTeam.id]?.focus();
        inputRefs.current[nextTeam.id]?.select();
      }
    }
  };

  // Thực hiện áp dụng % tăng nhanh so với KPI T9
  const applyGrowth = (pct: number) => {
    // Lưu lại snapshot hiện tại để hoàn tác
    setHistoryBeforeGrowth({ ...teamInputs });

    const updated: Record<string, number> = {};
    rootTeams.forEach((t) => {
      const kpiT9 = getTeamMonthData(t.id, 9).kpi_subleader || getTeamMonthData(t.id, 9).kpi_manager || 0;
      const newVal = Math.round((kpiT9 * (1 + pct / 100)) / 10) * 10;
      updated[t.id] = Math.max(0, newVal);
    });

    setTeamInputs(updated);
    setSelectedGrowthPct(pct);
    setGrowthAppliedNotice(`Đã áp +${pct}% cho cả ${rootTeams.length} team so với KPI T9`);
    setPendingGrowthPct(null);
  };

  // Khi click nút tăng nhanh
  const handleGrowthClick = (pct: number) => {
    if (hasUserEdited) {
      // Hiện dải xác nhận nếu đã có số nhập tay chưa lưu
      setPendingGrowthPct(pct);
    } else {
      applyGrowth(pct);
    }
  };

  // Hoàn tác tăng nhanh
  const handleUndoGrowth = () => {
    if (historyBeforeGrowth) {
      setTeamInputs(historyBeforeGrowth);
      setHistoryBeforeGrowth(null);
      setSelectedGrowthPct(null);
      setGrowthAppliedNotice(null);
    }
  };

  // Lưu KPI
  const handleSave = () => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setLastSavedTime(timeStr);
    setSavedInputs({ ...teamInputs });
    setSelectedGrowthPct(null);
    setGrowthAppliedNotice(null);
    setPendingGrowthPct(null);

    // Phân bổ KPI xuống cho từng nhân sự trong DB
    const updates: { userId: string; teamId: string; target: number }[] = [];
    rootTeams.forEach((team) => {
      const teamTotal = teamInputs[team.id] ?? 0;
      const teamMembers = users.filter((u) => u.team_id === team.id);
      if (teamMembers.length > 0) {
        const each = Math.floor(teamTotal / teamMembers.length);
        const rem = teamTotal % teamMembers.length;
        teamMembers.forEach((u, idx) => {
          updates.push({
            userId: u.id,
            teamId: team.id,
            target: each + (idx < rem ? 1 : 0),
          });
        });
      }
    });

    onSaveKpiTargets('Q4', 2026, updates);
  };

  // Hủy thay đổi: hoàn về savedInputs
  const handleCancelChanges = () => {
    setTeamInputs({ ...savedInputs });
    setSelectedGrowthPct(null);
    setGrowthAppliedNotice(null);
    setPendingGrowthPct(null);
    setHistoryBeforeGrowth(null);
  };

  // Toggle mở/đóng tháng trước
  const toggleMonth = (m: number) => {
    setOpenedMonths((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m].sort((a, b) => a - b)
    );
  };

  // Toggle mở/đóng quý trước
  const toggleQuarter = (q: number) => {
    setOpenedQuarters((prev) =>
      prev.includes(q) ? prev.filter((x) => x !== q) : [...prev, q].sort((a, b) => a - b)
    );
  };

  // Dữ liệu dòng tổng 事務代行 cho các tháng:
  const getGrandTotalMonth = (month: number): MonthData => {
    return rootTeams.reduce(
      (acc, t) => {
        if (month === 10) {
          const res = getTeamMonthData(t.id, 10).result;
          const kpi = teamInputs[t.id] ?? 0;
          return {
            kpi_manager: acc.kpi_manager + kpi,
            kpi_subleader: acc.kpi_subleader + kpi,
            result: acc.result + res,
          };
        }
        const d = getTeamMonthData(t.id, month);
        return {
          kpi_manager: acc.kpi_manager + d.kpi_manager,
          kpi_subleader: acc.kpi_subleader + d.kpi_subleader,
          result: acc.result + d.result,
        };
      },
      { kpi_manager: 0, kpi_subleader: 0, result: 0 }
    );
  };

  // Dữ liệu quý cho 1 team (Quý 3 = T7 + T8 + T9; Quý 4 = T10(đang nhập) + T11(0) + T12(0))
  const getQuarterData = (teamId: string, q: number): MonthData => {
    if (q === 3) {
      const m7 = getTeamMonthData(teamId, 7);
      const m8 = getTeamMonthData(teamId, 8);
      const m9 = getTeamMonthData(teamId, 9);
      const kpi = (m7.kpi_subleader || m7.kpi_manager) + (m8.kpi_subleader || m8.kpi_manager) + (m9.kpi_subleader || m9.kpi_manager);
      const res = m7.result + m8.result + m9.result;
      return { kpi_manager: kpi, kpi_subleader: kpi, result: res };
    }
    if (q === 4) {
      const kpiT10 = teamInputs[teamId] ?? 0;
      const resT10 = getTeamMonthData(teamId, 10).result;
      return { kpi_manager: kpiT10, kpi_subleader: kpiT10, result: resT10 };
    }
    return { kpi_manager: 0, kpi_subleader: 0, result: 0 };
  };

  // Dữ liệu dòng tổng 事務代行 cho 1 Quý
  const getGrandTotalQuarter = (q: number): MonthData => {
    return rootTeams.reduce(
      (acc, t) => {
        const d = getQuarterData(t.id, q);
        return {
          kpi_manager: acc.kpi_manager + d.kpi_manager,
          kpi_subleader: acc.kpi_subleader + d.kpi_subleader,
          result: acc.result + d.result,
        };
      },
      { kpi_manager: 0, kpi_subleader: 0, result: 0 }
    );
  };

  // Tính thay đổi so với T9
  const calcDiffT9 = (teamId: string, curKpi: number) => {
    const kpiT9 = getTeamMonthData(teamId, 9).kpi_subleader || getTeamMonthData(teamId, 9).kpi_manager || 0;
    const diff = curKpi - kpiT9;
    const pct = kpiT9 > 0 ? (diff / kpiT9) * 100 : 0;
    const isBigDiff = Math.abs(pct) >= 20;
    return { kpiT9, diff, pct, isBigDiff };
  };

  const grandT9 = getGrandTotalMonth(9);
  const grandCur10 = getGrandTotalMonth(10);
  const grandDiffT9 = grandCur10.kpi_manager - (grandT9.kpi_subleader || grandT9.kpi_manager);
  const grandPctT9 = (grandT9.kpi_subleader || grandT9.kpi_manager) > 0
    ? (grandDiffT9 / (grandT9.kpi_subleader || grandT9.kpi_manager)) * 100
    : 0;
  const isGrandBigDiff = Math.abs(grandPctT9) >= 20;

  // Render cột Thay đổi so với T9
  const renderChangeColumn = (diff: number, pct: number, kpiT9: number, isBigDiff: boolean) => {
    let changeLabel = 'Giữ nguyên';
    if (diff > 0) {
      changeLabel = `▲ ${formatVi(diff)} (+${Math.round(pct)}%)`;
    } else if (diff < 0) {
      changeLabel = `▼ ${formatVi(Math.abs(diff))} (−${Math.abs(Math.round(pct))}%)`;
    }

    return (
      <div className="flex flex-col items-center justify-center">
        <span className="text-[11px] text-[#64748B]">T9: {formatVi(kpiT9)}</span>
        <div className="flex items-center gap-1 font-bold text-xs text-[#1E293B] mt-0.5">
          <span>{changeLabel}</span>
          {isBigDiff && (
            <span
              title="Chênh lớn so với T9 – kiểm tra lại"
              className="inline-flex items-center text-red-600 cursor-help"
            >
              <AlertTriangle size={13} className="shrink-0 stroke-[2.5]" />
            </span>
          )}
        </div>
      </div>
    );
  };

  const bodyContent = (
    <div
      className={
        isEmbedded
          ? 'bg-white w-full flex flex-col font-sans'
          : 'bg-white border-2 border-[#1e3a8a] rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col overflow-hidden animate-in fade-in duration-150 font-sans'
      }
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Header (chỉ hiện khi mở dạng popup) */}
      {!isEmbedded && (
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#E2E8F0] bg-white">
          <div>
            <h2 className="text-base font-bold text-[#1e3a8a]">
              Thiết lập KPI chỉ tiêu theo Team (Master)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#64748B] hover:text-[#1e3a8a] p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* 2. Thanh công cụ */}
      <div className="px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-[#F1F5F9] bg-white">
        {/* Nhóm trái: Bộ lọc [Tháng | Quý] & Tăng nhanh (ở chế độ Tháng) */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Bộ lọc [Tháng | Quý] */}
          <div className="inline-flex p-0.5 bg-[#F1F5F9] rounded-lg border border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => {
                setPeriodType('month');
                setGrowthAppliedNotice(null);
                setPendingGrowthPct(null);
              }}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                periodType === 'month'
                  ? 'bg-white text-[#1e3a8a] shadow-xs'
                  : 'text-[#64748B] hover:text-[#1e3a8a]'
              }`}
            >
              Tháng
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriodType('quarter');
                setGrowthAppliedNotice(null);
                setPendingGrowthPct(null);
              }}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                periodType === 'quarter'
                  ? 'bg-white text-[#1e3a8a] shadow-xs font-bold'
                  : 'text-[#64748B] hover:text-[#1e3a8a]'
              }`}
            >
              Quý
            </button>
          </div>

          {/* Nút Tăng nhanh (chỉ ở chế độ Tháng) */}
          {periodType === 'month' && (
            <div className="flex items-center space-x-2">
              <span className="text-[#475569] font-medium text-xs">
                Tăng so với KPI T9:
              </span>
              <div className="flex items-center space-x-1.5">
                {[0, 5, 10, 15].map((pct) => {
                  const isSelected = selectedGrowthPct === pct;
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleGrowthClick(pct)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-xs'
                          : 'bg-white text-[#334155] border-[#CBD5E1] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      +{pct}%
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Nhóm phải: Xem thêm các tháng trước / quý trước */}
        <div className="flex items-center space-x-2">
          {periodType === 'month' ? (
            <>
              <span className="text-[#64748B] text-xs">Xem thêm các tháng trước:</span>
              <div className="flex items-center space-x-1.5">
                {[9, 8, 7].map((m) => {
                  const isOpened = openedMonths.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleMonth(m)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                        isOpened
                          ? 'bg-[#EEF4FF] border-[#1e3a8a] text-[#1e3a8a] font-bold shadow-2xs'
                          : 'bg-white border-[#CBD5E1] text-[#475569] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {isOpened ? `− Tháng ${m}` : `+ Tháng ${m}`}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <span className="text-[#64748B] text-xs">Xem thêm các quý trước:</span>
              <div className="flex items-center space-x-1.5">
                {[3].map((q) => {
                  const isOpened = openedQuarters.includes(q);
                  return (
                    <button
                      key={q}
                      type="button"
                      onClick={() => toggleQuarter(q)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                        isOpened
                          ? 'bg-[#EEF4FF] border-[#1e3a8a] text-[#1e3a8a] font-bold shadow-2xs'
                          : 'bg-white border-[#CBD5E1] text-[#475569] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {isOpened ? `− Quý ${q}` : `+ Quý ${q}`}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. Dải thông báo / Dải xác nhận tăng nhanh */}
      {pendingGrowthPct !== null && (
        <div className="px-6 py-2.5 bg-[#FFFBEB] border-b border-[#FDE68A] flex items-center justify-between text-xs text-[#92400E] animate-in fade-in duration-100">
          <div className="flex items-center space-x-2">
            <AlertTriangle size={15} className="text-[#D97706] shrink-0" />
            <span>
              Số đã nhập tay sẽ bị thay bằng <strong>+{pendingGrowthPct}%</strong> so với KPI T9. Tiếp tục?
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => applyGrowth(pendingGrowthPct)}
              className="px-3 py-1 bg-[#1e3a8a] text-white font-bold rounded-md hover:bg-[#152a65] transition-colors cursor-pointer"
            >
              Áp dụng
            </button>
            <button
              type="button"
              onClick={() => setPendingGrowthPct(null)}
              className="px-3 py-1 bg-white border border-[#CBD5E1] text-[#475569] font-medium rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Giữ số đã nhập
            </button>
          </div>
        </div>
      )}

      {growthAppliedNotice && pendingGrowthPct === null && (
        <div className="px-6 py-2.5 bg-[#EEF4FF] border-b border-[#C7D9F8] flex items-center justify-between text-xs text-[#1e3a8a] animate-in fade-in duration-100">
          <div className="flex items-center space-x-2">
            <Check size={14} className="text-[#1e3a8a] stroke-[2.5]" />
            <span>{growthAppliedNotice}</span>
          </div>
          {historyBeforeGrowth && (
            <button
              type="button"
              onClick={handleUndoGrowth}
              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white border border-[#1e3a8a] text-[#1e3a8a] font-bold rounded-md hover:bg-[#EEF4FF] transition-colors cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Hoàn tác</span>
            </button>
          )}
        </div>
      )}

      {/* 4. BẢNG DỮ LIỆU CHÍNH */}
      <div className="overflow-x-auto w-full">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E2E8F0] text-[#64748B]">
              {/* Cột Team */}
              <th className="py-3 px-6 text-left font-medium w-[130px] bg-white whitespace-nowrap">
                Team
              </th>

              {/* CHẾ ĐỘ THÁNG: Cụm các tháng trước đã mở (cũ -> mới) */}
              {periodType === 'month' &&
                openedMonths.map((m) => (
                  <th
                    key={m}
                    colSpan={3}
                    className="py-2.5 px-3 text-center border-l border-[#E2E8F0] bg-white whitespace-nowrap"
                  >
                    <div className="font-bold text-[#1E293B] text-xs">Tháng {m}/2026</div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-normal text-[#64748B] mt-1">
                      <span className="text-right">KPI</span>
                      <span className="text-right">Đạt</span>
                      <span className="text-right">Tỷ lệ</span>
                    </div>
                  </th>
                ))}

              {/* CHẾ ĐỘ THÁNG: Tháng hiện tại (Tháng 10/2026) */}
              {periodType === 'month' && (
                <th
                  colSpan={3}
                  className="py-2.5 px-4 text-center border-l border-[#E2E8F0] bg-[#F4F7FC] whitespace-nowrap"
                >
                  <div className="font-bold text-[#1e3a8a] text-xs">
                    Tháng 10/2026 <span className="font-normal text-[#64748B]">(hiện tại)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-medium text-[#64748B] mt-1">
                    <span className="text-center">Chỉ tiêu</span>
                    <span className="text-right">Đạt</span>
                    <span className="text-left pl-2">Tỷ lệ</span>
                  </div>
                </th>
              )}

              {/* CHẾ ĐỘ THÁNG: Cột Thay đổi so với T9 */}
              {periodType === 'month' && (
                <th className="py-3 px-6 text-center font-medium border-l border-[#E2E8F0] bg-white w-[160px] whitespace-nowrap">
                  Thay đổi so với T9
                </th>
              )}

              {/* CHẾ ĐỘ QUÝ: Cụm các quý trước đã mở (cũ -> mới) */}
              {periodType === 'quarter' &&
                openedQuarters.map((q) => (
                  <th
                    key={q}
                    colSpan={3}
                    className="py-2.5 px-4 text-center border-l border-[#E2E8F0] bg-white whitespace-nowrap"
                  >
                    <div className="font-bold text-[#1E293B] text-xs">Quý {q}/2026</div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-normal text-[#64748B] mt-1">
                      <span className="text-right">KPI</span>
                      <span className="text-right">Đạt</span>
                      <span className="text-right">Tỷ lệ</span>
                    </div>
                  </th>
                ))}

              {/* CHẾ ĐỘ QUÝ: Quý hiện tại (Quý 4/2026) */}
              {periodType === 'quarter' && (
                <th
                  colSpan={3}
                  className="py-2.5 px-4 text-center border-l border-[#E2E8F0] bg-[#F4F7FC] whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1.5 font-bold text-[#1e3a8a] text-xs">
                    <span>Quý 4/2026</span>
                    <span className="font-semibold text-[10px] text-[#1e3a8a] bg-[#E0ECFC] px-1.5 py-0.2 rounded-full">
                      Đến T10
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-medium text-[#64748B] mt-1">
                    <span className="text-right">KPI</span>
                    <span className="text-right">Đạt</span>
                    <span className="text-right">Tỷ lệ</span>
                  </div>
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F1F5F9] text-xs">
            {/* ========================================================
                HÀNG TỔNG: 事務代行 (Tổng các team tính ở client)
                ======================================================== */}
            <tr className="bg-white font-bold hover:bg-slate-50/60 transition-colors">
              {/* Tên hàng tổng */}
              <td className="py-3.5 px-6 font-bold text-sm text-[#1E293B] whitespace-nowrap">
                事務代行
              </td>

              {/* CHẾ ĐỘ THÁNG: Các tháng trước của dòng tổng */}
              {periodType === 'month' &&
                openedMonths.map((m) => {
                  const mData = getGrandTotalMonth(m);
                  const kpiVal = mData.kpi_subleader || mData.kpi_manager;
                  const { rate, label } = calcRate(mData.result, kpiVal);
                  const isRed = rate !== null && rate < 60; // Kỳ đã khép < 60% tô đỏ
                  return (
                    <React.Fragment key={m}>
                      <td className="py-3.5 px-3 text-right font-mono text-xs text-[#334155] border-l border-[#F1F5F9]">
                        {formatVi(kpiVal)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-xs text-[#334155]">
                        {formatVi(mData.result)}
                      </td>
                      <td className={`py-3.5 px-3 text-right font-bold text-xs ${isRed ? 'text-red-600' : 'text-[#1E293B]'}`}>
                        {label}
                      </td>
                    </React.Fragment>
                  );
                })}

              {/* CHẾ ĐỘ THÁNG: Tháng 10 của dòng tổng */}
              {periodType === 'month' && (
                <>
                  {/* Chỉ tiêu tổng */}
                  <td className="py-3.5 px-4 text-center font-bold font-mono text-sm text-[#1e3a8a] bg-[#F4F7FC] border-l border-[#E2E8F0] w-[240px]">
                    {formatVi(grandCur10.kpi_manager)}
                  </td>
                  {/* Đạt tổng */}
                  <td className="py-3.5 px-4 text-right font-mono text-sm text-[#334155] bg-[#F4F7FC]">
                    {formatVi(grandCur10.result)}
                  </td>
                  {/* Tỷ lệ tổng */}
                  <td className="py-3.5 px-4 bg-[#F4F7FC] w-[140px]">
                    {(() => {
                      const { rate, label } = calcRate(grandCur10.result, grandCur10.kpi_manager);
                      return (
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-[#1E293B]">{label}</span>
                          <div className="w-20 h-1.5 bg-[#CBD5E1] rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-[#1e3a8a] rounded-full transition-all duration-200"
                              style={{ width: `${Math.min(100, rate || 0)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                </>
              )}

              {/* CHẾ ĐỘ THÁNG: Thay đổi so với T9 của dòng tổng */}
              {periodType === 'month' && (
                <td className="py-3.5 px-6 text-center border-l border-[#E2E8F0]">
                  {renderChangeColumn(
                    grandDiffT9,
                    grandPctT9,
                    grandT9.kpi_subleader || grandT9.kpi_manager,
                    isGrandBigDiff
                  )}
                </td>
              )}

              {/* CHẾ ĐỘ QUÝ: Các quý trước của dòng tổng */}
              {periodType === 'quarter' &&
                openedQuarters.map((q) => {
                  const qData = getGrandTotalQuarter(q);
                  const kpiVal = qData.kpi_subleader || qData.kpi_manager;
                  const { rate, label } = calcRate(qData.result, kpiVal);
                  const isRed = rate !== null && rate < 60;
                  return (
                    <React.Fragment key={q}>
                      <td className="py-3.5 px-4 text-right font-mono text-xs text-[#334155] border-l border-[#F1F5F9]">
                        {formatVi(kpiVal)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs text-[#334155]">
                        {formatVi(qData.result)}
                      </td>
                      <td className={`py-3.5 px-4 text-right font-bold text-xs ${isRed ? 'text-red-600' : 'text-[#1E293B]'}`}>
                        {label}
                      </td>
                    </React.Fragment>
                  );
                })}

              {/* CHẾ ĐỘ QUÝ: Quý 4 của dòng tổng */}
              {periodType === 'quarter' && (
                <>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-[#1e3a8a] bg-[#F4F7FC] border-l border-[#E2E8F0]">
                    {formatVi(getGrandTotalQuarter(4).kpi_manager)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-sm text-[#334155] bg-[#F4F7FC]">
                    {formatVi(getGrandTotalQuarter(4).result)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-sm text-[#1E293B] bg-[#F4F7FC]">
                    {calcRate(getGrandTotalQuarter(4).result, getGrandTotalQuarter(4).kpi_manager).label}
                  </td>
                </>
              )}
            </tr>

            {/* ========================================================
                HÀNG CÁC TEAM: 1課, 2課, 3課, GS
                ======================================================== */}
            {rootTeams.map((team, teamIndex) => {
              const currentInput = teamInputs[team.id] ?? 0;
              const isModified = currentInput !== (savedInputs[team.id] ?? 0);
              const m10Data = getTeamMonthData(team.id, 10);
              const { rate: rate10, label: label10 } = calcRate(m10Data.result, currentInput);
              const { kpiT9, diff, pct, isBigDiff } = calcDiffT9(team.id, currentInput);

              return (
                <tr
                  key={team.id}
                  className={`transition-colors hover:bg-slate-50/60 ${
                    isModified ? 'bg-[#F0F5FC]/60' : 'bg-white'
                  }`}
                >
                  {/* Tên team kèm nhãn "Đã sửa" nếu có */}
                  <td className="py-3 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-[#1E293B]">{team.name}</span>
                      {isModified && (
                        <span className="text-[10px] font-semibold text-[#1e3a8a] bg-[#E0ECFC] px-1.5 py-0.5 rounded">
                          Đã sửa
                        </span>
                      )}
                    </div>
                  </td>

                  {/* CHẾ ĐỘ THÁNG: Các tháng trước đã mở */}
                  {periodType === 'month' &&
                    openedMonths.map((m) => {
                      const mData = getTeamMonthData(team.id, m);
                      const kpiVal = mData.kpi_subleader || mData.kpi_manager;
                      const { rate, label } = calcRate(mData.result, kpiVal);
                      const isRed = rate !== null && rate < 60; // Kỳ đã khép < 60% tô đỏ
                      return (
                        <React.Fragment key={m}>
                          <td className="py-3 px-3 text-right font-mono text-xs text-[#334155] border-l border-[#F1F5F9]">
                            {formatVi(kpiVal)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-xs text-[#334155]">
                            {formatVi(mData.result)}
                          </td>
                          <td className={`py-3 px-3 text-right font-bold text-xs ${isRed ? 'text-red-600' : 'text-[#1E293B]'}`}>
                            {label}
                          </td>
                        </React.Fragment>
                      );
                    })}

                  {/* CHẾ ĐỘ THÁNG: Tháng 10 (hiện tại) */}
                  {periodType === 'month' && (
                    <>
                      {/* Ô nhập chỉ tiêu: cao ~52px, chữ to, nút -/+, format dấu chấm, Enter nhảy ô kế tiếp */}
                      <td className="py-2.5 px-4 bg-[#F4F7FC] border-l border-[#E2E8F0] w-[240px]">
                        <div className="flex items-center justify-between border border-[#CBD5E1] rounded-xl bg-white px-2 h-[50px] w-[210px] mx-auto shadow-2xs focus-within:border-[#1e3a8a] focus-within:ring-1 focus-within:ring-[#1e3a8a] transition-all">
                          <button
                            type="button"
                            onClick={() => handleStep(team.id, -100)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#1e3a8a] hover:bg-[#EEF4FF] transition-colors cursor-pointer select-none shrink-0"
                            title="Giảm 100"
                          >
                            <Minus size={16} className="stroke-[2.5]" />
                          </button>
                          <input
                            ref={(el) => {
                              inputRefs.current[team.id] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            value={formatVi(currentInput)}
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => handleKeyDown(e, teamIndex)}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, '');
                              handleInputChange(team.id, parseInt(raw, 10) || 0);
                            }}
                            className="w-24 text-center font-bold font-mono text-base text-[#1E293B] border-0 focus:outline-hidden bg-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => handleStep(team.id, 100)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#1e3a8a] hover:bg-[#EEF4FF] transition-colors cursor-pointer select-none shrink-0"
                            title="Tăng 100"
                          >
                            <Plus size={16} className="stroke-[2.5]" />
                          </button>
                        </div>
                      </td>

                      {/* Đạt đến hiện tại */}
                      <td className="py-3 px-4 text-right font-mono text-xs text-[#334155] bg-[#F4F7FC]">
                        {formatVi(m10Data.result)}
                      </td>

                      {/* Tỷ lệ kèm thanh tiến độ mảnh */}
                      <td className="py-3 px-4 bg-[#F4F7FC] w-[140px]">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-[#1E293B]">{label10}</span>
                          <div className="w-20 h-1.5 bg-[#CBD5E1] rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-[#1e3a8a] rounded-full transition-all duration-200"
                              style={{ width: `${Math.min(100, rate10 || 0)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </>
                  )}

                  {/* CHẾ ĐỘ THÁNG: Thay đổi so với T9 */}
                  {periodType === 'month' && (
                    <td className="py-3 px-6 text-center border-l border-[#E2E8F0]">
                      {renderChangeColumn(diff, pct, kpiT9, isBigDiff)}
                    </td>
                  )}

                  {/* CHẾ ĐỘ QUÝ: Các quý trước */}
                  {periodType === 'quarter' &&
                    openedQuarters.map((q) => {
                      const qData = getQuarterData(team.id, q);
                      const kpiVal = qData.kpi_subleader || qData.kpi_manager;
                      const { rate, label } = calcRate(qData.result, kpiVal);
                      const isRed = rate !== null && rate < 60;
                      return (
                        <React.Fragment key={q}>
                          <td className="py-3 px-4 text-right font-mono text-xs text-[#334155] border-l border-[#F1F5F9]">
                            {formatVi(kpiVal)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs text-[#334155]">
                            {formatVi(qData.result)}
                          </td>
                          <td className={`py-3 px-4 text-right font-bold text-xs ${isRed ? 'text-red-600' : 'text-[#1E293B]'}`}>
                            {label}
                          </td>
                        </React.Fragment>
                      );
                    })}

                  {/* CHẾ ĐỘ QUÝ: Quý 4 */}
                  {periodType === 'quarter' && (
                    <>
                      <td className="py-3 px-4 text-right font-mono font-bold text-xs text-[#1e3a8a] bg-[#F4F7FC] border-l border-[#E2E8F0]">
                        {formatVi(getQuarterData(team.id, 4).kpi_manager)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-[#334155] bg-[#F4F7FC]">
                        {formatVi(getQuarterData(team.id, 4).result)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-xs text-[#1E293B] bg-[#F4F7FC]">
                        {calcRate(getQuarterData(team.id, 4).result, getQuarterData(team.id, 4).kpi_manager).label}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. Dòng hướng dẫn dưới bảng (chỉ ở chế độ Tháng) */}
      {periodType === 'month' && (
        <div className="px-6 py-3 text-xs text-[#64748B] border-t border-[#F1F5F9]">
          Sau khi lưu, admin từng team sẽ thấy chỉ tiêu của team mình và tự chia cho nhân sự. Nhân sự nhận KPI khi admin hoàn tất.
        </div>
      )}

      {/* 6. Chân trang */}
      <div className="px-6 py-3.5 flex items-center justify-between border-t border-[#E2E8F0] bg-white">
        {/* Bên trái: Trạng thái */}
        <div className="text-xs text-[#64748B] flex items-center gap-2">
          {hasUserEdited ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#1e3a8a] animate-pulse" />
              <span className="text-[#1e3a8a] font-medium">
                Có {editedTeamsCount} team đã thay đổi chưa lưu
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-[#94A3B8]" />
              <span>Đã lưu bản gần nhất lúc {lastSavedTime}</span>
            </>
          )}
        </div>

        {/* Bên phải: Nút Hủy thay đổi và Lưu */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleCancelChanges}
            disabled={!hasUserEdited}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              hasUserEdited
                ? 'bg-white border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC]'
                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8] cursor-not-allowed opacity-60'
            }`}
          >
            Hủy thay đổi
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasUserEdited}
            className={`px-5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs ${
              hasUserEdited
                ? 'bg-[#1e3a8a] hover:bg-[#152a65] text-white hover:shadow-sm'
                : 'bg-[#CBD5E1] text-[#64748B] cursor-not-allowed opacity-75'
            }`}
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );

  if (isEmbedded) {
    return bodyContent;
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      {bodyContent}
    </div>
  );
};
