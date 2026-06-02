import { expect, test } from '@playwright/test';

test('login visual, envio de codigo y visualizacion de hallazgos', async ({ page }) => {
  await page.route('http://localhost:8080/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'jwt-demo-token',
        email: 'demo@example.com',
        expiresAt: '2026-05-18T10:00:00',
      }),
    });
  });

  await page.route('http://localhost:8080/api/audits**', async (route) => {
    const headers = route.request().headers();
    expect(headers.authorization).toBe('Bearer jwt-demo-token');
    const requestUrl = route.request().url();

    if (requestUrl.endsWith('/api/audits/metrics')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalAudits: 1,
          totalFindings: 1,
          byRiskLevel: { critical: 1 },
          byLanguage: { java: 1 },
        }),
      });
      return;
    }

    if (requestUrl.endsWith('/api/audits/audit-1')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          auditId: 'audit-1',
          language: 'java',
          code: 'String sql = "SELECT * FROM users WHERE id=" + userId;',
          status: 'success',
          riskLevel: 'critical',
          findings: [
            {
              type: 'security',
              severity: 'critical',
              title: 'Possible SQL Injection',
              description: 'The code concatenates user input directly into SQL.',
              line: 3,
              suggestion: 'Use parameterized queries.',
            },
          ],
          pedagogicalExplanation: 'SQL Injection permite alterar consultas.',
          refactoredCode: 'PreparedStatement stmt = connection.prepareStatement("SELECT * FROM users WHERE id = ?");',
          estimatedTokens: 24,
          estimatedCostUsd: 0.000004,
          createdAt: '2026-05-17T22:00:00',
        }),
      });
      return;
    }

    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            auditId: 'audit-1',
            language: 'java',
            status: 'success',
            riskLevel: 'critical',
            findingsCount: 1,
            estimatedTokens: 24,
            estimatedCostUsd: 0.000004,
            createdAt: '2026-05-17T22:00:00',
          },
        ]),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        auditId: 'audit-1',
        status: 'pending',
        riskLevel: 'unknown',
        findings: [],
        pedagogicalExplanation: 'La auditoria fue creada y esta en cola de procesamiento.',
        refactoredCode: '',
        estimatedTokens: 24,
        estimatedCostUsd: 0.000004,
      }),
    });
  });

  await page.goto('/');

  await page.getByPlaceholder('email@dominio.com').fill('demo@example.com');
  await page.getByPlaceholder('Contrasena').fill('password123');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page.getByText('demo@example.com')).toBeVisible();

  await page.getByRole('button', { name: 'Analizar' }).click();

  await expect(page.getByText('Possible SQL Injection')).toBeVisible();
  await expect(page.getByText('Use parameterized queries.')).toBeVisible();
  await expect(page.locator('.findings-pane header span')).toHaveText('1 hallazgo');
  await expect(page.getByText('Riesgo general')).toBeVisible();

  await page.getByRole('button', { name: /Historial/ }).click();
  await expect(page.getByRole('heading', { name: 'Historial' })).toBeVisible();

  await page.getByRole('button', { name: /Metricas/ }).click();
  await expect(page.getByRole('heading', { name: 'Metricas' })).toBeVisible();
  await expect(page.getByText('Auditorias', { exact: true })).toBeVisible();
});