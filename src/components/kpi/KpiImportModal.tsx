import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  X,
  Download,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { excelService } from '../../services/storage';
import { KpiImportRow } from '../../types';

interface KpiImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KpiImportModal: React.FC<KpiImportModalProps> = ({ isOpen, onClose }) => {
  const {
    users,
    teams,
    kpiRecords,
    bulkApplyImportedKpis,
    downloadSampleTemplate,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [periodLabel, setPeriodLabel] = useState<string>('Tháng 03/2026');
  const [parsedRows, setParsedRows] = useState<KpiImportRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsLoading(true);

    try {
      const rows = await excelService.parseKpiImportFile(file, users, teams, kpiRecords);
      setParsedRows(rows);
      setStep('preview');
    } catch (err: any) {
      console.error('Lỗi khi đọc file Excel:', err);
      alert('Không thể đọc file Excel này. Vui lòng đảm bảo file đúng định dạng .xlsx');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedFile || parsedRows.length === 0) return;
    setIsApplying(true);

    try {
      await bulkApplyImportedKpis(parsedRows, selectedFile.name, periodLabel);
      onClose();
      // Reset state
      setStep('upload');
      setSelectedFile(null);
      setParsedRows([]);
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi ghi dữ liệu.');
    } finally {
      setIsApplying(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.status === 'valid').length;
  const invalidCount = parsedRows.filter((r) => r.status === 'invalid').length;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-[#E7E7E4] rounded-lg shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0EE]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded bg-[#7c9cd0]/15 text-[#24487c]">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1C1C1A]">
                Nhập KPI Hàng Loạt Từ File Excel (.xlsx)
              </h2>
              <p className="text-xs text-[#8A8A85]">
                {step === 'upload'
                  ? 'Tải lên bảng tính KPI để cập nhật tự động toàn bộ nhân sự'
                  : 'Kiểm tra đối chiếu giá trị cũ → mới trước khi áp dụng'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8A8A85] hover:text-[#1C1C1A] p-1.5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'upload' ? (
            <div className="space-y-6">
              {/* Period selection */}
              <div className="bg-[#F6F6F4] p-4 rounded-lg border border-[#E7E7E4] flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-[#1C1C1A] block">
                    Kỳ Áp Dụng Dữ Liệu
                  </label>
                  <p className="text-[11px] text-[#8A8A85]">
                    Chọn tháng hoặc quý áp dụng cho các bản ghi được nhập
                  </p>
                </div>
                <select
                  value={periodLabel}
                  onChange={(e) => setPeriodLabel(e.target.value)}
                  className="bg-white border border-[#E7E7E4] text-xs rounded-md px-3 py-1.5 text-[#1C1C1A] font-medium outline-hidden"
                >
                  <option value="Tháng 03/2026">Tháng 03/2026</option>
                  <option value="Tháng 02/2026">Tháng 02/2026</option>
                  <option value="Tháng 01/2026">Tháng 01/2026</option>
                  <option value="Quý 1/2026">Quý 1/2026</option>
                  <option value="Quý 2/2026">Quý 2/2026</option>
                </select>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#E7E7E4] hover:border-[#7c9cd0] hover:bg-[#7c9cd0]/5 rounded-xl p-10 text-center cursor-pointer transition-colors bg-[#FAFAF9] group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white border border-[#E7E7E4] group-hover:border-[#7c9cd0] group-hover:text-[#7c9cd0] flex items-center justify-center text-[#4A4A46] transition-colors shadow-xs">
                  <Upload size={22} />
                </div>
                <h3 className="text-sm font-semibold text-[#1C1C1A] group-hover:text-[#24487c] transition-colors">
                  Nhấp để tải file Excel lên (.xlsx)
                </h3>
                <p className="text-xs text-[#8A8A85] mt-1">
                  Hỗ trợ định dạng Microsoft Excel chuẩn (.xlsx)
                </p>
              </div>

              {/* Instructions & Template Download */}
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-[#E7E7E4]">
                <div className="flex items-start space-x-3">
                  <Info size={18} className="text-[#7c9cd0] mt-0.5" />
                  <div className="text-xs text-[#4A4A46]">
                    <span className="font-semibold text-[#1C1C1A]">Cần file mẫu chuẩn?</span>
                    <p className="text-[11px] text-[#8A8A85] mt-0.5">
                      Cột bắt buộc: Mã NV | Họ Tên | Team | Kỳ | Target | Achieved | Miss | Late
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleTemplate}
                  className="flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded bg-[#7c9cd0]/12 hover:bg-[#7c9cd0]/20 border border-[#7c9cd0]/30 text-[#24487c] transition-colors"
                >
                  <Download size={14} />
                  <span>Tải File Mẫu (.xlsx)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary stats of import */}
              <div className="flex items-center justify-between text-xs pb-3 border-b border-[#F0F0EE]">
                <div className="flex items-center space-x-4">
                  <span className="text-[#8A8A85]">
                    File: <strong className="text-[#1C1C1A]">{selectedFile?.name}</strong>
                  </span>
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#F0F4F0] text-[#6B8F71] font-medium">
                    <CheckCircle2 size={13} />
                    <span>{validCount} dòng hợp lệ</span>
                  </span>
                  {invalidCount > 0 && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#FDF2F2] text-[#B85D5D] font-medium">
                      <AlertTriangle size={13} />
                      <span>{invalidCount} dòng lỗi (bị bỏ qua)</span>
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setStep('upload');
                    setSelectedFile(null);
                  }}
                  className="text-xs text-[#8A8A85] hover:text-[#1C1C1A] underline"
                >
                  Chọn file khác
                </button>
              </div>

              {/* Diff Preview Table */}
              <div className="border border-[#E7E7E4] rounded-md overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F6F6F4] text-[#8A8A85] uppercase text-[10px] tracking-wider border-b border-[#E7E7E4] sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Dòng</th>
                        <th className="py-2.5 px-3">Mã NV</th>
                        <th className="py-2.5 px-3">Họ Tên</th>
                        <th className="py-2.5 px-3 text-right">Target Cũ → Mới</th>
                        <th className="py-2.5 px-3 text-right">Đạt Cũ → Mới</th>
                        <th className="py-2.5 px-3 text-center">Miss</th>
                        <th className="py-2.5 px-3 text-center">Late</th>
                        <th className="py-2.5 px-3">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0EE]">
                      {parsedRows.map((row) => {
                        const oldTarget = row.existing_record?.target ?? '—';
                        const oldAchieved = row.existing_record?.achieved ?? '—';
                        const isChanged = oldTarget !== row.target || oldAchieved !== row.achieved;

                        return (
                          <tr
                            key={row.row_number}
                            className={`hover:bg-[#FAFAF9] ${
                              row.status === 'invalid' ? 'bg-[#FFF8F8]' : ''
                            }`}
                          >
                            <td className="py-2 px-3 text-[#8A8A85]">{row.row_number}</td>
                            <td className="py-2 px-3 font-mono font-medium text-[#1C1C1A]">
                              {row.employee_code}
                            </td>
                            <td className="py-2 px-3 text-[#4A4A46]">{row.full_name}</td>
                            <td className="py-2 px-3 text-right font-mono">
                              <span className="text-[#8A8A85]">{oldTarget}</span>
                              <span className="mx-1.5 text-[#8A8A85]">→</span>
                              <span className="font-semibold text-[#1C1C1A]">{row.target}</span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              <span className="text-[#8A8A85]">{oldAchieved}</span>
                              <span className="mx-1.5 text-[#8A8A85]">→</span>
                              <span className="font-semibold text-[#1C1C1A]">{row.achieved}</span>
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-[#4A4A46]">
                              {row.miss_count}
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-[#4A4A46]">
                              {row.late_count}
                            </td>
                            <td className="py-2 px-3">
                              {row.status === 'valid' ? (
                                <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-[#F0F4F0] text-[#6B8F71] font-medium">
                                  Hợp lệ {isChanged && '(Cập nhật)'}
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-[#FDF2F2] text-[#B85D5D] font-medium"
                                  title={row.error_message}
                                >
                                  {row.error_message}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 bg-[#F6F6F4] rounded border border-[#E7E7E4] text-[11px] text-[#8A8A85] flex items-center justify-between">
                <span>
                  Hành động này sẽ ghi đè dữ liệu và lưu lại Audit Log (lịch sử phiên bản).
                </span>
                <span>Thông báo sẽ tự động gửi tới nhân sự được cập nhật.</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-[#F0F0EE] bg-[#FAFAF9]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded border border-[#E7E7E4] bg-white text-[#4A4A46] hover:bg-[#F6F6F4] transition-colors"
          >
            Huỷ bỏ
          </button>
          {step === 'preview' && (
            <button
              type="button"
              disabled={validCount === 0 || isApplying}
              onClick={handleApply}
              className="flex items-center space-x-2 px-5 py-2 text-xs font-semibold rounded bg-[#7c9cd0] hover:bg-[#6788be] text-white shadow-xs transition-colors disabled:opacity-50"
            >
              <span>{isApplying ? 'Đang áp dụng...' : `Áp dụng ${validCount} bản ghi`}</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
