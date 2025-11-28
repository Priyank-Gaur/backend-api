const mongoose = require('mongoose');

const testcaseSchema = new mongoose.Schema({
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  input: {
    type: String,
    required: true
  },
  expectedOutput: {
    type: String,
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false // If true, can be shown as a sample
  },
  timeLimit: {
    type: Number,
    default: 2.0 // seconds
  },
  memoryLimit: {
    type: Number,
    default: 128000 // kilobytes
  }
});

module.exports = mongoose.model('Testcase', testcaseSchema);
