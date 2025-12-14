"use client";

import { AnalysisResultCard } from "@/features/analyze-result";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import React, { ChangeEvent, useState } from "react";

interface Props {
  className?: string;
}

const analyzeUrlRequest = async (url: string) => {
  const res = await fetch("/api/analyze/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      errorData.message || "Something went wrong during analysis"
    );
  }

  return res.json();
};

export const SearchForm: React.FC<Props> = ({ className }) => {
  const [value, setValue] = useState<string>("");

  const {
    mutate: analyze,
    data,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: analyzeUrlRequest,
  });

  const handleChangeValue = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleSend = () => {
    if (!value) return;
    analyze(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isPending) {
      handleSend();
    }
  };

  return (
    <div className={cn("flex flex-col items-start gap-3", className)}>
      <h1>Place Your URL here*</h1>
      <div className="flex gap-3">
        <Input
          className="flex-1 w-[600px] h-[60px] py-1 text-[20px] placeholder:text-lg"
          placeholder="http://...."
          value={value}
          onChange={handleChangeValue}
          onKeyDown={handleKeyDown}
          disabled={isPending}
        />
        <Button
          onClick={handleSend}
          variant={"outline"}
          disabled={isPending || !value}
          className="h-[60px] w-[180px] cursor-pointer text-xl gap-2"
        >
          {isPending ? (
            <Loader2 className="shrink-0 size-6 animate-spin" />
          ) : (
            <Search className="shrink-0 size-6" />
          )}
          {isPending ? "Scanning..." : "Scan"}
        </Button>
      </div>

      {isError && (
        <div className="text-red-500 text-sm mt-2">
          Error: {error?.message || "Failed to analyze URL"}
        </div>
      )}

      {!!data && !isPending && <AnalysisResultCard data={data} />}
    </div>
  );
};
