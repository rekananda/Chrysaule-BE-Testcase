export interface MainContext {
    auth?: UserType | null;
}

export interface UserType {
    id: number;
    email: string;
    role: RoleType;
    error?: string;
}

export interface LoginParam {
    email: string;
    password: string;
}

export type RoleType = "ADMIN"|"USER";