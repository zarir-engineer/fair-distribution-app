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

  const handleChange = (path: number[], newValue: number) => {
    if (!editingPath) {
      setEditingPath(getPath(path));
      updateTree(path, newValue, false);
    } else {
      const [prevParentIdx, ...rest] = editingPath.split('-').map(Number);
      if (rest.length) {
        const prevParent = treeData[prevParentIdx];
        const prevNode = getNodeByPath(prevParent, rest);
        prevNode.locked = true;
      } else {
        treeData[prevParentIdx].locked = true;
      }
      setEditingPath(getPath(path));
      updateTree(path, newValue, false);
    }
  };

  const renderNode = (node: TreeNode, path: number[] = []) => (
    <div key={path.join('-')} className="p-2 border mb-1 bg-white rounded shadow">
      <div className={`flex items-center gap-2 ${getPath(path) === editingPath ? 'ring ring-blue-400' : ''}`}>
        <span className="w-24 font-medium truncate">{node.name}</span>
        <input
          type="number"
          step="0.001"
          min="0"
          max="1"
          disabled={node.name === 'Aaji' || node.locked || aajiAncestorCheck(path)}
          value={round(node.value)}
          onChange={(e) => handleChange(path, parseFloat(e.target.value))}
          className="w-24 border px-2 py-1 rounded"
        />
        {(node.name === 'Aaji' || node.locked || aajiAncestorCheck(path)) && <Lock size={14} className="text-gray-500" />}
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
