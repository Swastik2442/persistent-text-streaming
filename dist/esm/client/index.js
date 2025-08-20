import { v } from "convex/values";
export const StreamIdValidator = v.string();
// TODO -- make more flexible. # of bytes, etc?
const hasDelimeter = (text) => {
    return text.includes(".") || text.includes("!") || text.includes("?");
};
// TODO -- some sort of wrapper with easy ergonomics for working with LLMs?
export class PersistentTextStreaming {
    component;
    options;
    constructor(component, options) {
        this.component = component;
        this.options = options;
    }
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
    async createStream(ctx) {
        const id = await ctx.runMutation(this.component.lib.createStream);
        return id;
    }
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
    async getStreamBody(ctx, streamId) {
        const { text, status } = await ctx.runQuery(this.component.lib.getStreamText, { streamId });
        return { text, status: status };
    }
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
    async stream(ctx, request, streamId, streamWriter) {
        const streamState = await ctx.runQuery(this.component.lib.getStreamStatus, {
            streamId,
        });
        if (streamState !== "pending") {
            console.log("Stream was already started");
            return new Response("", {
                status: 205,
            });
        }
        // Create a TransformStream to handle streaming data
        const { readable, writable } = new TransformStream();
        let writer = writable.getWriter();
        const textEncoder = new TextEncoder();
        let pending = "";
        const doStream = async () => {
            const chunkAppender = async (text) => {
                // write to this handler's response stream on every update
                if (writer) {
                    try {
                        await writer.write(textEncoder.encode(text));
                    }
                    catch (e) {
                        console.error("Error writing to stream", e);
                        console.error("Will skip writing to stream but continue database updates");
                        writer = null;
                    }
                }
                pending += text;
                // write to the database periodically, like at the end of sentences
                if (hasDelimeter(text)) {
                    await this.addChunk(ctx, streamId, pending, false);
                    pending = "";
                }
            };
            try {
                await streamWriter(ctx, request, streamId, chunkAppender);
            }
            catch (e) {
                await this.setStreamStatus(ctx, streamId, "error");
                if (writer) {
                    await writer.close();
                }
                throw e;
            }
            // Success? Flush any last updates
            await this.addChunk(ctx, streamId, pending, true);
            if (writer) {
                await writer.close();
            }
        };
        // Kick off the streaming, but don't await it.
        void doStream();
        // Send the readable back to the browser
        return new Response(readable);
    }
    // Internal helper -- add a chunk to the stream.
    async addChunk(ctx, streamId, text, final) {
        await ctx.runMutation(this.component.lib.addChunk, {
            streamId,
            text,
            final,
        });
    }
    // Internal helper -- set the status of a stream.
    async setStreamStatus(ctx, streamId, status) {
        await ctx.runMutation(this.component.lib.setStreamStatus, {
            streamId,
            status,
        });
    }
}
//# sourceMappingURL=index.js.map