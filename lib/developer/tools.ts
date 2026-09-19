export type DeveloperTool = {
  id: string;
  name: string;
  description: string;
  category: string;
};

export const developerTools: DeveloperTool[] = [
  { id: "json", name: "JSON Formatter", description: "Validate and format JSON safely.", category: "Data" },
  { id: "base64", name: "Base64 Encoder", description: "Encode or decode Base64 text.", category: "Encoding" },
  { id: "url", name: "URL Encoder", description: "Encode and decode URL components.", category: "Web" },
  { id: "uuid", name: "UUID Generator", description: "Generate random UUID values.", category: "Utilities" },
  { id: "regex", name: "Regex Tester", description: "Test a regular expression against text.", category: "Text" },
  { id: "jwt", name: "JWT Inspector", description: "Decode JWT header and payload locally without verifying signatures.", category: "Security" },
  { id: "html", name: "HTML Escape", description: "Escape HTML-sensitive characters.", category: "Web" },
  { id: "markdown", name: "Markdown Preview", description: "Preview basic Markdown safely.", category: "Writing" },
];

export function getDeveloperTool(id: string) {
  return developerTools.find(tool => tool.id === id);
}
