import { initialTreeData } from './initialTreeData';

export const headers = initialTreeData.map((node) => node.name);

import type { TreeNode } from "../components/SingleTreeColumn"; // Adjust path if needed

const normalizeChildren = (children: any[] = []): TreeNode[] =>
  children.map((child) => ({
    name: child.name,
    value: child.value,
    locked: child.locked,
    children: normalizeChildren(child.children || []),
  }));

export const columnsWithChildren = initialTreeData.map((node) => ({
  name: node.name,
  children: normalizeChildren(node.children),
}));
