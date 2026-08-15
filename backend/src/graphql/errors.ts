import { GraphQLError } from "graphql";

export class BadUserInputError extends GraphQLError{
    constructor(message:string){
        super(message, {
        extensions: {
        code: "BAD_USER_INPUT",
      },
    });
    }
}

export class NotFoundError extends GraphQLError{
    constructor(message:string){
        super(message, {
            extensions:{
                code : "NOT_FOUND"
            }
        });
    }
}