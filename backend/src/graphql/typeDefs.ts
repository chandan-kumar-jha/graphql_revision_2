const typeDefs = `#graphql
type Instructor {
  id: ID!
  name: String!
  email: String!
}

type Course {
  id: ID!
  title: String!
  description: String!
  instructor: Instructor
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type CourseEdge {
  node: Course!
  cursor: String!
}

type CourseConnection {
  edges: [CourseEdge!]!
  pageInfo: PageInfo!
}

type Query {
  courses(
    first: Int
    after: String
    last: Int
    before: String
  ): CourseConnection!

  course(id: ID!): Course

  instructors: [Instructor!]!
}
`;

export default typeDefs;