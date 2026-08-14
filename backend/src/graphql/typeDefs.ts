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

  type Query {
    courses: [Course!]!
    course(id: ID!): Course
    instructors: [Instructor!]!
  }
`;

export default typeDefs;



// main motive   ==============> ye schema hai jo bata haia  ki client api kiya kiya req kar sakta gai 

// type defs = schema ==> gql me schema ka  common name typeDefs hota hais
// type Query  ko  jab me koi data read karte hai 
// Client hello field request kar sakta hai aur iska return type String hoga.