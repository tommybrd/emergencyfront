# Suivi actuel — Valmont

Mise à jour : 4 octobre 2026. Cette liste remplace les anciennes listes historiques ; les versions précédentes restent consultables dans Git.

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

## Limites assumées

Simulation de jeu : météo, hydraulique et manœuvres restent simplifiées. La sauvegarde est locale au navigateur. Le rejeu reproduit les conditions et tirages, pas un film identique de tous les déplacements.

Références visuelles : https://urgencesmods.fr/mods/page/2/?service=SP — inspiration, sans import des créations dans les modèles du jeu.
