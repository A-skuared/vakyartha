'use server';

/**
 * @fileOverview Voice translation flow for translating spoken phrases between Kannada, Hindi, and English.
 *
 * - translateVoice - A function that handles the voice translation process.
 * - TranslateVoiceInput - The input type for the translateVoice function.
 * - TranslateVoiceOutput - The return type for the translateVoice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const TranslateVoiceInputSchema = z.object({
  sourceLanguage: z.enum(['en', 'kn', 'hi']).describe('The language of the input audio.'),
  targetLanguage: z.enum(['en', 'kn', 'hi']).describe('The language to translate the audio to.'),
  audioDataUri: z
    .string()
    .describe(
      'The audio data as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Corrected typo here
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

const translatePrompt = ai.definePrompt({
  name: 'translatePrompt',
  input: {
    schema: z.object({
      sourceLanguage: z.enum(['en', 'kn', 'hi']),
      targetLanguage: z.enum(['en', 'kn', 'hi']),
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
    // 1. Convert audio to text
    const audioBuffer = Buffer.from(
      input.audioDataUri.substring(input.audioDataUri.indexOf(',') + 1),
      'base64'
    );

    //TODO: Replace with real ASR
    const text = 'dummy translation please ignore';

    // 2. Translate text
    const {text: translatedText} = await translatePrompt({
      sourceLanguage: input.sourceLanguage,
      targetLanguage: input.targetLanguage,
      text,
    });

    // 3. Text to speech

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: input.targetLanguage === 'kn' ? 'Algenib' : input.targetLanguage === 'hi' ? 'Achernar' : 'Azimech',
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




