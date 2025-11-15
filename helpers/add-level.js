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

const istToUtc = (date) => {
  return new Date(date.getTime() - (5.5 * 60 * 60 * 1000));
}

const getAllDatesInRange = (start, end) => {
  const dates = [];
  let curr = new Date(start);
  while (curr <= end) {
    dates.push(formatToIstDate(curr));
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

const formatToIstDate = (date) => {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffset);
  return istDate.toISOString().slice(0, 10).split("-").reverse().join("-");
}

function getIndianTime(dateInput) {
  const date = new Date(dateInput);
  const options = {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  };

  return new Intl.DateTimeFormat('en-IN', options).format(date);
}

module.exports = {
  buildRawMaterialTreeWithLevel,
  isValidJSON,
  buildMultiLevelProductionTree,
  istToUtc,
  getAllDatesInRange,
  formatToIstDate,
  getIndianTime
}