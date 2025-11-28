const Problem = require('../models/Problem');
const Testcase = require('../models/Testcase');

exports.createProblem = async (problemData) => {
    const { title, description, difficulty, tags, sampleTestCases, testcases } = problemData;
    
    const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    const problem = new Problem({
        title,
        slug,
        description,
        difficulty,
        tags,
        sampleTestCases
    });

    await problem.save();

    // Create Testcases
    if (testcases && testcases.length > 0) {
        const tcDocs = testcases.map(tc => ({
            problemId: problem._id,
            input: tc.input,
            expectedOutput: tc.output,
            isPublic: false
        }));
        const createdTestcases = await Testcase.insertMany(tcDocs);
        problem.testcases = createdTestcases.map(tc => tc._id);
        await problem.save();
    }

    return problem;
};

exports.getAllProblems = async (filters = {}) => {
    const query = {};
    
    if (filters.difficulty) {
        query.difficulty = filters.difficulty;
    }
    
    if (filters.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
    }

    const problems = await Problem.find(query, 'title slug difficulty tags');
    return problems;
};

exports.getProblemBySlug = async (slug) => {
    const problem = await Problem.findOne({ slug });
    if (!problem) {
        throw new Error('Problem not found');
    }
    return problem;
};

exports.updateProblem = async (slug, updateData) => {
    const problem = await Problem.findOneAndUpdate(
        { slug },
        updateData,
        { new: true }
    );
    
    if (!problem) {
        throw new Error('Problem not found');
    }
    
    return problem;
};

exports.deleteProblem = async (slug) => {
    const problem = await Problem.findOneAndDelete({ slug });
    
    if (!problem) {
        throw new Error('Problem not found');
    }
    
    // Delete associated testcases
    await Testcase.deleteMany({ problemId: problem._id });
    
    return { message: 'Problem deleted successfully' };
};

exports.getTestcasesByProblemId = async (problemId) => {
    return await Testcase.find({ problemId });
};
