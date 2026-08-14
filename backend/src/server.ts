import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import connectDB from "./config/db";
import typeDefs from "./graphql/typeDefs.js";
import resolvers from "./graphql/resolvers.js";

const app = express();
const PORT = 4000;

const graphqlServer = new ApolloServer({
  typeDefs,
  resolvers,
});

async function startServer() {
  // 🔑 DB connect ab yahan andar hai, isliye .catch() isko bhi pakdega
  await connectDB();

  await graphqlServer.start();

  app.use(
    "/graphql",
    express.json(),
    expressMiddleware(graphqlServer)
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