import React from "react";
import Link from "next/link";
import SignInButton from "./SignInButton";
import { getAuthSession } from "@/lib/auth";
import UserAccountNav from "./UserAccountNav";
import { ThemeToggle } from "./ThemeToggle";

type Props = {};

const Navbar = async (props: Props) => {
  const session = await getAuthSession();
  console.log(session);
  return (
    <nav
      className="fixed inset-x-0 top-0 
     backdrop-blur  z-[10] h-fit border-b border-zinc-300 py-2"
    >
      {/* bg-white dark:bg-gray-950 */}
      <div className="flex items-center justify-center h-full gap-2 px-8 mx-auto sm:justify-between max-w-7xl">
        <Link href="/" className="items-center hidden gap-2 sm:flex">
          <p className="rounded-lg  border-black px-2 py-1 text-xl font-bold  transition-all hover:-translate-y-[2px] md:block dark:border-white">
            {/* border-b-4 border-r-4 */}
            Course Generator
          </p>
        </Link>
        <div className="flex items-center">
          <Link href="/gallery" className="mr-3">
            Gallery
          </Link>
          {session?.user && ( //if user is signed in
            <>
              <Link href="/create" className="mr-3">
                Create Course
              </Link>
              <Link href="/settings" className="mr-3">
                Settings
              </Link>
            </>
          )}
          <ThemeToggle className="mr-3" />
          <div className="flex items-center">
            {session?.user ? (
              <UserAccountNav user={session.user} />
            ) : (
              <SignInButton />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
