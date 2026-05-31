-- Phase 6 — Supply Chain AI full UI labels (us_US / en_GB / fr_FR)
-- Deploy after 75 (titles) and 77 (S53 partial body). Idempotent MERGE.
-- TLAID max VARCHAR2(15). TLADESC max VARCHAR2(100) — keep every language string <= 100 chars.
--
-- Run the WHOLE file from line 1. Do not use Q&A in literals — Oracle treats & as
-- a substitution variable (Q&A prompts for A, Q&R for R). SET DEFINE OFF below
-- must execute before the PL/SQL block.

SET DEFINE OFF;
SET SCAN OFF;

DECLARE
  PROCEDURE seed3(p_id VARCHAR2, p_us VARCHAR2, p_gb VARCHAR2, p_fr VARCHAR2, p_screen VARCHAR2) IS
  BEGIN
    MERGE INTO TRA_LABELS t USING (SELECT p_id TLAID, 'us_US' TLALANGUE FROM DUAL) s
    ON (t.TLAID = s.TLAID AND t.TLALANGUE = s.TLALANGUE)
    WHEN MATCHED THEN UPDATE SET t.TLADESC = p_us, t.TLASCREEN = p_screen, t.TLADMAJ = SYSDATE
    WHEN NOT MATCHED THEN INSERT (TLAID, TLADESC, TLAMENU, TLASCREEN, TLALANGUE, TLADCRE, TLADMAJ, TLAUTIL)
    VALUES (p_id, p_us, 0, p_screen, 'us_US', SYSDATE, SYSDATE, 'admin');
    MERGE INTO TRA_LABELS t USING (SELECT p_id TLAID, 'en_GB' TLALANGUE FROM DUAL) s
    ON (t.TLAID = s.TLAID AND t.TLALANGUE = s.TLALANGUE)
    WHEN MATCHED THEN UPDATE SET t.TLADESC = p_gb, t.TLASCREEN = p_screen, t.TLADMAJ = SYSDATE
    WHEN NOT MATCHED THEN INSERT (TLAID, TLADESC, TLAMENU, TLASCREEN, TLALANGUE, TLADCRE, TLADMAJ, TLAUTIL)
    VALUES (p_id, p_gb, 0, p_screen, 'en_GB', SYSDATE, SYSDATE, 'admin');
    MERGE INTO TRA_LABELS t USING (SELECT p_id TLAID, 'fr_FR' TLALANGUE FROM DUAL) s
    ON (t.TLAID = s.TLAID AND t.TLALANGUE = s.TLALANGUE)
    WHEN MATCHED THEN UPDATE SET t.TLADESC = p_fr, t.TLASCREEN = p_screen, t.TLADMAJ = SYSDATE
    WHEN NOT MATCHED THEN INSERT (TLAID, TLADESC, TLAMENU, TLASCREEN, TLALANGUE, TLADCRE, TLADMAJ, TLAUTIL)
    VALUES (p_id, p_fr, 0, p_screen, 'fr_FR', SYSDATE, SYSDATE, 'admin');
  END;

  PROCEDURE cmn(p_id VARCHAR2, p_us VARCHAR2, p_gb VARCHAR2, p_fr VARCHAR2) IS
  BEGIN
    seed3(p_id, p_us, p_gb, p_fr, 'SCR0000000060');
  END;

BEGIN
  -- Shared chrome (assistant hub screen id)
  cmn('AI.CMN.BACK', 'Back', 'Back', 'Retour');
  cmn('AI.CMN.NEXT', 'Next', 'Next', 'Suivant');
  cmn('AI.CMN.SAVE', 'Save', 'Save', 'Enregistrer');
  cmn('AI.CMN.CNCEL', 'Cancel', 'Cancel', 'Annuler');
  cmn('AI.CMN.REFR', 'Refresh', 'Refresh', 'Actualiser');
  cmn('AI.CMN.RETAIL', 'Retailer', 'Retailer', 'Detaillant');
  cmn('AI.CMN.SELRET', 'Select retailer...', 'Select retailer...', 'Choisir un detaillant...');
  cmn('AI.CMN.ADD', 'Add', 'Add', 'Ajouter');
  cmn('AI.CMN.EDIT', 'Edit', 'Edit', 'Modifier');
  cmn('AI.CMN.CLEAR', 'Clear filters', 'Clear filters', 'Effacer les filtres');
  cmn('AI.CMN.SEARCH', 'Search', 'Search', 'Rechercher');
  cmn('AI.CMN.LOAD', 'Loading...', 'Loading...', 'Chargement...');
  cmn('AI.CMN.YOU', 'You', 'You', 'Vous');
  cmn('AI.CMN.AST', 'Assistant', 'Assistant', 'Assistant');
  cmn('AI.CMN.DESCR', 'Description', 'Description', 'Description');
  cmn('AI.CMN.DOMAIN', 'Domain', 'Domain', 'Domaine');
  cmn('AI.CMN.STATUS', 'Status', 'Status', 'Statut');
  cmn('AI.CMN.PUBL', 'Publish', 'Publish', 'Publier');
  cmn('AI.CMN.DEL', 'Delete', 'Delete', 'Supprimer');
  cmn('AI.CMN.RETRY', 'Retry', 'Retry', 'Reessayer');
  cmn('AI.CMN.SUBMIT', 'Submit', 'Submit', 'Envoyer');
  cmn('AI.CMN.CLOSE', 'Close', 'Close', 'Fermer');
  cmn('AI.CMN.ALL', 'All', 'All', 'Tous');

  -- S53 Retailer setup (includes 77 keys)
  seed3('S53.BAN.TTL', 'What is this setup?', 'What is this setup?',
        'A quoi sert cette configuration ?', 'SCR0000000053');
  seed3('S53.BAN.P1',
        'This screen registers a GOLD ERP environment as a retailer in the Supply Chain AI engine.',
        'This screen registers a GOLD ERP environment as a retailer in the Supply Chain AI engine.',
        'Cet ecran enregistre un environnement GOLD ERP comme detaillant dans le moteur IA Supply Chain.',
        'SCR0000000053');
  seed3('S53.PRQ.TTL', 'Before you begin:', 'Before you begin:', 'Avant de commencer :', 'SCR0000000053');
  seed3('S53.PRQ.1', 'CORPENV row exists with ENVGOLDSCHEMA set',
        'CORPENV row exists with ENVGOLDSCHEMA set',
        'Une ligne CORPENV existe avec ENVGOLDSCHEMA renseigne', 'SCR0000000053');
  seed3('S53.PRQ.2', 'DB link is active and reachable from the ICR app DB',
        'DB link is active and reachable from the ICR app DB',
        'Le lien DB est actif et accessible depuis la base ICR', 'SCR0000000053');
  seed3('S53.PRQ.3', 'Your user has USERAIADMIN = 1',
        'Your user has USERAIADMIN = 1',
        'Votre utilisateur a USERAIADMIN = 1', 'SCR0000000053');
  seed3('S53.STP.0', 'Environment', 'Environment', 'Environnement', 'SCR0000000053');
  seed3('S53.STP.1', 'Retailer identity', 'Retailer identity', 'Identite detaillant', 'SCR0000000053');
  seed3('S53.STP.2', 'Connection test', 'Connection test', 'Test de connexion', 'SCR0000000053');
  seed3('S53.STP.3', 'Confirm and save', 'Confirm and save', 'Confirmer et enregistrer', 'SCR0000000053');
  seed3('S53.ST0.TTL', 'Select GOLD environment', 'Select GOLD environment',
        'Selectionner l''environnement GOLD', 'SCR0000000053');
  seed3('S53.ST0.CTX', 'The AI engine connects to GOLD via an Oracle DB link defined in CORPENV.',
        'The AI engine connects to GOLD via an Oracle DB link defined in CORPENV.',
        'Le moteur IA se connecte a GOLD via un lien Oracle DB defini dans CORPENV.', 'SCR0000000053');
  seed3('S53.LBL.ENV', 'GOLD environment', 'GOLD environment', 'Environnement GOLD', 'SCR0000000053');
  seed3('S53.PLH.ENV', 'Select environment...', 'Select environment...',
        'Choisir un environnement...', 'SCR0000000053');
  seed3('S53.ENV.DTL', 'Environment details', 'Environment details',
        'Details de l''environnement', 'SCR0000000053');
  seed3('S53.ENV.NF', 'No GOLD environments found.',
        'No GOLD environments found.',
        'Aucun environnement GOLD trouve.', 'SCR0000000053');
  seed3('S53.ENV.SEL', 'Select a GOLD environment above to continue.',
        'Select a GOLD environment above to continue.',
        'Selectionnez un environnement GOLD ci-dessus pour continuer.', 'SCR0000000053');
  seed3('S53.ST1.TTL', 'Retailer identity', 'Retailer identity',
        'Identite du detaillant', 'SCR0000000053');
  seed3('S53.ST1.CTX', 'Retailer ID is permanent across all AI tables and cannot be changed after save.',
        'Retailer ID is permanent across all AI tables and cannot be changed after save.',
        'L''ID detaillant est permanent dans les tables IA et ne peut pas etre modifie apres enregistrement.',
        'SCR0000000053');
  seed3('S53.LBL.RID', 'Retailer ID', 'Retailer ID', 'ID detaillant', 'SCR0000000053');
  seed3('S53.LBL.RCODE', 'Retailer code', 'Retailer code', 'Code detaillant', 'SCR0000000053');
  seed3('S53.LBL.RNAME', 'Retailer name', 'Retailer name', 'Nom detaillant', 'SCR0000000053');
  seed3('S53.ST2.TTL', 'Connection test', 'Connection test', 'Test de connexion', 'SCR0000000053');
  seed3('S53.ST2.CTX', 'Verifies that the Oracle DB link is reachable. No data is modified.',
        'Verifies that the Oracle DB link is reachable. No data is modified.',
        'Verifie que le lien Oracle DB est joignable. Aucune donnee n''est modifiee.', 'SCR0000000053');
  seed3('S53.BTN.TEST', 'Run connection test', 'Run connection test',
        'Lancer le test de connexion', 'SCR0000000053');
  seed3('S53.TEST.OK', 'Connection verified — GOLD is reachable.',
        'Connection verified — GOLD is reachable.',
        'Connexion verifiee — GOLD est joignable.', 'SCR0000000053');
  seed3('S53.TEST.FAIL', 'Connection failed. Check the DB link and remote database.',
        'Connection failed. Check the DB link and remote database.',
        'Echec de connexion. Verifiez le lien DB et la base distante.', 'SCR0000000053');
  seed3('S53.ST3.TTL', 'Confirm and save', 'Confirm and save',
        'Confirmer et enregistrer', 'SCR0000000053');
  seed3('S53.ST3.CTX', 'Saving registers this retailer in AI_RETAILER_CONFIG.',
        'Saving registers this retailer in AI_RETAILER_CONFIG.',
        'L''enregistrement inscrit ce detaillant dans AI_RETAILER_CONFIG.', 'SCR0000000053');
  seed3('S53.BTN.SAVE', 'Save retailer', 'Save retailer', 'Enregistrer le detaillant', 'SCR0000000053');
  seed3('S53.BTN.SVG', 'Saving...', 'Saving...', 'Enregistrement...', 'SCR0000000053');
  seed3('S53.SAVED', 'saved successfully.', 'saved successfully.',
        'enregistre avec succes.', 'SCR0000000053');
  seed3('S53.GO.CTX', 'Go to Context Learning', 'Go to Context Learning',
        'Aller a l''apprentissage contexte', 'SCR0000000053');

  -- S54 Schema discovery
  seed3('S54.BAN.TTL', 'Schema Discovery — GOLD physical catalog',
        'Schema Discovery — GOLD physical catalog',
        'Decouverte schema — catalogue physique GOLD', 'SCR0000000054');
  seed3('S54.BAN.P1', 'Scans GOLD schemas via CORPENV DB links. Catalog feeds the AI engine for SQL validation.',
        'Scans GOLD schemas via CORPENV DB links. Catalog feeds the AI engine for SQL validation.',
        'Analyse les schemas GOLD via CORPENV. Catalogue pour validation SQL du moteur IA.',
        'SCR0000000054');
  seed3('S54.BAN.P2', 'Designers can annotate tables with domain tags and descriptions for AI context.',
        'Designers can annotate tables with domain tags and descriptions for AI context.',
        'Les concepteurs peuvent annoter les tables avec des domaines et descriptions pour le contexte IA.',
        'SCR0000000054');
  seed3('S54.BTN.SCAN', 'Run full scan', 'Run full scan', 'Lancer analyse complete', 'SCR0000000054');
  seed3('S54.BTN.RESC', 'Re-scan', 'Re-scan', 'Re-analyser', 'SCR0000000054');
  seed3('S54.BTN.UNLK', 'Unlock scan', 'Unlock scan', 'Debloquer analyse', 'SCR0000000054');
  seed3('S54.PLH.SRCH', 'Search table name or description...',
        'Search table name or description...',
        'Rechercher une table ou description...', 'SCR0000000054');
  seed3('S54.FIL.SCH', 'All schemas', 'All schemas', 'Tous les schemas', 'SCR0000000054');
  seed3('S54.FIL.DOM', 'All domains', 'All domains', 'Tous les domaines', 'SCR0000000054');
  seed3('S54.FIL.KEY', 'Key only', 'Key only', 'Tables cles seulement', 'SCR0000000054');
  seed3('S54.EMP.TBL', 'Select a table', 'Select a table', 'Selectionner une table', 'SCR0000000054');
  seed3('S54.EMP.TP', 'Click any table on the left to explore its columns.',
        'Click any table on the left to explore its columns.',
        'Cliquez sur une table a gauche pour explorer ses colonnes.', 'SCR0000000054');
  seed3('S54.NOSCAN', 'No schema data yet', 'No schema data yet',
        'Pas encore de donnees schema', 'SCR0000000054');
  seed3('S54.NOSCAN.P', 'Run a full scan to discover GOLD tables and columns.',
        'Run a full scan to discover GOLD tables and columns.',
        'Lancez une analyse complete pour decouvrir les tables et colonnes GOLD.', 'SCR0000000054');
  seed3('S54.SCAN.RUN', 'Scan in progress...', 'Scan in progress...',
        'Analyse en cours...', 'SCR0000000054');
  seed3('S54.DLG.TBL', 'Annotate table', 'Annotate table', 'Annoter la table', 'SCR0000000054');
  seed3('S54.DLG.COL', 'Annotate column', 'Annotate column', 'Annoter la colonne', 'SCR0000000054');
  seed3('S54.COL.NAME', 'Column', 'Column', 'Colonne', 'SCR0000000054');
  seed3('S54.COL.TYPE', 'Type', 'Type', 'Type', 'SCR0000000054');
  seed3('S54.TAG.KEY', 'Key table', 'Key table', 'Table cle', 'SCR0000000054');

  -- S55 Context learning
  seed3('S55.BAN.TTL', 'What is Context Learning?', 'What is Context Learning?',
        'Qu''est-ce que l''apprentissage contexte ?', 'SCR0000000055');
  seed3('S55.BAN.P1', 'Guided Q and A teaches how GOLD defines business concepts. Answers become SQL for retailer views.',
        'Guided Q and A teaches how GOLD defines business concepts. Answers become SQL for retailer views.',
        'Q-R guidees : le moteur apprend les concepts GOLD. Reponses = SQL pour vues detaillant.',
        'SCR0000000055');
  seed3('S55.SEL.HINT', 'Select a retailer above to begin.',
        'Select a retailer above to begin.',
        'Selectionnez un detaillant ci-dessus pour commencer.', 'SCR0000000055');
  seed3('S55.CAT.TTL', 'Knowledge items', 'Knowledge items', 'Elements de connaissance', 'SCR0000000055');
  seed3('S55.P1.TAG', 'P1 — Required', 'P1 — Required', 'P1 — Obligatoire', 'SCR0000000055');
  seed3('S55.P1.NOTE', 'All must be locked to generate the active item view',
        'All must be locked to generate the active item view',
        'Tous doivent etre verrouilles pour generer la vue articles actifs', 'SCR0000000055');
  seed3('S55.P2.TAG', 'P2 — Core', 'P2 — Core', 'P2 — Coeur', 'SCR0000000055');
  seed3('S55.P3.TAG', 'P3 — Enhanced', 'P3 — Enhanced', 'P3 — Enrichi', 'SCR0000000055');
  seed3('S55.P1.OK', 'P1 Complete — view ready', 'P1 Complete — view ready',
        'P1 termine — vue prete', 'SCR0000000055');
  seed3('S55.SESS.EMP', 'Start a learning session', 'Start a learning session',
        'Demarrer une session d''apprentissage', 'SCR0000000055');
  seed3('S55.SESS.HINT', 'Click any knowledge item on the left to open a Q and A session.',
        'Click any knowledge item on the left to open a Q and A session.',
        'Cliquez sur un element a gauche pour ouvrir une session questions-reponses.', 'SCR0000000055');
  seed3('S55.VIEW.TTL', 'Active item view', 'Active item view', 'Vue articles actifs', 'SCR0000000055');
  seed3('S55.VIEW.GEN', 'Generate view', 'Generate view', 'Generer la vue', 'SCR0000000055');
  seed3('S55.VIEW.REG', 'Regenerate view', 'Regenerate view', 'Regenerer la vue', 'SCR0000000055');
  seed3('S55.ANS.LBL', 'Your answer', 'Your answer', 'Votre reponse', 'SCR0000000055');
  seed3('S55.ANS.PLH', 'Describe in plain business terms...',
        'Describe in plain business terms...',
        'Decrivez en termes metier simples...', 'SCR0000000055');
  seed3('S55.BTN.ANS', 'Submit answer', 'Submit answer', 'Envoyer la reponse', 'SCR0000000055');
  seed3('S55.BTN.SQL', 'Submit SQL', 'Submit SQL', 'Envoyer le SQL', 'SCR0000000055');
  seed3('S55.LOCKED', 'Locked', 'Locked', 'Verrouille', 'SCR0000000055');
  seed3('S55.CONF', 'Confidence', 'Confidence', 'Confiance', 'SCR0000000055');
  seed3('S55.BTN.LOCK', 'Lock and generate view', 'Lock and generate view',
        'Verrouiller et generer la vue', 'SCR0000000055');

  -- S56 Skill library
  seed3('S56.BAN.TTL', 'Template skill library', 'Template skill library',
        'Bibliotheque de skills modeles', 'SCR0000000056');
  seed3('S56.BAN.P1', 'Central catalog of skills: knowledge, playbook, SQL templates, vocabulary, and tests.',
        'Central catalog of skills: knowledge, playbook, SQL templates, vocabulary, and tests.',
        'Catalogue central des skills : connaissance, playbook, modeles SQL, vocabulaire et tests.',
        'SCR0000000056');
  seed3('S56.CAT', 'Global template catalog', 'Global template catalog',
        'Catalogue global des modeles', 'SCR0000000056');
  seed3('S56.BTN.NEW', 'New skill', 'New skill', 'Nouveau skill', 'SCR0000000056');
  seed3('S56.BYSTAT', 'By status:', 'By status:', 'Par statut :', 'SCR0000000056');
  seed3('S56.PLH.SRCH', 'Search name, code, description…',
        'Search name, code, description…',
        'Rechercher nom, code, description…', 'SCR0000000056');
  seed3('S56.EMP.TTL', 'No skills match', 'No skills match', 'Aucun skill correspondant', 'SCR0000000056');
  seed3('S56.EMP.P1', 'No skills returned yet. Deploy AI0000040 in LIBQUERY, then refresh.',
        'No skills returned yet. Deploy AI0000040 in LIBQUERY, then refresh.',
        'Aucun skill pour l''instant. Deployez AI0000040 dans LIBQUERY puis actualisez.', 'SCR0000000056');
  seed3('S56.EMP.P2', 'Try adjusting filters or search.', 'Try adjusting filters or search.',
        'Essayez d''ajuster les filtres ou la recherche.', 'SCR0000000056');
  seed3('S56.BTN.CRT', 'Create skill', 'Create skill', 'Creer un skill', 'SCR0000000056');
  seed3('S56.READONLY', 'Read-only — designer or admin role required to create or change skills.',
        'Read-only — designer or admin role required to create or change skills.',
        'Lecture seule — role concepteur ou admin requis pour modifier les skills.', 'SCR0000000056');
  seed3('S56.SUBREV', 'Submit for review', 'Submit for review', 'Soumettre pour revue', 'SCR0000000056');
  seed3('S56.DEPR', 'Deprecate', 'Deprecate', 'Deprecier', 'SCR0000000056');
  seed3('S56.ST.ALL', 'All statuses', 'All statuses', 'Tous les statuts', 'SCR0000000056');
  seed3('S56.ST.DRF', 'Draft', 'Draft', 'Brouillon', 'SCR0000000056');
  seed3('S56.ST.REV', 'In review', 'In review', 'En revue', 'SCR0000000056');
  seed3('S56.ST.PUB', 'Published', 'Published', 'Publie', 'SCR0000000056');
  seed3('S56.ST.DEP', 'Deprecated', 'Deprecated', 'Deprecie', 'SCR0000000056');
  seed3('S56.DOM.ALL', 'All domains', 'All domains', 'Tous les domaines', 'SCR0000000056');

  -- S57 Skill builder
  seed3('S57.BACK.LIB', 'Back to library', 'Back to library', 'Retour bibliotheque', 'SCR0000000057');
  seed3('S57.SAVE.DRF', 'Save draft', 'Save draft', 'Enregistrer brouillon', 'SCR0000000057');
  seed3('S57.SUBREV', 'Submit for review', 'Submit for review', 'Soumettre pour revue', 'SCR0000000057');
  seed3('S57.NEW.HDR', 'New skill — set code, name, and domain, then save.',
        'New skill — set code, name, and domain, then save.',
        'Nouveau skill — renseignez code, nom et domaine puis enregistrez.', 'SCR0000000057');
  seed3('S57.VIEWONLY', 'View only — designer or admin role is required to edit or submit.',
        'View only — designer or admin role is required to edit or submit.',
        'Lecture seule — role concepteur ou admin requis pour modifier.', 'SCR0000000057');
  seed3('S57.LBL.CODE', 'Skill code', 'Skill code', 'Code skill', 'SCR0000000057');
  seed3('S57.LBL.NAME', 'Name', 'Name', 'Nom', 'SCR0000000057');
  seed3('S57.TAB.KNOW', 'Knowledge items', 'Knowledge items', 'Elements connaissance', 'SCR0000000057');
  seed3('S57.TAB.PLAY', 'Playbook steps', 'Playbook steps', 'Etapes playbook', 'SCR0000000057');
  seed3('S57.TAB.SQL', 'SQL templates', 'SQL templates', 'Modeles SQL', 'SCR0000000057');
  seed3('S57.TAB.VOC', 'Vocabulary', 'Vocabulary', 'Vocabulaire', 'SCR0000000057');
  seed3('S57.TAB.TEST', 'Test suite', 'Test suite', 'Suite de tests', 'SCR0000000057');
  seed3('S57.TAB.DIAG', 'Diagnostic chain', 'Diagnostic chain', 'Chaine diagnostic', 'SCR0000000057');
  seed3('S57.SAVE1ST', 'Save the skill first to attach bundle rows.',
        'Save the skill first to attach bundle rows.',
        'Enregistrez d''abord le skill pour attacher les lignes du bundle.', 'SCR0000000057');

  -- S58 Pending phrasings
  seed3('S58.BAN.TTL', 'Phrasings the AI engine could not route confidently',
        'Phrasings the AI engine could not route confidently',
        'Formulations que le moteur IA n''a pas routees avec confiance', 'SCR0000000058');
  seed3('S58.BAN.P1', 'Low-confidence routes and thumbs-down land here. Promote phrasings into AI_SKILL_VOCABULARY.',
        'Low-confidence routes and thumbs-down land here. Promote phrasings into AI_SKILL_VOCABULARY.',
        'Routes peu fiables et pouces bas ici. Promouvez les formulations vers AI_SKILL_VOCABULARY.',
        'SCR0000000058');
  seed3('S58.COUNT', 'pending phrasing', 'pending phrasing', 'formulation en attente', 'SCR0000000058');
  seed3('S58.BTN.AUTO', 'Auto-promote eligible', 'Auto-promote eligible',
        'Promotion auto eligible', 'SCR0000000058');
  seed3('S58.LOAD', 'Loading pending phrasings…', 'Loading pending phrasings…',
        'Chargement des formulations…', 'SCR0000000058');
  seed3('S58.EMP.TTL', 'No pending phrasings', 'No pending phrasings',
        'Aucune formulation en attente', 'SCR0000000058');
  seed3('S58.EMP.P', 'The engine routed everything with confidence.',
        'The engine routed everything with confidence.',
        'Le moteur a tout route avec confiance.', 'SCR0000000058');

  -- S59 Phrasing playground
  seed3('S59.BAN.TTL', 'How would the engine route this phrase?',
        'How would the engine route this phrase?',
        'Comment le moteur routerait-il cette phrase ?', 'SCR0000000059');
  seed3('S59.BAN.P1', 'Side-effect-free scoring: lexical pipeline, entities, bind feasibility. No SQL execution.',
        'Side-effect-free scoring: lexical pipeline, entities, bind feasibility. No SQL execution.',
        'Notation sans effet de bord : pipeline lexical, entites, liens. Pas d''execution SQL.',
        'SCR0000000059');
  seed3('S59.LBL.PHR', 'Phrase to diagnose', 'Phrase to diagnose', 'Phrase a diagnostiquer', 'SCR0000000059');
  seed3('S59.BTN.DIAG', 'Diagnose', 'Diagnose', 'Diagnostiquer', 'SCR0000000059');
  seed3('S59.TRY', 'Try:', 'Try:', 'Essayer :', 'SCR0000000059');
  seed3('S59.SCORING', 'Scoring against active skills…',
        'Scoring against active skills…',
        'Notation par rapport aux skills actifs…', 'SCR0000000059');
  seed3('S59.INTENT', 'Intent', 'Intent', 'Intention', 'SCR0000000059');
  seed3('S59.TOP', 'Top skill', 'Top skill', 'Skill principal', 'SCR0000000059');
  seed3('S59.ENT', 'Entities extracted', 'Entities extracted', 'Entites extraites', 'SCR0000000059');
  seed3('S59.LOWCONF', 'LOW CONFIDENCE — would land in Pending Phrasings',
        'LOW CONFIDENCE — would land in Pending Phrasings',
        'FAIBLE CONFIANCE — irait dans Formulations en attente', 'SCR0000000059');

  -- S60 Assistant
  seed3('S60.CHAT.TTL', 'Supply Chain Assistant', 'Supply Chain Assistant',
        'Assistant supply chain', 'SCR0000000060');
  seed3('S60.CHAT.SUB', 'Ask about items, vendors, orders, or stock in plain language.',
        'Ask about items, vendors, orders, or stock in plain language.',
        'Posez vos questions articles, fournisseurs, commandes ou stock en langage naturel.',
        'SCR0000000060');
  seed3('S60.NEWCONV', 'New conversation', 'New conversation', 'Nouvelle conversation', 'SCR0000000060');
  seed3('S60.EXPORT', 'Export session', 'Export session', 'Exporter la session', 'SCR0000000060');
  seed3('S60.EMPTY', 'Ask about items, vendors, stores, or supply-chain status in plain language.',
        'Ask about items, vendors, stores, or supply-chain status in plain language.',
        'Interrogez articles, fournisseurs, magasins ou statut supply chain en langage naturel.',
        'SCR0000000060');
  seed3('S60.EX.LBL', 'Try an example:', 'Try an example:', 'Essayer un exemple :', 'SCR0000000060');
  seed3('S60.EX.1', 'Tell me about item 100100 at store 7',
        'Tell me about item 100100 at store 7',
        'Parlez-moi de l''article 100100 au magasin 7', 'SCR0000000060');
  seed3('S60.EX.2', 'What DSD items can we buy from Lipari?',
        'What DSD items can we buy from Lipari?',
        'Quels articles DSD peut-on acheter chez Lipari ?', 'SCR0000000060');
  seed3('S60.EX.3', 'Who supplies item 100100?',
        'Who supplies item 100100?',
        'Qui fournit l''article 100100 ?', 'SCR0000000060');
  seed3('S60.EX.4', 'Lookup barcode 041220185936',
        'Lookup barcode 041220185936',
        'Rechercher le code-barres 041220185936', 'SCR0000000060');
  seed3('S60.CTX.SUP', 'Supplier', 'Supplier', 'Fournisseur', 'SCR0000000060');
  seed3('S60.CTX.VND', 'Vendor', 'Vendor', 'Fournisseur (texte)', 'SCR0000000060');
  seed3('S60.CTX.STO', 'Store', 'Store', 'Magasin', 'SCR0000000060');
  seed3('S60.CTX.LU', 'Item (LU)', 'Item (LU)', 'Article (LU)', 'SCR0000000060');
  seed3('S60.CTX.EAN', 'Barcode (EAN)', 'Barcode (EAN)', 'Code-barres (EAN)', 'SCR0000000060');
  seed3('S60.SEND.HINT', 'Enter to send · Shift+Enter for newline',
        'Enter to send · Shift+Enter for newline',
        'Entree pour envoyer · Maj+Entree pour nouvelle ligne', 'SCR0000000060');
  seed3('S60.PLH.ASK', 'Ask a supply chain question...',
        'Ask a supply chain question...',
        'Posez une question supply chain...', 'SCR0000000060');

  -- S61 Data health
  seed3('S61.BTN.RUN', 'Run all', 'Run all', 'Tout executer', 'SCR0000000061');
  seed3('S61.BTN.CFG', 'Configure checks', 'Configure checks', 'Configurer les controles', 'SCR0000000061');
  seed3('S61.SUM.TOT', 'Checks configured', 'Checks configured', 'Controles configures', 'SCR0000000061');
  seed3('S61.SUM.OK', 'Passing', 'Passing', 'Conformes', 'SCR0000000061');
  seed3('S61.SUM.ISS', 'With issues', 'With issues', 'Avec anomalies', 'SCR0000000061');
  seed3('S61.SUM.CRI', 'Critical', 'Critical', 'Critiques', 'SCR0000000061');
  seed3('S61.LASTRUN', 'Last run:', 'Last run:', 'Derniere execution :', 'SCR0000000061');
  seed3('S61.CRIT', 'critical issue(s) require attention:',
        'critical issue(s) require attention:',
        'anomalie(s) critique(s) a traiter :', 'SCR0000000061');
  seed3('S61.SELRET', 'Select a retailer to view data health checks.',
        'Select a retailer to view data health checks.',
        'Selectionnez un detaillant pour voir les controles sante donnees.', 'SCR0000000061');
  seed3('S61.LOAD', 'Loading checks...', 'Loading checks...', 'Chargement des controles...', 'SCR0000000061');
  seed3('S61.TIER.ALL', 'All tiers', 'All tiers', 'Tous les niveaux', 'SCR0000000061');
  seed3('S61.TIER.RT', 'Real-time (5 min)', 'Real-time (5 min)', 'Temps reel (5 min)', 'SCR0000000061');
  seed3('S61.TIER.HR', 'Hourly', 'Hourly', 'Horaire', 'SCR0000000061');
  seed3('S61.TIER.NT', 'Nightly', 'Nightly', 'Nocturne', 'SCR0000000061');
  seed3('S61.INVEST', 'Investigate', 'Investigate', 'Examiner', 'SCR0000000061');

  -- S62 Data health config
  seed3('S62.BACK', 'Back to dashboard', 'Back to dashboard', 'Retour tableau de bord', 'SCR0000000062');
  seed3('S62.ADD', 'Add check', 'Add check', 'Ajouter un controle', 'SCR0000000062');
  seed3('S62.COL.NAME', 'Check name', 'Check name', 'Nom du controle', 'SCR0000000062');
  seed3('S62.COL.CODE', 'Code', 'Code', 'Code', 'SCR0000000062');
  seed3('S62.COL.TIER', 'Tier', 'Tier', 'Niveau', 'SCR0000000062');
  seed3('S62.COL.SEV', 'Severity', 'Severity', 'Severite', 'SCR0000000062');
  seed3('S62.COL.SKILL', 'Skill', 'Skill', 'Skill', 'SCR0000000062');
  seed3('S62.COL.RES', 'Resolution', 'Resolution', 'Resolution', 'SCR0000000062');
  seed3('S62.COL.EN', 'Enabled', 'Enabled', 'Actif', 'SCR0000000062');
  seed3('S62.EMP', 'No checks configured. Click Add check to get started.',
        'No checks configured. Click Add check to get started.',
        'Aucun controle configure. Cliquez Ajouter un controle pour commencer.', 'SCR0000000062');
  seed3('S62.SELRET', 'Select a retailer to manage its data health checks.',
        'Select a retailer to manage its data health checks.',
        'Selectionnez un detaillant pour gerer ses controles sante donnees.', 'SCR0000000062');
  seed3('S62.VERIFY', 'Verify', 'Verify', 'Verifier', 'SCR0000000062');
  seed3('S62.DUP', 'Duplicate', 'Duplicate', 'Dupliquer', 'SCR0000000062');

END;
/

COMMIT;

SET DEFINE ON;
