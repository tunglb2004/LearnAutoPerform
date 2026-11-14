export const missingCases = [
  {
    name: 'thiếu email',
    email: '',
    password: 'Password123!',
    expectedError: 'Vui lòng nhập email và mật khẩu',
  },
  {
    name: 'thiếu mật khẩu',
    email: 'user@example.test',
    password: '',
    expectedError: 'Vui lòng nhập email và mật khẩu',
  },
];
