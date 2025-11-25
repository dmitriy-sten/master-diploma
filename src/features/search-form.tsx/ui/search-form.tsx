"use client";

import { AnalysisResultCard } from "@/features/analyze-result";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";
import { Search } from "lucide-react";
import React, { ChangeEvent, useState } from "react";

interface Props {
  className?: string;
}

export const SearchForm: React.FC<Props> = ({ className }) => {
  const [value, setValue] = useState<string>("");
  const [data, setData] = useState(undefined);

  const handleChangeValue = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleSend = async () => {
    if (!value) return;
    try {
      const res = await fetch("/api/analyze/", {
        method: "POST",
        body: JSON.stringify({ url: value }),
      });

      const data = await res.json();
      setData(data);
    } catch (e: any) {
      setData(undefined);
      throw new Error(e);
    }
  };

  return (
    <div className={cn("flex  flex-col  items-start gap-3", className)}>
      <h1>Place Your URL here*</h1>
      <div className="flex gap-3">
        <Input
          className="flex-1 w-[600px] h-[60px] py-1 text-[40px] placeholder:text-lg "
          placeholder="http://...."
          value={value}
          onChange={handleChangeValue}
        />
        <Button
          onClick={handleSend}
          variant={"outline"}
          className="h-[60px] w-[180px] cursor-pointer text-xl"
        >
          <Search className="shrink-0 size-6" />
          Scan
        </Button>

      </div>
        {!!data && <AnalysisResultCard data={data} />}
    </div>
  );
};
