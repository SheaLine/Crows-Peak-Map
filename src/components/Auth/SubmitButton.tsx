import React from "react";

interface SubmitButtonProps {
  onSubmit: (e: React.FormEvent) => void;
  text: string;
}

function SubmitButton({ onSubmit, text }: SubmitButtonProps) {
  return (
    <div>
      <button
        type="button"
        className="flex w-full justify-center rounded-md bg-indigo-600 px-5 py-4 text-xl font-semibold text-white shadow-lg dark:text-[#371F0E] hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-[#F0DFBD] dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500 cursor-pointer"
        onClick={onSubmit}
      >
        {text}
      </button>
    </div>
  );
}

export default SubmitButton;
