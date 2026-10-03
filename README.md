# Emergency.io

Prenez la tête du CIS Valmont pour une journée de garde : recevez les appels, engagez vos équipages et coordonnez les secours dans une ville en 3D.

**[▶ Jouer à Emergency.io](https://tommybrd.github.io/emergencyfront/)**

Composez votre caserne, gérez les renforts et accompagnez les interventions : secours à personne, incendies et accidents. Entre les départs, la caserne vit au rythme de la journée.

Une idée ou un problème ? Ouvrez une **Issue** dans ce dépôt. Les contributions sont les bienvenues ; voir [CONTRIBUTING.md](CONTRIBUTING.md).

## Développer ou reprendre dans le cloud

Lire [CLOUD-HANDOFF.md](CLOUD-HANDOFF.md) pour l'état vérifié de la v107, les décisions du joueur, les fichiers utiles et les travaux restants. [ROADMAP.md](ROADMAP.md) distingue les fonctionnalités livrées des propositions. Les consignes des agents sont dans [AGENTS.md](AGENTS.md).

`dist/` contient les sources JavaScript, HTML et CSS éditables. Three.js et les sons sont inclus. Node.js 24+ et Python 3 suffisent ; aucune installation npm ni compilation n'est nécessaire.

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Ouvrir `http://127.0.0.1:4173/`. Pour jouer sans serveur, ouvrir le fichier généré `Jouer-Valmont.html` dans un navigateur récent.

```sh
node scripts/check.mjs --static-only
python3 scripts/prepare-release.py
node scripts/check.mjs
```

Le générateur actualise le cache public, le HTML autonome et le manifeste ; il ne publie rien. Un push sur `main` déclenche les contrôles et GitHub Pages. L'hébergement Sites utilise un déploiement séparé. Voir [PUBLICATION.md](PUBLICATION.md).

Code original sous [licence MIT](LICENSE). Les crédits sont dans [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
