# Inspiration teak.io : typo et aération

Statut : proposition, à valider avec Damien avant implémentation (`remix-dev`).
Périmètre : tokens, typographie, espacements, conteneurs, palette, accessibilité. Pas de maquette à ce stade.

## 0. Constat sur l'existant

- `app/actions/home-page.tsx` est encore le **starter Remix** (« Welcome to Remix », cartes, wordmark). Le dégradé orange → corail, le portrait `trogne.png` et « Work in progress » n'y figurent pas : l'identité est à (re)poser. Cette spec la réintroduit.
- Tokens actuels (`--surface-0/3/4`, `--text-primary`, `--text-tertiary`, `--brand-blue`) posés sur `<main>` via `css()`. Ils sont remplacés par les tokens ci-dessous, à poser au niveau `body` ou `:root` pour servir nav et footer aussi.
- Polices : JetBrains Mono via Google Fonts. On la garde (c'est déjà notre mono), mais en auto-hébergement (voir 1).
- `Document` : `<html lang="en">` alors que le contenu est en français. À passer à `fr`.
- `docs/design/` était vide. Aucune contrainte héritée.
- Anti-patterns à ne pas reconduire : texte 10 px (footer), focus-visible qui ne change que le fond (remplacer par l'anneau du 6).

## 1. Ce qu'on emprunte à Teak (et ce qu'on laisse)

Emprunté :
- Contraste de caractère entre un titre display aux lettres serrées et un texte grotesque neutre.
- Un troisième registre mono pour labels, nav, légendes et stats.
- Grandes marges verticales, contenu aligné à gauche, une seule colonne de lecture étroite.
- Un seul CTA fort par écran, accent de couleur sur un mot du H1.

Laissé :
- Les accents multicolores (jaune, rose, menthe, bleu) : trop de teintes pour un site perso. On garde 2 accents chauds issus de l'identité existante.
- Interlignage 1.4 sur tout le texte : on monte à 1.5 pour le corps (AA/confort), 1.4 réservé aux textes courts.

## 2. Polices (libres, OFL)

| Rôle | Choix | Poids | Pourquoi |
| --- | --- | --- | --- |
| Display (H1 à H3) | **Bricolage Grotesque** (variable) | 500 | Display à caractère, lettres compactes, proche de l'esprit Solar Display sans être une copie. Axe optique utile en grand corps. |
| Texte, H4 | **Instrument Sans** (variable) | 400, 500, 600 | Grotesque neutre et lisible, bon substitut à Haffer. |
| Mono (labels, nav, stats, légendes) | **JetBrains Mono** | 400, 500 | Déjà présente dans le projet. |

Alternative à comparer si Bricolage paraît trop expressive : **Fraunces** (serif display) pour un contraste plus éditorial. Je recommande Bricolage : plus proche de Teak, moins « magazine ».

Chargement (consigne pour `remix-dev`) :
- Auto-hébergement en `.woff2` sous `public/assets/fonts/` (pas de requête Google : RGPD, perf, pas de FOUT tiers). Sous-ensemble latin + latin-ext (accents français).
- `font-display: swap`, `<link rel="preload" as="font" type="font/woff2" crossorigin>` pour Bricolage et Instrument Sans uniquement.
- Stacks de repli :

```css
--font-display: 'Bricolage Grotesque', 'Arial Narrow', system-ui, sans-serif;
--font-text: 'Instrument Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
```

(Remplace Verdana de la page actuelle ; à confirmer, voir questions.)

## 3. Échelle typographique fluide

Interpolation linéaire entre 360 px et 1440 px de viewport, bornes en `rem` (le zoom navigateur est respecté). Valeurs desktop = relevés Teak.

| Token | Mobile 360 | Desktop 1440 | `clamp()` | line-height | letter-spacing | Police |
| --- | --- | --- | --- | --- | --- | --- |
| `--fs-h1` | 40 px | 65 px | `clamp(2.5rem, 1.979rem + 2.315vw, 4.0625rem)` | 1.0 | -0.01em | display 500 |
| `--fs-h2` | 32 px | 50 px | `clamp(2rem, 1.625rem + 1.667vw, 3.125rem)` | 1.05 | -0.01em | display 500 |
| `--fs-h3` | 26 px | 38 px | `clamp(1.625rem, 1.375rem + 1.111vw, 2.375rem)` | 1.1 | -0.005em | display 500 |
| `--fs-h4` | 21 px | 26 px | `clamp(1.3125rem, 1.208rem + 0.463vw, 1.625rem)` | 1.1 | -0.01em | texte 600 |
| `--fs-lead` (sous-titre hero) | 17 px | 20 px | `clamp(1.0625rem, 1rem + 0.278vw, 1.25rem)` | 1.45 | 0 | texte 400 |
| `--fs-body` | 17 px | 17 px | `1.0625rem` | 1.5 | 0 | texte 400 |
| `--fs-stat` | 21 px | 21 px | `1.3125rem` | 1.2 | -0.01em | texte 500 |
| `--fs-mono` | 14 px | 14 px | `0.875rem` | 1.2 | 0.03em (~0.42 px) | mono 400/500 |

Règles :
- Minimum absolu 14 px (mono). Plus aucun texte à 10 px.
- Titres : `text-wrap: balance` ; paragraphes : `text-wrap: pretty`.
- H1 en 3 à 4 lignes courtes : sur >= 48rem, chaque segment est un `<span style="display:block">` (pas de `<br>`) ; sur mobile le texte coule librement.
- Mono : `text-transform: none` (pas de capitales, on garde la douceur Teak). Uppercase seulement pour un label de section, avec 0.08em.
- Un seul H1 par page ; hiérarchie H2 > H3 sans saut de niveau.

## 4. Espacements

Base 8 px (`rem`). Échelle de pas :

```css
--space-1: 0.25rem;  /* 4  */
--space-2: 0.5rem;   /* 8  */
--space-3: 0.75rem;  /* 12 */
--space-4: 1rem;     /* 16 */
--space-6: 1.5rem;   /* 24 */
--space-8: 2rem;     /* 32 */
--space-12: 3rem;    /* 48 */
--space-16: 4rem;    /* 64 */
--space-24: 6rem;    /* 96 */
```

Espacements verticaux fluides (360 → 1440 px) :

| Token | Mobile | Desktop | Valeur | Usage |
| --- | --- | --- | --- | --- |
| `--section-y` | 80 px | 160 px | `clamp(5rem, 3.333rem + 7.407vw, 10rem)` | padding-block de chaque section, et espace sous le hero |
| `--hero-top` | 120 px | 200 px | `clamp(7.5rem, 5.833rem + 7.407vw, 12.5rem)` | espace au-dessus du H1 (sous la nav) |
| `--hero-gap-title` | 24 px | 32 px | `clamp(1.5rem, 1.333rem + 0.741vw, 2rem)` | H1 vers sous-titre |
| `--hero-gap-cta` | 32 px | 48 px | `clamp(2rem, 1.667rem + 1.481vw, 3rem)` | sous-titre vers CTA |
| `--hero-gap-stats` | 56 px | 96 px | `clamp(3.5rem, 2.333rem + 5.185vw, 6rem)` | CTA vers ligne de stats |
| `--block-gap` | 32 px | 96 px | `clamp(2rem, 0.667rem + 5.926vw, 6rem)` | gouttière entre texte et média (sections alternées) |
| `--heading-gap` | 16 px | 24 px | `clamp(1rem, 0.667rem + 1.481vw, 1.5rem)` | titre de section vers son paragraphe |

Principes : on n'ajoute jamais de marge « au cas où » entre deux sections ; seule `--section-y` gouverne. Pas de séparateurs ni de cartes : l'air fait la séparation.

Sections alternées texte/média : grille 12 colonnes à partir de 48rem (texte 5 col, média 6 col, 1 col vide, alternance gauche/droite) ; empilé en dessous, texte avant média, `gap: var(--space-8)`.

## 5. Conteneurs

```css
--container: 70.5rem;   /* 1128 px, relevé Teak */
--gutter: clamp(1.25rem, 0.8rem + 2vw, 2.5rem);  /* 20 px mobile, 40 px max */
--measure-lead: 38rem;  /* ~608 px, sous-titre hero */
--measure-text: 65ch;   /* paragraphes courants */
```

- Conteneur : `width: min(100% - 2 * var(--gutter), var(--container)); margin-inline: auto;`. À 1440 px, on retrouve ~156 px de marge.
- Alignement à gauche partout (hors portrait si centré, voir questions).
- Nav flottante : hors conteneur, `position: sticky; top: var(--space-4)`, largeur `fit-content`, centrée.

## 6. Palette adaptée à Damien

Identité conservée : chaud, orange → corail. Teak inspire le fond très doux et l'accent en surlignage, pas en grand aplat.

### Tokens

```css
:root {
  color-scheme: light dark;

  /* Surfaces */
  --bg: #FBF6F0;            /* crème chaud, équivalent du blanc verdâtre de Teak */
  --bg-raised: #FFFFFF;     /* nav flottante, éventuels encarts */
  /* Texte */
  --ink: #1F1F1F;           /* texte principal, conservé */
  --ink-muted: #6B6258;     /* texte secondaire, légendes */
  --ink-inverse: #FBF6F0;   /* texte sur fond sombre */
  /* Accents (identité) */
  --accent-peach: #F2C08C;  /* surlignage du mot du H1, CTA principal */
  --accent-coral: #F58976;  /* pastilles, soulignements, détails */
  --accent-gradient: linear-gradient(90deg, #F2C08C, #F58976);
  /* Interaction */
  --focus: #1F1F1F;
  --line: rgb(31 31 31 / 0.14);
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #161312;
    --bg-raised: #221D1B;
    --ink: #F3ECE4;
    --ink-muted: #A89E94;
    --ink-inverse: #1F1F1F;
    --focus: #F2C08C;
    --line: rgb(243 236 228 / 0.18);
    /* --accent-* inchangés */
  }
}
```

### Usages des accents

- **Mot du H1** : surlignage `background: var(--accent-gradient)` derrière le mot, `padding-inline: 0.15em`, `box-decoration-break: clone`, couleur du texte `#1F1F1F` en clair comme en sombre (fixe, pas `--ink`, sinon illisible sur le surlignage en dark).
- **CTA principal** : pilule `background: var(--accent-peach)`, texte `#1F1F1F`, hauteur >= 48 px, padding-inline 28 px, `border-radius: 999px`, police texte 600 17 px. Hover : fond `--accent-coral`. Un seul par écran.
- **CTA secondaire** : pilule pleine `var(--ink)` / texte `var(--ink-inverse)` (comme le bouton secondaire sombre de Teak), mêmes dimensions.
- **Pastilles de la nav** : 8 px, `--accent-coral` / `--accent-peach` en alternance, `aria-hidden`, purement décoratives.

### Contraste (calculé à la main, à revérifier avec un outil avant livraison)

| Paire | Ratio approx. | Verdict |
| --- | --- | --- |
| `#1F1F1F` sur `#FBF6F0` | ~15:1 | AAA |
| `#6B6258` sur `#FBF6F0` | ~5.6:1 | AA texte normal |
| `#1F1F1F` sur `#F2C08C` | ~10:1 | AAA |
| `#1F1F1F` sur `#F58976` | ~6.8:1 | AA |
| `#F3ECE4` sur `#161312` | ~15:1 | AAA |
| `#A89E94` sur `#161312` | ~7:1 | AAA |
| `#F58976` en texte sur `#FBF6F0` | ~2.2:1 | **Échec : interdit comme couleur de texte** |
| Blanc sur `#F58976` ou `#F2C08C` | < 3:1 | **Interdit** |

Règle : le corail et le pêche ne sont jamais une couleur de texte ni un texte clair posé dessus ; ils sont des fonds sous texte `#1F1F1F` ou des éléments décoratifs.

## 7. Accessibilité

- Contraste AA minimum (tableau ci-dessus). Éléments d'interface (bordures de bouton, anneau de focus) >= 3:1 contre leur fond.
- **Focus visible** sur tout élément interactif : `outline: 3px solid var(--focus); outline-offset: 3px;` via `:focus-visible`. Ne jamais mettre `outline: none` sans remplaçant. Sur CTA pêche, l'anneau reste encre (3:1 contre le fond crème garanti).
- **Cibles tactiles** >= 44 x 44 px : liens de nav en mono 14 px avec `min-height: 44px` et padding-inline 12 px ; liens en ligne dans un paragraphe exemptés mais soulignés.
- Liens dans le texte : soulignés en permanence (`text-underline-offset: 0.2em`, épaisseur 1px, 2px au hover), pas seulement la couleur.
- **Skip link** « Aller au contenu » en premier élément focusable, visible au focus.
- `scroll-margin-top` sur les ancres >= hauteur nav flottante + 16 px.
- `prefers-reduced-motion: reduce` : aucune transition de transform/opacité, pas de révélation au scroll, pas de scroll lissé.
- `prefers-color-scheme` : thème sombre ci-dessus ; pas de bascule manuelle pour l'instant.
- Zoom 200 % et texte agrandi : tailles en `rem`, pas de hauteur fixe sur les blocs de texte, aucun scroll horizontal à 320 px.
- Surlignage du mot du H1 : purement visuel, ne change pas le sens ; le H1 reste lisible sans.
- `lang="fr"` sur `<html>`.
- Portrait : `alt` descriptif (ou `alt=""` s'il est purement décoratif à côté du nom).

## 8. Comportements et motion

- Hover liens/boutons : transition `background-color, color 150ms ease`. Pas de translation.
- Révélation au scroll (optionnelle, à valider) : `opacity 0 → 1` et `translateY(8px → 0)` en 400 ms, CSS seul (`animation-timeline: view()` avec repli sans animation), désactivée en reduced-motion.
- Nav flottante : fond `--bg-raised` avec 0.85 d'opacité et `backdrop-filter: blur(8px)` seulement si supporté ; sinon fond opaque.

## 9. Implémentation (notes pour `remix-dev`)

- Poser les tokens une fois (feuille globale ou `css()` sur `body`), pas par composant.
- Retirer le contenu starter de `home-page.tsx` ; ne pas conserver `PromptButton`.
- Aucune maquette HTML produite à ce stade : à demander si Damien veut valider le rendu avant code.

## 10. À valider avec Damien

1. **Public prioritaire** : recruteurs, clients ou pairs ? Cela change le contenu du hero (un seul CTA : « Me contacter », « Voir mes projets » ?).
2. **Contenu de la page d'accueil** : une page unique à sections (accroche, projets, parcours, contact) ou plusieurs routes ? Quelles stats afficher (années d'expérience, projets) ? Sans contenu, les sections alternées restent théoriques.
3. **Ton visuel** : Bricolage Grotesque (expressive, ma recommandation) ou Fraunces (serif, plus éditorial) ?
4. **Verdana** : on l'abandonne au profit de cette trilogie ? (Je le recommande.)
5. **Fond** : crème chaud (`#FBF6F0`) comme proposé, ou garder le dégradé orange → corail en plein fond ? Je recommande le dégradé réduit au surlignage et à de petits accents : le titre en 65 px respire mieux sur un fond calme.
6. **Portrait** : où le placer (à côté du H1, ou en média d'une section) ? Le rond est conservé ?
7. **Thème sombre** : utile dès la v1 ou on le garde pour plus tard ?
8. **Nav flottante avec pastilles** : on la reprend ? Peu utile tant que la page n'a qu'une ou deux sections.
9. **« Work in progress »** : on le garde comme mention en mono discrète (par ex. dans le footer) ?
