import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Search, Plus, UserRound } from "lucide-react";
import "./globals.css";
import { env } from "@/lib/env";
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});
export const metadata: Metadata = { title: { default: env.NEXT_PUBLIC_APP_NAME, template: `%s | ${env.NEXT_PUBLIC_APP_NAME}` }, description: "Buy and sell around your campus in Kenya." };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en" className={plusJakartaSans.variable}><body><header style={{background:"white",borderBottom:"1px solid var(--line)",position:"sticky",top:0,zIndex:20}}><div className="container" style={{height:70,display:"flex",alignItems:"center",gap:25}}><Link href="/" aria-label="CampusMarket KE home" className="brand-link"><Image src="/campusmarket-logo.svg" alt="CampusMarket KE — Buy, Sell, Connect" width={250} height={46} className="brand-logo" priority/></Link><form action="/marketplace" style={{flex:1,maxWidth:520,position:"relative"}}><Search size={17} color="#65715d" style={{position:"absolute",left:13,top:13}}/><input className="field" name="q" placeholder="Search laptops, textbooks, furniture..." style={{paddingLeft:40,background:"#fffdf4"}}/></form><nav style={{display:"flex",alignItems:"center",gap:16,marginLeft:"auto"}}><Link className="muted" href="/marketplace" style={{fontSize:14}}>Explore</Link><Link href="/sell" className="btn btn-primary" style={{padding:"10px 13px",fontSize:13}}><Plus size={16}/> Sell an item</Link><Link href="/login" aria-label="Sign in" style={{border:"1px solid var(--line)",borderRadius:9,padding:9,display:"grid"}}><UserRound size={18}/></Link></nav></div></header><main>{children}</main><footer style={{marginTop:90,background:"#1d5f17",color:"white",padding:"48px 0 25px"}}><div className="container" style={{display:"flex",justifyContent:"space-between",gap:30,flexWrap:"wrap"}}><div><Image src="/campusmarket-logo-light.svg" alt="CampusMarket KE — Buy, Sell, Connect" width={250} height={46} className="footer-brand-logo"/><p style={{color:"#e6efd7",fontSize:14}}>Good finds, right around campus.</p></div><div className="footer-links" style={{display:"flex",gap:22,color:"#e6efd7",fontSize:14}}><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/safety">Safety</Link><Link href="/privacy">Privacy</Link></div></div><div className="container" style={{borderTop:"1px solid #3f6b32",marginTop:30,paddingTop:20,color:"#e6efd7",fontSize:12}}>© {new Date().getFullYear()} CampusMarket KE · Prices in Kenyan Shillings</div></footer></body></html> }
