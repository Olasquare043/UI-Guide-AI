const FormField = ({ label, description, error, children, htmlFor }) => (
  <div className="space-y-2">
    <label htmlFor={htmlFor} className="text-sm font-semibold text-slate-800">
      {label}
    </label>
    {description ? <p className="text-xs text-slate-500">{description}</p> : null}
    {children}
    {error ? <p className="text-xs text-rose-600">{error}</p> : null}
  </div>
)

export default FormField
