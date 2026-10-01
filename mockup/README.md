# Horita PSSDC mock-up (web page)

A clickable mock-up of Horita PSSDC for presenting. It opens on the phone
view, centred and sized to fit the screen. The **Phone / Computer** switch at
the top right flips between the two views. All data is sample data.

## Put it on GitHub Pages

1. Create a repository on GitHub, for example `horita-mockup`.
2. Upload everything in this `mockup` folder to the repository's main page
   (drag and drop works): `index.html`, `runtime.js` and the `assets` folder
   are the ones the page needs. `src`, `page.html`, `build.mjs` and this file
   can go up too; they do no harm.
3. In the repository: **Settings → Pages → Build and deployment →
   Deploy from a branch**, choose `main` and `/ (root)`, then **Save**.
4. After a minute the page is live at
   `https://<your-github-name>.github.io/horita-mockup/`.
   Add `#computer` to the address to open straight on the computer view.

## Changing the mock-up

The screens live in `src/Phone.dc.html` and `src/Computer.dc.html` (the same
files as the design canvas). After changing them, run `node build.mjs` in this
folder to rebuild `index.html`, then upload `index.html` again.
