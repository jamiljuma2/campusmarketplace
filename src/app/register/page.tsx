import Link from "next/link";
import {AuthForm} from "@/components/auth-form";

export default async function Register({searchParams}:{searchParams:Promise<{next?:string}>}) {
  const {next}=await searchParams;
  const nextPath=next?.startsWith("/")&&!next.startsWith("//")?next:"/marketplace";
  return <div className="container" style={{paddingTop:55,maxWidth:470}}><div className="card" style={{padding:30}}><h1 style={{fontSize:28,margin:"8px 0"}}>Create your account</h1><p className="muted" style={{fontSize:14,marginBottom:24}}>Choose how you plan to use CampusMarket. You can start selling later even if you join as a buyer.</p><AuthForm mode="register" nextPath={nextPath}/><p style={{fontSize:13,marginTop:18}}>Already have an account? <Link href={`/login?next=${encodeURIComponent(nextPath)}`} style={{textDecoration:"underline"}}>Sign in</Link></p><p className="muted" style={{fontSize:11,lineHeight:1.5}}>By joining, you agree to use CampusMarket safely and respectfully. Never share your M-Pesa PIN or pay for an item before verifying it.</p></div></div>;
}
