SELECT P.name, C1.score 50BMG, C2.score 9MMTG, (C1.score + C2.score) Total
FROM DRperson P
left join (
	SELECT shooter_fid, MAX(score) score
	FROM DRsession S inner join DRsessionScore on (S.id = session_fid)
	WHERE type_fid = '50BMG'
	GROUP BY shooter_fid) C1 on C1.shooter_fid = P.id
left join (
	SELECT shooter_fid, MAX(score) score
	FROM DRsession S inner join DRsessionScore on (S.id = session_fid)
	WHERE type_fid = '9MMTG'
	GROUP BY shooter_fid) C2 on C2.shooter_fid = P.id;


SELECT P.lastname, P.firstname, C1.score 50BMG, C2.score 9MMTG, (C1.score + C2.score) Total
FROM MCSShooter P
left join (
	SELECT shooter_fid, MAX(score) score
	FROM MCSShootingSession S inner join MCSShootingSessionScores on (S.id = session_fiq)
	WHERE session_type_fiq = 'AirPist'
	GROUP BY shooter_fid) C1 on C1.shooter_fid = P.id
left join (
	SELECT shooter_fid, MAX(score) score
	FROM MCSShootingSession S inner join MCSShootingSessionScores on (S.id = session_fiq)
	WHERE session_type_fiq = 'AirSoft'
	GROUP BY shooter_fid) C2 on C2.shooter_fid = P.id



SELECT shooter_fid, session_type_fiq, MAX(score) bestScore
FROM
(
SELECT shooter_fid, session_type_fiq, SUM(score) score
FROM MCSShootingSession S inner join MCSShootingSessionScores on (S.id = session_fiq)
GROUP BY S.id
) Z
GROUP BY shooter_fid, session_type_fiq;


-- This technique does not work because MySQL cannot refer to a temporary table more than once (BUG)
-- MariaDB can (but not on OVH)

CREATE TEMPORARY TABLE IF NOT EXISTS Scores
    SELECT shooter_fid, session_type_fiq, MAX(score) bestScore
	FROM (
		SELECT shooter_fid, session_type_fiq, SUM(score) score
		FROM MCSShootingSession S inner join MCSShootingSessionScores on (S.id = session_fiq)
		GROUP BY S.id) Z
	GROUP BY shooter_fid, session_type_fiq;

-- This one works around the MySQL bug using a WITH clause.
-- Unfortunately, it's available on MySQL, but not on version 5.7 from OVH (very outdated)

WITH Scores AS (
    SELECT shooter_fid, session_type_fiq, MAX(score) bestScore
	FROM (
		SELECT shooter_fid, session_type_fiq, SUM(score) score
		FROM MCSShootingSession S inner join MCSShootingSessionScores on (S.id = session_fiq)
		GROUP BY S.id) Z
	GROUP BY shooter_fid, session_type_fiq)
SELECT P.lastname, P.firstname, C1.bestScore AirPist, C2.bestScore AirSoft
FROM
	MCSShooter P
	inner join Scores C1 on (P.id = C1.shooter_fid and C1.session_type_fiq = 'AirPist')
    inner join Scores C2 on (P.id = C2.shooter_fid and C1.session_type_fiq = 'AirSoft')
;



-- POSTGRES
CREATE TABLE person (
  name text not null,
  parent text,
  primary key (name)
);

INSERT INTO person VALUES ('Big Boss', null);
INSERT INTO person VALUES ('General', 'Big Boss');
INSERT INTO person VALUES ('Musashi', 'Big Boss');
INSERT INTO person VALUES ('Lieutnant', 'General');
INSERT INTO person VALUES ('Colonel', 'General');
INSERT INTO person VALUES ('Capo', 'Colonel');
INSERT INTO person VALUES ('Jubei', 'Musashi');
INSERT INTO person VALUES ('Hanzo', 'Musashi');

with recursive chain as (
  select name, name as chain, 1::int as level
  from person
  where parent is null
  union all
  select
    person.name,
    chain || '->' || person.name,
    level + 1
  from person join chain on person.parent=chain.name
)
select level, name, chain from chain order by chain;
