
export enum AppMode {
  Generate = 'generate',
  Feedback = 'feedback',
}

export interface DesignItem {
  id: string;
  type: AppMode;
  imageUrl: string;
  prompt: string;
  feedback?: string;
}
