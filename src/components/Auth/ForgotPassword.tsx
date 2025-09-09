import { useState } from "react";
import { supabase } from  "../../supabaseClient";
import InputField from "./InputField";
import SubmitButton from "./SubmitButton";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/password-reset`,
    });

    if (error) {
      setMsg(`Error: ${error.message}`);
    } else {
      setMsg("Password reset link sent! Check your email.");
    }
  };

  return (
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
          Forgot Password
        </h2>
      </div>
      {msg && (
        <span className="mt-5 text-center text-lg text-red-600 ">{msg}</span>
      )}
      <div className="mt-14 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="space-y-10">

          <InputField 
            id="email"
            label="Account Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <SubmitButton 
            onSubmit={handleSubmit}
            text="Send Reset Link"
          />
          
        </div>
      </div>
    </div>
  );
}
