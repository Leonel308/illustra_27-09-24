import React from 'react';
import { AlertCircle } from "lucide-react";

export function Alert({ children, variant = 'info' }) {
  const variantClasses = {
    info: 'bg-blue-100 text-blue-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
    success: 'bg-green-100 text-green-700',
  };

  return (
    <div className={`p-4 rounded ${variantClasses[variant]}`}>
      <AlertCircle className="inline-block mr-2" />
      {children}
    </div>
  );
}

export function AlertTitle({ children }) {
  return <h3 className="font-semibold">{children}</h3>;
}

export function AlertDescription({ children }) {
  return <p>{children}</p>;
}
