import React from 'react';

export function Textarea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="px-4 py-2 border rounded w-full"
    />
  );
}
