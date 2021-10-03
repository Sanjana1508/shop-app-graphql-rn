const { ApolloServer, AuthenticationError } = require("apollo-server");
const { sequelize, User } = require("./models");
const fs = require("fs");
const path = require("path");
var jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("./config/env.json");

const resolvers = require("./resolvers");

const server = new ApolloServer({
  typeDefs: fs.readFileSync(path.join(__dirname, "schema.graphql"), "utf8"),
  resolvers,
  context: (ctx) => {
    return ctx;
  },
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);

  sequelize
    .authenticate()
    .then(() => console.log("Database connected"))
    .catch((err) => console.log(err));
});
