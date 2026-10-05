import { expect, type Locator, type Page } from '@playwright/test'

export class LoginPage {
  readonly email: Locator
  readonly password: Locator
  readonly submit: Locator
  readonly error: Locator

  constructor(private readonly page: Page) {
    this.email = page.getByLabel('Email')
    this.password = page.getByLabel('Contraseña')
    this.submit = page.getByRole('button', { name: 'Entrar' })
    this.error = page.getByRole('alert')
  }

  async goto() {
    await this.page.goto('/login')
    await expect(this.page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
  }

  async login(email: string, password: string) {
    await this.email.fill(email)
    await this.password.fill(password)
    await this.submit.click()
  }
}
