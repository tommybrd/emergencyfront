# Suivi actuel — Valmont

Mise à jour : 27 septembre 2026. Cette liste remplace les anciennes listes historiques ; les versions précédentes restent consultables dans Git.

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

## Ce qui reste à faire

1. **Autres véhicules** : recueillir les retours du joueur puis ajuster leur finition. Aucun nouveau remodelage défini pour l’instant.
2. **Ville** : enrichissement à préciser après les retours du joueur ; pas de refonte engagée sans ces indications.
3. **Personnalisation des bases validées** : définir avec le joueur les livrées, thèmes et accessoires souhaités. Les choix de gyrophares existent déjà ; un éditeur de livrée complet n’est pas encore développé ni spécifié.
4. **Performance** : continuer les mesures sur les scènes chargées et les parties longues selon les ralentissements observés. Les optimisations mesurées sont consignées dans VERIFICATION-DEMANDES.md.
5. **Bugs particuliers** : corriger les cas reproductibles signalés. La commande d’abandon permet de poursuivre une garde même si une situation imprévue bloque.

## Limites assumées

Simulation de jeu : météo, hydraulique et manœuvres restent simplifiées. La sauvegarde est locale au navigateur. Le rejeu reproduit les conditions et tirages, pas un film identique de tous les déplacements.

Références visuelles : https://urgencesmods.fr/mods/page/2/?service=SP — inspiration, sans import des créations dans les modèles du jeu.
