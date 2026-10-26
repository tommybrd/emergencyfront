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
- VSR : cabine simple courte, une seule rangée de trois places et une porte par côté ; coffres de secours routier derrière la cabine. Aucun personnel du VSR ne porte d’ARI.
- Un seul modèle VSAV, avec migration des anciens MAN/Renault. PS hybride distinct déjà disponible via Composer. Les autres familles restent présentes.
- Voiture de service du chef supprimée ; VLI sur la base VLCG.
- Deux CIS Centre/Sud, deux rives et ponts, configurations indépendantes ; Sud volontaire et remobilisable pendant les retours.
- Lances : une seule lance à débit variable (plus de LDT/petite/grosse lance). On établit une lance par binôme depuis la console de l'engin, puis on règle dans une popup à côté du binôme (clic sur lui ou sur sa ligne) son débit (150/250/350/500 L/min), son jet (droit, diffusé, protection), son ouverture et sa position (clic sur le binôme, ⌖ Déplacer, 45 m de tuyaux max).
- CCF : quatre personnels, maximum deux lignes, débit plafonné à 250 L/min.
- Noria : CCF et FPT peuvent ravitailler un autre engin sur un feu, puis refaire le plein au poteau.
- SMUR : moyen autonome du CH. Le joueur peut notifier la régulation, jamais commander son engagement, son placement, ses signaux ou son retour. SMUR 1 reste le pick-up ; SMUR 2 est une ambulance de réanimation avec soins et transport autonomes. La décision médicale, les renforts pour plusieurs victimes graves, la file si occupé et le retour physique au CH sont automatiques. Les équipes prennent en charge des victimes distinctes et ne deviennent disponibles qu’après leur retour.
- PS : `kind:'VSAV'`, `firstAid:true`, six personnels, 880 L, petits feux extérieurs autorisés puis rangement avant soins/transport. Pas d'attaque bâtiment/forêt/batterie, ni de double affectation d'équipage.
- PC : un seul essieu arrière. VPCE : tandem conservé. FPT : rampe arrière supprimée, rotatif au coin.
- Gilets par fonction : commandant blanc, chef d'agrès jaune, équipiers orange ; galons liés au roster réel.
- Intervention rouge, transport CH bleu, « Disponible CIS » vert. Ne pas remettre l'équipage détaillé dans la vue intervention.
- Alerte d'effectif : attendre 15 secondes de temps réel après le dernier départ ; annuler une alerte devenue sans objet si l'effectif remonte.
- Personnel : la tenue d'intervention est portée avant la marche du vestiaire à l'engin. Le chef d'agrès EPA ne porte pas d'ARI ; l'EPA possède un rotatif au coin arrière.
- VLCG : un seul véhicule physique alterne entre remise et petit parking de cour au calme, avec conducteur réel, trajet et priorité aux interventions ; conserver le stationnement à la reprise de garde.
- Gyrophares des engins du CIS : commande manuelle libre à l’arrêt, y compris pendant la préparation d’un départ. Un engagement conserve un allumage manuel déjà choisi.
- Accès fermé : ouverture réservée à un VTU, FPT ou VSR présent avec au moins deux personnels. Le VSAV et les moyens médicaux attendent l’ouverture. Un renfort équipé peut être engagé après reconnaissance ; une équipe en route ou un ancien ordre VSAV ne peut pas ouvrir à distance.
- Alerte générique « Situation non stabilisée » supprimée, ainsi que son rappel radio avant arrivée. Les anciens libellés sont retirés à la reprise des sauvegardes.
- Les liens d’épisodes restent internes à la simulation : pas de badge « Épisode 1/2 » ou « 2/2 », ni de mention dans la fiche ou d’annonce radio dédiée.
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
