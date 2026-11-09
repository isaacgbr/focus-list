import assert from "node:assert/strict";
export function mockAvatarStorage(t) {
  const names = ["SUPABASE_URL", "SUPABASE_SECRET_KEY", "SUPABASE_STORAGE_BUCKET"];
  const original = names.map(key => process.env[key]);
  Object.assign(process.env, {SUPABASE_URL:"https://storage.focuslist.invalid", SUPABASE_SECRET_KEY:"sb_secret_test_only", SUPABASE_STORAGE_BUCKET:"avatars"});
  t.after(()=>names.forEach((key,i)=>{if(original[i]===undefined)delete process.env[key];else process.env[key]=original[i]}));
  const state = {objects:new Map(), calls:[], failure:null};
  const realFetch = globalThis.fetch;
  t.mock.method(globalThis,"fetch",async(input,init={})=>{
    const url = new URL(typeof input === 'string' ? input : input.url ?? input.href);
    if(['127.0.0.1','localhost'].includes(url.hostname))return realFetch(input,init);
    assert.equal(url.origin,'https://storage.focuslist.invalid');
    assert.equal(init.headers.apikey,'sb_secret_test_only');assert.equal(init.redirect,'error');
    state.calls.push({method:init.method,path:url.pathname});
    if(state.failure?.method===init.method)return new Response('provider-secret-must-not-leak',{status:state.failure.status});
    const key=url.pathname.split('/').at(-1);
    if(init.method==='POST'){assert.equal(init.headers['x-upsert'],'false');assert.equal(init.headers['Content-Type'],'image/jpeg');state.objects.set(key,Buffer.from(init.body));return new Response('{}');}
    if(init.method==='DELETE'){state.objects.delete(key);return new Response('{}');}
    assert.ok(url.pathname.startsWith('/storage/v1/object/authenticated/avatars/'));
    return state.objects.has(key)?new Response(state.objects.get(key)):new Response(JSON.stringify({statusCode:'404'}),{status:400});
  });
  return state;
}
