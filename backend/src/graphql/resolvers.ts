import CourseModel from "../models/Course";
import InstructorModel from "../models/Instructor";

type CourseArgs = {
  id: string;
};

type CourseParent = {
  instructorId: string;
};

const resolvers = {
  Query: {
    course: async (_parent: unknown, args: CourseArgs) => {
      const course = await CourseModel.findById(args.id);

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
    instructor: async (parent: CourseParent) => {
      console.log(
        "Fetching instructor:",
        parent.instructorId.toString()
      );

      const instructor = await InstructorModel.findById(
        parent.instructorId
      );

      return instructor;
    },
  },
};

export default resolvers;