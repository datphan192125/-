import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Save } from 'lucide-react';
import { EvaluationCriterion } from '../../types';

export interface RubricModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluationCriteria: EvaluationCriterion[];
  isMaster: boolean;
  onSaveRubric: (criteria: EvaluationCriterion[], adminProposalNote?: string) => void;
}

export const RubricModal: React.FC<RubricModalProps> = ({
  isOpen,
  onClose,
  evaluationCriteria,
  isMaster,
  onSaveRubric,
}) => {
  const [rubricDraft, setRubricDraft] = useState<EvaluationCriterion[]>([]);
  const [adminProposalNote, setAdminProposalNote] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setRubricDraft(JSON.parse(JSON.stringify(evaluationCriteria)));
      setAdminProposalNote('');
    }
  }, [isOpen, evaluationCriteria]);

  if (!isOpen) return null;

  const handleSaveRubric = () => {
    onSaveRubric(rubricDraft, adminProposalNote || undefined);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E7E7E4] rounded-xl shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-[#24487c] text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold">
              {isMaster
                ? 'Quản Trị Bảng Tiêu Chuẩn & Thang Điểm (Master)'
                : 'Đề Xuất Chỉnh Sửa Tiêu Chuẩn & Thang Điểm (Admin)'}
            </h2>
            <p className="text-xs text-white/80 mt-0.5">
              {isMaster
                ? 'Master có quyền chỉnh sửa trực tiếp và áp dụng ngay vào hệ thống.'
                : 'Admin có quyền đề xuất chỉnh sửa; đề xuất phải được Master duyệt trước khi áp dụng.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!isMaster && (
            <div className="p-3 bg-[#FEF9C3] border border-[#FDE047] rounded-lg text-xs text-[#854D0E] flex items-center space-x-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>
                <strong>Quy định phê duyệt:</strong> Tài khoản đang đăng nhập với vai trò Admin. Các sửa đổi về tiêu chuẩn và hệ số thang điểm sẽ được tạo thành đề xuất gửi cho Master phê duyệt.
              </span>
            </div>
          )}

          {!isMaster && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#1C1C1A]">Lý do / Ghi chú đề xuất gửi Master:</label>
              <input
                type="text"
                value={adminProposalNote}
                onChange={(e) => setAdminProposalNote(e.target.value)}
                placeholder="Ví dụ: Điều chỉnh tăng hệ số tính chủ động và bổ sung tiêu chí chi tiết cho quý mới..."
                className="w-full text-xs p-2.5 border border-[#E7E7E4] rounded-lg focus:outline-hidden"
              />
            </div>
          )}

          <div className="space-y-4">
            {rubricDraft.map((crit, idx) => (
              <div key={crit.id} className="p-4 border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-[#24487c] text-white text-[11px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs text-[#1C1C1A]">{crit.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-[#64748B]">Hệ số:</span>
                    <input
                      type="number"
                      value={crit.weight}
                      onChange={(e) => {
                        const newW = Number(e.target.value);
                        setRubricDraft((prev) =>
                          prev.map((c) => (c.id === crit.id ? { ...c, weight: newW } : c))
                        );
                      }}
                      className="w-16 p-1 bg-white border border-[#CBD5E1] rounded text-center text-xs font-bold"
                      min={0}
                      max={10}
                    />
                  </div>
                </div>

                <input
                  type="text"
                  value={crit.vietnamese_name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setRubricDraft((prev) =>
                      prev.map((c) => (c.id === crit.id ? { ...c, vietnamese_name: newName } : c))
                    );
                  }}
                  className="w-full p-2 bg-white border border-[#CBD5E1] rounded-lg text-xs"
                  placeholder="Tên tiếng Việt của tiêu chuẩn..."
                />
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 bg-[#F6F6F4] border-t border-[#E7E7E4] flex items-center justify-end space-x-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#E7E7E4] rounded-lg text-xs font-semibold text-[#4A4A46] hover:bg-white cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSaveRubric}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#24487c] hover:bg-[#1E3A5F] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
          >
            <Save size={14} />
            <span>{isMaster ? 'Lưu & Cập Nhật Hệ Thống' : 'Gửi Đề Xuất Phê Duyệt'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
