import { useState } from 'react'
import { GraduationCap } from 'lucide-react'

const BrandMark = ({ className = '' }) => {
  const [hasError, setHasError] = useState(false)

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0b2d5c] via-[#123a73] to-[#e8b24c] shadow-md">
        {hasError ? (
          <GraduationCap className="h-6 w-6 text-white" />
        ) : (
          <img
            src="/ui-logo.webp"
            alt="University of Ibadan logo"
            className="h-7 w-7 object-contain"
            onError={() => setHasError(true)}
          />
        )}
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-slate-900">UI Guide</p>
        <p className="text-xs text-slate-500">University of Ibadan assistant</p>
      </div>
    </div>
  )
}

export default BrandMark
