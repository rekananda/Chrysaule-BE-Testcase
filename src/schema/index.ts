import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const typeDefs = `
    type User {
        id: ID!
        email: String!
        role: UserRole!
    }

    enum UserRole {
        USER
        ADMIN
    }

    type Category {
        id: ID!
        name: String!
        products: [Product!]!
    }

    type Product {
        id: ID!
        name: String!
        categories: [Category!]!
    }

    input LoginInput {
        email: String!
        password: String!
    }

    input RegisterInput {
        email: String!
        password: String!
    }

    type AuthPayload {
        token: String!
        user: User!
    }

    type Query {
        allUsers: [User!]!
        categories: [Category!]!
        products: [Product!]!
    }

    type Mutation {
        login(input: LoginInput!): AuthPayload!
        register(input: RegisterInput!): AuthPayload!
        createCategory(name: String!): Category!
        updateCategory(id: ID!, name: String!): Category!
        deleteCategory(id: ID!): Category!
        createProduct(name: String!, categoryIds: [ID!]!): Product!
        updateProduct(id: ID!, name: String!, categoryIds: [ID!]!): Product!
        deleteProduct(id: ID!): Product!
    }
`;

export const resolvers = {
    Query: {
        allUsers: () => {
            return prisma.user.findMany();
        }
    }

};