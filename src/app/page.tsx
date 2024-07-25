import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-5xl font-bold text-center mb-10">
        Welcome to our AI powered Course Generator.
      </h1>

      <p className="text-lg text-gray-700 text-center">
        Create engaging and effective courses with ease.
        {/* This tool helps you
        structure, content-generate, and personalize your AI learning
        experiences. */}
      </p>

      <Link
        href="/create"
        className="mt-5 mr-3 text-lg font-bold hover:rounded"
      >
        Get Started
      </Link>
    </div>
  );

  // return <Button>Hello world!</Button>
}
