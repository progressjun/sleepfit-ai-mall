import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const MAX_TEXT_OUTPUT = 14_000;
const MAX_READ_BYTES = 220_000;

function truncate(value: string, limit = MAX_TEXT_OUTPUT) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}\n\n[truncated ${value.length - limit} chars]`;
}

function normalizePath(input?: string, cwd?: string) {
  const fallback = cwd?.trim() || os.homedir();
  const raw = input?.trim() || fallback;
  const expanded =
    raw === "~" ? os.homedir() : raw.startsWith("~/") || raw.startsWith("~\\") ? path.join(os.homedir(), raw.slice(2)) : raw;

  return path.resolve(expanded);
}

function toPlainError(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export const agentToolDefinitions = [
  {
    type: "function",
    function: {
      name: "list_directory",
      description: "List files and folders from the local Windows computer.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Absolute path, relative path, or ~. Defaults to the app folder." },
          limit: { type: "number", description: "Maximum entries to return. Default 120." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read a UTF-8 text file from the local computer. Large files are truncated.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "File path to read." },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Create, overwrite, or append a UTF-8 text file on the local computer.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "File path to write." },
          content: { type: "string", description: "Text content to write." },
          mode: { type: "string", enum: ["overwrite", "append"], description: "Write mode. Default overwrite." },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_text",
      description: "Search local text files using ripgrep.",
      parameters: {
        type: "object",
        properties: {
          root: { type: "string", description: "Root folder to search. Defaults to the app folder." },
          query: { type: "string", description: "Text or regex query." },
          glob: { type: "string", description: "Optional glob, for example *.tsx or **/*.md." },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_powershell",
      description: "Run a PowerShell command on the local Windows computer.",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "PowerShell command to execute." },
          cwd: { type: "string", description: "Working directory. Defaults to the app folder." },
          timeoutSeconds: { type: "number", description: "Timeout from 1 to 30 seconds. Default 12." },
        },
        required: ["command"],
      },
    },
  },
] as const;

export async function executeAgentTool(name: string, args: Record<string, unknown>, workingDirectory?: string) {
  try {
    if (name === "list_directory") {
      const root = normalizePath(typeof args.path === "string" ? args.path : undefined, workingDirectory);
      const limit = Math.min(Math.max(Number(args.limit ?? 120), 1), 500);
      const entries = await fs.readdir(root, { withFileTypes: true });
      const rows = await Promise.all(
        entries.slice(0, limit).map(async (entry) => {
          const fullPath = path.join(root, entry.name);
          const stat = await fs.stat(fullPath).catch(() => null);
          return {
            name: entry.name,
            type: entry.isDirectory() ? "directory" : entry.isFile() ? "file" : "other",
            bytes: stat?.size ?? null,
            modifiedAt: stat?.mtime?.toISOString() ?? null,
            path: fullPath,
          };
        }),
      );

      return { ok: true, output: JSON.stringify({ path: root, entries: rows, total: entries.length }, null, 2) };
    }

    if (name === "read_file") {
      const filePath = normalizePath(String(args.path ?? ""), workingDirectory);
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) return { ok: false, output: `${filePath} is not a file.` };
      const buffer = await fs.readFile(filePath);
      const sliced = buffer.subarray(0, MAX_READ_BYTES);
      const content = sliced.toString("utf8");
      const suffix = buffer.length > MAX_READ_BYTES ? `\n\n[truncated ${buffer.length - MAX_READ_BYTES} bytes]` : "";
      return { ok: true, output: truncate(JSON.stringify({ path: filePath, content: content + suffix }, null, 2)) };
    }

    if (name === "write_file") {
      const filePath = normalizePath(String(args.path ?? ""), workingDirectory);
      const content = String(args.content ?? "");
      const mode = args.mode === "append" ? "append" : "overwrite";
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      if (mode === "append") {
        await fs.appendFile(filePath, content, "utf8");
      } else {
        await fs.writeFile(filePath, content, "utf8");
      }
      return { ok: true, output: JSON.stringify({ path: filePath, mode, bytes: Buffer.byteLength(content, "utf8") }) };
    }

    if (name === "search_text") {
      const root = normalizePath(typeof args.root === "string" ? args.root : undefined, workingDirectory);
      const query = String(args.query ?? "");
      const rgArgs = ["--line-number", "--hidden", "--glob", "!node_modules", "--glob", "!.git"];
      if (typeof args.glob === "string" && args.glob.trim()) {
        rgArgs.push("--glob", args.glob.trim());
      }
      rgArgs.push(query, root);
      const result = await execFileAsync("rg", rgArgs, {
        timeout: 12_000,
        windowsHide: true,
        maxBuffer: 512 * 1024,
      }).catch((error: unknown) => {
        const typed = error as { stdout?: string; stderr?: string; code?: number };
        if (typed.code === 1) return { stdout: "", stderr: "No matches found." };
        throw error;
      });
      return { ok: true, output: truncate(result.stdout || result.stderr || "No matches found.") };
    }

    if (name === "run_powershell") {
      const command = String(args.command ?? "");
      const cwd = normalizePath(typeof args.cwd === "string" ? args.cwd : undefined, workingDirectory);
      const timeoutSeconds = Math.min(Math.max(Number(args.timeoutSeconds ?? 12), 1), 30);
      const result = await execFileAsync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command], {
        cwd,
        timeout: timeoutSeconds * 1000,
        windowsHide: true,
        maxBuffer: 768 * 1024,
      });
      return {
        ok: true,
        output: truncate(JSON.stringify({ cwd, stdout: result.stdout, stderr: result.stderr }, null, 2)),
      };
    }

    return { ok: false, output: `Unknown tool: ${name}` };
  } catch (error) {
    return { ok: false, output: truncate(toPlainError(error)) };
  }
}
