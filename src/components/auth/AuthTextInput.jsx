import React from 'react';
import { AUTH_INPUT_CLASS } from './authFormStyles';

export default function AuthTextInput({ className = '', ...props }) {
  return (
    <input
      className={`${AUTH_INPUT_CLASS}${className ? ` ${className}` : ''}`}
      {...props}
    />
  );
}
