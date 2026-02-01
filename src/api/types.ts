import type { paths } from "@/api/generated/schema"

export type ApiPaths = paths

type KnownPaths = keyof ApiPaths & string
type AnyPath = KnownPaths extends never ? string : KnownPaths

type OperationFor<Path extends AnyPath, Method extends string> =
    Path extends keyof ApiPaths
        ? Method extends keyof ApiPaths[Path]
            ? ApiPaths[Path][Method]
            : never
        : unknown

type ResponseFor<Path extends AnyPath, Method extends string> =
    OperationFor<Path, Method> extends { responses: infer Responses }
        ? Responses
        : unknown

type ResponseCodes<Responses> =
    Responses extends Record<string | number, unknown>
        ? keyof Responses
        : string | number

type ResponseContent<Responses, Code extends ResponseCodes<Responses>> =
    Responses extends Record<string | number, unknown>
        ? Code extends keyof Responses
            ? Responses[Code] extends { content: infer Content }
                ? Content
                : unknown
            : unknown
        : unknown

type ResponseJson<Responses> =
    Responses extends Record<string | number, unknown>
        ? {
                [Code in keyof Responses]: Responses[Code] extends {
                    content: { "application/json": infer Body }
                }
                    ? Body
                    : never
            }[keyof Responses]
        : unknown

export type GetResponse<Path extends AnyPath, Code extends ResponseCodes<ResponseFor<Path, "get">>> =
    ResponseContent<ResponseFor<Path, "get">, Code>

export type PostResponse<Path extends AnyPath, Code extends ResponseCodes<ResponseFor<Path, "post">>> =
    ResponseContent<ResponseFor<Path, "post">, Code>

export type PostRequestBody<Path extends AnyPath> =
    Path extends keyof ApiPaths
        ? ApiPaths[Path] extends { post: { requestBody: { content: { "application/json": infer Body } } } }
            ? Body
            : unknown
        : unknown

export type GetResponseJson<Path extends AnyPath, Code extends ResponseCodes<ResponseFor<Path, "get">>> =
    GetResponse<Path, Code> extends { "application/json": infer Body } ? Body : unknown

export type PostResponseJson<Path extends AnyPath, Code extends ResponseCodes<ResponseFor<Path, "post">>> =
    PostResponse<Path, Code> extends { "application/json": infer Body } ? Body : unknown

export type GetResponseJsonAny<Path extends AnyPath> = ResponseJson<ResponseFor<Path, "get">>

export type PostResponseJsonAny<Path extends AnyPath> = ResponseJson<ResponseFor<Path, "post">>
