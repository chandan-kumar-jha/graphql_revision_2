import CourseModel from "../models/Course";
import InstructorModel from "../models/Instructor";
import { GraphQLContext } from "./context";
import mongoose from "mongoose";
import { BadUserInputError, NotFoundError } from "./errors";

// ==================================================
// TYPES
// ==================================================

type CourseArgs = {
  id: string;
};

type CourseParent = {
  instructorId: string;
};

// Cursor pagination arguments
type CoursePaginationArgs = {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
};


// ==================================================
// CURSOR HELPERS
// ==================================================

// MongoDB ObjectId ko Base64 cursor mein convert karta hai
//
// Example:
// ObjectId("abc123")
//       ↓
// Base64
//       ↓
// "YWJjMTIz"

const encodeCursor = (id: string): string => {
  return Buffer.from(id).toString("base64");
};


// Base64 cursor ko wapas MongoDB ID mein convert karta hai

const decodeCursor = (cursor: string): string => {
  return Buffer.from(cursor, "base64").toString("utf-8");
};


// ==================================================
// RESOLVERS
// ==================================================

const resolvers = {

  // ==================================================
  // QUERY
  // ==================================================

  Query: {

    // --------------------------------------------------
    // GET SINGLE COURSE
    // --------------------------------------------------

    course: async (
      _parent: unknown,
      args: CourseArgs
    ) => {

      console.log("COURSE RESOLVER RUNNING");

      console.log("ID:", args.id);

      console.log(
        "VALID:",
        mongoose.isValidObjectId(args.id)
      );


      // Check whether provided ID is a valid
      // MongoDB ObjectId

      if (!mongoose.isValidObjectId(args.id)) {

        throw new BadUserInputError(
          "Invalid course ID"
        );
      }


      // Find course by ID

      const course = await CourseModel.findById(
        args.id
      );


      // Course not found

      if (!course) {

        throw new NotFoundError(
          "Course not found"
        );
      }


      return course;
    },


    // ==================================================
    // CURSOR BASED PAGINATION
    // ==================================================

    courses: async (
      _parent: unknown,
      args: CoursePaginationArgs
    ) => {

      const {
        first,
        after,
        last,
        before
      } = args;


      // ==================================================
      // 1. VALIDATE first AND last
      // ==================================================

      // Client ko ek time par either:
      //
      // first
      // OR
      // last
      //
      // use karna chahiye.

      if (
        first !== undefined &&
        last !== undefined
      ) {

        throw new BadUserInputError(
          "Use either first or last, not both"
        );
      }


      // first validation

      if (
        first !== undefined &&
        (first < 1 || first > 50)
      ) {

        throw new BadUserInputError(
          "first must be between 1 and 50"
        );
      }


      // last validation

      if (
        last !== undefined &&
        (last < 1 || last > 50)
      ) {

        throw new BadUserInputError(
          "last must be between 1 and 50"
        );
      }


      // ==================================================
      // 2. VALIDATE after AND before
      // ==================================================

      // Ek request mein after aur before dono
      // use nahi karenge.

      if (after && before) {

        throw new BadUserInputError(
          "Use either after or before, not both"
        );
      }


      // ==================================================
      // 3. DECODE CURSORS
      // ==================================================

      const afterId = after
        ? decodeCursor(after)
        : null;


      const beforeId = before
        ? decodeCursor(before)
        : null;


      // ==================================================
      // 4. VALIDATE CURSOR IDs
      // ==================================================

      if (
        afterId &&
        !mongoose.isValidObjectId(afterId)
      ) {

        throw new BadUserInputError(
          "Invalid after cursor"
        );
      }


      if (
        beforeId &&
        !mongoose.isValidObjectId(beforeId)
      ) {

        throw new BadUserInputError(
          "Invalid before cursor"
        );
      }


      // ==================================================
      // 5. FORWARD PAGINATION
      // ==================================================
      //
      // first + after
      //
      // Example:
      //
      // courses(
      //   first: 2
      //   after: "cursor"
      // )
      //
      // Meaning:
      //
      // "Cursor ke BAAD 2 courses do"
      //
      // ==================================================

      if (
        first !== undefined ||
        (!last && !before)
      ) {

        // Agar first nahi diya
        // to default 10

        const limit = first ?? 10;


        // MongoDB query

        let query: any = {};


        // Agar after cursor diya gaya hai
        //
        // Example:
        //
        // after = Course 2
        //
        // then:
        //
        // _id > Course 2

        if (afterId) {

          query = {
            _id: {
              $gt:
                new mongoose.Types.ObjectId(
                  afterId
                ),
            },
          };
        }


        // ==================================================
        // Fetch limit + 1
        // ==================================================

        // Example:
        //
        // first = 2
        //
        // Database se 3 courses lenge.
        //
        // Course 1
        // Course 2
        // Course 3
        //
        // Course 3 sirf ye check karne ke liye
        // ki next page available hai ya nahi.

        const courses =
          await CourseModel
            .find(query)
            .sort({ _id: 1 })
            .limit(limit + 1);


        // ==================================================
        // hasNextPage
        // ==================================================

        const hasNextPage =
          courses.length > limit;


        // Extra course remove karo

        const paginatedCourses =
          courses.slice(0, limit);


        // ==================================================
        // CREATE EDGES
        // ==================================================

        const edges =
          paginatedCourses.map(
            (course) => {

              // MongoDB _id → string

              const id =
                course._id.toString();


              // ID → cursor

              const cursor =
                encodeCursor(id);


              return {
                node: course,
                cursor,
              };
            }
          );


        // ==================================================
        // PAGE INFO
        // ==================================================

        const startCursor =
          edges.length > 0
            ? edges[0].cursor
            : null;


        const endCursor =
          edges.length > 0
            ? edges[edges.length - 1].cursor
            : null;


        // ==================================================
        // RETURN
        // ==================================================

        return {

          edges,

          pageInfo: {

            hasNextPage,

            // Agar after diya hai,
            // iska matlab previous data exist karta hai.

            hasPreviousPage:
              !!afterId,

            startCursor,

            endCursor,
          },
        };
      }


      // ==================================================
      // 6. BACKWARD PAGINATION
      // ==================================================
      //
      // last + before
      //
      // Example:
      //
      // courses(
      //   last: 2
      //   before: "cursor"
      // )
      //
      // Meaning:
      //
      // "Cursor ke PEHLE 2 courses do"
      //
      // ==================================================

      const limit = last!;


      // MongoDB query

      let query: any = {};


      // Agar before cursor diya gaya hai
      //
      // Example:
      //
      // before = Course 5
      //
      // then:
      //
      // _id < Course 5

      if (beforeId) {

        query = {
          _id: {
            $lt:
              new mongoose.Types.ObjectId(
                beforeId
              ),
          },
        };
      }


      // ==================================================
      // Fetch backward
      // ==================================================

      // Descending order mein fetch karenge.

      const courses =
        await CourseModel
          .find(query)
          .sort({ _id: -1 })
          .limit(limit + 1);


      // ==================================================
      // hasPreviousPage
      // ==================================================

      const hasPreviousPage =
        courses.length > limit;


      // Extra course remove

      const paginatedCourses =
        courses.slice(0, limit);


      // ==================================================
      // Reverse result
      // ==================================================

      // Database se descending order aaya:
      //
      // Course 4
      // Course 3
      //
      // Client ko normal order chahiye:
      //
      // Course 3
      // Course 4

      paginatedCourses.reverse();


      // ==================================================
      // CREATE EDGES
      // ==================================================

      const edges =
        paginatedCourses.map(
          (course) => {

            const id =
              course._id.toString();


            const cursor =
              encodeCursor(id);


            return {
              node: course,
              cursor,
            };
          }
        );


      // ==================================================
      // PAGE INFO
      // ==================================================

      const startCursor =
        edges.length > 0
          ? edges[0].cursor
          : null;


      const endCursor =
        edges.length > 0
          ? edges[edges.length - 1].cursor
          : null;


      // ==================================================
      // RETURN
      // ==================================================

      return {

        edges,

        pageInfo: {

          // before cursor ka matlab:
          // hum kisi later position se pehle
          // data fetch kar rahe hain.
          //
          // Simple implementation ke liye
          // before ki presence ko use kar rahe hain.

          hasNextPage:
            !!beforeId,

          hasPreviousPage,

          startCursor,

          endCursor,
        },
      };
    },


    // ==================================================
    // GET ALL INSTRUCTORS
    // ==================================================

    instructors: async () => {

      const instructors =
        await InstructorModel.find();

      return instructors;
    },
  },


  // ==================================================
  // COURSE FIELD RESOLVERS
  // ==================================================

  Course: {

    instructor: (
      parent: CourseParent,
      _args: unknown,
      context: GraphQLContext
    ) => {

      // DataLoader use kar rahe hain.
      //
      // Isse N+1 problem avoid hoti hai.

      return context.instructorLoader.load(
        parent.instructorId
      );
    },
  },
};


// ==================================================
// EXPORT
// ==================================================

export default resolvers;