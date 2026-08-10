//extractIdpers.js
export function extractIdpers(user, maxDepth = 5) {
  let node = user;
  let depth = 0;

  while (node && depth < maxDepth) {
    if (node.idpers !== undefined && node.idpers !== null) {
      return node.idpers;
    }
    node = node.personnel;
    depth++;
  }

  return null;
}