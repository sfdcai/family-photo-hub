<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- All family data flows through `src/lib/family-store.tsx`: it uses the self-hosted server's `/api` when `/api/health` answers, otherwise sample data, because the same UI runs in the Lovable preview and on the family's Proxmox server.
- The self-hosted server, Docker bundle and Android wrapper live outside this repo (delivered as a zip); the UI is built for it with `NITRO_PRESET=node-server`, so keep server-side code Node-compatible and free of Lovable Cloud dependencies.
- The frame (`/`, `/frame`) and the phone app (`/app`) are separate route components sharing the store, so the frame can stay full-screen while the phone UI stays touch-first.
- Server-side config (Immich credentials, calendars, PIN, admin password) is edited at `/admin` and stored in the server SQLite `config` table, overriding `.env`; secrets are write-only (returned as `{set}`) so they never reach a browser.
