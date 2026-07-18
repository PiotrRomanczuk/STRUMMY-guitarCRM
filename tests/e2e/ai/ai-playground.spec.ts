import { test, expect } from '../../fixtures';

/**
 * AI Assistant Chat
 *
 * The conversational assistant moved from /dashboard/ai to /dashboard/ai/chat during
 * the editorial redesign: /dashboard/ai now renders insight cards + an email draft
 * generator, while the chat lives at /dashboard/ai/chat (components/ai/chat/*).
 *
 * The current chat has no model selector and no minimize/maximize control, so those
 * two specs were removed rather than asserting UI that no longer exists.
 *
 * Send *wiring* (user message echo, input clear, transcript reset) only needs the
 * database, so it always runs. The assistant's *reply* needs a reachable AI provider,
 * so that assertion is gated behind E2E_AI_PROVIDER.
 */
test.describe('AI Assistant Chat', { tag: ['@ai', '@admin'] }, () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('admin');
    await page.goto('/dashboard/ai/chat');
    await page.waitForLoadState('networkidle');
  });

  test('page loads with welcome message', async ({ page }) => {
    const card = page.getByTestId('ai-assistant-card');
    await expect(card).toBeVisible();

    // The transcript opens with a system welcome message.
    const messages = page.getByTestId('ai-messages');
    await expect(messages).toBeVisible();
    await expect(messages).toContainText('Strummy AI assistant');
  });

  test('chat input and send button are visible', async ({ page }) => {
    const input = page.getByTestId('ai-assistant-input');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', 'Ask about students, songs, theory...');

    const sendButton = page.getByTestId('ai-assistant-send');
    await expect(sendButton).toBeVisible();
    await expect(sendButton).toBeDisabled(); // disabled when the input is empty
  });

  test('suggested prompts appear on a fresh conversation', async ({ page }) => {
    const firstPrompt = page.getByTestId('ai-suggested-prompt-0');
    await expect(firstPrompt).toBeVisible();
    await expect(firstPrompt).toBeEnabled();
  });

  test('suggested prompt sends a message', async ({ page }) => {
    test.slow();

    const suggestedPrompt = page.getByTestId('ai-suggested-prompt-0');
    await expect(suggestedPrompt).toBeVisible();
    const promptText = (await suggestedPrompt.textContent())!.trim();

    await suggestedPrompt.click();

    // The user's message is echoed into the transcript (needs only the DB, not a provider).
    const messages = page.getByTestId('ai-messages');
    await expect(messages).toContainText(promptText, { timeout: 10_000 });
  });

  test('type and send a message', async ({ page }) => {
    test.slow();

    const input = page.getByTestId('ai-assistant-input');
    const sendButton = page.getByTestId('ai-assistant-send');

    await input.fill('What is a G major chord?');
    await expect(sendButton).toBeEnabled();
    await sendButton.click();

    // Send wiring: the user message echoes and the input clears — no AI provider required.
    const messages = page.getByTestId('ai-messages');
    await expect(messages).toContainText('What is a G major chord?', { timeout: 10_000 });
    await expect(input).toHaveValue('');

    // The assistant's reply needs a reachable provider; only assert it when one is configured.
    if (process.env.E2E_AI_PROVIDER) {
      await expect(messages.getByText('Strummy AI', { exact: true }).first()).toBeVisible({
        timeout: 30_000,
      });
    }
  });

  test('New Conversation resets the transcript to the welcome message', async ({ page }) => {
    test.slow();

    const input = page.getByTestId('ai-assistant-input');
    await input.fill('Hello there');
    await page.getByTestId('ai-assistant-send').click();

    const messages = page.getByTestId('ai-messages');
    await expect(messages).toContainText('Hello there', { timeout: 10_000 });

    // "New Conversation" clears the transcript back to just the welcome message.
    await page.getByRole('button', { name: /new conversation/i }).click();

    await expect(messages).toContainText('Strummy AI assistant');
    await expect(messages).not.toContainText('Hello there');
  });
});
