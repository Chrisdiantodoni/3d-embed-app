import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary: "bg-black hover:bg-zinc-800 text-sm",
            card: "shadow-xl border border-zinc-200",
          },
        }}
      />
    </div>
  );
}
