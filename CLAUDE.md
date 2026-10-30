# drenaud-website

Site personnel de Damien RENAUD, construit avec **Remix 3** (paquet `remix`, v3.x). Remix 3 n'est pas React Router / Remix v2 : ne jamais coder une API de mémoire, lire la doc installée.

@AGENTS.md

## Stack

- **Remix 3** (`remix`, seule dépendance runtime) — routes typées, composants Remix, Web APIs (`Request`/`Response`)
- **TypeScript**, exécuté directement par Node (`remix/node-tsx`), sans étape de build
- **Node ≥ 24.3.0 obligatoire** (`engines`). Vérifier `node -v` avant tout `npm`.
- Tests : `remix test` ; types : `tsc`

## Commandes

```sh
npm install
npm run dev        # serveur + redémarrage auto (http://localhost:44100)
npm run hmr        # live reload serveur + navigateur
npm run start      # mode production
npm test
npm run typecheck
npx remix routes   # liste des routes
npx remix doctor   # diagnostic du projet
```

## Structure

- `app/routes.ts` : contrat de routes (URLs typées), `app/router.ts` : câblage routes → contrôleurs
- `app/actions/` : contrôleurs et rendu UI par route ; `app/actions/public/` : code exécuté dans le navigateur
- `app/assets.ts` : pipeline d'assets
- `public/` : fichiers statiques servis tels quels à la racine (favicons, `manifest.json`, `assets/`, page `sync-…html`) — ne pas changer ces chemins, ils sont publics
- `docs/design/` : specs et maquettes du designer
- `.agents/skills/remix/SKILL.md` : guide Remix ; doc complète dans `node_modules/remix/INDEX.md`

## Équipe d'agents (`.claude/agents/`)

| Agent | Rôle | Quand l'appeler |
| --- | --- | --- |
| `remix-dev` | Implémente routes, composants, données, tests dans `app/` | Toute tâche de code |
| `reviewer` | Relecture en lecture seule (bugs, conventions Remix 3, sécurité, a11y, tests) + typecheck/tests | Après chaque lot de changements, avant merge |
| `designer` | Discussion UX/UI, specs et maquettes dans `docs/design/` ; n'édite pas `app/` | Avant de construire une page ou un composant, ou pour toute question de design |

Flux type : **designer** (cadrer, valider une spec avec Damien) → **remix-dev** (implémenter) → **reviewer** (relire) → corrections → commit.
Pour discuter design, demander explicitement : « discutons avec le designer de … ».

## Git

- **Aucun co-authoring** : jamais de trailer `Co-Authored-By`, ni mention de Claude/IA dans les commits ou descriptions de PR (verrouillé dans `.claude/settings.json`).
- **Branches** nommées `<type>/<sujet-court-en-kebab-case>` : `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, `test/`, `style/`. Ex. : `feat/page-projets`, `fix/contraste-titre`. Jamais de commit direct sur `main`.
- **Commits** : style gitmoji déjà utilisé dans l'historique (`:sparkles:` nouvelle fonctionnalité, `:bug:` correctif, `:art:` style/UI, `:recycle:` refactor, `:white_check_mark:` tests, `:memo:` docs, `:wrench:` config, `:fire:` suppression), message court et clair.
- Pas de PR créée sans demande explicite.

## Règles de travail

- Avant de rendre la main : `npm run typecheck` et `npm test` doivent passer.
- Changements ciblés ; pas de dépendance ajoutée sans justification (Remix couvre routage, UI, validation, sessions, données, assets).
- Accessibilité (contraste AA, focus visible, clavier) et mobile d'abord pour tout travail UI.
