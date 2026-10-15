/* ============================================================
   UI
   ============================================================ */
const isBrowser = typeof document !== 'undefined';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const TABS = [['map','Campaign map'],['forces','Forces'],['armory','Armory'],['library','Unit library'],['missions','Missions'],['quick','Quick battle'],['events','Events'],['story','Story'],['journal','Journal'],['mods','Mods'],['rules','Rules data'],['setup','Campaigns']];
