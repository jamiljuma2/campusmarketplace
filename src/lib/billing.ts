export type PaymentState="pending"|"successful"|"failed"|"cancelled";
export function canTransitionPayment(from:PaymentState,to:PaymentState){if(from===to)return true;return from==="pending"&&["successful","failed","cancelled"].includes(to)}
export function activeListingCountLimit(limit:number|null|undefined){return limit==null?Number.POSITIVE_INFINITY:Math.max(0,limit)}
export function isSubscriptionExpired(expiresAt:string,now=new Date()){return new Date(expiresAt).getTime()<=now.getTime()}
export function isPromotionExpired(expiresAt:string,now=new Date()){return isSubscriptionExpired(expiresAt,now)}
