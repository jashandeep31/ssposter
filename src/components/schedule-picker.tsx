"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";

type ScheduleValue = {
  date: string;
  time: string;
};

type Step = "date" | "hour" | "minute" | "summary";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTES = Array.from({ length: 60 }, (_, minute) => minute);

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateInput(value: Date) {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

function startOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function addMonths(value: Date, months: number) {
  return new Date(value.getFullYear(), value.getMonth() + months, 1);
}

function isSameDay(first: Date, second: Date) {
  return formatDateInput(first) === formatDateInput(second);
}

function isBeforeDay(first: Date, second: Date) {
  return startOfDay(first).getTime() < startOfDay(second).getTime();
}

function isBeforeMonth(first: Date, second: Date) {
  return (
    first.getFullYear() < second.getFullYear() ||
    (first.getFullYear() === second.getFullYear() &&
      first.getMonth() < second.getMonth())
  );
}

function getCalendarDays(month: Date) {
  const firstDay = startOfMonth(month);
  const firstVisibleDay = new Date(
    firstDay.getFullYear(),
    firstDay.getMonth(),
    1 - firstDay.getDay(),
  );

  return Array.from(
    { length: 42 },
    (_, index) =>
      new Date(
        firstVisibleDay.getFullYear(),
        firstVisibleDay.getMonth(),
        firstVisibleDay.getDate() + index,
      ),
  );
}

function getDateInputValue(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
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

function getScheduleError(value: ScheduleValue) {
  if (!value.date && !value.time) {
    return "Choose a date and time before scheduling.";
  }

  if (!value.date || !value.time) {
    return "Choose both a publish date and time.";
  }

  return getScheduledDate(value)
    ? null
    : "Choose a valid publish date and time.";
}

function formatMonth(value: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(value);
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

type SchedulePickerProps = {
  initialDate?: string;
  initialTime?: string;
};

export function SchedulePicker({
  initialDate = "",
  initialTime = "",
}: SchedulePickerProps) {
  const containerRef = useRef<HTMLElement>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [value, setValue] = useState<ScheduleValue>({
    date: initialDate,
    time: initialTime,
  });
  const [step, setStep] = useState<Step>(
    initialDate && initialTime ? "summary" : "date",
  );
  const [month, setMonth] = useState<Date | null>(() => {
    const initialSelectedDate = getDateInputValue(initialDate);
    return initialSelectedDate ? startOfMonth(initialSelectedDate) : null;
  });
  const [error, setError] = useState<string | null>(null);

  const scheduledDate = getScheduledDate(value);
  const selectedDate = getDateInputValue(value.date);
  const calendarDays = month ? getCalendarDays(month) : [];

  useEffect(() => {
    const updateNow = () => {
      const currentTime = new Date();
      setNow(currentTime);
      setMonth((currentMonth) => currentMonth ?? startOfMonth(currentTime));
    };
    updateNow();

    const interval = window.setInterval(updateNow, 60 * 1000);

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

  function selectDate(date: Date) {
    setValue({ date: formatDateInput(date), time: "" });
    setError(null);
    setStep("hour");
  }

  function selectHour(hour: number) {
    setValue((currentValue) => ({
      ...currentValue,
      time: `${pad(hour)}:00`,
    }));
    setError(null);
    setStep("minute");
  }

  function selectMinute(minute: number) {
    setValue((currentValue) => ({
      ...currentValue,
      time: `${currentValue.time.slice(0, 2)}:${pad(minute)}`,
    }));
    setError(null);
    setStep("summary");
  }

  function clearSchedule() {
    setValue({ date: "", time: "" });
    setError(null);
    setStep("date");
    setMonth(now ? startOfMonth(now) : null);
  }

  const selectedHour = value.time ? Number(value.time.slice(0, 2)) : null;
  const selectedMinute = value.time ? Number(value.time.slice(3, 5)) : null;

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
            Choose a date, then an hour and minute.
          </p>
        </div>
        <button
          type="button"
          onClick={clearSchedule}
          className="w-fit text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          Clear
        </button>
      </div>

      {now && month ? (
        <>
          <div className="mt-5 grid grid-cols-3 gap-2" aria-label="Schedule steps">
            {([
              ["date", "1. Date"],
              ["hour", "2. Hour"],
              ["minute", "3. Minute"],
            ] as const).map(([stepName, label]) => {
              const isCurrent =
                step === stepName || (step === "summary" && stepName === "minute");
              const isAvailable =
                stepName === "date" ||
                (stepName === "hour" && Boolean(value.date)) ||
                (stepName === "minute" && Boolean(value.date && value.time));

              return (
                <button
                  key={stepName}
                  type="button"
                  onClick={() => setStep(stepName)}
                  disabled={!isAvailable}
                  className={`h-9 rounded-md border text-xs font-semibold transition-colors ${
                    isCurrent
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-emerald-100 bg-white text-zinc-600 hover:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mt-3 rounded-lg border border-emerald-100 bg-white p-3 sm:p-4">
            {step === "date" ? (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    aria-label="Previous month"
                    onClick={() => setMonth((currentMonth) => currentMonth && addMonths(currentMonth, -1))}
                    disabled={isBeforeMonth(addMonths(month, -1), startOfMonth(now))}
                    className="inline-flex size-9 items-center justify-center rounded-md text-zinc-600 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                  </button>
                  <h4 className="text-sm font-semibold text-zinc-900">
                    {formatMonth(month)}
                  </h4>
                  <button
                    type="button"
                    aria-label="Next month"
                    onClick={() => setMonth((currentMonth) => currentMonth && addMonths(currentMonth, 1))}
                    className="inline-flex size-9 items-center justify-center rounded-md text-zinc-600 hover:bg-emerald-50"
                  >
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-7 text-center text-xs font-medium text-zinc-500">
                  {WEEKDAYS.map((weekday) => (
                    <span key={weekday} className="py-1">
                      {weekday}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1">
                  {calendarDays.map((date) => {
                    const isCurrentMonth = date.getMonth() === month.getMonth();
                    const isPast = isBeforeDay(date, now);
                    const isSelected = selectedDate && isSameDay(date, selectedDate);

                    return (
                      <button
                        key={formatDateInput(date)}
                        type="button"
                        aria-label={date.toLocaleDateString("en", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                        aria-pressed={Boolean(isSelected)}
                        disabled={!isCurrentMonth || isPast}
                        onClick={() => selectDate(date)}
                        className={`mx-auto inline-flex size-9 items-center justify-center rounded-full text-sm transition-colors ${
                          isSelected
                            ? "bg-emerald-600 font-semibold text-white"
                            : isCurrentMonth
                              ? "text-zinc-800 hover:bg-emerald-50"
                              : "text-zinc-300"
                        } disabled:cursor-not-allowed disabled:opacity-40`}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {step === "hour" ? (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900">Choose an hour</h4>
                    <p className="mt-1 text-sm text-zinc-600">24-hour time</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep("date")}
                    className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                  >
                    Change date
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {HOURS.map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      aria-pressed={selectedHour === hour}
                      onClick={() => selectHour(hour)}
                      className={`h-10 rounded-md border text-sm font-semibold transition-colors ${
                        selectedHour === hour
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-emerald-100 text-zinc-800 hover:border-emerald-300 hover:bg-emerald-50"
                      }`}
                    >
                      {pad(hour)}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {step === "minute" ? (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900">Choose a minute</h4>
                    <p className="mt-1 text-sm text-zinc-600">
                      {selectedHour === null ? "Choose an hour first." : `${pad(selectedHour)}:--`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep("hour")}
                    className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                  >
                    Change hour
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10">
                  {MINUTES.map((minute) => (
                    <button
                      key={minute}
                      type="button"
                      aria-pressed={selectedMinute === minute}
                      onClick={() => selectMinute(minute)}
                      className={`h-9 rounded-md border text-xs font-semibold transition-colors ${
                        selectedMinute === minute
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-emerald-100 text-zinc-800 hover:border-emerald-300 hover:bg-emerald-50"
                      }`}
                    >
                      {pad(minute)}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {step === "summary" && scheduledDate ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900">
                    Ready to schedule
                  </h4>
                  <p className="mt-1 text-base font-semibold text-emerald-800">
                    {formatPreview(scheduledDate)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("date")}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-emerald-200 px-4 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-50"
                >
                  Change
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-3 rounded-lg bg-white px-3 py-2 text-sm">
            {!scheduledDate ? (
              <p className="text-zinc-600">
                Save as draft anytime, or complete all three steps to schedule.
              </p>
            ) : null}
            {error ? (
              <p className="mt-1 text-sm font-medium text-red-700">{error}</p>
            ) : null}
          </div>
        </>
      ) : (
        <div
          className="mt-5 h-80 animate-pulse rounded-lg border border-emerald-100 bg-white"
          aria-busy="true"
          aria-label="Loading scheduler"
        />
      )}
    </section>
  );
}
