import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm text-muted-foreground">404</p>
      <h1 className="mt-2 text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">That ScottyWorld route does not exist.</p>
      <Link href="/" className="mt-5 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground">Return home</Link>
    </div>
  );
}
