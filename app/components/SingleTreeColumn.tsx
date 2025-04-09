import React, { useEffect, useState } from 'react';
import { initialTreeData } from '../data/initialTreeData';
import { Lock } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface TreeNode {
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

  const pushToHistory = (snapshot: TreeNode[]) => {
    setHistory((prev) => [...prev, snapshot]);
    setFuture([]); // clear future on new change
  };

  const handleSave = async () => {
    const element = document.body; // or use a more specific ref
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('tree-data.pdf');
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
      pushToHistory(prev);
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

            <span className="w-[52px] text-center border px-1 py-0.5 rounded bg-white">
              {node.value.toFixed(3)}
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
    <div className="h-screen flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white shadow-md px-4 py-2 flex justify-between items-center">
        <div className="text-xl font-semibold">Distribute Fairly App</div>
        <div className="text-lg">
          Total: {treeData.reduce((sum, node) => sum + node.value, 0).toFixed(3)}
        </div>
        <div className="flex gap-2">
          <button onClick={handleUndo} className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded">
            Undo
          </button>
          <button onClick={handleRedo} className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded">
            Redo
          </button>
          <button onClick={handleReset} className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 rounded">
            Reset
          </button>
          <button onClick={handleSave} className="px-3 py-1 bg-green-100 hover:bg-green-200 rounded">
            Save to PDF
          </button>
        </div>
      </div>

      {/* Scrollable Tree Grid */}
      <div className="overflow-auto flex-1 p-2">
        <div className="grid grid-cols-8 gap-2">
          {treeData.map((node, index) => (
            <div key={index} className="px-1">{renderNode(node, [index])}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SingleTreeColumn;
