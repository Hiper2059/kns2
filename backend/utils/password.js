const bcrypt = require('bcryptjs');

const hashPassword = async (value, rounds = 10) => bcrypt.hash(value, rounds);
const comparePassword = async (value, hash) => bcrypt.compare(value, hash);

module.exports = { hashPassword, comparePassword };
