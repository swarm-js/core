export type SwarmHook =
  | 'preListen'
  | 'postListen'
  | 'preRegister'
  | 'postRegister'
  | 'preAccess'
  | 'postAccess'
  | 'preHandler'
  | 'postHandler'
  | 'preResponse'
  | 'preShutdown'
