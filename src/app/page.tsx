import Image from "next/image";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-muted font-sans">
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-between bg-background px-8 py-32 sm:items-start sm:px-16">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl leading-10 font-semibold tracking-tight text-foreground">
            Next.js with shadcn/ui is ready.
          </h1>
          <p className="max-w-md text-lg leading-8 text-muted-foreground">
            This project now has the shadcn/ui registry config, theme tokens,
            utility helper, and a starter Button component.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <Button size="lg">
            Primary Button
          </Button>
          <Button variant="outline" size="lg">
            Outline Button
          </Button>
        </div>
      </main>
    </div>
  );
}
