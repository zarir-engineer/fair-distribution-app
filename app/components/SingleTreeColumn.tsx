// system import
import React, { useEffect, useState, useRef } from 'react';
import { Lock } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// custom modules import
import { initialTreeData } from '../data/initialTreeData';
import ProsConsModal from './ProsConsModal';


export interface TreeNode {
  name: string;
  value: number;
  locked?: boolean;
  children?: TreeNode[];
}

const round = (num: number) => parseFloat(num.toFixed(3));

const getPath = (path: number[]) => path.join('-');

const getNodeByPath = (node: TreeNode, path: number[]): TreeNode => {
  return path.reduce((acc, idx) => acc.children?.[idx] || acc, node);
};

const SingleTreeColumn = () => {
  const [treeData, setTreeData] = useState<TreeNode[]>(initialTreeData);
  const [editingPath, setEditingPath] = useState<string>('');
  const [history, setHistory] = useState<TreeNode[][]>([]);
  const [future, setFuture] = useState<TreeNode[][]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showProsCons, setShowProsCons] = useState(false);
  const [totalAmount, setTotalAmount] = useState<number>(30); // default in Cr
  const [showActuals, setShowActuals] = useState<boolean>(false);
  const [showPercentageAsHundred, setShowPercentageAsHundred] = useState(false);
  const [usePercentageOf66, setUsePercentageOf66] = useState(false);

  const handleTogglePercentage = () => {
    setUsePercentageOf66(prev => !prev);
  };

  const originalPros = [
    "We win the case",
    "Dadaji & Dadaji take care of the property so it is not disintegrated",
    "Their is a court receiver. This ensures accountability is with the court",
    "Though we are in airport zone, we are not restricted to 2 storeys. "
  ];

  const originalCons = [
    "All Dadaji's have passed away. And no outcome in this matter. Neither in court nor outside so far.",
    "Most uncles are very senior citizens",
    "Though their is a court receiver, encroachment is still active.",
    "Being in airport zone, we cannot go more above 12 - 13 storey. "
  ];

  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);

  const [newPro, setNewPro] = useState("");
  const [newCon, setNewCon] = useState("");

  const handleAddPro = () => {
    if (newPro.trim()) {
      setPros([...pros, newPro.trim()]);
      setNewPro("");
    }
  };

  const handleAddCon = () => {
    if (newCon.trim()) {
      setCons([...cons, newCon.trim()]);
      setNewCon("");
    }
  };

  const handleRemovePro = (index: number) => {
    const updated = [...pros];
    updated.splice(index, 1);
    setPros(updated);
  };

  const handleRemoveCon = (index: number) => {
    const updated = [...cons];
    updated.splice(index, 1);
    setCons(updated);
  };

  const pushToHistory = (snapshot: TreeNode[]) => {
    setHistory((prev) => [...prev, snapshot]);
    setFuture([]); // clear future on new change
  };

  const handleSaveAsPDF = async () => {
    const element = document.getElementById('tree-container');
    if (!element) return;

    const filename = prompt('Enter filename for the PDF:', 'tree-data');
    if (!filename) return; // user cancelled

    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`${filename}.pdf`);
  };


  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFuture((f) => [treeData, ...f]);
    setTreeData(previous);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setHistory((h) => [...h, treeData]);
    setTreeData(next);
  };

  const handleReset = () => {
    pushToHistory(treeData);
    setTreeData(initialTreeData);
  };

  const aajiAncestorCheck = (path: number[]) => {
    let node = treeData[path[0]];
    for (let i = 1; i < path.length; i++) {
      if (node.name === 'Aaji') return true;
      node = node.children?.[path[i]] ?? { name: '', value: 0 };
    }
    return node.name === 'Aaji';
  };

  const rebalanceSiblings = (siblings: TreeNode[], editedIdx: number, delta: number) => {
    const editedNode = siblings[editedIdx];
    const others = siblings.filter((_, i) => i !== editedIdx && !siblings[i].locked && siblings[i].name !== 'Aaji');
    const totalUnlocked = others.reduce((sum, s) => sum + s.value, 0);

    others.forEach((sibling) => {
      const ratio = sibling.value / totalUnlocked;
      sibling.value = parseFloat((sibling.value - ratio * delta).toFixed(6));
    });
  };

  const updateChildNode = (
    treeCopy: TreeNode[],
    path: number[],
    newValue: number,
    delta: number
  ) => {
    const [topLevelIdx, ...childPath] = path;
    const topLevelNode = treeCopy[topLevelIdx];
    const parentNode = getNodeByPath(topLevelNode, childPath.slice(0, -1));
    const siblings = parentNode.children!;
    const editedNode = getNodeByPath(topLevelNode, childPath);

    // 🔐 Rule 2: Check BEFORE value is changed
    if (topLevelNode.children) {
      const unlocked = topLevelNode.children.filter(c => !c.locked);
      if (unlocked.length === 1 && unlocked[0] === editedNode) {
        topLevelNode.children.forEach(c => c.locked = true);
        topLevelNode.locked = true;
        return; // Prevent any changes, everything is now locked
      }
    }

    // Rebalance and then apply the change
    rebalanceSiblings(siblings, childPath[childPath.length - 1], delta);

    if (editedNode) {
      editedNode.value = parseFloat(newValue.toFixed(6));
    }

    // Update top-level node value to match sum of children
    topLevelNode.value = parseFloat(
      topLevelNode.children!.reduce((sum, c) => sum + c.value, 0).toFixed(6)
    );
  };

  const updateTopLevelNode = (
    treeCopy: TreeNode[],
    path: number[],
    newValue: number,
    delta: number
  ) => {
    const [topLevelIdx] = path;
    const topLevelNode = treeCopy[topLevelIdx];
    const siblings = treeCopy.filter((_, i) => i !== topLevelIdx && treeCopy[i].name !== 'Aaji');


    rebalanceSiblings([topLevelNode, ...siblings], 0, delta);
    topLevelNode.value = parseFloat(newValue.toFixed(6));

    // Rebalance children to match top-level
    if (topLevelNode.children) {
      const avg = topLevelNode.value / topLevelNode.children.length;
      topLevelNode.children.forEach((child) => {
        if (!child.locked) {
          child.value = parseFloat(avg.toFixed(6));
        }
      });
    }

    // Lock children when top-level is locked
    if (topLevelNode.locked && topLevelNode.children) {
      topLevelNode.children.forEach(child => {
        child.locked = true;
      });
    }
  };

  const handleChange = (path: number[], newValue: number) => {
    const currentPath = getPath(path);
    setTreeData((prev) => {
      const treeCopy = JSON.parse(JSON.stringify(prev));

      // ⏪ Save to history before change
      setHistory((h) => [...h, prev]);
      setFuture([]); // clear redo stack

      const [topLevelIdx, ...childPath] = path;
      const topLevelNode = treeCopy[topLevelIdx];
      const editedNode = getNodeByPath(topLevelNode, childPath);

      if (!editedNode || editedNode.name === 'Aaji') return prev;

      // Lock previous node if needed
      if (editingPath && editingPath !== currentPath) {
        const [prevIdx, ...prevChildPath] = editingPath.split('-').map(Number);
        const prevParent = treeCopy[prevIdx];
        const prevNode = getNodeByPath(prevParent, prevChildPath);
        if (prevNode) prevNode.locked = true;
      }

      setEditingPath(currentPath);

      const delta = newValue - editedNode.value;

      if (childPath.length > 0) {
        updateChildNode(treeCopy, path, newValue, delta);
      } else {
        updateTopLevelNode(treeCopy, path, newValue, delta);
      }

      return treeCopy;
    });
  };

  const renderNode = (node: TreeNode, path: number[] = []) => (
    <div key={path.join('-')} className="p-1 border bg-white rounded shadow-sm text-sm">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate w-[80px]">{node.name}</span>

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => handleChange(path, round(node.value - 0.001))}
              disabled={node.name === 'Aaji' || node.locked || aajiAncestorCheck(path)}
              className="px-1 py-0.5 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              −
            </button>

            <span className="w-[70px] text-center border px-1 py-0.5 rounded bg-white">
              {showActuals
                ? `${(node.value * totalAmount).toFixed(2)} Cr`
                : node.value.toFixed(3)}
            </span>

            <button
              onClick={() => handleChange(path, round(node.value + 0.001))}
              disabled={node.name === 'Aaji' || node.locked || aajiAncestorCheck(path)}
              className="px-1 py-0.5 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              +
            </button>

            {(node.name === 'Aaji' || node.locked || aajiAncestorCheck(path)) && (
              <Lock size={12} className="text-gray-500 ml-1" />
            )}
          </div>
        </div>
        {node.children && (
          <div className="ml-4">
            {node.children.map((child, i) => renderNode(child, [...path, i]))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div ref={contentRef} className="flex flex-col h-screen">
      {/* pros cons modal */}
      {showProsCons && <ProsConsModal onClose={() => setShowProsCons(false)} />}

      {/* Sticky Header */}
      <div className="bg-white shadow-md p-4 sticky top-0 z-10 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-bold">Distribute Fairly App</h1>
          <div className="space-x-2">
            <button
              onClick={() => setShowProsCons(true)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Pros & Cons
            </button>
            <button onClick={handleUndo} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
              Undo
            </button>
            <button onClick={handleRedo} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
              Redo
            </button>
            <button onClick={handleReset} className="px-3 py-1 bg-red-200 text-red-800 rounded hover:bg-red-300">
              Reset
            </button>
            <button onClick={handleSaveAsPDF} className="px-3 py-1 bg-blue-200 text-blue-800 rounded hover:bg-blue-300">
              Save to PDF
            </button>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <div>
              <label className="block mb-1">Total (Cr):</label>
              <input
                type="number"
                min={0}
                step={1}
                value={totalAmount}
                onChange={(e) => setTotalAmount(parseFloat(e.target.value))}
                className="w-[100px] px-2 py-1 border rounded text-sm"
              />
            </div>

            <button
              onClick={() => setShowActuals(!showActuals)}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              {showActuals ? 'Show Fractions' : 'Show Actuals'}
            </button>
          </div>
        </div>
        {!showActuals && (
          <div className="flex items-center gap-4">
            <div className="text-lg font-semibold">
              Percentage:
            </div>
            <div
              onClick={handleTogglePercentage}
              className={`relative w-32 h-8 flex items-center cursor-pointer rounded-full p-1 transition-colors duration-300 ${
                usePercentageOf66 ? 'bg-orange-500' : 'bg-pink-300'
              }`}
            >
              {/* Moving knob */}
              <div
                className={`bg-white w-8 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
                  usePercentageOf66 ? 'translate-x-[5.5rem]' : 'translate-x-0'
                }`}
              />
              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white">
                {usePercentageOf66 ? '66.67' : '1.000'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top-Level Nodes in Header */}
      <div className="grid grid-cols-8 gap-2">
        {treeData.map((node, index) => (
          <div key={index} className="p-2 bg-gray-100 rounded shadow text-center">
            <div className="flex items-center justify-between border border-gray-300 rounded px-2 py-1 bg-white shadow-sm w-full">
              <span className="font-medium truncate">{node.name}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleChange([index], round(node.value - 0.001))}
                  disabled={node.name === 'Aaji' || node.locked}
                  className="text-sm px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
                >
                  −
                </button>
                <span className="w-16 text-center border px-2 py-1 rounded bg-white">
                  {showActuals
                    ? (node.value * totalAmount).toFixed(2)  // actual amount
                    : usePercentageOf66
                      ? (node.value * 66.67).toFixed(2)
                      : node.value.toFixed(3)
                  }
                </span>
                <button
                  onClick={() => handleChange([index], round(node.value + 0.001))}
                  disabled={node.name === 'Aaji' || node.locked}
                  className="text-sm px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
                >
                  +
                </button>
                {(node.name === 'Aaji' || node.locked) && <Lock size={14} className="text-gray-500 ml-2" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Scrollable Grid */}
      <div id="tree-container" className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-8 gap-2">
          {treeData.map((node, topLevelIndex) => (
            <div key={topLevelIndex} className="px-1">
              {node.children?.map((child, childIndex) =>
                renderNode(child, [topLevelIndex, childIndex])
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SingleTreeColumn;
