const { Product } = require("./models");
const { User } = require("./models");
const bcrypt = require("bcryptjs");
const { UserInputError, AuthenticationError } = require("apollo-server");
var jwt = require("jsonwebtoken");
const { JWT_SECRET, EXPIRY } = require("./config/env.json");

const usernameEmpty = "Username must not be empty";
const passwordEmpty = "Password must not be empty";
const passwordIncorrect = "Password is incorrect";
const userNotFound = "User not found";
const Unauthenticated = "Unauthenticated";
const badInput = "Bad input";

module.exports = {
  Query: {
    getProducts: async (_, args) => {
      try {
        if (args.offset !== null && args.limit !== null) {
          const prods = await Product.findAll({
            offset: args.offset,
            limit: args.limit,
          });
          return prods;
        }
        const products = await Product.findAll();

        return products;
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
    getProduct: async (_, { id }) => {
      try {
        const product = await Product.findOne({ where: { id } });
        console.log(product);
        return product;
      } catch (err) {
        console.log(err);
      }
    },
    getUsers: async (_, __, context) => {
      try {
        let user;
        if (context.req && context.req.headers.authorization) {
          const token = context.req.headers.authorization.split("Bearer ")[1];
          jwt.verify(token, JWT_SECRET, (err, decodedToken) => {
            if (err) {
              throw new AuthenticationError(Unauthenticated);
            }
            user = decodedToken;
          });
        }
        const users = await User.findAll();
        return users;
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
    login: async (_, { username, password }) => {
      let errors = {};
      try {
        if (username.trim() === "") errors.username = usernameEmpty;
        if (password === "") errors.password = passwordEmpty;
        if (Object.keys(errors).length > 0) {
          throw new UserInputError(badInput, { errors });
        }
        const user = await User.findOne({ where: { username } });
        if (!user) {
          errors.username = userNotFound;
        }

        const isCorrectPassword = await bcrypt.compare(password, user.password);
        if (!isCorrectPassword) {
          errors.password = passwordIncorrect;
          throw new UserInputError(passwordIncorrect, { errors });
        }
        const token = jwt.sign(
          {
            username,
          },
          JWT_SECRET,
          { expiresIn: EXPIRY }
        );
        return {
          ...user.toJSON(),
          createdAt: user.createdAt.toISOString(),
          token,
          expiry: 3600,
        };
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
    getUserProducts: async (_, { ownerId }, context) => {
      try {
        let user;
        // if (context.req && context.req.headers.authorization) {
        //   const token = context.req.headers.authorization.split("Bearer ")[1];
        //   console.log(Object.keys(token));
        //   console.log(Object.values(token));
        //   jwt.verify(token, JWT_SECRET, (err, decodedToken) => {
        //     if (err) {
        //       throw new AuthenticationError(Unauthenticated);
        //     }
        //     user = decodedToken;
        //   });
        // }
        const products = await Product.findAll({
          where: { ownerId },
        });
        return products;
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
  },
  Mutation: {
    createProduct: async (
      parent,
      { ownerId, title, imageUrl, description, price }
    ) => {
      try {
        let user;
        // if (context.req && context.req.headers.authorization) {
        //   const token = context.req.headers.authorization.split("Bearer ")[1];
        //   jwt.verify(token, JWT_SECRET, (err, decodedToken) => {
        //     if (err) {
        //       throw new AuthenticationError(Unauthenticated);
        //     }
        //     user = decodedToken;
        //   });
        // }
        const product = await Product.create({
          ownerId,
          title,
          imageUrl,
          description,
          price,
        });
        return product;
      } catch (err) {
        console.log(err);
      }
    },

    updateProduct: async (
      parent,
      { id, ownerId, title, imageUrl, description, price }
    ) => {
      try {
        let user;
        // if (context.req && context.req.headers.authorization) {
        //   const token = context.req.headers.authorization.split("Bearer ")[1];
        //   jwt.verify(token, JWT_SECRET, (err, decodedToken) => {
        //     if (err) {
        //       throw new AuthenticationError(Unauthenticated);
        //     }
        //     user = decodedToken;
        //   });
        // }
        const product = await Product.update(
          { ownerId, title, imageUrl, description, price },
          {
            where: {
              id: id,
            },
          }
        );
      } catch (err) {
        console.log(err);
      }
    },

    deleteProduct: async (parent, { id }) => {
      try {
        let user;
        // if (context.req && context.req.headers.authorization) {
        //   const token = context.req.headers.authorization.split("Bearer ")[1];
        //   jwt.verify(token, JWT_SECRET, (err, decodedToken) => {
        //     if (err) {
        //       throw new AuthenticationError(Unauthenticated);
        //     }
        //     user = decodedToken;
        //   });
        // }
        const product = await Product.destroy({
          where: {
            id: id,
          },
        });
      } catch (err) {
        console.log(err);
      }
    },
    register: async (_, { username, password }) => {
      let errors = {};
      try {
        // if (email.trim() === "") errors.email = "Email must not be empty";
        if (username.trim() === "") errors.username = usernameEmpty;
        if (password.trim() === "") errors.password = passwordEmpty;

        const userByUsername = await User.findOne({ where: { username } });

        // if (userByUsername) errors.username = "Username already exists";
        // if (userByEmail) errors.email = "Email already exists";

        if (Object.keys(errors).length > 0) {
          throw errors;
        }

        password = await bcrypt.hash(password, 6);
        const user = await User.create({ username, password });
        return user;
      } catch (err) {
        console.log(err);
        if (err.name === "SequelizeUniqueConstraintError") {
          err.errors.forEach(
            (e) => (errors[e.path] = `${e.value} is already taken`)
          );
        } else if (err.name === "SequelizeValidationError") {
          err.errors.forEach((e) => (errors[e.path] = e.message));
        }
        throw new UserInputError(badInput, { errors });
      }
    },
  },
};
