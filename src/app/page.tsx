import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VoiceTranslator } from "@/components/voice-translator";
import { Phrasebook } from "@/components/phrasebook";
import { Languages, BookText } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-background text-foreground font-body p-4 sm:p-6 md:p-8">
      <header className="w-full max-w-4xl mb-6 md:mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-primary font-headline">
          Vākyaartha
        </h1>
        <p className="text-muted-foreground mt-2 md:text-lg">
          Instant voice and text translation between Kannada, Hindi, and English.
        </p>
      </header>
      <main className="w-full max-w-2xl">
        <Tabs defaultValue="translate" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="translate" className="text-base">
              <Languages className="mr-2 h-5 w-5" />
              Translate
            </TabsTrigger>
            <TabsTrigger value="phrasebook" className="text-base">
              <BookText className="mr-2 h-5 w-5" />
              Phrasebook
            </TabsTrigger>
          </TabsList>
          <TabsContent value="translate" className="mt-6">
            <VoiceTranslator />
          </TabsContent>
          <TabsContent value="phrasebook" className="mt-6">
            <Phrasebook />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="w-full max-w-4xl mt-12 text-center text-muted-foreground text-sm">
        <p>Crafted with AI by Firebase Studio</p>
      </footer>
    </div>
  );
}
