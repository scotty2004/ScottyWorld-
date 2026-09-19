import { randomUUID } from "crypto";

function safeJson(value: string) {
  return JSON.stringify(JSON.parse(value), null, 2);
}

function base64Encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64");
}

function base64Decode(value: string) {
  return Buffer.from(value, "base64").toString("utf8");
}

function urlEncode(value: string) {
  return encodeURIComponent(value);
}

function urlDecode(value: string) {
  return decodeURIComponent(value);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function inspectJwt(value: string) {
  const parts = value.split(".");
  if (parts.length !== 3) throw new Error("A JWT must contain three sections.");

  const decode = (part: string) =>
    JSON.parse(Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));

  return JSON.stringify({
    header: decode(parts[0]),
    payload: decode(parts[1]),
    signature: "Not decoded or verified.",
  }, null, 2);
}

export function runDeveloperTool(tool: string, input: string, pattern?: string) {
  switch (tool) {
    case "json":
      return safeJson(input);
    case "base64":
      return base64Encode(input);
    case "base64-decode":
      return base64Decode(input);
    case "url":
      return urlEncode(input);
    case "url-decode":
      return urlDecode(input);
    case "uuid":
      return randomUUID();
    case "html":
      return escapeHtml(input);
    case "jwt":
      return inspectJwt(input);
    case "regex": {
      if (!pattern) throw new Error("Regex pattern is required.");
      const regex = new RegExp(pattern, "g");
      const matches = input.match(regex) ?? [];
      return JSON.stringify({ matches, count: matches.length }, null, 2);
    }
    default:
      throw new Error("Unsupported developer operation.");
  }
}
