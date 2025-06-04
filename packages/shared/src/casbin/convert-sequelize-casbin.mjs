export const policiesToText = (data) => {
  const text = [
    `\n[request_definition]`,
    `r = ${data.request_definition}`,
    `\n[policy_definition]`,
    `p = ${data.policy_definition}`,
    `\n[role_definition]`,
    `g = ${data.role_definition}`,
    `\n[policy_effect]`,
    `e = ${data.policy_effect}`,
    `\n[matchers]`,
    `m = ${data.matchers}`,
  ].join("\n");
  return text;
};

export const rulesToText = (data) => {
  const text = data
    .map(
      ({
        permission_type,
        rule_v0,
        rule_v1,
        rule_v2,
        rule_v3,
        rule_v4,
        rule_v5,
        rule_v6,
        rule_v7,
      }) => {
        return [
          permission_type,
          rule_v0,
          rule_v1,
          rule_v2,
          rule_v3,
          rule_v4,
          rule_v5,
          rule_v6,
          rule_v7,
        ]
          .filter((v) => v)
          .join(", ");
      }
    )
    .join("\n");
  return text;
};
