import { AnalysisResultCard } from "@/features/analyze-result";
import { SearchForm } from "@/features/search-form.tsx/ui/search-form";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-6 py-32 px-16 bg-white dark:bg-black ">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <SearchForm />
        </div>
      </main>
    </div>
  );
}
