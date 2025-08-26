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

function buildMultiLevelProductionTree(items) {
  const map = {};
  const roots = [];

  // Map each item by id and init level
  items.forEach(item => {
    map[item.id] = { ...item, children: [], level: 0 };
  });

  // Build tree & assign level
  items.forEach(item => {
    if (item.parentProductionId && map[item.parentProductionId]) {
      const parent = map[item.parentProductionId];
      map[item.id].level = parent.level + 1;
      parent.children.push(map[item.id]);
    } else {
      roots.push(map[item.id]);
    }
  });

  // Cleanup empty children arrays
  function clean(node) {
    if (node.children.length === 0) {
      node.children = null;
    } else {
      node.children.forEach(clean);
    }
  }
  roots.forEach(clean);

  return roots;
}



const isValidJSON = (data) => {
  try {
    const jsonObj = JSON.parse(data);
    return jsonObj;
  } catch (error) {
    return false;
  }
}


module.exports = { buildRawMaterialTreeWithLevel, isValidJSON, buildMultiLevelProductionTree }