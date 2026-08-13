import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { describe, it } from "node:test";
import { killProcessTree } from "./kill-process-tree.js";

// A parent that spawns a long-lived grandchild, prints its pid, and then waits -- the shape
// `pnpm exec vp run` and `node build-app.mjs --watch` have, and the one a bare kill() gets wrong.
const PARENT_SOURCE = `
  const { spawn } = require("node:child_process");
  const grandchild = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"],
    { stdio: "ignore" });
  console.log(grandchild.pid);
  setInterval(() => {}, 1000);
`;

function isAlive(pid) {
  try {
    // Signal 0 checks for existence without delivering anything.
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code !== "ESRCH";
  }
}

async function waitUntilGone(pid, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (isAlive(pid)) {
    if (Date.now() >= deadline) return false;
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  return true;
}

// Resolves once the parent has printed its grandchild's pid.
function spawnParentTree() {
  return new Promise((resolve, reject) => {
    const parent = spawn(process.execPath, ["-e", PARENT_SOURCE], {
      stdio: ["ignore", "pipe", "ignore"],
    });
    let output = "";
    parent.stdout.on("data", chunk => {
      output += chunk.toString();
      const pid = Number(output.trim());
      if (output.includes("\n") && pid > 0) resolve({ parent, grandchildPid: pid });
    });
    parent.on("error", reject);
    parent.on("exit", () => reject(new Error("parent exited before reporting its grandchild")));
  });
}

describe("killProcessTree", () => {
  it("reaps a grandchild the parent would otherwise orphan", async () => {
    const { parent, grandchildPid } = await spawnParentTree();
    assert.ok(isAlive(grandchildPid), "grandchild should be running before the kill");

    await killProcessTree(parent.pid);

    assert.ok(await waitUntilGone(grandchildPid),
      `grandchild ${grandchildPid} outlived its tree kill`);
    assert.ok(await waitUntilGone(parent.pid), `parent ${parent.pid} outlived its tree kill`);
  });

  it("rejects a non-numeric pid rather than signalling a process group", async () => {
    await assert.rejects(killProcessTree("not-a-pid"), /pid must be a number/);
  });

  it("resolves for a pid that is already gone", async () => {
    const child = spawn(process.execPath, ["-e", ""], { stdio: "ignore" });
    const { pid } = child;
    await new Promise(resolve => child.on("exit", resolve));
    await waitUntilGone(pid);

    // ESRCH is the expected outcome here, not a failure.
    await killProcessTree(pid);
  });
});
