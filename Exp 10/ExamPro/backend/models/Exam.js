const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
    trim: true,
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (options) =>
        Array.isArray(options) &&
        options.length >= 2 &&
        options.every(
          (option) =>
            typeof option === "string" &&
            option.trim().length > 0
        ),
      message: "Each question needs at least two valid options.",
    },
  },
  correctOption: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function (value) {
        return (
          Array.isArray(this.options) &&
          value < this.options.length
        );
      },
      message: "The correct option index is invalid.",
    },
  },
  explanation: {
    type: String,
    default: "",
    trim: true,
  },
  topic: {
    type: String,
    default: "General",
    trim: true,
  },
  marks: {
    type: Number,
    default: 1,
    min: 0.5,
  },
});

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 300,
    },
    questions: {
      type: [questionSchema],
      required: true,
      validate: {
        validator: (questions) =>
          Array.isArray(questions) && questions.length > 0,
        message: "An exam must contain at least one question.",
      },
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exam", examSchema);