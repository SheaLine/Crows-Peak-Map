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
    <div className="flex h-screen flex-col justify-center px-8 py-16 lg:px-12">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <img
            alt="Your Company"
            src="/logo.png"
            className="mx-auto h-50 w-auto dark:hidden"
          />
          <img
            alt="Your Company"
            src="/logo.png"
            className="mx-auto h-50 w-auto not-dark:hidden "
          />
          <h2 className="mt-12 text-center text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Forgot Password
          </h2>
        </div>
      {msg && (
        <span className="mt-4 text-center text-lg text-red-600 ">{msg}</span>
      )}
      <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="space-y-8">

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
