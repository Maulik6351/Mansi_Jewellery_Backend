"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashUtil = void 0;
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;
class HashUtil {
    static async hash(password) {
        return bcrypt.hash(password, SALT_ROUNDS);
    }
    static async compare(password, hash) {
        return bcrypt.compare(password, hash);
    }
}
exports.HashUtil = HashUtil;
//# sourceMappingURL=hash.util.js.map