"use client";
import React from "react";
import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { FaGithub } from "react-icons/fa";
const LoginUI = () => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleGithubLogin = async () => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider: "github",
      });
    } catch (error) {
      console.error("Error during GitHub login:", error);
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-linear-to-br from-black via-black to-zinc-900 text-white flex">
      {/* Left Section-Hero Content*/}
      <div className="flex-1 flex flex-col justify-center px-12 py-16">
        <div className="max-w-lg">
          {/*logo*/}
          <div className="mb-16">
            <div className="inline-flex items-center gap-2 text-2xl font-bold">
              <div className="w-8 h-8 bg-primary rounded-full" />
              <span>MergePilot </span>
            </div>
          </div>
          {/* Main Congtent*/}
          <h1 className="text-5xl font-bold mb-6 leading-tight text-balance">
            {" "}
            Cut Code Review Time & Bugs in Half.{" "}
            <span className="block">Instantly</span>
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed">
            Supercharge your team to ship faster with the most advanced AI code
            reviews.
          </p>
        </div>
      </div>
      {/*Right Section-Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-12 py-16">
        <div className="w-full max-w-md bg-zinc-900 rounded-lg shadow-lg p-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
            <p className="text-gray-400">
              Login using the following providers:
            </p>
          </div>
          {/*Github login button */}
          <button
            onClick={handleGithubLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300"
          >
            {isLoading ? (
              "Loading..."
            ) : (
              <>
                <FaGithub className="h-5 w-5 mr-2" />
                Login with GitHub
              </>
            )}
          </button>
          {/*Footer Links*/}
          <div className="space-y-4 text-sm text-gray-400">
            <div>
              New to MergePilot?{" "}
              <a
                href="#"
                className="  text-primary hover:text-primary-foreground font-semibold"
              >
                Sign Up
              </a>
            </div>
          </div>
          <a
            href="#"
            className="text-primary hover:text-primary-foreground font-semibold"
          >
            Self-Hosted Sevices{" "}
          </a>
        </div>
      </div>
      {/*Bottom Links*/}
      <div className="mt-12 pt-8 border-t border-gray-700 flex justify -center gap-4 text-xs text-gray-500">
        <a href="#" className="hover:text-gray-400">
          Terms of Use
        </a>
        <a href="#" className="hover:text-gray-400">
          Privacy Policy
        </a>
      </div>
    </div>
  );
};

export default LoginUI;
