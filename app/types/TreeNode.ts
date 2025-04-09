export interface TreeNode {
  id: string;
  name: string;
  value: number;
  locked?: boolean;
  isTopLevel?: boolean; // ← add this line
  children?: TreeNode[];
}
