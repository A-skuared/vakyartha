"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Volume2, Loader2, AlertTriangle } from "lucide-react";
import { type Language, LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  translateVoice,
  type TranslateVoiceOutput,
} from "@/ai/flows/voice-translation";
import { Badge } from "@/components/ui/badge";

export function VoiceTranslator() {
  const [sourceLang, setSourceLang] = useState<Language>("en");
  const [targetLang, setTargetLang] = useState<Language>("kn");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [translation, setTranslation] = useState<TranslateVoiceOutput | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (translation?.translatedAudioUri) {
      audioPlayerRef.current = new Audio(translation.translatedAudioUri);
    }
  }, [translation]);

  const handleMicClick = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
    } else {
      setTranslation(null);
      setError(null);
      setIsRecording(true);
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          setIsRecording(false);
          setIsLoading(true);
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const audioDataUri = reader.result as string;
            try {
              const result = await translateVoice({
                sourceLanguage: sourceLang,
                targetLanguage: targetLang,
                audioDataUri,
              });
              setTranslation(result);
            } catch (e) {
              console.error(e);
              setError("Translation failed. Please try again.");
              toast({
                variant: "destructive",
                title: "Error",
                description: "Could not translate your voice.",
              });
            } finally {
              setIsLoading(false);
              stream.getTracks().forEach((track) => track.stop());
            }
          };
        };

        mediaRecorderRef.current.start();
      } catch (err) {
        console.error("Could not get microphone access:", err);
        setError(
          "Microphone access denied. Please enable it in your browser settings."
        );
        toast({
          variant: "destructive",
          title: "Microphone Error",
          description: "Could not access your microphone.",
        });
        setIsRecording(false);
      }
    }
  };

  const playTranslatedAudio = () => {
    audioPlayerRef.current?.play();
  };

  return (
    <Card className="w-full shadow-lg border-2">
      <CardContent className="p-6">
        <div className="space-y-8">
          <LanguageSwitcher
            sourceLang={sourceLang}
            setSourceLang={setSourceLang}
            targetLang={targetLang}
            setTargetLang={setTargetLang}
          />
          <div className="flex justify-center items-center flex-col gap-4">
            <Button
              onClick={handleMicClick}
              disabled={isLoading}
              className={`w-24 h-24 rounded-full transition-all duration-300 ease-in-out transform active:scale-90 ${
                isRecording ? "bg-destructive hover:bg-destructive/90 animate-pulse" : "bg-primary hover:bg-primary/90"
              } focus:ring-4 focus:ring-primary/50 flex flex-col items-center justify-center gap-1 shadow-lg`}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isLoading ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : isRecording ? (
                <Square className="w-10 h-10" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
            </Button>
            <p className="text-muted-foreground text-sm h-5">
              {isLoading ? "Translating..." : isRecording ? "Recording... Tap to stop." : "Tap to speak"}
            </p>
          </div>

          {error && (
            <div className="text-center p-4 bg-destructive/10 text-destructive rounded-lg flex items-center justify-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {translation && (
             <Card className="bg-primary/5">
                <CardContent className="p-6">
                    <Badge variant="default">Translation</Badge>
                    <div className="flex items-center justify-between gap-4 mt-2">
                        <p className="text-2xl font-bold text-primary">{translation.translatedText}</p>
                        <Button variant="outline" size="icon" onClick={playTranslatedAudio} aria-label="Play translated audio">
                            <Volume2 className="h-6 w-6" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
