# Reprise dans ChatGPT cloud — Emergency.io / Valmont

État vérifié le **3 octobre 2026**. Version jouable **107**. Ce document décrit la reprise du dépôt public ; il remplace les anciennes listes de conversation pour l'état des travaux.

## Dépôt et versions

- Dépôt à ouvrir dans l'environnement cloud : **https://github.com/tommybrd/emergencyfront**, branche `main`.
- Jeu GitHub Pages : https://tommybrd.github.io/emergencyfront/
- Jeu Sites actuellement publié : https://blois-garde-operationnelle.tommybrd.chatgpt.site/
- Dernier changement de jeu avant cette transmission : commit public `bf6b89ce59e8fc1571fc937f48ca05b6229c9247`, optimisation graphique v107. La transmission ajoute ensuite de la documentation et des outils, sans changement de gameplay.

Le code, Three.js, les sons utilisés, les tests et les scripts nécessaires sont dans ce dépôt. Aucun dossier du Mac, téléchargement de modèle 3D, secret Sites ou fichier de conversation n'est nécessaire pour reprendre. Les modèles du jeu sont procéduraux et originaux. Les photos fournies ont servi de références visuelles ; elles ne sont pas des assets à importer.

Lire également [AGENTS.md](AGENTS.md), [ROADMAP.md](ROADMAP.md), [VEHICLE-BASELINES.md](VEHICLE-BASELINES.md) et [VERIFICATION-DEMANDES.md](VERIFICATION-DEMANDES.md). Les dernières instructions du joueur priment sur la documentation.

## Démarrage dans le cloud

Projet statique en JavaScript ES modules, HTML, CSS et Three.js local. **`dist/` contient les sources éditables**, malgré son nom. Pas de framework, backend, bundler ou installation npm nécessaire. Utiliser **Node.js 24 ou plus récent** et Python 3.

Depuis la racine du dépôt :

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Ouvrir `http://127.0.0.1:4173/` dans le navigateur de prévisualisation disponible. Si l'environnement cloud impose une autre interface ou un proxy de port, adapter l'écoute selon ses instructions. Pour jouer par double-clic, utiliser `Jouer-Valmont.html` ; ce fichier est généré et ne doit pas être modifié à la main.

```sh
# Contrôle rapide de syntaxe, imports, ressources et audio
node scripts/check.mjs --static-only

# Exemple de scénario ciblé, avec le chargeur de test
node --no-warnings --experimental-loader ./tests/runtime-loader.mjs tests/first-aid.mjs

# Après modification des sources : cache public, HTML autonome et manifeste
python3 scripts/prepare-release.py

# Suite complète, également utilisée par GitHub Actions
node scripts/check.mjs
```

La suite complète peut prendre plusieurs minutes. Pour une correction, commencer par les scénarios concernés. Pour une modification visuelle, faire aussi une vérification WebGL dans un vrai navigateur ; les tests automatiques remplacent le DOM et le rendu. Ils ne prouvent ni les FPS ni la qualité visuelle.

Autres outils : `scripts/build-standalone.py` génère seulement le HTML autonome ; `scripts/generate-siren.py` est une alternative synthétique au deux-tons existant. Ne pas remplacer le son livré sans demande.

## Où travailler

| Sujet | Principaux fichiers dans `dist/` |
| --- | --- |
| Boucle de jeu, scène, interface, orchestration | `scene.js`, `sim.js`, `index.html`, `style.css` |
| Horloges et rythme adaptatif | `simulation-clock.js`, `dispatch-distance.js`, `defense-sectors.js` |
| Modèles, livrées, lumières, roues, galons | `models.js`, `vehicle-livery.js`, `signalling.js`, `rotary-beacons.js`, `wheel-motion.js`, `crew-insignia.js` |
| Deux CIS, Composer, garages et vie de caserne | `station-config.js`, `station-menu.js`, `station-layout.js`, `station-live.js`, `station-spaces.js`, `garage.js`, `station-life.js` |
| Personnels et renforts SPV | `crew.js`, `crew-config.js`, `staff-status.js`, `reinforcements.js`, `volunteer-station.js`, `volunteer-travel.js`, `volunteer-models.js` |
| Engagements, PC et VPCE | `operations.js`, `command.js`, `means-assessment.js`, `incident-coordination.js`, `support-console.js`, `support-vehicles.js` |
| Eau, lances, alimentation, noria | `hydraulics.js`, `water-supply.js`, `supply-crew.js`, `station-refill.js`, `noria.js`, `foam.js` |
| Victimes, VSAV/PS, CH et infirmier | `patient-health.js`, `nursing.js`, `ambulance-loading.js`, `hospital-reception.js`, `hospital-routing.js` |
| EPA et secours spécialisés | `aerial-operations.js`, `aerial-visuals.js`, `water-rescue.js`, `extrication.js` |
| Ville, rivière, routes, trafic, stationnement | `city-layout.js`, `city-scenery.js`, `river-layout.js`, `river-scenery.js`, `roads.js`, `route3d.js`, `parking.js`, `tactical-placement.js`, `reactive-traffic.js` |
| Feux et incidents | `incident-catalog.js`, `incident-events.js`, `incident-life.js`, `forest-fire.js`, `incident-state.js` |
| Rendu et mémoire | `batching.js`, `dynamic-tube.js`, `dispose.js`, `response-visuals.js`, `effects.js`, `scene-lighting.js` |
| Garde, profil et diagnostic | `guard-features.js`, `guard-campaign.js`, `guard-save.js`, `player-profile.js`, `debug-report.js` |

`scene.js` reste volumineux. Chercher d'abord la responsabilité dans les modules existants ; éviter une refonte générale pour une petite demande.

## Ce qui est livré

- Deux centres : **CIS Centre** et **CIS Sud**, accès en haut, flotte des deux centres à droite, composition et sauvegarde indépendantes. Sud accueille les volontaires avec VSAV, FPTL et CCFM.
- Rappel SPV avec bip, départ du domicile ou du travail, trajet vers le CIS, vestiaires, embarquement ; possibilité de libérer les équipes. Remobilisation pendant le retour du véhicule et le retour des volontaires chez eux.
- Grande cour du CIS Centre, garages face à la cour, séparation SAP/incendie-appui, tour, dortoir intérieur, clôture, portail automatique et gyrophare orange. Volets roulants animés avec le nom des véhicules.
- Ville complétée, pâtés limités à quatre bâtiments, routes et accès à la rocade ; deux quartiers séparés par la **Valme**, ponts routiers/piétons et secteurs de défense correspondant aux rives. Forêt agrandie avec pistes.
- Santé individuelle des victimes avec cœur/jauge dans les interventions, soins, aggravation, stabilisation et issue DCD distincte. EPA avec sauvetage en étage et transfert depuis un sauvetage intérieur, désincarcération, nautique, transport au CH.
- Placement manuel sur intervention : commandes du véhicule, **« Placer sur la carte »**, clic sur une destination ; trajet réel et mission conservée. Ranger le matériel avant déplacement. Cette feature est déjà développée.
- PC avec bilan des besoins, présents, mobilisés, manques et affectations de secteurs. VPCE avec berce, dépose, alimentation longue distance, rangement et reprise. VSR avec touche du panneau de signalisation dans le boîtier des lumières.
- Livrées **Service / Rouge uni** par véhicule, pour les deux CIS, et choix de gyrophares. Application différée si l'engin est engagé. Roues animées, plaques, optiques, rétroviseurs, feux de pénétration, bleu plus profond et séquences LED variées.
- Vie de caserne, tests matinaux des signaux et de l'EPA, entraînement, briefing, bilan de garde, sauvegarde/reprise locale, mode adaptatif, diagnostic Debug à copier-coller.
- Commande **« Intervention bloquée ? » → « Abandonner et libérer les moyens »** : retour à la base, plein à compléter si nécessaire, aucune fausse réussite ni victime secourue fictivement.

### Premier Secours et PC : dernier lot véhicule v106

Le **PS inspiré du Premier Secours évacuation BSPP 6e génération** est déjà implémenté. Composer le propose dans les places sanitaires du CIS Centre. En code : `kind: 'VSAV'`, `firstAid: true` ; `modelKey(e)` renvoie `'PS'`. Il garde la filière sanitaire existante et ajoute une capacité incendie contrôlée.

- Six personnels réels, citerne **880 L**, pompe **2 000 L/min**, LDT diphasique **110 L/min**, maximum deux lignes, aucune grosse lance.
- Petits feux extérieurs de poubelle, voiture et moto ; exclure bâtiments, forêt, véhicules électriques et batteries.
- Extinction puis rangement avant soins, chargement d'une victime et transport au CH. Pas de double affectation simultanée de l'équipage.
- Modèle original : double cabine, cellule sanitaire, toit blanc, volet jaune, pompe et dévidoir arrière, portes sanitaires animées, plaques, livrées et gyrophares.
- Le **PC a un seul essieu arrière** (quatre roues au total) ; le VPCE conserve son tandem.

Référence technique : [ALLO18 — PS 6e génération](https://allo18.fr/ps-6e-generation-1-3-un-engin-de-rupture/). Les caractéristiques et limites du jeu sont consignées dans les tests `first-aid.mjs`.

### Dernière optimisation graphique v107

- Regroupement des pièces fixes opaques compatibles par matériau et cellule de 80 m, avec conservation des positions, normales, UV, ombres et découpage spatial.
- Matériaux équivalents de panneaux partagés ; rails/barreaux EPA regroupés à l'intérieur de chaque section mobile.
- Suspension des transformations des équipes cachées, réactivation avec leur position courante.
- Ne pas figer les racines de véhicules ou les parties articulées, ni regrouper les objets transparents ou les pièces pilotées individuellement.

Mesure locale en vue CIS : viewport 1280×720, ratio 1,35, anti-aliasing et ombres PCF 2048 inchangés, 30 images de chauffe et 180 mesurées. Appels de dessin moyens : **6 740 → 6 230–6 265** (environ −7 à −8 %). Temps CPU du callback d'animation : **56,8 → 45,8–51,4 ms**. Géométries : **5 904 → 5 482** ; textures : 220, inchangé. Meshes EPA : 616 → 317.

Ces chiffres ne sont pas une mesure du temps GPU ni une promesse de FPS sur chaque machine. Une longue garde chargée et plusieurs interventions simultanées restent à profiler. Détails et scénarios dans [VERIFICATION-DEMANDES.md](VERIFICATION-DEMANDES.md) et `tests/render-batching.mjs`. Résolution et qualité n'ont pas été abaissées.

## Décisions à préserver

1. Références visuelles validées : **VSAV cellule/bloc, pick-up VLCG, famille CCF**. Préserver leurs silhouettes ; travailler surtout décoration, petits détails, thèmes et accessoires. Les autres familles restent dans la flotte.
2. Un seul modèle de **VSAV**. Anciens fourgons Renault/MAN retirés et configurations converties. Le PS est un nouvel engin hybride distinct. VLI sur la base VLCG.
3. **Voiture de service supprimée**. Ne pas réintroduire une deuxième voiture du chef.
4. CCF : quatre personnes, uniquement LDT et petite lance, deux lignes maximum (deux petites ou LDT + petite), jamais de grosse lance. FPTL et FPT ont des pompes distinctes : 1 000 / 2 000 L/min. Le binôme d'alimentation redevient disponible après raccordement.
5. Gilets selon la fonction : commandant blanc, chef d'agrès jaune, équipiers orange. Galons associés au personnel réel. Sac de secours rouge dans le dos ; bateau du VPL sur remorque.
6. FPT : **pas de rampe arrière**, gyrophare arrière au coin. Les rampes des autres familles ne sont pas concernées. Gyrophares bleus profonds et oranges cohérents, configuration un/deux rotatifs.
7. Couleurs : intervention rouge, transport/remise CH bleu, disponibilité au CIS verte avec **« Disponible CIS »** ; retour disponible vert clair. VSAV Sud disponible au CIS même si ses SPV rentrent chez eux.
8. Aucun zoom automatique au déclenchement. Aucun passage automatique en pause au changement de fenêtre ; la pause volontaire doit rester claire. Effectif détaillé uniquement dans la vue véhicule, pas répété dans l'intervention.
9. Garder la vitesse des véhicules satisfaisante du mode 24 min ; modifier l'horloge de garde séparément si le joueur demande un changement de rythme. Éviter de ralentir tous les déplacements pour rendre l'heure plus réaliste.
10. Un blocage imprévu doit pouvoir être déverrouillé simplement, même en abandonnant l'intervention ; préserver les issues honnêtes des victimes et de la garde.

Fonctionnalités **retirées ou reportées** : objectifs chronométrés arrivée/fin, départ conseillé, caméra thermique, relève, protection du voisin, coupe bâtiment, évacuation préventive et coupure gaz/électricité. Certains modules/tests subsistent pour la compatibilité ; leur présence ne justifie pas de réafficher ces commandes.

**Compteur de visiteurs/capitaines abandonné à la demande du joueur.** Ne pas ajouter de service de comptage, analytics ou backend pour cela.

## Ce qui reste à finir

La dernière demande avant ce transfert était un récapitulatif. Il n'y a pas de modification de gameplay commencée et laissée à moitié.

1. **Ville** : retours sur les rives, ponts, raccords de routes et animation horaire, puis finitions ciblées.
2. **Autres véhicules** : finitions selon les nouveaux retours du joueur, en conservant les bases validées.
3. **Personnalisation** : Service et Rouge uni sont livrés. Thèmes/livrées/accessoires supplémentaires ou éditeur libre restent à définir.
4. **Performance en charge** : profiler une garde longue et plusieurs interventions simultanées ; optimiser les coûts mesurés en préservant la qualité.
5. **Bugs reproductibles** : partir des étapes, captures et JSON Debug fournis ; tester la correction jusqu'à la fin de mission et au retour.

Propositions pour le PC, **pas encore développées ni validées comme prochain chantier** :

- Carte tactique : engins, lances, alimentations, secteurs assignés, victimes.
- Objectifs d'équipe : priorité/secteur par moyen et suivi de l'avancement.
- Journal de commandement : bilans, décisions, renforts et besoins non couverts.

La carte tactique a été suggérée comme prochain point de départ. Attendre la prochaine instruction du joueur pour fixer le chantier ; ne pas confondre ces idées avec le bilan PC et les secteurs déjà livrés.

## Git, déploiement et données locales

Ce dépôt est autonome. Le processus d'export privé utilisé sur le Mac n'est pas requis dans le cloud : **modifier directement ce dépôt public**, régénérer avec `scripts/prepare-release.py`, vérifier, puis committer. Ne pas réexporter une ancienne copie locale par-dessus les travaux cloud.

Les scripts n'appellent aucun service et ne publient rien. GitHub Actions contrôle le code et déploie `dist/` sur GitHub Pages après un push accepté sur `main`. Une branche/PR permet la revue ; une publication sur `main` suit l'autorisation du joueur. Éviter le force-push et préserver les contributions existantes.

**Un push GitHub ne met pas à jour automatiquement l'adresse Sites `chatgpt.site`.** C'est un hébergement séparé. Pour l'actualiser ensuite, utiliser son processus Sites autorisé depuis la nouvelle source ; ne pas inventer ni demander un secret si le travail porte seulement sur GitHub Pages. Tant qu'aucun nouveau déploiement Sites n'est effectué, cette adresse reste sur la v107.

Les sauvegardes de garde, le profil et Composer sont conservés dans le navigateur du joueur. Ils ne font pas partie de Git et ne migrent pas avec le code. Le cloud peut développer et tester avec une nouvelle garde. Ne pas vider les données du joueur pour tester ; utiliser un profil de navigateur de test séparé.

Les PDF/grilles SDIS intégraux, modèles de référence importés, captures de travail, historique privé et configuration d'hébergement ont été exclus du dépôt public. Les bibliographies, ressources exécutées et tests nécessaires y sont présents. Conserver ce périmètre et les notices de licence.
