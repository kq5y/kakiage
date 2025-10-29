import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";

import { getLoginLink } from "@/libs/api";
import { createPageTitle } from "@/utils/meta";

type LoginSearchParams = {
  error?: string;
};

export const Route = createFileRoute("/login")({
  component: LoginPage,
  beforeLoad: async ({ context }) => {
    await context.auth.ensureLoaded();

    const user = context.auth.getUser();
    if (user) {
      throw redirect({ to: "/" });
    }

    return {};
  },
  validateSearch: (search: Record<string, unknown>): LoginSearchParams => {
    return {
      error: (search.error as string) || undefined,
    };
  },
  head: () => ({
    meta: [{ title: createPageTitle("Login") }],
  }),
});

function DiscordButton({ text, ...params }: { text: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      className="w-full text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center space-x-3 bg-[#5865F2] hover:bg-[#4a54c9] disabled:bg-[#a0a8e8] transition-colors duration-300 border-none cursor-pointer disabled:cursor-not-allowed"
      {...params}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        viewBox="0 0 16 16"
        className="fill-white w-[24px] h-[24px]"
      >
        <title>discord icon</title>
        <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612" />
      </svg>
      <span>{text}</span>
    </button>
  );
}

function LoginPage() {
  const { error } = Route.useSearch();
  const [inviteToken, setInviteToken] = useState("");
  const handleChangeInviteToken = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInviteToken(e.target.value);
  };
  return (
    <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden px-2 my-8">
      <div className="bg-gray-50 py-3 px-4 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-center">kakiage</h1>
      </div>
      <div className="px-6 pb-4 space-y-2">
        {error && (
          <div
            className="bg-red-100 border-0 border-l-4 border-red-500 border-solid text-red-700 px-4 py-1 rounded-md"
            role="alert"
          >
            <p>
              <b>Error: </b>
              {decodeURIComponent(error)}
            </p>
          </div>
        )}
        <section>
          <h2 className="text-xl font-semibold text-center text-gray-700 mb-5">Login</h2>
          <form action={getLoginLink()} method="POST">
            <DiscordButton text="Login with Discord" />
          </form>
        </section>
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-0 border-t border-gray-300 border-solid"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-2 text-sm text-gray-500">or</span>
          </div>
        </div>
        <section>
          <h2 className="text-xl font-semibold text-center text-gray-700 mb-5">Register</h2>
          <form action={getLoginLink()} method="POST" className="space-y-4">
            <input
              type="text"
              name="inviteToken"
              required
              placeholder="Invite Token"
              className="w-full px-4 py-3 box-border border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:border-transparent mt-1"
              value={inviteToken}
              onChange={handleChangeInviteToken}
            />
            <DiscordButton text="Register with Discord" disabled={!inviteToken} />
          </form>
        </section>
      </div>
    </div>
  );
}
