function buildRawMaterialTreeWithLevel(flatMaterials) {
  const idToNodeMap = {};
  const rootNodes = [];

  // Convert to plain objects and index by ID
  flatMaterials.forEach(material => {
    const plain = material.get ? material.get({ plain: true }) : material;
    idToNodeMap[plain.id] = { ...plain, children: [], level: 0 };
  });

  // Build tree and assign level
  for (const id in idToNodeMap) {
    const node = idToNodeMap[id];
    if (node.parentId && idToNodeMap[node.parentId]) {
      const parent = idToNodeMap[node.parentId];
      node.level = parent.level + 1;
      parent.children.push(node);
    } else {
      rootNodes.push(node);
    }
  }

  // Recursively clean up empty children arrays
  function cleanChildren(nodes) {
    nodes.forEach(node => {
      if (node.children.length > 0) {
        cleanChildren(node.children); // recurse
      } else {
        node.children = null;
      }
    });
  }

  cleanChildren(rootNodes);
  return rootNodes;
}

const isValidJSON = (data) => {
  try {
    const jsonObj = JSON.parse(data);
    return jsonObj;
  } catch (error) {
    return false;
  }
}


module.exports = { buildRawMaterialTreeWithLevel, isValidJSON }