import { expect, test } from '../fixtures';
import { AuthPage } from '../pages/auth';
import { generateRandomTestUser } from '../helpers';

test.describe
  .serial('User Session', () => {
    test('Create a user session', async ({ page }) => {
      const user = generateRandomTestUser();
      const authPage = new AuthPage(page);

      await authPage.register(user.email, user.password);
    });

    test('Test sign in with valid credentials', async ({ page }) => {
      const user = generateRandomTestUser();
      const authPage = new AuthPage(page);

      await authPage.register(user.email, user.password);
      await authPage.logout(user.email, user.password);

      await authPage.login(user.email, user.password);

      await expect(page).toHaveURL('/');
    });

    test('Test sign in with invalid credentials', async ({ page }) => {
      const authPage = new AuthPage(page);

      await authPage.login('invalid@email.com', 'invalidpassword');

      await authPage.expectToastToContain('Invalid credentials');
    });

    test('Log out as user', async ({ page }) => {
      const user = generateRandomTestUser();
      const authPage = new AuthPage(page);

      await authPage.register(user.email, user.password);
      await authPage.logout(user.email, user.password);
    });

    test('Log out is available for users', async ({ page }) => {
      const user = generateRandomTestUser();
      const authPage = new AuthPage(page);

      await authPage.register(user.email, user.password);

      await authPage.openSidebar();

      const userNavButton = page.getByTestId('user-nav-button');
      await expect(userNavButton).toBeVisible();

      await userNavButton.click();
      const userNavMenu = page.getByTestId('user-nav-menu');
      await expect(userNavMenu).toBeVisible();

      const authMenuItem = page.getByTestId('user-nav-item-auth');
      await expect(authMenuItem).toContainText('Sign out');
    });

    test('Do not navigate to /register for authenticated users', async ({
      page,
    }) => {
      const user = generateRandomTestUser();
      const authPage = new AuthPage(page);

      await authPage.register(user.email, user.password);

      await page.goto('/register');

      await expect(page).toHaveURL('/');
    });

    test('Do not navigate to /login for authenticated users', async ({
      page,
    }) => {
      const user = generateRandomTestUser();
      const authPage = new AuthPage(page);

      await authPage.register(user.email, user.password);

      await page.goto('/login');

      await expect(page).toHaveURL('/');
    });

    test('Show email in user menu for authenticated user', async ({ page }) => {
      const user = generateRandomTestUser();
      const authPage = new AuthPage(page);

      await authPage.register(user.email, user.password);

      await authPage.openSidebar();

      const userNavButton = page.getByTestId('user-nav-button');
      await expect(userNavButton).toBeVisible();

      await userNavButton.click();
      const userNavMenu = page.getByTestId('user-nav-menu');
      await expect(userNavMenu).toBeVisible();

      const userEmail = page.getByTestId('user-email');
      await expect(userEmail).toContainText(user.email);
    });
  });
