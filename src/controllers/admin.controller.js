const User = require('../models/User');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');

exports.getStats = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const problemCount = await Problem.countDocuments();
        const submissionCount = await Submission.countDocuments();

        res.json({
            users: userCount,
            problems: problemCount,
            submissions: submissionCount
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
