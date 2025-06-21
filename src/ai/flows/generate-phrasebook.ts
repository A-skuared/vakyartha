'use server';

/**
 * @fileOverview Phrasebook generation flow.
 *
 * This file defines a Genkit flow to generate a phrasebook for a specified language pair.
 * It includes the function `generatePhrasebook` to trigger the flow and the corresponding
 * input and output types.
 *
 * @file
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePhrasebookInputSchema = z.object({
  sourceLanguage: z
    .string()
    .describe('The source language for the phrasebook (e.g., English).'),
  targetLanguage: z
    .string()
    .describe('The target language for the phrasebook (e.g., Kannada).'),
  topic: z
    .string() 
    .optional()
    .describe('Optional topic for the phrasebook (e.g., greetings, food, travel).'),
  numPhrases: z
    .number()
    .min(5)
    .max(20)
    .default(10)
    .describe('The number of phrases to generate in the phrasebook.'),
});

export type GeneratePhrasebookInput = z.infer<typeof GeneratePhrasebookInputSchema>;

const GeneratePhrasebookOutputSchema = z.object({
  phrasebook: z.array(
    z.object({
      source: z.string().describe('Phrase in the source language.'),
      translation: z.string().describe('Phrase in the target language.'),
    })
  ).describe('Generated phrasebook with phrases in both languages.'),
});

export type GeneratePhrasebookOutput = z.infer<typeof GeneratePhrasebookOutputSchema>;

export async function generatePhrasebook(input: GeneratePhrasebookInput): Promise<GeneratePhrasebookOutput> {
  return generatePhrasebookFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePhrasebookPrompt',
  input: {schema: GeneratePhrasebookInputSchema},
  output: {schema: GeneratePhrasebookOutputSchema},
  prompt: `You are a translation expert. Generate a phrasebook with {{numPhrases}} common phrases for basic communication from {{sourceLanguage}} to {{targetLanguage}}.  
  
  {{#if topic}}The phrasebook should be related to the topic of {{topic}}.{{/if}}

  The output should be a JSON array of objects with 'source' and 'translation' keys.
  source: phrase in {{sourceLanguage}}
  translation: phrase in {{targetLanguage}}`, 
});

const generatePhrasebookFlow = ai.defineFlow(
  {
    name: 'generatePhrasebookFlow',
    inputSchema: GeneratePhrasebookInputSchema,
    outputSchema: GeneratePhrasebookOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
