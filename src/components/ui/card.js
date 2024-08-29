import React from 'react';

export function Card({ children }) {
  return (
    <div className="p-4 bg-white rounded shadow-md">
      {children}
    </div>
  );
}

export function CardHeader({ children }) {
  return <div className="border-b pb-2 mb-4">{children}</div>;
}

export function CardContent({ children }) {
  return <div>{children}</div>;
}

export function CardFooter({ children }) {
  return <div className="pt-4 mt-4 border-t">{children}</div>;
}

export function CardTitle({ children }) {
  return <h2 className="text-xl font-bold">{children}</h2>;
}

export function CardDescription({ children }) {
  return <p className="text-gray-500">{children}</p>;
}
