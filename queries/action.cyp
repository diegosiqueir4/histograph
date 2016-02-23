// name: create_action
// (u:user)-1-[:performs]-1->(a:action:upvote {target:relationship|entity})-[:mentions]->(t)
// (u:user)-1-[:performs]-1->(a:action:downvote {target:relationship|entity})-[:mentions]->(t)
// (u:user)-1-[:performs]-1->(a:action:create {target:relationship})-[:mentions]->(t)
// use only to upvote or coreate. See merge_action for type:ISSUED
MATCH (u:user {username:{username}})
WITH u
  CREATE (u)-[r:performs]->(a:action{if:kind}:{:kind}{/if})
    SET
      a.target = {target},
      {if:annotation}
        a.annotation = {annotation},
      {/if}
      {if:solution}
        a.solution = {solution},
      {/if}
      {if:focus}
        a.focus = {focus},
      {/if}
      a.creation_date  = {exec_date},
      a.creation_time  = {exec_time},
      a.last_modification_date = {exec_date},
      a.last_modification_time = {exec_time},
      r.creation_date  = {exec_date},
      r.creation_time  = {exec_time},
      r.last_modification_date = {exec_date},
      r.last_modification_time = {exec_time}
  WITH u,a
  MATCH (t) 
    WHERE id(t) in {mentions}
  CREATE (a)-[r2:mentions]->(t)
    SET
      r2.creation_date  = {exec_date},
      r2.creation_time  = {exec_time},
      r2.last_modification_date = {exec_date},
      r2.last_modification_time = {exec_time}
  WITH DISTINCT a, filter(x in collect({
    id: id(t),
    props: t,
    type: last(labels(t))
  }) WHERE has(x.id)) AS alias_ms,{
    id: id(u),
    username: u.username,
    picture: u.picture
  } as alias_u

return {
  id: id(a),
  props: a,
  type: last(labels(a)),
  performed_by: alias_u,
  mentioning: alias_ms
}

// name: merge_action
// EXPLICIT MERGE action FOR issue VOTING PURPOSES ONLY. You should provide a focus
MATCH (u:user {username:{username}})
WITH u
MERGE (a:action{if:kind}:{:kind}{/if} {target:{target}, focus:{focus}})
  ON CREATE SET
    a.creation_date  = {exec_date},
    a.creation_time  = {exec_time}
WITH u,a, {
    id: id(u),
    username: u.username,
    picture: u.picture
  } as alias_u
{if:downvoted_by}
MERGE (u)-[r:criticizes]->(a)
{/if}
{unless:downvoted_by}
MERGE (u)-[r:performs]->(a)
{/unless}
ON CREATE SET
  r.creation_date  = {exec_date},
  r.creation_time  = {exec_time},
  r.last_modification_date = {exec_date},
  r.last_modification_time = {exec_time},
  a.last_modification_date  = {exec_date},
  a.last_modification_time  = {exec_time}
ON MATCH SET
  r.last_modification_date = {exec_date},
  r.last_modification_time = {exec_time},
  a.last_modification_date  = {exec_date},
  a.last_modification_time  = {exec_time}

WITH a, alias_u, r
MATCH (t) 
  WHERE id(t) in {mentions}
  MERGE (a)-[r2:mentions]->(t)
    ON CREATE SET
      r2.creation_date  = {exec_date},
      r2.creation_time  = {exec_time},
      r2.last_modification_date = {exec_date},
      r2.last_modification_time = {exec_time}
    ON MATCH SET
      r2.last_modification_date = {exec_date},
      r2.last_modification_time = {exec_time}
WITH a, alias_u, r
return {
  id: id(a),
  props: a,
  type: last(labels(a)),
  performed_by: alias_u,
  rel: type(r)
}
LIMIT 1


// name: get_actions
// get actions getMany()
MATCH (act:action{if:kind}:{:kind}{/if})

WITH act
ORDER BY act.last_modification_time DESC
SKIP {offset}
LIMIT {limit}

WITH act
MATCH (u:user)-[r:performs]->act

WITH act, r, {
    id: id(u),
    username: u.username,
    picture: u.picture
  } as alias_u

RETURN {
  id: id(act),
  type: last(labels(act)),
  props: act,
  performed_by: alias_u
}


// name: count_actions
// get actions getMay();
MATCH (act:action)
WITH last(labels(act)) as group, count(DISTINCT act) as count_items
RETURN {
  group: group,
  count_items: count_items
} AS result


// name: remove_action
//BEware: remove the action as it never existed.
MATCH (act:action)
WHERE id(act) = {id}
OPTIONAL MATCH (act)-[r]-()
DELETE act, r