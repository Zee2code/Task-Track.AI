import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { HierarchyNode } from "../../types";

export function OrgChart() {
  const [roots, setRoots] = useState<HierarchyNode[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get<HierarchyNode[]>("/employees/hierarchy")
      .then(({ data }) => setRoots(data))
      .catch(() => setError(true));
  }, []);

  if (error) return <p className="text-sm text-red-600">Failed to load hierarchy.</p>;
  if (!roots) return <p className="text-sm text-neutral-400">Loading hierarchy...</p>;
  if (roots.length === 0) return <p className="text-sm text-neutral-400">No hierarchy data yet.</p>;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 overflow-x-auto">
      <ul>
        {roots.map((node) => (
          <TreeNode key={node.id} node={node} isRoot />
        ))}
      </ul>
    </div>
  );
}

function TreeNode({ node, isRoot = false }: { node: HierarchyNode; isRoot?: boolean }) {
  return (
    <li className={isRoot ? "" : "ml-6 border-l border-neutral-200 pl-4 mt-2"}>
      <div className="flex items-center gap-2 py-1">
        <div
          className={`rounded-md border px-3 py-1.5 text-sm ${
            node.isActive ? "border-neutral-200 bg-neutral-50" : "border-neutral-200 bg-neutral-100 text-neutral-400"
          }`}
        >
          <span className="font-medium">{node.employeeName}</span>
          <span className="text-neutral-500"> — {node.designation}</span>
          {node.department?.name && <span className="text-neutral-400"> · {node.department.name}</span>}
          {!node.isActive && <span className="ml-2 text-xs text-neutral-400">(inactive)</span>}
        </div>
      </div>
      {node.subordinates.length > 0 && (
        <ul>
          {node.subordinates.map((child) => (
            <TreeNode key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}
