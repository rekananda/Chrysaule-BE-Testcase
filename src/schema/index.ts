import { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';

import { setTokenUser } from '../jwt/index.js';
import { MainContext, LoginParam, RoleType, UserType } from '../types/index.js';

const prisma = new PrismaClient();

type paramID = {
    id: string|number;
}
type paramUpdate = {
    id: string|number;
    name: string;
}
type paramUpdateProduct = {
    id: string|number;
    name: string;
    categoryIds: (string|number)[];
}
type paramCreateProduct = {
    name: string;
    categoryIds:( string|number)[];
}

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

    type AuthReturn {
        token: String
        user: User
        message: String!
    }
    
    type CategoryReturn {
        data: Category
        message: String!
    }
    
    type ProductReturn {
        data: Product
        message: String!
    }

    type Query {
        allUsers: [User!]
        listCategories: [Category!]
        getFullCategories: [Category!]
        category(id: ID!): Category
        listProducts: [Category!]
        getFullProducts: [Product!]
        product(id: ID!): Product
    }

    type Mutation {
        login(email: String!, password: String!): AuthReturn!
        registerUser(email: String!, password: String!): AuthReturn!
        createCategory(name: String!): CategoryReturn!
        updateCategory(id: ID!, name: String!): CategoryReturn!
        deleteCategory(id: ID!): String!
        createProduct(name: String!, categoryIds: [ID!]): ProductReturn!
        updateProduct(id: ID!, name: String!, categoryIds: [ID!]!): ProductReturn!
        deleteProduct(id: ID!): String!
    }
`;

export const resolvers = {
    Query: {
        allUsers: (_, __, contextValue: MainContext) => {
            isRoleValid(contextValue.auth, "ADMIN")
            return prisma.user.findMany();
        },
        listCategories: () => {
            return prisma.category.findMany();
        },
        getFullCategories: () => {
            return prisma.category.findMany({
                include : {
                    products: true,
                }
            });
        },
        category: (_, args:paramID) => {
            return prisma.category.findFirst({
                where: { id: Number(args.id) },
                include : {
                    products: true,
                }
            });
        },
        listProducts: () => {
            return prisma.product.findMany();
        },
        getFullProducts: () => {
            return prisma.product.findMany({
                include : {
                    categories: true,
                    _count: true,
                }
            });
        },
        product: (_, args:paramID) => {
            return prisma.product.findFirst({
                where: { id: Number(args.id) },
                include : {
                    categories: true,
                }
            });
        },
    },
    Mutation: {
        login: async (_, args:LoginParam) => {
            const user =  await prisma.user.findFirst({
                where: { email: args.email, password: args.password}
            });
            
            return ({
                user,
                token: user ? setTokenUser({id: user.id, email: user.email, role: user.role}) : null,
                message: user ? "Success" : "User Not Found"
            })
        },
        registerUser: async (_, args:LoginParam) => {
            const user = await prisma.user.create({
                data: {
                    email: args.email,
                    password: args.password,
                    role: "USER",
                },
            });
            
            return ({
                user,
                token: null,
                message: user ? "User created" : "Failed creating user"
            })
        },
        createCategory: async (_, args:{name: string}, contextValue: MainContext) => {
            isRoleValid(contextValue.auth, "ADMIN")
            const category = await prisma.category.create({
                data: args,
            });
            
            return ({
                data: category,
                message: category ? "Category created" : "Failed creating category"
            })
        },
        createProduct: async (_, args:paramCreateProduct, contextValue: MainContext) => {
            isRoleValid(contextValue.auth, "ADMIN")
            let addRelation = [];
            if (args.categoryIds.length > 0) {
                args.categoryIds.forEach((categoryId) => {
                    addRelation.push({
                        id: Number(categoryId)
                    });
                })
            }
            const product = await prisma.product.create({
                data: {
                    name: args.name,
                    categories: {
                        connect: addRelation
                    }
                },
                include: {
                    categories: true,
                }
            });
            
            if (product){
                return {
                    data: product,
                    message: "Product created"
                }
            }
            
            return {
                data: product,
                message: product ? "Product created" : "Failed creating product"
            }
        },
        updateCategory: async (_, args:paramUpdate, contextValue: MainContext) => {
            isRoleValid(contextValue.auth, "ADMIN")
            const category = await prisma.category.update({
                data: {name: args.name},
                where: {id: Number(args.id)}
            });
            
            return ({
                data: category,
                message: category ? "Category created" : "Failed creating category"
            })
        },
        updateProduct: async (_, args:paramUpdateProduct, contextValue: MainContext) => {
            isRoleValid(contextValue.auth, "ADMIN")
            let addRelation = [];
            if (args.categoryIds.length > 0) {
                args.categoryIds.forEach((categoryId) => {
                    addRelation.push({
                        id: Number(categoryId)
                    });
                })
            }
            const category = await prisma.product.update({
                where: {id: Number(args.id)},
                data: {
                    name: args.name,
                    categories: {
                        set: [],
                        connect: addRelation
                    }
                },
                include: {
                    categories: true,
                }
            });
            
            return ({
                data: category,
                message: category ? "Category created" : "Failed creating category"
            })
        },
        deleteCategory: async (_, args:paramID, contextValue: MainContext) => {
            isRoleValid(contextValue.auth, "ADMIN")
            const deletedData = await prisma.category.delete({
                where: { id: Number(args.id) },
            });
            return deletedData ? "Category deleted" : "Failed deleting category" ;
        },
        deleteProduct: async (_, args:paramID, contextValue: MainContext) => {
            isRoleValid(contextValue.auth, "ADMIN")
            const deletedData = await prisma.product.delete({
                where: { id: Number(args.id) },
            });
            return deletedData ? "Product deleted" : "Failed deleting product" ;
        }
    }
};

function isRoleValid(auth: UserType, validRole: RoleType): void {
    if (auth.error) {
        throw new GraphQLError(auth.error, {
            extensions: {
                code: 'UNAUTHENTICATED',
                http: { status: 401 },
            },
        });
    }
    if (auth.role !== validRole) {
        throw new GraphQLError('User is not authenticated', {
            extensions: {
                code: 'UNAUTHENTICATED',
                http: { status: 401 },
            },
        });
    }
}