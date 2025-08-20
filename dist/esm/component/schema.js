import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
export const streamStatusValidator = v.union(v.literal("pending"), v.literal("streaming"), v.literal("done"), v.literal("error"), v.literal("timeout"));
export default defineSchema({
    streams: defineTable({
        status: streamStatusValidator,
    }).index("byStatus", ["status"]),
    chunks: defineTable({
        streamId: v.id("streams"),
        text: v.string(),
    }).index("byStream", ["streamId"]),
});
//# sourceMappingURL=schema.js.map