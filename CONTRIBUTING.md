# Contribuer à Emergency.io

Bienvenue ! Emergency.io réunit des passionnés de sapeurs-pompiers autour d’un jeu de simulation accessible. Il n’est pas nécessaire de savoir coder pour contribuer : retours de partie, explications, documentation et propositions sont utiles.

## Partager un retour ou une idée

Utilisez l’onglet **Issues**, puis le formulaire correspondant :

- **Signaler un problème** : indiquez ce que vous faisiez, le motif de l’intervention, les moyens engagés et ce qui s’est passé. Précisez le navigateur et, si possible, les étapes pour reproduire.
- **Proposer une amélioration** : décrivez l’expérience que vous aimeriez vivre, son intérêt et les actions nécessaires au joueur. Une petite amélioration claire est souvent préférable à plusieurs nouveaux menus.

Une capture peut aider. Pour un retour issu de votre expérience de pompier, expliquez le contexte et citez une référence publique si vous en avez une. Ne publiez pas de données de victimes ni de documents internes.

## Garder une direction commune

Nous cherchons une ville vivante, des interventions cohérentes, des actions visibles et des commandes simples. La direction artistique reste sobre, avec des modèles procéduraux adaptés au navigateur. Les durées et fréquences sont des réglages de jeu, pas des consignes opérationnelles.

Avant une fonctionnalité importante, ouvrez une Issue pour discuter du besoin et du périmètre. Privilégiez une contribution ciblée ; le projet n’impose pas d’ajouter une fonction simplement parce qu’elle a été proposée.

## Modifier le jeu

1. Créez un fork et une branche pour votre changement.
2. Modifiez les sources dans `dist/`. Malgré son nom, ce dossier contient le code éditable ; aucune compilation n’est nécessaire.
3. Lancez le jeu avec `python3 -m http.server 4173 --bind 127.0.0.1 --directory dist`, puis ouvrez `http://127.0.0.1:4173/`.
4. Régénérez `Jouer-Valmont.html` avec `python3 scripts/build-standalone.py`.
5. Exécutez `node scripts/check.mjs` avec Node.js 24. Pour une correction de simulation, ajoutez un scénario de régression pertinent. Pour un changement visuel, vérifiez aussi le rendu dans le navigateur.
6. Ouvrez une pull request en expliquant le problème, le comportement obtenu et les vérifications effectuées.

Le formulaire de pull request aide à présenter le changement. Les tests utilisent la géométrie du jeu mais remplacent le rendu WebGL : ils ne suffisent pas à évaluer l’aspect visuel ou la fluidité.

## Sons, modèles et licences

Proposez des créations originales ou des ressources dont la licence autorise la redistribution. Renseignez l’auteur, la source et la licence dans `THIRD_PARTY_NOTICES.md`. Conservez les mentions des ressources existantes, notamment celles de Three.js.

Les contributions originales sont destinées à être distribuées sous la licence du projet. Discutez-en avant d’intégrer une ressource soumise à d’autres conditions.

## Échanger avec respect

Accueillez les nouveaux participants, expliquez les désaccords et critiquez les idées plutôt que les personnes. Une question de débutant, un retour de joueur et une expérience de terrain ont tous leur place ici.
