export interface ParsedSlashResult {
  cleanText: string;
  durationMinutes?: number;
  date?: string;
  isBillable?: boolean;
  isPriority?: boolean;
  projectName?: string;
  tagName?: string;
  description?: string;
}

export function parseSlashCommands(inputText: string): ParsedSlashResult {
  const result: ParsedSlashResult = { cleanText: '' };
  const words = inputText.split(/\s+/);
  const remainingWords: string[] = [];

  for (const word of words) {
    if (word === '/abrechenbar') {
      result.isBillable = true;
      continue;
    }

    if (word === '/prio') {
      result.isPriority = true;
      continue;
    }

    const durationMatch = word.match(/^\/(\d+)(h|m)$/);
    if (durationMatch) {
      const val = parseInt(durationMatch[1], 10);
      const unit = durationMatch[2];
      result.durationMinutes = unit === 'h' ? val * 60 : val;
      continue;
    }

    const dateMatch = word.match(/^\/(\d{2}\.\d{2}\.\d{2,4})$/);
    if (dateMatch) {
      result.date = dateMatch[1];
      continue;
    }

    const tagMatch = word.match(/^\/#(\S+)$/);
    if (tagMatch) {
      result.tagName = tagMatch[1];
      continue;
    }

    const descMatch = word.match(/^\/\/(.+)$/);
    if (descMatch) {
      result.description = descMatch[1];
      continue;
    }

    const nameMatch = word.match(/^\/([a-zA-Z0-9_-]+)$/);
    if (nameMatch && !['prio', 'abrechenbar', 'jetzt'].includes(nameMatch[1])) {
      result.projectName = nameMatch[1];
      continue;
    }

    remainingWords.push(word);
  }

  result.cleanText = remainingWords.join(' ');
  return result;
}
