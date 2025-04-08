'use client';

import React, { useEffect, useState } from 'react';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

type EightColumnLayoutProps = {
  headers: string[];
};

const EightColumnLayout: React.FC<EightColumnLayoutProps> = ({ headers }) => {
  const [columnWidths, setColumnWidths] = useState<number[]>([]);

  // Set initial column widths based on window width
  useEffect(() => {
    const totalWidth = window.innerWidth - 100; // subtract a bit for padding/margins
    const equalWidth = Math.floor(totalWidth / headers.length);
    setColumnWidths(new Array(headers.length).fill(equalWidth));
  }, [headers.length]);

  const handleResize = (index: number, newWidth: number) => {
    const updated = [...columnWidths];
    updated[index] = newWidth;
    setColumnWidths(updated);
  };

  return (
    <div className="flex border-b text-sm font-semibold text-gray-700 overflow-x-auto">
      {headers.map((header, index) => (
        <ResizableBox
          key={index}
          width={columnWidths[index]}
          height={40}
          axis="x"
          minConstraints={[80, 40]}
          maxConstraints={[400, 40]}
          resizeHandles={['e']}
          onResizeStop={(e, data) => handleResize(index, data.size.width)}
        >
          <div
            className="h-full flex items-center justify-center border-r px-2 bg-gray-50"
            style={{ width: columnWidths[index] }}
          >
            {header}
          </div>
        </ResizableBox>
      ))}
    </div>
  );
};

export default EightColumnLayout;
