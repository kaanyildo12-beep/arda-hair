function enforceJsonBodyLimit(req, maxBytes = 32768) {
  const contentLength = Number(req.headers?.['content-length'] || 0);

  if (
    Number.isFinite(contentLength) &&
    contentLength > maxBytes
  ) {
    return false;
  }

  try {
    const body =
      typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body ?? {});

    return Buffer.byteLength(body, 'utf8') <= maxBytes;
  } catch {
    return false;
  }
}

module.exports = {
  enforceJsonBodyLimit
};
