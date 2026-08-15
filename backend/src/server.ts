import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import connectDB from "./config/db";
import typeDefs from "./graphql/typeDefs.js";
import resolvers from "./graphql/resolvers.js";
import { createContext } from "./graphql/context.js";

const app = express();
const PORT = 4000;

const graphqlServer = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (formattedError) => {
    
  const code = formattedError.extensions?.code;

  const knownErrors = [
    "BAD_USER_INPUT",
    "COURSE_NOT_FOUND",
  ];

  if (knownErrors.includes(code as string)) {
    return {
      message: formattedError.message,
      path: formattedError.path,
      extensions: {
        code,
      },
    };
  }

  return {
    message: "Internal server error",
    path: formattedError.path,
    extensions: {
      code: "INTERNAL_SERVER_ERROR",
    },
  };
},
});

async function startServer() {
  await connectDB();

  await graphqlServer.start();

  app.use(
    "/graphql",
    express.json(),
    expressMiddleware(graphqlServer, {
      context: createContext,
    })
  );

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`GraphQL running on http://localhost:${PORT}/graphql`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});