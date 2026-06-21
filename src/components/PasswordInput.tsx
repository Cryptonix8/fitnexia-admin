import { useState } from 'react'
import { IconEye, IconEyeOff } from './icons'

type PasswordInputProps = {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  minLength?: number
  required?: boolean
}

export default function PasswordInput({
  label,
  value,
  onChange,
  autoComplete,
  minLength,
  required,
}: PasswordInputProps) {
  const [show, setShow] = useState(false)

  return (
    <label className="field">
      <span className="fieldLabel">{label}</span>
      <div className="inputWrap">
        <input
          className="input inputWithToggle"
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          minLength={minLength}
          required={required}
        />
        <button
          type="button"
          className="inputToggle"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <IconEyeOff /> : <IconEye />}
        </button>
      </div>
    </label>
  )
}
