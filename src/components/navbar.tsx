'use client';
import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="fixed left-0 top-0 z-50 w-full bg-[#0f0f0f] px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Image
          src="/images/green.png"
          alt="Stasis"
          className="h-12 w-12"
          width={48}
          height={48}
        />
        <div className="flex gap-4">
          <a href="/login" className="text-white/80 hover:text-white">
            Login
          </a>
          <a href="/sign-up" className="text-white/80 hover:text-white">
            Sign Up
          </a>
        </div>
      </div>
    </nav>
  );
}
