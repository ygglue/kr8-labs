/** Build a single HTMLElement from an HTML string. */
export function fromHTML(html: string): HTMLElement {
  const tpl = document.createElement("template");
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild as HTMLElement;
}
