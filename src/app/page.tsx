import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VoiceTranslator } from "@/components/voice-translator";
import { Phrasebook } from "@/components/phrasebook";
import { TextTranslator } from "@/components/text-translator";
import { Languages, BookText, CaseSensitive } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-background text-foreground font-body p-4 sm:p-6 md:p-8">
      <header className="w-full max-w-5xl mb-6 md:mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-primary font-headline">
          Vākyaartha
        </h1>
        <p className="text-muted-foreground mt-2 md:text-lg">
          Instant voice and text translation between Kannada, Hindi, and English.
        </p>
      </header>
      <main className="w-full max-w-5xl">
        <Tabs defaultValue="translate" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="translate" className="text-base">
              <Languages className="mr-2 h-5 w-5" />
              Voice
            </TabsTrigger>
            <TabsTrigger value="text-translate" className="text-base">
                <CaseSensitive className="mr-2 h-5 w-5" />
                Text
            </TabsTrigger>
            <TabsTrigger value="phrasebook" className="text-base">
              <BookText className="mr-2 h-5 w-5" />
              Phrasebook
            </TabsTrigger>
          </TabsList>
          <TabsContent value="translate" className="mt-6">
            <div className="w-full max-w-2xl mx-auto">
                <VoiceTranslator />
            </div>
          </TabsContent>
          <TabsContent value="text-translate" className="mt-6">
            <TextTranslator />
          </TabsContent>
          <TabsContent value="phrasebook" className="mt-6">
            <div className="w-full max-w-2xl mx-auto">
                <Phrasebook />
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <footer className="w-full max-w-5xl mt-12 text-center text-muted-foreground text-sm">
        <p>Crafted with AI by Firebase Studio</p>
      </footer>
    </div>
  );
}
