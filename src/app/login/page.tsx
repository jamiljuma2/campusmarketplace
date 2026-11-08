import Link from "next/link";
import {AuthForm} from "@/components/auth-form";

export default async function Login({searchParams}:{searchParams:Promise<{next?:string}>}) {
  const {next}=await searchParams;
  const nextPath=next?.startsWith("/")&&!next.startsWith("//")?next:"/marketplace";
  return <div className="container" style={{paddingTop:65,maxWidth:470}}><div className="card" style={{padding:30}}><h1 style={{fontSize:28,margin:"8px 0"}}>Sign in to CampusMarket</h1><p className="muted" style={{fontSize:14,marginBottom:24}}>Sign in to continue to your account.</p><AuthForm mode="login" nextPath={nextPath}/><div style={{display:"flex",justifyContent:"space-between",marginTop:18,fontSize:13}}><Link href="/account/reset" style={{textDecoration:"underline"}}>Forgot password?</Link><Link href={`/register?next=${encodeURIComponent(nextPath)}`} style={{textDecoration:"underline"}}>Create account</Link></div></div></div>;
}
