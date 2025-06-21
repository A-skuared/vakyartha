"use client";

import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from 'uuid';
import { Copy, Loader2, Volume2, Info, Trash2, CaseSensitive as TranslateIcon } from "lucide-react";
import { Language, LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { translateText, type TranslateTextOutput } from "@/ai/flows/text-translation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type RecentTranslation = {
    id: string;
    sourceText: string;
    translatedText: string;
    sourceLang: Language;
    targetLang: Language;
    date: string;
}

export function TextTranslator() {
  const [sourceLang, setSourceLang] = useState<Language>("en");
  const [targetLang, setTargetLang] = useState<Language>("kn");
  const [sourceText, setSourceText] = useState("");
  const [result, setResult] = useState<TranslateTextOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentTranslations, setRecentTranslations] = useState<RecentTranslation[]>([]);

  const { toast } = useToast();
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
        const storedTranslations = localStorage.getItem("recentTranslations");
        if (storedTranslations) {
            setRecentTranslations(JSON.parse(storedTranslations));
        }
    } catch (error) {
        console.error("Failed to parse recent translations from localStorage", error);
        localStorage.removeItem("recentTranslations");
    }
  }, []);

  useEffect(() => {
    if (result?.translatedAudioUri) {
        audioPlayerRef.current = new Audio(result.translatedAudioUri);
    }
  }, [result]);

  const languageConfig: Record<Language, { name: string; }> = {
    en: { name: "English" },
    kn: { name: "Kannada" },
    hi: { name: "Hindi" },
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setIsLoading(true);
    setResult(null);
    try {
      const translationResult = await translateText({
        sourceText,
        sourceLanguage: languageConfig[sourceLang].name,
        targetLanguage: languageConfig[targetLang].name,
        targetLanguageCode: targetLang,
      });
      setResult(translationResult);

      const newTranslation: RecentTranslation = {
        id: uuidv4(),
        sourceText,
        translatedText: translationResult.translatedText,
        sourceLang,
        targetLang,
        date: new Date().toISOString(),
      };
      
      const updatedTranslations = [newTranslation, ...recentTranslations].slice(0, 10);
      setRecentTranslations(updatedTranslations);
      localStorage.setItem("recentTranslations", JSON.stringify(updatedTranslations));

    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not translate the text. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: "Copied to clipboard!",
    });
  };

  const playTranslatedAudio = () => {
    audioPlayerRef.current?.play();
  };

  const clearHistory = () => {
    setRecentTranslations([]);
    localStorage.removeItem("recentTranslations");
    toast({ description: "Translation history cleared." });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="w-full shadow-lg border-2 lg:col-span-2">
            <CardContent className="p-6">
                <div className="space-y-6">
                    <LanguageSwitcher
                        sourceLang={sourceLang}
                        setSourceLang={setSourceLang}
                        targetLang={targetLang}
                        setTargetLang={setTargetLang}
                    />
                    <Textarea
                        placeholder={`Enter text in ${languageConfig[sourceLang].name}...`}
                        value={sourceText}
                        onChange={(e) => setSourceText(e.target.value)}
                        className="min-h-[150px] text-lg"
                        disabled={isLoading}
                    />
                    <Button onClick={handleTranslate} disabled={isLoading || !sourceText.trim()} className="w-full h-12 text-lg">
                        {isLoading ? <Loader2 className="animate-spin" /> : <TranslateIcon className="mr-2 h-5 w-5" />}
                        Translate
                    </Button>

                    {result && (
                        <Card className="bg-primary/5">
                            <CardContent className="p-4 space-y-4">
                                <div>
                                    <Badge>Translation</Badge>
                                    <div className="flex items-center justify-between gap-4 mt-2">
                                        <p className="text-2xl font-bold text-primary">{result.translatedText}</p>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleCopy(result.translatedText)} aria-label="Copy translation">
                                                <Copy className="h-5 w-5 text-accent" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={playTranslatedAudio} aria-label="Play translated audio">
                                                <Volume2 className="h-6 w-6 text-accent" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertTitle>Contextual Meaning</AlertTitle>
                                    <AlertDescription>
                                        {result.contextualMeaning}
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </CardContent>
        </Card>

        <Card className="w-full shadow-lg border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">Recent</CardTitle>
                {recentTranslations.length > 0 && (
                    <Button variant="ghost" size="icon" onClick={clearHistory} aria-label="Clear history">
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {recentTranslations.length > 0 ? (
                    <ScrollArea className="h-[400px]">
                        <div className="space-y-4">
                            {recentTranslations.map((item) => (
                                <div key={item.id} className="p-3 rounded-md border bg-card hover:bg-muted/50 cursor-pointer" onClick={() => {
                                    setSourceText(item.sourceText);
                                    setSourceLang(item.sourceLang);
                                    setTargetLang(item.targetLang);
                                    setResult(null);
                                }}>
                                    <p className="font-semibold text-sm truncate">{item.sourceText}</p>
                                    <p className="text-primary font-bold text-sm truncate">{item.translatedText}</p>
                                    <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                                        <span>{languageConfig[item.sourceLang].name} → {languageConfig[item.targetLang].name}</span>
                                        <span>{new Date(item.date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="text-center text-sm text-muted-foreground py-10">
                        Your recent translations will appear here.
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
