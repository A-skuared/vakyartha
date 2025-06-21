'use server';

/**
 * @fileOverview Text translation flow.
 *
 * This file defines a Genkit flow to translate text and provide contextual meaning.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const allLanguageCodes = ['en', 'kn', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'ml', 'ur'] as const;

const TranslateTextInputSchema = z.object({
  sourceText: z.string().describe('The text to translate.'),
  sourceLanguage: z.string().describe('The source language name (e.g., English).'),
  targetLanguage: z.string().describe('The target language name (e.g., Kannada).'),
  targetLanguageCode: z.enum(allLanguageCodes).describe('The target language code.'),
});

export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
  contextualMeaning: z.string().describe('The contextual meaning of the translation.'),
  translatedAudioUri: z.string().describe('The translated audio as a data URI.'),
});

export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}

const voiceMap: Record<(typeof allLanguageCodes)[number], string> = {
    en: 'zubenelgenubi',
    kn: 'algenib',
    hi: 'achernar',
    ta: 'sadachbia',
    te: 'sadaltager',
    bn: 'schedar',
    gu: 'vindemiatrix',
    mr: 'gacrux',
    ml: 'rasalgethi',
    ur: 'umbriel',
};

const translationPrompt = ai.definePrompt({
    name: 'translationPrompt',
    input: { schema: z.object({
        sourceText: z.string(),
        sourceLanguage: z.string(),
        targetLanguage: z.string(),
    })},
    output: { schema: z.object({
        translatedText: z.string().describe('The translated text.'),
        contextualMeaning: z.string().describe('A brief explanation of the contextual meaning or nuances of the translation, especially if it\'s a phrase or idiom. Keep it to one or two sentences.'),
    })},
    prompt: `Translate the following text from {{sourceLanguage}} to {{targetLanguage}}. Also, provide a brief contextual meaning for the translation.

Text: "{{sourceText}}"`,
});


const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input) => {
    // 1. Get translation and context
    const { output } = await translationPrompt({
        sourceText: input.sourceText,
        sourceLanguage: input.sourceLanguage,
        targetLanguage: input.targetLanguage,
    });
    
    if (!output?.translatedText) {
        throw new Error('Failed to translate text. The translation was empty.');
    }

    // 2. Generate audio for the translation
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceMap[input.targetLanguageCode],
            },
          },
        },
      },
      prompt: output.translatedText,
    });

    if (!media) {
      throw new Error('no media returned from TTS');
    }

    const translatedAudioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const translatedAudioUri = 'data:audio/wav;base64,' + (await toWav(translatedAudioBuffer));

    return {
        translatedText: output.translatedText,
        contextualMeaning: output.contextualMeaning,
        translatedAudioUri: translatedAudioUri,
    };
  }
);


async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
