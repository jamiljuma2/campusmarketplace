import {describe,expect,it} from "vitest";import {activeListingCountLimit,canTransitionPayment,isPromotionExpired,isSubscriptionExpired} from "./billing";
describe("billing rules",()=>{
 it("only permits pending payments to reach a terminal state",()=>{expect(canTransitionPayment("pending","successful")).toBe(true);expect(canTransitionPayment("pending","failed")).toBe(true);expect(canTransitionPayment("successful","failed")).toBe(false);expect(canTransitionPayment("failed","successful")).toBe(false)});
 it("returns plan limits including unlimited plans",()=>{expect(activeListingCountLimit(10)).toBe(10);expect(activeListingCountLimit(null)).toBe(Infinity)});
 it("detects subscription and promotion expiry against a supplied clock",()=>{const now=new Date("2026-11-07T00:00:00Z");expect(isSubscriptionExpired("2026-11-06T23:59:59Z",now)).toBe(true);expect(isSubscriptionExpired("2026-11-08T00:00:00Z",now)).toBe(false);expect(isPromotionExpired("2026-11-07T00:00:00Z",now)).toBe(true)});
});
