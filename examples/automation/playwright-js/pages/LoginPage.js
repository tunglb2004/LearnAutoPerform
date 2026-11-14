export class LoginPage {
  constructor(page) {
    this.page = page;
    this.email = page.getByLabel('Email', { exact: true });
    this.password = page.getByLabel('Mật khẩu', { exact: true });
    this.submit = page.getByRole('button', { name: 'Đăng nhập', exact: true });
    this.dashboardHeading = page.getByTestId('dashboard-heading');
    this.error = page.getByTestId('login-error');
  }

  async open() {
    await this.page.goto('/login');
  }

  async login(email, password) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}
