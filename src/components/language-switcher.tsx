"use client";

import * as React from "react";
import { ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnglishIcon, HindiIcon, KannadaIcon } from "@/components/language-icons";
import { cn } from "@/lib/utils";

export type Language = "en" | "kn" | "hi";

const languageConfig: Record<Language, { name: string; Icon: React.FC<React.SVGProps<SVGSVGElement>> }> = {
  en: { name: "English", Icon: EnglishIcon },
  kn: { name: "Kannada", Icon: KannadaIcon },
  hi: { name: "Hindi", Icon: HindiIcon },
};

interface LanguageSwitcherProps {
  sourceLang: Language;
  targetLang: Language;
  setSourceLang: (lang: Language) => void;
  setTargetLang: (lang: Language) => void;
}

export function LanguageSwitcher({ sourceLang, targetLang, setSourceLang, setTargetLang }: LanguageSwitcherProps) {
  const [isSwapping, setIsSwapping] = React.useState(false);
  
  const handleSwap = () => {
    if (isSwapping) return;
    setIsSwapping(true);
    // Swap languages after a short delay to allow animation to start
    setTimeout(() => {
        setSourceLang(targetLang);
        setTargetLang(sourceLang);
    }, 150)
    setTimeout(() => setIsSwapping(false), 300);
  };

  const handleSourceChange = (value: string) => {
    if (value === targetLang) {
      handleSwap();
    } else {
      setSourceLang(value as Language);
    }
  };

  const handleTargetChange = (value: string) => {
    if (value === sourceLang) {
      handleSwap();
    } else {
      setTargetLang(value as Language);
    }
  };

  const LanguageSelect = ({ value, onChange }: { value: Language; onChange: (value: string) => void;}) => {
    const { Icon, name } = languageConfig[value];
    return (
      <Select onValueChange={onChange} value={value}>
        <SelectTrigger className="w-full text-base h-16 bg-card border-2 shadow-sm">
          <SelectValue>
            <div className="flex items-center gap-3">
              <Icon className="w-8 h-8 text-primary" />
              <span className="font-semibold">{name}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(languageConfig).map(([langCode, { name, Icon }]) => (
            <SelectItem key={langCode} value={langCode}>
              <div className="flex items-center gap-3">
                <Icon className="w-6 h-6 text-primary" />
                <span>{name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <div className="flex items-center gap-2 md:gap-4 w-full">
      <div className={cn("flex-1 transition-all duration-300 ease-in-out", isSwapping && "translate-x-[115%] scale-90 opacity-0")}>
        <LanguageSelect value={sourceLang} onChange={handleSourceChange} />
      </div>
      <Button variant="ghost" size="icon" className="shrink-0 rounded-full" onClick={handleSwap} aria-label="Swap languages">
        <ArrowRightLeft className={cn("w-6 h-6 text-accent transition-transform duration-300", isSwapping && "rotate-180")} />
      </Button>
      <div className={cn("flex-1 transition-all duration-300 ease-in-out", isSwapping && "-translate-x-[115%] scale-90 opacity-0")}>
        <LanguageSelect value={targetLang} onChange={handleTargetChange} />
      </div>
    </div>
  );
}
