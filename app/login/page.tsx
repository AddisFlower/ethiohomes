import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string | string[] }>;
}) {
  const { mode } = await searchParams;
  const isSignup = Array.isArray(mode) ? mode[0] === "signup" : mode === "signup";

  return <LoginForm initialMode={isSignup ? "signup" : "login"} />;
}
