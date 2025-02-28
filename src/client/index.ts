import {
  Expand,
  FunctionReference,
  GenericActionCtx,
  GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
} from "convex/server";
import { GenericId, v } from "convex/values";
import { api } from "../component/_generated/api";
import { StreamStatus } from "../component/schema";

export type StreamId = string & { __isStreamId: true };
export const StreamIdValidator = v.string();
export type StreamBody = {
  text: string;
  status: StreamStatus;
};

export type ChunkAppender = (text: string) => Promise<void>;
export type StreamWriter<A extends GenericActionCtx<GenericDataModel>> = (
  ctx: A,
  request: Request,
  streamId: StreamId,
  chunkAppender: ChunkAppender
) => Promise<void>;

// TODO -- make more flexible. # of bytes, etc?
const hasDelimeter = (text: string) => {
  return text.includes(".") || text.includes("!") || text.includes("?");
};

// TODO -- some sort of wrapper with easy ergonomics for working with LLMs?
export class PersistentTextStreaming {
  constructor(
    public component: UseApi<typeof api>,
    public options?: object
  ) {}

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

  async createStream(ctx: RunMutationCtx): Promise<StreamId> {
    const id = await ctx.runMutation(this.component.lib.createStream);
    return id as StreamId;
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
  async getStreamBody(
    ctx: RunQueryCtx,
    streamId: StreamId
  ): Promise<StreamBody> {
    const { text, status } = await ctx.runQuery(
      this.component.lib.getStreamText,
      { streamId }
    );
    return { text, status: status as StreamStatus };
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
  async stream<A extends GenericActionCtx<GenericDataModel>>(
    ctx: A,
    request: Request,
    streamId: StreamId,
    streamWriter: StreamWriter<A>
  ) {
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
    const writer = writable.getWriter();
    const textEncoder = new TextEncoder();
    let pending = "";

    const doStream = async () => {
      const chunkAppender: ChunkAppender = async (text) => {
        // write to this handler's response stream on every update
        await writer.write(textEncoder.encode(text));
        pending += text;
        // write to the database periodically, like at the end of sentences
        if (hasDelimeter(text)) {
          await this.addChunk(ctx, streamId, pending, false);
          pending = "";
        }
      };
      try {
        await streamWriter(ctx, request, streamId, chunkAppender);
      } catch (e) {
        await this.setStreamStatus(ctx, streamId, "error");
        await writer.close();
        throw e;
      }

      // Success? Flush any last updates
      await this.addChunk(ctx, streamId, pending, true);

      await writer.close();
    };

    // Kick off the streaming, but don't await it.
    void doStream();

    // Send the readable back to the browser
    return new Response(readable);
  }

  // Internal helper -- add a chunk to the stream.
  private async addChunk(
    ctx: RunMutationCtx,
    streamId: StreamId,
    text: string,
    final: boolean
  ) {
    await ctx.runMutation(this.component.lib.addChunk, {
      streamId,
      text,
      final,
    });
  }

  // Internal helper -- set the status of a stream.
  private async setStreamStatus(
    ctx: RunMutationCtx,
    streamId: StreamId,
    status: StreamStatus
  ) {
    await ctx.runMutation(this.component.lib.setStreamStatus, {
      streamId,
      status,
    });
  }
}

/* Type utils follow */

type RunQueryCtx = {
  runQuery: GenericQueryCtx<GenericDataModel>["runQuery"];
};
type RunMutationCtx = {
  runMutation: GenericMutationCtx<GenericDataModel>["runMutation"];
};

export type OpaqueIds<T> = T extends GenericId<infer _T> | string
  ? string
  : T extends (infer U)[]
    ? OpaqueIds<U>[]
    : T extends ArrayBuffer
      ? ArrayBuffer
      : T extends object
        ? { [K in keyof T]: OpaqueIds<T[K]> }
        : T;

export type UseApi<API> = Expand<{
  [mod in keyof API]: API[mod] extends FunctionReference<
    infer FType,
    "public",
    infer FArgs,
    infer FReturnType,
    infer FComponentPath
  >
    ? FunctionReference<
        FType,
        "internal",
        OpaqueIds<FArgs>,
        OpaqueIds<FReturnType>,
        FComponentPath
      >
    : UseApi<API[mod]>;
}>;
