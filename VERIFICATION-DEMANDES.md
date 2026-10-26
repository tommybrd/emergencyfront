# État des demandes et vérifications

État courant du 2 octobre 2026. Les anciens comptes rendus contradictoires ont été remplacés par ce résumé ; leur historique reste dans Git. La liste active des travaux est dans ROADMAP.md.

## Fonctions intégrées et contrôlées

- Garde : brief de conditions, réglage d’effectif incluant capitaine/infirmier, composition de flotte, rythme adaptatif, entraînement et sauvegarde locale.
- Renforts : équipes SPV, libération immédiate ou différée, arrivées visibles ; CIS Sud autonome avec trois engins.
- Caserne : grande cour de départ, façade unique avec neuf garages incendie/appui et cinq SAP, sorties directes et marche arrière limitée aux baies. Tour et dortoir intérieur conservés. Reprise des anciennes positions sauvegardées.
- Interventions : police autonome sur feux/accidents, victimes, CH, EPA, désincarcération, accès fermé, balisage, nettoyage et noria.
- Appuis : console PC avec bilan et secteurs ; console VPCE avec choix de liaison, dépose, alimentation et rangement.
- Hydraulique : FPTL 1 000 L/min, FPT 2 000 L/min dans le jeu ; CCFL/M/S à quatre personnels, deux petites lances ou une LDT et une petite lance, sans grosse lance. Eau partagée, débit nul à sec, plein au CIS avant disponibilité.
- Forêt : propagation entre arbres, chaleur, combustible fini et arbres consumés ; modèle de jeu simplifié.
- Apparence : galons liés aux identités, roues tournantes, chevrons découpés, feux bleus/oranges et réglages indépendants. Deux-tons nocturne identique mais moins fort.

## Références graphiques retenues

Le joueur a validé le VSAV cellule, la VLCG et les CCF comme références de finition. Le MAN et le Renault fourgon sont retirés du choix VSAV ; les anciennes compositions/sauvegardes utilisent la cellule et conservent les réglages de signalisation. Les silhouettes validées sont désormais des bases à préserver, conformément à VEHICLE-BASELINES.md.

## Sortie des blocages

Commande explicite dans la fiche d’une intervention : abandon, libération des équipages et repositionnement des engins à leur base. Les citernes incomplètes passent par le plein. Les déploiements, escortes et réservations sont supprimés. Les autres missions sont conservées. L’abandon ne crée ni victime secourue ni mission réussie ; il est identifié dans la chronologie.

## Portée des tests

La version v89 a passé 57 scénarios automatisés, le contrôle du HTML autonome et une mission sanitaire avec les modules embarqués. Les essais incluent des départs/retours simultanés, l’hydraulique, les sauvetages, les renforts et les sauvegardes. Contrôles visuels locaux de la caserne, de la VLI et des consoles PC/VPCE effectués.

Ces vérifications ne garantissent pas l’absence de tout bug ni une fréquence d’images sur tous les appareils. Les cas particuliers remontés par le joueur restent à reproduire ; l’abandon offre une issue immédiate.

## Optimisation v90

Regroupement des éléments fixes du bâtiment de vie en instances ; toit escamotable, ballon, matériel de manœuvre et personnels restent indépendants. Rendu et mises à jour visuelles suspendus lorsque l’onglet est masqué ; l’horloge de simulation conserve son fonctionnement en arrière-plan.

Mesure locale Chromium, même graine, caméra et résolution 1366 × 768 avec ratio 1,35 : appels de dessin moyens de 4 915 à 4 529 (−7,9 %), géométries de 5 893 à 5 653. Le temps de trame du navigateur de contrôle reste voisin de 480 ms : aucun gain de FPS significatif démontré dans cet environnement. Ne pas extrapoler ces mesures aux performances du poste du joueur.

Tests ajoutés : anciennes variantes VSAV converties en conservant les gyrophares ; abandon répété sans effet supplémentaire, matériels déployés remis à zéro, équipages libérés, citerne vide indisponible pendant le plein, autres missions préservées et absence de succès fictif.

Validation v90 : 57 scénarios réussis, ressources/syntaxe et mission sanitaire du HTML autonome validées. Après suppression du code des deux silhouettes retirées, contrôles géométriques et de signalisation réussis ; comparaison des géométries, transformations et couleurs avec v89 : VSAV cellule, VLCG et trois CCF inchangés. Contrôle Chromium : flotte intégralement cellule, ouverture du panneau de récupération et abandon réel au clic, sans erreur JavaScript.

## Correction v91 — lances des CCF

Nouvelle règle demandée : CCFL, CCFM et CCFS utilisent uniquement la LDT et les petites lances. Maximum deux lignes : deux petites lances, ou une LDT et une petite lance. Les quatre places d’équipage sont conservées ; deux opérateurs disponibles peuvent utiliser ces deux lignes dans le jeu. Les tâches annexes réduisent cette disponibilité. Aucune grosse lance dans la console ni dans les débits ; les anciennes commandes de grosse lance sont supprimées au chargement. Règles FPTL/FPT inchangées.

Tests ciblés : deux petites lances à 500 L/min, combinaison LDT + petite lance à 400 L/min, refus de grosse lance et troisième ligne, effectifs occupés, trois variantes de CCF dans la console, migration des sauvegardes.

## Évolution v92

Accès aux CIS Centre/Sud et moyens des deux centres visibles ; secteurs de premier appel consultables sur carte, distance routière avant engagement et horloge automatique (×10 en intervention, progression vers ×90 au calme, réglage manuel conservé). Diagnostic copiable sans profil personnel ni stockage navigateur. Rappel sonore des SPV des deux centres, trajets vers les vestiaires puis embarquement. Commandes avancées bâtiment et objectifs de délai retirés à la demande du joueur ; états anciens neutralisés à la reprise.

### Eau : petits feux isolés

Le GDO DGSCGC « Opérations de secours en milieu routier », juillet 2025, p.133, donne un débit minimal de 250 L/min pour l’attaque d’un véhicule, sans fixer un volume total universel. Source : https://www.sdis70.fr/ged/gdo-operations-milieu-routier-2025-dgscgc.pdf (copie consultable : https://concourspompiers.fr/assets/gdo/GDO-Op%C3%A9rations-de-secours-en-milieu-routier-juillet-2025.pdf). Aucun abaque officiel par poubelle identifié.

Valeurs propres au jeu : poubelle isolée 250–400 L, véhicule ordinaire 1 200–2 160 L selon le développement initial, à débit adapté et attaque continue. Les interruptions, reprises et débits excessifs augmentent la consommation ; la mousse peut la réduire. Ces valeurs ne s’appliquent pas à un local poubelles, un bâtiment ou une batterie de traction. Conservation des débits nominaux, du calcul de citerne et du rythme hydraulique existant (minutes de garde / 6).

Validation v92 : 57 scénarios de régression et le lancement autonome passent, auxquels s’ajoute le scénario secteurs/distances/temps/eau/SPV, également passé et intégré à la suite (58 au total). Contrôle dans Chromium des deux boutons CIS, de la copie du diagnostic et de l’absence des commandes retirées.


## Optimisation v107

Regroupement des formes opaques fixes compatibles dans des zones de 80 m, en conservant sommets, normales, UV, matériaux, ombres et limites de visibilité. Partage des matériaux identiques des panneaux et vitrages opaques. Chaque section de l’EPA conserve sa translation propre ; ses rails et barreaux sont instanciés. Les groupes visuels des équipes invisibles cessent de recalculer leurs transformations et reprennent leur position courante lorsqu’ils réapparaissent. Les racines de décor fixes ne recalculent plus leur matrice locale à chaque image. Les pièces référencées, articulées, transparentes ou portant des enfants sont conservées.

Mesure dans le navigateur local, caméra CIS et graine identiques, fenêtre 1280 × 720, ratio de pixels fixé à 1,35, anticrénelage et ombres PCF 2048 conservés. Chaque relevé comporte 30 images de chauffe puis 180 images mesurées, sans autre onglet de contrôle 3D. Les appels de dessin moyens passent de 6 740 à environ 6 230–6 265 (−7 à −8 %). Le temps CPU du callback animation/rendu passe de 56,8 ms à 45,8–51,4 ms selon le relevé (−10 à −19 %). Les géométries actives passent d’environ 5 904 à 5 482 ; les textures restent à 220. Le modèle EPA passe de 616 à 317 maillages, avec tous ses barreaux et articulations conservés.

Ces mesures incluent la soumission des commandes de rendu et les mises à jour périodiques des ombres. Elles ne constituent pas un chronométrage GPU ni une promesse de FPS sur tous les postes ; elles décrivent la scène CIS de contrôle, pas une garde entière ou tous les incendies.

Validation ciblée : conservation des triangles, normales, UV et limites géométriques, tri transparent, découpage spatial, pièces articulées, reprise des acteurs cachés, livrées, roues, signalisation, géométrie de scène, feu de forêt, manœuvres et sauvetage EPA, et mission PS complète (départ, extinction, rangement, transport CH, retour et plein). Contrôle visuel local de la caserne puis de l’EPA et des équipes sur un feu de bâtiment.

## Évolution v108

La ville reçoit deux promenades aménagées sur les quais de la Valme, avec garde-corps, bancs, panneaux et piétons actifs de 06 h à 23 h. Les cellules de regroupement des formes opaques fixes passent de 80 à 100 m. Sur la même caméra urbaine et le même rapport d’image, le relevé local passe de 1 791 à 1 541 appels de dessin (environ −14 %). La scène v108 contient en plus les nouveaux quais ; les triangles ne sont donc pas directement comparables. Le navigateur de contrôle utilise le rendu logiciel SwiftShader : aucune affirmation de gain de FPS n’est tirée de ce chronométrage.

Les contrôles ciblés couvrent les quais et leurs activités, le raccord arrière et le rideau de pompe, l’orientation transversale des dévidoirs CCF, la réduction des faisceaux, le déplacement très lent de tous les engins sur piste, le placement d’un VPCE sur chemin de terre, la priorité des secours au passage alterné, le ralentissement du feu de forêt et le saut probabiliste d’un brandon au-dessus d’une route. Ils vérifient aussi l’affichage compact par cœur, les soins sur place, le blocage du transport sous 80 / 100 et son départ au seuil, ainsi que le rappel raccourci du CIS Sud. La géométrie EPA contrôle les coffres hors passage de roue, les quatre ailes peintes, le berceau et les cinq sections articulées. La circulation teste l’anticipation d’un secours encore à 55 m du carrefour et la reprise de trajet de la dépanneuse.

## Évolution v109

Les conditions de garde partagent désormais un modèle d’effets opérationnels. La pluie réduit la vitesse et l’activité extérieure, la chaleur accélère légèrement la dégradation d’une victime sans soins, le vent renforce la propagation et l’affluence augmente la densité automobile et piétonne. Le brief annonce l’effet concret retenu.

Une intervention sans première arrivée évolue en deux étapes déterministes : alerte, puis conséquence propre à sa famille. Les journées marquées par la météo ou l’affluence regroupent deux appels dans un épisode lié sans augmenter la densité choisie. Les contrôles couvrent l’unicité des annonces, la propagation supplémentaire, l’aggravation sanitaire, l’extension d’un périmètre AVP, le rapprochement des deux appels, la densité du trafic et les activités du marché et du stade.

## Évolution v110

L’escorte VLI–VSAV utilise une distance de convoi dédiée. La VLI forme le convoi, réduit son allure à partir de 7,5 m et attend le VSAV à 11,5 m ; lorsqu’elle est derrière, elle conserve son allure pour le rejoindre. Le scénario sanitaire complet vérifie l’attente, la formation du convoi puis un écart inférieur à 13 m jusqu’au CH.

Le SMUR est un moyen extérieur permanent du centre hospitalier, sur la base graphique du pick-up VLI avec livrée blanche et bleue. Il est engageable avant reconnaissance sur les SUAP et AVP, dispose d’une équipe autonome de trois personnes et accélère la stabilisation des victimes graves sans assurer lui-même le transport. La vérification couvre son départ du CH, sa présence sur les lieux, la médicalisation, l’amélioration de l’état de la victime et son retour physique au CH. Une reprise de sauvegarde antérieure ajoute automatiquement ce nouveau moyen.

## Évolution v111

Le SMUR utilise un deux-tons médical synthétique dédié (435 / 651 Hz), distinct du fichier historique des engins pompiers. La sélection est appliquée à la commande momentanée et aux déclenchements continus ou automatiques ; les deux familles peuvent rester audibles simultanément. Le scénario `smur-audio.mjs` vérifie que la commande SMUR ne joue pas le son pompier et que le son pompier reste inchangé.

Le pick-up adopte une carrosserie jaune haute visibilité. Il porte « SAMU 41 » en grand sur les deux portes, « SMUR 41 » sur les deux côtés de cellule, le capot, le toit et l'arrière, ainsi que des emblèmes médicaux. Les trois intervenants affichés sur site ont une tenue blanche avec repères bleus ; le scénario sanitaire vérifie le nombre de marquages, leur lecture depuis le dessus, les emblèmes et l'identifiant de tenue.

Chaque porte de remise des CIS Centre et Sud reçoit un avertisseur orange propre à sa baie. Il s'active dès la demande d'ouverture, clignote pendant le mouvement et l'ouverture, puis s'éteint uniquement après la fermeture complète. Le contrôle des portes vérifie l'état lumineux actif et son extinction.

Le commandant reçoit désormais un bipeur simulé, sonore et affiché comme un boîtier Birdy à écran LCD et pavé directionnel. Les nouvelles interventions indiquent le type, le numéro, le motif et l'adresse avec accès direct à la fiche. Le déclenchement de la VLCG produit une alerte dédiée. Les problèmes de caserne urgents déclenchent aussi le bipeur : passage à 2 équipiers disponibles, effectif réduit ou insuffisant, panne/maintenance, citerne vide, alimentation interrompue ou déblocage de sécurité. Ces alertes deviennent immédiatement visibles même si un message était déjà affiché. Un contrôle vérifie l'affichage, l'échappement des textes, le lien d'intervention, l'acquittement, le départ VLCG, le seuil de deux équipiers et la classification des alertes.

## Reprise locale et finitions v112 — 19 octobre 2026

La v111 a été récupérée depuis le patch par `git am`, sur le commit public v110, sans réécrire l'historique. Sa suite complète de 65 scénarios, le contrôle statique et le scénario sanitaire avec les modules du HTML autonome ont réussi localement.

L'inspection WebGL dans le navigateur réel a montré une inscription arrière SMUR inversée et des croix médicales comprimées. La v112 oriente l'inscription vers l'extérieur, utilise des textures carrées pour les emblèmes, agrandit les lettres des flancs et sépare le texte de la croix sur la cellule. Les vues avant, arrière et verticale ont été contrôlées, avec les tenues blanches. Les bases VSAV cellule, VLCG et CCF n'ont pas été remodelées.

Le fichier Bipeur alphanumérique 3514 fourni par le joueur est maintenant réservé au commandant, séparé du bipeur SPV 3513. Il est décodé en WAV PCM 16 bits / 48 kHz mono, sans montage ni changement de vitesse. L'acquittement arrête ce son, sans interrompre un rappel SPV ; sourdine et volume s'appliquent aux deux. Les réglages offrent des essais distincts.

Contrôle de rendu avec un appel sanitaire de test dans le jeu réel : engagement VLCG au clic, affichage immédiat « DÉPART VLCG », puis injection du passage de 3 à 2 équipiers pour contrôler l'alerte prioritaire. Le boîtier noir, l'écran gris-vert, le pavé et le texte sont visibles. Les états du média navigateur confirment la lecture du fichier commandant (readyState 4, currentTime croissant, aucune erreur média). Le SMUR synthétique a une alternance mesurée de 435 / 651 Hz et ne sature pas. Aucun retour audio exploitable n'étant disponible pour l'agent, ces mesures et la lecture ne constituent pas une validation subjective à l'écoute.

Validation finale v112 : `python3 scripts/prepare-release.py` puis `node scripts/check.mjs` réussis, soit 65 scénarios, les contrôles syntaxe/ressources/audio, les modules et notices du HTML autonome et sa mission sanitaire complète. Les régressions couvrent le son commandant distinct, le rappel SPV indépendant, volume/sourdine/acquittement et l'orientation du marquage arrière. La v111 publiée entre-temps sous `6e1196a` possède le même arbre que le patch récupéré ; les historiques ont été réunis par fusion, sans écrasement.

## Correction du cache v113 — 19 octobre 2026

Après le déploiement réussi de la v112, les sept ressources publiques contrôlées répondaient en HTTP 200 avec des empreintes identiques au commit. Le navigateur conservait pourtant un mélange de HTML v112 et de JavaScript v111 (date affichée v112, diagnostic v111 et ancien menu des essais audio). Le cache HTTP pouvait donc alimenter le service worker avec un ancien module encore considéré comme frais.

Le préchargement utilise désormais des requêtes `cache: 'reload'` et les lectures réseau `cache: 'no-cache'`, afin de revalider les fichiers sans supprimer le stockage de garde ou le profil. Le scénario service-worker vérifie le préchargement, la revalidation d'une réponse HTTP précédemment en cache, le secours hors ligne, l'échec honnête d'une ressource absente et l'isolation des caches entre projets.

Validation locale v113 : contrôle de cache ciblé passé, 66 scénarios de la suite complète et mission sanitaire du HTML autonome passés. Après rechargement normal dans le navigateur local, le diagnostic affiche 113 et les essais « rappel SPV » / « bipeur commandant » sont présents. Les 233 empreintes du manifeste concordent.

## Ciblage du bipeur v114 — retour joueur du 19 octobre 2026

Un simple nouvel appel n'affiche ni ne sonne le bipeur du commandant. Les départs VLCG et les événements de caserne nécessitant son attention conservent leur alerte. Le départ de la VLCG seule n'émet plus le sélectif SPV en plus du son alphanumérique fourni par le joueur. Un départ simultané d'autres moyens ou un rappel SPV garde son sélectif propre.

La régression capture les lectures audio au niveau du jeu : silence du bipeur commandant à l'arrivée d'un appel, son fourni joué au départ VLCG, aucun son SPV superposé pour ce seul départ, alerte prioritaire à deux équipiers et acquittement. Les vérifications navigateur sont réalisées en sourdine, sauf nécessité d'un essai audio ciblé.

Validation v114 : 66 scénarios et mission sanitaire autonome passés. Contrôle navigateur muet : bipeur masqué au nouvel appel, « DÉPART VLCG » visible à l'engagement et alerte caserne visible au seuil de deux équipiers ; toutes les sources média restent arrêtées pendant ce contrôle visuel.

## Libellé du bipeur v115 — 19 octobre 2026

Les alertes d'effectif affichent le titre « Manque de personnel » ; le détail conserve le nombre d'équipiers disponibles et le rappel SPV. Le ciblage du bipeur et les sons sont inchangés.

## Menu allégé v116 — 19 octobre 2026

Les commandes occasionnelles sont déplacées dans Réglages, organisé en quatre groupes : Garde, Caserne, Préférences et Aide. Les boutons Centre/Sud, pause, vitesse et sourdine restent dans la barre supérieure. Le contrôle navigateur réel en sourdine couvre les sept accès secondaires, le curseur de densité et sa valeur après réouverture, les secteurs activés/masqués et les formats 1280 × 720, 390 × 844 et 320 × 740. Le diagnostic affiche 116. Le scénario settings-menu vérifie les liaisons, la conservation des appels lors du changement de densité et l’état du bouton des secteurs.

Validation locale v116 : 67 scénarios, contrôles statiques et mission sanitaire du HTML autonome réussis. Le brief et le profil ont aussi été ouverts depuis une garde active : pause pendant la consultation et reprise à la fermeture, avec conservation d’une pause volontaire.

## Flèches du clavier v117 — 19 octobre 2026

Les quatre flèches déplacent la caméra comme Q/Z/S/D, sans défiler la page et en interrompant le suivi de l’engin. Les touches relâchées et la perte de focus arrêtent le déplacement. Les saisies, sélecteurs, dialogues, composition de caserne et raccourcis avec Ctrl/Alt/Commande restent protégés. L’aide et le rappel des commandes annoncent les deux possibilités.

Contrôle navigateur local en sourdine : déplacement réel avec les huit touches, caméra et cible déplacées ensemble, touches libérées après chaque appui, défilement de page resté nul. Les tests ui-input comparent les positions obtenues par chaque paire lettre/flèche, la vitesse diagonale, les touches combinées et les protections de saisie.

## Feux à éclats de garage v118 — 19 octobre 2026

Le modèle rotatif au-dessus des portes est remplacé par un boîtier mural orange à LED. Deux éclats brefs alternent avec des intervalles éteints ; aucune pièce ne tourne. Les deux CIS partagent ce fonctionnement. La cadence utilise le temps de rendu, séparé du mouvement des rideaux et de la vitesse de garde. Les contrôles couvrent les phases allumé/éteint, l’orientation fixe, les deux façades et l’extinction après fermeture.

Contrôle WebGL réel en sourdine : boîtier et orientation sur les deux façades, états d’éclat et d’intervalle éteint, ouverture/fermeture du CIS Sud. Un appel sanitaire puis engagement VSAV au clic dans le jeu complet confirme le rendu de la porte en ouverture et l’intégration de la nouvelle animation. Les halos sont fixes et discrets ; aucun faisceau tournant n’est ajouté.

## Fiche simplifiée et SMUR autonome v141 — 25 octobre 2026

La fiche présente le numéro et le motif sur une même ligne, puis « Adresse : … », le secteur de premier appel et le nombre de victimes signalées. La santé individuelle reste masquée avant le bilan. Les textes génériques de bilan/reconnaissance, mentions vides et catégories redondantes des moyens ont été retirés. Les renforts et actions réellement nécessaires restent présents.

Le joueur peut notifier le SMUR sans imposer un départ. La régulation examine l’information disponible, décline sans indication, réévalue au bilan et attend la disponibilité réelle de l’équipe si elle est occupée. L’engagement peut aussi être décidé automatiquement devant une urgence signalée ou un bilan grave. Le retour au CH se fait automatiquement après médicalisation ; les contrôles de déplacement, engagement et retour ne sont plus proposés au joueur.

Les scénarios ciblés couvrent notification sans départ forcé, doublons, refus, réévaluation, attente sans téléportation ni interruption de mission, annulation d’une demande devenue inutile et persistance en sauvegarde. L’intégration sanitaire contrôle le bon appel même quand une autre fiche est sélectionnée, l’équipage extérieur, la médicalisation et le retour physique.

Chrome réel / WebGL en sourdine : fiche aux largeurs 1440, 390 et 320 px, notification et refus au clic, engagement VSAV, santé masquée avant bilan, suivi SMUR sans commandes. Le cycle autonome réel a couvert départ, déplacement, présence sur les lieux, soins et retour exact à la base du CH.

Validation finale v141 : 69 scénarios, contrôles statiques, ressources/audio, lancement autonome et mission sanitaire avec les modules du HTML autonome réussis.

## Caserne, personnels et EPA v142 — 25 octobre 2026

La commande de gyrophares reste utilisable au CIS et pendant l’embarquement. L’allumage ne mobilise personne, ne déplace pas l’engin et est conservé lors d’un engagement. Le SMUR autonome reste exclu des commandes du joueur.

L’alerte de manque de personnel attend 15 secondes de temps réel après le dernier engagement. Les alertes proches sont regroupées sur le dernier effectif ; une alerte devenue inutile est annulée. Le sélectif du départ reste immédiat. Les autres événements du commandant gardent leur priorité.

Les personnels Centre/Sud portent déjà la tenue adaptée après leur temps d’équipement et avant la marche vers l’engin. L’EPA conserve ses signaux avant et reçoit un rotatif au coin arrière du plateau. Son chef d’agrès ne porte pas d’ARI, conformément à la clarification du joueur.

Deux places sont tracées dans la cour. La VLCG physique rejoint l’une d’elles puis la remise lors des périodes calmes, avec le vrai conducteur et sans téléportation. Un appel peut interrompre la manœuvre ; le stationnement est conservé dans la sauvegarde. Le lampadaire voisin a été déplacé hors de la place.

Chrome réel / WebGL en sourdine : commandes bleues au clic sur quatre moyens dont un du Sud, allumage conservé au départ, tenue/casque des personnels pendant l’embarquement, feu arrière EPA, chef sans ARI et aller-retour VLCG entre remise et parking. Le bipeur reste masqué pendant 14 secondes puis apparaît après le délai de 15 secondes, même en pause. Aucune erreur JavaScript capturée.

La suite a révélé une divergence des itinéraires du VLI et du VSAV selon leurs places initiales. Le VLI rejoint désormais le trajet du VSAV avant de mener l’escorte ; le départ groupé n’est libéré qu’à proximité. Le scénario conserve ses contrôles de distance, d’attente et de retour physique.

Validation finale v142 : 71 scénarios, contrôles statiques, cache/ressources/audio, syntaxe du HTML autonome et mission sanitaire avec ses modules réussis. Le convoi a aussi été contrôlé dans Chrome/WebGL en sourdine : attente et regroupement, CH, remise et retour des deux moyens ; écart maximal mesuré dans le convoi formé de 11,93 m. Les limites de durée des essais de retour noria et de marche arrière forestière ont été élargies pour couvrir les itinéraires plus longs, sans retirer leurs assertions de résultat ou de collision.

## Moyens à engager v143 — 25 octobre 2026

Retrait de la dernière ligne des cartes disponibles (effectif, infirmier, chef ou équipage). La distance conserve son calcul d’itinéraire et affiche seulement la valeur et l’unité, sans « par la route ».

Chrome réel / WebGL en sourdine : rendu aux largeurs 1440, 390 et 320 px, aucune mention retirée ni débordement horizontal, engagement VSAV au clic fonctionnel et aucune erreur JavaScript. Validation finale : 71 scénarios, contrôles statiques, cache/ressources/audio, syntaxe et mission sanitaire du HTML autonome réussis.

## Retrait de « Situation non stabilisée » v144 — 25 octobre 2026

Le badge générique et son rappel radio avant arrivée sont supprimés pour INC, AVP, SUAP et OD. Le libellé hérité est retiré lors de la restauration d’une sauvegarde, même en pause et après une première arrivée. Les délais et effets des évolutions concrètes sont conservés.

Chrome réel / WebGL en sourdine : absence du badge et du rappel radio sur les quatre types, absence après restauration d’une garde en pause contenant l’ancien état, aucune erreur JavaScript. Les régressions couvrent le retrait avant impact, la reprise de sauvegarde et la conservation des évolutions concrètes. Validation finale : 71 scénarios, contrôles statiques, cache/ressources/audio et mission sanitaire du HTML autonome réussis.

## Épisodes masqués et VSR à cabine simple v145 — 26 octobre 2026

Suppression des badges « Épisode 1/2 » / « 2/2 », de la mention d’épisode dans la fiche et de l’annonce radio dédiée. Les liens internes et la programmation des appels sont conservés ; une garde sauvegardée avec ces métadonnées ne les réaffiche plus.

Le VSR possède une cabine courte de 1,90 m, une porte et une vitre latérale par côté. Les marchepieds sont repositionnés et les coffres prolongés derrière la cabine. L’équipage reste de trois personnes ; châssis, roues et équipements routiers sont conservés.

Chrome réel / WebGL en sourdine : deux appels liés sans mention visible ni annonce dédiée, sauvegarde/reprise de cette paire compatible, VSR configuré dans la flotte et inspecté des deux côtés et de profil, équipage de trois vérifié, aucune erreur JavaScript. Validation finale : 71 scénarios, contrôles statiques, cache/ressources/audio et mission sanitaire du HTML autonome réussis.

## Ambulance SMUR 2 v146 — 26 octobre 2026

Nouvelle ambulance jaune/bleue SAMU 41 / SMUR 2, avec trois personnels du CH en blanc. SMUR 1 conserve son pick-up. Régulation autonome : indication vitale à l’appel ou au bilan, départ de SMUR 2 si SMUR 1 indisponible et engagement des deux équipes pour plusieurs victimes graves. File commune sans interruption des soins ou d’un transport, et retour physique au CH avant disponibilité.

Chaque équipe médicalise une victime distincte. SMUR 2 charge et transporte sa propre victime, sans reprendre une victime affectée à un VSAV. Trajet routier, remise de quinze minutes aux urgences et retour au stationnement ; sauvegarde du modèle et du cycle, équipages indépendants des effectifs CIS. Les bilans comptent sa capacité de transport.

Validation : 72 scénarios, ressources/audio/cache, HTML autonome et mission sanitaire réussis. Le scénario SMUR 2 complet et le double transport SMUR 2 / VSAV passent aussi avec les modules intégrés au HTML autonome. Chrome réel / WebGL en sourdine : identité des deux véhicules, départ autonome, soins, chargement avec portes/brancard, trajet, remise aux urgences, retour au CH et renfort simultané avec victimes distinctes ; aucune erreur JavaScript capturée. Les bases VSAV cellule, VLCG et CCF sont conservées.

## VSR sans ARI et concours d’ouverture v147 — 26 octobre 2026

Aucun ARI sur les personnels du VSR à l’arrivée, en appui ou pendant la désincarcération ; casques, tenues, gilets et galons conservés. La réutilisation d’une figurine pour un FPT rétablit son ARI, et le chef d’agrès EPA garde son exception.

Un accès fermé nécessite un VTU, FPT ou VSR avec au moins deux personnels sur place. Le VSAV et les moyens médicaux attendent l’ouverture. Le concours peut être engagé depuis la fiche après reconnaissance ; un moyen encore en route ne peut pas ouvrir à distance. L’action identifie l’équipe, attend quatre minutes de jeu et s’interrompt si celle-ci repart. Un ancien ordre attribué à un VSAV est refusé, y compris hors mode campagne. Le moyen reste identifié en appui après l’ouverture.

Chrome réel/WebGL en sourdine : équipage VSR et désincarcération sans ARI ; VSAV bloqué, demande explicite de concours, engagement du FPT au clic, arrivée, ouverture et reprise des soins VSAV ensuite. Aucune erreur JavaScript. Régression des capacités, minimum d’effectif, interruption/reprise, ancien ordre et délai réussie. Validation générale : 72 scénarios, contrôles statiques, cache/audio/ressources, syntaxe et mission sanitaire du HTML autonome réussis.
