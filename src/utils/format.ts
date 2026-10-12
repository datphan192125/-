import { EmployeeRank, RANK_STYLE_CONFIG } from '../types';

/**
 * Chuẩn hóa tên nhân sự, loại bỏ thông tin trong ngoặc đơn/kép/vuông
 */
export const cleanName = (name?: string | null): string => {
  if (!name) return '—';
  return name.replace(/\s*[\(\[\{].*?[\)\]\}]\s*/g, '').trim();
};

/**
 * Định dạng số với dấu phân cách hàng nghìn (chuẩn Đức: de-DE: 1.000)
 */
export const formatNumber = (num?: number | null): string => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return num.toLocaleString('de-DE');
};

/**
 * Lấy cấu hình màu sắc badge cấp bậc nhân sự (bg, text, border)
 */
export const getRankBadgeColor = (
  rank?: EmployeeRank | string | null
): { bg: string; text: string; border: string; label: string } => {
  if (rank && RANK_STYLE_CONFIG[rank as EmployeeRank]) {
    const config = RANK_STYLE_CONFIG[rank as EmployeeRank];
    return {
      bg: config.bg,
      text: config.text,
      border: config.border || 'transparent',
      label: config.label,
    };
  }
  return { bg: '#DCE8F5', text: '#1E3A5F', border: '#B8D1EB', label: rank || '—' };
};
