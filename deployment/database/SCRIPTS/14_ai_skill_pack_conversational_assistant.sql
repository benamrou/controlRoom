-- =============================================================================
-- Supply Chain AI — Loadable skill pack: Conversational assistant
-- =============================================================================
-- Prerequisite: deployment/database/SCRIPTS/08_skill_engine.sql (tables).
-- Purpose: model small-talk / general conversation as a first-class AI skill
-- (same architecture as DSD / ITEM), no UI hardcoded if/else behavior.
-- Safe to re-run: deletes bundle rows for this skill_id first.
-- =============================================================================

DELETE FROM AI_SKILL_TEST_CASE      WHERE skill_id = 'A1B2C3D4-E5F6-7890-ABCD-1234567890AA';
DELETE FROM AI_SKILL_VOCABULARY     WHERE skill_id = 'A1B2C3D4-E5F6-7890-ABCD-1234567890AA';
DELETE FROM AI_SKILL_SQL_TEMPLATE   WHERE skill_id = 'A1B2C3D4-E5F6-7890-ABCD-1234567890AA';
DELETE FROM AI_SKILL_PLAYBOOK_STEP  WHERE skill_id = 'A1B2C3D4-E5F6-7890-ABCD-1234567890AA';
DELETE FROM AI_SKILL_KNOWLEDGE_ITEM WHERE skill_id = 'A1B2C3D4-E5F6-7890-ABCD-1234567890AA';
DELETE FROM AI_SKILL_VERSION        WHERE skill_id = 'A1B2C3D4-E5F6-7890-ABCD-1234567890AA';
DELETE FROM AI_SKILL_RETAILER       WHERE skill_id = 'A1B2C3D4-E5F6-7890-ABCD-1234567890AA';
DELETE FROM AI_SKILL                WHERE skill_id = 'A1B2C3D4-E5F6-7890-ABCD-1234567890AA';

INSERT INTO AI_SKILL (
    skill_id, retailer_id, skill_code, skill_name, domain,
    description, version, status, created_by, created_at, updated_at
) VALUES (
    'A1B2C3D4-E5F6-7890-ABCD-1234567890AA',
    'TEMPLATE',
    'CONVERSATIONAL_ASSISTANT',
    'Conversational assistant',
    'CONVERSATION',
    'General discussion skill (greetings, day/date/time, thanks, capabilities) executed through skill SQL templates.',
    1.0,
    'DRAFT',
    'SYSTEM',
    SYSTIMESTAMP,
    SYSTIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Knowledge items
-- ---------------------------------------------------------------------------
INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'A1B2C3D4-E5F6-7890-ABCD-1234567890AA', NULL, 'EXTEND', 'CONV_SMALLTALK',
    'Small-talk and courtesy',
    'Handles polite conversational turns without operational SQL investigation.',
    'When the user asks conversational questions (greeting, how are you, thanks), what short answer should the assistant return?',
    q'~[{"round":2,"question":"Keep tone concise and professional; avoid pretending human feelings."}]~',
    NULL,
    1, 1
);

INSERT INTO AI_SKILL_KNOWLEDGE_ITEM (
    skill_id, base_knowledge_key, override_mode, knowledge_key, label, description,
    anchor_question, rounds_json, validation_sql, priority, is_mandatory
) VALUES (
    'A1B2C3D4-E5F6-7890-ABCD-1234567890AA', NULL, 'EXTEND', 'CONV_DATE_TIME',
    'Date and time answers',
    'Returns current day/date/time from Oracle for natural questions.',
    'If the user asks for day/date/time, which Oracle expressions should be used and what text format should we return?',
    q'~[{"round":2,"question":"Prefer current database timezone context (SYSDATE)."}]~',
    NULL,
    1, 1
);

-- ---------------------------------------------------------------------------
-- Playbook steps
-- ---------------------------------------------------------------------------
INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'A1B2C3D4-E5F6-7890-ABCD-1234567890AA', 'GENERAL', 10, 'CONV_PB_CLASSIFY',
    'Classify conversation intent',
    'Question is conversational and should not trigger operational retrieval flow',
    'ICR', 'DUAL', 'QUESTION_TEXT', 'INTENT_CLASSIFICATION', 1, 'APPEND', NULL
);

INSERT INTO AI_SKILL_PLAYBOOK_STEP (
    skill_id, complaint_type, step_order, step_code, step_label, hypothesis_tested,
    gold_schema, gold_table, key_columns, evidence_fact_type, is_mandatory,
    insert_position, insert_after_step
) VALUES (
    'A1B2C3D4-E5F6-7890-ABCD-1234567890AA', 'GENERAL', 20, 'CONV_PB_REPLY',
    'Generate short response',
    'Template can produce a direct answer row with ANSWER_TEXT',
    'ICR', 'DUAL', 'ANSWER_TEXT', 'ASSISTANT_RESPONSE', 1, 'APPEND', NULL
);

-- ---------------------------------------------------------------------------
-- SQL templates
-- ---------------------------------------------------------------------------
INSERT INTO AI_SKILL_SQL_TEMPLATE (
    skill_id, template_code, template_label, purpose, sql_text, parameters_json, tables_referenced
) VALUES (
    'A1B2C3D4-E5F6-7890-ABCD-1234567890AA',
    'CONV_SMALLTALK_RESPONSE',
    'Small-talk and generic conversation response',
    'Generates direct conversational answer from question_text; no GOLD query required.',
    q'~SELECT CASE
           WHEN REGEXP_LIKE(LOWER(:question_text), '(what day is it|which day is it|day today|today day)') THEN
                'Today is ' || TO_CHAR(SYSDATE, 'FMDay')
           WHEN REGEXP_LIKE(LOWER(:question_text), '(what date is it|today''s date|date today|what is the date)') THEN
                'Today is ' || TO_CHAR(SYSDATE, 'FMDay, DD Mon YYYY')
           WHEN REGEXP_LIKE(LOWER(:question_text), '(what time is it|time now|current time)') THEN
                'It is currently ' || TO_CHAR(SYSDATE, 'HH24') || 'h' || TO_CHAR(SYSDATE, 'MI')
           WHEN REGEXP_LIKE(LOWER(:question_text), '(how are you|how are you doing|how are you doing today|how do you do)') THEN
                'I am doing well, thank you. Ready to help with your next question.'
           WHEN REGEXP_LIKE(LOWER(:question_text), '(hello|hi|hey|good morning|good afternoon|good evening)') THEN
                'Hello. How can I help you today?'
           WHEN REGEXP_LIKE(LOWER(:question_text), '(thank you|thanks|thx)') THEN
                'You are welcome.'
           WHEN REGEXP_LIKE(LOWER(:question_text), '(bye|goodbye|see you|talk to you later)') THEN
                'Goodbye. I am here whenever you need me.'
           WHEN REGEXP_LIKE(LOWER(:question_text), '(what can you do|help me|capabilities|what do you do)') THEN
                'I can discuss with you and also run operational investigation skills using templates.'
           ELSE
                'I can help with conversational questions and supply-chain investigations. Please tell me what you need.'
       END AS answer_text,
       1 AS answer_rank
  FROM dual~',
    q'~[{"name":"question_text","type":"STRING","required":true}]~',
    'DUAL'
);

-- ---------------------------------------------------------------------------
-- Vocabulary
-- ---------------------------------------------------------------------------
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('A1B2C3D4-E5F6-7890-ABCD-1234567890AA', 'how are you', 'CONVERSATION', 'PROCESS_TERM', 'EN', 1.5);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('A1B2C3D4-E5F6-7890-ABCD-1234567890AA', 'what day is it', 'DATE_TIME', 'PROCESS_TERM', 'EN', 1.6);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('A1B2C3D4-E5F6-7890-ABCD-1234567890AA', 'today date', 'DATE_TIME', 'SYNONYM', 'EN', 1.3);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('A1B2C3D4-E5F6-7890-ABCD-1234567890AA', 'what time is it', 'DATE_TIME', 'PROCESS_TERM', 'EN', 1.6);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('A1B2C3D4-E5F6-7890-ABCD-1234567890AA', 'hello', 'GREETING', 'SYNONYM', 'EN', 1.1);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('A1B2C3D4-E5F6-7890-ABCD-1234567890AA', 'thank you', 'COURTESY', 'SYNONYM', 'EN', 1.1);
INSERT INTO AI_SKILL_VOCABULARY (skill_id, term, canonical_concept, term_type, language_code, confidence_boost)
VALUES ('A1B2C3D4-E5F6-7890-ABCD-1234567890AA', 'what can you do', 'CAPABILITY', 'PROCESS_TERM', 'EN', 1.2);

-- ---------------------------------------------------------------------------
-- Test cases
-- ---------------------------------------------------------------------------
INSERT INTO AI_SKILL_TEST_CASE (
    skill_id, test_name, complaint_text, complaint_type,
    expected_root_cause, expected_confidence, expected_steps_min
) VALUES (
    'A1B2C3D4-E5F6-7890-ABCD-1234567890AA',
    'Smalltalk how-are-you',
    'how are you doing today?',
    'GENERAL',
    'CONVERSATION',
    'PROBABLE',
    1
);

INSERT INTO AI_SKILL_TEST_CASE (
    skill_id, test_name, complaint_text, complaint_type,
    expected_root_cause, expected_confidence, expected_steps_min
) VALUES (
    'A1B2C3D4-E5F6-7890-ABCD-1234567890AA',
    'Date question day',
    'what day is it today?',
    'GENERAL',
    'DATE_TIME',
    'PROBABLE',
    1
);

COMMIT;
