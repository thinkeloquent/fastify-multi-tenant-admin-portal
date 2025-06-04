// PERM model string for Casbin
export const modelText = `
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && (keyMatch(r.obj, p.obj) || keyMatch2(r.obj, p.obj)) && (r.act == p.act || p.act == "*")
`;

// Default policies that will be loaded
export const defaultPolicies = [
  // Role inheritance policies
  ['g', 'admin', 'user'],
  ['g', 'user', 'guest'],
  
  // Resource access policies for admin
  ['p', 'admin', '/admin/*', '*'],
  ['p', 'admin', '/dashboard/*', '*'],
  ['p', 'admin', '/users/*', '*'],
  ['p', 'admin', '/policies/*', '*'],
  
  // Resource access policies for user
  ['p', 'user', '/dashboard', 'read'],
  ['p', 'user', '/profile/:id', '*'],
  ['p', 'user', '/users', 'read'],
  
  // Resource access policies for guest
  ['p', 'guest', '/dashboard', 'read'],
  ['p', 'guest', '/login', '*'],
  ['p', 'guest', '/register', '*']
];