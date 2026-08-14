import mongoose, { Document, Schema } from "mongoose";

export interface ICourse extends Document {
  title: string;
  description: string;
  instructorId: mongoose.Types.ObjectId;
}

const courseSchema = new Schema<ICourse>({
  title: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  instructorId: {
    type: Schema.Types.ObjectId,
    ref: "Instructor",
    required: true,
  },
});

const Course = mongoose.model<ICourse>(
  "Course",
  courseSchema
);

export default Course;