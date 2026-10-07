import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Award,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Users,
  Clock,
  Sparkles,
  Target,
  AlertTriangle,
  FolderGit2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { KpiRecord, RANK_STYLE_CONFIG } from '../../types';
import { UserKpiDetailModal } from '../kpi/UserKpiDetailModal';

export const HomeDashboard: React.FC = () => {
  const {
    currentUser,
    teams,
    users,
    kpiRecords,
    awardProposals,
    awardCategories,
    mendanRecords,
    quarterConfigs,
    setActiveTab,
  } = useApp();

  // State to open User KPI drill-down modal directly from dashboard
  const [selectedKpiRecord, setSelectedKpiRecord] = useState<KpiRecord | null>(null);

  // Helper cleanName
  const cleanName = (name: string) => name.replace(/\s*\([^)]*\)/g, '').trim();

  // 1. Current active quarter or latest configured quarter
  const activeQuarter = useMemo(() => {
    return quarterConfigs.find((q) => q.is_active)?.id || 'Q1';
  }, [quarterConfigs]);

  // 2. Personal KPI of the logged in user
  const personalKpiRecord = useMemo(() => {
    // Priority: current active quarter, else latest record for this user
    return (
      kpiRecords.find(
        (r) => r.user_id === currentUser.id && r.quarter_id === activeQuarter && r.year === 2026
      ) ||
      kpiRecords.find((r) => r.user_id === currentUser.id && r.year === 2026) ||
      kpiRecords.find((r) => r.user_id === currentUser.id) ||
      null
    );
  }, [kpiRecords, currentUser.id, activeQuarter]);

  // Personal KPI metrics calculation
  const personalTarget = personalKpiRecord?.target || 0;
  const personalAchieved = personalKpiRecord?.achieved || 0;
  const personalRate =
    personalTarget > 0 ? (personalAchieved / personalTarget) * 100 : personalAchieved > 0 ? 100 : 0;
  const personalMiss = personalKpiRecord?.miss_count ?? 0;
  const personalLate = personalKpiRecord?.late_count ?? 0;
  const personalProjects = personalKpiRecord?.projects || [];

  const currentUserTeam = teams.find((t) => t.id === currentUser.team_id);

  // 3. Bảng Vinh Danh giải thưởng quý (quý gần nhất được master công khai)
  const publishedQuarters = useMemo(() => {
    return quarterConfigs.filter((q) => q.is_published_awards).map((q) => q.id);
  }, [quarterConfigs]);

  // Filter approved and published award proposals
  const latestPublishedAwards = useMemo(() => {
    const published = awardProposals.filter(
      (p) =>
        p.status === 'approved' &&
        (p.is_published || publishedQuarters.includes(p.quarter_id))
    );

    if (published.length === 0) return { quarterId: activeQuarter, awards: [] };

    // Determine the latest quarter among published proposals (e.g., 'Q1' vs 'Q4')
    const preferredOrder = ['Q1', 'Q4', 'Q3', 'Q2'];
    let chosenQuarter = published[0].quarter_id;
    for (const qId of preferredOrder) {
      if (published.some((p) => p.quarter_id === qId)) {
        chosenQuarter = qId;
        break;
      }
    }

    const filtered = published.filter((p) => p.quarter_id === chosenQuarter);
    return { quarterId: chosenQuarter, awards: filtered };
  }, [awardProposals, publishedQuarters, activeQuarter]);

  // 4. Danh sách hàng chờ mendan (bản thân sẽ có màu đậm hơn)
  const mendanQueue = useMemo(() => {
    // Take all pending / scheduled / pre_mendan appointments, sorted by scheduled date
    const list = [...mendanRecords].filter((m) => m.status !== 'completed');

    // Sort by scheduled date
    list.sort((a, b) => {
      const dateA = new Date(a.scheduled_date || '2099-01-01').getTime();
      const dateB = new Date(b.scheduled_date || '2099-01-01').getTime();
      return dateA - dateB;
    });

    // If user's own mendan is completed or in past, also check if user has a record to showcase
    const userHasPending = list.some((m) => m.user_id === currentUser.id);
    if (!userHasPending) {
      const userCompletedMendan = mendanRecords.find(
        (m) => m.user_id === currentUser.id && m.status === 'completed'
      );
      if (userCompletedMendan) {
        // Prepend so user always sees their own status clearly
        return [userCompletedMendan, ...list.slice(0, 5)];
      }
    }

    return list.slice(0, 6);
  }, [mendanRecords, currentUser.id]);

  return (
    <div className="space-y-6">
      {/* 1. Top Welcome Banner */}
      <div className="bg-white border border-[#E7E7E4] border-l-[4px] border-l-[#24487c] rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#24487c] bg-[#7c9cd0]/15 px-2.5 py-0.5 rounded border border-[#7c9cd0]/30 inline-block mb-1">
            DYM 内部事務代行 • Hệ Thống Quản Lý Nội Bộ v2.0
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1C1A] mt-1 flex items-center space-x-2">
            <span>Xin chào, {cleanName(currentUser.full_name)}</span>
            {currentUser.rank && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded border ml-2"
                style={{
                  backgroundColor: RANK_STYLE_CONFIG[currentUser.rank]?.bg || '#DCE8F5',
                  color: RANK_STYLE_CONFIG[currentUser.rank]?.text || '#1E3A5F',
                  borderColor: RANK_STYLE_CONFIG[currentUser.rank]?.border || '#B8D1EB',
                }}
              >
                Cấp bậc: {currentUser.rank}
              </span>
            )}
          </h1>
          <p className="text-xs text-[#4A4A46] mt-1">
            Tài khoản đang đăng nhập với vai trò{' '}
            <strong className="font-mono uppercase text-[#24487c] bg-[#7c9cd0]/10 px-1.5 py-0.2 rounded border border-[#7c9cd0]/20">
              [{currentUser.role}]
            </strong>{' '}
            • {currentUserTeam?.name || 'Khối Sự Vụ'} • Mã NV:{' '}
            <span className="font-mono font-semibold text-[#1C1C1A]">
              {currentUser.employee_code}
            </span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {personalKpiRecord && (
            <button
              onClick={() => setSelectedKpiRecord(personalKpiRecord)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#24487c] hover:bg-[#1b365d] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Target size={14} />
              <span>Xem Đề Án & KPI Chi Tiết</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. THÔNG SỐ KPI CÁ NHÂN (Hiển thị thông số KPI của cá nhân - Thay thế phần KPI bộ phận cũ) */}
      <div className="bg-white border-2 border-[#7c9cd0]/40 rounded-xl p-6 shadow-sm overflow-hidden relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F0F0EE] gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#24487c] text-white flex items-center justify-center shrink-0">
              <TrendingUp size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1C1C1A] uppercase tracking-wider flex items-center space-x-2">
                <span>Chỉ Số Hiệu Suất KPI Cá Nhân</span>
                <span className="text-[11px] font-bold text-[#24487c] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                  {personalKpiRecord?.period_label || `Quý ${activeQuarter}/2026`}
                </span>
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Chỉ số năng suất, chất lượng xử lý hồ sơ và các đề án cải tiến của riêng bạn
              </p>
            </div>
          </div>

          {personalKpiRecord && (
            <button
              type="button"
              onClick={() => setSelectedKpiRecord(personalKpiRecord)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#24487c] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] transition-colors cursor-pointer self-start sm:self-auto"
            >
              <span>Xem Chi Tiết Hồ Sơ KPI</span>
              <ExternalLink size={12} />
            </button>
          )}
        </div>

        {personalKpiRecord ? (
          <div className="mt-5 space-y-5">
            {/* KPI Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Card 1: Tỷ lệ hoàn thành */}
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    Tỷ Lệ Hoàn Thành
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#1C1C1A] mt-1.5 flex items-baseline space-x-1">
                    <span
                      className={
                        personalRate >= 100
                          ? 'text-[#15803D]'
                          : personalRate >= 90
                          ? 'text-[#24487c]'
                          : 'text-[#D97706]'
                      }
                    >
                      {personalRate.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        personalRate >= 102
                          ? 'bg-gradient-to-r from-[#15803D] to-[#22C55E]'
                          : personalRate >= 100
                          ? 'bg-[#15803D]'
                          : 'bg-[#24487c]'
                      }`}
                      style={{ width: `${Math.min(personalRate, 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-[#64748B] mt-1 flex justify-between font-medium">
                    <span>Mục tiêu: 100%</span>
                    <span
                      className={
                        personalRate >= 100
                          ? 'text-[#15803D] font-bold'
                          : 'text-[#D97706] font-bold'
                      }
                    >
                      {personalRate >= 100
                        ? '✓ Đạt chỉ tiêu'
                        : `Còn thiếu ${(100 - personalRate).toFixed(1)}%`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Sản lượng đạt được */}
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    Sản Lượng Đã Đạt
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#24487c] mt-1.5">
                    {personalAchieved.toLocaleString('de-DE')}{' '}
                    <span className="text-xs text-[#64748B] font-normal">
                      {personalKpiRecord.unit || 'task'}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-[#475569] mt-3 pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                  <span>Chỉ tiêu giao:</span>
                  <strong className="font-mono text-[#1E293B]">
                    {personalTarget.toLocaleString('de-DE')} {personalKpiRecord.unit || 'task'}
                  </strong>
                </div>
              </div>

              {/* Card 3: Chất lượng xử lý (Miss & Trễ) */}
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    Kiểm Soát Chất Lượng
                  </div>
                  <div className="mt-1.5 flex items-center space-x-3">
                    <div>
                      <div className="text-xs text-[#64748B]">Số lỗi (Miss):</div>
                      <div
                        className={`text-xl font-bold font-mono ${
                          personalMiss === 0 ? 'text-[#15803D]' : 'text-[#DC2626]'
                        }`}
                      >
                        {personalMiss === 0 ? '0 Miss ✓' : `${personalMiss} lỗi`}
                      </div>
                    </div>
                    <div className="h-7 w-px bg-[#CBD5E1]" />
                    <div>
                      <div className="text-xs text-[#64748B]">Trễ hạn:</div>
                      <div
                        className={`text-xl font-bold font-mono ${
                          personalLate === 0 ? 'text-[#15803D]' : 'text-[#D97706]'
                        }`}
                      >
                        {personalLate === 0 ? '0 Trễ ✓' : `${personalLate} lần`}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-[#64748B] mt-3 pt-2 border-t border-[#E2E8F0]">
                  {personalMiss === 0 && personalLate === 0
                    ? 'Chất lượng xử lý chuẩn mực Zero-Miss'
                    : 'Cần duy trì Hou-Ren-So và soát kỹ tài liệu'}
                </div>
              </div>

              {/* Card 4: Đề án & Cải tiến tham gia */}
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                    Đề Án & Sáng Kiến
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#1C1C1A] mt-1.5 flex items-center space-x-1.5">
                    <FolderGit2 size={22} className="text-[#24487c]" />
                    <span>{personalProjects.length}</span>
                    <span className="text-xs text-[#64748B] font-normal">đề án</span>
                  </div>
                </div>
                <div className="text-[11px] text-[#475569] mt-3 pt-2 border-t border-[#E2E8F0] line-clamp-1">
                  {personalProjects.length > 0
                    ? `Gần nhất: ${personalProjects[0].name}`
                    : 'Chưa đăng ký đề án kỳ này'}
                </div>
              </div>
            </div>

            {/* Manager feedback / notes if available */}
            {personalKpiRecord.notes && (
              <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs flex items-start space-x-2.5">
                <CheckCircle2 size={16} className="text-[#15803D] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold text-[#1E293B]">Đánh giá & Ghi nhận từ Quản lý: </span>
                  <span className="text-[#475569] italic">"{personalKpiRecord.notes}"</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 p-5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-center text-xs text-[#64748B]">
            <Users size={24} className="mx-auto mb-2 text-[#94A3B8]" />
            <p className="font-semibold text-[#1E293B]">
              Tài khoản hiện tại chưa được giao chỉ tiêu KPI riêng lẻ cho kỳ này.
            </p>
            <p className="mt-1">
              Bạn có thể sử dụng công cụ chuyển đổi tài khoản ở góc trái thanh điều hướng để xem
              hồ sơ mẫu của các chuyên viên và nhân sự khác.
            </p>
          </div>
        )}
      </div>

      {/* 3 & 4: HAI KHỐI CHÍNH CẠNH NHAU (BẢNG VINH DANH & HÀNG CHỜ MENDAN) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KHỐI 1: BẢNG VINH DANH GIẢI THƯỞNG QUÝ (Quý gần nhất được Master công khai) */}
        <div className="bg-white border border-[#E7E7E4] rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-[#F0F0EE]">
              <div>
                <h2 className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider flex items-center space-x-1.5">
                  <Award size={16} className="text-[#D97706]" />
                  <span>
                    Bảng Vinh Danh Khen Thưởng Quý {latestPublishedAwards.quarterId}/2026
                  </span>
                </h2>
                <p className="text-[11px] text-[#64748B] mt-0.5 flex items-center space-x-1">
                  <ShieldCheck size={12} className="text-[#15803D]" />
                  <span>Quý gần nhất đã được Master phê duyệt & công bố chính thức</span>
                </p>
              </div>
              <button
                onClick={() => setActiveTab('awards')}
                className="text-xs font-semibold text-[#24487c] hover:underline cursor-pointer flex items-center space-x-0.5 whitespace-nowrap ml-2"
              >
                <span>Xem Bảng Vàng</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {latestPublishedAwards.awards.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#8A8A85]">
                  <Award size={28} className="mx-auto mb-2 text-[#CBD5E1]" />
                  <div className="font-semibold text-[#1C1C1A]">Chưa có giải thưởng công bố</div>
                  <div className="text-[11px] text-[#8A8A85] mt-1">
                    Master sẽ công bố danh sách vinh danh sau khi hoàn tất xét duyệt cuối kỳ.
                  </div>
                </div>
              ) : (
                latestPublishedAwards.awards.map((prop) => {
                  const honoree = users.find((u) => u.id === prop.user_id);
                  const honoreeTeam = teams.find((t) => t.id === honoree?.team_id);
                  const cat = awardCategories.find((c) => c.id === prop.category_id);

                  // Distinguish MVP vs others
                  const isMvp = prop.category_id === 'cat-mvp';

                  return (
                    <div
                      key={prop.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-start space-x-3.5 ${
                        isMvp
                          ? 'bg-gradient-to-r from-[#FEF9C3]/50 to-[#FFFBEB] border-[#FDE047] shadow-2xs'
                          : 'bg-[#FAFAF9] hover:bg-white border-[#E7E7E4]'
                      }`}
                    >
                      <img
                        src={
                          honoree?.avatar_url ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                        }
                        alt={honoree?.full_name}
                        className={`w-11 h-11 rounded-full object-cover shrink-0 border-2 ${
                          isMvp ? 'border-[#F59E0B]' : 'border-white'
                        }`}
                      />
                      <div className="flex-1 text-xs min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-[#1C1C1A]">
                              {cleanName(honoree?.full_name || 'Nhân sự')}
                            </span>
                            <span className="text-[10px] text-[#8A8A85] font-mono">
                              ({honoree?.employee_code})
                            </span>
                            <span className="text-[10px] text-[#64748B]">
                              • {honoreeTeam?.name || 'Khối Sự Vụ'}
                            </span>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                              isMvp
                                ? 'bg-[#FEF3C7] text-[#B45309] border-[#FCD34D]'
                                : 'bg-[#EFF6FF] text-[#24487c] border-[#BFDBFE]'
                            }`}
                          >
                            {cat?.name || 'Giải Thưởng Quý'}
                          </span>
                        </div>

                        <p className="text-[#4A4A46] mt-1.5 text-[11px] leading-relaxed line-clamp-2 italic">
                          "{prop.reason}"
                        </p>

                        {prop.feedback && (
                          <div className="mt-1 text-[10px] text-[#15803D] font-medium flex items-center space-x-1">
                            <Check size={11} />
                            <span>Master phê duyệt: {prop.feedback}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F0F0EE] flex items-center justify-between text-xs text-[#8A8A85]">
            <span>Tổng cộng: {latestPublishedAwards.awards.length} cá nhân được vinh danh</span>
            <button
              type="button"
              onClick={() => setActiveTab('awards')}
              className="font-semibold text-[#24487c] hover:underline cursor-pointer"
            >
              Xem danh sách đầy đủ →
            </button>
          </div>
        </div>

        {/* KHỐI 2: DANH SÁCH HÀNG CHỜ MENDAN (Bản thân sẽ có màu đậm hơn) */}
        <div className="bg-white border border-[#E7E7E4] rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-[#F0F0EE]">
              <div>
                <h2 className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider flex items-center space-x-1.5">
                  <Clock size={16} className="text-[#24487c]" />
                  <span>Danh Sách Hàng Chờ Mendan (面談)</span>
                </h2>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Lịch phỏng vấn trao đổi định hướng năng lực cùng cấp quản lý
                </p>
              </div>
              <button
                onClick={() => setActiveTab('kpi')}
                className="text-xs font-semibold text-[#24487c] hover:underline cursor-pointer flex items-center space-x-0.5 whitespace-nowrap ml-2"
              >
                <span>Xem Tất Cả</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="space-y-2.5 mt-4">
              {mendanQueue.length === 0 ? (
                <div className="py-10 text-center text-xs text-[#8A8A85]">
                  <Calendar size={28} className="mx-auto mb-2 text-[#CBD5E1]" />
                  <div className="font-semibold text-[#1C1C1A]">
                    Hiện không có lịch Mendan chờ xử lý
                  </div>
                  <div className="text-[11px] text-[#8A8A85] mt-1">
                    Toàn bộ các phiên trao đổi định kỳ của quý đã được hoàn tất hoặc chưa lên lịch.
                  </div>
                </div>
              ) : (
                mendanQueue.map((m) => {
                  const member = users.find((u) => u.id === m.user_id);
                  const memberTeam = teams.find((t) => t.id === m.team_id);
                  const evaluator = users.find((u) => u.id === m.evaluator_id);

                  // ĐẶC BIỆT: Bản thân sẽ có màu đậm hơn theo đúng yêu cầu người dùng
                  const isCurrentUser = m.user_id === currentUser.id;

                  return (
                    <div
                      key={m.id}
                      onClick={() => setActiveTab('mendan')}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                        isCurrentUser
                          ? 'bg-[#1e3a5f] text-white border-[#0f172a] shadow-md ring-2 ring-[#7c9cd0] hover:bg-[#162c48]'
                          : 'bg-white hover:bg-[#F8FAFC] border-[#E2E8F0] text-[#1E293B]'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={
                            member?.avatar_url ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                          }
                          alt={member?.full_name}
                          className={`w-9 h-9 rounded-full object-cover shrink-0 border ${
                            isCurrentUser ? 'border-white/60' : 'border-[#E2E8F0]'
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`font-bold truncate ${
                                isCurrentUser ? 'text-white' : 'text-[#0F172A]'
                              }`}
                            >
                              {cleanName(member?.full_name || 'Nhân sự')}
                            </span>
                            <span
                              className={`text-[10px] font-mono ${
                                isCurrentUser ? 'text-white/70' : 'text-[#64748B]'
                              }`}
                            >
                              ({member?.employee_code})
                            </span>
                            {isCurrentUser && (
                              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-[#F59E0B] text-black shrink-0 animate-pulse">
                                ★ Lịch Của Bạn
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-[11px] truncate mt-0.5 ${
                              isCurrentUser ? 'text-white/80' : 'text-[#64748B]'
                            }`}
                          >
                            <span>{memberTeam?.name || 'Khối Sự Vụ'}</span>
                            <span className="mx-1">•</span>
                            <span>Người phỏng vấn: {cleanName(evaluator?.full_name || 'Quản lý')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Date and status */}
                      <div className="text-right shrink-0 ml-3">
                        <div
                          className={`text-xs font-bold font-mono ${
                            isCurrentUser ? 'text-white' : 'text-[#24487c]'
                          }`}
                        >
                          {m.scheduled_date || 'Chưa định ngày'}
                        </div>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                            isCurrentUser
                              ? 'bg-white/20 text-white border-white/30'
                              : m.status === 'pre_mendan'
                              ? 'bg-[#FEF3C7] text-[#B45309] border-[#FCD34D]'
                              : m.status === 'completed'
                              ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                              : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
                          }`}
                        >
                          {m.status === 'pre_mendan'
                            ? 'Chuẩn bị Pre-notes'
                            : m.status === 'completed'
                            ? 'Đã hoàn tất'
                            : 'Chờ đến lượt'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F0F0EE] flex items-center justify-between text-xs text-[#8A8A85]">
            <span>Tổng cộng: {mendanQueue.length} phiên đang trong hàng chờ</span>
            <button
              type="button"
              onClick={() => setActiveTab('mendan')}
              className="font-semibold text-[#24487c] hover:underline cursor-pointer"
            >
              Vào quản lý Mendan →
            </button>
          </div>
        </div>
      </div>

      {/* Drill-down Modal for Personal KPI & Projects */}
      {selectedKpiRecord && (
        <UserKpiDetailModal
          record={selectedKpiRecord}
          user={currentUser}
          team={currentUserTeam || null}
          allRecords={kpiRecords}
          allUsers={users}
          onClose={() => setSelectedKpiRecord(null)}
        />
      )}
    </div>
  );
};
