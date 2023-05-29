import { ApolloServer } from '@apollo/server';
import { PrismaClient } from '@prisma/client'
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs, resolvers } from './schema/index.js';
import { readTokenUser } from './jwt/index.js';
import { MainContext } from './types/index.js';

const prisma = new PrismaClient()

const server = new ApolloServer<MainContext>({ resolvers, typeDefs });

const { url } = await startStandaloneServer(server, {
    context: async ({ req }) => {
        const token = req.headers.authorization || "";
        const user = token !== "" ? readTokenUser(token): null;
        return { auth: user};
    },
    listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);

