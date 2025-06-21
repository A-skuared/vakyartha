'use server';

/**
 * @fileOverview Voice translation flow for translating spoken phrases between supported languages.
 *
 * - translateVoice - A function that handles the voice translation process.
 * - TranslateVoiceInput - The input type for the translateVoice function.
 * - TranslateVoiceOutput - The return type for the translateVoice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const allLanguageCodes = ['en', 'kn', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'ml', 'ur'] as const;

const TranslateVoiceInputSchema = z.object({
  sourceLanguage: z.enum(allLanguageCodes).describe('The language of the input audio.'),
  targetLanguage: z.enum(allLanguageCodes).describe('The language to translate the audio to.'),
  audioDataUri: z
    .string()
    .describe(
      "The audio data as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

export type TranslateVoiceInput = z.infer<typeof TranslateVoiceInputSchema>;

const TranslateVoiceOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
  translatedAudioUri: z.string().describe('The translated audio as a data URI.'),
});

export type TranslateVoiceOutput = z.infer<typeof TranslateVoiceOutputSchema>;

export async function translateVoice(input: TranslateVoiceInput): Promise<TranslateVoiceOutput> {
  return translateVoiceFlow(input);
}

const languageMap: Record<(typeof allLanguageCodes)[number], string> = {
    en: 'English',
    kn: 'Kannada',
    hi: 'Hindi',
    ta: 'Tamil',
    te: 'Telugu',
    bn: 'Bengali',
    mr: 'Marathi',
    gu: 'Gujarati',
    ml: 'Malayalam',
    ur: 'Urdu'
};

const voiceMap: Record<(typeof allLanguageCodes)[number], string> = {
    en: 'Azimech',
    kn: 'Algenib',
    hi: 'Achernar',
    ta: 'Chara',
    te: 'Deneb',
    bn: 'Elnath',
    gu: 'Fomalhaut',
    mr: 'Gacrux',
    ml: 'Hadar',
    ur: 'Izar',
};


const simpleTranslatePrompt = ai.definePrompt({
  name: 'simpleTranslatePrompt',
  input: {
    schema: z.object({
      sourceLanguage: z.string().describe('The full name of the source language (e.g., English).'),
      targetLanguage: z.string().describe('The full name of the target language (e.g., Kannada).'),
      text: z.string(),
    }),
  },
  prompt: `Translate the following text from {{sourceLanguage}} to {{targetLanguage}}:\n\n{{text}}`,
});

const translateVoiceFlow = ai.defineFlow(
  {
    name: 'translateVoiceFlow',
    inputSchema: TranslateVoiceInputSchema,
    outputSchema: TranslateVoiceOutputSchema,
  },
  async input => {
    const sourceLanguageName = languageMap[input.sourceLanguage];
    const targetLanguageName = languageMap[input.targetLanguage];
    
    // 1. Transcribe audio to text (ASR)
    const {text: transcribedText} = await ai.generate({
      prompt: [
        {
          text: `You are an expert audio transcriber. Transcribe the following audio from a user. The user is speaking in ${sourceLanguageName}. Provide only the transcribed text as the output.`,
        },
        {media: {url: input.audioDataUri}},
      ],
    });

    if (!transcribedText) {
        throw new Error('Failed to transcribe audio. The transcription was empty.');
    }

    // 2. Translate text
    const {text: translatedText} = await simpleTranslatePrompt({
      sourceLanguage: sourceLanguageName,
      targetLanguage: targetLanguageName,
      text: transcribedText.trim(),
    });

    if (!translatedText) {
        throw new Error('Failed to translate text. The translation was empty.');
    }

    // 3. Text to speech
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceMap[input.targetLanguage],
            },
          },
        },
      },
      prompt: translatedText,
    });

    if (!media) {
      throw new Error('no media returned');
    }
    const translatedAudioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const translatedAudioUri = 'data:audio/wav;base64,' + (await toWav(translatedAudioBuffer));

    return {translatedText, translatedAudioUri};
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
