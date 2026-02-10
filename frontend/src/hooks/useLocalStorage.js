import { useEffect, useState } from 'react'
import { loadJson, saveJson } from '../utils/storage'

const useLocalStorage = (key, defaultValue) => {
  const [value, setValue] = useState(() => loadJson(key, defaultValue))

  useEffect(() => {
    saveJson(key, value)
  }, [key, value])

  return [value, setValue]
}

export default useLocalStorage
