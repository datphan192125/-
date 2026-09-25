import React, { useState } from 'react';
import {
  Users,
  Shield,
  Layers,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Key,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User, Team, Role, ViewScope, JapaneseLevel, EmployeeRank, ALL_RANKS, RANK_STYLE_CONFIG } from '../../types';

export const AdminTeamModule: React.FC = () => {
  const {
    teams,
    users,
    updateUser,
    createUser,
    updateTeam,
    createTeam,
    isAdmin,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'users' | 'teams'>('users');
  const [searchUser, setSearchUser] = useState<string>('');
  const [selectedUserToEdit, setSelectedUserToEdit] = useState<User | null>(null);
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState<boolean>(false);
  const [selectedTeamToEdit, setSelectedTeamToEdit] = useState<Team | null>(null);
  const [isNewTeamModalOpen, setIsNewTeamModalOpen] = useState<boolean>(false);

  // User form state
  const [userFormData, setUserFormData] = useState<Partial<User>>({});
  // Team form state
  const [teamFormData, setTeamFormData] = useState<Partial<Team>>({});

  const filteredUsers = users.filter((u) => {
    if (!searchUser.trim()) return true;
    const q = searchUser.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(q) ||
      u.employee_code.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.full_name || !userFormData.employee_code) return;

    if (selectedUserToEdit) {
      updateUser({
        ...selectedUserToEdit,
        ...userFormData,
        rank: userFormData.rank || selectedUserToEdit.rank || 'C2',
      } as User);
    } else {
      createUser({
        employee_code: userFormData.employee_code || 'DYM-NEW',
        full_name: userFormData.full_name || '',
        email: userFormData.email || `${userFormData.employee_code?.toLowerCase()}@dymvietnam.net`,
        rank: userFormData.rank || 'C2',
        japanese_level: userFormData.japanese_level || 'N2',
        role: userFormData.role || 'member',
        view_scope: userFormData.view_scope || 'own_team',
        allowed_team_ids: userFormData.allowed_team_ids || [],
        team_id: userFormData.team_id || teams[0].id,
        is_active: userFormData.is_active ?? true,
        position: userFormData.position || 'Chuyên viên nghiệp vụ',
        avatar_url:
          userFormData.avatar_url ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      });
    }

    setSelectedUserToEdit(null);
    setIsNewUserModalOpen(false);
  };

  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamFormData.name || !teamFormData.code) return;

    if (selectedTeamToEdit) {
      updateTeam({ ...selectedTeamToEdit, ...teamFormData } as Team);
    } else {
      createTeam({
        name: teamFormData.name || '',
        code: teamFormData.code || '',
        parent_team_id: teamFormData.parent_team_id || null,
        leader_ids: teamFormData.leader_ids || [],
        subleader_ids: teamFormData.subleader_ids || [],
        description: teamFormData.description || '',
        order: teams.length + 1,
      });
    }

    setSelectedTeamToEdit(null);
    setIsNewTeamModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E7E7E4]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1C1A]">
            Quản Lý Nhân Sự & Cấu Trúc Team (RBAC)
          </h1>
          <p className="text-xs text-[#8A8A85] mt-1">
            Phân quyền vai trò (Role), phạm vi hiển thị (ViewScope) và sơ đồ tổ chức 4 khối nghiệp vụ
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="flex p-0.5 rounded-md bg-[#F0F0EE] border border-[#E7E7E4]">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                activeTab === 'users'
                  ? 'bg-[#7c9cd0] text-white shadow-xs'
                  : 'text-[#4A4A46] hover:text-[#1C1C1A]'
              }`}
            >
              Danh Sách Nhân Sự ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                activeTab === 'teams'
                  ? 'bg-[#7c9cd0] text-white shadow-xs'
                  : 'text-[#4A4A46] hover:text-[#1C1C1A]'
              }`}
            >
              Cơ Cấu Team ({teams.length})
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                if (activeTab === 'users') {
                  setUserFormData({
                    employee_code: `DYM-0${users.length + 10}`,
                    full_name: '',
                    email: '',
                    japanese_level: 'N2',
                    role: 'member',
                    view_scope: 'own_team',
                    team_id: teams[0]?.id,
                    is_active: true,
                  });
                  setIsNewUserModalOpen(true);
                } else {
                  setTeamFormData({
                    name: '',
                    code: '',
                    parent_team_id: null,
                    description: '',
                  });
                  setIsNewTeamModalOpen(true);
                }
              }}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#7c9cd0] hover:bg-[#6788be] text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus size={14} />
              <span>{activeTab === 'users' ? 'Thêm Nhân Viên' : 'Thêm Nhóm Mới'}</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'users' ? (
        /* Users Management Table */
        <div className="bg-white border border-[#E7E7E4] rounded-lg overflow-hidden">
          <div className="p-3.5 border-b border-[#F0F0EE] flex items-center justify-between">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm mã NV, họ tên, email..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="bg-[#F6F6F4] border border-[#E7E7E4] rounded-md pl-8 pr-3 py-1 text-xs text-[#1C1C1A] w-64 focus:outline-hidden"
              />
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8A8A85]" />
            </div>
            <div className="text-xs text-[#8A8A85]">
              Ràng buộc Google SSO domain: <span className="font-mono text-[#1C1C1A]">@dymvietnam.net</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAF9] text-[#8A8A85] uppercase text-[10px] tracking-wider border-b border-[#E7E7E4]">
                <tr>
                  <th className="py-2.5 px-5">Mã & Họ Tên</th>
                  <th className="py-2.5 px-4">Email Công Ty</th>
                  <th className="py-2.5 px-4">Team Trực Thuộc</th>
                  <th className="py-2.5 px-3 text-center">Cấp Bậc</th>
                  <th className="py-2.5 px-3 text-center">Vai Trò (Role)</th>
                  <th className="py-2.5 px-4">Phạm Vi (ViewScope)</th>
                  <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                  {isAdmin && <th className="py-2.5 px-5 text-right">Thao Tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0EE]">
                {filteredUsers.map((u) => {
                  const team = teams.find((t) => t.id === u.team_id);
                  const rankConfig = u.rank ? RANK_STYLE_CONFIG[u.rank] : null;

                  return (
                    <tr key={u.id} className="hover:bg-[#FAFAF9]">
                      <td className="py-3 px-5">
                        <div className="flex items-center space-x-3">
                          <img
                            src={
                              u.avatar_url ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                            }
                            alt={u.full_name}
                            className="w-8 h-8 rounded-full object-cover border border-[#E7E7E4]"
                          />
                          <div>
                            <div className="font-semibold text-xs text-[#1C1C1A]">{u.full_name}</div>
                            <div className="text-[10px] text-[#8A8A85] font-mono">{u.employee_code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#4A4A46]">{u.email}</td>
                      <td className="py-3 px-4 text-[#4A4A46]">{team?.name || '—'}</td>
                      <td className="py-3 px-3 text-center">
                        {u.rank && rankConfig ? (
                          <span
                            style={{
                              backgroundColor: rankConfig.bg,
                              color: rankConfig.text,
                              borderColor: rankConfig.border || 'transparent',
                            }}
                            className="px-2 py-0.5 rounded font-mono text-[10px] font-bold border"
                          >
                            {u.rank}
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] text-[#8A8A85]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            u.role === 'admin'
                              ? 'bg-[#1C1C1A] text-white'
                              : u.role === 'leader'
                              ? 'bg-[#FBF7EE] text-[#B08A3E] border border-[#E7E7E4]'
                              : u.role === 'subleader'
                              ? 'bg-[#F0F4F0] text-[#6B8F71] border border-[#E7E7E4]'
                              : 'bg-[#F0F0EE] text-[#4A4A46]'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#8A8A85]">
                        {u.view_scope === 'all'
                          ? 'Toàn bộ phận (all)'
                          : u.view_scope === '2ka_all'
                          ? 'Toàn bộ 2課 (A/B/S)'
                          : u.view_scope === 'own_team'
                          ? 'Chỉ xem team mình'
                          : 'Chỉ định'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {u.is_active ? (
                          <span className="text-[#6B8F71] text-[11px] font-medium flex items-center justify-center space-x-1">
                            <CheckCircle2 size={12} />
                            <span>Hoạt động</span>
                          </span>
                        ) : (
                          <span className="text-[#B85D5D] text-[11px] font-medium flex items-center justify-center space-x-1">
                            <XCircle size={12} />
                            <span>Tạm ngưng</span>
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-5 text-right">
                          <button
                            onClick={() => {
                              setSelectedUserToEdit(u);
                              setUserFormData(u);
                            }}
                            className="text-xs text-[#4A4A46] hover:text-[#1C1C1A] underline font-medium"
                          >
                            Phân quyền
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Teams Structure Management Table */
        <div className="bg-white border border-[#E7E7E4] rounded-lg overflow-hidden">
          <div className="p-3.5 border-b border-[#F0F0EE]">
            <h2 className="text-xs font-bold text-[#1C1C1A] uppercase tracking-wider">
              Cơ Cấu Tổ Chức & Sơ Đồ Khối Sự Vụ
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAF9] text-[#8A8A85] uppercase text-[10px] tracking-wider border-b border-[#E7E7E4]">
                <tr>
                  <th className="py-2.5 px-5">Tên Team / Khối</th>
                  <th className="py-2.5 px-4">Mã Code</th>
                  <th className="py-2.5 px-4">Trực Thuộc</th>
                  <th className="py-2.5 px-4">Trưởng Nhóm (Leader)</th>
                  <th className="py-2.5 px-4">Phó Nhóm (Subleader)</th>
                  <th className="py-2.5 px-5">Mô Tả Nhiệm Vụ</th>
                  {isAdmin && <th className="py-2.5 px-5 text-right">Thao Tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0EE]">
                {teams.map((t) => {
                  const parent = teams.find((p) => p.id === t.parent_team_id);
                  const leaders = users.filter((u) => t.leader_ids.includes(u.id));
                  const subleaders = users.filter((u) => t.subleader_ids.includes(u.id));

                  return (
                    <tr key={t.id} className="hover:bg-[#FAFAF9]">
                      <td className="py-3 px-5 font-bold text-[#1C1C1A]">{t.name}</td>
                      <td className="py-3 px-4 font-mono text-xs">{t.code}</td>
                      <td className="py-3 px-4 text-[#8A8A85]">
                        {parent ? parent.name : 'Khối chính'}
                      </td>
                      <td className="py-3 px-4 text-[#4A4A46]">
                        {leaders.map((l) => l.full_name).join(', ') || '—'}
                      </td>
                      <td className="py-3 px-4 text-[#4A4A46]">
                        {subleaders.map((sl) => sl.full_name).join(', ') || '—'}
                      </td>
                      <td className="py-3 px-5 text-xs text-[#8A8A85]">{t.description || '—'}</td>
                      {isAdmin && (
                        <td className="py-3 px-5 text-right">
                          <button
                            onClick={() => {
                              setSelectedTeamToEdit(t);
                              setTeamFormData(t);
                            }}
                            className="text-xs text-[#4A4A46] hover:text-[#1C1C1A] underline font-medium"
                          >
                            Chỉnh sửa
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit / New User Modal */}
      {(selectedUserToEdit || isNewUserModalOpen) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E7E7E4] rounded-lg shadow-2xl max-w-lg w-full p-6">
            <h3 className="font-bold text-base text-[#1C1C1A] mb-1">
              {isNewUserModalOpen ? 'Thêm Nhân Viên Mới' : 'Phân Quyền & Thông Tin Nhân Sự'}
            </h3>
            <p className="text-xs text-[#8A8A85] mb-4">
              Cấu hình vai trò RBAC và phạm vi hiển thị dữ liệu
            </p>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#1C1C1A] block mb-1">Mã Nhân Viên</label>
                  <input
                    required
                    type="text"
                    value={userFormData.employee_code || ''}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, employee_code: e.target.value })
                    }
                    className="w-full bg-[#F6F6F4] border border-[#E7E7E4] rounded p-2 text-xs text-[#1C1C1A] font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#1C1C1A] block mb-1">Họ và Tên</label>
                  <input
                    required
                    type="text"
                    value={userFormData.full_name || ''}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, full_name: e.target.value })
                    }
                    className="w-full bg-[#F6F6F4] border border-[#E7E7E4] rounded p-2 text-xs text-[#1C1C1A]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#1C1C1A] block mb-1">
                  Email Công Ty (Google SSO)
                </label>
                <input
                  required
                  type="email"
                  value={userFormData.email || ''}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="w-full bg-[#F6F6F4] border border-[#E7E7E4] rounded p-2 text-xs text-[#1C1C1A] font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#1C1C1A] block mb-1">Team Trực Thuộc</label>
                  <select
                    value={userFormData.team_id || ''}
                    onChange={(e) => setUserFormData({ ...userFormData, team_id: e.target.value })}
                    className="w-full bg-[#F6F6F4] border border-[#E7E7E4] rounded p-2 text-xs text-[#1C1C1A]"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#1C1C1A] block mb-1">Cấp Bậc (Rank)</label>
                  <select
                    value={userFormData.rank || 'C2'}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, rank: e.target.value as EmployeeRank })
                    }
                    className="w-full bg-[#F6F6F4] border border-[#E7E7E4] rounded p-2 text-xs text-[#1C1C1A]"
                  >
                    {ALL_RANKS.map((rk) => (
                      <option key={rk} value={rk}>
                        {rk}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#F0F0EE]">
                <div>
                  <label className="font-semibold text-[#1C1C1A] block mb-1">
                    Vai Trò (Role)
                  </label>
                  <select
                    value={userFormData.role || 'member'}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, role: e.target.value as Role })
                    }
                    className="w-full bg-[#F6F6F4] border border-[#E7E7E4] rounded p-2 text-xs text-[#1C1C1A]"
                  >
                    <option value="admin">Admin (Toàn quyền)</option>
                    <option value="leader">Leader (Trưởng nhóm)</option>
                    <option value="subleader">Subleader (Phó nhóm)</option>
                    <option value="member">Member (Nhân viên)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#1C1C1A] block mb-1">
                    Phạm Vi Dữ Liệu (ViewScope)
                  </label>
                  <select
                    value={userFormData.view_scope || 'own_team'}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, view_scope: e.target.value as ViewScope })
                    }
                    className="w-full bg-[#F6F6F4] border border-[#E7E7E4] rounded p-2 text-xs text-[#1C1C1A]"
                  >
                    <option value="all">all (Xem toàn bộ phận)</option>
                    <option value="2ka_all">2ka_all (Xem cả 2課 A/B/S)</option>
                    <option value="own_team">own_team (Chỉ team trực thuộc)</option>
                    <option value="custom">custom (Chỉ định)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2.5 pt-3 border-t border-[#F0F0EE]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserToEdit(null);
                    setIsNewUserModalOpen(false);
                  }}
                  className="px-4 py-1.5 rounded border border-[#E7E7E4] text-[#4A4A46]"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#7c9cd0] hover:bg-[#6788be] text-white font-semibold shadow-xs transition-colors"
                >
                  Lưu Thông Tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / New Team Modal */}
      {(selectedTeamToEdit || isNewTeamModalOpen) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E7E7E4] rounded-lg shadow-2xl max-w-lg w-full p-6">
            <h3 className="font-bold text-base text-[#1C1C1A] mb-1">
              {isNewTeamModalOpen ? 'Tạo Nhóm / Khối Mới' : 'Cập Nhật Cơ Cấu Nhóm'}
            </h3>
            <p className="text-xs text-[#8A8A85] mb-4">
              Cấu hình tên và liên kết phân cấp cha - con
            </p>

            <form onSubmit={handleSaveTeam} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#1C1C1A] block mb-1">Tên Team</label>
                  <input
                    required
                    type="text"
                    value={teamFormData.name || ''}
                    onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
                    placeholder="VD: 2課-C (Nhóm mới)"
                    className="w-full bg-[#F6F6F4] border border-[#E7E7E4] rounded p-2 text-xs text-[#1C1C1A]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#1C1C1A] block mb-1">Mã Viết Tắt</label>
                  <input
                    required
                    type="text"
                    value={teamFormData.code || ''}
                    onChange={(e) => setTeamFormData({ ...teamFormData, code: e.target.value })}
                    placeholder="VD: 2ka-C"
                    className="w-full bg-[#F6F6F4] border border-[#E7E7E4] rounded p-2 text-xs text-[#1C1C1A] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#1C1C1A] block mb-1">Khối Cha (Parent Team)</label>
                <select
                  value={teamFormData.parent_team_id || ''}
                  onChange={(e) =>
                    setTeamFormData({ ...teamFormData, parent_team_id: e.target.value || null })
                  }
                  className="w-full bg-[#F6F6F4] border border-[#E7E7E4] rounded p-2 text-xs text-[#1C1C1A]"
                >
                  <option value="">Không có (Khối chính cấp 1)</option>
                  <option value="team-2">2課 (Thuộc khối 2課)</option>
                  <option value="team-1">1課</option>
                  <option value="team-3">3課</option>
                  <option value="team-gs">GS</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#1C1C1A] block mb-1">Mô tả nhiệm vụ</label>
                <textarea
                  rows={2}
                  value={teamFormData.description || ''}
                  onChange={(e) =>
                    setTeamFormData({ ...teamFormData, description: e.target.value })
                  }
                  className="w-full bg-white border border-[#E7E7E4] rounded p-2 text-xs text-[#1C1C1A]"
                />
              </div>

              <div className="flex justify-end space-x-2.5 pt-3 border-t border-[#F0F0EE]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTeamToEdit(null);
                    setIsNewTeamModalOpen(false);
                  }}
                  className="px-4 py-1.5 rounded border border-[#E7E7E4] text-[#4A4A46]"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#7c9cd0] hover:bg-[#6788be] text-white font-semibold shadow-xs transition-colors"
                >
                  Lưu Khối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
