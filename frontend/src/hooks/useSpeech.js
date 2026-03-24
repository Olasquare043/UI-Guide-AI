import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { synthesizeSpeech, transcribeAudio } from '../services/api'
import { toSpeechPlainText } from '../utils/speech'

const useSpeech = ({ pushToast }) => {
  const [isListening, setIsListening] = useState(false)
  const [listeningTarget, setListeningTarget] = useState(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcribingTarget, setTranscribingTarget] = useState(null)
  const [speakingId, setSpeakingId] = useState(null)

  const recognitionRef = useRef(null)
  const transcriptCallbackRef = useRef(null)
  const listeningBaseRef = useRef('')
  const mediaRecorderRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const audioChunksRef = useRef([])
  const audioElementRef = useRef(null)
  const audioUrlRef = useRef(null)
  const playbackAbortRef = useRef(null)

  const speechRecognitionSupported = useMemo(() => {
    if (typeof window === 'undefined') return false
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  }, [])

  const mediaRecordingSupported = useMemo(() => {
    if (typeof window === 'undefined') return false
    return 'MediaRecorder' in window && !!navigator.mediaDevices?.getUserMedia
  }, [])

  const browserSpeechPlaybackSupported = useMemo(() => {
    if (typeof window === 'undefined') return false
    return 'speechSynthesis' in window
  }, [])

  const stopPlayback = useCallback(() => {
    playbackAbortRef.current?.abort()
    playbackAbortRef.current = null

    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current.src = ''
      audioElementRef.current = null
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    setSpeakingId(null)
  }, [])

  const cleanupRecorder = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    mediaStreamRef.current = null
    mediaRecorderRef.current = null
    audioChunksRef.current = []
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }

    setIsListening(false)
    setListeningTarget(null)
  }, [])

  useEffect(() => {
    return () => {
      stopListening()
      stopPlayback()
      cleanupRecorder()
    }
  }, [cleanupRecorder, stopListening, stopPlayback])

  const playWithBrowserSpeech = useCallback(
    (speechId, spokenText) => {
      if (!browserSpeechPlaybackSupported) return false

      const utterance = new SpeechSynthesisUtterance(spokenText)
      utterance.lang = navigator.language || 'en-NG'
      utterance.onend = () => {
        setSpeakingId((current) => (current === speechId ? null : current))
      }
      utterance.onerror = () => {
        setSpeakingId((current) => (current === speechId ? null : current))
        pushToast({
          title: 'Read aloud failed',
          description: 'The browser could not play this response.',
          variant: 'error',
        })
      }

      setSpeakingId(speechId)
      window.speechSynthesis.speak(utterance)
      return true
    },
    [browserSpeechPlaybackSupported, pushToast]
  )

  const togglePlayback = useCallback(
    async ({ id, text, voice }) => {
      if (speakingId === id) {
        stopPlayback()
        return
      }

      const spokenText = toSpeechPlainText(text)
      if (!spokenText) {
        pushToast({
          title: 'Nothing to read',
          description: 'This response does not contain readable text yet.',
          variant: 'error',
        })
        return
      }

      stopPlayback()

      const controller = new AbortController()
      playbackAbortRef.current = controller

      try {
        const { blob } = await synthesizeSpeech({
          text: spokenText,
          voice,
          signal: controller.signal,
        })
        const objectUrl = URL.createObjectURL(blob)
        const audio = new Audio(objectUrl)

        audioElementRef.current = audio
        audioUrlRef.current = objectUrl
        audio.onended = () => {
          if (audioUrlRef.current === objectUrl) {
            URL.revokeObjectURL(objectUrl)
            audioUrlRef.current = null
          }
          if (audioElementRef.current === audio) {
            audioElementRef.current = null
          }
          playbackAbortRef.current = null
          setSpeakingId((current) => (current === id ? null : current))
        }
        audio.onerror = () => {
          if (audioUrlRef.current === objectUrl) {
            URL.revokeObjectURL(objectUrl)
            audioUrlRef.current = null
          }
          if (audioElementRef.current === audio) {
            audioElementRef.current = null
          }
          playbackAbortRef.current = null

          if (!playWithBrowserSpeech(id, spokenText)) {
            setSpeakingId(null)
            pushToast({
              title: 'Read aloud failed',
              description: 'Unable to generate audio for this response.',
              variant: 'error',
            })
          }
        }

        setSpeakingId(id)
        await audio.play()
      } catch (error) {
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current)
          audioUrlRef.current = null
        }
        audioElementRef.current = null
        if (error.name === 'AbortError' || error.isCanceled) return
        playbackAbortRef.current = null

        if (!playWithBrowserSpeech(id, spokenText)) {
          setSpeakingId(null)
          pushToast({
            title: 'Read aloud failed',
            description: error.message || 'Unable to generate audio for this response.',
            variant: 'error',
          })
        }
      }
    },
    [playWithBrowserSpeech, pushToast, speakingId, stopPlayback]
  )

  const startRecorderDictation = useCallback(
    async ({ id, initialText = '', onTranscript }) => {
      if (!mediaRecordingSupported) {
        pushToast({
          title: 'Voice input unavailable',
          description: 'This browser does not support microphone recording.',
          variant: 'error',
        })
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream)

        mediaStreamRef.current = stream
        mediaRecorderRef.current = recorder
        audioChunksRef.current = []
        transcriptCallbackRef.current = onTranscript
        listeningBaseRef.current = initialText.trim()

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        recorder.onerror = () => {
          cleanupRecorder()
          setIsListening(false)
          setListeningTarget(null)
          pushToast({
            title: 'Voice input stopped',
            description: 'Unable to record audio right now.',
            variant: 'error',
          })
        }

        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: recorder.mimeType || 'audio/webm',
          })

          cleanupRecorder()
          setIsListening(false)
          setListeningTarget(null)

          if (!audioBlob.size) return

          setIsTranscribing(true)
          setTranscribingTarget(id)

          try {
            const { text } = await transcribeAudio({
              blob: audioBlob,
              language: navigator.language?.slice(0, 2),
            })
            const mergedText = [listeningBaseRef.current, text].filter(Boolean).join(' ').trim()
            transcriptCallbackRef.current?.(mergedText)
          } catch (error) {
            pushToast({
              title: 'Transcription failed',
              description: error.message || 'Unable to transcribe the recorded audio.',
              variant: 'error',
            })
          } finally {
            setIsTranscribing(false)
            setTranscribingTarget(null)
            transcriptCallbackRef.current = null
          }
        }

        recorder.start()
        setListeningTarget(id)
        setIsListening(true)
      } catch (error) {
        cleanupRecorder()
        pushToast({
          title: 'Voice input unavailable',
          description:
            error.name === 'NotAllowedError'
              ? 'Microphone permission was denied.'
              : 'The microphone could not be started. Please try again.',
          variant: 'error',
        })
      }
    },
    [cleanupRecorder, mediaRecordingSupported, pushToast]
  )

  const toggleListening = useCallback(
    async ({ id, initialText = '', onTranscript }) => {
      if (isListening && listeningTarget === id) {
        stopListening()
        return
      }

      if (isListening) {
        stopListening()
      }

      stopPlayback()

      if (speechRecognitionSupported) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

        if (!recognitionRef.current) {
          const recognition = new SpeechRecognition()
          recognition.continuous = true
          recognition.interimResults = true

          recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
              .map((result) => result[0].transcript.trim())
              .filter(Boolean)
              .join(' ')

            transcriptCallbackRef.current?.(
              [listeningBaseRef.current, transcript].filter(Boolean).join(' ').trim()
            )
          }

          recognition.onerror = (event) => {
            setIsListening(false)
            setListeningTarget(null)

            if (event.error === 'aborted') return

            pushToast({
              title: 'Voice input stopped',
              description:
                event.error === 'not-allowed'
                  ? 'Microphone permission was denied.'
                  : 'Unable to capture your voice right now.',
              variant: 'error',
            })
          }

          recognition.onend = () => {
            setIsListening(false)
            setListeningTarget(null)
          }

          recognitionRef.current = recognition
        }

        recognitionRef.current.lang = navigator.language || 'en-NG'
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        transcriptCallbackRef.current = onTranscript
        listeningBaseRef.current = initialText.trim()

        try {
          recognitionRef.current.start()
          setListeningTarget(id)
          setIsListening(true)
          return
        } catch {
          setIsListening(false)
          setListeningTarget(null)
          pushToast({
            title: 'Voice input unavailable',
            description: 'The microphone could not be started. Please try again.',
            variant: 'error',
          })
          return
        }
      }

      await startRecorderDictation({ id, initialText, onTranscript })
    },
    [
      isListening,
      listeningTarget,
      pushToast,
      speechRecognitionSupported,
      startRecorderDictation,
      stopListening,
      stopPlayback,
    ]
  )

  return {
    browserSpeechPlaybackSupported,
    isListening,
    isTranscribing,
    listeningTarget,
    mediaRecordingSupported,
    speakingId,
    speechRecognitionSupported,
    stopListening,
    stopPlayback,
    toggleListening,
    togglePlayback,
    transcribingTarget,
  }
}

export default useSpeech
