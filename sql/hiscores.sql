-- Stupid multi-create temporary table because there's no CTE on MySQL 5.7
create temporary table bite
SELECT
	U.id userId,
	U.firstname,
	U.lastname,
	U.nickname,
	U.gender,
	U.Age,
	U.StaffMember,
	U.junior,
	SESS.session_type_fiq,
	MAX( CASE IFNULL(SESS.time, 0) WHEN 0 THEN 0 ELSE (SESS.score / SESS.time) END ) bestScore
FROM
	MCSShooter U
	INNER JOIN
	(
		SELECT
            S.id,
            S.date,
            S.shooter_fid,
            S.session_type_fiq,
            S.time,
            SUM(COALESCE(X.score, 0)) score
        FROM
            MCSShootingSession S
            LEFT JOIN MCSShootingSessionScores X ON X.session_fiq = S.id
        GROUP BY
            S.id) as SESS
	ON SESS.shooter_fid = U.id
	GROUP BY
		U.id, SESS.session_type_fiq
ORDER BY SESS.session_type_fiq ASC;

create temporary table couille
SELECT
	U.id userId,
	U.firstname,
	U.lastname,
	U.nickname,
	U.gender,
	U.Age,
	U.StaffMember,
	U.junior,
	SESS.session_type_fiq,
	MAX( CASE IFNULL(SESS.time, 0) WHEN 0 THEN 0 ELSE (SESS.score / SESS.time) END ) bestScore
FROM
	MCSShooter U
	INNER JOIN
	(
		SELECT
            S.id,
            S.date,
            S.shooter_fid,
            S.session_type_fiq,
            S.time,
            SUM(COALESCE(X.score, 0)) score
        FROM
            MCSShootingSession S
            LEFT JOIN MCSShootingSessionScores X ON X.session_fiq = S.id
        GROUP BY
            S.id) as SESS
	ON SESS.shooter_fid = U.id
	GROUP BY
		U.id, SESS.session_type_fiq
ORDER BY SESS.session_type_fiq ASC;

SELECT b.*
FROM bite b
INNER JOIN
    (SELECT session_type_fiq, MAX(bestScore) AS maxScore
    FROM couille
    GROUP BY session_type_fiq) records
ON b.session_type_fiq = records.session_type_fiq
AND b.bestScore = records.maxScore
group by b.session_type_fiq;

-- Does not handle draws
with
sess as (
    select S.*,
    SUM(COALESCE(X.score, 0)) points,
    IF(S.time is null or S.time=0, 0, SUM(COALESCE(X.score, 0))/S.time) score
    FROM
        MCSShootingSession S
        LEFT JOIN MCSShootingSessionScores X ON X.session_fiq = S.id
    GROUP BY S.id),
bsess as (
    select sess.*, MAX(score) maxScore
    from sess
    group by sess.shooter_fid, sess.session_type_fiq
),
rec as (
    select bsess.session_type_fiq, MAX(bsess.maxScore) record
    from bsess
    group by bsess.session_type_fiq
)
select B.session_type_fiq category, U.firstname, U.lastname, B.points, B.time, B.score
from bsess B join rec on B.session_type_fiq = rec.session_type_fiq and B.score = rec.record
join MCSShooter U on U.id = B.shooter_fid
group by B.session_type_fiq;

-- Handle draws and multiple best sessions
with
sess as (
    select S.*,
    SUM(COALESCE(X.score, 0)) points,
    IF(S.time is null or S.time=0, 0, SUM(COALESCE(X.score, 0))/S.time) score
    FROM
        MCSShootingSession S
        LEFT JOIN MCSShootingSessionScores X ON X.session_fiq = S.id
    GROUP BY S.id),
bsess as (
    select sess.*, MAX(score) maxScore
    from sess
    group by shooter_fid, session_type_fiq
),
rec as (
    select session_type_fiq, MAX(maxScore) record
    from bsess
    group by session_type_fiq
)
select session_type_fiq category, group_concat(distinct concat(firstname, ' ', lastname)) heroes, points, time, score
from bsess join MCSShooter U on U.id = bsess.shooter_fid
where (session_type_fiq, maxScore) in (select * from rec)
group by session_type_fiq
order by session_type_fiq;
