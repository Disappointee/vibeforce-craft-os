/**
 * Graph & Dependency Cycle Detection Utility for Gantt Planner
 */

export interface DependencyLink {
  id?: string;
  sourceTask: string;
  targetTask: string;
  type?: 'blocks' | 'depends_on' | 'relates_to';
}

/**
 * Builds an adjacency list from dependency links.
 */
export function buildAdjacencyMap(links: DependencyLink[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const link of links) {
    if (link.type === 'relates_to') continue;
    if (!map.has(link.sourceTask)) {
      map.set(link.sourceTask, new Set());
    }
    map.get(link.sourceTask)!.add(link.targetTask);
  }
  return map;
}

/**
 * Checks whether adding a directed link (from -> to) would introduce a cycle.
 * Returns true if a cycle is detected, false otherwise.
 */
export function wouldIntroduceCycle(
  existingLinks: DependencyLink[],
  newSource: string,
  newTarget: string
): boolean {
  if (newSource === newTarget) return true;

  const adj = buildAdjacencyMap(existingLinks);
  const visited = new Set<string>();
  const stack = [newTarget];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === newSource) {
      return true; // Cycle detected: newTarget can reach newSource
    }

    if (visited.has(current)) continue;
    visited.add(current);

    const neighbors = adj.get(current);
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      }
    }
  }

  return false;
}
