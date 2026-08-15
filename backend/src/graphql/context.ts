import createInstructorLoader from "./loaders/instructorLoader";

export const createContext = async () => {
  return {
    instructorLoader: createInstructorLoader(),
  };
};

export type GraphQLContext = Awaited<
  ReturnType<typeof createContext>
>;