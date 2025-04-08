'use client';

import React, { useState } from 'react';
import EightColumnLayout from './components/EightColumnLayout';
import { headers } from './data/headers'; // 👈 import from data
import { columnsWithChildren } from './data/headers';

export default function HomePage() {
  const [total, setTotal] = useState(1.0);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Fixed Header */}
      <header className="bg-white border-b shadow-md px-6 py-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Distribute Fairly App</h1>
          <div className="space-x-3">
            <button className="px-4 py-1 bg-gray-100 hover:bg-gray-200 rounded">Reset</button>
            <button className="px-4 py-1 bg-gray-100 hover:bg-gray-200 rounded">Save to PDF</button>
            <button className="px-4 py-1 bg-gray-100 hover:bg-gray-200 rounded">Undo</button>
            <button className="px-4 py-1 bg-gray-100 hover:bg-gray-200 rounded">Redo</button>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-600">Total: {total.toFixed(3)}</div>
        {/* Top-Level Column Headers */}
        <div className="mt-4 grid grid-cols-8 gap-2 font-semibold text-center border-t border-b py-2">
          {headers.map((name, idx) => (
            <div key={idx} className="truncate">{name}</div>
          ))}
        </div>
      </header>
      {/* Scrollable Content */}
      <main className="flex-1 overflow-auto px-4 py-4">
        <EightColumnLayout columns={columnsWithChildren} />
      </main>
   </div>
  );
}