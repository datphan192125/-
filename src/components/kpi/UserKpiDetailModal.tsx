import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  Briefcase,
  Award,
  ExternalLink,
  Plus,
  Trash2,
  Edit3,
  Save,
  RotateCcw,
  Check,
  Link as LinkIcon,
  Users,
  ChevronLeft,
  ChevronRight,
  Eye,
  Maximize2,
  Minimize2,
  Copy,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { KpiRecord, User, Team, EmployeeRank, ALL_RANKS, RANK_STYLE_CONFIG, ProjectDetail } from '../../types';
import { useApp } from '../../context/AppContext';

interface UserKpiDetailModalProps {
  record: KpiRecord | null;
  user: User | null;
  team: Team | null;
  allRecords?: KpiRecord[];
  allUsers?: User[];
  onSelectUser?: (user: User, record: KpiRecord) => void;
  onClose: () => void;
}

import { cleanName } from '../../utils/format';

export const UserKpiDetailModal: React.FC<UserKpiDetailModalProps> = ({
  record: initialRecord,
  user: initialUser,
  team: initialTeam,
  allRecords,
  allUsers,
  onSelectUser,
  onClose,
}) => {
  const {
    currentUser,
    users,
    teams,
    kpiRecords,
    visibleUsers,
    isLeaderOrAdmin,
    isAdmin,
    isMaster,
    canViewTeam,
    updateUser,
    updateKpiRecord,
    awardProposals,
    awardCategories,
  } = useApp();

  const [activeUser, setActiveUser] = useState<User | null>(initialUser);
  const [activeRecord, setActiveRecord] = useState<KpiRecord | null>(initialRecord);

  useEffect(() => {
    setActiveUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    setActiveRecord(initialRecord);
  }, [initialRecord]);

  const [isEditingProjects, setIsEditingProjects] = useState(false);
  const [projectList, setProjectList] = useState<ProjectDetail[]>([]);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [selectedProjectModal, setSelectedProjectModal] = useState<ProjectDetail | null>(null);
  const [isExpandedAllProjects, setIsExpandedAllProjects] = useState(false);
  const [copiedProjectLink, setCopiedProjectLink] = useState(false);

  // New project form state
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Chủ trì');
  const [newStatus, setNewStatus] = useState('Đang triển khai');
  const [newDescription, setNewDescription] = useState('');
  const [newLink, setNewLink] = useState('');

  // Sync project list when record changes
  useEffect(() => {
    if (activeRecord) {
      setProjectList(activeRecord.projects ? [...activeRecord.projects] : []);
    }
    setIsEditingProjects(false);
    setEditingProjectId(null);
  }, [activeRecord]);

  // Candidate users for Quick Switcher
  const navigableUsers = useMemo(() => {
    if (allUsers && allUsers.length > 0) return allUsers;
    let list = visibleUsers.length > 0 ? visibleUsers : users;
    if (!isMaster) {
      list = list.filter((u) => isAdmin || canViewTeam(u.team_id));
    }
    return list;
  }, [allUsers, visibleUsers, users, isMaster, isAdmin, canViewTeam]);

  const currentUserIndex = useMemo(() => {
    if (!activeUser) return -1;
    return navigableUsers.findIndex((u) => u.id === activeUser.id);
  }, [navigableUsers, activeUser]);

  const prevUser = currentUserIndex > 0 ? navigableUsers[currentUserIndex - 1] : null;
  const nextUser =
    currentUserIndex >= 0 && currentUserIndex < navigableUsers.length - 1
      ? navigableUsers[currentUserIndex + 1]
      : null;

  const switchToUser = (targetUser: User) => {
    const recordsPool = allRecords && allRecords.length > 0 ? allRecords : kpiRecords;
    const targetQuarter = activeRecord?.quarter_id || 'Q1';
    let targetRecord = recordsPool.find(
      (r) => r.user_id === targetUser.id && r.quarter_id === targetQuarter
    );
    if (!targetRecord) {
      targetRecord = {
        id: `kpi-${targetUser.id}-${targetQuarter}-2026`,
        user_id: targetUser.id,
        team_id: targetUser.team_id,
        quarter_id: targetQuarter,
        year: 2026,
        month: 0,
        period_label: `Quý ${targetQuarter}/2026`,
        target: 100,
        achieved: 0,
        miss_count: 0,
        late_count: 0,
        unit: '%',
        projects: [],
        updated_at: new Date().toISOString(),
      };
    }
    setActiveUser(targetUser);
    setActiveRecord(targetRecord);
    if (onSelectUser) {
      onSelectUser(targetUser, targetRecord);
    }
  };

  if (!activeRecord || !activeUser) return null;

  const activeTeam = teams.find((t) => t.id === activeUser.team_id) || initialTeam;
  const canEdit = isMaster || isAdmin || isLeaderOrAdmin || currentUser?.id === activeUser.id;

  const handleAddProject = () => {
    if (!newName.trim()) {
      alert('Vui lòng nhập tên đề án.');
      return;
    }

    const newProj: ProjectDetail = {
      id: `proj-${Date.now()}`,
      name: newName.trim(),
      role: newRole.trim() || 'Chủ trì',
      status: newStatus.trim() || 'Đang triển khai',
      description: newDescription.trim() || 'Đề án nhiệm vụ trong kỳ.',
      link: newLink.trim() || undefined,
    };

    const updated = [...projectList, newProj];
    setProjectList(updated);
    setNewName('');
    setNewDescription('');
    setNewLink('');
    setNewRole('Chủ trì');
    setNewStatus('Đang triển khai');
  };

  const handleDeleteProject = (projId: string) => {
    const updated = projectList.filter((p) => p.id !== projId);
    setProjectList(updated);
  };

  const handleSaveAllProjects = () => {
    const updatedRecord: KpiRecord = {
      ...activeRecord,
      projects: projectList,
      updated_at: new Date().toISOString(),
    };
    updateKpiRecord(updatedRecord);
    setActiveRecord(updatedRecord);
    setIsEditingProjects(false);
    setEditingProjectId(null);
  };

  const handleUpdateSingleProject = (id: string, updatedFields: Partial<ProjectDetail>) => {
    setProjectList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p))
    );
  };

  const completionRate =
    activeRecord.target > 0 ? ((activeRecord.achieved / activeRecord.target) * 100).toFixed(1) : '0';
  const isExceeded = Number(completionRate) >= 102;
  const isAchieved = Number(completionRate) >= 100 && !isExceeded;
  const currentRank = activeUser.rank || 'C2';
  const rankConfig = RANK_STYLE_CONFIG[currentRank] || RANK_STYLE_CONFIG['C2'];

  const userAwards = (awardProposals || []).filter(
    (p) => p.user_id === activeUser.id && p.status === 'approved' && p.is_published
  );

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E7E7E4] rounded-xl shadow-2xl max-w-5xl xl:max-w-6xl w-full flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-gradient-to-r from-white via-white to-[#F8FAFC] border-b border-[#F0F0EE]">
          <div className="flex items-center space-x-3">
            <img
              src={
                activeUser.avatar_url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={activeUser.full_name}
              className="w-10 h-10 rounded-full object-cover border border-[#E7E7E4]"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-[#1C1C1A]">{cleanName(activeUser.full_name)}</h3>
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-[#F0F0EE] text-[#4A4A46]">
                  {activeUser.employee_code}
                </span>
                {userAwards.length > 0 && (
                  <div className="flex items-center space-x-1 pl-1">
                    {userAwards.map((a) => {
                      const cat = awardCategories.find((c) => c.id === a.category_id);
                      return (
                        <span
                          key={a.id}
                          title={`${cat?.name || 'Vinh danh'} (${a.quarter_id}/2026): ${a.reason}`}
                          className="inline-flex items-center justify-center p-1 rounded bg-[#FBF7EE] border border-[#E5D7A9] text-[#B08A3E] cursor-pointer hover:scale-110 transition-transform shadow-2xs"
                        >
                          <Award size={13} />
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-[#8A8A85]">{activeTeam?.name || 'Chưa phân team'}</span>
                <span className="text-xs text-[#8A8A85]">•</span>
                <span className="text-xs text-[#8A8A85]">Cấp bậc:</span>
                <span
                  style={{
                    backgroundColor: rankConfig.bg,
                    color: rankConfig.text,
                    borderColor: rankConfig.border || 'transparent',
                  }}
                  className="inline-block px-2 py-0.5 rounded text-[11px] font-bold font-mono border"
                >
                  {currentRank}
                </span>
                {isLeaderOrAdmin && (
                  <select
                    value={currentRank}
                    onChange={(e) => {
                      const updated = { ...activeUser, rank: e.target.value as EmployeeRank };
                      updateUser(updated);
                      setActiveUser(updated);
                    }}
                    className="text-[11px] font-medium bg-[#F6F6F4] border border-[#E7E7E4] rounded px-1.5 py-0.5 text-[#1C1C1A] cursor-pointer hover:border-[#8A8A85]"
                    title="Điều chỉnh cấp bậc hồ sơ nhân sự"
                  >
                    {ALL_RANKS.map((rk) => (
                      <option key={rk} value={rk}>
                        {rk}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8A8A85] hover:text-[#1C1C1A] p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Switcher: Chuyển đổi nhân sự xem KPI (Admin, Master & Leader) */}
        {(isMaster || isAdmin || isLeaderOrAdmin) && navigableUsers.length > 1 && (
          <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-6 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#475569] flex items-center space-x-1.5 whitespace-nowrap">
                <Users size={14} className="text-[#24487c]" />
                <span>Chọn nhân sự ({currentUserIndex >= 0 ? currentUserIndex + 1 : 1}/{navigableUsers.length}):</span>
              </span>
              <select
                value={activeUser.id}
                onChange={(e) => {
                  const found = navigableUsers.find((u) => u.id === e.target.value);
                  if (found) switchToUser(found);
                }}
                className="bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1 text-xs font-bold text-[#1E293B] cursor-pointer hover:border-[#7c9cd0] focus:outline-hidden max-w-[280px] sm:max-w-none truncate"
                title="Chọn trực tiếp nhân sự trong danh sách"
              >
                {navigableUsers.map((u, idx) => {
                  const uTeam = teams.find((t) => t.id === u.team_id);
                  const recordsPool = allRecords && allRecords.length > 0 ? allRecords : kpiRecords;
                  const uRec = recordsPool.find((r) => r.user_id === u.id && r.quarter_id === (activeRecord?.quarter_id || 'Q1'));
                  const rate = uRec && uRec.target > 0 ? ((uRec.achieved / uRec.target) * 100).toFixed(1) : '0';
                  return (
                    <option key={u.id} value={u.id}>
                      {idx + 1}. {cleanName(u.full_name)} ({u.employee_code}) - {uTeam?.name || 'Chưa phân team'} [{rate}%]
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={!prevUser}
                onClick={() => prevUser && switchToUser(prevUser)}
                className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  prevUser
                    ? 'bg-white hover:bg-[#F1F5F9] text-[#1E293B] border-[#CBD5E1] cursor-pointer shadow-2xs'
                    : 'bg-[#F1F5F9] text-[#94A3B8] border-[#E2E8F0] cursor-not-allowed opacity-50'
                }`}
                title={prevUser ? `Chuyển sang xem hồ sơ của: ${cleanName(prevUser.full_name)}` : 'Đang ở nhân sự đầu tiên trong danh sách'}
              >
                <ChevronLeft size={14} />
                <span className="whitespace-nowrap">Nhân sự trước</span>
              </button>

              <button
                type="button"
                disabled={!nextUser}
                onClick={() => nextUser && switchToUser(nextUser)}
                className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  nextUser
                    ? 'bg-[#24487c] hover:bg-[#1b365d] text-white border-[#24487c] cursor-pointer shadow-xs'
                    : 'bg-[#F1F5F9] text-[#94A3B8] border-[#E2E8F0] cursor-not-allowed opacity-50'
                }`}
                title={nextUser ? `Chuyển sang xem hồ sơ nhân sự kế tiếp: ${cleanName(nextUser.full_name)}` : 'Đã là nhân sự cuối cùng trong danh sách'}
              >
                <span className="whitespace-nowrap">Nhân sự kế tiếp</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key metrics grid */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-[#F6F6F4] rounded-lg border border-[#E7E7E4]">
            <div>
              <div className="text-[11px] font-semibold text-[#8A8A85] uppercase tracking-wider">
                TIẾN ĐỘ
              </div>
              <div className="text-2xl font-bold text-[#1C1C1A] mt-1">{completionRate}%</div>
              <span
                className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded mt-1 ${
                  isExceeded || isAchieved
                    ? 'bg-[#F0F4F0] text-[#6B8F71]'
                    : 'bg-[#FDF2F2] text-[#B85D5D]'
                }`}
              >
                {isExceeded ? 'Vượt Chỉ Tiêu' : isAchieved ? 'Đạt Target' : 'Cần Cải Thiện'}
              </span>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-[#8A8A85] uppercase tracking-wider">
                MỤC TIÊU
              </div>
              <div className="text-2xl font-bold text-[#1C1C1A] mt-1">{activeRecord.target}</div>
              <div className="text-[11px] text-[#8A8A85] mt-1">Đơn vị: {activeRecord.unit}</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-[#8A8A85] uppercase tracking-wider">
                HOÀN THÀNH
              </div>
              <div className="text-2xl font-bold text-[#1C1C1A] mt-1">{activeRecord.achieved}</div>
              <div className="text-[11px] text-[#8A8A85] mt-1">Đơn vị: {activeRecord.unit}</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-[#8A8A85] uppercase tracking-wider">
                MISS / TRỄ
              </div>
              <div className="text-2xl font-bold text-[#1C1C1A] mt-1">
                <span className={activeRecord.miss_count > 0 ? 'text-[#B85D5D]' : ''}>
                  {activeRecord.miss_count}
                </span>
                <span className="text-[#8A8A85] mx-1">/</span>
                <span className={activeRecord.late_count > 0 ? 'text-[#B85D5D]' : ''}>
                  {activeRecord.late_count}
                </span>
              </div>
              <div className="text-[11px] text-[#8A8A85] mt-1">Lần vi phạm</div>
            </div>
          </div>

          {/* Section: Projects (Đề Án & Dự Án Chiến Lược) */}
          <div className="border border-[#CBD5E1] rounded-xl p-4 bg-white shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#E2E8F0] gap-2">
              <div className="flex items-center space-x-2">
                <Briefcase size={16} className="text-[#24487c]" />
                <h4 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                  Danh Sách Đề Án & Dự Án Chiến Lược ({projectList.length})
                </h4>
              </div>

              <div className="flex items-center space-x-2">
                {projectList.length > 0 && !isEditingProjects && (
                  <button
                    type="button"
                    onClick={() => setIsExpandedAllProjects(!isExpandedAllProjects)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-[#CBD5E1] text-[#24487c] hover:bg-[#F8FAFC] transition-colors cursor-pointer shadow-2xs"
                    title={isExpandedAllProjects ? 'Thu gọn chi tiết các đề án' : 'Mở rộng toàn bộ chi tiết đề án'}
                  >
                    {isExpandedAllProjects ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                    <span>{isExpandedAllProjects ? 'Thu Gọn Chi Tiết' : 'Mở Chi Tiết Toàn Bộ'}</span>
                  </button>
                )}

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setIsEditingProjects(!isEditingProjects)}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer border ${
                      isEditingProjects
                        ? 'bg-white text-[#475569] border-[#CBD5E1] hover:bg-[#F1F5F9]'
                        : 'bg-[#24487c] text-white border-[#24487c] shadow-2xs hover:bg-[#1b365d]'
                    }`}
                  >
                    <Edit3 size={12} />
                    <span>{isEditingProjects ? 'Đóng Chỉnh Sửa' : 'Cập Nhật Đề Án'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* EDIT MODE: Form thêm/sửa/xóa đề án */}
            {isEditingProjects ? (
              <div className="space-y-4">
                {/* Form thêm đề án mới */}
                <div className="p-3.5 bg-white border border-[#CBD5E1] rounded-lg shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1E293B] flex items-center space-x-1.5">
                      <Plus size={14} className="text-[#24487c]" />
                      <span>Thêm Đề Án Mới Vào Kỳ Này</span>
                    </span>
                    <span className="text-[11px] text-[#64748B]">Tăng số lượng đề án</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">
                        Tên Đề Án / Nhiệm Vụ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Ví dụ: Đề án tối ưu hóa quy trình nhập liệu"
                        className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-md px-3 py-1.5 text-xs text-[#1E293B] focus:bg-white focus:ring-1 focus:ring-[#24487c] outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">
                        Vai Trò
                      </label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-md px-2.5 py-1.5 text-xs text-[#1E293B] focus:bg-white focus:ring-1 focus:ring-[#24487c] outline-hidden cursor-pointer"
                      >
                        <option value="Chủ trì">Chủ trì</option>
                        <option value="Khởi xướng">Khởi xướng</option>
                        <option value="Phụ trách chính">Phụ trách chính</option>
                        <option value="Tham gia">Tham gia</option>
                        <option value="Thành viên">Thành viên</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">
                        Trạng Thái
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-md px-2.5 py-1.5 text-xs text-[#1E293B] focus:bg-white focus:ring-1 focus:ring-[#24487c] outline-hidden cursor-pointer"
                      >
                        <option value="Vượt tiến độ">Vượt tiến độ</option>
                        <option value="Hoàn thành">Hoàn thành</option>
                        <option value="Đang triển khai">Đang triển khai</option>
                        <option value="Chuẩn bị">Chuẩn bị</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1 flex items-center justify-between">
                        <span>Đường Dẫn Link Đề Án (Google Docs, Sheets, Drive...)</span>
                        <span className="text-[#8A8A85] font-normal lowercase">(không lộ link khi hiển thị)</span>
                      </label>
                      <input
                        type="url"
                        value={newLink}
                        onChange={(e) => setNewLink(e.target.value)}
                        placeholder="https://docs.google.com/..."
                        className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-md px-3 py-1.5 text-xs text-[#1E293B] focus:bg-white focus:ring-1 focus:ring-[#24487c] outline-hidden font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">
                      Nội Dung & Mục Tiêu Của Đề Án
                    </label>
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      rows={2}
                      placeholder="Mô tả mục tiêu, đóng góp cụ thể và phạm vi thực hiện của đề án..."
                      className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-md p-2.5 text-xs text-[#1E293B] focus:bg-white focus:ring-1 focus:ring-[#24487c] outline-hidden"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddProject}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold rounded-md shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>Thêm Đề Án Này</span>
                    </button>
                  </div>
                </div>

                {/* Danh sách đề án hiện tại để chỉnh sửa/xóa */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                    Đề án đã có ({projectList.length}) - Có thể xóa hoặc điều chỉnh link/nội dung
                  </span>

                  {projectList.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="p-3 bg-white border border-[#CBD5E1] rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 mr-2">
                          <span className="w-5 h-5 rounded-full bg-[#F1F5F9] text-[#64748B] text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={p.name}
                            onChange={(e) => handleUpdateSingleProject(p.id, { name: e.target.value })}
                            className="font-semibold text-xs text-[#1E293B] bg-transparent border-b border-dashed border-[#CBD5E1] focus:border-[#24487c] focus:outline-hidden flex-1"
                          />
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <input
                            type="text"
                            value={p.role}
                            onChange={(e) => handleUpdateSingleProject(p.id, { role: e.target.value })}
                            placeholder="Vai trò"
                            className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F1F5F9] text-[#334155] border border-[#CBD5E1] w-24 text-center"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(p.id)}
                            className="p-1 rounded text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                            title="Xóa đề án này"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <textarea
                        value={p.description}
                        onChange={(e) => handleUpdateSingleProject(p.id, { description: e.target.value })}
                        rows={2}
                        placeholder="Nội dung mô tả đề án..."
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded p-2 text-xs text-[#334155] focus:bg-white focus:outline-hidden"
                      />

                      <div className="flex items-center space-x-2">
                        <select
                          value={p.status || 'Đang triển khai'}
                          onChange={(e) => handleUpdateSingleProject(p.id, { status: e.target.value })}
                          className="bg-[#F8FAFC] border border-[#E2E8F0] rounded px-2 py-1 text-xs text-[#334155] focus:bg-white focus:outline-hidden cursor-pointer"
                        >
                          <option value="Vượt tiến độ">Vượt tiến độ</option>
                          <option value="Hoàn thành">Hoàn thành</option>
                          <option value="Đang triển khai">Đang triển khai</option>
                          <option value="Chuẩn bị">Chuẩn bị</option>
                        </select>
                        <div className="flex items-center space-x-1 flex-1">
                          <LinkIcon size={12} className="text-[#64748B] shrink-0" />
                          <input
                            type="url"
                            value={p.link || ''}
                            onChange={(e) => handleUpdateSingleProject(p.id, { link: e.target.value })}
                            placeholder="Link tài liệu (ẩn link, mở bằng nút)..."
                            className="bg-[#F8FAFC] border border-[#E2E8F0] rounded px-2.5 py-1 text-xs text-[#334155] focus:bg-white focus:outline-hidden flex-1 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Nút lưu tất cả */}
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#CBD5E1]">
                  <button
                    type="button"
                    onClick={() => {
                      setProjectList(activeRecord.projects ? [...activeRecord.projects] : []);
                      setIsEditingProjects(false);
                    }}
                    className="px-3 py-1.5 text-xs text-[#475569] hover:bg-[#E2E8F0] rounded-md transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAllProjects}
                    className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-[#24487c] hover:bg-[#1c3861] text-white text-xs font-bold rounded-md shadow-xs transition-colors cursor-pointer"
                  >
                    <Save size={13} />
                    <span>Lưu Cập Nhật Đề Án</span>
                  </button>
                </div>
              </div>
            ) : (
              /* VIEW MODE: Hiển thị danh sách đề án với nút bấm mở link và mở chi tiết */
              <div>
                {projectList.length > 0 ? (
                  <div className="space-y-2.5">
                    {projectList.map((p, idx) => (
                      <div
                        key={p.id || idx}
                        className="p-3.5 bg-white border border-[#E2E8F0] rounded-lg hover:border-[#CBD5E1] transition-colors shadow-2xs flex flex-col justify-between space-y-2 group"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-[#7c9cd0]/15 text-[#24487c] text-[11px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-xs text-[#1E293B] group-hover:text-[#24487c] transition-colors">
                              {p.name}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {p.status && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  p.status === 'Vượt tiến độ' || p.status === 'Hoàn thành'
                                    ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                                    : 'bg-[#EFF6FF] text-[#24487c] border-[#BFDBFE]'
                                }`}
                              >
                                {p.status}
                              </span>
                            )}
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]">
                              {p.role}
                            </span>

                            {/* Nút Mở Chi Tiết Đề Án */}
                            <button
                              type="button"
                              onClick={() => setSelectedProjectModal(p)}
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold text-[#24487c] hover:bg-[#EFF6FF] border border-transparent hover:border-[#93C5FD] transition-colors cursor-pointer"
                              title="Mở toàn bộ thông tin chi tiết của đề án này"
                            >
                              <Eye size={12} />
                              <span>Chi tiết</span>
                            </button>
                          </div>
                        </div>

                        <p
                          className={`text-xs text-[#475569] leading-relaxed pl-7 ${
                            isExpandedAllProjects ? '' : 'line-clamp-2'
                          }`}
                        >
                          {p.description}
                        </p>

                        {/* Nút mở đề án (không lộ link thô, mở bằng nút bấm) */}
                        <div className="pl-7 pt-1 flex items-center justify-between border-t border-[#F8FAFC]">
                          <div className="flex items-center space-x-2">
                            {p.link ? (
                              <a
                                href={p.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#24487c] hover:bg-[#1b365d] text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer no-underline"
                                title="Mở tài liệu đề án trong tab mới (không hiển thị link thô)"
                              >
                                <ExternalLink size={13} className="shrink-0" />
                                <span>Mở Tài Liệu Đề Án</span>
                              </a>
                            ) : (
                              <span className="text-[11px] text-[#94A3B8] italic flex items-center space-x-1">
                                <span>Chưa đính kèm tài liệu</span>
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedProjectModal(p)}
                              className="inline-flex items-center space-x-1 text-xs text-[#24487c] hover:underline font-medium cursor-pointer"
                            >
                              <span>Xem phân tích chi tiết →</span>
                            </button>
                          </div>

                          <span className="text-[10px] text-[#94A3B8]">Mã: {p.id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-white border border-[#E2E8F0] rounded-lg text-center">
                    <p className="text-xs text-[#8A8A85] italic mb-2">Chưa ghi nhận đề án độc lập nào trong kỳ này.</p>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setIsEditingProjects(true)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#24487c] text-white rounded-md text-xs font-semibold hover:bg-[#1b365d] transition-colors cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Thêm Đề Án Đầu Tiên</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Evaluator Notes */}
          <div>
            <h4 className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider mb-2">
              Nhận Xét Của Người Đánh Giá
            </h4>
            <div className="p-3.5 bg-[#FAFAF9] border border-[#E7E7E4] rounded-md text-xs text-[#4A4A46] leading-relaxed">
              {activeRecord.notes || 'Chưa có ghi chú bổ sung.'}
            </div>
          </div>

          <div className="text-[11px] text-[#8A8A85] pt-2 border-t border-[#F0F0EE] flex items-center justify-between">
            <span>Kỳ: {activeRecord.period_label || `${activeRecord.quarter_id}/2026`}</span>
            <span>Cập nhật lần cuối: {new Date(activeRecord.updated_at).toLocaleString('vi-VN')}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#FAFAF9] border-t border-[#F0F0EE] flex items-center justify-between">
          <div>
            {(isMaster || isAdmin || isLeaderOrAdmin) && nextUser && (
              <button
                type="button"
                onClick={() => switchToUser(nextUser)}
                className="text-xs font-bold text-[#24487c] hover:underline inline-flex items-center space-x-1 cursor-pointer"
              >
                <span>Xem hồ sơ tiếp theo: {cleanName(nextUser.full_name)}</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded bg-[#1C1C1A] text-white hover:bg-[#2B2B28] transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* POPUP CHI TIẾT ĐỀ ÁN (Mở chi tiết ra) */}
      {selectedProjectModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-60 p-4"
          onClick={() => setSelectedProjectModal(null)}
        >
          <div
            className="bg-white border border-[#CBD5E1] rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 bg-[#24487c] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText size={16} className="text-white/80" />
                <h3 className="font-bold text-sm tracking-tight">Chi Tiết Đề Án & Nhiệm Vụ</h3>
              </div>
              <button
                onClick={() => setSelectedProjectModal(null)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                  Tên đề án chiến lược
                </span>
                <h4 className="text-base font-bold text-[#1E293B]">
                  {selectedProjectModal.name}
                </h4>
                <div className="flex items-center space-x-2 mt-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      selectedProjectModal.status === 'Vượt tiến độ' || selectedProjectModal.status === 'Hoàn thành'
                        ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                        : 'bg-[#EFF6FF] text-[#24487c] border-[#BFDBFE]'
                    }`}
                  >
                    {selectedProjectModal.status || 'Đang triển khai'}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]">
                    Vai trò: {selectedProjectModal.role}
                  </span>
                  <span className="text-[10px] text-[#94A3B8] font-mono">
                    Mã: {selectedProjectModal.id}
                  </span>
                </div>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3.5 space-y-1.5">
                <span className="text-[10px] font-bold text-[#475569] uppercase tracking-wider block">
                  Nội dung, mục tiêu & phạm vi triển khai
                </span>
                <p className="text-xs text-[#334155] leading-relaxed whitespace-pre-wrap">
                  {selectedProjectModal.description || 'Chưa có mô tả chi tiết cho đề án này.'}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">
                  Tài liệu đề án đính kèm
                </span>
                {selectedProjectModal.link ? (
                  <div className="p-3 bg-[#F0FDF4] border border-[#86EFAC] rounded-lg flex flex-col space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#15803D] flex items-center space-x-1.5">
                        <CheckCircle2 size={14} className="text-[#15803D]" />
                        <span>Đã liên kết tài liệu trực tuyến</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedProjectModal.link) {
                            navigator.clipboard.writeText(selectedProjectModal.link);
                            setCopiedProjectLink(true);
                            setTimeout(() => setCopiedProjectLink(false), 2000);
                          }
                        }}
                        className="text-[10px] text-[#24487c] hover:underline inline-flex items-center space-x-1 font-semibold cursor-pointer"
                      >
                        <Copy size={11} />
                        <span>{copiedProjectLink ? 'Đã sao chép link!' : 'Sao chép link'}</span>
                      </button>
                    </div>

                    <a
                      href={selectedProjectModal.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-[#24487c] hover:bg-[#1b365d] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer no-underline"
                    >
                      <ExternalLink size={13} className="shrink-0" />
                      <span>Mở Tài Liệu Đề Án Trong Tab Mới</span>
                    </a>
                  </div>
                ) : (
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-center text-[#94A3B8] italic">
                    Chưa đính kèm đường dẫn tài liệu cho đề án này.
                  </div>
                )}
              </div>

              <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-3 text-[11px] text-[#1E40AF]">
                <strong>Đóng góp vào chỉ tiêu:</strong> Đề án này được tính vào số lượng nhiệm vụ chiến lược quý {activeRecord.quarter_id}/2026 của nhân sự {cleanName(activeUser.full_name)}.
              </div>
            </div>

            <div className="px-5 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex justify-end space-x-2">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProjectModal(null);
                    setIsEditingProjects(true);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white text-[#1E293B] text-xs font-semibold hover:bg-[#F1F5F9] cursor-pointer"
                >
                  Chỉnh sửa đề án
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedProjectModal(null)}
                className="px-4 py-1.5 rounded-lg bg-[#24487c] text-white text-xs font-semibold hover:bg-[#1b365d] cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
