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
