import useLocalStorage from './useLocalStorage'

const defaultPreferences = {
  verbosity: 'normal',
  voiceMode: false,
}

const usePreferences = () => {
  const [preferences, setPreferences] = useLocalStorage('ui-guide-preferences', defaultPreferences)

  const setVerbosity = (verbosity) => {
    setPreferences((prev) => ({ ...prev, verbosity }))
  }

  const setVoiceMode = (voiceMode) => {
    setPreferences((prev) => ({ ...prev, voiceMode }))
  }

  return { preferences, setVerbosity, setVoiceMode }
}

export default usePreferences
