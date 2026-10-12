const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('Published source contains no credential values, private computer paths or contact emails',()=>{
  const site=path.join(__dirname,'../site');
  for(const name of fs.readdirSync(site).filter(n=>/\.(?:html|js|css|json)$/.test(n))){
    const text=fs.readFileSync(path.join(site,name),'utf8');
    assert.doesNotMatch(text,/(?:sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/,name);
    assert.doesNotMatch(text,/(?<![a-z0-9])[a-z]:[\\/](?:Users|Unity|Windows|Program Files)[\\/]|\/Users\/|AppData[\\/]/i,name);
    assert.doesNotMatch(text,/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,name);
  }
  assert.doesNotMatch(fs.readFileSync(path.join(site,'styles.css'),'utf8'),/@import.*https?:/);
});
