-- =============================================================================
-- Supply Chain AI — Engine LIBQUERY entries (AI0000061–AI0000064)
-- =============================================================================
-- Purpose:
--   Router/execution orchestration reads for AI auto-learning engine.
--   Vendor resolution SQL lives in AI_SKILL_SQL_TEMPLATE (e.g. ENGINE_VENDOR_RESOLVE).
--   These are consumed by /api/ai/engine/route and /api/ai/engine/execute.
-- =============================================================================

DELETE FROM LIBQUERY WHERE QUERYNUM IN ('AI0000061','AI0000062','AI0000063','AI0000064','AI0000065');

INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000061',
       'AI Engine — active skills',
       'GET active/template skills for router. PARAM :param1 retailer_id or -1.',
       q'~
SELECT s.skill_id,
       s.retailer_id,
       s.skill_code,
       s.skill_name,
       s.domain,
       s.description,
       s.status,
       s.version
  FROM AI_SKILL s
 WHERE s.status IN ('DRAFT','ACTIVE')
   AND ( :param1 = '-1'
      OR s.retailer_id IN ('TEMPLATE', :param1) )
 ORDER BY s.domain, s.skill_code
~',
       '',
       '',
       1, 0, 0
  FROM dual;

INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000062',
       'AI Engine — skill vocabulary',
       'GET vocabulary for skill. PARAM :param1 skill_id or -1.',
       q'~
SELECT v.vocab_id,
       v.skill_id,
       v.term,
       v.canonical_concept,
       v.term_type,
       v.language_code,
       v.confidence_boost
  FROM AI_SKILL_VOCABULARY v
 WHERE :param1 = '-1'
    OR v.skill_id = :param1
 ORDER BY v.skill_id, v.term
~',
       '',
       '',
       1, 0, 0
  FROM dual;

INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000063',
       'AI Engine — playbook steps',
       'GET playbook steps for skill. PARAM :param1 skill_id or -1.',
       q'~
SELECT p.step_id,
       p.skill_id,
       p.complaint_type,
       p.step_order,
       p.step_code,
       p.step_label,
       p.hypothesis_tested,
       p.evidence_fact_type,
       p.is_mandatory
  FROM AI_SKILL_PLAYBOOK_STEP p
 WHERE :param1 = '-1'
    OR p.skill_id = :param1
 ORDER BY p.skill_id, p.complaint_type, p.step_order
~',
       '',
       '',
       1, 0, 0
  FROM dual;

INSERT INTO LIBQUERY (
    QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL, QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000064',
       'AI Engine — SQL templates by skill',
       'GET SQL templates (including SQL text CLOB) for skill. PARAM :param1 skill_id.',
       q'~
SELECT t.template_id,
       t.skill_id,
       t.template_code,
       t.template_label,
       t.purpose,
       t.sql_text,
       t.parameters_json
  FROM AI_SKILL_SQL_TEMPLATE t
 WHERE t.skill_id = :param1
 ORDER BY t.template_code
~',
       '',
       '',
       1, 0, 0
  FROM dual;

COMMIT;
