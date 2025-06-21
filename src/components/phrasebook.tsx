"use client";

import { useState, useEffect } from "react";
import { Copy, Loader2, BookOpen } from "lucide-react";
import { Language, LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  generatePhrasebook,
  type GeneratePhrasebookOutput,
} from "@/ai/flows/generate-phrasebook";

export function Phrasebook() {
  const [sourceLang, setSourceLang] = useState<Language>("en");
  const [targetLang, setTargetLang] = useState<Language>("kn");
  const [phrases, setPhrases] = useState<
    GeneratePhrasebookOutput["phrasebook"]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    const fetchPhrases = async () => {
      setIsLoading(true);
      try {
        const result = await generatePhrasebook({
          sourceLanguage: languageConfig[sourceLang].name,
          targetLanguage: languageConfig[targetLang].name,
          numPhrases: 15,
        });
        setPhrases(result.phrasebook);
      } catch (e) {
        console.error(e);
        toast({
          variant: "destructive",
          title: "Error",
          description:
            "Could not generate the phrasebook. Please try again later.",
        });
        setPhrases([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhrases();
  }, [sourceLang, targetLang, toast]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: "Phrase copied to clipboard!",
    });
  };
  
  const languageConfig: Record<Language, { name: string; }> = {
    en: { name: "English" },
    kn: { name: "Kannada" },
    hi: { name: "Hindi" },
  };

  return (
    <Card className="w-full shadow-lg border-2">
      <CardContent className="p-6">
        <div className="space-y-6">
          <LanguageSwitcher
            sourceLang={sourceLang}
            setSourceLang={setSourceLang}
            targetLang={targetLang}
            setTargetLang={setTargetLang}
          />

          <div className="mt-4 min-h-[300px]">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : phrases.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {phrases.map((phrase, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger className="text-left hover:no-underline text-base">
                      {phrase.source}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex items-center justify-between p-2 bg-primary/10 rounded-md">
                        <p className="text-lg font-semibold text-primary">
                          {phrase.translation}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(phrase.translation)}
                          aria-label="Copy translation"
                        >
                          <Copy className="h-5 w-5 text-accent" />
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center p-8 border-2 border-dashed rounded-lg mt-8">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Phrases Found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  We couldn't generate a phrasebook for the selected languages.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
