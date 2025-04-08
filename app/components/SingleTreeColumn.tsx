'use client';

import React, { useState } from 'react';
import { initialTreeData } from '../data/initialTreeData';
import { Lock } from 'lucide-react';

interface TreeNode {
  name: string;
  value: number;
  locked?: boolean;
  children?: TreeNode[];
}

const round = (num: number) => Math.round(num * 1000) / 1000;

const cloneTree = (tree: TreeNode[]): TreeNode[] =>
  tree.map((node) => ({
    ...node,
    children: node.children ? cloneTree(node.children) : undefined,
  }));

const sumUnlocked = (nodes: TreeNode[]) =>
  nodes.filter((n) => !n.locked).reduce((acc, n) => acc + n.value, 0);

const SingleTreeColumn = () => {
  const [treeData, setTreeData] = useState<TreeNode[]>(() => cloneTree(initialTreeData));
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const updateTree = (path: number[], newValue: number, lock = true) => {
    setTree((prevTree) => {
      const newTree = JSON.parse(JSON.stringify(prevTree)) as TreeNode[];

      // Deep reference to the node and its parent
      let node = newTree[path[0]];
      const parentPath = path.slice(0, -1);

      // Check for Aaji in ancestry
      const aajiInPath = (p: number[]) => {
        let current = newTree[p[0]];
        if (current.name === 'Aaji') return true;
        for (let i = 1; i < p.length; i++) {
          if (!current.children) return false;
          current = current.children[p[i]];
          if (current.name === 'Aaji') return true;
        }
        return false;
      };
      if (aajiInPath(path)) return prevTree;

      // Traverse to the target node
      for (let i = 1; i < path.length; i++) {
        if (!node.children) return prevTree;
        node = node.children[path[i]];
      }

      if (node.name === 'Aaji' || node.locked) return prevTree;

      const delta = newValue - node.value;
      node.value = newValue;

      if (lock) node.locked = true;

      // Rebalance siblings
      if (path.length > 1) {
        const parent = path.slice(0, -1).reduce((acc, idx) => {
          return acc.children![idx];
        }, { children: newTree } as TreeNode);

        const siblings = parent.children!;
        const totalLocked = siblings.filter((n) => n.locked && n !== node).reduce((sum, n) => sum + n.value, 0);
        const editableSiblings = siblings.filter((n) => n !== node && !n.locked);

        const remaining = parent.value - (lock ? newValue : node.value) - totalLocked;

        if (editableSiblings.length > 0 && remaining >= 0) {
          const sumOriginal = editableSiblings.reduce((s, n) => s + n.value, 0);
          editableSiblings.forEach((n) => {
            const ratio = sumOriginal > 0 ? n.value / sumOriginal : 1 / editableSiblings.length;
            n.value = Math.max(0, parseFloat((remaining * ratio).toFixed(3)));
          });
        }
      }

      // Always update top-level values as sum of children
      newTree.forEach((topNode) => {
        if (topNode.children?.length) {
          topNode.value = parseFloat(
            topNode.children.reduce((sum, child) => sum + child.value, 0).toFixed(3)
          );
        }
      });

      // If edited top-level, rebalance others unless locked
      if (path.length === 1) {
        const edited = newTree[path[0]];
        const lockedSiblings = newTree.filter((n, i) => i !== path[0] && n.locked);
        const unlocked = newTree.filter((n, i) => i !== path[0] && !n.locked);

        const remaining = 1 - edited.value - lockedSiblings.reduce((s, n) => s + n.value, 0);
        if (unlocked.length > 0 && remaining >= 0) {
          const sumOriginal = unlocked.reduce((s, n) => s + n.value, 0);
          unlocked.forEach((n) => {
            const ratio = sumOriginal > 0 ? n.value / sumOriginal : 1 / unlocked.length;
            n.value = parseFloat((remaining * ratio).toFixed(3));
          });
        }
      }

      return newTree;
    });
  };

  const getPath = (path: number[]) => path.join('-');

  // ⬇️ Move helper INSIDE the component so it has access to `tree`
  const aajiAncestorCheck = (path: number[]) => {
    let node = treeData[path[0]];
    for (let i = 1; i < path.length; i++) {
      if (node.name === 'Aaji') return true;
      node = node.children?.[path[i]] ?? { name: '', value: 0 };
    }
    return false;
  };

  const updateValueAtPath = (path: number[], newValue: number, data: TreeNode[]): TreeNode[] => {
    const newData = cloneTree(data);
    let current = newData;
    let parent: TreeNode[] | null = null;
    let parentIndex = -1;

    for (let i = 0; i < path.length; i++) {
      parent = current;
      parentIndex = path[i];
      current = current[parentIndex].children || [];
    }

    const node = parent![parentIndex];
    const oldValue = node.value;
    const delta = newValue - oldValue;

    if (node.name === 'Aaji') return newData;

    node.value = newValue;
    node.locked = true;

    if (path.length === 2) {
      // Child node update → adjust siblings
      const topNode = newData[path[0]];
      const siblings = topNode.children!;

      const editableSiblings = siblings.filter((n, i) => i !== path[1] && !n.locked);
      const totalAvailable = editableSiblings.reduce((sum, n) => sum + n.value, 0);
      const newTotal = round(topNode.children!.reduce((acc, c) => acc + c.value, 0));

      // Adjust siblings
      editableSiblings.forEach((sibling) => {
        if (totalAvailable > 0) {
          sibling.value = round(sibling.value - (sibling.value / totalAvailable) * delta);
        }
      });

      // Update top-level value to sum of children
      topNode.value = round(topNode.children!.reduce((acc, c) => acc + c.value, 0));
    } else if (path.length === 1) {
      // Top-level node update → adjust other top-level nodes
      const editableTop = newData.filter((n, i) => i !== path[0] && !n.locked);
      const totalAvailable = editableTop.reduce((sum, n) => sum + n.value, 0);

      editableTop.forEach((n) => {
        if (totalAvailable > 0) {
          n.value = round(n.value - (n.value / totalAvailable) * delta);
        }
      });

      node.value = newValue;
      node.locked = true;

      // Adjust children proportionally
      if (node.children && !node.children.every(c => c.locked)) {
        const unlockedChildren = node.children.filter(c => !c.locked);
        const totalUnlocked = unlockedChildren.reduce((sum, c) => sum + c.value, 0);
        unlockedChildren.forEach((child) => {
          if (totalUnlocked > 0) {
            child.value = round(child.value * (newValue / (totalUnlocked + (delta))));
          }
        });
      }
    }

    return newData;
  };

  const handleChange = (path: number[], newValue: number) => {
    if (!editingPath) {
      setEditingPath(getPath(path)); // First time editing, store path but don't lock yet
      updateTree(path, newValue, false); // Don't lock this yet
    } else {
      // Lock the previous edited path
      const [prevParentIdx, ...rest] = editingPath.split('-').map(Number);
      if (rest.length) {
        const prevParent = tree[prevParentIdx];
        const prevNode = getNodeByPath(prevParent, rest);
        prevNode.locked = true;
      }
      setEditingPath(getPath(path)); // Update to new editing path
      updateTree(path, newValue, false); // Don't lock new one yet
    }
  };

  const renderNode = (node: TreeNode, path: number[] = []) => (
    <div key={getPath(path)} className="p-2 border mb-1 bg-white rounded shadow">
      <div className={`flex items-center gap-2 ${getPath(path) === editingPath ? 'ring ring-blue-400' : ''}`}>
        <span className="w-24 font-medium truncate">{node.name}</span>
        <input
          type="number"
          step="0.001"
          min="0"
          max="1"
          disabled={node.name === 'Aaji' || node.locked || aajiAncestorCheck(path)}
          value={round(node.value)}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) handleChange(path, val);
          }}
          className="w-24 border px-2 py-1 rounded"
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
          }}
        />
        {(node.name === 'Aaji' || node.locked || isDescendantOfAaji(path)) && <Lock size={14} className="text-gray-500" />}
      </div>
      {node.children && (
        <div className="ml-6 mt-2">
          {node.children.map((child, i) => renderNode(child, [...path, i]))}
        </div>
      )}
    </div>
  );

  const isDescendantOfAaji = (path: number[]): boolean => {
    if (path.length < 1) return false;
    const topLevel = treeData[path[0]];
    return topLevel.name === 'Aaji';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-2">
      {treeData.map((node, i) => renderNode(node, [i]))}
    </div>
  );
};

export default SingleTreeColumn;
