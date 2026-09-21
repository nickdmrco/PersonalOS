/**
 * The pages the unsubscribe link shows. Kept out of the route so the markup
 * can be rendered and looked at without a database behind it.
 *
 * Plain inline styles for the same reason the email uses them: this is opened
 * from a mail client, often in an in-app browser, and should not depend on
 * anything the app serves.
 */
export function unsubscribePage(
  title: string,
  body: string,
  action?: { token: string; label: string; on: boolean },
) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#eff2ee;font:15px/1.6 -apple-system,Segoe UI,sans-serif;color:#141e1b">
<div style="max-width:460px;margin:12vh auto;padding:28px;background:#fafcf9;border:1px solid #d3dad3;border-radius:10px">
<p style="margin:0 0 6px;font:600 21px/1.3 Georgia,serif">${title}</p>
<p style="margin:0 0 18px;color:#3f504a">${body}</p>
${
  action
    ? `<form method="post"><input type="hidden" name="t" value="${action.token}"><input type="hidden" name="on" value="${action.on ? "1" : "0"}">
<button type="submit" style="background:#a62e68;color:#fff;border:0;border-radius:6px;padding:11px 17px;font:600 14px/1 inherit;cursor:pointer">${action.label}</button></form>`
    : ""
}
<p style="margin:22px 0 0;font-size:11px;color:#9aa8a2">Dead Reckoning</p>
</div></body></html>`;
}
