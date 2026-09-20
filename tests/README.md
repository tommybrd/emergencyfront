# Vérifications de Valmont

Les scénarios utilisent la géométrie Three.js réelle. Le rendu WebGL et le DOM sont remplacés pour les tests automatiques : ils ne mesurent pas les FPS de la carte graphique et ne remplacent pas le contrôle visuel.

```sh
node tests/traffic-control.mjs
node tests/incident-events.mjs
node tests/hose-deployment.mjs
node tests/incident-location.mjs
node tests/incident-catalog.mjs
node tests/reinforcement-alerts.mjs
node --experimental-loader ./tests/runtime-loader.mjs tests/traffic-integration.mjs
node --experimental-loader ./tests/runtime-loader.mjs tests/rescue-integration.mjs
node --experimental-loader ./tests/runtime-loader.mjs tests/catalog-integration.mjs
node --experimental-loader ./tests/runtime-loader.mjs tests/water-rescue-integration.mjs
node --experimental-loader ./tests/runtime-loader.mjs tests/beach-integration.mjs
node --experimental-loader ./tests/runtime-loader.mjs tests/nursing-integration.mjs
node --experimental-loader ./tests/runtime-loader.mjs tests/fleet-layout.mjs
node --experimental-loader ./tests/runtime-loader.mjs tests/fire-water.mjs
node --experimental-loader ./tests/runtime-loader.mjs tests/audit-regressions.mjs
```

- **Circulation** : dix départs simultanés, retours croisés avec un nouveau départ, seconde sortie des poids lourds, pistes forestières et réengagement du CCF 8000 pendant la marche arrière. Chaque pas vérifie les collisions et interdit tout repositionnement de secours. Relancer avec `TEST_SEED=1`, `7`, `12`, `23`, `101`. Les destinations explicites du scénario remplacent aussi les accès routiers générés aléatoirement.
- **Secours** : reconnaissance, complications, attente de mise en sécurité, transport et fermeture seulement après extinction et évacuation. VPL : départ, phases du bateau, VSAV, CH et retour. VLI : infirmier dédié, soins et transport réservé au VSAV.
- **Plage** : horaires des baigneurs et appels, victimes sur le sable, soins sur place, noyade dans la zone de baignade, attente des secours sur la berge, demande de plongeurs, bateau au contact, relais infirmier et VSAV, dépôt au CH et retour des trois véhicules sans chevauchement.
- **Flotte** : 14 véhicules actifs, côtés VLI / VPL, FPTL, CCF 3, dimensions, sorties et retours.
- **Hydraulique** : consommation ralentie ×6, coupure à sec, établissement avant débit, repli et interruption. Le test d’audit vérifie également le délai de 20 secondes du raccordement au poteau.
- **Audit** : durée de garde, densité après interventions reçues, portes VSAV au chargement et au CH, mât replié, lumières éteintes, état du feu après coupure d’eau, alertes de renfort couvertes par les moyens mobilisés, maintien de la voie et libération des effets terminés.
- **Performance** : les cinq lances utilisent toujours les mêmes dix géométries de tuyau et de jet, au lieu de les recréer à chaque image. Le test vérifie aussi que leurs coordonnées restent finies.

Le test historique `tanker.mjs` concerne un ancien mécanisme CCGC qui n’est plus appelé par le jeu.

- **Motifs** : 196 lignes originales (85 + 111), cinq colonnes territoriales conservées pour le SDIS 31, sources valides pour les 48 missions, 200 000 tirages jour/nuit, limites de densité, victimes cohérentes. Les 48 scènes sont instanciées, puis une fausse alarme, un feu confirmé après levée de doute et un relevage sans transport sont joués jusqu’au bout.


`player-profile.mjs` (avec `runtime-loader.mjs`) vérifie les choix et leur persistance, la tenue des deux personnages, le véhicule dédié, les signaux lumineux, la pause du formulaire, deux trajets complets sans chevauchement et les changements différés jusqu’au retour en remise.

`player-home.mjs` (avec `runtime-loader.mjs`) simule le domicile de nuit : trajets, sommeil, disponibilité hors CIS, réveil et embarquement, départ annulé, réengagement et retour matinal, sans collision ni téléportation.

`volunteer-travel.mjs` vérifie les trajets physiques jour / nuit, le rappel général des 37 SPV, le stationnement, les vestiaires, le retour à domicile et l’annulation, sans chevauchement.

`next-call.mjs` vérifie le prochain appel manuel pendant les missions sans avancer l’horloge ni dépasser la densité prévue.

`ambulance-mission.mjs` suit deux victimes jusqu’à leur remise au CH et le retour des VSAV sans collision. `TEST_VSAVS=4` couvre les quatre ambulances simultanées ; les objectifs sur place restent indépendants du transport.

`tactical-placement.mjs` vérifie les réservations distinctes FPTSR/EPA, le maintien du délai d’embarquement, le déplacement sur place, les blocages pendant l’utilisation de matériel ou les soins et les retours sans chevauchement. `reactive-traffic.mjs` vérifie le dégagement progressif, le refus d’un bas-côté occupé ou avec un piéton, le passage d’un convoi et la reprise de la voie de droite, y compris si la mission urgente est annulée.


`radio-voice.mjs` vérifie l’activation après un geste utilisateur, la priorité des demandes urgentes, la file bornée, l’expiration, les doublons, la pause, le silence et l’absence de synthèse vocale. `scene-perimeter.mjs` vérifie la pose progressive, les déviations, les piétons, l’accès des secours et la réouverture après repli. `incident-aftermath.mjs` vérifie les traces localisées, les épaves comme obstacles puis leur retrait, le retour des riverains, l’absence de dégâts sur fausse alarme et le nettoyage mémoire sans détruire les matériaux partagés.

`perimeter-integration.mjs` joue un accident avec deux victimes : FPTSR et premier VSAV, une voiture déjà engagée sur la voie qui attend plus de vingt secondes, puis un second VSAV en renfort. Contrôle des collisions à chaque pas, refus des repositionnements forcés, fin de mission, remise au CH, repli des cônes et retour au CIS.

`building-actions.mjs` vérifie les accès au point de regroupement dans les différents quartiers, les commandes après reconnaissance, les équipes réellement présentes, les ordres répétés, le retrait d’une équipe, l’évacuation sans victimes inventées, les coffrets d’énergie, l’attente de fin de mise en sécurité et le nettoyage des personnages temporaires.

`road-clearance.mjs` joue une collision jusqu’au CH et au retour CIS, puis deux rotations de dépanneuse avec les épaves d’origine, les agents et le nettoyage progressif. La chaussée reste balisée jusqu’au dégagement ; chaque pas contrôle l’absence de chevauchement et de repositionnement forcé. `TEST_TARGET='70,-60'` contrôle une rue courte ; `TEST_TARGET='20,194'` un secteur du boulevard courbe.

- `field-controls.mjs` : stationnement proche, distance routière, volume hors champ, format radio, casques SAP, feux du FPTL, halo orange, dévidoir/équipiers, faces des tuyaux, rappels à deux niveaux, priorité au premier véhicule d’une file et attente avant un virage obstrué.
