export const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

export const formatDateTime = (value) => new Date(value).toLocaleString();
