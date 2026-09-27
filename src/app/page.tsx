"use client";

import { DragEvent, FormEvent, ReactNode, useEffect, useRef, useState } from "react";

type Result = {
  driveLink?: string;
  overleafLink?: string;
  error?: string;
};

type Status = "idle" | "submitting" | "done" | "error";

const PROGRESS_STEPS = [
  "Reading your resume",
  "Extracting your details",
  "Tailoring content to the job",
  "Writing the LaTeX file",
  "Saving to Google Drive",
];

const inputClass =
  "w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500";

export default function Home() {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (status !== "submitting") return;
    const timer = setInterval(
      () => setStep((s) => Math.min(s + 1, PROGRESS_STEPS.length - 1)),
      6000
    );
    return () => clearInterval(timer);
  }, [status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStep(0);
    setStatus("submitting");
    setResult(null);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        body: formData,
      });
      const data: Result = await response.json();

      if (!response.ok || data.error) {
        setStatus("error");
        setResult(data);
        return;
      }

      setStatus("done");
      setResult(data);
    } catch (err) {
      setStatus("error");
      setResult({ error: err instanceof Error ? err.message : "Something went wrong." });
    }
  }

  function handleRegenerate() {
    formRef.current?.requestSubmit();
  }

  function handleStartOver() {
    formRef.current?.reset();
    setFileName(null);
    setStatus("idle");
    setResult(null);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (!file || file.type !== "application/pdf" || !fileInputRef.current) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    fileInputRef.current.files = transfer.files;
    setFileName(file.name);
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-gradient-to-b from-emerald-100/70 via-amber-50/40 to-transparent dark:from-emerald-950/40 dark:via-stone-950/0"
      />

      <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-5 py-14 sm:py-20">
        <header className="flex flex-col items-center gap-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-xs font-medium text-emerald-700 backdrop-blur dark:border-emerald-900 dark:bg-stone-900/70 dark:text-emerald-400">
            <SparkleIcon className="h-3.5 w-3.5" />
            AI-tailored LaTeX resumes
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl dark:text-stone-50">
            Tailor your resume
            <br />
            <span className="text-emerald-600 dark:text-emerald-400">to every job.</span>
          </h1>
          <p className="max-w-md text-balance text-stone-600 dark:text-stone-400">
            Drop in your resume and a job posting. Get back a tailored LaTeX
            resume, ready to preview and compile in Overleaf.
          </p>
        </header>

        <section className="rounded-3xl border border-stone-200/80 bg-white/80 p-6 shadow-xl shadow-stone-900/5 backdrop-blur sm:p-8 dark:border-stone-800 dark:bg-stone-900/60 dark:shadow-black/30">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className={status === "done" || status === "submitting" ? "hidden" : "flex flex-col gap-6"}
          >
            <Field label="Your resume" hint="PDF only">
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${
                  dragging
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                    : fileName
                      ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
                      : "border-stone-300 bg-stone-50/60 hover:border-emerald-400 hover:bg-emerald-50/40 dark:border-stone-700 dark:bg-stone-900/40 dark:hover:border-emerald-700"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  name="resume"
                  accept="application/pdf"
                  required
                  className="sr-only"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                />
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    fileName
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-stone-500 shadow-sm ring-1 ring-stone-200 group-hover:text-emerald-600 dark:bg-stone-800 dark:ring-stone-700"
                  }`}
                >
                  {fileName ? <CheckIcon className="h-5 w-5" /> : <UploadIcon className="h-5 w-5" />}
                </span>
                {fileName ? (
                  <>
                    <span className="max-w-full truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                      {fileName}
                    </span>
                    <span className="text-xs text-stone-500">Click to choose a different file</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
                      Drop your PDF here, or <span className="text-emerald-600 dark:text-emerald-400">browse</span>
                    </span>
                    <span className="text-xs text-stone-500">Your current resume, used as the source of facts</span>
                  </>
                )}
              </label>
            </Field>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Company">
                <input type="text" name="companyName" required placeholder="Acme Corp" className={inputClass} />
              </Field>
              <Field label="Job title">
                <input type="text" name="jobTitle" required placeholder="Software Engineer" className={inputClass} />
              </Field>
            </div>

            <Field label="Job posting URL" hint="Logged so you can apply later">
              <input type="url" name="jobUrl" required placeholder="https://" className={inputClass} />
            </Field>

            <Field label="Job description">
              <textarea
                name="jobDescription"
                required
                rows={7}
                placeholder="Paste the full job description here…"
                className={`${inputClass} resize-y leading-relaxed`}
              />
            </Field>

            {status === "error" && result?.error && (
              <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="break-words">{result.error}</p>
              </div>
            )}

            <button
              type="submit"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-stone-900/20 transition hover:bg-emerald-700 hover:shadow-emerald-700/25 active:scale-[0.99] dark:bg-emerald-500 dark:text-stone-950 dark:hover:bg-emerald-400"
            >
              <SparkleIcon className="h-4 w-4" />
              Generate tailored resume
            </button>
          </form>

          {status === "submitting" && (
            <div className="animate-fade-up flex flex-col items-center gap-8 py-6">
              <div className="relative h-14 w-14">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-100 dark:border-emerald-950" />
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-emerald-600" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">Crafting your resume</p>
                <p className="mt-1 text-sm text-stone-500">This usually takes under a minute.</p>
              </div>
              <ol className="flex w-full max-w-xs flex-col gap-3">
                {PROGRESS_STEPS.map((label, i) => (
                  <li key={label} className="flex items-center gap-3 text-sm">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition ${
                        i < step
                          ? "bg-emerald-600 text-white"
                          : i === step
                            ? "bg-emerald-100 ring-2 ring-emerald-500 dark:bg-emerald-950"
                            : "bg-stone-100 dark:bg-stone-800"
                      }`}
                    >
                      {i < step && <CheckIcon className="h-3 w-3" />}
                      {i === step && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />}
                    </span>
                    <span
                      className={
                        i <= step ? "font-medium text-stone-800 dark:text-stone-200" : "text-stone-400 dark:text-stone-600"
                      }
                    >
                      {label}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {status === "done" && result && (
            <div className="animate-fade-up flex flex-col items-center gap-6 py-4 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 dark:ring-emerald-950/40">
                <CheckIcon className="h-7 w-7" />
              </span>
              <div>
                <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-50">Your resume is ready</h2>
                <p className="mt-1.5 text-sm text-stone-500">
                  Preview and compile it in Overleaf, then apply using the link saved to your sheet.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row">
                {result.overleafLink && (
                  <a
                    href={result.overleafLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
                  >
                    <EyeIcon className="h-4 w-4" />
                    Preview in Overleaf
                  </a>
                )}
                {result.driveLink && (
                  <a
                    href={result.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-stone-300 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                  >
                    <FileIcon className="h-4 w-4" />
                    Open .tex in Drive
                  </a>
                )}
              </div>

              <div className="flex w-full flex-col items-center gap-3 border-t border-stone-200 pt-6 dark:border-stone-800">
                <p className="text-sm text-stone-500">Not happy with the result?</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleRegenerate}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                  >
                    <RefreshIcon className="h-4 w-4" />
                    Regenerate
                  </button>
                  <button
                    onClick={handleStartOver}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
                  >
                    Start over
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <footer className="text-center text-xs text-stone-400 dark:text-stone-600">
          Files are saved to your Google Drive and logged to your applications sheet.
        </footer>
      </main>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-stone-800 dark:text-stone-200">{label}</span>
        {hint && <span className="text-xs text-stone-400 dark:text-stone-500">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

type IconProps = { className?: string };

function Icon({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

const SparkleIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    <path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z" />
  </Icon>
);
const UploadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 16V4" />
    <path d="M7 9l5-5 5 5" />
    <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
  </Icon>
);
const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12l5 5L20 7" />
  </Icon>
);
const AlertIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </Icon>
);
const EyeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);
const FileIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" />
    <path d="M14 3v5h5" />
  </Icon>
);
const RefreshIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 11a8 8 0 10-2.3 5.7" />
    <path d="M20 5v6h-6" />
  </Icon>
);
