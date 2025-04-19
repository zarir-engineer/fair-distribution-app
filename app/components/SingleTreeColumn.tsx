// system import
import React, { useEffect, useState, useRef } from 'react';
import { Lock, Unlock, Zap } from "lucide-react"; // Zap as bright icon
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { cn } from "@/lib/utils"; // for combining classes

// custom modules import
import { initialTreeData } from '../data/initialTreeData';
import ProsConsModal from './ProsConsModal';
import Fraction from 'fraction.js';

export interface TreeNode {
  name: string;
  value: number;
  locked?: boolean;
  children?: TreeNode[];
}

const round = (num: number) => parseFloat(num.toFixed(3));
const getPath = (path: number[]) => path.join('-');

const BrightTransition = () => (
  <div className="flex items-center justify-center my-2">
    <Zap className="text-yellow-400 animate-pulse w-8 h-8" />
  </div>
);

const SingleTreeColumn = () => {
  const [treeData, setTreeData] = useState<TreeNode[]>(initialTreeData);
  const [editingPath, setEditingPath] = useState<string>('');
  const [history, setHistory] = useState<TreeNode[][]>([]);
  const [future, setFuture] = useState<TreeNode[][]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const [totalAmount, setTotalAmount] = useState<number>(30); // default in Cr
  const [showActuals, setShowActuals] = useState<boolean>(false);
  const [showPercentageAsHundred, setShowPercentageAsHundred] = useState(false);
  const [usePercentageOf66, setUsePercentageOf66] = useState(false);
  const getTopLevelIndex = (path: number[]) => path[0];

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

  const getNodeByPath = (tree: TreeNode[] | TreeNode, path: number[]): TreeNode | null => {
    let node = Array.isArray(tree) ? tree[path[0]] : tree;
    for (let i = Array.isArray(tree) ? 1 : 0; i < path.length; i++) {
      if (!node?.children) return null;
      node = node.children[path[i]];
    }
    return node;
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

  const toggleLock = (path: number[]) => {
    setTreeData(prevTree => {
      const deepCopy = JSON.parse(JSON.stringify(prevTree)); // ensures state triggers re-render
      let node = deepCopy;

      for (let i = 0; i < path.length - 1; i++) {
        node = node[path[i]].children!;
      }

      const target = node[path[path.length - 1]];
      target.locked = !target.locked;

      if (!target.locked && target.children) {
        target.children.forEach(child => (child.locked = false));
      }

      return deepCopy;
    });
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

  const renderNode = (
    node: TreeNode,
    path: number[] = [],
    showActuals = false,
    totalAmount = 0,
    usePercentageOf66 = false
  ) => {
    const currentNode = getNodeByPath(treeData, path);

    // Function to format the unit fraction with two decimal places in the denominator
    const formatUnitFraction = (denominator: number) => {
      return `1/${(denominator).toFixed(2)}`;
    };

    const fractionString = formatUnitFraction(node.value); // Get the formatted unit fraction

    return (
      <div key={path.join('-')} className="p-1 border bg-white rounded shadow-sm text-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 min-w-0 sm:w-[100px]">
              {path.length > 0 && !aajiAncestorCheck(path) && currentNode && (
                <button
                  onClick={() => toggleLock(path)}
                  className="ml-1"
                  title={currentNode.locked ? 'Unlock' : 'Lock'}
                >
                  <img
                    src={currentNode.locked ? "/icons/lock-red.png" : "/icons/unlock-green.png"}
                    alt={currentNode.locked ? "Locked" : "Unlocked"}
                    className="w-5 h-5 transition-transform duration-300 hover:scale-110 shrink-0"
                  />
                </button>
              )}
              <span className="truncate">{node.name}</span>
            </div>

            <div className="flex items-center gap-0.5">
              <button
                onClick={() => handleChange(path, round(node.value - 0.001))}
                disabled={
                  currentNode?.locked ||
                  currentNode?.name === 'Aaji' ||
                  aajiAncestorCheck(path)
                }
                className="px-1 py-0.5 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                −
              </button>

              <div className="flex items-center gap-1">
                <span className="w-[70px] text-center border px-1 py-0.5 rounded bg-white">
                  {showActuals
                    ? `${(node.value * totalAmount).toFixed(2)} Cr`
                    : usePercentageOf66
                    ? (node.value * 66.67).toFixed(2)
                    : fractionString} {/* Display formatted unit fraction */}
                </span>
              </div>

              <button
                onClick={() => handleChange(path, round(node.value + 0.001))}
                disabled={
                  currentNode?.locked ||
                  currentNode?.name === 'Aaji' ||
                  aajiAncestorCheck(path)
                }
                className="px-1 py-0.5 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>

          {node.children && (
            <div className="ml-4">
              {node.children.map((child, i) => {
                const currentPath = [...path, i];
                const currentChild = child;
                const nextChild = node.children[i + 1];

                const shouldInsertTransition =
                  nextChild &&
                  ((currentChild.locked && !nextChild.locked) ||
                   (!currentChild.locked && nextChild.locked));

                return (
                  <React.Fragment key={currentPath.join('-')}>
                    {renderNode(child, currentPath, showActuals, totalAmount, usePercentageOf66)}
                    {shouldInsertTransition && (
                      <div className="flex justify-center my-1">
                        <Zap className="text-yellow-400 animate-pulse w-6 h-6" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const forceUnitFraction = (value: number) => {
    if (value === 0) return '0';
    const denominator = 1 / value;
    return `1/${denominator.toFixed(2)}`;
  };

  return (
    <div ref={contentRef} className="flex flex-col h-screen">

      {/* Sticky Header */}
      <div className="bg-white shadow-md p-4 sticky top-0 z-10" style={{ minHeight: '150px' }}>
        <div className="grid grid-cols-1 gap-2">

          {/* First Row: Title */}
          <div className="flex flex-wrap items-center justify-center sm:justify-center gap-2">
            <h1 className="text-lg font-semibold w-full text-left sm:text-left sm:w-auto">
              Distribute Fairly App
            </h1>
          </div>

          {/* First Row: Centered Buttons */}
          <div className="flex justify-center w-full flex-wrap gap-1">
            <button onClick={handleUndo} className="p-1 bg-gray-300 rounded hover:bg-gray-100" title="Undo">
              ↶
            </button>
            <button onClick={handleRedo} className="p-1 bg-gray-100 rounded hover:bg-gray-300" title="Redo">
              ↷
            </button>
            <button onClick={handleReset} className="p-1 bg-red-200 text-red-800 rounded hover:bg-red-300" title="Reset">
              ⟳
            </button>
            <button onClick={handleSaveAsPDF} className="p-1 px-2 bg-blue-200 text-blue-800 text-sm rounded hover:bg-blue-300">
              PDF
            </button>
          </div>

          {/* Second Row: Centered Controls */}
          <div className="flex flex-nowrap justify-center items-center gap-2 px-2 py-1 text-sm overflow-x-auto">

            {/* Total CR */}
            <div className="flex items-center gap-1 min-w-[120px] justify-center">
              <span className="text-sm font-medium">Total (Cr):</span>
              <input
                type="number"
                min={0}
                step={1}
                value={totalAmount}
                onChange={(e) => setTotalAmount(parseFloat(e.target.value))}
                className="w-[50px] px-1 py-0.5 border rounded text-sm"
              />
            </div>

            {/* Actuals Toggle */}
            <div className="flex items-center justify-center min-w-[90px]">
              <button
                onClick={() => setShowActuals(!showActuals)}
                className="px-2.5 py-1.5 bg-blue-500 text-white text-xs rounded-sm hover:bg-blue-600 whitespace-nowrap"
                title={showActuals ? "Show Fractions" : "Show Actuals"}
              >
                {showActuals ? 'Fractions' : 'Actuals'}
              </button>
            </div>

            {/* Percentage Toggle */}
            <div
              className={`flex items-center gap-1 transition-opacity duration-300 min-w-[120px] justify-center ${
                showActuals ? 'opacity-0 invisible' : 'opacity-100 visible'
              }`}
            >
              <span className="font-medium whitespace-nowrap">
                {usePercentageOf66 ? 'Percentage:' : 'Fraction:'}
              </span>

              <div
                onClick={handleTogglePercentage}
                className={`relative w-20 h-6 flex items-center cursor-pointer rounded-full p-1 transition-colors duration-300 ${
                  usePercentageOf66 ? 'bg-red-200 hover:bg-red-400' : 'bg-blue-200 hover:bg-blue-400'
                }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                    usePercentageOf66 ? 'translate-x-[2.7rem]' : 'translate-x-0'
                  }`}
                />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                  {usePercentageOf66 ? '66.67' : '1.000'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Tree Structure */}
      <div className="w-full">
        {/* Desktop: Separate Grids */}
        <div className="hidden sm:grid grid-cols-8 gap-2">
          {treeData.map((node, index) => (
            <div key={index} className="p-2 bg-gray-100 rounded shadow text-center">
              {/* Top-level content same as before */}
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
                      ? (node.value * totalAmount).toFixed(2)
                      : usePercentageOf66
                      ? (node.value * 66.67).toFixed(2)
                      : forceUnitFraction(node.value)} {/* Display unit fraction */}
                  </span>
                  <button
                    onClick={() => handleChange([index], round(node.value + 0.001))}
                    disabled={node.name === 'Aaji' || node.locked}
                    className="text-sm px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
                  >
                    +
                  </button>
                  {(node.name === 'Aaji' || node.locked) && (
                    <Lock size={14} className="text-gray-500 ml-2" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Child Grid */}
        <div className="hidden sm:grid grid-cols-8 gap-2 mt-2">
          {treeData.map((node, topLevelIndex) => (
            <div key={topLevelIndex} className="px-1">
              {node.children?.map((child, childIndex) =>
                renderNode(child, [topLevelIndex, childIndex], showActuals, totalAmount, usePercentageOf66)
              )}
            </div>
          ))}
        </div>

        {/* Mobile: Top-level and children stacked */}
        <div className="sm:hidden flex flex-col gap-4 mt-4">
          {treeData.map((node, index) => (
            <div key={index} className="bg-gray-100 rounded shadow p-2">
              {/* Top-level */}
              <div className="flex items-center justify-between border border-gray-300 rounded px-2 py-1 bg-white shadow-sm w-full mb-2">
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
                      ? (node.value * totalAmount).toFixed(2)
                      : usePercentageOf66
                      ? (node.value * 66.67).toFixed(2)
                      : forceUnitFraction(node.value)} {/* Display unit fraction */}
                  </span>
                  <button
                    onClick={() => handleChange([index], round(node.value + 0.001))}
                    disabled={node.name === 'Aaji' || node.locked}
                    className="text-sm px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
                  >
                    +
                  </button>
                  {(node.name === 'Aaji' || node.locked) && (
                    <Lock size={14} className="text-gray-500 ml-2" />
                  )}
                </div>
              </div>

              {/* Children */}
              <div className="flex flex-col gap-2">
                {node.children?.map((child, childIndex) =>
                  renderNode(child, [index, childIndex], showActuals, totalAmount, usePercentageOf66)
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable Grid */}
      <div id="tree-container" className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-8 gap-2">
          {treeData.map((node, topLevelIndex) => (
            <div key={topLevelIndex} className="px-1">
              {node.children?.map((child, childIndex) =>
                renderNode(child, [topLevelIndex, childIndex], showActuals, totalAmount, usePercentageOf66)
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SingleTreeColumn;                  