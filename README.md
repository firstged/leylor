# LEYLOR

Proposition de refonte du site de **LEYLOR** — maison créative à Libreville :
albums, magazines, livrets de couple et cadres composés à la main, photo par
photo, **sur le thème de la personne à qui on l'offre**.

Site existant : https://leylor.vercel.app

## Le parti pris : l'atelier de découpage

Le site actuel est propre, mais chaque choix y est le choix par défaut, et les
quatre sections sont bâties sur le même gabarit — label, titre, paragraphe à
droite. C'est cette répétition qui fait « généré », pas les couleurs.

Ici tout est papier. Le fond a du grain et de la fibre. **Les sections ne se
succèdent pas par des lignes droites mais par des déchirures**, tracées au
chargement par une marche aléatoire — aucune n'est identique à une autre, ni
d'une visite à l'autre. Les photos sont des tirages découpés, à bord blanc,
tenus par du ruban adhésif et jamais tout à fait droits. Et le catalogue n'est
plus une grille de cartes : **c'est un album qu'on feuillette**, page après
page, chacune imposant sa couleur au fond.

| | Avant | Ici |
|---|---|---|
| Chargement | animation Lottie de chariot (CDN) | le logotype de la marque, chaque lettre dans une technique différente : tracée, découpée, patchwork, tamponnée, pivotée, déboîtée |
| Logotype | — | **le sien**, repris tel quel — c'est sa marque, elle doit rester reconnaissable |
| Hero | moitié sombre / moitié photo | plein cadre, traînée de tirages au mouvement de la souris, curseur-perle qui éclaire le fond |
| Créations | grille de six cartes, ouverte sur deux produits indisponibles | album feuilleté, une création par page, patchwork de tirages collés — les deux à venir ferment la marche |
| Thèmes | absents | une page de carnet : dix cartons découpés et scotchés ; au survol, la page se couvre de griffonnages au feutre dans la couleur du thème — et le thème choisi part dans le message WhatsApp |
| Transitions | bords droits | déchirures de papier, tracées à chaque chargement |
| Texte | statique | titres découpés mot à mot, chaque mot retombe en place de travers avant de se ranger |
| Dégradés | fonds plats | **dans le texte** : texture en soft-light sur un dégradé qui s'évanouit vers le bas |

Ce qui est **gardé** : la palette bordeaux et crème, et surtout le bon de
commande qui se lit comme une lettre et se conclut sur WhatsApp — pas de panier,
pas de paiement en ligne. C'est la bonne contrainte pour le Gabon et c'est la
meilleure idée du site d'origine.

## Parti pris technique

Aucune dépendance. Pas de framework, pas de bundler, pas de GSAP, pas de Lenis.
Trois fichiers, tout écrit à la main :

```
index.html            page autonome
css/leylor.css        feuille de style unique
js/leylor.js          interactions
logotype-source.svg   les six lettres d'origine, pour référence
```

Le numéro WhatsApp se change à la ligne 14 de `js/leylor.js`.

## Ce qui est fait maison

- **Le logotype** — ses six lettres sont définies une seule fois dans un `<defs>`
  et rappelées par `<use>` partout : barre de navigation, chargement, pied. Les
  25 Ko de tracés ne sont jamais recopiés.
- **Chargement** — chaque lettre arrive dans sa propre technique. La première
  part dès le premier pas : attendre un sixième du chargement pour montrer quoi
  que ce soit, c'est ouvrir sur un écran vide. Piloté par `setInterval` et non
  par `requestAnimationFrame` : rAF ne se déclenche pas dans un onglet masqué, ce
  qui bloquerait la page sur l'écran de chargement. Chien de garde à 7 s.
- **Déchirures** — marche aléatoire bornée : on avance par pas irréguliers et la
  hauteur dérive, sans jamais sortir de la feuille. Redessinées au
  redimensionnement.
- **Dégradé dans le texte** — `background-clip: text`, une texture tuilée en
  `soft-light` par-dessus un dégradé vertical qui s'évanouit. Technique relevée
  sur jjettas.com, transposée à la palette de la marque.
- **Traînée de tirages** — douze vignettes vivent en permanence dans le DOM et
  sont reposées sous le curseur à tour de rôle ; rien n'est créé ni détruit
  pendant le mouvement. Seuil de 118 px, sinon un micro-tremblement en poserait
  trente. L'adoucissement est porté par chaque image-clé et non par les options
  de l'animation — une courbe passée en option s'applique à l'itération entière
  et déplace tous les repères.
- **Curseur-perle** — la perle suit la souris avec un peu de retard, la lueur
  avec beaucoup. C'est l'écart entre les deux qui donne une matière.
- **L'album** — la position dans la piste devient un curseur `f` : sa partie
  entière désigne la page du dessus, chaque fond se dévoile d'autant plus que `f`
  est proche de son indice. La page se lève jusqu'au profil puis s'efface tôt —
  au-delà on verrait son dos, et une page menée à 180° viendrait se coucher sur
  la colonne de texte. Les pages déjà tournées ou enfouies sont retirées du
  rendu.
- **Les griffonnages** — dix-huit dessins au feutre tirés en quelques traits,
  définis une fois et rappelés par `<use>` : soixante marques réparties sur dix
  thèmes. Au survol, le groupe s'allume dans la couleur de son thème et chaque
  trait se dessine. Masqués sur écran tactile : sans survol, ils n'ont personne
  à suivre.
- **La route de l'atelier** — le tracé de fond est la route prévue, en pointillé
  comme sur une carte ; l'encre est le chemin déjà parcouru, et **un avion en
  papier vole au bout**. `pathLength="1"` normalise la longueur du tracé encré,
  mais la position de l'avion est mesurée sur le tracé de fond, lui sans
  `pathLength` : aucune ambiguïté sur ce que `getTotalLength` renvoie. L'avion
  est posé hors du SVG, qui est étiré sans conserver ses proportions et le
  déformerait, et son angle est calculé dans l'espace de l'écran — sinon il
  pointerait à côté de sa route.
- **Bon de commande** — la finition disparaît quand elle n'a pas lieu d'être, le
  thème part dans le message WhatsApp, le total se recalcule, les deux créations
  à venir restent visibles mais verrouillées.
- **Accessibilité** — `prefers-reduced-motion` neutralise tout et déroule l'album
  au lieu de le feuilleter, focus visible partout, contenu lisible sans
  JavaScript.

## Les photos

Le site tourne pour l'instant sur des **emplacements** et non sur de vraies
photos : chaque `.ph` est un dégradé tramé à la teinte de sa création, marqué
`photo NN` en bas à gauche.

Pour brancher les vraies images, remplacer le bloc par une balise — le cadrage
est porté par le parent, il n'y a rien d'autre à changer :

```html
<!-- avant -->
<figure class="pr a"><div class="ph" data-ph="01"></div></figure>
<!-- après -->
<figure class="pr a"><img src="img/01.jpg" alt="Cadre A4 posé sur une table"></figure>
```

Il en faut **douze pour la traînée du hero** (elle boucle, donc moins de douze se
remarque) et **dix-huit pour l'album** — trois par création, puisque chaque page
est un patchwork.

## Développement

Ouvrir `index.html` dans un navigateur. Rien à installer.

`build-artifact.py` dérive une variante sans balises englobantes pour l'aperçu
Claude — inutile au déploiement.

## Crédits

Logotype, créations et photographies : LEYLOR, Libreville.
Refonte et code : [Gfirst](https://github.com/firstged)
