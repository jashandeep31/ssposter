"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CalendarClock } from "lucide-react";

const minimumLeadMinutes = 30;

type ScheduleValue = {
  date: string;
  time: string;
};

type Preset = {
  label: string;
  description: string;
  value: Date;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateInput(value: Date) {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

function formatTimeInput(value: Date) {
  return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function startOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function atTime(value: Date, hour: number, minute = 0) {
  const next = new Date(value);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function getNextWeekday(value: Date) {
  let next = addDays(startOfDay(value), 1);

  while (next.getDay() === 0 || next.getDay() === 6) {
    next = addDays(next, 1);
  }

  return next;
}

function getNextWeekend(value: Date) {
  let next = addDays(startOfDay(value), 1);

  while (next.getDay() !== 6 && next.getDay() !== 0) {
    next = addDays(next, 1);
  }

  return next;
}

function getMinimumScheduleTime() {
  return new Date(Date.now() + minimumLeadMinutes * 60 * 1000);
}

function getScheduledDate({ date, time }: ScheduleValue) {
  if (!date || !time) {
    return null;
  }

  const value = new Date(`${date}T${time}:00`);

  if (Number.isNaN(value.getTime())) {
    return null;
  }

  return value;
}

function getPresets(now: Date): Preset[] {
  const tomorrow = addDays(startOfDay(now), 1);
  const nextWeekday = getNextWeekday(now);
  const nextWeekend = getNextWeekend(now);

  return [
    {
      label: "Tomorrow 9 AM",
      description: "Morning slot",
      value: atTime(tomorrow, 9),
    },
    {
      label: "Tomorrow noon",
      description: "Lunch break",
      value: atTime(tomorrow, 12),
    },
    {
      label: "Tomorrow 6 PM",
      description: "After work",
      value: atTime(tomorrow, 18),
    },
    {
      label: "Tomorrow 10 PM",
      description: "Late evening",
      value: atTime(tomorrow, 22),
    },
    {
      label: "Next weekday 9 AM",
      description: "Business hours",
      value: atTime(nextWeekday, 9),
    },
    {
      label: "Weekend 10 AM",
      description: "Easy weekend post",
      value: atTime(nextWeekend, 10),
    },
  ];
}

function formatPreview(value: Date) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function getScheduleError(value: ScheduleValue) {
  if (!value.date && !value.time) {
    return "Choose a date and time before scheduling.";
  }

  if (!value.date || !value.time) {
    return "Choose both a publish date and time.";
  }

  const scheduledDate = getScheduledDate(value);

  if (!scheduledDate) {
    return "Choose a valid publish date and time.";
  }

  if (scheduledDate < getMinimumScheduleTime()) {
    return "Schedule at least 30 minutes from now.";
  }

  return null;
}

type SchedulePickerProps = {
  initialDate?: string;
  initialTime?: string;
};

export function SchedulePicker({
  initialDate = "",
  initialTime = "",
}: SchedulePickerProps) {
  const containerRef = useRef<HTMLElement>(null);
  const dateInputId = useId();
  const timeInputId = useId();
  const [now, setNow] = useState(() => new Date());
  const [value, setValue] = useState<ScheduleValue>({
    date: initialDate,
    time: initialTime,
  });
  const [error, setError] = useState<string | null>(null);
  const minDate = formatDateInput(now);
  const presets = getPresets(now);
  const scheduledDate = getScheduledDate(value);
  const scheduleError = getScheduleError(value);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60 * 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    function validateSchedule(event: SubmitEvent) {
      const form = containerRef.current?.closest("form");

      if (!form || event.target !== form) {
        return;
      }

      const submitter = event.submitter as HTMLButtonElement | null;

      if (submitter?.name !== "intent" || submitter.value !== "schedule") {
        return;
      }

      const nextError = getScheduleError(value);

      if (nextError) {
        event.preventDefault();
        setError(nextError);
      }
    }

    document.addEventListener("submit", validateSchedule, true);

    return () => document.removeEventListener("submit", validateSchedule, true);
  }, [value]);

  function applyValue(nextValue: ScheduleValue) {
    setValue(nextValue);
    setError(getScheduleError(nextValue));
  }

  function applyPreset(preset: Preset) {
    applyValue({
      date: formatDateInput(preset.value),
      time: formatTimeInput(preset.value),
    });
  }

  return (
    <section
      ref={containerRef}
      className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4"
    >
      <input type="hidden" name="publishDate" value={value.date} />
      <input type="hidden" name="publishTime" value={value.time} />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
            <CalendarClock className="size-4 text-emerald-700" aria-hidden="true" />
            Schedule time
          </h3>
          <p className="mt-1 text-sm text-zinc-600">
            Pick a common time or choose your own. Scheduled posts must be at
            least 30 minutes from now.
          </p>
        </div>
        <button
          type="button"
          onClick={() => applyValue({ date: "", time: "" })}
          className="w-fit text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          Clear
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {presets.map((preset) => {
          const isSelected =
            value.date === formatDateInput(preset.value) &&
            value.time === formatTimeInput(preset.value);

          return (
            <button
              key={`${preset.label}-${preset.value.toISOString()}`}
              type="button"
              onClick={() => applyPreset(preset)}
              className={`rounded-lg border px-3 py-3 text-left text-sm transition-colors ${
                isSelected
                  ? "border-emerald-500 bg-white text-emerald-950 shadow-sm"
                  : "border-emerald-100 bg-white/70 text-zinc-800 hover:border-emerald-300 hover:bg-white"
              }`}
            >
              <span className="block font-semibold">{preset.label}</span>
              <span className="mt-1 block text-xs text-zinc-500">
                {preset.description}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={dateInputId}
            className="text-sm font-medium text-zinc-800"
          >
            Custom date
          </label>
          <input
            id={dateInputId}
            type="date"
            min={minDate}
            value={value.date}
            onChange={(event) =>
              applyValue({ ...value, date: event.currentTarget.value })
            }
            className="mt-2 h-11 w-full rounded-lg border border-emerald-100 bg-white px-3 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-3 focus:ring-emerald-600/20"
          />
        </div>
        <div>
          <label
            htmlFor={timeInputId}
            className="text-sm font-medium text-zinc-800"
          >
            Custom time
          </label>
          <input
            id={timeInputId}
            type="time"
            step={900}
            value={value.time}
            onChange={(event) =>
              applyValue({ ...value, time: event.currentTarget.value })
            }
            className="mt-2 h-11 w-full rounded-lg border border-emerald-100 bg-white px-3 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-3 focus:ring-emerald-600/20"
          />
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-white px-3 py-2 text-sm">
        {scheduledDate && !scheduleError ? (
          <p className="font-medium text-emerald-800">
            Scheduled for {formatPreview(scheduledDate)}
          </p>
        ) : (
          <p className="text-zinc-600">
            Save as draft anytime, or choose a valid future time to schedule.
          </p>
        )}
        {error ? (
          <p className="mt-1 text-sm font-medium text-red-700">{error}</p>
        ) : null}
      </div>
    </section>
  );
}
