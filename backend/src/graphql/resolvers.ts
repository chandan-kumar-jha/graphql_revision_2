// IMPORTS SECTION: Database Models aur DataLoader import ho rahe hain
// -------------------------------------------------------------
import CourseModel from "../models/Course";
import InstructorModel from "../models/Instructor";
import instructorLoader from "./loaders/instructorLoader";


// TYPESCRIPT TYPES: Resolvers ke arguments aur parent objects ke formats/types define kar rahe hain
// -------------------------------------------------------------

// TypeScript type defining: 'course' query ko input mein milne wale 'args' ka structure/type kya hoga (ek string 'id')
type CourseArgs = {
  id: string;
};

// TypeScript type defining: Jab `Course` object ke andar ki nested fields (jaise instructor) resolve hongi, 
// tab parent `Course` object ke paas `instructorId` hona zaroori hai
type CourseParent = {
  instructorId: string;
};


// RESOLVERS SECTION: GraphQL Schema ki queries aur fields ka actual logic yahan hai
// -------------------------------------------------------------
const resolvers = {
  // `Query` object ke andar root queries aati hain jinhe client front-end se call karta hai
  Query: {
    // Single course ko uski ID ke zariye fetch karne ka resolver function
    course: async (_parent: unknown, args: CourseArgs) => {
      // Database mein Mongoose ka `findById` use karke args.id se match hota course dhoondh rahe hain (Async operation)
      const course = await CourseModel.findById(args.id);

      // Found course ka data client ko return kar rahe hain (agar nahi mila to null return hoga)
      return course;
    },

    // Database mein available saare courses ki list fetch karne ka resolver
    courses: async () => {
      // Mongoose ka `find()` method bina kisi filter ke chala rahe hain taaki saare courses mil jayein
      const courses = await CourseModel.find();

      // Database se aaye saare courses ka array client ko return kar rahe hain
      return courses;
    },

    // Database se saare instructors ki list fetch karne ka resolver
    instructors: async () => {
      // Mongoose ka `find()` method use karke saare instructor documents fetch kar rahe hain
      const instructors = await InstructorModel.find();

      // Saare instructors ki list return kar rahe hain
      return instructors;
    },
  },

  // -------------------------------------------------------------
  // FIELD RESOLVERS: Relational / Nested fields ko handle karne ke liye
  // -------------------------------------------------------------

  // Schema ke `Course` type ke andar ki individual fields ko kaise populate/resolve karna hai
  Course: {
    // Course ke andar wale 'instructor' field ka resolver (Jab client kisi Course ke sath uska Instructor mangta hai)
    instructor: (parent: CourseParent) => {
      // Direct Database call karne ke bajaye, DataLoader (`instructorLoader.load`) ka use kar rahe hain
      // Ye parent course se `instructorId` leta hai aur background mein saari ID requests ko ek saath batch karke single DB query chalata hai
      return instructorLoader.load(parent.instructorId);
    },
  },
};

// Is resolver object ko export kar rahe hain taaki Apollo Server (ya koi bhi GraphQL server) ise use kar sake
export default resolvers;