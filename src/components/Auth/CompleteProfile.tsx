import { useState } from "react";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useNavigate } from "react-router-dom";
import InputField from "./InputField";
import SubmitButton from "./SubmitButton";

function isPhoneNumber(phone: string) {
  const regex = /^\d{3}-\d{3}-\d{4}$/;
  return regex.test(phone);
}

export default function CompleteProfile() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      setMsg("No active session. Please click the email link again.");
      return;
    }

    if (password !== confirmPassword) {
      setMsg("Passwords do not match.");
      return;
    }

    if (isPhoneNumber(phone) === false) {
      setMsg("Phone number must be in the format xxx-xxx-xxxx");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
      data: {
        display_name: displayName,
        phone: phone,
      },
    });

    if (error) {
      setMsg("Error: " + error.message);
      return;
    }

    // Get the current user to insert into profiles table
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMsg("Error: User not found after update.");
      return;
    }

    // Insert or update the user's profile in the profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: displayName,
        phone: phone,
        role: 'user'  // Default role for new users
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Show the actual error message for debugging
      setMsg(`Profile creation failed: ${profileError.message || 'Unknown error'}. Please check RLS policies.`);
      return;
    }

    setMsg("Profile updated successfully!");
    navigate("/");
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
          Complete Your Profile
        </h2>
      </div>
      {msg && (
        <span className="mt-4 text-center text-lg text-red-600 ">{msg}</span>
      )}
      <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="space-y-8">
          <InputField
            id="displayName"
            label="Full Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
          <InputField
            id="telephone"
            label="Phone Number"
            type="telephone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            autoComplete="tel"
            placeholder="xxx-xxx-xxxx"
          />

          <InputField
            id="password"
            label="Create Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />

          <InputField
            id="confirmPassword"
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />

          <SubmitButton onSubmit={handleSave} text="Create Account" />
        </div>
      </div>
    </div>
  );
}
