import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { missingCases } from '../data/login-cases.js';

test.describe('Đăng nhập', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
  });

  test('đăng nhập thành công', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login('user@example.test', 'Password123!');
    await expect(loginPage.dashboardHeading).toBeVisible();
    await expect(loginPage.dashboardHeading).toHaveText('Chào mừng');
  });

  test('sai mật khẩu', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login('user@example.test', 'incorrect');
    await expect(loginPage.error).toBeVisible();
    await expect(loginPage.error).toHaveText('Email hoặc mật khẩu không đúng');
  });

  for (const data of missingCases) {
    test(data.name, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.login(data.email, data.password);
      await expect(loginPage.error).toBeVisible();
      await expect(loginPage.error).toHaveText(data.expectedError);
    });
  }
});
