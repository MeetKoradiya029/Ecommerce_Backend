"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    user: "sa",
    password: "sa123$",
    server: "DSERVER1",
    database: "Meet_Test",
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
    pool: {
        max: 10, // Adjust max pool size as needed
        min: 0,
        idleTimeoutMillis: 30000,
    },
};
