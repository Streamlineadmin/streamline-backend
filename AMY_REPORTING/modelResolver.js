function resolveModel(db, name) {
    if (!name) return null;
  
    const normalized = name.toLowerCase();
  
    return Object.values(db).find(
      m =>
        m?.name?.toLowerCase() === normalized ||
        m?.tableName?.toLowerCase() === normalized
    );
  }
  
  module.exports = { resolveModel };
  