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
