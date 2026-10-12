// Quy tắc lọc project và tính điểm KPI từ file task
export const SPECIAL_GROUPS: Record<string, string[]> = {
  '3課': ['【事務代行】DYM人事', '【事務代行】株式会社Yメディカル'],
  GS: ['【事務代行】DYMメディカル', '【事務代行】株式会社ジーエスコンサルティング(ジーエススタッフ)'],
};

// Hằng số đếm các dòng 'only:*' (dòng cố định theo tháng/giờ) vào achieved
export const COUNT_FIXED_LINES_IN_ACHIEVED = true;

// Bảng gán kiểu dòng KPI theo tên đã chuẩn hóa
export const USER_RULE_ASSIGNMENTS: Record<string, string[]> = {
  'LY TIEU MY': ['excl:3課', 'only:3課'],
  'VO THI MY DUYEN': ['excl:3課', 'only:3課'],
  'DUONG THANH HUYEN': ['excl:3課', 'only:3課'],
  'NGUYEN MINH PHUONG': ['excl:3課', 'only:3課'],
  'HO THI THU YEN': ['excl:3課', 'only:3課'],
  'HOANG NGOC KHANH VAN': ['excl:3課', 'only:3課'],
  'TRAN YEN NHI': ['excl:3課'],
  'VU THANH HIEN': ['excl:GS', 'only:GS'],
  '内部インターン生1': ['excl:GS'],
  'TRAN HANH DINH DINH': ['only:GS'],
  'NGUYEN DOAN THUY THUC QUYEN': ['only:GS'],
};
