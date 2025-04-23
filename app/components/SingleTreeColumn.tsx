// system import
import React, { useEffect, useState, useRef } from 'react';
import { Lock, Unlock, Zap } from "lucide-react"; // Zap as bright icon

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

const getEffectiveFraction = (nodeFraction: number, total: number, brokeragePercent: number): string => {
  const adjusted = total - (total * brokeragePercent / 100);
  const effective = (nodeFraction * total) / adjusted;
  return formatAsFraction(effective);
};


const getCrValue = (fraction: number, total: number, brokeragePercent: number): number => {
  const adjustedTotal = total - (total * brokeragePercent / 100);
  return fraction * adjustedTotal;
};

const formatAsFraction = (decimal: number): string => {
  if (decimal === 0) return '0';
  return new Fraction(decimal).toFraction(true); // e.g., "1/8"
};

const formatAsUnitFraction = (value: number): string => {
  if (value === 0) return '0';
  const unit = 1 / value;
  return `1/${unit.toFixed(2)}`; // always shows as 1/x.xx
};


const getEffectiveFractionString = (
  nodeFraction: number,
  total: number,
  brokeragePercent: number
): string => {
  const adjusted = total - (total * brokeragePercent / 100);
  const effectiveDecimal = (nodeFraction * total) / adjusted;
  return formatAsFraction(effectiveDecimal); // e.g., "1/7.84"
};

const round = (num: number) => parseFloat(num.toFixed(3));
const getPath = (path: number[]) => path.join('-');

const BrightTransition = () => (
  <div className="flex items-center justify-center my-2">
    <Zap className="text-yellow-400 animate-pulse w-8 h-8" />
  </div>
);

const SingleTreeColumn = () => {
  const [adjustedTreeData, setAdjustedTreeData] = useState<TreeNode[]>(initialTreeData);
  const [editingPath, setEditingPath] = useState<string>('');
  const [history, setHistory] = useState<TreeNode[][]>([]);
  const [future, setFuture] = useState<TreeNode[][]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const [totalAmount, setTotalAmount] = useState<number>(30); // default in Cr
  const [showActuals, setShowActuals] = useState<boolean>(false);
  const [showPercentageAsHundred, setShowPercentageAsHundred] = useState(false);
  const [usePercentageOf66, setUsePercentageOf66] = useState(false);
  const getTopLevelIndex = (path: number[]) => path[0];

  const [brokeragePercent, setBrokeragePercent] = useState(0);

  // Function to distribute shares with brokerage
  const distributeWithBrokerage = (totalCr: number, brokeragePercent: number) => {
    const brokerageValue = (brokeragePercent / 100) * totalCr;
    const remainingTotal = totalCr - brokerageValue;

    return {
      brokerageValue,
      remainingTotal,
      updatedTreeData: initialTreeData.map(node => ({ ...node })) // don't modify values!
    };
  };

  const adjustChildren = (
      children: TreeNode[] | undefined,
      oldParentFraction: number,
      newParentFraction: number
      ): TreeNode[] | undefined => {
    if (!children) return children;

    const ratio = newParentFraction / oldParentFraction;

    return children.map(child => ({
      ...child,
      value: child.value * ratio,
      children: adjustChildren(child.children, child.value, child.value * ratio)
    }));
  }

  useEffect(() => {
    const { updatedTreeData } = distributeWithBrokerage(totalAmount, brokeragePercent);
    setAdjustedTreeData(updatedTreeData);
  }, [totalAmount, brokeragePercent]);


  const handleDownloadPDF = async () => {
    const element = document.getElementById('printable-area');
    if (!element) {
      console.error('Printable area not found');
      return;
    }

    const html2pdf = (await import('html2pdf.js')).default;

    const opt = {
      margin: [0.05, 0.2, 0.05, 0.2], // [left, top, right, bottom]
      filename: 'fair-distribution.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' },
    };

    html2pdf().set(opt).from(element).save();
  };

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

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFuture((f) => [adjustedTreeData, ...f]);
    setAdjustedTreeData(previous);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setHistory((h) => [...h, adjustedTreeData]);
    setAdjustedTreeData(next);
  };

  const handleReset = () => {
    pushToHistory(adjustedTreeData);
    setAdjustedTreeData(initialTreeData);
  };

  const aajiAncestorCheck = (path: number[]) => {
    let node = adjustedTreeData[path[0]];
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
    if (!parentNode || !parentNode.children) {
      console.error('Parent node or its children not found');
      return;
    }

    const siblings = parentNode.children;

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
    setAdjustedTreeData(prevTree => {
      const deepCopy = JSON.parse(JSON.stringify(prevTree)); // ensures state triggers re-render
      let node = deepCopy;

      for (let i = 0; i < path.length - 1; i++) {
        node = node[path[i]].children!;
      }

      const target = node[path[path.length - 1]];
      target.locked = !target.locked;

      if (!target.locked && target.children) {
        target.children.forEach((child: TreeNode) => {
          child.locked = false;
        });

      }

      return deepCopy;
    });
  };

  const handleChange = (path: number[], newValue: number) => {
    const currentPath = getPath(path);
    setAdjustedTreeData((prev) => {
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
    usePercentageOf66 = false,
    brokeragePercent = 0
  ) => {
    const currentNode = getNodeByPath(adjustedTreeData, path);
    const isTopLevelLocked = adjustedTreeData[path[0]]?.locked;

    // Function to format unit fractions properly
    const formatUnitFraction = (decimal: number) => {
      const frac = new Fraction(decimal);
      return frac.toFraction(true); // returns something like "1/16" or "4/63"
    };

    const formatToDecimal = (fraction: string) => {
      console.log('Fraction input:', fraction);

      // Handle cases where the fraction string contains a mixed fraction (e.g., "1 5/8")
      if (fraction.includes(" ")) {
        const parts = fraction.split(" ");  // Split at the space
        const wholeNumber = parseInt(parts[0], 10);  // Whole part (before the space)
        const fractionalPart = parts[1];  // Fractional part (after the space)

        // Convert the fractional part to a decimal
        const frac = new Fraction(fractionalPart);  // Convert "5/8" into a fraction
        const improperFraction = frac.add(wholeNumber);  // Add the whole number part to the fraction
        return improperFraction.valueOf();  // Convert to decimal
      }

      // Check if the fraction is in the correct "1/xx" form
      if (fraction.includes("/")) {
        try {
          const frac = new Fraction(fraction);  // Create a Fraction object from the string
          return frac.valueOf();  // Return decimal equivalent
        } catch (error) {
          console.error("Error creating Fraction from:", fraction, error);
          return 0;  // Return 0 if error occurs while creating fraction
        }
      } else {
        // If it's already a decimal (e.g., 0.0625), return it directly
        const decimal = parseFloat(fraction);
        if (isNaN(decimal)) {
          console.error("Invalid decimal value:", fraction);
          return 0;  // Return 0 if it's not a valid decimal
        }
        return decimal;
      }
    };

    const isDecimalFraction = (value: number): boolean => {
      return value % 1 !== 0; // True if it's not a whole number
    };

    const effectiveDecimal = (node.value * totalAmount) / (totalAmount - (totalAmount * brokeragePercent / 100));
    const fractionString = formatAsUnitFraction(effectiveDecimal);

    const adjustedAmount = totalAmount - (totalAmount * brokeragePercent / 100);
    return (
      <div key={path.join('-')} className="p-1 border  rounded shadow-sm text-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 min-w-0 sm:w-[100px]">
              {path.length > 0 && !aajiAncestorCheck(path) && currentNode && (
                <div className="ml-1">
                  {isTopLevelLocked && !currentNode.locked ? (
                    <img
                      src="/icons/lock-red.png"
                      alt="Locked (inherited)"
                      className="w-5 h-5 opacity-60"
                      title="Locked by parent"
                    />
                  ) : (
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
                </div>
              )}
              <span className="whitespace-nowrap">{node.name}</span>
            </div>

            <div className="flex items-center gap-0.5">
              <button
                onClick={() => handleChange(path, round(node.value - 0.001))}
                disabled={
                  currentNode?.locked ||
                  isTopLevelLocked ||
                  currentNode?.name === 'Aaji' ||
                  aajiAncestorCheck(path)
                }
                className="px-1 py-0.5 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                −
              </button>

              <div className="flex items-center gap-1">
                <span className="w-[70px] text-center border px-1 py-0.5 rounded ">
                  {showActuals
                    ? `${getCrValue(node.value, totalAmount, brokeragePercent).toFixed(2)} Cr`
                    : usePercentageOf66
                      ? (node.value * 66.67).toFixed(2)
                      : fractionString}
                </span>
              </div>

              <button
                onClick={() => handleChange(path, round(node.value + 0.001))}
                disabled={
                  currentNode?.locked ||
                  isTopLevelLocked ||
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
                const nextChild = node.children?.[i + 1];

                const shouldInsertTransition =
                  nextChild &&
                  ((currentChild.locked && !nextChild.locked) ||
                   (!currentChild.locked && nextChild.locked));

                return (
                  <React.Fragment key={currentPath.join('-')}>
                    {renderNode(child, currentPath, showActuals, totalAmount, usePercentageOf66, brokeragePercent)}
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
  const printRef = useRef<HTMLDivElement>(null);
  return (
    <div id="printable-area" className="p-4 text-sm ">
      {/* Sticky Header */}
      <div className="bg-white shadow-md p-4 sticky top-0 z-10" style={{ minHeight: '150px' }}>
        <div className="grid grid-cols-1 gap-2">

          {/* First Row: Title */}
          <div className="flex flex-wrap items-center justify-center sm:justify-center gap-2">
            <h1 className="text-lg font-semibold text-left sm:text-left sm:w-auto">
              Distribute Fairly App
            </h1>
          </div>

          {/* First Row: Centered Buttons */}
          <div className="flex justify-center flex-wrap gap-1">
            <button onClick={handleUndo} className="p-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200" title="Undo">
              ↶
            </button>
            <button onClick={handleRedo} className="p-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200" title="Redo">
              ↷
            </button>
            <button onClick={handleReset} className="p-1 bg-red-100 text-red-800 rounded hover:bg-red-200" title="Reset">
              ⟳
            </button>
            <button
              onClick={handleDownloadPDF}
              className="p-1 px-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
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

            {/* Brokerage (%) */}
            <div className="flex items-center gap-1 min-w-[120px] justify-center">
              <span className="text-sm font-medium">Brokerage (%):</span>
              <input
                type="number"
                min={0}
                step={0.1}
                value={isNaN(brokeragePercent) ? '' : brokeragePercent}
                onChange={(e) => setBrokeragePercent(parseFloat(e.target.value) || 0)}
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
        {/* Desktop: Separate Grids */}
        <div className="hidden sm:grid grid-cols-7 gap-2">
          {adjustedTreeData
              .filter((node) => node.name !== 'Aaji')
              .map((node, index) => {
            return (
              <div key={index} className="p-2 bg-gray-100 bg-white rounded shadow text-center">
                <div className="flex items-center justify-between border border-gray-300 rounded px-2 py-1  shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium whitespace-nowrap">{node.name}</span>

                    {/* Lock/Unlock icon for top-level */}
                    <button
                      onClick={() => toggleLock([index])}
                      className="p-1 rounded hover:bg-gray-200"
                      title={node.locked ? 'Unlock' : 'Lock'}
                    >
                      <img
                        src={node.locked ? "/icons/lock-red.png" : "/icons/unlock-green.png"}
                        alt={node.locked ? "Locked" : "Unlocked"}
                        className="w-5 h-5 transition-transform duration-300 hover:scale-110"
                      />
                    </button>
                  </div>

                  {/* Value controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleChange([index], round(node.value - 0.001))}
                      disabled={node.locked}
                      className="text-sm px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
                    >
                      −
                    </button>
                    <span className="w-16 text-center border px-2 py-1 rounded bg-white">
                      {showActuals
                        ? getCrValue(node.value, totalAmount, brokeragePercent).toFixed(2)
                        : usePercentageOf66
                          ? (node.value * 66.67).toFixed(2)
                          : formatAsUnitFraction((node.value * totalAmount) / (totalAmount - (totalAmount * brokeragePercent / 100)))}
                    </span>
                    <button
                      onClick={() => handleChange([index], round(node.value + 0.001))}
                      disabled={node.locked}
                      className="text-sm px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Responsive Tree Structure */}
      <div className="w-full">

        {/* Desktop: Child Grid */}
        <div className="hidden sm:grid grid-cols-7 gap-2 mt-2">
          {adjustedTreeData
            .filter((node) => node.name !== 'Aaji')
            .map((node, topLevelIndex) => (
              <div key={topLevelIndex} className="px-1">
                {node.children?.map((child, childIndex) =>
                  renderNode(child, [topLevelIndex, childIndex], showActuals, totalAmount, usePercentageOf66, brokeragePercent)
                )}
              </div>
          ))}
        </div>

        {/* Mobile: Top-level and children stacked */}
        <div className="sm:hidden flex flex-col gap-4 mt-4">
          {adjustedTreeData
              .filter((node) => node.name !== 'Aaji')
              .map((node, index) => (
            <div key={index} className=" text-black sm:bg-gray-50 sm:text-gray-800 rounded shadow p-2">
              {/* Top-level */}
              <div className="flex items-center justify-between border border-gray-300 rounded px-2 py-1  shadow-sm mb-2">
                <span className="font-medium whitespace-nowrap">{node.name}</span>
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
                      ? (getCrValue(node.value, totalAmount, brokeragePercent)).toFixed(2)
                      : usePercentageOf66
                      ? (node.value * 66.67).toFixed(2)
                      : formatAsUnitFraction((node.value * totalAmount) / (totalAmount - (totalAmount * brokeragePercent / 100)))}
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
                  renderNode(child, [index, childIndex], showActuals, totalAmount, usePercentageOf66, brokeragePercent)
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SingleTreeColumn;