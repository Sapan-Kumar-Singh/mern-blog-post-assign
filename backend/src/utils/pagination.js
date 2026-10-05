const getPagination = ({ page = 1, limit = 10 } = {}) => ({
  page,
  limit,
  skip: (page - 1) * limit,
});

const buildPaginationMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit) || 1,
});

module.exports = { getPagination, buildPaginationMeta };
