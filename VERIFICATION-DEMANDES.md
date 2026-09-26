# Vérification des demandes — 20 septembre 2026

Cette revue distingue les fonctions intégrées des limites de la simulation. Les propositions non choisies restent dans ROADMAP.md ; elles ne sont pas présentées comme réalisées.

## Engins, caserne et eau

| Demande | Résultat |
|---|---|
| Composer sa caserne | Menu Composer : véhicules, places, équipements, signalisation et effectif de garde. Actualisation des engins disponibles en remise ; changement différé pour ceux engagés. |
| Trois camions forestiers | CCFL 2 000 L / 3 personnels, CCFM 4 000 L / 4, CCFS 8 000 L / 4. CCFL plus court ; CCFS châssis long. Allures distinctes. Les volumes et équipages sont des choix de jeu. |
| Noria | Commande CCF : transfert vers un engin proche, trajet au poteau réel accessible, établissement, remplissage, repli et retour au feu. Eau conservée, arrêt possible. |
| Retour citerne vide | Interdiction de réengager un engin sans eau. À l’arrivée : raccordement, remplissage progressif et rangement avant disponibilité. Tuyau et opérateur visibles, jauge actualisée. Le complément est également fait sur une citerne partiellement remplie. |
| Raccordement fictif | Poteau présent, accessible et disponible requis. Pas de raccordement sans point d’eau. Aspiration au lac distincte, avec installation. |
| Dévidoirs | FPTSR : deux dévidoirs portés ; FPTL : un. Chariot d’établissement visible, retrait du dévidoir porté pendant son emploi. Arrière du FPT avec coffre, pompe, raccords et marchepied. |
| VSAV supplémentaire | MAN TGE en complément du VSAV cellule. |
| Apparence | Arrières VSAV/VTU et chevrons revus ; pare-chocs avant retravaillés ; pick-up double cabine inspiré du Hilux pour le chef de garde. |
| Signalisation | Gyrophares rotatifs réduits ; CCF à gyrophares ronds uniquement, avec pénétration avant ; pas de flash latéral VSAV ; petit gyrophare bleu sur le bateau. |
| Indisponibilités | Pannes ou maintenance occasionnelles sur engin libre, durée affichée ; pas d’interruption d’une intervention en cours. |

## Intervention et circulation

| Demande | Résultat |
|---|---|
| Actions visibles | Commandes pertinentes dans la fiche intervention, ouverture de la commande du véhicule ; clic sur un engin ouvre sa fiche. |
| Lance à mousse | Commande visible sur fourgon, avec explication si indisponible. Utilisable après reconnaissance sur les scénarios compatibles, avec émulseur et consommation d’eau. |
| VSAV sur feu | Engagement préventif possible, même avant confirmation de victimes. |
| Difficulté du feu | Feu développé de bâtiment plus résistant, tenant compte du niveau maximal atteint ; progression forestière accélérée et zone visuelle étendue. |
| EPA | Mise en place, montée, transfert visible de la victime, descente et relais au sol ; cadrage du sauvetage. |
| VLI | Attend le VSAV chargé, se place en tête puis adapte son déplacement à son partenaire ; arrivée au CH et retour gérés. |
| Stationnement | Préférence renforcée pour le côté du sinistre, sous réserve de place et de dégagement ; manœuvres routières conservées. |
| Blocages | Arbitrage des carrefours et files, protection du convoi VLI/VSAV ; récupération des civils/SPV bloqués ; commande de déblocage des engins. |
| Police | Deux patrouilles autonomes ; déplacement vers les accidents, policiers visibles, reprise de patrouille après libération des lieux. |
| Victimes | Ascenseur pouvant contenir une victime ; désincarcération parfois nécessaire sur accident ; marche accompagnée lorsque le bilan le permet. |
| Bâtiments | Ventilation après maîtrise du feu, coupures et évacuation selon les actions disponibles. |

## Interface et radio

- I02 nettement mis en avant dans la liste comme dans la fiche détaillée.
- Libellés courts : Transport CH et Retour CIS ; transport bleu, nombre de victimes sans détail encombrant.
- Équipages visibles sans clic : identité, grade et galon redessiné ; chef d’agrès repéré.
- Bilan des moyens après reconnaissance : suffisants, renfort nécessaire ou renfort engagé ; demande de renfort signalée visuellement.
- Astreinte et Rappel général directement accessibles : un clic déclenche le rappel.
- Nombre d’interventions et intensité de la journée dans le menu : Trop calme à Très intense. Score d’activité, pas une note de qualité des secours.
- Prochain appel avance le temps jusqu’à l’appel prévu et reste bloqué tant qu’une intervention est ouverte.
- Garde poursuivie en arrière-plan ; pause manuelle conservée.
- Communications courtes avec unité et intervention ; échange CIS/véhicule lors d’un nouveau départ pendant un retour.
- Pas d’annonce vocale des nouvelles interventions, ni d’arrivée au CH ; retour annoncé sans « réengagement possible ».
- Caméra au départ et suivi, distance restante, atténuation des sirènes selon distance et présence dans le champ.

## Vie de la garde et planning proposé

| Horaire | Activité dans le jeu |
|---|---|
| 06 h–08 h | Petit-déjeuner et préparation |
| 08 h–08 h 30 | Relève |
| 08 h 30–08 h 45 | Rassemblement et briefing |
| 08 h 45–10 h | Vérifications des véhicules et du matériel |
| 10 h–12 h | Sport : déplacement en ville et football au stade |
| 12 h–14 h | Repas |
| 14 h–18 h | Manœuvres et entretien |
| 18 h–19 h | Sport au centre |
| 19 h–21 h | Repas |
| 21 h–22 h | Repos |
| 22 h–06 h | Repos nocturne, départs toujours possibles |

Les appels interrompent les activités ; les personnels rejoignent l’engin depuis leur position. Le rassemblement et les vérifications sont visibles. Cette trame est à recaler ensemble : les horaires varient selon les centres. La [Compagnie de Nice](https://www.pompiersnice.fr/blog/actualites/manoeuvregarde.html) décrit notamment des manœuvres de garde quotidiennes ; il ne s’agit pas d’un planning national imposé.

## Limites explicites

- Modèles 3D stylisés : casque inspiré du F1, pick-up inspiré du Hilux et voiture de police simplifiée, sans reproduction constructeur exacte.
- Football et vérifications sont des animations d’ambiance, pas une simulation de match ou un contrôle technique détaillé.
- La propagation forestière n’intègre pas encore une carte de combustible, le vent ou la météo. Les paramètres d’extinction, remplissage et disponibilité sont réglés pour le jeu.
- La préférence de stationnement ne garantit pas une place du côté souhaité si des obstacles la rendent impossible.
- Un navigateur ou un ordinateur suspendu ne garantit pas une simulation continue ; l’arrière-plan ne remplace pas une sauvegarde de garde.
- Sauvegarde/reprise d’une même garde, météo et mode entraînement restent des propositions non réalisées, identifiées dans ROADMAP.md.

Les vérifications couvrent notamment les missions complètes, les trajets et collisions, le transport et l’escorte, l’établissement hydraulique, la noria, le retour à citerne vide, la composition et l’interface. Les contrôles visuels portent sur les engins, les galons, les casques, les activités et les commandes.

## Corrections complémentaires

- Gyrophares individuels carrés supprimés aussi sur EPA et citernes : formes rondes, rampes conservées.
- Engagement protégé contre une reconstruction du bouton pendant le clic ; essai navigateur avec actualisation forcée et départ au premier clic.
- VSAV cellule : flanc redessiné, porte séparée, grande vitre, marquages sans chevauchement, protections de caisse et passages de roue.
- Arbres décoratifs comme forestiers filtrés pour dégager routes, trottoirs et pistes.
- Équipes SAP courantes sans casque ; protection conservée sur les scènes exposées et en nacelle.
- Indication décorative de batterie 12 V retirée.
- Bilan de garde : compteur, tracé discret et cinq paliers colorés ; score numérique masqué.

## Contre-vérification du 26 septembre 2026

Revue du code actuel, des demandes successives et de la copie publiable. Les corrections ultérieures priment sur les formulations précédentes : le ZIP VSAV sert de référence de conception, le mode nuit baisse le volume, et les équipiers VSAV/VTU restent sans casque ni ARI. « Intégré » décrit un comportement présent ; cela ne vaut pas validation esthétique du joueur.

| Demandes complémentaires | État et preuve |
|---|---|
| ZIP comme référence, modèle original maîtrisé | Intégré : import et GLB retirés de dist ; carrosserie originale, cabine galbée, passages de roues, capot et jantes repris dans models.js. Environ 5 300 triangles avec portes et pénétration. Rendu avant/arrière contrôlé le 26 septembre. |
| VSAV Renault fourgon en plus du cellule | **À faire** : Composer propose VSAV cellule et MAN TGE, pas une troisième variante Renault fourgon. |
| VSR et Hilux chef de garde | Intégrés dans le catalogue et models.js ; le VSR participe à la désincarcération. Niveau de finition à apprécier en jeu. |
| Nom et écusson du CIS sur toute la flotte | **Partiel** : CIS Valmont sur le nouveau VSAV ; aucune application uniforme d'un écusson original à tous les véhicules. Des mentions SDIS 41 / VTU 41 subsistent. |
| Casques adaptés | Tests scene-geometry : VSAV et VTU sans casque/ARI ; CCF avec casque forestier. Les autres interventions conservent le casque F1 stylisé. |
| Sirène, nuit et sourdine | audio.js utilise le même fichier jour/nuit ; volume réduit à 42 % entre 21 h et 7 h. Bouton principal sourdine ; réglages dans Configuration. **Écart de distribution** : l'export GitHub génère toujours une sirène synthétique, contrairement au site Sites qui utilise le MP3 existant. |
| Brief conditions du jour et retour après Composer | shift-briefing.js : conditions, effectif +/−, capitaine et infirmier inclus, moyens configurables ; station-menu.js propose Enregistrer et revenir au brief. Pas de récit de la veille dans le brief. |
| Horloge et prochain appel | Horloge CIS, téléphone avec avance rapide dans Interventions, sans ancien bandeau 8 h–8 h. L'aide contient encore l'explication des horaires. |
| Vie de caserne, rassemblement, sport, manœuvres | Intégrés, départs possibles pendant les activités. Lit de 2,9 unités et personnage d'environ 1,9 dans un dortoir avec murs/toit ; animations simplifiées. |
| Pas de barre de défilement des moyens | Mise en page compacte avec overflow:hidden et adaptations de hauteur. **À revalider visuellement** aux tailles d'écran du joueur : masquer le débordement ne prouve pas que tout tient. |
| Engagement dès le premier clic | Test ui-input : les rafraîchissements ne retirent plus le bouton pendant le clic. |
| Astreinte : état et double rappel | Tests field-controls / reinforcement-alerts : état du rappel, doublons empêchés et disponibilité des actions. |
| Intervention : numéro, équipage, actions, moyens engagés, bilan | Intégrés dans scene.js, crew-identity.js, vehicle-console.js et day-summary.js ; appréciation graphique à confirmer. |
| Extinction et reprise, effectif par binôme | nozzleLimit soustrait les personnels déjà occupés et limite les lances par binôme. Reprise d'intensité et résistance des feux développés présentes ; tests fire-water / guard-life. |
| Noria réaliste et retour sans eau | Tests noria / station-refill : installation, trajet, conservation d'eau, remplissage au CIS et indisponibilité. |
| Escorte VLI et sauvetage EPA | Tests vehicle-care / aerial-integration : synchronisation du transport grave et animation stabilisation/montée/descente/transfert. |
| Police autonome et trafic avec gyrophares | police.js / reactive-traffic.js / traffic-control.js : patrouilles, accidents, priorité et dégagement. Les conflits restent arbitrés ; les collisions ne sont pas volontairement autorisées. |
| Déblocage radical après une longue attente | Intégré : après 75 secondes de blocage persistant, retour de sécurité au CIS et reprise du départ si nécessaire ; transfert de sécurité au CH pour un transport. Certaines attentes protégées (escorte, passage caserne) sont exclues. Le déplacement automatique intermédiaire après 20 secondes est supprimé pour les engins le 26 septembre ; déblocage manuel conservé. |
| Radio CH, retour, moyens suffisants, dépanneuses | Bilans regroupés, pas d'annonce d'arrivée au CH ; retour CIS. Le dépannage conserve un état textuel dans la fiche. Le retour externe peut encore mentionner son CH/base. |
| LED réalistes et aucun gyrophare individuel carré | Signalisation dédiée, petits rotatifs CCF et bateau ; rampes distinctes conservées. Tests de géométrie et d'effets présents ; qualité lumineuse et proportions restent une validation visuelle. |
| Présentation courte et identité personnelle | README public raccourci le 26 septembre : pitch, gameplay et Issues. Mentions personnelles retirées des modèles de publication. L'adresse du site reste celle de l'hébergement existant. |
| Tout commité et en ligne | Commit local vérifiable ; la réussite de publication doit être confirmée par Sites. La publication Sites ne constitue pas un push vers GitHub. |

### Portée des vérifications

La suite complète comporte 46 scénarios, complétés par le contrôle du HTML autonome et une mission sanitaire exécutée avec ses modules intégrés. Elle couvre la simulation, pas la qualité esthétique ni les FPS. La revue ne transforme pas les propositions non choisies de ROADMAP.md en demandes réalisées. Sauvegarde de garde, carte physique de propagation et mode entraînement restent hors des fonctions actuellement intégrées.

Résultat exécuté le 26 septembre : **46 scénarios réussis**, contrôle du HTML autonome réussi et mission de deux VSAV réussie avec les modules embarqués. Échec initial de tactical-placement corrigé dans scene.js : aucun saut automatique sur le trajet des engins après 20 s ; retour de sécurité explicite conservé à 75 s. La suite complète a été relancée après cette correction et termine sans erreur.


## Lot de finalisation — 26 septembre 2026

Les points ci-dessous remplacent les réserves de la contre-vérification précédente.

- Renault Master fourgon ajouté à Composer, en complément du cellule et du MAN. Carrosserie originale avec pavillon intégré, flancs tôlés, porte coulissante, grilles sanitaires, bouclier fluorescent et chevrons. Numérotation VSAV commune ; transport et portes arrière conservés. Sélection, remplacement en remise et persistance contrôlés dans le navigateur.
- Écusson original CIS Valmont et inscription commune sur les deux côtés des engins du CIS. Suppression des anciennes mentions SDIS 41 et VTU 41 des véhicules. Police et SAMU gardent leur identité propre ; la voiture de service banalisée reste sans marquage.
- Bouclier, calandre et optiques des Renault fourgon et cellule repris ; contrôles visuels avant/arrière, cellule et CCF. Les images restent une proposition artistique, pas une validation esthétique du joueur.
- Panneau des moyens dimensionné selon le nombre réel de rangées. Vérifié dans Chromium à 1366×768, 1280×720 et 1024×768 : 13 engins visibles, aucun débordement vertical. L'effectif détaillé reste accessible dans la fiche véhicule.
- Export GitHub et HTML autonome : le MP3 du deux-tons est désormais conservé à l'identique. Aucun remplacement synthétique automatique ; générateur alternatif conservé. Les crédits distinguent ce média fourni de la licence du code.
- Stationnement EPA : priorité aux positions à portée du fourgon de la même intervention, sans supprimer les contrôles de portée de l'échelle, d'obstacles et de manœuvre. Un scénario révélait une distance de 60,5 m pour un tuyau limité à 60 m ; le placement a été corrigé sans rallonger artificiellement le tuyau.
- Police : couverture automatique des accidents et incendies simultanés, renforts autonomes et affectation conservée après repositionnement. Statut visible dans la fiche intervention.
- Deux-tons réglable par véhicule : Auto / Jour / Nuit, même mélodie, niveau réduit la nuit.

Les propositions non choisies (sauvegarde/reprise, météo physique, entraînement, etc.) restent dans ROADMAP.md. Ce lot ne les implémente pas.

Validation finale du lot : **47 scénarios réussis**, HTML autonome validé, mission sanitaire mixte Renault Master / VSAV cellule terminée jusqu’au CH et au retour CIS dans les modules normaux et embarqués. Contrôles Chromium : rendu avant/arrière, sélection réelle dans Composer, remplacement immédiat, persistance après rechargement et trois résolutions d’écran. Deux-tons identiques vérifiés par SHA-256.


## Lot v83 — extension autorisée et nouveaux engins

Les mentions précédentes « non choisies » sont historiques : le lot suivant a été autorisé par « vas y enchaine tout ». Voir ROADMAP.md pour la portée et les simplifications.

- 48 scénarios passés dans l’export public, contrôle du HTML autonome et mission sanitaire avec les modules embarqués réussis.
- Nouveau scénario : géométries avant/arrière indépendantes, contrainte CCF, configuration persistante, journées reproductibles, entraînement, graphe de sauvegarde cyclique, restauration de mission, recherche et sauvetage animalier.
- Contrôle Chromium : changement réel des deux technologies dans Composer, enregistrement, mission engagée, sauvegarde puis rechargement réel, état et paramètres restaurés ; choix d’entraînement transmis au redémarrage. Aucune erreur JavaScript observée.
- PC et VPCE : modèles distincts examinés en rendu ; six roues, signalisation et identité CIS. Tests de choix dans le catalogue, longue alimentation hors portée normale, attente avant arrivée d’eau, rangement avant libération du porteur.
- Sauvegarde dans le navigateur uniquement : effacer les données du navigateur supprime la partie enregistrée. Le rejeu reprend les mêmes appels et placements, pas un enregistrement vidéo déterministe de tous les civils.
