import type { Message, Files } from './types.js';

export const INITIAL_FILES: Files = {};

export interface StarterPrompt {
  label: string;
  prompt: string;
}

export const STARTER_PROMPTS: StarterPrompt[] = [
  { label: 'Portfolio Website', prompt: 'Build me a stunning, animated portfolio website to showcase my photography. It should have a full-screen hero image, a gallery section, and an about me page.' },
  { label: 'To-Do List App', prompt: 'Create a functional to-do list application. I should be able to add tasks, mark them as complete, and filter by status. Use local storage to persist the tasks.' },
  { label: 'SaaS Landing Page', prompt: 'Design a modern landing page for a new SaaS product called "InnovateAI". It needs a bold hero section, a features grid, a pricing table, and a contact form.' },
];


export const INITIAL_CHAT_MESSAGE: Message = {
  role: 'model',
  content: "Hello! I'm MominAI. I can build anything from immersive, animated websites to highly functional apps. Describe what you'd like to create, or get started with one of these ideas:",
};