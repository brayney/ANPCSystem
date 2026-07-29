// Super administrators are deliberately not given implicit access to branch data.
// They manage branches and accounts from the central administration area only.
// A company administrator has no operational branch scope. Use an impossible
// match rather than `undefined`, which Mongoose may omit from a query.
exports.branchFilter = (req) => (req.user?.branch ? { branch: req.user.branch } : { _id: null });
exports.branchData = (req, data = {}) => ({ ...data, branch: req.user.branch });
