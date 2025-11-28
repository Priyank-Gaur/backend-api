const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  code: {
    type: String,
    required: true
  },
  languageId: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Compilation Error', 'Runtime Error', 'Internal Error'],
    default: 'Pending'
  },
  runtime: {
    type: Number, // in seconds or milliseconds
    default: 0
  },
  memory: {
    type: Number, // in KB
    default: 0
  },
  errorMessage: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Submission', submissionSchema);
