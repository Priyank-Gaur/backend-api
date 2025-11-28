const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const Testcase = require('../models/Testcase');
const judgeService = require('./judge.service');

exports.createSubmission = async ({ userId, problemId, code, languageId }) => {
    // Validate Problem
    const problem = await Problem.findById(problemId);
    if (!problem) {
        throw new Error('Problem not found');
    }

    // Create Pending Submission
    const submission = new Submission({
        userId,
        problemId,
        code,
        languageId,
        status: 'Pending'
    });
    
    await submission.save();
    return submission;
};

exports.processSubmission = async (submissionId) => {
    const submission = await Submission.findById(submissionId);
    
    if (!submission) {
        throw new Error('Submission not found');
    }

    // Fetch Test Cases
    const testcases = await Testcase.find({ problemId: submission.problemId });
    
    if (testcases.length === 0) {
        submission.status = 'Internal Error';
        submission.errorMessage = 'No test cases found for this problem';
        await submission.save();
        throw new Error('No test cases found');
    }

    // Prepare Judge0 submissions
    const judgeSubmissions = testcases.map(tc => ({
        source_code: submission.code,
        language_id: submission.languageId,
        stdin: tc.input,
        expected_output: tc.expectedOutput,
        cpu_time_limit: tc.timeLimit,
        memory_limit: tc.memoryLimit
    }));

    // Execute on Judge0
    const results = await judgeService.executeBatch(judgeSubmissions);

    // Analyze Results
    let finalStatus = 'Accepted';
    let maxRuntime = 0;
    let maxMemory = 0;
    let firstError = null;

    for (const result of results) {
        // Status ID 3 is Accepted
        if (result.status.id !== 3) {
            finalStatus = result.status.description;
            firstError = result.stderr || result.compile_output || result.message;
            break;
        }
        if (result.time > maxRuntime) maxRuntime = result.time;
        if (result.memory > maxMemory) maxMemory = result.memory;
    }

    // Update Submission
    submission.status = finalStatus;
    submission.runtime = maxRuntime;
    submission.memory = maxMemory;
    submission.errorMessage = firstError;
    await submission.save();

    return submission;
};

exports.getUserSubmissions = async (userId, filters = {}) => {
    const query = { userId };
    
    if (filters.problemId) {
        query.problemId = filters.problemId;
    }
    
    if (filters.status) {
        query.status = filters.status;
    }

    const submissions = await Submission.find(query)
        .populate('problemId', 'title slug')
        .sort({ createdAt: -1 });
    
    return submissions;
};

exports.getSubmissionById = async (submissionId) => {
    const submission = await Submission.findById(submissionId)
        .populate('problemId', 'title slug')
        .populate('userId', 'username');
    
    if (!submission) {
        throw new Error('Submission not found');
    }
    
    return submission;
};

exports.getUserStats = async (userId) => {
    const submissions = await Submission.find({ userId });
    
    const stats = {
        totalSubmissions: submissions.length,
        acceptedSubmissions: submissions.filter(s => s.status === 'Accepted').length,
        problemsSolved: new Set(
            submissions
                .filter(s => s.status === 'Accepted')
                .map(s => s.problemId.toString())
        ).size
    };
    
    return stats;
};
