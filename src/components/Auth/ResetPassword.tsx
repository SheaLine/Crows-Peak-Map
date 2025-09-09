import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import InputField from "./InputField";
import SubmitButton from "./SubmitButton";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        console.log("Password recovery session:", session);
      }
    });
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMsg("Passwords do not match.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMsg(`Error: ${error.message}`);
    } else {
      setMsg("Password updated successfully! Redirecting to sign in...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
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
          Change Your Password
        </h2>
      </div>
      {msg && (
        <span className="mt-5 text-center text-lg text-red-600 ">{msg}</span>
      )}
      <div className="mt-14 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="space-y-10">
          <InputField
            id="password"
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <InputField
            id="confirmPassword"
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />

          <SubmitButton 
            onSubmit={handleSubmit}
            text="Reset Password"
          />

        </div>
      </div>
    </div>
  );
}
