"use client"; 

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Se scroll maior que 50px, isScrolled vira true
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-[100] transition-all duration-300 px-[5%] py-6 flex justify-between items-center ${
      isScrolled 
        ? 'bg-sniffer-bg/95 border-b border-white/10 backdrop-blur-md' 
        : 'bg-sniffer-bg/80 backdrop-blur-[10px]'
    }`}>
      <div className="logo font-bold text-xl tracking-wider text-sniffer-main uppercase">
        Query Sniffer
      </div>

      <div className="flex items-center gap-6">
         <Link href="/sobre" className="bg-sniffer-primary hover:bg-sniffer-accent px-6 py-2 rounded-lg font-semibold text-white transition-all hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          Sobre Nós
        </Link>
        <Link href="/login" className="bg-sniffer-primary hover:bg-sniffer-accent px-6 py-2 rounded-lg font-semibold text-white transition-all hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          Login
        </Link>
      </div>
    </nav>
  );
}