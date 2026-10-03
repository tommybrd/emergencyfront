# Instructions pour les agents — Emergency.io / Valmont

Lire `CLOUD-HANDOFF.md`, `ROADMAP.md` et `VEHICLE-BASELINES.md` avant de reprendre le projet. L'instruction la plus récente du joueur prime sur ces documents. Les anciennes conversations et audits ne sont pas une preuve qu'une fonctionnalité reste à développer.

## Architecture et workflow

- Jeu statique JavaScript ES modules + Three.js local. `dist/` est le dossier des **sources**, pas un build à effacer. Ne pas imposer de framework ou de chaîne npm.
- Node.js 24+, Python 3 ; pas d'installation npm pour les tests.
- Développement public : servir `dist/` en HTTP, modifier les modules existants, contrôler avec `node scripts/check.mjs --static-only` puis les scénarios appropriés.
- Avant livraison d'un changement de jeu dans le dépôt public : `python3 scripts/prepare-release.py` puis `node scripts/check.mjs`. Ne pas éditer `Jouer-Valmont.html`, `dist/sw.js` ou `RELEASE-MANIFEST.json` à la main.
- Vérifier les changements visuels dans un vrai navigateur. Les tests remplacent le DOM/WebGL et ne mesurent pas les performances GPU.
- Ajouter une régression pertinente pour une correction de simulation. Ne pas multiplier les tests qui recopient une simple modification documentaire ou décorative.
- Mettre à jour la version Debug (`dist/debug-report.js`) et la date affichée (`dist/index.html`, heure de Paris) pour un nouveau changement de jeu livré. Une transmission de documentation/outils ne change pas la version du jeu.
- Les scripts publics ne déploient rien. Un push sur `main` lance les contrôles et GitHub Pages ; Sites est un hébergement séparé.
- Préserver l'historique et les contributions. Pas de force-push. Préfixe des nouvelles branches : `codex/`.

Le checkout historique du Mac contient un exporteur `scripts/prepare-public-release.py` et des `publication/templates/`, absent du dépôt public. Si vous travaillez dans ce checkout historique, ces templates définissent les outils publics et l'exporteur sélectionne les fichiers distribuables. Ne pas pousser son historique complet ni sa configuration Sites. Pour le travail cloud, utiliser directement le dépôt public et ses scripts autonomes.

## Décisions produit

- Bases visuelles validées : VSAV cellule, VLCG pick-up, CCF. Garder silhouettes et niveau de finition ; ajustements de détails et décoration selon les retours.
- Un seul modèle VSAV, avec migration des anciens MAN/Renault. PS hybride distinct déjà disponible via Composer. Les autres familles restent présentes.
- Voiture de service du chef supprimée ; VLI sur la base VLCG.
- Deux CIS Centre/Sud, deux rives et ponts, configurations indépendantes ; Sud volontaire et remobilisable pendant les retours.
- CCF : quatre personnels, uniquement LDT/petite lance, maximum deux lignes, jamais de grosse lance.
- PS : `kind:'VSAV'`, `firstAid:true`, six personnels, 880 L, petits feux extérieurs autorisés puis rangement avant soins/transport. Pas d'attaque bâtiment/forêt/batterie, ni de double affectation d'équipage.
- PC : un seul essieu arrière. VPCE : tandem conservé. FPT : rampe arrière supprimée, rotatif au coin.
- Gilets par fonction : commandant blanc, chef d'agrès jaune, équipiers orange ; galons liés au roster réel.
- Intervention rouge, transport CH bleu, « Disponible CIS » vert. Ne pas remettre l'équipage détaillé dans la vue intervention.
- Aucun zoom automatique au départ et aucune pause automatique au changement de fenêtre. Conserver la pause volontaire.
- Le placement manuel des véhicules, la santé des victimes, les deux livrées et le bilan PC sont déjà livrés ; chercher leur fonctionnement avant de les recréer.
- Conserver l'abandon pragmatique d'une intervention bloquée, sans réussite ou secours fictif.

## Périmètre et données

- Ne pas réintroduire les commandes reportées : délais arrivée/fin, départ conseillé, caméra thermique, relève, protection du voisin, coupe, évacuation préventive, gaz/électricité.
- Le compteur de visiteurs/capitaines a été annulé. Pas de backend ou de service de comptage.
- Les trois nouvelles idées PC du ROADMAP sont des propositions à décider, pas un chantier automatiquement autorisé.
- Ne pas effacer les sauvegardes du navigateur du joueur pour les essais ; utiliser une session de test séparée.
- Ne pas committer de secrets, chemins personnels, configuration d'hébergement, captures privées ou médias de référence non redistribuables. Les liens bibliographiques et les modèles procéduraux suffisent.
- Les optimisations doivent préserver la qualité : mesurer le coût avant/après, garder les éléments articulés hors des regroupements fixes, ne pas prendre les tests sans WebGL pour un benchmark FPS.
