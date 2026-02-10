import {
  AlertTriangle,
  Copy,
  Download,
  FileText,
  RefreshCcw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import FormField from '../components/FormField'
import MarkdownContent from '../components/MarkdownContent'
import Stepper from '../components/Stepper'
import useToast from '../hooks/useToast'
import useLocalStorage from '../hooks/useLocalStorage'
import usePreferences from '../hooks/usePreferences'
import { sendMessage } from '../services/api'
import {
  buildGuidancePrompt,
  exportGuidanceMarkdown,
  parseGuidanceMarkdown,
} from '../utils/guidance'

const guideSchema = z.object({
  context: z.string().min(3, 'Select a context to continue.'),
  task: z.string().min(10, 'Describe the task in at least 10 characters.'),
  uiDescription: z.string().optional(),
  constraints: z.string().optional(),
  verbosity: z.enum(['concise', 'normal', 'detailed']),
})

const stepLabels = ['Input', 'Analyze', 'Guidance', 'Next steps']
const MAX_UPLOAD_CHARS = 4000

const Guide = () => {
  const { pushToast } = useToast()
  const { preferences, setVerbosity } = usePreferences()
  const [, setGuides] = useLocalStorage('ui-guide-guides', [])
  const [currentStep, setCurrentStep] = useState(0)
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [expandedWhy, setExpandedWhy] = useState({})
  const [feedback, setFeedback] = useState({})
  const [reporting, setReporting] = useState({})
  const [reports, setReports] = useState({})
  const abortRef = useRef(null)

  const defaultValues = useMemo(
    () => ({
      context: 'Admissions portal',
      task: '',
      uiDescription: '',
      constraints: '',
      verbosity: preferences.verbosity || 'normal',
    }),
    [preferences.verbosity]
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(guideSchema),
    defaultValues,
  })

  const watchedVerbosity = watch('verbosity')
  useEffect(() => {
    if (watchedVerbosity) {
      setVerbosity(watchedVerbosity)
    }
  }, [watchedVerbosity, setVerbosity])

  const summary = useMemo(() => result?.summary || '', [result])

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const content = String(reader.result || '').slice(0, MAX_UPLOAD_CHARS)
      setValue('uiDescription', content, { shouldDirty: true })
      pushToast({
        title: 'File imported',
        description: 'We added the file contents to the UI description field.',
        variant: 'success',
      })
    }
    reader.onerror = () => {
      pushToast({
        title: 'Upload failed',
        description: 'Unable to read that file.',
        variant: 'error',
      })
    }
    reader.readAsText(file)
  }

  const onSubmit = async (data) => {
    if (abortRef.current) {
      abortRef.current.abort()
    }

    const controller = new AbortController()
    abortRef.current = controller
    setIsLoading(true)
    setCurrentStep(1)
    setResult(null)

    const prompt = buildGuidancePrompt(data)

    try {
      const response = await sendMessage({
        message: prompt,
        threadId: `guide_${Date.now()}`,
        mode: 'guide',
        context: data.context,
        verbosity: data.verbosity,
        signal: controller.signal,
      })

      const parsed = parseGuidanceMarkdown(response.answer)
      const entry = {
        id: `${Date.now()}`,
        title: data.task.slice(0, 60),
        context: data.context,
        verbosity: data.verbosity,
        response: response.answer,
        parsed,
        sources: response.sources || [],
        createdAt: new Date().toISOString(),
      }

      setGuides((prev) => [entry, ...prev].slice(0, 25))
      setResult(entry)
      setCurrentStep(3)
      pushToast({
        title: 'Guidance ready',
        description: 'Your walkthrough has been generated.',
        variant: 'success',
      })
    } catch (error) {
      if (!error.isCanceled) {
        pushToast({
          title: 'Unable to generate guidance',
          description: error.message || 'Please try again shortly.',
          variant: 'error',
        })
      }
    } finally {
      setIsLoading(false)
      abortRef.current = null
    }
  }

  const handleCopy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text)
      pushToast({ title: `${label} copied`, variant: 'success' })
    } catch {
      pushToast({ title: 'Copy failed', variant: 'error' })
    }
  }

  const handleExport = () => {
    if (!result) return
    const markdown = exportGuidanceMarkdown({
      title: result.title,
      context: result.context,
      content: result.response,
    })

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${result.title.replace(/\s+/g, '-').toLowerCase()}.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    if (abortRef.current) {
      abortRef.current.abort()
    }
    reset(defaultValues)
    setResult(null)
    setCurrentStep(0)
    setExpandedWhy({})
    setFeedback({})
    setReporting({})
    setReports({})
  }

  const steps = result?.parsed?.steps || []

  return (
    <div className="space-y-10">
      <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-sm lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Guided Walkthrough
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900 lg:text-3xl">
              Turn complex UI journeys into step-by-step guidance.
            </h1>
          </div>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-[var(--ui-brand)] hover:text-[var(--ui-brand)]"
          >
            <RefreshCcw className="h-4 w-4" />
            Start over
          </button>
        </div>
        <div className="mt-6">
          <Stepper steps={stepLabels} currentStep={currentStep} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-sm lg:p-8"
        >
          <FormField
            label="App context"
            description="Select the part of the University of Ibadan experience you are guiding."
            error={errors.context?.message}
            htmlFor="context"
          >
            <select
              id="context"
              {...register('context')}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-[var(--ui-brand)]"
            >
              <option>Admissions portal</option>
              <option>Course registration</option>
              <option>Faculty services</option>
              <option>Student housing</option>
              <option>Library services</option>
              <option>General policy inquiry</option>
            </select>
          </FormField>

          <FormField
            label="Primary task"
            description="Describe what the user needs to achieve."
            error={errors.task?.message}
            htmlFor="task"
          >
            <textarea
              id="task"
              rows={4}
              {...register('task')}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-[var(--ui-brand)]"
              placeholder="Example: Guide a first-year student through course registration and fee confirmation."
            />
          </FormField>

          <FormField
            label="UI description (optional)"
            description="Paste any UI text or flow details you already have."
            htmlFor="uiDescription"
          >
            <textarea
              id="uiDescription"
              rows={3}
              {...register('uiDescription')}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-[var(--ui-brand)]"
              placeholder="Example: The portal shows course list, payment button, and a confirmation modal."
            />
          </FormField>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800" htmlFor="uiUpload">
              Upload UI notes (txt or markdown)
            </label>
            <input
              id="uiUpload"
              type="file"
              accept=".txt,.md"
              onChange={handleFileUpload}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 focus:border-[var(--ui-brand)]"
            />
            <p className="text-xs text-slate-500">We only read the file locally and append it.</p>
          </div>

          <FormField
            label="Constraints (optional)"
            description="List deadlines, approvals, or special considerations."
            htmlFor="constraints"
          >
            <textarea
              id="constraints"
              rows={3}
              {...register('constraints')}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-[var(--ui-brand)]"
              placeholder="Example: Must complete within two days of registration opening."
            />
          </FormField>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-800">Verbosity</p>
            <div className="flex flex-wrap gap-3">
              {['concise', 'normal', 'detailed'].map((level) => (
                <label
                  key={level}
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-[var(--ui-brand)] hover:text-[var(--ui-brand)]"
                >
                  <input
                    type="radio"
                    value={level}
                    {...register('verbosity')}
                    className="h-3 w-3 text-[var(--ui-brand)]"
                  />
                  {level}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ui-brand)] px-6 py-4 text-sm font-semibold text-white shadow-lg hover:bg-[var(--ui-brand-strong)] disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {isLoading ? 'Generating guidance...' : 'Generate walkthrough'}
            <Sparkles className="h-4 w-4" />
          </button>
        </form>

        <div className="space-y-6 rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-sm lg:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Guidance output</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExport}
                disabled={!result}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-[var(--ui-brand)] hover:text-[var(--ui-brand)] disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              <button
                type="button"
                onClick={() => handleCopy(result?.response || '', 'Guidance')}
                disabled={!result}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-[var(--ui-brand)] hover:text-[var(--ui-brand)] disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
                Copy
              </button>
            </div>
          </div>

          {!result && !isLoading && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Your guided walkthrough will appear here after you submit the form.
            </div>
          )}

          {isLoading && (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
              <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />
              <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
              <div className="h-4 w-5/6 animate-pulse rounded-full bg-slate-100" />
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Summary
                </p>
                <p className="mt-2 text-sm text-slate-700">{summary}</p>
              </div>

              <div className="space-y-4">
                {steps.length === 0 ? (
                  <MarkdownContent>{result.response}</MarkdownContent>
                ) : (
                  steps.map((step, index) => (
                    <div
                      key={`${step.text}-${index}`}
                      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Step {index + 1}
                          </p>
                          <h3 className="mt-2 text-base font-semibold text-slate-900">
                            {step.text}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(step.text, 'Step')}
                          className="rounded-full border border-slate-200 p-2 text-slate-500 hover:border-[var(--ui-brand)] hover:text-[var(--ui-brand)]"
                          aria-label="Copy step"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>

                      {step.why && (
                        <button
                          type="button"
                          className="mt-4 text-xs font-semibold text-slate-600 underline"
                          onClick={() =>
                            setExpandedWhy((prev) => ({
                              ...prev,
                              [index]: !prev[index],
                            }))
                          }
                        >
                          {expandedWhy[index] ? 'Hide rationale' : 'Why this step?'}
                        </button>
                      )}
                      {expandedWhy[index] && step.why && (
                        <p className="mt-2 text-sm text-slate-600">{step.why}</p>
                      )}

                      {(step.note || step.warning) && (
                        <div className="mt-4 grid gap-3">
                          {step.note && (
                            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                              Note: {step.note}
                            </div>
                          )}
                          {step.warning && (
                            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                              <AlertTriangle className="mt-0.5 h-4 w-4" />
                              <span>Warning: {step.warning}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>Was this step helpful?</span>
                        <button
                          type="button"
                          onClick={() =>
                            setFeedback((prev) => ({
                              ...prev,
                              [index]: 'up',
                            }))
                          }
                          className={`rounded-full border px-3 py-1 ${
                            feedback[index] === 'up'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 text-slate-500'
                          }`}
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFeedback((prev) => ({
                              ...prev,
                              [index]: 'down',
                            }))
                          }
                          className={`rounded-full border px-3 py-1 ${
                            feedback[index] === 'down'
                              ? 'border-rose-200 bg-rose-50 text-rose-700'
                              : 'border-slate-200 text-slate-500'
                          }`}
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setReporting((prev) => ({
                              ...prev,
                              [index]: !prev[index],
                            }))
                          }
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 hover:border-[var(--ui-brand)] hover:text-[var(--ui-brand)]"
                        >
                          Report issue
                        </button>
                      </div>

                      {reporting[index] && (
                        <div className="mt-3 space-y-2">
                          <textarea
                            rows={2}
                            value={reports[index] || ''}
                            onChange={(event) =>
                              setReports((prev) => ({
                                ...prev,
                                [index]: event.target.value,
                              }))
                            }
                            placeholder="Describe the issue with this step."
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-600 focus:border-[var(--ui-brand)]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              pushToast({
                                title: 'Report saved',
                                description: 'Thanks for the feedback.',
                                variant: 'success',
                              })
                              setReporting((prev) => ({ ...prev, [index]: false }))
                            }}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-[var(--ui-brand)] hover:text-[var(--ui-brand)]"
                          >
                            Submit report
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {result?.parsed?.nextSteps?.length > 0 && (
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Next steps
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {result.parsed.nextSteps.map((item, index) => (
                      <li key={`${item}-${index}`} className="flex gap-2">
                        <FileText className="mt-0.5 h-4 w-4 text-slate-400" />
                        <span>{item.replace(/^[-*]\s+/, '')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.sources?.length > 0 && (
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Verified sources
                  </p>
                  <div className="mt-3 space-y-2 text-xs text-slate-600">
                    {result.sources.map((source, index) => (
                      <div
                        key={`${source.document}-${index}`}
                        className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                      >
                        <p className="font-semibold text-slate-700">
                          {source.document || 'University of Ibadan document'}
                        </p>
                        <p>Page {source.page || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Guide
