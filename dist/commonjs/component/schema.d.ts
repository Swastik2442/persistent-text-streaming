import { Infer } from "convex/values";
export declare const streamStatusValidator: import("convex/values").VUnion<"pending" | "streaming" | "done" | "error" | "timeout", [import("convex/values").VLiteral<"pending", "required">, import("convex/values").VLiteral<"streaming", "required">, import("convex/values").VLiteral<"done", "required">, import("convex/values").VLiteral<"error", "required">, import("convex/values").VLiteral<"timeout", "required">], "required", never>;
export type StreamStatus = Infer<typeof streamStatusValidator>;
declare const _default: import("convex/server").SchemaDefinition<{
    streams: import("convex/server").TableDefinition<import("convex/values").VObject<{
        status: "pending" | "streaming" | "done" | "error" | "timeout";
    }, {
        status: import("convex/values").VUnion<"pending" | "streaming" | "done" | "error" | "timeout", [import("convex/values").VLiteral<"pending", "required">, import("convex/values").VLiteral<"streaming", "required">, import("convex/values").VLiteral<"done", "required">, import("convex/values").VLiteral<"error", "required">, import("convex/values").VLiteral<"timeout", "required">], "required", never>;
    }, "required", "status">, {
        byStatus: ["status", "_creationTime"];
    }, {}, {}>;
    chunks: import("convex/server").TableDefinition<import("convex/values").VObject<{
        streamId: import("convex/values").GenericId<"streams">;
        text: string;
    }, {
        streamId: import("convex/values").VId<import("convex/values").GenericId<"streams">, "required">;
        text: import("convex/values").VString<string, "required">;
    }, "required", "streamId" | "text">, {
        byStream: ["streamId", "_creationTime"];
    }, {}, {}>;
}, true>;
export default _default;
//# sourceMappingURL=schema.d.ts.map