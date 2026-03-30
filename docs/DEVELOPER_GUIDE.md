# Developer guide: how to change the code

After you log in as **Developer**, you change the site by editing the codebase (not from the browser). Use this workflow.

## 1. Get the code

- **If you already have the project:** Open the project folder in your editor (e.g. Cursor or VS Code).
- **If you need a copy:** Clone the repo, then open that folder in your editor.

```bash
git clone https://github.com/Lokesh0717/doddapaneni-group.git
cd doddapaneni-group
```

## 2. Install and run locally

```bash
npm install
npm run dev
```

Open **http://localhost:3000** in your browser. Use the **Developer dashboard** (after logging in as Developer) to open each page (Home, About, Contact) and check your changes.

## 3. Where to edit what

| What you want to change | Where to edit |
|-------------------------|----------------|
| **Home page** | `app/[locale]/page.tsx` |
| **About page** | `app/[locale]/about/page.tsx` |
| **Contact page** | `app/[locale]/contact/page.tsx` |
| **Shared layout (navbar, footer)** | `components/Navbar.tsx`, `components/Footer.tsx` |
| **Text / translations** | `messages/en.json`, `messages/te.json`, `messages/hi.json`, `messages/es.json` |
| **Styles** | `app/globals.css`, or Tailwind classes in the components above |
| **Developer dashboard (this page)** | `components/dashboard/DeveloperDashboard.tsx` |

Save the file; the dev server will reload so you can see changes in the browser.

## 4. Test your changes

1. Stay logged in as Developer and go to **Dashboard → Developer**.
2. Use the **Site pages** links to open Home, About, Contact in new tabs.
3. After editing code, refresh those tabs (or click the link again) to see the updates.

## 5. Deploy (optional)

When you’re happy with the changes, commit and push. See **[docs/DEPLOY.md](DEPLOY.md)** for production steps (env vars, `prisma db push`, Docker, PM2, HTTPS).

```bash
git add .
git commit -m "Describe your change"
git push
```

---

**Summary:** Log in as Developer to get quick links to each page. Change the code in your editor (Cursor/VS Code), run `npm run dev`, and use the dashboard links to review each page.
