import React from 'react';

export function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div>
      <div>{title}</div>
      <div>{value}</div>
    </div>
  );
}
