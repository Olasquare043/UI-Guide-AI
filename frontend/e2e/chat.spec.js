import { expect, test } from '@playwright/test'

const apiOrigin = 'http://localhost:8000'

const mockApi = async (
  page,
  {
    capabilities = {
      server_speech_transcription: true,
      server_speech_synthesis: true,
      vector_store_ready: true,
    },
    onChat,
    onSpeechTranscribe,
    onSpeechSynthesize,
  } = {}
) => {
  await page.route(`${apiOrigin}/health`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'healthy', message: 'Connected' }),
    })
  })

  await page.route(`${apiOrigin}/capabilities`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(capabilities),
    })
  })

  await page.route(`${apiOrigin}/chat`, async (route) => {
    if (onChat) {
      await onChat(route)
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        answer: 'Admissions open in September.',
        used_retriever: false,
        thread_id: 'chat_test',
        sources: [],
      }),
    })
  })

  await page.route(`${apiOrigin}/speech/transcribe`, async (route) => {
    if (onSpeechTranscribe) {
      await onSpeechTranscribe(route)
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ text: 'Tell me about admissions' }),
    })
  })

  await page.route(`${apiOrigin}/speech/synthesize`, async (route) => {
    if (onSpeechSynthesize) {
      await onSpeechSynthesize(route)
      return
    }

    await route.fulfill({
      status: 200,
      headers: {
        'content-type': 'audio/mpeg',
      },
      body: 'ID3',
    })
  })
}

test('shows server speech readiness from capabilities', async ({ page }) => {
  await mockApi(page, {
    capabilities: {
      server_speech_transcription: true,
      server_speech_synthesis: true,
      vector_store_ready: true,
    },
  })

  await page.goto('/chat', { waitUntil: 'domcontentloaded' })

  await expect(page.getByText('Server speech ready')).toBeVisible()
})

test('allows canceling an in-flight chat request', async ({ page }) => {
  await mockApi(page, {
    onChat: async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          answer: 'Delayed assistant answer',
          used_retriever: false,
          thread_id: 'chat_cancel',
          sources: [],
        }),
      })
    },
  })

  await page.goto('/chat')

  await page.getByLabel('Message UI Guide').fill('What are the admission requirements?')
  await page.getByRole('button', { name: 'Send' }).click()
  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible()

  await page.getByRole('button', { name: 'Stop' }).click()
  await expect(page.getByRole('button', { name: 'Send' })).toBeVisible()

  await page.waitForTimeout(1800)
  await expect(page.getByText('Delayed assistant answer')).toHaveCount(0)
})

test('records audio and fills chat input from server transcription fallback', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'SpeechRecognition', {
      configurable: true,
      writable: true,
      value: undefined,
    })
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      writable: true,
      value: undefined,
    })

    class FakeMediaRecorder {
      constructor(stream) {
        this.stream = stream
        this.state = 'inactive'
        this.mimeType = 'audio/webm'
      }

      start() {
        this.state = 'recording'
      }

      stop() {
        this.state = 'inactive'
        const data = new Blob(['voice-bytes'], { type: this.mimeType })
        this.ondataavailable?.({ data })
        this.onstop?.()
      }
    }

    Object.defineProperty(window, 'MediaRecorder', {
      configurable: true,
      writable: true,
      value: FakeMediaRecorder,
    })

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => ({
          getTracks: () => [{ stop() {} }],
        }),
      },
    })
  })

  await mockApi(page, {
    capabilities: {
      server_speech_transcription: true,
      server_speech_synthesis: false,
      vector_store_ready: true,
    },
  })

  await page.goto('/chat', { waitUntil: 'domcontentloaded' })

  await expect(page.getByRole('button', { name: 'Start voice input' })).toBeVisible()
  await page.getByRole('button', { name: 'Start voice input' }).click()
  await expect(page.getByRole('button', { name: 'Stop voice input' })).toBeVisible()
  await page.getByRole('button', { name: 'Stop voice input' }).click()

  await expect(page.getByLabel('Message UI Guide')).toHaveValue('Tell me about admissions')
})
