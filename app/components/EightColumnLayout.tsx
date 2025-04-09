'use client';

import React, { useEffect, useState } from 'react';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

type Child = {
  id: string;
  name: string;
  value: number;
};

type ColumnProps = {
  name: string;
  children: Child[];
};

type EightColumnLayoutProps = {
  columns: ColumnProps[];
};

const EightColumnLayout: React.FC<EightColumnLayoutProps> = ({ columns }) => {
  const [columnWidths, setColumnWidths] = useState<number[]>([]);

  // Set initial column widths
  useEffect(() => {
    const totalWidth = window.innerWidth - 100;
    const equalWidth = Math.floor(totalWidth / columns.length);
    setColumnWidths(new Array(columns.length).fill(equalWidth));
  }, [columns.length]);

  const handleResize = (index: number, newWidth: number) => {
    const updated = [...columnWidths];
    updated[index] = newWidth;
    setColumnWidths(updated);
  };

  const renderChildren = (children: any[], level = 0) => {
  return children.map((child) => (
//   <div key={child.id} className={`pl-${level * 4} text-sm truncate`}>
  <div key={child.id} style={{ paddingLeft: `${level * 20}px` }} className="text-sm truncate">
    {child.name} - {child.value.toFixed(3)}
    {child.children && child.children.length > 0 && renderChildren(child.children, level + 1)}
  </div>
  ));
  };

  return (

    <div className="w-full overflow-x-auto">
      {/* Header Row - Resizable */}
      <div className="flex border-b text-sm font-semibold text-gray-700">
        {columns.map((col, index) => (
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
              {col.name}
            </div>
          </ResizableBox>
        ))}
      </div>

      {/* Scrollable Body */}
      <div className="flex overflow-x-auto">
        {columns.map((col, idx) => (
          <div
            key={idx}
            className="border-r p-2 space-y-1"
            style={{ width: columnWidths[idx], minWidth: 80 }}
          >
            {renderChildren(col.children)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EightColumnLayout;
