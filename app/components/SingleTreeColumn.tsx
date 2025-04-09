import React, { useEffect, useState } from 'react';
import { initialTreeData } from '../data/initialTreeData';
import { Lock } from 'lucide-react';

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

  const aajiAncestorCheck = (path: number[]) => {
    let node = treeData[path[0]];
    for (let i = 1; i < path.length; i++) {
      if (node.name === 'Aaji') return true;
      node = node.children?.[path[i]] ?? { name: '', value: 0 };
    }
    return node.name === 'Aaji';
  };

  const updateTree = (path: number[], newValue: number, lockValue = false) => {
    setTreeData((prevTree) => {
      const newTree = structuredClone(prevTree);
      const parent = newTree[path[0]];
      const childPath = path.slice(1);

      let nodeToUpdate: TreeNode;
      if (childPath.length) {
        nodeToUpdate = getNodeByPath(parent, childPath);
      } else {
        nodeToUpdate = parent;
      }

      const parentValueBefore = parent.value;
      const delta = newValue - nodeToUpdate.value;
      nodeToUpdate.value = parseFloat(newValue.toFixed(6));
      if (lockValue) nodeToUpdate.locked = true;

      if (childPath.length) {
        const siblings = getNodeByPath(parent, childPath.slice(0, -1)).children || [];
        const totalUnlocked = siblings.filter(n => !n.locked && n !== nodeToUpdate).reduce((acc, n) => acc + n.value, 0);

        siblings.forEach((sibling) => {
          if (sibling !== nodeToUpdate && !sibling.locked) {
            const ratio = sibling.value / totalUnlocked;
            sibling.value = parseFloat((sibling.value - ratio * delta).toFixed(6));
          }
        });

        // Recalculate parent value from children
        parent.value = parseFloat((parent.children?.reduce((sum, c) => sum + c.value, 0) ?? 0).toFixed(6));
      } else {
        // Top-level node edited, redistribute to other top-level nodes
        const unlocked = newTree.filter(n => !n.locked && n !== nodeToUpdate);
        const totalUnlocked = unlocked.reduce((sum, n) => sum + n.value, 0);

        unlocked.forEach((node) => {
          const ratio = node.value / totalUnlocked;
          node.value = parseFloat((node.value - ratio * delta).toFixed(6));
        });
      }

      return newTree;
    });
  };


  const rebalanceSiblings = (siblings: TreeNode[], editedIdx: number) => {
    const editedNode = siblings[editedIdx];
    const total = siblings.reduce((sum, node) => sum + node.value, 0);

    const unlockedIndices = siblings
      .map((s, i) => (!s.locked && i !== editedIdx ? i : -1))
      .filter((i) => i !== -1);

    const lockedTotal = siblings
      .filter((s, i) => s.locked || i === editedIdx)
      .reduce((sum, s) => sum + s.value, 0);

    const remaining = 1 - lockedTotal;

    if (remaining < 0 || unlockedIndices.length === 0) return;

    const oldSum = unlockedIndices.reduce((sum, i) => sum + siblings[i].value, 0);

    for (let i of unlockedIndices) {
      const oldVal = siblings[i].value;
      const newVal = oldSum === 0 ? remaining / unlockedIndices.length : (oldVal / oldSum) * remaining;
      siblings[i].value = parseFloat(newVal.toFixed(6));
    }
  };

  const handleChange = (path: number[], newValue: number) => {
    const currentPath = getPath(path);

    setTreeData((prev) => {
      const treeCopy = JSON.parse(JSON.stringify(prev)); // Deep clone
      const [topLevelIdx, ...childPath] = path;
      const topLevelNode = treeCopy[topLevelIdx];

      // Lock previous node if we're editing a different node now
      if (editingPath && editingPath !== currentPath) {
        const [prevIdx, ...prevChildPath] = editingPath.split('-').map(Number);
        const prevParent = treeCopy[prevIdx];
        const prevNode = getNodeByPath(prevParent, prevChildPath);
        if (prevNode) {
          prevNode.locked = true;
        }
      }

      setEditingPath(currentPath); // Update current editing path

      const editedNode = getNodeByPath(topLevelNode, childPath);

      if (!editedNode || editedNode.name === 'Aaji') return prev;

      editedNode.value = parseFloat(newValue.toFixed(6)); // Set full precision
      editedNode.locked = false;

      // Rebalance siblings
      if (childPath.length > 0) {
        const parentNode = getNodeByPath(topLevelNode, childPath.slice(0, -1));
        const siblings = parentNode.children!;
        rebalanceSiblings(siblings, childPath[childPath.length - 1]);
      } else {
        const siblings = treeCopy.filter((_, i) => i !== topLevelIdx);
        rebalanceSiblings([topLevelNode, ...siblings], 0);
      }

      // Ensure top-level node value matches children sum
      const updatedTopValue = topLevelNode.children
        ? topLevelNode.children.reduce((sum, child) => sum + child.value, 0)
        : topLevelNode.value;
      topLevelNode.value = parseFloat(updatedTopValue.toFixed(6));

      return treeCopy;
    });
  };

  const renderNode = (node: TreeNode, path: number[] = []) => (
    <div key={path.join('-')} className="p-2 border mb-1 bg-white rounded shadow">
      <div className="flex items-center gap-2">
        <span className="w-24 font-medium truncate">{node.name}</span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handleChange(path, round(node.value - 0.001))}
            disabled={node.name === 'Aaji' || node.locked || aajiAncestorCheck(path)}
            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            −
          </button>

          <span className="w-16 text-center border px-2 py-1 rounded bg-white">
            {round(node.value)}
          </span>

          <button
            onClick={() => handleChange(path, round(node.value + 0.001))}
            disabled={node.name === 'Aaji' || node.locked || aajiAncestorCheck(path)}
            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            +
          </button>

          {(node.name === 'Aaji' || node.locked || aajiAncestorCheck(path)) && (
            <Lock size={14} className="text-gray-500 ml-2" />
          )}
        </div>
      </div>
      {node.children && (
        <div className="ml-6 mt-2">
          {node.children.map((child, i) => renderNode(child, [...path, i]))}
        </div>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-8 gap-4">
      {treeData.map((node, index) => (
        <div key={index}>{renderNode(node, [index])}</div>
      ))}
    </div>
  );
};

export default SingleTreeColumn;
