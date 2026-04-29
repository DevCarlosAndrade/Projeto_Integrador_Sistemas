"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/src/lib/firebase";
import { useRouter } from "next/navigation";

export default function AuthGuard({
 children
}:{
 children: React.ReactNode
}) {

 const router = useRouter();

 const [checking,setChecking] =
 useState(true);

 useEffect(() => {

   const unsub =
    onAuthStateChanged(
      auth,
      (user)=>{

        if(!user){
          router.replace("/login");
          return;
        }

        setChecking(false);
      }
    );

   return ()=>unsub();

 },[router]);

 if(checking){
   return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
      Verificando autenticação...
    </div>
   );
 }

 return <>{children}</>;
}