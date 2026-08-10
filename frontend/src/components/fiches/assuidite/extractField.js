// utils/extractField.js
export function extractField(user, field, maxDepth = 5) {
  let node = user;
  let depth = 0;

  while (node && depth < maxDepth) {
    if (node[field] !== undefined && node[field] !== null) {
      return node[field];
    }
    node = node.personnel ?? node.responsable;
    depth++;
  }

  return null;
}