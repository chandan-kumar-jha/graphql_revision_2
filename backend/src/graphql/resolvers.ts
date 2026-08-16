import CourseModel from "../models/Course";
import InstructorModel from "../models/Instructor";
import { GraphQLContext } from "./context";
import mongoose from "mongoose";
import {
  BadUserInputError,
  NotFoundError,
} from "./errors";

// ==================================================
// TYPES
// ==================================================

type CourseArgs = {
  id: string;
};

type CourseParent = {
  instructorId: string;
};

// ==================================================
// FILTER
// ==================================================

type CourseFilter = {
  title?: string;
  instructorId?: string;
};

// ==================================================
// SORT
// ==================================================

type CourseSortBy = "TITLE" | "ID";

type SortOrder = "ASC" | "DESC";

// ==================================================
// PAGINATION ARGUMENTS
// ==================================================

type CoursePaginationArgs = {
  search?: string;

  filter?: CourseFilter;

  sortBy?: CourseSortBy;
  sortOrder?: SortOrder;

  first?: number;
  after?: string;

  last?: number;
  before?: string;
};

// ==================================================
// CURSOR HELPERS
// ==================================================

const encodeCursor = (id: string): string => {
  return Buffer.from(id).toString("base64");
};

const decodeCursor = (cursor: string): string => {
  return Buffer.from(cursor).toString("utf-8");
};

// ==================================================
// RESOLVERS
// ==================================================

const resolvers = {

  // ==================================================
  // QUERY
  // ==================================================

  Query: {

    // ==================================================
    // SINGLE COURSE
    // ==================================================

    course: async (
      _parent: unknown,
      args: CourseArgs
    ) => {

      if (!mongoose.isValidObjectId(args.id)) {
        throw new BadUserInputError(
          "Invalid course ID"
        );
      }

      const course =
        await CourseModel.findById(args.id);

      if (!course) {
        throw new NotFoundError(
          "Course not found"
        );
      }

      return course;
    },

    // ==================================================
    // COURSES
    // ==================================================

    courses: async (
      _parent: unknown,
      args: CoursePaginationArgs
    ) => {

      const {
        search,
        filter,

        sortBy = "ID",
        sortOrder = "ASC",

        first,
        after,

        last,
        before,
      } = args;

      // ==================================================
      // VALIDATE PAGINATION
      // ==================================================

      if (
        first !== undefined &&
        last !== undefined
      ) {
        throw new BadUserInputError(
          "Use either first or last, not both"
        );
      }

      if (
        first !== undefined &&
        (first < 1 || first > 50)
      ) {
        throw new BadUserInputError(
          "first must be between 1 and 50"
        );
      }

      if (
        last !== undefined &&
        (last < 1 || last > 50)
      ) {
        throw new BadUserInputError(
          "last must be between 1 and 50"
        );
      }

      if (after && before) {
        throw new BadUserInputError(
          "Use either after or before, not both"
        );
      }

      // ==================================================
      // DECODE CURSORS
      // ==================================================

      const afterId = after
        ? decodeCursor(after)
        : null;

      const beforeId = before
        ? decodeCursor(before)
        : null;

      // ==================================================
      // VALIDATE CURSORS
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
      // FORWARD PAGINATION
      // ==================================================

      if (
        first !== undefined ||
        (!last && !before)
      ) {

        const limit = first ?? 10;

        const query: any = {};

        // ==================================================
        // SEARCH
        // ==================================================

        if (search) {

          query.$or = [
            {
              title: {
                $regex: search,
                $options: "i",
              },
            },
            {
              description: {
                $regex: search,
                $options: "i",
              },
            },
          ];
        }

        // ==================================================
        // FILTER
        // ==================================================

        if (filter?.title) {

          query.title = {
            $regex: filter.title,
            $options: "i",
          };
        }

        if (filter?.instructorId) {

          if (
            !mongoose.isValidObjectId(
              filter.instructorId
            )
          ) {
            throw new BadUserInputError(
              "Invalid instructorId"
            );
          }

          query.instructorId =
            filter.instructorId;
        }

        // ==================================================
        // CURSOR
        // ==================================================

        if (afterId) {

          query._id = {
            $gt:
              new mongoose.Types.ObjectId(
                afterId
              ),
          };
        }

        // ==================================================
        // SORT
        // ==================================================

        const sortDirection =
          sortOrder === "ASC" ? 1 : -1;

        const sortField =
          sortBy === "TITLE"
            ? "title"
            : "_id";

        // ==================================================
        // DATABASE
        // ==================================================

        const courses =
          await CourseModel
            .find(query)
            .sort({
              [sortField]: sortDirection,
            })
            .limit(limit + 1);

        // ==================================================
        // PAGE INFO
        // ==================================================

        const hasNextPage =
          courses.length > limit;

        const paginatedCourses =
          courses.slice(0, limit);

        // ==================================================
        // EDGES
        // ==================================================

        const edges =
          paginatedCourses.map(
            (course) => {

              const id =
                course._id.toString();

              return {
                node: course,
                cursor: encodeCursor(id),
              };
            }
          );

        // ==================================================
        // CURSORS
        // ==================================================

        const startCursor =
          edges.length
            ? edges[0].cursor
            : null;

        const endCursor =
          edges.length
            ? edges[edges.length - 1].cursor
            : null;

        // ==================================================
        // RETURN
        // ==================================================

        return {

          edges,

          pageInfo: {

            hasNextPage,

            hasPreviousPage:
              !!afterId,

            startCursor,

            endCursor,
          },
        };
      }

      // ==================================================
      // BACKWARD PAGINATION
      // ==================================================

      const limit = last!;

      const query: any = {};

      // ==================================================
      // SEARCH
      // ==================================================

      if (search) {

        query.$or = [
          {
            title: {
              $regex: search,
              $options: "i",
            },
          },
          {
            description: {
              $regex: search,
              $options: "i",
            },
          },
        ];
      }

      // ==================================================
      // FILTER
      // ==================================================

      if (filter?.title) {

        query.title = {
          $regex: filter.title,
          $options: "i",
        };
      }

      if (filter?.instructorId) {

        if (
          !mongoose.isValidObjectId(
            filter.instructorId
          )
        ) {
          throw new BadUserInputError(
            "Invalid instructorId"
          );
        }

        query.instructorId =
          filter.instructorId;
      }

      // ==================================================
      // BEFORE CURSOR
      // ==================================================

      if (beforeId) {

        query._id = {
          $lt:
            new mongoose.Types.ObjectId(
              beforeId
            ),
        };
      }

      // ==================================================
      // SORT
      // ==================================================

      const sortDirection =
        sortOrder === "ASC" ? -1 : 1;

      const sortField =
        sortBy === "TITLE"
          ? "title"
          : "_id";

      // ==================================================
      // DATABASE
      // ==================================================

      const courses =
        await CourseModel
          .find(query)
          .sort({
            [sortField]: sortDirection,
          })
          .limit(limit + 1);

      // ==================================================
      // PAGE INFO
      // ==================================================

      const hasPreviousPage =
        courses.length > limit;

      const paginatedCourses =
        courses.slice(0, limit);

      // ==================================================
      // RESTORE NORMAL ORDER
      // ==================================================

      paginatedCourses.reverse();

      // ==================================================
      // EDGES
      // ==================================================

      const edges =
        paginatedCourses.map(
          (course) => {

            const id =
              course._id.toString();

            return {
              node: course,
              cursor: encodeCursor(id),
            };
          }
        );

      // ==================================================
      // CURSORS
      // ==================================================

      const startCursor =
        edges.length
          ? edges[0].cursor
          : null;

      const endCursor =
        edges.length
          ? edges[edges.length - 1].cursor
          : null;

      // ==================================================
      // RETURN
      // ==================================================

      return {

        edges,

        pageInfo: {

          hasNextPage:
            !!beforeId,

          hasPreviousPage,

          startCursor,

          endCursor,
        },
      };
    },

    // ==================================================
    // INSTRUCTORS
    // ==================================================

    instructors: async () => {

      return InstructorModel.find();
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

      return context.instructorLoader.load(
        parent.instructorId
      );
    },
  },
};

export default resolvers;