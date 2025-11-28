const Contest = require('../models/Contest');

exports.createContest = async (req, res) => {
    try {
        const contest = new Contest(req.body);
        await contest.save();
        res.status(201).json(contest);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllContests = async (req, res) => {
    try {
        const contests = await Contest.find().sort({ startTime: -1 });
        res.json(contests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getContestById = async (req, res) => {
    try {
        const contest = await Contest.findById(req.params.id).populate('problems', 'title slug difficulty');
        if (!contest) return res.status(404).json({ message: 'Contest not found' });
        res.json(contest);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateContest = async (req, res) => {
    try {
        const contest = await Contest.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!contest) return res.status(404).json({ message: 'Contest not found' });
        res.json(contest);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteContest = async (req, res) => {
    try {
        const contest = await Contest.findByIdAndDelete(req.params.id);
        if (!contest) return res.status(404).json({ message: 'Contest not found' });
        res.json({ message: 'Contest deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.registerForContest = async (req, res) => {
    try {
        const contest = await Contest.findById(req.params.id);
        if (!contest) return res.status(404).json({ message: 'Contest not found' });
        
        if (contest.participants.includes(req.user.userId)) {
            return res.status(400).json({ message: 'Already registered' });
        }

        contest.participants.push(req.user.userId);
        await contest.save();
        res.json({ message: 'Registered successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
