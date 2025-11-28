const Contest = require('../models/Contest');
const Submission = require('../models/Submission');

exports.createContest = async (contestData) => {
    const contest = new Contest(contestData);
    await contest.save();
    return contest;
};

exports.getAllContests = async (filters = {}) => {
    const query = {};
    
    // Filter by status (upcoming, ongoing, past)
    if (filters.status) {
        const now = new Date();
        if (filters.status === 'upcoming') {
            query.startTime = { $gt: now };
        } else if (filters.status === 'ongoing') {
            query.startTime = { $lte: now };
            query.endTime = { $gte: now };
        } else if (filters.status === 'past') {
            query.endTime = { $lt: now };
        }
    }

    const contests = await Contest.find(query).sort({ startTime: -1 });
    return contests;
};

exports.getContestById = async (contestId) => {
    const contest = await Contest.findById(contestId)
        .populate('problems', 'title slug difficulty')
        .populate('participants', 'username');
    
    if (!contest) {
        throw new Error('Contest not found');
    }
    
    return contest;
};

exports.updateContest = async (contestId, updateData) => {
    const contest = await Contest.findByIdAndUpdate(
        contestId,
        updateData,
        { new: true }
    );
    
    if (!contest) {
        throw new Error('Contest not found');
    }
    
    return contest;
};

exports.deleteContest = async (contestId) => {
    const contest = await Contest.findByIdAndDelete(contestId);
    
    if (!contest) {
        throw new Error('Contest not found');
    }
    
    return { message: 'Contest deleted successfully' };
};

exports.registerForContest = async (contestId, userId) => {
    const contest = await Contest.findById(contestId);
    
    if (!contest) {
        throw new Error('Contest not found');
    }
    
    if (contest.participants.includes(userId)) {
        throw new Error('Already registered for this contest');
    }
    
    // Check if registration is still open
    const now = new Date();
    if (now > contest.endTime) {
        throw new Error('Contest has ended');
    }
    
    contest.participants.push(userId);
    await contest.save();
    
    return { message: 'Registered successfully' };
};

exports.getContestLeaderboard = async (contestId) => {
    const contest = await Contest.findById(contestId);
    
    if (!contest) {
        throw new Error('Contest not found');
    }
    
    // Get all submissions for this contest's problems
    const submissions = await Submission.find({
        problemId: { $in: contest.problems },
        userId: { $in: contest.participants },
        status: 'Accepted'
    })
    .populate('userId', 'username')
    .sort({ createdAt: 1 });
    
    // Calculate scores
    const userScores = {};
    
    submissions.forEach(sub => {
        const userId = sub.userId._id.toString();
        if (!userScores[userId]) {
            userScores[userId] = {
                username: sub.userId.username,
                score: 0,
                solvedProblems: new Set()
            };
        }
        
        // Award points only for first successful submission per problem
        if (!userScores[userId].solvedProblems.has(sub.problemId.toString())) {
            userScores[userId].score += 1;
            userScores[userId].solvedProblems.add(sub.problemId.toString());
        }
    });
    
    // Convert to array and sort by score
    const leaderboard = Object.values(userScores)
        .map(user => ({
            username: user.username,
            score: user.score,
            problemsSolved: user.solvedProblems.size
        }))
        .sort((a, b) => b.score - a.score);
    
    return leaderboard;
};
