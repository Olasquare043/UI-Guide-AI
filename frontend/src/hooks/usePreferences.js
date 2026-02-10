import useLocalStorage from './useLocalStorage'

const defaultPreferences = {
  verbosity: 'normal',
}

const usePreferences = () => {
  const [preferences, setPreferences] = useLocalStorage('ui-guide-preferences', defaultPreferences)

  const setVerbosity = (verbosity) => {
    setPreferences((prev) => ({ ...prev, verbosity }))
  }

  return { preferences, setVerbosity }
}

export default usePreferences
