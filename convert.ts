/** @file Convert thai-numbers.yaml to an Anki deck. */

import { writeSync, writeFileSync, readFileSync } from "node:fs";
import { load } from "js-yaml";
import { type } from "arktype";

declare interface AddCardOptions {
  tags: string[];
}
declare class AnkiExporter {
  constructor(deckName: string);
  addMedia(path: string, data: string | Buffer): void;
  addCard(front: string, back: string, options?: AddCardOptions): void;
  save(): Promise<string | NodeJS.ArrayBufferView>;
}
const AnkiExport = require("anki-apkg-export").default as typeof AnkiExporter;

// Surpress backtrace and source line printing on error
process.on("uncaughtException", (err) => {
  writeSync(process.stderr.fd, err.stack || err.message);
  process.exitCode = 1;
});

const entry = type({
  /** Indo-Arabic "123" digits */
  arabic: "string",
  /** Thai digits */
  thai: "string",
  /** Thai name of the number plus IPA */
  pn: "string",
}).array();

async function main() {
  const data = entry(
    load(readFileSync("./thai-numbers.yaml", { encoding: "utf-8" })),
  );
  if (data instanceof type.errors) {
    throw new Error("There is invalid data in the YAML.");
  }

  const apkg = new AnkiExport("Thai numbers");

  for (const entry of data) {
    apkg.addCard(entry.arabic, entry.thai + "\n\n" + entry.pn);
    apkg.addCard(entry.thai, entry.arabic + "\n\n" + entry.pn);
    apkg.addCard(entry.pn, entry.thai + "\n\n" + entry.arabic);
  }

  apkg.save().then((data) => {
    writeFileSync("./output.apkg", data, "binary");
  });
}