import CourseModel from "../models/Course";
import InstructorModel from "../models/Instructor";
import { GraphQLContext } from "./context";
import mongoose from "mongoose";
import { BadUserInputError, NotFoundError } from "./errors";

type CourseArgs = {
  id: string;
};

type CourseParent = {
  instructorId: string;
};

const resolvers = {
  Query: {
  course: async (_parent: unknown, args: CourseArgs) => {
  console.log("COURSE RESOLVER RUNNING");
  console.log("ID:", args.id);
  console.log("VALID:", mongoose.isValidObjectId(args.id));

  if (!mongoose.isValidObjectId(args.id)) {
     throw new BadUserInputError("Invalid course ID");
  }

  const course = await CourseModel.findById(args.id);

  if (!course) {
     throw new NotFoundError ("Invalid course ID");
  }

  return course;
},
    courses: async () => {
      const courses = await CourseModel.find();

      return courses;
    },

    instructors: async () => {
      const instructors = await InstructorModel.find();

      return instructors;
    },
  },

  Course: {
    instructor: (
      parent: CourseParent,
      _args: unknown,
      context: GraphQLContext
    ) => {
      return context.instructorLoader.load(parent.instructorId);
    },
  },
};

export default resolvers;