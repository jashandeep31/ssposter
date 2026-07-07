import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Image as ImageIcon,
  RefreshCcw,
  Send,
  Server,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Plan once, publish later",
    description: "Schedule posts ahead of time for X and LinkedIn.",
    icon: CalendarClock,
  },
  {
    title: "Text and images together",
    description: "Compose captions and attach images in the same flow.",
    icon: ImageIcon,
  },
  {
    title: "Queue-backed publishing",
    description:
      "Scheduled jobs run through QStash so posting is not tied to the browser session.",
    icon: Send,
  },
  {
    title: "Built for one-person workflows",
    description: "No workspace complexity, approvals, or team setup in v1.",
    icon: UserRound,
  },
];

const workflow = [
  {
    step: "01",
    title: "Connect",
    description: "Connect X and LinkedIn accounts.",
  },
  {
    step: "02",
    title: "Compose",
    description: "Write the post and attach an image.",
  },
  {
    step: "03",
    title: "Schedule",
    description: "Pick the publish time.",
  },
  {
    step: "04",
    title: "Publish",
    description: "QStash triggers the serverless publishing job.",
  },
];

const queueItems = [
  {
    label: "Draft for LinkedIn",
    status: "Scheduled",
    time: "Today, 4:30 PM",
    icon: Clock3,
  },
  {
    label: "X thread teaser",
    status: "Retry scheduled",
    time: "Retry in 12 min",
    icon: RefreshCcw,
  },
  {
    label: "Launch recap",
    status: "Published",
    time: "Yesterday",
    icon: CheckCircle2,
  },
];

const faqs = [
  {
    question: "Which platforms are supported first?",
    answer: "ssposter starts with X and LinkedIn for focused creator workflows.",
  },
  {
    question: "Can I schedule image posts?",
    answer: "Yes, v1 is planned for text and image posts.",
  },
  {
    question: "Is this for teams?",
    answer: "No, v1 is focused on single-user accounts.",
  },
  {
    question: "Is there a paid plan?",
    answer: "No, v1 is free only.",
  },
];

const navItems = [
  { label: "Features", href: "#features" },
  { label: "Workflow", href: "#workflow" },
  { label: "Platforms", href: "#platforms" },
  { label: "FAQ", href: "#faq" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <header className="sticky top-0 z-50 border-b border-emerald-100/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-3 sm:h-16 sm:px-6 lg:px-8">
          <a
            href="#"
            className="flex min-w-0 items-center gap-2"
            aria-label="ssposter home"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-semibold text-white">
              ss
            </span>
            <span className="truncate text-base font-semibold">ssposter</span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-600 md:flex">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-emerald-700">
                {item.label}
              </a>
            ))}
          </nav>
          <a
            href="#waitlist"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/30 sm:px-4"
          >
            <span className="sm:hidden">Start</span>
            <span className="hidden sm:inline">Start scheduling</span>
          </a>
        </div>
      </header>

      <section className="border-b border-emerald-100 bg-[linear-gradient(180deg,#ffffff_0%,#f0fdf4_100%)]">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-sm font-medium text-emerald-800">
              <span className="size-2 rounded-full bg-emerald-500" />
              Free v1 for solo creators
            </div>
            <h1 className="text-4xl font-semibold leading-tight text-zinc-950 sm:text-5xl lg:text-6xl">
              Schedule X and LinkedIn posts from one calm workspace.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600">
              Create text and image posts, schedule them for later, and let a
              reliable queue-backed workflow handle publishing while you stay
              focused on the next idea.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#waitlist"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-600 px-5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/30"
              >
                Start scheduling
              </a>
              <a
                href="#workflow"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-emerald-200 bg-white px-5 text-sm font-medium text-zinc-900 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-600/20"
              >
                See how it works
              </a>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="font-semibold text-zinc-950">2 platforms</dt>
                <dd className="mt-1 text-zinc-600">X and LinkedIn</dd>
              </div>
              <div>
                <dt className="font-semibold text-zinc-950">QStash</dt>
                <dd className="mt-1 text-zinc-600">Queued dispatch</dd>
              </div>
              <div>
                <dt className="font-semibold text-zinc-950">Free v1</dt>
                <dd className="mt-1 text-zinc-600">No billing setup</dd>
              </div>
            </dl>
          </div>

          <DashboardMockup />
        </div>
      </section>

      <section id="features" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-emerald-700">
              Features
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-zinc-950 sm:text-4xl">
              Everything needed for a focused posting rhythm.
            </h2>
            <p className="mt-4 text-base leading-7 text-zinc-600">
              ssposter keeps the first version practical: compose, attach,
              schedule, and publish without adding team workflow overhead.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-lg border border-emerald-100 bg-white p-5 shadow-sm shadow-emerald-950/5"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <feature.icon className="size-5" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-zinc-950">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="workflow"
        className="scroll-mt-24 border-y border-emerald-100 bg-emerald-50/60 px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase text-emerald-700">
                Workflow
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-zinc-950 sm:text-4xl">
                From idea to scheduled post in four steps.
              </h2>
              <p className="mt-4 text-base leading-7 text-zinc-600">
                The flow is designed for one person moving quickly: connect
                accounts, compose once, pick a time, and let the serverless job
                handle the handoff.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {workflow.map((item) => (
                <article
                  key={item.step}
                  className="rounded-lg border border-emerald-100 bg-white p-5"
                >
                  <span className="text-sm font-semibold text-emerald-700">
                    {item.step}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-zinc-950">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="platforms" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-emerald-700">
              Platforms
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-zinc-950 sm:text-4xl">
              Focused support for X and LinkedIn first.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <article className="rounded-lg border border-emerald-100 bg-white p-6 shadow-sm shadow-emerald-950/5">
              <div className="flex size-12 items-center justify-center rounded-lg bg-zinc-950 text-lg font-semibold text-white">
                X
              </div>
              <h3 className="mt-5 text-xl font-semibold text-zinc-950">X</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                Schedule quick updates, launch notes, and thread teasers for
                your X audience.
              </p>
            </article>
            <article className="rounded-lg border border-emerald-100 bg-white p-6 shadow-sm shadow-emerald-950/5">
              <div className="flex size-12 items-center justify-center rounded-lg bg-[#0a66c2] text-white">
                <span className="text-lg font-semibold">in</span>
              </div>
              <h3 className="mt-5 text-xl font-semibold text-zinc-950">
                LinkedIn
              </h3>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                Plan thoughtful updates and image-backed posts for a professional
                audience.
              </p>
            </article>
          </div>
          <p className="mt-6 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
            More platforms can come later, but v1 stays focused on X and
            LinkedIn.
          </p>
        </div>
      </section>

      <section className="border-y border-emerald-100 bg-zinc-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-700">
              Reliable scheduling
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-zinc-950 sm:text-4xl">
              Publishing that keeps working after you close the tab.
            </h2>
            <p className="mt-4 text-base leading-7 text-zinc-600">
              ssposter is planned around Vercel serverless handlers, QStash
              scheduled dispatch, Postgres-backed records, and automatic retry
              tracking for failed publishes.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "Vercel serverless runtime",
              "Upstash QStash dispatch",
              "Postgres-backed records",
              "Automatic retry tracking",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-white p-4 text-sm font-medium text-zinc-800"
              >
                <Server className="size-5 text-emerald-700" aria-hidden="true" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="waitlist" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-lg border border-emerald-100 bg-emerald-600 p-6 text-white shadow-lg shadow-emerald-950/10 sm:p-8">
          <h2 className="text-3xl font-semibold">Start scheduling with ssposter.</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-emerald-50">
            Join the early list for a focused X and LinkedIn scheduler built for
            solo creators.
          </p>
          <form action="#" className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="sr-only" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              className="h-11 rounded-lg border border-white/40 bg-white px-4 text-sm text-zinc-950 outline-none placeholder:text-zinc-500 focus-visible:ring-3 focus-visible:ring-white/40"
            />
            <Button
              type="submit"
              size="lg"
              className="h-11 bg-zinc-950 px-5 text-white hover:bg-zinc-800"
            >
              Start scheduling
            </Button>
          </form>
          <p className="mt-3 text-sm text-emerald-50">
            Free during v1. No billing setup required.
          </p>
        </div>
      </section>

      <section
        id="faq"
        className="scroll-mt-24 border-t border-emerald-100 bg-zinc-50 px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase text-emerald-700">FAQ</p>
          <h2 className="mt-3 text-3xl font-semibold text-zinc-950">
            Questions before you schedule.
          </h2>
          <div className="mt-8 grid gap-3">
            {faqs.map((faq) => (
              <article
                key={faq.question}
                className="rounded-lg border border-emerald-100 bg-white p-5"
              >
                <h3 className="text-base font-semibold text-zinc-950">
                  {faq.question}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {faq.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-emerald-100 bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-base font-semibold text-zinc-950">ssposter</p>
            <p className="mt-2 text-sm text-zinc-600">
              A focused scheduler for X and LinkedIn posts.
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Built for Vercel, QStash, Postgres, and Drizzle.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-zinc-600">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-emerald-700">
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </main>
  );
}

function DashboardMockup() {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-emerald-200 bg-white p-3 shadow-2xl shadow-emerald-950/10">
      <div className="rounded-lg border border-emerald-100 bg-zinc-50">
        <div className="flex items-center justify-between border-b border-emerald-100 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-zinc-950">Composer</p>
            <p className="text-xs text-zinc-500">Next scheduled post</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
            Queued by QStash
          </span>
        </div>
        <div className="grid gap-3 p-3 sm:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-lg border border-emerald-100 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-950">
                  Draft for LinkedIn
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Image attached
                </p>
              </div>
              <div className="flex gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-zinc-950 text-xs font-semibold text-white">
                  X
                </span>
                <span className="flex size-8 items-center justify-center rounded-lg bg-[#0a66c2] text-white">
                  <span className="text-xs font-semibold">in</span>
                </span>
              </div>
            </div>
            <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm leading-6 text-zinc-700">
                Launch notes are easier to write when the week is already
                mapped. Here is the update, the image, and the publish time.
              </p>
              <div className="mt-4 flex h-28 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-sm font-medium text-emerald-800">
                Image attached
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              {["Mon", "Tue", "Wed"].map((day, index) => (
                <div
                  key={day}
                  className="rounded-lg border border-emerald-100 bg-white p-2"
                >
                  <p className="font-medium text-zinc-900">{day}</p>
                  <p className="mt-1 text-zinc-500">
                    {index === 1 ? "4:30 PM" : "Open"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-lg border border-emerald-100 bg-white p-4">
              <p className="text-sm font-semibold text-zinc-950">
                Scheduled time
              </p>
              <p className="mt-2 text-2xl font-semibold text-emerald-700">
                4:30 PM
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Today for X and LinkedIn
              </p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-white p-4">
              <p className="text-sm font-semibold text-zinc-950">
                Queue status
              </p>
              <div className="mt-4 grid gap-3">
                {queueItems.map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <item.icon className="size-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-950">
                        {item.label}
                      </p>
                      <p className="text-xs text-zinc-500">{item.time}</p>
                    </div>
                    <span className="rounded-full border border-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
