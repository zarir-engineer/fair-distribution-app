import { initialTreeData } from './initialTreeData';

export const headers = initialTreeData.map((node) => node.name);

// Recursively structure children
const normalizeChildren = (children = []) =>
  children.map((child) => ({
    id: child.id,
    name: child.name,
    value: child.value,
    children: normalizeChildren(child.children),
  }));

export const columnsWithChildren = initialTreeData.map((node) => ({
  name: node.name,
  children: normalizeChildren(node.children),
}));
