-- Delete template skill from Skill Library (S20) — cascades bundle + diagnostic rows.
-- Blocks PUBLISHED skills (deprecate first).
--
-- POST body: { values: [{ SKILL_ID: '...' }] }
-- Angular: AiSkillService.deleteSkill() → AI0000065

SET DEFINE OFF;

DELETE FROM LIBQUERY WHERE QUERYNUM = 'AI0000065';

INSERT INTO LIBQUERY (
  QUERYID, QUERYNUM, QUERYTITLE, QUERYDESC, QUERYSQL,
  QUERYPARAM, QUERYRESULT, QUERYACCESS, QUERYTYPE, QUERYUPDATE
)
SELECT (SELECT NVL(MAX(QUERYID), 0) + 1 FROM LIBQUERY),
       'AI0000065',
       'AI — DELETE template skill',
       'S20 POST: :param1=REQUESTID. JSON values[]: SKILL_ID. Removes bundle rows then AI_SKILL. PUBLISHED skills rejected — deprecate first.',
       q'~
DECLARE
  v_sid VARCHAR2(36);
  v_st  VARCHAR2(20);
BEGIN
  SELECT TRIM(j.skill_id)
    INTO v_sid
    FROM json_table(
           (SELECT r.requestbody
              FROM request_query_body r
             WHERE r.requestid = TO_NUMBER(TRIM(:param1))),
           '$.values[*]'
           COLUMNS (
             skill_id VARCHAR2(36) PATH '$."SKILL_ID"'
           )
         ) j
   WHERE ROWNUM = 1;

  IF v_sid IS NULL OR LENGTH(v_sid) = 0 THEN
    RAISE_APPLICATION_ERROR(-20001, 'SKILL_ID is required.');
  END IF;

  BEGIN
    SELECT s.status
      INTO v_st
      FROM ai_skill s
     WHERE s.skill_id = v_sid;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      RAISE_APPLICATION_ERROR(-20002, 'Skill not found.');
  END;

  IF v_st = 'PUBLISHED' THEN
    RAISE_APPLICATION_ERROR(-20003, 'Published skills cannot be deleted. Deprecate first.');
  END IF;

  DELETE FROM ai_diagnostic_step      WHERE skill_id = v_sid;
  DELETE FROM ai_skill_knowledge_item WHERE skill_id = v_sid;
  DELETE FROM ai_skill_playbook_step  WHERE skill_id = v_sid;
  DELETE FROM ai_skill_sql_template   WHERE skill_id = v_sid;
  DELETE FROM ai_skill_vocabulary     WHERE skill_id = v_sid;
  DELETE FROM ai_skill_test_case      WHERE skill_id = v_sid;
  DELETE FROM ai_skill_version        WHERE skill_id = v_sid;
  DELETE FROM ai_skill_retailer       WHERE skill_id = v_sid;

  UPDATE ai_skill SET superseded_by = NULL WHERE superseded_by = v_sid;
  UPDATE ai_skill SET parent_skill_id = NULL WHERE parent_skill_id = v_sid;

  DELETE FROM ai_skill WHERE skill_id = v_sid;
END;
~',
       ':param1=REQUESTID',
       '',
       1,
       0,
       1
  FROM dual;

COMMIT;

SET DEFINE ON;
