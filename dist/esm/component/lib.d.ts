export declare const createStream: import("convex/server").RegisteredMutation<"public", {}, Promise<import("convex/values").GenericId<"streams">>>;
export declare const addChunk: import("convex/server").RegisteredMutation<"public", {
    streamId: import("convex/values").GenericId<"streams">;
    text: string;
    final: boolean;
}, Promise<void>>;
export declare const setStreamStatus: import("convex/server").RegisteredMutation<"public", {
    status: "pending" | "streaming" | "done" | "error" | "timeout";
    streamId: import("convex/values").GenericId<"streams">;
}, Promise<void>>;
export declare const getStreamStatus: import("convex/server").RegisteredQuery<"public", {
    streamId: import("convex/values").GenericId<"streams">;
}, Promise<"pending" | "streaming" | "done" | "error" | "timeout">>;
export declare const getStreamText: import("convex/server").RegisteredQuery<"public", {
    streamId: import("convex/values").GenericId<"streams">;
}, Promise<{
    text: string;
    status: "pending" | "streaming" | "done" | "error" | "timeout";
}>>;
export declare const cleanupExpiredStreams: import("convex/server").RegisteredMutation<"internal", {}, Promise<void>>;
//# sourceMappingURL=lib.d.ts.map