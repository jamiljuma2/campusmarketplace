import Link from "next/link";
import {AuthForm} from "@/components/auth-form";

export default async function Register({searchParams}:{searchParams:Promise<{next?:string}>}) {
  const {next}=await searchParams;
  const nextPath=next?.startsWith("/")&&!next.startsWith("//")?next:"/account";
  return <div className="container" style={{paddingTop:55,maxWidth:470}}><div className="card" style={{padding:30}}><h1 style={{fontSize:28,margin:"8px 0"}}>Create your account</h1><p className="muted" style={{fontSize:14,marginBottom:24}}>Create an account to post and sell items on CampusMarket.</p><AuthForm mode="register" nextPath={nextPath}/><p style={{fontSize:13,marginTop:18}}>Already have an account? <Link href={`/login?next=${encodeURIComponent(nextPath)}`} style={{textDecoration:"underline"}}>Sign in</Link></p><p className="muted" style={{fontSize:11,lineHeight:1.5}}>By joining, you agree to use CampusMarket safely and respectfully. Never share your M-Pesa PIN or pay for an item before verifying it.</p></div></div>;
}
