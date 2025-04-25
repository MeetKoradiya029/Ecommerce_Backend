"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = void 0;
const isAdmin = async (req, res, next) => {
    var _a, _b;
    try {
        // const { user_type } = req?.user;
        if (!(req === null || req === void 0 ? void 0 : req.user) || !((_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.user_type)) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (((_b = req === null || req === void 0 ? void 0 : req.user) === null || _b === void 0 ? void 0 : _b.user_type) !== 1) {
            return res.status(403).json({ message: 'Access Denied!' });
        }
        next();
    }
    catch (error) {
        console.error('Error in isAdmin middleware:', error);
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};
exports.isAdmin = isAdmin;
