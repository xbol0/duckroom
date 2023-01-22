const EscapeCharacters = [
  "_",
  "*",
  "[",
  "]",
  "(",
  ")",
  "~",
  "`",
  ">",
  "#",
  "+",
  "-",
  "=",
  "|",
  "{",
  "}",
  ".",
  "!",
];
export function escapeV2(str: string) {
  for (const i of EscapeCharacters) {
    str = str.replaceAll(i, "\\" + i);
  }
  return str;
}
