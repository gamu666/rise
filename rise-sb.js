// THE RISE · shared Supabase client for the staff sign-in page and the work app.
// The publishable key is meant to be public: every table is protected by Row Level Security (supabase/schema.sql).
(() => {
  const URL = 'https://lwgxvtkhetkelmihaynt.supabase.co';
  const KEY = 'sb_publishable_S6UNtZDweK06zFymdMexYQ_s59ljSXH';
  const DOMAIN = 'therise.invalid';            // logins are stored as <login>@therise.invalid; no e-mail is ever sent
  if (!window.supabase?.createClient) { console.error('supabase-js failed to load'); return; }
  const sb = window.supabase.createClient(URL, KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'rise-auth' }
  });

  const LEVEL_ROLE = { general_director: 4, branch_director: 3, senior_manager: 2, manager: 1, teacher: 0 };
  const ROLE_LABEL = { general_director: 'Ерөнхий захирал', branch_director: 'Салбарын захирал', senior_manager: 'Ахлах менежер', manager: 'Менежер', teacher: 'Багш' };

  const normLogin = v => String(v || '').trim().toLowerCase().replace(/\s+/g, '');
  const toEmail = login => normLogin(login).includes('@') ? normLogin(login) : normLogin(login) + '@' + DOMAIN;

  function message(error) {
    const m = String(error?.message || error || '');
    if (/invalid login credentials/i.test(m)) return 'Нэвтрэх нэр эсвэл нууц үг буруу байна.';
    if (/network|fetch/i.test(m)) return 'Сүлжээний алдаа. Интернэт холболтоо шалгана уу.';
    if (/should be at least|weak/i.test(m)) return 'Нууц үг хэт сул байна. 8-аас дээш тэмдэгт, үсэг ба тоо холино уу.';
    if (/same.*password|different from the old/i.test(m)) return 'Шинэ нууц үг хуучнаасаа өөр байх ёстой.';
    if (/rate limit|too many/i.test(m)) return 'Хэт олон оролдлого. Түр хүлээгээд дахин оролдоно уу.';
    return m || 'Алдаа гарлаа. Дахин оролдоно уу.';
  }

  async function profile() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return null;
    const { data, error } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    if (error) throw error;
    return data && data.active ? data : null;
  }

  async function signIn(login, password) {
    const { error } = await sb.auth.signInWithPassword({ email: toEmail(login), password });
    if (error) throw new Error(message(error));
    const p = await profile();
    if (!p) { await sb.auth.signOut(); throw new Error('Энэ данс идэвхгүй байна. Ерөнхий захиралд хандана уу.'); }
    return p;
  }

  function checkStrength(pw) {
    if (pw.length < 8) return 'Нууц үг дор хаяж 8 тэмдэгт байна.';
    if (!/[A-Za-zА-Яа-яӨөҮүЁё]/.test(pw) || !/\d/.test(pw)) return 'Нууц үгт үсэг болон тоо хоёулаа орно.';
    return '';
  }

  // Changes the password of the signed-in person. With `current`, the old password is checked first.
  async function changePassword(next, current) {
    const weak = checkStrength(next);
    if (weak) throw new Error(weak);
    const { data: { session } } = await sb.auth.getSession();
    if (!session) throw new Error('Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.');
    if (current !== undefined) {
      const { error } = await sb.auth.signInWithPassword({ email: session.user.email, password: current });
      if (error) throw new Error(/invalid/i.test(error.message) ? 'Одоогийн нууц үг буруу байна.' : message(error));
    }
    const { error } = await sb.auth.updateUser({ password: next });
    if (error) throw new Error(message(error));
    await sb.rpc('password_changed');
  }

  async function signOut() {
    try { await sb.auth.signOut(); } catch { /* offline: local session is cleared anyway */ }
    try { localStorage.removeItem('rise-auth'); } catch {}
  }

  window.RISE = { sb, URL, LEVEL_ROLE, ROLE_LABEL, toEmail, normLogin, message, profile, signIn, changePassword, checkStrength, signOut };
})();
