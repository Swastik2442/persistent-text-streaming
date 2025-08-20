import { Expand, FunctionReference, GenericActionCtx, GenericDataModel, GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { GenericId } from "convex/values";
import { api } from "../component/_generated/api";
import { StreamStatus } from "../component/schema";
export type StreamId = string & {
    __isStreamId: true;
};
export declare const StreamIdValidator: import("convex/values").VString<string, "required">;
export type StreamBody = {
    text: string;
    status: StreamStatus;
};
export type ChunkAppender = (text: string) => Promise<void>;
export type StreamWriter<A extends GenericActionCtx<GenericDataModel>> = (ctx: A, request: Request, streamId: StreamId, chunkAppender: ChunkAppender) => Promise<void>;
export declare class PersistentTextStreaming {
    component: UseApi<typeof api>;
    options?: object | undefined;
    constructor(component: UseApi<typeof api>, options?: object | undefined);
    /**
     * Create a new stream. This will return a stream ID that can be used
     * in an HTTP action to stream data back out to the client while also
     * permanently persisting the final stream in the database.
     *
     * @param ctx - A convex context capable of running mutations.
     * @returns The ID of the new stream.
     * @example
     * ```ts
     * const streaming = new PersistentTextStreaming(api);
     * const streamId = await streaming.createStream(ctx);
     * await streaming.stream(ctx, request, streamId, async (ctx, req, id, append) => {
     *   await append("Hello ");
     *   await append("World!");
     * });
     * ```
     */
    createStream(ctx: RunMutationCtx): Promise<StreamId>;
    /**
     * Get the body of a stream. This will return the full text of the stream
     * and the status of the stream.
     *
     * @param ctx - A convex context capable of running queries.
     * @param streamId - The ID of the stream to get the body of.
     * @returns The body of the stream and the status of the stream.
     * @example
     * ```ts
     * const streaming = new PersistentTextStreaming(api);
     * const { text, status } = await streaming.getStreamBody(ctx, streamId);
     * ```
     */
    getStreamBody(ctx: RunQueryCtx, streamId: StreamId): Promise<StreamBody>;
    /**
     * Inside an HTTP action, this will stream data back to the client while
     * also persisting the final stream in the database.
     *
     * @param ctx - A convex context capable of running actions.
     * @param request - The HTTP request object.
     * @param streamId - The ID of the stream.
     * @param streamWriter - A function that generates chunks and writes them
     * to the stream with the given `StreamWriter`.
     * @returns A promise that resolves to an HTTP response. You may need to adjust
     * the headers of this response for CORS, etc.
     * @example
     * ```ts
     * const streaming = new PersistentTextStreaming(api);
     * const streamId = await streaming.createStream(ctx);
     * const response = await streaming.stream(ctx, request, streamId, async (ctx, req, id, append) => {
     *   await append("Hello ");
     *   await append("World!");
     * });
     * ```
     */
    stream<A extends GenericActionCtx<GenericDataModel>>(ctx: A, request: Request, streamId: StreamId, streamWriter: StreamWriter<A>): Promise<Response>;
    private addChunk;
    private setStreamStatus;
}
type RunQueryCtx = {
    runQuery: GenericQueryCtx<GenericDataModel>["runQuery"];
};
type RunMutationCtx = {
    runMutation: GenericMutationCtx<GenericDataModel>["runMutation"];
};
export type OpaqueIds<T> = T extends GenericId<infer _T> | string ? string : T extends (infer U)[] ? OpaqueIds<U>[] : T extends ArrayBuffer ? ArrayBuffer : T extends object ? {
    [K in keyof T]: OpaqueIds<T[K]>;
} : T;
export type UseApi<API> = Expand<{
    [mod in keyof API]: API[mod] extends FunctionReference<infer FType, "public", infer FArgs, infer FReturnType, infer FComponentPath> ? FunctionReference<FType, "internal", OpaqueIds<FArgs>, OpaqueIds<FReturnType>, FComponentPath> : UseApi<API[mod]>;
}>;
export {};
//# sourceMappingURL=index.d.ts.map