import mongoose, { Document, Schema } from "mongoose";

export interface IInstructor extends Document {
  name: string;
  email: string;
}

const instructorSchema = new Schema<IInstructor>({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
  },
});

const Instructor = mongoose.model<IInstructor>(
  "Instructor",
  instructorSchema
);

export default Instructor;