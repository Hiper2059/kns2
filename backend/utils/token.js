const jwt = require('jsonwebtoken');
const config = require('../config/env');

const signToken = (payload, secret, expiresIn) => jwt.sign(payload, secret, { expiresIn });

const createAuthTokensForPayload = payload => {
  return {
    accessToken: signToken(payload, config.jwt.accessSecret, config.jwt.accessTtl),
    refreshToken: signToken({ sub: payload.sub }, config.jwt.refreshSecret, config.jwt.refreshTtl),
    signatureToken: signToken({ sub: payload.sub, purpose: 'signature' }, config.jwt.signatureSecret, config.jwt.signatureTtl)
  };
};

const createAuthTokens = user => {
  const payload = {
    sub: user._id.toString(),
    username: user.username,
    role: user.role
  };

  return createAuthTokensForPayload(payload);
};

const extractBearerToken = req => {
  const header = req.header('authorization');
  if (!header) {
    return null;
  }
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) {
    return null;
  }
  return token;
};

module.exports = { createAuthTokens, createAuthTokensForPayload, extractBearerToken };
