import { StreamBody, StreamId } from "../client";
import { FunctionReference } from "convex/server";
/**
 * React hook for persistent text streaming.
 *
 * @param getPersistentBody - A query function reference that returns the body
 * of a stream using the component's `getStreamBody` method.
 * @param streamUrl - The URL of the http action that will kick off the stream
 * generation and stream the result back to the client using the component's
 * `stream` method.
 * @param driven - Whether this particular session is driving the stream. Set this
 * to true if this is the client session that first created the stream using the
 * component's `createStream` method. If you're simply reloading an existing
 * stream, set this to false.
 * @param streamId - The ID of the stream. If this is not provided, the return
 * value will be an empty string for the stream body and the status will be
 * `pending`.
 * @returns The body and status of the stream.
 */
export declare function useStream(getPersistentBody: FunctionReference<"query", "public", {
    streamId: string;
}, StreamBody>, streamUrl: URL, driven: boolean, streamId: StreamId | undefined, opts: {
    authToken: string;
    headers?: Record<string, string>;
    args?: Record<string, string>;
}): StreamBody;
//# sourceMappingURL=index.d.ts.map