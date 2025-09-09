import { useState } from "react";
import { supabase } from "../../supabaseClient";
import InputField from "./InputField";
import SubmitButton from "./SubmitButton";
import { Navigate } from "react-router-dom";
import { useSession } from '@supabase/auth-helpers-react';

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const session = useSession();

  if (session) return <Navigate to="/" replace />;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setMsg(`Error: ${error.message}`);
    }
  };

  return (
    <>
      <div className="flex h-screen flex-col justify-center px-12 py-20 lg:px-16">
        <div className="sm:mx-auto sm:w-full sm:max-w-lg">
          <img
            alt="Your Company"
            src="/logo.png"
            className="mx-auto h-96 w-auto dark:hidden"
          />
          <img
            alt="Your Company"
            src="/logo.png"
            className="mx-auto h-96 w-auto not-dark:hidden "
          />
          <h2 className="mt-14 text-center text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
        </div>
        {msg && (
          <span className="mt-5 text-center text-lg text-red-600 ">{msg}</span>
        )}
        <div className="mt-14 sm:mx-auto sm:w-full sm:max-w-lg">
          <div className="space-y-10">
            <InputField
              id="email"
              label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <InputField
              id="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="password"
              type="password"
              extra={
                <a
                  href="/password-forgot"
                  className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-[#F0DFBD] dark:hover:text-indigo-300"
                >
                  Forgot password?
                </a>
              }
            />
            <SubmitButton onSubmit={handleSignIn} text="Sign in" />
          </div>
        </div>
      </div>
    </>
  );
}

export default Auth;
