const healthCheck = (req, res) => {
  res.json({ status: 'ok', service: 'z-mate-api' });
};

module.exports = { healthCheck };
