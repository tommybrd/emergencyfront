# Emergency.io — une garde à construire ensemble

**Un jeu open source et communautaire pour les passionnés de sapeurs-pompiers.** Dans la ville fictive de Valmont, vous incarnez le chef de centre : recevez les appels, engagez les équipages et suivez les secours dans une ville en 3D. Une garde de **08 h à 08 h se joue en 24 minutes**.

**[▶ Jouer à Emergency.io](https://tommybrd.github.io/emergency.io/)**

## Pourquoi ce projet ?

Emergency.io est une initiative de **Tommy Bourdin**, née de l’envie de retrouver le plaisir d’un jeu d’intervention où l’on voit les engins partir, les équipages travailler et la caserne vivre. Le projet s’est construit par essais successifs : jouer, observer ce qui manque, corriger et enrichir la simulation.

L’ouverture du code invite d’autres passionnés à poursuivre cette aventure. Pompiers professionnels ou volontaires, joueurs, développeurs, artistes et curieux peuvent apporter leur regard. Une remarque sur un départ, un problème rencontré pendant une garde ou une meilleure animation peut faire avancer le jeu autant qu’une nouvelle fonctionnalité.

Notre intention est de construire un jeu **accessible, vivant et agréable à jouer**, nourri par les échanges avec sa communauté. La cohérence des interventions compte, tout comme la simplicité des commandes. Les graphismes restent volontairement simples et les nouvelles fonctions doivent apporter quelque chose au joueur sans transformer une garde en tableau de gestion compliqué.

Le jeu est disponible gratuitement dans le navigateur. Son code peut être étudié, modifié et partagé dans les conditions de sa licence. Cette simulation ludique n’est pas un outil de formation opérationnelle.

## Participer, même sans coder

- **Jouer et raconter** : signaler un blocage, une action difficile à comprendre ou un moment réussi.
- **Apporter son expérience** : proposer des motifs, expliquer un véhicule ou une organisation, avec des références publiques quand elles sont utiles.
- **Imaginer une amélioration** : décrire son intérêt pour le joueur et la façon la plus simple de l’intégrer.
- **Créer et corriger** : contribuer au code, aux animations, aux sons, aux graphismes simples ou à la documentation.

Ouvrez une **Issue** dans ce dépôt pour un problème ou une idée. Les formulaires vous guident ; aucune compétence technique n’est nécessaire pour participer. Pour une contribution au code, consultez [CONTRIBUTING.md](CONTRIBUTING.md). Les propositions sont discutées au regard de la jouabilité ; elles ne constituent pas une promesse de développement.

## Jouer

Le jeu s'ouvre dans un navigateur récent compatible WebGL, sans compte ni installation. Souris et clavier recommandés. Le son démarre après une première interaction.

- Cliquez sur une intervention, puis sur les engins à engager. Leur équipage s'équipe avant le départ.
- Les secours à personne commencent automatiquement après reconnaissance. Pour les incendies, choisissez les lances et raccordez l'engin à un poteau si nécessaire.
- Rappelez l’équipe d’astreinte ou lancez l’appel général, puis suivez l’arrivée des volontaires. Le chef de centre choisit sa camionnette en remise ou sa voiture de service au parking extérieur ; l'infirmier dispose du VLI.
- **Q/Z/S/D** : déplacer la caméra ; **A/E** : pivoter ; **molette** : zoomer. Cliquez sur un véhicule pour le suivre et ouvrir ses commandes.
- Une croix ferme la fiche sans annuler l'intervention. Le bouton **Caserne** ramène à la remise.

La flotte comprend 14 moyens opérationnels : 4 VSAV, VLI, 3 CCF, FPTSR, FPTL, EPA, VTU, VLCG et VPL avec bateau. Les deux véhicules du chef sont présents, mais un seul peut être engagé à la fois. La ville comporte des immeubles, un centre commercial, une forêt et son lac, un stade et une voie rapide. Le catalogue compte 48 situations ; la garde propose huit interventions par défaut, avec une densité réglable.

La plage de l’étang reçoit des baigneurs de 9 h à 20 h. Les malaises et blessures se traitent sur le sable. Pour une noyade, le VPL ramène la victime sur la berge, puis le VSAV assure sa prise en charge et son transport au CH ; le VLI peut apporter des soins supplémentaires.

**Recharger la page redémarre la garde.** Seul le profil du joueur est conservé dans le navigateur. Le jeu est une simulation ludique : ses durées, fréquences et capacités sont des réglages de jeu.

Les messages importants sont annoncés par une courte **radio parlée**, désactivable dans Son. Les équipages posent automatiquement un balisage sur les scènes dangereuses : les civils se détournent ou attendent, puis reprennent leur passage après le repli. Les incendies laissent des traces localisées pendant la garde. La voix utilise les voix françaises disponibles dans le navigateur ; le texte reste toujours affiché.

Après reconnaissance d’un feu de bâtiment, deux commandes permettent **d’évacuer les habitants** et **de couper les énergies**. Les équipiers se déplacent jusqu’au bâtiment et accompagnent les occupants à l’abri. L’alimentation en eau montre le binôme et son dévidoir. Après un accident, des dépanneuses récupèrent automatiquement les épaves, puis la voirie nettoie et libère la chaussée.

La [liste des idées](ROADMAP.md) conserve les propositions à choisir et les fonctions ajoutées.

## Lancer une copie locale

Téléchargez et décompressez l'archive, puis **double-cliquez sur `Jouer-Valmont.html`**. Ce fichier contient le code, la 3D et les sons ; aucun serveur ni installation n'est nécessaire. Utilisez un navigateur récent compatible WebGL et les import maps. Les polices Google sont facultatives et disposent de remplacements locaux.

Pour travailler sur les sources modifiables, ouvrez un terminal dans le dossier :

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Ouvrez ensuite <http://127.0.0.1:4173/>. Le fichier `dist/index.html` reste l'entrée de la version hébergée ; utilisez `Jouer-Valmont.html` pour un lancement par double-clic.

## Développer et contribuer

Le dossier `dist/` contient **les sources modifiables**, pas des fichiers générés. Le moteur utilise JavaScript natif et Three.js fourni dans `dist/vendor/`. Les polices sont chargées depuis Google Fonts ; des polices système prennent le relais si ce service est inaccessible.

Après modification, régénérez le fichier autonome avec `python3 scripts/build-standalone.py`. Le script ne nécessite aucun paquet Python supplémentaire. Le fichier HTML généré conserve les crédits et la licence de Three.js.

Les vérifications s'exécutent avec Node.js 24 :

```sh
node scripts/check.mjs
```

Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour proposer une correction et [tests/README.md](tests/README.md) pour les scénarios vérifiés. Les tests automatiques couvrent la simulation, mais ne mesurent pas les performances graphiques.

## Héberger sa propre version

Sur un dépôt GitHub public, activez **Settings → Pages → Source : GitHub Actions**. Le workflow inclus vérifie puis publie uniquement `dist/` à chaque push sur `main`. Il peut aussi être lancé depuis l'onglet Actions. Le lien du déploiement ouvre directement le jeu.

Tout autre hébergeur de fichiers statiques peut servir `dist/`. Les chemins sont relatifs, y compris pour une adresse avec un sous-dossier.

## Licence et crédits

Code original sous [licence MIT](LICENSE).

Les ressources tierces conservent leurs propres conditions : voir [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Les modèles 3D du jeu sont procéduraux. Aucun modèle GTA/FiveM n'est inclus. Le deux-tons de cette distribution est synthétique ; son script de génération est fourni. Le catalogue du jeu cite les documents SDIS sans redistribuer leurs grilles intégrales.

### Placement et passage des secours

Dans la fiche intervention, le bouton **⌖** à côté d’un moyen engagé propose quelques positions numérotées sur la carte. Un clic suffit ; le placement automatique reste disponible si vous ne choisissez rien. Les engins doivent replier leur matériel avant de changer de place.

Les automobilistes se rangent lorsqu’un véhicule de secours approche avec ses gyrophares, si le bas-côté est libre. Ils reprennent leur voie après le passage du convoi.
