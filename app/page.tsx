'use client';

import React from 'react';
import SingleTreeColumn from './components/SingleTreeColumn';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 overflow-auto px-4 py-4">
        <SingleTreeColumn />
      </main>
    </div>
  );
}
