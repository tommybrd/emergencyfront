# Suivi actuel — Valmont

Mise à jour : 19 octobre 2026. Cette liste remplace les anciennes listes historiques ; les versions précédentes restent consultables dans Git.

## Décisions à conserver

- VSAV cellule unique ; variantes Renault fourgon et MAN retirées du choix et anciennes configurations converties.
- VSAV cellule, VLCG et famille CCF : références graphiques validées. Voir [les bases graphiques](VEHICLE-BASELINES.md).
- Personnaliser surtout la décoration, le thème, les gyrophares et les accessoires ; conserver les silhouettes validées.
- Une intervention bloquée doit pouvoir être abandonnée simplement, sans immobiliser la garde ni créer une fausse réussite.

## Livré

- CIS Centre : une façade de garages face à la grande cour de départ, véhicules visibles, pôles SAP et incendie/appui côte à côte ; dortoir intérieur et tour.
- Équipes SPV rappelables et libérables ; CIS Sud volontaire avec VSAV, FPTL et CCFM.
- PC avec bilan et secteurs ; VPCE avec dépose, longue alimentation, rangement et reprise de berce.
- Effectifs et binômes, pompes distinctes, noria, remplissage au CIS, maintenance et disponibilités.
- Police autonome sur accidents et incendies ; EPA animée, secours en étage, désincarcération et transports au CH.
- Propagation forestière arbre par arbre, consommation du combustible et influence simplifiée des conditions.
- Brief de journée, rythme adaptatif, vie de caserne, entraînement, sauvegarde/reprise locale et bilan.
- Configuration indépendante des feux avant/arrière, orange et un/deux rotatifs ; deux-tons nocturne à volume réduit.
- Galons sur les personnels, roues animées et chevrons plaqués aux carrosseries.
- VSAV cellule unique avec reprise des anciens réglages.
- Déblocage volontaire : « Intervention bloquée ? » puis « Abandonner et libérer les moyens ». Retour immédiat à la base, eau à compléter avant disponibilité, aucun succès ni secours fictif.

- Accès directs aux deux CIS en haut, moyens des deux centres à droite et diagnostic copiable via Debug.
- Secteurs de premier appel, distances routières avant engagement, temps adaptatif et mobilisation SPV avec vestiaires avant embarquement.

## Fonctionnalités retirées en attendant une nouvelle conception

Objectifs chronométrés arrivée/fin, départ conseillé, caméra thermique, relève, protection du voisin, vue en coupe, évacuation préventive et coupure gaz/électricité. Les soins et transports VSAV ainsi que le secours EPA restent disponibles.

## Derniers ajustements

- Message du bipeur v115 : une alerte d'effectif indique directement « Manque de personnel » avec le nombre d'équipiers disponibles, au lieu du titre générique « Anomalie opérationnelle ».

- Bipeur commandant v114 : aucun bip ni affichage pour un simple nouvel appel. Déclenchement uniquement pour l'engagement VLCG ou une alerte de caserne nécessitant l'attention du commandant. Un engagement de la VLCG seule ne joue plus simultanément le son SPV.

- Cache v113 : le service worker revalide les ressources sur le réseau et contourne le cache HTTP pendant le préchargement d'une nouvelle version. Cela évite qu'un HTML récent conserve un ancien module audio, sans vider les sauvegardes.

- Finitions v112 : bipeur alphanumérique fourni par le joueur réservé au commandant ; rappel SPV conservé. Acquitter le message arrête son bipeur. Marquage arrière SMUR orienté vers l'extérieur, croix médicales corrigées et séparation des inscriptions latérales pour éviter leur chevauchement.

- Sécurité des remises v111 : chaque baie du CIS Centre et du CIS Sud dispose d'un gyrophare orange qui clignote pendant l'ouverture, tant que la porte reste ouverte et jusqu'à sa fermeture complète.
- Bipeur commandant v111 : un boîtier visuel et sonore inspiré du Birdy s'affiche pour les nouvelles interventions, chaque déclenchement de la VLCG et les alertes de caserne (dont le passage à 2 équipiers disponibles, panne, maintenance, citerne vide ou blocage). Les alertes prioritaires s'affichent immédiatement ; le message peut ouvrir directement l'intervention ou être acquitté.
- Identité SMUR v111 : le SMUR 41 dispose de son deux-tons médical distinct, aussi bien en commande manuelle qu'en déclenchement automatique. Son pick-up jaune haute visibilité porte « SAMU 41 » en grand sur les portes et « SMUR 41 » sur la cellule, le capot, le toit et l'arrière, avec des emblèmes médicaux ; ses trois intervenants visibles sont en tenue blanche.
- Secours médical v110 : un SMUR d’intervention rapide basé sur le pick-up de la VLI est stationné au centre hospitalier. Son équipe autonome de trois personnes peut être engagée manuellement dès l’appel sur les SUAP et AVP, rejoint physiquement les lieux, médicalise les victimes graves puis revient au CH.
- Escorte sanitaire v110 : la VLI ralentit progressivement lorsqu’elle précède le VSAV, s’arrête pour l’attendre et reforme un convoi à moins de 13 m. Une VLI momentanément derrière continue au contraire de rattraper le VSAV.
- Gameplay v109 : les interventions encore sans secours sur place produisent un avertissement puis une conséquence concrète selon leur famille. Un feu gagne en propagation, un AVP étend son blocage routier, une victime peut s’aggraver et une opération diverse durer plus longtemps. Chaque évolution est annoncée une seule fois et cesse dès la première arrivée.
- Météo et événements v109 : pluie, vent, chaleur et affluence ont maintenant des coefficients communs sur le feu, les déplacements, les piétons, le trafic et l’aggravation sanitaire. Une garde à conditions marquées relie deux appels dans un même épisode, rapprochés dans le temps et identifiés dans les fiches.
- Circulation et quartiers v109 : l’affluence augmente réellement le nombre de véhicules visibles, la pluie le réduit et ralentit les déplacements. Un AVP longtemps non sécurisé élargit le périmètre fermé, avec déviation du trafic existante. Livraisons matinales, parc, marché et stade complètent l’école, les commerces, le chantier et les quais selon l’heure et la météo.
- Ville et performance v108 : quais aménagés sur les deux rives de la Valme, garde-corps, bancs, signalétique et promeneurs selon l’heure. Le découpage spatial des lots fixes passe à 100 m afin de réduire les appels de dessin dans la vue urbaine chargée, sans réduire la résolution ni retirer de décor.
- Finitions opérationnelles v108 : tuyau raccordé à la pompe arrière et rideau maintenu ouvert pendant l’alimentation, faisceaux bleus et orange réduits d’environ 45 %, dévidoirs CCF tournés comme ceux du FPT. Tous les engins, dont le VPCE, peuvent emprunter les pistes forestières à vitesse fortement réduite ; les secours engagés restent prioritaires au passage alterné.
- Feu de forêt v108 : propagation locale ralentie d’un tiers. Les routes pavées forment une coupure, avec un saut de brandon rare mais possible vers un arbre proche de l’autre côté ; le vent augmente cette probabilité et l’eau la réduit.
- Victimes et CIS Sud v108 : une ligne compacte avec un petit cœur coloré remplace la jauge horizontale de chaque victime. Les soins VSAV et VLI améliorent l’état sur place et le transport CH commence seulement à 80 / 100. Le rappel et le trajet à pied des SPV du CIS Sud sont légèrement raccourcis, en conservant domicile ou travail, vestiaire et embarquement.
- EPA et circulation v108 : flancs de l’EPA repris avec coffres dégagés des roues, ailes peintes plus fines et berceau d’échelle raccordé, sans modifier ses cinq sections articulées. Les convois de secours réservent plus tôt les carrefours ; une dépanneuse municipale immobilisée reprend son trajet sans bloquer durablement la circulation.
- Optimisation v107 : pièces fixes regroupées par matériau et zone, matériaux de panneaux partagés, sections EPA instanciées et transformations des équipes cachées suspendues. Résolution, ombres, modèles et animations conservés. Contrôles locaux : environ 7–8 % d’appels de dessin en moins ; mesures détaillées dans VERIFICATION-DEMANDES.md.

- Premier secours évacuation inspiré du PS 6e génération BSPP : disponible dans les places sanitaires de Composer au CIS Centre, six personnels, 880 L, pompe 2 000 L/min et lance diphasique 110 L/min. Extinction des petits feux extérieurs, puis rangement avant soins et transport d’une victime au CH. Les feux de bâtiment, de forêt et de batteries restent confiés aux engins adaptés.
- Modèle original PS : double cabine, cellule sanitaire, volet jaune, pompe et dévidoir arrière, portes sanitaires animées, plaques et livrées. Référence technique : [ALLO18, PS 6e génération](https://allo18.fr/ps-6e-generation-1-3-un-engin-de-rupture/).
- PC : un seul essieu arrière, conformément à la photo de référence ; le VPCE conserve son double essieu.

- VSR : panneau de signalisation commandé par une touche du boîtier des lumières, avec état actif visible et blocage en mouvement.
- Gilets d’intervention selon la fonction : commandant blanc, chef d’agrès jaune, équipiers orange. Le chef est choisi dans l’équipage réel, y compris sur les véhicules de secours routier et sanitaires.

- Santé des victimes visible directement sur les cartes d’intervention et dans la fiche : petit cœur coloré, valeur et état par victime. Bilan masqué avant reconnaissance ; DCD conservé comme issue distincte.

- Deux quartiers séparés par la Valme : CIS Centre rive ouest, CIS Sud rive est. Ponts routiers connectés, traversées piétonnes par les ponts et stationnement des secours sur la rive du sinistre. Les secteurs suivent désormais la rivière.
- Deux CIS : volets de garage animés au départ et au retour, libération de la voie seulement après ouverture, nom du véhicule sur le volet et sur le linteau. Actualisation après modification dans Composer.
- Habitants quittant les bâtiments en feu, témoin qui accueille les secours et victime à la fenêtre lors d'un sauvetage existant. Les habitants décoratifs ne créent pas de victimes supplémentaires.
- Coffres à rideaux mobiles sur FPT, CCF, EPA et VSR, matériel visible à l'intérieur et équipier qui prend puis porte son matériel pendant la préparation. L'effectif opérationnel et les durées des actions restent ceux du jeu.
- École, commerces, terrasse et chantier de rénovation avec activité selon l'heure ; circulation plus dense aux heures de pointe. Population limitée et volets rendus par instanciation pour contenir le coût graphique.
- VSAV Sud revenu disponible au CIS : vert, avec le libellé « Disponible CIS », même pendant le retour des SPV chez eux. Retour du véhicule vert clair ; transport CH bleu.
- Le changement de fenêtre laisse la simulation tourner. L'option de pause aux appels/renforts ne suspend plus une partie en arrière-plan ; la pause volontaire reste conservée.


- Livrées Service et Rouge uni par véhicule dans Composer pour les deux CIS, sauvegarde indépendante et application différée au retour. VLCG personnalisable dans le menu VLCG / Police. Marquages CIS Sud adaptés.

- Cour du CIS Centre clôturée, portail coulissant automatique et gyrophare orange ; passages piétons conservés.

- Bouton retour au CIS : message radio du Centre « Concours inutile, vous pouvez rejoindre le centre », uniquement après un ordre manuel accepté.

- Sac de secours rouge porté dans le dos ; dévidoirs dans l’axe de l’engin.
- Santé individuelle des victimes : cœur et valeur compacts, amélioration par les soins sur place jusqu’au seuil de transport, aggravation sans soins et décès séparé des évacuations et de la réussite de mission.
- Sauvetage intérieur transférable vers une EPA déjà en position ; refus expliqué dans la fiche.
- Placement manuel sur la carte, trajet réel et mission conservée ; matériel à ranger avant mouvement.
- Manœuvres d’échelle et établissements/rangement des tuyaux accélérés d’environ 30 % ; binôme d’alimentation disponible après raccordement.

- Composer distingue CIS Centre et CIS Sud avec sauvegardes indépendantes et remplacement des engins à leur retour.
- écusson sur la manche de la tenue de repos, suppression du faux trait de poitrine ; raccord de cour et passage piéton devant le CIS.

- Carte complétée par des quartiers à l’ouest, à l’est et au sud ; forêt étendue avec pistes reliées, raccordement courbe à la rocade.
- CIS Sud remobilisable pendant le retour du véhicule comme pendant le trajet des SPV vers leur domicile.
- Supports arrière PC corrigés et toit VSR dégagé autour de la rampe.

- VLI sur la base pick-up VLCG ; fonction infirmier conservée.
- Gilets haute visibilité sur accidents, galons liés aux grades et dégagés de la tenue.
- PC : bilan permanent avec besoins, présents, mobilisés et manques.
- Pas de déplacement automatique de caméra au déclenchement ; équipages détaillés seulement dans les véhicules.
- Engagement rouge, transport/remise au CH bleu ; feux de pénétration lourds au niveau de la calandre.

## Suppression confirmée

- Voiture de service supprimée : seul le pick-up VLCG est conservé, sans seconde voiture au parking ni choix dans le profil. Les anciens profils sont convertis.

## Ce qui reste à faire

1. **Autres véhicules** : recueillir les retours du joueur puis ajuster leur finition. Aucun nouveau remodelage défini pour l’instant.
2. **Ville** : recueillir les retours sur les deux rives, les ponts et les animations horaires ; ajuster ensuite la finition des quartiers.
3. **Personnalisation des bases validées** : définir avec le joueur les livrées, thèmes et accessoires souhaités. Les livrées Service et Rouge uni et les choix de gyrophares sont disponibles ; les thèmes supplémentaires et un éditeur libre restent à définir.
4. **Performance** : continuer les mesures sur les scènes chargées et les parties longues selon les ralentissements observés. Les optimisations mesurées sont consignées dans VERIFICATION-DEMANDES.md.
5. **Bugs particuliers** : corriger les cas reproductibles signalés. La commande d’abandon permet de poursuivre une garde même si une situation imprévue bloque.

## Propositions PC à décider

- Carte tactique de l'intervention : position des engins, lances et alimentations, secteurs assignés et victimes.
- Objectifs d'équipe : confier un secteur et une priorité à chaque moyen depuis le PC, puis voir l'avancement.
- Journal de commandement : chronologie des bilans, décisions et renforts, avec les besoins encore non couverts.

Ces propositions ne sont pas encore engagées. Le bilan des besoins et les affectations de secteurs existants restent disponibles.

## Plan d’évolution · retours joueur (2 novembre 2026)

Plan proposé, à valider lot par lot. Chaque lot part de l’existant et suit le cycle habituel (version, tests, vérification réelle). Taille indicative : S = une session, M = deux à trois, L = plus.

### Lot 1 · Dispatch plus riche, sur la base existante (S–M) — livré en v161

- **Départ type par motif** (S) : le bouton « Proposer » s’appuie déjà sur `recommendDeparture` (moyens par type d’intervention, SPV joignables, distance). À faire : un tableau de départs types par motif (ex. feu d’appartement = FPT + EPA + VSAV + VLCG), présélectionné dans la fenêtre d’engagement, modifiable par le joueur et enregistré dans son profil.
- **Gestion des engins depuis la fenêtre d’intervention** (M) : regrouper sur la fiche d’intervention les actions aujourd’hui dispersées entre panneau d’engin et console : renfort, désengagement, retour, changement de secteur ou de mission, statut de chaque engin.
- **Indice de propagation des feux** (S) : `fireLevel` calcule déjà un niveau (localisé, en développement, fort embrasement) à partir de la propagation. À faire : un indice lisible (vitesse, direction du vent, menace sur les voisins, tendance montante ou descendante) sur la fiche et la carte, avec une alerte au changement de niveau.

### Lot 2 · Fenêtre CTA-CODIS (L) — prise d’appel et tableau CODIS livrés en v162

- **Prise d’appel CTA** : décrocher, questionnaire de qualification (motif, adresse, victimes, risques), choix du motif ; le jeu compare au motif réel et révèle les écarts à la reconnaissance.
- **Tableau CODIS** : interventions en cours, moyens engagés avec statuts radio (parti, sur les lieux, disponible, etc.), main courante filtrable, demandes de renfort en attente.
- **Option « Prendre en charge le dispatch »** : mode réglable entre dispatch assisté (actuel) et dispatch complet par le joueur, pour garder le jeu accessible.

### Lot 3 · Nouvelles familles de missions (M–L) — visites de prévention livrées en v163

- **Dispositifs de surveillance** (M) : feu d’artifice, concert, tournoi sportif. Programmés dans la journée, ils immobilisent des moyens prépositionnés, peuvent générer des incidents sur place (malaises, départs de feu) et réduisent la couverture du secteur. Le stade et la plage existants servent de lieux.
- **Prévention et opérationnel hors urgence** (S–M) : visite de sécurité d’entreprise, tests et entretien des points d’eau incendie (les poteaux sont déjà réels et réservables), sortie de prévention. Missions de journée sans gyrophares, interruptibles par un départ.

### Lot 4 · Forces de l’ordre (M–L) — PM, PN et BAC distinctes livrées en v163

Aujourd’hui : des patrouilles de Police nationale automatiques viennent sécuriser les accidents et les feux (hors forêt). À faire :
- **Trois forces distinctes** : Police municipale (circulation, stationnement, périmètre simple), Police nationale (sécurisation, réquisitions), BAC (violences urbaines, protection des secours), chacune avec son véhicule et sa livrée.
- **Demande de concours** depuis la fiche d’intervention, avec délais selon la disponibilité.
- **Missions force de l’ordre** : rixe, véhicule incendié en zone sensible, personne agressive ; les secours attendent la sécurisation avant d’intervenir.

### Points d’information

- **Sites cités** : hotcops.fr est une boutique d’articles police et gendarmerie, sans jeu ni mécanique à reprendre ; k1811.fr ne répond pas (domaine introuvable). À confirmer avec le joueur s’il s’agit d’autres adresses.
- **Transcription de vidéos YouTube** : possible si la vidéo a des sous-titres. Le plus simple est le menu « Afficher la transcription » de YouTube, puis copier-coller le texte. Un téléchargement automatique des sous-titres est faisable avec un outil dédié, mais demande l’accord préalable du joueur. Les transcriptions servent d’inspiration, sans reprise des contenus.

### Ordre conseillé

1. Lot 1 (gains rapides, prépare le reste).
2. Lot 3 · prévention puis surveillance (variété de journée, peu de dépendances).
3. Lot 2 · CTA-CODIS (le plus structurant).
4. Lot 4 · forces de l’ordre (s’appuie sur la demande de concours du lot 2).

## Limites assumées

Simulation de jeu : météo, hydraulique et manœuvres restent simplifiées. La sauvegarde est locale au navigateur. Le rejeu reproduit les conditions et tirages, pas un film identique de tous les déplacements.

Références visuelles : https://urgencesmods.fr/mods/page/2/?service=SP — inspiration, sans import des créations dans les modèles du jeu.

## Interface v116 — 19 octobre 2026

Barre supérieure recentrée sur les actions fréquentes : suivi du capitaine, horloge, vues Centre/Sud, pause, vitesse et sourdine. Les réglages regroupent garde/sauvegarde/entraînement, brief, composition et densité, profil, sons/radio, secteurs, aide et diagnostic. Les fonctions existantes restent disponibles ; aucune commande reportée ne revient.

## Déplacement clavier v117 — 19 octobre 2026

La caméra accepte les quatre flèches en plus de Q/Z/S/D, avec les mêmes directions, le même rythme et les diagonales. A/E conservent la rotation. Les champs de saisie, sélecteurs, dialogues et raccourcis système gardent leurs touches.

## Avertisseurs de garage v118 — 19 octobre 2026

Les portes des CIS Centre et Sud reçoivent des feux orange muraux à LED avec deux éclats brefs, sans réflecteur tournant. La cadence visuelle reste indépendante de la vitesse de garde. L’activation suit la demande d’ouverture et reste présente jusqu’à la fermeture complète.

## Fiche et SMUR v141 — 25 octobre 2026

Fiche simplifiée : numéro et motif sur la même ligne, adresse seule avec son libellé, secteur conservé et nombre de victimes signalées dès l’appel. Pas de santé révélée avant bilan. Retrait des informations vides ou répétées et des catégories de moyens dans cette fiche.

Le SMUR relève d’une régulation autonome : indication à l’appel ou au bilan, notification facultative, décision différée, attente si occupé, réévaluation et retour physique au CH après prise en charge. Le joueur conserve seulement le suivi de ce moyen extérieur.

## Gyrophares à la caserne v142 — 25 octobre 2026

Commande bleue utilisable à l’arrêt et pendant la préparation d’un départ. L’allumage ne mobilise aucun équipage et ne déplace pas le véhicule ; l’engagement conserve un allumage manuel déjà choisi. Le SMUR reste autonome.

L’alerte de manque de personnel attend 15 secondes réelles après le dernier engagement et disparaît si l’effectif remonte. Les personnels quittent le vestiaire en tenue d’intervention. L’EPA reçoit un rotatif arrière au coin et son chef d’agrès ne porte pas d’ARI. Deux places sont tracées près de la clôture ; la VLCG alterne au calme entre parking et remise, avec conducteur, trajet, sauvegarde et départ prioritaire si appelée. L’éclairage du bord de cour est déplacé hors de la place utilisée.

La régression sanitaire révélée par les essais est corrigée : le VLI rejoint le trajet du VSAV avant de mener l’escorte, y compris lorsque leurs places débouchent sur deux rues différentes.

## Choix des moyens allégé v143 — 25 octobre 2026

Dans « Moyens à engager », retrait de la dernière ligne sur l’équipage et affichage de la distance seule, sans « par la route ».

## Retrait de l’alerte générique v144 — 25 octobre 2026

Suppression de « Situation non stabilisée » et de son rappel radio avant arrivée. Nettoyage du libellé dans les anciennes gardes sauvegardées. Les évolutions concrètes conservent leurs effets et leur délai.

## Affichage des épisodes et cabine VSR v145 — 26 octobre 2026

Retrait des badges « Épisode 1/2 » et « 2/2 », de la mention dans la fiche et de l’annonce radio dédiée. Les liens internes entre appels et leur programmation sont conservés.

VSR remanié en cabine simple courte pour trois personnels, avec une porte et une vitre latérale par côté. Les coffres sont prolongés derrière la cabine ; le châssis et les équipements de secours routier sont conservés.

## Ambulance SMUR 2 v146 — 26 octobre 2026

Seconde équipe médicale autonome du CH, dans une ambulance jaune et bleue marquée SAMU 41 / SMUR 2. SMUR 1 conserve son pick-up. La régulation engage une équipe sur indication vitale à l’appel ou au bilan, utilise SMUR 2 si SMUR 1 est occupé, et peut engager les deux sur plusieurs victimes graves. Une file commune attend les retours physiques, sans détourner une équipe en soins ou en transport.

SMUR 2 soigne puis transporte sa victime aux urgences, avec chargement, trajet routier, remise au CH et retour à sa place. Une victime déjà affectée à un VSAV reste à ce VSAV. Le personnel du CH n’est pas déduit de la garde des CIS. Les contrôles du joueur restent limités à la notification et au suivi.

## VSR sans ARI et concours d’ouverture v147 — 26 octobre 2026

Retrait de l’ARI sur tout l’équipage du VSR, y compris les intervenants de désincarcération. Tenue d’intervention, casque, galons et gilets conservés. La règle est réappliquée à l’affectation du personnel pour couvrir également la reprise d’une garde et les acteurs réutilisés.

Accès fermé : concours VTU, FPT ou VSR nécessaire, avec deux personnels sur place. Le bouton attend leur arrivée et identifie le moyen chargé de l’ouverture. Les soins restent bloqués jusqu’à la fin de l’action ; le départ de l’équipe interrompt le travail. Les anciens ordres attribués à un VSAV sont invalidés, y compris dans une garde reprise hors mode campagne.

## Brancardage tête/pieds v148 — 28 octobre 2026

Deux porteurs dans l’axe du brancard, un devant et un derrière, mains sur les poignées. Orientation suivant le déplacement puis alignement avec l’ambulance. Le porteur de tête se dégage pour guider le chargement ; au CH, l’équipe extrait le brancard et les deux soignants prennent la relève aux extrémités pour rejoindre l’entrée. Le troisième SMUR accompagne sans prendre une place latérale de porteur. Durées et prise en charge des patients conservées.

## Réalisme opérationnel v149 — 28 octobre 2026

- PC : implantation progressive en cinq minutes, auvent et pieds, table/laptops, tableau SITAC, chaises, groupe électrogène avec câble au sol, mât radio et cônes. Opérateurs issus de l’équipage, assis au poste après installation ; repli pendant le reconditionnement. Le PC reste sélectionnable via Composer ; pas de nouveau véhicule imposé dans la flotte par défaut.
- VLCG : Dacia Duster III alternatif dans le profil, proportions 4,343 m / empattement 2,66 m, cinq portes, vitres séparées, protections noires, barres de toit, rampe LED et habillage rouge/jaune. Le Hilux est conservé. Un seul véhicule actif : changement immédiat au CIS ou différé au retour ; sauvegarde de la variante active, sans ancienne voiture de service ni véhicule doublon.
- Boîtier embarqué : touches rétroéclairées, état lisible, bleus/sirène/appel chef d’agrès et balisage séparés. Sirène et pédale activent les bleus ; couper les bleus coupe la sirène. Suivre/retour près de la destination, déblocage dans l’en-tête à droite, retrait de Fiche intervention et du compte d’effectif redondant dans l’équipage. Bandeau de pause mobile déplacé hors de la fermeture du panneau.
- VSAV : trois acteurs sur intervention, dont un accompagnant pendant le brancardage tête/pieds ; accompagnement à pied conservant l’équipage. Garnitures intérieures des portes blanches, extérieur et cellule validée conservés. Accès fermé révélé à la reconnaissance : bandeau orange dans la liste de gauche jusqu’à ouverture.
- Ville : chaque emprise bâtie contrôlée contre les segments de voirie et leurs accotements ; déplacement ou réduction locale sur une parcelle libre, sans déplacer les routes. 38 voitures possibles au lieu de 20 ; densité de jour 85 % et pointes 100 %, nuit 14–20 %. Priorités secours et prévention des collisions conservées.
- Caserne : course, échauffement et renforcement, déplacements au stade et passes du ballon ; ateliers de lance en binôme, portage coordonné d’un brancard et secourisme. Les départs reprennent depuis la position réelle de l’exercice et restent prioritaires.
- VPL : combinaison, masque, bouteille de plongée et gilet de flottabilité, sans casque incendie ni ARI. Attelage articulé avec essieu qui suit la boule, déport intérieur en virage et articulation en recul. Hors-bord avec hélice, léger roulis/tangage, sillage animé uniquement en déplacement sur l’eau ; aucun sillage sur la remorque. Effets visuels procéduraux, sans nouveau son moteur.

Références primaires consultées pour les proportions et l’inspiration du boîtier : [Dacia — dimensions Duster](https://fr.dacia.be/foire-aux-questions-vehicules/duster/dimensions.html), [Mercura — utilisation BC12](https://standbygroup.com/app/uploads/sites/5/2022/09/mu-0915-ram-indice-a-utilisation-rampe-w3-sirene-avec-bc12-t.pdf). La livrée est une adaptation procédurale des photos du joueur, sans intégrer ces photos au dépôt ; le boîtier est une interprétation de jeu.

Le VPL dégage désormais toute la remorque de la remise et du portail avant le virage. Limite EPA corrigée : la fenêtre doit aussi être au-delà de la longueur minimale de l’échelle repliée (6,85 m), sinon repositionnement nécessaire ; alignement réel de la nacelle revérifié.

## Reprise du VLCG v150 — 29 octobre 2026

La reconstruction d’une garde conserve le véhicule physique actif enregistré. Un choix Hilux/Duster différé pendant l’engagement reste en attente jusqu’au retour au CIS, y compris après rechargement de la page ; la préférence du profil est conservée. La correction est testée dans des processus neufs pour les deux sens du changement, avec identité du conducteur et absence de véhicule doublon. La v149 (brancardage, PC, Duster, boîtier, ville, sport et VPL) est conservée.

## Accès piétons du CIS Centre v151 — 30 octobre 2026

Entrée personnel latérale sur le chemin du parking, portillon ouvert, porte des vestiaires et ouvertures du bâtiment de vie. Galerie pavée derrière les remises, avec une vraie porte de service par baie et une allée vers la cabine. La clôture intérieure qui coupait cette liaison est retirée ; le périmètre extérieur reste fermé hors accès. Les déplacements entre activités contournent murs/clôtures/volets et partent de la position effectivement affichée. Rappel SPV et retour au parking suivent le même passage, y compris après annulation en cours de marche. Les anciens parcours d’embarquement sauvegardés sont repris par les accès actuels. Les exercices qui empiétaient sur les remises sont placés sur l’aire libre de la cour.

### Eau et écume v151 — 30 octobre 2026

Le lac reçoit de petites vagues croisées animées, avec normales et reflets qui évoluent. Les anneaux fixes du sillage sont retirés. L’écume apparaît au moteur, reste sur le trajet effectivement parcouru, s’élargit et se dissipe après l’arrêt ; elle ne s’affiche ni sur la berge ni sur la remorque. Coque et écume suivent la même hauteur d’eau. Effet visuel de jeu, sans changement du sauvetage ou des soins et sans nouveau son. Les ressources graphiques sont allouées une fois, avec un maximum de 192 fragments d’écume par bateau.

## Duster : passages de roue et rampe intégrée v152 — 31 octobre 2026

Passages de roue du Duster retravaillés : découpe de la carrosserie autour des roues, fond de passage sombre et élargisseurs noirs affleurants jusqu’au bas de caisse, roues alignées sur les élargisseurs. Nouvelle option « LED · intégrés à la rampe bleue » pour l’orange arrière de la VLCG (Hilux ou Duster) : un module orange tourné vers l’arrière derrière chaque module bleu, une seule rampe au lieu de deux, sens de défilement conservés. Avec des bleus rotatifs, l’option retombe sur la rampe orange large. Silhouette validée et réglages existants inchangés.

## Rideaux encastrés et pénalité OD silencieuse v153 — 31 octobre 2026

Rideaux des coffres du FPT (latéraux et arrière), du VSR, du CCF et de l’EPA encastrés au ras de la caisse : cadre couleur carrosserie avec montants, linteau masquant l’enrouleur et seuil ; intérieur rentré, ouverture inchangée. Le PS conserve son coffre pour garder son marquage ; la plaque SECOURS ROUTIER du VSR est avancée devant le cadre. Opération diverse sans secours sur place après 21 minutes : 8 minutes de plus sur les lieux, sans badge ni message (comme la propagation du feu) ; l’ancien badge « Opération étendue » est retiré à la reprise des sauvegardes.

## Rétroviseur du Duster v154 — 31 octobre 2026

Bras de rétroviseur du Duster raccourci : il relie le boîtier au bas de la vitre, au-dessus de la bande jaune, et ne descend plus jusqu’à l’élargisseur avant. Silhouette validée et autres réglages inchangés.

## Intervention au choix v155 — 1er novembre 2026

Réglages › Partie › Nouvelle journée ou entraînement : nouveau bouton « Déclencher maintenant, en plus des appels ». L’intervention choisie dans la liste arrive tout de suite par le 18 / 112 dans la garde en cours, sans la remplacer ni attendre le rythme adaptatif ; les appels prévus de la journée continuent normalement. Elle est conservée dans la sauvegarde mais n’entre pas dans « Rejouer cette journée ». L’entraînement seul reste disponible. Les listes de cette fenêtre ne débordent plus à droite.

## Fluidité du trafic et orange au départ v156 — 1er novembre 2026

Carrefours : la zone réservée se limite au croisement (14 m au lieu de 20 m), un véhicule ne garde plus le carrefour longtemps après l’avoir franchi. Les véhicules qui se suivent sur la même voie vers la même sortie traversent ensemble, en convoi, la distance de sécurité restant physique ; le trafic transversal attend toujours. Rampe orange en flash simultané pendant un départ prioritaire (départ et trajet), motif choisi conservé sur les lieux, choix manuel toujours prioritaire. Banc de mesure `scripts/traffic-bench.mjs` ajouté.

## Arrière du Duster v157 — 1er novembre 2026

Arrière du Duster refait : feux d’angle en Y (boîtier fumé, signature rouge vif) avec retour sur les flancs, lunette encadrée de noir et becquet, logo DUSTER entre les feux, chevrons limités au bas du hayon, pare-chocs avec plaque, catadioptres et sabot alu. Silhouette validée et réglages inchangés.

## Disponibilité des SPV et VSAV sur recherche v158 — 1er novembre 2026

CIS Sud : le nombre de SPV joignables suit la journée (9 à 11 la nuit, 3 à 5 aux heures de travail, 4 à 6 à midi, 8 à 10 en soirée), avec une variation d’une unité par heure tirée de la graine de la garde. Les équipages déjà engagés sont décomptés : en journée, le CIS Sud arme en général un seul engin ; un second départ simultané est refusé avec le motif « effectif SPV insuffisant ». Carte de l’engin et panneau des renforts indiquent l’effectif joignable. Recherche de personne : le VSAV peut partir dès l’appel et attend sur zone ; seuls VTU, FPT ou CCF lancent la recherche (bouton grisé sinon), puis le VSAV enchaîne bilan et transport.

## Arrière du Duster d’après photo v159 — 1er novembre 2026

D’après la photo de référence du joueur : hayon droit jusqu’à une grande lunette inclinée (plus de marche de coffre), becquet, vitre de custode, chevrons sur tout le hayon avec plaque posée dessus et logo DACIA, feux hauts aux angles, pare-chocs noir à catadioptres. Livrée latérale : custode jaune derrière la roue arrière, ceinture jaune prolongée jusqu’à l’arrière, liseré jaune en haut des vitres et sur le montant arrière. D’après les captures de référence fournies (inspiration seulement, aucun import) : chevrons sur les montants de lunette et en bord de capot, bandeau noir DUSTER au-dessus de la plaque, pare-chocs arrière plus haut, LED bleues de pénétration descendues dans la calandre au lieu de recouvrir les phares.

## Correction relève et SPV v160 — 1er novembre 2026

Garde commencée sur une relève : la recommandation des moyens tient compte des SPV joignables du CIS Sud, et seuls les engins réellement engagés sont posés sur les lieux. Avant, un engin du CIS Sud refusé faute de SPV pouvait être placé sans intervention puis repartir aussitôt (échec intermittent de la publication v159).

## Lot 1 · départs types, gestion depuis la fiche et propagation v161 — 2 novembre 2026

Fiche d’intervention : bloc « Départ type » par motif (ex. feu d’appartement : FPT · EPA · VSAV · VLCG), moyens proposés pré-marqués dans la liste, bouton « Engager le départ type » puis « Engager les manquants » une fois une partie engagée. Victimes connues et bâtiment haut ajoutent VSAV et EPA. Bouton « Modifier » : composition par motif réglable par le joueur, enregistrée sur l’appareil, retour au départ d’origine possible. Chaque engin engagé (départ, trajet, sur place) peut être désengagé depuis la fiche (↩). Sous la jauge du feu : indice de propagation 0–100 avec tendance (hausse, stable, baisse) et menace sur les voisins ou front actif en forêt ; le message radio existant au changement de niveau est conservé.

## Lot 2 · prise d’appel CTA et tableau CODIS v162 — 2 novembre 2026

Idées validées sur la page roadmap. Prise d’appel : chaque appel entrant propose « Décrocher ». La garde est en pause pendant l’échange : l’appelant décrit la scène, des questions de relance par famille (que s’est-il passé, lieu, blessés, conscience et respiration, incarcération, flammes ou fumée, bâtiment et étage) précisent la situation, chacune ajoutant 30 s avant la création de l’intervention. La nuit, un passant en sait parfois peu. Le joueur choisit entre le vrai motif, trois motifs voisins de la même famille et « Pas de départ ». Un motif erroné pilote le départ type et le nom affiché jusqu’à la reconnaissance, qui révèle l’écart par radio. « Pas de départ » sur un vrai besoin entraîne un rappel du requérant 3 min plus tard. Un appel laissé à l’opérateur est qualifié comme avant. Tableau CODIS (bouton à côté de la main courante) : compteurs par statut radio (1 disponible au centre … 7 indisponible), interventions en cours avec durée et engins colorés selon leur statut, renforts en attente, tableau des moyens et main courante filtrable (urgents, radio, par intervention), rafraîchis chaque seconde ; un clic sur une intervention l’ouvre.

## Lot 3 et 4 · prévention et forces de l’ordre v163 — 2 novembre 2026

Idées validées sur la page roadmap. Prévention : deux visites de sécurité par journée (9 h 30 et 14 h, immeuble de bureaux, centre commercial ou atelier) apparaissent dans la liste des interventions, sans appel. VTU ou FPT (départ type VTU), trajet et présence sur place sans gyrophares, sirène ni feux orange, aucune charge de dispatch, et elles ne bloquent pas l’avance au prochain appel. Un engin en visite peut être engagé sur une urgence : il repart avec ses feux bleus et la visite est close comme interrompue. Une visite non commencée à 17 h est reportée. Forces de l’ordre : Police municipale (livrée blanche, bandes bleue et jaune), Police nationale (patrouilles automatiques inchangées sur accidents et feux) et BAC (véhicule banalisé sombre, gyrophare magnétique). Le bloc « Forces de l’ordre » de la fiche permet de demander le concours de chacune, avec un délai annoncé : PM 4 min en journée et indisponible la nuit (21 h – 7 h), PN 6 min, BAC 9 min le jour et 5 min la nuit, plus 3 min par unité de la même force déjà engagée. L’unité demandée part d’un point de patrouille à l’échéance, son statut s’affiche sur la fiche, et elle se retire à la fin de l’intervention.

## Coefficient de propagation R et bip non urgent v164 — 2 novembre 2026

Retour joueur : les niveaux N1/N2/N3 et l’indice sur 100 cèdent la place à un coefficient de propagation R, comme un taux de reproduction. R rapporte l’intensité du feu (extension × part non maîtrisée) à celle d’il y a 20 min, lissée sur environ 3 min. À R = 1, le feu est stable ; au-dessus, il se propage ; en dessous, il régresse et tend vers 0 à l’approche de l’extinction. Affichage : « Combat · R 1,24 » dans la liste, « Coefficient de propagation R = 1,24 · le feu se propage » sous la jauge de la fiche, avec la menace sur les voisins, et « Coefficient de propagation R = 0,72 » dans le bilan de situation. La radio annonce le franchissement de 1, avec une marge de 0,1 contre les annonces en rafale : « Le feu se propage — R = 1,30. Renfort incendie conseillé. » ou « Propagation enrayée — R = 0,80, le feu régresse. ». Les seuils internes de moyens restent inchangés. Lance sur nacelle EPA, retour joueur : elle n’exige plus un fourgon raccordé à un poteau. Un fourgon proche, à moins de 60 m, l’alimente depuis sa citerne, et le message d’établissement précise « citerne » ou « poteau ». Si la tonne se vide sans poteau, la lance se coupe avec « citerne du fourgon vide », puis reprend dès qu’un poteau est raccordé. Départs vers une visite de prévention : carillon doux à trois notes au lieu du bip du sélectif, et main courante « Sélectif non urgent · mission de prévention ».

## Premier bilan avant le SMUR v165 — 2 novembre 2026

Idée validée sur la roadmap (vidéo SDIS 59) : la régulation n’engage plus le SMUR d’office sur un simple « Personne inconsciente ». Le départ réflexe est réservé à la noyade, à l’arrêt cardiaque, à la détresse vitale annoncée, et à l’inconscience confirmée au décroché : si l’opérateur demande « La personne parle-t-elle ? Respire-t-elle ? » et que le requérant répond qu’elle ne répond plus. Sinon, le SMUR attend le premier bilan des sapeurs-pompiers. Au bilan, la radio annonce « Premier bilan : N victime(s) en détresse vitale · médicalisation demandée » (ou « SMUR maintenu » s’il roule déjà), et l’équipe part une minute plus tard. Un départ réflexe que le bilan rend inutile est annulé en route (« Engagement annulé après actualisation du bilan »). « Notifier SMUR » reste disponible avant le bilan, sans forcer de départ.

## Missions des forces de l’ordre et commissariat v166 — 2 novembre 2026

Idée passée en NOW sur la roadmap, avec un commissariat. L’hôtel de police occupe un immeuble existant du centre (façade sur l’avenue de la République : plaque, bandeau bleu, lanterne, drapeau). Les unités demandées depuis la fiche partent de son trottoir, la fiche annonce « départ du commissariat dans N min », puis l’équipage y revient à la fin de l’intervention au lieu de disparaître. Quatre missions par garde (matin, après-midi, soirée, nuit), tirées de façon reproductible pour chaque garde sans toucher au hasard des appels :
- Secours sous protection : « Blessé lors d’une rixe » (PN, escalade vers la BAC) et « Personne blessée par arme blanche » (BAC d’emblée). Le VSAV sur place attend la sécurisation : aucun soin ni brancardage avant. Faute de demande de concours, le CIC engage lui-même la force au bout de 8 min.
- Missions police seule : « Individu suspect devant l’école » (PM, puis PN), « Rassemblement tendu en centre-ville » (PN, puis BAC), « Personne agressive dans un commerce » (PN avec OPJ). Aucun engin pompier ne peut y être engagé, et elles ne bloquent ni l’accélération ni l’appel suivant.
- Escalade : sans force adaptée engagée à temps, « La situation dégénère : BAC nécessaire ». La BAC couvre tout, la PN couvre la PM, mais la PM ne peut pas tenir une mission de niveau PN. Une fois une mission escaladée prise, le CIC envoie le renfort d’office si le joueur ne le fait pas.
- Sécurisation en 2 min sur place, puis OPJ demandé automatiquement pour les constatations (10 min) quand le motif l’exige. Une mission police seule se clôt après la présence requise ou les constatations. Sans aucune unité au bout de 25 min, elle est close en échec (« non traitée »).
La fiche affiche l’état sous « Forces de l’ordre » : en attente de sécurisation et force requise, puis zone sécurisée et constatations. Correctif : une patrouille PN autonome ne s’engage plus sur un feu de forêt, comme prévu ; elle pouvait bloquer la piste unique et immobiliser un CCF de noria au passage alterné.

## Commissariat et base SAMU repérables v167 — 3 novembre 2026

Retour joueur : on voit les deux CIS, mais pas le commissariat ni le SAMU. Le commissariat porte désormais une grande enseigne « COMMISSARIAT · POLICE NATIONALE » sur sa façade de l’avenue de la République, et un marquage « POLICE » couché sur le versant est de son toit, lisible depuis la vue aérienne comme les enseignes des CIS. Au centre hospitalier, la base du SAMU 41 apparaît : enseigne « SAMU 41 · SMUR » sur la façade sud, au-dessus des deux places des véhicules SMUR, marquage « SAMU 41 · CENTRE 15 » sur le toit, et « SMUR » peint au sol de chaque place. En haut de l’écran, deux boutons rejoignent « Centre » et « Sud » : « Police » cadre la façade et le toit du commissariat, « SAMU » cadre la base SMUR. Ils tiennent dans l’en-tête sur téléphone.

Départ type lisible sans cliquer, retour joueur : la fiche détaille la composition rôle par rôle (« FPT → FPTL Sud ≈ 390 m », « EPA → EPA ≈ 530 m », etc., et « Indisponible » en rouge quand aucun engin ne peut tenir le rôle). Chaque engin proposé porte un badge « Départ type · rôle » sur sa tuile dans « Moyens à engager ».

## Lot NOW : matériel, accidents, dispositifs, poteaux, spécialités v168 — 4 novembre 2026

Le centre peut grouper deux victimes légères dans un même VSAV, avec une remise au CH allongée de 5 minutes. Chaque VSAV emporte trois lots de matériel : un lot par victime, recomplété en remise, et départ refusé à zéro. Sur les accidents, la police met les curieux à distance, ce qui rend aux secours leur rythme normal, fait un dépistage d’alcoolémie et lève le doute sur les appels imprécis, parfois sans aucun départ. Le maire demande des dispositifs de surveillance deux heures à l’avance, avec des incidents sur place et un taux de présence en fin de manifestation. Les poteaux défaillants ne se voient plus : ils se révèlent au raccordement ou lors d’une tournée, puis sont réparés. Une mission spécialisée par garde demande CMIC, CMIR, SDE ou GRIMP, équipes venues de loin.

## Sirène : gain invalide v169 — 5 novembre 2026

- Un gain de sirène non fini (NaN ou Infinity) est traité comme un silence au lieu de lever une erreur sur `Audio.volume` et d'interrompre la fin de l'image.
- `tests/smur-audio.mjs` vérifie qu'aucun gain non fini n'atteint les clips, puis que le son revient au gain valide suivant.
- Cause de l'erreur non confirmée : observée une seule fois, au tout premier chargement d'un onglet, et jamais reproduite.

## Lot 5 : choix du poste, chef de salle, chef de caserne, chef d'agrès v170 — 5 novembre 2026

- Le brief de prise de garde propose trois postes, mémorisés d'une garde à l'autre : chef de salle, chef de caserne, chef d'agrès. « Tout gérer moi-même » conserve le jeu complet, comme les gardes déjà sauvegardées.
- `dist/player-role.js` fixe le périmètre de chaque poste ; les commandes hors périmètre sont retirées et refusées au clic. `dist/role-ai.js` tient les postes restants : engagement, renforts, SMUR, police, rappel et conduite des interventions.
- Chef de salle : qualification, engagement de tous les centres, police et SMUR ; les interventions sont menées par les chefs d'agrès IA.
- Chef de caserne : engins du CIS Centre et rappel ; la salle complète avec les autres centres après 25 s réelles et engage d'office après 60 s sans réponse.
- Chef d'agrès : engin choisi ou « tous ». Personnage à pied, montée, route, puis reconnaissance, bilan, binômes et placement. Sans réaction pendant 30 s réelles, l'équipage lance la reconnaissance et la salle envoie les renforts sans attendre le bilan.
- Vérifié à l'écran : choix du poste, commandes des trois postes, personnage et caméra du chef d'agrès. Une garde complète n'a pas été jouée à l'écran.
