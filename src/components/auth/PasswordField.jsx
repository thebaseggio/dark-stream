import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { AUTH_INPUT_CLASS } from './authFormStyles';

export default function PasswordField({ className = '', ...props }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={showPassword ? 'text' : 'password'}
        className={`${AUTH_INPUT_CLASS} pr-11${className ? ` ${className}` : ''}`}
      />
      <button
        type="button"
        onClick={() => setShowPassword((current) => !current)}
        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-zinc-400 transition-colors hover:text-white"
        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
        tabIndex={-1}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
