const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const toPositiveInteger = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.floor(parsed);
};

const getPaginationParams = (query = {}) => {
  const page = toPositiveInteger(query.page, DEFAULT_PAGE);
  const requestedLimit = toPositiveInteger(query.limit, DEFAULT_LIMIT);
  const limit = Math.min(requestedLimit, MAX_LIMIT);

  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
};

const buildPagination = ({ totalItems, page, limit }) => ({
  totalItems,
  totalPages: Math.ceil(totalItems / limit),
  currentPage: page,
  limit
});

module.exports = {
  getPaginationParams,
  buildPagination
};
